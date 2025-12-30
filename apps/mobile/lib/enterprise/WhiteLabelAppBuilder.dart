import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

/// Brand configuration
class BrandConfig {
  final String organizationId;
  final String appName;
  final String logoUrl;
  final String iconUrl;
  final ColorScheme colorScheme;
  final Typography? typography;
  final Map<String, String>? customAssets;
  final Map<String, dynamic>? features;
  final Map<String, String>? translations;

  const BrandConfig({
    required this.organizationId,
    required this.appName,
    required this.logoUrl,
    required this.iconUrl,
    required this.colorScheme,
    this.typography,
    this.customAssets,
    this.features,
    this.translations,
  });

  factory BrandConfig.fromJson(Map<String, dynamic> json) {
    return BrandConfig(
      organizationId: json['organizationId'] as String,
      appName: json['appName'] as String,
      logoUrl: json['logoUrl'] as String,
      iconUrl: json['iconUrl'] as String,
      colorScheme: _parseColorScheme(json['colorScheme']),
      typography: json['typography'] != null ? _parseTypography(json['typography']) : null,
      customAssets: json['customAssets'] != null
          ? Map<String, String>.from(json['customAssets'])
          : null,
      features: json['features'] != null
          ? Map<String, dynamic>.from(json['features'])
          : null,
      translations: json['translations'] != null
          ? Map<String, String>.from(json['translations'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'organizationId': organizationId,
      'appName': appName,
      'logoUrl': logoUrl,
      'iconUrl': iconUrl,
      'colorScheme': _colorSchemeToJson(colorScheme),
      'typography': typography != null ? _typographyToJson(typography!) : null,
      'customAssets': customAssets,
      'features': features,
      'translations': translations,
    };
  }

  static ColorScheme _parseColorScheme(dynamic json) {
    if (json is! Map) return const ColorScheme.light();
    
    return ColorScheme(
      brightness: json['brightness'] == 'dark' ? Brightness.dark : Brightness.light,
      primary: Color(int.parse(json['primary'] as String, radix: 16)),
      onPrimary: Color(int.parse(json['onPrimary'] as String, radix: 16)),
      secondary: Color(int.parse(json['secondary'] as String, radix: 16)),
      onSecondary: Color(int.parse(json['onSecondary'] as String, radix: 16)),
      error: Color(int.parse(json['error'] as String, radix: 16)),
      onError: Color(int.parse(json['onError'] as String, radix: 16)),
      surface: Color(int.parse(json['surface'] as String, radix: 16)),
      onSurface: Color(int.parse(json['onSurface'] as String, radix: 16)),
    );
  }

  static Map<String, dynamic> _colorSchemeToJson(ColorScheme scheme) {
    return {
      'brightness': scheme.brightness == Brightness.dark ? 'dark' : 'light',
      'primary': scheme.primary.value.toRadixString(16),
      'onPrimary': scheme.onPrimary.value.toRadixString(16),
      'secondary': scheme.secondary.value.toRadixString(16),
      'onSecondary': scheme.onSecondary.value.toRadixString(16),
      'error': scheme.error.value.toRadixString(16),
      'onError': scheme.onError.value.toRadixString(16),
      'surface': scheme.surface.value.toRadixString(16),
      'onSurface': scheme.onSurface.value.toRadixString(16),
    };
  }

  static Typography _parseTypography(dynamic json) {
    // Simplified typography parsing
    return Typography.material2021();
  }

  static Map<String, dynamic> _typographyToJson(Typography typography) {
    return {'type': 'material2021'};
  }
}

/// Tenant configuration for multi-tenancy
class TenantConfig {
  final String tenantId;
  final String name;
  final BrandConfig brandConfig;
  final Map<String, dynamic> settings;
  final bool isActive;

  const TenantConfig({
    required this.tenantId,
    required this.name,
    required this.brandConfig,
    required this.settings,
    this.isActive = true,
  });

  factory TenantConfig.fromJson(Map<String, dynamic> json) {
    return TenantConfig(
      tenantId: json['tenantId'] as String,
      name: json['name'] as String,
      brandConfig: BrandConfig.fromJson(json['brandConfig']),
      settings: Map<String, dynamic>.from(json['settings']),
      isActive: json['isActive'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'tenantId': tenantId,
      'name': name,
      'brandConfig': brandConfig.toJson(),
      'settings': settings,
      'isActive': isActive,
    };
  }
}

/// Service for building white-labeled applications
class WhiteLabelAppBuilder extends ChangeNotifier {
  static const String _configKey = 'white_label_config';
  static const String _tenantKey = 'current_tenant';
  
  final SharedPreferences _prefs;
  
  BrandConfig? _currentBrand;
  TenantConfig? _currentTenant;
  ThemeData? _cachedTheme;
  bool _initialized = false;

  WhiteLabelAppBuilder({
    required SharedPreferences prefs,
  }) : _prefs = prefs;

  // ============================================================================
  // Initialization
  // ============================================================================

  Future<void> initialize() async {
    if (_initialized) return;

    try {
      await _loadConfiguration();
      _initialized = true;
    } catch (e) {
      debugPrint('Error initializing white label: $e');
    }
  }

  Future<void> _loadConfiguration() async {
    final configJson = _prefs.getString(_configKey);
    final tenantJson = _prefs.getString(_tenantKey);

    if (configJson != null) {
      final config = jsonDecode(configJson);
      _currentBrand = BrandConfig.fromJson(config);
    }

    if (tenantJson != null) {
      final tenant = jsonDecode(tenantJson);
      _currentTenant = TenantConfig.fromJson(tenant);
      _currentBrand = _currentTenant!.brandConfig;
    }

    if (_currentBrand != null) {
      _buildTheme();
    }
  }

  // ============================================================================
  // Configuration Management
  // ============================================================================

  Future<void> setBrandConfig(BrandConfig config) async {
    _currentBrand = config;
    await _prefs.setString(_configKey, jsonEncode(config.toJson()));
    _buildTheme();
    notifyListeners();
  }

  Future<void> setTenantConfig(TenantConfig config) async {
    _currentTenant = config;
    _currentBrand = config.brandConfig;
    await _prefs.setString(_tenantKey, jsonEncode(config.toJson()));
    _buildTheme();
    notifyListeners();
  }

  BrandConfig? get currentBrand => _currentBrand;
  TenantConfig? get currentTenant => _currentTenant;

  // ============================================================================
  // Theme Building
  // ============================================================================

  void _buildTheme() {
    if (_currentBrand == null) return;

    final brand = _currentBrand!;
    final colorScheme = brand.colorScheme;

    _cachedTheme = ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      typography: brand.typography,
      appBarTheme: AppBarTheme(
        backgroundColor: colorScheme.primary,
        foregroundColor: colorScheme.onPrimary,
        elevation: 0,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: colorScheme.primary,
          foregroundColor: colorScheme.onPrimary,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: colorScheme.primary, width: 2),
        ),
      ),
    );
  }

  ThemeData? getTheme() => _cachedTheme;

  ThemeData getThemeOrDefault() {
    return _cachedTheme ?? ThemeData.light();
  }

  // ============================================================================
  // Dynamic Asset Management
  // ============================================================================

  Future<void> loadAssets() async {
    if (_currentBrand == null) return;

    // Load logo
    if (_currentBrand!.logoUrl.isNotEmpty) {
      await _preloadImage(_currentBrand!.logoUrl);
    }

    // Load icon
    if (_currentBrand!.iconUrl.isNotEmpty) {
      await _preloadImage(_currentBrand!.iconUrl);
    }

    // Load custom assets
    final customAssets = _currentBrand!.customAssets;
    if (customAssets != null) {
      for (final assetUrl in customAssets.values) {
        await _preloadImage(assetUrl);
      }
    }
  }

  Future<void> _preloadImage(String url) async {
    try {
      // In production, implement proper image caching
      debugPrint('Preloading image: $url');
    } catch (e) {
      debugPrint('Error preloading image: $e');
    }
  }

  Widget getLogo({double? width, double? height}) {
    if (_currentBrand?.logoUrl == null) {
      return const Placeholder(fallbackWidth: 100, fallbackHeight: 100);
    }

    return Image.network(
      _currentBrand!.logoUrl,
      width: width,
      height: height,
      errorBuilder: (context, error, stackTrace) {
        return const Icon(Icons.business, size: 100);
      },
    );
  }

  Widget getIcon({double? size}) {
    if (_currentBrand?.iconUrl == null) {
      return Icon(Icons.apps, size: size);
    }

    return Image.network(
      _currentBrand!.iconUrl,
      width: size,
      height: size,
      errorBuilder: (context, error, stackTrace) {
        return Icon(Icons.apps, size: size);
      },
    );
  }

  // ============================================================================
  // Feature Flags
  // ============================================================================

  bool isFeatureEnabled(String featureName) {
    final features = _currentBrand?.features;
    if (features == null) return true;

    return features[featureName] as bool? ?? true;
  }

  dynamic getFeatureConfig(String featureName) {
    final features = _currentBrand?.features;
    return features?[featureName];
  }

  // ============================================================================
  // Localization
  // ============================================================================

  String translate(String key, {String? defaultValue}) {
    final translations = _currentBrand?.translations;
    if (translations == null) return defaultValue ?? key;

    return translations[key] ?? defaultValue ?? key;
  }

  // ============================================================================
  // Build-time Customization
  // ============================================================================

  Future<void> generateBuildConfig() async {
    if (_currentBrand == null) return;

    final config = {
      'APP_NAME': _currentBrand!.appName,
      'ORGANIZATION_ID': _currentBrand!.organizationId,
      'PRIMARY_COLOR': _currentBrand!.colorScheme.primary.value.toRadixString(16),
    };

    // Write to build configuration file
    await _writeBuildConfig(config);
  }

  Future<void> _writeBuildConfig(Map<String, dynamic> config) async {
    try {
      // In production, write to appropriate config files
      debugPrint('Build config: $config');
    } catch (e) {
      debugPrint('Error writing build config: $e');
    }
  }

  // ============================================================================
  // App Information
  // ============================================================================

  String getAppName() {
    return _currentBrand?.appName ?? 'UpCoach';
  }

  String getOrganizationId() {
    return _currentBrand?.organizationId ?? 'default';
  }

  // ============================================================================
  // Reset
  // ============================================================================

  Future<void> reset() async {
    _currentBrand = null;
    _currentTenant = null;
    _cachedTheme = null;
    
    await _prefs.remove(_configKey);
    await _prefs.remove(_tenantKey);
    
    notifyListeners();
  }

  // ============================================================================
  // Validation
  // ============================================================================

  bool validateConfig(BrandConfig config) {
    if (config.organizationId.isEmpty) return false;
    if (config.appName.isEmpty) return false;
    if (config.logoUrl.isEmpty) return false;
    
    return true;
  }
}

/// Widget for applying white label theme
class WhiteLabelTheme extends StatelessWidget {
  final Widget child;
  final WhiteLabelAppBuilder builder;

  const WhiteLabelTheme({
    super.key,
    required this.child,
    required this.builder,
  });

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: builder.getThemeOrDefault(),
      child: child,
    );
  }
}
