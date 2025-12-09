// Memory-efficient cache management utilities
//
// Provides LRU caching, time-based expiration, and memory management
// for Riverpod providers and data stores.

import 'dart:async';
import 'dart:collection';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Configuration for cache behavior
class CacheConfig {
  /// Maximum number of items in cache
  final int maxSize;

  /// Time-to-live for cached items
  final Duration? ttl;

  /// Whether to refresh TTL on access
  final bool refreshOnAccess;

  const CacheConfig({
    this.maxSize = 100,
    this.ttl,
    this.refreshOnAccess = true,
  });

  /// Quick cache for frequently accessed data
  static const quick = CacheConfig(
    maxSize: 50,
    ttl: Duration(minutes: 5),
  );

  /// Standard cache with moderate TTL
  static const standard = CacheConfig(
    maxSize: 100,
    ttl: Duration(minutes: 15),
  );

  /// Long-lived cache for static data
  static const persistent = CacheConfig(
    maxSize: 200,
    ttl: Duration(hours: 1),
  );

  /// Infinite cache (manual eviction only)
  static const infinite = CacheConfig(
    maxSize: 500,
    ttl: null,
  );
}

/// Entry in the cache with metadata
class CacheEntry<T> {
  final T value;
  final DateTime createdAt;
  DateTime lastAccessedAt;
  final Duration? ttl;

  CacheEntry({
    required this.value,
    required this.ttl,
  })  : createdAt = DateTime.now(),
        lastAccessedAt = DateTime.now();

  bool get isExpired {
    if (ttl == null) return false;
    return DateTime.now().difference(createdAt) > ttl!;
  }

  void touch() {
    lastAccessedAt = DateTime.now();
  }
}

/// LRU Cache with optional TTL support
class LruCache<K, V> {
  final int maxSize;
  final Duration? ttl;
  final bool refreshOnAccess;
  final LinkedHashMap<K, CacheEntry<V>> _cache = LinkedHashMap();
  Timer? _cleanupTimer;

  LruCache({
    this.maxSize = 100,
    this.ttl,
    this.refreshOnAccess = true,
  }) {
    // Schedule periodic cleanup if TTL is set
    if (ttl != null) {
      _cleanupTimer = Timer.periodic(
        Duration(minutes: 1),
        (_) => _cleanupExpired(),
      );
    }
  }

  factory LruCache.fromConfig(CacheConfig config) {
    return LruCache(
      maxSize: config.maxSize,
      ttl: config.ttl,
      refreshOnAccess: config.refreshOnAccess,
    );
  }

  /// Get value from cache
  V? get(K key) {
    final entry = _cache[key];
    if (entry == null) return null;

    if (entry.isExpired) {
      _cache.remove(key);
      return null;
    }

    // Move to end (most recently used)
    if (refreshOnAccess) {
      _cache.remove(key);
      entry.touch();
      _cache[key] = entry;
    }

    return entry.value;
  }

  /// Put value in cache
  void put(K key, V value) {
    // Remove if exists (to update position)
    _cache.remove(key);

    // Evict oldest if at capacity
    while (_cache.length >= maxSize) {
      _cache.remove(_cache.keys.first);
    }

    _cache[key] = CacheEntry(value: value, ttl: ttl);
  }

  /// Check if key exists and is not expired
  bool containsKey(K key) {
    final entry = _cache[key];
    if (entry == null) return false;
    if (entry.isExpired) {
      _cache.remove(key);
      return false;
    }
    return true;
  }

  /// Remove entry from cache
  V? remove(K key) {
    final entry = _cache.remove(key);
    return entry?.value;
  }

  /// Clear all entries
  void clear() {
    _cache.clear();
  }

  /// Get current size
  int get length => _cache.length;

  /// Get all keys
  Iterable<K> get keys => _cache.keys;

  /// Get all values (non-expired)
  Iterable<V> get values {
    _cleanupExpired();
    return _cache.values.map((e) => e.value);
  }

  /// Clean up expired entries
  void _cleanupExpired() {
    if (ttl == null) return;

    final expiredKeys = _cache.entries
        .where((e) => e.value.isExpired)
        .map((e) => e.key)
        .toList();

    for (final key in expiredKeys) {
      _cache.remove(key);
    }
  }

  /// Get cache statistics
  CacheStats get stats {
    _cleanupExpired();
    return CacheStats(
      size: _cache.length,
      maxSize: maxSize,
      ttl: ttl,
    );
  }

  /// Dispose cleanup timer
  void dispose() {
    _cleanupTimer?.cancel();
    _cache.clear();
  }
}

/// Cache statistics
class CacheStats {
  final int size;
  final int maxSize;
  final Duration? ttl;

  const CacheStats({
    required this.size,
    required this.maxSize,
    this.ttl,
  });

  double get utilizationPercent => (size / maxSize) * 100;

  @override
  String toString() {
    return 'CacheStats(size: $size, maxSize: $maxSize, utilization: ${utilizationPercent.toStringAsFixed(1)}%)';
  }
}

/// Global cache manager for coordinating multiple caches
class CacheManager {
  static final CacheManager _instance = CacheManager._internal();
  factory CacheManager() => _instance;
  CacheManager._internal();

  final Map<String, LruCache> _caches = {};

  /// Register a named cache
  LruCache<K, V> registerCache<K, V>(
    String name, {
    CacheConfig config = const CacheConfig(),
  }) {
    if (_caches.containsKey(name)) {
      return _caches[name] as LruCache<K, V>;
    }

    final cache = LruCache<K, V>.fromConfig(config);
    _caches[name] = cache;
    return cache;
  }

  /// Get a registered cache
  LruCache<K, V>? getCache<K, V>(String name) {
    return _caches[name] as LruCache<K, V>?;
  }

  /// Clear a specific cache
  void clearCache(String name) {
    _caches[name]?.clear();
  }

  /// Clear all caches
  void clearAll() {
    for (final cache in _caches.values) {
      cache.clear();
    }
  }

  /// Get stats for all caches
  Map<String, CacheStats> getAllStats() {
    return _caches.map((name, cache) => MapEntry(name, cache.stats));
  }

  /// Dispose all caches
  void dispose() {
    for (final cache in _caches.values) {
      cache.dispose();
    }
    _caches.clear();
  }
}

/// Cached async data provider mixin
mixin CachedAsyncMixin<T> {
  LruCache<String, T>? _cache;

  LruCache<String, T> get cache {
    _cache ??= LruCache<String, T>(maxSize: 50);
    return _cache!;
  }

  /// Get cached value or fetch
  Future<T> getCachedOrFetch(
    String key,
    Future<T> Function() fetch,
  ) async {
    final cached = cache.get(key);
    if (cached != null) return cached;

    final value = await fetch();
    cache.put(key, value);
    return value;
  }

  /// Invalidate cache entry
  void invalidate(String key) {
    cache.remove(key);
  }

  /// Invalidate all
  void invalidateAll() {
    cache.clear();
  }
}

/// Memory-aware data notifier that clears old data automatically
class MemoryEfficientNotifier<T> extends Notifier<AsyncValue<T>> {
  final Future<T> Function() fetchData;
  final Duration staleAfter;
  DateTime? _lastFetch;
  Timer? _staleTimer;

  MemoryEfficientNotifier({
    required this.fetchData,
    this.staleAfter = const Duration(minutes: 5),
  }) {
    _fetch();
  }

  @override
  AsyncValue<T> build() {
    return const AsyncValue.loading();
  }

  bool get isStale {
    if (_lastFetch == null) return true;
    return DateTime.now().difference(_lastFetch!) > staleAfter;
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    await _fetch();
  }

  Future<void> refreshIfStale() async {
    if (isStale) {
      await refresh();
    }
  }

  Future<void> _fetch() async {
    try {
      final data = await fetchData();
      _lastFetch = DateTime.now();
      state = AsyncValue.data(data);

      // Schedule stale check
      _staleTimer?.cancel();
      _staleTimer = Timer(staleAfter, () {
        // Mark as needing refresh (don't auto-refresh to save resources)
        debugPrint('Data is now stale');
      });
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  void cleanup() {
    _staleTimer?.cancel();
  }
}

/// Provider that auto-disposes after inactivity
class AutoDisposeController {
  final Duration inactivityTimeout;
  Timer? _timer;
  VoidCallback? _onDispose;

  AutoDisposeController({
    this.inactivityTimeout = const Duration(minutes: 5),
  });

  void setDisposeCallback(VoidCallback callback) {
    _onDispose = callback;
  }

  void markActive() {
    _timer?.cancel();
    _timer = Timer(inactivityTimeout, () {
      _onDispose?.call();
    });
  }

  void dispose() {
    _timer?.cancel();
  }
}

/// Chunked data loader for large lists
class ChunkedDataLoader<T> {
  final Future<List<T>> Function(int offset, int limit) fetchChunk;
  final int chunkSize;
  final List<T> _items = [];
  bool _hasMore = true;
  bool _isLoading = false;

  ChunkedDataLoader({
    required this.fetchChunk,
    this.chunkSize = 50,
  });

  List<T> get items => List.unmodifiable(_items);
  bool get hasMore => _hasMore;
  bool get isLoading => _isLoading;

  Future<void> loadMore() async {
    if (_isLoading || !_hasMore) return;

    _isLoading = true;
    try {
      final chunk = await fetchChunk(_items.length, chunkSize);
      _items.addAll(chunk);
      _hasMore = chunk.length == chunkSize;
    } finally {
      _isLoading = false;
    }
  }

  Future<void> refresh() async {
    _items.clear();
    _hasMore = true;
    await loadMore();
  }

  void clear() {
    _items.clear();
    _hasMore = true;
    _isLoading = false;
  }
}

/// Debounced state notifier to prevent excessive updates
class DebouncedNotifier<T> extends Notifier<T> {
  final T initialState;
  final Duration debounceTime;
  Timer? _debounceTimer;
  T? _pendingValue;

  DebouncedNotifier({
    required this.initialState,
    this.debounceTime = const Duration(milliseconds: 300),
  });

  @override
  T build() {
    return initialState;
  }

  void updateDebounced(T value) {
    _pendingValue = value;
    _debounceTimer?.cancel();
    _debounceTimer = Timer(debounceTime, () {
      if (_pendingValue != null) {
        state = _pendingValue as T;
        _pendingValue = null;
      }
    });
  }

  void updateImmediate(T value) {
    _debounceTimer?.cancel();
    _pendingValue = null;
    state = value;
  }

  void cleanup() {
    _debounceTimer?.cancel();
  }
}

/// Weak reference cache for memory-sensitive data
class WeakCache<K, V extends Object> {
  final Map<K, WeakReference<V>> _cache = {};

  V? get(K key) {
    final ref = _cache[key];
    if (ref == null) return null;

    final value = ref.target;
    if (value == null) {
      // Reference has been garbage collected
      _cache.remove(key);
      return null;
    }
    return value;
  }

  void put(K key, V value) {
    _cache[key] = WeakReference(value);
  }

  void remove(K key) {
    _cache.remove(key);
  }

  void clear() {
    _cache.clear();
  }

  /// Clean up dead references
  void compact() {
    _cache.removeWhere((_, ref) => ref.target == null);
  }

  int get length {
    compact();
    return _cache.length;
  }
}

/// Provider cache invalidator for Riverpod
class ProviderCacheInvalidator {
  final Ref _ref;

  ProviderCacheInvalidator(this._ref);

  /// Invalidate a provider
  void invalidate(dynamic provider) {
    _ref.invalidate(provider);
  }

  /// Invalidate multiple providers
  void invalidateAll(List<dynamic> providers) {
    for (final provider in providers) {
      _ref.invalidate(provider);
    }
  }

  /// Refresh a provider
  /// For async providers, use provider.future or provider.notifier
  T refresh<T>(dynamic provider) {
    return _ref.refresh(provider);
  }
}

/// Extension for adding caching to async providers
extension CacheableProvider<T> on Future<T> {
  /// Cache this future result
  Future<T> cached(LruCache<String, T> cache, String key) async {
    final cached = cache.get(key);
    if (cached != null) return cached;

    final value = await this;
    cache.put(key, value);
    return value;
  }
}

/// Memory pressure aware cache
class MemoryAwareCache<K, V> {
  final LruCache<K, V> _cache;
  final int lowMemoryThreshold; // percentage

  MemoryAwareCache({
    CacheConfig config = const CacheConfig(),
    this.lowMemoryThreshold = 80,
  }) : _cache = LruCache.fromConfig(config);

  V? get(K key) => _cache.get(key);

  void put(K key, V value) {
    // Check memory pressure (simplified - in production use MemoryPressureObserver)
    if (_cache.length > (_cache.maxSize * lowMemoryThreshold ~/ 100)) {
      // Evict 25% of cache under memory pressure
      final evictCount = _cache.length ~/ 4;
      for (var i = 0; i < evictCount; i++) {
        _cache.remove(_cache.keys.first);
      }
    }
    _cache.put(key, value);
  }

  void clear() => _cache.clear();

  CacheStats get stats => _cache.stats;

  void dispose() => _cache.dispose();
}
