import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

/// Network connection type
enum ConnectionType {
  none,
  wifi,
  cellular,
  ethernet,
  bluetooth,
  vpn,
}

/// Network quality indicator
enum NetworkQuality {
  excellent, // >10 Mbps
  good, // 2-10 Mbps
  fair, // 0.5-2 Mbps
  poor, // <0.5 Mbps
  offline,
}

/// Network state information
class NetworkState {
  final bool isConnected;
  final ConnectionType connectionType;
  final NetworkQuality quality;
  final double? bandwidthMbps;
  final int? latencyMs;
  final DateTime timestamp;

  NetworkState({
    required this.isConnected,
    required this.connectionType,
    required this.quality,
    this.bandwidthMbps,
    this.latencyMs,
    required this.timestamp,
  });

  bool get isWiFi => connectionType == ConnectionType.wifi;
  bool get isCellular => connectionType == ConnectionType.cellular;
  bool get isMetered => connectionType == ConnectionType.cellular;
  bool get canSync => isConnected && quality != NetworkQuality.offline;
  bool get canSyncLargeData => isWiFi && quality == NetworkQuality.excellent;

  NetworkState copyWith({
    bool? isConnected,
    ConnectionType? connectionType,
    NetworkQuality? quality,
    double? bandwidthMbps,
    int? latencyMs,
    DateTime? timestamp,
  }) {
    return NetworkState(
      isConnected: isConnected ?? this.isConnected,
      connectionType: connectionType ?? this.connectionType,
      quality: quality ?? this.quality,
      bandwidthMbps: bandwidthMbps ?? this.bandwidthMbps,
      latencyMs: latencyMs ?? this.latencyMs,
      timestamp: timestamp ?? this.timestamp,
    );
  }
}

/// Monitor network connectivity and trigger sync operations
class NetworkStateMonitor extends ChangeNotifier {
  static final NetworkStateMonitor _instance = NetworkStateMonitor._internal();
  factory NetworkStateMonitor() => _instance;
  NetworkStateMonitor._internal();

  final _connectivity = Connectivity();
  StreamSubscription<ConnectivityResult>? _connectivitySubscription;

  NetworkState _currentState = NetworkState(
    isConnected: false,
    connectionType: ConnectionType.none,
    quality: NetworkQuality.offline,
    timestamp: DateTime.now(),
  );

  // Configuration
  bool _wifiOnlySync = false;
  bool _backgroundSyncEnabled = true;

  // Callbacks
  final List<Function(NetworkState)> _stateChangeCallbacks = [];

  // Getters
  NetworkState get currentState => _currentState;
  bool get isConnected => _currentState.isConnected;
  bool get isWiFi => _currentState.isWiFi;
  bool get isCellular => _currentState.isCellular;
  bool get canSync => !_wifiOnlySync || _currentState.isWiFi;
  bool get wifiOnlySync => _wifiOnlySync;
  bool get backgroundSyncEnabled => _backgroundSyncEnabled;

  /// Initialize network monitoring
  Future<void> initialize() async {
    debugPrint('[NetworkStateMonitor] Initializing...');

    // Get initial connectivity
    await _updateNetworkState();

    // Listen to connectivity changes
    _connectivitySubscription = _connectivity.onConnectivityChanged.listen((result) {
      _updateNetworkState();
    });

    debugPrint('[NetworkStateMonitor] Initialized: ${_currentState.connectionType}');
  }

  /// Update network state
  Future<void> _updateNetworkState() async {
    final result = await _connectivity.checkConnectivity();
    final connectionType = _mapConnectionType(result);
    final isConnected = connectionType != ConnectionType.none;

    // Estimate network quality
    final quality = await _estimateNetworkQuality(connectionType);

    final previousState = _currentState;
    _currentState = NetworkState(
      isConnected: isConnected,
      connectionType: connectionType,
      quality: quality,
      timestamp: DateTime.now(),
    );

    // Notify if state changed
    if (previousState.isConnected != _currentState.isConnected ||
        previousState.connectionType != _currentState.connectionType) {
      debugPrint(
        '[NetworkStateMonitor] State changed: ${_currentState.connectionType} (${_currentState.quality})',
      );

      notifyListeners();

      // Trigger callbacks
      for (final callback in _stateChangeCallbacks) {
        try {
          callback(_currentState);
        } catch (e) {
          debugPrint('[NetworkStateMonitor] Callback error: $e');
        }
      }
    }
  }

  /// Map connectivity result to connection type
  ConnectionType _mapConnectionType(ConnectivityResult result) {
    switch (result) {
      case ConnectivityResult.wifi:
        return ConnectionType.wifi;
      case ConnectivityResult.mobile:
        return ConnectionType.cellular;
      case ConnectivityResult.ethernet:
        return ConnectionType.ethernet;
      case ConnectivityResult.bluetooth:
        return ConnectionType.bluetooth;
      case ConnectivityResult.vpn:
        return ConnectionType.vpn;
      case ConnectivityResult.none:
      default:
        return ConnectionType.none;
    }
  }

  /// Estimate network quality
  Future<NetworkQuality> _estimateNetworkQuality(ConnectionType type) async {
    if (type == ConnectionType.none) {
      return NetworkQuality.offline;
    }

    // Simple heuristic based on connection type
    // In production, would measure actual bandwidth/latency
    switch (type) {
      case ConnectionType.wifi:
      case ConnectionType.ethernet:
        return NetworkQuality.excellent;
      case ConnectionType.cellular:
        return NetworkQuality.good;
      case ConnectionType.bluetooth:
        return NetworkQuality.fair;
      case ConnectionType.vpn:
        return NetworkQuality.good;
      case ConnectionType.none:
        return NetworkQuality.offline;
    }
  }

  /// Measure network latency (ping test)
  Future<int?> measureLatency() async {
    if (!_currentState.isConnected) return null;

    try {
      final stopwatch = Stopwatch()..start();

      // Simple HTTP ping
      // TODO: Implement actual ping test
      await Future.delayed(const Duration(milliseconds: 50));

      stopwatch.stop();
      final latencyMs = stopwatch.elapsedMilliseconds;

      _currentState = _currentState.copyWith(
        latencyMs: latencyMs,
        timestamp: DateTime.now(),
      );

      return latencyMs;
    } catch (e) {
      debugPrint('[NetworkStateMonitor] Latency measurement failed: $e');
      return null;
    }
  }

  /// Estimate bandwidth
  Future<double?> estimateBandwidth() async {
    if (!_currentState.isConnected) return null;

    try {
      // TODO: Implement bandwidth test (download small file, measure speed)
      double bandwidthMbps;

      switch (_currentState.connectionType) {
        case ConnectionType.wifi:
        case ConnectionType.ethernet:
          bandwidthMbps = 50.0; // Assume 50 Mbps for WiFi
          break;
        case ConnectionType.cellular:
          bandwidthMbps = 10.0; // Assume 10 Mbps for cellular
          break;
        default:
          bandwidthMbps = 1.0;
      }

      _currentState = _currentState.copyWith(
        bandwidthMbps: bandwidthMbps,
        timestamp: DateTime.now(),
      );

      return bandwidthMbps;
    } catch (e) {
      debugPrint('[NetworkStateMonitor] Bandwidth estimation failed: $e');
      return null;
    }
  }

  /// Register state change callback
  void onStateChange(Function(NetworkState) callback) {
    _stateChangeCallbacks.add(callback);
  }

  /// Unregister state change callback
  void removeStateChangeCallback(Function(NetworkState) callback) {
    _stateChangeCallbacks.remove(callback);
  }

  /// Set WiFi-only sync mode
  void setWiFiOnlySync(bool enabled) {
    if (_wifiOnlySync != enabled) {
      _wifiOnlySync = enabled;
      debugPrint('[NetworkStateMonitor] WiFi-only sync: $enabled');
      notifyListeners();
    }
  }

  /// Enable/disable background sync
  void setBackgroundSync(bool enabled) {
    if (_backgroundSyncEnabled != enabled) {
      _backgroundSyncEnabled = enabled;
      debugPrint('[NetworkStateMonitor] Background sync: $enabled');
      notifyListeners();
    }
  }

  /// Check if should sync now
  bool shouldSyncNow({bool largeData = false}) {
    if (!_currentState.isConnected) return false;
    if (_wifiOnlySync && !_currentState.isWiFi) return false;
    if (largeData && !_currentState.canSyncLargeData) return false;

    return true;
  }

  /// Get current network state
  Future<NetworkState> getState() async {
    await _updateNetworkState();
    return _currentState;
  }

  /// Wait for connection
  Future<NetworkState> waitForConnection({
    Duration? timeout,
    bool wifiOnly = false,
  }) async {
    final completer = Completer<NetworkState>();

    void checkConnection(NetworkState state) {
      if (state.isConnected && (!wifiOnly || state.isWiFi)) {
        completer.complete(state);
      }
    }

    // Check current state first
    if (_currentState.isConnected && (!wifiOnly || _currentState.isWiFi)) {
      return _currentState;
    }

    // Wait for connection
    onStateChange(checkConnection);

    try {
      if (timeout != null) {
        return await completer.future.timeout(timeout);
      } else {
        return await completer.future;
      }
    } finally {
      removeStateChangeCallback(checkConnection);
    }
  }

  /// Get network statistics
  NetworkStats getStats() {
    return NetworkStats(
      currentType: _currentState.connectionType,
      currentQuality: _currentState.quality,
      isConnected: _currentState.isConnected,
      latencyMs: _currentState.latencyMs,
      bandwidthMbps: _currentState.bandwidthMbps,
      wifiOnlyMode: _wifiOnlySync,
      backgroundSyncEnabled: _backgroundSyncEnabled,
    );
  }

  @override
  void dispose() {
    _connectivitySubscription?.cancel();
    _stateChangeCallbacks.clear();
    super.dispose();
  }
}

/// Network statistics
class NetworkStats {
  final ConnectionType currentType;
  final NetworkQuality currentQuality;
  final bool isConnected;
  final int? latencyMs;
  final double? bandwidthMbps;
  final bool wifiOnlyMode;
  final bool backgroundSyncEnabled;

  NetworkStats({
    required this.currentType,
    required this.currentQuality,
    required this.isConnected,
    this.latencyMs,
    this.bandwidthMbps,
    required this.wifiOnlyMode,
    required this.backgroundSyncEnabled,
  });
}
