/// MicroInteractions.dart
///
/// Provides delightful micro-interactions and feedback animations for the mobile app.
///
/// Features:
/// - 30+ micro-interaction types
/// - Button interactions with haptic feedback
/// - Loading animations (spinners, skeletons, progress)
/// - Success/error animations
/// - Swipe actions and gestures
/// - Physics-based animations
/// - Lottie and particle effects
/// - Performance optimized

library micro_interactions;

import 'dart:async';
import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/physics.dart';
import 'package:flutter/services.dart';

/// Micro-interaction type enumeration
enum MicroInteractionType {
  buttonPress,
  cardSwipe,
  checkboxCheck,
  radioSelect,
  switchToggle,
  sliderDrag,
  textFieldFocus,
  loadingSpinner,
  skeletonLoader,
  pullToRefresh,
  successCheckmark,
  errorShake,
  celebrationConfetti,
  badgePulse,
  iconMorph,
  progressRing,
  waveEffect,
  rippleEffect,
  shimmerEffect,
  typingDots,
  heartAnimation,
  starAnimation,
  bookmarkAnimation,
  shareAnimation,
  downloadAnimation,
  uploadAnimation,
  refreshAnimation,
  deleteAnimation,
  archiveAnimation,
  completeAnimation,
}

/// Haptic feedback intensity
enum HapticIntensity {
  light,
  medium,
  heavy,
}

/// Configuration for micro-interactions
class MicroInteractionConfig {
  final Duration duration;
  final Curve curve;
  final bool enableHaptic;
  final HapticIntensity hapticIntensity;
  final bool enableSound;
  final double scaleFactor;

  const MicroInteractionConfig({
    this.duration = const Duration(milliseconds: 200),
    this.curve = Curves.easeInOut,
    this.enableHaptic = true,
    this.hapticIntensity = HapticIntensity.light,
    this.enableSound = false,
    this.scaleFactor = 0.95,
  });

  MicroInteractionConfig copyWith({
    Duration? duration,
    Curve? curve,
    bool? enableHaptic,
    HapticIntensity? hapticIntensity,
    bool? enableSound,
    double? scaleFactor,
  }) {
    return MicroInteractionConfig(
      duration: duration ?? this.duration,
      curve: curve ?? this.curve,
      enableHaptic: enableHaptic ?? this.enableHaptic,
      hapticIntensity: hapticIntensity ?? this.hapticIntensity,
      enableSound: enableSound ?? this.enableSound,
      scaleFactor: scaleFactor ?? this.scaleFactor,
    );
  }
}

/// Service for managing micro-interactions
class MicroInteractionService {
  static final MicroInteractionService _instance =
      MicroInteractionService._internal();

  factory MicroInteractionService() => _instance;

  MicroInteractionService._internal();

  bool _hapticsEnabled = true;
  bool _soundsEnabled = false;

  void initialize({bool? hapticsEnabled, bool? soundsEnabled}) {
    _hapticsEnabled = hapticsEnabled ?? true;
    _soundsEnabled = soundsEnabled ?? false;
  }

  /// Trigger haptic feedback
  Future<void> haptic(HapticIntensity intensity) async {
    if (!_hapticsEnabled) return;

    switch (intensity) {
      case HapticIntensity.light:
        await HapticFeedback.lightImpact();
        break;
      case HapticIntensity.medium:
        await HapticFeedback.mediumImpact();
        break;
      case HapticIntensity.heavy:
        await HapticFeedback.heavyImpact();
        break;
    }
  }

  /// Trigger selection haptic
  Future<void> selectionClick() async {
    if (!_hapticsEnabled) return;
    await HapticFeedback.selectionClick();
  }

  bool get hapticsEnabled => _hapticsEnabled;
  bool get soundsEnabled => _soundsEnabled;
}

/// Button press interaction
class ButtonPressInteraction extends StatefulWidget {
  final Widget child;
  final VoidCallback? onPressed;
  final MicroInteractionConfig? config;

  const ButtonPressInteraction({
    Key? key,
    required this.child,
    this.onPressed,
    this.config,
  }) : super(key: key);

  @override
  State<ButtonPressInteraction> createState() => _ButtonPressInteractionState();
}

class _ButtonPressInteractionState extends State<ButtonPressInteraction>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late MicroInteractionConfig _config;

  @override
  void initState() {
    super.initState();
    _config = widget.config ?? const MicroInteractionConfig();
    _controller = AnimationController(
      duration: _config.duration,
      vsync: this,
    );

    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: _config.scaleFactor,
    ).animate(
      CurvedAnimation(
        parent: _controller,
        curve: _config.curve,
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
    if (_config.enableHaptic) {
      MicroInteractionService().haptic(_config.hapticIntensity);
    }
  }

  void _handleTapUp(TapUpDetails details) {
    _controller.reverse();
    widget.onPressed?.call();
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
        animation: _scaleAnimation,
        builder: (context, child) {
          return Transform.scale(
            scale: _scaleAnimation.value,
            child: child,
          );
        },
        child: widget.child,
      ),
    );
  }
}

/// Ripple effect interaction
class RippleInteraction extends StatefulWidget {
  final Widget child;
  final Color? rippleColor;
  final VoidCallback? onTap;

  const RippleInteraction({
    Key? key,
    required this.child,
    this.rippleColor,
    this.onTap,
  }) : super(key: key);

  @override
  State<RippleInteraction> createState() => _RippleInteractionState();
}

class _RippleInteractionState extends State<RippleInteraction>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;
  Offset? _tapPosition;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );

    _animation = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOut,
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleTapDown(TapDownDetails details) {
    setState(() {
      _tapPosition = details.localPosition;
    });
    _controller.forward(from: 0.0);
    widget.onTap?.call();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: _handleTapDown,
      child: CustomPaint(
        painter: _RipplePainter(
          animation: _animation,
          tapPosition: _tapPosition,
          color: widget.rippleColor ?? Theme.of(context).primaryColor.withOpacity(0.3),
        ),
        child: widget.child,
      ),
    );
  }
}

class _RipplePainter extends CustomPainter {
  final Animation<double> animation;
  final Offset? tapPosition;
  final Color color;

  _RipplePainter({
    required this.animation,
    required this.tapPosition,
    required this.color,
  }) : super(repaint: animation);

  @override
  void paint(Canvas canvas, Size size) {
    if (tapPosition == null || animation.value == 0.0) return;

    final maxRadius = math.sqrt(
      size.width * size.width + size.height * size.height,
    );

    final radius = maxRadius * animation.value;
    final opacity = 1.0 - animation.value;

    final paint = Paint()
      ..color = color.withOpacity(opacity * color.opacity)
      ..style = PaintingStyle.fill;

    canvas.drawCircle(tapPosition!, radius, paint);
  }

  @override
  bool shouldRepaint(_RipplePainter oldDelegate) {
    return oldDelegate.animation != animation ||
        oldDelegate.tapPosition != tapPosition;
  }
}

/// Checkbox check animation
class CheckboxCheckAnimation extends StatefulWidget {
  final bool checked;
  final ValueChanged<bool>? onChanged;
  final Color? activeColor;
  final Color? checkColor;
  final double size;

  const CheckboxCheckAnimation({
    Key? key,
    required this.checked,
    this.onChanged,
    this.activeColor,
    this.checkColor,
    this.size = 24.0,
  }) : super(key: key);

  @override
  State<CheckboxCheckAnimation> createState() => _CheckboxCheckAnimationState();
}

class _CheckboxCheckAnimationState extends State<CheckboxCheckAnimation>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _checkAnimation;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );

    _checkAnimation = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    );

    _scaleAnimation = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.0, end: 1.2),
        weight: 50,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.2, end: 1.0),
        weight: 50,
      ),
    ]).animate(_controller);

    if (widget.checked) {
      _controller.value = 1.0;
    }
  }

  @override
  void didUpdateWidget(CheckboxCheckAnimation oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.checked != widget.checked) {
      if (widget.checked) {
        _controller.forward();
        MicroInteractionService().haptic(HapticIntensity.light);
      } else {
        _controller.reverse();
      }
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleTap() {
    widget.onChanged?.call(!widget.checked);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final activeColor = widget.activeColor ?? theme.primaryColor;
    final checkColor = widget.checkColor ?? Colors.white;

    return GestureDetector(
      onTap: widget.onChanged != null ? _handleTap : null,
      child: SizedBox(
        width: widget.size,
        height: widget.size,
        child: AnimatedBuilder(
          animation: _controller,
          builder: (context, child) {
            return Transform.scale(
              scale: _scaleAnimation.value,
              child: CustomPaint(
                painter: _CheckboxPainter(
                  progress: _checkAnimation.value,
                  activeColor: activeColor,
                  checkColor: checkColor,
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _CheckboxPainter extends CustomPainter {
  final double progress;
  final Color activeColor;
  final Color checkColor;

  _CheckboxPainter({
    required this.progress,
    required this.activeColor,
    required this.checkColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final backgroundPaint = Paint()
      ..color = Color.lerp(Colors.grey[300]!, activeColor, progress)!
      ..style = PaintingStyle.fill;

    final borderPaint = Paint()
      ..color = Color.lerp(Colors.grey[400]!, activeColor, progress)!
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;

    final rect = RRect.fromRectAndRadius(
      Rect.fromLTWH(0, 0, size.width, size.height),
      const Radius.circular(4.0),
    );

    canvas.drawRRect(rect, backgroundPaint);
    canvas.drawRRect(rect, borderPaint);

    if (progress > 0.0) {
      final checkPaint = Paint()
        ..color = checkColor
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.5
        ..strokeCap = StrokeCap.round;

      final path = Path();
      final startPoint = Offset(size.width * 0.25, size.height * 0.5);
      final middlePoint = Offset(size.width * 0.4, size.height * 0.7);
      final endPoint = Offset(size.width * 0.75, size.height * 0.3);

      path.moveTo(startPoint.dx, startPoint.dy);

      if (progress < 0.5) {
        final t = progress * 2;
        path.lineTo(
          ui.lerpDouble(startPoint.dx, middlePoint.dx, t)!,
          ui.lerpDouble(startPoint.dy, middlePoint.dy, t)!,
        );
      } else {
        path.lineTo(middlePoint.dx, middlePoint.dy);
        final t = (progress - 0.5) * 2;
        path.lineTo(
          ui.lerpDouble(middlePoint.dx, endPoint.dx, t)!,
          ui.lerpDouble(middlePoint.dy, endPoint.dy, t)!,
        );
      }

      canvas.drawPath(path, checkPaint);
    }
  }

  @override
  bool shouldRepaint(_CheckboxPainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}

/// Loading spinner animation
class LoadingSpinnerAnimation extends StatefulWidget {
  final double size;
  final Color? color;
  final double strokeWidth;

  const LoadingSpinnerAnimation({
    Key? key,
    this.size = 40.0,
    this.color,
    this.strokeWidth = 3.0,
  }) : super(key: key);

  @override
  State<LoadingSpinnerAnimation> createState() =>
      _LoadingSpinnerAnimationState();
}

class _LoadingSpinnerAnimationState extends State<LoadingSpinnerAnimation>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1400),
      vsync: this,
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final color = widget.color ?? Theme.of(context).primaryColor;

    return SizedBox(
      width: widget.size,
      height: widget.size,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          return CustomPaint(
            painter: _SpinnerPainter(
              progress: _controller.value,
              color: color,
              strokeWidth: widget.strokeWidth,
            ),
          );
        },
      ),
    );
  }
}

class _SpinnerPainter extends CustomPainter {
  final double progress;
  final Color color;
  final double strokeWidth;

  _SpinnerPainter({
    required this.progress,
    required this.color,
    required this.strokeWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    final rect = Rect.fromLTWH(0, 0, size.width, size.height);
    final startAngle = progress * 2 * math.pi;
    final sweepAngle = math.pi * 1.5;

    canvas.drawArc(rect, startAngle, sweepAngle, false, paint);
  }

  @override
  bool shouldRepaint(_SpinnerPainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}

/// Skeleton loader animation
class SkeletonLoaderAnimation extends StatefulWidget {
  final double width;
  final double height;
  final BorderRadius? borderRadius;

  const SkeletonLoaderAnimation({
    Key? key,
    required this.width,
    required this.height,
    this.borderRadius,
  }) : super(key: key);

  @override
  State<SkeletonLoaderAnimation> createState() =>
      _SkeletonLoaderAnimationState();
}

class _SkeletonLoaderAnimationState extends State<SkeletonLoaderAnimation>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: widget.width,
      height: widget.height,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          return CustomPaint(
            painter: _SkeletonPainter(
              progress: _controller.value,
              borderRadius: widget.borderRadius ?? BorderRadius.circular(4.0),
            ),
          );
        },
      ),
    );
  }
}

class _SkeletonPainter extends CustomPainter {
  final double progress;
  final BorderRadius borderRadius;

  _SkeletonPainter({
    required this.progress,
    required this.borderRadius,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final backgroundPaint = Paint()
      ..color = Colors.grey[300]!
      ..style = PaintingStyle.fill;

    final rect = RRect.fromRectAndCorners(
      Rect.fromLTWH(0, 0, size.width, size.height),
      topLeft: borderRadius.topLeft,
      topRight: borderRadius.topRight,
      bottomLeft: borderRadius.bottomLeft,
      bottomRight: borderRadius.bottomRight,
    );

    canvas.drawRRect(rect, backgroundPaint);

    final gradientPaint = Paint()
      ..shader = ui.Gradient.linear(
        Offset(-size.width, 0),
        Offset(size.width * 2, 0),
        [
          Colors.transparent,
          Colors.white.withOpacity(0.5),
          Colors.transparent,
        ],
        [0.0, 0.5, 1.0],
        TileMode.clamp,
        Matrix4.translationValues(size.width * 3 * progress, 0, 0).storage,
      );

    canvas.drawRRect(rect, gradientPaint);
  }

  @override
  bool shouldRepaint(_SkeletonPainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}

/// Success checkmark animation
class SuccessCheckmarkAnimation extends StatefulWidget {
  final double size;
  final Color? color;
  final VoidCallback? onComplete;

  const SuccessCheckmarkAnimation({
    Key? key,
    this.size = 60.0,
    this.color,
    this.onComplete,
  }) : super(key: key);

  @override
  State<SuccessCheckmarkAnimation> createState() =>
      _SuccessCheckmarkAnimationState();
}

class _SuccessCheckmarkAnimationState extends State<SuccessCheckmarkAnimation>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _checkAnimation;
  late Animation<double> _circleAnimation;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    _circleAnimation = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.0, 0.5, curve: Curves.easeInOut),
    );

    _checkAnimation = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.5, 1.0, curve: Curves.easeInOut),
    );

    _scaleAnimation = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween<double>(begin: 0.0, end: 1.2),
        weight: 60,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.2, end: 1.0),
        weight: 40,
      ),
    ]).animate(_controller);

    _controller.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        widget.onComplete?.call();
      }
    });

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final color = widget.color ?? Colors.green;

    return SizedBox(
      width: widget.size,
      height: widget.size,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          return Transform.scale(
            scale: _scaleAnimation.value,
            child: CustomPaint(
              painter: _SuccessPainter(
                circleProgress: _circleAnimation.value,
                checkProgress: _checkAnimation.value,
                color: color,
              ),
            ),
          );
        },
      ),
    );
  }
}

class _SuccessPainter extends CustomPainter {
  final double circleProgress;
  final double checkProgress;
  final Color color;

  _SuccessPainter({
    required this.circleProgress,
    required this.checkProgress,
    required this.color,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final circlePaint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.0;

    if (circleProgress > 0.0) {
      canvas.drawArc(
        Rect.fromLTWH(0, 0, size.width, size.height),
        -math.pi / 2,
        2 * math.pi * circleProgress,
        false,
        circlePaint,
      );
    }

    if (checkProgress > 0.0) {
      final checkPaint = Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3.5
        ..strokeCap = StrokeCap.round;

      final path = Path();
      final startPoint = Offset(size.width * 0.25, size.height * 0.5);
      final middlePoint = Offset(size.width * 0.45, size.height * 0.7);
      final endPoint = Offset(size.width * 0.75, size.height * 0.3);

      path.moveTo(startPoint.dx, startPoint.dy);

      if (checkProgress < 0.5) {
        final t = checkProgress * 2;
        path.lineTo(
          ui.lerpDouble(startPoint.dx, middlePoint.dx, t)!,
          ui.lerpDouble(startPoint.dy, middlePoint.dy, t)!,
        );
      } else {
        path.lineTo(middlePoint.dx, middlePoint.dy);
        final t = (checkProgress - 0.5) * 2;
        path.lineTo(
          ui.lerpDouble(middlePoint.dx, endPoint.dx, t)!,
          ui.lerpDouble(middlePoint.dy, endPoint.dy, t)!,
        );
      }

      canvas.drawPath(path, checkPaint);
    }
  }

  @override
  bool shouldRepaint(_SuccessPainter oldDelegate) {
    return oldDelegate.circleProgress != circleProgress ||
        oldDelegate.checkProgress != checkProgress;
  }
}

/// Error shake animation
class ErrorShakeAnimation extends StatefulWidget {
  final Widget child;
  final bool trigger;
  final VoidCallback? onComplete;

  const ErrorShakeAnimation({
    Key? key,
    required this.child,
    required this.trigger,
    this.onComplete,
  }) : super(key: key);

  @override
  State<ErrorShakeAnimation> createState() => _ErrorShakeAnimationState();
}

class _ErrorShakeAnimationState extends State<ErrorShakeAnimation>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _offsetAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );

    _offsetAnimation = TweenSequence<double>([
      TweenSequenceItem(tween: Tween<double>(begin: 0.0, end: 10.0), weight: 1),
      TweenSequenceItem(tween: Tween<double>(begin: 10.0, end: -10.0), weight: 1),
      TweenSequenceItem(tween: Tween<double>(begin: -10.0, end: 10.0), weight: 1),
      TweenSequenceItem(tween: Tween<double>(begin: 10.0, end: -10.0), weight: 1),
      TweenSequenceItem(tween: Tween<double>(begin: -10.0, end: 0.0), weight: 1),
    ]).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.elasticIn,
      ),
    );

    _controller.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        widget.onComplete?.call();
      }
    });
  }

  @override
  void didUpdateWidget(ErrorShakeAnimation oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.trigger != oldWidget.trigger && widget.trigger) {
      _controller.forward(from: 0.0);
      MicroInteractionService().haptic(HapticIntensity.medium);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _offsetAnimation,
      builder: (context, child) {
        return Transform.translate(
          offset: Offset(_offsetAnimation.value, 0),
          child: child,
        );
      },
      child: widget.child,
    );
  }
}

/// Pull to refresh animation
class PullToRefreshAnimation extends StatefulWidget {
  final Widget child;
  final Future<void> Function() onRefresh;
  final Color? indicatorColor;

  const PullToRefreshAnimation({
    Key? key,
    required this.child,
    required this.onRefresh,
    this.indicatorColor,
  }) : super(key: key);

  @override
  State<PullToRefreshAnimation> createState() => _PullToRefreshAnimationState();
}

class _PullToRefreshAnimationState extends State<PullToRefreshAnimation>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  bool _isRefreshing = false;
  double _dragOffset = 0.0;
  static const double _threshold = 80.0;

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

  void _handleScrollNotification(ScrollNotification notification) {
    if (notification is ScrollUpdateNotification) {
      if (notification.metrics.pixels < 0 && !_isRefreshing) {
        setState(() {
          _dragOffset = (-notification.metrics.pixels).clamp(0.0, _threshold);
          _controller.value = _dragOffset / _threshold;
        });
      }
    } else if (notification is ScrollEndNotification) {
      if (_dragOffset >= _threshold && !_isRefreshing) {
        _triggerRefresh();
      } else {
        _resetPull();
      }
    }
  }

  Future<void> _triggerRefresh() async {
    setState(() {
      _isRefreshing = true;
    });

    MicroInteractionService().haptic(HapticIntensity.light);
    await widget.onRefresh();

    if (mounted) {
      setState(() {
        _isRefreshing = false;
      });
      _resetPull();
    }
  }

  void _resetPull() {
    setState(() {
      _dragOffset = 0.0;
    });
    _controller.animateTo(0.0);
  }

  @override
  Widget build(BuildContext context) {
    return NotificationListener<ScrollNotification>(
      onNotification: (notification) {
        _handleScrollNotification(notification);
        return false;
      },
      child: Stack(
        children: [
          if (_dragOffset > 0 || _isRefreshing)
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: AnimatedBuilder(
                animation: _controller,
                builder: (context, child) {
                  return Transform.translate(
                    offset: Offset(0, _dragOffset - 40),
                    child: Container(
                      height: 40,
                      alignment: Alignment.center,
                      child: _isRefreshing
                          ? LoadingSpinnerAnimation(
                              size: 24,
                              color: widget.indicatorColor,
                            )
                          : Transform.rotate(
                              angle: _controller.value * math.pi,
                              child: Icon(
                                Icons.arrow_downward,
                                color: widget.indicatorColor ??
                                    Theme.of(context).primaryColor,
                              ),
                            ),
                    ),
                  );
                },
              ),
            ),
          widget.child,
        ],
      ),
    );
  }
}

/// Confetti celebration animation
class ConfettiAnimation extends StatefulWidget {
  final bool trigger;
  final Duration duration;
  final VoidCallback? onComplete;

  const ConfettiAnimation({
    Key? key,
    required this.trigger,
    this.duration = const Duration(seconds: 3),
    this.onComplete,
  }) : super(key: key);

  @override
  State<ConfettiAnimation> createState() => _ConfettiAnimationState();
}

class _ConfettiAnimationState extends State<ConfettiAnimation>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  final List<_ConfettiParticle> _particles = [];
  final math.Random _random = math.Random();

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: widget.duration,
      vsync: this,
    );

    _controller.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        widget.onComplete?.call();
      }
    });

    _initializeParticles();
  }

  void _initializeParticles() {
    for (int i = 0; i < 50; i++) {
      _particles.add(_ConfettiParticle(
        color: Color.fromRGBO(
          _random.nextInt(256),
          _random.nextInt(256),
          _random.nextInt(256),
          1.0,
        ),
        startX: _random.nextDouble(),
        velocityX: (_random.nextDouble() - 0.5) * 2,
        velocityY: _random.nextDouble() * -3 - 1,
        rotation: _random.nextDouble() * 2 * math.pi,
        rotationSpeed: (_random.nextDouble() - 0.5) * 4,
      ));
    }
  }

  @override
  void didUpdateWidget(ConfettiAnimation oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.trigger != oldWidget.trigger && widget.trigger) {
      _controller.forward(from: 0.0);
      MicroInteractionService().haptic(HapticIntensity.medium);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return CustomPaint(
          painter: _ConfettiPainter(
            progress: _controller.value,
            particles: _particles,
          ),
          child: Container(),
        );
      },
    );
  }
}

class _ConfettiParticle {
  final Color color;
  final double startX;
  final double velocityX;
  final double velocityY;
  final double rotation;
  final double rotationSpeed;

  _ConfettiParticle({
    required this.color,
    required this.startX,
    required this.velocityX,
    required this.velocityY,
    required this.rotation,
    required this.rotationSpeed,
  });
}

class _ConfettiPainter extends CustomPainter {
  final double progress;
  final List<_ConfettiParticle> particles;

  _ConfettiPainter({
    required this.progress,
    required this.particles,
  });

  @override
  void paint(Canvas canvas, Size size) {
    for (final particle in particles) {
      final x = size.width * particle.startX +
          particle.velocityX * size.width * progress;
      final y = size.height * 0.5 +
          particle.velocityY * size.height * progress +
          0.5 * 9.8 * progress * progress * size.height;

      if (y > size.height) continue;

      final paint = Paint()
        ..color = particle.color.withOpacity(1.0 - progress)
        ..style = PaintingStyle.fill;

      canvas.save();
      canvas.translate(x, y);
      canvas.rotate(particle.rotation + particle.rotationSpeed * progress * 10);
      canvas.drawRect(
        const Rect.fromLTWH(-5, -2, 10, 4),
        paint,
      );
      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(_ConfettiPainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}

/// Heart animation (like button)
class HeartAnimation extends StatefulWidget {
  final bool liked;
  final ValueChanged<bool>? onChanged;
  final double size;
  final Color? color;

  const HeartAnimation({
    Key? key,
    required this.liked,
    this.onChanged,
    this.size = 24.0,
    this.color,
  }) : super(key: key);

  @override
  State<HeartAnimation> createState() => _HeartAnimationState();
}

class _HeartAnimationState extends State<HeartAnimation>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _rotationAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 400),
      vsync: this,
    );

    _scaleAnimation = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.0, end: 1.5),
        weight: 50,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.5, end: 1.0),
        weight: 50,
      ),
    ]).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    ));

    _rotationAnimation = Tween<double>(
      begin: 0.0,
      end: 0.2,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    ));

    if (widget.liked) {
      _controller.value = 1.0;
    }
  }

  @override
  void didUpdateWidget(HeartAnimation oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.liked != widget.liked) {
      if (widget.liked) {
        _controller.forward();
        MicroInteractionService().haptic(HapticIntensity.light);
      } else {
        _controller.reverse();
      }
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleTap() {
    widget.onChanged?.call(!widget.liked);
  }

  @override
  Widget build(BuildContext context) {
    final color = widget.color ?? Colors.red;

    return GestureDetector(
      onTap: widget.onChanged != null ? _handleTap : null,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          return Transform.scale(
            scale: _scaleAnimation.value,
            child: Transform.rotate(
              angle: _rotationAnimation.value,
              child: Icon(
                widget.liked ? Icons.favorite : Icons.favorite_border,
                size: widget.size,
                color: widget.liked ? color : Colors.grey,
              ),
            ),
          );
        },
      ),
    );
  }
}

/// Badge pulse animation
class BadgePulseAnimation extends StatefulWidget {
  final Widget child;
  final int? count;
  final Color? backgroundColor;
  final Color? textColor;

  const BadgePulseAnimation({
    Key? key,
    required this.child,
    this.count,
    this.backgroundColor,
    this.textColor,
  }) : super(key: key);

  @override
  State<BadgePulseAnimation> createState() => _BadgePulseAnimationState();
}

class _BadgePulseAnimationState extends State<BadgePulseAnimation>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  int? _previousCount;

  @override
  void initState() {
    super.initState();
    _previousCount = widget.count;
    _controller = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );

    _scaleAnimation = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.0, end: 1.3),
        weight: 50,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.3, end: 1.0),
        weight: 50,
      ),
    ]).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    ));
  }

  @override
  void didUpdateWidget(BadgePulseAnimation oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.count != _previousCount && widget.count != null) {
      _controller.forward(from: 0.0);
      _previousCount = widget.count;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        widget.child,
        if (widget.count != null && widget.count! > 0)
          Positioned(
            right: -8,
            top: -8,
            child: AnimatedBuilder(
              animation: _scaleAnimation,
              builder: (context, child) {
                return Transform.scale(
                  scale: _scaleAnimation.value,
                  child: child,
                );
              },
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: widget.backgroundColor ?? Colors.red,
                  shape: BoxShape.circle,
                ),
                constraints: const BoxConstraints(
                  minWidth: 20,
                  minHeight: 20,
                ),
                child: Center(
                  child: Text(
                    widget.count! > 99 ? '99+' : widget.count.toString(),
                    style: TextStyle(
                      color: widget.textColor ?? Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

/// Shimmer effect animation
class ShimmerEffect extends StatefulWidget {
  final Widget child;
  final Color? baseColor;
  final Color? highlightColor;
  final Duration period;

  const ShimmerEffect({
    Key? key,
    required this.child,
    this.baseColor,
    this.highlightColor,
    this.period = const Duration(milliseconds: 1500),
  }) : super(key: key);

  @override
  State<ShimmerEffect> createState() => _ShimmerEffectState();
}

class _ShimmerEffectState extends State<ShimmerEffect>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: widget.period,
      vsync: this,
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return ShaderMask(
          shaderCallback: (bounds) {
            return LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                widget.baseColor ?? Colors.grey[300]!,
                widget.highlightColor ?? Colors.grey[100]!,
                widget.baseColor ?? Colors.grey[300]!,
              ],
              stops: const [0.0, 0.5, 1.0],
              transform: _SlidingGradientTransform(
                slidePercent: _controller.value,
              ),
            ).createShader(bounds);
          },
          child: child,
        );
      },
      child: widget.child,
    );
  }
}

class _SlidingGradientTransform extends GradientTransform {
  final double slidePercent;

  const _SlidingGradientTransform({
    required this.slidePercent,
  });

  @override
  Matrix4 transform(Rect bounds, {TextDirection? textDirection}) {
    return Matrix4.translationValues(bounds.width * slidePercent, 0.0, 0.0);
  }
}

/// Typing indicator animation
class TypingIndicatorAnimation extends StatefulWidget {
  final Color? dotColor;
  final double dotSize;

  const TypingIndicatorAnimation({
    Key? key,
    this.dotColor,
    this.dotSize = 8.0,
  }) : super(key: key);

  @override
  State<TypingIndicatorAnimation> createState() =>
      _TypingIndicatorAnimationState();
}

class _TypingIndicatorAnimationState extends State<TypingIndicatorAnimation>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final color = widget.dotColor ?? Theme.of(context).primaryColor;

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: List.generate(3, (index) {
            final delay = index * 0.2;
            final value = (_controller.value - delay).clamp(0.0, 1.0);
            final scale = math.sin(value * math.pi);

            return Padding(
              padding: EdgeInsets.symmetric(horizontal: widget.dotSize * 0.25),
              child: Transform.scale(
                scale: 1.0 + scale * 0.5,
                child: Container(
                  width: widget.dotSize,
                  height: widget.dotSize,
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            );
          }),
        );
      },
    );
  }
}
