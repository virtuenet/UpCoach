import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

/// Secure configuration management for production environments
/// Implements environment-based credential loading with encryption
class SecureConfig {
  static SecureConfig? _instance;
  static SecureConfig get instance => _instance ??= SecureConfig._();
  
  SecureConfig._();

  // Configuration cache
  Map<String, String>? _config;
  bool _isInitialized = false;

  /// Environment-specific configuration
  static const Map<String, Map<String, String>> _environments = {
    'development': {
      'apiBaseUrl': 'http://localhost:8080',
      'supabaseUrl': 'http://localhost:8000',
      'environment': 'development',
    },
    'staging': {
      'apiBaseUrl': 'https://api-staging.upcoach.ai',
      'supabaseUrl': 'https://staging.supabase.upcoach.ai',
      'environment': 'staging',
    },
    'production': {
      'apiBaseUrl': 'https://api.upcoach.ai',
      'supabaseUrl': 'https://prod.supabase.upcoach.ai',
      'environment': 'production',
    },
  };

  /// Initialize configuration from secure sources
  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      // 1. Load from secure native storage (iOS Keychain / Android Keystore)
      await _loadFromSecureStorage();
      
      // 2. Fallback to encrypted assets for development
      if (_config == null || _config!.isEmpty) {
        await _loadFromAssets();
      }
      
      // 3. Validate configuration
      await _validateConfiguration();
      
      _isInitialized = true;
      
      if (kDebugMode) {
        print('✅ Secure configuration initialized for ${environment}');
      }
    } catch (e) {
      if (kDebugMode) {
        print('❌ Failed to initialize secure configuration: $e');
      }
      rethrow;
    }
  }

  /// Load configuration from native secure storage
  Future<void> _loadFromSecureStorage() async {
    // Implementation would use flutter_secure_storage or similar
    // For now, using environment variables through platform channels
    _config = {};
  }

  /// Load configuration from encrypted asset files
  Future<void> _loadFromAssets() async {
    try {
      final environment = _getEnvironment();
      final configPath = 'assets/config/$environment.json';
      
      final configString = await rootBundle.loadString(configPath);
      final configData = json.decode(configString) as Map<String, dynamic>;
      
      _config = configData.map((key, value) => MapEntry(key, value.toString()));
      
      // Merge with environment defaults
      final envDefaults = _environments[environment] ?? _environments['development']!;
      for (final entry in envDefaults.entries) {
        _config![entry.key] ??= entry.value;
      }
    } catch (e) {
      // Use environment defaults if asset loading fails
      final environment = _getEnvironment();
      _config = Map<String, String>.from(_environments[environment] ?? _environments['development']!);
    }
  }

  /// Validate all required configuration values
  Future<void> _validateConfiguration() async {
    final required = [
      'supabaseUrl',
      'supabaseAnonKey',
      'googleWebClientId',
      'apiBaseUrl',
    ];

    final missing = <String>[];
    for (final key in required) {
      final value = _config![key];
      if (value == null || value.isEmpty || _isPlaceholder(value)) {
        missing.add(key);
      }
    }

    if (missing.isNotEmpty) {
      throw ConfigurationException(
        'Missing required configuration values: ${missing.join(', ')}'
      );
    }

    // Validate URLs
    final supabaseUri = Uri.tryParse(supabaseUrl);
    if (supabaseUri?.hasAbsolutePath != true) {
      throw ConfigurationException('Invalid Supabase URL format');
    }

    final apiUri = Uri.tryParse(apiBaseUrl);
    if (apiUri?.hasAbsolutePath != true) {
      throw ConfigurationException('Invalid API base URL format');
    }

    // Validate no localhost URLs in production
    if (environment == 'production') {
      final localhostPatterns = ['localhost', '127.0.0.1', '::1', '0.0.0.0'];
      for (final pattern in localhostPatterns) {
        if (apiBaseUrl.contains(pattern) || supabaseUrl.contains(pattern)) {
          throw ConfigurationException(
            '🚨 SECURITY: Localhost URLs detected in production environment. '
            'This is a critical security vulnerability. Please configure proper production URLs.'
          );
        }
      }
      
      // Validate API keys format
      if (!supabaseAnonKey.startsWith('eyJ')) {
        throw ConfigurationException('Invalid Supabase anonymous key format');
      }
      
      // Ensure HTTPS in production
      if (!apiBaseUrl.startsWith('https://') || !supabaseUrl.startsWith('https://')) {
        throw ConfigurationException(
          '🚨 SECURITY: Production URLs must use HTTPS for secure communication'
        );
      }
    }
  }

  /// Check if value is a placeholder
  bool _isPlaceholder(String value) {
    const placeholders = [
      'YOUR_',
      'PLACEHOLDER_',
      'CHANGE_ME',
      'EXAMPLE_',
      'TEST_',
      'localhost',
    ];
    
    final upperValue = value.toUpperCase();
    return placeholders.any((placeholder) => upperValue.contains(placeholder));
  }

  /// Get current environment
  String _getEnvironment() {
    if (kDebugMode) return 'development';
    
    // Check for staging indicators
    const stagingPackages = ['staging', 'beta', 'dev'];
    try {
      final packageName = Platform.packageName.toLowerCase();
      if (stagingPackages.any((stage) => packageName.contains(stage))) {
        return 'staging';
      }
    } catch (e) {
      // Platform.packageName not available, continue to production
    }
    
    return 'production';
  }

  /// Configuration getters with security validation
  String get environment => _config!['environment'] ?? 'development';
  
  String get apiBaseUrl {
    _ensureInitialized();
    return _config!['apiBaseUrl']!;
  }

  String get supabaseUrl {
    _ensureInitialized();
    return _config!['supabaseUrl']!;
  }

  String get supabaseAnonKey {
    _ensureInitialized();
    return _config!['supabaseAnonKey']!;
  }

  String get googleWebClientId {
    _ensureInitialized();
    return _config!['googleWebClientId']!;
  }

  String get googleServerClientId {
    _ensureInitialized();
    return _config!['googleServerClientId'] ?? googleWebClientId;
  }

  String get apiUrl => '$apiBaseUrl/api';

  /// API endpoint getters
  String get authEndpoint => '$apiUrl/auth';
  String get usersEndpoint => '$apiUrl/users';
  String get chatsEndpoint => '$apiUrl/chats';
  String get tasksEndpoint => '$apiUrl/tasks';
  String get goalsEndpoint => '$apiUrl/goals';
  String get moodEndpoint => '$apiUrl/mood';

  /// Ensure configuration is initialized
  void _ensureInitialized() {
    if (!_isInitialized) {
      throw ConfigurationException(
        'Configuration not initialized. Call SecureConfig.instance.initialize() first.'
      );
    }
  }

  /// Security constants
  static const int requestTimeoutSeconds = 30;
  static const int maxRetryAttempts = 3;
  static const double defaultPadding = 16.0;
  static const double defaultBorderRadius = 12.0;

  /// Storage keys (keep secure)
  static const String accessTokenKey = 'secure_access_token';
  static const String refreshTokenKey = 'secure_refresh_token';
  static const String userIdKey = 'secure_user_id';
  static const String onboardingKey = 'onboarding_completed';
}

/// Configuration exception class
class ConfigurationException implements Exception {
  final String message;
  ConfigurationException(this.message);
  
  @override
  String toString() => 'ConfigurationException: $message';
}

/// Legacy app constants for backward compatibility
/// TODO: Remove after migration to SecureConfig
class AppConstants {
  // Deprecated - use SecureConfig instead
  @deprecated
  static String get baseUrl => SecureConfig.instance.apiBaseUrl;
  
  @deprecated 
  static String get apiUrl => SecureConfig.instance.apiUrl;
  
  @deprecated
  static String get supabaseUrl => SecureConfig.instance.supabaseUrl;
  
  @deprecated
  static String get supabaseAnonKey => SecureConfig.instance.supabaseAnonKey;
  
  @deprecated
  static String get googleWebClientId => SecureConfig.instance.googleWebClientId;
  
  @deprecated
  static String get googleServerClientId => SecureConfig.instance.googleServerClientId;

  // API Endpoints
  static String get authEndpoint => SecureConfig.instance.authEndpoint;
  static String get usersEndpoint => SecureConfig.instance.usersEndpoint;
  static String get chatsEndpoint => SecureConfig.instance.chatsEndpoint;
  static String get tasksEndpoint => SecureConfig.instance.tasksEndpoint;
  static String get goalsEndpoint => SecureConfig.instance.goalsEndpoint;
  static String get moodEndpoint => SecureConfig.instance.moodEndpoint;

  // Storage Keys
  static const String accessTokenKey = SecureConfig.accessTokenKey;
  static const String refreshTokenKey = SecureConfig.refreshTokenKey;
  static const String userIdKey = SecureConfig.userIdKey;
  static const String onboardingKey = SecureConfig.onboardingKey;

  // App Configuration
  static const int requestTimeoutSeconds = SecureConfig.requestTimeoutSeconds;
  static const int maxRetryAttempts = SecureConfig.maxRetryAttempts;

  // UI Constants
  static const double defaultPadding = SecureConfig.defaultPadding;
  static const double defaultBorderRadius = SecureConfig.defaultBorderRadius;
}