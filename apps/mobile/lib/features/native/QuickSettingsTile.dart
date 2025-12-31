import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

/// Tile state for Android Quick Settings
enum TileState {
  inactive,
  active,
  unavailable,
}

/// Tile type for quick actions
enum TileType {
  quickCheckIn,
  logHabit,
  startSession,
  moodCheck,
  dailyReflection,
  goalProgress,
  habitStreak,
}

/// Control type for iOS Control Center
enum ControlType {
  toggle,
  button,
  slider,
}

/// Tile configuration
class TileConfiguration {
  final String id;
  final TileType type;
  final String label;
  final String? subtitle;
  final String iconName;
  final TileState defaultState;
  final Map<String, dynamic> settings;

  const TileConfiguration({
    required this.id,
    required this.type,
    required this.label,
    this.subtitle,
    required this.iconName,
    this.defaultState = TileState.inactive,
    this.settings = const {},
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type.name,
        'label': label,
        'subtitle': subtitle,
        'iconName': iconName,
        'defaultState': defaultState.name,
        'settings': settings,
      };

  factory TileConfiguration.fromJson(Map<String, dynamic> json) {
    return TileConfiguration(
      id: json['id'] as String,
      type: TileType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => TileType.quickCheckIn,
      ),
      label: json['label'] as String,
      subtitle: json['subtitle'] as String?,
      iconName: json['iconName'] as String,
      defaultState: TileState.values.firstWhere(
        (e) => e.name == json['defaultState'],
        orElse: () => TileState.inactive,
      ),
      settings: Map<String, dynamic>.from(json['settings'] as Map? ?? {}),
    );
  }

  TileConfiguration copyWith({
    String? id,
    TileType? type,
    String? label,
    String? subtitle,
    String? iconName,
    TileState? defaultState,
    Map<String, dynamic>? settings,
  }) {
    return TileConfiguration(
      id: id ?? this.id,
      type: type ?? this.type,
      label: label ?? this.label,
      subtitle: subtitle ?? this.subtitle,
      iconName: iconName ?? this.iconName,
      defaultState: defaultState ?? this.defaultState,
      settings: settings ?? this.settings,
    );
  }
}

/// iOS Control Center widget configuration
class ControlCenterWidget {
  final String id;
  final ControlType type;
  final String label;
  final String iconName;
  final bool isEnabled;
  final Map<String, dynamic> configuration;

  const ControlCenterWidget({
    required this.id,
    required this.type,
    required this.label,
    required this.iconName,
    this.isEnabled = true,
    this.configuration = const {},
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type.name,
        'label': label,
        'iconName': iconName,
        'isEnabled': isEnabled,
        'configuration': configuration,
      };

  factory ControlCenterWidget.fromJson(Map<String, dynamic> json) {
    return ControlCenterWidget(
      id: json['id'] as String,
      type: ControlType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => ControlType.button,
      ),
      label: json['label'] as String,
      iconName: json['iconName'] as String,
      isEnabled: json['isEnabled'] as bool? ?? true,
      configuration: Map<String, dynamic>.from(json['configuration'] as Map? ?? {}),
    );
  }
}

/// Tile action result
class TileActionResult {
  final bool success;
  final String? message;
  final TileState? newState;
  final Map<String, dynamic>? data;

  const TileActionResult({
    required this.success,
    this.message,
    this.newState,
    this.data,
  });

  Map<String, dynamic> toJson() => {
        'success': success,
        'message': message,
        'newState': newState?.name,
        'data': data,
      };
}

/// Tile click event
class TileClickEvent {
  final String tileId;
  final TileType type;
  final bool isLongClick;
  final DateTime timestamp;

  const TileClickEvent({
    required this.tileId,
    required this.type,
    required this.isLongClick,
    required this.timestamp,
  });

  factory TileClickEvent.fromJson(Map<String, dynamic> json) {
    return TileClickEvent(
      tileId: json['tileId'] as String,
      type: TileType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => TileType.quickCheckIn,
      ),
      isLongClick: json['isLongClick'] as bool? ?? false,
      timestamp: DateTime.parse(json['timestamp'] as String),
    );
  }
}

/// Handler for tile actions
typedef TileActionHandler = Future<TileActionResult> Function(
  TileType type,
  Map<String, dynamic>? data,
);

/// Quick Settings Tile and Control Center integration manager
class QuickSettingsTile {
  static const MethodChannel _channel =
      MethodChannel('com.upcoach.app/quicksettings');

  static const EventChannel _eventChannel =
      EventChannel('com.upcoach.app/quicksettings/events');

  static QuickSettingsTile? _instance;
  static QuickSettingsTile get instance {
    _instance ??= QuickSettingsTile._();
    return _instance!;
  }

  QuickSettingsTile._() {
    _initialize();
  }

  final Map<String, TileConfiguration> _tiles = {};
  final Map<TileType, TileActionHandler> _actionHandlers = {};
  final Map<String, TileState> _tileStates = {};
  final List<StreamSubscription> _subscriptions = [];
  final StreamController<TileClickEvent> _clickController =
      StreamController<TileClickEvent>.broadcast();

  bool _isInitialized = false;

  /// Stream of tile click events
  Stream<TileClickEvent> get clickStream => _clickController.stream;

  /// Initialize the quick settings integration
  Future<void> _initialize() async {
    if (_isInitialized) return;

    try {
      _channel.setMethodCallHandler(_handleMethodCall);

      final eventSubscription = _eventChannel.receiveBroadcastStream().listen(
            _handleEvent,
            onError: (error) {
              debugPrint('QuickSettings event stream error: $error');
            },
          );
      _subscriptions.add(eventSubscription);

      if (Platform.isAndroid) {
        await _initializeAndroidTiles();
      } else if (Platform.isIOS) {
        await _initializeControlCenter();
      }

      _registerDefaultHandlers();
      _isInitialized = true;
      debugPrint('QuickSettingsTile initialized');
    } catch (e) {
      debugPrint('Failed to initialize QuickSettingsTile: $e');
    }
  }

  /// Initialize Android Quick Settings Tiles
  Future<void> _initializeAndroidTiles() async {
    try {
      await _channel.invokeMethod('initializeQuickSettings');

      // Register default tiles
      final defaultTiles = _getDefaultTiles();
      for (final tile in defaultTiles) {
        await registerTile(tile);
      }
    } catch (e) {
      debugPrint('Failed to initialize Android Quick Settings: $e');
    }
  }

  /// Initialize iOS Control Center
  Future<void> _initializeControlCenter() async {
    try {
      await _channel.invokeMethod('initializeControlCenter');

      // Register default controls
      final defaultControls = _getDefaultControls();
      for (final control in defaultControls) {
        await _registerControl(control);
      }
    } catch (e) {
      debugPrint('Failed to initialize iOS Control Center: $e');
    }
  }

  /// Get default tile configurations
  List<TileConfiguration> _getDefaultTiles() {
    return [
      const TileConfiguration(
        id: 'quick_checkin',
        type: TileType.quickCheckIn,
        label: 'Quick Check-in',
        subtitle: 'Log your mood',
        iconName: 'ic_checkin',
        defaultState: TileState.inactive,
      ),
      const TileConfiguration(
        id: 'log_habit',
        type: TileType.logHabit,
        label: 'Log Habit',
        subtitle: 'Mark habit complete',
        iconName: 'ic_habit',
        defaultState: TileState.inactive,
      ),
      const TileConfiguration(
        id: 'start_session',
        type: TileType.startSession,
        label: 'Start Session',
        subtitle: 'Begin coaching',
        iconName: 'ic_session',
        defaultState: TileState.inactive,
      ),
      const TileConfiguration(
        id: 'mood_check',
        type: TileType.moodCheck,
        label: 'Mood Check',
        subtitle: 'How are you feeling?',
        iconName: 'ic_mood',
        defaultState: TileState.inactive,
      ),
      const TileConfiguration(
        id: 'daily_reflection',
        type: TileType.dailyReflection,
        label: 'Daily Reflection',
        subtitle: 'Reflect on your day',
        iconName: 'ic_reflection',
        defaultState: TileState.inactive,
      ),
    ];
  }

  /// Get default iOS Control Center widgets
  List<ControlCenterWidget> _getDefaultControls() {
    return [
      const ControlCenterWidget(
        id: 'quick_checkin',
        type: ControlType.button,
        label: 'Quick Check-in',
        iconName: 'checkmark.circle',
      ),
      const ControlCenterWidget(
        id: 'log_habit',
        type: ControlType.button,
        label: 'Log Habit',
        iconName: 'plus.circle',
      ),
      const ControlCenterWidget(
        id: 'mood_toggle',
        type: ControlType.toggle,
        label: 'Mood Tracking',
        iconName: 'face.smiling',
      ),
    ];
  }

  /// Register default action handlers
  void _registerDefaultHandlers() {
    // Quick Check-in handler
    registerActionHandler(TileType.quickCheckIn, (type, data) async {
      try {
        debugPrint('Quick check-in triggered from tile');
        return const TileActionResult(
          success: true,
          message: 'Check-in started',
          newState: TileState.active,
        );
      } catch (e) {
        return TileActionResult(
          success: false,
          message: 'Failed to start check-in: $e',
        );
      }
    });

    // Log Habit handler
    registerActionHandler(TileType.logHabit, (type, data) async {
      try {
        debugPrint('Log habit triggered from tile');
        return const TileActionResult(
          success: true,
          message: 'Habit logged',
          newState: TileState.active,
        );
      } catch (e) {
        return TileActionResult(
          success: false,
          message: 'Failed to log habit: $e',
        );
      }
    });

    // Start Session handler
    registerActionHandler(TileType.startSession, (type, data) async {
      try {
        debugPrint('Start session triggered from tile');
        return const TileActionResult(
          success: true,
          message: 'Session started',
          newState: TileState.active,
        );
      } catch (e) {
        return TileActionResult(
          success: false,
          message: 'Failed to start session: $e',
        );
      }
    });

    // Mood Check handler
    registerActionHandler(TileType.moodCheck, (type, data) async {
      try {
        debugPrint('Mood check triggered from tile');
        return const TileActionResult(
          success: true,
          message: 'Mood check started',
          newState: TileState.active,
        );
      } catch (e) {
        return TileActionResult(
          success: false,
          message: 'Failed to start mood check: $e',
        );
      }
    });

    // Daily Reflection handler
    registerActionHandler(TileType.dailyReflection, (type, data) async {
      try {
        debugPrint('Daily reflection triggered from tile');
        return const TileActionResult(
          success: true,
          message: 'Reflection started',
          newState: TileState.active,
        );
      } catch (e) {
        return TileActionResult(
          success: false,
          message: 'Failed to start reflection: $e',
        );
      }
    });

    // Goal Progress handler
    registerActionHandler(TileType.goalProgress, (type, data) async {
      try {
        debugPrint('Goal progress triggered from tile');
        return const TileActionResult(
          success: true,
          message: 'Goal progress opened',
          newState: TileState.active,
        );
      } catch (e) {
        return TileActionResult(
          success: false,
          message: 'Failed to open goal progress: $e',
        );
      }
    });

    // Habit Streak handler
    registerActionHandler(TileType.habitStreak, (type, data) async {
      try {
        debugPrint('Habit streak triggered from tile');
        return const TileActionResult(
          success: true,
          message: 'Habit streak opened',
          newState: TileState.active,
        );
      } catch (e) {
        return TileActionResult(
          success: false,
          message: 'Failed to open habit streak: $e',
        );
      }
    });
  }

  /// Handle method calls from native code
  Future<dynamic> _handleMethodCall(MethodCall call) async {
    try {
      switch (call.method) {
        case 'onTileClick':
          return await _handleTileClick(call.arguments);

        case 'onTileLongClick':
          return await _handleTileLongClick(call.arguments);

        case 'getTileState':
          final tileId = call.arguments['tileId'] as String;
          return _getTileState(tileId);

        case 'onControlActivated':
          return await _handleControlActivated(call.arguments);

        case 'getTileData':
          final tileId = call.arguments['tileId'] as String;
          return _getTileData(tileId);

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
          case 'tileAdded':
            _onTileAdded(data);
            break;
          case 'tileRemoved':
            _onTileRemoved(data);
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

  /// Handle tile click
  Future<Map<String, dynamic>> _handleTileClick(dynamic arguments) async {
    try {
      final args = Map<String, dynamic>.from(arguments as Map);
      final tileId = args['tileId'] as String;
      final tile = _tiles[tileId];

      if (tile == null) {
        return {
          'success': false,
          'message': 'Tile not found',
        };
      }

      final event = TileClickEvent(
        tileId: tileId,
        type: tile.type,
        isLongClick: false,
        timestamp: DateTime.now(),
      );

      _clickController.add(event);

      final handler = _actionHandlers[tile.type];
      if (handler == null) {
        return {
          'success': false,
          'message': 'No handler registered',
        };
      }

      final result = await handler(tile.type, args['data'] as Map<String, dynamic>?);

      if (result.newState != null) {
        await updateTileState(tileId, result.newState!);
      }

      return result.toJson();
    } catch (e) {
      debugPrint('Error handling tile click: $e');
      return {
        'success': false,
        'message': 'Error: $e',
      };
    }
  }

  /// Handle tile long click (Android only)
  Future<Map<String, dynamic>> _handleTileLongClick(dynamic arguments) async {
    try {
      final args = Map<String, dynamic>.from(arguments as Map);
      final tileId = args['tileId'] as String;
      final tile = _tiles[tileId];

      if (tile == null) {
        return {
          'success': false,
          'message': 'Tile not found',
        };
      }

      final event = TileClickEvent(
        tileId: tileId,
        type: tile.type,
        isLongClick: true,
        timestamp: DateTime.now(),
      );

      _clickController.add(event);

      // Long click opens the app configuration
      return {
        'success': true,
        'action': 'openConfiguration',
        'tileId': tileId,
      };
    } catch (e) {
      debugPrint('Error handling tile long click: $e');
      return {
        'success': false,
        'message': 'Error: $e',
      };
    }
  }

  /// Handle iOS Control Center activation
  Future<Map<String, dynamic>> _handleControlActivated(dynamic arguments) async {
    try {
      final args = Map<String, dynamic>.from(arguments as Map);
      final controlId = args['controlId'] as String;
      final tile = _tiles[controlId];

      if (tile == null) {
        return {
          'success': false,
          'message': 'Control not found',
        };
      }

      final handler = _actionHandlers[tile.type];
      if (handler == null) {
        return {
          'success': false,
          'message': 'No handler registered',
        };
      }

      final result = await handler(tile.type, args['data'] as Map<String, dynamic>?);
      return result.toJson();
    } catch (e) {
      debugPrint('Error handling control activation: $e');
      return {
        'success': false,
        'message': 'Error: $e',
      };
    }
  }

  /// Get tile state
  String _getTileState(String tileId) {
    final state = _tileStates[tileId] ?? TileState.inactive;
    return state.name;
  }

  /// Get tile data
  Map<String, dynamic> _getTileData(String tileId) {
    final tile = _tiles[tileId];
    if (tile == null) {
      return {};
    }

    return tile.toJson();
  }

  /// Register a tile
  Future<bool> registerTile(TileConfiguration tile) async {
    try {
      _tiles[tile.id] = tile;
      _tileStates[tile.id] = tile.defaultState;

      if (Platform.isAndroid) {
        await _channel.invokeMethod('registerTile', tile.toJson());
      }

      return true;
    } catch (e) {
      debugPrint('Failed to register tile: $e');
      return false;
    }
  }

  /// Register an iOS control
  Future<bool> _registerControl(ControlCenterWidget control) async {
    try {
      await _channel.invokeMethod('registerControl', control.toJson());
      return true;
    } catch (e) {
      debugPrint('Failed to register control: $e');
      return false;
    }
  }

  /// Register an action handler
  void registerActionHandler(TileType type, TileActionHandler handler) {
    _actionHandlers[type] = handler;
  }

  /// Update tile state
  Future<bool> updateTileState(String tileId, TileState state) async {
    try {
      _tileStates[tileId] = state;

      await _channel.invokeMethod('updateTileState', {
        'tileId': tileId,
        'state': state.name,
      });

      return true;
    } catch (e) {
      debugPrint('Failed to update tile state: $e');
      return false;
    }
  }

  /// Update tile label and subtitle
  Future<bool> updateTileLabel(
    String tileId, {
    String? label,
    String? subtitle,
  }) async {
    try {
      final tile = _tiles[tileId];
      if (tile == null) return false;

      final updatedTile = tile.copyWith(
        label: label,
        subtitle: subtitle,
      );

      _tiles[tileId] = updatedTile;

      await _channel.invokeMethod('updateTileLabel', {
        'tileId': tileId,
        'label': label ?? tile.label,
        'subtitle': subtitle ?? tile.subtitle,
      });

      return true;
    } catch (e) {
      debugPrint('Failed to update tile label: $e');
      return false;
    }
  }

  /// Update tile icon
  Future<bool> updateTileIcon(String tileId, String iconName) async {
    try {
      final tile = _tiles[tileId];
      if (tile == null) return false;

      final updatedTile = tile.copyWith(iconName: iconName);
      _tiles[tileId] = updatedTile;

      await _channel.invokeMethod('updateTileIcon', {
        'tileId': tileId,
        'iconName': iconName,
      });

      return true;
    } catch (e) {
      debugPrint('Failed to update tile icon: $e');
      return false;
    }
  }

  /// Remove a tile
  Future<bool> removeTile(String tileId) async {
    try {
      _tiles.remove(tileId);
      _tileStates.remove(tileId);

      await _channel.invokeMethod('removeTile', {
        'tileId': tileId,
      });

      return true;
    } catch (e) {
      debugPrint('Failed to remove tile: $e');
      return false;
    }
  }

  /// Get all registered tiles
  List<TileConfiguration> getTiles() {
    return _tiles.values.toList();
  }

  /// Get tile configuration
  TileConfiguration? getTile(String tileId) {
    return _tiles[tileId];
  }

  /// Get tile state
  TileState getTileState(String tileId) {
    return _tileStates[tileId] ?? TileState.inactive;
  }

  /// Request tile to be added to Quick Settings (Android only)
  Future<bool> requestAddTile(String tileId) async {
    if (!Platform.isAndroid) return false;

    try {
      await _channel.invokeMethod('requestAddTile', {
        'tileId': tileId,
      });
      return true;
    } catch (e) {
      debugPrint('Failed to request add tile: $e');
      return false;
    }
  }

  /// Check if tile is added to Quick Settings (Android only)
  Future<bool> isTileAdded(String tileId) async {
    if (!Platform.isAndroid) return false;

    try {
      final result = await _channel.invokeMethod<bool>('isTileAdded', {
        'tileId': tileId,
      });
      return result ?? false;
    } catch (e) {
      debugPrint('Failed to check if tile is added: $e');
      return false;
    }
  }

  /// Start a foreground service for long-running task (Android only)
  Future<bool> startForegroundService(
    String serviceId,
    String title,
    String message,
  ) async {
    if (!Platform.isAndroid) return false;

    try {
      await _channel.invokeMethod('startForegroundService', {
        'serviceId': serviceId,
        'title': title,
        'message': message,
      });
      return true;
    } catch (e) {
      debugPrint('Failed to start foreground service: $e');
      return false;
    }
  }

  /// Stop a foreground service (Android only)
  Future<bool> stopForegroundService(String serviceId) async {
    if (!Platform.isAndroid) return false;

    try {
      await _channel.invokeMethod('stopForegroundService', {
        'serviceId': serviceId,
      });
      return true;
    } catch (e) {
      debugPrint('Failed to stop foreground service: $e');
      return false;
    }
  }

  /// Update foreground service notification (Android only)
  Future<bool> updateForegroundService(
    String serviceId,
    String title,
    String message,
  ) async {
    if (!Platform.isAndroid) return false;

    try {
      await _channel.invokeMethod('updateForegroundService', {
        'serviceId': serviceId,
        'title': title,
        'message': message,
      });
      return true;
    } catch (e) {
      debugPrint('Failed to update foreground service: $e');
      return false;
    }
  }

  /// Tile added callback
  void _onTileAdded(Map? data) {
    if (data == null) return;

    try {
      final tileId = data['tileId'] as String?;
      if (tileId != null) {
        debugPrint('Tile added: $tileId');
      }
    } catch (e) {
      debugPrint('Error handling tile added: $e');
    }
  }

  /// Tile removed callback
  void _onTileRemoved(Map? data) {
    if (data == null) return;

    try {
      final tileId = data['tileId'] as String?;
      if (tileId != null) {
        debugPrint('Tile removed: $tileId');
      }
    } catch (e) {
      debugPrint('Error handling tile removed: $e');
    }
  }

  /// Tile updated callback
  void _onTileUpdated(Map? data) {
    if (data == null) return;

    try {
      final tileId = data['tileId'] as String?;
      if (tileId != null) {
        debugPrint('Tile updated: $tileId');
      }
    } catch (e) {
      debugPrint('Error handling tile updated: $e');
    }
  }

  /// Dispose resources
  void dispose() {
    for (final subscription in _subscriptions) {
      subscription.cancel();
    }
    _subscriptions.clear();
    _clickController.close();
    _isInitialized = false;
  }
}
