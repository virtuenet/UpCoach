"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageTracker = exports.StorageTracker = void 0;
const logger_1 = require("../../utils/logger");
const UnifiedCacheService_1 = require("../cache/UnifiedCacheService");
class StorageTracker {
    static instance;
    cache = (0, UnifiedCacheService_1.getCacheService)();
    fileTypeCategories = {
        images: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'],
        documents: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'],
        spreadsheets: ['xls', 'xlsx', 'csv', 'ods'],
        presentations: ['ppt', 'pptx', 'odp'],
        videos: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'],
        audio: ['mp3', 'wav', 'aac', 'ogg', 'wma'],
        archives: ['zip', 'rar', '7z', 'tar', 'gz'],
        code: ['js', 'ts', 'html', 'css', 'json', 'xml', 'py', 'java', 'cpp']
    };
    constructor() { }
    static getInstance() {
        if (!StorageTracker.instance) {
            StorageTracker.instance = new StorageTracker();
        }
        return StorageTracker.instance;
    }
    async trackStorageOperation(metrics) {
        try {
            await this.storeInDatabase(metrics);
            await this.updateStorageCounters(metrics);
            if (metrics.organizationId) {
                await this.checkStorageQuota(metrics.organizationId);
            }
        }
        catch (error) {
            logger_1.logger.error('Error tracking storage operation:', error);
        }
    }
    async getStorageUsage(organizationId) {
        try {
            const cacheKey = `storage_usage:${organizationId}`;
            const cached = await this.cache.get(cacheKey);
            if (cached) {
                return cached;
            }
            const usage = await this.calculateStorageUsage(organizationId);
            await this.cache.set(cacheKey, usage, 1800);
            return usage;
        }
        catch (error) {
            logger_1.logger.error('Error getting storage usage:', error);
            return this.getEmptyStorageUsage();
        }
    }
    async getStorageQuota(organizationId) {
        try {
            const cacheKey = `storage_quota:${organizationId}`;
            const cached = await this.cache.get(cacheKey);
            if (cached) {
                return cached;
            }
            const quota = await this.calculateStorageQuota(organizationId);
            await this.cache.set(cacheKey, quota, 3600);
            return quota;
        }
        catch (error) {
            logger_1.logger.error('Error getting storage quota:', error);
            return this.getDefaultStorageQuota(organizationId);
        }
    }
    async getCurrentStorageUsed(organizationId) {
        try {
            const cacheKey = `storage_used:${organizationId}`;
            const cached = await this.cache.get(cacheKey);
            if (cached !== null) {
                return cached;
            }
            const used = await this.calculateCurrentStorageUsed(organizationId);
            await this.cache.set(cacheKey, used, 600);
            return used;
        }
        catch (error) {
            logger_1.logger.error('Error getting current storage used:', error);
            return 0;
        }
    }
    async canUploadFile(organizationId, fileSize, fileType) {
        try {
            const quota = await this.getStorageQuota(organizationId);
            if (quota.allowedFileTypes.length > 0 && !quota.allowedFileTypes.includes(fileType.toLowerCase())) {
                return {
                    canUpload: false,
                    reason: `File type '${fileType}' is not allowed`,
                    quotaInfo: quota
                };
            }
            if (fileSize > quota.maxFileSize) {
                return {
                    canUpload: false,
                    reason: `File size (${this.formatBytes(fileSize)}) exceeds maximum allowed size (${this.formatBytes(quota.maxFileSize)})`,
                    quotaInfo: quota
                };
            }
            if (quota.usedStorage + fileSize > quota.totalQuota) {
                return {
                    canUpload: false,
                    reason: `Storage quota exceeded. Need ${this.formatBytes(fileSize)} but only ${this.formatBytes(quota.totalQuota - quota.usedStorage)} available`,
                    quotaInfo: quota
                };
            }
            if (quota.fileCount >= quota.fileQuota) {
                return {
                    canUpload: false,
                    reason: `File count limit reached (${quota.fileCount}/${quota.fileQuota})`,
                    quotaInfo: quota
                };
            }
            return {
                canUpload: true,
                quotaInfo: quota
            };
        }
        catch (error) {
            logger_1.logger.error('Error checking upload permissions:', error);
            return {
                canUpload: false,
                reason: 'Unable to verify storage quota',
                quotaInfo: this.getDefaultStorageQuota(organizationId)
            };
        }
    }
    async getStorageAnalytics(organizationId, days = 30) {
        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            const dailyUsage = await this.calculateDailyStorageUsage(organizationId, startDate, endDate);
            const fileTypeDistribution = await this.calculateFileTypeDistribution(organizationId);
            const topUsers = await this.calculateTopStorageUsers(organizationId);
            const storageGrowthRate = await this.calculateStorageGrowthRate(organizationId, days);
            return {
                dailyUsage,
                fileTypeDistribution,
                topUsers,
                storageGrowthRate
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting storage analytics:', error);
            return {
                dailyUsage: [],
                fileTypeDistribution: {},
                topUsers: [],
                storageGrowthRate: 0
            };
        }
    }
    async storeInDatabase(metrics) {
        try {
            const { StorageLog } = await Promise.resolve().then(() => __importStar(require('../../models/storage/StorageLog'))).catch(() => ({
                StorageLog: null
            }));
            if (StorageLog) {
                await StorageLog.create({
                    organizationId: metrics.organizationId,
                    userId: metrics.userId,
                    fileId: metrics.fileId,
                    fileName: metrics.fileName,
                    fileSize: metrics.fileSize,
                    fileType: metrics.fileType,
                    storageProvider: metrics.storageProvider,
                    storagePath: metrics.storagePath,
                    action: metrics.action,
                    timestamp: metrics.timestamp,
                    metadata: metrics.metadata || {},
                });
            }
            else {
                const logKey = `storage_log:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
                await this.cache.set(logKey, metrics, 7 * 24 * 3600);
            }
        }
        catch (error) {
            logger_1.logger.error('Error storing storage metrics in database:', error);
        }
    }
    async updateStorageCounters(metrics) {
        if (!metrics.organizationId)
            return;
        const date = metrics.timestamp.toISOString().split('T')[0];
        const sizeChange = metrics.action === 'delete' ? -metrics.fileSize : metrics.fileSize;
        const fileCountChange = metrics.action === 'delete' ? -1 : (metrics.action === 'upload' ? 1 : 0);
        const orgStorageKey = `storage_used:${metrics.organizationId}`;
        const orgFileCountKey = `file_count:${metrics.organizationId}`;
        await this.cache.incrBy(orgStorageKey, sizeChange);
        await this.cache.incrBy(orgFileCountKey, fileCountChange);
        await this.cache.expire(orgStorageKey, 24 * 3600);
        await this.cache.expire(orgFileCountKey, 24 * 3600);
        const dailyStorageKey = `daily_storage:${metrics.organizationId}:${date}`;
        const dailyFileKey = `daily_files:${metrics.organizationId}:${date}`;
        await this.cache.incrBy(dailyStorageKey, sizeChange);
        await this.cache.incrBy(dailyFileKey, fileCountChange);
        await this.cache.expire(dailyStorageKey, 48 * 3600);
        await this.cache.expire(dailyFileKey, 48 * 3600);
        const fileTypeKey = `file_type:${metrics.organizationId}:${metrics.fileType}`;
        await this.cache.incrBy(fileTypeKey, sizeChange);
        await this.cache.expire(fileTypeKey, 24 * 3600);
        if (metrics.userId) {
            const userStorageKey = `user_storage:${metrics.organizationId}:${metrics.userId}`;
            await this.cache.incrBy(userStorageKey, sizeChange);
            await this.cache.expire(userStorageKey, 24 * 3600);
        }
    }
    async checkStorageQuota(organizationId) {
        try {
            const quota = await this.getStorageQuota(organizationId);
            if (quota.isOverQuota) {
                logger_1.logger.warn('Organization exceeded storage quota', {
                    organizationId,
                    usedStorage: quota.usedStorage,
                    totalQuota: quota.totalQuota
                });
            }
            else if (quota.usedStorage > quota.totalQuota * 0.9) {
                logger_1.logger.warn('Organization approaching storage quota limit', {
                    organizationId,
                    usedStorage: quota.usedStorage,
                    totalQuota: quota.totalQuota,
                    percentage: (quota.usedStorage / quota.totalQuota * 100).toFixed(1)
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Error checking storage quota:', error);
        }
    }
    async calculateStorageUsage(organizationId) {
        const totalSize = await this.getCurrentStorageUsed(organizationId);
        const fileCount = await this.cache.get(`file_count:${organizationId}`) || 0;
        const quota = await this.getStorageQuota(organizationId);
        return {
            totalFiles: fileCount,
            totalSize,
            usedQuota: totalSize,
            availableQuota: quota.totalQuota - totalSize,
            quotaPercentage: (totalSize / quota.totalQuota) * 100,
            filesByType: await this.getFilesByType(organizationId),
            recentUploads: await this.getRecentUploads(organizationId),
            largestFiles: await this.getLargestFiles(organizationId)
        };
    }
    async calculateStorageQuota(organizationId) {
        const usedStorage = await this.getCurrentStorageUsed(organizationId);
        const fileCount = await this.cache.get(`file_count:${organizationId}`) || 0;
        const totalQuota = 10 * 1024 * 1024 * 1024;
        const fileQuota = 10000;
        const maxFileSize = 100 * 1024 * 1024;
        return {
            organizationId,
            totalQuota,
            usedStorage,
            fileQuota,
            fileCount,
            maxFileSize,
            allowedFileTypes: [],
            isOverQuota: usedStorage > totalQuota
        };
    }
    async calculateCurrentStorageUsed(organizationId) {
        const storageKey = `storage_used:${organizationId}`;
        return await this.cache.get(storageKey) || 0;
    }
    async getFilesByType(organizationId) {
        const fileTypes = {};
        for (const [category, extensions] of Object.entries(this.fileTypeCategories)) {
            let categorySize = 0;
            let categoryCount = 0;
            for (const ext of extensions) {
                const size = await this.cache.get(`file_type:${organizationId}:${ext}`) || 0;
                if (size > 0) {
                    categorySize += size;
                    categoryCount += 1;
                }
            }
            if (categorySize > 0) {
                fileTypes[category] = { count: categoryCount, size: categorySize };
            }
        }
        return fileTypes;
    }
    async getRecentUploads(organizationId) {
        return [];
    }
    async getLargestFiles(organizationId) {
        return [];
    }
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
    getEmptyStorageUsage() {
        return {
            totalFiles: 0,
            totalSize: 0,
            usedQuota: 0,
            availableQuota: 0,
            quotaPercentage: 0,
            filesByType: {},
            recentUploads: [],
            largestFiles: []
        };
    }
    getDefaultStorageQuota(organizationId) {
        return {
            organizationId,
            totalQuota: 10 * 1024 * 1024 * 1024,
            usedStorage: 0,
            fileQuota: 10000,
            fileCount: 0,
            maxFileSize: 100 * 1024 * 1024,
            allowedFileTypes: [],
            isOverQuota: false
        };
    }
    async calculateDailyStorageUsage(organizationId, startDate, endDate) {
        const trends = [];
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const storageChange = await this.cache.get(`daily_storage:${organizationId}:${dateStr}`) || 0;
            const fileChange = await this.cache.get(`daily_files:${organizationId}:${dateStr}`) || 0;
            trends.push({
                date: dateStr,
                uploads: Math.max(0, fileChange),
                deletes: Math.max(0, -fileChange),
                netStorage: storageChange
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return trends;
    }
    async calculateFileTypeDistribution(organizationId) {
        const filesByType = await this.getFilesByType(organizationId);
        const totalSize = Object.values(filesByType).reduce((sum, type) => sum + type.size, 0);
        const distribution = {};
        for (const [type, data] of Object.entries(filesByType)) {
            distribution[type] = {
                count: data.count,
                size: data.size,
                percentage: totalSize > 0 ? (data.size / totalSize) * 100 : 0
            };
        }
        return distribution;
    }
    async calculateTopStorageUsers(organizationId) {
        return [];
    }
    async calculateStorageGrowthRate(organizationId, days) {
        return 0;
    }
}
exports.StorageTracker = StorageTracker;
exports.storageTracker = StorageTracker.getInstance();
//# sourceMappingURL=StorageTracker.js.map