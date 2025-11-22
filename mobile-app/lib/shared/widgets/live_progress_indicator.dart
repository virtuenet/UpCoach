import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/dashboard/providers/realtime_dashboard_provider.dart';

class LiveProgressIndicator extends ConsumerStatefulWidget {
  final String progressKey;
  final double? size;
  final Color? color;
  final bool showPulse;

  const LiveProgressIndicator({
    Key? key,
    required this.progressKey,
    this.size = 6.0,
    this.color,
    this.showPulse = true,
  }) : super(key: key);

  @override
  ConsumerState<LiveProgressIndicator> createState() => _LiveProgressIndicatorState();
}

class _LiveProgressIndicatorState extends ConsumerState<LiveProgressIndicator>
    with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late AnimationController _rotationController;
  late Animation<double> _pulseAnimation;
  late Animation<double> _rotationAnimation;

  @override
  void initState() {
    super.initState();

    _pulseController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );

    _rotationController = AnimationController(
      duration: const Duration(seconds: 3),
      vsync: this,
    );

    _pulseAnimation = Tween<double>(
      begin: 0.5,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _pulseController,
      curve: Curves.easeInOut,
    ));

    _rotationAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _rotationController,
      curve: Curves.linear,
    ));

    if (widget.showPulse) {
      _pulseController.repeat(reverse: true);
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _rotationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final connectionStatus = ref.watch(dashboardConnectionStatusProvider);
    final realtimeData = ref.watch(realtimeDashboardProvider);

    // Determine the indicator state based on connection and data
    final indicatorState = _getIndicatorState(connectionStatus, realtimeData);

    return AnimatedBuilder(
      animation: widget.showPulse ? _pulseAnimation : _rotationAnimation,
      builder: (context, child) {
        return _buildIndicator(indicatorState);
      },
    );
  }

  IndicatorState _getIndicatorState(bool isConnected, AsyncValue<dynamic> data) {
    if (!isConnected) {
      return IndicatorState.disconnected;
    }

    if (data.isLoading) {
      return IndicatorState.loading;
    }

    if (data.hasError) {
      return IndicatorState.error;
    }

    if (data.hasValue) {
      return IndicatorState.active;
    }

    return IndicatorState.idle;
  }

  Widget _buildIndicator(IndicatorState state) {
    switch (state) {
      case IndicatorState.active:
        return _buildActiveIndicator();
      case IndicatorState.loading:
        return _buildLoadingIndicator();
      case IndicatorState.error:
        return _buildErrorIndicator();
      case IndicatorState.disconnected:
        return _buildDisconnectedIndicator();
      case IndicatorState.idle:
        return _buildIdleIndicator();
    }
  }

  Widget _buildActiveIndicator() {
    final color = widget.color ?? Colors.green;

    if (widget.showPulse) {
      return Opacity(
        opacity: _pulseAnimation.value,
        child: Container(
          width: widget.size,
          height: widget.size,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: color.withOpacity(0.5),
                blurRadius: 4,
                spreadRadius: 1,
              ),
            ],
          ),
        ),
      );
    }

    return Container(
      width: widget.size,
      height: widget.size,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
      ),
    );
  }

  Widget _buildLoadingIndicator() {
    _rotationController.repeat();

    return RotationTransition(
      turns: _rotationAnimation,
      child: Container(
        width: widget.size,
        height: widget.size,
        decoration: BoxDecoration(
          border: Border.all(
            color: widget.color ?? Colors.blue,
            width: 1.5,
          ),
          shape: BoxShape.circle,
        ),
        child: Container(
          margin: const EdgeInsets.all(1),
          decoration: BoxDecoration(
            color: (widget.color ?? Colors.blue).withOpacity(0.3),
            shape: BoxShape.circle,
          ),
        ),
      ),
    );
  }

  Widget _buildErrorIndicator() {
    _pulseController.stop();
    _rotationController.stop();

    return Container(
      width: widget.size,
      height: widget.size,
      decoration: const BoxDecoration(
        color: Colors.red,
        shape: BoxShape.circle,
      ),
      child: Icon(
        Icons.error_outline,
        size: widget.size! * 0.7,
        color: Colors.white,
      ),
    );
  }

  Widget _buildDisconnectedIndicator() {
    _pulseController.stop();
    _rotationController.stop();

    return Container(
      width: widget.size,
      height: widget.size,
      decoration: BoxDecoration(
        color: Colors.grey.shade400,
        shape: BoxShape.circle,
      ),
    );
  }

  Widget _buildIdleIndicator() {
    _pulseController.stop();
    _rotationController.stop();

    return Container(
      width: widget.size,
      height: widget.size,
      decoration: BoxDecoration(
        color: (widget.color ?? Colors.grey).withOpacity(0.5),
        shape: BoxShape.circle,
      ),
    );
  }
}

enum IndicatorState {
  active,
  loading,
  error,
  disconnected,
  idle,
}

/// Enhanced version with custom animations for specific metrics
class MetricLiveIndicator extends ConsumerStatefulWidget {
  final String metricKey;
  final Widget child;
  final Duration animationDuration;

  const MetricLiveIndicator({
    Key? key,
    required this.metricKey,
    required this.child,
    this.animationDuration = const Duration(milliseconds: 300),
  }) : super(key: key);

  @override
  ConsumerState<MetricLiveIndicator> createState() => _MetricLiveIndicatorState();
}

class _MetricLiveIndicatorState extends ConsumerState<MetricLiveIndicator>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  late Animation<Color?> _colorAnimation;

  @override
  void initState() {
    super.initState();

    _animationController = AnimationController(
      duration: widget.animationDuration,
      vsync: this,
    );

    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 1.05,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));

    _colorAnimation = ColorTween(
      begin: Colors.transparent,
      end: Colors.green.withOpacity(0.1),
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(realtimeDashboardProvider, (previous, next) {
      // Trigger animation when new data arrives
      if (next.hasValue && previous?.hasValue == true) {
        _triggerUpdateAnimation();
      }
    });

    return AnimatedBuilder(
      animation: _animationController,
      builder: (context, child) {
        return Transform.scale(
          scale: _scaleAnimation.value,
          child: Container(
            decoration: BoxDecoration(
              color: _colorAnimation.value,
              borderRadius: BorderRadius.circular(8),
            ),
            child: widget.child,
          ),
        );
      },
    );
  }

  void _triggerUpdateAnimation() {
    _animationController.forward().then((_) {
      _animationController.reverse();
    });
  }
}

/// Specialized indicator for progress bars with real-time updates
class LiveProgressBar extends ConsumerStatefulWidget {
  final String progressKey;
  final double value;
  final double? height;
  final Color? backgroundColor;
  final Color? valueColor;
  final BorderRadius? borderRadius;

  const LiveProgressBar({
    Key? key,
    required this.progressKey,
    required this.value,
    this.height = 8.0,
    this.backgroundColor,
    this.valueColor,
    this.borderRadius,
  }) : super(key: key);

  @override
  ConsumerState<LiveProgressBar> createState() => _LiveProgressBarState();
}

class _LiveProgressBarState extends ConsumerState<LiveProgressBar>
    with TickerProviderStateMixin {
  late AnimationController _shimmerController;
  late Animation<double> _shimmerAnimation;
  double _currentValue = 0.0;

  @override
  void initState() {
    super.initState();
    _currentValue = widget.value;

    _shimmerController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );

    _shimmerAnimation = Tween<double>(
      begin: -1.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _shimmerController,
      curve: Curves.easeInOut,
    ));
  }

  @override
  void dispose() {
    _shimmerController.dispose();
    super.dispose();
  }

  @override
  void didUpdateWidget(LiveProgressBar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.value != widget.value) {
      _animateValueChange(oldWidget.value, widget.value);
    }
  }

  void _animateValueChange(double oldValue, double newValue) {
    _shimmerController.forward().then((_) {
      _shimmerController.reverse();
    });

    // Animate the value change
    final animation = Tween<double>(
      begin: oldValue,
      end: newValue,
    ).animate(CurvedAnimation(
      parent: _shimmerController,
      curve: Curves.easeInOut,
    ));

    animation.addListener(() {
      setState(() {
        _currentValue = animation.value;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final connectionStatus = ref.watch(dashboardConnectionStatusProvider);

    return Container(
      height: widget.height,
      decoration: BoxDecoration(
        color: widget.backgroundColor ?? Colors.grey.shade200,
        borderRadius: widget.borderRadius ?? BorderRadius.circular(4),
      ),
      child: Stack(
        children: [
          // Progress bar
          FractionallySizedBox(
            widthFactor: _currentValue.clamp(0.0, 1.0),
            child: Container(
              decoration: BoxDecoration(
                color: widget.valueColor ?? Colors.blue,
                borderRadius: widget.borderRadius ?? BorderRadius.circular(4),
              ),
            ),
          ),
          // Shimmer effect when updating
          if (connectionStatus)
            AnimatedBuilder(
              animation: _shimmerAnimation,
              builder: (context, child) {
                return Positioned(
                  left: _shimmerAnimation.value * MediaQuery.of(context).size.width,
                  child: Container(
                    width: 30,
                    height: widget.height,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Colors.transparent,
                          Colors.white.withOpacity(0.5),
                          Colors.transparent,
                        ],
                      ),
                      borderRadius: widget.borderRadius ?? BorderRadius.circular(4),
                    ),
                  ),
                );
              },
            ),
        ],
      ),
    );
  }
}