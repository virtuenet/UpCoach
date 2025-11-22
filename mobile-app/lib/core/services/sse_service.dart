import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:sse_client/sse_client.dart';
import '../constants/app_constants.dart';
import 'auth_service.dart';

class SSEService {
  static final SSEService _instance = SSEService._internal();
  factory SSEService() => _instance;
  SSEService._internal();

  SseClient? _client;
  StreamSubscription? _subscription;
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

  /// Connect to the SSE endpoint with authentication
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
        debugPrint('SSE: No authentication token available');
        _isConnecting = false;
        return false;
      }

      // Create SSE client connection
      final uri = Uri.parse('${AppConstants.apiUrl}/api/dashboard/realtime/sse');

      _client = SseClient(
        uri,
        headers: {
          'Authorization': 'Bearer $accessToken',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      );

      // Subscribe to the event stream
      _subscription = _client!.stream.listen(
        _handleSSEEvent,
        onError: _handleError,
        onDone: _handleDisconnection,
      );

      // Wait a moment to establish connection
      await Future.delayed(const Duration(milliseconds: 500));

      _isConnected = true;
      _isConnecting = false;
      _reconnectAttempts = 0;
      _startHeartbeat();

      debugPrint('SSE: Connected successfully');
      return true;
    } catch (e) {
      debugPrint('SSE connection error: $e');
      _isConnecting = false;
      _scheduleReconnect();
      return false;
    }
  }

  /// Handle incoming SSE events
  void _handleSSEEvent(SseEvent event) {
    try {
      if (event.data == null || event.data!.isEmpty) {
        return;
      }

      // Parse the event data
      final data = jsonDecode(event.data!) as Map<String, dynamic>;
      final eventType = event.type ?? data['type'] ?? 'unknown';

      debugPrint('SSE Event received: $eventType');

      // Route the event to the appropriate stream
      switch (eventType) {
        case 'dashboard_update':
        case 'dashboard':
          _dashboardController.add(data);
          break;
        case 'coaching_metric_update':
        case 'coaching_session_update':
        case 'coaching':
          _coachingController.add(data);
          break;
        case 'habit_progress_update':
        case 'voice_journal_update':
        case 'analytics':
          _analyticsController.add(data);
          break;
        case 'real_time_notification':
        case 'notification':
          _notificationController.add(data);
          break;
        case 'heartbeat':
        case 'ping':
          // Handle heartbeat
          _handleHeartbeat(data);
          break;
        default:
          debugPrint('SSE: Unknown event type: $eventType');
          // Add to general dashboard stream as fallback
          _dashboardController.add(data);
          break;
      }
    } catch (e) {
      debugPrint('Error parsing SSE event: $e');
    }
  }

  /// Handle SSE connection errors
  void _handleError(dynamic error) {
    debugPrint('SSE error: $error');
    _isConnected = false;
    _scheduleReconnect();
  }

  /// Handle SSE disconnection
  void _handleDisconnection() {
    debugPrint('SSE: Connection closed');
    _isConnected = false;
    _stopHeartbeat();
    _scheduleReconnect();
  }

  /// Handle heartbeat messages
  void _handleHeartbeat(Map<String, dynamic> data) {
    // Respond to heartbeat if needed
    debugPrint('SSE: Heartbeat received');
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

  /// Start heartbeat monitoring
  void _startHeartbeat() {
    _stopHeartbeat();
    _heartbeatTimer = Timer.periodic(_heartbeatInterval, (timer) {
      if (_isConnected) {
        // SSE doesn't need to send heartbeats from client
        // Just monitor the connection health
        debugPrint('SSE: Heartbeat check');
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
      debugPrint('SSE: Max reconnection attempts reached');
      return;
    }

    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(_reconnectDelay, () {
      _reconnectAttempts++;
      debugPrint('SSE: Reconnection attempt $_reconnectAttempts');
      connect();
    });
  }

  /// Subscribe to user-specific updates
  Future<void> subscribeToUserUpdates(String userId) async {
    if (!_isConnected) {
      await connect();
    }

    // For SSE, subscription is typically handled on the server side
    // based on the authentication token and query parameters
    debugPrint('SSE: Subscribed to user updates for $userId');
  }

  /// Subscribe to dashboard updates
  Future<void> subscribeToDashboardUpdates() async {
    if (!_isConnected) {
      await connect();
    }

    debugPrint('SSE: Subscribed to dashboard updates');
  }

  /// Subscribe to coaching session updates
  Future<void> subscribeToCoachingUpdates(String sessionId) async {
    if (!_isConnected) {
      await connect();
    }

    debugPrint('SSE: Subscribed to coaching updates for session $sessionId');
  }

  /// Disconnect from the SSE server
  void disconnect() {
    _reconnectTimer?.cancel();
    _stopHeartbeat();

    _subscription?.cancel();
    _subscription = null;

    _client?.close();
    _client = null;

    _isConnected = false;
    _isConnecting = false;
    _reconnectAttempts = 0;

    debugPrint('SSE: Disconnected');
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

/// Extension for easier SSE integration with Riverpod
extension SSEServiceExtension on SSEService {
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
            debugPrint('Error parsing SSE data: $e');
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

/// Data models for typed streams (shared with WebSocket service)
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