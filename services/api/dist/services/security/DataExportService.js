"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataExportService = exports.DataExportService = void 0;
const tslib_1 = require("tslib");
const crypto = tslib_1.__importStar(require("crypto"));
const archiver = tslib_1.__importStar(require("archiver"));
const redis_1 = require("../redis");
const database_1 = require("../database");
const logger_1 = require("../../utils/logger");
const apiError_1 = require("../../utils/apiError");
const ANONYMIZATION_RULES = {
    users: {
        email: 'hash',
        phone: 'mask',
        ip_address: 'redact',
        device_id: 'hash',
        payment_info: 'remove'
    },
    coaching_sessions: {
        session_notes: 'preserve',
        participant_emails: 'hash',
        recording_url: 'remove'
    },
    analytics: {
        ip_address: 'redact',
        device_fingerprint: 'hash',
        location_data: 'mask'
    }
};
class DataExportService {
    static instance;
    RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000;
    RATE_LIMIT_MAX_REQUESTS = 3;
    DOWNLOAD_EXPIRY_HOURS = 48;
    static getInstance() {
        if (!DataExportService.instance) {
            DataExportService.instance = new DataExportService();
        }
        return DataExportService.instance;
    }
    async requestDataExport(userId, requestedBy, exportType, options = {}) {
        try {
            if (requestedBy !== userId && !await this.isAdmin(requestedBy)) {
                throw new apiError_1.ApiError(403, 'Insufficient permissions to export this user data');
            }
            await this.checkRateLimit(requestedBy);
            if (options.dateRange) {
                if (options.dateRange.startDate > options.dateRange.endDate) {
                    throw new apiError_1.ApiError(400, 'Invalid date range');
                }
                if (options.dateRange.endDate > new Date()) {
                    throw new apiError_1.ApiError(400, 'End date cannot be in the future');
                }
            }
            const exportId = crypto.randomUUID();
            const estimatedCompletionTime = new Date(Date.now() + 15 * 60 * 1000);
            const exportRequest = {
                id: exportId,
                userId,
                requestedBy,
                exportType,
                includePersonalData: options.includePersonalData ?? false,
                includeAnalytics: options.includeAnalytics ?? false,
                dateRange: options.dateRange,
                status: 'pending',
                createdAt: new Date()
            };
            await redis_1.redis.setEx(`export:${exportId}`, 7 * 24 * 60 * 60, JSON.stringify(exportRequest));
            await redis_1.redis.zadd(`export_requests:${requestedBy}`, Date.now(), exportId);
            const cutoff = Date.now() - this.RATE_LIMIT_WINDOW;
            await redis_1.redis.zremrangebyscore(`export_requests:${requestedBy}`, '-inf', cutoff);
            await this.auditLog({
                timestamp: new Date(),
                exportId,
                userId,
                requestedBy,
                action: 'EXPORT_REQUESTED',
                details: {
                    exportType,
                    includePersonalData: exportRequest.includePersonalData,
                    includeAnalytics: exportRequest.includeAnalytics,
                    dateRange: options.dateRange
                },
                ipAddress: options.ipAddress,
                userAgent: options.userAgent
            });
            process.nextTick(() => {
                this.processExport(exportId);
            });
            logger_1.logger.info('Data export requested', {
                exportId,
                userId,
                requestedBy,
                exportType
            });
            return { exportId, estimatedCompletionTime };
        }
        catch (error) {
            logger_1.logger.error('Data export request failed:', error);
            throw error;
        }
    }
    async processExport(exportId) {
        try {
            const requestData = await redis_1.redis.get(`export:${exportId}`);
            if (!requestData) {
                throw new Error('Export request not found');
            }
            const exportRequest = JSON.parse(requestData);
            exportRequest.status = 'processing';
            await redis_1.redis.setEx(`export:${exportId}`, 7 * 24 * 60 * 60, JSON.stringify(exportRequest));
            await this.auditLog({
                timestamp: new Date(),
                exportId,
                userId: exportRequest.userId,
                requestedBy: exportRequest.requestedBy,
                action: 'EXPORT_STARTED',
                details: { exportType: exportRequest.exportType }
            });
            const exportData = await this.collectExportData(exportRequest);
            const processedData = exportRequest.includePersonalData
                ? exportData
                : this.anonymizeData(exportData);
            const { buffer, checksum } = await this.createSecureExportFile(processedData, exportId);
            const downloadUrl = await this.generateSecureDownloadUrl(exportId, checksum);
            exportRequest.status = 'completed';
            exportRequest.completedAt = new Date();
            exportRequest.downloadUrl = downloadUrl;
            exportRequest.expiresAt = new Date(Date.now() + this.DOWNLOAD_EXPIRY_HOURS * 60 * 60 * 1000);
            exportRequest.fileSize = buffer.length;
            exportRequest.checksum = checksum;
            await redis_1.redis.setEx(`export:${exportId}`, 7 * 24 * 60 * 60, JSON.stringify(exportRequest));
            await redis_1.redis.setEx(`export_file:${exportId}`, this.DOWNLOAD_EXPIRY_HOURS * 60 * 60, buffer.toString('base64'));
            await this.auditLog({
                timestamp: new Date(),
                exportId,
                userId: exportRequest.userId,
                requestedBy: exportRequest.requestedBy,
                action: 'EXPORT_COMPLETED',
                details: {
                    fileSize: buffer.length,
                    checksum,
                    dataIncluded: Object.keys(processedData)
                }
            });
            logger_1.logger.info('Data export completed', {
                exportId,
                userId: exportRequest.userId,
                fileSize: buffer.length
            });
        }
        catch (error) {
            logger_1.logger.error('Data export processing failed:', error);
            try {
                const requestData = await redis_1.redis.get(`export:${exportId}`);
                if (requestData) {
                    const exportRequest = JSON.parse(requestData);
                    exportRequest.status = 'failed';
                    await redis_1.redis.setEx(`export:${exportId}`, 7 * 24 * 60 * 60, JSON.stringify(exportRequest));
                    await this.auditLog({
                        timestamp: new Date(),
                        exportId,
                        userId: exportRequest.userId,
                        requestedBy: exportRequest.requestedBy,
                        action: 'EXPORT_FAILED',
                        details: { error: error.message }
                    });
                }
            }
            catch (updateError) {
                logger_1.logger.error('Failed to update export status:', updateError);
            }
        }
    }
    async collectExportData(exportRequest) {
        const data = {};
        try {
            if (['user_data', 'full_profile'].includes(exportRequest.exportType)) {
                data.user = await this.getUserData(exportRequest.userId);
                data.preferences = await this.getUserPreferences(exportRequest.userId);
            }
            if (['coaching_sessions', 'full_profile'].includes(exportRequest.exportType)) {
                data.coachingSessions = await this.getCoachingSessions(exportRequest.userId, exportRequest.dateRange);
                data.sessionNotes = await this.getSessionNotes(exportRequest.userId, exportRequest.dateRange);
            }
            if (exportRequest.includeAnalytics || exportRequest.exportType === 'analytics') {
                data.analytics = await this.getAnalyticsData(exportRequest.userId, exportRequest.dateRange);
                data.engagementMetrics = await this.getEngagementMetrics(exportRequest.userId, exportRequest.dateRange);
            }
            if (['user_data', 'full_profile'].includes(exportRequest.exportType)) {
                data.goals = await this.getUserGoals(exportRequest.userId);
                data.progress = await this.getUserProgress(exportRequest.userId, exportRequest.dateRange);
            }
            return data;
        }
        catch (error) {
            logger_1.logger.error('Data collection failed:', error);
            throw new apiError_1.ApiError(500, 'Failed to collect export data');
        }
    }
    anonymizeData(data) {
        const anonymized = JSON.parse(JSON.stringify(data));
        for (const [table, fields] of Object.entries(ANONYMIZATION_RULES)) {
            if (anonymized[table]) {
                if (Array.isArray(anonymized[table])) {
                    anonymized[table] = anonymized[table].map((record) => this.anonymizeRecord(record, fields));
                }
                else {
                    anonymized[table] = this.anonymizeRecord(anonymized[table], fields);
                }
            }
        }
        return anonymized;
    }
    anonymizeRecord(record, rules) {
        const anonymized = { ...record };
        for (const [field, rule] of Object.entries(rules)) {
            if (anonymized[field] !== undefined) {
                switch (rule) {
                    case 'redact':
                        anonymized[field] = '[REDACTED]';
                        break;
                    case 'hash':
                        anonymized[field] = crypto.createHash('sha256')
                            .update(String(anonymized[field]))
                            .digest('hex')
                            .substring(0, 16) + '...';
                        break;
                    case 'mask':
                        const value = String(anonymized[field]);
                        anonymized[field] = value.substring(0, 2) + '***' + value.substring(value.length - 2);
                        break;
                    case 'remove':
                        delete anonymized[field];
                        break;
                    case 'preserve':
                        break;
                }
            }
        }
        return anonymized;
    }
    async createSecureExportFile(data, exportId) {
        return new Promise((resolve, reject) => {
            const buffers = [];
            const archive = archiver('zip', { zlib: { level: 9 } });
            archive.on('data', (chunk) => buffers.push(chunk));
            archive.on('end', () => {
                const buffer = Buffer.concat(buffers);
                const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
                resolve({ buffer, checksum });
            });
            archive.on('error', reject);
            for (const [key, value] of Object.entries(data)) {
                const jsonContent = JSON.stringify(value, null, 2);
                archive.append(jsonContent, { name: `${key}.json` });
            }
            const metadata = {
                exportId,
                exportedAt: new Date(),
                dataTypes: Object.keys(data),
                version: '1.0',
                format: 'JSON',
                anonymized: !data.includePersonalData
            };
            archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' });
            archive.finalize();
        });
    }
    async generateSecureDownloadUrl(exportId, checksum) {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = Date.now() + this.DOWNLOAD_EXPIRY_HOURS * 60 * 60 * 1000;
        const downloadTokenData = {
            exportId,
            checksum,
            expiresAt,
            createdAt: Date.now()
        };
        await redis_1.redis.setEx(`download_token:${token}`, this.DOWNLOAD_EXPIRY_HOURS * 60 * 60, JSON.stringify(downloadTokenData));
        const baseUrl = process.env.API_BASE_URL || 'https://api.upcoach.ai';
        return `${baseUrl}/api/data-export/download/${token}`;
    }
    async checkRateLimit(userId) {
        const cutoff = Date.now() - this.RATE_LIMIT_WINDOW;
        const recentRequests = await redis_1.redis.zcount(`export_requests:${userId}`, cutoff, '+inf');
        if (recentRequests >= this.RATE_LIMIT_MAX_REQUESTS) {
            throw new apiError_1.ApiError(429, `Export rate limit exceeded. Maximum ${this.RATE_LIMIT_MAX_REQUESTS} requests per 24 hours.`);
        }
    }
    async isAdmin(userId) {
        try {
            const result = await database_1.db.query('SELECT role FROM users WHERE id = $1', [userId]);
            return result.rows[0]?.role === 'admin';
        }
        catch (error) {
            logger_1.logger.error('Admin check failed:', error);
            return false;
        }
    }
    async getExportStatus(exportId, requestedBy) {
        try {
            const requestData = await redis_1.redis.get(`export:${exportId}`);
            if (!requestData) {
                return null;
            }
            const exportRequest = JSON.parse(requestData);
            if (exportRequest.requestedBy !== requestedBy && !await this.isAdmin(requestedBy)) {
                throw new apiError_1.ApiError(403, 'Insufficient permissions to view this export');
            }
            return exportRequest;
        }
        catch (error) {
            logger_1.logger.error('Get export status failed:', error);
            throw error;
        }
    }
    async downloadExport(token, ipAddress, userAgent) {
        try {
            const tokenData = await redis_1.redis.get(`download_token:${token}`);
            if (!tokenData) {
                throw new apiError_1.ApiError(404, 'Download token not found or expired');
            }
            const { exportId, checksum, expiresAt } = JSON.parse(tokenData);
            if (Date.now() > expiresAt) {
                await redis_1.redis.del(`download_token:${token}`);
                throw new apiError_1.ApiError(410, 'Download link has expired');
            }
            const fileData = await redis_1.redis.get(`export_file:${exportId}`);
            if (!fileData) {
                throw new apiError_1.ApiError(404, 'Export file not found or expired');
            }
            const buffer = Buffer.from(fileData, 'base64');
            const actualChecksum = crypto.createHash('sha256').update(buffer).digest('hex');
            if (actualChecksum !== checksum) {
                logger_1.logger.error('File integrity check failed', { exportId, expectedChecksum: checksum, actualChecksum });
                throw new apiError_1.ApiError(500, 'File integrity verification failed');
            }
            const exportRequestData = await redis_1.redis.get(`export:${exportId}`);
            if (exportRequestData) {
                const exportRequest = JSON.parse(exportRequestData);
                await this.auditLog({
                    timestamp: new Date(),
                    exportId,
                    userId: exportRequest.userId,
                    requestedBy: exportRequest.requestedBy,
                    action: 'EXPORT_DOWNLOADED',
                    details: { downloadToken: token.substring(0, 16) + '...' },
                    ipAddress,
                    userAgent
                });
            }
            await redis_1.redis.del(`download_token:${token}`);
            const filename = `upcoach_export_${exportId}.zip`;
            logger_1.logger.info('Export file downloaded', {
                exportId,
                filename,
                fileSize: buffer.length
            });
            return { buffer, filename, checksum };
        }
        catch (error) {
            logger_1.logger.error('Export download failed:', error);
            throw error;
        }
    }
    async getUserData(userId) {
        const result = await database_1.db.query('SELECT id, email, name, created_at, updated_at, preferences FROM users WHERE id = $1', [userId]);
        return result.rows[0];
    }
    async getUserPreferences(userId) {
        const result = await database_1.db.query('SELECT * FROM user_preferences WHERE user_id = $1', [userId]);
        return result.rows;
    }
    async getCoachingSessions(userId, dateRange) {
        let query = 'SELECT * FROM coaching_sessions WHERE user_id = $1';
        const params = [userId];
        if (dateRange) {
            query += ' AND created_at BETWEEN $2 AND $3';
            params.push(dateRange.startDate, dateRange.endDate);
        }
        const result = await database_1.db.query(query + ' ORDER BY created_at DESC', params);
        return result.rows;
    }
    async getSessionNotes(userId, dateRange) {
        let query = `
      SELECT sn.* FROM session_notes sn
      JOIN coaching_sessions cs ON sn.session_id = cs.id
      WHERE cs.user_id = $1
    `;
        const params = [userId];
        if (dateRange) {
            query += ' AND sn.created_at BETWEEN $2 AND $3';
            params.push(dateRange.startDate, dateRange.endDate);
        }
        const result = await database_1.db.query(query + ' ORDER BY sn.created_at DESC', params);
        return result.rows;
    }
    async getAnalyticsData(userId, dateRange) {
        let query = 'SELECT * FROM user_analytics WHERE user_id = $1';
        const params = [userId];
        if (dateRange) {
            query += ' AND created_at BETWEEN $2 AND $3';
            params.push(dateRange.startDate, dateRange.endDate);
        }
        const result = await database_1.db.query(query + ' ORDER BY created_at DESC', params);
        return result.rows;
    }
    async getEngagementMetrics(userId, dateRange) {
        let query = 'SELECT * FROM engagement_metrics WHERE user_id = $1';
        const params = [userId];
        if (dateRange) {
            query += ' AND created_at BETWEEN $2 AND $3';
            params.push(dateRange.startDate, dateRange.endDate);
        }
        const result = await database_1.db.query(query + ' ORDER BY created_at DESC', params);
        return result.rows;
    }
    async getUserGoals(userId) {
        const result = await database_1.db.query('SELECT * FROM user_goals WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        return result.rows;
    }
    async getUserProgress(userId, dateRange) {
        let query = 'SELECT * FROM user_progress WHERE user_id = $1';
        const params = [userId];
        if (dateRange) {
            query += ' AND created_at BETWEEN $2 AND $3';
            params.push(dateRange.startDate, dateRange.endDate);
        }
        const result = await database_1.db.query(query + ' ORDER BY created_at DESC', params);
        return result.rows;
    }
    async auditLog(log) {
        await redis_1.redis.zadd('data_export:audit_log', Date.now(), JSON.stringify(log));
        await redis_1.redis.zremrangebyrank('data_export:audit_log', 0, -100001);
        if (['EXPORT_FAILED', 'EXPORT_DOWNLOADED'].includes(log.action)) {
            logger_1.logger.info('Data export audit event:', log);
        }
    }
    async getAuditLogs(startTime, endTime, userId) {
        const start = startTime ? startTime.getTime() : '-inf';
        const end = endTime ? endTime.getTime() : '+inf';
        const logs = await redis_1.redis.zrangebyscore('data_export:audit_log', start, end);
        return logs
            .map(log => JSON.parse(log))
            .filter(log => !userId || log.userId === userId)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
}
exports.DataExportService = DataExportService;
exports.dataExportService = DataExportService.getInstance();
