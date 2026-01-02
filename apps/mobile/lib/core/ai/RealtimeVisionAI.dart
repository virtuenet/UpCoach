import 'dart:async';
import 'dart:io';
import 'dart:isolate';
import 'dart:math' as math;
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:camera/camera.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_mlkit_barcode_scanning/google_mlkit_barcode_scanning.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import 'package:google_mlkit_image_labeling/google_mlkit_image_labeling.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:image/image.dart' as img;

/// Real-time computer vision and AR capabilities
class RealtimeVisionAI {
  CameraController? _cameraController;
  bool _isProcessing = false;
  bool _isInitialized = false;
  int _frameCount = 0;
  int _frameSkipInterval = 3;

  // ML Kit detectors
  final FaceDetector _faceDetector;
  final TextRecognizer _textRecognizer;
  final ImageLabeler _imageLabeler;
  final BarcodeScanner _barcodeScanner;

  // Processing isolate
  Isolate? _processingIsolate;
  ReceivePort? _receivePort;
  SendPort? _sendPort;

  // Performance metrics
  final List<double> _fpsHistory = [];
  DateTime? _lastFrameTime;

  // Results smoothing
  final List<VisionResult> _resultHistory = [];
  static const int _maxResultHistory = 3;

  // Callbacks
  VoidCallback? onInitialized;
  Function(VisionResult)? onVisionResult;
  Function(String)? onError;

  // Device performance level
  DevicePerformance _devicePerformance = DevicePerformance.medium;

  RealtimeVisionAI({
    FaceDetectorOptions? faceDetectorOptions,
    ImageLabelerOptions? imageLabelerOptions,
    BarcodeFormat? barcodeFormat,
  })  : _faceDetector = FaceDetector(
          options: faceDetectorOptions ??
              FaceDetectorOptions(
                enableLandmarks: true,
                enableClassification: true,
                enableTracking: true,
                enableContours: true,
                performanceMode: FaceDetectorMode.fast,
              ),
        ),
        _textRecognizer = TextRecognizer(script: TextRecognitionScript.latin),
        _imageLabeler = ImageLabeler(
          options: imageLabelerOptions ??
              ImageLabelerOptions(confidenceThreshold: 0.5),
        ),
        _barcodeScanner = BarcodeScanner(
          formats: [barcodeFormat ?? BarcodeFormat.all],
        );

  /// Initialize camera and vision pipeline
  Future<void> initialize() async {
    try {
      debugPrint('[RealtimeVisionAI] Initializing vision pipeline...');

      // Get available cameras
      final cameras = await availableCameras();
      if (cameras.isEmpty) {
        throw Exception('No cameras available on device');
      }

      // Detect device performance
      await _detectDevicePerformance();

      // Select back camera
      final camera = cameras.firstWhere(
        (camera) => camera.lensDirection == CameraLensDirection.back,
        orElse: () => cameras.first,
      );

      // Initialize camera with adaptive resolution
      final resolution = _getResolutionForPerformance();
      _cameraController = CameraController(
        camera,
        resolution,
        enableAudio: false,
        imageFormatGroup: ImageFormatGroup.yuv420,
      );

      await _cameraController!.initialize();

      // Initialize processing isolate
      await _initializeProcessingIsolate();

      _isInitialized = true;
      debugPrint('[RealtimeVisionAI] Vision pipeline initialized successfully');
      onInitialized?.call();
    } catch (e, stackTrace) {
      debugPrint('[RealtimeVisionAI] Initialization failed: $e');
      debugPrint('[RealtimeVisionAI] Stack trace: $stackTrace');
      onError?.call('Failed to initialize vision AI: $e');
      rethrow;
    }
  }

  /// Start vision processing
  Future<void> startProcessing() async {
    if (!_isInitialized || _cameraController == null) {
      throw Exception('Vision AI not initialized');
    }

    try {
      debugPrint('[RealtimeVisionAI] Starting vision processing...');

      await _cameraController!.startImageStream((CameraImage image) {
        _processFrame(image);
      });

      debugPrint('[RealtimeVisionAI] Vision processing started');
    } catch (e, stackTrace) {
      debugPrint('[RealtimeVisionAI] Failed to start processing: $e');
      debugPrint('[RealtimeVisionAI] Stack trace: $stackTrace');
      onError?.call('Failed to start vision processing: $e');
      rethrow;
    }
  }

  /// Stop vision processing
  Future<void> stopProcessing() async {
    try {
      debugPrint('[RealtimeVisionAI] Stopping vision processing...');

      if (_cameraController?.value.isStreamingImages ?? false) {
        await _cameraController!.stopImageStream();
      }

      _isProcessing = false;
      debugPrint('[RealtimeVisionAI] Vision processing stopped');
    } catch (e) {
      debugPrint('[RealtimeVisionAI] Error stopping processing: $e');
    }
  }

  /// Process camera frame
  void _processFrame(CameraImage cameraImage) {
    _frameCount++;

    // Frame skipping for performance
    if (_frameCount % _frameSkipInterval != 0) {
      return;
    }

    if (_isProcessing) {
      return;
    }

    _isProcessing = true;

    // Calculate FPS
    _updateFPS();

    // Process asynchronously
    _processFrameAsync(cameraImage).then((result) {
      if (result != null) {
        // Add to history for smoothing
        _resultHistory.add(result);
        if (_resultHistory.length > _maxResultHistory) {
          _resultHistory.removeAt(0);
        }

        // Smooth results
        final smoothedResult = _smoothResults();
        onVisionResult?.call(smoothedResult);
      }
      _isProcessing = false;
    }).catchError((e) {
      debugPrint('[RealtimeVisionAI] Frame processing error: $e');
      _isProcessing = false;
    });
  }

  /// Process frame asynchronously
  Future<VisionResult?> _processFrameAsync(CameraImage cameraImage) async {
    try {
      final startTime = DateTime.now();

      // Convert camera image to InputImage
      final inputImage = _convertCameraImage(cameraImage);
      if (inputImage == null) {
        return null;
      }

      // Run all detections in parallel
      final results = await Future.wait([
        _detectFaces(inputImage),
        _recognizeText(inputImage),
        _labelImage(inputImage),
        _scanBarcodes(inputImage),
      ]);

      final faces = results[0] as List<Face>;
      final recognizedText = results[1] as RecognizedText;
      final labels = results[2] as List<ImageLabel>;
      final barcodes = results[3] as List<Barcode>;

      // Detect objects (simplified implementation using image labels)
      final objects = _extractObjectsFromLabels(labels);

      // Classify scene
      final sceneClassification = _classifyScene(labels);

      // Detect motion (compare with previous frame)
      final motionLevel = _detectMotion();

      final processingTime = DateTime.now().difference(startTime);

      debugPrint('[RealtimeVisionAI] Frame processed in ${processingTime.inMilliseconds}ms');
      debugPrint('[RealtimeVisionAI] Detected: ${faces.length} faces, ${objects.length} objects, ${barcodes.length} barcodes');

      return VisionResult(
        faces: faces,
        objects: objects,
        text: recognizedText,
        labels: labels,
        barcodes: barcodes,
        sceneClassification: sceneClassification,
        motionLevel: motionLevel,
        processingTimeMs: processingTime.inMilliseconds,
        fps: _calculateAverageFPS(),
        timestamp: DateTime.now(),
      );
    } catch (e, stackTrace) {
      debugPrint('[RealtimeVisionAI] Frame processing error: $e');
      debugPrint('[RealtimeVisionAI] Stack trace: $stackTrace');
      return null;
    }
  }

  /// Detect faces in image
  Future<List<Face>> _detectFaces(InputImage inputImage) async {
    try {
      return await _faceDetector.processImage(inputImage);
    } catch (e) {
      debugPrint('[RealtimeVisionAI] Face detection error: $e');
      return [];
    }
  }

  /// Recognize text in image
  Future<RecognizedText> _recognizeText(InputImage inputImage) async {
    try {
      return await _textRecognizer.processImage(inputImage);
    } catch (e) {
      debugPrint('[RealtimeVisionAI] Text recognition error: $e');
      return RecognizedText(text: '', blocks: []);
    }
  }

  /// Label image
  Future<List<ImageLabel>> _labelImage(InputImage inputImage) async {
    try {
      return await _imageLabeler.processImage(inputImage);
    } catch (e) {
      debugPrint('[RealtimeVisionAI] Image labeling error: $e');
      return [];
    }
  }

  /// Scan barcodes
  Future<List<Barcode>> _scanBarcodes(InputImage inputImage) async {
    try {
      return await _barcodeScanner.processImage(inputImage);
    } catch (e) {
      debugPrint('[RealtimeVisionAI] Barcode scanning error: $e');
      return [];
    }
  }

  /// Extract objects from image labels
  List<DetectedObject> _extractObjectsFromLabels(List<ImageLabel> labels) {
    final objects = <DetectedObject>[];

    // COCO dataset common objects
    const cocoObjects = [
      'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train',
      'truck', 'boat', 'traffic light', 'fire hydrant', 'stop sign',
      'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse', 'sheep', 'cow',
      'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 'umbrella', 'handbag',
      'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball', 'kite',
      'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket',
      'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana',
      'apple', 'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza',
      'donut', 'cake', 'chair', 'couch', 'potted plant', 'bed', 'dining table',
      'toilet', 'tv', 'laptop', 'mouse', 'remote', 'keyboard', 'cell phone',
      'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'book', 'clock',
      'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
    ];

    for (final label in labels) {
      if (cocoObjects.contains(label.label.toLowerCase())) {
        objects.add(DetectedObject(
          label: label.label,
          confidence: label.confidence,
          boundingBox: Rect.fromLTWH(0, 0, 100, 100), // Simplified, would need object detection model for accurate bbox
        ));
      }
    }

    return objects;
  }

  /// Classify scene
  SceneClassification _classifyScene(List<ImageLabel> labels) {
    if (labels.isEmpty) {
      return SceneClassification.unknown;
    }

    final labelTexts = labels.map((l) => l.label.toLowerCase()).toList();

    // Indoor/outdoor classification
    const outdoorKeywords = ['sky', 'cloud', 'tree', 'grass', 'mountain', 'beach', 'ocean', 'sun'];
    const indoorKeywords = ['room', 'furniture', 'wall', 'ceiling', 'floor', 'door', 'window'];

    final outdoorScore = outdoorKeywords.where((kw) => labelTexts.any((l) => l.contains(kw))).length;
    final indoorScore = indoorKeywords.where((kw) => labelTexts.any((l) => l.contains(kw))).length;

    if (outdoorScore > indoorScore) {
      return SceneClassification.outdoor;
    } else if (indoorScore > outdoorScore) {
      // Classify room type
      if (labelTexts.any((l) => l.contains('kitchen') || l.contains('refrigerator') || l.contains('oven'))) {
        return SceneClassification.kitchen;
      } else if (labelTexts.any((l) => l.contains('bed') || l.contains('bedroom'))) {
        return SceneClassification.bedroom;
      } else if (labelTexts.any((l) => l.contains('bathroom') || l.contains('toilet') || l.contains('shower'))) {
        return SceneClassification.bathroom;
      } else if (labelTexts.any((l) => l.contains('office') || l.contains('desk') || l.contains('computer'))) {
        return SceneClassification.office;
      } else {
        return SceneClassification.indoorGeneric;
      }
    }

    return SceneClassification.unknown;
  }

  /// Detect motion between frames
  double _detectMotion() {
    // Simplified motion detection based on frame rate changes
    if (_fpsHistory.length < 2) {
      return 0.0;
    }

    final recentFPS = _fpsHistory.last;
    final previousFPS = _fpsHistory[_fpsHistory.length - 2];

    // If FPS drops, might indicate more motion/complexity
    final fpsDiff = (previousFPS - recentFPS).abs();
    return (fpsDiff / 30.0).clamp(0.0, 1.0);
  }

  /// Convert CameraImage to InputImage
  InputImage? _convertCameraImage(CameraImage cameraImage) {
    try {
      final camera = _cameraController!.description;
      final sensorOrientation = camera.sensorOrientation;

      InputImageRotation? rotation;
      if (Platform.isIOS) {
        rotation = InputImageRotationValue.fromRawValue(sensorOrientation);
      } else if (Platform.isAndroid) {
        var rotationCompensation = sensorOrientation;
        final orientations = {
          DeviceOrientation.portraitUp: 0,
          DeviceOrientation.landscapeLeft: 90,
          DeviceOrientation.portraitDown: 180,
          DeviceOrientation.landscapeRight: 270,
        };
        rotationCompensation = (rotationCompensation - (orientations[DeviceOrientation.portraitUp] ?? 0) + 360) % 360;
        rotation = InputImageRotationValue.fromRawValue(rotationCompensation);
      }

      if (rotation == null) return null;

      final format = InputImageFormatValue.fromRawValue(cameraImage.format.raw);
      if (format == null) return null;

      final plane = cameraImage.planes.first;

      return InputImage.fromBytes(
        bytes: plane.bytes,
        metadata: InputImageMetadata(
          size: Size(cameraImage.width.toDouble(), cameraImage.height.toDouble()),
          rotation: rotation,
          format: format,
          bytesPerRow: plane.bytesPerRow,
        ),
      );
    } catch (e) {
      debugPrint('[RealtimeVisionAI] Failed to convert camera image: $e');
      return null;
    }
  }

  /// Smooth results across frames
  VisionResult _smoothResults() {
    if (_resultHistory.isEmpty) {
      return VisionResult.empty();
    }

    if (_resultHistory.length == 1) {
      return _resultHistory.first;
    }

    // Average confidence scores
    final allObjects = <String, List<double>>{};
    final allLabels = <String, List<double>>{};

    for (final result in _resultHistory) {
      for (final obj in result.objects) {
        allObjects.putIfAbsent(obj.label, () => []).add(obj.confidence);
      }
      for (final label in result.labels) {
        allLabels.putIfAbsent(label.label, () => []).add(label.confidence);
      }
    }

    // Average objects
    final smoothedObjects = allObjects.entries.map((entry) {
      final avgConfidence = entry.value.reduce((a, b) => a + b) / entry.value.length;
      return DetectedObject(
        label: entry.key,
        confidence: avgConfidence,
        boundingBox: Rect.zero, // Simplified
      );
    }).toList();

    // Average labels
    final smoothedLabels = allLabels.entries.map((entry) {
      final avgConfidence = entry.value.reduce((a, b) => a + b) / entry.value.length;
      return ImageLabel(label: entry.key, confidence: avgConfidence);
    }).toList();

    // Use most recent result as base
    final latestResult = _resultHistory.last;

    return VisionResult(
      faces: latestResult.faces,
      objects: smoothedObjects,
      text: latestResult.text,
      labels: smoothedLabels,
      barcodes: latestResult.barcodes,
      sceneClassification: latestResult.sceneClassification,
      motionLevel: latestResult.motionLevel,
      processingTimeMs: latestResult.processingTimeMs,
      fps: latestResult.fps,
      timestamp: latestResult.timestamp,
    );
  }

  /// Initialize processing isolate
  Future<void> _initializeProcessingIsolate() async {
    try {
      _receivePort = ReceivePort();

      _receivePort!.listen((message) {
        if (message is SendPort) {
          _sendPort = message;
        } else if (message is Map) {
          // Handle processed result
          debugPrint('[RealtimeVisionAI] Received result from isolate');
        }
      });

      _processingIsolate = await Isolate.spawn(
        _processingIsolateEntry,
        _receivePort!.sendPort,
      );

      debugPrint('[RealtimeVisionAI] Processing isolate initialized');
    } catch (e) {
      debugPrint('[RealtimeVisionAI] Failed to initialize isolate: $e');
    }
  }

  /// Processing isolate entry point
  static void _processingIsolateEntry(SendPort sendPort) {
    final receivePort = ReceivePort();
    sendPort.send(receivePort.sendPort);

    receivePort.listen((message) {
      // Process frame data
      if (message is Map) {
        // Perform heavy processing here
        final result = {'processed': true};
        sendPort.send(result);
      }
    });
  }

  /// Update FPS calculation
  void _updateFPS() {
    final now = DateTime.now();
    if (_lastFrameTime != null) {
      final frameDuration = now.difference(_lastFrameTime!);
      final fps = 1000.0 / frameDuration.inMilliseconds;
      _fpsHistory.add(fps);
      if (_fpsHistory.length > 30) {
        _fpsHistory.removeAt(0);
      }
    }
    _lastFrameTime = now;
  }

  /// Calculate average FPS
  double _calculateAverageFPS() {
    if (_fpsHistory.isEmpty) return 0.0;
    return _fpsHistory.reduce((a, b) => a + b) / _fpsHistory.length;
  }

  /// Detect device performance
  Future<void> _detectDevicePerformance() async {
    try {
      // Simple performance test: measure frame processing time
      final startTime = DateTime.now();

      // Simulate some processing
      for (var i = 0; i < 1000000; i++) {
        math.sqrt(i.toDouble());
      }

      final duration = DateTime.now().difference(startTime);

      if (duration.inMilliseconds < 50) {
        _devicePerformance = DevicePerformance.high;
        _frameSkipInterval = 1; // Process every frame
      } else if (duration.inMilliseconds < 100) {
        _devicePerformance = DevicePerformance.medium;
        _frameSkipInterval = 2; // Process every 2nd frame
      } else {
        _devicePerformance = DevicePerformance.low;
        _frameSkipInterval = 3; // Process every 3rd frame
      }

      debugPrint('[RealtimeVisionAI] Device performance: $_devicePerformance');
      debugPrint('[RealtimeVisionAI] Frame skip interval: $_frameSkipInterval');
    } catch (e) {
      debugPrint('[RealtimeVisionAI] Performance detection failed: $e');
      _devicePerformance = DevicePerformance.medium;
    }
  }

  /// Get resolution for device performance
  ResolutionPreset _getResolutionForPerformance() {
    switch (_devicePerformance) {
      case DevicePerformance.high:
        return ResolutionPreset.high;
      case DevicePerformance.medium:
        return ResolutionPreset.medium;
      case DevicePerformance.low:
        return ResolutionPreset.low;
    }
  }

  /// Draw bounding boxes on canvas
  void drawBoundingBoxes(Canvas canvas, Size size, VisionResult result) {
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;

    // Draw face bounding boxes
    for (final face in result.faces) {
      paint.color = Colors.green;
      canvas.drawRect(face.boundingBox, paint);

      // Draw landmarks
      if (face.landmarks.isNotEmpty) {
        final landmarkPaint = Paint()
          ..color = Colors.red
          ..strokeWidth = 4.0;

        for (final landmark in face.landmarks.values) {
          if (landmark != null) {
            canvas.drawCircle(
              Offset(landmark.position.x.toDouble(), landmark.position.y.toDouble()),
              2,
              landmarkPaint,
            );
          }
        }
      }
    }

    // Draw object bounding boxes
    for (final object in result.objects) {
      paint.color = Colors.blue;
      canvas.drawRect(object.boundingBox, paint);

      // Draw label
      final textPainter = TextPainter(
        text: TextSpan(
          text: '${object.label} ${(object.confidence * 100).toStringAsFixed(0)}%',
          style: const TextStyle(color: Colors.blue, fontSize: 12),
        ),
        textDirection: TextDirection.ltr,
      );
      textPainter.layout();
      textPainter.paint(
        canvas,
        Offset(object.boundingBox.left, object.boundingBox.top - 15),
      );
    }

    // Draw text blocks
    for (final block in result.text.blocks) {
      paint.color = Colors.orange;
      canvas.drawRect(block.boundingBox, paint);
    }
  }

  /// Preprocess frame for ML model
  Future<Uint8List> preprocessFrame(
    CameraImage cameraImage, {
    int targetWidth = 224,
    int targetHeight = 224,
  }) async {
    try {
      // Convert YUV to RGB
      final rgbImage = _convertYUV420ToRGB(cameraImage);

      // Resize
      final resized = img.copyResize(
        rgbImage,
        width: targetWidth,
        height: targetHeight,
        interpolation: img.Interpolation.linear,
      );

      // Normalize to [0, 1]
      final normalized = Float32List(targetWidth * targetHeight * 3);
      var index = 0;

      for (var y = 0; y < targetHeight; y++) {
        for (var x = 0; x < targetWidth; x++) {
          final pixel = resized.getPixel(x, y);
          normalized[index++] = pixel.r / 255.0;
          normalized[index++] = pixel.g / 255.0;
          normalized[index++] = pixel.b / 255.0;
        }
      }

      return normalized.buffer.asUint8List();
    } catch (e) {
      debugPrint('[RealtimeVisionAI] Frame preprocessing failed: $e');
      rethrow;
    }
  }

  /// Convert YUV420 to RGB
  img.Image _convertYUV420ToRGB(CameraImage cameraImage) {
    final width = cameraImage.width;
    final height = cameraImage.height;

    final yPlane = cameraImage.planes[0];
    final uPlane = cameraImage.planes[1];
    final vPlane = cameraImage.planes[2];

    final image = img.Image(width: width, height: height);

    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        final yIndex = y * yPlane.bytesPerRow + x;
        final uvIndex = (y ~/ 2) * uPlane.bytesPerRow + (x ~/ 2);

        final yValue = yPlane.bytes[yIndex];
        final uValue = uPlane.bytes[uvIndex];
        final vValue = vPlane.bytes[uvIndex];

        final r = (yValue + 1.370705 * (vValue - 128)).clamp(0, 255).toInt();
        final g = (yValue - 0.337633 * (uValue - 128) - 0.698001 * (vValue - 128)).clamp(0, 255).toInt();
        final b = (yValue + 1.732446 * (uValue - 128)).clamp(0, 255).toInt();

        image.setPixelRgba(x, y, r, g, b, 255);
      }
    }

    return image;
  }

  /// Get camera controller
  CameraController? get cameraController => _cameraController;

  /// Get current FPS
  double get currentFPS => _calculateAverageFPS();

  /// Get device performance
  DevicePerformance get devicePerformance => _devicePerformance;

  /// Dispose resources
  Future<void> dispose() async {
    try {
      debugPrint('[RealtimeVisionAI] Disposing vision AI...');

      await stopProcessing();
      await _cameraController?.dispose();

      await _faceDetector.close();
      await _textRecognizer.close();
      await _imageLabeler.close();
      await _barcodeScanner.close();

      _processingIsolate?.kill(priority: Isolate.immediate);
      _receivePort?.close();

      _isInitialized = false;
      debugPrint('[RealtimeVisionAI] Vision AI disposed');
    } catch (e) {
      debugPrint('[RealtimeVisionAI] Disposal error: $e');
    }
  }
}

/// Vision processing result
class VisionResult {
  final List<Face> faces;
  final List<DetectedObject> objects;
  final RecognizedText text;
  final List<ImageLabel> labels;
  final List<Barcode> barcodes;
  final SceneClassification sceneClassification;
  final double motionLevel;
  final int processingTimeMs;
  final double fps;
  final DateTime timestamp;

  VisionResult({
    required this.faces,
    required this.objects,
    required this.text,
    required this.labels,
    required this.barcodes,
    required this.sceneClassification,
    required this.motionLevel,
    required this.processingTimeMs,
    required this.fps,
    required this.timestamp,
  });

  factory VisionResult.empty() {
    return VisionResult(
      faces: [],
      objects: [],
      text: RecognizedText(text: '', blocks: []),
      labels: [],
      barcodes: [],
      sceneClassification: SceneClassification.unknown,
      motionLevel: 0.0,
      processingTimeMs: 0,
      fps: 0.0,
      timestamp: DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'faces': faces.length,
      'objects': objects.map((o) => o.toJson()).toList(),
      'text': text.text,
      'labels': labels.map((l) => {'label': l.label, 'confidence': l.confidence}).toList(),
      'barcodes': barcodes.map((b) => b.displayValue).toList(),
      'sceneClassification': sceneClassification.toString(),
      'motionLevel': motionLevel,
      'processingTimeMs': processingTimeMs,
      'fps': fps,
      'timestamp': timestamp.toIso8601String(),
    };
  }
}

/// Detected object
class DetectedObject {
  final String label;
  final double confidence;
  final Rect boundingBox;

  DetectedObject({
    required this.label,
    required this.confidence,
    required this.boundingBox,
  });

  Map<String, dynamic> toJson() {
    return {
      'label': label,
      'confidence': confidence,
      'boundingBox': {
        'left': boundingBox.left,
        'top': boundingBox.top,
        'width': boundingBox.width,
        'height': boundingBox.height,
      },
    };
  }
}

/// Scene classification
enum SceneClassification {
  outdoor,
  indoorGeneric,
  kitchen,
  bedroom,
  bathroom,
  office,
  unknown,
}

/// Device performance level
enum DevicePerformance {
  high,
  medium,
  low,
}
