import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/models/voice_journal_entry.dart';
import '../../../core/services/voice_recording_service.dart';
import '../../../core/services/speech_to_text_service.dart';
import '../../../core/services/voice_journal_storage_service.dart';
import '../../../core/services/voice_journal_sync_service.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:convert';
import 'dart:io';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'voice_journal_provider.freezed.dart';

@freezed
class VoiceJournalState with _$VoiceJournalState {
  const factory VoiceJournalState({
    @Default([]) List<VoiceJournalEntry> entries,
    @Default(false) bool isLoading,
    @Default(false) bool isRecording,
    @Default(false) bool isTranscribing,
    @Default(false) bool isAnalyzing,
    @Default(false) bool isProcessing,
    VoiceJournalEntry? currentEntry,
    String? error,
    String? searchQuery,
    @Default([]) List<String> availableTags,
    @Default({}) Map<String, dynamic> analytics,
    @Default({}) Map<String, int> categoryStats,
    @Default(Duration.zero) Duration totalRecordingTime,
    @Default(0) double recordingProgress,
    @Default(false) bool isCloudSyncEnabled,
    @Default(false) bool isSyncing,
    DateTime? lastSyncTime,
  }) = _VoiceJournalState;
}

class VoiceJournalNotifier extends StateNotifier<VoiceJournalState> {
  VoiceJournalNotifier(
    this._voiceRecordingService, 
    this._speechToTextService,
    this._storageService,
    this._syncService,
  ) : super(const VoiceJournalState()) {
    _init();
  }

  final VoiceRecordingService _voiceRecordingService;
  final SpeechToTextService _speechToTextService;
  final VoiceJournalStorageService _storageService;
  final VoiceJournalSyncService _syncService;

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
      await _storageService.saveEntry(entry);
      
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

        // Save updated entry to storage
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
      
      // Delete from storage
      await _storageService.deleteEntry(entryId);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  // Toggle favorite status
  Future<void> toggleFavorite(String entryId) async {
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
    
    // Save to storage
    await _storageService.updateEntry(updatedEntry);
  }

  // Update entry title
  Future<void> updateEntryTitle(String entryId, String newTitle) async {
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
    
    // Save to storage
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

  // Perform search and update state
  Future<void> performSearch(String query) async {
    if (query.isEmpty) {
      await loadEntries(); // Reset to all entries
      return;
    }
    
    try {
      final searchResults = await _storageService.searchEntries(query);
      state = state.copyWith(entries: searchResults, error: null);
    } catch (e) {
      state = state.copyWith(error: 'Search failed: ${e.toString()}');
    }
  }

  // Clear error
  void clearError() {
    state = state.copyWith(error: null);
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

  // Export journals to file
  Future<bool> exportJournals() async {
    try {
      if (state.entries.isEmpty) return false;
      
      final exportData = await _storageService.exportEntries();
      
      // For now, just save to documents directory
      // In a real implementation, you'd use file_picker to let user choose location
      final appDir = await getApplicationDocumentsDirectory();
      final exportFile = File('${appDir.path}/voice_journals_export_${DateTime.now().millisecondsSinceEpoch}.json');
      
      await exportFile.writeAsString(json.encode(exportData));
      return true;
    } catch (e) {
      state = state.copyWith(error: 'Export failed: ${e.toString()}');
      return false;
    }
  }

  // Import journals from file
  Future<bool> importJournals() async {
    try {
      // For now, look for export files in documents directory
      // In a real implementation, you'd use file_picker to let user choose file
      final appDir = await getApplicationDocumentsDirectory();
      final files = Directory(appDir.path)
          .listSync()
          .where((file) => file.path.contains('voice_journals_export_'))
          .cast<File>();
      
      if (files.isEmpty) {
        state = state.copyWith(error: 'No export files found to import');
        return false;
      }
      
      // Import from the most recent file
      final latestFile = files.reduce((a, b) => 
        a.lastModifiedSync().isAfter(b.lastModifiedSync()) ? a : b);
      
      final jsonContent = await latestFile.readAsString();
      final List<dynamic> jsonData = json.decode(jsonContent);
      final importData = jsonData.cast<Map<String, dynamic>>();
      
      await _storageService.importEntries(importData);
      await loadEntries(); // Refresh the entries list
      
      return true;
    } catch (e) {
      state = state.copyWith(error: 'Import failed: ${e.toString()}');
      return false;
    }
  }

  // Advanced processing methods

  // Analyze voice journal entry for emotional content and insights
  Future<void> analyzeEntry(String entryId) async {
    final entryIndex = state.entries.indexWhere((e) => e.id == entryId);
    if (entryIndex == -1) return;

    state = state.copyWith(isAnalyzing: true, error: null);

    try {
      final entry = state.entries[entryIndex];
      
      if (!entry.isTranscribed) {
        // First transcribe if not already done
        await transcribeEntry(entryId);
        final updatedEntry = state.entries.firstWhere((e) => e.id == entryId);
        if (!updatedEntry.isTranscribed) {
          throw Exception('Unable to transcribe entry for analysis');
        }
      }

      final transcriptionText = state.entries.firstWhere((e) => e.id == entryId).transcriptionText!;
      
      // Perform sentiment analysis
      final sentimentAnalysis = _analyzeSentiment(transcriptionText);
      
      // Extract key themes and topics
      final themes = _extractThemes(transcriptionText);
      
      // Generate emotional insights
      final emotionalInsights = _generateEmotionalInsights(transcriptionText, sentimentAnalysis);
      
      // Extract action items and goals
      final actionItems = _extractActionItems(transcriptionText);
      
      // Generate summary if not exists
      final summary = entry.summary.isEmpty ? _generateSummary(transcriptionText) : entry.summary;

      final analysisResults = {
        'sentiment': sentimentAnalysis,
        'themes': themes,
        'emotional_insights': emotionalInsights,
        'action_items': actionItems,
        'word_count': transcriptionText.split(' ').length,
        'analysis_date': DateTime.now().toIso8601String(),
      };

      final updatedEntry = state.entries[entryIndex].copyWith(
        isAnalyzed: true,
        analysisResults: analysisResults,
        summary: summary,
        updatedAt: DateTime.now(),
      );

      final updatedEntries = [...state.entries];
      updatedEntries[entryIndex] = updatedEntry;

      state = state.copyWith(
        entries: updatedEntries,
        isAnalyzing: false,
      );

      // Save updated entry to storage
      await _storageService.updateEntry(updatedEntry);
      
      // Update analytics
      await _updateAnalytics();

    } catch (e) {
      state = state.copyWith(
        isAnalyzing: false,
        error: 'Analysis failed: ${e.toString()}',
      );
    }
  }

  // Advanced batch processing
  Future<void> batchProcessEntries({bool transcribeAll = false, bool analyzeAll = false}) async {
    state = state.copyWith(isProcessing: true, error: null);

    try {
      final unprocessedEntries = state.entries.where((entry) {
        if (transcribeAll && !entry.isTranscribed) return true;
        if (analyzeAll && !entry.isAnalyzed) return true;
        return false;
      }).toList();

      if (unprocessedEntries.isEmpty) {
        state = state.copyWith(isProcessing: false);
        return;
      }

      for (int i = 0; i < unprocessedEntries.length; i++) {
        final entry = unprocessedEntries[i];
        
        // Update progress
        final progress = (i + 1) / unprocessedEntries.length;
        state = state.copyWith(recordingProgress: progress);

        try {
          if (transcribeAll && !entry.isTranscribed) {
            await transcribeEntry(entry.id);
          }

          if (analyzeAll && !entry.isAnalyzed) {
            await analyzeEntry(entry.id);
          }
        } catch (e) {
          print('Failed to process entry ${entry.id}: $e');
          // Continue with next entry
        }

        // Add small delay to prevent overwhelming the system
        await Future.delayed(const Duration(milliseconds: 500));
      }

      state = state.copyWith(
        isProcessing: false,
        recordingProgress: 0,
      );

    } catch (e) {
      state = state.copyWith(
        isProcessing: false,
        recordingProgress: 0,
        error: 'Batch processing failed: ${e.toString()}',
      );
    }
  }

  // Cloud sync functionality
  Future<void> enableCloudSync() async {
    state = state.copyWith(isCloudSyncEnabled: true);
    await _syncService.enableBackgroundSync();
    await syncToCloud();
  }

  Future<void> disableCloudSync() async {
    state = state.copyWith(isCloudSyncEnabled: false);
    await _syncService.cancelBackgroundSync();
  }

  Future<void> syncToCloud() async {
    if (!state.isCloudSyncEnabled) return;
    
    state = state.copyWith(isSyncing: true, error: null);

    try {
      // Perform sync using the sync service
      final syncResult = await _syncService.performSync();
      
      // Check for pending conflicts
      final syncState = _syncService.syncState;
      if (syncState.pendingConflicts.isNotEmpty) {
        // Handle conflicts - this would trigger UI to show conflict resolution
        state = state.copyWith(
          error: 'Sync conflicts detected. Please resolve ${syncState.pendingConflicts.length} conflicts.',
        );
      }
      
      // Refresh entries after sync
      await loadEntries();
      
      state = state.copyWith(
        isSyncing: false,
        lastSyncTime: syncResult.syncTime,
        error: syncResult.isSuccess ? null : 'Sync completed with errors',
      );
      
      // Update analytics after sync
      await _updateAnalytics();
      
    } catch (e) {
      state = state.copyWith(
        isSyncing: false,
        error: 'Cloud sync failed: ${e.toString()}',
      );
    }
  }
  
  // Resolve sync conflict manually
  Future<void> resolveSyncConflict(
    String entryId,
    ConflictResolution resolution, {
    VoiceJournalEntry? customResolution,
  }) async {
    try {
      await _syncService.resolveConflictManually(
        entryId,
        resolution,
        customResolution: customResolution,
      );
      
      // Refresh entries after conflict resolution
      await loadEntries();
      
    } catch (e) {
      state = state.copyWith(
        error: 'Failed to resolve conflict: ${e.toString()}',
      );
    }
  }
  
  // Check if sync is needed
  Future<bool> isSyncNeeded() async {
    return await _syncService.isSyncNeeded();
  }
  
  // Get sync statistics
  Map<String, dynamic> getSyncStatistics() {
    final syncStats = _syncService.getSyncStatistics();
    syncStats['localEntries'] = state.entries.length;
    syncStats['unsyncedEntries'] = state.entries.where((e) => !e.isSyncedToCloud).length;
    return syncStats;
  }

  // Advanced analytics and insights
  Future<void> _updateAnalytics() async {
    final entries = state.entries;
    
    if (entries.isEmpty) {
      state = state.copyWith(analytics: {});
      return;
    }

    final totalEntries = entries.length;
    final transcribedEntries = entries.where((e) => e.isTranscribed).length;
    final analyzedEntries = entries.where((e) => e.isAnalyzed).length;
    
    // Calculate sentiment trends
    final sentimentData = entries
        .where((e) => e.isAnalyzed && e.analysisResults != null)
        .map((e) => e.analysisResults!['sentiment'] as Map<String, dynamic>)
        .toList();
    
    final avgSentiment = sentimentData.isNotEmpty 
        ? sentimentData.fold<double>(0, (sum, s) => sum + (s['score'] as double)) / sentimentData.length
        : 0.0;

    // Calculate recording patterns
    final recordingsByDay = <String, int>{};
    final recordingsByHour = <int, int>{};
    
    for (final entry in entries) {
      final date = entry.createdAt;
      final dayKey = '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
      recordingsByDay[dayKey] = (recordingsByDay[dayKey] ?? 0) + 1;
      recordingsByHour[date.hour] = (recordingsByHour[date.hour] ?? 0) + 1;
    }

    // Calculate total recording time
    final totalDuration = entries.fold<int>(0, (sum, entry) => sum + entry.durationSeconds);
    
    // Calculate average entry length
    final avgDurationSeconds = entries.isNotEmpty ? totalDuration / entries.length : 0.0;

    // Extract most common themes
    final allThemes = entries
        .where((e) => e.isAnalyzed && e.analysisResults != null)
        .expand((e) => e.analysisResults!['themes'] as List<String>)
        .toList();
    
    final themeCounts = <String, int>{};
    for (final theme in allThemes) {
      themeCounts[theme] = (themeCounts[theme] ?? 0) + 1;
    }

    final analytics = {
      'totalEntries': totalEntries,
      'transcribedEntries': transcribedEntries,
      'analyzedEntries': analyzedEntries,
      'processingProgress': totalEntries > 0 ? analyzedEntries / totalEntries : 0.0,
      'averageSentiment': avgSentiment,
      'totalDurationMinutes': (totalDuration / 60).round(),
      'averageDurationMinutes': (avgDurationSeconds / 60),
      'recordingsByDay': recordingsByDay,
      'recordingsByHour': recordingsByHour,
      'mostCommonThemes': themeCounts.entries
          .toList()
          ..sort((a, b) => b.value.compareTo(a.value))
          .take(10)
          .map((e) => {'theme': e.key, 'count': e.value})
          .toList(),
      'lastUpdated': DateTime.now().toIso8601String(),
    };

    state = state.copyWith(analytics: analytics, totalRecordingTime: Duration(seconds: totalDuration));
  }

  // AI-powered analysis methods
  Map<String, dynamic> _analyzeSentiment(String text) {
    // Simple sentiment analysis - in production, you'd use a proper NLP service
    final positiveWords = ['happy', 'good', 'great', 'amazing', 'wonderful', 'excellent', 'fantastic', 'love', 'joy', 'excited'];
    final negativeWords = ['sad', 'bad', 'terrible', 'awful', 'hate', 'angry', 'frustrated', 'disappointed', 'worried', 'stressed'];
    
    final words = text.toLowerCase().split(' ');
    int positiveCount = 0;
    int negativeCount = 0;
    
    for (final word in words) {
      if (positiveWords.contains(word)) positiveCount++;
      if (negativeWords.contains(word)) negativeCount++;
    }
    
    final totalSentimentWords = positiveCount + negativeCount;
    final score = totalSentimentWords > 0 
        ? (positiveCount - negativeCount) / totalSentimentWords 
        : 0.0;
    
    String label;
    if (score > 0.2) {
      label = 'Positive';
    } else if (score < -0.2) {
      label = 'Negative';
    } else {
      label = 'Neutral';
    }
    
    return {
      'score': score,
      'label': label,
      'confidence': (totalSentimentWords / words.length).clamp(0.0, 1.0),
      'positiveWords': positiveCount,
      'negativeWords': negativeCount,
    };
  }

  List<String> _extractThemes(String text) {
    // Simple theme extraction - in production, you'd use proper NLP
    final themes = <String>[];
    final lowercaseText = text.toLowerCase();
    
    final themeKeywords = {
      'work': ['work', 'job', 'career', 'office', 'meeting', 'project', 'deadline'],
      'relationships': ['family', 'friend', 'relationship', 'love', 'partner', 'spouse'],
      'health': ['health', 'exercise', 'diet', 'fitness', 'medical', 'doctor'],
      'goals': ['goal', 'plan', 'achievement', 'success', 'objective', 'target'],
      'emotions': ['feel', 'emotion', 'mood', 'happy', 'sad', 'angry', 'excited'],
      'learning': ['learn', 'study', 'education', 'course', 'skill', 'knowledge'],
      'travel': ['travel', 'trip', 'vacation', 'journey', 'adventure'],
      'hobbies': ['hobby', 'interest', 'passion', 'music', 'art', 'sport'],
    };
    
    for (final theme in themeKeywords.keys) {
      final keywords = themeKeywords[theme]!;
      if (keywords.any((keyword) => lowercaseText.contains(keyword))) {
        themes.add(theme);
      }
    }
    
    return themes;
  }

  List<String> _generateEmotionalInsights(String text, Map<String, dynamic> sentiment) {
    final insights = <String>[];
    
    final sentimentScore = sentiment['score'] as double;
    final sentimentLabel = sentiment['label'] as String;
    
    if (sentimentScore > 0.5) {
      insights.add('You seem to be in a very positive emotional state');
    } else if (sentimentScore < -0.5) {
      insights.add('You might be experiencing some challenging emotions');
    }
    
    if (text.toLowerCase().contains('stressed')) {
      insights.add('Consider stress management techniques');
    }
    
    if (text.toLowerCase().contains('grateful') || text.toLowerCase().contains('thankful')) {
      insights.add('Gratitude practice is showing positive effects');
    }
    
    if (text.split(' ').length > 200) {
      insights.add('You had a lot to express today - reflection is valuable');
    }
    
    return insights;
  }

  List<String> _extractActionItems(String text) {
    final actionItems = <String>[];
    final sentences = text.split('.');
    
    final actionWords = ['need to', 'should', 'will', 'plan to', 'want to', 'have to', 'must'];
    
    for (final sentence in sentences) {
      final lowerSentence = sentence.toLowerCase().trim();
      if (actionWords.any((word) => lowerSentence.contains(word))) {
        actionItems.add(sentence.trim());
      }
    }
    
    return actionItems.take(5).toList(); // Limit to top 5
  }

  String _generateSummary(String text) {
    // Simple summary generation - take first sentence and key points
    final sentences = text.split('.').where((s) => s.trim().isNotEmpty).toList();
    
    if (sentences.isEmpty) return text;
    if (sentences.length <= 2) return text;
    
    final firstSentence = sentences.first.trim();
    final keyPoints = sentences.skip(1).take(2).map((s) => s.trim()).join('. ');
    
    return '$firstSentence. $keyPoints.'.replaceAll('..', '.');
  }

  // Share audio file
  Future<void> shareAudioFile(String entryId) async {
    try {
      final entry = state.entries.firstWhere((e) => e.id == entryId);
      await _storageService.shareAudioFile(entry.audioFilePath);
    } catch (e) {
      state = state.copyWith(error: 'Failed to share audio: ${e.toString()}');
      rethrow;
    }
  }

  // Share transcription text
  Future<void> shareTranscription(String entryId) async {
    try {
      final entry = state.entries.firstWhere((e) => e.id == entryId);
      if (!entry.isTranscribed || entry.transcriptionText == null) {
        throw Exception('No transcription available to share');
      }

      final shareText = '''
Voice Journal: ${entry.title}
Date: ${entry.createdAt.toString()}

${entry.transcriptionText}

---
Recorded with UpCoach Voice Journal
Duration: ${Duration(seconds: entry.durationSeconds).toString()}
      ''';

      await _storageService.shareText(shareText);
    } catch (e) {
      state = state.copyWith(error: 'Failed to share transcription: ${e.toString()}');
      rethrow;
    }
  }

  // Export single entry as PDF
  Future<void> exportEntryAsPDF(String entryId) async {
    try {
      final entry = state.entries.firstWhere((e) => e.id == entryId);
      await _storageService.exportEntryAsPDF(entry);
    } catch (e) {
      state = state.copyWith(error: 'Failed to export PDF: ${e.toString()}');
      rethrow;
    }
  }

  // Get insights and recommendations
  Map<String, dynamic> getPersonalInsights() {
    final analytics = state.analytics;
    final insights = <String>[];
    final recommendations = <String>[];
    
    if (analytics.isEmpty) return {'insights': insights, 'recommendations': recommendations};
    
    final totalEntries = analytics['totalEntries'] as int;
    final avgSentiment = analytics['averageSentiment'] as double;
    final processingProgress = analytics['processingProgress'] as double;
    
    // Generate insights
    if (totalEntries > 10) {
      insights.add('You\'ve been consistently journaling - great habit!');
    }
    
    if (avgSentiment > 0.2) {
      insights.add('Your overall emotional tone has been positive');
    } else if (avgSentiment < -0.2) {
      insights.add('You might benefit from focusing on positive aspects');
    }
    
    if (processingProgress < 0.5) {
      recommendations.add('Consider analyzing more entries for better insights');
    }
    
    // Recording pattern insights
    final recordingsByHour = analytics['recordingsByHour'] as Map<int, int>;
    if (recordingsByHour.isNotEmpty) {
      final mostActiveHour = recordingsByHour.entries.reduce((a, b) => a.value > b.value ? a : b);
      insights.add('You tend to journal most at ${mostActiveHour.key}:00');
    }
    
    return {
      'insights': insights,
      'recommendations': recommendations,
      'analytics': analytics,
    };
  }

  // Delete old voice journal entries with authorization
  Future<int> deleteOldEntries(DateTime cutoffDate) async {
    try {
      // Verify user authentication
      final currentUser = await _authService.getCurrentUser();
      if (currentUser == null) {
        throw Exception('User not authenticated');
      }

      // Show confirmation dialog for bulk deletion
      final confirmed = await _showBulkDeleteConfirmation(cutoffDate);
      if (!confirmed) return 0;

      int deletedCount = 0;
      final entriesToDelete = state.entries
          .where((entry) =>
              entry.createdAt.isBefore(cutoffDate) &&
              entry.userId == currentUser.id) // Verify ownership
          .toList();

      for (final entry in entriesToDelete) {
        try {
          // Verify user owns this entry
          if (entry.userId != currentUser.id) {
            print('Skipping entry ${entry.id}: Access denied');
            continue;
          }

          // Soft delete - mark as deleted instead of permanent deletion
          await _storageService.softDeleteEntry(entry.id);

          // Log deletion for audit
          await _auditService.logDeletion(entry.id, 'bulk_delete_old_entries');

          deletedCount++;
        } catch (e) {
          // Log error but continue with other deletions
          print('Failed to delete entry ${entry.id}: $e');
        }
      }

      // Remove deleted entries from state
      final updatedEntries = state.entries
          .where((entry) => !entry.createdAt.isBefore(cutoffDate) || entry.userId != currentUser.id)
          .toList();

      state = state.copyWith(entries: updatedEntries);

      return deletedCount;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      throw Exception('Failed to delete old entries: $e');
    }
  }

  // Batch delete multiple entries by IDs with authorization
  Future<int> deleteBatchEntries(List<String> entryIds) async {
    try {
      // Verify user authentication
      final currentUser = await _authService.getCurrentUser();
      if (currentUser == null) {
        throw Exception('User not authenticated');
      }

      // Show confirmation dialog for batch deletion
      final confirmed = await _showBatchDeleteConfirmation(entryIds.length);
      if (!confirmed) return 0;

      int deletedCount = 0;

      for (final entryId in entryIds) {
        try {
          final entryIndex = state.entries.indexWhere((e) => e.id == entryId);
          if (entryIndex == -1) continue;

          final entry = state.entries[entryIndex];

          // Verify user owns this entry
          if (entry.userId != currentUser.id) {
            print('Skipping entry $entryId: Access denied');
            continue;
          }

          // Soft delete - mark as deleted instead of permanent deletion
          await _storageService.softDeleteEntry(entryId);

          // Log deletion for audit
          await _auditService.logDeletion(entryId, 'batch_delete_entries');

          deletedCount++;
        } catch (e) {
          // Log error but continue with other deletions
          print('Failed to delete entry $entryId: $e');
        }
      }

      // Remove deleted entries from state
      final updatedEntries = state.entries.where((entry) => !entryIds.contains(entry.id)).toList();

      state = state.copyWith(entries: updatedEntries);

      return deletedCount;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      throw Exception('Failed to delete entries: $e');
    }
  }

  // Delete entries by filter criteria
  Future<int> deleteEntriesByFilter({
    bool? favoriteOnly,
    bool? transcribedOnly,
    List<String>? tags,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final entriesToDelete = state.entries.where((entry) {
        // Apply filters
        if (favoriteOnly == true && !entry.isFavorite) return false;
        if (favoriteOnly == false && entry.isFavorite) return false;

        if (transcribedOnly == true && !entry.isTranscribed) return false;
        if (transcribedOnly == false && entry.isTranscribed) return false;

        if (tags != null && tags.isNotEmpty) {
          if (!tags.any((tag) => entry.tags.contains(tag))) return false;
        }

        if (startDate != null && entry.createdAt.isBefore(startDate)) return false;
        if (endDate != null && entry.createdAt.isAfter(endDate)) return false;

        return true;
      }).toList();

      final entryIds = entriesToDelete.map((e) => e.id).toList();
      return await deleteBatchEntries(entryIds);
    } catch (e) {
      state = state.copyWith(error: e.toString());
      throw Exception('Failed to delete filtered entries: $e');
    }
  }
}

// Provider
final voiceJournalProvider = StateNotifierProvider<VoiceJournalNotifier, VoiceJournalState>((ref) {
  final voiceRecordingService = ref.read(voiceRecordingServiceProvider);
  final speechToTextService = ref.read(speechToTextServiceProvider);
  final storageService = ref.read(voiceJournalStorageServiceProvider);
  final syncService = ref.read(voiceJournalSyncServiceProvider.notifier);
  return VoiceJournalNotifier(voiceRecordingService, speechToTextService, storageService, syncService);
}); 