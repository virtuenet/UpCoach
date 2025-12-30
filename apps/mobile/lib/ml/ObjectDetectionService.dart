import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:image/image.dart' as img;

// ============================================================================
// DATA MODELS
// ============================================================================

class DetectedObject {
  final String label;
  final double confidence;
  final Rect boundingBox;
  final String category;
  final Map<String, dynamic>? metadata;

  DetectedObject({
    required this.label,
    required this.confidence,
    required this.boundingBox,
    required this.category,
    this.metadata,
  });

  @override
  String toString() {
    return 'DetectedObject(label: $label, confidence: ${(confidence * 100).toStringAsFixed(1)}%, category: $category)';
  }
}

class DetectionResult {
  final List<DetectedObject> objects;
  final Duration processingTime;
  final Size imageSize;
  final DateTime timestamp;

  DetectionResult({
    required this.objects,
    required this.processingTime,
    required this.imageSize,
    required this.timestamp,
  });
}

// ============================================================================
// OBJECT DETECTION SERVICE
// ============================================================================

class ObjectDetectionService {
  static final ObjectDetectionService _instance = ObjectDetectionService._internal();

  factory ObjectDetectionService() => _instance;

  ObjectDetectionService._internal();

  bool _isInitialized = false;
  final List<String> _equipmentLabels = [
    'dumbbell',
    'kettlebell',
    'barbell',
    'weight_plate',
    'resistance_band',
    'yoga_mat',
    'exercise_ball',
    'foam_roller',
    'jump_rope',
    'pull_up_bar',
    'bench',
    'treadmill',
    'stationary_bike',
  ];

  final List<String> _foodLabels = [
    'apple',
    'banana',
    'orange',
    'salad',
    'chicken',
    'fish',
    'rice',
    'pasta',
    'bread',
    'egg',
    'milk',
    'yogurt',
    'vegetables',
    'fruit',
    'meat',
    'cheese',
    'nuts',
  ];

  // Performance tracking
  int _totalDetections = 0;
  double _averageProcessingTime = 0;

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      // In production, load TFLite model
      // await _loadModel();
      await Future.delayed(const Duration(milliseconds: 300));
      _isInitialized = true;
      print('ObjectDetectionService initialized');
    } catch (e) {
      throw Exception('Failed to initialize object detection: $e');
    }
  }

  void dispose() {
    _isInitialized = false;
  }

  // ============================================================================
  // REAL-TIME DETECTION (from camera feed)
  // ============================================================================

  Future<DetectionResult> detectFromCameraImage(CameraImage image) async {
    if (!_isInitialized) await initialize();

    final startTime = DateTime.now();

    // Convert CameraImage to processable format
    final processedImage = await _processCameraImage(image);

    // Run detection
    final objects = await _runDetection(
      processedImage,
      Size(image.width.toDouble(), image.height.toDouble()),
    );

    final endTime = DateTime.now();
    final processingTime = endTime.difference(startTime);

    _updateMetrics(processingTime);

    return DetectionResult(
      objects: objects,
      processingTime: processingTime,
      imageSize: Size(image.width.toDouble(), image.height.toDouble()),
      timestamp: DateTime.now(),
    );
  }

  Future<Uint8List> _processCameraImage(CameraImage image) async {
    // In production, convert CameraImage to appropriate format for model
    // For now, return mock data
    return Uint8List(0);
  }

  // ============================================================================
  // DETECTION FROM FILE
  // ============================================================================

  Future<DetectionResult> detectFromFile(File imageFile) async {
    if (!_isInitialized) await initialize();

    final startTime = DateTime.now();

    // Load and process image
    final bytes = await imageFile.readAsBytes();
    final image = img.decodeImage(bytes);

    if (image == null) {
      throw Exception('Failed to decode image');
    }

    final imageSize = Size(image.width.toDouble(), image.height.toDouble());

    // Run detection
    final objects = await _runDetection(bytes, imageSize);

    final endTime = DateTime.now();
    final processingTime = endTime.difference(startTime);

    _updateMetrics(processingTime);

    return DetectionResult(
      objects: objects,
      processingTime: processingTime,
      imageSize: imageSize,
      timestamp: DateTime.now(),
    );
  }

  // ============================================================================
  // CORE DETECTION LOGIC
  // ============================================================================

  Future<List<DetectedObject>> _runDetection(
    Uint8List imageData,
    Size imageSize,
  ) async {
    // Simulate inference time
    await Future.delayed(const Duration(milliseconds: 200));

    // In production, this would:
    // 1. Preprocess image to model input size
    // 2. Run inference on TFLite model
    // 3. Post-process outputs (NMS, score filtering, etc.)

    // Mock detection results
    final objects = _generateMockDetections(imageSize);

    return objects;
  }

  List<DetectedObject> _generateMockDetections(Size imageSize) {
    final detections = <DetectedObject>[];
    final random = DateTime.now().millisecond;

    // Simulate detecting 1-3 objects
    final objectCount = 1 + (random % 3);

    for (int i = 0; i < objectCount; i++) {
      // Randomly select category
      final isEquipment = (random + i) % 2 == 0;
      final labels = isEquipment ? _equipmentLabels : _foodLabels;
      final category = isEquipment ? 'equipment' : 'food';
      final label = labels[(random + i) % labels.length];

      // Generate random bounding box
      final x = (random * (i + 1)) % (imageSize.width - 100);
      final y = (random * (i + 2)) % (imageSize.height - 100);
      final width = 80.0 + (random % 100);
      final height = 80.0 + (random % 100);

      final boundingBox = Rect.fromLTWH(
        x.toDouble(),
        y.toDouble(),
        width,
        height,
      );

      // Generate confidence score
      final confidence = 0.65 + ((random % 30) / 100);

      detections.add(DetectedObject(
        label: label,
        confidence: confidence,
        boundingBox: boundingBox,
        category: category,
        metadata: {
          'detectionIndex': i,
          'area': width * height,
        },
      ));
    }

    // Filter by confidence threshold
    return detections.where((obj) => obj.confidence >= 0.5).toList();
  }

  // ============================================================================
  // SPECIALIZED DETECTIONS
  // ============================================================================

  Future<List<DetectedObject>> detectEquipment(File imageFile) async {
    final result = await detectFromFile(imageFile);
    return result.objects.where((obj) => obj.category == 'equipment').toList();
  }

  Future<List<DetectedObject>> detectFood(File imageFile) async {
    final result = await detectFromFile(imageFile);
    return result.objects.where((obj) => obj.category == 'food').toList();
  }

  // ============================================================================
  // BOUNDING BOX DRAWING
  // ============================================================================

  void drawBoundingBoxes({
    required Canvas canvas,
    required List<DetectedObject> objects,
    required Size imageSize,
    Paint? boxPaint,
    TextStyle? labelStyle,
  }) {
    final defaultBoxPaint = boxPaint ??
        (Paint()
          ..color = Colors.green
          ..style = PaintingStyle.stroke
          ..strokeWidth = 3);

    final defaultLabelStyle = labelStyle ??
        const TextStyle(
          color: Colors.white,
          fontSize: 14,
          fontWeight: FontWeight.bold,
        );

    for (final obj in objects) {
      // Draw bounding box
      canvas.drawRect(obj.boundingBox, defaultBoxPaint);

      // Draw label background
      final labelText = '${obj.label} ${(obj.confidence * 100).toInt()}%';
      final textPainter = TextPainter(
        text: TextSpan(text: labelText, style: defaultLabelStyle),
        textDirection: TextDirection.ltr,
      );
      textPainter.layout();

      final labelBackground = RRect.fromRectAndRadius(
        Rect.fromLTWH(
          obj.boundingBox.left,
          obj.boundingBox.top - textPainter.height - 8,
          textPainter.width + 16,
          textPainter.height + 8,
        ),
        const Radius.circular(4),
      );

      canvas.drawRRect(
        labelBackground,
        Paint()..color = Colors.green.withOpacity(0.8),
      );

      // Draw label text
      textPainter.paint(
        canvas,
        Offset(obj.boundingBox.left + 8, obj.boundingBox.top - textPainter.height - 4),
      );
    }
  }

  // ============================================================================
  // FILTERING & POST-PROCESSING
  // ============================================================================

  List<DetectedObject> filterByConfidence(
    List<DetectedObject> objects,
    double minConfidence,
  ) {
    return objects.where((obj) => obj.confidence >= minConfidence).toList();
  }

  List<DetectedObject> filterByCategory(
    List<DetectedObject> objects,
    String category,
  ) {
    return objects.where((obj) => obj.category == category).toList();
  }

  List<DetectedObject> filterByLabel(
    List<DetectedObject> objects,
    String label,
  ) {
    return objects.where((obj) => obj.label.toLowerCase() == label.toLowerCase()).toList();
  }

  List<DetectedObject> nonMaximumSuppression(
    List<DetectedObject> objects,
    double iouThreshold,
  ) {
    if (objects.isEmpty) return [];

    // Sort by confidence (descending)
    final sorted = List<DetectedObject>.from(objects)
      ..sort((a, b) => b.confidence.compareTo(a.confidence));

    final selected = <DetectedObject>[];

    for (final current in sorted) {
      bool shouldKeep = true;

      for (final selected in selected) {
        final iou = _calculateIoU(current.boundingBox, selected.boundingBox);
        if (iou > iouThreshold) {
          shouldKeep = false;
          break;
        }
      }

      if (shouldKeep) {
        selected.add(current);
      }
    }

    return selected;
  }

  double _calculateIoU(Rect box1, Rect box2) {
    final intersection = box1.intersect(box2);
    if (intersection.isEmpty) return 0.0;

    final intersectionArea = intersection.width * intersection.height;
    final box1Area = box1.width * box1.height;
    final box2Area = box2.width * box2.height;
    final unionArea = box1Area + box2Area - intersectionArea;

    return intersectionArea / unionArea;
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  void _updateMetrics(Duration processingTime) {
    _totalDetections++;
    final timeMs = processingTime.inMilliseconds.toDouble();

    // Running average
    _averageProcessingTime =
        (_averageProcessingTime * (_totalDetections - 1) + timeMs) / _totalDetections;
  }

  Map<String, dynamic> getAnalytics() {
    return {
      'totalDetections': _totalDetections,
      'averageProcessingTimeMs': _averageProcessingTime.toStringAsFixed(2),
      'isInitialized': _isInitialized,
      'supportedCategories': ['equipment', 'food'],
      'equipmentLabels': _equipmentLabels,
      'foodLabels': _foodLabels,
    };
  }

  // ============================================================================
  // TRACKING & COUNTING
  // ============================================================================

  Future<Map<String, int>> countObjects(File imageFile) async {
    final result = await detectFromFile(imageFile);
    final counts = <String, int>{};

    for (final obj in result.objects) {
      counts[obj.label] = (counts[obj.label] ?? 0) + 1;
    }

    return counts;
  }

  Future<List<String>> identifyMissingEquipment({
    required File imageFile,
    required List<String> requiredEquipment,
  }) async {
    final detectedObjects = await detectEquipment(imageFile);
    final detectedLabels = detectedObjects.map((obj) => obj.label).toSet();

    return requiredEquipment.where((eq) => !detectedLabels.contains(eq)).toList();
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  bool isEquipmentLabel(String label) {
    return _equipmentLabels.contains(label.toLowerCase());
  }

  bool isFoodLabel(String label) {
    return _foodLabels.contains(label.toLowerCase());
  }

  List<String> getSupportedEquipment() {
    return List.from(_equipmentLabels);
  }

  List<String> getSupportedFood() {
    return List.from(_foodLabels);
  }
}

// ============================================================================
// BOUNDING BOX PAINTER (for Flutter UI)
// ============================================================================

class BoundingBoxPainter extends CustomPainter {
  final List<DetectedObject> objects;
  final Size imageSize;
  final Color boxColor;
  final double strokeWidth;

  BoundingBoxPainter({
    required this.objects,
    required this.imageSize,
    this.boxColor = Colors.green,
    this.strokeWidth = 3.0,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final scaleX = size.width / imageSize.width;
    final scaleY = size.height / imageSize.height;

    final boxPaint = Paint()
      ..color = boxColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;

    final textStyle = TextStyle(
      color: Colors.white,
      fontSize: 14,
      fontWeight: FontWeight.bold,
      backgroundColor: boxColor.withOpacity(0.8),
    );

    for (final obj in objects) {
      // Scale bounding box to canvas size
      final scaledBox = Rect.fromLTRB(
        obj.boundingBox.left * scaleX,
        obj.boundingBox.top * scaleY,
        obj.boundingBox.right * scaleX,
        obj.boundingBox.bottom * scaleY,
      );

      // Draw box
      canvas.drawRect(scaledBox, boxPaint);

      // Draw label
      final label = '${obj.label} ${(obj.confidence * 100).toInt()}%';
      final textPainter = TextPainter(
        text: TextSpan(text: label, style: textStyle),
        textDirection: TextDirection.ltr,
      );
      textPainter.layout();

      // Draw label background
      final labelBg = RRect.fromRectAndRadius(
        Rect.fromLTWH(
          scaledBox.left,
          scaledBox.top - textPainter.height - 8,
          textPainter.width + 16,
          textPainter.height + 8,
        ),
        const Radius.circular(4),
      );
      canvas.drawRRect(labelBg, Paint()..color = boxColor.withOpacity(0.8));

      // Draw text
      textPainter.paint(
        canvas,
        Offset(scaledBox.left + 8, scaledBox.top - textPainter.height - 4),
      );
    }
  }

  @override
  bool shouldRepaint(covariant BoundingBoxPainter oldDelegate) {
    return oldDelegate.objects != objects;
  }
}
