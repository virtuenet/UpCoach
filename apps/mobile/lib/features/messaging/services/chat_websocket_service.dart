import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/services/api_service.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../shared/models/chat_models.dart';

/// WebSocket service for real-time chat messaging
class ChatWebSocketService {
  /// Reserved for future HTTP fallback when WebSocket is unavailable
  // ignore: unused_field
  final ApiService _apiService;
  final SecureStorage _secureStorage;

  WebSocketChannel? _channel;
  StreamSubscription? _subscription;
  Timer? _pingTimer;
  Timer? _reconnectTimer;

  bool _isConnected = false;
  bool _isConnecting = false;
  int _reconnectAttempts = 0;
  static const int _maxReconnectAttempts = 5;
  static const Duration _reconnectDelay = Duration(seconds: 3);
  static const Duration _pingInterval = Duration(seconds: 30);

  // Event stream
  final StreamController<ChatEvent> _eventController =
      StreamController<ChatEvent>.broadcast();
  Stream<ChatEvent> get chatEvents => _eventController.stream;

  // Connection status stream
  final StreamController<bool> _connectionController =
      StreamController<bool>.broadcast();
  Stream<bool> get connectionStatus => _connectionController.stream;

  ChatWebSocketService(this._apiService, this._secureStorage);

  bool get isConnected => _isConnected;

  // ============================================================================
  // Connection Management
  // ============================================================================

  /// Connect to the WebSocket server
  Future<void> connect() async {
    if (_isConnected || _isConnecting) return;

    _isConnecting = true;

    try {
      final wsUrl = await _getWebSocketUrl();

      _channel = WebSocketChannel.connect(Uri.parse(wsUrl));

      _subscription = _channel!.stream.listen(
        _handleMessage,
        onError: _handleError,
        onDone: _handleDone,
      );

      _isConnected = true;
      _isConnecting = false;
      _reconnectAttempts = 0;
      _connectionController.add(true);

      // Start ping timer
      _startPingTimer();

      debugPrint('WebSocket connected');
    } catch (e) {
      debugPrint('WebSocket connection error: $e');
      _isConnecting = false;
      _scheduleReconnect();
    }
  }

  /// Disconnect from the WebSocket server
  Future<void> disconnect() async {
    _pingTimer?.cancel();
    _reconnectTimer?.cancel();
    await _subscription?.cancel();
    await _channel?.sink.close();

    _isConnected = false;
    _connectionController.add(false);

    debugPrint('WebSocket disconnected');
  }

  Future<String> _getWebSocketUrl() async {
    final wsUrl = ApiConstants.wsUrl;
    final token = await _secureStorage.getAccessToken();

    if (token == null || token.isEmpty) {
      throw Exception('No authentication token available for WebSocket connection');
    }

    // Pass token as query parameter for WebSocket authentication
    // URL encode the token to handle special characters
    final encodedToken = Uri.encodeComponent(token);
    return '$wsUrl/ws/chat?token=$encodedToken';
  }

  void _startPingTimer() {
    _pingTimer?.cancel();
    _pingTimer = Timer.periodic(_pingInterval, (_) {
      _sendPing();
    });
  }

  void _sendPing() {
    if (_isConnected) {
      _send({'type': 'ping'});
    }
  }

  void _scheduleReconnect() {
    if (_reconnectAttempts >= _maxReconnectAttempts) {
      debugPrint('Max reconnect attempts reached');
      return;
    }

    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(_reconnectDelay * (_reconnectAttempts + 1), () {
      _reconnectAttempts++;
      debugPrint('Reconnecting... attempt $_reconnectAttempts');
      connect();
    });
  }

  // ============================================================================
  // Message Handling
  // ============================================================================

  void _handleMessage(dynamic data) {
    try {
      final Map<String, dynamic> json = jsonDecode(data as String);
      final eventType = json['type'] as String?;

      switch (eventType) {
        case 'pong':
          // Pong received, connection is alive
          break;
        case 'message':
          _handleIncomingMessage(json);
          break;
        case 'message_updated':
          _handleMessageUpdated(json);
          break;
        case 'message_deleted':
          _handleMessageDeleted(json);
          break;
        case 'message_read':
          _handleMessageRead(json);
          break;
        case 'typing':
          _handleTyping(json);
          break;
        case 'user_status':
          _handleUserStatus(json);
          break;
        case 'conversation_updated':
          _handleConversationUpdated(json);
          break;
        default:
          debugPrint('Unknown WebSocket event: $eventType');
      }
    } catch (e) {
      debugPrint('Error handling WebSocket message: $e');
    }
  }

  void _handleIncomingMessage(Map<String, dynamic> json) {
    final messageData = json['data'] as Map<String, dynamic>?;
    if (messageData != null) {
      _eventController.add(ChatEvent(
        type: ChatEventType.messageReceived,
        conversationId: messageData['conversationId'] as String?,
        messageId: messageData['id'] as String?,
        data: messageData,
        timestamp: DateTime.now(),
      ));
    }
  }

  void _handleMessageUpdated(Map<String, dynamic> json) {
    final messageData = json['data'] as Map<String, dynamic>?;
    if (messageData != null) {
      _eventController.add(ChatEvent(
        type: ChatEventType.messageUpdated,
        conversationId: messageData['conversationId'] as String?,
        messageId: messageData['id'] as String?,
        data: messageData,
        timestamp: DateTime.now(),
      ));
    }
  }

  void _handleMessageDeleted(Map<String, dynamic> json) {
    _eventController.add(ChatEvent(
      type: ChatEventType.messageDeleted,
      conversationId: json['conversationId'] as String?,
      messageId: json['messageId'] as String?,
      timestamp: DateTime.now(),
    ));
  }

  void _handleMessageRead(Map<String, dynamic> json) {
    _eventController.add(ChatEvent(
      type: ChatEventType.messageRead,
      conversationId: json['conversationId'] as String?,
      messageId: json['messageId'] as String?,
      userId: json['userId'] as String?,
      timestamp: DateTime.now(),
    ));
  }

  void _handleTyping(Map<String, dynamic> json) {
    final isTyping = json['isTyping'] as bool? ?? false;
    _eventController.add(ChatEvent(
      type:
          isTyping ? ChatEventType.typingStarted : ChatEventType.typingStopped,
      conversationId: json['conversationId'] as String?,
      userId: json['userId'] as String?,
      data: json,
      timestamp: DateTime.now(),
    ));
  }

  void _handleUserStatus(Map<String, dynamic> json) {
    final isOnline = json['isOnline'] as bool? ?? false;
    _eventController.add(ChatEvent(
      type: isOnline ? ChatEventType.userOnline : ChatEventType.userOffline,
      userId: json['userId'] as String?,
      timestamp: DateTime.now(),
    ));
  }

  void _handleConversationUpdated(Map<String, dynamic> json) {
    _eventController.add(ChatEvent(
      type: ChatEventType.conversationUpdated,
      conversationId: json['conversationId'] as String?,
      data: json['data'] as Map<String, dynamic>?,
      timestamp: DateTime.now(),
    ));
  }

  void _handleError(dynamic error) {
    debugPrint('WebSocket error: $error');
    _isConnected = false;
    _connectionController.add(false);
    _scheduleReconnect();
  }

  void _handleDone() {
    debugPrint('WebSocket connection closed');
    _isConnected = false;
    _connectionController.add(false);
    _scheduleReconnect();
  }

  // ============================================================================
  // Send Methods
  // ============================================================================

  void _send(Map<String, dynamic> data) {
    if (_channel != null && _isConnected) {
      _channel!.sink.add(jsonEncode(data));
    }
  }

  /// Send a chat message via WebSocket
  void sendMessage({
    required String conversationId,
    required String content,
    required MessageType type,
    String? replyToMessageId,
    String? mediaUrl,
    Map<String, dynamic>? metadata,
  }) {
    _send({
      'type': 'send_message',
      'conversationId': conversationId,
      'content': content,
      'messageType': type.name,
      'replyToMessageId': replyToMessageId,
      'mediaUrl': mediaUrl,
      'metadata': metadata,
    });
  }

  /// Mark messages as read
  void markAsRead({
    required String conversationId,
    String? messageId,
  }) {
    _send({
      'type': 'mark_read',
      'conversationId': conversationId,
      if (messageId != null) 'messageId': messageId,
    });
  }

  /// Send typing indicator
  void sendTypingIndicator({
    required String conversationId,
    required bool isTyping,
  }) {
    _send({
      'type': 'typing',
      'conversationId': conversationId,
      'isTyping': isTyping,
    });
  }

  /// Join a conversation room
  void joinConversation(String conversationId) {
    _send({
      'type': 'join',
      'conversationId': conversationId,
    });
  }

  /// Leave a conversation room
  void leaveConversation(String conversationId) {
    _send({
      'type': 'leave',
      'conversationId': conversationId,
    });
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  Future<void> dispose() async {
    await disconnect();
    await _eventController.close();
    await _connectionController.close();
  }
}

// Provider for SecureStorage
final secureStorageProvider = Provider<SecureStorage>((ref) {
  return SecureStorage();
});

// Provider for ChatWebSocketService
final chatWebSocketServiceProvider = Provider<ChatWebSocketService>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  final secureStorage = ref.watch(secureStorageProvider);
  final service = ChatWebSocketService(apiService, secureStorage);

  ref.onDispose(() {
    service.dispose();
  });

  return service;
});
