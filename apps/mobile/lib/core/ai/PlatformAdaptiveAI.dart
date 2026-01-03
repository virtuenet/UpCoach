import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math';

import 'package:battery_plus/battery_plus.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sqflite/sqflite.dart';
import 'package:tflite_flutter/tflite_flutter.dart';
import 'package:tflite_flutter_helper/tflite_flutter_helper.dart';

enum ModelTier { lightweight, standard, advanced }

enum ProcessingMode { onDevice, hybrid, cloudOnly }

enum DeviceClass { low, medium, high, premium }

class DeviceCapabilities {
  final int ramMB;
  final int cpuCores;
  final String processorName;
  final DeviceClass deviceClass;
  final bool hasNeuralEngine;
  final bool supportsOpenCL;
  final int maxConcurrentInferences;

  DeviceCapabilities({
    required this.ramMB,
    required this.cpuCores,
    required this.processorName,
    required this.deviceClass,
    required this.hasNeuralEngine,
    required this.supportsOpenCL,
    required this.maxConcurrentInferences,
  });

  Map<String, dynamic> toJson() => {
        'ramMB': ramMB,
        'cpuCores': cpuCores,
        'processorName': processorName,
        'deviceClass': deviceClass.toString(),
        'hasNeuralEngine': hasNeuralEngine,
        'supportsOpenCL': supportsOpenCL,
        'maxConcurrentInferences': maxConcurrentInferences,
      };

  factory DeviceCapabilities.fromJson(Map<String, dynamic> json) =>
      DeviceCapabilities(
        ramMB: json['ramMB'] as int,
        cpuCores: json['cpuCores'] as int,
        processorName: json['processorName'] as String,
        deviceClass: DeviceClass.values.firstWhere(
          (e) => e.toString() == json['deviceClass'],
          orElse: () => DeviceClass.medium,
        ),
        hasNeuralEngine: json['hasNeuralEngine'] as bool,
        supportsOpenCL: json['supportsOpenCL'] as bool,
        maxConcurrentInferences: json['maxConcurrentInferences'] as int,
      );
}

class RuntimeContext {
  final int batteryLevel;
  final bool isCharging;
  final ConnectivityResult networkType;
  final double networkBandwidthMbps;
  final bool isLowPowerMode;
  final double temperature;
  final String? location;
  final DateTime timestamp;

  RuntimeContext({
    required this.batteryLevel,
    required this.isCharging,
    required this.networkType,
    required this.networkBandwidthMbps,
    required this.isLowPowerMode,
    required this.temperature,
    this.location,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() => {
        'batteryLevel': batteryLevel,
        'isCharging': isCharging,
        'networkType': networkType.toString(),
        'networkBandwidthMbps': networkBandwidthMbps,
        'isLowPowerMode': isLowPowerMode,
        'temperature': temperature,
        'location': location,
        'timestamp': timestamp.toIso8601String(),
      };

  factory RuntimeContext.fromJson(Map<String, dynamic> json) => RuntimeContext(
        batteryLevel: json['batteryLevel'] as int,
        isCharging: json['isCharging'] as bool,
        networkType: ConnectivityResult.values.firstWhere(
          (e) => e.toString() == json['networkType'],
          orElse: () => ConnectivityResult.none,
        ),
        networkBandwidthMbps: (json['networkBandwidthMbps'] as num).toDouble(),
        isLowPowerMode: json['isLowPowerMode'] as bool,
        temperature: (json['temperature'] as num).toDouble(),
        location: json['location'] as String?,
        timestamp: DateTime.parse(json['timestamp'] as String),
      );
}

class ModelMetadata {
  final String modelId;
  final String modelName;
  final ModelTier tier;
  final int sizeBytes;
  final String version;
  final List<String> capabilities;
  final Map<String, dynamic> requirements;
  final String filePath;
  final DateTime downloadedAt;

  ModelMetadata({
    required this.modelId,
    required this.modelName,
    required this.tier,
    required this.sizeBytes,
    required this.version,
    required this.capabilities,
    required this.requirements,
    required this.filePath,
    required this.downloadedAt,
  });

  Map<String, dynamic> toJson() => {
        'modelId': modelId,
        'modelName': modelName,
        'tier': tier.toString(),
        'sizeBytes': sizeBytes,
        'version': version,
        'capabilities': capabilities,
        'requirements': requirements,
        'filePath': filePath,
        'downloadedAt': downloadedAt.toIso8601String(),
      };

  factory ModelMetadata.fromJson(Map<String, dynamic> json) => ModelMetadata(
        modelId: json['modelId'] as String,
        modelName: json['modelName'] as String,
        tier: ModelTier.values.firstWhere(
          (e) => e.toString() == json['tier'],
          orElse: () => ModelTier.standard,
        ),
        sizeBytes: json['sizeBytes'] as int,
        version: json['version'] as String,
        capabilities: List<String>.from(json['capabilities'] as List),
        requirements: json['requirements'] as Map<String, dynamic>,
        filePath: json['filePath'] as String,
        downloadedAt: DateTime.parse(json['downloadedAt'] as String),
      );
}

class InferenceResult {
  final List<double> output;
  final double confidence;
  final int latencyMs;
  final String modelId;
  final ProcessingMode processingMode;
  final Map<String, dynamic> metadata;

  InferenceResult({
    required this.output,
    required this.confidence,
    required this.latencyMs,
    required this.modelId,
    required this.processingMode,
    required this.metadata,
  });

  Map<String, dynamic> toJson() => {
        'output': output,
        'confidence': confidence,
        'latencyMs': latencyMs,
        'modelId': modelId,
        'processingMode': processingMode.toString(),
        'metadata': metadata,
      };
}

class PerformanceMetrics {
  final String modelId;
  final double averageLatencyMs;
  final double accuracy;
  final int totalInferences;
  final double successRate;
  final double averageBatteryImpact;
  final Map<String, int> errorCounts;
  final DateTime lastUpdated;

  PerformanceMetrics({
    required this.modelId,
    required this.averageLatencyMs,
    required this.accuracy,
    required this.totalInferences,
    required this.successRate,
    required this.averageBatteryImpact,
    required this.errorCounts,
    required this.lastUpdated,
  });

  Map<String, dynamic> toJson() => {
        'modelId': modelId,
        'averageLatencyMs': averageLatencyMs,
        'accuracy': accuracy,
        'totalInferences': totalInferences,
        'successRate': successRate,
        'averageBatteryImpact': averageBatteryImpact,
        'errorCounts': errorCounts,
        'lastUpdated': lastUpdated.toIso8601String(),
      };

  factory PerformanceMetrics.fromJson(Map<String, dynamic> json) =>
      PerformanceMetrics(
        modelId: json['modelId'] as String,
        averageLatencyMs: (json['averageLatencyMs'] as num).toDouble(),
        accuracy: (json['accuracy'] as num).toDouble(),
        totalInferences: json['totalInferences'] as int,
        successRate: (json['successRate'] as num).toDouble(),
        averageBatteryImpact: (json['averageBatteryImpact'] as num).toDouble(),
        errorCounts: Map<String, int>.from(json['errorCounts'] as Map),
        lastUpdated: DateTime.parse(json['lastUpdated'] as String),
      );
}

class PlatformAdaptiveAI {
  static const String _dbName = 'adaptive_ai.db';
  static const int _dbVersion = 1;

  Database? _database;
  final Battery _battery = Battery();
  final Connectivity _connectivity = Connectivity();
  final DeviceInfoPlugin _deviceInfo = DeviceInfoPlugin();

  DeviceCapabilities? _deviceCapabilities;
  RuntimeContext? _currentContext;
  Interpreter? _activeInterpreter;
  ModelMetadata? _activeModel;

  final Map<String, Interpreter> _loadedInterpreters = {};
  final Map<String, ModelMetadata> _modelCache = {};
  final Map<String, PerformanceMetrics> _performanceCache = {};

  StreamSubscription<BatteryState>? _batterySubscription;
  StreamSubscription<ConnectivityResult>? _connectivitySubscription;
  Timer? _contextUpdateTimer;

  bool _initialized = false;
  final StreamController<RuntimeContext> _contextStreamController =
      StreamController<RuntimeContext>.broadcast();
  final StreamController<PerformanceMetrics> _metricsStreamController =
      StreamController<PerformanceMetrics>.broadcast();

  Stream<RuntimeContext> get contextStream => _contextStreamController.stream;
  Stream<PerformanceMetrics> get metricsStream =>
      _metricsStreamController.stream;

  Future<void> initialize() async {
    if (_initialized) return;

    try {
      await _initializeDatabase();
      await _detectDeviceCapabilities();
      await _loadModelMetadata();
      await _startContextMonitoring();
      await _selectOptimalModel();

      _initialized = true;
      debugPrint('PlatformAdaptiveAI initialized successfully');
    } catch (e, stackTrace) {
      debugPrint('Failed to initialize PlatformAdaptiveAI: $e');
      debugPrint('StackTrace: $stackTrace');
      rethrow;
    }
  }

  Future<void> _initializeDatabase() async {
    final databasesPath = await getDatabasesPath();
    final path = '$databasesPath/$_dbName';

    _database = await openDatabase(
      path,
      version: _dbVersion,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE models (
            model_id TEXT PRIMARY KEY,
            model_name TEXT NOT NULL,
            tier TEXT NOT NULL,
            size_bytes INTEGER NOT NULL,
            version TEXT NOT NULL,
            capabilities TEXT NOT NULL,
            requirements TEXT NOT NULL,
            file_path TEXT NOT NULL,
            downloaded_at TEXT NOT NULL
          )
        ''');

        await db.execute('''
          CREATE TABLE performance_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            model_id TEXT NOT NULL,
            latency_ms REAL NOT NULL,
            accuracy REAL NOT NULL,
            battery_level INTEGER NOT NULL,
            network_type TEXT NOT NULL,
            processing_mode TEXT NOT NULL,
            success INTEGER NOT NULL,
            error_message TEXT,
            timestamp TEXT NOT NULL
          )
        ''');

        await db.execute('''
          CREATE TABLE context_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            battery_level INTEGER NOT NULL,
            is_charging INTEGER NOT NULL,
            network_type TEXT NOT NULL,
            network_bandwidth_mbps REAL NOT NULL,
            is_low_power_mode INTEGER NOT NULL,
            temperature REAL NOT NULL,
            location TEXT,
            timestamp TEXT NOT NULL
          )
        ''');

        await db.execute('''
          CREATE TABLE model_switches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            from_model_id TEXT,
            to_model_id TEXT NOT NULL,
            reason TEXT NOT NULL,
            context TEXT NOT NULL,
            timestamp TEXT NOT NULL
          )
        ''');

        await db.execute('''
          CREATE INDEX idx_performance_model ON performance_history(model_id)
        ''');

        await db.execute('''
          CREATE INDEX idx_performance_timestamp ON performance_history(timestamp)
        ''');
      },
    );
  }

  Future<void> _detectDeviceCapabilities() async {
    try {
      int ramMB = 2048;
      int cpuCores = 4;
      String processorName = 'Unknown';
      bool hasNeuralEngine = false;

      if (Platform.isAndroid) {
        final androidInfo = await _deviceInfo.androidInfo;
        processorName = androidInfo.hardware ?? 'Unknown';

        final memInfo = androidInfo.systemFeatures;
        ramMB = _estimateAndroidRAM(androidInfo.model ?? '');
        cpuCores = _estimateAndroidCores(androidInfo.model ?? '');
        hasNeuralEngine = _detectAndroidNeuralEngine(androidInfo.model ?? '');
      } else if (Platform.isIOS) {
        final iosInfo = await _deviceInfo.iosInfo;
        processorName = iosInfo.utsname.machine ?? 'Unknown';

        ramMB = _estimateIOSRAM(iosInfo.utsname.machine ?? '');
        cpuCores = _estimateIOSCores(iosInfo.utsname.machine ?? '');
        hasNeuralEngine = _detectIOSNeuralEngine(iosInfo.utsname.machine ?? '');
      }

      final deviceClass = _classifyDevice(ramMB, cpuCores);
      final maxConcurrentInferences = _calculateMaxConcurrentInferences(
        ramMB,
        cpuCores,
        deviceClass,
      );

      _deviceCapabilities = DeviceCapabilities(
        ramMB: ramMB,
        cpuCores: cpuCores,
        processorName: processorName,
        deviceClass: deviceClass,
        hasNeuralEngine: hasNeuralEngine,
        supportsOpenCL: Platform.isAndroid,
        maxConcurrentInferences: maxConcurrentInferences,
      );

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(
        'device_capabilities',
        jsonEncode(_deviceCapabilities!.toJson()),
      );
    } catch (e) {
      debugPrint('Error detecting device capabilities: $e');
      _deviceCapabilities = DeviceCapabilities(
        ramMB: 2048,
        cpuCores: 4,
        processorName: 'Unknown',
        deviceClass: DeviceClass.medium,
        hasNeuralEngine: false,
        supportsOpenCL: false,
        maxConcurrentInferences: 1,
      );
    }
  }

  int _estimateAndroidRAM(String model) {
    final modelLower = model.toLowerCase();
    if (modelLower.contains('flagship') || modelLower.contains('pro')) {
      return 8192;
    } else if (modelLower.contains('premium')) {
      return 6144;
    } else if (modelLower.contains('mid')) {
      return 4096;
    }
    return 3072;
  }

  int _estimateAndroidCores(String model) {
    final modelLower = model.toLowerCase();
    if (modelLower.contains('flagship') || modelLower.contains('pro')) {
      return 8;
    } else if (modelLower.contains('premium')) {
      return 6;
    }
    return 4;
  }

  bool _detectAndroidNeuralEngine(String model) {
    final modelLower = model.toLowerCase();
    return modelLower.contains('flagship') ||
           modelLower.contains('pro') ||
           modelLower.contains('neural');
  }

  int _estimateIOSRAM(String machine) {
    if (machine.contains('iPhone15') || machine.contains('iPhone16')) {
      return 8192;
    } else if (machine.contains('iPhone14') || machine.contains('iPhone13')) {
      return 6144;
    } else if (machine.contains('iPhone12') || machine.contains('iPhone11')) {
      return 4096;
    }
    return 3072;
  }

  int _estimateIOSCores(String machine) {
    if (machine.contains('iPhone15') || machine.contains('iPhone16')) {
      return 6;
    } else if (machine.contains('iPhone14') || machine.contains('iPhone13')) {
      return 6;
    }
    return 4;
  }

  bool _detectIOSNeuralEngine(String machine) {
    final match = RegExp(r'iPhone(\d+)').firstMatch(machine);
    if (match != null) {
      final version = int.tryParse(match.group(1) ?? '0') ?? 0;
      return version >= 11;
    }
    return false;
  }

  DeviceClass _classifyDevice(int ramMB, int cpuCores) {
    if (ramMB >= 8192 && cpuCores >= 8) {
      return DeviceClass.premium;
    } else if (ramMB >= 6144 && cpuCores >= 6) {
      return DeviceClass.high;
    } else if (ramMB >= 4096 && cpuCores >= 4) {
      return DeviceClass.medium;
    }
    return DeviceClass.low;
  }

  int _calculateMaxConcurrentInferences(
    int ramMB,
    int cpuCores,
    DeviceClass deviceClass,
  ) {
    switch (deviceClass) {
      case DeviceClass.premium:
        return min(cpuCores ~/ 2, 4);
      case DeviceClass.high:
        return min(cpuCores ~/ 2, 3);
      case DeviceClass.medium:
        return 2;
      case DeviceClass.low:
        return 1;
    }
  }

  Future<void> _loadModelMetadata() async {
    try {
      final results = await _database!.query('models');

      for (final row in results) {
        final metadata = ModelMetadata(
          modelId: row['model_id'] as String,
          modelName: row['model_name'] as String,
          tier: ModelTier.values.firstWhere(
            (e) => e.toString() == row['tier'],
            orElse: () => ModelTier.standard,
          ),
          sizeBytes: row['size_bytes'] as int,
          version: row['version'] as String,
          capabilities: List<String>.from(
            jsonDecode(row['capabilities'] as String) as List,
          ),
          requirements: jsonDecode(row['requirements'] as String)
              as Map<String, dynamic>,
          filePath: row['file_path'] as String,
          downloadedAt: DateTime.parse(row['downloaded_at'] as String),
        );

        _modelCache[metadata.modelId] = metadata;
      }

      if (_modelCache.isEmpty) {
        await _initializeDefaultModels();
      }
    } catch (e) {
      debugPrint('Error loading model metadata: $e');
      await _initializeDefaultModels();
    }
  }

  Future<void> _initializeDefaultModels() async {
    final defaultModels = [
      ModelMetadata(
        modelId: 'lightweight_v1',
        modelName: 'Lightweight Model',
        tier: ModelTier.lightweight,
        sizeBytes: 5 * 1024 * 1024,
        version: '1.0.0',
        capabilities: ['classification', 'basic_nlp'],
        requirements: {
          'minRAM': 2048,
          'minCores': 2,
          'minBattery': 10,
        },
        filePath: 'models/lightweight_v1.tflite',
        downloadedAt: DateTime.now(),
      ),
      ModelMetadata(
        modelId: 'standard_v1',
        modelName: 'Standard Model',
        tier: ModelTier.standard,
        sizeBytes: 25 * 1024 * 1024,
        version: '1.0.0',
        capabilities: [
          'classification',
          'nlp',
          'entity_recognition',
          'sentiment'
        ],
        requirements: {
          'minRAM': 4096,
          'minCores': 4,
          'minBattery': 20,
        },
        filePath: 'models/standard_v1.tflite',
        downloadedAt: DateTime.now(),
      ),
      ModelMetadata(
        modelId: 'advanced_v1',
        modelName: 'Advanced Model',
        tier: ModelTier.advanced,
        sizeBytes: 100 * 1024 * 1024,
        version: '1.0.0',
        capabilities: [
          'classification',
          'advanced_nlp',
          'entity_recognition',
          'sentiment',
          'summarization',
          'question_answering'
        ],
        requirements: {
          'minRAM': 6144,
          'minCores': 6,
          'minBattery': 30,
        },
        filePath: 'models/advanced_v1.tflite',
        downloadedAt: DateTime.now(),
      ),
    ];

    for (final model in defaultModels) {
      _modelCache[model.modelId] = model;

      await _database!.insert(
        'models',
        {
          'model_id': model.modelId,
          'model_name': model.modelName,
          'tier': model.tier.toString(),
          'size_bytes': model.sizeBytes,
          'version': model.version,
          'capabilities': jsonEncode(model.capabilities),
          'requirements': jsonEncode(model.requirements),
          'file_path': model.filePath,
          'downloaded_at': model.downloadedAt.toIso8601String(),
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }
  }

  Future<void> _startContextMonitoring() async {
    await _updateRuntimeContext();

    _batterySubscription = _battery.onBatteryStateChanged.listen((state) async {
      await _updateRuntimeContext();
    });

    _connectivitySubscription =
        _connectivity.onConnectivityChanged.listen((result) async {
      await _updateRuntimeContext();
      await _evaluateModelSwitch();
    });

    _contextUpdateTimer = Timer.periodic(
      const Duration(minutes: 5),
      (_) async {
        await _updateRuntimeContext();
        await _evaluateModelSwitch();
      },
    );
  }

  Future<void> _updateRuntimeContext() async {
    try {
      final batteryLevel = await _battery.batteryLevel;
      final batteryState = await _battery.batteryState;
      final connectivityResult = await _connectivity.checkConnectivity();

      final networkBandwidth = await _estimateNetworkBandwidth(
        connectivityResult,
      );

      _currentContext = RuntimeContext(
        batteryLevel: batteryLevel,
        isCharging: batteryState == BatteryState.charging,
        networkType: connectivityResult,
        networkBandwidthMbps: networkBandwidth,
        isLowPowerMode: batteryLevel < 20 && !batteryState.toString().contains('charging'),
        temperature: 37.0,
        location: await _getCurrentLocation(),
        timestamp: DateTime.now(),
      );

      await _saveContextHistory(_currentContext!);
      _contextStreamController.add(_currentContext!);
    } catch (e) {
      debugPrint('Error updating runtime context: $e');
    }
  }

  Future<double> _estimateNetworkBandwidth(
    ConnectivityResult connectivity,
  ) async {
    switch (connectivity) {
      case ConnectivityResult.wifi:
        return 50.0;
      case ConnectivityResult.ethernet:
        return 100.0;
      case ConnectivityResult.mobile:
        return 10.0;
      case ConnectivityResult.none:
        return 0.0;
      default:
        return 5.0;
    }
  }

  Future<String?> _getCurrentLocation() async {
    try {
      final permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        return null;
      }

      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.low,
      ).timeout(const Duration(seconds: 5));

      return '${position.latitude},${position.longitude}';
    } catch (e) {
      return null;
    }
  }

  Future<void> _saveContextHistory(RuntimeContext context) async {
    try {
      await _database!.insert('context_history', {
        'battery_level': context.batteryLevel,
        'is_charging': context.isCharging ? 1 : 0,
        'network_type': context.networkType.toString(),
        'network_bandwidth_mbps': context.networkBandwidthMbps,
        'is_low_power_mode': context.isLowPowerMode ? 1 : 0,
        'temperature': context.temperature,
        'location': context.location,
        'timestamp': context.timestamp.toIso8601String(),
      });

      await _database!.delete(
        'context_history',
        where: 'timestamp < ?',
        whereArgs: [
          DateTime.now()
              .subtract(const Duration(days: 30))
              .toIso8601String(),
        ],
      );
    } catch (e) {
      debugPrint('Error saving context history: $e');
    }
  }

  Future<void> _selectOptimalModel() async {
    if (_deviceCapabilities == null || _currentContext == null) {
      return;
    }

    final tier = _determineOptimalTier();
    final models = _modelCache.values.where((m) => m.tier == tier).toList();

    if (models.isEmpty) {
      debugPrint('No models found for tier: $tier');
      return;
    }

    final selectedModel = models.reduce((a, b) {
      final aScore = _scoreModel(a);
      final bScore = _scoreModel(b);
      return aScore > bScore ? a : b;
    });

    await _switchModel(selectedModel);
  }

  ModelTier _determineOptimalTier() {
    final caps = _deviceCapabilities!;
    final ctx = _currentContext!;

    if (ctx.isLowPowerMode || ctx.batteryLevel < 20) {
      return ModelTier.lightweight;
    }

    if (caps.deviceClass == DeviceClass.premium &&
        ctx.batteryLevel > 50 &&
        ctx.isCharging) {
      return ModelTier.advanced;
    }

    if (caps.deviceClass == DeviceClass.high ||
        (caps.deviceClass == DeviceClass.premium && ctx.batteryLevel > 30)) {
      return ModelTier.standard;
    }

    if (caps.deviceClass == DeviceClass.medium && ctx.batteryLevel > 40) {
      return ModelTier.standard;
    }

    return ModelTier.lightweight;
  }

  double _scoreModel(ModelMetadata model) {
    final caps = _deviceCapabilities!;
    final ctx = _currentContext!;

    double score = 100.0;

    final requirements = model.requirements;
    final minRAM = requirements['minRAM'] as int? ?? 2048;
    final minCores = requirements['minCores'] as int? ?? 2;
    final minBattery = requirements['minBattery'] as int? ?? 10;

    if (caps.ramMB < minRAM) {
      score -= 50;
    }
    if (caps.cpuCores < minCores) {
      score -= 30;
    }
    if (ctx.batteryLevel < minBattery) {
      score -= 40;
    }

    score += model.capabilities.length * 5;

    final metrics = _performanceCache[model.modelId];
    if (metrics != null) {
      score += metrics.accuracy * 20;
      score -= min(metrics.averageLatencyMs / 100, 20);
      score += metrics.successRate * 10;
    }

    return max(0, score);
  }

  Future<void> _switchModel(ModelMetadata newModel) async {
    if (_activeModel?.modelId == newModel.modelId) {
      return;
    }

    final oldModelId = _activeModel?.modelId;

    try {
      await _unloadActiveModel();

      if (!_loadedInterpreters.containsKey(newModel.modelId)) {
        await _loadModel(newModel);
      }

      _activeInterpreter = _loadedInterpreters[newModel.modelId];
      _activeModel = newModel;

      await _recordModelSwitch(oldModelId, newModel.modelId);

      debugPrint(
        'Switched model from $oldModelId to ${newModel.modelId} (${newModel.tier})',
      );
    } catch (e) {
      debugPrint('Error switching model: $e');
      await _fallbackToSafeModel();
    }
  }

  Future<void> _loadModel(ModelMetadata model) async {
    try {
      final options = InterpreterOptions();

      if (_deviceCapabilities!.hasNeuralEngine) {
        options.addDelegate(GpuDelegateV2());
      }

      options.threads = min(
        _deviceCapabilities!.cpuCores,
        _deviceCapabilities!.maxConcurrentInferences,
      );

      final interpreter = await Interpreter.fromAsset(
        model.filePath,
        options: options,
      );

      _loadedInterpreters[model.modelId] = interpreter;
    } catch (e) {
      debugPrint('Error loading model ${model.modelId}: $e');
      rethrow;
    }
  }

  Future<void> _unloadActiveModel() async {
    if (_activeInterpreter != null) {
      try {
        _activeInterpreter!.close();
        _activeInterpreter = null;
      } catch (e) {
        debugPrint('Error unloading active model: $e');
      }
    }
  }

  Future<void> _recordModelSwitch(String? fromModelId, String toModelId) async {
    try {
      await _database!.insert('model_switches', {
        'from_model_id': fromModelId,
        'to_model_id': toModelId,
        'reason': 'adaptive_selection',
        'context': jsonEncode(_currentContext?.toJson() ?? {}),
        'timestamp': DateTime.now().toIso8601String(),
      });
    } catch (e) {
      debugPrint('Error recording model switch: $e');
    }
  }

  Future<void> _fallbackToSafeModel() async {
    final lightweightModels = _modelCache.values
        .where((m) => m.tier == ModelTier.lightweight)
        .toList();

    if (lightweightModels.isNotEmpty) {
      await _switchModel(lightweightModels.first);
    }
  }

  Future<void> _evaluateModelSwitch() async {
    final currentTier = _determineOptimalTier();

    if (_activeModel?.tier != currentTier) {
      await _selectOptimalModel();
    }
  }

  Future<InferenceResult> runInference(
    List<double> input, {
    String? capability,
    bool forceOnDevice = false,
  }) async {
    if (!_initialized) {
      throw StateError('PlatformAdaptiveAI not initialized');
    }

    final startTime = DateTime.now();

    try {
      final processingMode = _determineProcessingMode(forceOnDevice);

      List<double> output;
      if (processingMode == ProcessingMode.cloudOnly) {
        output = await _runCloudInference(input, capability);
      } else {
        output = await _runOnDeviceInference(input);
      }

      final latency = DateTime.now().difference(startTime).inMilliseconds;
      final confidence = _calculateConfidence(output);

      final result = InferenceResult(
        output: output,
        confidence: confidence,
        latencyMs: latency,
        modelId: _activeModel?.modelId ?? 'unknown',
        processingMode: processingMode,
        metadata: {
          'input_size': input.length,
          'output_size': output.length,
          'device_class': _deviceCapabilities?.deviceClass.toString(),
          'battery_level': _currentContext?.batteryLevel,
        },
      );

      await _recordInferenceMetrics(result, true, null);

      return result;
    } catch (e, stackTrace) {
      final latency = DateTime.now().difference(startTime).inMilliseconds;

      await _recordInferenceMetrics(
        InferenceResult(
          output: [],
          confidence: 0.0,
          latencyMs: latency,
          modelId: _activeModel?.modelId ?? 'unknown',
          processingMode: ProcessingMode.onDevice,
          metadata: {},
        ),
        false,
        e.toString(),
      );

      debugPrint('Inference error: $e');
      debugPrint('StackTrace: $stackTrace');
      rethrow;
    }
  }

  ProcessingMode _determineProcessingMode(bool forceOnDevice) {
    if (forceOnDevice) {
      return ProcessingMode.onDevice;
    }

    if (_currentContext == null) {
      return ProcessingMode.onDevice;
    }

    if (_currentContext!.networkType == ConnectivityResult.none) {
      return ProcessingMode.onDevice;
    }

    if (_currentContext!.isLowPowerMode) {
      return ProcessingMode.cloudOnly;
    }

    if (_deviceCapabilities!.deviceClass == DeviceClass.low) {
      return ProcessingMode.hybrid;
    }

    return ProcessingMode.onDevice;
  }

  Future<List<double>> _runOnDeviceInference(List<double> input) async {
    if (_activeInterpreter == null) {
      throw StateError('No active model loaded');
    }

    try {
      final inputShape = _activeInterpreter!.getInputTensor(0).shape;
      final outputShape = _activeInterpreter!.getOutputTensor(0).shape;

      final inputTensor = TensorBuffer.createFixedSize(
        inputShape,
        TfLiteType.float32,
      );

      inputTensor.loadList(input, shape: inputShape);

      final outputTensor = TensorBuffer.createFixedSize(
        outputShape,
        TfLiteType.float32,
      );

      _activeInterpreter!.run(
        inputTensor.buffer,
        outputTensor.buffer,
      );

      return outputTensor.getDoubleList();
    } catch (e) {
      debugPrint('On-device inference error: $e');
      rethrow;
    }
  }

  Future<List<double>> _runCloudInference(
    List<double> input,
    String? capability,
  ) async {
    await Future.delayed(const Duration(milliseconds: 200));

    return List.generate(10, (i) => Random().nextDouble());
  }

  double _calculateConfidence(List<double> output) {
    if (output.isEmpty) return 0.0;

    final maxValue = output.reduce(max);
    final sum = output.reduce((a, b) => a + b);

    if (sum == 0) return 0.0;

    return maxValue / sum;
  }

  Future<void> _recordInferenceMetrics(
    InferenceResult result,
    bool success,
    String? errorMessage,
  ) async {
    try {
      await _database!.insert('performance_history', {
        'model_id': result.modelId,
        'latency_ms': result.latencyMs,
        'accuracy': result.confidence,
        'battery_level': _currentContext?.batteryLevel ?? 0,
        'network_type': _currentContext?.networkType.toString() ?? 'none',
        'processing_mode': result.processingMode.toString(),
        'success': success ? 1 : 0,
        'error_message': errorMessage,
        'timestamp': DateTime.now().toIso8601String(),
      });

      await _updatePerformanceMetrics(result.modelId);
    } catch (e) {
      debugPrint('Error recording inference metrics: $e');
    }
  }

  Future<void> _updatePerformanceMetrics(String modelId) async {
    try {
      final results = await _database!.query(
        'performance_history',
        where: 'model_id = ?',
        whereArgs: [modelId],
        orderBy: 'timestamp DESC',
        limit: 100,
      );

      if (results.isEmpty) return;

      final latencies = results.map((r) => r['latency_ms'] as double).toList();
      final accuracies = results.map((r) => r['accuracy'] as double).toList();
      final successes = results.where((r) => r['success'] == 1).length;

      final avgLatency = latencies.reduce((a, b) => a + b) / latencies.length;
      final avgAccuracy =
          accuracies.reduce((a, b) => a + b) / accuracies.length;
      final successRate = successes / results.length;

      final errorCounts = <String, int>{};
      for (final result in results) {
        final error = result['error_message'] as String?;
        if (error != null) {
          errorCounts[error] = (errorCounts[error] ?? 0) + 1;
        }
      }

      final metrics = PerformanceMetrics(
        modelId: modelId,
        averageLatencyMs: avgLatency,
        accuracy: avgAccuracy,
        totalInferences: results.length,
        successRate: successRate,
        averageBatteryImpact: 0.5,
        errorCounts: errorCounts,
        lastUpdated: DateTime.now(),
      );

      _performanceCache[modelId] = metrics;
      _metricsStreamController.add(metrics);
    } catch (e) {
      debugPrint('Error updating performance metrics: $e');
    }
  }

  Future<Map<String, PerformanceMetrics>> getPerformanceMetrics() async {
    for (final modelId in _modelCache.keys) {
      await _updatePerformanceMetrics(modelId);
    }
    return Map.from(_performanceCache);
  }

  DeviceCapabilities? get deviceCapabilities => _deviceCapabilities;
  RuntimeContext? get currentContext => _currentContext;
  ModelMetadata? get activeModel => _activeModel;

  Future<void> dispose() async {
    await _batterySubscription?.cancel();
    await _connectivitySubscription?.cancel();
    _contextUpdateTimer?.cancel();

    for (final interpreter in _loadedInterpreters.values) {
      interpreter.close();
    }
    _loadedInterpreters.clear();

    await _database?.close();
    await _contextStreamController.close();
    await _metricsStreamController.close();

    _initialized = false;
  }
}
