"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.voiceJournalController = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const VoiceJournalService_1 = require("../services/VoiceJournalService");
const VoiceJournalLocalStorageService_1 = require("../services/VoiceJournalLocalStorageService");
const apiError_1 = require("../utils/apiError");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
class VoiceJournalController {
    voiceJournalService;
    constructor() {
        this.voiceJournalService = new VoiceJournalService_1.VoiceJournalService();
    }
    getEntries = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const userId = req.user.id;
        const { modifiedSince, limit = 100, offset = 0 } = req.query;
        const entries = await this.voiceJournalService.getEntries(userId, {
            modifiedSince: modifiedSince ? new Date(modifiedSince) : undefined,
            limit: Number(limit),
            offset: Number(offset),
        });
        res.json({
            success: true,
            entries,
            count: entries.length,
        });
    });
    getEntry = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { id } = req.params;
        const userId = req.user.id;
        const entry = await this.voiceJournalService.getEntry(id, userId);
        if (!entry) {
            throw new apiError_1.ApiError(404, 'Voice journal entry not found');
        }
        res.json({
            success: true,
            entry,
        });
    });
    createEntry = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const userId = req.user.id;
        const entryData = {
            ...req.body,
            userId,
        };
        const entry = await this.voiceJournalService.createEntry(entryData);
        res.status(201).json({
            success: true,
            entry,
            cloudUrl: `cloud://voice-journal/${entry.id}`,
        });
    });
    updateEntry = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { id } = req.params;
        const userId = req.user.id;
        const entry = await this.voiceJournalService.updateEntry(id, userId, req.body);
        if (!entry) {
            throw new apiError_1.ApiError(404, 'Voice journal entry not found');
        }
        res.json({
            success: true,
            entry,
        });
    });
    deleteEntry = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { id } = req.params;
        const userId = req.user.id;
        const deleted = await this.voiceJournalService.deleteEntry(id, userId);
        if (!deleted) {
            throw new apiError_1.ApiError(404, 'Voice journal entry not found');
        }
        res.json({
            success: true,
            message: 'Entry deleted successfully',
        });
    });
    batchCreateEntries = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const userId = req.user.id;
        const { entries } = req.body;
        if (!Array.isArray(entries)) {
            throw new apiError_1.ApiError(400, 'Entries must be an array');
        }
        const createdEntries = await this.voiceJournalService.batchCreateEntries(entries.map(e => ({ ...e, userId })));
        res.status(201).json({
            success: true,
            entries: createdEntries,
            count: createdEntries.length,
        });
    });
    batchUpdateEntries = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const userId = req.user.id;
        const { entries } = req.body;
        if (!Array.isArray(entries)) {
            throw new apiError_1.ApiError(400, 'Entries must be an array');
        }
        const updatedEntries = await this.voiceJournalService.batchUpdateEntries(userId, entries);
        res.json({
            success: true,
            entries: updatedEntries,
            count: updatedEntries.length,
        });
    });
    uploadAudio = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const userId = req.user.id;
        const { entryId } = req.body;
        const file = req.file;
        if (!file) {
            throw new apiError_1.ApiError(400, 'No audio file provided');
        }
        if (!entryId) {
            throw new apiError_1.ApiError(400, 'Entry ID is required');
        }
        const allowedMimeTypes = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/m4a'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new apiError_1.ApiError(400, 'Invalid audio file type');
        }
        const audioUrl = await this.voiceJournalService.storeAudioFile(entryId, userId, file);
        res.json({
            success: true,
            audioUrl,
            message: 'Audio uploaded successfully',
        });
    });
    downloadAudio = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { id } = req.params;
        const userId = req.user.id;
        const audioPath = await this.voiceJournalService.getAudioPath(id, userId);
        if (!audioPath) {
            throw new apiError_1.ApiError(404, 'Audio file not found');
        }
        const audioBuffer = await promises_1.default.readFile(audioPath);
        res.set({
            'Content-Type': 'audio/m4a',
            'Content-Disposition': `attachment; filename="voice_journal_${id}.m4a"`,
        });
        res.send(audioBuffer);
    });
    deleteAudio = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { id } = req.params;
        const userId = req.user.id;
        const deleted = await this.voiceJournalService.deleteAudioFile(id, userId);
        if (!deleted) {
            throw new apiError_1.ApiError(404, 'Audio file not found');
        }
        res.json({
            success: true,
            message: 'Audio deleted successfully',
        });
    });
    performSync = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const userId = req.user.id;
        const { lastSync, entries, deviceId } = req.body;
        const syncResult = await this.voiceJournalService.performSync(userId, {
            lastSync: lastSync ? new Date(lastSync) : undefined,
            entries,
            deviceId,
        });
        res.json({
            success: true,
            ...syncResult,
        });
    });
    getChanges = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const userId = req.user.id;
        const { since, deviceId } = req.query;
        if (!since) {
            throw new apiError_1.ApiError(400, 'Since parameter is required');
        }
        const changes = await this.voiceJournalService.getChangesSince(userId, new Date(since), deviceId);
        res.json({
            success: true,
            changes,
        });
    });
    resolveConflict = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const userId = req.user.id;
        const { entryId, resolution, resolvedEntry } = req.body;
        if (!entryId || !resolution) {
            throw new apiError_1.ApiError(400, 'Entry ID and resolution are required');
        }
        const result = await this.voiceJournalService.resolveConflict(userId, entryId, resolution, resolvedEntry);
        res.json({
            success: true,
            entry: result,
        });
    });
    updateSyncMetadata = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const userId = req.user.id;
        const { lastSync, deviceId, syncVersion } = req.body;
        await this.voiceJournalService.updateSyncMetadata(userId, {
            lastSync: new Date(lastSync),
            deviceId,
            syncVersion,
        });
        res.json({
            success: true,
            message: 'Sync metadata updated',
        });
    });
    getAnalytics = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const userId = req.user.id;
        const { startDate, endDate } = req.query;
        const analytics = await this.voiceJournalService.getAnalytics(userId, {
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        });
        res.json({
            success: true,
            analytics,
        });
    });
    getInsights = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const userId = req.user.id;
        const insights = await this.voiceJournalService.generateInsights(userId);
        res.json({
            success: true,
            insights,
        });
    });
    analyzeEntry = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { id } = req.params;
        const userId = req.user.id;
        const analysis = await this.voiceJournalService.analyzeEntry(id, userId);
        if (!analysis) {
            throw new apiError_1.ApiError(404, 'Entry not found or analysis failed');
        }
        res.json({
            success: true,
            analysis,
        });
    });
    searchEntries = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const userId = req.user.id;
        const { query, tags, startDate, endDate, limit = 50 } = req.query;
        const results = await this.voiceJournalService.searchEntries(userId, {
            query: query,
            tags: tags ? tags.split(',') : undefined,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            limit: Number(limit),
        });
        res.json({
            success: true,
            results,
            count: results.length,
        });
    });
    getTags = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const userId = req.user.id;
        const tags = await this.voiceJournalService.getAllTags(userId);
        res.json({
            success: true,
            tags,
        });
    });
    getFavorites = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const userId = req.user.id;
        const { limit = 50, offset = 0 } = req.query;
        const favorites = await this.voiceJournalService.getFavoriteEntries(userId, {
            limit: Number(limit),
            offset: Number(offset),
        });
        res.json({
            success: true,
            entries: favorites,
            count: favorites.length,
        });
    });
    exportEntries = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const userId = req.user.id;
        const { format = 'json', includeAudio = false } = req.query;
        const exportData = await this.voiceJournalService.exportEntries(userId, {
            format: format,
            includeAudio: includeAudio === 'true',
        });
        if (format === 'json') {
            res.json({
                success: true,
                data: exportData,
            });
        }
        else {
            res.set({
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': `attachment; filename="voice_journals_export.${format}"`,
            });
            res.send(exportData);
        }
    });
    importEntries = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const userId = req.user.id;
        const file = req.file;
        if (!file) {
            throw new apiError_1.ApiError(400, 'No import file provided');
        }
        const fileContent = await promises_1.default.readFile(file.path, 'utf-8');
        const data = JSON.parse(fileContent);
        const imported = await this.voiceJournalService.importEntries(userId, data);
        res.json({
            success: true,
            imported: imported.length,
            message: `Successfully imported ${imported.length} entries`,
        });
    });
    storeOfflineEntry = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const userId = req.user.id;
        const { entryData } = req.body;
        const audioFile = req.file;
        if (!entryData) {
            throw new apiError_1.ApiError(400, 'Entry data is required');
        }
        const audioBuffer = audioFile ? audioFile.buffer : undefined;
        const entryId = await VoiceJournalLocalStorageService_1.voiceJournalLocalStorageService.storeOfflineEntry(userId, entryData, audioBuffer);
        res.status(201).json({
            success: true,
            entryId,
            message: 'Entry stored for offline sync',
            offlineMode: true
        });
    });
    getOfflineEntries = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const userId = req.user.id;
        const offlineEntries = await VoiceJournalLocalStorageService_1.voiceJournalLocalStorageService.getOfflineEntries(userId);
        res.json({
            success: true,
            entries: offlineEntries,
            count: offlineEntries.length,
            offlineMode: true
        });
    });
    syncOfflineEntries = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const userId = req.user.id;
        const { forceSync = false } = req.body;
        const syncResult = await VoiceJournalLocalStorageService_1.voiceJournalLocalStorageService.syncOfflineEntries(userId, forceSync);
        res.json({
            success: true,
            syncResult,
            message: `Sync completed: ${syncResult.uploaded} uploaded, ${syncResult.downloaded} downloaded, ${syncResult.conflicts} conflicts`
        });
    });
    storeAudioFileLocal = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const userId = req.user.id;
        const { entryId } = req.params;
        const file = req.file;
        if (!file) {
            throw new apiError_1.ApiError(400, 'No audio file provided');
        }
        if (!entryId) {
            throw new apiError_1.ApiError(400, 'Entry ID is required');
        }
        const localPath = await VoiceJournalLocalStorageService_1.voiceJournalLocalStorageService.storeAudioFileLocal(entryId, userId, file.buffer, file.originalname, {
            mimetype: file.mimetype,
            uploadedAt: new Date()
        });
        res.json({
            success: true,
            localPath,
            message: 'Audio file stored locally',
            metadata: {
                filename: file.originalname,
                size: file.size,
                format: path_1.default.extname(file.originalname)
            }
        });
    });
    getAudioFileLocal = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { entryId } = req.params;
        const userId = req.user.id;
        const audioData = await VoiceJournalLocalStorageService_1.voiceJournalLocalStorageService.getAudioFileLocal(entryId, userId);
        if (!audioData) {
            throw new apiError_1.ApiError(404, 'Audio file not found in local storage');
        }
        res.set({
            'Content-Type': audioData.metadata.mimetype || 'audio/mpeg',
            'Content-Length': audioData.buffer.length.toString(),
            'Content-Disposition': `attachment; filename="${audioData.filename}"`,
        });
        res.send(audioData.buffer);
    });
    cacheEntriesLocally = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const userId = req.user.id;
        const { entries } = req.body;
        if (!Array.isArray(entries)) {
            throw new apiError_1.ApiError(400, 'Entries must be an array');
        }
        await VoiceJournalLocalStorageService_1.voiceJournalLocalStorageService.cacheEntriesLocally(userId, entries);
        res.json({
            success: true,
            cached: entries.length,
            message: `Cached ${entries.length} entries for offline access`
        });
    });
    getCachedEntries = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const userId = req.user.id;
        const cachedEntries = await VoiceJournalLocalStorageService_1.voiceJournalLocalStorageService.getCachedEntries(userId);
        res.json({
            success: true,
            entries: cachedEntries,
            count: cachedEntries.length,
            cached: true,
            message: cachedEntries.length > 0 ? 'Retrieved cached entries' : 'No cached entries found'
        });
    });
    purgeOldData = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { olderThanDays = 90 } = req.query;
        const purgeResult = await VoiceJournalLocalStorageService_1.voiceJournalLocalStorageService.purgeOldData(Number(olderThanDays));
        res.json({
            success: true,
            purged: purgeResult,
            message: `Purged old data: ${Object.values(purgeResult).reduce((a, b) => a + b, 0)} files removed`
        });
    });
    getLocalStorageStatus = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const userId = req.user.id;
        try {
            const offlineEntries = await VoiceJournalLocalStorageService_1.voiceJournalLocalStorageService.getOfflineEntries(userId);
            const cachedEntries = await VoiceJournalLocalStorageService_1.voiceJournalLocalStorageService.getCachedEntries(userId);
            const storageStats = {
                offlineEntries: offlineEntries.length,
                cachedEntries: cachedEntries.length,
                pendingSync: offlineEntries.filter(e => e.offlineStatus === 'pending').length,
                failedSync: offlineEntries.filter(e => e.offlineStatus === 'failed').length,
                lastCacheUpdate: cachedEntries.length > 0 ? new Date() : null,
                storageHealth: 'good'
            };
            res.json({
                success: true,
                status: storageStats,
                message: 'Local storage status retrieved successfully'
            });
        }
        catch (error) {
            res.json({
                success: true,
                status: {
                    offlineEntries: 0,
                    cachedEntries: 0,
                    pendingSync: 0,
                    failedSync: 0,
                    lastCacheUpdate: null,
                    storageHealth: 'unknown'
                },
                message: 'Local storage status unavailable'
            });
        }
    });
    performAdvancedSync = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const userId = req.user.id;
        const { includeAudio = true, resolveConflicts = 'merge', downloadNew = true, uploadPending = true } = req.body;
        const offlineEntries = await VoiceJournalLocalStorageService_1.voiceJournalLocalStorageService.getOfflineEntries(userId);
        const pendingCount = offlineEntries.filter(e => e.offlineStatus === 'pending').length;
        if (pendingCount === 0 && !downloadNew) {
            return res.json({
                success: true,
                message: 'No sync required',
                syncResult: {
                    uploaded: 0,
                    downloaded: 0,
                    conflicts: 0,
                    resolved: 0,
                    errors: [],
                    timestamp: new Date()
                }
            });
        }
        const syncResult = await VoiceJournalLocalStorageService_1.voiceJournalLocalStorageService.syncOfflineEntries(userId, false);
        if (downloadNew) {
            try {
                const latestEntries = await this.voiceJournalService.getEntries(userId, { limit: 100 });
                await VoiceJournalLocalStorageService_1.voiceJournalLocalStorageService.cacheEntriesLocally(userId, latestEntries);
            }
            catch (error) {
            }
        }
        res.json({
            success: true,
            syncResult,
            message: 'Advanced sync completed successfully',
            statistics: {
                beforeSync: {
                    pending: pendingCount,
                    total: offlineEntries.length
                },
                afterSync: {
                    uploaded: syncResult.uploaded,
                    downloaded: syncResult.downloaded,
                    conflicts: syncResult.conflicts,
                    errors: syncResult.errors.length
                }
            }
        });
    });
}
exports.voiceJournalController = new VoiceJournalController();
//# sourceMappingURL=VoiceJournalController.js.map