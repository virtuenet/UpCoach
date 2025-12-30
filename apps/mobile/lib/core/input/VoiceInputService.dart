import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:permission_handler/permission_handler.dart';

/// Voice input mode
enum VoiceInputMode {
  singlePhrase,
  continuous,
  command,
}

/// Voice command
class VoiceCommand {
  final String keyword;
  final List<String> aliases;
  final VoiceCommandHandler handler;

  const VoiceCommand({
    required this.keyword,
    this.aliases = const [],
    required this.handler,
  });

  bool matches(String text) {
    final lowerText = text.toLowerCase().trim();
    return lowerText.contains(keyword.toLowerCase()) ||
        aliases.any((alias) => lowerText.contains(alias.toLowerCase()));
  }
}

/// Voice command handler
typedef VoiceCommandHandler = Future<void> Function(String transcription);

/// Voice input result
class VoiceInputResult {
  final String transcription;
  final double confidence;
  final bool isFinal;
  final VoiceCommand? matchedCommand;

  const VoiceInputResult({
    required this.transcription,
    required this.confidence,
    required this.isFinal,
    this.matchedCommand,
  });
}

/// Voice input state
enum VoiceInputState {
  idle,
  initializing,
  listening,
  processing,
  error,
}

/// Service for handling voice input with speech-to-text
class VoiceInputService {
  final stt.SpeechToText _speech;
  final Map<String, VoiceCommand> _commands = {};
  
  VoiceInputState _state = VoiceInputState.idle;
  VoiceInputMode _mode = VoiceInputMode.singlePhrase;
  String _selectedLocale = 'en_US';
  List<stt.LocaleName> _availableLocales = [];
  
  final StreamController<VoiceInputResult> _resultController =
      StreamController<VoiceInputResult>.broadcast();
  final StreamController<VoiceInputState> _stateController =
      StreamController<VoiceInputState>.broadcast();

  bool _isInitialized = false;
  Timer? _listeningTimer;
  String _currentTranscription = '';

  VoiceInputService({
    stt.SpeechToText? speech,
  }) : _speech = speech ?? stt.SpeechToText();

  // ============================================================================
  // Getters
  // ============================================================================

  VoiceInputState get state => _state;
  bool get isListening => _state == VoiceInputState.listening;
  bool get isInitialized => _isInitialized;
  String get selectedLocale => _selectedLocale;
  List<stt.LocaleName> get availableLocales => _availableLocales;
  
  Stream<VoiceInputResult> get onResult => _resultController.stream;
  Stream<VoiceInputState> get onStateChange => _stateController.stream;

  // ============================================================================
  // Initialization
  // ============================================================================

  Future<bool> initialize() async {
    if (_isInitialized) return true;

    try {
      _setState(VoiceInputState.initializing);

      // Request microphone permission
      final permission = await _requestMicrophonePermission();
      if (!permission) {
        _setState(VoiceInputState.error);
        return false;
      }

      // Initialize speech recognition
      final available = await _speech.initialize(
        onError: _handleError,
        onStatus: _handleStatus,
        debugLogging: kDebugMode,
      );

      if (!available) {
        _setState(VoiceInputState.error);
        return false;
      }

      // Get available locales
      _availableLocales = await _speech.locales();

      // Set default locale if available
      if (_availableLocales.isNotEmpty) {
        final systemLocale = _speech.systemLocale;
        if (systemLocale != null) {
          _selectedLocale = systemLocale.localeId;
        }
      }

      _isInitialized = true;
      _setState(VoiceInputState.idle);
      
      debugPrint('VoiceInputService initialized with ${_availableLocales.length} locales');
      return true;
    } catch (e) {
      debugPrint('Error initializing voice input: $e');
      _setState(VoiceInputState.error);
      return false;
    }
  }

  Future<bool> _requestMicrophonePermission() async {
    final status = await Permission.microphone.request();
    return status.isGranted;
  }

  // ============================================================================
  // Speech-to-Text
  // ============================================================================

  Future<void> startListening({
    VoiceInputMode mode = VoiceInputMode.singlePhrase,
    String? locale,
    Duration? timeout,
  }) async {
    if (!_isInitialized) {
      throw StateError('VoiceInputService not initialized');
    }

    if (isListening) {
      await stopListening();
    }

    try {
      _mode = mode;
      _currentTranscription = '';
      
      if (locale != null) {
        _selectedLocale = locale;
      }

      await _speech.listen(
        onResult: _handleResult,
        localeId: _selectedLocale,
        listenMode: _getListenMode(),
        cancelOnError: true,
        partialResults: true,
        listenFor: timeout,
        pauseFor: const Duration(seconds: 3),
      );

      _setState(VoiceInputState.listening);

      // Set timeout for continuous mode
      if (mode == VoiceInputMode.continuous && timeout != null) {
        _listeningTimer?.cancel();
        _listeningTimer = Timer(timeout, () {
          stopListening();
        });
      }
    } catch (e) {
      debugPrint('Error starting speech recognition: $e');
      _setState(VoiceInputState.error);
    }
  }

  Future<void> stopListening() async {
    if (!isListening) return;

    try {
      await _speech.stop();
      _listeningTimer?.cancel();
      _setState(VoiceInputState.idle);
    } catch (e) {
      debugPrint('Error stopping speech recognition: $e');
    }
  }

  Future<void> cancelListening() async {
    if (!isListening) return;

    try {
      await _speech.cancel();
      _listeningTimer?.cancel();
      _currentTranscription = '';
      _setState(VoiceInputState.idle);
    } catch (e) {
      debugPrint('Error canceling speech recognition: $e');
    }
  }

  stt.ListenMode _getListenMode() {
    switch (_mode) {
      case VoiceInputMode.singlePhrase:
        return stt.ListenMode.confirmation;
      case VoiceInputMode.continuous:
        return stt.ListenMode.dictation;
      case VoiceInputMode.command:
        return stt.ListenMode.confirmation;
    }
  }

  void _handleResult(stt.SpeechRecognitionResult result) {
    _currentTranscription = result.recognizedWords;

    final voiceResult = VoiceInputResult(
      transcription: result.recognizedWords,
      confidence: result.confidence,
      isFinal: result.finalResult,
      matchedCommand: _mode == VoiceInputMode.command
          ? _matchCommand(result.recognizedWords)
          : null,
    );

    _resultController.add(voiceResult);

    // Process command if in command mode
    if (_mode == VoiceInputMode.command && voiceResult.matchedCommand != null) {
      voiceResult.matchedCommand!.handler(result.recognizedWords);
    }

    // Auto-stop for single phrase mode
    if (_mode == VoiceInputMode.singlePhrase && result.finalResult) {
      stopListening();
    }
  }

  void _handleError(stt.SpeechRecognitionError error) {
    debugPrint('Speech recognition error: ${error.errorMsg}');
    _setState(VoiceInputState.error);
  }

  void _handleStatus(String status) {
    debugPrint('Speech recognition status: $status');
    
    if (status == 'done' || status == 'notListening') {
      _setState(VoiceInputState.idle);
    }
  }

  // ============================================================================
  // Voice Commands
  // ============================================================================

  void registerCommand(VoiceCommand command) {
    _commands[command.keyword] = command;
  }

  void unregisterCommand(String keyword) {
    _commands.remove(keyword);
  }

  void clearCommands() {
    _commands.clear();
  }

  VoiceCommand? _matchCommand(String text) {
    for (final command in _commands.values) {
      if (command.matches(text)) {
        return command;
      }
    }
    return null;
  }

  // ============================================================================
  // Predefined Commands
  // ============================================================================

  void registerDefaultCommands({
    VoiceCommandHandler? onCreateGoal,
    VoiceCommandHandler? onCreateHabit,
    VoiceCommandHandler? onLogProgress,
    VoiceCommandHandler? onShowStats,
  }) {
    if (onCreateGoal != null) {
      registerCommand(VoiceCommand(
        keyword: 'create goal',
        aliases: ['new goal', 'add goal', 'set goal'],
        handler: onCreateGoal,
      ));
    }

    if (onCreateHabit != null) {
      registerCommand(VoiceCommand(
        keyword: 'create habit',
        aliases: ['new habit', 'add habit', 'track habit'],
        handler: onCreateHabit,
      ));
    }

    if (onLogProgress != null) {
      registerCommand(VoiceCommand(
        keyword: 'log progress',
        aliases: ['record progress', 'update progress', 'mark complete'],
        handler: onLogProgress,
      ));
    }

    if (onShowStats != null) {
      registerCommand(VoiceCommand(
        keyword: 'show stats',
        aliases: ['view statistics', 'my progress', 'show progress'],
        handler: onShowStats,
      ));
    }
  }

  // ============================================================================
  // Language Support
  // ============================================================================

  Future<void> setLocale(String localeId) async {
    if (!_availableLocales.any((l) => l.localeId == localeId)) {
      throw ArgumentError('Locale $localeId not available');
    }

    _selectedLocale = localeId;

    // Restart listening if active
    if (isListening) {
      final currentMode = _mode;
      await stopListening();
      await startListening(mode: currentMode, locale: localeId);
    }
  }

  List<stt.LocaleName> getSupportedLocales() {
    return _availableLocales;
  }

  stt.LocaleName? getCurrentLocale() {
    return _availableLocales.firstWhere(
      (l) => l.localeId == _selectedLocale,
      orElse: () => _availableLocales.first,
    );
  }

  // ============================================================================
  // Continuous Listening
  // ============================================================================

  Future<void> startContinuousListening({
    Duration timeout = const Duration(minutes: 5),
    String? locale,
  }) async {
    await startListening(
      mode: VoiceInputMode.continuous,
      locale: locale,
      timeout: timeout,
    );
  }

  // ============================================================================
  // Noise Cancellation
  // ============================================================================

  Future<void> enableNoiseCancellation(bool enable) async {
    // Platform-specific implementation would go here
    // iOS: Use AVAudioSession categories
    // Android: Use AudioManager and noise suppression
    
    if (Platform.isIOS) {
      // Configure AVAudioSession for noise cancellation
      // This would typically be done through platform channels
    } else if (Platform.isAndroid) {
      // Configure AudioManager for noise suppression
      // This would typically be done through platform channels
    }
  }

  // ============================================================================
  // State Management
  // ============================================================================

  void _setState(VoiceInputState newState) {
    if (_state != newState) {
      _state = newState;
      _stateController.add(newState);
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  bool get hasSpeechRecognition => _speech.isAvailable;

  double get soundLevel => _speech.lastRecognizedWords.isNotEmpty ? 1.0 : 0.0;

  String get lastTranscription => _currentTranscription;

  Future<bool> hasPermission() async {
    final status = await Permission.microphone.status;
    return status.isGranted;
  }

  // ============================================================================
  // Goal/Habit Creation Helpers
  // ============================================================================

  Future<Map<String, dynamic>?> transcribeGoalCreation({
    Duration timeout = const Duration(seconds: 30),
  }) async {
    final completer = Completer<Map<String, dynamic>?>();
    StreamSubscription<VoiceInputResult>? subscription;

    subscription = onResult.listen((result) {
      if (result.isFinal && result.confidence > 0.7) {
        subscription?.cancel();
        completer.complete(_parseGoalFromText(result.transcription));
      }
    });

    await startListening(
      mode: VoiceInputMode.singlePhrase,
      timeout: timeout,
    );

    // Add timeout
    Timer(timeout, () {
      if (!completer.isCompleted) {
        subscription?.cancel();
        stopListening();
        completer.complete(null);
      }
    });

    return completer.future;
  }

  Future<Map<String, dynamic>?> transcribeHabitCreation({
    Duration timeout = const Duration(seconds: 30),
  }) async {
    final completer = Completer<Map<String, dynamic>?>();
    StreamSubscription<VoiceInputResult>? subscription;

    subscription = onResult.listen((result) {
      if (result.isFinal && result.confidence > 0.7) {
        subscription?.cancel();
        completer.complete(_parseHabitFromText(result.transcription));
      }
    });

    await startListening(
      mode: VoiceInputMode.singlePhrase,
      timeout: timeout,
    );

    // Add timeout
    Timer(timeout, () {
      if (!completer.isCompleted) {
        subscription?.cancel();
        stopListening();
        completer.complete(null);
      }
    });

    return completer.future;
  }

  Map<String, dynamic> _parseGoalFromText(String text) {
    // Simple parsing - in production, use NLP or AI
    return {
      'title': text,
      'description': text,
      'source': 'voice',
    };
  }

  Map<String, dynamic> _parseHabitFromText(String text) {
    // Simple parsing - in production, use NLP or AI
    return {
      'name': text,
      'description': text,
      'source': 'voice',
    };
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  Future<void> dispose() async {
    await stopListening();
    _listeningTimer?.cancel();
    await _resultController.close();
    await _stateController.close();
    _commands.clear();
  }
}
