import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:flutter_tts/flutter_tts.dart';

/// Voice command types
enum VoiceCommand {
  createGoal,
  createHabit,
  completeTask,
  viewProgress,
  openSettings,
  startTimer,
  stopTimer,
  addNote,
  searchItem,
  cancel,
  help,
  unknown,
}

/// Voice input result
class VoiceInputResult {
  final String text;
  final double confidence;
  final VoiceCommand? command;
  final Map<String, dynamic>? parameters;

  const VoiceInputResult({
    required this.text,
    required this.confidence,
    this.command,
    this.parameters,
  });

  bool get isConfident => confidence >= 0.7;
}

/// Voice command intent
class VoiceIntent {
  final VoiceCommand command;
  final Map<String, dynamic> parameters;
  final String originalText;

  const VoiceIntent({
    required this.command,
    required this.parameters,
    required this.originalText,
  });
}

/// Speech recognition language
enum SpeechLanguage {
  english('en_US', 'English (US)'),
  englishUK('en_GB', 'English (UK)'),
  spanish('es_ES', 'Spanish'),
  french('fr_FR', 'French'),
  german('de_DE', 'German'),
  italian('it_IT', 'Italian'),
  portuguese('pt_BR', 'Portuguese (Brazil)'),
  chinese('zh_CN', 'Chinese (Simplified)'),
  japanese('ja_JP', 'Japanese'),
  korean('ko_KR', 'Korean');

  final String code;
  final String displayName;
  const SpeechLanguage(this.code, this.displayName);
}

/// Voice input configuration
class VoiceInputConfig {
  final bool enableOfflineProcessing;
  final bool enableVoiceFeedback;
  final SpeechLanguage defaultLanguage;
  final double minConfidenceThreshold;
  final Duration listeningTimeout;
  final bool enablePartialResults;

  const VoiceInputConfig({
    this.enableOfflineProcessing = true,
    this.enableVoiceFeedback = true,
    this.defaultLanguage = SpeechLanguage.english,
    this.minConfidenceThreshold = 0.7,
    this.listeningTimeout = const Duration(seconds: 30),
    this.enablePartialResults = true,
  });
}

/// Service for voice input and command recognition
class VoiceInputService {
  final stt.SpeechToText _speechToText;
  final FlutterTts _textToSpeech;
  final VoiceInputConfig config;

  bool _initialized = false;
  bool _isListening = false;
  String _lastRecognizedText = '';
  SpeechLanguage _currentLanguage;

  final StreamController<VoiceInputResult> _resultController =
      StreamController<VoiceInputResult>.broadcast();
  final StreamController<String> _partialResultController =
      StreamController<String>.broadcast();
  final StreamController<bool> _listeningStatusController =
      StreamController<bool>.broadcast();

  VoiceInputService({
    stt.SpeechToText? speechToText,
    FlutterTts? textToSpeech,
    this.config = const VoiceInputConfig(),
  })  : _speechToText = speechToText ?? stt.SpeechToText(),
        _textToSpeech = textToSpeech ?? FlutterTts(),
        _currentLanguage = config.defaultLanguage;

  // ============================================================================
  // Initialization
  // ============================================================================

  Future<bool> initialize() async {
    if (_initialized) return true;

    try {
      // Initialize speech-to-text
      final sttAvailable = await _speechToText.initialize(
        onStatus: _onSpeechStatus,
        onError: _onSpeechError,
        debugLogging: kDebugMode,
      );

      if (!sttAvailable) {
        debugPrint('Speech recognition not available');
        return false;
      }

      // Initialize text-to-speech
      await _initializeTextToSpeech();

      // Check available languages
      await _loadAvailableLanguages();

      _initialized = true;
      debugPrint('VoiceInputService initialized');
      return true;
    } catch (e) {
      debugPrint('Error initializing voice input: $e');
      return false;
    }
  }

  Future<void> _initializeTextToSpeech() async {
    await _textToSpeech.setLanguage(_currentLanguage.code);
    await _textToSpeech.setSpeechRate(0.5);
    await _textToSpeech.setVolume(1.0);
    await _textToSpeech.setPitch(1.0);

    // Set completion handler
    _textToSpeech.setCompletionHandler(() {
      debugPrint('TTS completed');
    });
  }

  Future<void> _loadAvailableLanguages() async {
    final locales = await _speechToText.locales();
    debugPrint('Available locales: ${locales.length}');
  }

  // ============================================================================
  // Speech-to-Text
  // ============================================================================

  /// Start listening for voice input
  Future<bool> startListening({
    SpeechLanguage? language,
    Duration? timeout,
  }) async {
    if (!_initialized) {
      await initialize();
    }

    if (_isListening) {
      debugPrint('Already listening');
      return false;
    }

    try {
      final locale = language ?? _currentLanguage;
      final listenTimeout = timeout ?? config.listeningTimeout;

      await _speechToText.listen(
        onResult: _onSpeechResult,
        listenFor: listenTimeout,
        pauseFor: const Duration(seconds: 3),
        partialResults: config.enablePartialResults,
        localeId: locale.code,
        onSoundLevelChange: _onSoundLevelChange,
        cancelOnError: true,
        listenMode: stt.ListenMode.confirmation,
      );

      _isListening = true;
      _listeningStatusController.add(true);

      if (config.enableVoiceFeedback) {
        await speak('Listening');
      }

      return true;
    } catch (e) {
      debugPrint('Error starting listening: $e');
      return false;
    }
  }

  /// Stop listening
  Future<void> stopListening() async {
    if (!_isListening) return;

    await _speechToText.stop();
    _isListening = false;
    _listeningStatusController.add(false);

    if (config.enableVoiceFeedback) {
      await speak('Processing');
    }
  }

  /// Cancel listening
  Future<void> cancelListening() async {
    if (!_isListening) return;

    await _speechToText.cancel();
    _isListening = false;
    _listeningStatusController.add(false);
  }

  void _onSpeechResult(stt.SpeechRecognitionResult result) {
    final recognizedText = result.recognizedWords;
    final confidence = result.confidence;

    debugPrint('Speech result: $recognizedText (confidence: $confidence)');

    if (result.finalResult) {
      _lastRecognizedText = recognizedText;
      _processVoiceInput(recognizedText, confidence);
    } else if (config.enablePartialResults) {
      _partialResultController.add(recognizedText);
    }
  }

  void _onSpeechStatus(String status) {
    debugPrint('Speech status: $status');

    if (status == 'done' || status == 'notListening') {
      _isListening = false;
      _listeningStatusController.add(false);
    }
  }

  void _onSpeechError(dynamic error) {
    debugPrint('Speech error: $error');
    _isListening = false;
    _listeningStatusController.add(false);

    if (config.enableVoiceFeedback) {
      speak('Sorry, I didn\'t catch that');
    }
  }

  void _onSoundLevelChange(double level) {
    // Can be used for visualizing sound levels
  }

  // ============================================================================
  // Voice Command Recognition
  // ============================================================================

  Future<void> _processVoiceInput(String text, double confidence) async {
    if (confidence < config.minConfidenceThreshold) {
      debugPrint('Confidence too low: $confidence');
      if (config.enableVoiceFeedback) {
        await speak('I\'m not sure I understood that. Could you repeat?');
      }
      return;
    }

    // Parse command
    final intent = _parseCommand(text);

    // Create result
    final result = VoiceInputResult(
      text: text,
      confidence: confidence,
      command: intent.command,
      parameters: intent.parameters,
    );

    _resultController.add(result);

    // Provide feedback
    if (config.enableVoiceFeedback) {
      await _provideFeedback(intent);
    }
  }

  VoiceIntent _parseCommand(String text) {
    final lowerText = text.toLowerCase().trim();

    // Create goal patterns
    if (_matchesPattern(lowerText, [
      'create goal',
      'new goal',
      'add goal',
      'set goal',
      'make goal'
    ])) {
      final goalTitle = _extractParameter(
        lowerText,
        ['create goal', 'new goal', 'add goal', 'set goal', 'make goal'],
      );
      return VoiceIntent(
        command: VoiceCommand.createGoal,
        parameters: {'title': goalTitle},
        originalText: text,
      );
    }

    // Create habit patterns
    if (_matchesPattern(lowerText, [
      'create habit',
      'new habit',
      'add habit',
      'start habit',
      'track habit'
    ])) {
      final habitName = _extractParameter(
        lowerText,
        ['create habit', 'new habit', 'add habit', 'start habit', 'track habit'],
      );
      return VoiceIntent(
        command: VoiceCommand.createHabit,
        parameters: {'name': habitName},
        originalText: text,
      );
    }

    // Complete task patterns
    if (_matchesPattern(lowerText, [
      'complete',
      'done',
      'finished',
      'mark complete',
      'check off'
    ])) {
      final taskName = _extractParameter(
        lowerText,
        ['complete', 'done', 'finished', 'mark complete', 'check off'],
      );
      return VoiceIntent(
        command: VoiceCommand.completeTask,
        parameters: {'task': taskName},
        originalText: text,
      );
    }

    // View progress patterns
    if (_matchesPattern(lowerText, [
      'show progress',
      'view progress',
      'my progress',
      'how am i doing',
      'check progress'
    ])) {
      return VoiceIntent(
        command: VoiceCommand.viewProgress,
        parameters: {},
        originalText: text,
      );
    }

    // Settings patterns
    if (_matchesPattern(lowerText, [
      'open settings',
      'settings',
      'preferences',
      'configuration'
    ])) {
      return VoiceIntent(
        command: VoiceCommand.openSettings,
        parameters: {},
        originalText: text,
      );
    }

    // Timer patterns
    if (_matchesPattern(lowerText, [
      'start timer',
      'begin timer',
      'set timer',
      'timer start'
    ])) {
      final duration = _extractDuration(lowerText);
      return VoiceIntent(
        command: VoiceCommand.startTimer,
        parameters: {'duration': duration},
        originalText: text,
      );
    }

    if (_matchesPattern(lowerText, ['stop timer', 'end timer', 'timer stop'])) {
      return VoiceIntent(
        command: VoiceCommand.stopTimer,
        parameters: {},
        originalText: text,
      );
    }

    // Add note patterns
    if (_matchesPattern(lowerText, [
      'add note',
      'create note',
      'new note',
      'take note',
      'note'
    ])) {
      final noteContent = _extractParameter(
        lowerText,
        ['add note', 'create note', 'new note', 'take note', 'note'],
      );
      return VoiceIntent(
        command: VoiceCommand.addNote,
        parameters: {'content': noteContent},
        originalText: text,
      );
    }

    // Search patterns
    if (_matchesPattern(lowerText, [
      'search',
      'find',
      'look for',
      'show me',
      'where is'
    ])) {
      final searchQuery = _extractParameter(
        lowerText,
        ['search', 'find', 'look for', 'show me', 'where is'],
      );
      return VoiceIntent(
        command: VoiceCommand.searchItem,
        parameters: {'query': searchQuery},
        originalText: text,
      );
    }

    // Cancel patterns
    if (_matchesPattern(
        lowerText, ['cancel', 'stop', 'never mind', 'forget it'])) {
      return VoiceIntent(
        command: VoiceCommand.cancel,
        parameters: {},
        originalText: text,
      );
    }

    // Help patterns
    if (_matchesPattern(lowerText, ['help', 'what can you do', 'commands'])) {
      return VoiceIntent(
        command: VoiceCommand.help,
        parameters: {},
        originalText: text,
      );
    }

    // Unknown command
    return VoiceIntent(
      command: VoiceCommand.unknown,
      parameters: {'text': text},
      originalText: text,
    );
  }

  bool _matchesPattern(String text, List<String> patterns) {
    return patterns.any((pattern) => text.contains(pattern));
  }

  String _extractParameter(String text, List<String> prefixes) {
    for (final prefix in prefixes) {
      final index = text.indexOf(prefix);
      if (index != -1) {
        final remaining = text.substring(index + prefix.length).trim();
        return remaining.isNotEmpty ? remaining : '';
      }
    }
    return '';
  }

  int _extractDuration(String text) {
    // Extract duration in minutes from text like "5 minutes", "10 mins", etc.
    final regex = RegExp(r'(\d+)\s*(minute|min|hour|hr)s?');
    final match = regex.firstMatch(text);

    if (match != null) {
      final value = int.parse(match.group(1)!);
      final unit = match.group(2)!;

      if (unit.startsWith('hour') || unit.startsWith('hr')) {
        return value * 60; // Convert to minutes
      }
      return value;
    }

    return 5; // Default 5 minutes
  }

  // ============================================================================
  // Text-to-Speech (Voice Feedback)
  // ============================================================================

  Future<void> speak(String text) async {
    if (!config.enableVoiceFeedback) return;

    try {
      await _textToSpeech.speak(text);
    } catch (e) {
      debugPrint('Error speaking: $e');
    }
  }

  Future<void> stop() async {
    await _textToSpeech.stop();
  }

  Future<void> _provideFeedback(VoiceIntent intent) async {
    String feedback;

    switch (intent.command) {
      case VoiceCommand.createGoal:
        final title = intent.parameters['title'] ?? '';
        feedback = title.isNotEmpty
            ? 'Creating goal: $title'
            : 'What goal would you like to create?';
        break;
      case VoiceCommand.createHabit:
        final name = intent.parameters['name'] ?? '';
        feedback = name.isNotEmpty
            ? 'Creating habit: $name'
            : 'What habit would you like to track?';
        break;
      case VoiceCommand.completeTask:
        feedback = 'Marking task as complete';
        break;
      case VoiceCommand.viewProgress:
        feedback = 'Showing your progress';
        break;
      case VoiceCommand.openSettings:
        feedback = 'Opening settings';
        break;
      case VoiceCommand.startTimer:
        final duration = intent.parameters['duration'] ?? 5;
        feedback = 'Starting timer for $duration minutes';
        break;
      case VoiceCommand.stopTimer:
        feedback = 'Stopping timer';
        break;
      case VoiceCommand.addNote:
        feedback = 'Adding note';
        break;
      case VoiceCommand.searchItem:
        final query = intent.parameters['query'] ?? '';
        feedback = 'Searching for: $query';
        break;
      case VoiceCommand.cancel:
        feedback = 'Cancelled';
        break;
      case VoiceCommand.help:
        feedback = 'You can create goals, add habits, complete tasks, and more';
        break;
      case VoiceCommand.unknown:
        feedback = 'I didn\'t understand that command';
        break;
    }

    await speak(feedback);
  }

  // ============================================================================
  // Language Support
  // ============================================================================

  Future<void> setLanguage(SpeechLanguage language) async {
    _currentLanguage = language;
    await _textToSpeech.setLanguage(language.code);
  }

  SpeechLanguage getCurrentLanguage() => _currentLanguage;

  Future<List<SpeechLanguage>> getAvailableLanguages() async {
    try {
      final locales = await _speechToText.locales();
      final availableLanguages = <SpeechLanguage>[];

      for (final lang in SpeechLanguage.values) {
        final hasLocale = locales.any((locale) => locale.localeId == lang.code);
        if (hasLocale) {
          availableLanguages.add(lang);
        }
      }

      return availableLanguages;
    } catch (e) {
      debugPrint('Error getting available languages: $e');
      return [SpeechLanguage.english];
    }
  }

  // ============================================================================
  // Offline Voice Processing
  // ============================================================================

  Future<bool> isOfflineAvailable() async {
    if (!config.enableOfflineProcessing) return false;

    try {
      // Check if on-device speech recognition is available
      final locales = await _speechToText.locales();
      return locales.any((locale) =>
          locale.localeId == _currentLanguage.code && locale.name.contains('on-device'));
    } catch (e) {
      debugPrint('Error checking offline availability: $e');
      return false;
    }
  }

  // ============================================================================
  // Streams
  // ============================================================================

  Stream<VoiceInputResult> get results => _resultController.stream;
  Stream<String> get partialResults => _partialResultController.stream;
  Stream<bool> get listeningStatus => _listeningStatusController.stream;

  // ============================================================================
  // State
  // ============================================================================

  bool get isInitialized => _initialized;
  bool get isListening => _isListening;
  String get lastRecognizedText => _lastRecognizedText;

  bool isAvailable() {
    return _speechToText.isAvailable;
  }

  // ============================================================================
  // Command Help
  // ============================================================================

  List<String> getAvailableCommands() {
    return [
      'Create goal [name]',
      'Create habit [name]',
      'Complete [task name]',
      'Show progress',
      'Open settings',
      'Start timer [duration]',
      'Stop timer',
      'Add note [content]',
      'Search [query]',
      'Help',
      'Cancel',
    ];
  }

  String getCommandHelp() {
    return '''
Voice Commands:
- Create goal: "Create goal workout daily"
- Create habit: "New habit drink water"
- Complete task: "Complete morning routine"
- View progress: "Show my progress"
- Timer: "Start timer for 5 minutes"
- Notes: "Add note remember to call"
- Search: "Find my goals"
- Help: "What can you do?"
''';
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  void dispose() {
    _speechToText.cancel();
    _textToSpeech.stop();
    _resultController.close();
    _partialResultController.close();
    _listeningStatusController.close();
  }
}
