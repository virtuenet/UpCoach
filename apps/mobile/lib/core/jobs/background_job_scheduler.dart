import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:workmanager/workmanager.dart';
import 'package:battery_plus/battery_plus.dart';

/// Job priority levels
enum JobPriority {
  low,
  normal,
  high,
  critical,
}

/// Job constraints for execution
class JobConstraints {
  final bool requiresNetwork;
  final bool requiresWiFi;
  final bool requiresCharging;
  final bool requiresIdle;
  final int minBatteryLevel; // 0-100

  const JobConstraints({
    this.requiresNetwork = false,
    this.requiresWiFi = false,
    this.requiresCharging = false,
    this.requiresIdle = false,
    this.minBatteryLevel = 0,
  });

  Map<String, dynamic> toJson() {
    return {
      'requiresNetwork': requiresNetwork,
      'requiresWiFi': requiresWiFi,
      'requiresCharging': requiresCharging,
      'requiresIdle': requiresIdle,
      'minBatteryLevel': minBatteryLevel,
    };
  }

  factory JobConstraints.fromJson(Map<String, dynamic> json) {
    return JobConstraints(
      requiresNetwork: json['requiresNetwork'] ?? false,
      requiresWiFi: json['requiresWiFi'] ?? false,
      requiresCharging: json['requiresCharging'] ?? false,
      requiresIdle: json['requiresIdle'] ?? false,
      minBatteryLevel: json['minBatteryLevel'] ?? 0,
    );
  }
}

/// Background job definition
class BackgroundJob {
  final String id;
  final String type;
  final Map<String, dynamic> params;
  final JobConstraints constraints;
  final int maxRetries;
  final Duration retryBackoff;
  final JobPriority priority;
  final DateTime? scheduledFor;
  final Duration? repeatInterval;
  final DateTime createdAt;
  final int executionCount;
  final DateTime? lastExecutedAt;
  final String? lastError;

  BackgroundJob({
    required this.id,
    required this.type,
    required this.params,
    this.constraints = const JobConstraints(),
    this.maxRetries = 3,
    this.retryBackoff = const Duration(seconds: 30),
    this.priority = JobPriority.normal,
    this.scheduledFor,
    this.repeatInterval,
    DateTime? createdAt,
    this.executionCount = 0,
    this.lastExecutedAt,
    this.lastError,
  }) : createdAt = createdAt ?? DateTime.now();

  BackgroundJob copyWith({
    String? id,
    String? type,
    Map<String, dynamic>? params,
    JobConstraints? constraints,
    int? maxRetries,
    Duration? retryBackoff,
    JobPriority? priority,
    DateTime? scheduledFor,
    Duration? repeatInterval,
    DateTime? createdAt,
    int? executionCount,
    DateTime? lastExecutedAt,
    String? lastError,
  }) {
    return BackgroundJob(
      id: id ?? this.id,
      type: type ?? this.type,
      params: params ?? this.params,
      constraints: constraints ?? this.constraints,
      maxRetries: maxRetries ?? this.maxRetries,
      retryBackoff: retryBackoff ?? this.retryBackoff,
      priority: priority ?? this.priority,
      scheduledFor: scheduledFor ?? this.scheduledFor,
      repeatInterval: repeatInterval ?? this.repeatInterval,
      createdAt: createdAt ?? this.createdAt,
      executionCount: executionCount ?? this.executionCount,
      lastExecutedAt: lastExecutedAt ?? this.lastExecutedAt,
      lastError: lastError ?? this.lastError,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type,
      'params': params,
      'constraints': constraints.toJson(),
      'maxRetries': maxRetries,
      'retryBackoffSeconds': retryBackoff.inSeconds,
      'priority': priority.index,
      'scheduledFor': scheduledFor?.toIso8601String(),
      'repeatIntervalSeconds': repeatInterval?.inSeconds,
      'createdAt': createdAt.toIso8601String(),
      'executionCount': executionCount,
      'lastExecutedAt': lastExecutedAt?.toIso8601String(),
      'lastError': lastError,
    };
  }

  factory BackgroundJob.fromJson(Map<String, dynamic> json) {
    return BackgroundJob(
      id: json['id'],
      type: json['type'],
      params: Map<String, dynamic>.from(json['params']),
      constraints: JobConstraints.fromJson(json['constraints']),
      maxRetries: json['maxRetries'] ?? 3,
      retryBackoff: Duration(seconds: json['retryBackoffSeconds'] ?? 30),
      priority: JobPriority.values[json['priority'] ?? 1],
      scheduledFor: json['scheduledFor'] != null ? DateTime.parse(json['scheduledFor']) : null,
      repeatInterval: json['repeatIntervalSeconds'] != null
          ? Duration(seconds: json['repeatIntervalSeconds'])
          : null,
      createdAt: DateTime.parse(json['createdAt']),
      executionCount: json['executionCount'] ?? 0,
      lastExecutedAt:
          json['lastExecutedAt'] != null ? DateTime.parse(json['lastExecutedAt']) : null,
      lastError: json['lastError'],
    );
  }
}

/// Job execution result
class JobResult {
  final bool success;
  final dynamic data;
  final String? error;
  final bool shouldRetry;
  final Duration? retryAfter;

  JobResult({
    required this.success,
    this.data,
    this.error,
    this.shouldRetry = false,
    this.retryAfter,
  });

  factory JobResult.success({dynamic data}) {
    return JobResult(success: true, data: data);
  }

  factory JobResult.failure({
    required String error,
    bool shouldRetry = true,
    Duration? retryAfter,
  }) {
    return JobResult(
      success: false,
      error: error,
      shouldRetry: shouldRetry,
      retryAfter: retryAfter,
    );
  }
}

/// Schedule and execute background jobs with retry logic
class BackgroundJobScheduler extends ChangeNotifier {
  static final BackgroundJobScheduler _instance = BackgroundJobScheduler._internal();
  factory BackgroundJobScheduler() => _instance;
  BackgroundJobScheduler._internal();

  final Map<String, BackgroundJob> _jobs = {};
  final Battery _battery = Battery();

  bool _initialized = false;

  /// Initialize the job scheduler
  Future<void> initialize() async {
    if (_initialized) return;

    debugPrint('[BackgroundJobScheduler] Initializing...');

    // Initialize WorkManager
    await Workmanager().initialize(
      callbackDispatcher,
      isInDebugMode: kDebugMode,
    );

    // Load persisted jobs
    await _loadPersistedJobs();

    // Register periodic cleanup
    await scheduleJob(BackgroundJob(
      id: 'cleanup_jobs',
      type: 'cleanup',
      params: {},
      repeatInterval: const Duration(hours: 24),
      priority: JobPriority.low,
    ));

    _initialized = true;
    debugPrint('[BackgroundJobScheduler] Initialized with ${_jobs.length} jobs');
  }

  /// Schedule a new job
  Future<void> scheduleJob(BackgroundJob job) async {
    _ensureInitialized();

    debugPrint('[BackgroundJobScheduler] Scheduling job: ${job.type} (${job.id})');

    // Store job
    _jobs[job.id] = job;
    await _persistJobs();

    // Schedule with WorkManager
    if (job.repeatInterval != null) {
      // Periodic job
      await Workmanager().registerPeriodicTask(
        job.id,
        job.type,
        frequency: job.repeatInterval!,
        initialDelay: job.scheduledFor != null
            ? job.scheduledFor!.difference(DateTime.now())
            : Duration.zero,
        constraints: _convertConstraints(job.constraints),
        inputData: {
          'jobId': job.id,
          'params': job.params,
          'priority': job.priority.index,
        },
      );
    } else {
      // One-time job
      await Workmanager().registerOneOffTask(
        job.id,
        job.type,
        initialDelay: job.scheduledFor != null
            ? job.scheduledFor!.difference(DateTime.now())
            : Duration.zero,
        constraints: _convertConstraints(job.constraints),
        inputData: {
          'jobId': job.id,
          'params': job.params,
          'priority': job.priority.index,
        },
      );
    }

    notifyListeners();
  }

  /// Cancel a job
  Future<void> cancelJob(String jobId) async {
    _ensureInitialized();

    debugPrint('[BackgroundJobScheduler] Cancelling job: $jobId');

    await Workmanager().cancelByUniqueName(jobId);
    _jobs.remove(jobId);
    await _persistJobs();

    notifyListeners();
  }

  /// Cancel all jobs
  Future<void> cancelAllJobs() async {
    _ensureInitialized();

    debugPrint('[BackgroundJobScheduler] Cancelling all jobs');

    await Workmanager().cancelAll();
    _jobs.clear();
    await _persistJobs();

    notifyListeners();
  }

  /// Get pending jobs
  List<BackgroundJob> getPendingJobs() {
    return _jobs.values.toList()
      ..sort((a, b) {
        // Sort by priority then scheduled time
        final priorityCompare = b.priority.index.compareTo(a.priority.index);
        if (priorityCompare != 0) return priorityCompare;

        if (a.scheduledFor == null && b.scheduledFor == null) return 0;
        if (a.scheduledFor == null) return 1;
        if (b.scheduledFor == null) return -1;
        return a.scheduledFor!.compareTo(b.scheduledFor!);
      });
  }

  /// Get job by ID
  BackgroundJob? getJob(String jobId) {
    return _jobs[jobId];
  }

  /// Check if job can execute now
  Future<bool> canExecuteNow(BackgroundJob job) async {
    // Check battery level
    if (job.constraints.minBatteryLevel > 0) {
      final batteryLevel = await _battery.batteryLevel;
      if (batteryLevel < job.constraints.minBatteryLevel) {
        debugPrint('[BackgroundJobScheduler] Battery too low: $batteryLevel%');
        return false;
      }
    }

    // Check charging
    if (job.constraints.requiresCharging) {
      final batteryState = await _battery.batteryState;
      if (batteryState != BatteryState.charging && batteryState != BatteryState.full) {
        debugPrint('[BackgroundJobScheduler] Not charging');
        return false;
      }
    }

    // Network and WiFi checks would be done by WorkManager constraints

    return true;
  }

  /// Record job execution
  Future<void> recordExecution(String jobId, JobResult result) async {
    final job = _jobs[jobId];
    if (job == null) return;

    final updatedJob = job.copyWith(
      executionCount: job.executionCount + 1,
      lastExecutedAt: DateTime.now(),
      lastError: result.error,
    );

    _jobs[jobId] = updatedJob;
    await _persistJobs();

    debugPrint(
      '[BackgroundJobScheduler] Job executed: $jobId (success: ${result.success}, count: ${updatedJob.executionCount})',
    );

    // Handle retry logic
    if (!result.success && result.shouldRetry) {
      if (updatedJob.executionCount < updatedJob.maxRetries) {
        final retryDelay = result.retryAfter ??
            Duration(seconds: updatedJob.retryBackoff.inSeconds * updatedJob.executionCount);

        debugPrint('[BackgroundJobScheduler] Scheduling retry in ${retryDelay.inSeconds}s');

        await scheduleJob(updatedJob.copyWith(
          scheduledFor: DateTime.now().add(retryDelay),
        ));
      } else {
        debugPrint('[BackgroundJobScheduler] Max retries reached for job: $jobId');
      }
    }

    notifyListeners();
  }

  /// Convert constraints to WorkManager format
  Constraints _convertConstraints(JobConstraints constraints) {
    return Constraints(
      networkType: constraints.requiresWiFi
          ? NetworkType.unmetered
          : constraints.requiresNetwork
              ? NetworkType.connected
              : NetworkType.notRequired,
      requiresCharging: constraints.requiresCharging,
      requiresDeviceIdle: constraints.requiresIdle,
      requiresBatteryNotLow: constraints.minBatteryLevel > 20,
    );
  }

  /// Load persisted jobs from storage
  Future<void> _loadPersistedJobs() async {
    // TODO: Load from secure storage
    debugPrint('[BackgroundJobScheduler] Loading persisted jobs');
  }

  /// Persist jobs to storage
  Future<void> _persistJobs() async {
    // TODO: Save to secure storage
    debugPrint('[BackgroundJobScheduler] Persisting ${_jobs.length} jobs');
  }

  /// Get statistics
  JobSchedulerStats getStats() {
    final pending = _jobs.values.where((j) => j.lastExecutedAt == null).length;
    final executed = _jobs.values.where((j) => j.lastExecutedAt != null).length;
    final failed = _jobs.values.where((j) => j.lastError != null).length;

    return JobSchedulerStats(
      totalJobs: _jobs.length,
      pendingJobs: pending,
      executedJobs: executed,
      failedJobs: failed,
      jobsByType: _groupJobsByType(),
    );
  }

  Map<String, int> _groupJobsByType() {
    final byType = <String, int>{};
    for (final job in _jobs.values) {
      byType[job.type] = (byType[job.type] ?? 0) + 1;
    }
    return byType;
  }

  void _ensureInitialized() {
    if (!_initialized) {
      throw Exception('BackgroundJobScheduler not initialized. Call initialize() first.');
    }
  }
}

/// Job scheduler statistics
class JobSchedulerStats {
  final int totalJobs;
  final int pendingJobs;
  final int executedJobs;
  final int failedJobs;
  final Map<String, int> jobsByType;

  JobSchedulerStats({
    required this.totalJobs,
    required this.pendingJobs,
    required this.executedJobs,
    required this.failedJobs,
    required this.jobsByType,
  });
}

/// Callback dispatcher for WorkManager
@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    debugPrint('[BackgroundJob] Executing task: $task');

    try {
      // Get job details
      final jobId = inputData?['jobId'] as String?;
      final params = inputData?['params'] as Map<String, dynamic>? ?? {};

      // Execute job based on type
      final result = await _executeJobByType(task, params);

      // Record execution
      if (jobId != null) {
        await BackgroundJobScheduler().recordExecution(jobId, result);
      }

      return result.success;
    } catch (e) {
      debugPrint('[BackgroundJob] Error executing task: $e');
      return false;
    }
  });
}

/// Execute job by type
Future<JobResult> _executeJobByType(String type, Map<String, dynamic> params) async {
  debugPrint('[BackgroundJob] Executing $type with params: $params');

  try {
    switch (type) {
      case 'sync':
        // Execute sync operation
        // await OfflineSyncEngine().syncAll();
        return JobResult.success();

      case 'upload_file':
        // Execute file upload
        return JobResult.success();

      case 'process_analytics':
        // Process analytics
        return JobResult.success();

      case 'send_notification':
        // Send notification
        return JobResult.success();

      case 'cache_cleanup':
        // Cleanup cache
        return JobResult.success();

      case 'cleanup':
        // Cleanup old jobs
        return JobResult.success();

      default:
        return JobResult.failure(error: 'Unknown job type: $type', shouldRetry: false);
    }
  } catch (e) {
    return JobResult.failure(error: e.toString());
  }
}
