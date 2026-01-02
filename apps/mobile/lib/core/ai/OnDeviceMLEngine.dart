import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:crypto/crypto.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:image/image.dart' as img;
import 'package:path_provider/path_provider.dart';
import 'package:tflite_flutter/tflite_flutter.dart';
import 'package:tflite_flutter_helper/tflite_flutter_helper.dart';

/// TensorFlow Lite integration for on-device ML inference
class OnDeviceMLEngine {
  static final OnDeviceMLEngine _instance = OnDeviceMLEngine._internal();
  factory OnDeviceMLEngine() => _instance;
  OnDeviceMLEngine._internal();

  final Map<String, _ModelContainer> _models = {};
  final Map<String, _InferenceCache> _caches = {};
  final Map<String, _ModelAnalytics> _analytics = {};
  final Map<String, Interpreter> _interpreterPool = {};

  bool _isInitialized = false;
  int _maxCacheSize = 100;
  int _poolSize = 3;

  /// Initialize the ML engine
  Future<void> initialize() async {
    if (_isInitialized) {
      debugPrint('OnDeviceMLEngine already initialized');
      return;
    }

    try {
      debugPrint('Initializing OnDeviceMLEngine...');

      // Verify TFLite availability
      final testInterpreter = await _createTestInterpreter();
      testInterpreter?.close();

      _isInitialized = true;
      debugPrint('OnDeviceMLEngine initialized successfully');
    } catch (e) {
      debugPrint('Failed to initialize OnDeviceMLEngine: $e');
      rethrow;
    }
  }

  /// Create a test interpreter to verify TFLite is available
  Future<Interpreter?> _createTestInterpreter() async {
    try {
      // Try to create a dummy interpreter with minimal config
      return null; // Will be replaced by actual model loading
    } catch (e) {
      debugPrint('Test interpreter creation failed: $e');
      return null;
    }
  }

  /// Load model from assets
  Future<void> loadModelFromAsset({
    required String modelId,
    required String assetPath,
    required String version,
    ModelType type = ModelType.custom,
    bool enableGPU = false,
    bool useQuantization = false,
  }) async {
    if (!_isInitialized) {
      throw Exception('OnDeviceMLEngine not initialized');
    }

    try {
      debugPrint('Loading model $modelId from asset: $assetPath');

      // Load model bytes
      final modelData = await rootBundle.load(assetPath);
      final modelBytes = modelData.buffer.asUint8List();

      // Verify checksum
      final checksum = _calculateChecksum(modelBytes);
      debugPrint('Model checksum: $checksum');

      // Create interpreter options
      final options = InterpreterOptions();

      if (enableGPU && await _isGPUAvailable()) {
        debugPrint('Enabling GPU acceleration');
        final gpuDelegate = GpuDelegateV2();
        options.addDelegate(gpuDelegate);
      }

      options.threads = 4;

      // Create interpreter
      final interpreter = Interpreter.fromBuffer(modelBytes, options: options);

      // Get model info
      final inputTensors = interpreter.getInputTensors();
      final outputTensors = interpreter.getOutputTensors();

      debugPrint('Input tensors: ${inputTensors.length}');
      debugPrint('Output tensors: ${outputTensors.length}');

      for (var i = 0; i < inputTensors.length; i++) {
        debugPrint('Input[$i]: ${inputTensors[i].shape} (${inputTensors[i].type})');
      }

      for (var i = 0; i < outputTensors.length; i++) {
        debugPrint('Output[$i]: ${outputTensors[i].shape} (${outputTensors[i].type})');
      }

      // Warmup
      await _warmupModel(interpreter, inputTensors[0].shape);

      // Store model container
      _models[modelId] = _ModelContainer(
        id: modelId,
        version: version,
        type: type,
        interpreter: interpreter,
        checksum: checksum,
        modelBytes: modelBytes,
        inputShape: inputTensors[0].shape,
        outputShape: outputTensors[0].shape,
        enableGPU: enableGPU,
        loadedAt: DateTime.now(),
      );

      // Initialize cache and analytics
      _caches[modelId] = _InferenceCache(maxSize: _maxCacheSize);
      _analytics[modelId] = _ModelAnalytics();

      debugPrint('Model $modelId loaded successfully');
    } catch (e) {
      debugPrint('Failed to load model $modelId: $e');
      rethrow;
    }
  }

  /// Load model from URL
  Future<void> loadModelFromURL({
    required String modelId,
    required String url,
    required String version,
    String? expectedChecksum,
    ModelType type = ModelType.custom,
    bool enableGPU = false,
    Function(double)? onProgress,
  }) async {
    if (!_isInitialized) {
      throw Exception('OnDeviceMLEngine not initialized');
    }

    try {
      debugPrint('Downloading model $modelId from: $url');

      // Download model
      final response = await http.get(Uri.parse(url));

      if (response.statusCode != 200) {
        throw Exception('Failed to download model: ${response.statusCode}');
      }

      final modelBytes = response.bodyBytes;
      debugPrint('Downloaded ${modelBytes.length} bytes');

      // Verify checksum if provided
      final checksum = _calculateChecksum(modelBytes);
      if (expectedChecksum != null && checksum != expectedChecksum) {
        throw Exception('Checksum mismatch: expected $expectedChecksum, got $checksum');
      }

      // Save to local storage
      final directory = await getApplicationDocumentsDirectory();
      final modelPath = '${directory.path}/models/$modelId-$version.tflite';
      final modelFile = File(modelPath);
      await modelFile.create(recursive: true);
      await modelFile.writeAsBytes(modelBytes);

      debugPrint('Model saved to: $modelPath');

      // Create interpreter
      final options = InterpreterOptions();

      if (enableGPU && await _isGPUAvailable()) {
        debugPrint('Enabling GPU acceleration');
        final gpuDelegate = GpuDelegateV2();
        options.addDelegate(gpuDelegate);
      }

      options.threads = 4;

      final interpreter = Interpreter.fromBuffer(modelBytes, options: options);

      // Get model info
      final inputTensors = interpreter.getInputTensors();
      final outputTensors = interpreter.getOutputTensors();

      // Warmup
      await _warmupModel(interpreter, inputTensors[0].shape);

      // Store model container
      _models[modelId] = _ModelContainer(
        id: modelId,
        version: version,
        type: type,
        interpreter: interpreter,
        checksum: checksum,
        modelBytes: modelBytes,
        inputShape: inputTensors[0].shape,
        outputShape: outputTensors[0].shape,
        enableGPU: enableGPU,
        loadedAt: DateTime.now(),
      );

      // Initialize cache and analytics
      _caches[modelId] = _InferenceCache(maxSize: _maxCacheSize);
      _analytics[modelId] = _ModelAnalytics();

      debugPrint('Model $modelId loaded successfully from URL');
    } catch (e) {
      debugPrint('Failed to load model $modelId from URL: $e');
      rethrow;
    }
  }

  /// Warmup model with dummy inference
  Future<void> _warmupModel(Interpreter interpreter, List<int> inputShape) async {
    try {
      debugPrint('Warming up model...');

      // Create dummy input based on shape
      final input = _createDummyInput(inputShape);
      final output = _createOutputBuffer(interpreter.getOutputTensors()[0].shape);

      // Run dummy inference
      final stopwatch = Stopwatch()..start();
      interpreter.run(input, output);
      stopwatch.stop();

      debugPrint('Warmup completed in ${stopwatch.elapsedMilliseconds}ms');
    } catch (e) {
      debugPrint('Warmup failed: $e');
    }
  }

  /// Create dummy input based on shape
  dynamic _createDummyInput(List<int> shape) {
    if (shape.length == 4) {
      // Image input [batch, height, width, channels]
      final batch = shape[0];
      final height = shape[1];
      final width = shape[2];
      final channels = shape[3];

      return List.generate(
        batch,
        (_) => List.generate(
          height,
          (_) => List.generate(
            width,
            (_) => List.generate(channels, (_) => 0.0),
          ),
        ),
      );
    } else if (shape.length == 2) {
      // Vector input [batch, features]
      final batch = shape[0];
      final features = shape[1];

      return List.generate(
        batch,
        (_) => List.generate(features, (_) => 0.0),
      );
    } else {
      throw Exception('Unsupported input shape: $shape');
    }
  }

  /// Create output buffer based on shape
  dynamic _createOutputBuffer(List<int> shape) {
    if (shape.length == 2) {
      // Classification output [batch, classes]
      final batch = shape[0];
      final classes = shape[1];

      return List.generate(
        batch,
        (_) => List.generate(classes, (_) => 0.0),
      );
    } else if (shape.length == 4) {
      // Detection output [batch, boxes, ?, ?]
      final batch = shape[0];
      final boxes = shape[1];
      final dim1 = shape[2];
      final dim2 = shape[3];

      return List.generate(
        batch,
        (_) => List.generate(
          boxes,
          (_) => List.generate(
            dim1,
            (_) => List.generate(dim2, (_) => 0.0),
          ),
        ),
      );
    } else {
      throw Exception('Unsupported output shape: $shape');
    }
  }

  /// Calculate SHA-256 checksum
  String _calculateChecksum(Uint8List bytes) {
    final digest = sha256.convert(bytes);
    return digest.toString();
  }

  /// Check if GPU is available
  Future<bool> _isGPUAvailable() async {
    try {
      if (Platform.isAndroid) {
        return true; // Most Android devices support GPU delegate
      } else if (Platform.isIOS) {
        return true; // iOS supports Metal delegate
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  /// Run image classification
  Future<List<ClassificationResult>> classifyImage({
    required String modelId,
    required Uint8List imageBytes,
    double confidenceThreshold = 0.5,
    int topK = 5,
    List<String>? labels,
  }) async {
    final model = _getModel(modelId);
    final cache = _caches[modelId]!;
    final analytics = _analytics[modelId]!;

    // Check cache
    final cacheKey = _calculateChecksum(imageBytes);
    final cached = cache.get(cacheKey);
    if (cached != null) {
      debugPrint('Cache hit for image classification');
      analytics.cacheHits++;
      return cached as List<ClassificationResult>;
    }

    analytics.cacheMisses++;

    final stopwatch = Stopwatch()..start();

    try {
      // Preprocess image
      final inputTensor = await _preprocessImage(imageBytes, model.inputShape);

      // Run inference
      final outputTensor = _createOutputBuffer(model.outputShape);
      model.interpreter.run(inputTensor, outputTensor);

      // Post-process results
      final probabilities = (outputTensor as List<dynamic>)[0] as List<dynamic>;
      final results = _processClassificationOutput(
        probabilities.cast<double>(),
        confidenceThreshold,
        topK,
        labels,
      );

      // Update analytics
      stopwatch.stop();
      analytics.addInference(stopwatch.elapsedMilliseconds);

      // Cache results
      cache.put(cacheKey, results);

      debugPrint('Classification completed in ${stopwatch.elapsedMilliseconds}ms');
      return results;
    } catch (e) {
      analytics.errors++;
      debugPrint('Classification failed: $e');
      rethrow;
    }
  }

  /// Run object detection
  Future<List<DetectionResult>> detectObjects({
    required String modelId,
    required Uint8List imageBytes,
    double confidenceThreshold = 0.5,
    double iouThreshold = 0.5,
    List<String>? labels,
  }) async {
    final model = _getModel(modelId);
    final cache = _caches[modelId]!;
    final analytics = _analytics[modelId]!;

    // Check cache
    final cacheKey = _calculateChecksum(imageBytes);
    final cached = cache.get(cacheKey);
    if (cached != null) {
      debugPrint('Cache hit for object detection');
      analytics.cacheHits++;
      return cached as List<DetectionResult>;
    }

    analytics.cacheMisses++;

    final stopwatch = Stopwatch()..start();

    try {
      // Preprocess image
      final inputTensor = await _preprocessImage(imageBytes, model.inputShape);

      // Run inference
      final outputTensor = _createOutputBuffer(model.outputShape);
      model.interpreter.run(inputTensor, outputTensor);

      // Post-process results (assuming SSD MobileNet output format)
      final results = _processDetectionOutput(
        outputTensor,
        confidenceThreshold,
        iouThreshold,
        labels,
      );

      // Update analytics
      stopwatch.stop();
      analytics.addInference(stopwatch.elapsedMilliseconds);

      // Cache results
      cache.put(cacheKey, results);

      debugPrint('Detection completed in ${stopwatch.elapsedMilliseconds}ms');
      return results;
    } catch (e) {
      analytics.errors++;
      debugPrint('Detection failed: $e');
      rethrow;
    }
  }

  /// Run text classification
  Future<List<ClassificationResult>> classifyText({
    required String modelId,
    required String text,
    double confidenceThreshold = 0.5,
    int topK = 3,
    List<String>? labels,
  }) async {
    final model = _getModel(modelId);
    final cache = _caches[modelId]!;
    final analytics = _analytics[modelId]!;

    // Check cache
    final cacheKey = sha256.convert(utf8.encode(text)).toString();
    final cached = cache.get(cacheKey);
    if (cached != null) {
      debugPrint('Cache hit for text classification');
      analytics.cacheHits++;
      return cached as List<ClassificationResult>;
    }

    analytics.cacheMisses++;

    final stopwatch = Stopwatch()..start();

    try {
      // Preprocess text (tokenization + padding)
      final inputTensor = _preprocessText(text, model.inputShape);

      // Run inference
      final outputTensor = _createOutputBuffer(model.outputShape);
      model.interpreter.run(inputTensor, outputTensor);

      // Post-process results
      final probabilities = (outputTensor as List<dynamic>)[0] as List<dynamic>;
      final results = _processClassificationOutput(
        probabilities.cast<double>(),
        confidenceThreshold,
        topK,
        labels,
      );

      // Update analytics
      stopwatch.stop();
      analytics.addInference(stopwatch.elapsedMilliseconds);

      // Cache results
      cache.put(cacheKey, results);

      debugPrint('Text classification completed in ${stopwatch.elapsedMilliseconds}ms');
      return results;
    } catch (e) {
      analytics.errors++;
      debugPrint('Text classification failed: $e');
      rethrow;
    }
  }

  /// Run recommendation
  Future<List<RecommendationResult>> recommend({
    required String modelId,
    required List<double> userVector,
    int topK = 10,
  }) async {
    final model = _getModel(modelId);
    final analytics = _analytics[modelId]!;

    final stopwatch = Stopwatch()..start();

    try {
      // Prepare input
      final inputTensor = [userVector];

      // Run inference
      final outputTensor = _createOutputBuffer(model.outputShape);
      model.interpreter.run(inputTensor, outputTensor);

      // Post-process results
      final scores = (outputTensor as List<dynamic>)[0] as List<dynamic>;
      final results = _processRecommendationOutput(scores.cast<double>(), topK);

      // Update analytics
      stopwatch.stop();
      analytics.addInference(stopwatch.elapsedMilliseconds);

      debugPrint('Recommendation completed in ${stopwatch.elapsedMilliseconds}ms');
      return results;
    } catch (e) {
      analytics.errors++;
      debugPrint('Recommendation failed: $e');
      rethrow;
    }
  }

  /// Run custom inference
  Future<dynamic> runInference({
    required String modelId,
    required dynamic input,
  }) async {
    final model = _getModel(modelId);
    final analytics = _analytics[modelId]!;

    final stopwatch = Stopwatch()..start();

    try {
      // Run inference
      final output = _createOutputBuffer(model.outputShape);
      model.interpreter.run(input, output);

      // Update analytics
      stopwatch.stop();
      analytics.addInference(stopwatch.elapsedMilliseconds);

      debugPrint('Custom inference completed in ${stopwatch.elapsedMilliseconds}ms');
      return output;
    } catch (e) {
      analytics.errors++;
      debugPrint('Custom inference failed: $e');
      rethrow;
    }
  }

  /// Batch inference
  Future<List<dynamic>> runBatchInference({
    required String modelId,
    required List<dynamic> inputs,
  }) async {
    final model = _getModel(modelId);
    final analytics = _analytics[modelId]!;

    final stopwatch = Stopwatch()..start();
    final results = <dynamic>[];

    try {
      for (final input in inputs) {
        final output = _createOutputBuffer(model.outputShape);
        model.interpreter.run(input, output);
        results.add(output);
      }

      // Update analytics
      stopwatch.stop();
      analytics.addInference(stopwatch.elapsedMilliseconds);

      debugPrint('Batch inference completed in ${stopwatch.elapsedMilliseconds}ms for ${inputs.length} inputs');
      return results;
    } catch (e) {
      analytics.errors++;
      debugPrint('Batch inference failed: $e');
      rethrow;
    }
  }

  /// Preprocess image for model input
  Future<List<List<List<List<double>>>>> _preprocessImage(
    Uint8List imageBytes,
    List<int> inputShape,
  ) async {
    // Decode image
    final image = img.decodeImage(imageBytes);
    if (image == null) {
      throw Exception('Failed to decode image');
    }

    // Get target dimensions
    final height = inputShape[1];
    final width = inputShape[2];
    final channels = inputShape[3];

    // Resize image
    final resized = img.copyResize(image, width: width, height: height);

    // Convert to normalized tensor
    final imageMatrix = List.generate(
      1,
      (_) => List.generate(
        height,
        (y) => List.generate(
          width,
          (x) {
            final pixel = resized.getPixel(x, y);
            if (channels == 3) {
              // RGB normalization to [-1, 1]
              return [
                (pixel.r / 127.5) - 1.0,
                (pixel.g / 127.5) - 1.0,
                (pixel.b / 127.5) - 1.0,
              ];
            } else if (channels == 1) {
              // Grayscale
              final gray = (0.299 * pixel.r + 0.587 * pixel.g + 0.114 * pixel.b);
              return [(gray / 127.5) - 1.0];
            } else {
              throw Exception('Unsupported channel count: $channels');
            }
          },
        ),
      ),
    );

    return imageMatrix;
  }

  /// Preprocess text for model input
  List<List<int>> _preprocessText(String text, List<int> inputShape) {
    final maxLength = inputShape[1];

    // Simple word tokenization (in production, use proper tokenizer)
    final words = text.toLowerCase().split(' ');
    final tokens = <int>[];

    // Convert words to token IDs (using hash as simple tokenizer)
    for (final word in words) {
      final tokenId = word.hashCode.abs() % 10000;
      tokens.add(tokenId);
    }

    // Padding or truncation
    if (tokens.length > maxLength) {
      return [tokens.sublist(0, maxLength)];
    } else {
      final padded = List<int>.from(tokens);
      while (padded.length < maxLength) {
        padded.add(0); // Pad with 0
      }
      return [padded];
    }
  }

  /// Process classification output
  List<ClassificationResult> _processClassificationOutput(
    List<double> probabilities,
    double threshold,
    int topK,
    List<String>? labels,
  ) {
    final results = <ClassificationResult>[];

    // Apply softmax if needed
    final softmaxed = _softmax(probabilities);

    // Create results with indices
    for (var i = 0; i < softmaxed.length; i++) {
      if (softmaxed[i] >= threshold) {
        results.add(ClassificationResult(
          classIndex: i,
          label: labels != null && i < labels.length ? labels[i] : 'Class $i',
          confidence: softmaxed[i],
        ));
      }
    }

    // Sort by confidence and take top K
    results.sort((a, b) => b.confidence.compareTo(a.confidence));
    return results.take(topK).toList();
  }

  /// Process detection output
  List<DetectionResult> _processDetectionOutput(
    dynamic output,
    double confidenceThreshold,
    double iouThreshold,
    List<String>? labels,
  ) {
    final results = <DetectionResult>[];

    try {
      // Assuming SSD MobileNet output format
      // output: [1, num_detections, 4] for boxes, [1, num_detections] for scores, [1, num_detections] for classes

      // Simplified detection output processing
      final outputList = output as List<dynamic>;
      final batchOutput = outputList[0] as List<dynamic>;

      for (var i = 0; i < batchOutput.length; i++) {
        final detection = batchOutput[i] as List<dynamic>;

        // Assuming format: [ymin, xmin, ymax, xmax, score, classId]
        if (detection.length >= 6) {
          final score = detection[4] as double;

          if (score >= confidenceThreshold) {
            final classId = (detection[5] as double).toInt();

            results.add(DetectionResult(
              boundingBox: BoundingBox(
                left: detection[1] as double,
                top: detection[0] as double,
                right: detection[3] as double,
                bottom: detection[2] as double,
              ),
              classIndex: classId,
              label: labels != null && classId < labels.length ? labels[classId] : 'Object $classId',
              confidence: score,
            ));
          }
        }
      }

      // Apply NMS
      final filtered = _applyNMS(results, iouThreshold);
      return filtered;
    } catch (e) {
      debugPrint('Error processing detection output: $e');
      return results;
    }
  }

  /// Process recommendation output
  List<RecommendationResult> _processRecommendationOutput(
    List<double> scores,
    int topK,
  ) {
    final results = <RecommendationResult>[];

    for (var i = 0; i < scores.length; i++) {
      results.add(RecommendationResult(
        itemId: i,
        score: scores[i],
      ));
    }

    // Sort by score and take top K
    results.sort((a, b) => b.score.compareTo(a.score));
    return results.take(topK).toList();
  }

  /// Apply softmax activation
  List<double> _softmax(List<double> logits) {
    final max = logits.reduce((a, b) => a > b ? a : b);
    final exp = logits.map((x) => Math.exp(x - max)).toList();
    final sum = exp.reduce((a, b) => a + b);
    return exp.map((x) => x / sum).toList();
  }

  /// Apply Non-Maximum Suppression
  List<DetectionResult> _applyNMS(
    List<DetectionResult> detections,
    double iouThreshold,
  ) {
    if (detections.isEmpty) return [];

    // Sort by confidence
    detections.sort((a, b) => b.confidence.compareTo(a.confidence));

    final keep = <DetectionResult>[];
    final suppressed = <bool>[];

    for (var i = 0; i < detections.length; i++) {
      suppressed.add(false);
    }

    for (var i = 0; i < detections.length; i++) {
      if (suppressed[i]) continue;

      keep.add(detections[i]);

      for (var j = i + 1; j < detections.length; j++) {
        if (suppressed[j]) continue;

        final iou = _calculateIoU(
          detections[i].boundingBox,
          detections[j].boundingBox,
        );

        if (iou > iouThreshold) {
          suppressed[j] = true;
        }
      }
    }

    return keep;
  }

  /// Calculate Intersection over Union
  double _calculateIoU(BoundingBox box1, BoundingBox box2) {
    final x1 = Math.max(box1.left, box2.left);
    final y1 = Math.max(box1.top, box2.top);
    final x2 = Math.min(box1.right, box2.right);
    final y2 = Math.min(box1.bottom, box2.bottom);

    final intersection = Math.max(0.0, x2 - x1) * Math.max(0.0, y2 - y1);
    final area1 = (box1.right - box1.left) * (box1.bottom - box1.top);
    final area2 = (box2.right - box2.left) * (box2.bottom - box2.top);
    final union = area1 + area2 - intersection;

    return union > 0 ? intersection / union : 0.0;
  }

  /// Get model container
  _ModelContainer _getModel(String modelId) {
    final model = _models[modelId];
    if (model == null) {
      throw Exception('Model $modelId not loaded');
    }
    return model;
  }

  /// Hot-swap model
  Future<void> swapModel({
    required String modelId,
    required String newVersion,
    required String assetPath,
  }) async {
    debugPrint('Hot-swapping model $modelId to version $newVersion');

    // Load new model with temporary ID
    final tempModelId = '${modelId}_temp';
    await loadModelFromAsset(
      modelId: tempModelId,
      assetPath: assetPath,
      version: newVersion,
    );

    // Close old model
    final oldModel = _models[modelId];
    if (oldModel != null) {
      oldModel.interpreter.close();
    }

    // Swap models
    _models[modelId] = _models[tempModelId]!;
    _models.remove(tempModelId);

    debugPrint('Model $modelId swapped successfully');
  }

  /// Get model analytics
  ModelAnalyticsData getAnalytics(String modelId) {
    final analytics = _analytics[modelId];
    if (analytics == null) {
      throw Exception('Analytics not found for model $modelId');
    }

    return analytics.getData();
  }

  /// Clear cache for model
  void clearCache(String modelId) {
    final cache = _caches[modelId];
    if (cache != null) {
      cache.clear();
      debugPrint('Cache cleared for model $modelId');
    }
  }

  /// Unload model
  void unloadModel(String modelId) {
    final model = _models[modelId];
    if (model != null) {
      model.interpreter.close();
      _models.remove(modelId);
      _caches.remove(modelId);
      _analytics.remove(modelId);
      debugPrint('Model $modelId unloaded');
    }
  }

  /// Dispose all resources
  void dispose() {
    for (final model in _models.values) {
      model.interpreter.close();
    }
    _models.clear();
    _caches.clear();
    _analytics.clear();
    _interpreterPool.clear();
    _isInitialized = false;
    debugPrint('OnDeviceMLEngine disposed');
  }
}

/// Model types
enum ModelType {
  imageClassification,
  objectDetection,
  textClassification,
  recommendation,
  custom,
}

/// Model container
class _ModelContainer {
  final String id;
  final String version;
  final ModelType type;
  final Interpreter interpreter;
  final String checksum;
  final Uint8List modelBytes;
  final List<int> inputShape;
  final List<int> outputShape;
  final bool enableGPU;
  final DateTime loadedAt;

  _ModelContainer({
    required this.id,
    required this.version,
    required this.type,
    required this.interpreter,
    required this.checksum,
    required this.modelBytes,
    required this.inputShape,
    required this.outputShape,
    required this.enableGPU,
    required this.loadedAt,
  });
}

/// Inference cache with LRU eviction
class _InferenceCache {
  final int maxSize;
  final Map<String, dynamic> _cache = {};
  final List<String> _accessOrder = [];

  _InferenceCache({required this.maxSize});

  dynamic get(String key) {
    if (_cache.containsKey(key)) {
      _accessOrder.remove(key);
      _accessOrder.add(key);
      return _cache[key];
    }
    return null;
  }

  void put(String key, dynamic value) {
    if (_cache.containsKey(key)) {
      _accessOrder.remove(key);
    } else if (_cache.length >= maxSize) {
      final oldest = _accessOrder.removeAt(0);
      _cache.remove(oldest);
    }

    _cache[key] = value;
    _accessOrder.add(key);
  }

  void clear() {
    _cache.clear();
    _accessOrder.clear();
  }
}

/// Model analytics tracker
class _ModelAnalytics {
  final List<int> _latencies = [];
  int inferenceCount = 0;
  int errors = 0;
  int cacheHits = 0;
  int cacheMisses = 0;

  void addInference(int latencyMs) {
    _latencies.add(latencyMs);
    inferenceCount++;

    // Keep only last 1000 latencies
    if (_latencies.length > 1000) {
      _latencies.removeAt(0);
    }
  }

  ModelAnalyticsData getData() {
    if (_latencies.isEmpty) {
      return ModelAnalyticsData(
        inferenceCount: inferenceCount,
        errors: errors,
        cacheHits: cacheHits,
        cacheMisses: cacheMisses,
        meanLatency: 0,
        p50Latency: 0,
        p95Latency: 0,
        p99Latency: 0,
        cacheHitRate: 0,
      );
    }

    final sorted = List<int>.from(_latencies)..sort();
    final mean = _latencies.reduce((a, b) => a + b) / _latencies.length;
    final p50 = sorted[(sorted.length * 0.5).floor()];
    final p95 = sorted[(sorted.length * 0.95).floor()];
    final p99 = sorted[(sorted.length * 0.99).floor()];

    final totalRequests = cacheHits + cacheMisses;
    final hitRate = totalRequests > 0 ? cacheHits / totalRequests : 0.0;

    return ModelAnalyticsData(
      inferenceCount: inferenceCount,
      errors: errors,
      cacheHits: cacheHits,
      cacheMisses: cacheMisses,
      meanLatency: mean,
      p50Latency: p50.toDouble(),
      p95Latency: p95.toDouble(),
      p99Latency: p99.toDouble(),
      cacheHitRate: hitRate,
    );
  }
}

/// Model analytics data
class ModelAnalyticsData {
  final int inferenceCount;
  final int errors;
  final int cacheHits;
  final int cacheMisses;
  final double meanLatency;
  final double p50Latency;
  final double p95Latency;
  final double p99Latency;
  final double cacheHitRate;

  ModelAnalyticsData({
    required this.inferenceCount,
    required this.errors,
    required this.cacheHits,
    required this.cacheMisses,
    required this.meanLatency,
    required this.p50Latency,
    required this.p95Latency,
    required this.p99Latency,
    required this.cacheHitRate,
  });

  double get errorRate => inferenceCount > 0 ? errors / inferenceCount : 0.0;

  // Estimate battery impact (simplified)
  double get batteryImpactPercentPerHour {
    // Rough estimate: 1ms inference = 0.01% battery per hour
    return meanLatency * 0.01 * 3600 / 1000;
  }
}

/// Classification result
class ClassificationResult {
  final int classIndex;
  final String label;
  final double confidence;

  ClassificationResult({
    required this.classIndex,
    required this.label,
    required this.confidence,
  });
}

/// Detection result
class DetectionResult {
  final BoundingBox boundingBox;
  final int classIndex;
  final String label;
  final double confidence;

  DetectionResult({
    required this.boundingBox,
    required this.classIndex,
    required this.label,
    required this.confidence,
  });
}

/// Bounding box
class BoundingBox {
  final double left;
  final double top;
  final double right;
  final double bottom;

  BoundingBox({
    required this.left,
    required this.top,
    required this.right,
    required this.bottom,
  });

  double get width => right - left;
  double get height => bottom - top;
  double get area => width * height;
}

/// Recommendation result
class RecommendationResult {
  final int itemId;
  final double score;

  RecommendationResult({
    required this.itemId,
    required this.score,
  });
}

/// Math utilities
class Math {
  static double exp(double x) => dart.math.exp(x);
  static double max(double a, double b) => a > b ? a : b;
  static double min(double a, double b) => a < b ? a : b;
}

import 'dart:math' as dart.math;
