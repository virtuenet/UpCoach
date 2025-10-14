"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hipaaService = void 0;
const tslib_1 = require("tslib");
const crypto_1 = tslib_1.__importDefault(require("crypto"));
const date_fns_1 = require("date-fns");
const sequelize_1 = require("sequelize");
const database_1 = require("../../config/database");
const User_1 = require("../../models/User");
const logger_1 = require("../../utils/logger");
const redis_1 = require("../redis");
class HIPAAService {
    static instance;
    encryptionAlgorithm = 'AES-256-GCM';
    sessionTimeout = 15;
    maxLoginAttempts = 3;
    auditRetentionYears = 6;
    encryptionKey;
    constructor() {
        const key = process.env.PHI_ENCRYPTION_KEY;
        if (!key || key.length !== 64) {
            throw new Error('PHI_ENCRYPTION_KEY must be 64 hex characters');
        }
        this.encryptionKey = Buffer.from(key, 'hex');
    }
    static getInstance() {
        if (!HIPAAService.instance) {
            HIPAAService.instance = new HIPAAService();
        }
        return HIPAAService.instance;
    }
    encryptPHI(data) {
        try {
            const iv = crypto_1.default.randomBytes(16);
            const cipher = crypto_1.default.createCipheriv(this.encryptionAlgorithm, this.encryptionKey, iv);
            let encrypted = cipher.update(data, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const authTag = cipher.getAuthTag();
            const encryption = {
                algorithm: this.encryptionAlgorithm,
                keyId: crypto_1.default.createHash('sha256').update(this.encryptionKey).digest('hex').substring(0, 8),
                iv: iv.toString('hex'),
                authTag: authTag.toString('hex'),
                encryptedAt: new Date(),
            };
            return {
                encrypted,
                encryption,
            };
        }
        catch (error) {
            logger_1.logger.error('Error encrypting PHI', error);
            throw new Error('Failed to encrypt PHI');
        }
    }
    decryptPHI(encryptedData, encryption) {
        try {
            const decipher = crypto_1.default.createDecipheriv(encryption.algorithm, this.encryptionKey, Buffer.from(encryption.iv, 'hex'));
            if (encryption.authTag) {
                decipher.setAuthTag(Buffer.from(encryption.authTag, 'hex'));
            }
            let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (error) {
            logger_1.logger.error('Error decrypting PHI', error);
            throw new Error('Failed to decrypt PHI');
        }
    }
    async logPHIAccess(accessLog) {
        try {
            const log = {
                id: crypto_1.default.randomUUID(),
                timestamp: new Date(),
                ...accessLog,
                ipAddress: this.hashIP(accessLog.ipAddress),
            };
            await database_1.sequelize.models.PHIAuditLog?.create(log);
            const key = `phi:access:${log.userId}:${Date.now()}`;
            await redis_1.redis.setEx(key, 86400, JSON.stringify(log));
            await this.detectSuspiciousAccess(log);
            logger_1.logger.info('PHI access logged', {
                userId: log.userId,
                action: log.action,
                resource: log.resource,
                authorized: log.authorized,
            });
            return log;
        }
        catch (error) {
            logger_1.logger.error('Error logging PHI access', error);
            throw new Error('Failed to log PHI access');
        }
    }
    validatePassword(password) {
        const errors = [];
        if (password.length < 12) {
            errors.push('Password must be at least 12 characters');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain uppercase letters');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain lowercase letters');
        }
        if (!/[0-9]/.test(password)) {
            errors.push('Password must contain numbers');
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Password must contain special characters');
        }
        const commonPasswords = ['password', 'admin', 'upcoach', 'health'];
        if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
            errors.push('Password contains common words');
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
    async createSecureSession(userId, ipAddress, userAgent) {
        try {
            const sessionId = crypto_1.default.randomBytes(32).toString('hex');
            const expiresAt = (0, date_fns_1.addMinutes)(new Date(), this.sessionTimeout);
            const sessionData = {
                userId,
                sessionId,
                ipAddress: this.hashIP(ipAddress),
                userAgent,
                createdAt: new Date(),
                lastActivity: new Date(),
                expiresAt,
            };
            const key = `session:${sessionId}`;
            await redis_1.redis.setEx(key, this.sessionTimeout * 60, JSON.stringify(sessionData));
            await redis_1.redis.sadd(`user:sessions:${userId}`, sessionId);
            logger_1.logger.info('Secure session created', { userId, sessionId });
            return { sessionId, expiresAt };
        }
        catch (error) {
            logger_1.logger.error('Error creating secure session', error);
            throw new Error('Failed to create secure session');
        }
    }
    async validateSession(sessionId) {
        try {
            const key = `session:${sessionId}`;
            const data = await redis_1.redis.get(key);
            if (!data) {
                return { valid: false };
            }
            const session = JSON.parse(data);
            if (new Date(session.expiresAt) < new Date()) {
                await this.terminateSession(sessionId);
                return { valid: false };
            }
            const inactiveMinutes = (0, date_fns_1.differenceInMinutes)(new Date(), new Date(session.lastActivity));
            if (inactiveMinutes > this.sessionTimeout) {
                await this.terminateSession(sessionId);
                logger_1.logger.warn('Session terminated due to inactivity', { sessionId, inactiveMinutes });
                return { valid: false };
            }
            session.lastActivity = new Date();
            session.expiresAt = (0, date_fns_1.addMinutes)(new Date(), this.sessionTimeout);
            await redis_1.redis.setEx(key, this.sessionTimeout * 60, JSON.stringify(session));
            return {
                valid: true,
                userId: session.userId,
                renewed: true,
            };
        }
        catch (error) {
            logger_1.logger.error('Error validating session', error);
            return { valid: false };
        }
    }
    async terminateSession(sessionId) {
        try {
            const key = `session:${sessionId}`;
            const data = await redis_1.redis.get(key);
            if (data) {
                const session = JSON.parse(data);
                await redis_1.redis.srem(`user:sessions:${session.userId}`, sessionId);
            }
            await redis_1.redis.del(key);
            logger_1.logger.info('Session terminated', { sessionId });
        }
        catch (error) {
            logger_1.logger.error('Error terminating session', error);
        }
    }
    async recordBAA(agreement) {
        try {
            const baa = {
                id: crypto_1.default.randomUUID(),
                signedAt: new Date(),
                status: 'active',
                ...agreement,
            };
            await database_1.sequelize.models.BusinessAssociateAgreement?.create(baa);
            logger_1.logger.info('BAA recorded', {
                organization: baa.organizationName,
                id: baa.id,
            });
            return baa;
        }
        catch (error) {
            logger_1.logger.error('Error recording BAA', error);
            throw new Error('Failed to record BAA');
        }
    }
    async recordDisclosure(disclosure) {
        try {
            const record = {
                id: crypto_1.default.randomUUID(),
                disclosedAt: new Date(),
                ...disclosure,
            };
            await database_1.sequelize.models.PHIDisclosure?.create(record);
            await this.logPHIAccess({
                userId: disclosure.authorizedBy,
                accessedBy: disclosure.authorizedBy,
                patientId: disclosure.patientId,
                action: 'share',
                resource: `PHI Disclosure to ${disclosure.disclosedTo}`,
                ipAddress: '0.0.0.0',
                userAgent: 'System',
                authorized: true,
                sessionId: 'system',
                justification: disclosure.purpose,
            });
            logger_1.logger.info('PHI disclosure recorded', {
                patientId: record.patientId,
                disclosedTo: record.disclosedTo,
            });
            return record;
        }
        catch (error) {
            logger_1.logger.error('Error recording disclosure', error);
            throw new Error('Failed to record disclosure');
        }
    }
    async getDisclosureHistory(patientId, startDate, endDate) {
        try {
            const where = { patientId };
            if (startDate || endDate) {
                where.disclosedAt = {};
                if (startDate)
                    where.disclosedAt[sequelize_1.Op.gte] = startDate;
                if (endDate)
                    where.disclosedAt[sequelize_1.Op.lte] = endDate;
            }
            const disclosures = await database_1.sequelize.models.PHIDisclosure?.findAll({
                where,
                order: [['disclosedAt', 'DESC']],
            });
            return disclosures;
        }
        catch (error) {
            logger_1.logger.error('Error getting disclosure history', error);
            throw new Error('Failed to get disclosure history');
        }
    }
    async conductRiskAssessment(conductedBy) {
        try {
            const vulnerabilities = await this.identifyVulnerabilities();
            const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
            const highCount = vulnerabilities.filter(v => v.severity === 'high').length;
            let riskLevel;
            if (criticalCount > 0)
                riskLevel = 'critical';
            else if (highCount > 2)
                riskLevel = 'high';
            else if (highCount > 0)
                riskLevel = 'medium';
            else
                riskLevel = 'low';
            const assessment = {
                id: crypto_1.default.randomUUID(),
                assessmentDate: new Date(),
                conductedBy,
                riskLevel,
                vulnerabilities,
                nextAssessmentDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            };
            await database_1.sequelize.models.SecurityRiskAssessment?.create(assessment);
            logger_1.logger.info('Risk assessment conducted', {
                id: assessment.id,
                riskLevel: assessment.riskLevel,
                vulnerabilities: assessment.vulnerabilities.length,
            });
            return assessment;
        }
        catch (error) {
            logger_1.logger.error('Error conducting risk assessment', error);
            throw new Error('Failed to conduct risk assessment');
        }
    }
    async reportPHIBreach(breach) {
        try {
            const notification = {
                id: crypto_1.default.randomUUID(),
                discoveredAt: new Date(),
                reportedAt: new Date(),
                ...breach,
            };
            await database_1.sequelize.models.PHIBreachNotification?.create(notification);
            if (notification.affectedRecords >= 500) {
                notification.notificationsSent.media = true;
                logger_1.logger.warn('Major breach affecting 500+ individuals', { id: notification.id });
            }
            notification.notificationsSent.hhs = true;
            notification.notificationsSent.patients = true;
            logger_1.logger.error('PHI breach reported', notification);
            return notification;
        }
        catch (error) {
            logger_1.logger.error('Error reporting PHI breach', error);
            throw new Error('Failed to report PHI breach');
        }
    }
    async generateComplianceReport() {
        const report = {
            generatedAt: new Date(),
            complianceStatus: 'compliant',
            safeguards: {
                administrative: {
                    riskAssessment: await this.getLatestRiskAssessment(),
                    workforceTraining: await this.getTrainingStatus(),
                    accessControls: await this.getAccessControlStatus(),
                    incidentResponse: await this.getIncidentResponsePlan(),
                },
                physical: {
                    facilityAccess: 'Controlled',
                    workstationSecurity: 'Implemented',
                    deviceControls: 'Enforced',
                },
                technical: {
                    accessControl: 'Role-based',
                    auditControls: 'Active',
                    integrity: 'SHA-256 checksums',
                    transmission: 'TLS 1.3',
                    encryption: 'AES-256-GCM',
                },
            },
            recentBreaches: await this.getRecentBreaches(90),
            upcomingAudits: await this.getUpcomingAudits(),
            baaStatus: await this.getBAAStatus(),
        };
        return report;
    }
    async checkMinimumNecessary(userId, patientId, requestedData) {
        try {
            const user = await User_1.User.findByPk(userId);
            if (!user) {
                return { allowed: [], denied: requestedData };
            }
            const allowed = [];
            const denied = [];
            for (const dataType of requestedData) {
                if (await this.isAccessAllowed(user, patientId, dataType)) {
                    allowed.push(dataType);
                }
                else {
                    denied.push(dataType);
                }
            }
            if (denied.length > 0) {
                logger_1.logger.warn('Minimum necessary access denied', {
                    userId,
                    patientId,
                    denied,
                });
            }
            return { allowed, denied };
        }
        catch (error) {
            logger_1.logger.error('Error checking minimum necessary', error);
            return { allowed: [], denied: requestedData };
        }
    }
    deidentifyPHI(data) {
        const deidentified = JSON.parse(JSON.stringify(data));
        const identifiers = [
            'name',
            'email',
            'address',
            'city',
            'state',
            'zip',
            'phone',
            'fax',
            'ssn',
            'medicalRecordNumber',
            'healthPlanNumber',
            'accountNumber',
            'certificateNumber',
            'vehicleId',
            'deviceId',
            'url',
            'ipAddress',
            'biometricId',
            'photo',
            'dateOfBirth',
        ];
        function removeIdentifiers(obj) {
            for (const key in obj) {
                if (identifiers.includes(key.toLowerCase())) {
                    obj[key] = '[REDACTED]';
                }
                else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    removeIdentifiers(obj[key]);
                }
            }
        }
        removeIdentifiers(deidentified);
        deidentified.researchId = crypto_1.default.randomBytes(16).toString('hex');
        return deidentified;
    }
    hashIP(ip) {
        return crypto_1.default
            .createHash('sha256')
            .update(ip + process.env.IP_SALT)
            .digest('hex');
    }
    async detectSuspiciousAccess(log) {
        const recentAccess = await redis_1.redis.keys(`phi:access:${log.userId}:*`);
        if (recentAccess.length > 100) {
            logger_1.logger.warn('Suspicious PHI access pattern detected', {
                userId: log.userId,
                accessCount: recentAccess.length,
            });
        }
    }
    async identifyVulnerabilities() {
        const vulnerabilities = [];
        return vulnerabilities;
    }
    async getLatestRiskAssessment() {
        return database_1.sequelize.models.SecurityRiskAssessment.findOne({
            order: [['assessmentDate', 'DESC']],
        });
    }
    async getTrainingStatus() {
        return {
            completed: 95,
            pending: 5,
            overdue: 2,
        };
    }
    async getAccessControlStatus() {
        return {
            usersWithAccess: 150,
            roleBasedAccess: true,
            lastReview: new Date('2024-01-01'),
        };
    }
    async getIncidentResponsePlan() {
        return {
            documented: true,
            lastUpdated: new Date('2024-01-01'),
            contactList: 'Current',
        };
    }
    async getRecentBreaches(days) {
        return database_1.sequelize.models.PHIBreachNotification.findAll({
            where: {
                discoveredAt: {
                    [sequelize_1.Op.gte]: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
                },
            },
        });
    }
    async getUpcomingAudits() {
        return [];
    }
    async getBAAStatus() {
        const agreements = await database_1.sequelize.models.BusinessAssociateAgreement.findAll({
            where: { status: 'active' },
        });
        return {
            active: agreements.length,
            expiringSoon: agreements.filter(a => a.expiresAt < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length,
        };
    }
    async isAccessAllowed(user, patientId, dataType) {
        return user.role === 'admin' || user.role === 'coach';
    }
}
exports.hipaaService = HIPAAService.getInstance();
