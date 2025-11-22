## Mobile Performance Optimization Guide

Comprehensive guide for optimizing the UpCoach Flutter mobile app for maximum performance, smooth
animations, and minimal battery usage.

## Table of Contents

- [Overview](#overview)
- [Performance Monitoring](#performance-monitoring)
- [Image Optimization](#image-optimization)
- [List Performance](#list-performance)
- [Bundle Size Optimization](#bundle-size-optimization)
- [Memory Management](#memory-management)
- [Network Optimization](#network-optimization)
- [Animation Performance](#animation-performance)
- [State Management](#state-management)
- [Build Optimization](#build-optimization)
- [Platform-Specific Tips](#platform-specific-tips)
- [Performance Testing](#performance-testing)
- [Troubleshooting](#troubleshooting)

---

## Overview

### Performance Targets

| Metric                | Target  | Critical Threshold |
| --------------------- | ------- | ------------------ |
| Frame Rate            | 60 FPS  | < 55 FPS           |
| Frame Build Time      | < 8ms   | > 16ms             |
| Memory Usage          | < 150MB | > 200MB            |
| App Start Time        | < 2s    | > 3s               |
| Route Navigation      | < 300ms | > 500ms            |
| Bundle Size (iOS)     | < 25MB  | > 30MB             |
| Bundle Size (Android) | < 20MB  | > 25MB             |

### Quick Wins

1. Enable code minification and tree shaking
2. Use `const` constructors wherever possible
3. Implement image caching with size constraints
4. Use `ListView.builder` instead of `ListView`
5. Avoid expensive operations in `build()` methods

---

## Performance Monitoring

### Setup Performance Monitor

```dart
import 'package:upcoach/core/performance/performance_monitor.dart';
import 'package:upcoach/core/performance/performance_overlay.dart';

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return PerformanceOverlay(
      enabled: kDebugMode, // Only in debug mode
      child: MaterialApp(
        home: HomeScreen(),
      ),
    );
  }
}
```

### Track Route Performance

```dart
class MyNavigatorObserver extends NavigatorObserver {
  final PerformanceMonitor _monitor = PerformanceMonitor();

  @override
  void didPush(Route route, Route? previousRoute) {
    super.didPush(route, previousRoute);
    if (route.settings.name != null) {
      _monitor.startRouteTracking(route.settings.name!);
    }
  }

  @override
  void didReplace({Route? newRoute, Route? oldRoute}) {
    super.didReplace(newRoute: newRoute, oldRoute: oldRoute);
    if (newRoute?.settings.name != null) {
      _monitor.endRouteTracking(newRoute!.settings.name!);
    }
  }
}

// Use in MaterialApp
MaterialApp(
  navigatorObservers: [MyNavigatorObserver()],
  // ...
)
```

### View Performance Metrics

```dart
// Navigate to debug screen in development
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (_) => PerformanceDebugScreen(),
  ),
);
```

---

## Image Optimization

### Use Optimized Image Widget

```dart
import 'package:upcoach/core/performance/image_optimizer.dart';

// ❌ Bad - No optimization
Image.network(
  'https://example.com/large-image.jpg',
  width: 100,
  height: 100,
)

// ✅ Good - Optimized with caching
OptimizedImage(
  imageUrl: 'https://example.com/large-image.jpg',
  width: 100,
  height: 100,
  fit: BoxFit.cover,
)
```

### Avatar Images

```dart
// Efficient avatar rendering
OptimizedAvatar(
  imageUrl: user.avatarUrl,
  size: 40,
  initials: user.initials,
)
```

### List Thumbnails

```dart
// For list items
ListView.builder(
  itemBuilder: (context, index) {
    return ListTile(
      leading: ThumbnailImage(
        imageUrl: items[index].imageUrl,
        size: 60,
      ),
      title: Text(items[index].title),
    );
  },
)
```

### Hero Images with Optimization

```dart
// Detail page with hero animation
HeroImage(
  imageUrl: product.imageUrl,
  heroTag: 'product-${product.id}',
  height: 300,
)
```

### Image Cache Management

```dart
// Configure cache limits
ImageCacheManager().setCacheLimits(
  maxMemoryCacheSize: 100, // MB
  maxMemoryCacheCount: 100, // images
);

// Clear cache when needed
await ImageCacheManager().clearCache();

// Get cache stats
final stats = ImageCacheManager().getCacheStats();
print('Cache size: ${stats['currentSize']}');
```

### Precache Critical Images

```dart
class SplashScreen extends StatefulWidget {
  @override
  void initState() {
    super.initState();
    _precacheImages();
  }

  Future<void> _precacheImages() async {
    await ImageCacheManager().precacheImages(
      context,
      [
        'assets/logo.png',
        'assets/onboarding-1.jpg',
        'assets/onboarding-2.jpg',
      ],
    );
  }
}
```

---

## List Performance

### Use ListView.builder

```dart
// ❌ Bad - Creates all items at once
ListView(
  children: habits.map((h) => HabitCard(habit: h)).toList(),
)

// ✅ Good - Lazy builds items
ListView.builder(
  itemCount: habits.length,
  itemBuilder: (context, index) => HabitCard(habit: habits[index]),
)
```

### Implement Lazy Loading

```dart
import 'package:upcoach/core/performance/lazy_loader.dart';

// Lazy widget that builds when visible
LazyWidget(
  builder: () => ExpensiveWidget(),
  placeholder: const SizedBox(height: 100),
)
```

### Paginated Lists

```dart
// Automatic pagination
PaginatedListView<Habit>(
  fetchPage: (page, pageSize) async {
    return await habitApi.getHabits(
      page: page,
      pageSize: pageSize,
    );
  },
  itemBuilder: (context, habit) => HabitCard(habit: habit),
  pageSize: 20,
)
```

### Item Extent for Uniform Lists

```dart
// When all items have same height
ListView.builder(
  itemCount: 100,
  itemExtent: 80, // All items 80px tall
  itemBuilder: (context, index) => MyListItem(index),
)
```

### SliverList for Advanced Layouts

```dart
CustomScrollView(
  slivers: [
    SliverAppBar(/* ... */),
    SliverList(
      delegate: SliverChildBuilderDelegate(
        (context, index) => HabitCard(habits[index]),
        childCount: habits.length,
      ),
    ),
  ],
)
```

---

## Bundle Size Optimization

### Enable Code Splitting

```yaml
# flutter build configuration
flutter build apk --split-per-abi flutter build appbundle
```

### Tree Shaking

```dart
// Remove unused code automatically
flutter build apk --tree-shake-icons
```

### Analyze Bundle Size

```bash
# Analyze app size
flutter build apk --analyze-size

# Generate size tree
flutter build apk --target-platform android-arm64 --analyze-size
```

### Remove Unused Assets

```yaml
# pubspec.yaml - Only include used assets
flutter:
  assets:
    - assets/images/logo.png
    - assets/images/onboarding/
  # Don't include entire directories if not needed
```

### Minimize Dependencies

```bash
# Check dependency tree
flutter pub deps

# Remove unused dependencies
flutter pub remove unused_package
```

### Obfuscate Code

```bash
# Build with obfuscation
flutter build apk --obfuscate --split-debug-info=./debug-info
flutter build ios --obfuscate --split-debug-info=./debug-info
```

---

## Memory Management

### Dispose Controllers

```dart
class MyWidget extends StatefulWidget {
  @override
  State<MyWidget> createState() => _MyWidgetState();
}

class _MyWidgetState extends State<MyWidget> {
  final TextEditingController _controller = TextEditingController();
  StreamSubscription? _subscription;

  @override
  void dispose() {
    // ✅ Always dispose controllers
    _controller.dispose();
    _subscription?.cancel();
    super.dispose();
  }
}
```

### Avoid Memory Leaks with Listeners

```dart
class MyWidget extends StatefulWidget {
  @override
  State<MyWidget> createState() => _MyWidgetState();
}

class _MyWidgetState extends State<MyWidget> {
  void _onDataUpdate() {
    // Handle update
  }

  @override
  void initState() {
    super.initState();
    // Add listener
    dataNotifier.addListener(_onDataUpdate);
  }

  @override
  void dispose() {
    // ✅ Remove listener
    dataNotifier.removeListener(_onDataUpdate);
    super.dispose();
  }
}
```

### Use `const` Constructors

```dart
// ❌ Bad - Creates new instance every rebuild
Widget build(BuildContext context) {
  return Container(
    child: Text('Hello'),
  );
}

// ✅ Good - Reuses widget instance
Widget build(BuildContext context) {
  return Container(
    child: const Text('Hello'),
  );
}
```

### Weak References for Caches

```dart
class ImageCache {
  final Map<String, WeakReference<Image>> _cache = {};

  void cache(String key, Image image) {
    _cache[key] = WeakReference(image);
  }

  Image? get(String key) {
    return _cache[key]?.target;
  }
}
```

---

## Network Optimization

### Batch API Requests

```dart
// ❌ Bad - Multiple requests
final habits = await habitApi.getHabits();
final goals = await goalApi.getGoals();
final tasks = await taskApi.getTasks();

// ✅ Good - Single request
final dashboard = await api.getDashboard();
// Returns { habits, goals, tasks } in one call
```

### Request Caching

```dart
class ApiClient {
  final Map<String, CachedResponse> _cache = {};

  Future<T> request<T>(String endpoint, {Duration? cacheDuration}) async {
    // Check cache
    final cached = _cache[endpoint];
    if (cached != null && !cached.isExpired) {
      return cached.data as T;
    }

    // Make request
    final response = await _http.get(endpoint);

    // Cache response
    if (cacheDuration != null) {
      _cache[endpoint] = CachedResponse(
        data: response,
        expiry: DateTime.now().add(cacheDuration),
      );
    }

    return response as T;
  }
}
```

### Debounce Search Requests

```dart
class SearchScreen extends StatefulWidget {
  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  Timer? _debounce;

  void _onSearchChanged(String query) {
    // Cancel previous timer
    _debounce?.cancel();

    // Create new timer
    _debounce = Timer(const Duration(milliseconds: 500), () {
      _performSearch(query);
    });
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }
}
```

### Compress Request Payloads

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<void> sendCompressedData(Map<String, dynamic> data) async {
  final jsonData = json.encode(data);
  final compressed = gzip.encode(utf8.encode(jsonData));

  await http.post(
    Uri.parse('https://api.example.com/data'),
    headers: {
      'Content-Encoding': 'gzip',
      'Content-Type': 'application/json',
    },
    body: compressed,
  );
}
```

---

## Animation Performance

### Use RepaintBoundary

```dart
// Isolate expensive animations
RepaintBoundary(
  child: AnimatedWidget(/* ... */),
)
```

### Implicit Animations

```dart
// ✅ Good - Use built-in animated widgets
AnimatedContainer(
  duration: const Duration(milliseconds: 300),
  curve: Curves.easeInOut,
  width: _isExpanded ? 200 : 100,
)

// Instead of custom AnimationController
```

### Reduce Opacity Animations

```dart
// ❌ Bad - Expensive
AnimatedOpacity(
  opacity: _opacity,
  child: ComplexWidget(),
)

// ✅ Better - Use visibility
AnimatedSwitcher(
  duration: const Duration(milliseconds: 300),
  child: _isVisible ? ComplexWidget() : const SizedBox.shrink(),
)
```

### Cache Expensive Computations

```dart
class MyWidget extends StatefulWidget {
  @override
  State<MyWidget> createState() => _MyWidgetState();
}

class _MyWidgetState extends State<MyWidget> {
  late final List<Widget> _cachedChildren;

  @override
  void initState() {
    super.initState();
    // ✅ Compute once, not on every build
    _cachedChildren = _buildExpensiveList();
  }

  List<Widget> _buildExpensiveList() {
    return List.generate(100, (i) => ExpensiveWidget(i));
  }

  @override
  Widget build(BuildContext context) {
    return Column(children: _cachedChildren);
  }
}
```

---

## State Management

### Minimize Rebuilds with Provider

```dart
// ❌ Bad - Rebuilds entire tree
class _MyWidgetState extends State<MyWidget> {
  @override
  Widget build(BuildContext context) {
    final habits = context.watch<HabitProvider>().habits;
    return Column(
      children: [
        Header(), // Rebuilds unnecessarily
        HabitList(habits: habits),
      ],
    );
  }
}

// ✅ Good - Only rebuild what changes
class _MyWidgetState extends State<MyWidget> {
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const Header(), // Doesn't rebuild
        Consumer<HabitProvider>(
          builder: (context, provider, child) {
            return HabitList(habits: provider.habits);
          },
        ),
      ],
    );
  }
}
```

### Use Selectors

```dart
// ❌ Bad - Rebuilds on any provider change
final habits = context.watch<AppState>().habits;

// ✅ Good - Only rebuilds when habits change
final habits = context.select((AppState state) => state.habits);
```

### Immutable State Objects

```dart
// ✅ Use immutable classes
@immutable
class Habit {
  final String id;
  final String name;
  final int streak;

  const Habit({
    required this.id,
    required this.name,
    required this.streak,
  });

  // Create new instance for updates
  Habit copyWith({String? name, int? streak}) {
    return Habit(
      id: id,
      name: name ?? this.name,
      streak: streak ?? this.streak,
    );
  }
}
```

---

## Build Optimization

### Split Large Build Methods

```dart
// ❌ Bad - Huge build method
@override
Widget build(BuildContext context) {
  return Scaffold(
    appBar: AppBar(/* 50 lines */),
    body: Column(
      children: [
        /* 200 lines of widgets */
      ],
    ),
  );
}

// ✅ Good - Extract methods
@override
Widget build(BuildContext context) {
  return Scaffold(
    appBar: _buildAppBar(),
    body: Column(
      children: [
        _buildHeader(),
        _buildStats(),
        _buildContent(),
      ],
    ),
  );
}

Widget _buildAppBar() {
  return AppBar(/* ... */);
}
```

### Extract Stateless Widgets

```dart
// ❌ Bad - Anonymous widget in build
Widget build(BuildContext context) {
  return ListView.builder(
    itemBuilder: (context, index) {
      return Container(
        /* Complex widget tree */
      );
    },
  );
}

// ✅ Good - Separate widget class
Widget build(BuildContext context) {
  return ListView.builder(
    itemBuilder: (context, index) => MyListItem(index: index),
  );
}

class MyListItem extends StatelessWidget {
  final int index;
  const MyListItem({required this.index});
  // ...
}
```

### Use Keys Wisely

```dart
// For stateful widgets in lists
ListView.builder(
  itemBuilder: (context, index) {
    return MyStatefulWidget(
      key: ValueKey(items[index].id), // ✅ Preserve state
      item: items[index],
    );
  },
)
```

---

## Platform-Specific Tips

### iOS Performance

```dart
// Enable Metal rendering
// In ios/Runner/Info.plist
<key>io.flutter.embedded_views_preview</key>
<true/>

// Disable transparency in AppBar for better performance
AppBar(
  backgroundColor: Colors.blue,
  elevation: 0,
)
```

### Android Performance

```yaml
# Enable R8 in android/gradle.properties
android.enableR8=true
android.enableR8.fullMode=true

# Use NDK (Native Development Kit)
# In android/app/build.gradle
android {
    defaultConfig {
        ndk {
            abiFilters 'armeabi-v7a', 'arm64-v8a', 'x86_64'
        }
    }
}
```

### Reduce APK Size (Android)

```bash
# Build split APKs
flutter build apk --split-per-abi

# Results in:
# - app-armeabi-v7a-release.apk (32-bit ARM)
# - app-arm64-v8a-release.apk (64-bit ARM)
# - app-x86_64-release.apk (64-bit x86)
```

---

## Performance Testing

### Profile Mode

```bash
# Run in profile mode for accurate performance testing
flutter run --profile

# Generate performance report
flutter run --profile --trace-skia
```

### DevTools

```bash
# Open DevTools for profiling
flutter pub global activate devtools
flutter pub global run devtools

# In separate terminal
flutter run --profile
```

### Automated Performance Tests

```dart
// test/performance/home_screen_perf_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

void main() {
  final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Home screen scrolling performance', (tester) async {
    await tester.pumpWidget(MyApp());
    await tester.pumpAndSettle();

    // Start recording timeline
    await binding.traceAction(() async {
      // Scroll list
      await tester.fling(
        find.byType(ListView),
        const Offset(0, -500),
        10000,
      );
      await tester.pumpAndSettle();
    });

    // Performance metrics automatically collected
  });
}
```

### Memory Profiling

```bash
# Run with memory profiling
flutter run --profile --trace-skia

# In DevTools, check:
# - Memory tab for leaks
# - Performance tab for janky frames
# - Network tab for request waterfalls
```

---

## Troubleshooting

### Issue 1: Jank During Scrolling

**Symptoms:**

- Dropped frames during list scrolling
- FPS drops below 60

**Solutions:**

```dart
// 1. Use ListView.builder
ListView.builder(
  itemCount: items.length,
  itemBuilder: (context, index) => ItemWidget(items[index]),
)

// 2. Add RepaintBoundary
ListView.builder(
  itemBuilder: (context, index) {
    return RepaintBoundary(
      child: ItemWidget(items[index]),
    );
  },
)

// 3. Optimize images
ThumbnailImage(
  imageUrl: item.imageUrl,
  size: 60, // Constrain size
)

// 4. Use itemExtent if all items same height
ListView.builder(
  itemExtent: 80.0,
  itemBuilder: ...
)
```

### Issue 2: High Memory Usage

**Symptoms:**

- App crashes on older devices
- Memory warnings in DevTools

**Solutions:**

```dart
// 1. Clear image cache periodically
ImageCacheManager().setCacheLimits(
  maxMemoryCacheSize: 50, // Reduce from 100
);

// 2. Dispose controllers
@override
void dispose() {
  _controller.dispose();
  _subscription?.cancel();
  super.dispose();
}

// 3. Use weak references
final cache = <String, WeakReference<Data>>{};

// 4. Limit list rendering
ListView.builder(
  itemCount: min(items.length, 100), // Cap at 100
  ...
)
```

### Issue 3: Slow App Startup

**Symptoms:**

- White screen for > 2 seconds
- Slow initial load

**Solutions:**

```dart
// 1. Defer non-critical initializations
void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Only critical init
  await Firebase.initializeApp();

  runApp(MyApp());

  // Defer rest
  Future.delayed(Duration(seconds: 1), () {
    _initializeAnalytics();
    _initializePushNotifications();
  });
}

// 2. Use deferred loading
import 'heavy_feature.dart' deferred as heavy;

// Later...
await heavy.loadLibrary();
heavy.showFeature();

// 3. Optimize splash screen
// Show meaningful content quickly
```

### Issue 4: Large Bundle Size

**Symptoms:**

- APK/IPA > 30MB
- Long download times

**Solutions:**

```bash
# 1. Analyze size
flutter build apk --analyze-size

# 2. Split by ABI
flutter build apk --split-per-abi

# 3. Remove unused resources
flutter pub run flutter_native_splash:remove
flutter pub run flutter_launcher_icons:remove

# 4. Optimize assets
# - Compress images with tools like TinyPNG
# - Use vector assets (SVG) where possible
# - Remove unused fonts
```

---

## Checklist

### Pre-Release Performance Audit

- [ ] Profile app in profile mode, not debug
- [ ] Check FPS stays above 55 on target devices
- [ ] Verify app starts in < 2 seconds
- [ ] Test scrolling performance on long lists
- [ ] Check memory doesn't exceed 150MB
- [ ] Verify image caching is working
- [ ] Test offline sync performance
- [ ] Check bundle size is under target
- [ ] Profile network requests (no unnecessary calls)
- [ ] Verify all controllers are disposed
- [ ] Check no memory leaks with DevTools
- [ ] Test on low-end devices (4GB RAM)

### Performance Best Practices

- [ ] All images use `OptimizedImage` or equivalent
- [ ] All lists use `ListView.builder` or lazy loading
- [ ] `const` constructors used where possible
- [ ] No expensive operations in `build()` methods
- [ ] Controllers disposed in `dispose()`
- [ ] Listeners removed in `dispose()`
- [ ] Network requests cached appropriately
- [ ] Search inputs debounced
- [ ] Animations use `RepaintBoundary` where needed
- [ ] State management minimizes rebuilds

---

**Last Updated:** November 19, 2025 **Version:** 1.0 **Dependencies:** cached_network_image,
flutter_devtools

For more information:

- [Flutter Performance Best Practices](https://flutter.dev/docs/perf/best-practices)
- [Flutter Performance Profiling](https://flutter.dev/docs/perf/rendering/ui-performance)
- [DevTools Documentation](https://flutter.dev/docs/development/tools/devtools)
