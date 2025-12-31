/// PageTransitions.dart
///
/// Provides comprehensive page route transitions with platform-adaptive behavior
/// and Material motion patterns.
///
/// Features:
/// - 15+ transition types
/// - Platform-adaptive transitions (iOS/Android)
/// - Material motion system support
/// - Custom route builders
/// - Navigation 2.0 support
/// - Direction-aware transitions

library page_transitions;

import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/cupertino.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

/// Page transition type enumeration
enum PageTransitionType {
  fade,
  slideLeft,
  slideRight,
  slideUp,
  slideDown,
  scale,
  rotate,
  zoom,
  blur,
  sharedAxisHorizontal,
  sharedAxisVertical,
  sharedAxisScaled,
  fadeThrough,
  containerTransform,
  elevation,
  flipHorizontal,
  flipVertical,
  cube,
  stack,
  carousel,
  morph,
}

/// Configuration for page transitions
class PageTransitionConfig {
  final PageTransitionType type;
  final Duration duration;
  final Duration reverseDuration;
  final Curve curve;
  final Curve reverseCurve;
  final bool maintainState;
  final bool opaque;
  final bool barrierDismissible;
  final Color? barrierColor;
  final String? barrierLabel;

  const PageTransitionConfig({
    this.type = PageTransitionType.fade,
    this.duration = const Duration(milliseconds: 300),
    this.reverseDuration = const Duration(milliseconds: 300),
    this.curve = Curves.easeInOut,
    this.reverseCurve = Curves.easeInOut,
    this.maintainState = true,
    this.opaque = true,
    this.barrierDismissible = false,
    this.barrierColor,
    this.barrierLabel,
  });

  PageTransitionConfig copyWith({
    PageTransitionType? type,
    Duration? duration,
    Duration? reverseDuration,
    Curve? curve,
    Curve? reverseCurve,
    bool? maintainState,
    bool? opaque,
    bool? barrierDismissible,
    Color? barrierColor,
    String? barrierLabel,
  }) {
    return PageTransitionConfig(
      type: type ?? this.type,
      duration: duration ?? this.duration,
      reverseDuration: reverseDuration ?? this.reverseDuration,
      curve: curve ?? this.curve,
      reverseCurve: reverseCurve ?? this.reverseCurve,
      maintainState: maintainState ?? this.maintainState,
      opaque: opaque ?? this.opaque,
      barrierDismissible: barrierDismissible ?? this.barrierDismissible,
      barrierColor: barrierColor ?? this.barrierColor,
      barrierLabel: barrierLabel ?? this.barrierLabel,
    );
  }
}

/// Custom page route with configurable transitions
class CustomPageRoute<T> extends PageRoute<T> {
  final WidgetBuilder builder;
  final PageTransitionConfig config;

  CustomPageRoute({
    required this.builder,
    PageTransitionConfig? config,
    RouteSettings? settings,
  })  : config = config ?? const PageTransitionConfig(),
        super(settings: settings);

  @override
  Color? get barrierColor => config.barrierColor;

  @override
  String? get barrierLabel => config.barrierLabel;

  @override
  bool get maintainState => config.maintainState;

  @override
  bool get opaque => config.opaque;

  @override
  Duration get transitionDuration => config.duration;

  @override
  Duration get reverseTransitionDuration => config.reverseDuration;

  @override
  Widget buildPage(
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
  ) {
    return builder(context);
  }

  @override
  Widget buildTransitions(
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    return _PageTransitionBuilder.buildTransition(
      context: context,
      animation: animation,
      secondaryAnimation: secondaryAnimation,
      child: child,
      config: config,
    );
  }
}

/// Builder for page transitions
class _PageTransitionBuilder {
  static Widget buildTransition({
    required BuildContext context,
    required Animation<double> animation,
    required Animation<double> secondaryAnimation,
    required Widget child,
    required PageTransitionConfig config,
  }) {
    final curvedAnimation = CurvedAnimation(
      parent: animation,
      curve: config.curve,
      reverseCurve: config.reverseCurve,
    );

    switch (config.type) {
      case PageTransitionType.fade:
        return _buildFadeTransition(curvedAnimation, child);

      case PageTransitionType.slideLeft:
        return _buildSlideTransition(
          curvedAnimation,
          child,
          const Offset(-1.0, 0.0),
          Offset.zero,
        );

      case PageTransitionType.slideRight:
        return _buildSlideTransition(
          curvedAnimation,
          child,
          const Offset(1.0, 0.0),
          Offset.zero,
        );

      case PageTransitionType.slideUp:
        return _buildSlideTransition(
          curvedAnimation,
          child,
          const Offset(0.0, -1.0),
          Offset.zero,
        );

      case PageTransitionType.slideDown:
        return _buildSlideTransition(
          curvedAnimation,
          child,
          const Offset(0.0, 1.0),
          Offset.zero,
        );

      case PageTransitionType.scale:
        return _buildScaleTransition(curvedAnimation, child);

      case PageTransitionType.rotate:
        return _buildRotateTransition(curvedAnimation, child);

      case PageTransitionType.zoom:
        return _buildZoomTransition(curvedAnimation, child);

      case PageTransitionType.blur:
        return _buildBlurTransition(curvedAnimation, child);

      case PageTransitionType.sharedAxisHorizontal:
        return _buildSharedAxisTransition(
          curvedAnimation,
          secondaryAnimation,
          child,
          Axis.horizontal,
        );

      case PageTransitionType.sharedAxisVertical:
        return _buildSharedAxisTransition(
          curvedAnimation,
          secondaryAnimation,
          child,
          Axis.vertical,
        );

      case PageTransitionType.sharedAxisScaled:
        return _buildSharedAxisScaledTransition(
          curvedAnimation,
          secondaryAnimation,
          child,
        );

      case PageTransitionType.fadeThrough:
        return _buildFadeThroughTransition(
          curvedAnimation,
          secondaryAnimation,
          child,
        );

      case PageTransitionType.containerTransform:
        return _buildContainerTransform(curvedAnimation, child);

      case PageTransitionType.elevation:
        return _buildElevationTransition(curvedAnimation, child);

      case PageTransitionType.flipHorizontal:
        return _buildFlipTransition(curvedAnimation, child, Axis.horizontal);

      case PageTransitionType.flipVertical:
        return _buildFlipTransition(curvedAnimation, child, Axis.vertical);

      case PageTransitionType.cube:
        return _buildCubeTransition(
          curvedAnimation,
          secondaryAnimation,
          child,
        );

      case PageTransitionType.stack:
        return _buildStackTransition(
          curvedAnimation,
          secondaryAnimation,
          child,
        );

      case PageTransitionType.carousel:
        return _buildCarouselTransition(curvedAnimation, child);

      case PageTransitionType.morph:
        return _buildMorphTransition(curvedAnimation, child);
    }
  }

  static Widget _buildFadeTransition(
    Animation<double> animation,
    Widget child,
  ) {
    return FadeTransition(
      opacity: animation,
      child: child,
    );
  }

  static Widget _buildSlideTransition(
    Animation<double> animation,
    Widget child,
    Offset begin,
    Offset end,
  ) {
    return SlideTransition(
      position: Tween<Offset>(
        begin: begin,
        end: end,
      ).animate(animation),
      child: child,
    );
  }

  static Widget _buildScaleTransition(
    Animation<double> animation,
    Widget child,
  ) {
    return ScaleTransition(
      scale: Tween<double>(
        begin: 0.8,
        end: 1.0,
      ).animate(animation),
      child: FadeTransition(
        opacity: animation,
        child: child,
      ),
    );
  }

  static Widget _buildRotateTransition(
    Animation<double> animation,
    Widget child,
  ) {
    return RotationTransition(
      turns: Tween<double>(
        begin: 0.0,
        end: 1.0,
      ).animate(animation),
      child: FadeTransition(
        opacity: animation,
        child: child,
      ),
    );
  }

  static Widget _buildZoomTransition(
    Animation<double> animation,
    Widget child,
  ) {
    return AnimatedBuilder(
      animation: animation,
      builder: (context, child) {
        final scale = Tween<double>(
          begin: 1.5,
          end: 1.0,
        ).evaluate(animation);

        return Transform.scale(
          scale: scale,
          child: Opacity(
            opacity: animation.value,
            child: child,
          ),
        );
      },
      child: child,
    );
  }

  static Widget _buildBlurTransition(
    Animation<double> animation,
    Widget child,
  ) {
    return AnimatedBuilder(
      animation: animation,
      builder: (context, child) {
        final blur = 10.0 * (1.0 - animation.value);
        return ImageFiltered(
          imageFilter: ui.ImageFilter.blur(
            sigmaX: blur,
            sigmaY: blur,
          ),
          child: Opacity(
            opacity: animation.value,
            child: child,
          ),
        );
      },
      child: child,
    );
  }

  static Widget _buildSharedAxisTransition(
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
    Axis axis,
  ) {
    return AnimatedBuilder(
      animation: animation,
      builder: (context, child) {
        final incoming = Tween<Offset>(
          begin: axis == Axis.horizontal
              ? const Offset(0.3, 0.0)
              : const Offset(0.0, 0.3),
          end: Offset.zero,
        ).evaluate(animation);

        return SlideTransition(
          position: AlwaysStoppedAnimation(incoming),
          child: FadeTransition(
            opacity: animation,
            child: child,
          ),
        );
      },
      child: AnimatedBuilder(
        animation: secondaryAnimation,
        builder: (context, child) {
          final outgoing = Tween<Offset>(
            begin: Offset.zero,
            end: axis == Axis.horizontal
                ? const Offset(-0.3, 0.0)
                : const Offset(0.0, -0.3),
          ).evaluate(secondaryAnimation);

          return SlideTransition(
            position: AlwaysStoppedAnimation(outgoing),
            child: FadeTransition(
              opacity: Tween<double>(begin: 1.0, end: 0.0)
                  .animate(secondaryAnimation),
              child: child,
            ),
          );
        },
        child: child,
      ),
    );
  }

  static Widget _buildSharedAxisScaledTransition(
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    return AnimatedBuilder(
      animation: animation,
      builder: (context, child) {
        return ScaleTransition(
          scale: Tween<double>(begin: 0.8, end: 1.0).animate(animation),
          child: FadeTransition(
            opacity: animation,
            child: child,
          ),
        );
      },
      child: AnimatedBuilder(
        animation: secondaryAnimation,
        builder: (context, child) {
          return ScaleTransition(
            scale: Tween<double>(begin: 1.0, end: 1.1).animate(secondaryAnimation),
            child: FadeTransition(
              opacity: Tween<double>(begin: 1.0, end: 0.0)
                  .animate(secondaryAnimation),
              child: child,
            ),
          );
        },
        child: child,
      ),
    );
  }

  static Widget _buildFadeThroughTransition(
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    return AnimatedBuilder(
      animation: animation,
      builder: (context, child) {
        final t = animation.value;
        final opacity = t < 0.5 ? 0.0 : (t - 0.5) * 2.0;
        final scale = 0.92 + (0.08 * t);

        return Transform.scale(
          scale: scale,
          child: Opacity(
            opacity: opacity,
            child: child,
          ),
        );
      },
      child: AnimatedBuilder(
        animation: secondaryAnimation,
        builder: (context, child) {
          final t = secondaryAnimation.value;
          final opacity = t < 0.5 ? 1.0 - (t * 2.0) : 0.0;

          return Opacity(
            opacity: opacity,
            child: child,
          );
        },
        child: child,
      ),
    );
  }

  static Widget _buildContainerTransform(
    Animation<double> animation,
    Widget child,
  ) {
    return AnimatedBuilder(
      animation: animation,
      builder: (context, child) {
        final radius = ui.lerpDouble(0.0, 16.0, animation.value)!;

        return ClipRRect(
          borderRadius: BorderRadius.circular(radius),
          child: ScaleTransition(
            scale: Tween<double>(begin: 0.8, end: 1.0).animate(animation),
            child: FadeTransition(
              opacity: animation,
              child: child,
            ),
          ),
        );
      },
      child: child,
    );
  }

  static Widget _buildElevationTransition(
    Animation<double> animation,
    Widget child,
  ) {
    return AnimatedBuilder(
      animation: animation,
      builder: (context, child) {
        final elevation = ui.lerpDouble(0.0, 8.0, animation.value)!;

        return Material(
          elevation: elevation,
          child: FadeTransition(
            opacity: animation,
            child: child,
          ),
        );
      },
      child: child,
    );
  }

  static Widget _buildFlipTransition(
    Animation<double> animation,
    Widget child,
    Axis axis,
  ) {
    return AnimatedBuilder(
      animation: animation,
      builder: (context, child) {
        final angle = math.pi * animation.value;
        final transform = Matrix4.identity()
          ..setEntry(3, 2, 0.001);

        if (axis == Axis.horizontal) {
          transform.rotateY(angle);
        } else {
          transform.rotateX(angle);
        }

        return Transform(
          transform: transform,
          alignment: Alignment.center,
          child: child,
        );
      },
      child: child,
    );
  }

  static Widget _buildCubeTransition(
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    return AnimatedBuilder(
      animation: animation,
      builder: (context, child) {
        final angle = math.pi / 2 * animation.value;
        final transform = Matrix4.identity()
          ..setEntry(3, 2, 0.002)
          ..rotateY(-angle);

        return Transform(
          transform: transform,
          alignment: Alignment.centerRight,
          child: child,
        );
      },
      child: AnimatedBuilder(
        animation: secondaryAnimation,
        builder: (context, child) {
          final angle = math.pi / 2 * secondaryAnimation.value;
          final transform = Matrix4.identity()
            ..setEntry(3, 2, 0.002)
            ..rotateY(angle);

          return Transform(
            transform: transform,
            alignment: Alignment.centerLeft,
            child: child,
          );
        },
        child: child,
      ),
    );
  }

  static Widget _buildStackTransition(
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    return AnimatedBuilder(
      animation: animation,
      builder: (context, child) {
        return SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(0.0, 1.0),
            end: Offset.zero,
          ).animate(animation),
          child: child,
        );
      },
      child: AnimatedBuilder(
        animation: secondaryAnimation,
        builder: (context, child) {
          return Transform.scale(
            scale: 1.0 - (0.1 * secondaryAnimation.value),
            child: Opacity(
              opacity: 1.0 - (0.3 * secondaryAnimation.value),
              child: child,
            ),
          );
        },
        child: child,
      ),
    );
  }

  static Widget _buildCarouselTransition(
    Animation<double> animation,
    Widget child,
  ) {
    return AnimatedBuilder(
      animation: animation,
      builder: (context, child) {
        final angle = math.pi * 2 * (1.0 - animation.value);
        final transform = Matrix4.identity()
          ..setEntry(3, 2, 0.003)
          ..rotateY(angle)
          ..translate(0.0, 0.0, -200.0 * (1.0 - animation.value));

        return Transform(
          transform: transform,
          alignment: Alignment.center,
          child: Opacity(
            opacity: animation.value,
            child: child,
          ),
        );
      },
      child: child,
    );
  }

  static Widget _buildMorphTransition(
    Animation<double> animation,
    Widget child,
  ) {
    return AnimatedBuilder(
      animation: animation,
      builder: (context, child) {
        final scale = 0.8 + (0.2 * animation.value);
        final radius = ui.lerpDouble(100.0, 16.0, animation.value)!;

        return Transform.scale(
          scale: scale,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(radius),
            child: FadeTransition(
              opacity: animation,
              child: child,
            ),
          ),
        );
      },
      child: child,
    );
  }
}

/// Platform-adaptive page transition
class AdaptivePageRoute<T> extends PageRoute<T> {
  final WidgetBuilder builder;
  final PageTransitionConfig? config;

  AdaptivePageRoute({
    required this.builder,
    this.config,
    RouteSettings? settings,
  }) : super(settings: settings);

  @override
  Color? get barrierColor => null;

  @override
  String? get barrierLabel => null;

  @override
  bool get maintainState => true;

  @override
  Duration get transitionDuration =>
      config?.duration ?? const Duration(milliseconds: 300);

  @override
  Widget buildPage(
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
  ) {
    return builder(context);
  }

  @override
  Widget buildTransitions(
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    final platform = Theme.of(context).platform;

    if (config != null) {
      return _PageTransitionBuilder.buildTransition(
        context: context,
        animation: animation,
        secondaryAnimation: secondaryAnimation,
        child: child,
        config: config!,
      );
    }

    if (platform == TargetPlatform.iOS || platform == TargetPlatform.macOS) {
      return CupertinoPageTransition(
        primaryRouteAnimation: animation,
        secondaryRouteAnimation: secondaryAnimation,
        child: child,
        linearTransition: false,
      );
    }

    return _PageTransitionBuilder.buildTransition(
      context: context,
      animation: animation,
      secondaryAnimation: secondaryAnimation,
      child: child,
      config: const PageTransitionConfig(
        type: PageTransitionType.sharedAxisHorizontal,
      ),
    );
  }
}

/// Modal page route with custom transitions
class ModalPageRoute<T> extends PageRoute<T> {
  final WidgetBuilder builder;
  final PageTransitionConfig config;
  final bool fullscreenDialog;

  ModalPageRoute({
    required this.builder,
    PageTransitionConfig? config,
    this.fullscreenDialog = false,
    RouteSettings? settings,
  })  : config = config ?? const PageTransitionConfig(),
        super(settings: settings, fullscreenDialog: fullscreenDialog);

  @override
  Color? get barrierColor => config.barrierColor ?? Colors.black54;

  @override
  String? get barrierLabel => config.barrierLabel;

  @override
  bool get barrierDismissible => config.barrierDismissible;

  @override
  bool get maintainState => config.maintainState;

  @override
  bool get opaque => false;

  @override
  Duration get transitionDuration => config.duration;

  @override
  Duration get reverseTransitionDuration => config.reverseDuration;

  @override
  Widget buildPage(
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
  ) {
    return builder(context);
  }

  @override
  Widget buildTransitions(
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    return _PageTransitionBuilder.buildTransition(
      context: context,
      animation: animation,
      secondaryAnimation: secondaryAnimation,
      child: child,
      config: config,
    );
  }
}

/// Bottom sheet transition
class BottomSheetPageRoute<T> extends PageRoute<T> {
  final WidgetBuilder builder;
  final bool isDismissible;
  final Color? backgroundColor;
  final double? elevation;
  final ShapeBorder? shape;

  BottomSheetPageRoute({
    required this.builder,
    this.isDismissible = true,
    this.backgroundColor,
    this.elevation,
    this.shape,
    RouteSettings? settings,
  }) : super(settings: settings);

  @override
  Color? get barrierColor => Colors.black54;

  @override
  String? get barrierLabel => 'Dismiss';

  @override
  bool get barrierDismissible => isDismissible;

  @override
  bool get maintainState => true;

  @override
  bool get opaque => false;

  @override
  Duration get transitionDuration => const Duration(milliseconds: 300);

  @override
  Widget buildPage(
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
  ) {
    return builder(context);
  }

  @override
  Widget buildTransitions(
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    final curvedAnimation = CurvedAnimation(
      parent: animation,
      curve: Curves.easeOut,
      reverseCurve: Curves.easeIn,
    );

    return SlideTransition(
      position: Tween<Offset>(
        begin: const Offset(0.0, 1.0),
        end: Offset.zero,
      ).animate(curvedAnimation),
      child: Material(
        color: backgroundColor,
        elevation: elevation ?? 16.0,
        shape: shape ??
            const RoundedRectangleBorder(
              borderRadius: BorderRadius.vertical(
                top: Radius.circular(16.0),
              ),
            ),
        child: child,
      ),
    );
  }
}

/// Dialog transition
class DialogPageRoute<T> extends PageRoute<T> {
  final WidgetBuilder builder;
  final bool barrierDismissible;

  DialogPageRoute({
    required this.builder,
    this.barrierDismissible = true,
    RouteSettings? settings,
  }) : super(settings: settings);

  @override
  Color? get barrierColor => Colors.black54;

  @override
  String? get barrierLabel => 'Dismiss';

  @override
  bool get maintainState => true;

  @override
  bool get opaque => false;

  @override
  Duration get transitionDuration => const Duration(milliseconds: 200);

  @override
  Widget buildPage(
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
  ) {
    return builder(context);
  }

  @override
  Widget buildTransitions(
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    return ScaleTransition(
      scale: Tween<double>(
        begin: 0.8,
        end: 1.0,
      ).animate(
        CurvedAnimation(
          parent: animation,
          curve: Curves.easeOutCubic,
        ),
      ),
      child: FadeTransition(
        opacity: animation,
        child: child,
      ),
    );
  }
}

/// Fullscreen transition
class FullscreenPageRoute<T> extends PageRoute<T> {
  final WidgetBuilder builder;
  final PageTransitionConfig config;

  FullscreenPageRoute({
    required this.builder,
    PageTransitionConfig? config,
    RouteSettings? settings,
  })  : config = config ??
            const PageTransitionConfig(
              type: PageTransitionType.fade,
            ),
        super(settings: settings, fullscreenDialog: true);

  @override
  Color? get barrierColor => null;

  @override
  String? get barrierLabel => null;

  @override
  bool get maintainState => true;

  @override
  bool get opaque => true;

  @override
  Duration get transitionDuration => config.duration;

  @override
  Widget buildPage(
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
  ) {
    return builder(context);
  }

  @override
  Widget buildTransitions(
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    return _PageTransitionBuilder.buildTransition(
      context: context,
      animation: animation,
      secondaryAnimation: secondaryAnimation,
      child: child,
      config: config,
    );
  }
}

/// Navigation extension for easy page transitions
extension PageTransitionNavigation on NavigatorState {
  /// Push with custom transition
  Future<T?> pushWithTransition<T>({
    required Widget page,
    PageTransitionConfig? config,
  }) {
    return push<T>(
      CustomPageRoute<T>(
        builder: (context) => page,
        config: config,
      ),
    );
  }

  /// Push with platform-adaptive transition
  Future<T?> pushAdaptive<T>({
    required Widget page,
    PageTransitionConfig? config,
  }) {
    return push<T>(
      AdaptivePageRoute<T>(
        builder: (context) => page,
        config: config,
      ),
    );
  }

  /// Push modal with transition
  Future<T?> pushModal<T>({
    required Widget page,
    PageTransitionConfig? config,
    bool fullscreenDialog = false,
  }) {
    return push<T>(
      ModalPageRoute<T>(
        builder: (context) => page,
        config: config,
        fullscreenDialog: fullscreenDialog,
      ),
    );
  }

  /// Show bottom sheet with transition
  Future<T?> showBottomSheetPage<T>({
    required Widget page,
    bool isDismissible = true,
    Color? backgroundColor,
    double? elevation,
    ShapeBorder? shape,
  }) {
    return push<T>(
      BottomSheetPageRoute<T>(
        builder: (context) => page,
        isDismissible: isDismissible,
        backgroundColor: backgroundColor,
        elevation: elevation,
        shape: shape,
      ),
    );
  }

  /// Show dialog with transition
  Future<T?> showDialogPage<T>({
    required Widget page,
    bool barrierDismissible = true,
  }) {
    return push<T>(
      DialogPageRoute<T>(
        builder: (context) => page,
        barrierDismissible: barrierDismissible,
      ),
    );
  }

  /// Show fullscreen with transition
  Future<T?> showFullscreen<T>({
    required Widget page,
    PageTransitionConfig? config,
  }) {
    return push<T>(
      FullscreenPageRoute<T>(
        builder: (context) => page,
        config: config,
      ),
    );
  }
}

/// Navigation helper for BuildContext
extension PageTransitionContext on BuildContext {
  /// Push with custom transition
  Future<T?> pushWithTransition<T>({
    required Widget page,
    PageTransitionConfig? config,
  }) {
    return Navigator.of(this).pushWithTransition<T>(
      page: page,
      config: config,
    );
  }

  /// Push with platform-adaptive transition
  Future<T?> pushAdaptive<T>({
    required Widget page,
    PageTransitionConfig? config,
  }) {
    return Navigator.of(this).pushAdaptive<T>(
      page: page,
      config: config,
    );
  }

  /// Push modal with transition
  Future<T?> pushModal<T>({
    required Widget page,
    PageTransitionConfig? config,
    bool fullscreenDialog = false,
  }) {
    return Navigator.of(this).pushModal<T>(
      page: page,
      config: config,
      fullscreenDialog: fullscreenDialog,
    );
  }

  /// Show bottom sheet with transition
  Future<T?> showBottomSheetPage<T>({
    required Widget page,
    bool isDismissible = true,
    Color? backgroundColor,
    double? elevation,
    ShapeBorder? shape,
  }) {
    return Navigator.of(this).showBottomSheetPage<T>(
      page: page,
      isDismissible: isDismissible,
      backgroundColor: backgroundColor,
      elevation: elevation,
      shape: shape,
    );
  }

  /// Show dialog with transition
  Future<T?> showDialogPage<T>({
    required Widget page,
    bool barrierDismissible = true,
  }) {
    return Navigator.of(this).showDialogPage<T>(
      page: page,
      barrierDismissible: barrierDismissible,
    );
  }

  /// Show fullscreen with transition
  Future<T?> showFullscreen<T>({
    required Widget page,
    PageTransitionConfig? config,
  }) {
    return Navigator.of(this).showFullscreen<T>(
      page: page,
      config: config,
    );
  }
}

/// Transition presets for common use cases
class PageTransitionPresets {
  static const PageTransitionConfig fadeIn = PageTransitionConfig(
    type: PageTransitionType.fade,
    duration: Duration(milliseconds: 200),
  );

  static const PageTransitionConfig slideFromRight = PageTransitionConfig(
    type: PageTransitionType.slideLeft,
    duration: Duration(milliseconds: 300),
    curve: Curves.easeInOut,
  );

  static const PageTransitionConfig slideFromBottom = PageTransitionConfig(
    type: PageTransitionType.slideUp,
    duration: Duration(milliseconds: 300),
    curve: Curves.easeOut,
  );

  static const PageTransitionConfig scaleUp = PageTransitionConfig(
    type: PageTransitionType.scale,
    duration: Duration(milliseconds: 250),
    curve: Curves.easeOutCubic,
  );

  static const PageTransitionConfig sharedAxis = PageTransitionConfig(
    type: PageTransitionType.sharedAxisHorizontal,
    duration: Duration(milliseconds: 300),
    curve: Curves.easeInOut,
  );

  static const PageTransitionConfig fadeThrough = PageTransitionConfig(
    type: PageTransitionType.fadeThrough,
    duration: Duration(milliseconds: 300),
    curve: Curves.easeInOut,
  );

  static const PageTransitionConfig containerTransform = PageTransitionConfig(
    type: PageTransitionType.containerTransform,
    duration: Duration(milliseconds: 400),
    curve: Curves.easeInOutCubic,
  );

  static const PageTransitionConfig modalSlideUp = PageTransitionConfig(
    type: PageTransitionType.slideUp,
    duration: Duration(milliseconds: 350),
    curve: Curves.easeOutCubic,
    barrierColor: Colors.black54,
  );
}
