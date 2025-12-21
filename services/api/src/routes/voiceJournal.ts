import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import upload from '../middleware/upload';
import { voiceJournalController } from '../controllers/VoiceJournalController';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/voice-journal/entries:
 *   get:
 *     summary: Get voice journal entries
 *     description: Returns a paginated list of the user's voice journal entries with optional filtering by date, tags, or mood.
 *     tags: [Voice Journal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter entries from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter entries until this date
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated list of tags to filter by
 *     responses:
 *       200:
 *         description: Voice journal entries retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/VoiceJournalEntry'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
// Entry CRUD operations
router.get('/entries', voiceJournalController.getEntries);

/**
 * @swagger
 * /api/voice-journal/entries/{id}:
 *   get:
 *     summary: Get voice journal entry by ID
 *     description: Retrieves a specific voice journal entry
 *     tags: [Voice Journal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Voice journal entry ID
 *     responses:
 *       200:
 *         description: Voice journal entry retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/VoiceJournalEntry'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/entries/:id', voiceJournalController.getEntry);

/**
 * @swagger
 * /api/voice-journal/entries:
 *   post:
 *     summary: Create voice journal entry
 *     description: Create a new voice journal entry with optional audio transcription
 *     tags: [Voice Journal]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 description: Entry title
 *               transcription:
 *                 type: string
 *                 description: Transcribed text from voice recording
 *               mood:
 *                 type: string
 *                 enum: [very_sad, sad, neutral, happy, very_happy]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               audioUrl:
 *                 type: string
 *                 format: uri
 *                 description: URL to the audio file
 *               duration:
 *                 type: integer
 *                 description: Audio duration in seconds
 *     responses:
 *       201:
 *         description: Voice journal entry created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/entries', voiceJournalController.createEntry);

/**
 * @swagger
 * /api/voice-journal/entries/{id}:
 *   put:
 *     summary: Update voice journal entry
 *     description: Update an existing voice journal entry
 *     tags: [Voice Journal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               transcription:
 *                 type: string
 *               mood:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Entry updated successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/entries/:id', voiceJournalController.updateEntry);

/**
 * @swagger
 * /api/voice-journal/entries/{id}:
 *   delete:
 *     summary: Delete voice journal entry
 *     description: Delete a voice journal entry and associated audio files
 *     tags: [Voice Journal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Entry deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/entries/:id', voiceJournalController.deleteEntry);

/**
 * @swagger
 * /api/voice-journal/entries/batch:
 *   post:
 *     summary: Batch create voice journal entries
 *     description: Create multiple voice journal entries in a single request
 *     tags: [Voice Journal]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               entries:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/VoiceJournalEntry'
 *     responses:
 *       201:
 *         description: Entries created successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
// Batch operations
router.post('/entries/batch', voiceJournalController.batchCreateEntries);

/**
 * @swagger
 * /api/voice-journal/entries/batch:
 *   put:
 *     summary: Batch update voice journal entries
 *     description: Update multiple voice journal entries in a single request
 *     tags: [Voice Journal]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               entries:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     updates:
 *                       type: object
 *     responses:
 *       200:
 *         description: Entries updated successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/entries/batch', voiceJournalController.batchUpdateEntries);

/**
 * @swagger
 * /api/voice-journal/upload-audio:
 *   post:
 *     summary: Upload audio file
 *     description: Upload an audio file for voice journaling
 *     tags: [Voice Journal]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - audio
 *             properties:
 *               audio:
 *                 type: string
 *                 format: binary
 *                 description: Audio file (mp3, wav, m4a, webm)
 *     responses:
 *       200:
 *         description: Audio uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     audioId:
 *                       type: string
 *                     url:
 *                       type: string
 *                     duration:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
// Audio file management
router.post('/upload-audio', upload.single('audio'), voiceJournalController.uploadAudio);

/**
 * @swagger
 * /api/voice-journal/download-audio/{id}:
 *   get:
 *     summary: Download audio file
 *     description: Download an audio file by ID
 *     tags: [Voice Journal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Audio file ID
 *     responses:
 *       200:
 *         description: Audio file stream
 *         content:
 *           audio/*:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/download-audio/:id', voiceJournalController.downloadAudio);

/**
 * @swagger
 * /api/voice-journal/audio/{id}:
 *   delete:
 *     summary: Delete audio file
 *     description: Delete an audio file by ID
 *     tags: [Voice Journal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Audio deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/audio/:id', voiceJournalController.deleteAudio);

/**
 * @swagger
 * /api/voice-journal/sync:
 *   post:
 *     summary: Sync voice journal entries
 *     description: Synchronize local entries with the server
 *     tags: [Voice Journal]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               lastSyncTimestamp:
 *                 type: string
 *                 format: date-time
 *               localEntries:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/VoiceJournalEntry'
 *     responses:
 *       200:
 *         description: Sync completed successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
// Sync operations
router.post('/sync', voiceJournalController.performSync);

/**
 * @swagger
 * /api/voice-journal/sync/changes:
 *   get:
 *     summary: Get sync changes
 *     description: Get entries that have changed since the last sync
 *     tags: [Voice Journal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: since
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Get changes since this timestamp
 *     responses:
 *       200:
 *         description: Changes retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/sync/changes', voiceJournalController.getChanges);

/**
 * @swagger
 * /api/voice-journal/sync/resolve-conflict:
 *   post:
 *     summary: Resolve sync conflict
 *     description: Resolve a conflict between local and server versions
 *     tags: [Voice Journal]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               entryId:
 *                 type: string
 *               resolution:
 *                 type: string
 *                 enum: [keep_local, keep_server, merge]
 *     responses:
 *       200:
 *         description: Conflict resolved
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/sync/resolve-conflict', voiceJournalController.resolveConflict);

/**
 * @swagger
 * /api/voice-journal/sync-metadata:
 *   post:
 *     summary: Update sync metadata
 *     description: Update sync metadata for entries
 *     tags: [Voice Journal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Metadata updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/sync-metadata', voiceJournalController.updateSyncMetadata);

/**
 * @swagger
 * /api/voice-journal/analytics:
 *   get:
 *     summary: Get voice journal analytics
 *     description: Get analytics and statistics for voice journal entries
 *     tags: [Voice Journal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalEntries:
 *                       type: integer
 *                     averageDuration:
 *                       type: number
 *                     moodDistribution:
 *                       type: object
 *                     weeklyTrends:
 *                       type: array
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
// Analytics and insights
router.get('/analytics', voiceJournalController.getAnalytics);

/**
 * @swagger
 * /api/voice-journal/insights:
 *   get:
 *     summary: Get AI-generated insights
 *     description: Get AI-powered insights from voice journal entries
 *     tags: [Voice Journal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Insights retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/insights', voiceJournalController.getInsights);

/**
 * @swagger
 * /api/voice-journal/analyze/{id}:
 *   post:
 *     summary: Analyze voice journal entry
 *     description: Perform AI analysis on a specific voice journal entry
 *     tags: [Voice Journal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Analysis completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     sentiment:
 *                       type: string
 *                     keywords:
 *                       type: array
 *                       items:
 *                         type: string
 *                     summary:
 *                       type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/analyze/:id', voiceJournalController.analyzeEntry);

/**
 * @swagger
 * /api/voice-journal/search:
 *   get:
 *     summary: Search voice journal entries
 *     description: Full-text search across voice journal entries
 *     tags: [Voice Journal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Search results
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
// Search and filtering
router.get('/search', voiceJournalController.searchEntries);

/**
 * @swagger
 * /api/voice-journal/tags:
 *   get:
 *     summary: Get all tags
 *     description: Get all unique tags used in voice journal entries
 *     tags: [Voice Journal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tags retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       tag:
 *                         type: string
 *                       count:
 *                         type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/tags', voiceJournalController.getTags);

/**
 * @swagger
 * /api/voice-journal/favorites:
 *   get:
 *     summary: Get favorite entries
 *     description: Get all voice journal entries marked as favorites
 *     tags: [Voice Journal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Favorite entries retrieved
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/favorites', voiceJournalController.getFavorites);

/**
 * @swagger
 * /api/voice-journal/export:
 *   get:
 *     summary: Export voice journal entries
 *     description: Export all voice journal entries in various formats
 *     tags: [Voice Journal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv, pdf]
 *           default: json
 *       - in: query
 *         name: includeAudio
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Export file
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
// Export/Import
router.get('/export', voiceJournalController.exportEntries);

/**
 * @swagger
 * /api/voice-journal/import:
 *   post:
 *     summary: Import voice journal entries
 *     description: Import voice journal entries from a file
 *     tags: [Voice Journal]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Import completed
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/import', upload.single('file'), voiceJournalController.importEntries);

// ============= Enhanced Local Storage Operations =============

/**
 * @swagger
 * /api/voice-journal/offline/store:
 *   post:
 *     summary: Store offline entry
 *     description: Store a voice journal entry created offline
 *     tags: [Voice Journal]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               audioFile:
 *                 type: string
 *                 format: binary
 *               entryData:
 *                 type: string
 *                 description: JSON stringified entry data
 *     responses:
 *       201:
 *         description: Offline entry stored
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
// Offline entry management
router.post('/offline/store', upload.single('audioFile'), voiceJournalController.storeOfflineEntry);

/**
 * @swagger
 * /api/voice-journal/offline/entries:
 *   get:
 *     summary: Get offline entries
 *     description: Get all entries stored offline pending sync
 *     tags: [Voice Journal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Offline entries retrieved
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/offline/entries', voiceJournalController.getOfflineEntries);

/**
 * @swagger
 * /api/voice-journal/offline/sync:
 *   post:
 *     summary: Sync offline entries
 *     description: Synchronize all pending offline entries with the server
 *     tags: [Voice Journal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Offline entries synced
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/offline/sync', voiceJournalController.syncOfflineEntries);

/**
 * @swagger
 * /api/voice-journal/local/audio/{entryId}:
 *   post:
 *     summary: Store audio file locally
 *     description: Store an audio file in local storage
 *     tags: [Voice Journal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               audio:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Audio stored locally
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
// Local audio file management
router.post('/local/audio/:entryId', upload.single('audio'), voiceJournalController.storeAudioFileLocal);

/**
 * @swagger
 * /api/voice-journal/local/audio/{entryId}:
 *   get:
 *     summary: Get local audio file
 *     description: Retrieve an audio file from local storage
 *     tags: [Voice Journal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Audio file stream
 *         content:
 *           audio/*:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/local/audio/:entryId', voiceJournalController.getAudioFileLocal);

/**
 * @swagger
 * /api/voice-journal/cache/store:
 *   post:
 *     summary: Cache entries locally
 *     description: Cache voice journal entries for offline access
 *     tags: [Voice Journal]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               entryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Entries cached
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
// Local caching operations
router.post('/cache/store', voiceJournalController.cacheEntriesLocally);

/**
 * @swagger
 * /api/voice-journal/cache/entries:
 *   get:
 *     summary: Get cached entries
 *     description: Get all cached voice journal entries
 *     tags: [Voice Journal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cached entries retrieved
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/cache/entries', voiceJournalController.getCachedEntries);

/**
 * @swagger
 * /api/voice-journal/storage/status:
 *   get:
 *     summary: Get local storage status
 *     description: Get information about local storage usage
 *     tags: [Voice Journal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Storage status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     usedBytes:
 *                       type: integer
 *                     totalBytes:
 *                       type: integer
 *                     entriesCount:
 *                       type: integer
 *                     audioFilesCount:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
// Storage management
router.get('/storage/status', voiceJournalController.getLocalStorageStatus);

/**
 * @swagger
 * /api/voice-journal/storage/purge:
 *   delete:
 *     summary: Purge old data
 *     description: Delete old entries and audio files to free up storage
 *     tags: [Voice Journal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: olderThanDays
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Delete data older than this many days
 *     responses:
 *       200:
 *         description: Old data purged
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete('/storage/purge', voiceJournalController.purgeOldData);

/**
 * @swagger
 * /api/voice-journal/sync/advanced:
 *   post:
 *     summary: Perform advanced sync
 *     description: Perform advanced synchronization with conflict resolution
 *     tags: [Voice Journal]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               strategy:
 *                 type: string
 *                 enum: [server_wins, client_wins, merge, manual]
 *               lastSyncTimestamp:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Advanced sync completed
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
// Advanced sync operations
router.post('/sync/advanced', voiceJournalController.performAdvancedSync);

export default router;