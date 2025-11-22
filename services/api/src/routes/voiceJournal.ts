import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import upload from '../middleware/upload';
import { voiceJournalController } from '../controllers/VoiceJournalController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Entry CRUD operations
router.get('/entries', voiceJournalController.getEntries);
router.get('/entries/:id', voiceJournalController.getEntry);
router.post('/entries', voiceJournalController.createEntry);
router.put('/entries/:id', voiceJournalController.updateEntry);
router.delete('/entries/:id', voiceJournalController.deleteEntry);

// Batch operations
router.post('/entries/batch', voiceJournalController.batchCreateEntries);
router.put('/entries/batch', voiceJournalController.batchUpdateEntries);

// Audio file management
router.post('/upload-audio', upload.single('audio'), voiceJournalController.uploadAudio);
router.get('/download-audio/:id', voiceJournalController.downloadAudio);
router.delete('/audio/:id', voiceJournalController.deleteAudio);

// Sync operations
router.post('/sync', voiceJournalController.performSync);
router.get('/sync/changes', voiceJournalController.getChanges);
router.post('/sync/resolve-conflict', voiceJournalController.resolveConflict);
router.post('/sync-metadata', voiceJournalController.updateSyncMetadata);

// Analytics and insights
router.get('/analytics', voiceJournalController.getAnalytics);
router.get('/insights', voiceJournalController.getInsights);
router.post('/analyze/:id', voiceJournalController.analyzeEntry);

// Search and filtering
router.get('/search', voiceJournalController.searchEntries);
router.get('/tags', voiceJournalController.getTags);
router.get('/favorites', voiceJournalController.getFavorites);

// Export/Import
router.get('/export', voiceJournalController.exportEntries);
router.post('/import', upload.single('file'), voiceJournalController.importEntries);

// ============= Enhanced Local Storage Operations =============

// Offline entry management
router.post('/offline/store', upload.single('audioFile'), voiceJournalController.storeOfflineEntry);
router.get('/offline/entries', voiceJournalController.getOfflineEntries);
router.post('/offline/sync', voiceJournalController.syncOfflineEntries);

// Local audio file management
router.post('/local/audio/:entryId', upload.single('audio'), voiceJournalController.storeAudioFileLocal);
router.get('/local/audio/:entryId', voiceJournalController.getAudioFileLocal);

// Local caching operations
router.post('/cache/store', voiceJournalController.cacheEntriesLocally);
router.get('/cache/entries', voiceJournalController.getCachedEntries);

// Storage management
router.get('/storage/status', voiceJournalController.getLocalStorageStatus);
router.delete('/storage/purge', voiceJournalController.purgeOldData);

// Advanced sync operations
router.post('/sync/advanced', voiceJournalController.performAdvancedSync);

export default router;