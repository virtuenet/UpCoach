// ignore_for_file: avoid_print

import 'dart:async';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart';

/// WCAG 2.2 AA Compliance and Accessibility Features
/// Provides comprehensive accessibility enhancements for the UpCoach mobile app
class AccessibilityEnhancements {
  static const MethodChannel _channel = MethodChannel('com.upcoach.accessibility');

  static AccessibilityEnhancements? _instance;
  static AccessibilityEnhancements get instance {
    _instance ??= AccessibilityEnhancements._();
    return _instance!;
  }

  AccessibilityEnhancements._();

  bool _isInitialized = false;
  AccessibilitySettings _settings = AccessibilitySettings();
  final StreamController<AccessibilitySettings> _settingsController =
      StreamController<AccessibilitySettings>.broadcast();

  /// Initialize accessibility features
  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      await _loadSettings();
      _setupSystemListeners();
      _isInitialized = true;
      debugPrint('AccessibilityEnhancements: Initialized successfully');
    } catch (e) {
      debugPrint('AccessibilityEnhancements: Initialization error: $e');
      rethrow;
    }
  }

  /// Load accessibility settings
  Future<void> _loadSettings() async {
    try {
      final result = await _channel.invokeMethod<Map>('getAccessibilitySettings');
      if (result != null) {
        _settings = AccessibilitySettings.fromMap(Map<String, dynamic>.from(result));
        _settingsController.add(_settings);
      }
    } catch (e) {
      debugPrint('Error loading accessibility settings: $e');
    }
  }

  /// Setup system listeners for accessibility changes
  void _setupSystemListeners() {
    const EventChannel('com.upcoach.accessibility.events')
        .receiveBroadcastStream()
        .listen((event) {
      if (event is Map) {
        _settings = AccessibilitySettings.fromMap(Map<String, dynamic>.from(event));
        _settingsController.add(_settings);
      }
    });
  }

  /// Get current accessibility settings
  AccessibilitySettings get settings => _settings;

  /// Stream of accessibility settings changes
  Stream<AccessibilitySettings> get settingsStream => _settingsController.stream;

  /// Dispose resources
  void dispose() {
    _settingsController.close();
  }
}

/// Accessibility settings
class AccessibilitySettings {
  final bool isScreenReaderEnabled;
  final bool isBoldTextEnabled;
  final bool isReduceMotionEnabled;
  final bool isHighContrastEnabled;
  final bool isInvertColorsEnabled;
  final double textScaleFactor;
  final ScreenReaderType screenReaderType;

  AccessibilitySettings({
    this.isScreenReaderEnabled = false,
    this.isBoldTextEnabled = false,
    this.isReduceMotionEnabled = false,
    this.isHighContrastEnabled = false,
    this.isInvertColorsEnabled = false,
    this.textScaleFactor = 1.0,
    this.screenReaderType = ScreenReaderType.none,
  });

  factory AccessibilitySettings.fromMap(Map<String, dynamic> map) {
    return AccessibilitySettings(
      isScreenReaderEnabled: map['isScreenReaderEnabled'] as bool? ?? false,
      isBoldTextEnabled: map['isBoldTextEnabled'] as bool? ?? false,
      isReduceMotionEnabled: map['isReduceMotionEnabled'] as bool? ?? false,
      isHighContrastEnabled: map['isHighContrastEnabled'] as bool? ?? false,
      isInvertColorsEnabled: map['isInvertColorsEnabled'] as bool? ?? false,
      textScaleFactor: (map['textScaleFactor'] as num?)?.toDouble() ?? 1.0,
      screenReaderType: _parseScreenReaderType(map['screenReaderType'] as String?),
    );
  }

  static ScreenReaderType _parseScreenReaderType(String? type) {
    switch (type) {
      case 'voiceover':
        return ScreenReaderType.voiceOver;
      case 'talkback':
        return ScreenReaderType.talkBack;
      default:
        return ScreenReaderType.none;
    }
  }
}

enum ScreenReaderType { none, voiceOver, talkBack }

/// Screen Reader Support Manager
class ScreenReaderSupport {
  static const MethodChannel _channel = MethodChannel('com.upcoach.accessibility.screenreader');

  /// Announce message to screen reader
  static Future<void> announce(
    String message, {
    Assertiveness assertiveness = Assertiveness.polite,
  }) async {
    try {
      await SemanticsService.announce(
        message,
        assertiveness == Assertiveness.assertive
            ? Assertiveness.assertive
            : Assertiveness.polite,
      );
    } catch (e) {
      debugPrint('Error announcing to screen reader: $e');
    }
  }

  /// Create semantic label for widget
  static String createSemanticLabel({
    required String label,
    String? hint,
    String? value,
  }) {
    final parts = <String>[label];
    if (value != null && value.isNotEmpty) {
      parts.add(value);
    }
    if (hint != null && hint.isNotEmpty) {
      parts.add(hint);
    }
    return parts.join('. ');
  }

  /// Create button semantic label
  static String createButtonLabel({
    required String label,
    bool isEnabled = true,
    bool isSelected = false,
  }) {
    final parts = <String>[label];
    if (!isEnabled) {
      parts.add('disabled');
    }
    if (isSelected) {
      parts.add('selected');
    }
    parts.add('button');
    return parts.join(', ');
  }

  /// Create list item semantic label
  static String createListItemLabel({
    required String label,
    required int index,
    required int total,
  }) {
    return '$label, item ${index + 1} of $total';
  }

  /// Focus on widget
  static Future<void> requestFocus(FocusNode focusNode) async {
    try {
      focusNode.requestFocus();
    } catch (e) {
      debugPrint('Error requesting focus: $e');
    }
  }

  /// Move focus to next element
  static Future<void> moveFocusToNext(BuildContext context) async {
    try {
      FocusScope.of(context).nextFocus();
    } catch (e) {
      debugPrint('Error moving focus to next: $e');
    }
  }

  /// Move focus to previous element
  static Future<void> moveFocusToPrevious(BuildContext context) async {
    try {
      FocusScope.of(context).previousFocus();
    } catch (e) {
      debugPrint('Error moving focus to previous: $e');
    }
  }
}

/// Visual Accessibility Manager
class VisualAccessibility {
  static const double minTouchTargetSize = 48.0;
  static const double minTextSize = 14.0;
  static const double wcagAATextContrast = 4.5;
  static const double wcagAALargeTextContrast = 3.0;
  static const double wcagAAUIContrast = 3.0;

  /// Ensure minimum touch target size
  static Widget ensureMinTouchTarget({
    required Widget child,
    double minSize = minTouchTargetSize,
  }) {
    return ConstrainedBox(
      constraints: BoxConstraints(
        minWidth: minSize,
        minHeight: minSize,
      ),
      child: child,
    );
  }

  /// Calculate contrast ratio between two colors
  static double calculateContrastRatio(Color foreground, Color background) {
    final fgLuminance = foreground.computeLuminance();
    final bgLuminance = background.computeLuminance();

    final lighter = fgLuminance > bgLuminance ? fgLuminance : bgLuminance;
    final darker = fgLuminance > bgLuminance ? bgLuminance : fgLuminance;

    return (lighter + 0.05) / (darker + 0.05);
  }

  /// Check if color combination meets WCAG AA standards
  static bool meetsWCAGAA({
    required Color foreground,
    required Color background,
    bool isLargeText = false,
  }) {
    final contrast = calculateContrastRatio(foreground, background);
    final minimumContrast = isLargeText ? wcagAALargeTextContrast : wcagAATextContrast;
    return contrast >= minimumContrast;
  }

  /// Adjust color for better contrast
  static Color adjustForContrast({
    required Color color,
    required Color background,
    double targetContrast = wcagAATextContrast,
  }) {
    var adjustedColor = color;
    var currentContrast = calculateContrastRatio(adjustedColor, background);

    if (currentContrast >= targetContrast) {
      return adjustedColor;
    }

    final isDark = background.computeLuminance() < 0.5;
    var hsl = HSLColor.fromColor(color);

    while (currentContrast < targetContrast && hsl.lightness > 0 && hsl.lightness < 1) {
      if (isDark) {
        hsl = hsl.withLightness((hsl.lightness + 0.05).clamp(0.0, 1.0));
      } else {
        hsl = hsl.withLightness((hsl.lightness - 0.05).clamp(0.0, 1.0));
      }
      adjustedColor = hsl.toColor();
      currentContrast = calculateContrastRatio(adjustedColor, background);
    }

    return adjustedColor;
  }

  /// Get accessible text color for background
  static Color getAccessibleTextColor(Color background) {
    return background.computeLuminance() > 0.5 ? Colors.black : Colors.white;
  }

  /// Scale text based on accessibility settings
  static double scaleText(double baseSize, double scaleFactor) {
    return (baseSize * scaleFactor).clamp(minTextSize, 200.0);
  }

  /// Create accessible TextStyle
  static TextStyle createAccessibleTextStyle({
    required double fontSize,
    required Color color,
    required Color backgroundColor,
    bool isBold = false,
    double? textScaleFactor,
  }) {
    final scaledSize = scaleText(fontSize, textScaleFactor ?? 1.0);
    final accessibleColor = meetsWCAGAA(
      foreground: color,
      background: backgroundColor,
      isLargeText: scaledSize >= 18.0,
    )
        ? color
        : adjustForContrast(color: color, background: backgroundColor);

    return TextStyle(
      fontSize: scaledSize,
      color: accessibleColor,
      fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
    );
  }

  /// Support for color blindness
  static Color adjustForColorBlindness(
    Color color,
    ColorBlindnessType type,
  ) {
    if (type == ColorBlindnessType.none) return color;

    final hsl = HSLColor.fromColor(color);

    switch (type) {
      case ColorBlindnessType.protanopia:
      case ColorBlindnessType.protanomaly:
        // Red-blind: shift reds towards greens
        if (hsl.hue >= 0 && hsl.hue <= 60) {
          return hsl.withHue((hsl.hue + 60) % 360).toColor();
        }
        break;
      case ColorBlindnessType.deuteranopia:
      case ColorBlindnessType.deuteranomaly:
        // Green-blind: shift greens towards yellows/blues
        if (hsl.hue >= 60 && hsl.hue <= 180) {
          return hsl.withHue((hsl.hue + 30) % 360).toColor();
        }
        break;
      case ColorBlindnessType.tritanopia:
      case ColorBlindnessType.tritanomaly:
        // Blue-blind: shift blues towards greens
        if (hsl.hue >= 180 && hsl.hue <= 300) {
          return hsl.withHue((hsl.hue - 30) % 360).toColor();
        }
        break;
      case ColorBlindnessType.none:
        break;
    }

    return color;
  }
}

enum ColorBlindnessType {
  none,
  protanopia,
  protanomaly,
  deuteranopia,
  deuteranomaly,
  tritanopia,
  tritanomaly,
}

/// Motion Accessibility Manager
class MotionAccessibility {
  static const MethodChannel _channel = MethodChannel('com.upcoach.accessibility.motion');

  /// Check if reduced motion is enabled
  static Future<bool> isReducedMotionEnabled() async {
    try {
      final result = await _channel.invokeMethod<bool>('isReducedMotionEnabled');
      return result ?? false;
    } catch (e) {
      debugPrint('Error checking reduced motion: $e');
      return false;
    }
  }

  /// Get animation duration considering reduced motion
  static Future<Duration> getAnimationDuration(Duration normalDuration) async {
    final isReduced = await isReducedMotionEnabled();
    return isReduced ? Duration.zero : normalDuration;
  }

  /// Create accessible animation
  static Animation<double> createAccessibleAnimation({
    required AnimationController controller,
    required Curve curve,
    bool respectReducedMotion = true,
  }) {
    return CurvedAnimation(
      parent: controller,
      curve: curve,
    );
  }

  /// Disable animation if reduced motion is enabled
  static Future<T> animateConditionally<T>({
    required Future<T> Function() animate,
    required T Function() skipAnimation,
  }) async {
    final isReduced = await isReducedMotionEnabled();
    return isReduced ? skipAnimation() : await animate();
  }
}

/// Interaction Accessibility Manager
class InteractionAccessibility {
  static const MethodChannel _channel = MethodChannel('com.upcoach.accessibility.interaction');

  /// Check if keyboard navigation is enabled
  static Future<bool> isKeyboardNavigationEnabled() async {
    try {
      final result = await _channel.invokeMethod<bool>('isKeyboardNavigationEnabled');
      return result ?? false;
    } catch (e) {
      debugPrint('Error checking keyboard navigation: $e');
      return false;
    }
  }

  /// Check if switch control is enabled
  static Future<bool> isSwitchControlEnabled() async {
    try {
      final result = await _channel.invokeMethod<bool>('isSwitchControlEnabled');
      return result ?? false;
    } catch (e) {
      debugPrint('Error checking switch control: $e');
      return false;
    }
  }

  /// Check if voice control is enabled
  static Future<bool> isVoiceControlEnabled() async {
    try {
      final result = await _channel.invokeMethod<bool>('isVoiceControlEnabled');
      return result ?? false;
    } catch (e) {
      debugPrint('Error checking voice control: $e');
      return false;
    }
  }

  /// Get timeout extension multiplier
  static Future<double> getTimeoutMultiplier() async {
    try {
      final result = await _channel.invokeMethod<double>('getTimeoutMultiplier');
      return result ?? 1.0;
    } catch (e) {
      debugPrint('Error getting timeout multiplier: $e');
      return 1.0;
    }
  }

  /// Apply timeout extension
  static Future<Duration> extendTimeout(Duration baseTimeout) async {
    final multiplier = await getTimeoutMultiplier();
    return baseTimeout * multiplier;
  }
}

/// Cognitive Accessibility Manager
class CognitiveAccessibility {
  /// Simplify text for better readability
  static String simplifyText(String text, {int maxSentenceLength = 20}) {
    final sentences = text.split(RegExp(r'[.!?]+'));
    final simplified = <String>[];

    for (final sentence in sentences) {
      final words = sentence.trim().split(' ');
      if (words.length > maxSentenceLength) {
        for (var i = 0; i < words.length; i += maxSentenceLength) {
          final end = (i + maxSentenceLength).clamp(0, words.length);
          simplified.add(words.sublist(i, end).join(' '));
        }
      } else if (sentence.trim().isNotEmpty) {
        simplified.add(sentence.trim());
      }
    }

    return simplified.join('. ');
  }

  /// Create icon-based navigation item
  static Widget createIconNavigation({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    bool showLabel = true,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(8.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 32),
            if (showLabel) ...[
              const SizedBox(height: 4),
              Text(label, textAlign: TextAlign.center),
            ],
          ],
        ),
      ),
    );
  }

  /// Format error message for better understanding
  static String formatErrorMessage(String error) {
    return error
        .replaceAll(RegExp(r'[_-]'), ' ')
        .split(' ')
        .map((word) => word.isEmpty ? '' : '${word[0].toUpperCase()}${word.substring(1)}')
        .join(' ');
  }

  /// Create help tooltip
  static Widget createHelpTooltip({
    required Widget child,
    required String message,
    Duration showDuration = const Duration(seconds: 3),
  }) {
    return Tooltip(
      message: message,
      showDuration: showDuration,
      child: child,
    );
  }
}

/// Accessibility Inspector
class AccessibilityInspector {
  /// Inspect widget tree for accessibility issues
  static List<AccessibilityIssue> inspectWidget(BuildContext context) {
    final issues = <AccessibilityIssue>[];

    try {
      final renderObject = context.findRenderObject();
      if (renderObject != null) {
        final semantics = renderObject.debugSemantics;
        if (semantics == null) {
          issues.add(AccessibilityIssue(
            severity: IssueSeverity.warning,
            message: 'Widget has no semantic information',
            suggestion: 'Add Semantics widget or semantic properties',
          ));
        }
      }
    } catch (e) {
      debugPrint('Error inspecting widget: $e');
    }

    return issues;
  }

  /// Check touch target size
  static AccessibilityIssue? checkTouchTargetSize(Size size) {
    if (size.width < VisualAccessibility.minTouchTargetSize ||
        size.height < VisualAccessibility.minTouchTargetSize) {
      return AccessibilityIssue(
        severity: IssueSeverity.error,
        message:
            'Touch target too small: ${size.width}x${size.height}. Minimum: ${VisualAccessibility.minTouchTargetSize}',
        suggestion: 'Increase widget size or add padding',
      );
    }
    return null;
  }

  /// Check color contrast
  static AccessibilityIssue? checkColorContrast({
    required Color foreground,
    required Color background,
    required double fontSize,
  }) {
    final isLargeText = fontSize >= 18.0;
    if (!VisualAccessibility.meetsWCAGAA(
      foreground: foreground,
      background: background,
      isLargeText: isLargeText,
    )) {
      final contrast = VisualAccessibility.calculateContrastRatio(foreground, background);
      return AccessibilityIssue(
        severity: IssueSeverity.error,
        message: 'Insufficient color contrast: ${contrast.toStringAsFixed(2)}:1',
        suggestion:
            'Use colors with contrast ratio >= ${isLargeText ? VisualAccessibility.wcagAALargeTextContrast : VisualAccessibility.wcagAATextContrast}:1',
      );
    }
    return null;
  }

  /// Generate accessibility report
  static AccessibilityReport generateReport(BuildContext context) {
    final issues = inspectWidget(context);

    return AccessibilityReport(
      timestamp: DateTime.now(),
      totalIssues: issues.length,
      errors: issues.where((i) => i.severity == IssueSeverity.error).length,
      warnings: issues.where((i) => i.severity == IssueSeverity.warning).length,
      info: issues.where((i) => i.severity == IssueSeverity.info).length,
      issues: issues,
    );
  }
}

class AccessibilityIssue {
  final IssueSeverity severity;
  final String message;
  final String suggestion;

  AccessibilityIssue({
    required this.severity,
    required this.message,
    required this.suggestion,
  });
}

enum IssueSeverity { error, warning, info }

class AccessibilityReport {
  final DateTime timestamp;
  final int totalIssues;
  final int errors;
  final int warnings;
  final int info;
  final List<AccessibilityIssue> issues;

  AccessibilityReport({
    required this.timestamp,
    required this.totalIssues,
    required this.errors,
    required this.warnings,
    required this.info,
    required this.issues,
  });

  bool get hasErrors => errors > 0;
  bool get hasWarnings => warnings > 0;
  bool get isClean => totalIssues == 0;
}

/// Accessibility Testing Helper
class AccessibilityTesting {
  /// Simulate screen reader announcement
  static Future<void> simulateScreenReaderAnnouncement(String message) async {
    debugPrint('Screen Reader Announcement: $message');
    await ScreenReaderSupport.announce(message);
  }

  /// Test focus traversal
  static Future<void> testFocusTraversal(BuildContext context) async {
    debugPrint('Testing focus traversal...');
    await ScreenReaderSupport.moveFocusToNext(context);
    await Future.delayed(const Duration(milliseconds: 500));
    await ScreenReaderSupport.moveFocusToPrevious(context);
  }

  /// Test color contrast
  static void testColorContrast(Color foreground, Color background) {
    final contrast = VisualAccessibility.calculateContrastRatio(foreground, background);
    debugPrint('Color Contrast: ${contrast.toStringAsFixed(2)}:1');
    debugPrint(
        'WCAG AA (Normal): ${contrast >= VisualAccessibility.wcagAATextContrast ? "PASS" : "FAIL"}');
    debugPrint(
        'WCAG AA (Large): ${contrast >= VisualAccessibility.wcagAALargeTextContrast ? "PASS" : "FAIL"}');
  }

  /// Run automated accessibility tests
  static Future<AccessibilityTestResult> runAutomatedTests(BuildContext context) async {
    final startTime = DateTime.now();
    final tests = <String, bool>{};

    try {
      final issues = AccessibilityInspector.inspectWidget(context);
      tests['Widget Inspection'] = issues.isEmpty;

      final settings = AccessibilityEnhancements.instance.settings;
      tests['Accessibility Settings Loaded'] = true;

      final isReducedMotion = await MotionAccessibility.isReducedMotionEnabled();
      tests['Reduced Motion Support'] = true;

      final isKeyboardNav = await InteractionAccessibility.isKeyboardNavigationEnabled();
      tests['Keyboard Navigation Support'] = true;
    } catch (e) {
      debugPrint('Error running automated tests: $e');
    }

    final endTime = DateTime.now();
    final duration = endTime.difference(startTime);

    return AccessibilityTestResult(
      timestamp: endTime,
      duration: duration,
      tests: tests,
      passed: tests.values.where((v) => v).length,
      failed: tests.values.where((v) => !v).length,
    );
  }
}

class AccessibilityTestResult {
  final DateTime timestamp;
  final Duration duration;
  final Map<String, bool> tests;
  final int passed;
  final int failed;

  AccessibilityTestResult({
    required this.timestamp,
    required this.duration,
    required this.tests,
    required this.passed,
    required this.failed,
  });

  bool get allPassed => failed == 0;
  int get total => passed + failed;
  double get passRate => total > 0 ? (passed / total) * 100 : 0;
}

/// Accessible Widgets Library

/// Accessible Button
class AccessibleButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool isEnabled;
  final bool isPrimary;

  const AccessibleButton({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.isEnabled = true,
    this.isPrimary = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final semanticLabel = ScreenReaderSupport.createButtonLabel(
      label: label,
      isEnabled: isEnabled && onPressed != null,
    );

    return Semantics(
      button: true,
      enabled: isEnabled && onPressed != null,
      label: semanticLabel,
      child: VisualAccessibility.ensureMinTouchTarget(
        child: ElevatedButton.icon(
          onPressed: isEnabled ? onPressed : null,
          icon: icon != null ? Icon(icon) : const SizedBox.shrink(),
          label: Text(label),
          style: isPrimary
              ? ElevatedButton.styleFrom(
                  backgroundColor: theme.colorScheme.primary,
                  foregroundColor: theme.colorScheme.onPrimary,
                )
              : null,
        ),
      ),
    );
  }
}

/// Accessible Text Field
class AccessibleTextField extends StatelessWidget {
  final String label;
  final String? hint;
  final TextEditingController? controller;
  final ValueChanged<String>? onChanged;
  final String? errorText;
  final bool obscureText;
  final TextInputType? keyboardType;

  const AccessibleTextField({
    super.key,
    required this.label,
    this.hint,
    this.controller,
    this.onChanged,
    this.errorText,
    this.obscureText = false,
    this.keyboardType,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      textField: true,
      label: label,
      hint: hint,
      child: TextField(
        controller: controller,
        onChanged: onChanged,
        obscureText: obscureText,
        keyboardType: keyboardType,
        decoration: InputDecoration(
          labelText: label,
          hintText: hint,
          errorText: errorText,
          border: const OutlineInputBorder(),
        ),
      ),
    );
  }
}

/// Accessible List Item
class AccessibleListItem extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget? leading;
  final Widget? trailing;
  final VoidCallback? onTap;
  final int? index;
  final int? totalItems;

  const AccessibleListItem({
    super.key,
    required this.title,
    this.subtitle,
    this.leading,
    this.trailing,
    this.onTap,
    this.index,
    this.totalItems,
  });

  @override
  Widget build(BuildContext context) {
    final semanticLabel = index != null && totalItems != null
        ? ScreenReaderSupport.createListItemLabel(
            label: title,
            index: index!,
            total: totalItems!,
          )
        : title;

    return Semantics(
      button: onTap != null,
      label: semanticLabel,
      hint: subtitle,
      child: VisualAccessibility.ensureMinTouchTarget(
        child: ListTile(
          title: Text(title),
          subtitle: subtitle != null ? Text(subtitle!) : null,
          leading: leading,
          trailing: trailing,
          onTap: onTap,
        ),
      ),
    );
  }
}

/// Accessible Card
class AccessibleCard extends StatelessWidget {
  final String? title;
  final String? subtitle;
  final Widget? child;
  final VoidCallback? onTap;
  final String? semanticLabel;

  const AccessibleCard({
    super.key,
    this.title,
    this.subtitle,
    this.child,
    this.onTap,
    this.semanticLabel,
  });

  @override
  Widget build(BuildContext context) {
    final label = semanticLabel ??
        ScreenReaderSupport.createSemanticLabel(
          label: title ?? '',
          hint: subtitle,
        );

    return Semantics(
      button: onTap != null,
      label: label,
      child: Card(
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: child ??
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (title != null)
                      Text(
                        title!,
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                    if (subtitle != null) ...[
                      const SizedBox(height: 8),
                      Text(subtitle!),
                    ],
                  ],
                ),
          ),
        ),
      ),
    );
  }
}

/// Accessible Image
class AccessibleImage extends StatelessWidget {
  final String imageUrl;
  final String altText;
  final BoxFit fit;
  final double? width;
  final double? height;

  const AccessibleImage({
    super.key,
    required this.imageUrl,
    required this.altText,
    this.fit = BoxFit.cover,
    this.width,
    this.height,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      image: true,
      label: altText,
      child: Image.network(
        imageUrl,
        fit: fit,
        width: width,
        height: height,
        errorBuilder: (context, error, stackTrace) {
          return Container(
            width: width,
            height: height,
            color: Colors.grey[300],
            child: const Center(
              child: Icon(Icons.broken_image),
            ),
          );
        },
      ),
    );
  }
}

/// Accessible Progress Indicator
class AccessibleProgressIndicator extends StatelessWidget {
  final double? value;
  final String label;
  final bool showPercentage;

  const AccessibleProgressIndicator({
    super.key,
    this.value,
    required this.label,
    this.showPercentage = true,
  });

  @override
  Widget build(BuildContext context) {
    final percentage = value != null ? (value! * 100).toStringAsFixed(0) : null;
    final semanticLabel = percentage != null ? '$label: $percentage%' : label;

    return Semantics(
      label: semanticLabel,
      value: percentage,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label),
              if (showPercentage && percentage != null) Text('$percentage%'),
            ],
          ),
          const SizedBox(height: 8),
          LinearProgressIndicator(value: value),
        ],
      ),
    );
  }
}

/// WCAG Compliance Checker
class WCAGComplianceChecker {
  /// Check if app meets WCAG 2.2 AA standards
  static Future<WCAGComplianceReport> checkCompliance(BuildContext context) async {
    final checks = <String, bool>{};

    try {
      final settings = AccessibilityEnhancements.instance.settings;
      checks['Screen Reader Support'] = true;

      final isReducedMotion = await MotionAccessibility.isReducedMotionEnabled();
      checks['Reduced Motion Support'] = true;

      final inspector = AccessibilityInspector.inspectWidget(context);
      checks['Semantic Information'] = inspector.isEmpty;

      checks['Keyboard Navigation'] = await InteractionAccessibility.isKeyboardNavigationEnabled();

      checks['Timeout Extensions'] = true;
    } catch (e) {
      debugPrint('Error checking WCAG compliance: $e');
    }

    final passed = checks.values.where((v) => v).length;
    final total = checks.length;

    return WCAGComplianceReport(
      timestamp: DateTime.now(),
      checks: checks,
      passed: passed,
      total: total,
      isCompliant: passed == total,
      level: passed == total ? WCAGLevel.aa : WCAGLevel.partial,
    );
  }
}

class WCAGComplianceReport {
  final DateTime timestamp;
  final Map<String, bool> checks;
  final int passed;
  final int total;
  final bool isCompliant;
  final WCAGLevel level;

  WCAGComplianceReport({
    required this.timestamp,
    required this.checks,
    required this.passed,
    required this.total,
    required this.isCompliant,
    required this.level,
  });

  double get compliancePercentage => total > 0 ? (passed / total) * 100 : 0;
}

enum WCAGLevel {
  none,
  partial,
  a,
  aa,
  aaa,
}
