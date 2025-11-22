/// Enhanced golden test configuration for comprehensive UI regression testing
library golden_test_config;

import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:golden_toolkit/golden_toolkit.dart';
import '../test_config.dart';
import '../helpers/test_utils.dart';

/// Golden test configuration and utilities
class GoldenTestConfig {
  static const String goldenPath = 'test/golden/masters/';
  static const String failurePath = 'test/golden/failures/';

  static const List<Device> testDevices = [
    Device.phone,
    Device.iphone11,
    Device.tabletPortrait,
    Device.tabletLandscape,
  ];

  static const List<ThemeMode> testThemes = [
    ThemeMode.light,
    ThemeMode.dark,
  ];

  /// Initialize golden test environment
  static Future<void> initialize() async {
    TestWidgetsFlutterBinding.ensureInitialized();

    // Configure font loading for golden tests
    await loadAppFonts();

    // Set default test viewport size
    TestWidgetsFlutterBinding.instance.window.physicalSizeTestValue =
      const Size(1080, 1920);
    TestWidgetsFlutterBinding.instance.window.devicePixelRatioTestValue = 3.0;

    // Ensure golden directories exist
    final goldenDir = Directory(goldenPath);
    final failureDir = Directory(failurePath);

    if (!await goldenDir.exists()) {
      await goldenDir.create(recursive: true);
    }
    if (!await failureDir.exists()) {
      await failureDir.create(recursive: true);
    }
  }

  /// Set up golden test configuration
  static void setUp() {
    initialize();
  }

  /// Create a test wrapper widget with theme
  static Widget testWrapper({
    required Widget child,
    ThemeMode themeMode = ThemeMode.light,
    Size? size,
  }) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: _getLightTheme(),
      darkTheme: _getDarkTheme(),
      themeMode: themeMode,
      home: Scaffold(
        body: SizedBox(
          width: size?.width,
          height: size?.height,
          child: child,
        ),
      ),
    );
  }

  /// Test a widget across multiple device configurations
  static Future<void> testMultiDevice(
    String testName,
    Widget widget, {
    List<Device> devices = testDevices,
    List<ThemeMode> themes = testThemes,
  }) async {
    for (final device in devices) {
      for (final theme in themes) {
        final themeName = theme == ThemeMode.light ? 'light' : 'dark';
        final scenarioName = '${testName}_${device.name}_$themeName';

        await testGolden(
          scenarioName,
          widget,
          device: device,
          themeMode: theme,
        );
      }
    }
  }

  /// Test a single widget configuration
  static Future<void> testGolden(
    String testName,
    Widget widget, {
    Device device = Device.phone,
    ThemeMode themeMode = ThemeMode.light,
  }) async {
    testGoldens(testName, (WidgetTester tester) async {
      await tester.pumpWidgetBuilder(
        testWrapper(
          child: widget,
          themeMode: themeMode,
        ),
        surfaceSize: device.size,
      );

      await screenMatchesGolden(tester, testName);
    });
  }

  /// Test widget in different states
  static Future<void> testWidgetStates(
    String baseName,
    Widget Function(String state) widgetBuilder, {
    List<String> states = const ['default', 'loading', 'error', 'empty'],
    Device device = Device.phone,
  }) async {
    for (final state in states) {
      await testGolden(
        '${baseName}_$state',
        widgetBuilder(state),
        device: device,
      );
    }
  }

  /// Test form fields in various states
  static Future<void> testFormField(
    String testName,
    Widget Function(String state, String? value, String? error) fieldBuilder,
  ) async {
    final testCases = [
      {'state': 'empty', 'value': null, 'error': null},
      {'state': 'filled', 'value': 'Test input', 'error': null},
      {'state': 'error', 'value': 'Invalid input', 'error': 'This field is required'},
      {'state': 'disabled', 'value': 'Disabled field', 'error': null},
      {'state': 'focused', 'value': 'Focused field', 'error': null},
    ];

    for (final testCase in testCases) {
      await testGolden(
        '${testName}_${testCase['state']}',
        fieldBuilder(
          testCase['state'] as String,
          testCase['value'] as String?,
          testCase['error'] as String?,
        ),
      );
    }
  }

  /// Test loading states
  static Future<void> testLoadingStates(
    String testName,
    Widget Function(bool isLoading, dynamic data, String? error) builder,
  ) async {
    final states = [
      {'name': 'loading', 'isLoading': true, 'data': null, 'error': null},
      {'name': 'loaded', 'isLoading': false, 'data': TestDataSeeder.userData, 'error': null},
      {'name': 'error', 'isLoading': false, 'data': null, 'error': 'Failed to load data'},
      {'name': 'empty', 'isLoading': false, 'data': [], 'error': null},
    ];

    for (final state in states) {
      await testGolden(
        '${testName}_${state['name']}',
        builder(
          state['isLoading'] as bool,
          state['data'],
          state['error'] as String?,
        ),
      );
    }
  }

  /// Generate test report
  static void generateGoldenReport() {
    print('\n🎨 GOLDEN TEST REPORT');
    print('=' * 50);
    print('Golden files location: $goldenPath');
    print('Failed comparisons: $failurePath');
    print('\nTo update golden files, run:');
    print('flutter test --update-goldens');
    print('=' * 50);
  }

  static ThemeData _getLightTheme() {
    return ThemeData(
      brightness: Brightness.light,
      primarySwatch: Colors.blue,
      useMaterial3: true,
      colorScheme: const ColorScheme.light(
        primary: Color(0xFF1976D2),
        secondary: Color(0xFF039BE5),
        surface: Color(0xFFF5F5F5),
        background: Colors.white,
      ),
      fontFamily: 'Poppins',
    );
  }

  static ThemeData _getDarkTheme() {
    return ThemeData(
      brightness: Brightness.dark,
      primarySwatch: Colors.blue,
      useMaterial3: true,
      colorScheme: const ColorScheme.dark(
        primary: Color(0xFF2196F3),
        secondary: Color(0xFF03A9F4),
        surface: Color(0xFF121212),
        background: Color(0xFF1E1E1E),
      ),
      fontFamily: 'Poppins',
    );
  }
}

/// Custom golden test matcher with tolerance
Matcher matchesGoldenFileWithTolerance(String key, {double tolerance = 0.05}) {
  return MatchesGoldenFile.withTestName(
    key,
    customPump: (tester) async {
      await tester.pump();
      await tester.pump(const Duration(seconds: 1));
    },
  );
}

/// Extension for multi-device golden testing
extension GoldenTestExtensions on WidgetTester {
  Future<void> testGoldenForDevices(
    String description,
    Widget widget,
    List<Device> devices,
  ) async {
    for (final device in devices) {
      await pumpWidgetBuilder(
        GoldenTestConfig.testWrapper(child: widget),
        surfaceSize: device.size,
      );
      
      await screenMatchesGolden(
        this,
        '${description}_${device.name}',
      );
    }
  }
  
  Future<void> testGoldenForThemes(
    String description,
    Widget widget,
    List<ThemeMode> themes,
  ) async {
    for (final theme in themes) {
      final themeName = theme == ThemeMode.light ? 'light' : 'dark';
      
      await pumpWidgetBuilder(
        GoldenTestConfig.testWrapper(
          child: widget,
          themeMode: theme,
        ),
      );
      
      await screenMatchesGolden(
        this,
        '${description}_$themeName',
      );
    }
  }
}