import 'dart:io';
import 'dart:convert';
import 'package:path_provider/path_provider.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/// Model Manager (Phase 9)
///
/// Manages on-device ML model lifecycle:
/// - Download models from server
/// - Check for updates
/// - Version management
/// - Atomic model swapping
/// - Storage management
///
/// Over-the-air model updates without app store releases
class ModelManager {
  // Singleton instance
  static final ModelManager _instance = ModelManager._internal();
  factory ModelManager() => _instance;
  ModelManager._internal();

  // API endpoint for model registry
  static const String _apiBaseUrl = 'https://api.upcoach.com';

  // Model storage directory
  Directory? _modelsDir;

  // Shared preferences for metadata
  SharedPreferences? _prefs;

  /// Initialize model manager
  Future<void> initialize() async {
    print('Initializing Model Manager...');

    // Get app documents directory
    final appDir = await getApplicationDocumentsDirectory();
    _modelsDir = Directory('${appDir.path}/models');

    // Create models directory if doesn't exist
    if (!await _modelsDir!.exists()) {
      await _modelsDir!.create(recursive: true);
      print('Created models directory: ${_modelsDir!.path}');
    }

    // Initialize shared preferences
    _prefs = await SharedPreferences.getInstance();

    print('✅ Model Manager initialized');
  }

  /// Check for model updates
  Future<List<ModelUpdate>> checkForUpdates() async {
    print('Checking for model updates...');

    try {
      // Call model registry API
      final response = await http.get(
        Uri.parse('$_apiBaseUrl/api/v1/models/registry'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to fetch model registry: ${response.statusCode}');
      }

      final models = jsonDecode(response.body) as List;

      final updates = <ModelUpdate>[];

      for (var model in models) {
        final modelName = model['name'] as String;
        final remoteVersion = model['version'] as String;
        final localVersion = await getModelVersion(modelName);

        if (_isNewerVersion(remoteVersion, localVersion)) {
          updates.add(ModelUpdate(
            name: modelName,
            currentVersion: localVersion,
            newVersion: remoteVersion,
            sizeBytes: model['sizeBytes'] as int,
            downloadUrl: model['downloadUrl'] as String,
            description: model['description'] as String,
          ));

          print('📦 Update available for $modelName: $localVersion → $remoteVersion');
        }
      }

      if (updates.isEmpty) {
        print('✅ All models are up to date');
      }

      return updates;
    } catch (e) {
      print('❌ Failed to check for updates: $e');
      return [];
    }
  }

  /// Download and install model
  Future<bool> downloadAndInstallModel(ModelUpdate update) async {
    print('Downloading ${update.name} v${update.newVersion}...');

    try {
      // Download model file
      final response = await http.get(Uri.parse(update.downloadUrl));

      if (response.statusCode != 200) {
        throw Exception('Failed to download model: ${response.statusCode}');
      }

      final bytes = response.bodyBytes;

      // Validate size
      if (bytes.length != update.sizeBytes) {
        throw Exception('Downloaded file size mismatch: ${bytes.length} != ${update.sizeBytes}');
      }

      // Save to temporary file first (atomic swap)
      final tempFile = File('${_modelsDir!.path}/${update.name}.tflite.tmp');
      await tempFile.writeAsBytes(bytes);

      // Verify file integrity (optional: checksum validation)
      print('Downloaded ${bytes.length} bytes');

      // Atomic swap: rename temp file to final name
      final finalFile = File('${_modelsDir!.path}/${update.name}.tflite');
      await tempFile.rename(finalFile.path);

      // Update version metadata
      await _setModelVersion(update.name, update.newVersion);
      await _setModelDownloadTime(update.name, DateTime.now());

      print('✅ ${update.name} v${update.newVersion} installed successfully');
      return true;
    } catch (e) {
      print('❌ Failed to download and install ${update.name}: $e');
      return false;
    }
  }

  /// Check if model exists locally
  Future<bool> modelExists(String modelName) async {
    final file = File('${_modelsDir!.path}/$modelName.tflite');
    return await file.exists();
  }

  /// Get model version
  Future<String> getModelVersion(String modelName) async {
    if (_prefs == null) await initialize();
    return _prefs!.getString('model_version_$modelName') ?? '0.0.0';
  }

  /// Get model age (days since download)
  Future<Duration?> getModelAge(String modelName) async {
    if (_prefs == null) await initialize();

    final downloadTimeStr = _prefs!.getString('model_download_time_$modelName');

    if (downloadTimeStr == null) return null;

    final downloadTime = DateTime.parse(downloadTimeStr);
    return DateTime.now().difference(downloadTime);
  }

  /// Get model file path
  Future<String> getModelPath(String modelName) async {
    if (_modelsDir == null) await initialize();
    return '${_modelsDir!.path}/$modelName.tflite';
  }

  /// Delete model
  Future<bool> deleteModel(String modelName) async {
    try {
      final file = File('${_modelsDir!.path}/$modelName.tflite');

      if (await file.exists()) {
        await file.delete();
        await _clearModelMetadata(modelName);
        print('✅ Deleted model: $modelName');
        return true;
      }

      return false;
    } catch (e) {
      print('❌ Failed to delete model $modelName: $e');
      return false;
    }
  }

  /// Get total models storage size
  Future<int> getTotalStorageSize() async {
    if (_modelsDir == null) await initialize();

    int totalSize = 0;

    await for (var entity in _modelsDir!.list()) {
      if (entity is File && entity.path.endsWith('.tflite')) {
        final stat = await entity.stat();
        totalSize += stat.size;
      }
    }

    return totalSize;
  }

  /// List all installed models
  Future<List<InstalledModel>> listInstalledModels() async {
    if (_modelsDir == null) await initialize();

    final models = <InstalledModel>[];

    await for (var entity in _modelsDir!.list()) {
      if (entity is File && entity.path.endsWith('.tflite')) {
        final modelName = entity.path.split('/').last.replaceAll('.tflite', '');
        final stat = await entity.stat();
        final version = await getModelVersion(modelName);
        final age = await getModelAge(modelName);

        models.add(InstalledModel(
          name: modelName,
          version: version,
          sizeBytes: stat.size,
          lastModified: stat.modified,
          ageDays: age?.inDays ?? 0,
        ));
      }
    }

    return models;
  }

  /// Set model version (internal)
  Future<void> _setModelVersion(String modelName, String version) async {
    if (_prefs == null) await initialize();
    await _prefs!.setString('model_version_$modelName', version);
  }

  /// Set model download time (internal)
  Future<void> _setModelDownloadTime(String modelName, DateTime time) async {
    if (_prefs == null) await initialize();
    await _prefs!.setString('model_download_time_$modelName', time.toIso8601String());
  }

  /// Clear model metadata (internal)
  Future<void> _clearModelMetadata(String modelName) async {
    if (_prefs == null) await initialize();
    await _prefs!.remove('model_version_$modelName');
    await _prefs!.remove('model_download_time_$modelName');
  }

  /// Check if version is newer (semantic versioning)
  bool _isNewerVersion(String newVersion, String currentVersion) {
    final newParts = newVersion.split('.').map(int.parse).toList();
    final currentParts = currentVersion.split('.').map(int.parse).toList();

    for (int i = 0; i < 3; i++) {
      if (newParts[i] > currentParts[i]) return true;
      if (newParts[i] < currentParts[i]) return false;
    }

    return false; // Versions are equal
  }
}

/// Model update information
class ModelUpdate {
  final String name;
  final String currentVersion;
  final String newVersion;
  final int sizeBytes;
  final String downloadUrl;
  final String description;

  ModelUpdate({
    required this.name,
    required this.currentVersion,
    required this.newVersion,
    required this.sizeBytes,
    required this.downloadUrl,
    required this.description,
  });

  String get sizeMB => (sizeBytes / (1024 * 1024)).toStringAsFixed(2);

  Map<String, dynamic> toJson() => {
        'name': name,
        'currentVersion': currentVersion,
        'newVersion': newVersion,
        'sizeBytes': sizeBytes,
        'sizeMB': sizeMB,
        'downloadUrl': downloadUrl,
        'description': description,
      };
}

/// Installed model information
class InstalledModel {
  final String name;
  final String version;
  final int sizeBytes;
  final DateTime lastModified;
  final int ageDays;

  InstalledModel({
    required this.name,
    required this.version,
    required this.sizeBytes,
    required this.lastModified,
    required this.ageDays,
  });

  String get sizeMB => (sizeBytes / (1024 * 1024)).toStringAsFixed(2);

  Map<String, dynamic> toJson() => {
        'name': name,
        'version': version,
        'sizeBytes': sizeBytes,
        'sizeMB': sizeMB,
        'lastModified': lastModified.toIso8601String(),
        'ageDays': ageDays,
      };
}
