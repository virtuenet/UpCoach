import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:sqflite/sqflite.dart';
import 'package:path_provider/path_provider.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:crypto/crypto.dart';
import 'package:image/image.dart' as img;
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/// Advanced queue upload service with intelligent retry logic
/// Handles image compression, background processing, and failure recovery
class QueueUploadService {
  static const String _dbName = 'upload_queue.db';
  static const int _dbVersion = 1;
  static const int _maxConcurrentUploads = 3;
  static const int _maxRetryAttempts = 5;

  Database? _database;
  Timer? _processingTimer;
  final Set<String> _activeUploads = {};
  StreamController<UploadProgress>? _progressController;
  bool _isProcessing = false;

  // Singleton pattern
  static final QueueUploadService _instance = QueueUploadService._internal();
  factory QueueUploadService() => _instance;
  QueueUploadService._internal();

  Stream<UploadProgress> get uploadProgress => _progressController!.stream;

  /// Initialize the upload queue service
  Future<void> initialize() async {
    _progressController = StreamController<UploadProgress>.broadcast();
    await _initializeDatabase();
    await _setupPeriodicProcessing();
    await _processQueuedUploads();
  }

  /// Initialize local database for upload queue
  Future<void> _initializeDatabase() async {
    final databasesPath = await getDatabasesPath();
    final path = '$databasesPath/$_dbName';

    _database = await openDatabase(
      path,
      version: _dbVersion,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE upload_queue (
            id TEXT PRIMARY KEY,
            file_path TEXT NOT NULL,
            original_name TEXT NOT NULL,
            upload_type TEXT NOT NULL,
            metadata TEXT,
            compressed_path TEXT,
            upload_url TEXT,
            retry_count INTEGER DEFAULT 0,
            max_retries INTEGER DEFAULT $_maxRetryAttempts,
            priority INTEGER DEFAULT 1,
            file_size INTEGER NOT NULL,
            compressed_size INTEGER,
            checksum TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            error_message TEXT,
            progress REAL DEFAULT 0.0,
            created_at INTEGER NOT NULL,
            last_attempt INTEGER,
            next_retry INTEGER,
            upload_speed REAL DEFAULT 0.0,
            estimated_time REAL DEFAULT 0.0
          )
        ''');

        await db.execute('''
          CREATE TABLE upload_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at INTEGER NOT NULL
          )
        ''');

        // Indexes for performance
        await db.execute('CREATE INDEX idx_upload_status ON upload_queue(status)');
        await db.execute('CREATE INDEX idx_upload_priority ON upload_queue(priority DESC, created_at ASC)');
        await db.execute('CREATE INDEX idx_upload_retry ON upload_queue(next_retry)');
      },
    );

    // Set default settings
    await _setDefaultSettings();
  }

  /// Set default upload settings
  Future<void> _setDefaultSettings() async {
    final settings = {
      'max_image_size': '1920x1080',
      'compression_quality': '85',
      'wifi_only': 'false',
      'retry_delay_base': '2000', // Base delay in milliseconds
      'retry_delay_max': '300000', // Max delay (5 minutes)
      'auto_compress': 'true',
    };

    final now = DateTime.now().millisecondsSinceEpoch;
    for (final entry in settings.entries) {
      await _database!.insert(
        'upload_settings',
        {
          'key': entry.key,
          'value': entry.value,
          'updated_at': now,
        },
        conflictAlgorithm: ConflictAlgorithm.ignore,
      );
    }
  }

  /// Setup periodic processing timer
  Future<void> _setupPeriodicProcessing() async {
    _processingTimer?.cancel();

    _processingTimer = Timer.periodic(const Duration(seconds: 10), (timer) async {
      if (await _shouldProcessQueue() && !_isProcessing) {
        await _processQueuedUploads();
      }
    });
  }

  /// Check if we should process the queue
  Future<bool> _shouldProcessQueue() async {
    // Check connectivity
    final connectivityResult = await Connectivity().checkConnectivity();
    if (connectivityResult == ConnectivityResult.none) {
      return false;
    }

    // Check wifi-only setting
    final wifiOnly = await _getSetting('wifi_only') == 'true';
    if (wifiOnly && connectivityResult != ConnectivityResult.wifi) {
      return false;
    }

    return true;
  }

  /// Queue a file for upload with advanced options
  Future<String> queueUpload({
    required String filePath,
    required String uploadType,
    Map<String, dynamic>? metadata,
    int priority = 1,
    bool autoCompress = true,
    ImageCompression? compressionSettings,
  }) async {
    final file = File(filePath);
    if (!await file.exists()) {
      throw Exception('File does not exist: $filePath');
    }

    final uploadId = _generateUploadId();
    final fileSize = await file.length();
    final checksum = await _calculateFileChecksum(file);
    final originalName = file.path.split('/').last;

    // Compress image if needed and enabled
    String? compressedPath;
    int? compressedSize;

    if (autoCompress && _isImageFile(filePath)) {
      try {
        compressedPath = await _compressImage(filePath, compressionSettings);
        if (compressedPath != null) {
          compressedSize = await File(compressedPath).length();
        }
      } catch (e) {
        debugPrint('Image compression failed: $e');
        // Continue with original file
      }
    }

    // Insert into queue
    await _database!.insert('upload_queue', {
      'id': uploadId,
      'file_path': filePath,
      'original_name': originalName,
      'upload_type': uploadType,
      'metadata': metadata != null ? jsonEncode(metadata) : null,
      'compressed_path': compressedPath,
      'priority': priority,
      'file_size': fileSize,
      'compressed_size': compressedSize,
      'checksum': checksum,
      'created_at': DateTime.now().millisecondsSinceEpoch,
    });

    // Trigger immediate processing if online
    if (await _shouldProcessQueue() && !_isProcessing) {
      unawaited(_processQueuedUploads());
    }

    return uploadId;
  }

  /// Process queued uploads
  Future<void> _processQueuedUploads() async {
    if (_isProcessing) return;

    _isProcessing = true;

    try {
      // Get ready uploads, considering retry delays
      final now = DateTime.now().millisecondsSinceEpoch;
      final readyUploads = await _database!.query(
        'upload_queue',
        where: '''
          status IN ('pending', 'retry')
          AND retry_count < max_retries
          AND (next_retry IS NULL OR next_retry <= ?)
        ''',
        whereArgs: [now],
        orderBy: 'priority DESC, created_at ASC',
        limit: _maxConcurrentUploads,
      );

      // Process uploads concurrently
      final futures = readyUploads.map((upload) => _processUpload(upload)).toList();
      await Future.wait(futures);

    } catch (e) {
      debugPrint('Error processing upload queue: $e');
    } finally {
      _isProcessing = false;
    }
  }

  /// Process individual upload
  Future<void> _processUpload(Map<String, dynamic> upload) async {
    final uploadId = upload['id'] as String;

    if (_activeUploads.contains(uploadId)) {
      return; // Already being processed
    }

    _activeUploads.add(uploadId);

    try {
      await _updateUploadStatus(uploadId, 'uploading');

      final success = await _executeUpload(upload);

      if (success) {
        await _updateUploadStatus(uploadId, 'completed');
        await _cleanupCompressedFile(upload);
        _progressController?.add(UploadProgress(
          uploadId: uploadId,
          status: UploadStatus.completed,
          progress: 1.0,
        ));
      } else {
        await _handleUploadFailure(upload);
      }
    } catch (e) {
      await _handleUploadError(upload, e.toString());
    } finally {
      _activeUploads.remove(uploadId);
    }
  }

  /// Execute the actual upload
  Future<bool> _executeUpload(Map<String, dynamic> upload) async {
    final uploadId = upload['id'] as String;
    final filePath = upload['compressed_path'] as String? ?? upload['file_path'] as String;
    final uploadType = upload['upload_type'] as String;

    final file = File(filePath);
    if (!await file.exists()) {
      throw Exception('Upload file not found: $filePath');
    }

    try {
      // Get upload URL (implement your API logic here)
      final uploadUrl = await _getUploadUrl(uploadType, upload);

      if (uploadUrl == null) {
        throw Exception('Failed to get upload URL');
      }

      // Create multipart request
      final request = http.MultipartRequest('POST', Uri.parse(uploadUrl));

      // Add metadata
      final metadata = upload['metadata'] as String?;
      if (metadata != null) {
        final metadataMap = jsonDecode(metadata) as Map<String, dynamic>;
        metadataMap.forEach((key, value) {
          request.fields[key] = value.toString();
        });
      }

      // Add file
      final multipartFile = await http.MultipartFile.fromPath(
        'file',
        filePath,
        filename: upload['original_name'] as String,
      );
      request.files.add(multipartFile);

      // Track upload progress
      final streamedResponse = await request.send();

      // Update progress
      _progressController?.add(UploadProgress(
        uploadId: uploadId,
        status: UploadStatus.uploading,
        progress: 0.5, // Intermediate progress
      ));

      // Check response
      if (streamedResponse.statusCode == 200 || streamedResponse.statusCode == 201) {
        final responseBody = await streamedResponse.stream.bytesToString();
        await _handleUploadSuccess(upload, responseBody);
        return true;
      } else {
        throw Exception('Upload failed with status: ${streamedResponse.statusCode}');
      }
    } catch (e) {
      throw Exception('Upload execution failed: $e');
    }
  }

  /// Handle upload success
  Future<void> _handleUploadSuccess(Map<String, dynamic> upload, String responseBody) async {
    final uploadId = upload['id'] as String;

    // Parse response and store upload URL if provided
    try {
      final response = jsonDecode(responseBody) as Map<String, dynamic>;
      final uploadUrl = response['url'] as String?;

      if (uploadUrl != null) {
        await _database!.update(
          'upload_queue',
          {'upload_url': uploadUrl},
          where: 'id = ?',
          whereArgs: [uploadId],
        );
      }
    } catch (e) {
      debugPrint('Failed to parse upload response: $e');
    }
  }

  /// Handle upload failure with exponential backoff
  Future<void> _handleUploadFailure(Map<String, dynamic> upload) async {
    final uploadId = upload['id'] as String;
    final retryCount = upload['retry_count'] as int;
    final maxRetries = upload['max_retries'] as int;

    if (retryCount < maxRetries) {
      final nextRetry = _calculateNextRetry(retryCount);

      await _database!.update(
        'upload_queue',
        {
          'status': 'retry',
          'retry_count': retryCount + 1,
          'next_retry': nextRetry,
          'last_attempt': DateTime.now().millisecondsSinceEpoch,
        },
        where: 'id = ?',
        whereArgs: [uploadId],
      );

      _progressController?.add(UploadProgress(
        uploadId: uploadId,
        status: UploadStatus.retrying,
        retryCount: retryCount + 1,
      ));
    } else {
      await _updateUploadStatus(uploadId, 'failed');

      _progressController?.add(UploadProgress(
        uploadId: uploadId,
        status: UploadStatus.failed,
        error: 'Max retries exceeded',
      ));
    }
  }

  /// Handle upload error
  Future<void> _handleUploadError(Map<String, dynamic> upload, String error) async {
    final uploadId = upload['id'] as String;

    await _database!.update(
      'upload_queue',
      {
        'error_message': error,
        'last_attempt': DateTime.now().millisecondsSinceEpoch,
      },
      where: 'id = ?',
      whereArgs: [uploadId],
    );

    await _handleUploadFailure(upload);
  }

  /// Calculate next retry time with exponential backoff
  int _calculateNextRetry(int retryCount) {
    final baseDelay = int.parse(await _getSetting('retry_delay_base') ?? '2000');
    final maxDelay = int.parse(await _getSetting('retry_delay_max') ?? '300000');

    final delay = min(baseDelay * pow(2, retryCount).toInt(), maxDelay);
    final jitter = Random().nextInt(1000); // Add jitter to avoid thundering herd

    return DateTime.now().millisecondsSinceEpoch + delay + jitter;
  }

  /// Compress image with configurable settings
  Future<String?> _compressImage(String filePath, ImageCompression? settings) async {
    try {
      final file = File(filePath);
      final imageBytes = await file.readAsBytes();
      final image = img.decodeImage(imageBytes);

      if (image == null) {
        return null;
      }

      // Apply compression settings
      final maxWidth = settings?.maxWidth ?? 1920;
      final maxHeight = settings?.maxHeight ?? 1080;
      final quality = settings?.quality ?? 85;

      // Resize if needed
      img.Image resized = image;
      if (image.width > maxWidth || image.height > maxHeight) {
        resized = img.copyResize(
          image,
          width: min(image.width, maxWidth),
          height: min(image.height, maxHeight),
        );
      }

      // Compress
      final compressedBytes = img.encodeJpg(resized, quality: quality);

      // Save compressed file
      final tempDir = await getTemporaryDirectory();
      final compressedPath = '${tempDir.path}/compressed_${DateTime.now().millisecondsSinceEpoch}.jpg';
      final compressedFile = File(compressedPath);
      await compressedFile.writeAsBytes(compressedBytes);

      return compressedPath;
    } catch (e) {
      debugPrint('Image compression failed: $e');
      return null;
    }
  }

  /// Check if file is an image
  bool _isImageFile(String filePath) {
    final extension = filePath.toLowerCase().split('.').last;
    return ['jpg', 'jpeg', 'png', 'webp', 'gif'].contains(extension);
  }

  /// Generate unique upload ID
  String _generateUploadId() {
    return '${DateTime.now().millisecondsSinceEpoch}_${Random().nextInt(10000)}';
  }

  /// Calculate file checksum
  Future<String> _calculateFileChecksum(File file) async {
    final bytes = await file.readAsBytes();
    final digest = sha256.convert(bytes);
    return digest.toString();
  }

  /// Update upload status
  Future<void> _updateUploadStatus(String uploadId, String status) async {
    await _database!.update(
      'upload_queue',
      {
        'status': status,
        'last_attempt': DateTime.now().millisecondsSinceEpoch,
      },
      where: 'id = ?',
      whereArgs: [uploadId],
    );
  }

  /// Clean up compressed file after successful upload
  Future<void> _cleanupCompressedFile(Map<String, dynamic> upload) async {
    final compressedPath = upload['compressed_path'] as String?;
    if (compressedPath != null) {
      try {
        final file = File(compressedPath);
        if (await file.exists()) {
          await file.delete();
        }
      } catch (e) {
        debugPrint('Failed to cleanup compressed file: $e');
      }
    }
  }

  /// Get upload URL from API
  Future<String?> _getUploadUrl(String uploadType, Map<String, dynamic> upload) async {
    // Implementation depends on your API
    // This is a placeholder that should be replaced with actual API call

    try {
      final response = await http.post(
        Uri.parse('${_apiBaseUrl}/uploads/url'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'upload_type': uploadType,
          'file_name': upload['original_name'],
          'file_size': upload['compressed_size'] ?? upload['file_size'],
          'checksum': upload['checksum'],
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        return data['upload_url'] as String?;
      }
    } catch (e) {
      debugPrint('Failed to get upload URL: $e');
    }

    return null;
  }

  /// Get setting value
  Future<String?> _getSetting(String key) async {
    final result = await _database!.query(
      'upload_settings',
      where: 'key = ?',
      whereArgs: [key],
    );

    return result.isNotEmpty ? result.first['value'] as String : null;
  }

  /// Get queue statistics
  Future<QueueStatistics> getQueueStatistics() async {
    final pending = Sqflite.firstIntValue(await _database!.rawQuery(
      'SELECT COUNT(*) FROM upload_queue WHERE status = "pending"'
    )) ?? 0;

    final uploading = Sqflite.firstIntValue(await _database!.rawQuery(
      'SELECT COUNT(*) FROM upload_queue WHERE status = "uploading"'
    )) ?? 0;

    final failed = Sqflite.firstIntValue(await _database!.rawQuery(
      'SELECT COUNT(*) FROM upload_queue WHERE status = "failed"'
    )) ?? 0;

    final completed = Sqflite.firstIntValue(await _database!.rawQuery(
      'SELECT COUNT(*) FROM upload_queue WHERE status = "completed"'
    )) ?? 0;

    return QueueStatistics(
      pending: pending,
      uploading: uploading,
      failed: failed,
      completed: completed,
      isOnline: await _shouldProcessQueue(),
    );
  }

  /// Retry failed uploads
  Future<void> retryFailedUploads() async {
    await _database!.update(
      'upload_queue',
      {
        'status': 'pending',
        'retry_count': 0,
        'next_retry': null,
        'error_message': null,
      },
      where: 'status = "failed"',
    );

    if (await _shouldProcessQueue() && !_isProcessing) {
      await _processQueuedUploads();
    }
  }

  /// Clear completed uploads
  Future<void> clearCompleted() async {
    await _database!.delete(
      'upload_queue',
      where: 'status = "completed"',
    );
  }

  /// Cancel upload
  Future<void> cancelUpload(String uploadId) async {
    await _database!.update(
      'upload_queue',
      {'status': 'cancelled'},
      where: 'id = ?',
      whereArgs: [uploadId],
    );

    _activeUploads.remove(uploadId);
  }

  /// Dispose resources
  void dispose() {
    _processingTimer?.cancel();
    _progressController?.close();
    _database?.close();
  }
}

/// Image compression settings
class ImageCompression {
  final int maxWidth;
  final int maxHeight;
  final int quality;

  const ImageCompression({
    this.maxWidth = 1920,
    this.maxHeight = 1080,
    this.quality = 85,
  });
}

/// Upload progress data
class UploadProgress {
  final String uploadId;
  final UploadStatus status;
  final double progress;
  final int? retryCount;
  final String? error;

  UploadProgress({
    required this.uploadId,
    required this.status,
    this.progress = 0.0,
    this.retryCount,
    this.error,
  });
}

/// Upload status enumeration
enum UploadStatus {
  pending,
  uploading,
  completed,
  failed,
  retrying,
  cancelled,
}

/// Queue statistics
class QueueStatistics {
  final int pending;
  final int uploading;
  final int failed;
  final int completed;
  final bool isOnline;

  QueueStatistics({
    required this.pending,
    required this.uploading,
    required this.failed,
    required this.completed,
    required this.isOnline,
  });
}

// Configuration - replace with your actual API base URL
const String _apiBaseUrl = 'https://api.upcoach.ai';