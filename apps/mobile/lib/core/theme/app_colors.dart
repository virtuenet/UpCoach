import 'package:flutter/material.dart';

/// App color constants - re-exports from AppTheme for backwards compatibility
class AppColors {
  AppColors._();

  // Brand Colors
  static const Color primary = Color(0xFF6366F1); // Indigo
  static const Color secondary = Color(0xFF10B981); // Emerald
  static const Color accent = Color(0xFFF59E0B); // Amber

  // Light Theme Colors
  static const Color lightBackground = Color(0xFFFAFAFA);
  static const Color lightSurface = Color(0xFFFFFFFF);
  static const Color lightOnSurface = Color(0xFF1F2937);

  // Dark Theme Colors
  static const Color darkBackground = Color(0xFF111827);
  static const Color darkSurface = Color(0xFF1F2937);
  static const Color darkOnSurface = Color(0xFFF9FAFB);

  // Text Colors
  static const Color textPrimary = Color(0xFF111827);
  static const Color textSecondary = Color(0xFF6B7280);
  static const Color textTertiary = Color(0xFF9CA3AF);
  static const Color textOnPrimary = Colors.white;

  // Status Colors
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);
  static const Color info = Color(0xFF3B82F6);

  // Aliases for backwards compatibility
  static const Color background = lightBackground;
  static const Color surface = lightSurface;
  static const Color onSurface = lightOnSurface;

  // Gray Scale
  static const Color gray50 = Color(0xFFF9FAFB);
  static const Color gray100 = Color(0xFFF3F4F6);
  static const Color gray200 = Color(0xFFE5E7EB);
  static const Color gray300 = Color(0xFFD1D5DB);
  static const Color gray400 = Color(0xFF9CA3AF);
  static const Color gray500 = Color(0xFF6B7280);
  static const Color gray600 = Color(0xFF4B5563);
  static const Color gray700 = Color(0xFF374151);
  static const Color gray800 = Color(0xFF1F2937);
  static const Color gray900 = Color(0xFF111827);

  // Additional aliases used across the app
  static const Color primaryColor = primary;
  static const Color text = textPrimary;
  static const Color surfaceVariant = gray100;
  static const Color outline = gray300;
  static const Color neutralLight = gray200;
  static const Color neutralDark = gray700;

  // Chart Colors
  static const List<Color> chartColors = [
    Color(0xFF6366F1), // Indigo
    Color(0xFF10B981), // Emerald
    Color(0xFFF59E0B), // Amber
    Color(0xFF3B82F6), // Blue
    Color(0xFFEC4899), // Pink
    Color(0xFF8B5CF6), // Purple
    Color(0xFF14B8A6), // Teal
    Color(0xFFF97316), // Orange
  ];

  // Mood Colors
  static const Color moodExcellent = Color(0xFF10B981);
  static const Color moodGood = Color(0xFF3B82F6);
  static const Color moodNeutral = Color(0xFFF59E0B);
  static const Color moodBad = Color(0xFFF97316);
  static const Color moodTerrible = Color(0xFFEF4444);

  // Progress Colors
  static const Color progressLow = Color(0xFFEF4444);
  static const Color progressMedium = Color(0xFFF59E0B);
  static const Color progressHigh = Color(0xFF10B981);
  static const Color progressComplete = Color(0xFF6366F1);

  // Gradient
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFF6366F1),
      Color(0xFF8B5CF6),
    ],
  );

  static const LinearGradient successGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFF10B981),
      Color(0xFF14B8A6),
    ],
  );
}
