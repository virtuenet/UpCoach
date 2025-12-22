import 'dart:async';

import '../models/coaching_nlu_model.dart';
import '../models/behavior_predictor_model.dart';
import '../models/quick_response_model.dart';
import '../ensemble/model_ensemble_manager.dart';

/// Model Warmup Service
/// Pre-loads and warms up on-device ML models for optimal first-inference latency
class ModelWarmupService {
  static final ModelWarmupService _instance = ModelWarmupService._internal();
  factory ModelWarmupService() => _instance;
  ModelWarmupService._internal();

  // Models
  final CoachingNLUModel _nluModel = CoachingNLUModel();
  final BehaviorPredictorModel _behaviorModel = BehaviorPredictorModel();
  final QuickResponseModel _quickResponseModel = QuickResponseModel();
  final ModelEnsembleManager _ensembleManager = ModelEnsembleManager();

  // Warmup state
  final Map<String, WarmupState> _warmupStates = {};
  bool _isWarmingUp = false;
  DateTime? _lastWarmup;

  // Configuration
  WarmupConfig _config = WarmupConfig();

  // Event stream
  final StreamController<WarmupEvent> _eventController =
      StreamController<WarmupEvent>.broadcast();

  /// Stream of warmup events
  Stream<WarmupEvent> get events => _eventController.stream;

  /// Initialize warmup service
  Future<void> initialize({WarmupConfig? config}) async {
    if (config != null) {
      _config = config;
    }

    // Initialize warmup states
    _warmupStates['nlu'] = WarmupState(modelId: 'nlu');
    _warmupStates['behavior'] = WarmupState(modelId: 'behavior');
    _warmupStates['quick_response'] = WarmupState(modelId: 'quick_response');
    _warmupStates['ensemble'] = WarmupState(modelId: 'ensemble');

    // Perform initial warmup if configured
    if (_config.warmupOnInit) {
      await warmupAll();
    }
  }

  /// Warmup all models
  Future<WarmupReport> warmupAll() async {
    if (_isWarmingUp) {
      return WarmupReport(
        success: false,
        message: 'Warmup already in progress',
        modelsWarmedUp: [],
        totalDurationMs: 0,
      );
    }

    _isWarmingUp = true;
    final startTime = DateTime.now();
    final warmedUp = <String>[];
    final errors = <String, String>{};

    _emitEvent(WarmupEvent(
      type: WarmupEventType.started,
      modelId: 'all',
      message: 'Starting warmup for all models',
    ));

    // Warmup models based on priority
    final modelOrder = _config.priorityOrder.isNotEmpty
        ? _config.priorityOrder
        : ['nlu', 'behavior', 'quick_response', 'ensemble'];

    for (final modelId in modelOrder) {
      try {
        await _warmupModel(modelId);
        warmedUp.add(modelId);
      } catch (e) {
        errors[modelId] = e.toString();
        _emitEvent(WarmupEvent(
          type: WarmupEventType.error,
          modelId: modelId,
          message: 'Warmup failed: $e',
        ));
      }
    }

    _isWarmingUp = false;
    _lastWarmup = DateTime.now();

    final duration = DateTime.now().difference(startTime);

    _emitEvent(WarmupEvent(
      type: WarmupEventType.completed,
      modelId: 'all',
      message: 'Warmup completed in ${duration.inMilliseconds}ms',
    ));

    return WarmupReport(
      success: errors.isEmpty,
      message: errors.isEmpty
          ? 'All models warmed up successfully'
          : 'Some models failed to warm up',
      modelsWarmedUp: warmedUp,
      totalDurationMs: duration.inMilliseconds,
      errors: errors.isNotEmpty ? errors : null,
    );
  }

  /// Warmup a specific model
  Future<void> warmupModel(String modelId) async {
    if (_warmupStates[modelId]?.status == WarmupStatus.inProgress) {
      return;
    }

    await _warmupModel(modelId);
  }

  /// Warmup essential models only (for quick startup)
  Future<WarmupReport> warmupEssential() async {
    _isWarmingUp = true;
    final startTime = DateTime.now();
    final warmedUp = <String>[];

    _emitEvent(WarmupEvent(
      type: WarmupEventType.started,
      modelId: 'essential',
      message: 'Starting essential warmup',
    ));

    // Only warmup the most critical model
    try {
      await _warmupModel('nlu');
      warmedUp.add('nlu');
    } catch (e) {
      _emitEvent(WarmupEvent(
        type: WarmupEventType.error,
        modelId: 'nlu',
        message: 'Essential warmup failed: $e',
      ));
    }

    _isWarmingUp = false;
    final duration = DateTime.now().difference(startTime);

    return WarmupReport(
      success: warmedUp.isNotEmpty,
      message: 'Essential warmup completed',
      modelsWarmedUp: warmedUp,
      totalDurationMs: duration.inMilliseconds,
    );
  }

  /// Background warmup (deferred loading)
  void scheduleBackgroundWarmup({Duration delay = const Duration(seconds: 5)}) {
    Timer(delay, () async {
      if (!_isWarmingUp && _shouldWarmup()) {
        await warmupAll();
      }
    });
  }

  /// Check if models need warmup
  bool _shouldWarmup() {
    if (_lastWarmup == null) return true;

    final hoursSinceLastWarmup =
        DateTime.now().difference(_lastWarmup!).inHours;
    return hoursSinceLastWarmup >= _config.warmupIntervalHours;
  }

  /// Get warmup status for all models
  Map<String, WarmupState> getWarmupStatus() {
    return Map.from(_warmupStates);
  }

  /// Get warmup state for a specific model
  WarmupState? getModelWarmupState(String modelId) {
    return _warmupStates[modelId];
  }

  /// Check if all models are warmed up
  bool get isFullyWarmedUp {
    return _warmupStates.values.every(
      (state) => state.status == WarmupStatus.complete,
    );
  }

  /// Check if essential models are warmed up
  bool get isEssentialWarmedUp {
    final essentialState = _warmupStates['nlu'];
    return essentialState?.status == WarmupStatus.complete;
  }

  /// Reset warmup state
  void reset() {
    for (final state in _warmupStates.values) {
      state.status = WarmupStatus.notStarted;
      state.latencyMs = null;
      state.warmedUpAt = null;
    }
    _lastWarmup = null;
  }

  /// Update configuration
  void updateConfig(WarmupConfig config) {
    _config = config;
  }

  // ==================== Private Methods ====================

  Future<void> _warmupModel(String modelId) async {
    final state = _warmupStates[modelId];
    if (state == null) return;

    state.status = WarmupStatus.inProgress;

    _emitEvent(WarmupEvent(
      type: WarmupEventType.modelStarted,
      modelId: modelId,
      message: 'Warming up $modelId',
    ));

    final startTime = DateTime.now();

    try {
      switch (modelId) {
        case 'nlu':
          await _warmupNLU();
          break;
        case 'behavior':
          await _warmupBehavior();
          break;
        case 'quick_response':
          await _warmupQuickResponse();
          break;
        case 'ensemble':
          await _warmupEnsemble();
          break;
      }

      state.status = WarmupStatus.complete;
      state.latencyMs = DateTime.now().difference(startTime).inMilliseconds;
      state.warmedUpAt = DateTime.now();

      _emitEvent(WarmupEvent(
        type: WarmupEventType.modelCompleted,
        modelId: modelId,
        message: 'Warmup complete in ${state.latencyMs}ms',
      ));
    } catch (e) {
      state.status = WarmupStatus.failed;
      state.error = e.toString();
      rethrow;
    }
  }

  Future<void> _warmupNLU() async {
    // Load model
    await _nluModel.load();

    // Run warmup inference
    if (_config.runWarmupInference) {
      await _nluModel.process('Hello, how are you?');
      await _nluModel.process('I want to set a goal');
      await _nluModel.quickIntentCheck('Help me');
    }
  }

  Future<void> _warmupBehavior() async {
    // Load model
    await _behaviorModel.load();

    // Run warmup inference
    if (_config.runWarmupInference) {
      final testFeatures = BehaviorFeatures(
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
      await _behaviorModel.predict(testFeatures);
    }
  }

  Future<void> _warmupQuickResponse() async {
    // Load model
    await _quickResponseModel.load();

    // Run warmup inference
    if (_config.runWarmupInference) {
      await _quickResponseModel.generateResponse(
        intent: 'greeting',
        userInput: 'Hello',
        context: {'hour': 10},
      );
    }
  }

  Future<void> _warmupEnsemble() async {
    // Initialize and warmup ensemble manager
    await _ensembleManager.initialize();
    await _ensembleManager.warmup(modelIds: ['nlu', 'behavior']);
  }

  void _emitEvent(WarmupEvent event) {
    _eventController.add(event);
  }

  /// Dispose resources
  void dispose() {
    _eventController.close();
  }
}

/// Warmup status
enum WarmupStatus {
  notStarted,
  inProgress,
  complete,
  failed,
}

/// Warmup event types
enum WarmupEventType {
  started,
  modelStarted,
  modelCompleted,
  completed,
  error,
}

/// Warmup state for a model
class WarmupState {
  final String modelId;
  WarmupStatus status;
  int? latencyMs;
  DateTime? warmedUpAt;
  String? error;

  WarmupState({
    required this.modelId,
    this.status = WarmupStatus.notStarted,
    this.latencyMs,
    this.warmedUpAt,
    this.error,
  });

  Map<String, dynamic> toJson() => {
    'modelId': modelId,
    'status': status.name,
    'latencyMs': latencyMs,
    'warmedUpAt': warmedUpAt?.toIso8601String(),
    'error': error,
  };
}

/// Warmup event
class WarmupEvent {
  final WarmupEventType type;
  final String modelId;
  final String message;
  final DateTime timestamp;

  WarmupEvent({
    required this.type,
    required this.modelId,
    required this.message,
  }) : timestamp = DateTime.now();
}

/// Warmup report
class WarmupReport {
  final bool success;
  final String message;
  final List<String> modelsWarmedUp;
  final int totalDurationMs;
  final Map<String, String>? errors;

  WarmupReport({
    required this.success,
    required this.message,
    required this.modelsWarmedUp,
    required this.totalDurationMs,
    this.errors,
  });

  Map<String, dynamic> toJson() => {
    'success': success,
    'message': message,
    'modelsWarmedUp': modelsWarmedUp,
    'totalDurationMs': totalDurationMs,
    if (errors != null) 'errors': errors,
  };
}

/// Warmup configuration
class WarmupConfig {
  bool warmupOnInit;
  bool runWarmupInference;
  int warmupIntervalHours;
  List<String> priorityOrder;
  int maxConcurrentWarmups;

  WarmupConfig({
    this.warmupOnInit = false,
    this.runWarmupInference = true,
    this.warmupIntervalHours = 24,
    this.priorityOrder = const [],
    this.maxConcurrentWarmups = 2,
  });
}
