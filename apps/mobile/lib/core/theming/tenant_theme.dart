import 'package:flutter/material.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

part 'tenant_theme.freezed.dart';
part 'tenant_theme.g.dart';

/// Tenant Theme Configuration
///
/// Allows enterprise customers to customize the mobile app appearance:
/// - Brand colors (primary, secondary, accent)
/// - Typography (font family, sizes)
/// - Logo and assets
/// - Component styles
///
/// Features:
/// - Dynamic theme switching
/// - Light/dark mode support
/// - Custom font loading
/// - Asset caching

@freezed
class TenantThemeConfig with _$TenantThemeConfig {
  const factory TenantThemeConfig({
    required String tenantId,
    required String themeName,
    required TenantBrandColors colors,
    required TenantTypography typography,
    required TenantAssets assets,
    @Default(false) bool isDarkMode,
    DateTime? updatedAt,
  }) = _TenantThemeConfig;

  factory TenantThemeConfig.fromJson(Map<String, dynamic> json) =>
      _$TenantThemeConfigFromJson(json);
}

@freezed
class TenantBrandColors with _$TenantBrandColors {
  const factory TenantBrandColors({
    required String primaryColor,
    required String secondaryColor,
    required String accentColor,
    String? backgroundColor,
    String? surfaceColor,
    String? errorColor,
    String? successColor,
    String? warningColor,
    String? infoColor,
    String? textPrimaryColor,
    String? textSecondaryColor,
  }) = _TenantBrandColors;

  factory TenantBrandColors.fromJson(Map<String, dynamic> json) =>
      _$TenantBrandColorsFromJson(json);
}

@freezed
class TenantTypography with _$TenantTypography {
  const factory TenantTypography({
    @Default('Roboto') String fontFamily,
    String? headingFontFamily,
    @Default(14.0) double baseFontSize,
    @Default(1.5) double lineHeight,
    @Default(0.0) double letterSpacing,
  }) = _TenantTypography;

  factory TenantTypography.fromJson(Map<String, dynamic> json) =>
      _$TenantTypographyFromJson(json);
}

@freezed
class TenantAssets with _$TenantAssets {
  const factory TenantAssets({
    String? logoUrl,
    String? faviconUrl,
    String? backgroundImageUrl,
    String? splashScreenUrl,
  }) = _TenantAssets;

  factory TenantAssets.fromJson(Map<String, dynamic> json) =>
      _$TenantAssetsFromJson(json);
}

/// Tenant Theme Service
///
/// Manages theme configuration fetching and caching
class TenantThemeService {
  final Ref ref;

  TenantThemeService(this.ref);

  /// Fetch theme configuration from API
  Future<TenantThemeConfig> fetchThemeConfig(String tenantId) async {
    try {
      // TODO: Replace with actual API call
      final response = await _mockApiCall(tenantId);

      return TenantThemeConfig.fromJson(response);
    } catch (e) {
      // Fall back to default theme
      return _getDefaultTheme(tenantId);
    }
  }

  /// Mock API call (replace with actual HTTP request)
  Future<Map<String, dynamic>> _mockApiCall(String tenantId) async {
    await Future.delayed(const Duration(milliseconds: 500));

    return {
      'tenantId': tenantId,
      'themeName': 'Default Theme',
      'colors': {
        'primaryColor': '#4F46E5',
        'secondaryColor': '#10B981',
        'accentColor': '#F59E0B',
        'backgroundColor': '#FFFFFF',
        'surfaceColor': '#F9FAFB',
        'errorColor': '#EF4444',
        'successColor': '#10B981',
        'warningColor': '#F59E0B',
        'infoColor': '#3B82F6',
        'textPrimaryColor': '#111827',
        'textSecondaryColor': '#6B7280',
      },
      'typography': {
        'fontFamily': 'Roboto',
        'headingFontFamily': 'Roboto',
        'baseFontSize': 14.0,
        'lineHeight': 1.5,
        'letterSpacing': 0.0,
      },
      'assets': {
        'logoUrl': null,
        'faviconUrl': null,
        'backgroundImageUrl': null,
        'splashScreenUrl': null,
      },
      'isDarkMode': false,
      'updatedAt': DateTime.now().toIso8601String(),
    };
  }

  /// Get default theme configuration
  TenantThemeConfig _getDefaultTheme(String tenantId) {
    return TenantThemeConfig(
      tenantId: tenantId,
      themeName: 'Default Theme',
      colors: const TenantBrandColors(
        primaryColor: '#4F46E5',
        secondaryColor: '#10B981',
        accentColor: '#F59E0B',
        backgroundColor: '#FFFFFF',
        surfaceColor: '#F9FAFB',
        errorColor: '#EF4444',
        successColor: '#10B981',
        warningColor: '#F59E0B',
        infoColor: '#3B82F6',
        textPrimaryColor: '#111827',
        textSecondaryColor: '#6B7280',
      ),
      typography: const TenantTypography(
        fontFamily: 'Roboto',
        headingFontFamily: 'Roboto',
        baseFontSize: 14.0,
        lineHeight: 1.5,
        letterSpacing: 0.0,
      ),
      assets: const TenantAssets(),
      isDarkMode: false,
    );
  }
}

/// Convert tenant theme config to Flutter ThemeData
class TenantThemeBuilder {
  static ThemeData buildTheme(TenantThemeConfig config) {
    final colors = config.colors;
    final typography = config.typography;

    // Parse colors from hex strings
    final primaryColor = _parseColor(colors.primaryColor);
    final secondaryColor = _parseColor(colors.secondaryColor);
    final accentColor = _parseColor(colors.accentColor);
    final backgroundColor = _parseColor(colors.backgroundColor ?? '#FFFFFF');
    final surfaceColor = _parseColor(colors.surfaceColor ?? '#F9FAFB');
    final errorColor = _parseColor(colors.errorColor ?? '#EF4444');
    final successColor = _parseColor(colors.successColor ?? '#10B981');

    // Create color scheme
    final colorScheme = ColorScheme.light(
      primary: primaryColor,
      secondary: secondaryColor,
      surface: surfaceColor,
      error: errorColor,
      onPrimary: Colors.white,
      onSecondary: Colors.white,
      onSurface: _parseColor(colors.textPrimaryColor ?? '#111827'),
      onError: Colors.white,
    );

    // Create text theme
    final textTheme = _buildTextTheme(typography, colors);

    // Create theme data
    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: backgroundColor,
      textTheme: textTheme,
      fontFamily: typography.fontFamily,

      // AppBar theme
      appBarTheme: AppBarTheme(
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: textTheme.titleLarge?.copyWith(
          color: Colors.white,
          fontWeight: FontWeight.w600,
        ),
      ),

      // Button themes
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: textTheme.labelLarge,
        ),
      ),

      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primaryColor,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          side: BorderSide(color: primaryColor, width: 1.5),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: textTheme.labelLarge,
        ),
      ),

      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primaryColor,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          textStyle: textTheme.labelLarge,
        ),
      ),

      // Card theme
      cardTheme: CardTheme(
        color: surfaceColor,
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      ),

      // Input decoration theme
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceColor,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: primaryColor, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: errorColor, width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        labelStyle: textTheme.bodyMedium,
        hintStyle: textTheme.bodyMedium?.copyWith(
          color: _parseColor(colors.textSecondaryColor ?? '#6B7280'),
        ),
      ),

      // Floating Action Button theme
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: accentColor,
        foregroundColor: Colors.white,
        elevation: 4,
        shape: const CircleBorder(),
      ),

      // Bottom Navigation Bar theme
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: surfaceColor,
        selectedItemColor: primaryColor,
        unselectedItemColor: Colors.grey.shade600,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
        selectedLabelStyle: textTheme.labelSmall?.copyWith(
          fontWeight: FontWeight.w600,
        ),
        unselectedLabelStyle: textTheme.labelSmall,
      ),

      // Chip theme
      chipTheme: ChipThemeData(
        backgroundColor: surfaceColor,
        selectedColor: primaryColor.withOpacity(0.2),
        labelStyle: textTheme.bodySmall,
        secondaryLabelStyle: textTheme.bodySmall,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),

      // Progress indicator theme
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: primaryColor,
        linearTrackColor: primaryColor.withOpacity(0.2),
        circularTrackColor: primaryColor.withOpacity(0.2),
      ),

      // Switch theme
      switchTheme: SwitchThemeData(
        thumbColor: MaterialStateProperty.resolveWith((states) {
          if (states.contains(MaterialState.selected)) {
            return primaryColor;
          }
          return Colors.grey.shade400;
        }),
        trackColor: MaterialStateProperty.resolveWith((states) {
          if (states.contains(MaterialState.selected)) {
            return primaryColor.withOpacity(0.5);
          }
          return Colors.grey.shade300;
        }),
      ),

      // Snackbar theme
      snackBarTheme: SnackBarThemeData(
        backgroundColor: Colors.grey.shade900,
        contentTextStyle: textTheme.bodyMedium?.copyWith(color: Colors.white),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    );
  }

  /// Build text theme from typography config
  static TextTheme _buildTextTheme(
    TenantTypography typography,
    TenantBrandColors colors,
  ) {
    final baseSize = typography.baseFontSize;
    final fontFamily = typography.fontFamily;
    final headingFamily = typography.headingFontFamily ?? fontFamily;
    final textColor = _parseColor(colors.textPrimaryColor ?? '#111827');
    final secondaryTextColor = _parseColor(colors.textSecondaryColor ?? '#6B7280');

    return TextTheme(
      displayLarge: TextStyle(
        fontFamily: headingFamily,
        fontSize: baseSize * 3.5,
        fontWeight: FontWeight.bold,
        color: textColor,
        height: typography.lineHeight,
        letterSpacing: typography.letterSpacing,
      ),
      displayMedium: TextStyle(
        fontFamily: headingFamily,
        fontSize: baseSize * 2.8,
        fontWeight: FontWeight.bold,
        color: textColor,
        height: typography.lineHeight,
        letterSpacing: typography.letterSpacing,
      ),
      displaySmall: TextStyle(
        fontFamily: headingFamily,
        fontSize: baseSize * 2.2,
        fontWeight: FontWeight.bold,
        color: textColor,
        height: typography.lineHeight,
        letterSpacing: typography.letterSpacing,
      ),
      headlineLarge: TextStyle(
        fontFamily: headingFamily,
        fontSize: baseSize * 2.0,
        fontWeight: FontWeight.w600,
        color: textColor,
        height: typography.lineHeight,
      ),
      headlineMedium: TextStyle(
        fontFamily: headingFamily,
        fontSize: baseSize * 1.7,
        fontWeight: FontWeight.w600,
        color: textColor,
        height: typography.lineHeight,
      ),
      headlineSmall: TextStyle(
        fontFamily: headingFamily,
        fontSize: baseSize * 1.4,
        fontWeight: FontWeight.w600,
        color: textColor,
        height: typography.lineHeight,
      ),
      titleLarge: TextStyle(
        fontFamily: fontFamily,
        fontSize: baseSize * 1.3,
        fontWeight: FontWeight.w500,
        color: textColor,
        height: typography.lineHeight,
      ),
      titleMedium: TextStyle(
        fontFamily: fontFamily,
        fontSize: baseSize * 1.1,
        fontWeight: FontWeight.w500,
        color: textColor,
        height: typography.lineHeight,
      ),
      titleSmall: TextStyle(
        fontFamily: fontFamily,
        fontSize: baseSize,
        fontWeight: FontWeight.w500,
        color: textColor,
        height: typography.lineHeight,
      ),
      bodyLarge: TextStyle(
        fontFamily: fontFamily,
        fontSize: baseSize * 1.1,
        fontWeight: FontWeight.normal,
        color: textColor,
        height: typography.lineHeight,
      ),
      bodyMedium: TextStyle(
        fontFamily: fontFamily,
        fontSize: baseSize,
        fontWeight: FontWeight.normal,
        color: textColor,
        height: typography.lineHeight,
      ),
      bodySmall: TextStyle(
        fontFamily: fontFamily,
        fontSize: baseSize * 0.85,
        fontWeight: FontWeight.normal,
        color: secondaryTextColor,
        height: typography.lineHeight,
      ),
      labelLarge: TextStyle(
        fontFamily: fontFamily,
        fontSize: baseSize,
        fontWeight: FontWeight.w600,
        color: textColor,
        letterSpacing: 0.5,
      ),
      labelMedium: TextStyle(
        fontFamily: fontFamily,
        fontSize: baseSize * 0.9,
        fontWeight: FontWeight.w600,
        color: textColor,
        letterSpacing: 0.5,
      ),
      labelSmall: TextStyle(
        fontFamily: fontFamily,
        fontSize: baseSize * 0.8,
        fontWeight: FontWeight.w500,
        color: secondaryTextColor,
        letterSpacing: 0.5,
      ),
    );
  }

  /// Parse hex color string to Color
  static Color _parseColor(String hexColor) {
    final hex = hexColor.replaceAll('#', '');
    if (hex.length == 6) {
      return Color(int.parse('FF$hex', radix: 16));
    } else if (hex.length == 8) {
      return Color(int.parse(hex, radix: 16));
    }
    return Colors.blue; // Fallback
  }
}

/// Riverpod provider for tenant theme
final tenantThemeProvider = FutureProvider.family<TenantThemeConfig, String>(
  (ref, tenantId) async {
    final service = TenantThemeService(ref);
    return await service.fetchThemeConfig(tenantId);
  },
);

/// Riverpod provider for Flutter ThemeData
final flutterThemeProvider = Provider.family<ThemeData?, String>(
  (ref, tenantId) {
    final themeAsync = ref.watch(tenantThemeProvider(tenantId));

    return themeAsync.when(
      data: (config) => TenantThemeBuilder.buildTheme(config),
      loading: () => null,
      error: (_, __) => null,
    );
  },
);
