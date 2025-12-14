import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'core/theme/app_theme.dart';
import 'core/router/app_router.dart';
import 'core/providers/locale_provider.dart';
import 'core/services/offline_service.dart';
import 'core/services/sync_service.dart';
import 'core/services/sync_integration_service.dart';
import 'core/services/supabase_service.dart';
import 'core/services/notification_router_service.dart';
import 'core/services/push_notification_handler.dart';
import 'core/services/background_sync_handler.dart';
import 'core/services/deep_link_service.dart';
import 'core/services/toast_service.dart';
import 'core/performance/performance_monitor.dart';
import 'core/performance/performance_overlay.dart' as app_overlay;
import 'core/performance/firebase_performance_service.dart';
import 'core/analytics/analytics_service.dart';
import 'core/analytics/analytics_dashboard.dart';
import 'core/errors/error_boundary.dart';
import 'core/accessibility/accessibility_wrapper.dart';
import 'shared/widgets/loading_overlay.dart';
import 'l10n/app_localizations.dart';
import 'features/health/health.dart';

/// Background message handler - must be top-level function
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint('📬 Background message: ${message.messageId}');

  // Handle silent sync in background
  if (message.data['type'] == 'silentSync') {
    final syncHandler = BackgroundSyncHandler();
    await syncHandler.handleSilentSync(message.data);
  }
}

void main() async {
  // Mark app start time for performance tracking
  FirebasePerformanceService().markAppStart();

  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase first (log and continue if unavailable so UI can still load)
  final firebaseReady = await _initFirebaseSafe();

  // Initialize error handling (catches all errors after this point)
  ErrorHandler().initialize();

  // Initialize analytics/performance only if Firebase is ready
  if (firebaseReady) {
    await AnalyticsService().initialize();
    await FirebasePerformanceService().initialize();
    AnalyticsDashboardService().initialize();

    // Set up background message handler
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  }

  // Initialize unified push notification handler only if Firebase is ready
  final pushHandler = PushNotificationHandler();
  if (firebaseReady) {
    await pushHandler.initialize();
  } else {
    debugPrint('⚠️ Firebase not initialized; skipping push handler init');
  }

  // Initialize background sync handler
  final syncHandler = BackgroundSyncHandler();

  // Listen for silent sync events
  pushHandler.notificationEvents.listen((event) {
    if (event.type == NotificationEventType.silentSync) {
      syncHandler.handleSilentSync(event.data);
    }
  });

  // Initialize deep link service
  await DeepLinkService().initialize();

  // Initialize offline capabilities
  await OfflineService().initialize();
  await SyncService().initialize();
  await SyncIntegrationService().initialize();
  await SupabaseService.initialize();

  // Initialize health service
  await HealthService().initialize();

  // Process any pending sync requests from when app was closed
  await syncHandler.processPendingSyncs();

  // Initialize performance monitoring in debug mode
  if (kDebugMode) {
    PerformanceMonitor().startMonitoring();
  }

  // Mark first frame for startup performance tracking
  WidgetsBinding.instance.addPostFrameCallback((_) {
    FirebasePerformanceService().markFirstFrame();
  });

  // Run app with zone-based error handling for comprehensive crash reporting
  runZonedGuarded(
    () {
      runApp(ProviderScope(
        overrides: [
          pushNotificationHandlerProvider.overrideWithValue(pushHandler),
          backgroundSyncHandlerProvider.overrideWithValue(syncHandler),
        ],
        child: const UpCoachApp(),
      ));
    },
    (error, stackTrace) {
      ErrorHandler().recordError(
        error,
        stackTrace: stackTrace,
        context: 'Zoned Error',
        fatal: true,
      );
    },
  );
}

Future<bool> _initFirebaseSafe() async {
  try {
    await Firebase.initializeApp();
    return true;
  } catch (e, st) {
    debugPrint('⚠️ Firebase.initializeApp failed: $e\n$st');
    return false;
  }
}

class UpCoachApp extends ConsumerStatefulWidget {
  const UpCoachApp({super.key});

  @override
  ConsumerState<UpCoachApp> createState() => _UpCoachAppState();
}

class _UpCoachAppState extends ConsumerState<UpCoachApp> {
  final _scaffoldMessengerKey = GlobalKey<ScaffoldMessengerState>();

  @override
  void initState() {
    super.initState();
    // Set the messenger key for toast notifications
    ToastService().setMessengerKey(_scaffoldMessengerKey);

    // Mark push notification handler as ready and track performance after first frame
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(pushNotificationHandlerProvider).setAppReady();

      // Mark home screen as ready for performance tracking
      FirebasePerformanceService().markHomeScreenReady();

      // Start session in analytics dashboard
      AnalyticsDashboardService().recordScreenVisit('home');
    });
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(appRouterProvider);
    final localeState = ref.watch(localeProvider);

    // Set router for notification navigation
    NotificationRouterService().setRouter(router);

    // Set router for deep link navigation
    DeepLinkService().setRouter(router);

    return app_overlay.PerformanceOverlay(
      enabled: kDebugMode,
      child: MaterialApp.router(
        title: 'UpCoach',
        scaffoldMessengerKey: _scaffoldMessengerKey,
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.system,
        routerConfig: router,
        debugShowCheckedModeBanner: false,
        // Localization configuration
        locale: localeState.locale,
        supportedLocales: SupportedLocales.all,
        localizationsDelegates: const [
          AppLocalizations.delegate,
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        builder: (context, child) {
          // Wrap with Directionality for RTL support and Accessibility
          return Directionality(
            textDirection: localeState.textDirection,
            child: AccessibilityWrapper(
              child: LoadingOverlay(
                child: child ?? const SizedBox.shrink(),
              ),
            ),
          );
        },
      ),
    );
  }
}
