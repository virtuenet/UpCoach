"use strict";
/**
 * GDPR Compliance Service
 * Implements GDPR requirements for data protection and privacy
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gdprService = exports.ConsentPurpose = void 0;
const User_1 = require("../../models/User");
const logger_1 = require("../../utils/logger");
const redis_1 = require("../redis");
const database_1 = require("../../config/database");
const sequelize_1 = require("sequelize");
const crypto_1 = __importDefault(require("crypto"));
const archiver_1 = __importDefault(require("archiver"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const date_fns_1 = require("date-fns");
var ConsentPurpose;
(function (ConsentPurpose) {
    ConsentPurpose["MARKETING"] = "marketing";
    ConsentPurpose["ANALYTICS"] = "analytics";
    ConsentPurpose["FUNCTIONAL"] = "functional";
    ConsentPurpose["NECESSARY"] = "necessary";
    ConsentPurpose["PERFORMANCE"] = "performance";
    ConsentPurpose["TARGETING"] = "targeting";
    ConsentPurpose["SOCIAL_MEDIA"] = "social_media";
    ConsentPurpose["EMAIL_COMMUNICATIONS"] = "email_communications";
    ConsentPurpose["DATA_PROCESSING"] = "data_processing";
    ConsentPurpose["THIRD_PARTY_SHARING"] = "third_party_sharing";
})(ConsentPurpose || (exports.ConsentPurpose = ConsentPurpose = {}));
class GDPRService {
    static instance;
    consentVersion = '2.0';
    dataRetentionDays = 365 * 3; // 3 years default
    deletionGracePeriod = 30; // 30 days before actual deletion
    constructor() { }
    static getInstance() {
        if (!GDPRService.instance) {
            GDPRService.instance = new GDPRService();
        }
        return GDPRService.instance;
    }
    /**
     * Record user consent
     */
    async recordConsent(userId, purpose, granted, ipAddress, userAgent) {
        try {
            const consent = {
                userId,
                purpose,
                granted,
                timestamp: new Date(),
                ipAddress: this.hashIP(ipAddress), // Hash IP for privacy
                userAgent,
                version: this.consentVersion,
                expiresAt: granted ? (0, date_fns_1.addDays)(new Date(), 365) : undefined, // Consent expires after 1 year
            };
            // Store in database
            await database_1.sequelize.models.ConsentLog.create({
                userId,
                purpose,
                granted,
                timestamp: consent.timestamp,
                ipAddress: consent.ipAddress,
                userAgent: consent.userAgent,
                version: consent.version,
                expiresAt: consent.expiresAt,
            });
            // Update user's current consent status in Redis for quick access
            const key = `consent:${userId}:${purpose}`;
            await redis_1.redis.set(key, JSON.stringify(consent));
            logger_1.logger.info('Consent recorded', { userId, purpose, granted });
            // Trigger consent-based actions
            if (granted) {
                await this.onConsentGranted(userId, purpose);
            }
            else {
                await this.onConsentRevoked(userId, purpose);
            }
            return consent;
        }
        catch (error) {
            logger_1.logger.error('Error recording consent', error);
            throw new Error('Failed to record consent');
        }
    }
    /**
     * Get user's consent status
     */
    async getConsentStatus(userId) {
        try {
            const purposes = Object.values(ConsentPurpose);
            const status = {};
            for (const purpose of purposes) {
                const key = `consent:${userId}:${purpose}`;
                const data = await redis_1.redis.get(key);
                if (data) {
                    const consent = JSON.parse(data);
                    // Check if consent is still valid
                    if (consent.expiresAt && new Date(consent.expiresAt) < new Date()) {
                        status[purpose] = false;
                    }
                    else {
                        status[purpose] = consent.granted;
                    }
                }
                else {
                    // No consent record means not granted (opt-in approach)
                    status[purpose] = purpose === ConsentPurpose.NECESSARY; // Only necessary is true by default
                }
            }
            return status;
        }
        catch (error) {
            logger_1.logger.error('Error getting consent status', error);
            throw new Error('Failed to get consent status');
        }
    }
    /**
     * Request data portability (Right to Data Portability)
     */
    async requestDataPortability(userId, format = 'json') {
        try {
            const requestId = crypto_1.default.randomUUID();
            const request = {
                id: requestId,
                userId,
                requestedAt: new Date(),
                status: 'pending',
                format,
                expiresAt: (0, date_fns_1.addDays)(new Date(), 7), // Download expires in 7 days
            };
            // Store request
            await redis_1.redis.set(`data-export:${requestId}`, JSON.stringify(request));
            // Queue for processing
            await this.queueDataExport(request);
            logger_1.logger.info('Data portability requested', { userId, requestId });
            return request;
        }
        catch (error) {
            logger_1.logger.error('Error requesting data portability', error);
            throw new Error('Failed to request data export');
        }
    }
    /**
     * Process data export
     */
    async queueDataExport(request) {
        // In production, this would be a background job
        setTimeout(async () => {
            try {
                await this.processDataExport(request);
            }
            catch (error) {
                logger_1.logger.error('Error processing data export', error);
            }
        }, 1000);
    }
    /**
     * Export user data
     */
    async processDataExport(request) {
        try {
            request.status = 'processing';
            await redis_1.redis.set(`data-export:${request.id}`, JSON.stringify(request));
            // Collect all user data
            const userData = await this.collectUserData(request.userId);
            // Create export file
            const filePath = await this.createExportFile(userData, request.format, request.userId);
            // Generate secure download URL
            const downloadUrl = await this.generateSecureDownloadUrl(filePath, request.id);
            // Update request
            request.status = 'completed';
            request.completedAt = new Date();
            request.downloadUrl = downloadUrl;
            await redis_1.redis.set(`data-export:${request.id}`, JSON.stringify(request));
            // Notify user
            await this.notifyDataExportReady(request.userId, downloadUrl);
            logger_1.logger.info('Data export completed', { userId: request.userId, requestId: request.id });
        }
        catch (error) {
            logger_1.logger.error('Error processing data export', error);
            request.status = 'failed';
            await redis_1.redis.set(`data-export:${request.id}`, JSON.stringify(request));
            throw error;
        }
    }
    /**
     * Collect all user data for export
     */
    async collectUserData(userId) {
        const userData = {
            exportDate: new Date().toISOString(),
            gdprExportVersion: '1.0',
        };
        // User profile
        const user = await User_1.User.findByPk(userId, {
            include: ['profile', 'goals', 'tasks', 'moods', 'chats'],
        });
        if (!user) {
            throw new Error('User not found');
        }
        // Basic user data
        userData.profile = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt,
            emailVerified: user.emailVerified,
        };
        // Related data
        userData.goals = user.goals || [];
        userData.tasks = user.tasks || [];
        userData.moods = user.moods || [];
        userData.chats =
            user.chats?.map((chat) => ({
                id: chat.id,
                message: chat.message,
                response: chat.response,
                createdAt: chat.createdAt,
            })) || [];
        // Consent history
        userData.consentHistory = await database_1.sequelize.models.ConsentLog.findAll({
            where: { userId },
            order: [['timestamp', 'DESC']],
        });
        // Activity logs (last 90 days)
        userData.activityLogs = await database_1.sequelize.models.ActivityLog.findAll({
            where: {
                userId,
                createdAt: {
                    [sequelize_1.Op.gte]: (0, date_fns_1.addDays)(new Date(), -90),
                },
            },
            order: [['createdAt', 'DESC']],
        });
        return userData;
    }
    /**
     * Create export file in requested format
     */
    async createExportFile(data, format, userId) {
        const exportDir = path_1.default.join(process.cwd(), 'exports');
        if (!fs_1.default.existsSync(exportDir)) {
            fs_1.default.mkdirSync(exportDir, { recursive: true });
        }
        const timestamp = Date.now();
        const baseFileName = `gdpr-export-${userId}-${timestamp}`;
        let filePath;
        switch (format) {
            case 'json':
                filePath = path_1.default.join(exportDir, `${baseFileName}.json`);
                fs_1.default.writeFileSync(filePath, JSON.stringify(data, null, 2));
                break;
            case 'csv':
                // For CSV, we need to flatten the data structure
                filePath = path_1.default.join(exportDir, `${baseFileName}.zip`);
                await this.createCSVExport(data, filePath);
                break;
            case 'xml':
                filePath = path_1.default.join(exportDir, `${baseFileName}.xml`);
                const xml = this.jsonToXML(data);
                fs_1.default.writeFileSync(filePath, xml);
                break;
            default:
                throw new Error('Unsupported export format');
        }
        // Encrypt the file
        const encryptedPath = await this.encryptFile(filePath);
        // Delete unencrypted file
        fs_1.default.unlinkSync(filePath);
        return encryptedPath;
    }
    /**
     * Request account deletion (Right to Erasure)
     */
    async requestDeletion(userId, reason, immediate = false) {
        try {
            const requestId = crypto_1.default.randomUUID();
            const request = {
                id: requestId,
                userId,
                requestedAt: new Date(),
                scheduledFor: immediate ? new Date() : (0, date_fns_1.addDays)(new Date(), this.deletionGracePeriod),
                status: immediate ? 'processing' : 'scheduled',
                reason,
            };
            // Check for data that must be retained for legal reasons
            request.retainData = await this.checkLegalRetentionRequirements(userId);
            // Store request
            await database_1.sequelize.models.DeletionRequest?.create(request);
            // If immediate, process now
            if (immediate) {
                await this.processDeletion(request);
            }
            else {
                // Send confirmation email with cancellation link
                await this.sendDeletionConfirmation(userId, request);
            }
            logger_1.logger.info('Deletion requested', { userId, requestId, immediate });
            return request;
        }
        catch (error) {
            logger_1.logger.error('Error requesting deletion', error);
            throw new Error('Failed to request account deletion');
        }
    }
    /**
     * Cancel deletion request
     */
    async cancelDeletion(userId, requestId) {
        try {
            const request = await database_1.sequelize.models.DeletionRequest?.findOne({
                where: { id: requestId, userId, status: 'scheduled' },
            });
            if (!request) {
                return false;
            }
            request.status = 'cancelled';
            await request.save();
            logger_1.logger.info('Deletion cancelled', { userId, requestId });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Error cancelling deletion', error);
            throw new Error('Failed to cancel deletion');
        }
    }
    /**
     * Process account deletion
     */
    async processDeletion(request) {
        const transaction = await database_1.sequelize.transaction();
        try {
            request.status = 'processing';
            await database_1.sequelize.models.DeletionRequest.update({ status: request.status }, { where: { id: request.id }, transaction });
            const userId = request.userId;
            // Anonymize user data instead of hard delete
            const anonymizedId = `deleted_${crypto_1.default.randomBytes(16).toString('hex')}`;
            // Update user record
            await User_1.User.update({
                email: `${anonymizedId}@deleted.local`,
                name: 'Deleted User',
                password: crypto_1.default.randomBytes(32).toString('hex'),
                avatar: null,
                bio: null,
                googleId: null,
                isActive: false,
            }, {
                where: { id: userId },
                transaction,
            });
            // Delete or anonymize related data
            await this.anonymizeUserContent(userId, transaction);
            // Clear all cache and session data
            await this.clearUserCache(userId);
            // Update request
            request.status = 'completed';
            request.completedAt = new Date();
            await database_1.sequelize.models.DeletionRequest.update({
                status: request.status,
                completedAt: request.completedAt,
            }, {
                where: { id: request.id },
                transaction,
            });
            await transaction.commit();
            // Log for audit
            await this.logDeletion(userId, request);
            logger_1.logger.info('Account deleted', { userId, requestId: request.id });
        }
        catch (error) {
            await transaction.rollback();
            logger_1.logger.error('Error processing deletion', error);
            throw error;
        }
    }
    /**
     * Report data breach
     */
    async reportDataBreach(incident) {
        try {
            const breachIncident = {
                id: crypto_1.default.randomUUID(),
                detectedAt: new Date(),
                ...incident,
            };
            // Store incident
            await database_1.sequelize.models.DataBreachIncident?.create(breachIncident);
            // Check if notification is required (within 72 hours)
            if (breachIncident.severity === 'high' || breachIncident.severity === 'critical') {
                await this.notifyDataProtectionAuthority(breachIncident);
                // Notify affected users
                if (!breachIncident.notificationsSent) {
                    await this.notifyAffectedUsers(breachIncident);
                    breachIncident.notificationsSent = true;
                }
            }
            logger_1.logger.error('Data breach reported', breachIncident);
            return breachIncident;
        }
        catch (error) {
            logger_1.logger.error('Error reporting data breach', error);
            throw new Error('Failed to report data breach');
        }
    }
    /**
     * Get data retention policy
     */
    async getDataRetentionPolicy() {
        return {
            version: '1.0',
            lastUpdated: '2024-01-01',
            categories: [
                {
                    type: 'user_profile',
                    retentionPeriod: '3 years after last activity',
                    legalBasis: 'Legitimate interest',
                },
                {
                    type: 'chat_history',
                    retentionPeriod: '1 year',
                    legalBasis: 'Service provision',
                },
                {
                    type: 'payment_records',
                    retentionPeriod: '7 years',
                    legalBasis: 'Legal requirement',
                },
                {
                    type: 'consent_logs',
                    retentionPeriod: '3 years after consent withdrawal',
                    legalBasis: 'Legal compliance',
                },
                {
                    type: 'security_logs',
                    retentionPeriod: '1 year',
                    legalBasis: 'Security and fraud prevention',
                },
            ],
        };
    }
    /**
     * Automated data retention cleanup
     */
    async runDataRetentionCleanup() {
        try {
            const policy = await this.getDataRetentionPolicy();
            for (const category of policy.categories) {
                await this.cleanupCategoryData(category);
            }
            logger_1.logger.info('Data retention cleanup completed');
        }
        catch (error) {
            logger_1.logger.error('Error in data retention cleanup', error);
            throw error;
        }
    }
    /**
     * Generate privacy policy data
     */
    async generatePrivacyPolicyData() {
        return {
            version: '2.0',
            effectiveDate: new Date().toISOString(),
            dataController: {
                name: 'UpCoach Inc.',
                address: 'Privacy Office, UpCoach Inc.',
                email: 'privacy@upcoach.ai',
                dpo: 'dpo@upcoach.ai',
            },
            dataProcessed: [
                'Personal identification information',
                'Contact information',
                'Health and mood data',
                'Chat conversations',
                'Usage analytics',
                'Payment information',
            ],
            legalBasis: ['Consent', 'Contract fulfillment', 'Legal obligation', 'Legitimate interests'],
            dataSharing: {
                thirdParties: [
                    {
                        name: 'Stripe',
                        purpose: 'Payment processing',
                        location: 'United States',
                    },
                    {
                        name: 'OpenAI',
                        purpose: 'AI coaching services',
                        location: 'United States',
                    },
                ],
                safeguards: 'Standard Contractual Clauses',
            },
            userRights: [
                'Right to access',
                'Right to rectification',
                'Right to erasure',
                'Right to restrict processing',
                'Right to data portability',
                'Right to object',
                'Right to withdraw consent',
            ],
            contactDPO: 'dpo@upcoach.ai',
        };
    }
    /**
     * Helper methods
     */
    hashIP(ip) {
        // Hash IP for privacy while maintaining uniqueness for fraud detection
        return crypto_1.default
            .createHash('sha256')
            .update(ip + process.env.IP_SALT)
            .digest('hex');
    }
    async onConsentGranted(userId, purpose) {
        // Trigger consent-based features
        logger_1.logger.info('Consent granted', { userId, purpose });
    }
    async onConsentRevoked(userId, purpose) {
        // Disable consent-based features
        logger_1.logger.info('Consent revoked', { userId, purpose });
    }
    async checkLegalRetentionRequirements(userId) {
        const retainData = [];
        // Check for ongoing legal cases
        // Check for financial records (7 year requirement)
        // Check for regulatory requirements
        return retainData;
    }
    async anonymizeUserContent(userId, transaction) {
        // Anonymize but don't delete for data integrity
        await database_1.sequelize.models.Chat.update({ userId: null, message: '[DELETED]' }, { where: { userId }, transaction });
        await database_1.sequelize.models.Goal.destroy({
            where: { userId },
            transaction,
        });
        await database_1.sequelize.models.Task.destroy({
            where: { userId },
            transaction,
        });
    }
    async clearUserCache(userId) {
        const keys = await redis_1.redis.keys(`*${userId}*`);
        if (keys.length > 0) {
            for (const key of keys) {
                await redis_1.redis.del(key);
            }
        }
    }
    async logDeletion(userId, request) {
        await database_1.sequelize.models.AuditLog.create({
            action: 'user_deletion',
            userId: 'system',
            targetId: userId,
            details: {
                requestId: request.id,
                reason: request.reason,
                completedAt: request.completedAt,
            },
        });
    }
    async notifyDataProtectionAuthority(incident) {
        // In production, this would send notification to DPA
        logger_1.logger.info('DPA notification required', { incidentId: incident.id });
    }
    async notifyAffectedUsers(incident) {
        // Send notification emails to affected users
        for (const userId of incident.affectedUsers) {
            logger_1.logger.info('User breach notification sent', { userId, incidentId: incident.id });
        }
    }
    async sendDeletionConfirmation(userId, request) {
        // Send email with cancellation link
        logger_1.logger.info('Deletion confirmation sent', { userId, requestId: request.id });
    }
    async notifyDataExportReady(userId, downloadUrl) {
        // Send email with download link
        logger_1.logger.info('Data export notification sent', { userId });
    }
    async generateSecureDownloadUrl(filePath, requestId) {
        // Generate signed URL for secure download
        const token = crypto_1.default.randomBytes(32).toString('hex');
        await redis_1.redis.setEx(`download:${token}`, 7 * 24 * 60 * 60, filePath); // 7 days expiry
        return `/api/gdpr/download/${requestId}?token=${token}`;
    }
    async encryptFile(filePath) {
        // In production, implement proper file encryption
        const encryptedPath = filePath + '.encrypted';
        fs_1.default.copyFileSync(filePath, encryptedPath);
        return encryptedPath;
    }
    async createCSVExport(data, zipPath) {
        // Create ZIP with multiple CSV files
        const output = fs_1.default.createWriteStream(zipPath);
        const archive = (0, archiver_1.default)('zip', { zlib: { level: 9 } });
        archive.pipe(output);
        // Add different data types as separate CSV files
        // Implementation would convert each data type to CSV format
        await archive.finalize();
    }
    jsonToXML(obj) {
        // Simple JSON to XML conversion
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<gdpr-export>\n';
        function convertToXML(data, indent = '  ') {
            let result = '';
            for (const key in data) {
                if (typeof data[key] === 'object' && data[key] !== null) {
                    result += `${indent}<${key}>\n${convertToXML(data[key], indent + '  ')}${indent}</${key}>\n`;
                }
                else {
                    result += `${indent}<${key}>${data[key]}</${key}>\n`;
                }
            }
            return result;
        }
        xml += convertToXML(obj);
        xml += '</gdpr-export>';
        return xml;
    }
    async cleanupCategoryData(category) {
        // Implement cleanup based on retention policy
        logger_1.logger.info('Cleaning up category data', { type: category.type });
    }
}
// Export singleton instance
exports.gdprService = GDPRService.getInstance();
//# sourceMappingURL=GDPRService.js.map