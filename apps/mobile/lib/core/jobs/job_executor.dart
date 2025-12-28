import 'dart:async';
import 'package:flutter/foundation.dart';
import 'background_job_scheduler.dart';

/// Job handler function type
typedef JobHandler = Future<JobResult> Function(Map<String, dynamic> params);

/// Execute background jobs with timeout and error handling
class JobExecutor extends ChangeNotifier {
  static final JobExecutor _instance = JobExecutor._internal();
  factory JobExecutor() => _instance;
  JobExecutor._internal();

  // Job handlers registry
  final Map<String, JobHandler> _handlers = {};
  
  // Execution tracking
  final Map<String, JobExecution> _executions = {};
  
  // Timeout configuration
  static const Duration defaultTimeout = Duration(seconds: 30);
  static const int maxConcurrentJobs = 3;
  
  int _runningJobs = 0;

  /// Initialize executor
  void initialize() {
    debugPrint('[JobExecutor] Initializing...');
    _registerDefaultHandlers();
    debugPrint('[JobExecutor] Registered ${_handlers.length} job handlers');
  }

  /// Register a job handler
  void registerHandler(String jobType, JobHandler handler) {
    _handlers[jobType] = handler;
    debugPrint('[JobExecutor] Registered handler: $jobType');
  }

  /// Execute a job
  Future<JobResult> executeJob(
    String jobId,
    String jobType,
    Map<String, dynamic> params, {
    Duration? timeout,
  }) async {
    if (!_handlers.containsKey(jobType)) {
      return JobResult.failure(
        error: 'No handler registered for job type: $jobType',
        shouldRetry: false,
      );
    }

    // Check concurrency limit
    if (_runningJobs >= maxConcurrentJobs) {
      return JobResult.failure(
        error: 'Max concurrent jobs reached',
        shouldRetry: true,
        retryAfter: const Duration(seconds: 10),
      );
    }

    _runningJobs++;

    final execution = JobExecution(
      jobId: jobId,
      jobType: jobType,
      startedAt: DateTime.now(),
    );
    _executions[jobId] = execution;
    notifyListeners();

    try {
      final handler = _handlers[jobType]!;
      final timeoutDuration = timeout ?? defaultTimeout;

      debugPrint('[JobExecutor] Executing $jobType (timeout: ${timeoutDuration.inSeconds}s)');

      final result = await handler(params).timeout(
        timeoutDuration,
        onTimeout: () {
          return JobResult.failure(
            error: 'Job timed out after ${timeoutDuration.inSeconds}s',
            shouldRetry: true,
          );
        },
      );

      execution.completedAt = DateTime.now();
      execution.success = result.success;
      execution.error = result.error;

      debugPrint(
        '[JobExecutor] Job completed: $jobType (success: ${result.success}, duration: ${execution.duration?.inSeconds}s)',
      );

      return result;
    } catch (e) {
      execution.completedAt = DateTime.now();
      execution.success = false;
      execution.error = e.toString();

      debugPrint('[JobExecutor] Job failed: $jobType - $e');

      return JobResult.failure(error: e.toString());
    } finally {
      _runningJobs--;
      notifyListeners();
    }
  }

  /// Register default job handlers
  void _registerDefaultHandlers() {
    registerHandler('sync', _handleSync);
    registerHandler('upload_file', _handleUpload);
    registerHandler('process_analytics', _handleAnalytics);
    registerHandler('send_notification', _handleNotification);
    registerHandler('cache_cleanup', _handleCleanup);
  }

  /// Handle sync job
  Future<JobResult> _handleSync(Map<String, dynamic> params) async {
    debugPrint('[JobExecutor] Handling sync job');
    // TODO: Call actual sync service
    await Future.delayed(const Duration(seconds: 2));
    return JobResult.success(data: {'synced': true});
  }

  /// Handle file upload job
  Future<JobResult> _handleUpload(Map<String, dynamic> params) async {
    final fileId = params['fileId'] as String?;
    debugPrint('[JobExecutor] Handling file upload: $fileId');
    // TODO: Call actual upload service
    await Future.delayed(const Duration(seconds: 5));
    return JobResult.success(data: {'uploaded': true, 'fileId': fileId});
  }

  /// Handle analytics processing job
  Future<JobResult> _handleAnalytics(Map<String, dynamic> params) async {
    debugPrint('[JobExecutor] Handling analytics processing');
    // TODO: Call actual analytics service
    await Future.delayed(const Duration(seconds: 1));
    return JobResult.success(data: {'processed': true});
  }

  /// Handle notification job
  Future<JobResult> _handleNotification(Map<String, dynamic> params) async {
    final notificationId = params['notificationId'] as String?;
    debugPrint('[JobExecutor] Handling notification: $notificationId');
    // TODO: Call actual notification service
    await Future.delayed(const Duration(milliseconds: 500));
    return JobResult.success(data: {'sent': true});
  }

  /// Handle cache cleanup job
  Future<JobResult> _handleCleanup(Map<String, dynamic> params) async {
    debugPrint('[JobExecutor] Handling cache cleanup');
    // TODO: Call actual cleanup service
    await Future.delayed(const Duration(seconds: 3));
    return JobResult.success(data: {'cleaned': true});
  }

  /// Get execution history
  List<JobExecution> getExecutionHistory({int? limit}) {
    final executions = _executions.values.toList()
      ..sort((a, b) => b.startedAt.compareTo(a.startedAt));
    
    if (limit != null && limit < executions.length) {
      return executions.sublist(0, limit);
    }
    
    return executions;
  }

  /// Get running jobs count
  int get runningJobsCount => _runningJobs;

  /// Get stats
  ExecutorStats getStats() {
    final completed = _executions.values.where((e) => e.completedAt != null).length;
    final successful = _executions.values.where((e) => e.success == true).length;
    final failed = _executions.values.where((e) => e.success == false).length;

    return ExecutorStats(
      totalExecutions: _executions.length,
      completedExecutions: completed,
      successfulExecutions: successful,
      failedExecutions: failed,
      runningJobs: _runningJobs,
    );
  }
}

/// Job execution record
class JobExecution {
  final String jobId;
  final String jobType;
  final DateTime startedAt;
  DateTime? completedAt;
  bool? success;
  String? error;
  dynamic result;

  JobExecution({
    required this.jobId,
    required this.jobType,
    required this.startedAt,
    this.completedAt,
    this.success,
    this.error,
    this.result,
  });

  Duration? get duration {
    if (completedAt == null) return null;
    return completedAt!.difference(startedAt);
  }

  bool get isCompleted => completedAt != null;
  bool get isRunning => completedAt == null;
}

/// Executor statistics
class ExecutorStats {
  final int totalExecutions;
  final int completedExecutions;
  final int successfulExecutions;
  final int failedExecutions;
  final int runningJobs;

  ExecutorStats({
    required this.totalExecutions,
    required this.completedExecutions,
    required this.successfulExecutions,
    required this.failedExecutions,
    required this.runningJobs,
  });

  double get successRate {
    if (completedExecutions == 0) return 0;
    return (successfulExecutions / completedExecutions) * 100;
  }
}
