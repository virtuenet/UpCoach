import 'package:flutter/foundation.dart';

/// Application environment types
enum AppEnvironment {
  development,
  staging,
  production,
}

/// Application configuration based on environment
class AppConfig {
  final AppEnvironment environment;
  final String appName;
  final String apiBaseUrl;
  final String llmServerUrl;
  final String websocketUrl;
  final bool enableLogging;
  final bool enableCrashlytics;
  final bool enableAnalytics;
  final bool enablePerformanceMonitoring;
  final Duration apiTimeout;
  final String sentryDsn;
  final String stripePublishableKey;
  final String agoraAppId;
  final String revenueCatApiKey;
  // Health Integration OAuth credentials
  final String technogymClientId;
  final String technogymClientSecret;
  final String fitbitClientId;
  final String fitbitClientSecret;
  final String garminConsumerKey;
  final String garminConsumerSecret;
  final String whoopClientId;
  final String whoopClientSecret;
  final String ouraClientId;
  final String ouraClientSecret;

  const AppConfig({
    required this.environment,
    required this.appName,
    required this.apiBaseUrl,
    required this.llmServerUrl,
    required this.websocketUrl,
    this.enableLogging = false,
    this.enableCrashlytics = false,
    this.enableAnalytics = false,
    this.enablePerformanceMonitoring = false,
    this.apiTimeout = const Duration(seconds: 30),
    this.sentryDsn = '',
    this.stripePublishableKey = '',
    this.agoraAppId = '',
    this.revenueCatApiKey = '',
    // Health integrations - set via --dart-define or environment
    this.technogymClientId = const String.fromEnvironment('TECHNOGYM_CLIENT_ID'),
    this.technogymClientSecret = const String.fromEnvironment('TECHNOGYM_CLIENT_SECRET'),
    this.fitbitClientId = const String.fromEnvironment('FITBIT_CLIENT_ID'),
    this.fitbitClientSecret = const String.fromEnvironment('FITBIT_CLIENT_SECRET'),
    this.garminConsumerKey = const String.fromEnvironment('GARMIN_CONSUMER_KEY'),
    this.garminConsumerSecret = const String.fromEnvironment('GARMIN_CONSUMER_SECRET'),
    this.whoopClientId = const String.fromEnvironment('WHOOP_CLIENT_ID'),
    this.whoopClientSecret = const String.fromEnvironment('WHOOP_CLIENT_SECRET'),
    this.ouraClientId = const String.fromEnvironment('OURA_CLIENT_ID'),
    this.ouraClientSecret = const String.fromEnvironment('OURA_CLIENT_SECRET'),
  });

  /// Development configuration
  static const development = AppConfig(
    environment: AppEnvironment.development,
    appName: 'UpCoach Dev',
    apiBaseUrl: 'http://localhost:3000/api/v1',
    llmServerUrl: 'http://localhost:3100',
    websocketUrl: 'ws://localhost:3000',
    enableLogging: true,
    enableCrashlytics: false,
    enableAnalytics: false,
    enablePerformanceMonitoring: false,
    apiTimeout: Duration(seconds: 60),
    sentryDsn: '',
    stripePublishableKey: 'pk_test_...',
    agoraAppId: '',
    revenueCatApiKey: '',
  );

  /// Staging configuration
  static const staging = AppConfig(
    environment: AppEnvironment.staging,
    appName: 'UpCoach Staging',
    apiBaseUrl: 'https://staging-api.upcoach.com/api/v1',
    llmServerUrl: 'https://staging-llm.upcoach.com',
    websocketUrl: 'wss://staging-api.upcoach.com',
    enableLogging: true,
    enableCrashlytics: true,
    enableAnalytics: true,
    enablePerformanceMonitoring: true,
    apiTimeout: Duration(seconds: 30),
    sentryDsn: 'https://staging@sentry.io/upcoach',
    stripePublishableKey: 'pk_test_...',
    agoraAppId: '',
    revenueCatApiKey: '',
  );

  /// Production configuration
  static const production = AppConfig(
    environment: AppEnvironment.production,
    appName: 'UpCoach',
    apiBaseUrl: 'https://api.upcoach.com/api/v1',
    llmServerUrl: 'https://llm.upcoach.com',
    websocketUrl: 'wss://api.upcoach.com',
    enableLogging: false,
    enableCrashlytics: true,
    enableAnalytics: true,
    enablePerformanceMonitoring: true,
    apiTimeout: Duration(seconds: 30),
    sentryDsn: 'https://production@sentry.io/upcoach',
    stripePublishableKey: 'pk_live_...',
    agoraAppId: '',
    revenueCatApiKey: '',
  );

  /// Get configuration based on environment
  static AppConfig fromEnvironment(String env) {
    switch (env.toLowerCase()) {
      case 'development':
      case 'dev':
        return development;
      case 'staging':
      case 'stg':
        return staging;
      case 'production':
      case 'prod':
        return production;
      default:
        // Default to production in release mode, development otherwise
        return kReleaseMode ? production : development;
    }
  }

  /// Check if this is a production environment
  bool get isProduction => environment == AppEnvironment.production;

  /// Check if this is a development environment
  bool get isDevelopment => environment == AppEnvironment.development;

  /// Check if this is a staging environment
  bool get isStaging => environment == AppEnvironment.staging;

  @override
  String toString() {
    return 'AppConfig(environment: $environment, appName: $appName, apiBaseUrl: $apiBaseUrl)';
  }
}

/// Global app configuration instance
/// Set this in main.dart based on build flavor
late AppConfig appConfig;

/// Initialize app configuration
void initializeAppConfig(String environment) {
  appConfig = AppConfig.fromEnvironment(environment);
  if (appConfig.enableLogging) {
    debugPrint('[AppConfig] Initialized: $appConfig');
  }
}
