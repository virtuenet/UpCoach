/**
 * Voice Journal Local Storage Service
 * Handles local storage operations, offline functionality, and sync mechanisms
 * @author UpCoach Architecture Team
 */

import fs from 'fs';
import path from 'path';
import { VoiceJournalEntry } from '../models/VoiceJournalEntry';
import { VoiceJournalService } from './VoiceJournalService';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/apiError';

interface LocalStorageConfig {
  basePath: string;
  audioPath: string;
  tempPath: string;
  maxFileSize: number;
  allowedFormats: string[];
}

interface OfflineEntry {
  id: string;
  userId: string;
  data: unknown;
  audioFile?: Buffer;
  status: 'pending' | 'synced' | 'failed' | 'conflict';
  createdAt: Date;
  lastAttempt?: Date;
  attempts: number;
}

interface SyncResult {
  uploaded: number;
  downloaded: number;
  conflicts: number;
  resolved: number;
  errors: Array<{ id: string; error: string }>;
  timestamp: Date;
}

export class VoiceJournalLocalStorageService extends VoiceJournalService {
  private config: LocalStorageConfig;
  private offlineQueue: Map<string, OfflineEntry> = new Map();
  private syncInProgress = false;

  constructor(config?: Partial<LocalStorageConfig>) {
    super();

    this.config = {
      basePath: config?.basePath || './storage/voice-journal',
      audioPath: config?.audioPath || './storage/voice-journal/audio',
      tempPath: config?.tempPath || './storage/voice-journal/temp',
      maxFileSize: config?.maxFileSize || 50 * 1024 * 1024, // 50MB
      allowedFormats: config?.allowedFormats || ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.webm']
    };

    this.initializeStorageDirectories();
    this.loadOfflineQueue();
  }

  /**
   * Initialize storage directories
   */
  private initializeStorageDirectories(): void {
    const directories = [
      this.config.basePath,
      this.config.audioPath,
      this.config.tempPath,
      path.join(this.config.basePath, 'offline'),
      path.join(this.config.basePath, 'metadata')
    ];

    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info('Created storage directory:', dir);
      }
    });
  }

  /**
   * Store audio file locally with metadata
   */
  async storeAudioFileLocal(
    entryId: string,
    userId: string,
    audioBuffer: Buffer,
    filename: string,
    metadata?: unknown
  ): Promise<string> {
    try {
      // Validate file format
      const ext = path.extname(filename).toLowerCase();
      if (!this.config.allowedFormats.includes(ext)) {
        throw new ApiError(400, `Unsupported audio format: ${ext}`);
      }

      // Validate file size
      if (audioBuffer.length > this.config.maxFileSize) {
        throw new ApiError(400, `File size exceeds limit: ${audioBuffer.length} bytes`);
      }

      // Create user-specific directory
      const userAudioPath = path.join(this.config.audioPath, userId);
      if (!fs.existsSync(userAudioPath)) {
        fs.mkdirSync(userAudioPath, { recursive: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      const localFilename = `${entryId}_${timestamp}_${sanitizedFilename}`;
      const localPath = path.join(userAudioPath, localFilename);

      // Write audio file
      fs.writeFileSync(localPath, audioBuffer);

      // Store metadata
      const metadataPath = path.join(this.config.basePath, 'metadata', `${entryId}.json`);
      const audioMetadata = {
        entryId,
        userId,
        originalFilename: filename,
        localFilename,
        localPath,
        size: audioBuffer.length,
        format: ext,
        storedAt: new Date(),
        metadata: metadata || {},
        checksum: this.generateChecksum(audioBuffer)
      };

      fs.writeFileSync(metadataPath, JSON.stringify(audioMetadata, null, 2));

      logger.info('Audio file stored locally:', { entryId, userId, localPath, size: audioBuffer.length });

      return localPath;

    } catch (error) {
      logger.error('Error storing audio file locally:', error);
      throw error instanceof ApiError ? error : new ApiError(500, 'Failed to store audio file locally');
    }
  }

  /**
   * Retrieve audio file from local storage
   */
  async getAudioFileLocal(entryId: string, userId: string): Promise<{
    buffer: Buffer;
    metadata: unknown;
    filename: string;
  } | null> {
    try {
      const metadataPath = path.join(this.config.basePath, 'metadata', `${entryId}.json`);

      if (!fs.existsSync(metadataPath)) {
        return null;
      }

      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

      if (metadata.userId !== userId) {
        throw new ApiError(403, 'Access denied');
      }

      if (!fs.existsSync(metadata.localPath)) {
        logger.warn('Audio file missing from local storage:', metadata.localPath);
        return null;
      }

      const buffer = fs.readFileSync(metadata.localPath);

      // Verify integrity
      const currentChecksum = this.generateChecksum(buffer);
      if (currentChecksum !== metadata.checksum) {
        logger.error('Audio file integrity check failed:', { entryId, userId });
        throw new ApiError(500, 'Audio file corrupted');
      }

      return {
        buffer,
        metadata,
        filename: metadata.originalFilename
      };

    } catch (error) {
      logger.error('Error getting audio file locally:', error);
      throw error instanceof ApiError ? error : new ApiError(500, 'Failed to get audio file');
    }
  }

  /**
   * Store entry for offline access
   */
  async storeOfflineEntry(userId: string, entryData: unknown, audioBuffer?: Buffer): Promise<string> {
    try {
      const entryId = entryData.id || this.generateId();

      const offlineEntry: OfflineEntry = {
        id: entryId,
        userId,
        data: { ...entryData, id: entryId },
        audioFile: audioBuffer,
        status: 'pending',
        createdAt: new Date(),
        attempts: 0
      };

      // Store in memory queue
      this.offlineQueue.set(entryId, offlineEntry);

      // Persist to disk
      const offlinePath = path.join(this.config.basePath, 'offline', `${entryId}.json`);
      const offlineData = {
        ...offlineEntry,
        audioFile: audioBuffer ? { size: audioBuffer.length, stored: true } : undefined
      };

      fs.writeFileSync(offlinePath, JSON.stringify(offlineData, null, 2));

      // Store audio file separately if provided
      if (audioBuffer) {
        const audioPath = path.join(this.config.basePath, 'offline', `${entryId}.audio`);
        fs.writeFileSync(audioPath, audioBuffer);
      }

      logger.info('Entry stored for offline sync:', { entryId, userId });

      return entryId;

    } catch (error) {
      logger.error('Error storing offline entry:', error);
      throw new ApiError(500, 'Failed to store offline entry');
    }
  }

  /**
   * Get offline entries for user
   */
  async getOfflineEntries(userId: string): Promise<any[]> {
    try {
      const userEntries = Array.from(this.offlineQueue.values())
        .filter(entry => entry.userId === userId)
        .map(entry => ({
          ...entry.data,
          offlineStatus: entry.status,
          createdOfflineAt: entry.createdAt,
          syncAttempts: entry.attempts
        }));

      return userEntries;

    } catch (error) {
      logger.error('Error getting offline entries:', error);
      throw new ApiError(500, 'Failed to get offline entries');
    }
  }

  /**
   * Sync offline entries with server
   */
  async syncOfflineEntries(userId: string, forceSync = false): Promise<SyncResult> {
    if (this.syncInProgress && !forceSync) {
      throw new ApiError(409, 'Sync already in progress');
    }

    this.syncInProgress = true;

    try {
      const result: SyncResult = {
        uploaded: 0,
        downloaded: 0,
        conflicts: 0,
        resolved: 0,
        errors: [],
        timestamp: new Date()
      };

      // Get user's offline entries
      const offlineEntries = Array.from(this.offlineQueue.values())
        .filter(entry => entry.userId === userId && entry.status === 'pending');

      logger.info(`Starting sync for ${offlineEntries.length} offline entries`);

      for (const offlineEntry of offlineEntries) {
        try {
          // Check if entry exists on server
          const existingEntry = await this.getEntry(offlineEntry.id, userId);

          if (existingEntry) {
            // Handle conflict
            const resolution = await this.resolveConflict(
              userId,
              offlineEntry.id,
              'merge',
              this.mergeEntries(existingEntry, offlineEntry.data)
            );

            if (resolution) {
              result.conflicts++;
              result.resolved++;
            }
          } else {
            // Upload new entry
            await this.createEntry(offlineEntry.data);

            // Upload audio file if exists
            if (offlineEntry.audioFile) {
              const audioPath = await this.storeAudioFileLocal(
                offlineEntry.id,
                userId,
                offlineEntry.audioFile,
                `${offlineEntry.id}.audio`
              );

              await this.updateEntry(offlineEntry.id, userId, { audioFilePath: audioPath });
            }

            result.uploaded++;
          }

          // Mark as synced
          offlineEntry.status = 'synced';
          this.offlineQueue.set(offlineEntry.id, offlineEntry);

        } catch (error) {
          offlineEntry.status = 'failed';
          offlineEntry.attempts++;
          offlineEntry.lastAttempt = new Date();

          result.errors.push({
            id: offlineEntry.id,
            error: (error as Error).message
          });

          logger.error('Sync error for entry:', {
            entryId: offlineEntry.id,
            error: (error as Error).message
          });
        }
      }

      // Download recent server changes
      try {
        const lastSync = await this.getLastSyncTimestamp(userId);
        const serverChanges = await this.getChangesSince(userId, lastSync);

        for (const serverEntry of serverChanges.entries) {
          const localEntry = this.offlineQueue.get(serverEntry.id);

          if (!localEntry) {
            // New entry from server
            await this.storeEntryLocally(serverEntry);
            result.downloaded++;
          }
        }

        await this.setLastSyncTimestamp(userId, result.timestamp);

      } catch (error) {
        logger.error('Error downloading server changes:', error);
      }

      // Clean up successfully synced entries
      await this.cleanupSyncedEntries();

      logger.info('Sync completed:', result);

      return result;

    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Store cache of entries locally for offline access
   */
  async cacheEntriesLocally(userId: string, entries: VoiceJournalEntry[]): Promise<void> {
    try {
      const cachePath = path.join(this.config.basePath, 'cache', `${userId}.json`);
      const cacheDir = path.dirname(cachePath);

      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const cacheData = {
        userId,
        entries,
        cachedAt: new Date(),
        version: '1.0'
      };

      fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2));

      logger.info('Entries cached locally:', { userId, count: entries.length });

    } catch (error) {
      logger.error('Error caching entries locally:', error);
      throw new ApiError(500, 'Failed to cache entries');
    }
  }

  /**
   * Get cached entries from local storage
   */
  async getCachedEntries(userId: string): Promise<VoiceJournalEntry[]> {
    try {
      const cachePath = path.join(this.config.basePath, 'cache', `${userId}.json`);

      if (!fs.existsSync(cachePath)) {
        return [];
      }

      const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));

      // Check cache age (24 hours)
      const cacheAge = Date.now() - new Date(cacheData.cachedAt).getTime();
      const maxCacheAge = 24 * 60 * 60 * 1000; // 24 hours

      if (cacheAge > maxCacheAge) {
        logger.info('Cache expired, returning empty array:', { userId, cacheAge });
        return [];
      }

      return cacheData.entries || [];

    } catch (error) {
      logger.error('Error getting cached entries:', error);
      return [];
    }
  }

  /**
   * Purge old local data
   */
  async purgeOldData(olderThanDays = 90): Promise<{
    audioFiles: number;
    metadataFiles: number;
    cacheFiles: number;
    offlineEntries: number;
  }> {
    try {
      const cutoffDate = new Date(Date.now() - (olderThanDays * 24 * 60 * 60 * 1000));
      let purgedCount = { audioFiles: 0, metadataFiles: 0, cacheFiles: 0, offlineEntries: 0 };

      // Purge old audio files
      const audioDir = this.config.audioPath;
      if (fs.existsSync(audioDir)) {
        const userDirs = fs.readdirSync(audioDir);

        for (const userDir of userDirs) {
          const userPath = path.join(audioDir, userDir);
          if (fs.statSync(userPath).isDirectory()) {
            const files = fs.readdirSync(userPath);

            for (const file of files) {
              const filePath = path.join(userPath, file);
              const stats = fs.statSync(filePath);

              if (stats.mtime < cutoffDate) {
                fs.unlinkSync(filePath);
                purgedCount.audioFiles++;
              }
            }
          }
        }
      }

      // Purge old metadata files
      const metadataDir = path.join(this.config.basePath, 'metadata');
      if (fs.existsSync(metadataDir)) {
        const metadataFiles = fs.readdirSync(metadataDir);

        for (const file of metadataFiles) {
          const filePath = path.join(metadataDir, file);
          const stats = fs.statSync(filePath);

          if (stats.mtime < cutoffDate) {
            fs.unlinkSync(filePath);
            purgedCount.metadataFiles++;
          }
        }
      }

      // Purge old cache files
      const cacheDir = path.join(this.config.basePath, 'cache');
      if (fs.existsSync(cacheDir)) {
        const cacheFiles = fs.readdirSync(cacheDir);

        for (const file of cacheFiles) {
          const filePath = path.join(cacheDir, file);
          const stats = fs.statSync(filePath);

          if (stats.mtime < cutoffDate) {
            fs.unlinkSync(filePath);
            purgedCount.cacheFiles++;
          }
        }
      }

      // Purge old offline entries
      const offlineDir = path.join(this.config.basePath, 'offline');
      if (fs.existsSync(offlineDir)) {
        const offlineFiles = fs.readdirSync(offlineDir);

        for (const file of offlineFiles) {
          const filePath = path.join(offlineDir, file);
          const stats = fs.statSync(filePath);

          if (stats.mtime < cutoffDate) {
            // Remove from queue if exists
            const entryId = path.basename(file, path.extname(file));
            this.offlineQueue.delete(entryId);

            fs.unlinkSync(filePath);
            purgedCount.offlineEntries++;
          }
        }
      }

      logger.info('Purged old data:', purgedCount);

      return purgedCount;

    } catch (error) {
      logger.error('Error purging old data:', error);
      throw new ApiError(500, 'Failed to purge old data');
    }
  }

  // ============= Private Helper Methods =============

  private generateChecksum(buffer: Buffer): string {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(buffer).digest('hex');
  }

  private generateId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadOfflineQueue(): void {
    try {
      const offlineDir = path.join(this.config.basePath, 'offline');

      if (!fs.existsSync(offlineDir)) {
        return;
      }

      const files = fs.readdirSync(offlineDir)
        .filter(file => file.endsWith('.json'));

      for (const file of files) {
        try {
          const filePath = path.join(offlineDir, file);
          const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

          // Load audio file if exists
          const audioPath = path.join(offlineDir, `${data.id}.audio`);
          if (fs.existsSync(audioPath)) {
            data.audioFile = fs.readFileSync(audioPath);
          }

          this.offlineQueue.set(data.id, data);
        } catch (error) {
          logger.error('Error loading offline entry:', { file, error });
        }
      }

      logger.info('Loaded offline queue:', { count: this.offlineQueue.size });

    } catch (error) {
      logger.error('Error loading offline queue:', error);
    }
  }

  private mergeEntries(serverEntry: unknown, localEntry: unknown): unknown {
    // Simple merge strategy - prefer local changes for content, server for metadata
    return {
      ...serverEntry,
      title: localEntry.title || serverEntry.title,
      transcriptionText: localEntry.transcriptionText || serverEntry.transcriptionText,
      summary: localEntry.summary || serverEntry.summary,
      tags: [...new Set([...(serverEntry.tags || []), ...(localEntry.tags || [])])],
      emotionalTone: localEntry.emotionalTone || serverEntry.emotionalTone,
      isFavorite: localEntry.isFavorite !== undefined ? localEntry.isFavorite : serverEntry.isFavorite,
      updatedAt: new Date()
    };
  }

  private async storeEntryLocally(entry: unknown): Promise<void> {
    const cachePath = path.join(this.config.basePath, 'local', `${entry.id}.json`);
    const cacheDir = path.dirname(cachePath);

    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    fs.writeFileSync(cachePath, JSON.stringify(entry, null, 2));
  }

  private async getLastSyncTimestamp(userId: string): Promise<Date> {
    try {
      const syncPath = path.join(this.config.basePath, 'sync', `${userId}.json`);

      if (fs.existsSync(syncPath)) {
        const syncData = JSON.parse(fs.readFileSync(syncPath, 'utf-8'));
        return new Date(syncData.lastSync);
      }

      return new Date(0); // Beginning of time
    } catch {
      return new Date(0);
    }
  }

  private async setLastSyncTimestamp(userId: string, timestamp: Date): Promise<void> {
    const syncDir = path.join(this.config.basePath, 'sync');
    const syncPath = path.join(syncDir, `${userId}.json`);

    if (!fs.existsSync(syncDir)) {
      fs.mkdirSync(syncDir, { recursive: true });
    }

    const syncData = { userId, lastSync: timestamp };
    fs.writeFileSync(syncPath, JSON.stringify(syncData, null, 2));
  }

  private async cleanupSyncedEntries(): Promise<void> {
    const syncedEntries = Array.from(this.offlineQueue.entries())
      .filter(([_, entry]) => entry.status === 'synced');

    for (const [entryId, entry] of syncedEntries) {
      try {
        // Remove from queue
        this.offlineQueue.delete(entryId);

        // Remove files
        const jsonPath = path.join(this.config.basePath, 'offline', `${entryId}.json`);
        const audioPath = path.join(this.config.basePath, 'offline', `${entryId}.audio`);

        if (fs.existsSync(jsonPath)) {
          fs.unlinkSync(jsonPath);
        }

        if (fs.existsSync(audioPath)) {
          fs.unlinkSync(audioPath);
        }

      } catch (error) {
        logger.error('Error cleaning up synced entry:', { entryId, error });
      }
    }
  }
}

// Export singleton instance
export const voiceJournalLocalStorageService = new VoiceJournalLocalStorageService();