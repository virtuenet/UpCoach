import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

import '../models/companion_data_model.dart';

/// Service for managing Watch Connectivity (iOS) and Wearable Data Layer (Android)
class WatchConnectivityService {
  /// Method channel for bidirectional communication
  static const MethodChannel _channel =
      MethodChannel('com.upcoach/watch_connectivity');

  /// Event channel for receiving messages from watch
  static const EventChannel _eventChannel =
      EventChannel('com.upcoach/watch_events');

  /// Stream subscription for watch events
  StreamSubscription<dynamic>? _eventSubscription;

  /// Stream controller for connection state
  final _connectionStateController =
      StreamController<WatchConnectionState>.broadcast();

  /// Stream controller for received messages
  final _messageController =
      StreamController<CompanionSyncMessage>.broadcast();

  /// Current connection state
  WatchConnectionState _connectionState = WatchConnectionState.disconnected;

  /// Stream of connection state changes
  Stream<WatchConnectionState> get connectionStateStream =>
      _connectionStateController.stream;

  /// Stream of received messages
  Stream<CompanionSyncMessage> get messageStream => _messageController.stream;

  /// Current connection state
  WatchConnectionState get connectionState => _connectionState;

  /// Initialize watch connectivity
  Future<void> initialize() async {
    try {
      // Activate session
      final activated = await _channel.invokeMethod<bool>('activateSession');
      if (activated == true) {
        _updateConnectionState(WatchConnectionState.connected);
      }

      // Start listening for events
      _startListening();

      debugPrint('WatchConnectivityService initialized');
    } on PlatformException catch (e) {
      debugPrint('Error initializing watch connectivity: $e');
      _updateConnectionState(WatchConnectionState.notSupported);
    } on MissingPluginException {
      debugPrint('Watch connectivity not supported on this platform');
      _updateConnectionState(WatchConnectionState.notSupported);
    }
  }

  /// Dispose resources
  void dispose() {
    _eventSubscription?.cancel();
    _connectionStateController.close();
    _messageController.close();
  }

  /// Update connection state
  void _updateConnectionState(WatchConnectionState state) {
    _connectionState = state;
    _connectionStateController.add(state);
  }

  /// Start listening for watch events
  void _startListening() {
    _eventSubscription = _eventChannel.receiveBroadcastStream().listen(
          _handleEvent,
          onError: _handleError,
          onDone: () => _updateConnectionState(WatchConnectionState.disconnected),
        );
  }

  /// Handle incoming event from watch
  void _handleEvent(dynamic event) {
    if (event == null) return;

    try {
      if (event is String) {
        // Check if it's a connection state update
        if (event.startsWith('connection:')) {
          final state = event.substring('connection:'.length);
          switch (state) {
            case 'connected':
              _updateConnectionState(WatchConnectionState.connected);
              break;
            case 'disconnected':
              _updateConnectionState(WatchConnectionState.disconnected);
              break;
            case 'notReachable':
              _updateConnectionState(WatchConnectionState.notReachable);
              break;
          }
          return;
        }

        // Parse as message
        final json = jsonDecode(event) as Map<String, dynamic>;
        final message = CompanionSyncMessage.fromJson(json);
        _messageController.add(message);
      }
    } catch (e) {
      debugPrint('Error parsing watch event: $e');
    }
  }

  /// Handle event stream error
  void _handleError(Object error) {
    debugPrint('Watch event stream error: $error');
    _updateConnectionState(WatchConnectionState.disconnected);
  }

  /// Check if watch app is installed
  Future<bool> isWatchAppInstalled() async {
    try {
      final result =
          await _channel.invokeMethod<bool>('isWatchAppInstalled');
      return result ?? false;
    } on PlatformException {
      return false;
    } on MissingPluginException {
      return false;
    }
  }

  /// Check if watch is reachable
  Future<bool> isWatchReachable() async {
    try {
      final result = await _channel.invokeMethod<bool>('isReachable');
      return result ?? false;
    } on PlatformException {
      return false;
    } on MissingPluginException {
      return false;
    }
  }

  /// Send message to watch
  Future<bool> sendMessage(CompanionSyncMessage message) async {
    try {
      final result = await _channel.invokeMethod<bool>('sendMessage', {
        'message': jsonEncode(message.toJson()),
      });
      return result ?? false;
    } on PlatformException catch (e) {
      debugPrint('Error sending message to watch: $e');
      return false;
    } on MissingPluginException {
      return false;
    }
  }

  /// Send companion data to watch
  Future<bool> sendCompanionData(CompanionData data) async {
    final message = CompanionSyncMessage(
      type: CompanionMessageType.fullSync,
      timestamp: DateTime.now(),
      data: data,
    );
    return sendMessage(message);
  }

  /// Update application context (persisted data)
  Future<bool> updateApplicationContext(Map<String, dynamic> context) async {
    try {
      final result = await _channel.invokeMethod<bool>(
        'updateApplicationContext',
        {'context': jsonEncode(context)},
      );
      return result ?? false;
    } on PlatformException catch (e) {
      debugPrint('Error updating application context: $e');
      return false;
    } on MissingPluginException {
      return false;
    }
  }

  /// Get current application context
  Future<Map<String, dynamic>?> getApplicationContext() async {
    try {
      final result =
          await _channel.invokeMethod<String>('getApplicationContext');
      if (result == null) return null;
      return jsonDecode(result) as Map<String, dynamic>;
    } on PlatformException catch (e) {
      debugPrint('Error getting application context: $e');
      return null;
    } on MissingPluginException {
      return null;
    }
  }

  /// Transfer user info to watch (queued transfer)
  Future<bool> transferUserInfo(Map<String, dynamic> userInfo) async {
    try {
      final result = await _channel.invokeMethod<bool>(
        'transferUserInfo',
        {'userInfo': jsonEncode(userInfo)},
      );
      return result ?? false;
    } on PlatformException catch (e) {
      debugPrint('Error transferring user info: $e');
      return false;
    } on MissingPluginException {
      return false;
    }
  }

  /// Transfer file to watch
  Future<bool> transferFile(String filePath, {Map<String, dynamic>? metadata}) async {
    try {
      final result = await _channel.invokeMethod<bool>(
        'transferFile',
        {
          'filePath': filePath,
          if (metadata != null) 'metadata': jsonEncode(metadata),
        },
      );
      return result ?? false;
    } on PlatformException catch (e) {
      debugPrint('Error transferring file: $e');
      return false;
    } on MissingPluginException {
      return false;
    }
  }

  /// Get paired watch info
  Future<PairedWatchInfo?> getPairedWatchInfo() async {
    try {
      final result =
          await _channel.invokeMethod<Map<dynamic, dynamic>>('getPairedWatch');
      if (result == null) return null;

      return PairedWatchInfo(
        name: result['name'] as String? ?? 'Unknown',
        model: result['model'] as String? ?? 'Unknown',
        osVersion: result['osVersion'] as String? ?? 'Unknown',
        isWatchAppInstalled: result['isWatchAppInstalled'] as bool? ?? false,
      );
    } on PlatformException catch (e) {
      debugPrint('Error getting paired watch info: $e');
      return null;
    } on MissingPluginException {
      return null;
    }
  }
}

/// Watch connection state
enum WatchConnectionState {
  /// Not connected to watch
  disconnected,

  /// Connected and reachable
  connected,

  /// Watch is paired but not currently reachable
  notReachable,

  /// Watch connectivity not supported on this device/platform
  notSupported,
}

/// Paired watch information
class PairedWatchInfo {
  final String name;
  final String model;
  final String osVersion;
  final bool isWatchAppInstalled;

  const PairedWatchInfo({
    required this.name,
    required this.model,
    required this.osVersion,
    required this.isWatchAppInstalled,
  });
}
