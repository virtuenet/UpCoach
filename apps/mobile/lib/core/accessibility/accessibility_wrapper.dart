import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'accessibility_service.dart';

/// Wraps the app with accessibility features and settings
class AccessibilityWrapper extends ConsumerStatefulWidget {
  final Widget child;

  const AccessibilityWrapper({
    super.key,
    required this.child,
  });

  @override
  ConsumerState<AccessibilityWrapper> createState() =>
      _AccessibilityWrapperState();
}

class _AccessibilityWrapperState extends ConsumerState<AccessibilityWrapper>
    with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAccessibilityFeatures() {
    // Update accessibility state when system settings change
    final mediaQuery = MediaQuery.of(context);
    ref.read(accessibilityProvider.notifier).updateFromMediaQuery(mediaQuery);
  }

  @override
  Widget build(BuildContext context) {
    final a11yState = ref.watch(accessibilityProvider);

    return MediaQuery(
      data: MediaQuery.of(context).copyWith(
        // Apply text scaling
        textScaler: TextScaler.linear(a11yState.effectiveTextScale),
        // Propagate bold text preference
        boldText: a11yState.boldText,
        // Propagate high contrast preference
        highContrast: a11yState.highContrast,
        // Propagate reduce motion preference
        disableAnimations: a11yState.reduceMotion,
      ),
      child: _AccessibilityThemeWrapper(
        state: a11yState,
        child: widget.child,
      ),
    );
  }
}

/// Internal wrapper for theme modifications based on accessibility settings
class _AccessibilityThemeWrapper extends StatelessWidget {
  final AccessibilityState state;
  final Widget child;

  const _AccessibilityThemeWrapper({
    required this.state,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    // If high contrast is enabled, modify the theme
    if (state.highContrast) {
      return Theme(
        data: _applyHighContrast(theme),
        child: child,
      );
    }

    // If reduce transparency is enabled
    if (state.reduceTransparency) {
      return Theme(
        data: _applyReducedTransparency(theme),
        child: child,
      );
    }

    return child;
  }

  ThemeData _applyHighContrast(ThemeData theme) {
    // Increase contrast for colors
    return theme.copyWith(
      colorScheme: theme.colorScheme.copyWith(
        // Ensure strong contrast between surface and onSurface
        surface:
            theme.brightness == Brightness.light ? Colors.white : Colors.black,
        onSurface:
            theme.brightness == Brightness.light ? Colors.black : Colors.white,
      ),
      // Make text more prominent
      textTheme: theme.textTheme.apply(
        bodyColor:
            theme.brightness == Brightness.light ? Colors.black : Colors.white,
        displayColor:
            theme.brightness == Brightness.light ? Colors.black : Colors.white,
      ),
      // Stronger dividers
      dividerColor: theme.brightness == Brightness.light
          ? Colors.black45
          : Colors.white54,
      // Stronger icons
      iconTheme: theme.iconTheme.copyWith(
        color: theme.brightness == Brightness.light
            ? Colors.black87
            : Colors.white,
      ),
    );
  }

  ThemeData _applyReducedTransparency(ThemeData theme) {
    return theme.copyWith(
      // Make cards fully opaque
      cardTheme: theme.cardTheme.copyWith(
        color: theme.cardColor.withValues(alpha: 1.0),
      ),
      // Make dialog backgrounds fully opaque
      dialogTheme: theme.dialogTheme.copyWith(
        backgroundColor:
            (theme.dialogTheme.backgroundColor ?? theme.colorScheme.surface)
                .withValues(alpha: 1.0),
      ),
      // Make bottom sheet fully opaque
      bottomSheetTheme: theme.bottomSheetTheme.copyWith(
        backgroundColor: (theme.bottomSheetTheme.backgroundColor ??
                theme.colorScheme.surface)
            .withValues(alpha: 1.0),
      ),
    );
  }
}

/// Helper widget to animate changes respecting reduce motion preference
class AccessibleAnimatedContainer extends StatelessWidget {
  final Widget child;
  final Duration duration;
  final Curve curve;
  final AlignmentGeometry? alignment;
  final EdgeInsetsGeometry? padding;
  final Color? color;
  final Decoration? decoration;
  final BoxConstraints? constraints;
  final double? width;
  final double? height;

  const AccessibleAnimatedContainer({
    super.key,
    required this.child,
    this.duration = const Duration(milliseconds: 300),
    this.curve = Curves.easeInOut,
    this.alignment,
    this.padding,
    this.color,
    this.decoration,
    this.constraints,
    this.width,
    this.height,
  });

  @override
  Widget build(BuildContext context) {
    final reduceMotion = MediaQuery.of(context).disableAnimations;

    return AnimatedContainer(
      duration: reduceMotion ? Duration.zero : duration,
      curve: curve,
      alignment: alignment,
      padding: padding,
      color: color,
      decoration: decoration,
      constraints: constraints,
      width: width,
      height: height,
      child: child,
    );
  }
}

/// Helper widget for fade transitions respecting reduce motion
class AccessibleFadeTransition extends StatelessWidget {
  final Widget child;
  final Animation<double> opacity;

  const AccessibleFadeTransition({
    super.key,
    required this.child,
    required this.opacity,
  });

  @override
  Widget build(BuildContext context) {
    final reduceMotion = MediaQuery.of(context).disableAnimations;

    if (reduceMotion) {
      return child;
    }

    return FadeTransition(
      opacity: opacity,
      child: child,
    );
  }
}

/// Helper widget for scale transitions respecting reduce motion
class AccessibleScaleTransition extends StatelessWidget {
  final Widget child;
  final Animation<double> scale;

  const AccessibleScaleTransition({
    super.key,
    required this.child,
    required this.scale,
  });

  @override
  Widget build(BuildContext context) {
    final reduceMotion = MediaQuery.of(context).disableAnimations;

    if (reduceMotion) {
      return child;
    }

    return ScaleTransition(
      scale: scale,
      child: child,
    );
  }
}

/// Helper widget for slide transitions respecting reduce motion
class AccessibleSlideTransition extends StatelessWidget {
  final Widget child;
  final Animation<Offset> position;

  const AccessibleSlideTransition({
    super.key,
    required this.child,
    required this.position,
  });

  @override
  Widget build(BuildContext context) {
    final reduceMotion = MediaQuery.of(context).disableAnimations;

    if (reduceMotion) {
      return child;
    }

    return SlideTransition(
      position: position,
      child: child,
    );
  }
}

/// Custom page route that respects reduce motion setting
class AccessiblePageRoute<T> extends MaterialPageRoute<T> {
  AccessiblePageRoute({
    required super.builder,
    super.settings,
    super.maintainState,
    super.fullscreenDialog,
  });

  @override
  Duration get transitionDuration {
    // Will be overridden at runtime based on context
    return const Duration(milliseconds: 300);
  }

  @override
  Widget buildTransitions(
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    final reduceMotion = MediaQuery.of(context).disableAnimations;

    if (reduceMotion) {
      // No animation, just show the page
      return child;
    }

    return super.buildTransitions(
      context,
      animation,
      secondaryAnimation,
      child,
    );
  }
}
