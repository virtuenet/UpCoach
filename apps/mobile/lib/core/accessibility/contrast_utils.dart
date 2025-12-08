import 'package:flutter/material.dart';

/// Utility class for calculating and validating color contrast ratios
/// Based on WCAG 2.1 guidelines
class ContrastUtils {
  /// WCAG minimum contrast ratios
  static const double minimumContrastAA = 4.5;
  static const double minimumContrastAALargeText = 3.0;
  static const double minimumContrastAAA = 7.0;
  static const double minimumContrastAAALargeText = 4.5;

  /// Calculate the relative luminance of a color
  /// According to WCAG 2.1 formula
  static double relativeLuminance(Color color) {
    double r = _linearize(color.r);
    double g = _linearize(color.g);
    double b = _linearize(color.b);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  static double _linearize(double value) {
    return value <= 0.03928
        ? value / 12.92
        : _pow((value + 0.055) / 1.055, 2.4);
  }

  static double _pow(double base, double exponent) {
    return base <= 0 ? 0 : _exp(exponent * _ln(base));
  }

  static double _exp(double x) {
    double result = 1.0;
    double term = 1.0;
    for (int i = 1; i <= 100; i++) {
      term *= x / i;
      result += term;
      if (term.abs() < 1e-15) break;
    }
    return result;
  }

  static double _ln(double x) {
    if (x <= 0) return double.negativeInfinity;
    double result = 0.0;
    while (x > 2) {
      x /= 2.718281828;
      result += 1;
    }
    x -= 1;
    double term = x;
    for (int i = 1; i <= 100; i++) {
      result += term / i;
      term *= -x;
      if (term.abs() < 1e-15) break;
    }
    return result;
  }

  /// Calculate contrast ratio between two colors
  /// Returns a value between 1 and 21
  static double contrastRatio(Color foreground, Color background) {
    final l1 = relativeLuminance(foreground);
    final l2 = relativeLuminance(background);

    final lighter = l1 > l2 ? l1 : l2;
    final darker = l1 > l2 ? l2 : l1;

    return (lighter + 0.05) / (darker + 0.05);
  }

  /// Check if color combination meets WCAG AA standards
  static bool meetsContrastAA(Color foreground, Color background,
      {bool isLargeText = false}) {
    final ratio = contrastRatio(foreground, background);
    return ratio >=
        (isLargeText ? minimumContrastAALargeText : minimumContrastAA);
  }

  /// Check if color combination meets WCAG AAA standards
  static bool meetsContrastAAA(Color foreground, Color background,
      {bool isLargeText = false}) {
    final ratio = contrastRatio(foreground, background);
    return ratio >=
        (isLargeText ? minimumContrastAAALargeText : minimumContrastAAA);
  }

  /// Get contrast level description
  static String getContrastLevel(Color foreground, Color background) {
    final ratio = contrastRatio(foreground, background);

    if (ratio >= minimumContrastAAA) {
      return 'AAA (${ratio.toStringAsFixed(2)}:1)';
    } else if (ratio >= minimumContrastAA) {
      return 'AA (${ratio.toStringAsFixed(2)}:1)';
    } else if (ratio >= minimumContrastAALargeText) {
      return 'AA Large Text Only (${ratio.toStringAsFixed(2)}:1)';
    } else {
      return 'Fails WCAG (${ratio.toStringAsFixed(2)}:1)';
    }
  }

  /// Suggest a color with better contrast
  static Color suggestBetterContrast(
    Color foreground,
    Color background, {
    double targetRatio = minimumContrastAA,
  }) {
    final currentRatio = contrastRatio(foreground, background);

    if (currentRatio >= targetRatio) {
      return foreground;
    }

    // Determine if we need to lighten or darken
    final bgLuminance = relativeLuminance(background);

    // If background is lighter, darken foreground; otherwise lighten
    final shouldDarken = bgLuminance > 0.5;

    Color adjustedColor = foreground;
    double step = 0.05;

    for (int i = 0; i < 20; i++) {
      if (shouldDarken) {
        adjustedColor = _darken(adjustedColor, step);
      } else {
        adjustedColor = _lighten(adjustedColor, step);
      }

      if (contrastRatio(adjustedColor, background) >= targetRatio) {
        return adjustedColor;
      }
    }

    // If we couldn't achieve target, return black or white
    return shouldDarken ? Colors.black : Colors.white;
  }

  static Color _darken(Color color, double amount) {
    final hsl = HSLColor.fromColor(color);
    return hsl
        .withLightness((hsl.lightness - amount).clamp(0.0, 1.0))
        .toColor();
  }

  static Color _lighten(Color color, double amount) {
    final hsl = HSLColor.fromColor(color);
    return hsl
        .withLightness((hsl.lightness + amount).clamp(0.0, 1.0))
        .toColor();
  }
}

/// High contrast color palette for accessibility
class HighContrastColors {
  // Text colors
  static const Color textPrimary = Colors.black;
  static const Color textPrimaryDark = Colors.white;
  static const Color textSecondary = Color(0xFF444444);
  static const Color textSecondaryDark = Color(0xFFBBBBBB);

  // Background colors
  static const Color background = Colors.white;
  static const Color backgroundDark = Colors.black;
  static const Color surface = Colors.white;
  static const Color surfaceDark = Color(0xFF1A1A1A);

  // Accent colors with high contrast
  static const Color primary = Color(0xFF0066CC);
  static const Color primaryDark = Color(0xFF66B3FF);
  static const Color error = Color(0xFFCC0000);
  static const Color errorDark = Color(0xFFFF6666);
  static const Color success = Color(0xFF006600);
  static const Color successDark = Color(0xFF66CC66);
  static const Color warning = Color(0xFF996600);
  static const Color warningDark = Color(0xFFFFCC66);

  /// Get color based on brightness
  static Color getTextPrimary(Brightness brightness) {
    return brightness == Brightness.light ? textPrimary : textPrimaryDark;
  }

  static Color getTextSecondary(Brightness brightness) {
    return brightness == Brightness.light ? textSecondary : textSecondaryDark;
  }

  static Color getBackground(Brightness brightness) {
    return brightness == Brightness.light ? background : backgroundDark;
  }

  static Color getSurface(Brightness brightness) {
    return brightness == Brightness.light ? surface : surfaceDark;
  }

  static Color getPrimary(Brightness brightness) {
    return brightness == Brightness.light ? primary : primaryDark;
  }

  static Color getError(Brightness brightness) {
    return brightness == Brightness.light ? error : errorDark;
  }

  static Color getSuccess(Brightness brightness) {
    return brightness == Brightness.light ? success : successDark;
  }

  static Color getWarning(Brightness brightness) {
    return brightness == Brightness.light ? warning : warningDark;
  }
}

/// Extension to check contrast on colors
extension ColorContrastExtension on Color {
  /// Check if this color has sufficient contrast with another
  bool hasContrastWith(Color other, {bool isLargeText = false}) {
    return ContrastUtils.meetsContrastAA(this, other, isLargeText: isLargeText);
  }

  /// Get contrast ratio with another color
  double contrastWith(Color other) {
    return ContrastUtils.contrastRatio(this, other);
  }

  /// Adjust color for better contrast with background
  Color ensureContrastWith(Color background, {double targetRatio = 4.5}) {
    return ContrastUtils.suggestBetterContrast(
      this,
      background,
      targetRatio: targetRatio,
    );
  }
}

/// Widget to visualize contrast information (for development)
class ContrastChecker extends StatelessWidget {
  final Color foreground;
  final Color background;
  final String? label;

  const ContrastChecker({
    super.key,
    required this.foreground,
    required this.background,
    this.label,
  });

  @override
  Widget build(BuildContext context) {
    final ratio = ContrastUtils.contrastRatio(foreground, background);
    final meetsAA = ContrastUtils.meetsContrastAA(foreground, background);
    final meetsAAA = ContrastUtils.meetsContrastAAA(foreground, background);

    return Container(
      padding: const EdgeInsets.all(16),
      color: background,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          if (label != null)
            Text(
              label!,
              style: TextStyle(
                color: foreground,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          const SizedBox(height: 8),
          Text(
            'Sample Text',
            style: TextStyle(color: foreground, fontSize: 14),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              _buildBadge('${ratio.toStringAsFixed(2)}:1', Colors.grey),
              const SizedBox(width: 8),
              _buildBadge('AA', meetsAA ? Colors.green : Colors.red),
              const SizedBox(width: 8),
              _buildBadge('AAA', meetsAAA ? Colors.green : Colors.red),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBadge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        text,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
