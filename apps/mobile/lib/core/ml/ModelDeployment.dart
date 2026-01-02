import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math';
import 'package:crypto/crypto.dart';
import 'package:dio/dio.dart';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'package:path_provider/path_provider.dart';
import 'package:flutter/foundation.dart';

/// ML model deployment and lifecycle management
class ModelDeployment {
  static final ModelDeployment _instance = ModelDeployment._internal();
  factory ModelDeployment() => _instance;
  ModelDeployment._internal();

  Database? _database;
  final Dio _dio = Dio();
  final Map<String, ModelMetadata> _modelRegistry = {};
  ModelMetadata? _activeModel;
  ModelMetadata? _shadowModel;
  final Map<String, DeploymentStrategy> _activeDeployments = {};
  String? _modelsDirectory;

  /// Initialize model deployment system
  Future<void> initialize() async {
    try {
      final dbPath = await getDatabasesPath();
      final path = join(dbPath, 'model_deployment.db');

      _database = await openDatabase(
        path,
        version: 1,
        onCreate: _createDatabase,
      );

      // Setup models directory
      final appDir = await getApplicationDocumentsDirectory();
      _modelsDirectory = join(appDir.path, 'ml_models');
      await Directory(_modelsDirectory!).create(recursive: true);

      // Load model registry
      await _loadModelRegistry();

      debugPrint('ModelDeployment initialized successfully');
    } catch (e) {
      debugPrint('Error initializing ModelDeployment: $e');
      rethrow;
    }
  }

  /// Create database schema
  Future<void> _createDatabase(Database db, int version) async {
    await db.execute('''
      CREATE TABLE models (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        version TEXT NOT NULL,
        major_version INTEGER NOT NULL,
        minor_version INTEGER NOT NULL,
        patch_version INTEGER NOT NULL,
        status TEXT NOT NULL,
        accuracy REAL,
        size_bytes INTEGER NOT NULL,
        download_url TEXT,
        checksum TEXT NOT NULL,
        tags TEXT,
        owner TEXT,
        description TEXT,
        created_at INTEGER NOT NULL,
        deployed_at INTEGER,
        deprecated_at INTEGER,
        sunset_date INTEGER
      )
    ''');

    await db.execute('''
      CREATE TABLE deployments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        model_id TEXT NOT NULL,
        strategy TEXT NOT NULL,
        status TEXT NOT NULL,
        rollout_percentage REAL NOT NULL,
        started_at INTEGER NOT NULL,
        completed_at INTEGER,
        error TEXT,
        metrics TEXT
      )
    ''');

    await db.execute('''
      CREATE TABLE model_versions (
        model_id TEXT NOT NULL,
        version TEXT NOT NULL,
        file_path TEXT NOT NULL,
        downloaded_at INTEGER NOT NULL,
        PRIMARY KEY (model_id, version)
      )
    ''');

    await db.execute('''
      CREATE TABLE changelog (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        model_id TEXT NOT NULL,
        version TEXT NOT NULL,
        changes TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    ''');

    await db.execute('''
      CREATE INDEX idx_models_status ON models(status)
    ''');

    await db.execute('''
      CREATE INDEX idx_deployments_status ON deployments(status)
    ''');
  }

  /// Load model registry
  Future<void> _loadModelRegistry() async {
    try {
      final results = await _database?.query('models');

      for (final row in results ?? []) {
        final model = ModelMetadata.fromMap(row);
        _modelRegistry[model.id] = model;

        if (model.status == ModelStatus.production) {
          _activeModel = model;
        }
      }

      debugPrint('Loaded ${_modelRegistry.length} models from registry');
    } catch (e) {
      debugPrint('Error loading model registry: $e');
    }
  }

  /// Register new model
  Future<ModelMetadata> registerModel({
    required String name,
    required String version,
    required int sizeBytes,
    required String checksum,
    String? downloadUrl,
    double? accuracy,
    List<String>? tags,
    String? owner,
    String? description,
  }) async {
    try {
      final versionParts = _parseVersion(version);

      final model = ModelMetadata(
        id: _generateModelId(name, version),
        name: name,
        version: version,
        majorVersion: versionParts['major']!,
        minorVersion: versionParts['minor']!,
        patchVersion: versionParts['patch']!,
        status: ModelStatus.staging,
        accuracy: accuracy,
        sizeBytes: sizeBytes,
        downloadUrl: downloadUrl,
        checksum: checksum,
        tags: tags ?? [],
        owner: owner,
        description: description,
        createdAt: DateTime.now(),
      );

      await _database?.insert('models', model.toMap());
      _modelRegistry[model.id] = model;

      debugPrint('Registered model: ${model.name} v${model.version}');
      return model;
    } catch (e) {
      debugPrint('Error registering model: $e');
      rethrow;
    }
  }

  /// Generate model ID
  String _generateModelId(String name, String version) {
    return '${name.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]'), '_')}_$version';
  }

  /// Parse semantic version
  Map<String, int> _parseVersion(String version) {
    final parts = version.split('.');
    if (parts.length != 3) {
      throw ArgumentError('Version must be in format major.minor.patch');
    }

    return {
      'major': int.parse(parts[0]),
      'minor': int.parse(parts[1]),
      'patch': int.parse(parts[2]),
    };
  }

  /// Download model
  Future<String> downloadModel({
    required String modelId,
    required String url,
    required String expectedChecksum,
    Function(double)? onProgress,
  }) async {
    try {
      final model = _modelRegistry[modelId];
      if (model == null) {
        throw ArgumentError('Model not found: $modelId');
      }

      final fileName = '${model.name}_${model.version}.tflite';
      final filePath = join(_modelsDirectory!, fileName);
      final file = File(filePath);

      // Check if already downloaded and verified
      if (await file.exists()) {
        final existingChecksum = await _calculateChecksum(filePath);
        if (existingChecksum == expectedChecksum) {
          debugPrint('Model already downloaded and verified: $filePath');
          return filePath;
        }
      }

      // Download with progress tracking
      await _dio.download(
        url,
        filePath,
        onReceiveProgress: (received, total) {
          if (total != -1 && onProgress != null) {
            final progress = received / total;
            onProgress(progress);
          }
        },
        options: Options(
          receiveTimeout: const Duration(minutes: 10),
        ),
      );

      // Verify checksum
      final actualChecksum = await _calculateChecksum(filePath);
      if (actualChecksum != expectedChecksum) {
        await file.delete();
        throw Exception('Checksum verification failed: $actualChecksum != $expectedChecksum');
      }

      // Save to database
      await _database?.insert('model_versions', {
        'model_id': modelId,
        'version': model.version,
        'file_path': filePath,
        'downloaded_at': DateTime.now().millisecondsSinceEpoch,
      });

      debugPrint('Downloaded model: $filePath');
      return filePath;
    } catch (e) {
      debugPrint('Error downloading model: $e');
      rethrow;
    }
  }

  /// Calculate file checksum
  Future<String> _calculateChecksum(String filePath) async {
    final file = File(filePath);
    final bytes = await file.readAsBytes();
    final digest = sha256.convert(bytes);
    return digest.toString();
  }

  /// Deploy model with strategy
  Future<void> deployModel({
    required String modelId,
    required DeploymentStrategy strategy,
    Map<String, dynamic>? config,
  }) async {
    try {
      final model = _modelRegistry[modelId];
      if (model == null) {
        throw ArgumentError('Model not found: $modelId');
      }

      // Create deployment record
      final deploymentId = await _database?.insert('deployments', {
        'model_id': modelId,
        'strategy': strategy.toString(),
        'status': DeploymentStatus.inProgress.toString(),
        'rollout_percentage': 0.0,
        'started_at': DateTime.now().millisecondsSinceEpoch,
      });

      _activeDeployments[modelId] = strategy;

      // Execute deployment based on strategy
      switch (strategy) {
        case DeploymentStrategy.blueGreen:
          await _blueGreenDeployment(model, deploymentId!);
          break;
        case DeploymentStrategy.canary:
          await _canaryDeployment(model, deploymentId!, config);
          break;
        case DeploymentStrategy.shadow:
          await _shadowDeployment(model, deploymentId!);
          break;
        case DeploymentStrategy.ab:
          await _abDeployment(model, deploymentId!, config);
          break;
      }

      debugPrint('Started deployment: $strategy for model ${model.name}');
    } catch (e) {
      debugPrint('Error deploying model: $e');
      rethrow;
    }
  }

  /// Blue-green deployment
  Future<void> _blueGreenDeployment(ModelMetadata model, int deploymentId) async {
    try {
      // Download model if needed
      if (model.downloadUrl != null) {
        await downloadModel(
          modelId: model.id,
          url: model.downloadUrl!,
          expectedChecksum: model.checksum,
        );
      }

      // Load model in background
      final modelPath = await _getModelPath(model.id, model.version);
      if (modelPath == null) {
        throw Exception('Model file not found');
      }

      // Warm up model
      await _warmupModel(modelPath);

      // Atomic swap
      final previousModel = _activeModel;
      _activeModel = model;

      // Update status
      await _updateModelStatus(model.id, ModelStatus.production);
      if (previousModel != null) {
        await _updateModelStatus(previousModel.id, ModelStatus.retired);
      }

      // Complete deployment
      await _database?.update(
        'deployments',
        {
          'status': DeploymentStatus.completed.toString(),
          'rollout_percentage': 100.0,
          'completed_at': DateTime.now().millisecondsSinceEpoch,
        },
        where: 'id = ?',
        whereArgs: [deploymentId],
      );

      debugPrint('Blue-green deployment completed');
    } catch (e) {
      await _database?.update(
        'deployments',
        {
          'status': DeploymentStatus.failed.toString(),
          'error': e.toString(),
        },
        where: 'id = ?',
        whereArgs: [deploymentId],
      );
      rethrow;
    }
  }

  /// Canary deployment
  Future<void> _canaryDeployment(
    ModelMetadata model,
    int deploymentId,
    Map<String, dynamic>? config,
  ) async {
    try {
      // Download model if needed
      if (model.downloadUrl != null) {
        await downloadModel(
          modelId: model.id,
          url: model.downloadUrl!,
          expectedChecksum: model.checksum,
        );
      }

      // Canary stages: 1% -> 10% -> 50% -> 100%
      final stages = config?['stages'] as List<double>? ?? [1.0, 10.0, 50.0, 100.0];
      final stageDelay = config?['stageDelay'] as Duration? ?? const Duration(hours: 1);

      for (final percentage in stages) {
        debugPrint('Canary rollout: $percentage%');

        // Update rollout percentage
        await _database?.update(
          'deployments',
          {'rollout_percentage': percentage},
          where: 'id = ?',
          whereArgs: [deploymentId],
        );

        // Monitor metrics
        final shouldContinue = await _monitorCanaryMetrics(
          model,
          percentage,
          config?['errorThreshold'] as double? ?? 5.0,
        );

        if (!shouldContinue) {
          // Rollback
          await _rollback(deploymentId);
          throw Exception('Canary deployment failed metric checks');
        }

        // Wait before next stage (except for last stage)
        if (percentage != stages.last) {
          await Future.delayed(stageDelay);
        }
      }

      // Complete deployment
      _activeModel = model;
      await _updateModelStatus(model.id, ModelStatus.production);

      await _database?.update(
        'deployments',
        {
          'status': DeploymentStatus.completed.toString(),
          'completed_at': DateTime.now().millisecondsSinceEpoch,
        },
        where: 'id = ?',
        whereArgs: [deploymentId],
      );

      debugPrint('Canary deployment completed');
    } catch (e) {
      await _database?.update(
        'deployments',
        {
          'status': DeploymentStatus.failed.toString(),
          'error': e.toString(),
        },
        where: 'id = ?',
        whereArgs: [deploymentId],
      );
      rethrow;
    }
  }

  /// Shadow deployment
  Future<void> _shadowDeployment(ModelMetadata model, int deploymentId) async {
    try {
      // Download model if needed
      if (model.downloadUrl != null) {
        await downloadModel(
          modelId: model.id,
          url: model.downloadUrl!,
          expectedChecksum: model.checksum,
        );
      }

      // Load model in shadow mode
      _shadowModel = model;
      await _updateModelStatus(model.id, ModelStatus.shadow);

      debugPrint('Shadow deployment active: ${model.name}');

      // Complete deployment
      await _database?.update(
        'deployments',
        {
          'status': DeploymentStatus.completed.toString(),
          'rollout_percentage': 0.0, // Shadow doesn't affect traffic
          'completed_at': DateTime.now().millisecondsSinceEpoch,
        },
        where: 'id = ?',
        whereArgs: [deploymentId],
      );
    } catch (e) {
      await _database?.update(
        'deployments',
        {
          'status': DeploymentStatus.failed.toString(),
          'error': e.toString(),
        },
        where: 'id = ?',
        whereArgs: [deploymentId],
      );
      rethrow;
    }
  }

  /// A/B deployment
  Future<void> _abDeployment(
    ModelMetadata model,
    int deploymentId,
    Map<String, dynamic>? config,
  ) async {
    try {
      // Download model if needed
      if (model.downloadUrl != null) {
        await downloadModel(
          modelId: model.id,
          url: model.downloadUrl!,
          expectedChecksum: model.checksum,
        );
      }

      // Set 50/50 split
      final splitPercentage = config?['splitPercentage'] as double? ?? 50.0;

      await _database?.update(
        'deployments',
        {
          'status': DeploymentStatus.completed.toString(),
          'rollout_percentage': splitPercentage,
          'completed_at': DateTime.now().millisecondsSinceEpoch,
        },
        where: 'id = ?',
        whereArgs: [deploymentId],
      );

      debugPrint('A/B deployment active: $splitPercentage% traffic');
    } catch (e) {
      await _database?.update(
        'deployments',
        {
          'status': DeploymentStatus.failed.toString(),
          'error': e.toString(),
        },
        where: 'id = ?',
        whereArgs: [deploymentId],
      );
      rethrow;
    }
  }

  /// Warm up model
  Future<void> _warmupModel(String modelPath) async {
    debugPrint('Warming up model: $modelPath');

    // Run dummy inferences to warm up model
    // In production, this would use actual TFLite interpreter
    for (int i = 0; i < 10; i++) {
      await Future.delayed(const Duration(milliseconds: 10));
    }

    debugPrint('Model warmed up');
  }

  /// Monitor canary metrics
  Future<bool> _monitorCanaryMetrics(
    ModelMetadata model,
    double percentage,
    double errorThreshold,
  ) async {
    // Wait for some traffic
    await Future.delayed(const Duration(seconds: 30));

    // In production, this would check actual metrics
    // For now, simulate metric check
    final errorRate = Random().nextDouble() * 10;

    if (errorRate > errorThreshold) {
      debugPrint('Canary metrics failed: error_rate=$errorRate% > $errorThreshold%');
      return false;
    }

    debugPrint('Canary metrics passed: error_rate=$errorRate%');
    return true;
  }

  /// Rollback deployment
  Future<void> _rollback(int deploymentId) async {
    try {
      debugPrint('Rolling back deployment: $deploymentId');

      await _database?.update(
        'deployments',
        {
          'status': DeploymentStatus.rolledBack.toString(),
          'completed_at': DateTime.now().millisecondsSinceEpoch,
        },
        where: 'id = ?',
        whereArgs: [deploymentId],
      );

      // Restore previous active model
      // In production, keep reference to previous model
    } catch (e) {
      debugPrint('Error rolling back: $e');
    }
  }

  /// Get model for inference
  Future<ModelMetadata?> getModelForInference({String? userId}) async {
    try {
      // Check if there's an active canary deployment
      final canaryDeployment = await _getActiveCanaryDeployment();

      if (canaryDeployment != null) {
        // Determine if user should get canary model
        final shouldUseCanary = _shouldUseCanaryModel(
          userId,
          canaryDeployment['rollout_percentage'] as double,
        );

        if (shouldUseCanary) {
          final modelId = canaryDeployment['model_id'] as String;
          return _modelRegistry[modelId];
        }
      }

      return _activeModel;
    } catch (e) {
      debugPrint('Error getting model for inference: $e');
      return _activeModel;
    }
  }

  /// Get active canary deployment
  Future<Map<String, dynamic>?> _getActiveCanaryDeployment() async {
    final results = await _database?.query(
      'deployments',
      where: 'status = ? AND strategy = ?',
      whereArgs: [
        DeploymentStatus.inProgress.toString(),
        DeploymentStrategy.canary.toString(),
      ],
      limit: 1,
    );

    return results?.isNotEmpty == true ? results!.first : null;
  }

  /// Determine if user should use canary model
  bool _shouldUseCanaryModel(String? userId, double rolloutPercentage) {
    if (userId == null) {
      return Random().nextDouble() * 100 < rolloutPercentage;
    }

    // Consistent hashing based on user ID
    final hash = userId.hashCode.abs();
    final bucket = (hash % 100).toDouble();
    return bucket < rolloutPercentage;
  }

  /// Update model status
  Future<void> _updateModelStatus(String modelId, ModelStatus status) async {
    await _database?.update(
      'models',
      {'status': status.toString()},
      where: 'id = ?',
      whereArgs: [modelId],
    );

    final model = _modelRegistry[modelId];
    if (model != null) {
      _modelRegistry[modelId] = model.copyWith(status: status);
    }
  }

  /// Get model file path
  Future<String?> _getModelPath(String modelId, String version) async {
    final results = await _database?.query(
      'model_versions',
      columns: ['file_path'],
      where: 'model_id = ? AND version = ?',
      whereArgs: [modelId, version],
      limit: 1,
    );

    return results?.isNotEmpty == true ? results!.first['file_path'] as String : null;
  }

  /// Deprecate model
  Future<void> deprecateModel({
    required String modelId,
    DateTime? sunsetDate,
  }) async {
    try {
      await _database?.update(
        'models',
        {
          'status': ModelStatus.deprecated.toString(),
          'deprecated_at': DateTime.now().millisecondsSinceEpoch,
          'sunset_date': sunsetDate?.millisecondsSinceEpoch,
        },
        where: 'id = ?',
        whereArgs: [modelId],
      );

      debugPrint('Deprecated model: $modelId');
    } catch (e) {
      debugPrint('Error deprecating model: $e');
    }
  }

  /// Add changelog entry
  Future<void> addChangelog({
    required String modelId,
    required String version,
    required String changes,
  }) async {
    try {
      await _database?.insert('changelog', {
        'model_id': modelId,
        'version': version,
        'changes': changes,
        'created_at': DateTime.now().millisecondsSinceEpoch,
      });
    } catch (e) {
      debugPrint('Error adding changelog: $e');
    }
  }

  /// Get changelog
  Future<List<ChangelogEntry>> getChangelog(String modelId) async {
    try {
      final results = await _database?.query(
        'changelog',
        where: 'model_id = ?',
        whereArgs: [modelId],
        orderBy: 'created_at DESC',
      );

      return results?.map((row) => ChangelogEntry.fromMap(row)).toList() ?? [];
    } catch (e) {
      debugPrint('Error getting changelog: $e');
      return [];
    }
  }

  /// Check backward compatibility
  Future<bool> checkBackwardCompatibility({
    required String oldVersion,
    required String newVersion,
  }) async {
    final oldParts = _parseVersion(oldVersion);
    final newParts = _parseVersion(newVersion);

    // Breaking change if major version increased
    if (newParts['major']! > oldParts['major']!) {
      return false;
    }

    return true;
  }

  /// Manage disk space
  Future<void> manageDiskSpace({int maxVersionsToKeep = 5}) async {
    try {
      // Get all model versions grouped by model
      final results = await _database?.query('model_versions', orderBy: 'downloaded_at DESC');

      final versionsByModel = <String, List<Map<String, dynamic>>>{};
      for (final row in results ?? []) {
        final modelId = row['model_id'] as String;
        versionsByModel.putIfAbsent(modelId, () => []).add(row);
      }

      // Delete old versions
      for (final entry in versionsByModel.entries) {
        final versions = entry.value;
        if (versions.length > maxVersionsToKeep) {
          final toDelete = versions.skip(maxVersionsToKeep);

          for (final version in toDelete) {
            final filePath = version['file_path'] as String;
            final file = File(filePath);

            if (await file.exists()) {
              await file.delete();
              debugPrint('Deleted old model version: $filePath');
            }

            await _database?.delete(
              'model_versions',
              where: 'model_id = ? AND version = ?',
              whereArgs: [version['model_id'], version['version']],
            );
          }
        }
      }

      debugPrint('Disk space management completed');
    } catch (e) {
      debugPrint('Error managing disk space: $e');
    }
  }

  /// Get deployment status
  Future<List<DeploymentRecord>> getDeploymentHistory({String? modelId}) async {
    try {
      final results = await _database?.query(
        'deployments',
        where: modelId != null ? 'model_id = ?' : null,
        whereArgs: modelId != null ? [modelId] : null,
        orderBy: 'started_at DESC',
      );

      return results?.map((row) => DeploymentRecord.fromMap(row)).toList() ?? [];
    } catch (e) {
      debugPrint('Error getting deployment history: $e');
      return [];
    }
  }

  /// Get all models
  List<ModelMetadata> getAllModels({ModelStatus? status}) {
    if (status == null) {
      return _modelRegistry.values.toList();
    }

    return _modelRegistry.values.where((m) => m.status == status).toList();
  }

  /// Get active model
  ModelMetadata? getActiveModel() => _activeModel;

  /// Get shadow model
  ModelMetadata? getShadowModel() => _shadowModel;

  /// Dispose resources
  void dispose() {
    _database?.close();
    _dio.close();
  }
}

/// Model metadata
class ModelMetadata {
  final String id;
  final String name;
  final String version;
  final int majorVersion;
  final int minorVersion;
  final int patchVersion;
  final ModelStatus status;
  final double? accuracy;
  final int sizeBytes;
  final String? downloadUrl;
  final String checksum;
  final List<String> tags;
  final String? owner;
  final String? description;
  final DateTime createdAt;
  final DateTime? deployedAt;
  final DateTime? deprecatedAt;
  final DateTime? sunsetDate;

  ModelMetadata({
    required this.id,
    required this.name,
    required this.version,
    required this.majorVersion,
    required this.minorVersion,
    required this.patchVersion,
    required this.status,
    this.accuracy,
    required this.sizeBytes,
    this.downloadUrl,
    required this.checksum,
    this.tags = const [],
    this.owner,
    this.description,
    required this.createdAt,
    this.deployedAt,
    this.deprecatedAt,
    this.sunsetDate,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'version': version,
      'major_version': majorVersion,
      'minor_version': minorVersion,
      'patch_version': patchVersion,
      'status': status.toString(),
      'accuracy': accuracy,
      'size_bytes': sizeBytes,
      'download_url': downloadUrl,
      'checksum': checksum,
      'tags': jsonEncode(tags),
      'owner': owner,
      'description': description,
      'created_at': createdAt.millisecondsSinceEpoch,
      'deployed_at': deployedAt?.millisecondsSinceEpoch,
      'deprecated_at': deprecatedAt?.millisecondsSinceEpoch,
      'sunset_date': sunsetDate?.millisecondsSinceEpoch,
    };
  }

  factory ModelMetadata.fromMap(Map<String, dynamic> map) {
    return ModelMetadata(
      id: map['id'] as String,
      name: map['name'] as String,
      version: map['version'] as String,
      majorVersion: map['major_version'] as int,
      minorVersion: map['minor_version'] as int,
      patchVersion: map['patch_version'] as int,
      status: ModelStatus.values.firstWhere(
        (e) => e.toString() == map['status'],
        orElse: () => ModelStatus.staging,
      ),
      accuracy: map['accuracy'] as double?,
      sizeBytes: map['size_bytes'] as int,
      downloadUrl: map['download_url'] as String?,
      checksum: map['checksum'] as String,
      tags: List<String>.from(jsonDecode(map['tags'] as String)),
      owner: map['owner'] as String?,
      description: map['description'] as String?,
      createdAt: DateTime.fromMillisecondsSinceEpoch(map['created_at'] as int),
      deployedAt: map['deployed_at'] != null
          ? DateTime.fromMillisecondsSinceEpoch(map['deployed_at'] as int)
          : null,
      deprecatedAt: map['deprecated_at'] != null
          ? DateTime.fromMillisecondsSinceEpoch(map['deprecated_at'] as int)
          : null,
      sunsetDate: map['sunset_date'] != null
          ? DateTime.fromMillisecondsSinceEpoch(map['sunset_date'] as int)
          : null,
    );
  }

  ModelMetadata copyWith({
    String? id,
    String? name,
    String? version,
    ModelStatus? status,
    double? accuracy,
    int? sizeBytes,
    String? downloadUrl,
    String? checksum,
    List<String>? tags,
    String? owner,
    String? description,
    DateTime? deployedAt,
    DateTime? deprecatedAt,
    DateTime? sunsetDate,
  }) {
    return ModelMetadata(
      id: id ?? this.id,
      name: name ?? this.name,
      version: version ?? this.version,
      majorVersion: majorVersion,
      minorVersion: minorVersion,
      patchVersion: patchVersion,
      status: status ?? this.status,
      accuracy: accuracy ?? this.accuracy,
      sizeBytes: sizeBytes ?? this.sizeBytes,
      downloadUrl: downloadUrl ?? this.downloadUrl,
      checksum: checksum ?? this.checksum,
      tags: tags ?? this.tags,
      owner: owner ?? this.owner,
      description: description ?? this.description,
      createdAt: createdAt,
      deployedAt: deployedAt ?? this.deployedAt,
      deprecatedAt: deprecatedAt ?? this.deprecatedAt,
      sunsetDate: sunsetDate ?? this.sunsetDate,
    );
  }
}

/// Model status
enum ModelStatus {
  staging,
  production,
  shadow,
  retired,
  deprecated,
}

/// Deployment strategy
enum DeploymentStrategy {
  blueGreen,
  canary,
  shadow,
  ab,
}

/// Deployment status
enum DeploymentStatus {
  inProgress,
  completed,
  failed,
  rolledBack,
}

/// Deployment record
class DeploymentRecord {
  final int id;
  final String modelId;
  final DeploymentStrategy strategy;
  final DeploymentStatus status;
  final double rolloutPercentage;
  final DateTime startedAt;
  final DateTime? completedAt;
  final String? error;
  final Map<String, dynamic>? metrics;

  DeploymentRecord({
    required this.id,
    required this.modelId,
    required this.strategy,
    required this.status,
    required this.rolloutPercentage,
    required this.startedAt,
    this.completedAt,
    this.error,
    this.metrics,
  });

  factory DeploymentRecord.fromMap(Map<String, dynamic> map) {
    return DeploymentRecord(
      id: map['id'] as int,
      modelId: map['model_id'] as String,
      strategy: DeploymentStrategy.values.firstWhere(
        (e) => e.toString() == map['strategy'],
      ),
      status: DeploymentStatus.values.firstWhere(
        (e) => e.toString() == map['status'],
      ),
      rolloutPercentage: map['rollout_percentage'] as double,
      startedAt: DateTime.fromMillisecondsSinceEpoch(map['started_at'] as int),
      completedAt: map['completed_at'] != null
          ? DateTime.fromMillisecondsSinceEpoch(map['completed_at'] as int)
          : null,
      error: map['error'] as String?,
      metrics: map['metrics'] != null
          ? jsonDecode(map['metrics'] as String) as Map<String, dynamic>
          : null,
    );
  }
}

/// Changelog entry
class ChangelogEntry {
  final int id;
  final String modelId;
  final String version;
  final String changes;
  final DateTime createdAt;

  ChangelogEntry({
    required this.id,
    required this.modelId,
    required this.version,
    required this.changes,
    required this.createdAt,
  });

  factory ChangelogEntry.fromMap(Map<String, dynamic> map) {
    return ChangelogEntry(
      id: map['id'] as int,
      modelId: map['model_id'] as String,
      version: map['version'] as String,
      changes: map['changes'] as String,
      createdAt: DateTime.fromMillisecondsSinceEpoch(map['created_at'] as int),
    );
  }
}
