import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'core/theme/app_theme.dart';
import 'core/router/app_router.dart';
import 'core/services/offline_service.dart';
import 'core/services/sync_service.dart';
import 'core/services/sync_integration_service.dart';
import 'core/services/supabase_service.dart';
import 'core/performance/performance_monitor.dart';
import 'core/performance/performance_overlay.dart' as app_overlay;
import 'services/firebase_service.dart';
import 'shared/widgets/loading_overlay.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase first
  await Firebase.initializeApp();

  // Initialize Firebase services (notifications, analytics, crashlytics)
  await FirebaseService().initialize();

  // Initialize offline capabilities
  await OfflineService().initialize();
  await SyncService().initialize();
  await SyncIntegrationService().initialize();
  await SupabaseService.initialize();

  // Initialize performance monitoring in debug mode
  if (kDebugMode) {
    PerformanceMonitor().startMonitoring();
  }

  runApp(const ProviderScope(child: UpCoachApp()));
}

class UpCoachApp extends ConsumerWidget {
  const UpCoachApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);

    return app_overlay.PerformanceOverlay(
      enabled: kDebugMode,
      child: MaterialApp.router(
        title: 'UpCoach',
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.system,
        routerConfig: router,
        debugShowCheckedModeBanner: false,
        builder: (context, child) {
          return LoadingOverlay(
            child: child ?? const SizedBox.shrink(),
          );
        },
      ),
    );
  }
} 