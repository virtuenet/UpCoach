import 'dart:io';
import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:record/record.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:path_provider/path_provider.dart';
import 'package:http/http.dart' as http;
import '../models/voice_journal_entry.dart';
import '../database/app_database.dart';
import '../utils/storage_utils.dart';
import '../utils/encryption_utils.dart';
import '../utils/audio_utils.dart';

/// Voice Journal Service
/// Handles voice recording, transcription, emotional analysis, and management
class VoiceJournalService {
  static const String _baseUrl = 'https://api.upcoach.com';
  static const int _maxRecordingDurationMs = 600000; // 10 minutes
  static const double _minRecordingDurationMs = 1000; // 1 second
  
  final AudioRecorder _recorder = AudioRecorder();
  final AudioPlayer _player = AudioPlayer();
  final AppDatabase _database = AppDatabase();
  
  bool _isRecording = false;
  bool _isPlaying = false;
  String? _currentRecordingPath;
  DateTime? _recordingStartTime;
  
  // Stream controllers for real-time updates
  final _recordingStateController = StreamController<VoiceRecordingState>.broadcast();
  final _playbackStateController = StreamController<VoicePlaybackState>.broadcast();
  final _transcriptionController = StreamController<TranscriptionUpdate>.broadcast();

  // Getters for streams
  Stream<VoiceRecordingState> get recordingStateStream => _recordingStateController.stream;
  Stream<VoicePlaybackState> get playbackStateStream => _playbackStateController.stream;
  Stream<TranscriptionUpdate> get transcriptionStream => _transcriptionController.stream;

  // Getters for current state
  bool get isRecording => _isRecording;
  bool get isPlaying => _isPlaying;
  int? get currentRecordingDuration => _recordingStartTime != null 
      ? DateTime.now().difference(_recordingStartTime!).inMilliseconds 
      : null;

  /// Start voice recording
  Future<bool> startRecording({
    String? customPath,
    AudioFormat format = AudioFormat.wav,
    int sampleRate = 44100,
  }) async {
    try {
      if (_isRecording) {
        throw Exception('Recording already in progress');
      }

      // Check microphone permission
      if (!await _recorder.hasPermission()) {
        throw Exception('Microphone permission not granted');
      }

      // Create recording directory if needed
      final directory = await _getRecordingsDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final fileName = customPath ?? 'voice_journal_$timestamp.${format.name}';
      final filePath = '${directory.path}/$fileName';

      // Configure recording settings
      const config = RecordConfig(
        encoder: AudioEncoder.wav,
        bitRate: 128000,
        sampleRate: 44100,
        numChannels: 1,
        autoGain: true,
        echoCancel: true,
        noiseSuppress: true,
      );

      // Start recording
      await _recorder.start(config, path: filePath);
      
      _isRecording = true;
      _currentRecordingPath = filePath;
      _recordingStartTime = DateTime.now();

      // Emit recording state
      _recordingStateController.add(VoiceRecordingState(
        isRecording: true,
        duration: 0,
        amplitude: 0.0,
        filePath: filePath,
      ));

      // Start amplitude monitoring
      _startAmplitudeMonitoring();

      return true;
    } catch (e) {
      print('Error starting recording: $e');
      return false;
    }
  }

  /// Stop voice recording
  Future<VoiceJournalEntry?> stopRecording({
    String? title,
    String? description,
    JournalCategory category = JournalCategory.personal,
    List<String> tags = const [],
  }) async {
    try {
      if (!_isRecording) {
        throw Exception('No recording in progress');
      }

      // Stop recording
      final recordingPath = await _recorder.stop();
      
      if (recordingPath == null || _currentRecordingPath == null) {
        throw Exception('Failed to save recording');
      }

      final duration = DateTime.now().difference(_recordingStartTime!).inMilliseconds;
      
      // Validate minimum duration
      if (duration < _minRecordingDurationMs) {
        await File(_currentRecordingPath!).delete();
        throw Exception('Recording too short');
      }

      // Get audio file info
      final audioFile = File(_currentRecordingPath!);
      final audioQuality = await _calculateAudioQuality(_currentRecordingPath!);

      // Create journal entry
      final entry = VoiceJournalEntry(
        id: _generateId(),
        userId: await _getCurrentUserId(),
        title: title ?? 'Voice Journal ${DateTime.now().toString().substring(0, 16)}',
        description: description,
        audioFilePath: _currentRecordingPath!,
        durationMs: duration,
        audioQuality: audioQuality,
        audioFormat: 'wav',
        isTranscriptionProcessed: false,
        transcriptionSegments: [],
        detectedEmotions: [],
        createdAt: DateTime.now(),
        tags: tags,
        isFavorite: false,
        isPrivate: true,
        category: category,
        isUploaded: false,
        needsSync: true,
      );

      // Save to local database
      await _database.insertVoiceJournalEntry(entry);

      // Reset recording state
      _isRecording = false;
      _currentRecordingPath = null;
      _recordingStartTime = null;

      // Emit final recording state
      _recordingStateController.add(VoiceRecordingState(
        isRecording: false,
        duration: duration,
        amplitude: 0.0,
        filePath: recordingPath,
      ));

      // Start background transcription
      _startBackgroundTranscription(entry);

      return entry;
    } catch (e) {
      print('Error stopping recording: $e');
      _isRecording = false;
      _currentRecordingPath = null;
      _recordingStartTime = null;
      return null;
    }
  }

  /// Cancel current recording
  Future<void> cancelRecording() async {
    try {
      if (_isRecording) {
        await _recorder.stop();
        
        // Delete the file
        if (_currentRecordingPath != null) {
          final file = File(_currentRecordingPath!);
          if (await file.exists()) {
            await file.delete();
          }
        }

        _isRecording = false;
        _currentRecordingPath = null;
        _recordingStartTime = null;

        _recordingStateController.add(VoiceRecordingState(
          isRecording: false,
          duration: 0,
          amplitude: 0.0,
          filePath: null,
        ));
      }
    } catch (e) {
      print('Error canceling recording: $e');
    }
  }

  /// Play voice journal entry
  Future<bool> playEntry(VoiceJournalEntry entry) async {
    try {
      if (_isPlaying) {
        await stopPlayback();
      }

      final file = File(entry.audioFilePath);
      if (!await file.exists()) {
        throw Exception('Audio file not found');
      }

      await _player.play(DeviceFileSource(entry.audioFilePath));
      _isPlaying = true;

      // Listen for playback completion
      _player.onPlayerComplete.listen((_) {
        _isPlaying = false;
        _playbackStateController.add(VoicePlaybackState(
          isPlaying: false,
          position: Duration.zero,
          duration: Duration(milliseconds: entry.durationMs),
          entryId: entry.id,
        ));
      });

      // Listen for position updates
      _player.onPositionChanged.listen((position) {
        _playbackStateController.add(VoicePlaybackState(
          isPlaying: true,
          position: position,
          duration: Duration(milliseconds: entry.durationMs),
          entryId: entry.id,
        ));
      });

      return true;
    } catch (e) {
      print('Error playing entry: $e');
      return false;
    }
  }

  /// Stop playback
  Future<void> stopPlayback() async {
    try {
      await _player.stop();
      _isPlaying = false;
    } catch (e) {
      print('Error stopping playback: $e');
    }
  }

  /// Pause/Resume playback
  Future<void> pausePlayback() async {
    try {
      await _player.pause();
    } catch (e) {
      print('Error pausing playback: $e');
    }
  }

  Future<void> resumePlayback() async {
    try {
      await _player.resume();
    } catch (e) {
      print('Error resuming playback: $e');
    }
  }

  /// Get all voice journal entries
  Future<List<VoiceJournalEntry>> getAllEntries({
    JournalCategory? category,
    DateTime? startDate,
    DateTime? endDate,
    List<String>? tags,
    bool? isFavorite,
    int? limit,
  }) async {
    try {
      return await _database.getVoiceJournalEntries(
        category: category,
        startDate: startDate,
        endDate: endDate,
        tags: tags,
        isFavorite: isFavorite,
        limit: limit,
      );
    } catch (e) {
      print('Error getting entries: $e');
      return [];
    }
  }

  /// Search entries by transcription content
  Future<List<VoiceJournalEntry>> searchEntries(String query) async {
    try {
      return await _database.searchVoiceJournalEntries(query);
    } catch (e) {
      print('Error searching entries: $e');
      return [];
    }
  }

  /// Update entry metadata
  Future<bool> updateEntry(VoiceJournalEntry entry) async {
    try {
      await _database.updateVoiceJournalEntry(entry);
      return true;
    } catch (e) {
      print('Error updating entry: $e');
      return false;
    }
  }

  /// Delete entry
  Future<bool> deleteEntry(String entryId) async {
    try {
      final entry = await _database.getVoiceJournalEntry(entryId);
      if (entry != null) {
        // Delete audio file
        final file = File(entry.audioFilePath);
        if (await file.exists()) {
          await file.delete();
        }
        
        // Delete from database
        await _database.deleteVoiceJournalEntry(entryId);
        return true;
      }
      return false;
    } catch (e) {
      print('Error deleting entry: $e');
      return false;
    }
  }

  /// Get entry statistics
  Future<VoiceJournalStats> getStatistics({
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final entries = await getAllEntries(startDate: startDate, endDate: endDate);
      
      return VoiceJournalStats(
        totalEntries: entries.length,
        totalDurationMs: entries.fold(0, (sum, entry) => sum + entry.durationMs),
        averageDurationMs: entries.isNotEmpty 
            ? entries.fold(0, (sum, entry) => sum + entry.durationMs) ~/ entries.length 
            : 0,
        categoryCounts: _calculateCategoryCounts(entries),
        moodDistribution: _calculateMoodDistribution(entries),
        weeklyProgress: await _calculateWeeklyProgress(entries),
        transcriptionRate: _calculateTranscriptionRate(entries),
      );
    } catch (e) {
      print('Error calculating statistics: $e');
      return VoiceJournalStats.empty();
    }
  }

  /// Sync entries with cloud
  Future<bool> syncWithCloud() async {
    try {
      final unsyncedEntries = await _database.getUnsyncedVoiceJournalEntries();
      
      for (final entry in unsyncedEntries) {
        final success = await _uploadEntry(entry);
        if (success) {
          final updatedEntry = entry.copyWith(
            isUploaded: true,
            needsSync: false,
            lastSyncAt: DateTime.now(),
          );
          await _database.updateVoiceJournalEntry(updatedEntry);
        }
      }
      
      return true;
    } catch (e) {
      print('Error syncing with cloud: $e');
      return false;
    }
  }

  /// Start background transcription for an entry
  Future<void> _startBackgroundTranscription(VoiceJournalEntry entry) async {
    try {
      _transcriptionController.add(TranscriptionUpdate(
        entryId: entry.id,
        status: TranscriptionStatus.processing,
        progress: 0.0,
      ));

      // Upload audio for transcription
      final transcriptionResult = await _requestTranscription(entry.audioFilePath);
      
      if (transcriptionResult != null) {
        // Update entry with transcription
        final updatedEntry = entry.copyWith(
          transcription: transcriptionResult.text,
          transcriptionConfidence: transcriptionResult.confidence,
          isTranscriptionProcessed: true,
          transcriptionSegments: transcriptionResult.segments,
          emotionalAnalysis: transcriptionResult.emotionalAnalysis,
          detectedMood: transcriptionResult.emotionalAnalysis?.primaryEmotion,
          sentimentScore: transcriptionResult.emotionalAnalysis?.valence,
          detectedEmotions: transcriptionResult.emotionalAnalysis?.emotionScores.keys.toList() ?? [],
          needsSync: true,
        );

        await _database.updateVoiceJournalEntry(updatedEntry);

        _transcriptionController.add(TranscriptionUpdate(
          entryId: entry.id,
          status: TranscriptionStatus.completed,
          progress: 1.0,
          transcription: transcriptionResult.text,
        ));
      } else {
        _transcriptionController.add(TranscriptionUpdate(
          entryId: entry.id,
          status: TranscriptionStatus.failed,
          progress: 0.0,
          error: 'Transcription service unavailable',
        ));
      }
    } catch (e) {
      print('Error in background transcription: $e');
      _transcriptionController.add(TranscriptionUpdate(
        entryId: entry.id,
        status: TranscriptionStatus.failed,
        progress: 0.0,
        error: e.toString(),
      ));
    }
  }

  /// Request transcription from cloud service
  Future<TranscriptionResult?> _requestTranscription(String audioPath) async {
    try {
      final file = File(audioPath);
      if (!await file.exists()) return null;

      // Create multipart request
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('$_baseUrl/api/voice-journal/transcribe'),
      );

      // Add audio file
      request.files.add(await http.MultipartFile.fromPath('audio', audioPath));
      
      // Add headers
      request.headers['Authorization'] = 'Bearer ${await _getAuthToken()}';
      request.headers['Content-Type'] = 'multipart/form-data';

      // Send request
      final response = await request.send();
      
      if (response.statusCode == 200) {
        final responseBody = await response.stream.bytesToString();
        final data = json.decode(responseBody);
        
        if (data['success']) {
          return TranscriptionResult.fromJson(data['data']);
        }
      }
      
      return null;
    } catch (e) {
      print('Error requesting transcription: $e');
      return null;
    }
  }

  /// Upload entry to cloud
  Future<bool> _uploadEntry(VoiceJournalEntry entry) async {
    try {
      final file = File(entry.audioFilePath);
      if (!await file.exists()) return false;

      // Create multipart request
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('$_baseUrl/api/voice-journal/upload'),
      );

      // Add audio file
      request.files.add(await http.MultipartFile.fromPath('audio', entry.audioFilePath));
      
      // Add entry metadata
      request.fields['entryData'] = json.encode(entry.toJson());
      
      // Add headers
      request.headers['Authorization'] = 'Bearer ${await _getAuthToken()}';

      // Send request
      final response = await request.send();
      
      return response.statusCode == 200;
    } catch (e) {
      print('Error uploading entry: $e');
      return false;
    }
  }

  /// Helper methods
  Future<Directory> _getRecordingsDirectory() async {
    final appDir = await getApplicationDocumentsDirectory();
    final recordingsDir = Directory('${appDir.path}/voice_recordings');
    if (!await recordingsDir.exists()) {
      await recordingsDir.create(recursive: true);
    }
    return recordingsDir;
  }

  String _generateId() {
    return DateTime.now().millisecondsSinceEpoch.toString();
  }

  Future<String> _getCurrentUserId() async {
    // TODO: Get from authentication service
    return 'current_user_id';
  }

  Future<String> _getAuthToken() async {
    // TODO: Get from authentication service
    return 'auth_token';
  }

  Future<double> _calculateAudioQuality(String filePath) async {
    try {
      // TODO: Implement audio quality analysis
      return 0.8;
    } catch (e) {
      return 0.5;
    }
  }

  void _startAmplitudeMonitoring() {
    // TODO: Implement real-time amplitude monitoring
  }

  Map<JournalCategory, int> _calculateCategoryCounts(List<VoiceJournalEntry> entries) {
    final counts = <JournalCategory, int>{};
    for (final entry in entries) {
      counts[entry.category] = (counts[entry.category] ?? 0) + 1;
    }
    return counts;
  }

  Map<String, int> _calculateMoodDistribution(List<VoiceJournalEntry> entries) {
    final distribution = <String, int>{};
    for (final entry in entries) {
      if (entry.detectedMood != null) {
        distribution[entry.detectedMood!] = (distribution[entry.detectedMood!] ?? 0) + 1;
      }
    }
    return distribution;
  }

  Future<Map<String, int>> _calculateWeeklyProgress(List<VoiceJournalEntry> entries) async {
    final progress = <String, int>{};
    final now = DateTime.now();
    
    for (int i = 0; i < 7; i++) {
      final date = now.subtract(Duration(days: i));
      final dateStr = '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
      
      final dayEntries = entries.where((entry) =>
          entry.createdAt.year == date.year &&
          entry.createdAt.month == date.month &&
          entry.createdAt.day == date.day).length;
      
      progress[dateStr] = dayEntries;
    }
    
    return progress;
  }

  double _calculateTranscriptionRate(List<VoiceJournalEntry> entries) {
    if (entries.isEmpty) return 0.0;
    final transcribedCount = entries.where((entry) => entry.isTranscriptionProcessed).length;
    return transcribedCount / entries.length;
  }

  /// Clean up resources
  void dispose() {
    _recorder.dispose();
    _player.dispose();
    _recordingStateController.close();
    _playbackStateController.close();
    _transcriptionController.close();
  }
}

/// Recording state data
class VoiceRecordingState {
  final bool isRecording;
  final int duration;
  final double amplitude;
  final String? filePath;

  VoiceRecordingState({
    required this.isRecording,
    required this.duration,
    required this.amplitude,
    this.filePath,
  });
}

/// Playback state data
class VoicePlaybackState {
  final bool isPlaying;
  final Duration position;
  final Duration duration;
  final String entryId;

  VoicePlaybackState({
    required this.isPlaying,
    required this.position,
    required this.duration,
    required this.entryId,
  });
}

/// Transcription update data
class TranscriptionUpdate {
  final String entryId;
  final TranscriptionStatus status;
  final double progress;
  final String? transcription;
  final String? error;

  TranscriptionUpdate({
    required this.entryId,
    required this.status,
    required this.progress,
    this.transcription,
    this.error,
  });
}

/// Transcription status
enum TranscriptionStatus {
  processing,
  completed,
  failed,
}

/// Transcription result from cloud service
class TranscriptionResult {
  final String text;
  final double confidence;
  final List<TranscriptionSegment> segments;
  final EmotionalAnalysis? emotionalAnalysis;

  TranscriptionResult({
    required this.text,
    required this.confidence,
    required this.segments,
    this.emotionalAnalysis,
  });

  factory TranscriptionResult.fromJson(Map<String, dynamic> json) {
    return TranscriptionResult(
      text: json['text'],
      confidence: json['confidence']?.toDouble() ?? 0.0,
      segments: (json['segments'] as List?)
          ?.map((s) => TranscriptionSegment.fromJson(s))
          .toList() ?? [],
      emotionalAnalysis: json['emotional_analysis'] != null
          ? EmotionalAnalysis.fromJson(json['emotional_analysis'])
          : null,
    );
  }
}

/// Voice journal statistics
class VoiceJournalStats {
  final int totalEntries;
  final int totalDurationMs;
  final int averageDurationMs;
  final Map<JournalCategory, int> categoryCounts;
  final Map<String, int> moodDistribution;
  final Map<String, int> weeklyProgress;
  final double transcriptionRate;

  VoiceJournalStats({
    required this.totalEntries,
    required this.totalDurationMs,
    required this.averageDurationMs,
    required this.categoryCounts,
    required this.moodDistribution,
    required this.weeklyProgress,
    required this.transcriptionRate,
  });

  factory VoiceJournalStats.empty() {
    return VoiceJournalStats(
      totalEntries: 0,
      totalDurationMs: 0,
      averageDurationMs: 0,
      categoryCounts: {},
      moodDistribution: {},
      weeklyProgress: {},
      transcriptionRate: 0.0,
    );
  }

  String get formattedTotalDuration {
    final hours = totalDurationMs ~/ 3600000;
    final minutes = (totalDurationMs % 3600000) ~/ 60000;
    
    if (hours > 0) {
      return '${hours}h ${minutes}m';
    } else {
      return '${minutes}m';
    }
  }
} 