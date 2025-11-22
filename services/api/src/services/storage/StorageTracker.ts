/**
 * Storage Tracker for Enterprise Organizations
 * Tracks file uploads, storage usage, and quota management
 */

import { Op } from 'sequelize';
import { logger } from '../../utils/logger';
import { getCacheService } from '../cache/UnifiedCacheService';

export interface StorageMetrics {
  organizationId?: string;
  userId?: string;
  fileId: string;
  fileName: string;
  fileSize: number; // in bytes
  fileType: string;
  storageProvider: 'local' | 's3' | 'gcs' | 'azure';
  storagePath: string;
  action: 'upload' | 'delete' | 'modify';
  timestamp: Date;
  metadata?: {
    contentType?: string;
    isPublic?: boolean;
    tags?: string[];
    category?: string;
  };
}

export interface StorageUsage {
  totalFiles: number;
  totalSize: number; // in bytes
  usedQuota: number; // in bytes
  availableQuota: number; // in bytes
  quotaPercentage: number;
  filesByType: Record<string, { count: number; size: number }>;
  recentUploads: Array<{
    fileName: string;
    size: number;
    uploadDate: Date;
    type: string;
  }>;
  largestFiles: Array<{
    fileName: string;
    size: number;
    uploadDate: Date;
  }>;
}

export interface StorageQuota {
  organizationId: string;
  totalQuota: number; // in bytes
  usedStorage: number; // in bytes
  fileQuota: number; // max number of files
  fileCount: number; // current file count
  maxFileSize: number; // max single file size in bytes
  allowedFileTypes: string[];
  isOverQuota: boolean;
}

export class StorageTracker {
  private static instance: StorageTracker;
  private cache = getCacheService();

  // Common file type categories
  private readonly fileTypeCategories = {
    images: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'],
    documents: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'],
    spreadsheets: ['xls', 'xlsx', 'csv', 'ods'],
    presentations: ['ppt', 'pptx', 'odp'],
    videos: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'],
    audio: ['mp3', 'wav', 'aac', 'ogg', 'wma'],
    archives: ['zip', 'rar', '7z', 'tar', 'gz'],
    code: ['js', 'ts', 'html', 'css', 'json', 'xml', 'py', 'java', 'cpp']
  };

  private constructor() {}

  static getInstance(): StorageTracker {
    if (!StorageTracker.instance) {
      StorageTracker.instance = new StorageTracker();
    }
    return StorageTracker.instance;
  }

  /**
   * Track a storage operation
   */
  async trackStorageOperation(metrics: StorageMetrics): Promise<void> {
    try {
      // Store in database for long-term tracking
      await this.storeInDatabase(metrics);

      // Update real-time counters in cache
      await this.updateStorageCounters(metrics);

      // Check quota limits
      if (metrics.organizationId) {
        await this.checkStorageQuota(metrics.organizationId);
      }

    } catch (error) {
      logger.error('Error tracking storage operation:', error);
    }
  }

  /**
   * Get storage usage for organization
   */
  async getStorageUsage(organizationId: string): Promise<StorageUsage> {
    try {
      const cacheKey = `storage_usage:${organizationId}`;
      const cached = await this.cache.get<StorageUsage>(cacheKey);

      if (cached) {
        return cached;
      }

      // Calculate from database and cache
      const usage = await this.calculateStorageUsage(organizationId);

      // Cache for 30 minutes
      await this.cache.set(cacheKey, usage, 1800);

      return usage;
    } catch (error) {
      logger.error('Error getting storage usage:', error);
      return this.getEmptyStorageUsage();
    }
  }

  /**
   * Get storage quota information
   */
  async getStorageQuota(organizationId: string): Promise<StorageQuota> {
    try {
      const cacheKey = `storage_quota:${organizationId}`;
      const cached = await this.cache.get<StorageQuota>(cacheKey);

      if (cached) {
        return cached;
      }

      const quota = await this.calculateStorageQuota(organizationId);

      // Cache for 1 hour
      await this.cache.set(cacheKey, quota, 3600);

      return quota;
    } catch (error) {
      logger.error('Error getting storage quota:', error);
      return this.getDefaultStorageQuota(organizationId);
    }
  }

  /**
   * Get current storage used for organization
   */
  async getCurrentStorageUsed(organizationId: string): Promise<number> {
    try {
      const cacheKey = `storage_used:${organizationId}`;
      const cached = await this.cache.get<number>(cacheKey);

      if (cached !== null) {
        return cached;
      }

      // Calculate from counters
      const used = await this.calculateCurrentStorageUsed(organizationId);

      // Cache for 10 minutes
      await this.cache.set(cacheKey, used, 600);

      return used;
    } catch (error) {
      logger.error('Error getting current storage used:', error);
      return 0;
    }
  }

  /**
   * Check if organization can upload a file
   */
  async canUploadFile(
    organizationId: string,
    fileSize: number,
    fileType: string
  ): Promise<{
    canUpload: boolean;
    reason?: string;
    quotaInfo: StorageQuota;
  }> {
    try {
      const quota = await this.getStorageQuota(organizationId);

      // Check file type
      if (quota.allowedFileTypes.length > 0 && !quota.allowedFileTypes.includes(fileType.toLowerCase())) {
        return {
          canUpload: false,
          reason: `File type '${fileType}' is not allowed`,
          quotaInfo: quota
        };
      }

      // Check file size limit
      if (fileSize > quota.maxFileSize) {
        return {
          canUpload: false,
          reason: `File size (${this.formatBytes(fileSize)}) exceeds maximum allowed size (${this.formatBytes(quota.maxFileSize)})`,
          quotaInfo: quota
        };
      }

      // Check storage quota
      if (quota.usedStorage + fileSize > quota.totalQuota) {
        return {
          canUpload: false,
          reason: `Storage quota exceeded. Need ${this.formatBytes(fileSize)} but only ${this.formatBytes(quota.totalQuota - quota.usedStorage)} available`,
          quotaInfo: quota
        };
      }

      // Check file count quota
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
    } catch (error) {
      logger.error('Error checking upload permissions:', error);
      return {
        canUpload: false,
        reason: 'Unable to verify storage quota',
        quotaInfo: this.getDefaultStorageQuota(organizationId)
      };
    }
  }

  /**
   * Get storage analytics and trends
   */
  async getStorageAnalytics(
    organizationId: string,
    days: number = 30
  ): Promise<{
    dailyUsage: Array<{ date: string; uploads: number; deletes: number; netStorage: number }>;
    fileTypeDistribution: Record<string, { count: number; size: number; percentage: number }>;
    topUsers: Array<{ userId: string; fileCount: number; storageUsed: number }>;
    storageGrowthRate: number; // bytes per day
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get daily usage trends
      const dailyUsage = await this.calculateDailyStorageUsage(organizationId, startDate, endDate);

      // Get file type distribution
      const fileTypeDistribution = await this.calculateFileTypeDistribution(organizationId);

      // Get top users
      const topUsers = await this.calculateTopStorageUsers(organizationId);

      // Calculate growth rate
      const storageGrowthRate = await this.calculateStorageGrowthRate(organizationId, days);

      return {
        dailyUsage,
        fileTypeDistribution,
        topUsers,
        storageGrowthRate
      };
    } catch (error) {
      logger.error('Error getting storage analytics:', error);
      return {
        dailyUsage: [],
        fileTypeDistribution: {},
        topUsers: [],
        storageGrowthRate: 0
      };
    }
  }

  /**
   * Store storage metrics in database
   */
  private async storeInDatabase(metrics: StorageMetrics): Promise<void> {
    try {
      // Create StorageLog model if it doesn't exist
      const { StorageLog } = await import('../../models/storage/StorageLog').catch(() => ({
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
      } else {
        // Fallback: store in cache
        const logKey = `storage_log:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
        await this.cache.set(logKey, metrics, 7 * 24 * 3600); // 7 days
      }
    } catch (error) {
      logger.error('Error storing storage metrics in database:', error);
    }
  }

  /**
   * Update storage counters in cache
   */
  private async updateStorageCounters(metrics: StorageMetrics): Promise<void> {
    if (!metrics.organizationId) return;

    const date = metrics.timestamp.toISOString().split('T')[0];
    const sizeChange = metrics.action === 'delete' ? -metrics.fileSize : metrics.fileSize;
    const fileCountChange = metrics.action === 'delete' ? -1 : (metrics.action === 'upload' ? 1 : 0);

    // Update organization totals
    const orgStorageKey = `storage_used:${metrics.organizationId}`;
    const orgFileCountKey = `file_count:${metrics.organizationId}`;

    await this.cache.incrBy(orgStorageKey, sizeChange);
    await this.cache.incrBy(orgFileCountKey, fileCountChange);

    // Set reasonable expiration
    await this.cache.expire(orgStorageKey, 24 * 3600);
    await this.cache.expire(orgFileCountKey, 24 * 3600);

    // Update daily counters
    const dailyStorageKey = `daily_storage:${metrics.organizationId}:${date}`;
    const dailyFileKey = `daily_files:${metrics.organizationId}:${date}`;

    await this.cache.incrBy(dailyStorageKey, sizeChange);
    await this.cache.incrBy(dailyFileKey, fileCountChange);

    await this.cache.expire(dailyStorageKey, 48 * 3600);
    await this.cache.expire(dailyFileKey, 48 * 3600);

    // Update file type counters
    const fileTypeKey = `file_type:${metrics.organizationId}:${metrics.fileType}`;
    await this.cache.incrBy(fileTypeKey, sizeChange);
    await this.cache.expire(fileTypeKey, 24 * 3600);

    // Update user storage counters
    if (metrics.userId) {
      const userStorageKey = `user_storage:${metrics.organizationId}:${metrics.userId}`;
      await this.cache.incrBy(userStorageKey, sizeChange);
      await this.cache.expire(userStorageKey, 24 * 3600);
    }
  }

  /**
   * Check storage quota and send alerts if needed
   */
  private async checkStorageQuota(organizationId: string): Promise<void> {
    try {
      const quota = await this.getStorageQuota(organizationId);

      if (quota.isOverQuota) {
        logger.warn('Organization exceeded storage quota', {
          organizationId,
          usedStorage: quota.usedStorage,
          totalQuota: quota.totalQuota
        });
      } else if (quota.usedStorage > quota.totalQuota * 0.9) {
        logger.warn('Organization approaching storage quota limit', {
          organizationId,
          usedStorage: quota.usedStorage,
          totalQuota: quota.totalQuota,
          percentage: (quota.usedStorage / quota.totalQuota * 100).toFixed(1)
        });
      }
    } catch (error) {
      logger.error('Error checking storage quota:', error);
    }
  }

  /**
   * Calculate storage usage from database and cache
   */
  private async calculateStorageUsage(organizationId: string): Promise<StorageUsage> {
    const totalSize = await this.getCurrentStorageUsed(organizationId);
    const fileCount = await this.cache.get<number>(`file_count:${organizationId}`) || 0;
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

  /**
   * Calculate storage quota for organization
   */
  private async calculateStorageQuota(organizationId: string): Promise<StorageQuota> {
    const usedStorage = await this.getCurrentStorageUsed(organizationId);
    const fileCount = await this.cache.get<number>(`file_count:${organizationId}`) || 0;

    // Default quotas - would typically come from organization settings
    const totalQuota = 10 * 1024 * 1024 * 1024; // 10GB default
    const fileQuota = 10000; // 10,000 files default
    const maxFileSize = 100 * 1024 * 1024; // 100MB default

    return {
      organizationId,
      totalQuota,
      usedStorage,
      fileQuota,
      fileCount,
      maxFileSize,
      allowedFileTypes: [], // Empty means all types allowed
      isOverQuota: usedStorage > totalQuota
    };
  }

  /**
   * Calculate current storage used from cache
   */
  private async calculateCurrentStorageUsed(organizationId: string): Promise<number> {
    const storageKey = `storage_used:${organizationId}`;
    return await this.cache.get<number>(storageKey) || 0;
  }

  /**
   * Get files by type distribution
   */
  private async getFilesByType(organizationId: string): Promise<Record<string, { count: number; size: number }>> {
    const fileTypes: Record<string, { count: number; size: number }> = {};

    // Get from cache counters
    for (const [category, extensions] of Object.entries(this.fileTypeCategories)) {
      let categorySize = 0;
      let categoryCount = 0;

      for (const ext of extensions) {
        const size = await this.cache.get<number>(`file_type:${organizationId}:${ext}`) || 0;
        if (size > 0) {
          categorySize += size;
          categoryCount += 1; // Simplified count
        }
      }

      if (categorySize > 0) {
        fileTypes[category] = { count: categoryCount, size: categorySize };
      }
    }

    return fileTypes;
  }

  /**
   * Get recent uploads (mocked for now)
   */
  private async getRecentUploads(organizationId: string): Promise<Array<{
    fileName: string;
    size: number;
    uploadDate: Date;
    type: string;
  }>> {
    // This would query the database for recent uploads
    // For now, return empty array
    return [];
  }

  /**
   * Get largest files (mocked for now)
   */
  private async getLargestFiles(organizationId: string): Promise<Array<{
    fileName: string;
    size: number;
    uploadDate: Date;
  }>> {
    // This would query the database for largest files
    // For now, return empty array
    return [];
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Get empty storage usage for error cases
   */
  private getEmptyStorageUsage(): StorageUsage {
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

  /**
   * Get default storage quota
   */
  private getDefaultStorageQuota(organizationId: string): StorageQuota {
    return {
      organizationId,
      totalQuota: 10 * 1024 * 1024 * 1024, // 10GB
      usedStorage: 0,
      fileQuota: 10000,
      fileCount: 0,
      maxFileSize: 100 * 1024 * 1024, // 100MB
      allowedFileTypes: [],
      isOverQuota: false
    };
  }

  /**
   * Calculate daily storage usage trends
   */
  private async calculateDailyStorageUsage(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ date: string; uploads: number; deletes: number; netStorage: number }>> {
    const trends = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const storageChange = await this.cache.get<number>(`daily_storage:${organizationId}:${dateStr}`) || 0;
      const fileChange = await this.cache.get<number>(`daily_files:${organizationId}:${dateStr}`) || 0;

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

  /**
   * Calculate file type distribution
   */
  private async calculateFileTypeDistribution(organizationId: string): Promise<Record<string, { count: number; size: number; percentage: number }>> {
    const filesByType = await this.getFilesByType(organizationId);
    const totalSize = Object.values(filesByType).reduce((sum, type) => sum + type.size, 0);

    const distribution: Record<string, { count: number; size: number; percentage: number }> = {};

    for (const [type, data] of Object.entries(filesByType)) {
      distribution[type] = {
        count: data.count,
        size: data.size,
        percentage: totalSize > 0 ? (data.size / totalSize) * 100 : 0
      };
    }

    return distribution;
  }

  /**
   * Calculate top storage users
   */
  private async calculateTopStorageUsers(organizationId: string): Promise<Array<{ userId: string; fileCount: number; storageUsed: number }>> {
    // This would query user storage data from cache/database
    // For now, return empty array
    return [];
  }

  /**
   * Calculate storage growth rate
   */
  private async calculateStorageGrowthRate(organizationId: string, days: number): Promise<number> {
    // This would calculate the average daily growth rate
    // For now, return 0
    return 0;
  }
}

// Export singleton instance
export const storageTracker = StorageTracker.getInstance();