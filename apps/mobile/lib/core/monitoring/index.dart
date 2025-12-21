/// Mobile Monitoring Module
///
/// Comprehensive monitoring for the UpCoach mobile app including
/// application performance monitoring, crash reporting, network monitoring,
/// and performance tracking.
library;

export 'app_monitoring_service.dart';
export 'crash_reporter.dart';
export 'network_monitor.dart';
export 'performance_tracker.dart';

import 'app_monitoring_service.dart';
import 'crash_reporter.dart';
import 'network_monitor.dart';
import 'performance_tracker.dart';

/// Initialize all monitoring services
Future<void> initializeMonitoring() async {
  await CrashReporter().initialize();
  await AppMonitoringService().initialize();
  NetworkMonitor().initialize();
  PerformanceTracker().initialize();
}

/// Dispose all monitoring services
void disposeMonitoring() {
  PerformanceTracker().dispose();
  NetworkMonitor().dispose();
  AppMonitoringService().dispose();
}
