import 'dart:async';
import 'package:flutter/foundation.dart';
import 'websocket_service.dart';
import 'sse_service.dart';

enum RealTimeConnectionType { websocket, sse, auto }

class RealTimeService {
  static final RealTimeService _instance = RealTimeService._internal();
  factory RealTimeService() => _instance;
  RealTimeService._internal();

  final WebSocketService _webSocketService = WebSocketService();
  final SSEService _sseService = SSEService();

  RealTimeConnectionType _currentConnectionType = RealTimeConnectionType.auto;
  RealTimeConnectionType _preferredConnectionType = RealTimeConnectionType.websocket;
  bool _isConnected = false;

  // Stream controllers for unified access
  final StreamController<Map<String, dynamic>> _dashboardController =
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<Map<String, dynamic>> _coachingController =
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<Map<String, dynamic>> _notificationController =
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<Map<String, dynamic>> _analyticsController =
      StreamController<Map<String, dynamic>>.broadcast();

  // Getters for unified streams
  Stream<Map<String, dynamic>> get dashboardStream => _dashboardController.stream;
  Stream<Map<String, dynamic>> get coachingStream => _coachingController.stream;
  Stream<Map<String, dynamic>> get notificationStream => _notificationController.stream;
  Stream<Map<String, dynamic>> get analyticsStream => _analyticsController.stream;

  bool get isConnected => _isConnected;
  RealTimeConnectionType get currentConnectionType => _currentConnectionType;

  /// Initialize the real-time service with preferred connection type
  Future<void> initialize({
    RealTimeConnectionType preferredType = RealTimeConnectionType.websocket,
  }) async {
    _preferredConnectionType = preferredType;
    await connect();
  }

  /// Connect using the best available method
  Future<bool> connect() async {
    if (_isConnected) {
      return true;
    }

    debugPrint('RealTimeService: Connecting...');

    bool connected = false;

    switch (_preferredConnectionType) {
      case RealTimeConnectionType.websocket:
        connected = await _connectWebSocket();
        if (!connected) {
          debugPrint('RealTimeService: WebSocket failed, trying SSE...');
          connected = await _connectSSE();
        }
        break;
      case RealTimeConnectionType.sse:
        connected = await _connectSSE();
        if (!connected) {
          debugPrint('RealTimeService: SSE failed, trying WebSocket...');
          connected = await _connectWebSocket();
        }
        break;
      case RealTimeConnectionType.auto:
        // Try WebSocket first, then fallback to SSE
        connected = await _connectWebSocket();
        if (!connected) {
          debugPrint('RealTimeService: WebSocket failed, trying SSE...');
          connected = await _connectSSE();
        }
        break;
    }

    if (connected) {
      _isConnected = true;
      _setupStreamForwarding();
      debugPrint('RealTimeService: Connected using $_currentConnectionType');
    } else {
      debugPrint('RealTimeService: Failed to connect with any method');
    }

    return connected;
  }

  /// Attempt WebSocket connection
  Future<bool> _connectWebSocket() async {
    try {
      final connected = await _webSocketService.connect();
      if (connected) {
        _currentConnectionType = RealTimeConnectionType.websocket;
        return true;
      }
    } catch (e) {
      debugPrint('WebSocket connection failed: $e');
    }
    return false;
  }

  /// Attempt SSE connection
  Future<bool> _connectSSE() async {
    try {
      final connected = await _sseService.connect();
      if (connected) {
        _currentConnectionType = RealTimeConnectionType.sse;
        return true;
      }
    } catch (e) {
      debugPrint('SSE connection failed: $e');
    }
    return false;
  }

  /// Setup stream forwarding from the active service to unified streams
  void _setupStreamForwarding() {
    switch (_currentConnectionType) {
      case RealTimeConnectionType.websocket:
        _webSocketService.dashboardStream.listen(
          (data) => _dashboardController.add(data),
          onError: (error) => debugPrint('WebSocket dashboard stream error: $error'),
        );
        _webSocketService.coachingStream.listen(
          (data) => _coachingController.add(data),
          onError: (error) => debugPrint('WebSocket coaching stream error: $error'),
        );
        _webSocketService.notificationStream.listen(
          (data) => _notificationController.add(data),
          onError: (error) => debugPrint('WebSocket notification stream error: $error'),
        );
        _webSocketService.analyticsStream.listen(
          (data) => _analyticsController.add(data),
          onError: (error) => debugPrint('WebSocket analytics stream error: $error'),
        );
        break;
      case RealTimeConnectionType.sse:
        _sseService.dashboardStream.listen(
          (data) => _dashboardController.add(data),
          onError: (error) => debugPrint('SSE dashboard stream error: $error'),
        );
        _sseService.coachingStream.listen(
          (data) => _coachingController.add(data),
          onError: (error) => debugPrint('SSE coaching stream error: $error'),
        );
        _sseService.notificationStream.listen(
          (data) => _notificationController.add(data),
          onError: (error) => debugPrint('SSE notification stream error: $error'),
        );
        _sseService.analyticsStream.listen(
          (data) => _analyticsController.add(data),
          onError: (error) => debugPrint('SSE analytics stream error: $error'),
        );
        break;
      case RealTimeConnectionType.auto:
        // This case shouldn't happen in _setupStreamForwarding
        break;
    }
  }

  /// Subscribe to user-specific updates
  Future<void> subscribeToUserUpdates(String userId) async {
    if (!_isConnected) {
      await connect();
    }

    switch (_currentConnectionType) {
      case RealTimeConnectionType.websocket:
        await _webSocketService.subscribeToUserUpdates(userId);
        break;
      case RealTimeConnectionType.sse:
        await _sseService.subscribeToUserUpdates(userId);
        break;
      case RealTimeConnectionType.auto:
        break;
    }
  }

  /// Subscribe to dashboard updates
  Future<void> subscribeToDashboardUpdates() async {
    if (!_isConnected) {
      await connect();
    }

    switch (_currentConnectionType) {
      case RealTimeConnectionType.websocket:
        await _webSocketService.subscribeToDashboardUpdates();
        break;
      case RealTimeConnectionType.sse:
        await _sseService.subscribeToDashboardUpdates();
        break;
      case RealTimeConnectionType.auto:
        break;
    }
  }

  /// Subscribe to coaching session updates
  Future<void> subscribeToCoachingUpdates(String sessionId) async {
    if (!_isConnected) {
      await connect();
    }

    switch (_currentConnectionType) {
      case RealTimeConnectionType.websocket:
        await _webSocketService.subscribeToCoachingUpdates(sessionId);
        break;
      case RealTimeConnectionType.sse:
        await _sseService.subscribeToCoachingUpdates(sessionId);
        break;
      case RealTimeConnectionType.auto:
        break;
    }
  }

  /// Emit data (only available with WebSocket)
  void emit(String event, Map<String, dynamic> data) {
    if (_currentConnectionType == RealTimeConnectionType.websocket) {
      _webSocketService.emit(event, data);
    } else {
      debugPrint('RealTimeService: emit() not supported with SSE connection');
    }
  }

  /// Join a room (only available with WebSocket)
  void joinRoom(String roomId) {
    if (_currentConnectionType == RealTimeConnectionType.websocket) {
      _webSocketService.joinRoom(roomId);
    } else {
      debugPrint('RealTimeService: joinRoom() not supported with SSE connection');
    }
  }

  /// Leave a room (only available with WebSocket)
  void leaveRoom(String roomId) {
    if (_currentConnectionType == RealTimeConnectionType.websocket) {
      _webSocketService.leaveRoom(roomId);
    } else {
      debugPrint('RealTimeService: leaveRoom() not supported with SSE connection');
    }
  }

  /// Get typed stream for dashboard data
  Stream<DashboardData> getDashboardDataStream() {
    return dashboardStream
        .where((data) => data.isNotEmpty)
        .map((data) => DashboardData.fromJson(data));
  }

  /// Get typed stream for coaching session data
  Stream<CoachingSessionData> getCoachingSessionStream() {
    return coachingStream
        .where((data) => data.isNotEmpty)
        .map((data) => CoachingSessionData.fromJson(data));
  }

  /// Switch connection type at runtime
  Future<bool> switchConnectionType(RealTimeConnectionType newType) async {
    if (newType == _currentConnectionType) {
      return true;
    }

    debugPrint('RealTimeService: Switching connection type to $newType');

    // Disconnect current connection
    disconnect();

    // Set new preferred type and reconnect
    _preferredConnectionType = newType;
    return await connect();
  }

  /// Check connection health
  bool isConnectionHealthy() {
    switch (_currentConnectionType) {
      case RealTimeConnectionType.websocket:
        return _webSocketService.isConnected;
      case RealTimeConnectionType.sse:
        return _sseService.isConnected;
      case RealTimeConnectionType.auto:
        return false;
    }
  }

  /// Disconnect from the current service
  void disconnect() {
    _isConnected = false;

    switch (_currentConnectionType) {
      case RealTimeConnectionType.websocket:
        _webSocketService.disconnect();
        break;
      case RealTimeConnectionType.sse:
        _sseService.disconnect();
        break;
      case RealTimeConnectionType.auto:
        break;
    }

    debugPrint('RealTimeService: Disconnected');
  }

  /// Dispose of all resources
  void dispose() {
    disconnect();
    _webSocketService.dispose();
    _sseService.dispose();
    _dashboardController.close();
    _coachingController.close();
    _notificationController.close();
    _analyticsController.close();
  }
}