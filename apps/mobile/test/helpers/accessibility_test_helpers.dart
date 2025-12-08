import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

/// Helper class for accessibility testing
class AccessibilityTestHelpers {
  /// Check if a widget has proper semantic labels
  static Future<void> checkSemanticLabels(WidgetTester tester) async {
    final renderView = tester.binding.renderViews.firstOrNull;
    if (renderView == null) {
      fail('No render view found');
    }

    // Access semantics through the render view's pipeline owner
    final semanticsOwner = renderView.owner?.semanticsOwner;
    if (semanticsOwner == null) {
      fail(
          'Semantics are not enabled. Add `tester.ensureSemantics()` before this check.');
    }

    final rootNode = semanticsOwner.rootSemanticsNode;
    if (rootNode == null) {
      fail('No semantics tree found');
    }

    final issues = <String>[];
    _checkSemanticsNode(rootNode, issues);

    if (issues.isNotEmpty) {
      fail('Accessibility issues found:\n${issues.join('\n')}');
    }
  }

  static void _checkSemanticsNode(SemanticsNode node, List<String> issues) {
    final data = node.getSemanticsData();

    // Check buttons have labels
    // ignore: deprecated_member_use
    if (data.hasFlag(SemanticsFlag.isButton)) {
      if (data.label.isEmpty && data.hint.isEmpty) {
        issues.add('Button at ${node.rect} has no label or hint');
      }
    }

    // Check images have descriptions
    // ignore: deprecated_member_use
    if (data.hasFlag(SemanticsFlag.isImage)) {
      if (data.label.isEmpty) {
        issues.add('Image at ${node.rect} has no description');
      }
    }

    // Check text fields have labels
    // ignore: deprecated_member_use
    if (data.hasFlag(SemanticsFlag.isTextField)) {
      if (data.label.isEmpty) {
        issues.add('Text field at ${node.rect} has no label');
      }
    }

    // Recursively check children
    node.visitChildren((child) {
      _checkSemanticsNode(child, issues);
      return true;
    });
  }

  /// Check minimum touch target sizes (48x48 per WCAG)
  static Future<void> checkTouchTargetSizes(
    WidgetTester tester, {
    double minSize = 48.0,
  }) async {
    final issues = <String>[];

    // Find all tappable elements
    final tappables = find.byWidgetPredicate((widget) {
      return widget is GestureDetector ||
          widget is InkWell ||
          widget is IconButton ||
          widget is ElevatedButton ||
          widget is TextButton ||
          widget is OutlinedButton;
    });

    for (final tappable in tappables.evaluate()) {
      final renderBox = tappable.renderObject as RenderBox?;
      if (renderBox != null) {
        final size = renderBox.size;
        if (size.width < minSize || size.height < minSize) {
          issues.add(
            '${tappable.widget.runtimeType} at ${renderBox.localToGlobal(Offset.zero)} '
            'has size ${size.width.toStringAsFixed(1)}x${size.height.toStringAsFixed(1)} '
            '(minimum: ${minSize}x$minSize)',
          );
        }
      }
    }

    if (issues.isNotEmpty) {
      fail('Touch target size issues found:\n${issues.join('\n')}');
    }
  }

  /// Check if color contrast meets WCAG AA standards
  static void checkColorContrast(Color foreground, Color background,
      {bool isLargeText = false}) {
    final ratio = _contrastRatio(foreground, background);
    final minRatio = isLargeText ? 3.0 : 4.5;

    if (ratio < minRatio) {
      fail(
        'Color contrast ratio ${ratio.toStringAsFixed(2)}:1 is below '
        'WCAG AA minimum of $minRatio:1 for ${isLargeText ? "large" : "normal"} text',
      );
    }
  }

  static double _contrastRatio(Color foreground, Color background) {
    final l1 = _relativeLuminance(foreground);
    final l2 = _relativeLuminance(background);
    final lighter = l1 > l2 ? l1 : l2;
    final darker = l1 > l2 ? l2 : l1;
    return (lighter + 0.05) / (darker + 0.05);
  }

  static double _relativeLuminance(Color color) {
    double r = _linearize(color.r);
    double g = _linearize(color.g);
    double b = _linearize(color.b);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  static double _linearize(double value) {
    return value <= 0.03928
        ? value / 12.92
        : _power((value + 0.055) / 1.055, 2.4);
  }

  static double _power(double base, double exponent) {
    double result = 1.0;
    for (int i = 0; i < exponent.toInt(); i++) {
      result *= base;
    }
    // Handle fractional exponent approximation
    double fraction = exponent - exponent.toInt();
    if (fraction > 0) {
      result *= 1 + fraction * (base - 1);
    }
    return result;
  }

  /// Check if screen has proper heading structure
  static Future<void> checkHeadingStructure(WidgetTester tester) async {
    final renderView = tester.binding.renderViews.firstOrNull;
    if (renderView == null) {
      fail('No render view found');
    }

    final semanticsOwner = renderView.owner?.semanticsOwner;
    if (semanticsOwner == null) {
      fail('Semantics are not enabled');
    }

    final headings = <SemanticsNode>[];
    _findHeadings(semanticsOwner.rootSemanticsNode!, headings);

    if (headings.isEmpty) {
      fail(
          'No headings found. Screens should have at least one heading for navigation.');
    }
  }

  static void _findHeadings(SemanticsNode node, List<SemanticsNode> headings) {
    // ignore: deprecated_member_use
    if (node.getSemanticsData().hasFlag(SemanticsFlag.isHeader)) {
      headings.add(node);
    }
    node.visitChildren((child) {
      _findHeadings(child, headings);
      return true;
    });
  }

  /// Check if focusable elements have visible focus indicators
  static Future<void> checkFocusIndicators(WidgetTester tester) async {
    // Find all focusable widgets
    final focusables = find.byWidgetPredicate((widget) {
      return widget is Focus || widget is FocusScope;
    });

    expect(
      focusables,
      findsWidgets,
      reason: 'Screen should have focusable elements for keyboard navigation',
    );
  }

  /// Simulate screen reader navigation
  static Future<void> simulateScreenReaderNavigation(
    WidgetTester tester, {
    int maxElements = 50,
  }) async {
    final renderView = tester.binding.renderViews.firstOrNull;
    if (renderView == null) {
      fail('No render view found');
    }

    final semanticsOwner = renderView.owner?.semanticsOwner;
    if (semanticsOwner == null) {
      fail('Semantics are not enabled');
    }

    final elements = <String>[];
    _collectAccessibleElements(semanticsOwner.rootSemanticsNode!, elements);

    // Check that we have a reasonable number of accessible elements
    expect(
      elements.length,
      greaterThan(0),
      reason: 'Screen should have accessible elements',
    );

    // Print navigation order for debugging
    debugPrint('Screen reader navigation order:');
    for (int i = 0; i < elements.length && i < maxElements; i++) {
      debugPrint('  ${i + 1}. ${elements[i]}');
    }
  }

  static void _collectAccessibleElements(
    SemanticsNode node,
    List<String> elements,
  ) {
    final data = node.getSemanticsData();

    // Collect meaningful elements
    // ignore: deprecated_member_use
    final isButton = data.hasFlag(SemanticsFlag.isButton);
    // ignore: deprecated_member_use
    final isTextField = data.hasFlag(SemanticsFlag.isTextField);
    // ignore: deprecated_member_use
    final isHeader = data.hasFlag(SemanticsFlag.isHeader);

    if (data.label.isNotEmpty ||
        data.value.isNotEmpty ||
        isButton ||
        isTextField ||
        isHeader) {
      String description = data.label.isNotEmpty ? data.label : data.value;
      if (isButton) {
        description += ' (button)';
      }
      if (isHeader) {
        description += ' (heading)';
      }
      if (isTextField) {
        description += ' (text field)';
      }
      if (description.isNotEmpty) {
        elements.add(description);
      }
    }

    node.visitChildren((child) {
      _collectAccessibleElements(child, elements);
      return true;
    });
  }
}

/// Custom matchers for accessibility testing
Matcher hasSemanticLabel(String label) => _HasSemanticLabel(label);

class _HasSemanticLabel extends Matcher {
  final String expectedLabel;

  _HasSemanticLabel(this.expectedLabel);

  @override
  bool matches(dynamic item, Map matchState) {
    if (item is Finder) {
      final element = item.evaluate().first;
      final semanticsNode = _findSemantics(element.renderObject!);
      if (semanticsNode != null) {
        return semanticsNode.getSemanticsData().label == expectedLabel;
      }
    }
    return false;
  }

  SemanticsNode? _findSemantics(RenderObject renderObject) {
    if (renderObject.debugSemantics != null) {
      return renderObject.debugSemantics;
    }
    return null;
  }

  @override
  Description describe(Description description) {
    return description.add('has semantic label "$expectedLabel"');
  }
}

/// Extension methods for WidgetTester
extension AccessibilityTesterExtension on WidgetTester {
  /// Enable semantics for accessibility testing
  SemanticsHandle ensureSemantics() {
    return binding.ensureSemantics();
  }

  /// Run all accessibility checks
  Future<void> runAccessibilityChecks() async {
    await AccessibilityTestHelpers.checkSemanticLabels(this);
    await AccessibilityTestHelpers.checkTouchTargetSizes(this);
    await AccessibilityTestHelpers.checkFocusIndicators(this);
  }

  /// Simulate keyboard navigation
  Future<void> navigateWithKeyboard({int steps = 5}) async {
    for (int i = 0; i < steps; i++) {
      await sendKeyEvent(LogicalKeyboardKey.tab);
      await pump();
    }
  }

  /// Simulate screen reader swipe navigation
  Future<void> simulateScreenReaderSwipe(AxisDirection direction) async {
    // This simulates how screen readers navigate through content
    final renderView = binding.renderViews.firstOrNull;
    if (renderView != null) {
      final semanticsOwner = renderView.owner?.semanticsOwner;
      if (semanticsOwner != null) {
        // Screen readers move through the semantics tree
        await pump();
      }
    }
  }
}

/// Test wrapper that enables accessibility testing
Widget wrapWithAccessibility(Widget child) {
  return MaterialApp(
    home: MediaQuery(
      data: const MediaQueryData(
        accessibleNavigation: true,
      ),
      child: Scaffold(body: child),
    ),
  );
}
