import 'package:flutter/material.dart';
import '../constants/ui_constants.dart';

/// Responsive builder widget that provides different layouts based on screen size
class ResponsiveBuilder extends StatelessWidget {
  final Widget mobile;
  final Widget? tablet;
  final Widget? desktop;

  const ResponsiveBuilder({
    super.key,
    required this.mobile,
    this.tablet,
    this.desktop,
  });

  static bool isMobile(BuildContext context) =>
      MediaQuery.of(context).size.width < UIConstants.breakpointSM;

  static bool isTablet(BuildContext context) =>
      MediaQuery.of(context).size.width >= UIConstants.breakpointSM &&
      MediaQuery.of(context).size.width < UIConstants.breakpointMD;

  static bool isDesktop(BuildContext context) =>
      MediaQuery.of(context).size.width >= UIConstants.breakpointMD;

  static double getContentMaxWidth(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    if (screenWidth >= UIConstants.breakpointLG) {
      return UIConstants.breakpointMD; // Cap content width on large screens
    } else if (screenWidth >= UIConstants.breakpointMD) {
      return screenWidth * 0.85;
    } else if (screenWidth >= UIConstants.breakpointSM) {
      return screenWidth * 0.9;
    }
    return screenWidth; // Full width on mobile
  }

  static int getGridColumns(BuildContext context) {
    if (isDesktop(context)) return UIConstants.gridColumnsDesktop;
    if (isTablet(context)) return UIConstants.gridColumnsTablet;
    return UIConstants.gridColumnsPhone;
  }

  static EdgeInsets getScreenPadding(BuildContext context) {
    if (isDesktop(context)) {
      return const EdgeInsets.all(UIConstants.spacingXL);
    } else if (isTablet(context)) {
      return const EdgeInsets.all(UIConstants.spacingLG);
    }
    return const EdgeInsets.all(UIConstants.spacingMD);
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;

    if (screenWidth >= UIConstants.breakpointMD && desktop != null) {
      return desktop!;
    }

    if (screenWidth >= UIConstants.breakpointSM && tablet != null) {
      return tablet!;
    }

    return mobile;
  }
}

/// Responsive container that centers content on larger screens
class ResponsiveContainer extends StatelessWidget {
  final Widget child;
  final double? maxWidth;
  final EdgeInsets? padding;

  const ResponsiveContainer({
    super.key,
    required this.child,
    this.maxWidth,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        constraints: BoxConstraints(
          maxWidth: maxWidth ?? ResponsiveBuilder.getContentMaxWidth(context),
        ),
        padding: padding ?? ResponsiveBuilder.getScreenPadding(context),
        child: child,
      ),
    );
  }
}

/// Responsive grid widget
class ResponsiveGrid extends StatelessWidget {
  final List<Widget> children;
  final double spacing;
  final double runSpacing;

  const ResponsiveGrid({
    super.key,
    required this.children,
    this.spacing = UIConstants.gridSpacing,
    this.runSpacing = UIConstants.gridSpacing,
  });

  @override
  Widget build(BuildContext context) {
    final columns = ResponsiveBuilder.getGridColumns(context);
    
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: columns,
      crossAxisSpacing: spacing,
      mainAxisSpacing: runSpacing,
      children: children,
    );
  }
}