import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:golden_toolkit/golden_toolkit.dart';

/// Golden test configuration for UpCoach mobile app
class GoldenTestConfig {
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

  /// Set up golden test configuration
  static void setUp() {
    TestWidgetsFlutterBinding.ensureInitialized();

    // Configure font loading for golden tests
    loadAppFonts();

    // Set default test viewport size using the new API
    final binding = TestWidgetsFlutterBinding.instance;
    binding.platformDispatcher.views.first.physicalSize =
        const Size(1080, 1920);
    binding.platformDispatcher.views.first.devicePixelRatio = 3.0;
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

  static ThemeData _getLightTheme() {
    return ThemeData(
      brightness: Brightness.light,
      primarySwatch: Colors.blue,
      useMaterial3: true,
      colorScheme: const ColorScheme.light(
        primary: Color(0xFF1976D2),
        secondary: Color(0xFF039BE5),
        surface: Colors.white,
        surfaceContainerHighest: Color(0xFFF5F5F5),
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
        surface: Color(0xFF1E1E1E),
        surfaceContainerHighest: Color(0xFF121212),
      ),
      fontFamily: 'Poppins',
    );
  }
}

/// Custom golden test matcher with tolerance
Matcher matchesGoldenFileWithTolerance(String key, {double tolerance = 0.05}) {
  // Use standard matchesGoldenFile matcher
  return matchesGoldenFile(key);
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
