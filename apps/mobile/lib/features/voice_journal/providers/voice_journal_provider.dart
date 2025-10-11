import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/models/voice_journal_entry.dart';
import '../../../core/services/voice_recording_service.dart';
import '../../../core/services/speech_to_text_service.dart';
import '../../../core/services/voice_journal_storage_service.dart';
import 'dart:io';

class VoiceJournalNotifier extends StateNotifier<VoiceJournalState> {
  VoiceJournalNotifier(
    this._voiceRecordingService,
    this._speechToTextService,
    this._storageService,
  ) : super(const VoiceJournalState()) {
    _init();
  }

  final VoiceRecordingService _voiceRecordingService;
  final SpeechToTextService _speechToTextService;
  final VoiceJournalStorageService _storageService;

  Future<void> _init() async {
    await _voiceRecordingService.initialize();
    await _speechToTextService.initialize();
    await _storageService.initialize();
    await loadEntries();
  }

  // Load voice journal entries
  Future<void> loadEntries() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final entries = await _storageService.loadEntries();

      state = state.copyWith(
        entries: entries,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  // Start recording a new voice journal entry
  Future<bool> startRecording() async {
    if (state.isRecording) return false;
    
    state = state.copyWith(isRecording: true, error: null);
    
    try {
      final success = await _voiceRecordingService.startRecording();
      if (!success) {
        state = state.copyWith(isRecording: false, error: 'Failed to start recording');
        return false;
      }
      return true;
    } catch (e) {
      state = state.copyWith(isRecording: false, error: e.toString());
      return false;
    }
  }

  // Stop recording and save entry
  Future<VoiceJournalEntry?> stopRecording({required String title}) async {
    if (!state.isRecording) return null;
    
    try {
      final audioPath = await _voiceRecordingService.stopRecording();
      if (audioPath == null) {
        state = state.copyWith(isRecording: false, error: 'Failed to save recording');
        return null;
      }

      // Get file information
      final file = File(audioPath);
      final fileSize = await file.length();
      final duration = _voiceRecordingService.recordingDuration;

      // Create voice journal entry
      final entry = VoiceJournalEntry(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        title: title.isEmpty ? 'Voice Journal ${DateTime.now().day}/${DateTime.now().month}' : title,
        audioFilePath: audioPath,
        createdAt: DateTime.now(),
        durationSeconds: duration.inSeconds,
        fileSizeBytes: fileSize,
      );

      // Add to entries list
      final updatedEntries = [...state.entries, entry];
      state = state.copyWith(
        entries: updatedEntries,
        isRecording: false,
        currentEntry: entry,
      );

      // Save to local storage
      final saved = await _storageService.saveEntry(entry);
      if (!saved) {
        // If save failed, remove from state and show error
        final revertedEntries = state.entries.where((e) => e.id != entry.id).toList();
        state = state.copyWith(
          entries: revertedEntries,
          error: 'Failed to save voice journal entry to storage',
        );
        return null;
      }

      return entry;
    } catch (e) {
      state = state.copyWith(isRecording: false, error: e.toString());
      return null;
    }
  }

  // Cancel current recording
  Future<void> cancelRecording() async {
    if (!state.isRecording) return;
    
    await _voiceRecordingService.cancelRecording();
    state = state.copyWith(isRecording: false, currentEntry: null);
  }

  // Pause recording
  Future<void> pauseRecording() async {
    if (!state.isRecording) return;
    await _voiceRecordingService.pauseRecording();
  }

  // Resume recording
  Future<void> resumeRecording() async {
    if (!state.isRecording) return;
    await _voiceRecordingService.resumeRecording();
  }

  // Transcribe voice journal entry
  Future<void> transcribeEntry(String entryId) async {
    final entryIndex = state.entries.indexWhere((e) => e.id == entryId);
    if (entryIndex == -1) return;

    state = state.copyWith(isTranscribing: true, error: null);

    try {
      final entry = state.entries[entryIndex];
      final transcriptionResult = await _speechToTextService.transcribeAudioFile(
        entry.audioFilePath,
      );

      if (transcriptionResult != null) {
        final updatedEntry = entry.copyWith(
          transcriptionText: transcriptionResult.text,
          confidence: transcriptionResult.confidence,
          isTranscribed: true,
          updatedAt: DateTime.now(),
        );

        final updatedEntries = [...state.entries];
        updatedEntries[entryIndex] = updatedEntry;

        state = state.copyWith(
          entries: updatedEntries,
          isTranscribing: false,
        );

        // Save updated entry to local storage
        await _storageService.updateEntry(updatedEntry);
      } else {
        state = state.copyWith(
          isTranscribing: false,
          error: 'Failed to transcribe audio',
        );
      }
    } catch (e) {
      state = state.copyWith(
        isTranscribing: false,
        error: e.toString(),
      );
    }
  }

  // Play voice journal entry
  Future<void> playEntry(String entryId) async {
    final entry = state.entries.firstWhere((e) => e.id == entryId);
    await _voiceRecordingService.playRecording(entry.audioFilePath);
  }

  // Stop playback
  Future<void> stopPlayback() async {
    await _voiceRecordingService.stopPlayback();
  }

  // Delete voice journal entry
  Future<void> deleteEntry(String entryId) async {
    try {
      final entryIndex = state.entries.indexWhere((e) => e.id == entryId);
      if (entryIndex == -1) return;

      final entry = state.entries[entryIndex];
      
      // Delete audio file
      await _voiceRecordingService.deleteRecording(entry.audioFilePath);
      
      // Remove from entries list
      final updatedEntries = [...state.entries];
      updatedEntries.removeAt(entryIndex);
      
      state = state.copyWith(entries: updatedEntries);

      // Delete from local storage
      await _storageService.deleteEntry(entryId);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  // Toggle favorite status
  void toggleFavorite(String entryId) async {
    final entryIndex = state.entries.indexWhere((e) => e.id == entryId);
    if (entryIndex == -1) return;

    final entry = state.entries[entryIndex];
    final updatedEntry = entry.copyWith(
      isFavorite: !entry.isFavorite,
      updatedAt: DateTime.now(),
    );

    final updatedEntries = [...state.entries];
    updatedEntries[entryIndex] = updatedEntry;

    state = state.copyWith(entries: updatedEntries);

    // Save updated entry to local storage
    await _storageService.updateEntry(updatedEntry);
  }

  // Update entry title
  void updateEntryTitle(String entryId, String newTitle) async {
    final entryIndex = state.entries.indexWhere((e) => e.id == entryId);
    if (entryIndex == -1) return;

    final entry = state.entries[entryIndex];
    final updatedEntry = entry.copyWith(
      title: newTitle,
      updatedAt: DateTime.now(),
    );

    final updatedEntries = [...state.entries];
    updatedEntries[entryIndex] = updatedEntry;

    state = state.copyWith(entries: updatedEntries);

    // Save updated entry to local storage
    await _storageService.updateEntry(updatedEntry);
  }

  // Search entries
  List<VoiceJournalEntry> searchEntries(String query) {
    if (query.isEmpty) return state.entries;

    return state.entries.where((entry) {
      final titleMatch = entry.title.toLowerCase().contains(query.toLowerCase());
      final transcriptionMatch = entry.transcriptionText
          ?.toLowerCase()
          .contains(query.toLowerCase()) ?? false;
      final tagsMatch = entry.tags.any((tag) => 
          tag.toLowerCase().contains(query.toLowerCase()));
      
      return titleMatch || transcriptionMatch || tagsMatch;
    }).toList();
  }

  // Get entries by date range
  List<VoiceJournalEntry> getEntriesByDateRange(DateTime start, DateTime end) {
    return state.entries.where((entry) {
      return entry.createdAt.isAfter(start) && entry.createdAt.isBefore(end);
    }).toList();
  }

  // Get statistics
  Map<String, dynamic> getStatistics() {
    final totalEntries = state.entries.length;
    final totalDuration = state.entries.fold<int>(
      0, (sum, entry) => sum + entry.durationSeconds);
    final transcribedEntries = state.entries.where((e) => e.isTranscribed).length;
    final favoriteEntries = state.entries.where((e) => e.isFavorite).length;

    return {
      'totalEntries': totalEntries,
      'totalDurationMinutes': (totalDuration / 60).round(),
      'transcribedEntries': transcribedEntries,
      'favoriteEntries': favoriteEntries,
      'averageConfidence': transcribedEntries > 0
          ? state.entries.where((e) => e.isTranscribed).fold<double>(
              0, (sum, entry) => sum + entry.confidence) / transcribedEntries
          : 0.0,
    };
  }

  // Get storage statistics
  Future<Map<String, dynamic>> getStorageStatistics() async {
    try {
      return await _storageService.getStorageStatistics();
    } catch (e) {
      return {};
    }
  }

  // Export entries for backup
  Future<Map<String, dynamic>> exportEntries() async {
    try {
      return await _storageService.exportToJson();
    } catch (e) {
      state = state.copyWith(error: 'Failed to export entries: ${e.toString()}');
      return {};
    }
  }

  // Import entries from backup
  Future<bool> importEntries(Map<String, dynamic> jsonData) async {
    try {
      final success = await _storageService.importFromJson(jsonData);
      if (success) {
        // Reload entries after import
        await loadEntries();
        return true;
      }
      return false;
    } catch (e) {
      state = state.copyWith(error: 'Failed to import entries: ${e.toString()}');
      return false;
    }
  }

  // Clean up orphaned audio files
  Future<int> cleanupOrphanedFiles() async {
    try {
      return await _storageService.cleanupOrphanedFiles();
    } catch (e) {
      state = state.copyWith(error: 'Failed to cleanup files: ${e.toString()}');
      return 0;
    }
  }

  // Clear error state
  void clearError() {
    state = state.copyWith(error: null);
  }

  // Close storage service
  Future<void> dispose() async {
    await _storageService.close();
    super.dispose();
  }
}

// Provider
final voiceJournalProvider = StateNotifierProvider<VoiceJournalNotifier, VoiceJournalState>((ref) {
  final voiceRecordingService = ref.read(voiceRecordingServiceProvider);
  final speechToTextService = ref.read(speechToTextServiceProvider);
  final storageService = ref.read(voiceJournalStorageServiceProvider);
  return VoiceJournalNotifier(voiceRecordingService, speechToTextService, storageService);
}); 