import 'dart:async';
import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:speech_to_text/speech_to_text.dart';

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
  
  // Transcribe audio file (requires cloud service integration)
  Future<TranscriptionResult?> transcribeAudioFile(String filePath, {
    String language = 'en-US',
  }) async {
    // This would integrate with cloud services like:
    // - Google Cloud Speech-to-Text
    // - Azure Speech Services
    // - AWS Transcribe
    // For now, return a placeholder
    
    try {
      final file = File(filePath);
      if (!await file.exists()) {
        throw Exception('Audio file not found');
      }
      
      // Placeholder implementation
      // In a real implementation, you would:
      // 1. Upload file to cloud service
      // 2. Get transcription result
      // 3. Parse confidence scores
      
      await Future.delayed(const Duration(seconds: 2)); // Simulate API call
      
      return TranscriptionResult(
        text: 'This is a placeholder transcription. Integrate with actual cloud service.',
        confidence: 0.95,
        isFinal: true,
        timestamp: DateTime.now(),
      );
    } catch (e) {
      print('Error transcribing audio file: $e');
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
    ];
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