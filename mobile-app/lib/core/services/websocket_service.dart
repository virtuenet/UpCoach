import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../constants/app_constants.dart';
import 'auth_service.dart';

class WebSocketService {
  static final WebSocketService _instance = WebSocketService._internal();
  factory WebSocketService() => _instance;
  WebSocketService._internal();

  IO.Socket? _socket;
  final AuthService _authService = AuthService();

  // Stream controllers for different types of real-time data
  final StreamController<Map<String, dynamic>> _dashboardController =
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<Map<String, dynamic>> _coachingController =
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<Map<String, dynamic>> _notificationController =
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<Map<String, dynamic>> _analyticsController =
      StreamController<Map<String, dynamic>>.broadcast();

  // Connection state management
  bool _isConnected = false;
  bool _isConnecting = false;
  Timer? _reconnectTimer;
  Timer? _heartbeatTimer;
  int _reconnectAttempts = 0;
  static const int _maxReconnectAttempts = 5;
  static const Duration _reconnectDelay = Duration(seconds: 5);
  static const Duration _heartbeatInterval = Duration(seconds: 30);

  // Getters for streams
  Stream<Map<String, dynamic>> get dashboardStream => _dashboardController.stream;
  Stream<Map<String, dynamic>> get coachingStream => _coachingController.stream;
  Stream<Map<String, dynamic>> get notificationStream => _notificationController.stream;
  Stream<Map<String, dynamic>> get analyticsStream => _analyticsController.stream;

  bool get isConnected => _isConnected;

  /// Connect to the WebSocket server with authentication
  Future<bool> connect() async {
    if (_isConnecting || _isConnected) {
      return _isConnected;
    }

    _isConnecting = true;

    try {
      // Get authentication token
      final accessToken = await _authService.getCurrentUser() != null
          ? await _getStoredToken()
          : null;

      if (accessToken == null) {
        debugPrint('WebSocket: No authentication token available');
        _isConnecting = false;
        return false;
      }

      // Create socket connection
      _socket = IO.io(
        AppConstants.apiUrl,
        IO.OptionBuilder()
            .setTransports(['websocket'])
            .disableAutoConnect()
            .setAuth({
              'token': accessToken,
            })
            .setExtraHeaders({
              'Authorization': 'Bearer $accessToken',
            })
            .setTimeout(10000)
            .enableReconnection()
            .setReconnectionDelay(2000)
            .setReconnectionDelayMax(10000)
            .setMaxReconnectionAttempts(5)
            .build(),
      );

      _setupEventHandlers();
      _socket!.connect();

      // Wait for connection or timeout
      bool connected = await _waitForConnection();
      _isConnecting = false;

      if (connected) {
        _startHeartbeat();
        _reconnectAttempts = 0;
        debugPrint('WebSocket: Connected successfully');
      } else {
        debugPrint('WebSocket: Connection failed');
        _scheduleReconnect();
      }

      return connected;
    } catch (e) {
      debugPrint('WebSocket connection error: $e');
      _isConnecting = false;
      _scheduleReconnect();
      return false;
    }
  }

  /// Setup event handlers for the WebSocket connection
  void _setupEventHandlers() {
    if (_socket == null) return;

    // Connection events
    _socket!.onConnect((_) {
      debugPrint('WebSocket: Connected');
      _isConnected = true;
      _reconnectAttempts = 0;
      _startHeartbeat();
    });

    _socket!.onDisconnect((_) {
      debugPrint('WebSocket: Disconnected');
      _isConnected = false;
      _stopHeartbeat();
      _scheduleReconnect();
    });

    _socket!.onConnectError((error) {
      debugPrint('WebSocket connection error: $error');
      _isConnected = false;
      _scheduleReconnect();
    });

    _socket!.onError((error) {
      debugPrint('WebSocket error: $error');
    });

    // Data events
    _socket!.on('dashboard_update', (data) {
      if (data is Map<String, dynamic>) {
        _dashboardController.add(data);
      }
    });

    _socket!.on('coaching_metric_update', (data) {
      if (data is Map<String, dynamic>) {
        _coachingController.add(data);
      }
    });

    _socket!.on('habit_progress_update', (data) {
      if (data is Map<String, dynamic>) {
        _analyticsController.add(data);
      }
    });

    _socket!.on('real_time_notification', (data) {
      if (data is Map<String, dynamic>) {
        _notificationController.add(data);
      }
    });

    _socket!.on('voice_journal_update', (data) {
      if (data is Map<String, dynamic>) {
        _analyticsController.add(data);
      }
    });

    _socket!.on('coaching_session_update', (data) {
      if (data is Map<String, dynamic>) {
        _coachingController.add(data);
      }
    });

    // Heartbeat events
    _socket!.on('ping', (_) {
      _socket!.emit('pong');
    });

    _socket!.on('pong', (_) {
      // Server responded to heartbeat
    });
  }

  /// Wait for connection to be established
  Future<bool> _waitForConnection() async {
    int attempts = 0;
    const maxAttempts = 20; // 10 seconds total
    const checkInterval = Duration(milliseconds: 500);

    while (attempts < maxAttempts && !_isConnected) {
      await Future.delayed(checkInterval);
      attempts++;
    }

    return _isConnected;
  }

  /// Get stored authentication token
  Future<String?> _getStoredToken() async {
    try {
      // This would typically get the token from secure storage
      // For now, we'll simulate getting it from the auth service
      return 'dummy_token'; // Replace with actual token retrieval
    } catch (e) {
      debugPrint('Error getting stored token: $e');
      return null;
    }
  }

  /// Start heartbeat to keep connection alive
  void _startHeartbeat() {
    _stopHeartbeat();
    _heartbeatTimer = Timer.periodic(_heartbeatInterval, (timer) {
      if (_isConnected && _socket != null) {
        _socket!.emit('ping');
      }
    });
  }

  /// Stop heartbeat timer
  void _stopHeartbeat() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = null;
  }

  /// Schedule reconnection attempt
  void _scheduleReconnect() {
    if (_reconnectAttempts >= _maxReconnectAttempts) {
      debugPrint('WebSocket: Max reconnection attempts reached');
      return;
    }

    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(_reconnectDelay, () {
      _reconnectAttempts++;
      debugPrint('WebSocket: Reconnection attempt $_reconnectAttempts');
      connect();
    });
  }

  /// Emit data to the server
  void emit(String event, Map<String, dynamic> data) {
    if (_isConnected && _socket != null) {
      _socket!.emit(event, data);
    } else {
      debugPrint('WebSocket: Cannot emit $event - not connected');
    }
  }

  /// Join a specific room for targeted updates
  void joinRoom(String roomId) {
    emit('join_room', {'room_id': roomId});
  }

  /// Leave a specific room
  void leaveRoom(String roomId) {
    emit('leave_room', {'room_id': roomId});
  }

  /// Subscribe to user-specific updates
  Future<void> subscribeToUserUpdates(String userId) async {
    if (!_isConnected) {
      await connect();
    }

    if (_isConnected) {
      emit('subscribe_user_updates', {'user_id': userId});
    }
  }

  /// Subscribe to dashboard updates
  Future<void> subscribeToDashboardUpdates() async {
    if (!_isConnected) {
      await connect();
    }

    if (_isConnected) {
      emit('subscribe_dashboard_updates', {});
    }
  }

  /// Subscribe to coaching session updates
  Future<void> subscribeToCoachingUpdates(String sessionId) async {
    if (!_isConnected) {
      await connect();
    }

    if (_isConnected) {
      emit('subscribe_coaching_updates', {'session_id': sessionId});
    }
  }

  /// Disconnect from the WebSocket server
  void disconnect() {
    _reconnectTimer?.cancel();
    _stopHeartbeat();

    if (_socket != null) {
      _socket!.disconnect();
      _socket!.dispose();
      _socket = null;
    }

    _isConnected = false;
    _isConnecting = false;
    _reconnectAttempts = 0;

    debugPrint('WebSocket: Disconnected');
  }

  /// Dispose of all resources
  void dispose() {
    disconnect();
    _dashboardController.close();
    _coachingController.close();
    _notificationController.close();
    _analyticsController.close();
  }
}

/// Extension for easier WebSocket integration with Riverpod
extension WebSocketServiceExtension on WebSocketService {
  /// Get a stream for a specific data type
  Stream<T> getTypedStream<T>(
    Stream<Map<String, dynamic>> stream,
    T Function(Map<String, dynamic>) fromJson,
  ) {
    return stream
        .where((data) => data.isNotEmpty)
        .map((data) {
          try {
            return fromJson(data);
          } catch (e) {
            debugPrint('Error parsing WebSocket data: $e');
            rethrow;
          }
        });
  }

  /// Get dashboard data stream with type safety
  Stream<DashboardData> getDashboardDataStream() {
    return getTypedStream(
      dashboardStream,
      (data) => DashboardData.fromJson(data),
    );
  }

  /// Get coaching session stream with type safety
  Stream<CoachingSessionData> getCoachingSessionStream() {
    return getTypedStream(
      coachingStream,
      (data) => CoachingSessionData.fromJson(data),
    );
  }
}

/// Data models for typed streams
class DashboardData {
  final String id;
  final Map<String, dynamic> metrics;
  final DateTime timestamp;

  DashboardData({
    required this.id,
    required this.metrics,
    required this.timestamp,
  });

  factory DashboardData.fromJson(Map<String, dynamic> json) {
    return DashboardData(
      id: json['id'] ?? '',
      metrics: json['metrics'] ?? {},
      timestamp: DateTime.parse(json['timestamp'] ?? DateTime.now().toIso8601String()),
    );
  }
}

class CoachingSessionData {
  final String sessionId;
  final String status;
  final Map<String, dynamic> progress;
  final DateTime timestamp;

  CoachingSessionData({
    required this.sessionId,
    required this.status,
    required this.progress,
    required this.timestamp,
  });

  factory CoachingSessionData.fromJson(Map<String, dynamic> json) {
    return CoachingSessionData(
      sessionId: json['session_id'] ?? '',
      status: json['status'] ?? '',
      progress: json['progress'] ?? {},
      timestamp: DateTime.parse(json['timestamp'] ?? DateTime.now().toIso8601String()),
    );
  }
}