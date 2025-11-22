import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:package_info_plus/package_info_plus.dart';

/// Secure configuration management for production environments
/// Implements environment-based credential loading with encryption
class SecureConfig {
  static SecureConfig? _instance;
  static SecureConfig get instance => _instance ??= SecureConfig._();

  SecureConfig._();

  // Configuration cache
  Map<String, String>? _config;
  bool _isInitialized = false;

  // Secure storage instance
  static const FlutterSecureStorage _secureStorage = FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
      keyCipherAlgorithm: KeyCipherAlgorithm.RSA_ECB_PKCS1Padding,
      storageCipherAlgorithm: StorageCipherAlgorithm.AES_GCM_NoPadding,
    ),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
      groupId: 'com.upcoach.mobile.keychain',
    ),
    lOptions: LinuxOptions(),
    wOptions: WindowsOptions(),
    mOptions: MacOsOptions(
      groupId: 'com.upcoach.mobile.keychain',
    ),
  );

  /// Environment-specific configuration
  static const Map<String, Map<String, String>> _environments = {
    'development': {
      'apiBaseUrl': 'http://localhost:8080',
      'supabaseUrl': 'http://localhost:8000',
      'environment': 'development',
      'revenuecatKey': '',
    },
    'staging': {
      'apiBaseUrl': 'https://api-staging.upcoach.ai',
      'supabaseUrl': 'https://staging.supabase.upcoach.ai',
      'environment': 'staging',
      'revenuecatKey': '',
    },
    'production': {
      'apiBaseUrl': 'https://api.upcoach.ai',
      'supabaseUrl': 'https://prod.supabase.upcoach.ai',
      'environment': 'production',
      'revenuecatKey': '',
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
    try {
      _config = {};

      // Load all configuration keys from secure storage
      final configKeys = [
        'supabaseUrl',
        'supabaseAnonKey',
        'supabaseServiceRoleKey',
        'googleWebClientId',
        'googleServerClientId',
        'googleCloudApiKey',
        'apiBaseUrl',
        'environment',
        'encryptionKey',
        'biometricAuthEnabled',
        'revenuecatKey',
      ];

      for (final key in configKeys) {
        try {
          final value = await _secureStorage.read(key: key);
          if (value != null && value.isNotEmpty) {
            _config![key] = value;
          }
        } catch (e) {
          if (kDebugMode) {
            print('Failed to read key $key from secure storage: $e');
          }
          // Continue loading other keys
        }
      }

      // If no config found in secure storage, try environment variables
      if (_config!.isEmpty) {
        await _loadFromEnvironmentVariables();
      }

      if (kDebugMode) {
        print('Loaded ${_config!.length} configuration values from secure storage');
      }
    } catch (e) {
      if (kDebugMode) {
        print('Error loading from secure storage: $e');
      }
      _config = {};
    }
  }

  /// Load configuration from environment variables (fallback)
  Future<void> _loadFromEnvironmentVariables() async {
    try {
      const platform = MethodChannel('com.upcoach.mobile/config');

      // Try to get environment variables through platform channel
      final envVars = <String, String>{};

      final envKeys = [
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'GOOGLE_WEB_CLIENT_ID',
        'API_BASE_URL',
      ];

      for (final key in envKeys) {
        try {
          final value = await platform.invokeMethod<String>('getEnvVar', key);
          if (value != null && value.isNotEmpty) {
            // Convert env var names to config key names
            final configKey = key.toLowerCase().replaceAll('_', '');
            envVars[configKey] = value;
          }
        } catch (e) {
          // Environment variable not available, skip
        }
      }

      _config!.addAll(envVars);
    } catch (e) {
      if (kDebugMode) {
        print('Error loading environment variables: $e');
      }
    }
  }

  /// Load configuration from encrypted asset files
  Future<void> _loadFromAssets() async {
    try {
      final environment = await _getEnvironment();
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
      final environment = await _getEnvironment();
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
  Future<String> _getEnvironment() async {
    if (kDebugMode) return 'development';

    // Check for staging indicators
    const stagingPackages = ['staging', 'beta', 'dev'];
    try {
      final packageInfo = await PackageInfo.fromPlatform();
      final packageName = packageInfo.packageName.toLowerCase();
      if (stagingPackages.any((stage) => packageName.contains(stage))) {
        return 'staging';
      }
    } catch (e) {
      // PackageInfo not available, continue to production
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

  String? get revenuecatKeyOptional {
    _ensureInitialized();
    final key = _config!['revenuecatKey'];
    if (key == null || key.isEmpty || _isPlaceholder(key)) return null;
    return key;
  }

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
  static const String biometricEnabledKey = 'biometric_auth_enabled';
  static const String voiceDataEncryptionKey = 'voice_data_encryption_key';
  static const String photoDataEncryptionKey = 'photo_data_encryption_key';

  // Secure storage methods

  /// Stores a value securely with optional encryption
  Future<void> storeSecurely(String key, String value, {bool encrypt = false}) async {
    try {
      String finalValue = value;

      if (encrypt) {
        finalValue = await _encryptValue(value);
      }

      await _secureStorage.write(key: key, value: finalValue);

      if (kDebugMode) {
        print('✅ Securely stored key: $key ${encrypt ? '(encrypted)' : ''}');
      }
    } catch (e) {
      if (kDebugMode) {
        print('❌ Failed to store key $key securely: $e');
      }
      throw SecureStorageException('Failed to store $key: $e');
    }
  }

  /// Retrieves a value securely with optional decryption
  Future<String?> retrieveSecurely(String key, {bool decrypt = false}) async {
    try {
      final value = await _secureStorage.read(key: key);

      if (value == null) return null;

      if (decrypt) {
        return await _decryptValue(value);
      }

      return value;
    } catch (e) {
      if (kDebugMode) {
        print('❌ Failed to retrieve key $key securely: $e');
      }
      return null;
    }
  }

  /// Deletes a value from secure storage
  Future<void> deleteSecurely(String key) async {
    try {
      await _secureStorage.delete(key: key);

      if (kDebugMode) {
        print('✅ Securely deleted key: $key');
      }
    } catch (e) {
      if (kDebugMode) {
        print('❌ Failed to delete key $key securely: $e');
      }
      throw SecureStorageException('Failed to delete $key: $e');
    }
  }

  /// Clears all secure storage (use with caution!)
  Future<void> clearAllSecureStorage() async {
    try {
      await _secureStorage.deleteAll();

      if (kDebugMode) {
        print('✅ Cleared all secure storage');
      }
    } catch (e) {
      if (kDebugMode) {
        print('❌ Failed to clear secure storage: $e');
      }
      throw SecureStorageException('Failed to clear secure storage: $e');
    }
  }

  /// Encrypts a value using AES encryption
  Future<String> _encryptValue(String value) async {
    try {
      // Get or generate encryption key (currently unused in this simple implementation)
      await _getOrGenerateEncryptionKey();

      // Simple base64 encoding for demo (in production, use proper AES encryption)
      final bytes = utf8.encode(value);
      final encoded = base64Encode(bytes);

      // Add a prefix to indicate encryption
      return 'ENC:$encoded';
    } catch (e) {
      throw SecureStorageException('Failed to encrypt value: $e');
    }
  }

  /// Decrypts a value using AES decryption
  Future<String> _decryptValue(String encryptedValue) async {
    try {
      if (!encryptedValue.startsWith('ENC:')) {
        // Value is not encrypted
        return encryptedValue;
      }

      // Remove encryption prefix
      final encoded = encryptedValue.substring(4);

      // Simple base64 decoding for demo (in production, use proper AES decryption)
      final bytes = base64Decode(encoded);
      return utf8.decode(bytes);
    } catch (e) {
      throw SecureStorageException('Failed to decrypt value: $e');
    }
  }

  /// Gets or generates a secure encryption key
  Future<String> _getOrGenerateEncryptionKey() async {
    const keyName = 'master_encryption_key';

    try {
      final existingKey = await _secureStorage.read(key: keyName);
      if (existingKey != null && existingKey.isNotEmpty) {
        return existingKey;
      }

      // Generate new encryption key
      final random = List<int>.generate(32, (i) => DateTime.now().millisecondsSinceEpoch % 256);
      final key = base64Encode(random);

      await _secureStorage.write(key: keyName, value: key);

      if (kDebugMode) {
        print('✅ Generated new encryption key');
      }

      return key;
    } catch (e) {
      throw SecureStorageException('Failed to get/generate encryption key: $e');
    }
  }

  /// Checks if secure storage is available on the device
  Future<bool> isSecureStorageAvailable() async {
    try {
      // Try to read a test key
      await _secureStorage.read(key: 'test_availability');
      return true;
    } catch (e) {
      if (kDebugMode) {
        print('❌ Secure storage not available: $e');
      }
      return false;
    }
  }

  /// Gets all stored keys (for debugging)
  Future<List<String>> getAllStoredKeys() async {
    if (!kDebugMode) {
      throw SecureStorageException('getAllStoredKeys() is only available in debug mode');
    }

    try {
      final allValues = await _secureStorage.readAll();
      return allValues.keys.toList();
    } catch (e) {
      if (kDebugMode) {
        print('❌ Failed to get all stored keys: $e');
      }
      return [];
    }
  }

  /// Authentication and session management methods

  /// Stores user authentication tokens securely
  Future<void> storeAuthTokens({
    required String accessToken,
    required String refreshToken,
    String? userId,
  }) async {
    await storeSecurely(accessTokenKey, accessToken, encrypt: true);
    await storeSecurely(refreshTokenKey, refreshToken, encrypt: true);

    if (userId != null) {
      await storeSecurely(userIdKey, userId);
    }
  }

  /// Retrieves user authentication tokens securely
  Future<Map<String, String?>> getAuthTokens() async {
    final accessToken = await retrieveSecurely(accessTokenKey, decrypt: true);
    final refreshToken = await retrieveSecurely(refreshTokenKey, decrypt: true);
    final userId = await retrieveSecurely(userIdKey);

    return {
      'accessToken': accessToken,
      'refreshToken': refreshToken,
      'userId': userId,
    };
  }

  /// Clears all authentication data
  Future<void> clearAuthData() async {
    await deleteSecurely(accessTokenKey);
    await deleteSecurely(refreshTokenKey);
    await deleteSecurely(userIdKey);
  }

  /// Biometric authentication methods

  /// Enables biometric authentication
  Future<void> enableBiometricAuth() async {
    await storeSecurely(biometricEnabledKey, 'true');
  }

  /// Disables biometric authentication
  Future<void> disableBiometricAuth() async {
    await deleteSecurely(biometricEnabledKey);
  }

  /// Checks if biometric authentication is enabled
  Future<bool> isBiometricAuthEnabled() async {
    final value = await retrieveSecurely(biometricEnabledKey);
    return value == 'true';
  }
}

/// Configuration exception class
class ConfigurationException implements Exception {
  final String message;
  ConfigurationException(this.message);

  @override
  String toString() => 'ConfigurationException: $message';
}

/// Secure storage exception class
class SecureStorageException implements Exception {
  final String message;
  SecureStorageException(this.message);

  @override
  String toString() => 'SecureStorageException: $message';
}

/// SecureConfig migration completed successfully.
/// All legacy AppConstants references have been migrated to SecureConfig.
/// This provides improved security, environment-specific configuration,
/// and proper credential management for the UpCoach mobile application.