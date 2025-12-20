/// Mobile Model Loader Service
///
/// Optimized model loading and management for mobile devices:
/// - Model downloading with resume support
/// - Local caching and storage management
/// - Version management and updates
/// - Platform-specific optimizations
library;

import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';
import 'package:crypto/crypto.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/app_constants.dart';

// ============================================================================
// Types & Enums
// ============================================================================

enum ModelFormat { tflite, coreml, onnx, pytorchMobile }

enum DownloadStatus { pending, downloading, completed, failed, cached }

enum ModelPriority { critical, high, medium, low }

// ============================================================================
// Model Configuration
// ============================================================================

class MobileModelConfig {
  final String id;
  final String name;
  final String version;
  final ModelFormat format;
  final String downloadUrl;
  final String checksum;
  final int sizeBytes;
  final ModelPriority priority;
  final List<String> supportedPlatforms;
  final Map<String, dynamic> inputSpec;
  final Map<String, dynamic> outputSpec;
  final bool isRequired;

  const MobileModelConfig({
    required this.id,
    required this.name,
    required this.version,
    required this.format,
    required this.downloadUrl,
    required this.checksum,
    required this.sizeBytes,
    this.priority = ModelPriority.medium,
    this.supportedPlatforms = const ['ios', 'android'],
    this.inputSpec = const {},
    this.outputSpec = const {},
    this.isRequired = false,
  });

  factory MobileModelConfig.fromJson(Map<String, dynamic> json) {
    return MobileModelConfig(
      id: json['id'] as String,
      name: json['name'] as String,
      version: json['version'] as String,
      format: _parseFormat(json['format'] as String),
      downloadUrl: json['downloadUrl'] as String,
      checksum: json['checksum'] as String,
      sizeBytes: json['sizeBytes'] as int,
      priority: _parsePriority(json['priority'] as String?),
      supportedPlatforms: List<String>.from(json['supportedPlatforms'] ?? ['ios', 'android']),
      inputSpec: Map<String, dynamic>.from(json['inputSpec'] ?? {}),
      outputSpec: Map<String, dynamic>.from(json['outputSpec'] ?? {}),
      isRequired: json['isRequired'] as bool? ?? false,
    );
  }

  static ModelFormat _parseFormat(String format) {
    switch (format.toLowerCase()) {
      case 'tflite':
        return ModelFormat.tflite;
      case 'coreml':
        return ModelFormat.coreml;
      case 'onnx':
        return ModelFormat.onnx;
      case 'pytorch_mobile':
        return ModelFormat.pytorchMobile;
      default:
        return ModelFormat.tflite;
    }
  }

  static ModelPriority _parsePriority(String? priority) {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return ModelPriority.critical;
      case 'high':
        return ModelPriority.high;
      case 'low':
        return ModelPriority.low;
      default:
        return ModelPriority.medium;
    }
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'version': version,
    'format': format.toString().split('.').last,
    'downloadUrl': downloadUrl,
    'checksum': checksum,
    'sizeBytes': sizeBytes,
    'priority': priority.toString().split('.').last,
    'supportedPlatforms': supportedPlatforms,
    'inputSpec': inputSpec,
    'outputSpec': outputSpec,
    'isRequired': isRequired,
  };
}

// ============================================================================
// Downloaded Model
// ============================================================================

class DownloadedModel {
  final String id;
  final String name;
  final String version;
  final ModelFormat format;
  final String localPath;
  final int sizeBytes;
  final DateTime downloadedAt;
  final DateTime lastUsedAt;
  final int useCount;

  const DownloadedModel({
    required this.id,
    required this.name,
    required this.version,
    required this.format,
    required this.localPath,
    required this.sizeBytes,
    required this.downloadedAt,
    required this.lastUsedAt,
    this.useCount = 0,
  });

  factory DownloadedModel.fromJson(Map<String, dynamic> json) {
    return DownloadedModel(
      id: json['id'] as String,
      name: json['name'] as String,
      version: json['version'] as String,
      format: MobileModelConfig._parseFormat(json['format'] as String),
      localPath: json['localPath'] as String,
      sizeBytes: json['sizeBytes'] as int,
      downloadedAt: DateTime.parse(json['downloadedAt'] as String),
      lastUsedAt: DateTime.parse(json['lastUsedAt'] as String),
      useCount: json['useCount'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'version': version,
    'format': format.toString().split('.').last,
    'localPath': localPath,
    'sizeBytes': sizeBytes,
    'downloadedAt': downloadedAt.toIso8601String(),
    'lastUsedAt': lastUsedAt.toIso8601String(),
    'useCount': useCount,
  };

  DownloadedModel copyWith({
    DateTime? lastUsedAt,
    int? useCount,
  }) {
    return DownloadedModel(
      id: id,
      name: name,
      version: version,
      format: format,
      localPath: localPath,
      sizeBytes: sizeBytes,
      downloadedAt: downloadedAt,
      lastUsedAt: lastUsedAt ?? this.lastUsedAt,
      useCount: useCount ?? this.useCount,
    );
  }
}

// ============================================================================
// Download Progress
// ============================================================================

class DownloadProgress {
  final String modelId;
  final DownloadStatus status;
  final int bytesDownloaded;
  final int totalBytes;
  final double progress;
  final String? error;

  const DownloadProgress({
    required this.modelId,
    required this.status,
    this.bytesDownloaded = 0,
    this.totalBytes = 0,
    this.progress = 0.0,
    this.error,
  });

  DownloadProgress copyWith({
    DownloadStatus? status,
    int? bytesDownloaded,
    int? totalBytes,
    double? progress,
    String? error,
  }) {
    return DownloadProgress(
      modelId: modelId,
      status: status ?? this.status,
      bytesDownloaded: bytesDownloaded ?? this.bytesDownloaded,
      totalBytes: totalBytes ?? this.totalBytes,
      progress: progress ?? this.progress,
      error: error ?? this.error,
    );
  }
}

// ============================================================================
// Mobile Model Loader Service
// ============================================================================

class MobileModelLoader {
  static final MobileModelLoader _instance = MobileModelLoader._internal();
  factory MobileModelLoader() => _instance;
  MobileModelLoader._internal();

  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();
  final Map<String, DownloadedModel> _loadedModels = {};
  final Map<String, StreamController<DownloadProgress>> _downloadControllers = {};

  String? _modelsDirectory;
  bool _initialized = false;

  static const String _modelsMetadataKey = 'mobile_models_metadata';
  static const int _maxCacheSize = 500 * 1024 * 1024; // 500MB

  // ============================================================================
  // Initialization
  // ============================================================================

  Future<void> initialize() async {
    if (_initialized) return;

    final appDir = await getApplicationDocumentsDirectory();
    _modelsDirectory = '${appDir.path}/models';

    // Create models directory if it doesn't exist
    final modelsDir = Directory(_modelsDirectory!);
    if (!await modelsDir.exists()) {
      await modelsDir.create(recursive: true);
    }

    // Load cached models metadata
    await _loadModelsMetadata();

    _initialized = true;
    debugPrint('[MobileModelLoader] Initialized with directory: $_modelsDirectory');
  }

  Future<void> _loadModelsMetadata() async {
    try {
      final metadataJson = await _secureStorage.read(key: _modelsMetadataKey);
      if (metadataJson != null) {
        final metadata = jsonDecode(metadataJson) as Map<String, dynamic>;
        for (final entry in metadata.entries) {
          final model = DownloadedModel.fromJson(entry.value as Map<String, dynamic>);
          // Verify file still exists
          if (await File(model.localPath).exists()) {
            _loadedModels[entry.key] = model;
          }
        }
      }
    } catch (e) {
      debugPrint('[MobileModelLoader] Error loading metadata: $e');
    }
  }

  Future<void> _saveModelsMetadata() async {
    try {
      final metadata = <String, dynamic>{};
      for (final entry in _loadedModels.entries) {
        metadata[entry.key] = entry.value.toJson();
      }
      await _secureStorage.write(
        key: _modelsMetadataKey,
        value: jsonEncode(metadata),
      );
    } catch (e) {
      debugPrint('[MobileModelLoader] Error saving metadata: $e');
    }
  }

  // ============================================================================
  // Model Download
  // ============================================================================

  Stream<DownloadProgress> downloadModel(MobileModelConfig config) async* {
    await initialize();

    final controller = StreamController<DownloadProgress>.broadcast();
    _downloadControllers[config.id] = controller;

    try {
      // Check if already downloaded
      final existingModel = _loadedModels[config.id];
      if (existingModel != null && existingModel.version == config.version) {
        final file = File(existingModel.localPath);
        if (await file.exists()) {
          yield DownloadProgress(
            modelId: config.id,
            status: DownloadStatus.cached,
            bytesDownloaded: config.sizeBytes,
            totalBytes: config.sizeBytes,
            progress: 1.0,
          );
          return;
        }
      }

      yield DownloadProgress(
        modelId: config.id,
        status: DownloadStatus.pending,
        totalBytes: config.sizeBytes,
      );

      // Check storage space
      await _ensureStorageSpace(config.sizeBytes);

      yield DownloadProgress(
        modelId: config.id,
        status: DownloadStatus.downloading,
        totalBytes: config.sizeBytes,
      );

      // Download the model
      final localPath = await _downloadFile(
        config.downloadUrl,
        config.id,
        config.version,
        config.sizeBytes,
        (bytesReceived, totalBytes) {
          controller.add(DownloadProgress(
            modelId: config.id,
            status: DownloadStatus.downloading,
            bytesDownloaded: bytesReceived,
            totalBytes: totalBytes,
            progress: totalBytes > 0 ? bytesReceived / totalBytes : 0,
          ));
        },
      );

      // Verify checksum
      final isValid = await _verifyChecksum(localPath, config.checksum);
      if (!isValid) {
        await File(localPath).delete();
        throw Exception('Checksum verification failed');
      }

      // Save model metadata
      final downloadedModel = DownloadedModel(
        id: config.id,
        name: config.name,
        version: config.version,
        format: config.format,
        localPath: localPath,
        sizeBytes: config.sizeBytes,
        downloadedAt: DateTime.now(),
        lastUsedAt: DateTime.now(),
      );

      _loadedModels[config.id] = downloadedModel;
      await _saveModelsMetadata();

      yield DownloadProgress(
        modelId: config.id,
        status: DownloadStatus.completed,
        bytesDownloaded: config.sizeBytes,
        totalBytes: config.sizeBytes,
        progress: 1.0,
      );
    } catch (e) {
      yield DownloadProgress(
        modelId: config.id,
        status: DownloadStatus.failed,
        error: e.toString(),
      );
    } finally {
      _downloadControllers.remove(config.id);
      await controller.close();
    }
  }

  Future<String> _downloadFile(
    String url,
    String modelId,
    String version,
    int expectedSize,
    void Function(int received, int total) onProgress,
  ) async {
    final filename = '${modelId}_$version.model';
    final localPath = '$_modelsDirectory/$filename';
    final file = File(localPath);

    // Support resume if partial file exists
    int startByte = 0;
    if (await file.exists()) {
      startByte = await file.length();
    }

    final request = http.Request('GET', Uri.parse(url));
    if (startByte > 0) {
      request.headers['Range'] = 'bytes=$startByte-';
    }

    final response = await http.Client().send(request);
    final totalBytes = expectedSize;
    int receivedBytes = startByte;

    final sink = file.openWrite(mode: FileMode.append);

    await for (final chunk in response.stream) {
      sink.add(chunk);
      receivedBytes += chunk.length;
      onProgress(receivedBytes, totalBytes);
    }

    await sink.close();
    return localPath;
  }

  Future<bool> _verifyChecksum(String filePath, String expectedChecksum) async {
    try {
      final file = File(filePath);
      final bytes = await file.readAsBytes();
      final digest = sha256.convert(bytes);
      return digest.toString() == expectedChecksum.toLowerCase();
    } catch (e) {
      debugPrint('[MobileModelLoader] Checksum verification error: $e');
      return false;
    }
  }

  // ============================================================================
  // Storage Management
  // ============================================================================

  Future<void> _ensureStorageSpace(int requiredBytes) async {
    final currentSize = await _getTotalCacheSize();
    final availableSpace = _maxCacheSize - currentSize;

    if (availableSpace < requiredBytes) {
      await _cleanupOldModels(requiredBytes - availableSpace);
    }
  }

  Future<int> _getTotalCacheSize() async {
    int totalSize = 0;
    for (final model in _loadedModels.values) {
      final file = File(model.localPath);
      if (await file.exists()) {
        totalSize += await file.length();
      }
    }
    return totalSize;
  }

  Future<void> _cleanupOldModels(int bytesToFree) async {
    // Sort by last used time (oldest first)
    final sortedModels = _loadedModels.values.toList()
      ..sort((a, b) => a.lastUsedAt.compareTo(b.lastUsedAt));

    int freedBytes = 0;
    final modelsToRemove = <String>[];

    for (final model in sortedModels) {
      if (freedBytes >= bytesToFree) break;

      final file = File(model.localPath);
      if (await file.exists()) {
        freedBytes += model.sizeBytes;
        await file.delete();
        modelsToRemove.add(model.id);
      }
    }

    for (final modelId in modelsToRemove) {
      _loadedModels.remove(modelId);
    }

    await _saveModelsMetadata();
    debugPrint('[MobileModelLoader] Cleaned up ${modelsToRemove.length} models, freed ${freedBytes ~/ 1024}KB');
  }

  // ============================================================================
  // Model Access
  // ============================================================================

  Future<DownloadedModel?> getModel(String modelId) async {
    await initialize();

    final model = _loadedModels[modelId];
    if (model == null) return null;

    // Verify file exists
    final file = File(model.localPath);
    if (!await file.exists()) {
      _loadedModels.remove(modelId);
      await _saveModelsMetadata();
      return null;
    }

    // Update usage stats
    final updatedModel = model.copyWith(
      lastUsedAt: DateTime.now(),
      useCount: model.useCount + 1,
    );
    _loadedModels[modelId] = updatedModel;
    await _saveModelsMetadata();

    return updatedModel;
  }

  Future<String?> getModelPath(String modelId) async {
    final model = await getModel(modelId);
    return model?.localPath;
  }

  List<DownloadedModel> getLoadedModels() {
    return _loadedModels.values.toList();
  }

  bool isModelLoaded(String modelId) {
    return _loadedModels.containsKey(modelId);
  }

  bool isModelVersionLoaded(String modelId, String version) {
    final model = _loadedModels[modelId];
    return model != null && model.version == version;
  }

  // ============================================================================
  // Model Updates
  // ============================================================================

  Future<List<MobileModelConfig>> checkForUpdates() async {
    try {
      final token = await _secureStorage.read(key: 'auth_token');
      final response = await http.post(
        Uri.parse('${AppConstants.baseUrl}/api/deployment/mobile/models/check-updates'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'installedModels': _loadedModels.values.map((m) => {
            'modelId': m.id,
            'version': m.version,
          }).toList(),
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['hasUpdates'] == true) {
          return (data['updates'] as List)
              .map((u) => MobileModelConfig.fromJson(u as Map<String, dynamic>))
              .toList();
        }
      }
    } catch (e) {
      debugPrint('[MobileModelLoader] Check updates error: $e');
    }
    return [];
  }

  // ============================================================================
  // Model Deletion
  // ============================================================================

  Future<bool> deleteModel(String modelId) async {
    final model = _loadedModels[modelId];
    if (model == null) return false;

    try {
      final file = File(model.localPath);
      if (await file.exists()) {
        await file.delete();
      }
      _loadedModels.remove(modelId);
      await _saveModelsMetadata();
      return true;
    } catch (e) {
      debugPrint('[MobileModelLoader] Delete model error: $e');
      return false;
    }
  }

  Future<void> clearAllModels() async {
    for (final model in _loadedModels.values) {
      try {
        final file = File(model.localPath);
        if (await file.exists()) {
          await file.delete();
        }
      } catch (e) {
        debugPrint('[MobileModelLoader] Error deleting model: $e');
      }
    }
    _loadedModels.clear();
    await _saveModelsMetadata();
  }

  // ============================================================================
  // Statistics
  // ============================================================================

  Future<Map<String, dynamic>> getStats() async {
    final cacheSize = await _getTotalCacheSize();
    return {
      'loadedModels': _loadedModels.length,
      'cacheSizeBytes': cacheSize,
      'cacheSizeMB': cacheSize / (1024 * 1024),
      'maxCacheSizeMB': _maxCacheSize / (1024 * 1024),
      'cacheUsagePercent': (cacheSize / _maxCacheSize) * 100,
      'models': _loadedModels.values.map((m) => {
        'id': m.id,
        'name': m.name,
        'version': m.version,
        'sizeMB': m.sizeBytes / (1024 * 1024),
        'useCount': m.useCount,
        'lastUsed': m.lastUsedAt.toIso8601String(),
      }).toList(),
    };
  }
}

// ============================================================================
// Global Instance
// ============================================================================

final mobileModelLoader = MobileModelLoader();
