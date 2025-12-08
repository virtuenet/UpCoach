import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Accessibility settings state
class AccessibilityState {
  final bool reduceMotion;
  final bool highContrast;
  final bool largeText;
  final double textScaleFactor;
  final bool screenReaderEnabled;
  final bool boldText;
  final bool reduceTransparency;

  const AccessibilityState({
    this.reduceMotion = false,
    this.highContrast = false,
    this.largeText = false,
    this.textScaleFactor = 1.0,
    this.screenReaderEnabled = false,
    this.boldText = false,
    this.reduceTransparency = false,
  });

  AccessibilityState copyWith({
    bool? reduceMotion,
    bool? highContrast,
    bool? largeText,
    double? textScaleFactor,
    bool? screenReaderEnabled,
    bool? boldText,
    bool? reduceTransparency,
  }) {
    return AccessibilityState(
      reduceMotion: reduceMotion ?? this.reduceMotion,
      highContrast: highContrast ?? this.highContrast,
      largeText: largeText ?? this.largeText,
      textScaleFactor: textScaleFactor ?? this.textScaleFactor,
      screenReaderEnabled: screenReaderEnabled ?? this.screenReaderEnabled,
      boldText: boldText ?? this.boldText,
      reduceTransparency: reduceTransparency ?? this.reduceTransparency,
    );
  }

  /// Get effective text scale factor based on settings
  double get effectiveTextScale {
    if (largeText) {
      return textScaleFactor * 1.3;
    }
    return textScaleFactor;
  }

  /// Get animation duration multiplier (0 for no animation)
  double get animationDurationMultiplier {
    return reduceMotion ? 0.0 : 1.0;
  }
}

/// Accessibility settings notifier
class AccessibilityNotifier extends StateNotifier<AccessibilityState> {
  static const String _reduceMotionKey = 'a11y_reduce_motion';
  static const String _highContrastKey = 'a11y_high_contrast';
  static const String _largeTextKey = 'a11y_large_text';
  static const String _textScaleKey = 'a11y_text_scale';
  static const String _boldTextKey = 'a11y_bold_text';
  static const String _reduceTransparencyKey = 'a11y_reduce_transparency';

  AccessibilityNotifier() : super(const AccessibilityState()) {
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      state = AccessibilityState(
        reduceMotion: prefs.getBool(_reduceMotionKey) ?? false,
        highContrast: prefs.getBool(_highContrastKey) ?? false,
        largeText: prefs.getBool(_largeTextKey) ?? false,
        textScaleFactor: prefs.getDouble(_textScaleKey) ?? 1.0,
        boldText: prefs.getBool(_boldTextKey) ?? false,
        reduceTransparency: prefs.getBool(_reduceTransparencyKey) ?? false,
      );
    } catch (e) {
      debugPrint('Error loading accessibility settings: $e');
    }
  }

  /// Update from system settings
  void updateFromMediaQuery(MediaQueryData mediaQuery) {
    state = state.copyWith(
      textScaleFactor: mediaQuery.textScaler.scale(1.0),
      reduceMotion: mediaQuery.disableAnimations,
      highContrast: mediaQuery.highContrast,
      boldText: mediaQuery.boldText,
    );
  }

  Future<void> setReduceMotion(bool value) async {
    state = state.copyWith(reduceMotion: value);
    await _savePreference(_reduceMotionKey, value);
  }

  Future<void> setHighContrast(bool value) async {
    state = state.copyWith(highContrast: value);
    await _savePreference(_highContrastKey, value);
  }

  Future<void> setLargeText(bool value) async {
    state = state.copyWith(largeText: value);
    await _savePreference(_largeTextKey, value);
  }

  Future<void> setTextScaleFactor(double value) async {
    state = state.copyWith(textScaleFactor: value.clamp(0.8, 2.0));
    await _saveDoublePreference(_textScaleKey, value);
  }

  Future<void> setBoldText(bool value) async {
    state = state.copyWith(boldText: value);
    await _savePreference(_boldTextKey, value);
  }

  Future<void> setReduceTransparency(bool value) async {
    state = state.copyWith(reduceTransparency: value);
    await _savePreference(_reduceTransparencyKey, value);
  }

  Future<void> resetToDefaults() async {
    state = const AccessibilityState();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_reduceMotionKey);
    await prefs.remove(_highContrastKey);
    await prefs.remove(_largeTextKey);
    await prefs.remove(_textScaleKey);
    await prefs.remove(_boldTextKey);
    await prefs.remove(_reduceTransparencyKey);
  }

  Future<void> _savePreference(String key, bool value) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(key, value);
    } catch (e) {
      debugPrint('Error saving accessibility setting: $e');
    }
  }

  Future<void> _saveDoublePreference(String key, double value) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setDouble(key, value);
    } catch (e) {
      debugPrint('Error saving accessibility setting: $e');
    }
  }
}

/// Accessibility provider
final accessibilityProvider =
    StateNotifierProvider<AccessibilityNotifier, AccessibilityState>((ref) {
  return AccessibilityNotifier();
});

/// Provider for reduce motion preference
final reduceMotionProvider = Provider<bool>((ref) {
  return ref.watch(accessibilityProvider).reduceMotion;
});

/// Provider for high contrast preference
final highContrastProvider = Provider<bool>((ref) {
  return ref.watch(accessibilityProvider).highContrast;
});

/// Provider for text scale factor
final textScaleProvider = Provider<double>((ref) {
  return ref.watch(accessibilityProvider).effectiveTextScale;
});
