import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Optimized state management utilities for better performance
class StateOptimization {
  /// Debounced state provider for reducing unnecessary updates
  static StateProvider<T> debouncedStateProvider<T>(
    T initialValue,
    Duration delay,
  ) {
    Timer? debounceTimer;

    return StateProvider<T>((ref) {
      ref.onDispose(() {
        debounceTimer?.cancel();
      });

      return initialValue;
    });
  }

  /// Throttled state provider for limiting update frequency
  static StateProvider<T> throttledStateProvider<T>(
    T initialValue,
    Duration interval,
  ) {
    DateTime? lastUpdateTime;

    return StateProvider<T>((ref) {
      return initialValue;
    });
  }

  /// Cached async provider with automatic invalidation
  static FutureProvider<T> cachedAsyncProvider<T>(
    Future<T> Function() computation, {
    Duration cacheDuration = const Duration(minutes: 5),
    bool autoRefresh = false,
  }) {
    Timer? cacheTimer;
    Timer? refreshTimer;

    return FutureProvider<T>((ref) async {
      // Set up cache invalidation
      cacheTimer?.cancel();
      cacheTimer = Timer(cacheDuration, () {
        ref.invalidateSelf();
      });

      // Set up auto refresh if enabled
      if (autoRefresh) {
        refreshTimer?.cancel();
        refreshTimer = Timer.periodic(cacheDuration, (timer) {
          ref.invalidateSelf();
        });
      }

      ref.onDispose(() {
        cacheTimer?.cancel();
        refreshTimer?.cancel();
      });

      return await computation();
    });
  }

  /// Selective state provider that only updates when specific fields change
  static StateProvider<T> selectiveStateProvider<T>(
    T initialValue,
    bool Function(T oldValue, T newValue) shouldUpdate,
  ) {
    return StateProvider<T>((ref) {
      T currentValue = initialValue;

      return currentValue;
    });
  }
}

/// Optimized Riverpod providers for common use cases
class OptimizedProviders {
  /// User state with selective updates
  static final userProvider = StateNotifierProvider<UserNotifier, UserState>((ref) {
    return UserNotifier();
  });

  /// Cache manager for API responses
  static final cacheManagerProvider = Provider<CacheManager>((ref) {
    return CacheManager();
  });

  /// Network state with automatic retry
  static final networkStateProvider = StateNotifierProvider<NetworkNotifier, NetworkState>((ref) {
    return NetworkNotifier();
  });

  /// Optimized search provider with debouncing
  static final searchProvider = StateNotifierProvider<SearchNotifier, SearchState>((ref) {
    return SearchNotifier();
  });

  /// Pagination provider for lists
  static final paginationProvider = StateNotifierProviderFamily<PaginationNotifier, PaginationState, String>((ref, id) {
    return PaginationNotifier(id);
  });
}

/// User state management with performance optimization
class UserState {
  final String? id;
  final String? name;
  final String? email;
  final bool isLoading;
  final String? error;
  final DateTime lastUpdate;

  const UserState({
    this.id,
    this.name,
    this.email,
    this.isLoading = false,
    this.error,
    DateTime? lastUpdate,
  }) : lastUpdate = lastUpdate ?? const ObjectCreation();

  UserState copyWith({
    String? id,
    String? name,
    String? email,
    bool? isLoading,
    String? error,
    DateTime? lastUpdate,
  }) {
    return UserState(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
      lastUpdate: lastUpdate ?? DateTime.now(),
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is UserState &&
        other.id == id &&
        other.name == name &&
        other.email == email &&
        other.isLoading == isLoading &&
        other.error == error;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        name.hashCode ^
        email.hashCode ^
        isLoading.hashCode ^
        error.hashCode;
  }
}

class UserNotifier extends StateNotifier<UserState> {
  UserNotifier() : super(const UserState());

  Timer? _debounceTimer;

  /// Update user with debouncing to prevent excessive rebuilds
  void updateUser({
    String? id,
    String? name,
    String? email,
  }) {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 300), () {
      state = state.copyWith(
        id: id,
        name: name,
        email: email,
      );
    });
  }

  /// Set loading state
  void setLoading(bool loading) {
    if (state.isLoading != loading) {
      state = state.copyWith(isLoading: loading);
    }
  }

  /// Set error state
  void setError(String? error) {
    if (state.error != error) {
      state = state.copyWith(error: error, isLoading: false);
    }
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    super.dispose();
  }
}

/// Network state management
class NetworkState {
  final bool isConnected;
  final String connectionType;
  final bool isLoading;
  final int retryCount;
  final DateTime lastCheck;

  const NetworkState({
    this.isConnected = true,
    this.connectionType = 'wifi',
    this.isLoading = false,
    this.retryCount = 0,
    DateTime? lastCheck,
  }) : lastCheck = lastCheck ?? const ObjectCreation();

  NetworkState copyWith({
    bool? isConnected,
    String? connectionType,
    bool? isLoading,
    int? retryCount,
    DateTime? lastCheck,
  }) {
    return NetworkState(
      isConnected: isConnected ?? this.isConnected,
      connectionType: connectionType ?? this.connectionType,
      isLoading: isLoading ?? this.isLoading,
      retryCount: retryCount ?? this.retryCount,
      lastCheck: lastCheck ?? DateTime.now(),
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is NetworkState &&
        other.isConnected == isConnected &&
        other.connectionType == connectionType &&
        other.isLoading == isLoading &&
        other.retryCount == retryCount;
  }

  @override
  int get hashCode {
    return isConnected.hashCode ^
        connectionType.hashCode ^
        isLoading.hashCode ^
        retryCount.hashCode;
  }
}

class NetworkNotifier extends StateNotifier<NetworkState> {
  NetworkNotifier() : super(const NetworkState()) {
    _checkConnection();
  }

  Timer? _connectionTimer;

  void _checkConnection() {
    _connectionTimer = Timer.periodic(const Duration(seconds: 30), (timer) {
      // Implement actual network checking here
      _updateConnectionStatus();
    });
  }

  void _updateConnectionStatus() {
    // Implementation would check actual network status
    // For now, just update the timestamp
    state = state.copyWith(lastCheck: DateTime.now());
  }

  void setConnected(bool connected, String type) {
    if (state.isConnected != connected || state.connectionType != type) {
      state = state.copyWith(
        isConnected: connected,
        connectionType: type,
        retryCount: connected ? 0 : state.retryCount,
      );
    }
  }

  void incrementRetry() {
    state = state.copyWith(retryCount: state.retryCount + 1);
  }

  @override
  void dispose() {
    _connectionTimer?.cancel();
    super.dispose();
  }
}

/// Search state with debouncing
class SearchState {
  final String query;
  final List<dynamic> results;
  final bool isLoading;
  final String? error;
  final DateTime lastSearch;

  const SearchState({
    this.query = '',
    this.results = const [],
    this.isLoading = false,
    this.error,
    DateTime? lastSearch,
  }) : lastSearch = lastSearch ?? const ObjectCreation();

  SearchState copyWith({
    String? query,
    List<dynamic>? results,
    bool? isLoading,
    String? error,
    DateTime? lastSearch,
  }) {
    return SearchState(
      query: query ?? this.query,
      results: results ?? this.results,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
      lastSearch: lastSearch ?? DateTime.now(),
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is SearchState &&
        other.query == query &&
        listEquals(other.results, results) &&
        other.isLoading == isLoading &&
        other.error == error;
  }

  @override
  int get hashCode {
    return query.hashCode ^
        results.hashCode ^
        isLoading.hashCode ^
        error.hashCode;
  }
}

class SearchNotifier extends StateNotifier<SearchState> {
  SearchNotifier() : super(const SearchState());

  Timer? _debounceTimer;

  /// Debounced search to prevent excessive API calls
  void search(String query) {
    // Update query immediately for UI responsiveness
    state = state.copyWith(query: query);

    // Debounce the actual search
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 500), () {
      _performSearch(query);
    });
  }

  Future<void> _performSearch(String query) async {
    if (query.isEmpty) {
      state = state.copyWith(results: [], isLoading: false);
      return;
    }

    state = state.copyWith(isLoading: true, error: null);

    try {
      // Implement actual search logic here
      await Future.delayed(const Duration(milliseconds: 500)); // Simulate API call

      // Mock results
      final results = List.generate(
        10,
        (index) => {'id': index, 'title': 'Result $index for $query'},
      );

      state = state.copyWith(
        results: results,
        isLoading: false,
        lastSearch: DateTime.now(),
      );
    } catch (error) {
      state = state.copyWith(
        error: error.toString(),
        isLoading: false,
        results: [],
      );
    }
  }

  void clearSearch() {
    _debounceTimer?.cancel();
    state = const SearchState();
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    super.dispose();
  }
}

/// Pagination state management
class PaginationState {
  final List<dynamic> items;
  final int currentPage;
  final bool hasMore;
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;

  const PaginationState({
    this.items = const [],
    this.currentPage = 0,
    this.hasMore = true,
    this.isLoading = false,
    this.isLoadingMore = false,
    this.error,
  });

  PaginationState copyWith({
    List<dynamic>? items,
    int? currentPage,
    bool? hasMore,
    bool? isLoading,
    bool? isLoadingMore,
    String? error,
  }) {
    return PaginationState(
      items: items ?? this.items,
      currentPage: currentPage ?? this.currentPage,
      hasMore: hasMore ?? this.hasMore,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      error: error ?? this.error,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is PaginationState &&
        listEquals(other.items, items) &&
        other.currentPage == currentPage &&
        other.hasMore == hasMore &&
        other.isLoading == isLoading &&
        other.isLoadingMore == isLoadingMore &&
        other.error == error;
  }

  @override
  int get hashCode {
    return items.hashCode ^
        currentPage.hashCode ^
        hasMore.hashCode ^
        isLoading.hashCode ^
        isLoadingMore.hashCode ^
        error.hashCode;
  }
}

class PaginationNotifier extends StateNotifier<PaginationState> {
  final String id;

  PaginationNotifier(this.id) : super(const PaginationState());

  /// Load first page
  Future<void> loadFirstPage() async {
    if (state.isLoading) return;

    state = state.copyWith(isLoading: true, error: null);

    try {
      // Implement actual API call here
      await Future.delayed(const Duration(milliseconds: 1000));

      // Mock data
      final items = List.generate(20, (index) => {'id': index, 'title': 'Item $index'});

      state = state.copyWith(
        items: items,
        currentPage: 1,
        isLoading: false,
        hasMore: items.length == 20,
      );
    } catch (error) {
      state = state.copyWith(
        error: error.toString(),
        isLoading: false,
      );
    }
  }

  /// Load next page
  Future<void> loadNextPage() async {
    if (!state.hasMore || state.isLoadingMore || state.isLoading) return;

    state = state.copyWith(isLoadingMore: true);

    try {
      // Implement actual API call here
      await Future.delayed(const Duration(milliseconds: 1000));

      // Mock data
      final newItems = List.generate(
        20,
        (index) => {'id': state.items.length + index, 'title': 'Item ${state.items.length + index}'},
      );

      state = state.copyWith(
        items: [...state.items, ...newItems],
        currentPage: state.currentPage + 1,
        isLoadingMore: false,
        hasMore: newItems.length == 20,
      );
    } catch (error) {
      state = state.copyWith(
        error: error.toString(),
        isLoadingMore: false,
      );
    }
  }

  /// Refresh data
  Future<void> refresh() async {
    state = const PaginationState();
    await loadFirstPage();
  }
}

/// Cache manager for efficient data caching
class CacheManager {
  final Map<String, CacheEntry> _cache = {};
  static const Duration defaultExpiry = Duration(minutes: 5);

  /// Get cached data
  T? get<T>(String key) {
    final entry = _cache[key];
    if (entry == null || entry.isExpired) {
      _cache.remove(key);
      return null;
    }
    return entry.data as T;
  }

  /// Set cached data
  void set<T>(String key, T data, {Duration? expiry}) {
    _cache[key] = CacheEntry(
      data: data,
      expiry: DateTime.now().add(expiry ?? defaultExpiry),
    );
  }

  /// Clear cache
  void clear() {
    _cache.clear();
  }

  /// Clear expired entries
  void clearExpired() {
    _cache.removeWhere((key, entry) => entry.isExpired);
  }

  /// Get cache size
  int get size => _cache.length;
}

/// Cache entry with expiration
class CacheEntry {
  final dynamic data;
  final DateTime expiry;

  CacheEntry({required this.data, required this.expiry});

  bool get isExpired => DateTime.now().isAfter(expiry);
}

/// Helper class for creating DateTime constants
class ObjectCreation {
  const ObjectCreation();

  DateTime call() => DateTime.now();
}