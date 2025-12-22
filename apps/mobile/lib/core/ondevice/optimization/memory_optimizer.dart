import 'dart:async';

import '../models/coaching_nlu_model.dart';
import '../models/behavior_predictor_model.dart';
import '../models/quick_response_model.dart';
import '../ensemble/model_ensemble_manager.dart';

/// Memory Optimizer
/// Manages on-device ML model memory usage through intelligent loading/unloading
class MemoryOptimizer {
  static final MemoryOptimizer _instance = MemoryOptimizer._internal();
  factory MemoryOptimizer() => _instance;
  MemoryOptimizer._internal();

  // Models
  final CoachingNLUModel _nluModel = CoachingNLUModel();
  final BehaviorPredictorModel _behaviorModel = BehaviorPredictorModel();
  final QuickResponseModel _quickResponseModel = QuickResponseModel();

  // Memory tracking
  final Map<String, ModelMemoryInfo> _modelMemory = {};
  int _totalMemoryBudgetMB = 50; // Default 50MB budget

  // Usage tracking
  final Map<String, DateTime> _lastUsed = {};
  final Map<String, int> _usageCount = {};

  // Configuration
  MemoryConfig _config = MemoryConfig();

  // Timers
  Timer? _cleanupTimer;
  Timer? _monitoringTimer;

  // Event stream
  final StreamController<MemoryEvent> _eventController =
      StreamController<MemoryEvent>.broadcast();

  /// Stream of memory events
  Stream<MemoryEvent> get events => _eventController.stream;

  /// Initialize memory optimizer
  Future<void> initialize({MemoryConfig? config}) async {
    if (config != null) {
      _config = config;
      _totalMemoryBudgetMB = config.memoryBudgetMB;
    }

    // Initialize model memory info
    _modelMemory['nlu'] = ModelMemoryInfo(
      modelId: 'nlu',
      estimatedSizeMB: 5,
      priority: ModelPriority.high,
    );

    _modelMemory['behavior'] = ModelMemoryInfo(
      modelId: 'behavior',
      estimatedSizeMB: 3,
      priority: ModelPriority.medium,
    );

    _modelMemory['quick_response'] = ModelMemoryInfo(
      modelId: 'quick_response',
      estimatedSizeMB: 15,
      priority: ModelPriority.medium,
    );

    // Start background cleanup if enabled
    if (_config.enableAutoCleanup) {
      _startCleanupTimer();
    }

    // Start memory monitoring
    if (_config.enableMemoryMonitoring) {
      _startMonitoringTimer();
    }
  }

  /// Record model usage
  void recordUsage(String modelId) {
    _lastUsed[modelId] = DateTime.now();
    _usageCount[modelId] = (_usageCount[modelId] ?? 0) + 1;

    final memoryInfo = _modelMemory[modelId];
    if (memoryInfo != null) {
      memoryInfo.isLoaded = true;
      memoryInfo.lastUsed = DateTime.now();
    }
  }

  /// Check if model should be loaded based on memory constraints
  Future<LoadDecision> shouldLoadModel(String modelId) async {
    final memoryInfo = _modelMemory[modelId];
    if (memoryInfo == null) {
      return LoadDecision(
        shouldLoad: false,
        reason: 'Unknown model',
      );
    }

    // Check if already loaded
    if (memoryInfo.isLoaded) {
      return LoadDecision(
        shouldLoad: true,
        reason: 'Already loaded',
        isAlreadyLoaded: true,
      );
    }

    // Calculate current memory usage
    final currentUsage = _getCurrentMemoryUsage();

    // Check if we have room
    if (currentUsage + memoryInfo.estimatedSizeMB <= _totalMemoryBudgetMB) {
      return LoadDecision(
        shouldLoad: true,
        reason: 'Within memory budget',
      );
    }

    // Try to free memory
    final freedMB = await _tryFreeMemory(memoryInfo.estimatedSizeMB);
    if (freedMB >= memoryInfo.estimatedSizeMB) {
      return LoadDecision(
        shouldLoad: true,
        reason: 'Freed memory for loading',
        freedMemoryMB: freedMB,
      );
    }

    // Check priority override
    if (memoryInfo.priority == ModelPriority.critical) {
      return LoadDecision(
        shouldLoad: true,
        reason: 'Critical priority override',
        forceLoad: true,
      );
    }

    return LoadDecision(
      shouldLoad: false,
      reason: 'Insufficient memory',
      currentUsageMB: currentUsage,
      requiredMB: memoryInfo.estimatedSizeMB,
    );
  }

  /// Unload a specific model
  Future<void> unloadModel(String modelId) async {
    final memoryInfo = _modelMemory[modelId];
    if (memoryInfo == null || !memoryInfo.isLoaded) return;

    switch (modelId) {
      case 'nlu':
        _nluModel.unload();
        break;
      case 'behavior':
        _behaviorModel.unload();
        break;
      case 'quick_response':
        _quickResponseModel.unload();
        break;
    }

    memoryInfo.isLoaded = false;

    _emitEvent(MemoryEvent(
      type: MemoryEventType.modelUnloaded,
      modelId: modelId,
      message: 'Model unloaded to free ${memoryInfo.estimatedSizeMB}MB',
    ));
  }

  /// Unload all models
  Future<void> unloadAll() async {
    for (final modelId in _modelMemory.keys) {
      await unloadModel(modelId);
    }

    _emitEvent(MemoryEvent(
      type: MemoryEventType.allModelsUnloaded,
      message: 'All models unloaded',
    ));
  }

  /// Perform memory cleanup
  Future<int> cleanup({bool aggressive = false}) async {
    var freedMB = 0;

    _emitEvent(MemoryEvent(
      type: MemoryEventType.cleanupStarted,
      message: aggressive ? 'Starting aggressive cleanup' : 'Starting cleanup',
    ));

    // Get candidates for unloading
    final candidates = _getUnloadCandidates(aggressive);

    for (final modelId in candidates) {
      final memoryInfo = _modelMemory[modelId];
      if (memoryInfo != null && memoryInfo.isLoaded) {
        await unloadModel(modelId);
        freedMB += memoryInfo.estimatedSizeMB;
      }
    }

    _emitEvent(MemoryEvent(
      type: MemoryEventType.cleanupCompleted,
      message: 'Cleanup freed ${freedMB}MB',
      freedMemoryMB: freedMB,
    ));

    return freedMB;
  }

  /// Get current memory status
  MemoryStatus getMemoryStatus() {
    final usage = _getCurrentMemoryUsage();
    final loadedModels = _modelMemory.values
        .where((m) => m.isLoaded)
        .map((m) => m.modelId)
        .toList();

    return MemoryStatus(
      totalBudgetMB: _totalMemoryBudgetMB,
      currentUsageMB: usage,
      availableMB: _totalMemoryBudgetMB - usage,
      loadedModels: loadedModels,
      usagePercentage: (usage / _totalMemoryBudgetMB * 100).round(),
    );
  }

  /// Get model memory info
  ModelMemoryInfo? getModelInfo(String modelId) {
    return _modelMemory[modelId];
  }

  /// Set memory budget
  void setMemoryBudget(int budgetMB) {
    _totalMemoryBudgetMB = budgetMB;

    // Check if we need to cleanup
    final currentUsage = _getCurrentMemoryUsage();
    if (currentUsage > budgetMB) {
      cleanup();
    }
  }

  /// Update model priority
  void setModelPriority(String modelId, ModelPriority priority) {
    final memoryInfo = _modelMemory[modelId];
    if (memoryInfo != null) {
      memoryInfo.priority = priority;
    }
  }

  /// Get usage statistics
  Map<String, ModelUsageStats> getUsageStats() {
    final stats = <String, ModelUsageStats>{};

    for (final entry in _modelMemory.entries) {
      stats[entry.key] = ModelUsageStats(
        modelId: entry.key,
        usageCount: _usageCount[entry.key] ?? 0,
        lastUsed: _lastUsed[entry.key],
        isLoaded: entry.value.isLoaded,
        memorySizeMB: entry.value.estimatedSizeMB,
      );
    }

    return stats;
  }

  /// Optimize for low memory conditions
  Future<void> optimizeForLowMemory() async {
    _emitEvent(MemoryEvent(
      type: MemoryEventType.lowMemoryOptimization,
      message: 'Optimizing for low memory conditions',
    ));

    // Aggressive cleanup
    await cleanup(aggressive: true);

    // Reduce memory budget temporarily
    _totalMemoryBudgetMB = (_totalMemoryBudgetMB * 0.7).round();
  }

  /// Restore normal memory settings
  void restoreNormalMemorySettings() {
    _totalMemoryBudgetMB = _config.memoryBudgetMB;

    _emitEvent(MemoryEvent(
      type: MemoryEventType.memorySettingsRestored,
      message: 'Normal memory settings restored',
    ));
  }

  // ==================== Private Methods ====================

  int _getCurrentMemoryUsage() {
    var usage = 0;
    for (final info in _modelMemory.values) {
      if (info.isLoaded) {
        usage += info.estimatedSizeMB;
      }
    }
    return usage;
  }

  Future<int> _tryFreeMemory(int requiredMB) async {
    var freedMB = 0;
    final candidates = _getUnloadCandidates(false);

    for (final modelId in candidates) {
      if (freedMB >= requiredMB) break;

      final memoryInfo = _modelMemory[modelId];
      if (memoryInfo != null && memoryInfo.isLoaded) {
        await unloadModel(modelId);
        freedMB += memoryInfo.estimatedSizeMB;
      }
    }

    return freedMB;
  }

  List<String> _getUnloadCandidates(bool aggressive) {
    final candidates = <MapEntry<String, double>>[];

    for (final entry in _modelMemory.entries) {
      if (!entry.value.isLoaded) continue;

      // Skip critical models unless aggressive
      if (!aggressive && entry.value.priority == ModelPriority.critical) {
        continue;
      }

      // Calculate unload score (higher = more likely to unload)
      var score = 0.0;

      // Prioritize based on last usage
      final lastUsed = _lastUsed[entry.key];
      if (lastUsed != null) {
        final minutesSinceUse =
            DateTime.now().difference(lastUsed).inMinutes;
        score += minutesSinceUse / 10;
      } else {
        score += 100; // Never used
      }

      // Factor in priority (lower priority = higher unload score)
      switch (entry.value.priority) {
        case ModelPriority.low:
          score += 50;
          break;
        case ModelPriority.medium:
          score += 25;
          break;
        case ModelPriority.high:
          score += 10;
          break;
        case ModelPriority.critical:
          score -= 100;
          break;
      }

      // Factor in usage count (less used = higher unload score)
      final usageCount = _usageCount[entry.key] ?? 0;
      score -= usageCount / 10;

      candidates.add(MapEntry(entry.key, score));
    }

    // Sort by score (higher = unload first)
    candidates.sort((a, b) => b.value.compareTo(a.value));

    return candidates.map((e) => e.key).toList();
  }

  void _startCleanupTimer() {
    _cleanupTimer?.cancel();
    _cleanupTimer = Timer.periodic(
      Duration(minutes: _config.cleanupIntervalMinutes),
      (_) => _performScheduledCleanup(),
    );
  }

  void _startMonitoringTimer() {
    _monitoringTimer?.cancel();
    _monitoringTimer = Timer.periodic(
      const Duration(seconds: 30),
      (_) => _checkMemoryPressure(),
    );
  }

  Future<void> _performScheduledCleanup() async {
    final status = getMemoryStatus();

    // Cleanup if usage exceeds threshold
    if (status.usagePercentage > _config.cleanupThresholdPercent) {
      await cleanup();
    }
  }

  void _checkMemoryPressure() {
    final status = getMemoryStatus();

    if (status.usagePercentage > 90) {
      _emitEvent(MemoryEvent(
        type: MemoryEventType.memoryPressureHigh,
        message: 'Memory usage at ${status.usagePercentage}%',
      ));

      // Trigger cleanup
      cleanup();
    }
  }

  void _emitEvent(MemoryEvent event) {
    _eventController.add(event);
  }

  /// Dispose resources
  void dispose() {
    _cleanupTimer?.cancel();
    _monitoringTimer?.cancel();
    _eventController.close();
  }
}

/// Model priority levels
enum ModelPriority {
  low,
  medium,
  high,
  critical,
}

/// Memory event types
enum MemoryEventType {
  modelUnloaded,
  allModelsUnloaded,
  cleanupStarted,
  cleanupCompleted,
  lowMemoryOptimization,
  memorySettingsRestored,
  memoryPressureHigh,
}

/// Model memory information
class ModelMemoryInfo {
  final String modelId;
  final int estimatedSizeMB;
  ModelPriority priority;
  bool isLoaded;
  DateTime? lastUsed;

  ModelMemoryInfo({
    required this.modelId,
    required this.estimatedSizeMB,
    this.priority = ModelPriority.medium,
    this.isLoaded = false,
    this.lastUsed,
  });

  Map<String, dynamic> toJson() => {
    'modelId': modelId,
    'estimatedSizeMB': estimatedSizeMB,
    'priority': priority.name,
    'isLoaded': isLoaded,
    'lastUsed': lastUsed?.toIso8601String(),
  };
}

/// Load decision result
class LoadDecision {
  final bool shouldLoad;
  final String reason;
  final bool isAlreadyLoaded;
  final bool forceLoad;
  final int? freedMemoryMB;
  final int? currentUsageMB;
  final int? requiredMB;

  LoadDecision({
    required this.shouldLoad,
    required this.reason,
    this.isAlreadyLoaded = false,
    this.forceLoad = false,
    this.freedMemoryMB,
    this.currentUsageMB,
    this.requiredMB,
  });

  Map<String, dynamic> toJson() => {
    'shouldLoad': shouldLoad,
    'reason': reason,
    'isAlreadyLoaded': isAlreadyLoaded,
    'forceLoad': forceLoad,
    if (freedMemoryMB != null) 'freedMemoryMB': freedMemoryMB,
    if (currentUsageMB != null) 'currentUsageMB': currentUsageMB,
    if (requiredMB != null) 'requiredMB': requiredMB,
  };
}

/// Memory status
class MemoryStatus {
  final int totalBudgetMB;
  final int currentUsageMB;
  final int availableMB;
  final List<String> loadedModels;
  final int usagePercentage;

  MemoryStatus({
    required this.totalBudgetMB,
    required this.currentUsageMB,
    required this.availableMB,
    required this.loadedModels,
    required this.usagePercentage,
  });

  Map<String, dynamic> toJson() => {
    'totalBudgetMB': totalBudgetMB,
    'currentUsageMB': currentUsageMB,
    'availableMB': availableMB,
    'loadedModels': loadedModels,
    'usagePercentage': usagePercentage,
  };
}

/// Memory event
class MemoryEvent {
  final MemoryEventType type;
  final String? modelId;
  final String message;
  final int? freedMemoryMB;
  final DateTime timestamp;

  MemoryEvent({
    required this.type,
    this.modelId,
    required this.message,
    this.freedMemoryMB,
  }) : timestamp = DateTime.now();
}

/// Model usage statistics
class ModelUsageStats {
  final String modelId;
  final int usageCount;
  final DateTime? lastUsed;
  final bool isLoaded;
  final int memorySizeMB;

  ModelUsageStats({
    required this.modelId,
    required this.usageCount,
    this.lastUsed,
    required this.isLoaded,
    required this.memorySizeMB,
  });

  Map<String, dynamic> toJson() => {
    'modelId': modelId,
    'usageCount': usageCount,
    'lastUsed': lastUsed?.toIso8601String(),
    'isLoaded': isLoaded,
    'memorySizeMB': memorySizeMB,
  };
}

/// Memory optimizer configuration
class MemoryConfig {
  int memoryBudgetMB;
  bool enableAutoCleanup;
  bool enableMemoryMonitoring;
  int cleanupIntervalMinutes;
  int cleanupThresholdPercent;

  MemoryConfig({
    this.memoryBudgetMB = 50,
    this.enableAutoCleanup = true,
    this.enableMemoryMonitoring = true,
    this.cleanupIntervalMinutes = 10,
    this.cleanupThresholdPercent = 80,
  });
}
