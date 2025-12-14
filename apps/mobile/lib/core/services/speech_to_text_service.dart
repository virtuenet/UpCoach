import 'package:flutter/foundation.dart';
import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:speech_to_text/speech_recognition_error.dart';
import 'package:speech_to_text/speech_recognition_result.dart';
import 'package:speech_to_text/speech_to_text.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';
import '../constants/api_constants.dart';
import '../storage/secure_storage.dart';

/// Status of a queued transcription
enum TranscriptionQueueStatus {
  pending,
  processing,
  completed,
  failed,
}

/// Item in the transcription queue
class TranscriptionQueueItem {
  final String id;
  final String filePath;
  final String language;
  final bool enableWordTimings;
  final bool enablePunctuation;
  final DateTime createdAt;
  final TranscriptionQueueStatus status;
  final int retryCount;
  final String? errorMessage;

  const TranscriptionQueueItem({
    required this.id,
    required this.filePath,
    required this.language,
    this.enableWordTimings = false,
    this.enablePunctuation = true,
    required this.createdAt,
    this.status = TranscriptionQueueStatus.pending,
    this.retryCount = 0,
    this.errorMessage,
  });

  TranscriptionQueueItem copyWith({
    TranscriptionQueueStatus? status,
    int? retryCount,
    String? errorMessage,
  }) {
    return TranscriptionQueueItem(
      id: id,
      filePath: filePath,
      language: language,
      enableWordTimings: enableWordTimings,
      enablePunctuation: enablePunctuation,
      createdAt: createdAt,
      status: status ?? this.status,
      retryCount: retryCount ?? this.retryCount,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'filePath': filePath,
        'language': language,
        'enableWordTimings': enableWordTimings,
        'enablePunctuation': enablePunctuation,
        'createdAt': createdAt.toIso8601String(),
        'status': status.name,
        'retryCount': retryCount,
        'errorMessage': errorMessage,
      };

  factory TranscriptionQueueItem.fromJson(Map<String, dynamic> json) {
    return TranscriptionQueueItem(
      id: json['id'] as String,
      filePath: json['filePath'] as String,
      language: json['language'] as String? ?? 'en-US',
      enableWordTimings: json['enableWordTimings'] as bool? ?? false,
      enablePunctuation: json['enablePunctuation'] as bool? ?? true,
      createdAt: DateTime.parse(json['createdAt'] as String),
      status: TranscriptionQueueStatus.values.firstWhere(
        (s) => s.name == json['status'],
        orElse: () => TranscriptionQueueStatus.pending,
      ),
      retryCount: json['retryCount'] as int? ?? 0,
      errorMessage: json['errorMessage'] as String?,
    );
  }
}

/// Key for storing transcription queue in SharedPreferences
const String _transcriptionQueueKey = 'transcription_queue';

/// Maximum retry attempts for queued transcriptions
const int _maxRetryAttempts = 3;

class TranscriptionResult {
  final String text;
  final double confidence;
  final bool isFinal;
  final DateTime timestamp;
  final List<WordTiming>? wordTimings;
  final String? detectedLanguage;

  /// Whether this result is from the queue (pending transcription)
  final bool isQueued;

  /// Queue item ID if this result is queued
  final String? queueId;

  const TranscriptionResult({
    required this.text,
    required this.confidence,
    required this.isFinal,
    required this.timestamp,
    this.wordTimings,
    this.detectedLanguage,
    this.isQueued = false,
    this.queueId,
  });

  factory TranscriptionResult.fromJson(Map<String, dynamic> json) {
    return TranscriptionResult(
      text: json['text'] as String? ?? '',
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0.0,
      isFinal: json['is_final'] as bool? ?? true,
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'] as String)
          : DateTime.now(),
      wordTimings: (json['word_timings'] as List<dynamic>?)
          ?.map((w) => WordTiming.fromJson(w as Map<String, dynamic>))
          .toList(),
      detectedLanguage: json['detected_language'] as String?,
      isQueued: json['is_queued'] as bool? ?? false,
      queueId: json['queue_id'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'text': text,
        'confidence': confidence,
        'is_final': isFinal,
        'timestamp': timestamp.toIso8601String(),
        'word_timings': wordTimings?.map((w) => w.toJson()).toList(),
        'detected_language': detectedLanguage,
        'is_queued': isQueued,
        'queue_id': queueId,
      };
}

class WordTiming {
  final String word;
  final double startTime;
  final double endTime;
  final double confidence;

  const WordTiming({
    required this.word,
    required this.startTime,
    required this.endTime,
    required this.confidence,
  });

  factory WordTiming.fromJson(Map<String, dynamic> json) {
    return WordTiming(
      word: json['word'] as String? ?? '',
      startTime: (json['start_time'] as num?)?.toDouble() ?? 0.0,
      endTime: (json['end_time'] as num?)?.toDouble() ?? 0.0,
      confidence: (json['confidence'] as num?)?.toDouble() ?? 1.0,
    );
  }

  Map<String, dynamic> toJson() => {
        'word': word,
        'start_time': startTime,
        'end_time': endTime,
        'confidence': confidence,
      };
}

class SpeechToTextService {
  final SpeechToText _speechToText = SpeechToText();
  final SecureStorage _secureStorage = SecureStorage();
  final Uuid _uuid = const Uuid();

  bool _isInitialized = false;
  bool _isListening = false;
  String _currentTranscription = '';
  double _confidence = 0.0;
  bool _isProcessingQueue = false;

  final StreamController<TranscriptionResult> _transcriptionController =
      StreamController<TranscriptionResult>.broadcast();
  final StreamController<bool> _listeningController =
      StreamController<bool>.broadcast();

  /// Stream for queue processing updates
  final StreamController<TranscriptionQueueItem> _queueUpdateController =
      StreamController<TranscriptionQueueItem>.broadcast();

  // Getters
  bool get isInitialized => _isInitialized;
  bool get isListening => _isListening;
  String get currentTranscription => _currentTranscription;
  double get confidence => _confidence;
  bool get isProcessingQueue => _isProcessingQueue;

  // Streams
  Stream<TranscriptionResult> get transcriptionStream =>
      _transcriptionController.stream;
  Stream<bool> get listeningStream => _listeningController.stream;
  Stream<TranscriptionQueueItem> get queueUpdateStream =>
      _queueUpdateController.stream;

  // Initialize the service
  Future<bool> initialize() async {
    try {
      _isInitialized = await _speechToText.initialize(
        onError: _onError,
        onStatus: _onStatus,
      );
      return _isInitialized;
    } catch (e) {
      debugPrint('Error initializing speech-to-text: $e');
      return false;
    }
  }

  // Check if speech recognition is available
  Future<bool> isAvailable() async {
    return await _speechToText.hasPermission;
  }

  // Get available locales
  Future<List<LocaleName>> getAvailableLocales() async {
    return await _speechToText.locales();
  }

  // Start real-time transcription
  Future<bool> startListening({
    String localeId = 'en_US',
    Duration? timeout,
    Duration? pauseFor,
  }) async {
    if (!_isInitialized || _isListening) return false;

    try {
      await _speechToText.listen(
        onResult: _onSpeechResult,
        localeId: localeId,
        listenFor: timeout ?? const Duration(minutes: 5),
        pauseFor: pauseFor ?? const Duration(seconds: 3),
        listenOptions: SpeechListenOptions(
          partialResults: true,
          cancelOnError: true,
          listenMode: ListenMode.confirmation,
        ),
      );

      _isListening = true;
      _listeningController.add(true);
      return true;
    } catch (e) {
      debugPrint('Error starting speech recognition: $e');
      return false;
    }
  }

  // Stop listening
  Future<void> stopListening() async {
    if (_isListening) {
      await _speechToText.stop();
      _isListening = false;
      _listeningController.add(false);
    }
  }

  // Cancel listening
  Future<void> cancelListening() async {
    if (_isListening) {
      await _speechToText.cancel();
      _isListening = false;
      _listeningController.add(false);
      _currentTranscription = '';
      _confidence = 0.0;
    }
  }

  /// Transcribe audio file using backend API
  ///
  /// The backend handles the actual cloud service integration
  /// (Google Cloud Speech-to-Text, Azure Speech Services, AWS Transcribe, etc.)
  Future<TranscriptionResult?> transcribeAudioFile(
    String filePath, {
    String language = 'en-US',
    bool enableWordTimings = false,
    bool enablePunctuation = true,
    bool enableProfanityFilter = false,
  }) async {
    try {
      final file = File(filePath);
      if (!await file.exists()) {
        throw Exception('Audio file not found: $filePath');
      }

      // Get auth token
      final token = await _secureStorage.getAccessToken();
      if (token == null) {
        throw Exception('Not authenticated');
      }

      // Determine MIME type based on file extension
      final extension = filePath.split('.').last.toLowerCase();
      final mimeType = _getMimeType(extension);

      // Create multipart request
      final uri = Uri.parse('${ApiConstants.baseUrl}/speech/transcribe');
      final request = http.MultipartRequest('POST', uri);

      // Add authorization header
      request.headers['Authorization'] = 'Bearer $token';

      // Add file
      request.files.add(
        await http.MultipartFile.fromPath(
          'audio',
          filePath,
          contentType: MediaType.parse(mimeType),
        ),
      );

      // Add parameters
      request.fields['language'] = language;
      request.fields['enable_word_timings'] = enableWordTimings.toString();
      request.fields['enable_punctuation'] = enablePunctuation.toString();
      request.fields['enable_profanity_filter'] = enableProfanityFilter.toString();

      debugPrint('Sending audio file for transcription: $filePath');

      // Send request with timeout
      final streamedResponse = await request.send().timeout(
        const Duration(minutes: 5),
        onTimeout: () {
          throw TimeoutException('Transcription request timed out');
        },
      );

      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body) as Map<String, dynamic>;

        // Check if response contains transcription data
        if (jsonResponse['success'] == true && jsonResponse['data'] != null) {
          return TranscriptionResult.fromJson(
            jsonResponse['data'] as Map<String, dynamic>,
          );
        } else if (jsonResponse['text'] != null) {
          // Alternative response format
          return TranscriptionResult(
            text: jsonResponse['text'] as String,
            confidence: (jsonResponse['confidence'] as num?)?.toDouble() ?? 0.95,
            isFinal: true,
            timestamp: DateTime.now(),
            detectedLanguage: jsonResponse['detected_language'] as String?,
          );
        } else {
          throw Exception('Invalid response format from transcription service');
        }
      } else if (response.statusCode == 401) {
        throw Exception('Authentication failed - please log in again');
      } else if (response.statusCode == 413) {
        throw Exception('Audio file is too large for transcription');
      } else if (response.statusCode == 415) {
        throw Exception('Unsupported audio format');
      } else if (response.statusCode == 503) {
        // Service unavailable - try fallback
        debugPrint('Transcription service unavailable, using fallback');
        return await _transcribeWithFallback(filePath, language);
      } else {
        final errorBody = json.decode(response.body);
        throw Exception(
          errorBody['message'] ?? 'Transcription failed with status ${response.statusCode}',
        );
      }
    } on TimeoutException {
      debugPrint('Transcription timed out, trying fallback');
      return await _transcribeWithFallback(filePath, language);
    } on SocketException catch (e) {
      debugPrint('Network error during transcription: $e');
      return await _transcribeWithFallback(filePath, language);
    } catch (e) {
      debugPrint('Error transcribing audio file: $e');
      // Try fallback for any error
      return await _transcribeWithFallback(filePath, language);
    }
  }

  /// Fallback transcription method that queues audio for later processing
  ///
  /// When cloud service is unavailable:
  /// 1. Copies file to persistent storage
  /// 2. Queues for later transcription
  /// 3. Returns a queued result with ID for tracking
  Future<TranscriptionResult?> _transcribeWithFallback(
    String filePath,
    String language, {
    bool enableWordTimings = false,
    bool enablePunctuation = true,
  }) async {
    debugPrint('Using fallback transcription for: $filePath');

    // Check if file exists
    final file = File(filePath);
    if (!await file.exists()) {
      return null;
    }

    // Copy file to app documents for persistence
    final persistentPath = await _copyToQueueStorage(file);
    if (persistentPath == null) {
      debugPrint('Failed to copy audio file for queue');
      return null;
    }

    // Create queue item
    final queueItem = TranscriptionQueueItem(
      id: _uuid.v4(),
      filePath: persistentPath,
      language: language,
      enableWordTimings: enableWordTimings,
      enablePunctuation: enablePunctuation,
      createdAt: DateTime.now(),
      status: TranscriptionQueueStatus.pending,
    );

    // Add to queue
    await _addToQueue(queueItem);
    debugPrint('Added transcription to queue: ${queueItem.id}');

    // Get file info for metadata
    final fileStats = await file.stat();
    final fileSize = fileStats.size;

    // Estimate duration based on typical audio file sizes
    // Assuming ~16KB per second for compressed audio
    final estimatedDurationSeconds = (fileSize / 16000).round();

    // Return a queued result
    return TranscriptionResult(
      text: 'Transcription queued - audio recorded for ${estimatedDurationSeconds}s. '
          'Will be transcribed when connection is restored.',
      confidence: 0.0, // Zero confidence indicates pending
      isFinal: false,
      timestamp: DateTime.now(),
      detectedLanguage: language.split('-').first,
      isQueued: true,
      queueId: queueItem.id,
    );
  }

  /// Copy audio file to persistent queue storage
  Future<String?> _copyToQueueStorage(File file) async {
    try {
      final appDir = await getApplicationDocumentsDirectory();
      final queueDir = Directory('${appDir.path}/transcription_queue');

      if (!await queueDir.exists()) {
        await queueDir.create(recursive: true);
      }

      final extension = file.path.split('.').last;
      final newPath = '${queueDir.path}/${_uuid.v4()}.$extension';
      await file.copy(newPath);

      return newPath;
    } catch (e) {
      debugPrint('Error copying file to queue storage: $e');
      return null;
    }
  }

  // ============================================================================
  // Queue Management
  // ============================================================================

  /// Add item to the transcription queue
  Future<void> _addToQueue(TranscriptionQueueItem item) async {
    final prefs = await SharedPreferences.getInstance();
    final queue = await _getQueue();
    queue.add(item);
    await prefs.setString(
      _transcriptionQueueKey,
      jsonEncode(queue.map((i) => i.toJson()).toList()),
    );
  }

  /// Get all items in the transcription queue
  Future<List<TranscriptionQueueItem>> _getQueue() async {
    final prefs = await SharedPreferences.getInstance();
    final queueJson = prefs.getString(_transcriptionQueueKey);

    if (queueJson == null || queueJson.isEmpty) {
      return [];
    }

    try {
      final List<dynamic> decoded = jsonDecode(queueJson);
      return decoded
          .map((item) =>
              TranscriptionQueueItem.fromJson(item as Map<String, dynamic>))
          .toList();
    } catch (e) {
      debugPrint('Error parsing transcription queue: $e');
      return [];
    }
  }

  /// Update an item in the queue
  Future<void> _updateQueueItem(TranscriptionQueueItem item) async {
    final prefs = await SharedPreferences.getInstance();
    final queue = await _getQueue();
    final index = queue.indexWhere((i) => i.id == item.id);

    if (index >= 0) {
      queue[index] = item;
      await prefs.setString(
        _transcriptionQueueKey,
        jsonEncode(queue.map((i) => i.toJson()).toList()),
      );
      _queueUpdateController.add(item);
    }
  }

  /// Remove item from queue
  Future<void> _removeFromQueue(String id) async {
    final prefs = await SharedPreferences.getInstance();
    final queue = await _getQueue();
    queue.removeWhere((i) => i.id == id);
    await prefs.setString(
      _transcriptionQueueKey,
      jsonEncode(queue.map((i) => i.toJson()).toList()),
    );
  }

  /// Clean up audio file from queue storage
  Future<void> _cleanupQueueFile(String filePath) async {
    try {
      final file = File(filePath);
      if (await file.exists()) {
        await file.delete();
      }
    } catch (e) {
      debugPrint('Error cleaning up queue file: $e');
    }
  }

  /// Get pending items in the queue
  Future<List<TranscriptionQueueItem>> getPendingQueueItems() async {
    final queue = await _getQueue();
    return queue
        .where((item) =>
            item.status == TranscriptionQueueStatus.pending ||
            item.status == TranscriptionQueueStatus.failed &&
                item.retryCount < _maxRetryAttempts)
        .toList();
  }

  /// Get queue size
  Future<int> getQueueSize() async {
    final queue = await _getQueue();
    return queue.length;
  }

  /// Process the transcription queue when online
  ///
  /// Call this method when network connectivity is restored
  Future<void> processTranscriptionQueue() async {
    if (_isProcessingQueue) {
      debugPrint('Queue processing already in progress');
      return;
    }

    _isProcessingQueue = true;
    debugPrint('Starting transcription queue processing');

    try {
      final pendingItems = await getPendingQueueItems();

      if (pendingItems.isEmpty) {
        debugPrint('No pending items in queue');
        return;
      }

      debugPrint('Processing ${pendingItems.length} queued transcriptions');

      for (final item in pendingItems) {
        // Check if file still exists
        final file = File(item.filePath);
        if (!await file.exists()) {
          debugPrint('Queue item ${item.id}: file no longer exists, removing');
          await _removeFromQueue(item.id);
          continue;
        }

        // Update status to processing
        final processingItem =
            item.copyWith(status: TranscriptionQueueStatus.processing);
        await _updateQueueItem(processingItem);

        try {
          // Attempt cloud transcription (without fallback to avoid loop)
          final result = await _transcribeQueuedItem(item);

          if (result != null && result.confidence > 0) {
            // Success - remove from queue and emit result
            debugPrint('Queue item ${item.id}: transcription successful');
            await _removeFromQueue(item.id);
            await _cleanupQueueFile(item.filePath);

            // Emit the result with queue ID for tracking
            final finalResult = TranscriptionResult(
              text: result.text,
              confidence: result.confidence,
              isFinal: true,
              timestamp: DateTime.now(),
              wordTimings: result.wordTimings,
              detectedLanguage: result.detectedLanguage,
              isQueued: false,
              queueId: item.id,
            );
            _transcriptionController.add(finalResult);
          } else {
            throw Exception('Transcription returned empty result');
          }
        } catch (e) {
          debugPrint('Queue item ${item.id}: transcription failed - $e');

          // Update retry count
          final failedItem = item.copyWith(
            status: TranscriptionQueueStatus.failed,
            retryCount: item.retryCount + 1,
            errorMessage: e.toString(),
          );
          await _updateQueueItem(failedItem);

          // Remove if max retries exceeded
          if (failedItem.retryCount >= _maxRetryAttempts) {
            debugPrint('Queue item ${item.id}: max retries exceeded, removing');
            await _removeFromQueue(item.id);
            await _cleanupQueueFile(item.filePath);
          }
        }
      }
    } finally {
      _isProcessingQueue = false;
      debugPrint('Queue processing complete');
    }
  }

  /// Transcribe a queued item without fallback (to avoid loop)
  Future<TranscriptionResult?> _transcribeQueuedItem(
      TranscriptionQueueItem item) async {
    final file = File(item.filePath);
    if (!await file.exists()) {
      return null;
    }

    // Get auth token
    final token = await _secureStorage.getAccessToken();
    if (token == null) {
      throw Exception('Not authenticated');
    }

    // Determine MIME type based on file extension
    final extension = item.filePath.split('.').last.toLowerCase();
    final mimeType = _getMimeType(extension);

    // Create multipart request
    final uri = Uri.parse('${ApiConstants.baseUrl}/speech/transcribe');
    final request = http.MultipartRequest('POST', uri);

    request.headers['Authorization'] = 'Bearer $token';

    request.files.add(
      await http.MultipartFile.fromPath(
        'audio',
        item.filePath,
        contentType: MediaType.parse(mimeType),
      ),
    );

    request.fields['language'] = item.language;
    request.fields['enable_word_timings'] = item.enableWordTimings.toString();
    request.fields['enable_punctuation'] = item.enablePunctuation.toString();

    final streamedResponse = await request.send().timeout(
      const Duration(minutes: 5),
      onTimeout: () {
        throw TimeoutException('Transcription request timed out');
      },
    );

    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode == 200) {
      final jsonResponse = json.decode(response.body) as Map<String, dynamic>;

      if (jsonResponse['success'] == true && jsonResponse['data'] != null) {
        return TranscriptionResult.fromJson(
          jsonResponse['data'] as Map<String, dynamic>,
        );
      } else if (jsonResponse['text'] != null) {
        return TranscriptionResult(
          text: jsonResponse['text'] as String,
          confidence: (jsonResponse['confidence'] as num?)?.toDouble() ?? 0.95,
          isFinal: true,
          timestamp: DateTime.now(),
          detectedLanguage: jsonResponse['detected_language'] as String?,
        );
      }
    }

    throw Exception('Transcription failed with status ${response.statusCode}');
  }

  /// Clear all queued items (use with caution)
  Future<void> clearQueue() async {
    final queue = await _getQueue();

    // Clean up files
    for (final item in queue) {
      await _cleanupQueueFile(item.filePath);
    }

    // Clear queue storage
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_transcriptionQueueKey);

    debugPrint('Transcription queue cleared');
  }

  /// Get MIME type for audio file
  String _getMimeType(String extension) {
    switch (extension) {
      case 'mp3':
        return 'audio/mpeg';
      case 'wav':
        return 'audio/wav';
      case 'm4a':
        return 'audio/mp4';
      case 'aac':
        return 'audio/aac';
      case 'ogg':
        return 'audio/ogg';
      case 'flac':
        return 'audio/flac';
      case 'webm':
        return 'audio/webm';
      default:
        return 'audio/mpeg'; // Default to mp3
    }
  }

  // Batch transcribe multiple files
  Future<List<TranscriptionResult>> transcribeMultipleFiles(
    List<String> filePaths, {
    String language = 'en-US',
    bool enableWordTimings = false,
  }) async {
    final results = <TranscriptionResult>[];

    for (final filePath in filePaths) {
      final result = await transcribeAudioFile(
        filePath,
        language: language,
        enableWordTimings: enableWordTimings,
      );
      if (result != null) {
        results.add(result);
      }
    }

    return results;
  }

  // Get supported languages
  List<Map<String, String>> getSupportedLanguages() {
    return [
      {'code': 'en-US', 'name': 'English (US)'},
      {'code': 'en-GB', 'name': 'English (UK)'},
      {'code': 'en-AU', 'name': 'English (Australia)'},
      {'code': 'es-ES', 'name': 'Spanish (Spain)'},
      {'code': 'es-MX', 'name': 'Spanish (Mexico)'},
      {'code': 'fr-FR', 'name': 'French'},
      {'code': 'de-DE', 'name': 'German'},
      {'code': 'it-IT', 'name': 'Italian'},
      {'code': 'pt-BR', 'name': 'Portuguese (Brazil)'},
      {'code': 'pt-PT', 'name': 'Portuguese (Portugal)'},
      {'code': 'zh-CN', 'name': 'Chinese (Simplified)'},
      {'code': 'zh-TW', 'name': 'Chinese (Traditional)'},
      {'code': 'ja-JP', 'name': 'Japanese'},
      {'code': 'ko-KR', 'name': 'Korean'},
      {'code': 'id-ID', 'name': 'Indonesian'},
      {'code': 'ms-MY', 'name': 'Malay'},
      {'code': 'hi-IN', 'name': 'Hindi'},
      {'code': 'ar-SA', 'name': 'Arabic'},
      {'code': 'ru-RU', 'name': 'Russian'},
      {'code': 'nl-NL', 'name': 'Dutch'},
      {'code': 'sv-SE', 'name': 'Swedish'},
      {'code': 'pl-PL', 'name': 'Polish'},
      {'code': 'th-TH', 'name': 'Thai'},
      {'code': 'vi-VN', 'name': 'Vietnamese'},
    ];
  }

  // Event handlers
  void _onSpeechResult(SpeechRecognitionResult result) {
    _currentTranscription = result.recognizedWords;
    _confidence = result.confidence;

    final transcriptionResult = TranscriptionResult(
      text: result.recognizedWords,
      confidence: result.confidence,
      isFinal: result.finalResult,
      timestamp: DateTime.now(),
    );

    _transcriptionController.add(transcriptionResult);
  }

  void _onError(SpeechRecognitionError error) {
    debugPrint('Speech recognition error: ${error.errorMsg}');
    _isListening = false;
    _listeningController.add(false);
  }

  void _onStatus(String status) {
    debugPrint('Speech recognition status: $status');
    if (status == 'done' || status == 'notListening') {
      _isListening = false;
      _listeningController.add(false);
    }
  }

  // Clean up resources
  Future<void> dispose() async {
    await stopListening();
    await _transcriptionController.close();
    await _listeningController.close();
    await _queueUpdateController.close();
  }
}

// Provider for SpeechToTextService
final speechToTextServiceProvider = Provider<SpeechToTextService>((ref) {
  final service = SpeechToTextService();
  ref.onDispose(() => service.dispose());
  return service;
});

/// Provider for transcription queue size
final transcriptionQueueSizeProvider = FutureProvider<int>((ref) async {
  final service = ref.watch(speechToTextServiceProvider);
  return service.getQueueSize();
});

/// Provider for pending transcription queue items
final pendingTranscriptionsProvider =
    FutureProvider<List<TranscriptionQueueItem>>((ref) async {
  final service = ref.watch(speechToTextServiceProvider);
  return service.getPendingQueueItems();
});

/// Stream provider for queue item updates
final transcriptionQueueUpdateProvider =
    StreamProvider<TranscriptionQueueItem>((ref) {
  final service = ref.watch(speechToTextServiceProvider);
  return service.queueUpdateStream;
});
