import 'dart:async';
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';
import 'package:tflite_flutter/tflite_flutter.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/// Model metadata for version tracking and configuration
class ModelMetadata {
  final String modelId;
  final String version;
  final int size;
  final DateTime updatedAt;
  final Map<String, dynamic> config;
  final List<int> inputShape;
  final List<int> outputShape;
  final String platform;

  ModelMetadata({
    required this.modelId,
    required this.version,
    required this.size,
    required this.updatedAt,
    required this.config,
    required this.inputShape,
    required this.outputShape,
    required this.platform,
  });

  factory ModelMetadata.fromJson(Map<String, dynamic> json) {
    return ModelMetadata(
      modelId: json['modelId'],
      version: json['version'],
      size: json['size'],
      updatedAt: DateTime.parse(json['updatedAt']),
      config: json['config'] ?? {},
      inputShape: List<int>.from(json['inputShape']),
      outputShape: List<int>.from(json['outputShape']),
      platform: json['platform'],
    );
  }

  Map<String, dynamic> toJson() => {
        'modelId': modelId,
        'version': version,
        'size': size,
        'updatedAt': updatedAt.toIso8601String(),
        'config': config,
        'inputShape': inputShape,
        'outputShape': outputShape,
        'platform': platform,
      };
}

/// Performance metrics for model execution
class ModelPerformanceMetrics {
  final String modelId;
  final Duration inferenceTime;
  final int inputSize;
  final int outputSize;
  final DateTime timestamp;
  final bool success;
  final String? error;

  ModelPerformanceMetrics({
    required this.modelId,
    required this.inferenceTime,
    required this.inputSize,
    required this.outputSize,
    required this.timestamp,
    required this.success,
    this.error,
  });

  Map<String, dynamic> toJson() => {
        'modelId': modelId,
        'inferenceTime': inferenceTime.inMilliseconds,
        'inputSize': inputSize,
        'outputSize': outputSize,
        'timestamp': timestamp.toIso8601String(),
        'success': success,
        'error': error,
      };
}

/// Manages interpreter instances for efficient reuse
class InterpreterPool {
  final Map<String, List<Interpreter>> _availableInterpreters = {};
  final Map<String, List<Interpreter>> _inUseInterpreters = {};
  final int maxPoolSize;
  final Duration timeoutDuration;

  InterpreterPool({
    this.maxPoolSize = 3,
    this.timeoutDuration = const Duration(seconds: 30),
  });

  Future<Interpreter> acquire(String modelId, Future<Interpreter> Function() creator) async {
    // Check if we have an available interpreter
    if (_availableInterpreters.containsKey(modelId) && _availableInterpreters[modelId]!.isNotEmpty) {
      final interpreter = _availableInterpreters[modelId]!.removeLast();
      _inUseInterpreters[modelId] = _inUseInterpreters[modelId] ?? [];
      _inUseInterpreters[modelId]!.add(interpreter);
      return interpreter;
    }

    // Create new interpreter if under pool size
    final totalCount = (_availableInterpreters[modelId]?.length ?? 0) + (_inUseInterpreters[modelId]?.length ?? 0);
    if (totalCount < maxPoolSize) {
      final interpreter = await creator();
      _inUseInterpreters[modelId] = _inUseInterpreters[modelId] ?? [];
      _inUseInterpreters[modelId]!.add(interpreter);
      return interpreter;
    }

    // Wait for an interpreter to become available
    final completer = Completer<Interpreter>();
    Timer.periodic(const Duration(milliseconds: 100), (timer) {
      if (_availableInterpreters.containsKey(modelId) && _availableInterpreters[modelId]!.isNotEmpty) {
        timer.cancel();
        final interpreter = _availableInterpreters[modelId]!.removeLast();
        _inUseInterpreters[modelId]!.add(interpreter);
        completer.complete(interpreter);
      }
    });

    return completer.future.timeout(timeoutDuration);
  }

  void release(String modelId, Interpreter interpreter) {
    if (_inUseInterpreters.containsKey(modelId)) {
      _inUseInterpreters[modelId]!.remove(interpreter);
      _availableInterpreters[modelId] = _availableInterpreters[modelId] ?? [];
      _availableInterpreters[modelId]!.add(interpreter);
    }
  }

  void clear(String modelId) {
    _availableInterpreters[modelId]?.forEach((i) => i.close());
    _inUseInterpreters[modelId]?.forEach((i) => i.close());
    _availableInterpreters.remove(modelId);
    _inUseInterpreters.remove(modelId);
  }

  void clearAll() {
    _availableInterpreters.values.forEach((interpreters) {
      interpreters.forEach((i) => i.close());
    });
    _inUseInterpreters.values.forEach((interpreters) {
      interpreters.forEach((i) => i.close());
    });
    _availableInterpreters.clear();
    _inUseInterpreters.clear();
  }
}

/// Main ML Model Manager for TensorFlow Lite and Core ML
class MLModelManager {
  static final MLModelManager _instance = MLModelManager._internal();
  factory MLModelManager() => _instance;
  MLModelManager._internal();

  final Map<String, ModelMetadata> _modelMetadata = {};
  final Map<String, String> _modelPaths = {};
  final InterpreterPool _interpreterPool = InterpreterPool(maxPoolSize: 3);
  final List<ModelPerformanceMetrics> _performanceMetrics = [];
  final StreamController<ModelPerformanceMetrics> _metricsController = StreamController.broadcast();

  bool _initialized = false;
  String? _baseUrl;
  String? _apiKey;

  Stream<ModelPerformanceMetrics> get metricsStream => _metricsController.stream;

  /// Initialize the ML Model Manager
  Future<void> initialize({
    required String baseUrl,
    required String apiKey,
    List<String>? preloadModels,
  }) async {
    if (_initialized) return;

    _baseUrl = baseUrl;
    _apiKey = apiKey;

    // Load cached metadata
    await _loadCachedMetadata();

    // Check for model updates
    await _checkModelUpdates();

    // Preload specified models
    if (preloadModels != null) {
      for (final modelId in preloadModels) {
        await _preloadModel(modelId);
      }
    }

    _initialized = true;
  }

  /// Get the appropriate model for the current platform
  String _getPlatformModelId(String baseModelId) {
    if (Platform.isIOS) {
      return '${baseModelId}_coreml';
    }
    return '${baseModelId}_tflite';
  }

  /// Load model metadata from cache
  Future<void> _loadCachedMetadata() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cachedData = prefs.getString('ml_model_metadata');
      if (cachedData != null) {
        final List<dynamic> metadataList = (cachedData as dynamic);
        for (final item in metadataList) {
          final metadata = ModelMetadata.fromJson(item);
          _modelMetadata[metadata.modelId] = metadata;
        }
      }
    } catch (e) {
      print('Failed to load cached metadata: $e');
    }
  }

  /// Check for model updates from server
  Future<void> _checkModelUpdates() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/api/ml/models/metadata'),
        headers: {'Authorization': 'Bearer $_apiKey'},
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final List<dynamic> serverMetadata = response.body as dynamic;
        for (final item in serverMetadata) {
          final metadata = ModelMetadata.fromJson(item);
          final currentMetadata = _modelMetadata[metadata.modelId];

          // Download model if new or updated
          if (currentMetadata == null || currentMetadata.version != metadata.version) {
            await _downloadModel(metadata);
          }
        }

        // Save updated metadata
        await _saveCachedMetadata();
      }
    } catch (e) {
      print('Failed to check model updates: $e');
    }
  }

  /// Download model from server
  Future<void> _downloadModel(ModelMetadata metadata) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/api/ml/models/${metadata.modelId}/download'),
        headers: {'Authorization': 'Bearer $_apiKey'},
      );

      if (response.statusCode == 200) {
        final directory = await getApplicationDocumentsDirectory();
        final modelPath = '${directory.path}/models/${metadata.modelId}_${metadata.version}.tflite';

        // Create directory if it doesn't exist
        final modelDir = Directory('${directory.path}/models');
        if (!await modelDir.exists()) {
          await modelDir.create(recursive: true);
        }

        // Write model file
        final file = File(modelPath);
        await file.writeAsBytes(response.bodyBytes);

        // Update metadata and path
        _modelMetadata[metadata.modelId] = metadata;
        _modelPaths[metadata.modelId] = modelPath;

        // Clear old interpreters
        _interpreterPool.clear(metadata.modelId);

        print('Downloaded model ${metadata.modelId} version ${metadata.version}');
      }
    } catch (e) {
      print('Failed to download model ${metadata.modelId}: $e');
    }
  }

  /// Save model metadata to cache
  Future<void> _saveCachedMetadata() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final metadataList = _modelMetadata.values.map((m) => m.toJson()).toList();
      await prefs.setString('ml_model_metadata', metadataList.toString());
    } catch (e) {
      print('Failed to save cached metadata: $e');
    }
  }

  /// Preload a model by creating an interpreter
  Future<void> _preloadModel(String modelId) async {
    try {
      final platformModelId = _getPlatformModelId(modelId);
      final modelPath = _modelPaths[platformModelId];

      if (modelPath == null) {
        // Try to load from assets
        final assetPath = 'assets/models/$modelId.tflite';
        await _interpreterPool.acquire(
          platformModelId,
          () => Interpreter.fromAsset(assetPath),
        );
        print('Preloaded model from assets: $modelId');
      } else {
        await _interpreterPool.acquire(
          platformModelId,
          () => Interpreter.fromFile(File(modelPath)),
        );
        print('Preloaded model from file: $modelId');
      }
    } catch (e) {
      print('Failed to preload model $modelId: $e');
    }
  }

  /// Run inference on a model
  Future<List<double>> runInference({
    required String modelId,
    required List<double> input,
    Map<String, dynamic>? options,
  }) async {
    final platformModelId = _getPlatformModelId(modelId);
    final startTime = DateTime.now();
    Interpreter? interpreter;

    try {
      // Acquire interpreter from pool
      interpreter = await _interpreterPool.acquire(
        platformModelId,
        () => _createInterpreter(platformModelId),
      );

      // Prepare input tensor
      final metadata = _modelMetadata[platformModelId];
      final inputTensor = _prepareInputTensor(input, metadata?.inputShape);

      // Prepare output tensor
      final outputShape = metadata?.outputShape ?? [1, 1];
      final outputTensor = List.filled(outputShape.reduce((a, b) => a * b), 0.0).reshape(outputShape);

      // Run inference
      interpreter.run(inputTensor, outputTensor);

      // Extract results
      final output = _extractOutput(outputTensor);

      // Record metrics
      final duration = DateTime.now().difference(startTime);
      _recordMetrics(ModelPerformanceMetrics(
        modelId: modelId,
        inferenceTime: duration,
        inputSize: input.length,
        outputSize: output.length,
        timestamp: DateTime.now(),
        success: true,
      ));

      return output;
    } catch (e) {
      final duration = DateTime.now().difference(startTime);
      _recordMetrics(ModelPerformanceMetrics(
        modelId: modelId,
        inferenceTime: duration,
        inputSize: input.length,
        outputSize: 0,
        timestamp: DateTime.now(),
        success: false,
        error: e.toString(),
      ));
      rethrow;
    } finally {
      if (interpreter != null) {
        _interpreterPool.release(platformModelId, interpreter);
      }
    }
  }

  /// Create a new interpreter instance
  Future<Interpreter> _createInterpreter(String modelId) async {
    final modelPath = _modelPaths[modelId];

    if (modelPath != null && File(modelPath).existsSync()) {
      return Interpreter.fromFile(
        File(modelPath),
        options: InterpreterOptions()
          ..threads = 4
          ..useNnApiForAndroid = true,
      );
    } else {
      // Fallback to asset
      final assetPath = 'assets/models/$modelId.tflite';
      return Interpreter.fromAsset(
        assetPath,
        options: InterpreterOptions()
          ..threads = 4
          ..useNnApiForAndroid = true,
      );
    }
  }

  /// Prepare input tensor with proper shape
  dynamic _prepareInputTensor(List<double> input, List<int>? shape) {
    if (shape == null) return input;

    // Reshape input to match expected shape
    final totalSize = shape.reduce((a, b) => a * b);
    if (input.length != totalSize) {
      throw ArgumentError('Input size ${input.length} does not match expected size $totalSize');
    }

    return input.reshape(shape);
  }

  /// Extract output from tensor
  List<double> _extractOutput(dynamic output) {
    if (output is List<double>) {
      return output;
    } else if (output is List) {
      return output.expand((e) => _extractOutput(e)).toList();
    }
    return [output.toDouble()];
  }

  /// Record performance metrics
  void _recordMetrics(ModelPerformanceMetrics metrics) {
    _performanceMetrics.add(metrics);
    _metricsController.add(metrics);

    // Keep only last 1000 metrics
    if (_performanceMetrics.length > 1000) {
      _performanceMetrics.removeRange(0, _performanceMetrics.length - 1000);
    }
  }

  /// Get performance statistics for a model
  Map<String, dynamic> getPerformanceStats(String modelId) {
    final modelMetrics = _performanceMetrics
        .where((m) => m.modelId == modelId)
        .toList();

    if (modelMetrics.isEmpty) {
      return {
        'modelId': modelId,
        'totalRuns': 0,
      };
    }

    final successfulRuns = modelMetrics.where((m) => m.success).toList();
    final inferenceTimes = successfulRuns.map((m) => m.inferenceTime.inMilliseconds).toList();

    inferenceTimes.sort();
    final avgTime = inferenceTimes.isEmpty ? 0 : inferenceTimes.reduce((a, b) => a + b) / inferenceTimes.length;
    final p50 = inferenceTimes.isEmpty ? 0 : inferenceTimes[inferenceTimes.length ~/ 2];
    final p95 = inferenceTimes.isEmpty ? 0 : inferenceTimes[(inferenceTimes.length * 0.95).toInt()];
    final p99 = inferenceTimes.isEmpty ? 0 : inferenceTimes[(inferenceTimes.length * 0.99).toInt()];

    return {
      'modelId': modelId,
      'totalRuns': modelMetrics.length,
      'successRate': successfulRuns.length / modelMetrics.length,
      'avgInferenceTime': avgTime,
      'p50InferenceTime': p50,
      'p95InferenceTime': p95,
      'p99InferenceTime': p99,
    };
  }

  /// Update a specific model
  Future<void> updateModel(String modelId) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/api/ml/models/$modelId/metadata'),
        headers: {'Authorization': 'Bearer $_apiKey'},
      );

      if (response.statusCode == 200) {
        final metadata = ModelMetadata.fromJson(response.body as dynamic);
        await _downloadModel(metadata);
        await _saveCachedMetadata();
      }
    } catch (e) {
      print('Failed to update model $modelId: $e');
    }
  }

  /// Clear all cached models
  Future<void> clearCache() async {
    _interpreterPool.clearAll();
    _modelPaths.clear();
    _modelMetadata.clear();

    final directory = await getApplicationDocumentsDirectory();
    final modelDir = Directory('${directory.path}/models');
    if (await modelDir.exists()) {
      await modelDir.delete(recursive: true);
    }

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('ml_model_metadata');
  }

  /// Dispose of resources
  void dispose() {
    _interpreterPool.clearAll();
    _metricsController.close();
  }
}

/// Extension for reshaping lists
extension ListReshape on List<double> {
  dynamic reshape(List<int> shape) {
    if (shape.length == 1) return this;

    final outerSize = shape[0];
    final innerShape = shape.sublist(1);
    final innerSize = innerShape.reduce((a, b) => a * b);

    final result = [];
    for (var i = 0; i < outerSize; i++) {
      final start = i * innerSize;
      final end = start + innerSize;
      result.add(sublist(start, end).reshape(innerShape));
    }

    return result;
  }
}
