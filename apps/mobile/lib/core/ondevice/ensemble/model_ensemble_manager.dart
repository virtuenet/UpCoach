import 'dart:async';

import '../models/coaching_nlu_model.dart';
import '../models/behavior_predictor_model.dart';
import '../on_device_inference_engine.dart';

/// Model Ensemble Manager
/// Coordinates multiple on-device models with intelligent routing
class ModelEnsembleManager {
  static final ModelEnsembleManager _instance = ModelEnsembleManager._internal();
  factory ModelEnsembleManager() => _instance;
  ModelEnsembleManager._internal();

  // Models
  late CoachingNLUModel _nluModel;
  late BehaviorPredictorModel _behaviorModel;
  OnDeviceInferenceEngine? _inferenceEngine;

  // Model states
  final Map<String, ModelState> _modelStates = {};
  final Map<String, List<double>> _modelLatencies = {};
  final Map<String, int> _modelUsageCount = {};

  // Configuration
  bool _initialized = false;
  bool _warmupComplete = false;

  // Routing thresholds
  static const double _complexityThreshold = 0.7;
  static const int _maxLatencyMs = 100;
  static const double _confidenceThreshold = 0.6;

  /// Initialize the ensemble manager
  Future<void> initialize() async {
    if (_initialized) return;

    _nluModel = CoachingNLUModel();
    _behaviorModel = BehaviorPredictorModel();

    // Initialize model states
    _modelStates['nlu'] = ModelState.unloaded;
    _modelStates['behavior'] = ModelState.unloaded;
    _modelStates['quick_response'] = ModelState.unloaded;

    _initialized = true;
  }

  /// Warm up models for faster inference
  Future<void> warmup({List<String>? modelIds}) async {
    if (!_initialized) {
      await initialize();
    }

    final modelsToWarm = modelIds ?? ['nlu', 'behavior'];

    for (final modelId in modelsToWarm) {
      await _warmupModel(modelId);
    }

    _warmupComplete = true;
  }

  /// Process text with intelligent routing
  Future<EnsembleResult> processText(
    String text, {
    required String userId,
    InferenceContext? context,
  }) async {
    if (!_initialized) {
      await initialize();
    }

    final startTime = DateTime.now();
    final routingDecision = _makeRoutingDecision(text, context);

    // Execute based on routing
    switch (routingDecision.primaryModel) {
      case 'nlu':
        final nluResult = await _runNLU(text);
        return EnsembleResult(
          type: 'nlu',
          data: nluResult.toJson(),
          routingDecision: routingDecision,
          latencyMs: DateTime.now().difference(startTime).inMilliseconds,
          confidence: nluResult.confidence,
        );

      case 'behavior':
        final features = context?.behaviorFeatures ?? _getDefaultFeatures();
        final prediction = await _runBehaviorPrediction(features);
        return EnsembleResult(
          type: 'behavior',
          data: prediction.toJson(),
          routingDecision: routingDecision,
          latencyMs: DateTime.now().difference(startTime).inMilliseconds,
          confidence: prediction.confidence,
        );

      case 'hybrid':
        // Run both models and combine results
        final results = await Future.wait([
          _runNLU(text),
          if (context?.behaviorFeatures != null)
            _runBehaviorPrediction(context!.behaviorFeatures!),
        ]);

        final nluResult = results[0] as NLUResult;
        final behaviorResult = results.length > 1 ? results[1] as BehaviorPrediction : null;

        return EnsembleResult(
          type: 'hybrid',
          data: {
            'nlu': nluResult.toJson(),
            if (behaviorResult != null) 'behavior': behaviorResult.toJson(),
          },
          routingDecision: routingDecision,
          latencyMs: DateTime.now().difference(startTime).inMilliseconds,
          confidence: (nluResult.confidence + (behaviorResult?.confidence ?? 0)) / 2,
        );

      default:
        throw Exception('Unknown routing: ${routingDecision.primaryModel}');
    }
  }

  /// Get behavior prediction
  Future<BehaviorPrediction> getBehaviorPrediction(
    BehaviorFeatures features,
  ) async {
    if (!_initialized) {
      await initialize();
    }

    return _runBehaviorPrediction(features);
  }

  /// Get NLU analysis
  Future<NLUResult> getNLUAnalysis(String text) async {
    if (!_initialized) {
      await initialize();
    }

    return _runNLU(text);
  }

  /// Check if a quick response is possible
  Future<QuickResponseCheck> checkQuickResponse(String text) async {
    if (!_initialized) {
      await initialize();
    }

    final intent = await _nluModel.quickIntentCheck(text);

    if (intent == null) {
      return QuickResponseCheck(
        canRespond: false,
        reason: 'Intent not recognized',
      );
    }

    // Check if this intent has a quick response template
    final template = _getQuickResponseTemplate(intent);

    return QuickResponseCheck(
      canRespond: template != null,
      reason: template != null ? 'Template available' : 'Requires full processing',
      intent: intent,
      responseTemplate: template,
    );
  }

  /// Get model statistics
  Map<String, ModelStats> getModelStats() {
    final stats = <String, ModelStats>{};

    for (final modelId in _modelStates.keys) {
      final latencies = _modelLatencies[modelId] ?? [];
      final avgLatency = latencies.isEmpty
          ? 0.0
          : latencies.reduce((a, b) => a + b) / latencies.length;

      stats[modelId] = ModelStats(
        modelId: modelId,
        state: _modelStates[modelId]!,
        usageCount: _modelUsageCount[modelId] ?? 0,
        avgLatencyMs: avgLatency,
        lastUsed: DateTime.now(),
      );
    }

    return stats;
  }

  /// Unload a specific model
  Future<void> unloadModel(String modelId) async {
    switch (modelId) {
      case 'nlu':
        _nluModel.unload();
        break;
      case 'behavior':
        _behaviorModel.unload();
        break;
    }
    _modelStates[modelId] = ModelState.unloaded;
  }

  /// Unload all models to free memory
  Future<void> unloadAll() async {
    _nluModel.unload();
    _behaviorModel.unload();

    for (final modelId in _modelStates.keys) {
      _modelStates[modelId] = ModelState.unloaded;
    }
  }

  // ==================== Private Methods ====================

  Future<void> _warmupModel(String modelId) async {
    _modelStates[modelId] = ModelState.loading;

    switch (modelId) {
      case 'nlu':
        await _nluModel.load();
        // Run a dummy inference to warm up
        await _nluModel.process('hello');
        break;
      case 'behavior':
        await _behaviorModel.load();
        break;
    }

    _modelStates[modelId] = ModelState.ready;
  }

  RoutingDecision _makeRoutingDecision(String text, InferenceContext? context) {
    // Determine text complexity
    final complexity = _estimateTextComplexity(text);

    // Determine required models based on context
    final needsNLU = true; // Always need NLU for text
    final needsBehavior = context?.behaviorFeatures != null;

    // Routing logic
    if (complexity < 0.3 && !needsBehavior) {
      // Simple query, NLU only
      return RoutingDecision(
        primaryModel: 'nlu',
        fallbackModel: null,
        reason: 'Simple query',
        complexity: complexity,
      );
    }

    if (needsBehavior && !needsNLU) {
      return RoutingDecision(
        primaryModel: 'behavior',
        fallbackModel: null,
        reason: 'Behavior prediction requested',
        complexity: complexity,
      );
    }

    if (needsBehavior && complexity > _complexityThreshold) {
      return RoutingDecision(
        primaryModel: 'hybrid',
        fallbackModel: 'nlu',
        reason: 'Complex query with behavior context',
        complexity: complexity,
      );
    }

    return RoutingDecision(
      primaryModel: 'nlu',
      fallbackModel: 'behavior',
      reason: 'Default NLU routing',
      complexity: complexity,
    );
  }

  double _estimateTextComplexity(String text) {
    // Simple heuristic for text complexity
    final words = text.split(' ').length;
    final hasQuestion = text.contains('?');
    final hasMultipleSentences = text.split(RegExp(r'[.!?]')).length > 1;

    var complexity = 0.0;

    // Word count factor
    complexity += (words / 50).clamp(0.0, 0.4);

    // Question complexity
    if (hasQuestion) complexity += 0.2;

    // Multiple sentences
    if (hasMultipleSentences) complexity += 0.2;

    // Special keywords indicating complexity
    final complexKeywords = ['why', 'how', 'explain', 'analyze', 'compare'];
    for (final keyword in complexKeywords) {
      if (text.toLowerCase().contains(keyword)) {
        complexity += 0.1;
      }
    }

    return complexity.clamp(0.0, 1.0);
  }

  Future<NLUResult> _runNLU(String text) async {
    final startTime = DateTime.now();

    if (!_nluModel.isLoaded) {
      await _nluModel.load();
      _modelStates['nlu'] = ModelState.ready;
    }

    final result = await _nluModel.process(text);

    // Track metrics
    final latency = DateTime.now().difference(startTime).inMilliseconds.toDouble();
    _trackModelUsage('nlu', latency);

    return result;
  }

  Future<BehaviorPrediction> _runBehaviorPrediction(BehaviorFeatures features) async {
    final startTime = DateTime.now();

    if (!_behaviorModel.isLoaded) {
      await _behaviorModel.load();
      _modelStates['behavior'] = ModelState.ready;
    }

    final result = await _behaviorModel.predict(features);

    // Track metrics
    final latency = DateTime.now().difference(startTime).inMilliseconds.toDouble();
    _trackModelUsage('behavior', latency);

    return result;
  }

  void _trackModelUsage(String modelId, double latencyMs) {
    _modelUsageCount[modelId] = (_modelUsageCount[modelId] ?? 0) + 1;

    if (!_modelLatencies.containsKey(modelId)) {
      _modelLatencies[modelId] = [];
    }

    _modelLatencies[modelId]!.add(latencyMs);

    // Keep only last 100 latency measurements
    if (_modelLatencies[modelId]!.length > 100) {
      _modelLatencies[modelId]!.removeAt(0);
    }
  }

  BehaviorFeatures _getDefaultFeatures() {
    return BehaviorFeatures(
      engagementScore: 50.0,
      daysSinceLastSession: 1,
      sessionFrequency: 3,
      habitCompletionRate: 0.7,
      habitsCompletedToday: 2,
      totalActiveHabits: 5,
      currentStreak: 5,
      goalProgressRate: 0.5,
      daysSinceGoalUpdate: 2,
      aiChatFrequency: 2.0,
      lastAIChatHoursAgo: 12,
      peakActivityHour: 18,
      notificationResponseRate: 0.4,
      totalSessions: 20,
      totalHabitCompletions: 50,
    );
  }

  String? _getQuickResponseTemplate(String intent) {
    const templates = {
      'greeting': 'Hello! How can I help you with your goals today?',
      'farewell': 'Goodbye! Keep up the great work!',
      'celebrate_success': 'Congratulations on your achievement! 🎉',
      'general_chat': null, // Requires full processing
      'request_advice': null,
    };

    return templates[intent];
  }
}

/// Model state
enum ModelState {
  unloaded,
  loading,
  ready,
  error,
}

/// Routing decision
class RoutingDecision {
  final String primaryModel;
  final String? fallbackModel;
  final String reason;
  final double complexity;

  RoutingDecision({
    required this.primaryModel,
    this.fallbackModel,
    required this.reason,
    required this.complexity,
  });

  Map<String, dynamic> toJson() => {
    'primaryModel': primaryModel,
    'fallbackModel': fallbackModel,
    'reason': reason,
    'complexity': complexity,
  };
}

/// Ensemble result
class EnsembleResult {
  final String type;
  final Map<String, dynamic> data;
  final RoutingDecision routingDecision;
  final int latencyMs;
  final double confidence;

  EnsembleResult({
    required this.type,
    required this.data,
    required this.routingDecision,
    required this.latencyMs,
    required this.confidence,
  });

  Map<String, dynamic> toJson() => {
    'type': type,
    'data': data,
    'routingDecision': routingDecision.toJson(),
    'latencyMs': latencyMs,
    'confidence': confidence,
  };
}

/// Quick response check result
class QuickResponseCheck {
  final bool canRespond;
  final String reason;
  final String? intent;
  final String? responseTemplate;

  QuickResponseCheck({
    required this.canRespond,
    required this.reason,
    this.intent,
    this.responseTemplate,
  });
}

/// Model statistics
class ModelStats {
  final String modelId;
  final ModelState state;
  final int usageCount;
  final double avgLatencyMs;
  final DateTime lastUsed;

  ModelStats({
    required this.modelId,
    required this.state,
    required this.usageCount,
    required this.avgLatencyMs,
    required this.lastUsed,
  });

  Map<String, dynamic> toJson() => {
    'modelId': modelId,
    'state': state.name,
    'usageCount': usageCount,
    'avgLatencyMs': avgLatencyMs,
    'lastUsed': lastUsed.toIso8601String(),
  };
}

/// Inference context for routing
class InferenceContext {
  final BehaviorFeatures? behaviorFeatures;
  final String? sessionId;
  final String? previousIntent;
  final int conversationTurn;

  InferenceContext({
    this.behaviorFeatures,
    this.sessionId,
    this.previousIntent,
    this.conversationTurn = 0,
  });
}
