import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Accessibility feature types
enum AccessibilityFeature {
  screenReader,
  dynamicFontSize,
  highContrast,
  reducedMotion,
  hapticFeedback,
  keyboardNavigation,
  voiceAnnouncements,
}

/// Font size scale
enum FontSizeScale {
  small(0.85),
  normal(1.0),
  large(1.15),
  extraLarge(1.3),
  huge(1.5);

  final double scale;
  const FontSizeScale(this.scale);
}

/// High contrast theme mode
enum HighContrastMode {
  off,
  light,
  dark,
}

/// Haptic feedback intensity
enum HapticIntensity {
  off,
  light,
  medium,
  strong,
}

/// Accessibility settings
class AccessibilitySettings {
  final bool screenReaderEnabled;
  final FontSizeScale fontSizeScale;
  final HighContrastMode highContrastMode;
  final bool reducedMotionEnabled;
  final HapticIntensity hapticIntensity;
  final bool keyboardNavigationEnabled;
  final bool voiceAnnouncementsEnabled;

  const AccessibilitySettings({
    this.screenReaderEnabled = false,
    this.fontSizeScale = FontSizeScale.normal,
    this.highContrastMode = HighContrastMode.off,
    this.reducedMotionEnabled = false,
    this.hapticIntensity = HapticIntensity.medium,
    this.keyboardNavigationEnabled = false,
    this.voiceAnnouncementsEnabled = false,
  });

  AccessibilitySettings copyWith({
    bool? screenReaderEnabled,
    FontSizeScale? fontSizeScale,
    HighContrastMode? highContrastMode,
    bool? reducedMotionEnabled,
    HapticIntensity? hapticIntensity,
    bool? keyboardNavigationEnabled,
    bool? voiceAnnouncementsEnabled,
  }) {
    return AccessibilitySettings(
      screenReaderEnabled: screenReaderEnabled ?? this.screenReaderEnabled,
      fontSizeScale: fontSizeScale ?? this.fontSizeScale,
      highContrastMode: highContrastMode ?? this.highContrastMode,
      reducedMotionEnabled: reducedMotionEnabled ?? this.reducedMotionEnabled,
      hapticIntensity: hapticIntensity ?? this.hapticIntensity,
      keyboardNavigationEnabled:
          keyboardNavigationEnabled ?? this.keyboardNavigationEnabled,
      voiceAnnouncementsEnabled:
          voiceAnnouncementsEnabled ?? this.voiceAnnouncementsEnabled,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'screenReaderEnabled': screenReaderEnabled,
      'fontSizeScale': fontSizeScale.name,
      'highContrastMode': highContrastMode.name,
      'reducedMotionEnabled': reducedMotionEnabled,
      'hapticIntensity': hapticIntensity.name,
      'keyboardNavigationEnabled': keyboardNavigationEnabled,
      'voiceAnnouncementsEnabled': voiceAnnouncementsEnabled,
    };
  }

  factory AccessibilitySettings.fromJson(Map<String, dynamic> json) {
    return AccessibilitySettings(
      screenReaderEnabled: json['screenReaderEnabled'] ?? false,
      fontSizeScale: FontSizeScale.values.firstWhere(
        (e) => e.name == json['fontSizeScale'],
        orElse: () => FontSizeScale.normal,
      ),
      highContrastMode: HighContrastMode.values.firstWhere(
        (e) => e.name == json['highContrastMode'],
        orElse: () => HighContrastMode.off,
      ),
      reducedMotionEnabled: json['reducedMotionEnabled'] ?? false,
      hapticIntensity: HapticIntensity.values.firstWhere(
        (e) => e.name == json['hapticIntensity'],
        orElse: () => HapticIntensity.medium,
      ),
      keyboardNavigationEnabled: json['keyboardNavigationEnabled'] ?? false,
      voiceAnnouncementsEnabled: json['voiceAnnouncementsEnabled'] ?? false,
    );
  }
}

/// Manager for handling accessibility features
class AccessibilityManager extends ChangeNotifier {
  static const String _prefsKey = 'accessibility_settings';
  
  final SharedPreferences _prefs;
  
  AccessibilitySettings _settings = const AccessibilitySettings();
  bool _systemScreenReaderEnabled = false;
  bool _systemReducedMotionEnabled = false;

  AccessibilityManager({
    required SharedPreferences prefs,
  }) : _prefs = prefs {
    _loadSettings();
    _detectSystemSettings();
  }

  // ============================================================================
  // Getters
  // ============================================================================

  AccessibilitySettings get settings => _settings;
  
  bool get isScreenReaderEnabled =>
      _settings.screenReaderEnabled || _systemScreenReaderEnabled;
  
  FontSizeScale get fontSizeScale => _settings.fontSizeScale;
  
  HighContrastMode get highContrastMode => _settings.highContrastMode;
  
  bool get isReducedMotionEnabled =>
      _settings.reducedMotionEnabled || _systemReducedMotionEnabled;
  
  HapticIntensity get hapticIntensity => _settings.hapticIntensity;
  
  bool get isKeyboardNavigationEnabled => _settings.keyboardNavigationEnabled;
  
  bool get isVoiceAnnouncementsEnabled => _settings.voiceAnnouncementsEnabled;

  // ============================================================================
  // Settings Management
  // ============================================================================

  Future<void> _loadSettings() async {
    final settingsJson = _prefs.getString(_prefsKey);
    if (settingsJson != null) {
      try {
        final map = Map<String, dynamic>.from(
          // In production, use proper JSON parsing
          {},
        );
        _settings = AccessibilitySettings.fromJson(map);
        notifyListeners();
      } catch (e) {
        debugPrint('Error loading accessibility settings: $e');
      }
    }
  }

  Future<void> _saveSettings() async {
    await _prefs.setString(_prefsKey, _settings.toJson().toString());
  }

  Future<void> updateSettings(AccessibilitySettings newSettings) async {
    _settings = newSettings;
    await _saveSettings();
    notifyListeners();
  }

  void _detectSystemSettings() {
    // Detect system accessibility settings
    final binding = WidgetsBinding.instance;
    
    _systemScreenReaderEnabled = binding.platformDispatcher.accessibilityFeatures.accessibleNavigation;
    _systemReducedMotionEnabled = binding.platformDispatcher.accessibilityFeatures.disableAnimations;
    
    notifyListeners();
  }

  // ============================================================================
  // Screen Reader Support
  // ============================================================================

  Future<void> setScreenReaderEnabled(bool enabled) async {
    _settings = _settings.copyWith(screenReaderEnabled: enabled);
    await _saveSettings();
    
    if (enabled) {
      SemanticsBinding.instance.ensureSemantics();
    }
    
    notifyListeners();
  }

  Future<void> announce(String message, {TextDirection? textDirection}) async {
    if (!isScreenReaderEnabled && !isVoiceAnnouncementsEnabled) return;

    SemanticsService.announce(
      message,
      textDirection ?? TextDirection.ltr,
      assertiveness: Assertiveness.polite,
    );
  }

  Future<void> announceUrgent(String message, {TextDirection? textDirection}) async {
    if (!isScreenReaderEnabled && !isVoiceAnnouncementsEnabled) return;

    SemanticsService.announce(
      message,
      textDirection ?? TextDirection.ltr,
      assertiveness: Assertiveness.assertive,
    );
  }

  // ============================================================================
  // Dynamic Font Sizing
  // ============================================================================

  Future<void> setFontSizeScale(FontSizeScale scale) async {
    _settings = _settings.copyWith(fontSizeScale: scale);
    await _saveSettings();
    notifyListeners();
  }

  double getScaledFontSize(double baseSize) {
    return baseSize * fontSizeScale.scale;
  }

  TextStyle scaleTextStyle(TextStyle style) {
    return style.copyWith(
      fontSize: (style.fontSize ?? 14.0) * fontSizeScale.scale,
    );
  }

  // ============================================================================
  // High Contrast Themes
  // ============================================================================

  Future<void> setHighContrastMode(HighContrastMode mode) async {
    _settings = _settings.copyWith(highContrastMode: mode);
    await _saveSettings();
    notifyListeners();
  }

  ThemeData applyHighContrast(ThemeData theme) {
    if (highContrastMode == HighContrastMode.off) {
      return theme;
    }

    final isLight = highContrastMode == HighContrastMode.light;
    
    return theme.copyWith(
      colorScheme: ColorScheme(
        brightness: isLight ? Brightness.light : Brightness.dark,
        primary: isLight ? Colors.black : Colors.white,
        onPrimary: isLight ? Colors.white : Colors.black,
        secondary: isLight ? Colors.grey[900]! : Colors.grey[100]!,
        onSecondary: isLight ? Colors.white : Colors.black,
        error: isLight ? Colors.red[900]! : Colors.red[300]!,
        onError: Colors.white,
        surface: isLight ? Colors.white : Colors.black,
        onSurface: isLight ? Colors.black : Colors.white,
      ),
      textTheme: theme.textTheme.apply(
        bodyColor: isLight ? Colors.black : Colors.white,
        displayColor: isLight ? Colors.black : Colors.white,
      ),
      scaffoldBackgroundColor: isLight ? Colors.white : Colors.black,
      cardColor: isLight ? Colors.grey[100] : Colors.grey[900],
    );
  }

  Color getAccessibleColor(Color color, {bool forText = false}) {
    if (highContrastMode == HighContrastMode.off) {
      return color;
    }

    final isLight = highContrastMode == HighContrastMode.light;
    
    if (forText) {
      return isLight ? Colors.black : Colors.white;
    }
    
    return isLight ? Colors.white : Colors.black;
  }

  // ============================================================================
  // Keyboard Navigation
  // ============================================================================

  Future<void> setKeyboardNavigationEnabled(bool enabled) async {
    _settings = _settings.copyWith(keyboardNavigationEnabled: enabled);
    await _saveSettings();
    notifyListeners();
  }

  FocusNode createAccessibleFocusNode({
    String? debugLabel,
    FocusOnKeyCallback? onKey,
  }) {
    return FocusNode(
      debugLabel: debugLabel,
      onKey: onKey ?? _defaultKeyHandler,
    );
  }

  KeyEventResult _defaultKeyHandler(FocusNode node, RawKeyEvent event) {
    if (event is RawKeyDownEvent) {
      if (event.logicalKey == LogicalKeyboardKey.enter ||
          event.logicalKey == LogicalKeyboardKey.space) {
        // Trigger action
        return KeyEventResult.handled;
      }
    }
    return KeyEventResult.ignored;
  }

  // ============================================================================
  // Haptic Feedback Control
  // ============================================================================

  Future<void> setHapticIntensity(HapticIntensity intensity) async {
    _settings = _settings.copyWith(hapticIntensity: intensity);
    await _saveSettings();
    notifyListeners();
  }

  Future<void> lightHaptic() async {
    if (hapticIntensity == HapticIntensity.off) return;
    
    if (hapticIntensity == HapticIntensity.light ||
        hapticIntensity == HapticIntensity.medium ||
        hapticIntensity == HapticIntensity.strong) {
      await HapticFeedback.lightImpact();
    }
  }

  Future<void> mediumHaptic() async {
    if (hapticIntensity == HapticIntensity.off) return;
    
    if (hapticIntensity == HapticIntensity.medium ||
        hapticIntensity == HapticIntensity.strong) {
      await HapticFeedback.mediumImpact();
    }
  }

  Future<void> heavyHaptic() async {
    if (hapticIntensity == HapticIntensity.off) return;
    
    if (hapticIntensity == HapticIntensity.strong) {
      await HapticFeedback.heavyImpact();
    }
  }

  Future<void> selectionHaptic() async {
    if (hapticIntensity == HapticIntensity.off) return;
    await HapticFeedback.selectionClick();
  }

  Future<void> vibrate() async {
    if (hapticIntensity == HapticIntensity.off) return;
    await HapticFeedback.vibrate();
  }

  // ============================================================================
  // Reduced Motion
  // ============================================================================

  Future<void> setReducedMotionEnabled(bool enabled) async {
    _settings = _settings.copyWith(reducedMotionEnabled: enabled);
    await _saveSettings();
    notifyListeners();
  }

  Duration getAnimationDuration(Duration defaultDuration) {
    return isReducedMotionEnabled ? Duration.zero : defaultDuration;
  }

  Curve getAnimationCurve(Curve defaultCurve) {
    return isReducedMotionEnabled ? Curves.linear : defaultCurve;
  }

  // ============================================================================
  // Voice Announcements
  // ============================================================================

  Future<void> setVoiceAnnouncementsEnabled(bool enabled) async {
    _settings = _settings.copyWith(voiceAnnouncementsEnabled: enabled);
    await _saveSettings();
    notifyListeners();
  }

  Future<void> announceGoalCreated(String goalTitle) async {
    await announce('Goal created: $goalTitle');
  }

  Future<void> announceHabitCompleted(String habitName) async {
    await announce('Habit completed: $habitName');
  }

  Future<void> announceStreakAchieved(int streakDays) async {
    await announce('Congratulations! $streakDays day streak achieved');
  }

  Future<void> announceError(String error) async {
    await announceUrgent('Error: $error');
  }

  // ============================================================================
  // Accessibility Helpers
  // ============================================================================

  Widget makeAccessible(
    Widget child, {
    required String label,
    String? hint,
    bool? isButton,
    bool? isLink,
    bool? isHeader,
    VoidCallback? onTap,
  }) {
    return Semantics(
      label: label,
      hint: hint,
      button: isButton ?? false,
      link: isLink ?? false,
      header: isHeader ?? false,
      onTap: onTap,
      child: child,
    );
  }

  Widget excludeFromSemantics(Widget child) {
    return ExcludeSemantics(child: child);
  }

  Widget mergeSemantics(Widget child) {
    return MergeSemantics(child: child);
  }

  // ============================================================================
  // Accessibility Audit
  // ============================================================================

  List<String> auditAccessibility(BuildContext context) {
    final issues = <String>[];

    // Check if screen reader support is enabled
    if (!isScreenReaderEnabled && _systemScreenReaderEnabled) {
      issues.add('Screen reader detected but app support not enabled');
    }

    // Check font size
    final mediaQuery = MediaQuery.of(context);
    if (mediaQuery.textScaleFactor > 1.3 && fontSizeScale == FontSizeScale.normal) {
      issues.add('Large system font detected but not accommodated');
    }

    // Check contrast
    if (_systemScreenReaderEnabled && highContrastMode == HighContrastMode.off) {
      issues.add('Consider enabling high contrast mode for better readability');
    }

    return issues;
  }

  // ============================================================================
  // Reset
  // ============================================================================

  Future<void> resetToDefaults() async {
    _settings = const AccessibilitySettings();
    await _saveSettings();
    notifyListeners();
  }

  @override
  void dispose() {
    super.dispose();
  }
}

/// Accessible widget wrapper
class AccessibleWidget extends StatelessWidget {
  final Widget child;
  final String label;
  final String? hint;
  final bool isButton;
  final VoidCallback? onTap;

  const AccessibleWidget({
    super.key,
    required this.child,
    required this.label,
    this.hint,
    this.isButton = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: label,
      hint: hint,
      button: isButton,
      onTap: onTap,
      child: child,
    );
  }
}
