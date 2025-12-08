import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter/services.dart';

/// Custom focus traversal policy for better keyboard navigation
class AccessibleFocusTraversalPolicy extends ReadingOrderTraversalPolicy {
  @override
  bool inDirection(FocusNode currentNode, TraversalDirection direction) {
    // Custom handling for edge cases
    return super.inDirection(currentNode, direction);
  }
}

/// A widget that traps focus within its descendants
/// Useful for dialogs and modals
class FocusTrap extends StatefulWidget {
  final Widget child;
  final bool autofocus;

  const FocusTrap({
    super.key,
    required this.child,
    this.autofocus = true,
  });

  @override
  State<FocusTrap> createState() => _FocusTrapState();
}

class _FocusTrapState extends State<FocusTrap> {
  final FocusScopeNode _focusScopeNode = FocusScopeNode();

  @override
  void initState() {
    super.initState();
    if (widget.autofocus) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _focusScopeNode.requestFocus();
      });
    }
  }

  @override
  void dispose() {
    _focusScopeNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FocusTraversalGroup(
      policy: AccessibleFocusTraversalPolicy(),
      child: FocusScope(
        node: _focusScopeNode,
        child: widget.child,
      ),
    );
  }
}

/// Skip link for keyboard users to skip repetitive content
class SkipLink extends StatelessWidget {
  final String label;
  final FocusNode targetFocusNode;

  const SkipLink({
    super.key,
    this.label = 'Skip to main content',
    required this.targetFocusNode,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: label,
      child: Focus(
        child: Builder(
          builder: (context) {
            final hasFocus = Focus.of(context).hasFocus;
            if (!hasFocus) {
              return const SizedBox.shrink();
            }
            return Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: Container(
                color: Theme.of(context).colorScheme.primary,
                padding: const EdgeInsets.all(8),
                child: TextButton(
                  onPressed: () {
                    targetFocusNode.requestFocus();
                  },
                  child: Text(
                    label,
                    style: const TextStyle(color: Colors.white),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

/// A widget that manages focus restoration when navigating back
class FocusRestorer extends StatefulWidget {
  final Widget child;
  final bool restoreFocus;

  const FocusRestorer({
    super.key,
    required this.child,
    this.restoreFocus = true,
  });

  @override
  State<FocusRestorer> createState() => _FocusRestorerState();
}

class _FocusRestorerState extends State<FocusRestorer> with RouteAware {
  FocusNode? _previousFocus;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Could register with RouteObserver here for navigation tracking
  }

  @override
  void dispose() {
    if (widget.restoreFocus && _previousFocus != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_previousFocus!.canRequestFocus) {
          _previousFocus!.requestFocus();
        }
      });
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return NotificationListener<FocusNotification>(
      onNotification: (notification) {
        _previousFocus = notification.focusNode;
        return false;
      },
      child: widget.child,
    );
  }
}

/// Custom notification for focus tracking
class FocusNotification extends Notification {
  final FocusNode focusNode;

  FocusNotification(this.focusNode);
}

/// Keyboard shortcut handler for common accessibility actions
class AccessibilityShortcuts extends StatelessWidget {
  final Widget child;
  final VoidCallback? onEscape;
  final VoidCallback? onEnter;

  const AccessibilityShortcuts({
    super.key,
    required this.child,
    this.onEscape,
    this.onEnter,
  });

  @override
  Widget build(BuildContext context) {
    return Shortcuts(
      shortcuts: <ShortcutActivator, Intent>{
        const SingleActivator(LogicalKeyboardKey.escape): const DismissIntent(),
        const SingleActivator(LogicalKeyboardKey.enter): const ActivateIntent(),
      },
      child: Actions(
        actions: <Type, Action<Intent>>{
          DismissIntent: CallbackAction<DismissIntent>(
            onInvoke: (_) {
              if (onEscape != null) {
                onEscape!();
              } else {
                Navigator.maybePop(context);
              }
              return null;
            },
          ),
          ActivateIntent: CallbackAction<ActivateIntent>(
            onInvoke: (_) {
              onEnter?.call();
              return null;
            },
          ),
        },
        child: child,
      ),
    );
  }
}

/// A focus-aware container that provides visual feedback
class FocusHighlight extends StatelessWidget {
  final Widget child;
  final Color? focusColor;
  final double borderRadius;

  const FocusHighlight({
    super.key,
    required this.child,
    this.focusColor,
    this.borderRadius = 4.0,
  });

  @override
  Widget build(BuildContext context) {
    return Focus(
      child: Builder(
        builder: (context) {
          final hasFocus = Focus.of(context).hasFocus;
          return Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(borderRadius),
              border: hasFocus
                  ? Border.all(
                      color:
                          focusColor ?? Theme.of(context).colorScheme.primary,
                      width: 2,
                    )
                  : null,
            ),
            child: child,
          );
        },
      ),
    );
  }
}

/// Provides a way to announce messages to screen readers
class ScreenReaderAnnouncer {
  static void announce(String message, {TextDirection? direction}) {
    SemanticsService.announce(message, direction ?? TextDirection.ltr);
  }

  static void announcePolite(String message) {
    // Polite announcements don't interrupt current speech
    announce(message);
  }

  static void announceAssertive(String message) {
    // Assertive announcements interrupt current speech
    // Note: Flutter's SemanticsService doesn't differentiate, but this
    // provides the semantic distinction for future updates
    announce(message);
  }
}

/// Extension on BuildContext for accessibility helpers
extension AccessibilityContext on BuildContext {
  /// Check if screen reader is enabled
  bool get isScreenReaderEnabled {
    return MediaQuery.of(this).accessibleNavigation;
  }

  /// Check if reduce motion is preferred
  bool get prefersReducedMotion {
    return MediaQuery.of(this).disableAnimations;
  }

  /// Check if high contrast is enabled
  bool get prefersHighContrast {
    return MediaQuery.of(this).highContrast;
  }

  /// Check if bold text is enabled
  bool get prefersBoldText {
    return MediaQuery.of(this).boldText;
  }

  /// Get the effective text scale factor
  double get textScaleFactor {
    return MediaQuery.of(this).textScaler.scale(1.0);
  }

  /// Announce a message to screen readers
  void announceToScreenReader(String message) {
    ScreenReaderAnnouncer.announce(message);
  }
}

/// A widget that ensures minimum touch target size (48x48 per WCAG)
class AccessibleTouchTarget extends StatelessWidget {
  final Widget child;
  final VoidCallback? onTap;
  final double minSize;

  const AccessibleTouchTarget({
    super.key,
    required this.child,
    this.onTap,
    this.minSize = 48.0, // WCAG minimum
  });

  @override
  Widget build(BuildContext context) {
    return ConstrainedBox(
      constraints: BoxConstraints(
        minWidth: minSize,
        minHeight: minSize,
      ),
      child: InkWell(
        onTap: onTap,
        child: Center(child: child),
      ),
    );
  }
}
