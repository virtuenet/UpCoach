import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

/// Wearable platform type
enum WearablePlatform {
  appleWatch,
  wearOS,
  unknown,
}

/// Watch connectivity state
enum ConnectivityState {
  disconnected,
  connecting,
  connected,
  reachable,
}

/// Watch screen types
enum WatchScreenType {
  goals,
  habits,
  sessions,
  reflections,
  checkIn,
  moodTracker,
  streaks,
  quickActions,
  progress,
  achievements,
}

/// Complication type (Apple Watch)
enum ComplicationType {
  modularSmall,
  modularLarge,
  circularSmall,
  graphicCircular,
  graphicCorner,
  graphicBezel,
  graphicRectangular,
  extraLarge,
}

/// Tile type (Wear OS)
enum WearTileType {
  primary,
  secondary,
}

/// Watch message priority
enum MessagePriority {
  low,
  normal,
  high,
}

/// Haptic feedback type
enum HapticType {
  success,
  warning,
  error,
  notification,
  selection,
  impact,
}

/// Wearable device information
class WearableDevice {
  final String id;
  final String name;
  final WearablePlatform platform;
  final String osVersion;
  final ConnectivityState state;
  final bool isPaired;
  final bool isReachable;
  final Map<String, dynamic> capabilities;

  const WearableDevice({
    required this.id,
    required this.name,
    required this.platform,
    required this.osVersion,
    required this.state,
    required this.isPaired,
    required this.isReachable,
    this.capabilities = const {},
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'platform': platform.name,
        'osVersion': osVersion,
        'state': state.name,
        'isPaired': isPaired,
        'isReachable': isReachable,
        'capabilities': capabilities,
      };

  factory WearableDevice.fromJson(Map<String, dynamic> json) {
    return WearableDevice(
      id: json['id'] as String,
      name: json['name'] as String,
      platform: WearablePlatform.values.firstWhere(
        (e) => e.name == json['platform'],
        orElse: () => WearablePlatform.unknown,
      ),
      osVersion: json['osVersion'] as String,
      state: ConnectivityState.values.firstWhere(
        (e) => e.name == json['state'],
        orElse: () => ConnectivityState.disconnected,
      ),
      isPaired: json['isPaired'] as bool,
      isReachable: json['isReachable'] as bool,
      capabilities: Map<String, dynamic>.from(json['capabilities'] as Map? ?? {}),
    );
  }
}

/// Watch message for data transfer
class WatchMessage {
  final String id;
  final String type;
  final Map<String, dynamic> data;
  final MessagePriority priority;
  final DateTime timestamp;
  final bool requiresResponse;

  const WatchMessage({
    required this.id,
    required this.type,
    required this.data,
    this.priority = MessagePriority.normal,
    required this.timestamp,
    this.requiresResponse = false,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type,
        'data': data,
        'priority': priority.name,
        'timestamp': timestamp.toIso8601String(),
        'requiresResponse': requiresResponse,
      };

  factory WatchMessage.fromJson(Map<String, dynamic> json) {
    return WatchMessage(
      id: json['id'] as String,
      type: json['type'] as String,
      data: Map<String, dynamic>.from(json['data'] as Map? ?? {}),
      priority: MessagePriority.values.firstWhere(
        (e) => e.name == json['priority'],
        orElse: () => MessagePriority.normal,
      ),
      timestamp: DateTime.parse(json['timestamp'] as String),
      requiresResponse: json['requiresResponse'] as bool? ?? false,
    );
  }
}

/// Watch complication data (Apple Watch)
class ComplicationData {
  final ComplicationType type;
  final String identifier;
  final Map<String, dynamic> content;
  final DateTime? nextUpdate;

  const ComplicationData({
    required this.type,
    required this.identifier,
    required this.content,
    this.nextUpdate,
  });

  Map<String, dynamic> toJson() => {
        'type': type.name,
        'identifier': identifier,
        'content': content,
        'nextUpdate': nextUpdate?.toIso8601String(),
      };

  factory ComplicationData.fromJson(Map<String, dynamic> json) {
    return ComplicationData(
      type: ComplicationType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => ComplicationType.graphicCircular,
      ),
      identifier: json['identifier'] as String,
      content: Map<String, dynamic>.from(json['content'] as Map? ?? {}),
      nextUpdate: json['nextUpdate'] != null
          ? DateTime.parse(json['nextUpdate'] as String)
          : null,
    );
  }
}

/// Wear OS tile data
class WearTileData {
  final WearTileType type;
  final String id;
  final Map<String, dynamic> content;
  final DateTime timestamp;

  const WearTileData({
    required this.type,
    required this.id,
    required this.content,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() => {
        'type': type.name,
        'id': id,
        'content': content,
        'timestamp': timestamp.toIso8601String(),
      };

  factory WearTileData.fromJson(Map<String, dynamic> json) {
    return WearTileData(
      type: WearTileType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => WearTileType.primary,
      ),
      id: json['id'] as String,
      content: Map<String, dynamic>.from(json['content'] as Map? ?? {}),
      timestamp: DateTime.parse(json['timestamp'] as String),
    );
  }
}

/// Voice command result
class VoiceCommandResult {
  final bool success;
  final String? transcript;
  final Map<String, dynamic>? parsedData;
  final String? error;

  const VoiceCommandResult({
    required this.success,
    this.transcript,
    this.parsedData,
    this.error,
  });

  Map<String, dynamic> toJson() => {
        'success': success,
        'transcript': transcript,
        'parsedData': parsedData,
        'error': error,
      };
}

/// Sync result
class SyncResult {
  final bool success;
  final int itemsSynced;
  final DateTime timestamp;
  final String? error;

  const SyncResult({
    required this.success,
    required this.itemsSynced,
    required this.timestamp,
    this.error,
  });

  Map<String, dynamic> toJson() => {
        'success': success,
        'itemsSynced': itemsSynced,
        'timestamp': timestamp.toIso8601String(),
        'error': error,
      };
}

/// Message handler callback
typedef MessageHandler = Future<Map<String, dynamic>?> Function(
  WatchMessage message,
);

/// Wearable integration manager for Apple Watch and Wear OS
class WearableIntegration {
  static const MethodChannel _channel =
      MethodChannel('com.upcoach.app/wearable');

  static const EventChannel _eventChannel =
      EventChannel('com.upcoach.app/wearable/events');

  static WearableIntegration? _instance;
  static WearableIntegration get instance {
    _instance ??= WearableIntegration._();
    return _instance!;
  }

  WearableIntegration._() {
    _initialize();
  }

  final Map<String, MessageHandler> _messageHandlers = {};
  final List<WearableDevice> _connectedDevices = [];
  final List<StreamSubscription> _subscriptions = [];
  final StreamController<WearableDevice> _deviceController =
      StreamController<WearableDevice>.broadcast();
  final StreamController<WatchMessage> _messageController =
      StreamController<WatchMessage>.broadcast();
  final StreamController<ConnectivityState> _connectivityController =
      StreamController<ConnectivityState>.broadcast();

  bool _isInitialized = false;
  Timer? _syncTimer;
  WearablePlatform? _platform;

  /// Stream of connected devices
  Stream<WearableDevice> get deviceStream => _deviceController.stream;

  /// Stream of incoming messages
  Stream<WatchMessage> get messageStream => _messageController.stream;

  /// Stream of connectivity state changes
  Stream<ConnectivityState> get connectivityStream =>
      _connectivityController.stream;

  /// Current wearable platform
  WearablePlatform? get platform => _platform;

  /// Initialize the wearable integration
  Future<void> _initialize() async {
    if (_isInitialized) return;

    try {
      _channel.setMethodCallHandler(_handleMethodCall);

      final eventSubscription = _eventChannel.receiveBroadcastStream().listen(
            _handleEvent,
            onError: (error) {
              debugPrint('Wearable event stream error: $error');
            },
          );
      _subscriptions.add(eventSubscription);

      if (Platform.isIOS) {
        _platform = WearablePlatform.appleWatch;
        await _initializeWatchKit();
      } else if (Platform.isAndroid) {
        _platform = WearablePlatform.wearOS;
        await _initializeWearOS();
      }

      _registerDefaultHandlers();
      _isInitialized = true;
      debugPrint('WearableIntegration initialized for $_platform');
    } catch (e) {
      debugPrint('Failed to initialize WearableIntegration: $e');
    }
  }

  /// Initialize Apple Watch WatchKit
  Future<void> _initializeWatchKit() async {
    try {
      await _channel.invokeMethod('initializeWatchKit');
      await _activateSession();
    } catch (e) {
      debugPrint('Failed to initialize WatchKit: $e');
    }
  }

  /// Initialize Wear OS
  Future<void> _initializeWearOS() async {
    try {
      await _channel.invokeMethod('initializeWearOS');
      await _connectToWearableNodes();
    } catch (e) {
      debugPrint('Failed to initialize Wear OS: $e');
    }
  }

  /// Activate WatchConnectivity session (iOS)
  Future<void> _activateSession() async {
    try {
      await _channel.invokeMethod('activateSession');
      final devices = await _getConnectedDevices();
      _connectedDevices.clear();
      _connectedDevices.addAll(devices);
    } catch (e) {
      debugPrint('Failed to activate session: $e');
    }
  }

  /// Connect to Wear OS nodes (Android)
  Future<void> _connectToWearableNodes() async {
    try {
      await _channel.invokeMethod('connectToNodes');
      final devices = await _getConnectedDevices();
      _connectedDevices.clear();
      _connectedDevices.addAll(devices);
    } catch (e) {
      debugPrint('Failed to connect to nodes: $e');
    }
  }

  /// Register default message handlers
  void _registerDefaultHandlers() {
    // Goal data request
    registerMessageHandler('getGoals', (message) async {
      return {
        'goals': [
          {
            'id': '1',
            'name': 'Daily Exercise',
            'progress': 0.7,
            'target': 30,
            'current': 21,
          },
          {
            'id': '2',
            'name': 'Read 20 Books',
            'progress': 0.4,
            'target': 20,
            'current': 8,
          },
        ],
      };
    });

    // Habit data request
    registerMessageHandler('getHabits', (message) async {
      return {
        'habits': [
          {'id': '1', 'name': 'Meditate', 'completed': true, 'streak': 15},
          {'id': '2', 'name': 'Journal', 'completed': true, 'streak': 8},
          {'id': '3', 'name': 'Exercise', 'completed': false, 'streak': 12},
          {'id': '4', 'name': 'Read', 'completed': false, 'streak': 5},
        ],
      };
    });

    // Session data request
    registerMessageHandler('getSessions', (message) async {
      final now = DateTime.now();
      return {
        'sessions': [
          {
            'id': '1',
            'coachName': 'Sarah Johnson',
            'time': now.add(const Duration(hours: 2)).toIso8601String(),
            'duration': 60,
            'type': 'Career Coaching',
          },
        ],
      };
    });

    // Log habit completion
    registerMessageHandler('logHabit', (message) async {
      final habitId = message.data['habitId'] as String?;
      final completed = message.data['completed'] as bool? ?? true;

      debugPrint('Habit logged: $habitId = $completed');

      return {
        'success': true,
        'habitId': habitId,
        'completed': completed,
      };
    });

    // Quick check-in
    registerMessageHandler('quickCheckIn', (message) async {
      final mood = message.data['mood'] as String?;
      final notes = message.data['notes'] as String?;

      debugPrint('Quick check-in: mood=$mood, notes=$notes');

      return {
        'success': true,
        'checkInId': DateTime.now().millisecondsSinceEpoch.toString(),
      };
    });

    // Start session
    registerMessageHandler('startSession', (message) async {
      final sessionId = message.data['sessionId'] as String?;

      debugPrint('Starting session: $sessionId');

      return {
        'success': true,
        'sessionId': sessionId,
        'startedAt': DateTime.now().toIso8601String(),
      };
    });
  }

  /// Handle method calls from native code
  Future<dynamic> _handleMethodCall(MethodCall call) async {
    try {
      switch (call.method) {
        case 'onMessageReceived':
          return await _handleMessageReceived(call.arguments);

        case 'onDeviceConnected':
          _handleDeviceConnected(call.arguments);
          return null;

        case 'onDeviceDisconnected':
          _handleDeviceDisconnected(call.arguments);
          return null;

        case 'onStateChanged':
          _handleStateChanged(call.arguments);
          return null;

        case 'getComplicationData':
          return await _getComplicationData(call.arguments);

        case 'getTileData':
          return await _getTileData(call.arguments);

        case 'handleVoiceCommand':
          return await _handleVoiceCommand(call.arguments);

        default:
          debugPrint('Unknown method call: ${call.method}');
          return null;
      }
    } catch (e) {
      debugPrint('Error handling method call ${call.method}: $e');
      rethrow;
    }
  }

  /// Handle events from native code
  void _handleEvent(dynamic event) {
    try {
      if (event is Map) {
        final eventType = event['type'] as String?;
        final data = event['data'] as Map?;

        switch (eventType) {
          case 'syncCompleted':
            _onSyncCompleted(data);
            break;
          case 'complicationUpdated':
            _onComplicationUpdated(data);
            break;
          case 'tileUpdated':
            _onTileUpdated(data);
            break;
          default:
            debugPrint('Unknown event type: $eventType');
        }
      }
    } catch (e) {
      debugPrint('Error handling event: $e');
    }
  }

  /// Handle incoming message
  Future<Map<String, dynamic>?> _handleMessageReceived(dynamic arguments) async {
    try {
      final message = WatchMessage.fromJson(
        Map<String, dynamic>.from(arguments as Map),
      );

      _messageController.add(message);

      final handler = _messageHandlers[message.type];
      if (handler != null) {
        final response = await handler(message);
        return response;
      }

      return null;
    } catch (e) {
      debugPrint('Error handling message received: $e');
      return null;
    }
  }

  /// Handle device connected
  void _handleDeviceConnected(dynamic arguments) {
    try {
      final device = WearableDevice.fromJson(
        Map<String, dynamic>.from(arguments as Map),
      );

      _connectedDevices.add(device);
      _deviceController.add(device);
      _connectivityController.add(ConnectivityState.connected);

      debugPrint('Device connected: ${device.name}');
    } catch (e) {
      debugPrint('Error handling device connected: $e');
    }
  }

  /// Handle device disconnected
  void _handleDeviceDisconnected(dynamic arguments) {
    try {
      final deviceId = arguments['deviceId'] as String;

      _connectedDevices.removeWhere((d) => d.id == deviceId);
      _connectivityController.add(ConnectivityState.disconnected);

      debugPrint('Device disconnected: $deviceId');
    } catch (e) {
      debugPrint('Error handling device disconnected: $e');
    }
  }

  /// Handle connectivity state changed
  void _handleStateChanged(dynamic arguments) {
    try {
      final stateString = arguments['state'] as String;
      final state = ConnectivityState.values.firstWhere(
        (e) => e.name == stateString,
        orElse: () => ConnectivityState.disconnected,
      );

      _connectivityController.add(state);
      debugPrint('Connectivity state changed: $state');
    } catch (e) {
      debugPrint('Error handling state changed: $e');
    }
  }

  /// Get complication data (Apple Watch)
  Future<Map<String, dynamic>> _getComplicationData(dynamic arguments) async {
    try {
      final typeString = arguments['type'] as String;
      final identifier = arguments['identifier'] as String;

      final type = ComplicationType.values.firstWhere(
        (e) => e.name == typeString,
        orElse: () => ComplicationType.graphicCircular,
      );

      final complication = await _generateComplicationData(type, identifier);
      return complication.toJson();
    } catch (e) {
      debugPrint('Error getting complication data: $e');
      return {};
    }
  }

  /// Generate complication data
  Future<ComplicationData> _generateComplicationData(
    ComplicationType type,
    String identifier,
  ) async {
    final now = DateTime.now();

    switch (type) {
      case ComplicationType.graphicCircular:
        return ComplicationData(
          type: type,
          identifier: identifier,
          content: {
            'progress': 0.7,
            'text': '7/10',
            'label': 'Goals',
          },
          nextUpdate: now.add(const Duration(hours: 1)),
        );

      case ComplicationType.graphicRectangular:
        return ComplicationData(
          type: type,
          identifier: identifier,
          content: {
            'title': 'Daily Progress',
            'body': '5 of 7 habits completed',
            'progress': 0.71,
          },
          nextUpdate: now.add(const Duration(hours: 1)),
        );

      case ComplicationType.modularSmall:
        return ComplicationData(
          type: type,
          identifier: identifier,
          content: {
            'text': '15',
            'label': 'Streak',
          },
          nextUpdate: now.add(const Duration(hours: 1)),
        );

      default:
        return ComplicationData(
          type: type,
          identifier: identifier,
          content: {
            'text': 'UpCoach',
          },
          nextUpdate: now.add(const Duration(hours: 1)),
        );
    }
  }

  /// Get Wear OS tile data
  Future<Map<String, dynamic>> _getTileData(dynamic arguments) async {
    try {
      final typeString = arguments['type'] as String;
      final id = arguments['id'] as String;

      final type = WearTileType.values.firstWhere(
        (e) => e.name == typeString,
        orElse: () => WearTileType.primary,
      );

      final tile = await _generateTileData(type, id);
      return tile.toJson();
    } catch (e) {
      debugPrint('Error getting tile data: $e');
      return {};
    }
  }

  /// Generate Wear OS tile data
  Future<WearTileData> _generateTileData(WearTileType type, String id) async {
    final now = DateTime.now();

    return WearTileData(
      type: type,
      id: id,
      content: {
        'title': 'Daily Progress',
        'habits': [
          {'name': 'Meditate', 'completed': true},
          {'name': 'Exercise', 'completed': false},
          {'name': 'Journal', 'completed': true},
        ],
        'progress': 0.67,
      },
      timestamp: now,
    );
  }

  /// Handle voice command
  Future<Map<String, dynamic>> _handleVoiceCommand(dynamic arguments) async {
    try {
      final transcript = arguments['transcript'] as String?;

      if (transcript == null) {
        return {
          'success': false,
          'error': 'No transcript provided',
        };
      }

      final result = await _processVoiceCommand(transcript);
      return result.toJson();
    } catch (e) {
      debugPrint('Error handling voice command: $e');
      return {
        'success': false,
        'error': e.toString(),
      };
    }
  }

  /// Process voice command
  Future<VoiceCommandResult> _processVoiceCommand(String transcript) async {
    try {
      final lowerTranscript = transcript.toLowerCase();

      if (lowerTranscript.contains('log habit')) {
        return VoiceCommandResult(
          success: true,
          transcript: transcript,
          parsedData: {
            'action': 'logHabit',
            'habitName': _extractHabitName(transcript),
          },
        );
      } else if (lowerTranscript.contains('check in')) {
        return VoiceCommandResult(
          success: true,
          transcript: transcript,
          parsedData: {
            'action': 'checkIn',
            'mood': _extractMood(transcript),
          },
        );
      } else if (lowerTranscript.contains('start session')) {
        return VoiceCommandResult(
          success: true,
          transcript: transcript,
          parsedData: {
            'action': 'startSession',
          },
        );
      }

      return VoiceCommandResult(
        success: false,
        transcript: transcript,
        error: 'Unknown command',
      );
    } catch (e) {
      return VoiceCommandResult(
        success: false,
        transcript: transcript,
        error: e.toString(),
      );
    }
  }

  /// Extract habit name from voice command
  String? _extractHabitName(String transcript) {
    final pattern = RegExp(r'log habit\s+(\w+)', caseSensitive: false);
    final match = pattern.firstMatch(transcript);
    return match?.group(1);
  }

  /// Extract mood from voice command
  String? _extractMood(String transcript) {
    final moods = ['great', 'good', 'okay', 'bad', 'terrible'];
    for (final mood in moods) {
      if (transcript.toLowerCase().contains(mood)) {
        return mood;
      }
    }
    return null;
  }

  /// Register a message handler
  void registerMessageHandler(String messageType, MessageHandler handler) {
    _messageHandlers[messageType] = handler;
  }

  /// Send message to watch
  Future<bool> sendMessage(WatchMessage message) async {
    try {
      await _channel.invokeMethod('sendMessage', message.toJson());
      return true;
    } catch (e) {
      debugPrint('Failed to send message: $e');
      return false;
    }
  }

  /// Send data to watch (background transfer)
  Future<bool> sendData(Map<String, dynamic> data) async {
    try {
      await _channel.invokeMethod('sendData', data);
      return true;
    } catch (e) {
      debugPrint('Failed to send data: $e');
      return false;
    }
  }

  /// Update complication (Apple Watch)
  Future<bool> updateComplication(ComplicationData complication) async {
    if (_platform != WearablePlatform.appleWatch) return false;

    try {
      await _channel.invokeMethod('updateComplication', complication.toJson());
      return true;
    } catch (e) {
      debugPrint('Failed to update complication: $e');
      return false;
    }
  }

  /// Update all complications (Apple Watch)
  Future<bool> updateAllComplications() async {
    if (_platform != WearablePlatform.appleWatch) return false;

    try {
      await _channel.invokeMethod('updateAllComplications');
      return true;
    } catch (e) {
      debugPrint('Failed to update all complications: $e');
      return false;
    }
  }

  /// Update Wear OS tile
  Future<bool> updateTile(WearTileData tile) async {
    if (_platform != WearablePlatform.wearOS) return false;

    try {
      await _channel.invokeMethod('updateTile', tile.toJson());
      return true;
    } catch (e) {
      debugPrint('Failed to update tile: $e');
      return false;
    }
  }

  /// Trigger haptic feedback on watch
  Future<bool> triggerHaptic(HapticType type) async {
    try {
      await _channel.invokeMethod('triggerHaptic', {
        'type': type.name,
      });
      return true;
    } catch (e) {
      debugPrint('Failed to trigger haptic: $e');
      return false;
    }
  }

  /// Start voice input on watch
  Future<VoiceCommandResult> startVoiceInput() async {
    try {
      final result = await _channel.invokeMethod<Map>('startVoiceInput');
      if (result != null) {
        return VoiceCommandResult(
          success: result['success'] as bool,
          transcript: result['transcript'] as String?,
          parsedData: result['parsedData'] as Map<String, dynamic>?,
          error: result['error'] as String?,
        );
      }
      return const VoiceCommandResult(
        success: false,
        error: 'No result returned',
      );
    } catch (e) {
      debugPrint('Failed to start voice input: $e');
      return VoiceCommandResult(
        success: false,
        error: e.toString(),
      );
    }
  }

  /// Sync data with watch
  Future<SyncResult> syncWithWatch() async {
    try {
      final result = await _channel.invokeMethod<Map>('syncData');
      if (result != null) {
        return SyncResult(
          success: result['success'] as bool,
          itemsSynced: result['itemsSynced'] as int,
          timestamp: DateTime.parse(result['timestamp'] as String),
          error: result['error'] as String?,
        );
      }
      return SyncResult(
        success: false,
        itemsSynced: 0,
        timestamp: DateTime.now(),
        error: 'No result returned',
      );
    } catch (e) {
      debugPrint('Failed to sync with watch: $e');
      return SyncResult(
        success: false,
        itemsSynced: 0,
        timestamp: DateTime.now(),
        error: e.toString(),
      );
    }
  }

  /// Get connected devices
  Future<List<WearableDevice>> _getConnectedDevices() async {
    try {
      final result = await _channel.invokeMethod<List>('getConnectedDevices');
      if (result != null) {
        return result
            .map((e) => WearableDevice.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList();
      }
      return [];
    } catch (e) {
      debugPrint('Failed to get connected devices: $e');
      return [];
    }
  }

  /// Get current connected devices
  List<WearableDevice> getDevices() {
    return List.unmodifiable(_connectedDevices);
  }

  /// Check if watch is paired
  Future<bool> isWatchPaired() async {
    try {
      final result = await _channel.invokeMethod<bool>('isWatchPaired');
      return result ?? false;
    } catch (e) {
      debugPrint('Failed to check if watch is paired: $e');
      return false;
    }
  }

  /// Check if watch is reachable
  Future<bool> isWatchReachable() async {
    try {
      final result = await _channel.invokeMethod<bool>('isWatchReachable');
      return result ?? false;
    } catch (e) {
      debugPrint('Failed to check if watch is reachable: $e');
      return false;
    }
  }

  /// Start automatic sync
  void startAutomaticSync({Duration interval = const Duration(minutes: 15)}) {
    _stopAutomaticSync();

    _syncTimer = Timer.periodic(interval, (timer) async {
      await syncWithWatch();
    });

    debugPrint('Started automatic watch sync with interval: $interval');
  }

  /// Stop automatic sync
  void _stopAutomaticSync() {
    _syncTimer?.cancel();
    _syncTimer = null;
  }

  /// Sync completed callback
  void _onSyncCompleted(Map? data) {
    if (data == null) return;

    try {
      final itemsSynced = data['itemsSynced'] as int? ?? 0;
      debugPrint('Sync completed: $itemsSynced items synced');
    } catch (e) {
      debugPrint('Error handling sync completed: $e');
    }
  }

  /// Complication updated callback
  void _onComplicationUpdated(Map? data) {
    if (data == null) return;

    try {
      final identifier = data['identifier'] as String?;
      debugPrint('Complication updated: $identifier');
    } catch (e) {
      debugPrint('Error handling complication updated: $e');
    }
  }

  /// Tile updated callback
  void _onTileUpdated(Map? data) {
    if (data == null) return;

    try {
      final id = data['id'] as String?;
      debugPrint('Tile updated: $id');
    } catch (e) {
      debugPrint('Error handling tile updated: $e');
    }
  }

  /// Transfer file to watch
  Future<bool> transferFile(String filePath, Map<String, dynamic>? metadata) async {
    try {
      await _channel.invokeMethod('transferFile', {
        'filePath': filePath,
        'metadata': metadata ?? {},
      });
      return true;
    } catch (e) {
      debugPrint('Failed to transfer file: $e');
      return false;
    }
  }

  /// Dispose resources
  void dispose() {
    _stopAutomaticSync();
    for (final subscription in _subscriptions) {
      subscription.cancel();
    }
    _subscriptions.clear();
    _deviceController.close();
    _messageController.close();
    _connectivityController.close();
    _isInitialized = false;
  }
}
