import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { VoiceJournalService } from '../services/VoiceJournalService';
import { voiceJournalLocalStorageService } from '../services/VoiceJournalLocalStorageService';
import { ApiError } from '../utils/apiError';
import path from 'path';
import fs from 'fs/promises';

class VoiceJournalController {
  private voiceJournalService: VoiceJournalService;

  constructor() {
    this.voiceJournalService = new VoiceJournalService();
  }

  /**
   * Get all voice journal entries for a user
   */
  getEntries = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { modifiedSince, limit = 100, offset = 0 } = req.query;

    const entries = await this.voiceJournalService.getEntries(userId, {
      modifiedSince: modifiedSince ? new Date(modifiedSince as string) : undefined,
      limit: Number(limit),
      offset: Number(offset),
    });

    res.json({
      success: true,
      entries,
      count: entries.length,
    });
  });

  /**
   * Get a specific voice journal entry
   */
  getEntry = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const entry = await this.voiceJournalService.getEntry(id, userId);

    if (!entry) {
      throw new ApiError(404, 'Voice journal entry not found');
    }

    res.json({
      success: true,
      entry,
    });
  });

  /**
   * Create a new voice journal entry
   */
  createEntry = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
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

  /**
   * Update a voice journal entry
   */
  updateEntry = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const entry = await this.voiceJournalService.updateEntry(id, userId, req.body);

    if (!entry) {
      throw new ApiError(404, 'Voice journal entry not found');
    }

    res.json({
      success: true,
      entry,
    });
  });

  /**
   * Delete a voice journal entry
   */
  deleteEntry = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const deleted = await this.voiceJournalService.deleteEntry(id, userId);

    if (!deleted) {
      throw new ApiError(404, 'Voice journal entry not found');
    }

    res.json({
      success: true,
      message: 'Entry deleted successfully',
    });
  });

  /**
   * Batch create entries
   */
  batchCreateEntries = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { entries } = req.body;

    if (!Array.isArray(entries)) {
      throw new ApiError(400, 'Entries must be an array');
    }

    const createdEntries = await this.voiceJournalService.batchCreateEntries(
      entries.map(e => ({ ...e, userId }))
    );

    res.status(201).json({
      success: true,
      entries: createdEntries,
      count: createdEntries.length,
    });
  });

  /**
   * Batch update entries
   */
  batchUpdateEntries = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { entries } = req.body;

    if (!Array.isArray(entries)) {
      throw new ApiError(400, 'Entries must be an array');
    }

    const updatedEntries = await this.voiceJournalService.batchUpdateEntries(
      userId,
      entries
    );

    res.json({
      success: true,
      entries: updatedEntries,
      count: updatedEntries.length,
    });
  });

  /**
   * Upload audio file
   */
  uploadAudio = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { entryId } = req.body;
    const file = req.file;

    if (!file) {
      throw new ApiError(400, 'No audio file provided');
    }

    if (!entryId) {
      throw new ApiError(400, 'Entry ID is required');
    }

    // Validate file type
    const allowedMimeTypes = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/m4a'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new ApiError(400, 'Invalid audio file type');
    }

    // Store audio file (in production, this would upload to cloud storage)
    const audioUrl = await this.voiceJournalService.storeAudioFile(
      entryId,
      userId,
      file
    );

    res.json({
      success: true,
      audioUrl,
      message: 'Audio uploaded successfully',
    });
  });

  /**
   * Download audio file
   */
  downloadAudio = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const audioPath = await this.voiceJournalService.getAudioPath(id, userId);

    if (!audioPath) {
      throw new ApiError(404, 'Audio file not found');
    }

    // In production, this would fetch from cloud storage
    const audioBuffer = await fs.readFile(audioPath);
    
    res.set({
      'Content-Type': 'audio/m4a',
      'Content-Disposition': `attachment; filename="voice_journal_${id}.m4a"`,
    });

    res.send(audioBuffer);
  });

  /**
   * Delete audio file
   */
  deleteAudio = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const deleted = await this.voiceJournalService.deleteAudioFile(id, userId);

    if (!deleted) {
      throw new ApiError(404, 'Audio file not found');
    }

    res.json({
      success: true,
      message: 'Audio deleted successfully',
    });
  });

  /**
   * Perform sync operation
   */
  performSync = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
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

  /**
   * Get changes since last sync
   */
  getChanges = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { since, deviceId } = req.query;

    if (!since) {
      throw new ApiError(400, 'Since parameter is required');
    }

    const changes = await this.voiceJournalService.getChangesSince(
      userId,
      new Date(since as string),
      deviceId as string
    );

    res.json({
      success: true,
      changes,
    });
  });

  /**
   * Resolve sync conflict
   */
  resolveConflict = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { entryId, resolution, resolvedEntry } = req.body;

    if (!entryId || !resolution) {
      throw new ApiError(400, 'Entry ID and resolution are required');
    }

    const result = await this.voiceJournalService.resolveConflict(
      userId,
      entryId,
      resolution,
      resolvedEntry
    );

    res.json({
      success: true,
      entry: result,
    });
  });

  /**
   * Update sync metadata
   */
  updateSyncMetadata = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
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

  /**
   * Get analytics for voice journals
   */
  getAnalytics = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { startDate, endDate } = req.query;

    const analytics = await this.voiceJournalService.getAnalytics(userId, {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    res.json({
      success: true,
      analytics,
    });
  });

  /**
   * Get insights from voice journals
   */
  getInsights = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const insights = await this.voiceJournalService.generateInsights(userId);

    res.json({
      success: true,
      insights,
    });
  });

  /**
   * Analyze a specific entry
   */
  analyzeEntry = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const analysis = await this.voiceJournalService.analyzeEntry(id, userId);

    if (!analysis) {
      throw new ApiError(404, 'Entry not found or analysis failed');
    }

    res.json({
      success: true,
      analysis,
    });
  });

  /**
   * Search voice journal entries
   */
  searchEntries = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { query, tags, startDate, endDate, limit = 50 } = req.query;

    const results = await this.voiceJournalService.searchEntries(userId, {
      query: query as string,
      tags: tags ? (tags as string).split(',') : undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: Number(limit),
    });

    res.json({
      success: true,
      results,
      count: results.length,
    });
  });

  /**
   * Get all unique tags
   */
  getTags = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const tags = await this.voiceJournalService.getAllTags(userId);

    res.json({
      success: true,
      tags,
    });
  });

  /**
   * Get favorite entries
   */
  getFavorites = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
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

  /**
   * Export entries
   */
  exportEntries = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { format = 'json', includeAudio = false } = req.query;

    const exportData = await this.voiceJournalService.exportEntries(userId, {
      format: format as string,
      includeAudio: includeAudio === 'true',
    });

    if (format === 'json') {
      res.json({
        success: true,
        data: exportData,
      });
    } else {
      // For other formats (CSV, etc.), send as file download
      res.set({
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="voice_journals_export.${format}"`,
      });
      res.send(exportData);
    }
  });

  /**
   * Import entries
   */
  importEntries = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const file = req.file;

    if (!file) {
      throw new ApiError(400, 'No import file provided');
    }

    const fileContent = await fs.readFile(file.path, 'utf-8');
    const data = JSON.parse(fileContent);

    const imported = await this.voiceJournalService.importEntries(userId, data);

    res.json({
      success: true,
      imported: imported.length,
      message: `Successfully imported ${imported.length} entries`,
    });
  });

  // ============= Enhanced Local Storage Operations =============

  /**
   * Store entry for offline access
   */
  storeOfflineEntry = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { entryData } = req.body;
    const audioFile = req.file;

    if (!entryData) {
      throw new ApiError(400, 'Entry data is required');
    }

    const audioBuffer = audioFile ? audioFile.buffer : undefined;

    const entryId = await voiceJournalLocalStorageService.storeOfflineEntry(
      userId,
      entryData,
      audioBuffer
    );

    res.status(201).json({
      success: true,
      entryId,
      message: 'Entry stored for offline sync',
      offlineMode: true
    });
  });

  /**
   * Get offline entries for user
   */
  getOfflineEntries = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const offlineEntries = await voiceJournalLocalStorageService.getOfflineEntries(userId);

    res.json({
      success: true,
      entries: offlineEntries,
      count: offlineEntries.length,
      offlineMode: true
    });
  });

  /**
   * Sync offline entries with server
   */
  syncOfflineEntries = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { forceSync = false } = req.body;

    const syncResult = await voiceJournalLocalStorageService.syncOfflineEntries(
      userId,
      forceSync
    );

    res.json({
      success: true,
      syncResult,
      message: `Sync completed: ${syncResult.uploaded} uploaded, ${syncResult.downloaded} downloaded, ${syncResult.conflicts} conflicts`
    });
  });

  /**
   * Store audio file locally with enhanced metadata
   */
  storeAudioFileLocal = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { entryId } = req.params;
    const file = req.file;

    if (!file) {
      throw new ApiError(400, 'No audio file provided');
    }

    if (!entryId) {
      throw new ApiError(400, 'Entry ID is required');
    }

    const localPath = await voiceJournalLocalStorageService.storeAudioFileLocal(
      entryId,
      userId,
      file.buffer,
      file.originalname,
      {
        mimetype: file.mimetype,
        uploadedAt: new Date()
      }
    );

    res.json({
      success: true,
      localPath,
      message: 'Audio file stored locally',
      metadata: {
        filename: file.originalname,
        size: file.size,
        format: path.extname(file.originalname)
      }
    });
  });

  /**
   * Get audio file from local storage
   */
  getAudioFileLocal = catchAsync(async (req: Request, res: Response) => {
    const { entryId } = req.params;
    const userId = req.user!.id;

    const audioData = await voiceJournalLocalStorageService.getAudioFileLocal(entryId, userId);

    if (!audioData) {
      throw new ApiError(404, 'Audio file not found in local storage');
    }

    res.set({
      'Content-Type': audioData.metadata.mimetype || 'audio/mpeg',
      'Content-Length': audioData.buffer.length.toString(),
      'Content-Disposition': `attachment; filename="${audioData.filename}"`,
    });

    res.send(audioData.buffer);
  });

  /**
   * Cache entries locally for offline access
   */
  cacheEntriesLocally = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { entries } = req.body;

    if (!Array.isArray(entries)) {
      throw new ApiError(400, 'Entries must be an array');
    }

    await voiceJournalLocalStorageService.cacheEntriesLocally(userId, entries);

    res.json({
      success: true,
      cached: entries.length,
      message: `Cached ${entries.length} entries for offline access`
    });
  });

  /**
   * Get cached entries from local storage
   */
  getCachedEntries = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const cachedEntries = await voiceJournalLocalStorageService.getCachedEntries(userId);

    res.json({
      success: true,
      entries: cachedEntries,
      count: cachedEntries.length,
      cached: true,
      message: cachedEntries.length > 0 ? 'Retrieved cached entries' : 'No cached entries found'
    });
  });

  /**
   * Purge old local data
   */
  purgeOldData = catchAsync(async (req: Request, res: Response) => {
    const { olderThanDays = 90 } = req.query;

    const purgeResult = await voiceJournalLocalStorageService.purgeOldData(
      Number(olderThanDays)
    );

    res.json({
      success: true,
      purged: purgeResult,
      message: `Purged old data: ${Object.values(purgeResult).reduce((a, b) => a + b, 0)} files removed`
    });
  });

  /**
   * Get local storage status and statistics
   */
  getLocalStorageStatus = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    try {
      const offlineEntries = await voiceJournalLocalStorageService.getOfflineEntries(userId);
      const cachedEntries = await voiceJournalLocalStorageService.getCachedEntries(userId);

      // Calculate storage usage (simplified)
      const storageStats = {
        offlineEntries: offlineEntries.length,
        cachedEntries: cachedEntries.length,
        pendingSync: offlineEntries.filter(e => e.offlineStatus === 'pending').length,
        failedSync: offlineEntries.filter(e => e.offlineStatus === 'failed').length,
        lastCacheUpdate: cachedEntries.length > 0 ? new Date() : null,
        storageHealth: 'good' // Would implement actual health check
      };

      res.json({
        success: true,
        status: storageStats,
        message: 'Local storage status retrieved successfully'
      });

    } catch (error) {
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

  /**
   * Enhanced sync with detailed progress
   */
  performAdvancedSync = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const {
      includeAudio = true,
      resolveConflicts = 'merge',
      downloadNew = true,
      uploadPending = true
    } = req.body;

    // First, get current sync status
    const offlineEntries = await voiceJournalLocalStorageService.getOfflineEntries(userId);
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

    // Perform sync
    const syncResult = await voiceJournalLocalStorageService.syncOfflineEntries(userId, false);

    // Update cache with latest entries if requested
    if (downloadNew) {
      try {
        const latestEntries = await this.voiceJournalService.getEntries(userId, { limit: 100 });
        await voiceJournalLocalStorageService.cacheEntriesLocally(userId, latestEntries);
      } catch (error) {
        // Non-critical error - sync can still succeed
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

export const voiceJournalController = new VoiceJournalController();