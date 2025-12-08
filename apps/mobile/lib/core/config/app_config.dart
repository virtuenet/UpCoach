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
