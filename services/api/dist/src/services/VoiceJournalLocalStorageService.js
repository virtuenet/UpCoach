"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.voiceJournalLocalStorageService = exports.VoiceJournalLocalStorageService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const VoiceJournalService_1 = require("./VoiceJournalService");
const logger_1 = require("../utils/logger");
const apiError_1 = require("../utils/apiError");
class VoiceJournalLocalStorageService extends VoiceJournalService_1.VoiceJournalService {
    config;
    offlineQueue = new Map();
    syncInProgress = false;
    constructor(config) {
        super();
        this.config = {
            basePath: config?.basePath || './storage/voice-journal',
            audioPath: config?.audioPath || './storage/voice-journal/audio',
            tempPath: config?.tempPath || './storage/voice-journal/temp',
            maxFileSize: config?.maxFileSize || 50 * 1024 * 1024,
            allowedFormats: config?.allowedFormats || ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.webm']
        };
        this.initializeStorageDirectories();
        this.loadOfflineQueue();
    }
    initializeStorageDirectories() {
        const directories = [
            this.config.basePath,
            this.config.audioPath,
            this.config.tempPath,
            path_1.default.join(this.config.basePath, 'offline'),
            path_1.default.join(this.config.basePath, 'metadata')
        ];
        directories.forEach(dir => {
            if (!fs_1.default.existsSync(dir)) {
                fs_1.default.mkdirSync(dir, { recursive: true });
                logger_1.logger.info('Created storage directory:', dir);
            }
        });
    }
    async storeAudioFileLocal(entryId, userId, audioBuffer, filename, metadata) {
        try {
            const ext = path_1.default.extname(filename).toLowerCase();
            if (!this.config.allowedFormats.includes(ext)) {
                throw new apiError_1.ApiError(400, `Unsupported audio format: ${ext}`);
            }
            if (audioBuffer.length > this.config.maxFileSize) {
                throw new apiError_1.ApiError(400, `File size exceeds limit: ${audioBuffer.length} bytes`);
            }
            const userAudioPath = path_1.default.join(this.config.audioPath, userId);
            if (!fs_1.default.existsSync(userAudioPath)) {
                fs_1.default.mkdirSync(userAudioPath, { recursive: true });
            }
            const timestamp = Date.now();
            const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
            const localFilename = `${entryId}_${timestamp}_${sanitizedFilename}`;
            const localPath = path_1.default.join(userAudioPath, localFilename);
            fs_1.default.writeFileSync(localPath, audioBuffer);
            const metadataPath = path_1.default.join(this.config.basePath, 'metadata', `${entryId}.json`);
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
            fs_1.default.writeFileSync(metadataPath, JSON.stringify(audioMetadata, null, 2));
            logger_1.logger.info('Audio file stored locally:', { entryId, userId, localPath, size: audioBuffer.length });
            return localPath;
        }
        catch (error) {
            logger_1.logger.error('Error storing audio file locally:', error);
            throw error instanceof apiError_1.ApiError ? error : new apiError_1.ApiError(500, 'Failed to store audio file locally');
        }
    }
    async getAudioFileLocal(entryId, userId) {
        try {
            const metadataPath = path_1.default.join(this.config.basePath, 'metadata', `${entryId}.json`);
            if (!fs_1.default.existsSync(metadataPath)) {
                return null;
            }
            const metadata = JSON.parse(fs_1.default.readFileSync(metadataPath, 'utf-8'));
            if (metadata.userId !== userId) {
                throw new apiError_1.ApiError(403, 'Access denied');
            }
            if (!fs_1.default.existsSync(metadata.localPath)) {
                logger_1.logger.warn('Audio file missing from local storage:', metadata.localPath);
                return null;
            }
            const buffer = fs_1.default.readFileSync(metadata.localPath);
            const currentChecksum = this.generateChecksum(buffer);
            if (currentChecksum !== metadata.checksum) {
                logger_1.logger.error('Audio file integrity check failed:', { entryId, userId });
                throw new apiError_1.ApiError(500, 'Audio file corrupted');
            }
            return {
                buffer,
                metadata,
                filename: metadata.originalFilename
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting audio file locally:', error);
            throw error instanceof apiError_1.ApiError ? error : new apiError_1.ApiError(500, 'Failed to get audio file');
        }
    }
    async storeOfflineEntry(userId, entryData, audioBuffer) {
        try {
            const entryId = entryData.id || this.generateId();
            const offlineEntry = {
                id: entryId,
                userId,
                data: { ...entryData, id: entryId },
                audioFile: audioBuffer,
                status: 'pending',
                createdAt: new Date(),
                attempts: 0
            };
            this.offlineQueue.set(entryId, offlineEntry);
            const offlinePath = path_1.default.join(this.config.basePath, 'offline', `${entryId}.json`);
            const offlineData = {
                ...offlineEntry,
                audioFile: audioBuffer ? { size: audioBuffer.length, stored: true } : undefined
            };
            fs_1.default.writeFileSync(offlinePath, JSON.stringify(offlineData, null, 2));
            if (audioBuffer) {
                const audioPath = path_1.default.join(this.config.basePath, 'offline', `${entryId}.audio`);
                fs_1.default.writeFileSync(audioPath, audioBuffer);
            }
            logger_1.logger.info('Entry stored for offline sync:', { entryId, userId });
            return entryId;
        }
        catch (error) {
            logger_1.logger.error('Error storing offline entry:', error);
            throw new apiError_1.ApiError(500, 'Failed to store offline entry');
        }
    }
    async getOfflineEntries(userId) {
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
        }
        catch (error) {
            logger_1.logger.error('Error getting offline entries:', error);
            throw new apiError_1.ApiError(500, 'Failed to get offline entries');
        }
    }
    async syncOfflineEntries(userId, forceSync = false) {
        if (this.syncInProgress && !forceSync) {
            throw new apiError_1.ApiError(409, 'Sync already in progress');
        }
        this.syncInProgress = true;
        try {
            const result = {
                uploaded: 0,
                downloaded: 0,
                conflicts: 0,
                resolved: 0,
                errors: [],
                timestamp: new Date()
            };
            const offlineEntries = Array.from(this.offlineQueue.values())
                .filter(entry => entry.userId === userId && entry.status === 'pending');
            logger_1.logger.info(`Starting sync for ${offlineEntries.length} offline entries`);
            for (const offlineEntry of offlineEntries) {
                try {
                    const existingEntry = await this.getEntry(offlineEntry.id, userId);
                    if (existingEntry) {
                        const resolution = await this.resolveConflict(userId, offlineEntry.id, 'merge', this.mergeEntries(existingEntry, offlineEntry.data));
                        if (resolution) {
                            result.conflicts++;
                            result.resolved++;
                        }
                    }
                    else {
                        await this.createEntry(offlineEntry.data);
                        if (offlineEntry.audioFile) {
                            const audioPath = await this.storeAudioFileLocal(offlineEntry.id, userId, offlineEntry.audioFile, `${offlineEntry.id}.audio`);
                            await this.updateEntry(offlineEntry.id, userId, { audioFilePath: audioPath });
                        }
                        result.uploaded++;
                    }
                    offlineEntry.status = 'synced';
                    this.offlineQueue.set(offlineEntry.id, offlineEntry);
                }
                catch (error) {
                    offlineEntry.status = 'failed';
                    offlineEntry.attempts++;
                    offlineEntry.lastAttempt = new Date();
                    result.errors.push({
                        id: offlineEntry.id,
                        error: error.message
                    });
                    logger_1.logger.error('Sync error for entry:', {
                        entryId: offlineEntry.id,
                        error: error.message
                    });
                }
            }
            try {
                const lastSync = await this.getLastSyncTimestamp(userId);
                const serverChanges = await this.getChangesSince(userId, lastSync);
                for (const serverEntry of serverChanges.entries) {
                    const localEntry = this.offlineQueue.get(serverEntry.id);
                    if (!localEntry) {
                        await this.storeEntryLocally(serverEntry);
                        result.downloaded++;
                    }
                }
                await this.setLastSyncTimestamp(userId, result.timestamp);
            }
            catch (error) {
                logger_1.logger.error('Error downloading server changes:', error);
            }
            await this.cleanupSyncedEntries();
            logger_1.logger.info('Sync completed:', result);
            return result;
        }
        finally {
            this.syncInProgress = false;
        }
    }
    async cacheEntriesLocally(userId, entries) {
        try {
            const cachePath = path_1.default.join(this.config.basePath, 'cache', `${userId}.json`);
            const cacheDir = path_1.default.dirname(cachePath);
            if (!fs_1.default.existsSync(cacheDir)) {
                fs_1.default.mkdirSync(cacheDir, { recursive: true });
            }
            const cacheData = {
                userId,
                entries,
                cachedAt: new Date(),
                version: '1.0'
            };
            fs_1.default.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2));
            logger_1.logger.info('Entries cached locally:', { userId, count: entries.length });
        }
        catch (error) {
            logger_1.logger.error('Error caching entries locally:', error);
            throw new apiError_1.ApiError(500, 'Failed to cache entries');
        }
    }
    async getCachedEntries(userId) {
        try {
            const cachePath = path_1.default.join(this.config.basePath, 'cache', `${userId}.json`);
            if (!fs_1.default.existsSync(cachePath)) {
                return [];
            }
            const cacheData = JSON.parse(fs_1.default.readFileSync(cachePath, 'utf-8'));
            const cacheAge = Date.now() - new Date(cacheData.cachedAt).getTime();
            const maxCacheAge = 24 * 60 * 60 * 1000;
            if (cacheAge > maxCacheAge) {
                logger_1.logger.info('Cache expired, returning empty array:', { userId, cacheAge });
                return [];
            }
            return cacheData.entries || [];
        }
        catch (error) {
            logger_1.logger.error('Error getting cached entries:', error);
            return [];
        }
    }
    async purgeOldData(olderThanDays = 90) {
        try {
            const cutoffDate = new Date(Date.now() - (olderThanDays * 24 * 60 * 60 * 1000));
            let purgedCount = { audioFiles: 0, metadataFiles: 0, cacheFiles: 0, offlineEntries: 0 };
            const audioDir = this.config.audioPath;
            if (fs_1.default.existsSync(audioDir)) {
                const userDirs = fs_1.default.readdirSync(audioDir);
                for (const userDir of userDirs) {
                    const userPath = path_1.default.join(audioDir, userDir);
                    if (fs_1.default.statSync(userPath).isDirectory()) {
                        const files = fs_1.default.readdirSync(userPath);
                        for (const file of files) {
                            const filePath = path_1.default.join(userPath, file);
                            const stats = fs_1.default.statSync(filePath);
                            if (stats.mtime < cutoffDate) {
                                fs_1.default.unlinkSync(filePath);
                                purgedCount.audioFiles++;
                            }
                        }
                    }
                }
            }
            const metadataDir = path_1.default.join(this.config.basePath, 'metadata');
            if (fs_1.default.existsSync(metadataDir)) {
                const metadataFiles = fs_1.default.readdirSync(metadataDir);
                for (const file of metadataFiles) {
                    const filePath = path_1.default.join(metadataDir, file);
                    const stats = fs_1.default.statSync(filePath);
                    if (stats.mtime < cutoffDate) {
                        fs_1.default.unlinkSync(filePath);
                        purgedCount.metadataFiles++;
                    }
                }
            }
            const cacheDir = path_1.default.join(this.config.basePath, 'cache');
            if (fs_1.default.existsSync(cacheDir)) {
                const cacheFiles = fs_1.default.readdirSync(cacheDir);
                for (const file of cacheFiles) {
                    const filePath = path_1.default.join(cacheDir, file);
                    const stats = fs_1.default.statSync(filePath);
                    if (stats.mtime < cutoffDate) {
                        fs_1.default.unlinkSync(filePath);
                        purgedCount.cacheFiles++;
                    }
                }
            }
            const offlineDir = path_1.default.join(this.config.basePath, 'offline');
            if (fs_1.default.existsSync(offlineDir)) {
                const offlineFiles = fs_1.default.readdirSync(offlineDir);
                for (const file of offlineFiles) {
                    const filePath = path_1.default.join(offlineDir, file);
                    const stats = fs_1.default.statSync(filePath);
                    if (stats.mtime < cutoffDate) {
                        const entryId = path_1.default.basename(file, path_1.default.extname(file));
                        this.offlineQueue.delete(entryId);
                        fs_1.default.unlinkSync(filePath);
                        purgedCount.offlineEntries++;
                    }
                }
            }
            logger_1.logger.info('Purged old data:', purgedCount);
            return purgedCount;
        }
        catch (error) {
            logger_1.logger.error('Error purging old data:', error);
            throw new apiError_1.ApiError(500, 'Failed to purge old data');
        }
    }
    generateChecksum(buffer) {
        const crypto = require('crypto');
        return crypto.createHash('md5').update(buffer).digest('hex');
    }
    generateId() {
        return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    loadOfflineQueue() {
        try {
            const offlineDir = path_1.default.join(this.config.basePath, 'offline');
            if (!fs_1.default.existsSync(offlineDir)) {
                return;
            }
            const files = fs_1.default.readdirSync(offlineDir)
                .filter(file => file.endsWith('.json'));
            for (const file of files) {
                try {
                    const filePath = path_1.default.join(offlineDir, file);
                    const data = JSON.parse(fs_1.default.readFileSync(filePath, 'utf-8'));
                    const audioPath = path_1.default.join(offlineDir, `${data.id}.audio`);
                    if (fs_1.default.existsSync(audioPath)) {
                        data.audioFile = fs_1.default.readFileSync(audioPath);
                    }
                    this.offlineQueue.set(data.id, data);
                }
                catch (error) {
                    logger_1.logger.error('Error loading offline entry:', { file, error });
                }
            }
            logger_1.logger.info('Loaded offline queue:', { count: this.offlineQueue.size });
        }
        catch (error) {
            logger_1.logger.error('Error loading offline queue:', error);
        }
    }
    mergeEntries(serverEntry, localEntry) {
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
    async storeEntryLocally(entry) {
        const cachePath = path_1.default.join(this.config.basePath, 'local', `${entry.id}.json`);
        const cacheDir = path_1.default.dirname(cachePath);
        if (!fs_1.default.existsSync(cacheDir)) {
            fs_1.default.mkdirSync(cacheDir, { recursive: true });
        }
        fs_1.default.writeFileSync(cachePath, JSON.stringify(entry, null, 2));
    }
    async getLastSyncTimestamp(userId) {
        try {
            const syncPath = path_1.default.join(this.config.basePath, 'sync', `${userId}.json`);
            if (fs_1.default.existsSync(syncPath)) {
                const syncData = JSON.parse(fs_1.default.readFileSync(syncPath, 'utf-8'));
                return new Date(syncData.lastSync);
            }
            return new Date(0);
        }
        catch {
            return new Date(0);
        }
    }
    async setLastSyncTimestamp(userId, timestamp) {
        const syncDir = path_1.default.join(this.config.basePath, 'sync');
        const syncPath = path_1.default.join(syncDir, `${userId}.json`);
        if (!fs_1.default.existsSync(syncDir)) {
            fs_1.default.mkdirSync(syncDir, { recursive: true });
        }
        const syncData = { userId, lastSync: timestamp };
        fs_1.default.writeFileSync(syncPath, JSON.stringify(syncData, null, 2));
    }
    async cleanupSyncedEntries() {
        const syncedEntries = Array.from(this.offlineQueue.entries())
            .filter(([_, entry]) => entry.status === 'synced');
        for (const [entryId, entry] of syncedEntries) {
            try {
                this.offlineQueue.delete(entryId);
                const jsonPath = path_1.default.join(this.config.basePath, 'offline', `${entryId}.json`);
                const audioPath = path_1.default.join(this.config.basePath, 'offline', `${entryId}.audio`);
                if (fs_1.default.existsSync(jsonPath)) {
                    fs_1.default.unlinkSync(jsonPath);
                }
                if (fs_1.default.existsSync(audioPath)) {
                    fs_1.default.unlinkSync(audioPath);
                }
            }
            catch (error) {
                logger_1.logger.error('Error cleaning up synced entry:', { entryId, error });
            }
        }
    }
}
exports.VoiceJournalLocalStorageService = VoiceJournalLocalStorageService;
exports.voiceJournalLocalStorageService = new VoiceJournalLocalStorageService();
//# sourceMappingURL=VoiceJournalLocalStorageService.js.map