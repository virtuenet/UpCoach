import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

/// Brand configuration
class BrandConfig {
  final String appName;
  final String companyName;
  final Color primaryColor;
  final Color secondaryColor;
  final Color accentColor;
  final String logoPath;
  final String? splashLogoPath;
  final Map<String, dynamic> customTheme;
  final Map<String, bool> featureFlags;

  const BrandConfig({
    required this.appName,
    required this.companyName,
    required this.primaryColor,
    required this.secondaryColor,
    required this.accentColor,
    required this.logoPath,
    this.splashLogoPath,
    this.customTheme = const {},
    this.featureFlags = const {},
  });

  Map<String, dynamic> toJson() => {
        'appName': appName,
        'companyName': companyName,
        'primaryColor': primaryColor.value,
        'secondaryColor': secondaryColor.value,
        'accentColor': accentColor.value,
        'logoPath': logoPath,
        'splashLogoPath': splashLogoPath,
        'customTheme': customTheme,
        'featureFlags': featureFlags,
      };

  factory BrandConfig.fromJson(Map<String, dynamic> json) => BrandConfig(
        appName: json['appName'],
        companyName: json['companyName'],
        primaryColor: Color(json['primaryColor']),
        secondaryColor: Color(json['secondaryColor']),
        accentColor: Color(json['accentColor']),
        logoPath: json['logoPath'],
        splashLogoPath: json['splashLogoPath'],
        customTheme: json['customTheme'] ?? {},
        featureFlags: Map<String, bool>.from(json['featureFlags'] ?? {}),
      );
}

/// Asset management
class BrandAsset {
  final String key;
  final String path;
  final AssetType type;

  const BrandAsset({
    required this.key,
    required this.path,
    required this.type,
  });
}

enum AssetType { image, font, icon, splash }

/// White-label app builder service
class WhiteLabelAppBuilder extends ChangeNotifier {
  static const String _configKey = 'whitelabel_config';
  static const String _assetsKey = 'whitelabel_assets';

  final SharedPreferences _prefs;
  BrandConfig? _currentConfig;
  Map<String, BrandAsset> _assets = {};
  bool _isLoaded = false;

  WhiteLabelAppBuilder({required SharedPreferences prefs}) : _prefs = prefs {
    loadConfiguration();
  }

  BrandConfig? get currentConfig => _currentConfig;
  bool get isLoaded => _isLoaded;
  Map<String, BrandAsset> get assets => _assets;

  // ============================================================================
  // Configuration Management
  // ============================================================================

  /// Load brand configuration
  Future<void> loadConfiguration() async {
    try {
      final configJson = _prefs.getString(_configKey);
      if (configJson != null) {
        final config = BrandConfig.fromJson(jsonDecode(configJson));
        _currentConfig = config;
      }

      final assetsJson = _prefs.getString(_assetsKey);
      if (assetsJson != null) {
        // Load assets
      }

      _isLoaded = true;
      notifyListeners();
    } catch (e) {
      debugPrint('Error loading white-label config: $e');
    }
  }

  /// Save brand configuration
  Future<void> saveConfiguration(BrandConfig config) async {
    try {
      await _prefs.setString(_configKey, jsonEncode(config.toJson()));
      _currentConfig = config;
      notifyListeners();
    } catch (e) {
      debugPrint('Error saving white-label config: $e');
    }
  }

  /// Hot reload configuration
  Future<void> reloadConfiguration() async {
    await loadConfiguration();
  }

  // ============================================================================
  // Theme Customization
  // ============================================================================

  /// Build themed app
  ThemeData buildTheme({Brightness brightness = Brightness.light}) {
    if (_currentConfig == null) {
      return brightness == Brightness.light ? ThemeData.light() : ThemeData.dark();
    }

    final config = _currentConfig!;

    return ThemeData(
      brightness: brightness,
      primaryColor: config.primaryColor,
      colorScheme: ColorScheme.fromSeed(
        seedColor: config.primaryColor,
        secondary: config.secondaryColor,
        brightness: brightness,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: config.primaryColor,
        foregroundColor: Colors.white,
        elevation: 2,
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: config.accentColor,
      ),
      cardTheme: CardTheme(
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      inputDecorationTheme: InputDecorationTheme(
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: config.primaryColor, width: 2),
        ),
      ),
    );
  }

  /// Get branded color scheme
  ColorScheme getColorScheme() {
    if (_currentConfig == null) {
      return ColorScheme.light();
    }

    return ColorScheme.fromSeed(
      seedColor: _currentConfig!.primaryColor,
      secondary: _currentConfig!.secondaryColor,
    );
  }

  // ============================================================================
  // Asset Management
  // ============================================================================

  /// Register brand asset
  void registerAsset(BrandAsset asset) {
    _assets[asset.key] = asset;
    notifyListeners();
  }

  /// Get asset path
  String? getAssetPath(String key) {
    return _assets[key]?.path;
  }

  /// Load logo widget
  Widget getLogo({double? width, double? height}) {
    final logoPath = _currentConfig?.logoPath;
    if (logoPath == null) {
      return const Placeholder();
    }

    return Image.asset(
      logoPath,
      width: width,
      height: height,
    );
  }

  // ============================================================================
  // Feature Flags
  // ============================================================================

  /// Check feature flag
  bool isFeatureEnabled(String featureKey) {
    return _currentConfig?.featureFlags[featureKey] ?? false;
  }

  /// Update feature flag
  Future<void> updateFeatureFlag(String key, bool enabled) async {
    if (_currentConfig == null) return;

    final updatedFlags = Map<String, bool>.from(_currentConfig!.featureFlags);
    updatedFlags[key] = enabled;

    final updatedConfig = BrandConfig(
      appName: _currentConfig!.appName,
      companyName: _currentConfig!.companyName,
      primaryColor: _currentConfig!.primaryColor,
      secondaryColor: _currentConfig!.secondaryColor,
      accentColor: _currentConfig!.accentColor,
      logoPath: _currentConfig!.logoPath,
      splashLogoPath: _currentConfig!.splashLogoPath,
      customTheme: _currentConfig!.customTheme,
      featureFlags: updatedFlags,
    );

    await saveConfiguration(updatedConfig);
  }

  // ============================================================================
  // App Information
  // ============================================================================

  String getAppName() => _currentConfig?.appName ?? 'UpCoach';
  String getCompanyName() => _currentConfig?.companyName ?? 'UpCoach Inc.';

  /// Update app title
  Future<void> updateAppTitle() async {
    if (_currentConfig != null) {
      await SystemChrome.setApplicationSwitcherDescription(
        ApplicationSwitcherDescription(
          label: _currentConfig!.appName,
          primaryColor: _currentConfig!.primaryColor.value,
        ),
      );
    }
  }

  // ============================================================================
  // Configuration Validation
  // ============================================================================

  bool validateConfiguration(BrandConfig config) {
    if (config.appName.isEmpty || config.companyName.isEmpty) {
      return false;
    }

    if (config.logoPath.isEmpty) {
      return false;
    }

    return true;
  }

  // ============================================================================
  // Remote Configuration
  // ============================================================================

  /// Fetch configuration from remote
  Future<void> fetchRemoteConfiguration(String configUrl) async {
    try {
      // In production, implement actual HTTP request
      debugPrint('Fetching remote configuration from: $configUrl');

      // Parse and save configuration
      // final config = BrandConfig.fromJson(response);
      // await saveConfiguration(config);
    } catch (e) {
      debugPrint('Error fetching remote configuration: $e');
    }
  }

  /// Reset to default configuration
  Future<void> resetToDefault() async {
    await _prefs.remove(_configKey);
    await _prefs.remove(_assetsKey);
    _currentConfig = null;
    _assets = {};
    notifyListeners();
  }
}
