/// SharedElementTransitions.dart
///
/// Provides comprehensive shared element transition system with Hero animations,
/// custom flight shuttles, and Material motion patterns.
///
/// Features:
/// - 20+ hero types for different UI elements
/// - Custom flight shuttle builders with advanced interpolation
/// - Photo view transitions (thumbnail to full screen)
/// - List to detail transitions with choreography
/// - Gesture-driven and interruptible animations
/// - Performance optimized for 60 FPS
/// - Accessibility support with reduced motion

library shared_element_transitions;

import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';

/// Hero tag types for type-safe hero animations
enum HeroType {
  goalCard,
  habitCard,
  sessionCard,
  profileAvatar,
  coachAvatar,
  achievementBadge,
  statisticCard,
  chartGraph,
  imageGallery,
  videoThumbnail,
  documentPreview,
  notificationBadge,
  progressIndicator,
  buttonToScreen,
  fabExpansion,
  tabTransition,
  bottomSheetExpansion,
  dialogExpansion,
  carouselItem,
  timelineEvent,
}

/// Transition style for shared elements
enum TransitionStyle {
  fade,
  scale,
  slide,
  rotate,
  morph,
  fadeThrough,
  sharedAxis,
  containerTransform,
}

/// Choreography pattern for multiple animations
enum ChoreographyPattern {
  sequential,
  staggered,
  parallel,
  cascade,
}

/// Configuration for shared element transitions
class SharedElementConfig {
  final Duration duration;
  final Curve curve;
  final TransitionStyle style;
  final bool useReducedMotion;
  final bool enableHapticFeedback;
  final ChoreographyPattern choreography;
  final Duration staggerDelay;
  final double scaleFactor;
  final Offset slideOffset;
  final double rotationAngle;

  const SharedElementConfig({
    this.duration = const Duration(milliseconds: 300),
    this.curve = Curves.easeInOut,
    this.style = TransitionStyle.morph,
    this.useReducedMotion = false,
    this.enableHapticFeedback = true,
    this.choreography = ChoreographyPattern.parallel,
    this.staggerDelay = const Duration(milliseconds: 50),
    this.scaleFactor = 1.1,
    this.slideOffset = const Offset(0, 20),
    this.rotationAngle = 0.0,
  });

  SharedElementConfig copyWith({
    Duration? duration,
    Curve? curve,
    TransitionStyle? style,
    bool? useReducedMotion,
    bool? enableHapticFeedback,
    ChoreographyPattern? choreography,
    Duration? staggerDelay,
    double? scaleFactor,
    Offset? slideOffset,
    double? rotationAngle,
  }) {
    return SharedElementConfig(
      duration: duration ?? this.duration,
      curve: curve ?? this.curve,
      style: style ?? this.style,
      useReducedMotion: useReducedMotion ?? this.useReducedMotion,
      enableHapticFeedback: enableHapticFeedback ?? this.enableHapticFeedback,
      choreography: choreography ?? this.choreography,
      staggerDelay: staggerDelay ?? this.staggerDelay,
      scaleFactor: scaleFactor ?? this.scaleFactor,
      slideOffset: slideOffset ?? this.slideOffset,
      rotationAngle: rotationAngle ?? this.rotationAngle,
    );
  }
}

/// Generate a unique hero tag for type safety
class HeroTag {
  final HeroType type;
  final String id;
  final String? subId;

  const HeroTag({
    required this.type,
    required this.id,
    this.subId,
  });

  @override
  String toString() =>
      'hero_${type.name}_${id}${subId != null ? '_$subId' : ''}';

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is HeroTag &&
          type == other.type &&
          id == other.id &&
          subId == other.subId;

  @override
  int get hashCode => Object.hash(type, id, subId);
}

/// Main service for managing shared element transitions
class SharedElementTransitionService {
  static final SharedElementTransitionService _instance =
      SharedElementTransitionService._internal();

  factory SharedElementTransitionService() => _instance;

  SharedElementTransitionService._internal();

  final Map<String, SharedElementConfig> _configurations = {};
  final Map<String, AnimationController> _activeControllers = {};
  bool _reducedMotionEnabled = false;

  /// Initialize with system accessibility settings
  void initialize({bool? reducedMotion}) {
    _reducedMotionEnabled = reducedMotion ?? false;
  }

  /// Register a configuration for a hero tag
  void registerConfig(String tag, SharedElementConfig config) {
    _configurations[tag] = config;
  }

  /// Get configuration for a hero tag
  SharedElementConfig getConfig(String tag) {
    return _configurations[tag] ??
        SharedElementConfig(
          useReducedMotion: _reducedMotionEnabled,
        );
  }

  /// Track an active animation controller
  void trackController(String tag, AnimationController controller) {
    _activeControllers[tag] = controller;
  }

  /// Remove a tracked controller
  void removeController(String tag) {
    _activeControllers.remove(tag);
  }

  /// Stop all active animations
  void stopAllAnimations() {
    for (final controller in _activeControllers.values) {
      controller.stop();
    }
    _activeControllers.clear();
  }

  /// Get active animation count for performance monitoring
  int get activeAnimationCount => _activeControllers.length;

  /// Dispose resources
  void dispose() {
    stopAllAnimations();
    _configurations.clear();
  }
}

/// Custom flight shuttle builder for advanced hero animations
class CustomFlightShuttleBuilder {
  /// Create a flight shuttle with fade and scale transition
  static Widget fadeScale(
    BuildContext flightContext,
    Animation<double> animation,
    HeroFlightDirection flightDirection,
    BuildContext fromHeroContext,
    BuildContext toHeroContext,
  ) {
    final Hero toHero = toHeroContext.widget as Hero;
    final curvedAnimation = CurvedAnimation(
      parent: animation,
      curve: Curves.easeInOut,
    );

    return AnimatedBuilder(
      animation: curvedAnimation,
      builder: (context, child) {
        final opacity = flightDirection == HeroFlightDirection.push
            ? Curves.easeIn.transform(curvedAnimation.value)
            : Curves.easeOut.transform(curvedAnimation.value);

        final scale = flightDirection == HeroFlightDirection.push
            ? 0.8 + (0.2 * curvedAnimation.value)
            : 1.0 + (0.2 * (1 - curvedAnimation.value));

        return Opacity(
          opacity: opacity,
          child: Transform.scale(
            scale: scale,
            child: child,
          ),
        );
      },
      child: toHero.child,
    );
  }

  /// Create a flight shuttle with rotation transition
  static Widget rotate(
    BuildContext flightContext,
    Animation<double> animation,
    HeroFlightDirection flightDirection,
    BuildContext fromHeroContext,
    BuildContext toHeroContext,
  ) {
    final Hero toHero = toHeroContext.widget as Hero;
    final curvedAnimation = CurvedAnimation(
      parent: animation,
      curve: Curves.easeInOutCubic,
    );

    return AnimatedBuilder(
      animation: curvedAnimation,
      builder: (context, child) {
        final rotationAngle = flightDirection == HeroFlightDirection.push
            ? math.pi * 2 * curvedAnimation.value
            : -math.pi * 2 * curvedAnimation.value;

        return Transform.rotate(
          angle: rotationAngle,
          child: child,
        );
      },
      child: toHero.child,
    );
  }

  /// Create a flight shuttle with morph transition
  static Widget morph(
    BuildContext flightContext,
    Animation<double> animation,
    HeroFlightDirection flightDirection,
    BuildContext fromHeroContext,
    BuildContext toHeroContext,
  ) {
    final Hero fromHero = fromHeroContext.widget as Hero;
    final Hero toHero = toHeroContext.widget as Hero;

    final fromBox = fromHeroContext.findRenderObject() as RenderBox?;
    final toBox = toHeroContext.findRenderObject() as RenderBox?;

    if (fromBox == null || toBox == null) {
      return toHero.child;
    }

    final curvedAnimation = CurvedAnimation(
      parent: animation,
      curve: Curves.easeInOutCubic,
    );

    return AnimatedBuilder(
      animation: curvedAnimation,
      builder: (context, child) {
        final fromSize = fromBox.size;
        final toSize = toBox.size;

        final width = ui.lerpDouble(
          fromSize.width,
          toSize.width,
          curvedAnimation.value,
        )!;
        final height = ui.lerpDouble(
          fromSize.height,
          toSize.height,
          curvedAnimation.value,
        )!;

        return SizedBox(
          width: width,
          height: height,
          child: child,
        );
      },
      child: flightDirection == HeroFlightDirection.push
          ? toHero.child
          : fromHero.child,
    );
  }

  /// Create a flight shuttle with blur transition
  static Widget blur(
    BuildContext flightContext,
    Animation<double> animation,
    HeroFlightDirection flightDirection,
    BuildContext fromHeroContext,
    BuildContext toHeroContext,
  ) {
    final Hero toHero = toHeroContext.widget as Hero;
    final curvedAnimation = CurvedAnimation(
      parent: animation,
      curve: Curves.easeInOut,
    );

    return AnimatedBuilder(
      animation: curvedAnimation,
      builder: (context, child) {
        final blurAmount = flightDirection == HeroFlightDirection.push
            ? 10.0 * (1 - curvedAnimation.value)
            : 10.0 * curvedAnimation.value;

        return ImageFiltered(
          imageFilter: ui.ImageFilter.blur(
            sigmaX: blurAmount,
            sigmaY: blurAmount,
          ),
          child: child,
        );
      },
      child: toHero.child,
    );
  }

  /// Create a flight shuttle for photo view transition
  static Widget photoView(
    BuildContext flightContext,
    Animation<double> animation,
    HeroFlightDirection flightDirection,
    BuildContext fromHeroContext,
    BuildContext toHeroContext,
  ) {
    final Hero toHero = toHeroContext.widget as Hero;
    final curvedAnimation = CurvedAnimation(
      parent: animation,
      curve: Curves.easeInOutCubic,
    );

    return AnimatedBuilder(
      animation: curvedAnimation,
      builder: (context, child) {
        return ClipRRect(
          borderRadius: BorderRadius.circular(
            ui.lerpDouble(8.0, 0.0, curvedAnimation.value)!,
          ),
          child: child,
        );
      },
      child: toHero.child,
    );
  }

  /// Create a flight shuttle with elevation transition
  static Widget elevation(
    BuildContext flightContext,
    Animation<double> animation,
    HeroFlightDirection flightDirection,
    BuildContext fromHeroContext,
    BuildContext toHeroContext,
  ) {
    final Hero toHero = toHeroContext.widget as Hero;
    final curvedAnimation = CurvedAnimation(
      parent: animation,
      curve: Curves.easeInOutCubic,
    );

    return AnimatedBuilder(
      animation: curvedAnimation,
      builder: (context, child) {
        final elevation = flightDirection == HeroFlightDirection.push
            ? ui.lerpDouble(2.0, 8.0, curvedAnimation.value)!
            : ui.lerpDouble(8.0, 2.0, curvedAnimation.value)!;

        return Material(
          elevation: elevation,
          color: Colors.transparent,
          child: child,
        );
      },
      child: toHero.child,
    );
  }
}

/// Widget wrapper for shared element transitions
class SharedElement extends StatelessWidget {
  final HeroTag tag;
  final Widget child;
  final SharedElementConfig? config;
  final HeroFlightShuttleBuilder? flightShuttleBuilder;
  final bool enabled;

  const SharedElement({
    Key? key,
    required this.tag,
    required this.child,
    this.config,
    this.flightShuttleBuilder,
    this.enabled = true,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (!enabled) {
      return child;
    }

    final effectiveConfig =
        config ?? SharedElementTransitionService().getConfig(tag.toString());

    HeroFlightShuttleBuilder shuttleBuilder =
        flightShuttleBuilder ?? _getDefaultShuttleBuilder(effectiveConfig);

    if (effectiveConfig.useReducedMotion) {
      shuttleBuilder = _reducedMotionShuttleBuilder;
    }

    return Hero(
      tag: tag.toString(),
      flightShuttleBuilder: shuttleBuilder,
      child: child,
    );
  }

  HeroFlightShuttleBuilder _getDefaultShuttleBuilder(
    SharedElementConfig config,
  ) {
    switch (config.style) {
      case TransitionStyle.fade:
        return CustomFlightShuttleBuilder.fadeScale;
      case TransitionStyle.scale:
        return CustomFlightShuttleBuilder.fadeScale;
      case TransitionStyle.rotate:
        return CustomFlightShuttleBuilder.rotate;
      case TransitionStyle.morph:
        return CustomFlightShuttleBuilder.morph;
      case TransitionStyle.fadeThrough:
        return CustomFlightShuttleBuilder.blur;
      case TransitionStyle.containerTransform:
        return CustomFlightShuttleBuilder.elevation;
      default:
        return CustomFlightShuttleBuilder.morph;
    }
  }

  Widget _reducedMotionShuttleBuilder(
    BuildContext flightContext,
    Animation<double> animation,
    HeroFlightDirection flightDirection,
    BuildContext fromHeroContext,
    BuildContext toHeroContext,
  ) {
    final Hero toHero = toHeroContext.widget as Hero;
    return toHero.child;
  }
}

/// Photo view transition for image gallery
class PhotoViewTransition extends StatefulWidget {
  final HeroTag tag;
  final ImageProvider imageProvider;
  final BoxFit? fit;
  final VoidCallback? onTap;
  final String? semanticLabel;

  const PhotoViewTransition({
    Key? key,
    required this.tag,
    required this.imageProvider,
    this.fit,
    this.onTap,
    this.semanticLabel,
  }) : super(key: key);

  @override
  State<PhotoViewTransition> createState() => _PhotoViewTransitionState();
}

class _PhotoViewTransitionState extends State<PhotoViewTransition>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _opacityAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );

    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 1.1,
    ).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeInOut,
      ),
    );

    _opacityAnimation = Tween<double>(
      begin: 1.0,
      end: 0.9,
    ).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeInOut,
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleTapDown(TapDownDetails details) {
    _controller.forward();
  }

  void _handleTapUp(TapUpDetails details) {
    _controller.reverse();
    widget.onTap?.call();
  }

  void _handleTapCancel() {
    _controller.reverse();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: _handleTapDown,
      onTapUp: _handleTapUp,
      onTapCancel: _handleTapCancel,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          return Transform.scale(
            scale: _scaleAnimation.value,
            child: Opacity(
              opacity: _opacityAnimation.value,
              child: child,
            ),
          );
        },
        child: SharedElement(
          tag: widget.tag,
          flightShuttleBuilder: CustomFlightShuttleBuilder.photoView,
          child: Semantics(
            label: widget.semanticLabel ?? 'Photo',
            button: widget.onTap != null,
            child: Image(
              image: widget.imageProvider,
              fit: widget.fit ?? BoxFit.cover,
            ),
          ),
        ),
      ),
    );
  }
}

/// Card expansion transition
class CardExpansionTransition extends StatelessWidget {
  final HeroTag tag;
  final Widget child;
  final double? elevation;
  final Color? backgroundColor;
  final BorderRadius? borderRadius;
  final EdgeInsets? padding;

  const CardExpansionTransition({
    Key? key,
    required this.tag,
    required this.child,
    this.elevation,
    this.backgroundColor,
    this.borderRadius,
    this.padding,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SharedElement(
      tag: tag,
      config: const SharedElementConfig(
        style: TransitionStyle.containerTransform,
        duration: Duration(milliseconds: 400),
        curve: Curves.easeInOutCubic,
      ),
      child: Material(
        elevation: elevation ?? 2.0,
        color: backgroundColor ?? Theme.of(context).cardColor,
        borderRadius: borderRadius ?? BorderRadius.circular(12.0),
        child: Padding(
          padding: padding ?? const EdgeInsets.all(16.0),
          child: child,
        ),
      ),
    );
  }
}

/// Avatar transition with circular reveal
class AvatarTransition extends StatelessWidget {
  final HeroTag tag;
  final ImageProvider? imageProvider;
  final String? initials;
  final double radius;
  final Color? backgroundColor;

  const AvatarTransition({
    Key? key,
    required this.tag,
    this.imageProvider,
    this.initials,
    this.radius = 20.0,
    this.backgroundColor,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SharedElement(
      tag: tag,
      config: const SharedElementConfig(
        style: TransitionStyle.morph,
        duration: Duration(milliseconds: 350),
        curve: Curves.easeInOutCubic,
      ),
      child: CircleAvatar(
        radius: radius,
        backgroundColor: backgroundColor ?? Theme.of(context).primaryColor,
        backgroundImage: imageProvider,
        child: imageProvider == null && initials != null
            ? Text(
                initials!,
                style: TextStyle(
                  fontSize: radius * 0.6,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              )
            : null,
      ),
    );
  }
}

/// Text transition with style interpolation
class TextTransition extends StatefulWidget {
  final HeroTag tag;
  final String text;
  final TextStyle? fromStyle;
  final TextStyle? toStyle;
  final TextAlign? textAlign;
  final int? maxLines;

  const TextTransition({
    Key? key,
    required this.tag,
    required this.text,
    this.fromStyle,
    this.toStyle,
    this.textAlign,
    this.maxLines,
  }) : super(key: key);

  @override
  State<TextTransition> createState() => _TextTransitionState();
}

class _TextTransitionState extends State<TextTransition> {
  @override
  Widget build(BuildContext context) {
    return SharedElement(
      tag: widget.tag,
      flightShuttleBuilder: _textFlightShuttleBuilder,
      child: Text(
        widget.text,
        style: widget.toStyle ?? Theme.of(context).textTheme.bodyLarge,
        textAlign: widget.textAlign,
        maxLines: widget.maxLines,
      ),
    );
  }

  Widget _textFlightShuttleBuilder(
    BuildContext flightContext,
    Animation<double> animation,
    HeroFlightDirection flightDirection,
    BuildContext fromHeroContext,
    BuildContext toHeroContext,
  ) {
    final fromStyle = widget.fromStyle ?? Theme.of(flightContext).textTheme.bodyMedium!;
    final toStyle = widget.toStyle ?? Theme.of(flightContext).textTheme.bodyLarge!;

    return AnimatedBuilder(
      animation: animation,
      builder: (context, child) {
        final t = CurvedAnimation(
          parent: animation,
          curve: Curves.easeInOut,
        ).value;

        final interpolatedStyle = TextStyle(
          fontSize: ui.lerpDouble(fromStyle.fontSize, toStyle.fontSize, t),
          fontWeight: FontWeight.lerp(fromStyle.fontWeight, toStyle.fontWeight, t),
          color: Color.lerp(fromStyle.color, toStyle.color, t),
          letterSpacing: ui.lerpDouble(fromStyle.letterSpacing, toStyle.letterSpacing, t),
          height: ui.lerpDouble(fromStyle.height, toStyle.height, t),
        );

        return Text(
          widget.text,
          style: interpolatedStyle,
          textAlign: widget.textAlign,
          maxLines: widget.maxLines,
        );
      },
    );
  }
}

/// Background color transition
class BackgroundColorTransition extends StatelessWidget {
  final HeroTag tag;
  final Widget child;
  final Color fromColor;
  final Color toColor;

  const BackgroundColorTransition({
    Key? key,
    required this.tag,
    required this.child,
    required this.fromColor,
    required this.toColor,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SharedElement(
      tag: tag,
      flightShuttleBuilder: _backgroundColorFlightShuttleBuilder,
      child: Container(
        color: toColor,
        child: child,
      ),
    );
  }

  Widget _backgroundColorFlightShuttleBuilder(
    BuildContext flightContext,
    Animation<double> animation,
    HeroFlightDirection flightDirection,
    BuildContext fromHeroContext,
    BuildContext toHeroContext,
  ) {
    final Hero toHero = toHeroContext.widget as Hero;

    return AnimatedBuilder(
      animation: animation,
      builder: (context, child) {
        final t = CurvedAnimation(
          parent: animation,
          curve: Curves.easeInOut,
        ).value;

        final color = Color.lerp(fromColor, toColor, t)!;

        return Container(
          color: color,
          child: child,
        );
      },
      child: toHero.child,
    );
  }
}

/// Choreographed transition for multiple elements
class ChoreographedTransition extends StatefulWidget {
  final List<Widget> children;
  final ChoreographyPattern pattern;
  final Duration staggerDelay;
  final Duration duration;
  final Curve curve;

  const ChoreographedTransition({
    Key? key,
    required this.children,
    this.pattern = ChoreographyPattern.staggered,
    this.staggerDelay = const Duration(milliseconds: 50),
    this.duration = const Duration(milliseconds: 300),
    this.curve = Curves.easeInOut,
  }) : super(key: key);

  @override
  State<ChoreographedTransition> createState() =>
      _ChoreographedTransitionState();
}

class _ChoreographedTransitionState extends State<ChoreographedTransition>
    with TickerProviderStateMixin {
  late List<AnimationController> _controllers;
  late List<Animation<double>> _animations;

  @override
  void initState() {
    super.initState();
    _initializeAnimations();
  }

  void _initializeAnimations() {
    _controllers = List.generate(
      widget.children.length,
      (index) => AnimationController(
        duration: widget.duration,
        vsync: this,
      ),
    );

    _animations = _controllers.map((controller) {
      return CurvedAnimation(
        parent: controller,
        curve: widget.curve,
      );
    }).toList();

    _startAnimations();
  }

  void _startAnimations() {
    switch (widget.pattern) {
      case ChoreographyPattern.parallel:
        for (final controller in _controllers) {
          controller.forward();
        }
        break;

      case ChoreographyPattern.sequential:
        _startSequential(0);
        break;

      case ChoreographyPattern.staggered:
        for (int i = 0; i < _controllers.length; i++) {
          Future.delayed(widget.staggerDelay * i, () {
            if (mounted) {
              _controllers[i].forward();
            }
          });
        }
        break;

      case ChoreographyPattern.cascade:
        _startCascade(0);
        break;
    }
  }

  void _startSequential(int index) {
    if (index >= _controllers.length) return;

    _controllers[index].forward().then((_) {
      if (mounted) {
        _startSequential(index + 1);
      }
    });
  }

  void _startCascade(int index) {
    if (index >= _controllers.length) return;

    _controllers[index].forward();

    Future.delayed(widget.staggerDelay, () {
      if (mounted) {
        _startCascade(index + 1);
      }
    });
  }

  @override
  void dispose() {
    for (final controller in _controllers) {
      controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(
        widget.children.length,
        (index) => FadeTransition(
          opacity: _animations[index],
          child: SlideTransition(
            position: Tween<Offset>(
              begin: const Offset(0, 0.2),
              end: Offset.zero,
            ).animate(_animations[index]),
            child: widget.children[index],
          ),
        ),
      ),
    );
  }
}

/// Gesture-driven transition controller
class GestureDrivenTransition extends StatefulWidget {
  final Widget child;
  final VoidCallback? onComplete;
  final double threshold;
  final Axis direction;

  const GestureDrivenTransition({
    Key? key,
    required this.child,
    this.onComplete,
    this.threshold = 0.5,
    this.direction = Axis.horizontal,
  }) : super(key: key);

  @override
  State<GestureDrivenTransition> createState() =>
      _GestureDrivenTransitionState();
}

class _GestureDrivenTransitionState extends State<GestureDrivenTransition>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  double _dragExtent = 0.0;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleDragUpdate(DragUpdateDetails details) {
    setState(() {
      if (widget.direction == Axis.horizontal) {
        _dragExtent += details.primaryDelta ?? 0.0;
      } else {
        _dragExtent += details.primaryDelta ?? 0.0;
      }

      final size = widget.direction == Axis.horizontal
          ? context.size?.width ?? 1.0
          : context.size?.height ?? 1.0;

      _controller.value = (_dragExtent / size).abs().clamp(0.0, 1.0);
    });
  }

  void _handleDragEnd(DragEndDetails details) {
    if (_controller.value >= widget.threshold) {
      _controller.forward().then((_) {
        widget.onComplete?.call();
      });
    } else {
      _controller.reverse();
      setState(() {
        _dragExtent = 0.0;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onPanUpdate: _handleDragUpdate,
      onPanEnd: _handleDragEnd,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          final offset = widget.direction == Axis.horizontal
              ? Offset(_dragExtent / (context.size?.width ?? 1.0), 0)
              : Offset(0, _dragExtent / (context.size?.height ?? 1.0));

          return Transform.translate(
            offset: offset * 100,
            child: Opacity(
              opacity: 1.0 - (_controller.value * 0.5),
              child: child,
            ),
          );
        },
        child: widget.child,
      ),
    );
  }
}

/// Interruptible animation controller
class InterruptibleAnimation extends StatefulWidget {
  final Widget child;
  final Duration duration;
  final Curve curve;
  final VoidCallback? onComplete;

  const InterruptibleAnimation({
    Key? key,
    required this.child,
    this.duration = const Duration(milliseconds: 300),
    this.curve = Curves.easeInOut,
    this.onComplete,
  }) : super(key: key);

  @override
  State<InterruptibleAnimation> createState() => _InterruptibleAnimationState();
}

class _InterruptibleAnimationState extends State<InterruptibleAnimation>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: widget.duration,
      vsync: this,
    );

    _animation = CurvedAnimation(
      parent: _controller,
      curve: widget.curve,
    );

    _controller.addStatusListener(_handleStatusChange);
    _controller.forward();
  }

  void _handleStatusChange(AnimationStatus status) {
    if (status == AnimationStatus.completed) {
      widget.onComplete?.call();
    }
  }

  @override
  void dispose() {
    _controller.removeStatusListener(_handleStatusChange);
    _controller.dispose();
    super.dispose();
  }

  void interrupt() {
    if (_controller.isAnimating) {
      _controller.stop();
      _controller.reverse();
    }
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _animation,
      child: ScaleTransition(
        scale: Tween<double>(begin: 0.8, end: 1.0).animate(_animation),
        child: widget.child,
      ),
    );
  }
}

/// Bounding box calculator for precise transitions
class BoundingBoxCalculator {
  /// Calculate global bounding box for a widget
  static Rect? getGlobalBounds(BuildContext context) {
    final renderObject = context.findRenderObject();
    if (renderObject is RenderBox) {
      final offset = renderObject.localToGlobal(Offset.zero);
      return Rect.fromLTWH(
        offset.dx,
        offset.dy,
        renderObject.size.width,
        renderObject.size.height,
      );
    }
    return null;
  }

  /// Calculate interpolated bounding box
  static Rect? lerpBounds(Rect? from, Rect? to, double t) {
    if (from == null || to == null) return to;
    return Rect.lerp(from, to, t);
  }

  /// Calculate center point of bounds
  static Offset? getCenter(Rect? bounds) {
    return bounds?.center;
  }

  /// Check if bounds overlap
  static bool boundsOverlap(Rect? a, Rect? b) {
    if (a == null || b == null) return false;
    return a.overlaps(b);
  }
}

/// Performance monitor for shared element transitions
class SharedElementPerformanceMonitor {
  static final SharedElementPerformanceMonitor _instance =
      SharedElementPerformanceMonitor._internal();

  factory SharedElementPerformanceMonitor() => _instance;

  SharedElementPerformanceMonitor._internal();

  final List<Duration> _transitionDurations = [];
  final Map<String, int> _frameDropCounts = {};
  int _totalTransitions = 0;
  int _totalFrameDrops = 0;

  /// Record a transition duration
  void recordTransition(String tag, Duration duration, int frameDrops) {
    _transitionDurations.add(duration);
    _frameDropCounts[tag] = (_frameDropCounts[tag] ?? 0) + frameDrops;
    _totalTransitions++;
    _totalFrameDrops += frameDrops;

    // Keep only last 100 transitions
    if (_transitionDurations.length > 100) {
      _transitionDurations.removeAt(0);
    }
  }

  /// Get average transition duration
  Duration get averageDuration {
    if (_transitionDurations.isEmpty) {
      return Duration.zero;
    }
    final total = _transitionDurations.fold<int>(
      0,
      (sum, duration) => sum + duration.inMicroseconds,
    );
    return Duration(microseconds: total ~/ _transitionDurations.length);
  }

  /// Get frame drop rate
  double get frameDropRate {
    if (_totalTransitions == 0) return 0.0;
    return _totalFrameDrops / _totalTransitions;
  }

  /// Get performance report
  Map<String, dynamic> getReport() {
    return {
      'totalTransitions': _totalTransitions,
      'totalFrameDrops': _totalFrameDrops,
      'averageDuration': averageDuration.inMilliseconds,
      'frameDropRate': frameDropRate,
      'recentDurations': _transitionDurations
          .take(10)
          .map((d) => d.inMilliseconds)
          .toList(),
    };
  }

  /// Reset statistics
  void reset() {
    _transitionDurations.clear();
    _frameDropCounts.clear();
    _totalTransitions = 0;
    _totalFrameDrops = 0;
  }
}
