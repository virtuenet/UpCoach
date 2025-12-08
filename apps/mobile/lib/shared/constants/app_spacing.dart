import 'package:flutter/material.dart';

/// App spacing constants for consistent layout
class AppSpacing {
  AppSpacing._();

  // Base unit
  static const double unit = 8.0;

  // Spacing values
  static const double xxs = 2.0;
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 16.0;
  static const double lg = 24.0;
  static const double xl = 32.0;
  static const double xxl = 48.0;
  static const double xxxl = 64.0;

  // Padding presets
  static const EdgeInsets paddingXS = EdgeInsets.all(xs);
  static const EdgeInsets paddingSM = EdgeInsets.all(sm);
  static const EdgeInsets paddingMD = EdgeInsets.all(md);
  static const EdgeInsets paddingLG = EdgeInsets.all(lg);
  static const EdgeInsets paddingXL = EdgeInsets.all(xl);

  // Horizontal padding
  static const EdgeInsets paddingHorizontalXS =
      EdgeInsets.symmetric(horizontal: xs);
  static const EdgeInsets paddingHorizontalSM =
      EdgeInsets.symmetric(horizontal: sm);
  static const EdgeInsets paddingHorizontalMD =
      EdgeInsets.symmetric(horizontal: md);
  static const EdgeInsets paddingHorizontalLG =
      EdgeInsets.symmetric(horizontal: lg);
  static const EdgeInsets paddingHorizontalXL =
      EdgeInsets.symmetric(horizontal: xl);

  // Vertical padding
  static const EdgeInsets paddingVerticalXS =
      EdgeInsets.symmetric(vertical: xs);
  static const EdgeInsets paddingVerticalSM =
      EdgeInsets.symmetric(vertical: sm);
  static const EdgeInsets paddingVerticalMD =
      EdgeInsets.symmetric(vertical: md);
  static const EdgeInsets paddingVerticalLG =
      EdgeInsets.symmetric(vertical: lg);
  static const EdgeInsets paddingVerticalXL =
      EdgeInsets.symmetric(vertical: xl);

  // Screen padding
  static const EdgeInsets screenPadding =
      EdgeInsets.symmetric(horizontal: md, vertical: sm);
  static const EdgeInsets cardPadding = EdgeInsets.all(md);
  static const EdgeInsets listPadding = EdgeInsets.symmetric(horizontal: md);

  // Gap widgets
  static const SizedBox gapXS = SizedBox(width: xs, height: xs);
  static const SizedBox gapSM = SizedBox(width: sm, height: sm);
  static const SizedBox gapMD = SizedBox(width: md, height: md);
  static const SizedBox gapLG = SizedBox(width: lg, height: lg);
  static const SizedBox gapXL = SizedBox(width: xl, height: xl);

  // Horizontal gaps
  static const SizedBox hGapXS = SizedBox(width: xs);
  static const SizedBox hGapSM = SizedBox(width: sm);
  static const SizedBox hGapMD = SizedBox(width: md);
  static const SizedBox hGapLG = SizedBox(width: lg);
  static const SizedBox hGapXL = SizedBox(width: xl);

  // Vertical gaps
  static const SizedBox vGapXS = SizedBox(height: xs);
  static const SizedBox vGapSM = SizedBox(height: sm);
  static const SizedBox vGapMD = SizedBox(height: md);
  static const SizedBox vGapLG = SizedBox(height: lg);
  static const SizedBox vGapXL = SizedBox(height: xl);
}

/// Margins alias for backwards compatibility
class Margins {
  Margins._();

  static const double small = AppSpacing.sm;
  static const double medium = AppSpacing.md;
  static const double large = AppSpacing.lg;
  static const double extraLarge = AppSpacing.xl;
}

/// HtmlPaddings for web content
class HtmlPaddings {
  HtmlPaddings._();

  static const double content = AppSpacing.md;
  static const double image = AppSpacing.sm;
}
