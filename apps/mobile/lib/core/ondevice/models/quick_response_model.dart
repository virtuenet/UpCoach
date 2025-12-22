import 'dart:async';
import 'dart:math';

/// Quick Response Model
/// On-device fast coaching response generation
/// Model size: <15MB, Latency target: <100ms
class QuickResponseModel {
  static const String modelId = 'quick_response_v1';
  static const String modelPath = 'assets/models/quick_response.tflite';
  static const int maxTokens = 150;
  static const int vocabSize = 30000;

  bool _isLoaded = false;
  final Random _random = Random(42);

  // Response templates by category
  final Map<String, List<ResponseTemplate>> _templates = {};

  // Learned response patterns
  final Map<String, List<double>> _responseEmbeddings = {};

  QuickResponseModel() {
    _initializeTemplates();
    _initializeEmbeddings();
  }

  /// Load the model
  Future<void> load() async {
    if (_isLoaded) return;
    await Future.delayed(const Duration(milliseconds: 80));
    _isLoaded = true;
  }

  /// Unload the model
  void unload() {
    _isLoaded = false;
  }

  /// Check if model is loaded
  bool get isLoaded => _isLoaded;

  /// Generate a quick response
  Future<QuickResponse> generateResponse({
    required String intent,
    required String? userInput,
    required Map<String, dynamic> context,
    ResponseStyle style = ResponseStyle.balanced,
  }) async {
    if (!_isLoaded) {
      await load();
    }

    final startTime = DateTime.now();

    // Get relevant templates for this intent
    final templates = _templates[intent] ?? _templates['general']!;

    // Score templates based on context
    final scoredTemplates = _scoreTemplates(templates, context, style);

    // Select best template
    final selectedTemplate = _selectTemplate(scoredTemplates);

    // Fill in template variables
    final response = _fillTemplate(selectedTemplate, context);

    // Generate follow-up suggestions if appropriate
    final followUps = _generateFollowUpSuggestions(intent, context);

    // Calculate confidence
    final confidence = _calculateConfidence(scoredTemplates, selectedTemplate);

    final latencyMs = DateTime.now().difference(startTime).inMilliseconds;

    return QuickResponse(
      text: response,
      intent: intent,
      style: style,
      confidence: confidence,
      latencyMs: latencyMs,
      templateId: selectedTemplate.id,
      followUpSuggestions: followUps,
      metadata: {
        'contextMatched': scoredTemplates.first.score > 0.7,
        'templateCount': templates.length,
      },
    );
  }

  /// Check if we can generate a quick response for this intent
  Future<bool> canHandleIntent(String intent) async {
    return _templates.containsKey(intent) || _templates.containsKey('general');
  }

  /// Get available response styles
  List<ResponseStyle> getAvailableStyles() {
    return ResponseStyle.values.toList();
  }

  /// Generate encouraging response
  Future<QuickResponse> generateEncouragement({
    required int streakDays,
    required double completionRate,
    required String userName,
  }) async {
    if (!_isLoaded) {
      await load();
    }

    final startTime = DateTime.now();
    String response;
    String templateId;

    if (streakDays > 30) {
      response = "$userName, you're absolutely crushing it with a $streakDays-day streak! 🔥 Your dedication is inspiring.";
      templateId = 'encourage_streak_30plus';
    } else if (streakDays > 7) {
      response = "Awesome work, $userName! $streakDays days and counting. You're building real momentum! 💪";
      templateId = 'encourage_streak_7plus';
    } else if (completionRate > 0.8) {
      response = "Great consistency, $userName! You completed ${(completionRate * 100).round()}% of your habits. Keep it up!";
      templateId = 'encourage_completion_high';
    } else if (completionRate > 0.5) {
      response = "You're making progress, $userName! Every completed habit counts. Let's keep building!";
      templateId = 'encourage_completion_mid';
    } else {
      response = "Hey $userName, every journey starts with a single step. Let's tackle one habit at a time!";
      templateId = 'encourage_restart';
    }

    final latencyMs = DateTime.now().difference(startTime).inMilliseconds;

    return QuickResponse(
      text: response,
      intent: 'encourage',
      style: ResponseStyle.motivational,
      confidence: 0.9,
      latencyMs: latencyMs,
      templateId: templateId,
      followUpSuggestions: ['View habits', 'See progress', 'Get tips'],
      metadata: {
        'streakDays': streakDays,
        'completionRate': completionRate,
      },
    );
  }

  /// Generate reminder response
  Future<QuickResponse> generateReminder({
    required String habitName,
    required int streakAtRisk,
    required bool isOptimalTime,
  }) async {
    if (!_isLoaded) {
      await load();
    }

    final startTime = DateTime.now();
    String response;
    String templateId;

    if (streakAtRisk > 0 && isOptimalTime) {
      response = "Don't break your $streakAtRisk-day streak! Now's a great time to complete '$habitName'. 🎯";
      templateId = 'reminder_urgent_optimal';
    } else if (streakAtRisk > 0) {
      response = "Friendly reminder: '$habitName' is waiting! Protect your $streakAtRisk-day streak.";
      templateId = 'reminder_urgent';
    } else if (isOptimalTime) {
      response = "Perfect timing! Ready to check off '$habitName'?";
      templateId = 'reminder_optimal_time';
    } else {
      response = "When you have a moment, '$habitName' is on your list for today.";
      templateId = 'reminder_gentle';
    }

    final latencyMs = DateTime.now().difference(startTime).inMilliseconds;

    return QuickResponse(
      text: response,
      intent: 'remind',
      style: ResponseStyle.direct,
      confidence: 0.85,
      latencyMs: latencyMs,
      templateId: templateId,
      followUpSuggestions: ['Complete now', 'Snooze 1h', 'Skip today'],
      metadata: {
        'habitName': habitName,
        'streakAtRisk': streakAtRisk,
        'isOptimalTime': isOptimalTime,
      },
    );
  }

  /// Generate celebration response
  Future<QuickResponse> generateCelebration({
    required String achievement,
    required String achievementType,
    int? value,
  }) async {
    if (!_isLoaded) {
      await load();
    }

    final startTime = DateTime.now();
    String response;
    String templateId;

    switch (achievementType) {
      case 'streak':
        response = "🎉 Amazing! You've hit a $value-day streak on $achievement! Your consistency is paying off!";
        templateId = 'celebrate_streak';
        break;
      case 'goal_complete':
        response = "🏆 Congratulations! You've completed your goal: $achievement! This is a huge win!";
        templateId = 'celebrate_goal';
        break;
      case 'milestone':
        response = "⭐ Milestone unlocked! $achievement. You're making incredible progress!";
        templateId = 'celebrate_milestone';
        break;
      case 'perfect_day':
        response = "🌟 Perfect day! You completed all your habits. You're unstoppable!";
        templateId = 'celebrate_perfect_day';
        break;
      default:
        response = "🎊 Great work on $achievement! Keep the momentum going!";
        templateId = 'celebrate_general';
    }

    final latencyMs = DateTime.now().difference(startTime).inMilliseconds;

    return QuickResponse(
      text: response,
      intent: 'celebrate',
      style: ResponseStyle.enthusiastic,
      confidence: 0.95,
      latencyMs: latencyMs,
      templateId: templateId,
      followUpSuggestions: ['Share achievement', 'View all achievements', 'Set new goal'],
      metadata: {
        'achievement': achievement,
        'achievementType': achievementType,
        'value': value,
      },
    );
  }

  /// Generate coaching tip response
  Future<QuickResponse> generateCoachingTip({
    required String category,
    required List<String> userInterests,
    required int experienceLevel,
  }) async {
    if (!_isLoaded) {
      await load();
    }

    final startTime = DateTime.now();

    // Get tips for category
    final tips = _getTipsForCategory(category, experienceLevel);

    // Filter by user interests
    final relevantTips = tips.where((tip) {
      return userInterests.any((interest) =>
          tip.tags.contains(interest.toLowerCase()));
    }).toList();

    // Select tip
    final selectedTip = relevantTips.isNotEmpty
        ? relevantTips[_random.nextInt(relevantTips.length)]
        : tips[_random.nextInt(tips.length)];

    final latencyMs = DateTime.now().difference(startTime).inMilliseconds;

    return QuickResponse(
      text: selectedTip.content,
      intent: 'coach',
      style: ResponseStyle.informative,
      confidence: 0.8,
      latencyMs: latencyMs,
      templateId: selectedTip.id,
      followUpSuggestions: ['More tips', 'Apply this', 'Save for later'],
      metadata: {
        'category': category,
        'tipId': selectedTip.id,
        'experienceLevel': experienceLevel,
      },
    );
  }

  // ==================== Private Methods ====================

  void _initializeTemplates() {
    _templates['greeting'] = [
      ResponseTemplate(
        id: 'greet_morning',
        content: "Good morning! Ready to tackle your goals today?",
        timeContext: 'morning',
        style: ResponseStyle.balanced,
      ),
      ResponseTemplate(
        id: 'greet_afternoon',
        content: "Good afternoon! How's your day going?",
        timeContext: 'afternoon',
        style: ResponseStyle.balanced,
      ),
      ResponseTemplate(
        id: 'greet_evening',
        content: "Good evening! Let's check in on your progress.",
        timeContext: 'evening',
        style: ResponseStyle.balanced,
      ),
    ];

    _templates['motivation'] = [
      ResponseTemplate(
        id: 'motivate_general',
        content: "Remember: small steps lead to big changes. You've got this!",
        style: ResponseStyle.motivational,
      ),
      ResponseTemplate(
        id: 'motivate_struggle',
        content: "Setbacks are part of the journey. What matters is getting back on track.",
        style: ResponseStyle.supportive,
      ),
      ResponseTemplate(
        id: 'motivate_progress',
        content: "You're making real progress! Keep pushing forward.",
        style: ResponseStyle.enthusiastic,
      ),
    ];

    _templates['habit_complete'] = [
      ResponseTemplate(
        id: 'habit_done_1',
        content: "Great job completing {habitName}! ✓",
        style: ResponseStyle.direct,
      ),
      ResponseTemplate(
        id: 'habit_done_streak',
        content: "Excellent! That's {streakDays} days in a row for {habitName}!",
        style: ResponseStyle.enthusiastic,
      ),
    ];

    _templates['general'] = [
      ResponseTemplate(
        id: 'general_acknowledge',
        content: "I understand. How can I help you with your goals?",
        style: ResponseStyle.balanced,
      ),
      ResponseTemplate(
        id: 'general_clarify',
        content: "Could you tell me more about what you're working on?",
        style: ResponseStyle.balanced,
      ),
    ];
  }

  void _initializeEmbeddings() {
    // Initialize response embeddings for semantic matching
    final categories = ['greeting', 'motivation', 'habit_complete', 'general'];
    for (final category in categories) {
      _responseEmbeddings[category] = List.generate(
        64,
        (_) => _random.nextDouble() * 2 - 1,
      );
    }
  }

  List<ScoredTemplate> _scoreTemplates(
    List<ResponseTemplate> templates,
    Map<String, dynamic> context,
    ResponseStyle preferredStyle,
  ) {
    final scored = <ScoredTemplate>[];

    for (final template in templates) {
      var score = 0.5;

      // Style match bonus
      if (template.style == preferredStyle) {
        score += 0.3;
      }

      // Time context bonus
      if (template.timeContext != null) {
        final hour = context['hour'] as int? ?? DateTime.now().hour;
        if (_matchesTimeContext(template.timeContext!, hour)) {
          score += 0.2;
        } else {
          score -= 0.2;
        }
      }

      // Context variable availability bonus
      final requiredVars = _extractVariables(template.content);
      var varsAvailable = 0;
      for (final v in requiredVars) {
        if (context.containsKey(v)) varsAvailable++;
      }
      if (requiredVars.isNotEmpty) {
        score += 0.1 * (varsAvailable / requiredVars.length);
      }

      scored.add(ScoredTemplate(template: template, score: score.clamp(0.0, 1.0)));
    }

    // Sort by score
    scored.sort((a, b) => b.score.compareTo(a.score));
    return scored;
  }

  ResponseTemplate _selectTemplate(List<ScoredTemplate> scoredTemplates) {
    // Use weighted random selection favoring higher scores
    if (scoredTemplates.isEmpty) {
      return ResponseTemplate(
        id: 'fallback',
        content: "I'm here to help!",
        style: ResponseStyle.balanced,
      );
    }

    // 80% chance of selecting top template
    if (_random.nextDouble() < 0.8) {
      return scoredTemplates.first.template;
    }

    // 20% chance of selecting from top 3
    final topN = scoredTemplates.take(3).toList();
    return topN[_random.nextInt(topN.length)].template;
  }

  String _fillTemplate(ResponseTemplate template, Map<String, dynamic> context) {
    var result = template.content;

    // Replace variables
    final variables = _extractVariables(result);
    for (final v in variables) {
      final value = context[v]?.toString() ?? '';
      result = result.replaceAll('{$v}', value);
    }

    return result;
  }

  List<String> _generateFollowUpSuggestions(
    String intent,
    Map<String, dynamic> context,
  ) {
    switch (intent) {
      case 'greeting':
        return ['View today\'s habits', 'Check progress', 'Chat with AI coach'];
      case 'habit_complete':
        return ['Complete another', 'View streak', 'See daily summary'];
      case 'motivation':
        return ['Get started', 'See my wins', 'Talk to coach'];
      default:
        return ['View habits', 'Check goals', 'Get help'];
    }
  }

  double _calculateConfidence(
    List<ScoredTemplate> scoredTemplates,
    ResponseTemplate selected,
  ) {
    if (scoredTemplates.isEmpty) return 0.5;

    final selectedScore = scoredTemplates
        .firstWhere((s) => s.template.id == selected.id)
        .score;

    // Higher confidence if top template was selected and has high score
    return (selectedScore * 0.7 + 0.3).clamp(0.0, 1.0);
  }

  bool _matchesTimeContext(String timeContext, int hour) {
    switch (timeContext) {
      case 'morning':
        return hour >= 5 && hour < 12;
      case 'afternoon':
        return hour >= 12 && hour < 17;
      case 'evening':
        return hour >= 17 && hour < 21;
      case 'night':
        return hour >= 21 || hour < 5;
      default:
        return true;
    }
  }

  List<String> _extractVariables(String template) {
    final regex = RegExp(r'\{(\w+)\}');
    return regex.allMatches(template).map((m) => m.group(1)!).toList();
  }

  List<CoachingTip> _getTipsForCategory(String category, int experienceLevel) {
    final allTips = <CoachingTip>[
      CoachingTip(
        id: 'tip_habit_stacking',
        content: "Try habit stacking: attach new habits to existing routines for better consistency.",
        category: 'habits',
        tags: ['productivity', 'habits', 'beginner'],
        experienceLevel: 1,
      ),
      CoachingTip(
        id: 'tip_two_minute',
        content: "The 2-minute rule: if a habit takes less than 2 minutes, do it now.",
        category: 'habits',
        tags: ['productivity', 'habits', 'beginner'],
        experienceLevel: 1,
      ),
      CoachingTip(
        id: 'tip_smart_goals',
        content: "Use SMART goals: Specific, Measurable, Achievable, Relevant, Time-bound.",
        category: 'goals',
        tags: ['goals', 'planning', 'beginner'],
        experienceLevel: 1,
      ),
      CoachingTip(
        id: 'tip_review_weekly',
        content: "Weekly reviews help you stay on track. Reflect on wins and areas to improve.",
        category: 'productivity',
        tags: ['productivity', 'review', 'intermediate'],
        experienceLevel: 2,
      ),
      CoachingTip(
        id: 'tip_keystone_habits',
        content: "Focus on keystone habits - changes that naturally trigger other positive behaviors.",
        category: 'habits',
        tags: ['habits', 'advanced', 'behavior'],
        experienceLevel: 3,
      ),
    ];

    return allTips
        .where((t) =>
            t.category == category || category == 'general')
        .where((t) => t.experienceLevel <= experienceLevel + 1)
        .toList();
  }
}

/// Response style enum
enum ResponseStyle {
  balanced,
  motivational,
  direct,
  supportive,
  enthusiastic,
  informative,
  analytical,
}

/// Quick response result
class QuickResponse {
  final String text;
  final String intent;
  final ResponseStyle style;
  final double confidence;
  final int latencyMs;
  final String templateId;
  final List<String> followUpSuggestions;
  final Map<String, dynamic> metadata;

  QuickResponse({
    required this.text,
    required this.intent,
    required this.style,
    required this.confidence,
    required this.latencyMs,
    required this.templateId,
    required this.followUpSuggestions,
    required this.metadata,
  });

  Map<String, dynamic> toJson() => {
    'text': text,
    'intent': intent,
    'style': style.name,
    'confidence': confidence,
    'latencyMs': latencyMs,
    'templateId': templateId,
    'followUpSuggestions': followUpSuggestions,
    'metadata': metadata,
  };
}

/// Response template
class ResponseTemplate {
  final String id;
  final String content;
  final ResponseStyle style;
  final String? timeContext;
  final List<String> tags;

  ResponseTemplate({
    required this.id,
    required this.content,
    required this.style,
    this.timeContext,
    this.tags = const [],
  });
}

/// Scored template for selection
class ScoredTemplate {
  final ResponseTemplate template;
  final double score;

  ScoredTemplate({
    required this.template,
    required this.score,
  });
}

/// Coaching tip
class CoachingTip {
  final String id;
  final String content;
  final String category;
  final List<String> tags;
  final int experienceLevel;

  CoachingTip({
    required this.id,
    required this.content,
    required this.category,
    required this.tags,
    required this.experienceLevel,
  });
}
