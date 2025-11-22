import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'core/theme/app_theme.dart';
import 'core/router/app_router.dart';
import 'core/services/offline_service.dart';
import 'core/services/sync_service.dart';
import 'core/services/realtime_service.dart';
import 'core/services/language_service.dart';
import 'shared/widgets/loading_overlay.dart';
import 'core/config/secure_config.dart';
import 'package:purchases_flutter/purchases_flutter.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize shared preferences
  final sharedPreferences = await SharedPreferences.getInstance();

  // Initialize offline capabilities
  await OfflineService().initialize();
  await SyncService().initialize();
  // Initialize realtime and subscribe to a baseline channel
  await RealTimeService().initialize();
  await RealTimeService().subscribeToDashboardUpdates();

  // Initialize secure config and RevenueCat (if key provided)
  await SecureConfig.instance.initialize();
  final rcKey = SecureConfig.instance.revenuecatKeyOptional;
  if (rcKey != null && rcKey.isNotEmpty) {
    await Purchases.configure(PurchasesConfiguration(rcKey));
    assert(() {
      Purchases.setLogLevel(LogLevel.debug);
      return true;
    }());
  }

  runApp(
    ProviderScope(
      overrides: [
        // Initialize language service with shared preferences
        languageServiceProvider.overrideWithValue(
          LanguageService(sharedPreferences),
        ),
        // Initialize locale provider
        localeProvider.overrideWith((ref) {
          final service = ref.watch(languageServiceProvider);
          return LanguageNotifier(service, const Locale('en'));
        }),
      ],
      child: const UpCoachApp(),
    ),
  );
}

class UpCoachApp extends ConsumerWidget {
  const UpCoachApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);
    final locale = ref.watch(localeProvider);

    return MaterialApp.router(
      title: 'UpCoach',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      locale: locale,
      // Add supported locales based on LanguageService.supportedLanguages
      supportedLocales: LanguageService.supportedLanguages
          .map((lang) => Locale(lang.code))
          .toList(),
      routerConfig: router,
      debugShowCheckedModeBanner: false,
      builder: (context, child) {
        return LoadingOverlay(
          child: child ?? const SizedBox.shrink(),
        );
      },
    );
  }
} 