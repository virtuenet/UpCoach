import 'dart:async';
import 'dart:io';
import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:speech_to_text/speech_to_text.dart';
import 'package:http/http.dart' as http;

class TranscriptionResult {
  final String text;
  final double confidence;
  final bool isFinal;
  final DateTime timestamp;
  
  const TranscriptionResult({
    required this.text,
    required this.confidence,
    required this.isFinal,
    required this.timestamp,
  });
}

class SpeechToTextService {
  final SpeechToText _speechToText = SpeechToText();

  bool _isInitialized = false;
  bool _isListening = false;
  String _currentTranscription = '';
  double _confidence = 0.0;

  // Google Cloud Speech API configuration
  static const String _googleCloudApiKey = 'YOUR_GOOGLE_CLOUD_API_KEY'; // Should be stored securely
  static const String _baseUrl = 'https://speech.googleapis.com/v1/speech:recognize';
  
  final StreamController<TranscriptionResult> _transcriptionController =
      StreamController<TranscriptionResult>.broadcast();
  final StreamController<bool> _listeningController =
      StreamController<bool>.broadcast();
  
  // Getters
  bool get isInitialized => _isInitialized;
  bool get isListening => _isListening;
  String get currentTranscription => _currentTranscription;
  double get confidence => _confidence;
  
  // Streams
  Stream<TranscriptionResult> get transcriptionStream => _transcriptionController.stream;
  Stream<bool> get listeningStream => _listeningController.stream;
  
  // Initialize the service
  Future<bool> initialize() async {
    try {
      _isInitialized = await _speechToText.initialize(
        onError: _onError,
        onStatus: _onStatus,
      );
      return _isInitialized;
    } catch (e) {
      print('Error initializing speech-to-text: $e');
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
        partialResults: true,
        cancelOnError: true,
        listenMode: ListenMode.confirmation,
      );
      
      _isListening = true;
      _listeningController.add(true);
      return true;
    } catch (e) {
      print('Error starting speech recognition: $e');
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
  
  // Transcribe audio file using Google Cloud Speech-to-Text
  Future<TranscriptionResult?> transcribeAudioFile(String filePath, {
    String language = 'en-US',
    bool enableWordTimeOffsets = false,
    bool enableAutomaticPunctuation = true,
    bool enableWordConfidence = true,
  }) async {
    try {
      final file = File(filePath);
      if (!await file.exists()) {
        throw Exception('Audio file not found: $filePath');
      }

      // Read audio file and encode to base64
      final audioBytes = await file.readAsBytes();
      final audioContent = base64Encode(audioBytes);

      // Determine audio encoding from file extension
      final fileExtension = filePath.split('.').last.toLowerCase();
      String encoding;
      int sampleRateHertz = 16000;

      switch (fileExtension) {
        case 'wav':
          encoding = 'LINEAR16';
          sampleRateHertz = 44100;
          break;
        case 'flac':
          encoding = 'FLAC';
          sampleRateHertz = 44100;
          break;
        case 'm4a':
        case 'aac':
          encoding = 'AAC';
          sampleRateHertz = 44100;
          break;
        case 'mp3':
          encoding = 'MP3';
          sampleRateHertz = 44100;
          break;
        default:
          encoding = 'LINEAR16';
      }

      // Prepare request body
      final requestBody = {
        'config': {
          'encoding': encoding,
          'sampleRateHertz': sampleRateHertz,
          'languageCode': language,
          'enableAutomaticPunctuation': enableAutomaticPunctuation,
          'enableWordTimeOffsets': enableWordTimeOffsets,
          'enableWordConfidence': enableWordConfidence,
          'model': 'latest_long',
          'useEnhanced': true,
        },
        'audio': {
          'content': audioContent,
        },
      };

      // Make API request to Google Cloud Speech-to-Text
      final response = await http.post(
        Uri.parse('$_baseUrl?key=$_googleCloudApiKey'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: json.encode(requestBody),
      );

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);

        if (responseData['results'] != null && responseData['results'].isNotEmpty) {
          final result = responseData['results'][0];
          final alternative = result['alternatives'][0];

          return TranscriptionResult(
            text: alternative['transcript'] ?? '',
            confidence: (alternative['confidence'] as num?)?.toDouble() ?? 0.0,
            isFinal: true,
            timestamp: DateTime.now(),
          );
        } else {
          print('No transcription results found');
          return null;
        }
      } else {
        print('API Error: ${response.statusCode} - ${response.body}');
        return null;
      }
    } catch (e) {
      print('Error transcribing audio file: $e');
      return null;
    }
  }

  // Alternative transcription using local models (offline)
  Future<TranscriptionResult?> transcribeAudioFileOffline(String filePath, {
    String language = 'en-US',
  }) async {
    try {
      final file = File(filePath);
      if (!await file.exists()) {
        throw Exception('Audio file not found: $filePath');
      }

      // For offline transcription, you would use libraries like:
      // - Vosk (https://alphacephei.com/vosk/)
      // - Whisper.cpp
      // - DeepSpeech

      // Placeholder for offline implementation
      await Future.delayed(const Duration(seconds: 3)); // Simulate processing time

      return TranscriptionResult(
        text: 'Offline transcription not yet implemented. Use online transcription for now.',
        confidence: 0.8,
        isFinal: true,
        timestamp: DateTime.now(),
      );
    } catch (e) {
      print('Error in offline transcription: $e');
      return null;
    }
  }
  
  // Batch transcribe multiple files
  Future<List<TranscriptionResult>> transcribeMultipleFiles(
    List<String> filePaths, {
    String language = 'en-US',
  }) async {
    final results = <TranscriptionResult>[];
    
    for (final filePath in filePaths) {
      final result = await transcribeAudioFile(filePath, language: language);
      if (result != null) {
        results.add(result);
      }
    }
    
    return results;
  }
  
  // Get supported languages
  List<String> getSupportedLanguages() {
    return [
      'en-US', // English (US)
      'en-GB', // English (UK)
      'es-ES', // Spanish
      'fr-FR', // French
      'de-DE', // German
      'it-IT', // Italian
      'pt-BR', // Portuguese (Brazil)
      'zh-CN', // Chinese (Simplified)
      'ja-JP', // Japanese
      'ko-KR', // Korean
      'id-ID', // Indonesian
      'ar-SA', // Arabic
      'hi-IN', // Hindi
      'ru-RU', // Russian
      'th-TH', // Thai
      'vi-VN', // Vietnamese
    ];
  }

  // Detect language from audio file
  Future<String?> detectLanguage(String filePath) async {
    try {
      final file = File(filePath);
      if (!await file.exists()) {
        throw Exception('Audio file not found: $filePath');
      }

      final audioBytes = await file.readAsBytes();
      final audioContent = base64Encode(audioBytes);

      final requestBody = {
        'config': {
          'encoding': 'LINEAR16',
          'sampleRateHertz': 16000,
          'languageCode': 'auto', // Auto-detect
          'alternativeLanguageCodes': getSupportedLanguages().take(3).toList(),
        },
        'audio': {
          'content': audioContent,
        },
      };

      final response = await http.post(
        Uri.parse('$_baseUrl?key=$_googleCloudApiKey'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(requestBody),
      );

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        if (responseData['results'] != null && responseData['results'].isNotEmpty) {
          return responseData['results'][0]['languageCode'] as String?;
        }
      }

      return null;
    } catch (e) {
      print('Error detecting language: $e');
      return null;
    }
  }

  // Get transcription with timestamps
  Future<Map<String, dynamic>?> transcribeWithTimestamps(String filePath, {
    String language = 'en-US',
  }) async {
    try {
      final result = await transcribeAudioFile(
        filePath,
        language: language,
        enableWordTimeOffsets: true,
        enableWordConfidence: true,
      );

      if (result != null) {
        return {
          'transcript': result.text,
          'confidence': result.confidence,
          'timestamp': result.timestamp,
          'isFinal': result.isFinal,
        };
      }

      return null;
    } catch (e) {
      print('Error transcribing with timestamps: $e');
      return null;
    }
  }

  // Real-time transcription with enhanced features
  Future<bool> startEnhancedListening({
    String localeId = 'en_US',
    Duration? timeout,
    Duration? pauseFor,
    bool enableProfanityFilter = false,
  }) async {
    if (!_isInitialized || _isListening) return false;

    try {
      await _speechToText.listen(
        onResult: _onSpeechResult,
        localeId: localeId,
        listenFor: timeout ?? const Duration(minutes: 10),
        pauseFor: pauseFor ?? const Duration(seconds: 3),
        partialResults: true,
        cancelOnError: true,
        listenMode: ListenMode.confirmation,
        sampleRate: 44100,
      );

      _isListening = true;
      _listeningController.add(true);
      return true;
    } catch (e) {
      print('Error starting enhanced speech recognition: $e');
      return false;
    }
  }
  
  // Event handlers
  void _onSpeechResult(result) {
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
  
  void _onError(error) {
    print('Speech recognition error: ${error.errorMsg}');
    _isListening = false;
    _listeningController.add(false);
  }
  
  void _onStatus(String status) {
    print('Speech recognition status: $status');
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
  }
}

// Provider for SpeechToTextService
final speechToTextServiceProvider = Provider<SpeechToTextService>((ref) {
  final service = SpeechToTextService();
  ref.onDispose(() => service.dispose());
  return service;
}); 