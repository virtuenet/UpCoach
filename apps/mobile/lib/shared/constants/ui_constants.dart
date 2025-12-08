// UI Constants for consistent sizing and spacing across the app
class UIConstants {
  // Touch target sizes (following Material Design guidelines)
  static const double minTouchTarget = 48.0;
  static const double buttonHeight =
      56.0; // Increased from 48 for better accessibility
  static const double iconButtonSize = 44.0;
  static const double fabSize = 56.0;

  // Spacing
  static const double spacingXS = 4.0;
  static const double spacingSM = 8.0;
  static const double spacingMD = 16.0;
  static const double spacingLG = 24.0;
  static const double spacingXL = 32.0;
  static const double spacing2XL = 48.0;
  static const double spacing3XL = 64.0;

  // Border radius
  static const double radiusSM = 4.0;
  static const double radiusMD = 8.0;
  static const double radiusLG = 12.0;
  static const double radiusXL = 16.0;
  static const double radiusFull = 999.0;

  // Animation durations
  static const Duration animationFast = Duration(milliseconds: 200);
  static const Duration animationNormal = Duration(milliseconds: 300);
  static const Duration animationSlow = Duration(milliseconds: 500);

  // Elevation
  static const double elevationSM = 2.0;
  static const double elevationMD = 4.0;
  static const double elevationLG = 8.0;
  static const double elevationXL = 16.0;

  // Content sizing
  static const double maxContentWidth = 600.0;
  static const double cardMinHeight = 120.0;
  static const double listItemHeight = 72.0;

  // App bar
  static const double appBarHeight = 56.0;
  static const double bottomNavHeight = 60.0;

  // Form elements
  static const double inputHeight = 56.0;
  static const double inputBorderWidth = 1.0;
  static const double inputFocusBorderWidth = 2.0;

  // Loading indicators
  static const double loadingIndicatorSize = 48.0;
  static const double loadingIndicatorStrokeWidth = 4.0;

  // Avatar sizes
  static const double avatarSM = 32.0;
  static const double avatarMD = 48.0;
  static const double avatarLG = 64.0;
  static const double avatarXL = 96.0;

  // Grid
  static const int gridColumnsPhone = 2;
  static const int gridColumnsTablet = 3;
  static const int gridColumnsDesktop = 4;
  static const double gridSpacing = 16.0;

  // Breakpoints
  static const double breakpointSM = 600.0;
  static const double breakpointMD = 960.0;
  static const double breakpointLG = 1280.0;
  static const double breakpointXL = 1920.0;
}
