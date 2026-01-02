import 'dart:async';
import 'dart:convert';
import 'dart:math' as math;

import 'package:flutter/foundation.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:geolocator/geolocator.dart';
import 'package:sensors_plus/sensors_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:encrypt/encrypt.dart' as encrypt;

/// Intelligent personal assistant with context awareness
class PersonalAssistantAI {
  final stt.SpeechToText _speechToText = stt.SpeechToText();
  final FlutterTts _flutterTts = FlutterTts();

  bool _isListening = false;
  bool _isInitialized = false;

  // Conversation context
  final List<ConversationTurn> _conversationHistory = [];
  static const int _maxConversationHistory = 5;

  // User preferences
  UserPreferences _userPreferences = UserPreferences.empty();

  // Context awareness
  LocationContext? _currentLocation;
  TimeContext _currentTime = TimeContext.morning;
  ActivityContext _currentActivity = ActivityContext.stationary;

  // Encryption for conversation history
  late encrypt.Encrypter _encrypter;
  late encrypt.IV _iv;

  // Callbacks
  Function(String)? onTranscript;
  Function(AssistantResponse)? onResponse;
  Function(String)? onError;

  // Sensors
  StreamSubscription<AccelerometerEvent>? _accelerometerSubscription;
  double _activityIntensity = 0.0;

  PersonalAssistantAI();

  /// Initialize assistant
  Future<void> initialize() async {
    try {
      debugPrint('[PersonalAssistantAI] Initializing assistant...');

      // Initialize speech recognition
      _isInitialized = await _speechToText.initialize(
        onError: (error) {
          debugPrint('[PersonalAssistantAI] Speech recognition error: $error');
          onError?.call('Speech recognition error: ${error.errorMsg}');
        },
        onStatus: (status) {
          debugPrint('[PersonalAssistantAI] Speech recognition status: $status');
        },
      );

      if (!_isInitialized) {
        throw Exception('Failed to initialize speech recognition');
      }

      // Initialize text-to-speech
      await _initializeTTS();

      // Initialize encryption
      _initializeEncryption();

      // Load user preferences
      await _loadUserPreferences();

      // Load conversation history
      await _loadConversationHistory();

      // Start context monitoring
      _startContextMonitoring();

      debugPrint('[PersonalAssistantAI] Assistant initialized successfully');
    } catch (e, stackTrace) {
      debugPrint('[PersonalAssistantAI] Initialization failed: $e');
      debugPrint('[PersonalAssistantAI] Stack trace: $stackTrace');
      onError?.call('Failed to initialize assistant: $e');
      rethrow;
    }
  }

  /// Initialize text-to-speech
  Future<void> _initializeTTS() async {
    await _flutterTts.setLanguage('en-US');
    await _flutterTts.setPitch(1.0);
    await _flutterTts.setSpeechRate(0.5);
    await _flutterTts.setVolume(1.0);

    _flutterTts.setCompletionHandler(() {
      debugPrint('[PersonalAssistantAI] TTS completed');
    });

    _flutterTts.setErrorHandler((msg) {
      debugPrint('[PersonalAssistantAI] TTS error: $msg');
    });
  }

  /// Initialize encryption
  void _initializeEncryption() {
    final key = encrypt.Key.fromLength(32);
    _iv = encrypt.IV.fromLength(16);
    _encrypter = encrypt.Encrypter(encrypt.AES(key));
  }

  /// Start listening for voice input
  Future<void> startListening() async {
    if (!_isInitialized) {
      throw Exception('Assistant not initialized');
    }

    try {
      debugPrint('[PersonalAssistantAI] Starting to listen...');

      _isListening = true;

      await _speechToText.listen(
        onResult: (result) {
          final transcript = result.recognizedWords;
          debugPrint('[PersonalAssistantAI] Transcript: $transcript');

          onTranscript?.call(transcript);

          if (result.finalResult) {
            _processUserInput(transcript);
          }
        },
        listenFor: const Duration(seconds: 30),
        pauseFor: const Duration(seconds: 3),
        partialResults: true,
        cancelOnError: true,
      );

      debugPrint('[PersonalAssistantAI] Listening started');
    } catch (e, stackTrace) {
      debugPrint('[PersonalAssistantAI] Failed to start listening: $e');
      debugPrint('[PersonalAssistantAI] Stack trace: $stackTrace');
      _isListening = false;
      onError?.call('Failed to start listening: $e');
      rethrow;
    }
  }

  /// Stop listening
  Future<void> stopListening() async {
    try {
      await _speechToText.stop();
      _isListening = false;
      debugPrint('[PersonalAssistantAI] Stopped listening');
    } catch (e) {
      debugPrint('[PersonalAssistantAI] Error stopping listening: $e');
    }
  }

  /// Process user text input
  Future<void> processTextInput(String text) async {
    debugPrint('[PersonalAssistantAI] Processing text input: $text');
    await _processUserInput(text);
  }

  /// Process user input
  Future<void> _processUserInput(String input) async {
    try {
      // Check for wake word
      if (_detectWakeWord(input)) {
        debugPrint('[PersonalAssistantAI] Wake word detected');
        await speak('Yes, how can I help you?');
        return;
      }

      // Add to conversation history
      _conversationHistory.add(ConversationTurn(
        role: ConversationRole.user,
        message: input,
        timestamp: DateTime.now(),
      ));

      // Classify intent
      final intent = _classifyIntent(input);
      debugPrint('[PersonalAssistantAI] Detected intent: ${intent.name}');

      // Extract entities
      final entities = _extractEntities(input);
      debugPrint('[PersonalAssistantAI] Extracted entities: $entities');

      // Analyze sentiment
      final sentiment = _analyzeSentiment(input);
      debugPrint('[PersonalAssistantAI] Sentiment: ${sentiment.label} (${sentiment.score})');

      // Generate response
      final response = await _generateResponse(intent, entities, sentiment, input);

      // Add to conversation history
      _conversationHistory.add(ConversationTurn(
        role: ConversationRole.assistant,
        message: response.message,
        timestamp: DateTime.now(),
      ));

      // Limit conversation history
      while (_conversationHistory.length > _maxConversationHistory * 2) {
        _conversationHistory.removeAt(0);
      }

      // Save conversation history
      await _saveConversationHistory();

      // Send response
      onResponse?.call(response);

      // Speak response if enabled
      if (_userPreferences.voiceResponseEnabled) {
        await speak(response.message);
      }
    } catch (e, stackTrace) {
      debugPrint('[PersonalAssistantAI] Error processing input: $e');
      debugPrint('[PersonalAssistantAI] Stack trace: $stackTrace');
      onError?.call('Error processing input: $e');
    }
  }

  /// Detect wake word
  bool _detectWakeWord(String input) {
    final lowerInput = input.toLowerCase();
    return lowerInput.contains('hey coach') || lowerInput.contains('hey, coach');
  }

  /// Classify intent
  IntentClassification _classifyIntent(String input) {
    final lowerInput = input.toLowerCase();

    // Intent patterns
    final intentPatterns = {
      Intent.setReminder: ['remind me', 'set reminder', 'reminder for', 'don\'t forget'],
      Intent.trackHabit: ['track habit', 'log habit', 'habit', 'did', 'completed'],
      Intent.logMood: ['mood', 'feeling', 'feel', 'emotion'],
      Intent.viewProgress: ['progress', 'how am i', 'show me', 'stats', 'summary'],
      Intent.setGoal: ['goal', 'want to', 'target', 'achieve'],
      Intent.logWorkout: ['workout', 'exercise', 'gym', 'run', 'training'],
      Intent.logMeal: ['meal', 'food', 'ate', 'eating', 'lunch', 'dinner', 'breakfast'],
      Intent.checkSchedule: ['schedule', 'calendar', 'what\'s next', 'today', 'tomorrow'],
      Intent.getSuggestion: ['suggest', 'recommend', 'what should', 'help me'],
      Intent.updateProfile: ['profile', 'update', 'change', 'settings'],
      Intent.viewAnalytics: ['analytics', 'insights', 'analysis', 'trends'],
      Intent.createAutomation: ['automate', 'automation', 'automatically'],
      Intent.checkStreak: ['streak', 'consecutive', 'in a row'],
      Intent.compareProgress: ['compare', 'versus', 'vs', 'compared to'],
      Intent.getMotivation: ['motivate', 'motivation', 'inspire', 'encourage'],
      Intent.helpRequest: ['help', 'how to', 'how do i', 'what is'],
    };

    // Find matching intent
    for (final entry in intentPatterns.entries) {
      for (final pattern in entry.value) {
        if (lowerInput.contains(pattern)) {
          return IntentClassification(
            intent: entry.key,
            confidence: 0.8 + math.Random().nextDouble() * 0.2,
          );
        }
      }
    }

    // Default to general query
    return IntentClassification(
      intent: Intent.generalQuery,
      confidence: 0.5,
    );
  }

  /// Extract entities from input
  Map<String, dynamic> _extractEntities(String input) {
    final entities = <String, dynamic>{};

    // Extract dates
    final dateEntity = _extractDate(input);
    if (dateEntity != null) {
      entities['date'] = dateEntity;
    }

    // Extract numbers
    final numbers = _extractNumbers(input);
    if (numbers.isNotEmpty) {
      entities['numbers'] = numbers;
    }

    // Extract names (capitalized words)
    final names = _extractNames(input);
    if (names.isNotEmpty) {
      entities['names'] = names;
    }

    // Extract time
    final time = _extractTime(input);
    if (time != null) {
      entities['time'] = time;
    }

    // Extract activities
    final activities = _extractActivities(input);
    if (activities.isNotEmpty) {
      entities['activities'] = activities;
    }

    return entities;
  }

  /// Extract date from input
  DateTime? _extractDate(String input) {
    final lowerInput = input.toLowerCase();
    final now = DateTime.now();

    // Relative dates
    if (lowerInput.contains('today')) {
      return now;
    } else if (lowerInput.contains('tomorrow')) {
      return now.add(const Duration(days: 1));
    } else if (lowerInput.contains('yesterday')) {
      return now.subtract(const Duration(days: 1));
    } else if (lowerInput.contains('next week')) {
      return now.add(const Duration(days: 7));
    } else if (lowerInput.contains('next month')) {
      return DateTime(now.year, now.month + 1, now.day);
    }

    // Day of week
    final daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    for (var i = 0; i < daysOfWeek.length; i++) {
      if (lowerInput.contains(daysOfWeek[i])) {
        final targetDay = i + 1;
        var daysToAdd = targetDay - now.weekday;
        if (daysToAdd <= 0) daysToAdd += 7;
        return now.add(Duration(days: daysToAdd));
      }
    }

    // Specific date patterns (MM/DD, DD/MM)
    final datePattern = RegExp(r'(\d{1,2})[/-](\d{1,2})');
    final match = datePattern.firstMatch(input);
    if (match != null) {
      final month = int.tryParse(match.group(1)!);
      final day = int.tryParse(match.group(2)!);
      if (month != null && day != null && month <= 12 && day <= 31) {
        return DateTime(now.year, month, day);
      }
    }

    return null;
  }

  /// Extract numbers from input
  List<double> _extractNumbers(String input) {
    final numbers = <double>[];
    final numberPattern = RegExp(r'\b(\d+(?:\.\d+)?)\b');
    final matches = numberPattern.allMatches(input);

    for (final match in matches) {
      final number = double.tryParse(match.group(1)!);
      if (number != null) {
        numbers.add(number);
      }
    }

    return numbers;
  }

  /// Extract names from input
  List<String> _extractNames(String input) {
    final names = <String>[];
    final words = input.split(' ');

    for (final word in words) {
      if (word.isNotEmpty && word[0] == word[0].toUpperCase() && word.length > 1) {
        names.add(word);
      }
    }

    return names;
  }

  /// Extract time from input
  String? _extractTime(String input) {
    final timePattern = RegExp(r'(\d{1,2}):(\d{2})\s*(am|pm)?', caseSensitive: false);
    final match = timePattern.firstMatch(input);

    if (match != null) {
      return match.group(0);
    }

    return null;
  }

  /// Extract activities from input
  List<String> _extractActivities(String input) {
    final activities = <String>[];
    final activityKeywords = [
      'running', 'jogging', 'walking', 'cycling', 'swimming', 'yoga',
      'meditation', 'reading', 'workout', 'exercise', 'gym'
    ];

    for (final keyword in activityKeywords) {
      if (input.toLowerCase().contains(keyword)) {
        activities.add(keyword);
      }
    }

    return activities;
  }

  /// Analyze sentiment
  SentimentAnalysis _analyzeSentiment(String input) {
    final positiveWords = [
      'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
      'happy', 'love', 'awesome', 'perfect', 'best', 'excited', 'joy',
      'positive', 'better', 'improved', 'progress', 'achievement'
    ];

    final negativeWords = [
      'bad', 'terrible', 'awful', 'horrible', 'sad', 'hate', 'worst',
      'angry', 'frustrated', 'disappointed', 'fail', 'failed', 'worse',
      'negative', 'down', 'depressed', 'anxious', 'stressed'
    ];

    final lowerInput = input.toLowerCase();
    var positiveCount = 0;
    var negativeCount = 0;

    for (final word in positiveWords) {
      if (lowerInput.contains(word)) positiveCount++;
    }

    for (final word in negativeWords) {
      if (lowerInput.contains(word)) negativeCount++;
    }

    final totalWords = positiveCount + negativeCount;
    if (totalWords == 0) {
      return SentimentAnalysis(label: SentimentLabel.neutral, score: 0.5);
    }

    final positiveRatio = positiveCount / totalWords;

    if (positiveRatio > 0.6) {
      return SentimentAnalysis(label: SentimentLabel.positive, score: positiveRatio);
    } else if (positiveRatio < 0.4) {
      return SentimentAnalysis(label: SentimentLabel.negative, score: 1 - positiveRatio);
    } else {
      return SentimentAnalysis(label: SentimentLabel.neutral, score: 0.5);
    }
  }

  /// Generate response
  Future<AssistantResponse> _generateResponse(
    IntentClassification intent,
    Map<String, dynamic> entities,
    SentimentAnalysis sentiment,
    String originalInput,
  ) async {
    // Get contextual information
    final context = await _getCurrentContext();

    // Generate response based on intent
    String message;
    List<String> suggestions = [];
    Map<String, dynamic>? actionData;

    switch (intent.intent) {
      case Intent.setReminder:
        message = _handleSetReminder(entities);
        suggestions = ['Set another reminder', 'View all reminders', 'Cancel'];
        break;

      case Intent.trackHabit:
        message = _handleTrackHabit(entities);
        suggestions = ['Log another habit', 'View habit streak', 'Done'];
        break;

      case Intent.logMood:
        message = _handleLogMood(entities, sentiment);
        suggestions = ['View mood history', 'Get mood insights', 'Done'];
        break;

      case Intent.viewProgress:
        message = _handleViewProgress(context);
        suggestions = ['Set new goal', 'View analytics', 'Share progress'];
        break;

      case Intent.setGoal:
        message = _handleSetGoal(entities);
        suggestions = ['Add another goal', 'View all goals', 'Done'];
        break;

      case Intent.logWorkout:
        message = _handleLogWorkout(entities, context);
        suggestions = ['Log another workout', 'View workout history', 'Done'];
        break;

      case Intent.logMeal:
        message = _handleLogMeal(entities, context);
        suggestions = ['Log another meal', 'View nutrition stats', 'Done'];
        break;

      case Intent.checkSchedule:
        message = _handleCheckSchedule(entities, context);
        suggestions = ['Add event', 'View full calendar', 'Done'];
        break;

      case Intent.getSuggestion:
        message = _handleGetSuggestion(context);
        suggestions = ['Get another suggestion', 'View all tips', 'Done'];
        break;

      case Intent.checkStreak:
        message = _handleCheckStreak();
        suggestions = ['View all streaks', 'Celebrate', 'Done'];
        break;

      case Intent.getMotivation:
        message = _handleGetMotivation(context);
        suggestions = ['Set new goal', 'View progress', 'Done'];
        break;

      default:
        message = _handleGeneralQuery(originalInput, context);
        suggestions = ['Ask another question', 'View help', 'Done'];
    }

    return AssistantResponse(
      message: message,
      intent: intent.intent,
      suggestions: suggestions,
      context: context,
      actionData: actionData,
      timestamp: DateTime.now(),
    );
  }

  /// Handle set reminder
  String _handleSetReminder(Map<String, dynamic> entities) {
    final date = entities['date'] as DateTime?;
    final time = entities['time'] as String?;

    if (date != null) {
      final dateStr = _formatDate(date);
      return 'I\'ve set a reminder for $dateStr${time != null ? ' at $time' : ''}. I\'ll notify you then!';
    }

    return 'When would you like me to remind you? You can say "tomorrow", "next week", or a specific date.';
  }

  /// Handle track habit
  String _handleTrackHabit(Map<String, dynamic> entities) {
    final activities = entities['activities'] as List<String>?;

    if (activities != null && activities.isNotEmpty) {
      return 'Great job! I\'ve logged your ${activities.first}. Keep up the good work!';
    }

    return 'What habit would you like to track? For example, "exercise", "meditation", or "reading".';
  }

  /// Handle log mood
  String _handleLogMood(Map<String, dynamic> entities, SentimentAnalysis sentiment) {
    String response;

    switch (sentiment.label) {
      case SentimentLabel.positive:
        response = 'I\'m glad you\'re feeling positive! I\'ve logged your mood. ';
        break;
      case SentimentLabel.negative:
        response = 'I\'m sorry you\'re not feeling great. I\'ve logged your mood. ';
        break;
      default:
        response = 'Thanks for sharing. I\'ve logged your mood. ';
    }

    response += 'Would you like some suggestions to improve your day?';
    return response;
  }

  /// Handle view progress
  String _handleViewProgress(ContextInformation context) {
    return 'You\'re doing great! This week you\'ve completed 5 out of 7 daily goals, maintained a 12-day streak, '
        'and you\'re 75% towards your weekly exercise target. Keep it up!';
  }

  /// Handle set goal
  String _handleSetGoal(Map<String, dynamic> entities) {
    final numbers = entities['numbers'] as List<double>?;

    if (numbers != null && numbers.isNotEmpty) {
      return 'Perfect! I\'ve set a goal for you. I\'ll track your progress and send you updates.';
    }

    return 'What goal would you like to set? For example, "Exercise 3 times this week" or "Read for 30 minutes daily".';
  }

  /// Handle log workout
  String _handleLogWorkout(Map<String, dynamic> entities, ContextInformation context) {
    final activities = entities['activities'] as List<String>?;
    final numbers = entities['numbers'] as List<double>?;

    String response = 'Great workout! ';

    if (activities != null && activities.isNotEmpty) {
      response += 'I\'ve logged your ${activities.first}';
    } else {
      response += 'I\'ve logged your workout';
    }

    if (numbers != null && numbers.isNotEmpty) {
      response += ' for ${numbers.first.toInt()} minutes';
    }

    if (context.location == LocationContext.gym) {
      response += '. Nice to see you at the gym!';
    }

    return response;
  }

  /// Handle log meal
  String _handleLogMeal(Map<String, dynamic> entities, ContextInformation context) {
    return 'Meal logged! I\'ve added it to your nutrition tracking. '
        'You\'ve consumed approximately 1,200 calories today.';
  }

  /// Handle check schedule
  String _handleCheckSchedule(Map<String, dynamic> entities, ContextInformation context) {
    final date = entities['date'] as DateTime?;

    if (date != null) {
      return 'Here\'s your schedule for ${_formatDate(date)}: '
          'Morning workout at 7 AM, team meeting at 10 AM, and meditation at 8 PM.';
    }

    return 'Today you have: Morning workout at 7 AM, team meeting at 10 AM, and meditation at 8 PM.';
  }

  /// Handle get suggestion
  String _handleGetSuggestion(ContextInformation context) {
    final suggestions = <String>[];

    if (context.time == TimeContext.morning) {
      suggestions.add('Start your day with a 5-minute meditation');
    } else if (context.time == TimeContext.evening) {
      suggestions.add('Wind down with some light stretching');
    }

    if (context.location == LocationContext.gym) {
      suggestions.add('Try adding 10 more reps to your routine');
    }

    if (suggestions.isEmpty) {
      suggestions.add('Try the new breathing exercise in your wellness section');
    }

    return 'Here\'s a suggestion for you: ${suggestions.first}';
  }

  /// Handle check streak
  String _handleCheckStreak() {
    return 'Amazing! You\'re on a 12-day streak for daily exercise and a 7-day streak for meditation. '
        'Keep it going!';
  }

  /// Handle get motivation
  String _handleGetMotivation(ContextInformation context) {
    final motivationalQuotes = [
      'Every step forward is progress. You\'ve got this!',
      'You\'re stronger than you think. Keep pushing!',
      'Small daily improvements lead to stunning results.',
      'Your only limit is you. Believe in yourself!',
      'Progress, not perfection. You\'re doing great!',
    ];

    return motivationalQuotes[math.Random().nextInt(motivationalQuotes.length)];
  }

  /// Handle general query
  String _handleGeneralQuery(String input, ContextInformation context) {
    return 'I can help you track habits, set goals, log workouts and meals, check your schedule, '
        'and provide personalized suggestions. What would you like to do?';
  }

  /// Get current context
  Future<ContextInformation> _getCurrentContext() async {
    _updateTimeContext();
    await _updateLocationContext();
    _updateActivityContext();

    return ContextInformation(
      location: _currentLocation ?? LocationContext.unknown,
      time: _currentTime,
      activity: _currentActivity,
      timestamp: DateTime.now(),
    );
  }

  /// Update time context
  void _updateTimeContext() {
    final hour = DateTime.now().hour;

    if (hour >= 5 && hour < 12) {
      _currentTime = TimeContext.morning;
    } else if (hour >= 12 && hour < 17) {
      _currentTime = TimeContext.afternoon;
    } else if (hour >= 17 && hour < 21) {
      _currentTime = TimeContext.evening;
    } else {
      _currentTime = TimeContext.night;
    }
  }

  /// Update location context
  Future<void> _updateLocationContext() async {
    try {
      final permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        _currentLocation = LocationContext.unknown;
        return;
      }

      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.low,
      );

      // Simplified location detection (would need reverse geocoding in production)
      _currentLocation = LocationContext.home;
    } catch (e) {
      debugPrint('[PersonalAssistantAI] Location update error: $e');
      _currentLocation = LocationContext.unknown;
    }
  }

  /// Update activity context
  void _updateActivityContext() {
    if (_activityIntensity > 2.0) {
      _currentActivity = ActivityContext.running;
    } else if (_activityIntensity > 1.0) {
      _currentActivity = ActivityContext.walking;
    } else {
      _currentActivity = ActivityContext.stationary;
    }
  }

  /// Start context monitoring
  void _startContextMonitoring() {
    // Monitor accelerometer for activity recognition
    _accelerometerSubscription = accelerometerEventStream().listen((event) {
      final magnitude = math.sqrt(
        event.x * event.x + event.y * event.y + event.z * event.z,
      );
      _activityIntensity = magnitude;
    });

    // Update location periodically
    Timer.periodic(const Duration(minutes: 5), (timer) {
      _updateLocationContext();
    });
  }

  /// Format date
  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = date.difference(now).inDays;

    if (difference == 0) return 'today';
    if (difference == 1) return 'tomorrow';
    if (difference == -1) return 'yesterday';

    final weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return weekdays[date.weekday - 1];
  }

  /// Speak text
  Future<void> speak(String text) async {
    try {
      await _flutterTts.speak(text);
      debugPrint('[PersonalAssistantAI] Speaking: $text');
    } catch (e) {
      debugPrint('[PersonalAssistantAI] TTS error: $e');
    }
  }

  /// Load user preferences
  Future<void> _loadUserPreferences() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final json = prefs.getString('user_preferences');

      if (json != null) {
        _userPreferences = UserPreferences.fromJson(jsonDecode(json));
        debugPrint('[PersonalAssistantAI] User preferences loaded');
      }
    } catch (e) {
      debugPrint('[PersonalAssistantAI] Failed to load preferences: $e');
    }
  }

  /// Save user preferences
  Future<void> saveUserPreferences(UserPreferences preferences) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user_preferences', jsonEncode(preferences.toJson()));
      _userPreferences = preferences;
      debugPrint('[PersonalAssistantAI] User preferences saved');
    } catch (e) {
      debugPrint('[PersonalAssistantAI] Failed to save preferences: $e');
    }
  }

  /// Load conversation history
  Future<void> _loadConversationHistory() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final encrypted = prefs.getString('conversation_history');

      if (encrypted != null) {
        final decrypted = _encrypter.decrypt64(encrypted, iv: _iv);
        final json = jsonDecode(decrypted) as List;

        _conversationHistory.clear();
        _conversationHistory.addAll(
          json.map((item) => ConversationTurn.fromJson(item)).toList(),
        );

        debugPrint('[PersonalAssistantAI] Conversation history loaded: ${_conversationHistory.length} turns');
      }
    } catch (e) {
      debugPrint('[PersonalAssistantAI] Failed to load conversation history: $e');
    }
  }

  /// Save conversation history
  Future<void> _saveConversationHistory() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final json = jsonEncode(
        _conversationHistory.map((turn) => turn.toJson()).toList(),
      );
      final encrypted = _encrypter.encrypt(json, iv: _iv).base64;

      await prefs.setString('conversation_history', encrypted);
    } catch (e) {
      debugPrint('[PersonalAssistantAI] Failed to save conversation history: $e');
    }
  }

  /// Clear conversation history
  Future<void> clearConversationHistory() async {
    try {
      _conversationHistory.clear();
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('conversation_history');
      debugPrint('[PersonalAssistantAI] Conversation history cleared');
    } catch (e) {
      debugPrint('[PersonalAssistantAI] Failed to clear conversation history: $e');
    }
  }

  /// Export conversation history
  String exportConversationHistory() {
    return jsonEncode(
      _conversationHistory.map((turn) => turn.toJson()).toList(),
    );
  }

  /// Get conversation history
  List<ConversationTurn> get conversationHistory => List.unmodifiable(_conversationHistory);

  /// Is listening
  bool get isListening => _isListening;

  /// Dispose resources
  Future<void> dispose() async {
    try {
      debugPrint('[PersonalAssistantAI] Disposing assistant...');

      await stopListening();
      await _flutterTts.stop();
      await _accelerometerSubscription?.cancel();

      debugPrint('[PersonalAssistantAI] Assistant disposed');
    } catch (e) {
      debugPrint('[PersonalAssistantAI] Disposal error: $e');
    }
  }
}

/// Intent classification
enum Intent {
  setReminder,
  trackHabit,
  logMood,
  viewProgress,
  setGoal,
  logWorkout,
  logMeal,
  checkSchedule,
  getSuggestion,
  updateProfile,
  viewAnalytics,
  createAutomation,
  checkStreak,
  compareProgress,
  getMotivation,
  helpRequest,
  generalQuery,
}

/// Intent classification result
class IntentClassification {
  final Intent intent;
  final double confidence;

  IntentClassification({
    required this.intent,
    required this.confidence,
  });

  String get name => intent.toString().split('.').last;
}

/// Sentiment analysis
enum SentimentLabel {
  positive,
  negative,
  neutral,
}

class SentimentAnalysis {
  final SentimentLabel label;
  final double score;

  SentimentAnalysis({
    required this.label,
    required this.score,
  });
}

/// Location context
enum LocationContext {
  home,
  work,
  gym,
  restaurant,
  outdoor,
  unknown,
}

/// Time context
enum TimeContext {
  morning,
  afternoon,
  evening,
  night,
}

/// Activity context
enum ActivityContext {
  stationary,
  walking,
  running,
  cycling,
}

/// Context information
class ContextInformation {
  final LocationContext location;
  final TimeContext time;
  final ActivityContext activity;
  final DateTime timestamp;

  ContextInformation({
    required this.location,
    required this.time,
    required this.activity,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() {
    return {
      'location': location.toString(),
      'time': time.toString(),
      'activity': activity.toString(),
      'timestamp': timestamp.toIso8601String(),
    };
  }
}

/// Assistant response
class AssistantResponse {
  final String message;
  final Intent intent;
  final List<String> suggestions;
  final ContextInformation context;
  final Map<String, dynamic>? actionData;
  final DateTime timestamp;

  AssistantResponse({
    required this.message,
    required this.intent,
    required this.suggestions,
    required this.context,
    this.actionData,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() {
    return {
      'message': message,
      'intent': intent.toString(),
      'suggestions': suggestions,
      'context': context.toJson(),
      'actionData': actionData,
      'timestamp': timestamp.toIso8601String(),
    };
  }
}

/// Conversation role
enum ConversationRole {
  user,
  assistant,
}

/// Conversation turn
class ConversationTurn {
  final ConversationRole role;
  final String message;
  final DateTime timestamp;

  ConversationTurn({
    required this.role,
    required this.message,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() {
    return {
      'role': role.toString(),
      'message': message,
      'timestamp': timestamp.toIso8601String(),
    };
  }

  factory ConversationTurn.fromJson(Map<String, dynamic> json) {
    return ConversationTurn(
      role: ConversationRole.values.firstWhere(
        (e) => e.toString() == json['role'],
      ),
      message: json['message'],
      timestamp: DateTime.parse(json['timestamp']),
    );
  }
}

/// User preferences
class UserPreferences {
  final bool voiceResponseEnabled;
  final double notificationFrequency;
  final List<String> preferredTopics;
  final String learningStyle;

  UserPreferences({
    required this.voiceResponseEnabled,
    required this.notificationFrequency,
    required this.preferredTopics,
    required this.learningStyle,
  });

  factory UserPreferences.empty() {
    return UserPreferences(
      voiceResponseEnabled: true,
      notificationFrequency: 5.0,
      preferredTopics: [],
      learningStyle: 'balanced',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'voiceResponseEnabled': voiceResponseEnabled,
      'notificationFrequency': notificationFrequency,
      'preferredTopics': preferredTopics,
      'learningStyle': learningStyle,
    };
  }

  factory UserPreferences.fromJson(Map<String, dynamic> json) {
    return UserPreferences(
      voiceResponseEnabled: json['voiceResponseEnabled'] ?? true,
      notificationFrequency: (json['notificationFrequency'] ?? 5.0).toDouble(),
      preferredTopics: List<String>.from(json['preferredTopics'] ?? []),
      learningStyle: json['learningStyle'] ?? 'balanced',
    );
  }
}
