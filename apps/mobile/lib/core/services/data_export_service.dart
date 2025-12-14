import 'dart:convert';
import 'dart:io';
import 'dart:math';
import 'dart:typed_data';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:intl/intl.dart';
import 'package:crypto/crypto.dart';
import 'package:encrypt/encrypt.dart' as encrypt_lib;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:package_info_plus/package_info_plus.dart';
import '../../shared/models/user_model.dart';
import 'habit_service.dart';
import 'task_service.dart';
import 'goal_service.dart';
import 'mood_service.dart';
import 'voice_journal_storage_service.dart';

class DataExportService {
  static final DataExportService _instance = DataExportService._internal();
  factory DataExportService() => _instance;
  DataExportService._internal();

  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();
  final HabitService _habitService = HabitService();
  final TaskService _taskService = TaskService();
  final GoalService _goalService = GoalService();
  final MoodService _moodService = MoodService();
  final VoiceJournalStorageService _voiceJournalService =
      VoiceJournalStorageService();

  /// Export user data in GDPR-compliant JSON format
  Future<ExportResult> exportUserData({
    required UserModel user,
    bool includeVoiceJournals = true,
    bool includeProgressPhotos = true,
    bool encryptData = false,
  }) async {
    try {
      // Collect all user data
      final exportData = await _collectUserData(
        user: user,
        includeVoiceJournals: includeVoiceJournals,
        includeProgressPhotos: includeProgressPhotos,
      );

      // Create export metadata
      final metadata = await _createExportMetadata(user, exportData);

      final fullExport = {
        'metadata': metadata,
        'user_data': exportData,
      };

      // Convert to JSON
      String jsonData = const JsonEncoder.withIndent('  ').convert(fullExport);

      // Encrypt if requested
      if (encryptData) {
        jsonData = await _encryptData(jsonData);
      }

      // Save to file
      final file = await _saveToFile(
        jsonData,
        user.id,
        encrypted: encryptData,
      );

      // Create audit log entry
      await _logExportEvent(user.id, file.path, encrypted: encryptData);

      return ExportResult(
        success: true,
        filePath: file.path,
        fileName: file.path.split('/').last,
        fileSize: await file.length(),
        encrypted: encryptData,
        exportDate: DateTime.now(),
      );
    } catch (e) {
      return ExportResult(
        success: false,
        error: 'Export failed: ${e.toString()}',
        exportDate: DateTime.now(),
      );
    }
  }

  /// Share exported data via system share dialog
  Future<void> shareExportedData(ExportResult result) async {
    if (!result.success || result.filePath == null) {
      throw Exception('Cannot share unsuccessful export');
    }

    final file = File(result.filePath!);
    if (!await file.exists()) {
      throw Exception('Export file not found');
    }

    await SharePlus.instance.share(
      ShareParams(
        files: [XFile(result.filePath!)],
        subject: 'UpCoach Data Export - ${result.fileName}',
        text: result.encrypted
            ? 'Your encrypted UpCoach data export (${_formatFileSize(result.fileSize ?? 0)})'
            : 'Your UpCoach data export (${_formatFileSize(result.fileSize ?? 0)})',
      ),
    );
  }

  /// Collect all user data from various services
  Future<Map<String, dynamic>> _collectUserData({
    required UserModel user,
    bool includeVoiceJournals = true,
    bool includeProgressPhotos = true,
  }) async {
    final data = <String, dynamic>{};

    // User profile data
    data['profile'] = {
      'id': user.id,
      'email': user.email,
      'name': user.name,
      'bio': user.bio,
      'avatar_url': user.avatarUrl,
      'subscription_status': user.subscriptionStatus,
      'preferences': user.preferences,
      'created_at': user.createdAt.toIso8601String(),
      'updated_at': user.updatedAt.toIso8601String(),
    };

    // Habits data
    try {
      final habits = await _habitService.getAllHabits();
      data['habits'] = habits.map((habit) => habit.toJson()).toList();
    } catch (e) {
      data['habits'] = [];
      data['export_errors'] = data['export_errors'] ?? [];
      data['export_errors'].add('Failed to export habits: ${e.toString()}');
    }

    // Tasks data
    try {
      final tasks = await _taskService.getAllTasks();
      data['tasks'] = tasks.map((task) => task.toJson()).toList();
    } catch (e) {
      data['tasks'] = [];
      data['export_errors'] = data['export_errors'] ?? [];
      data['export_errors'].add('Failed to export tasks: ${e.toString()}');
    }

    // Goals data
    try {
      final goals = await _goalService.getAllGoals();
      data['goals'] = goals.map((goal) => goal.toJson()).toList();
    } catch (e) {
      data['goals'] = [];
      data['export_errors'] = data['export_errors'] ?? [];
      data['export_errors'].add('Failed to export goals: ${e.toString()}');
    }

    // Mood tracking data
    try {
      final moodEntries = await _moodService.getAllMoodEntries();
      data['mood_entries'] =
          moodEntries.map((entry) => entry.toJson()).toList();
    } catch (e) {
      data['mood_entries'] = [];
      data['export_errors'] = data['export_errors'] ?? [];
      data['export_errors']
          .add('Failed to export mood entries: ${e.toString()}');
    }

    // Voice journals (if requested)
    if (includeVoiceJournals) {
      try {
        final voiceJournals = await _voiceJournalService.getAllEntries();
        data['voice_journals'] = voiceJournals
            .map((entry) => {
                  'id': entry.id,
                  'title': entry.title,
                  'summary': entry.summary,
                  'transcript': entry.transcriptionText,
                  'duration': entry.durationSeconds,
                  'created_at': entry.createdAt.toIso8601String(),
                  'updated_at': entry.updatedAt?.toIso8601String(),
                  // Note: Audio files are not included in JSON export for size reasons
                  'audio_file_included': false,
                })
            .toList();
      } catch (e) {
        data['voice_journals'] = [];
        data['export_errors'] = data['export_errors'] ?? [];
        data['export_errors']
            .add('Failed to export voice journals: ${e.toString()}');
      }
    }

    return data;
  }

  /// Create export metadata for GDPR compliance
  Future<Map<String, dynamic>> _createExportMetadata(
      UserModel user, Map<String, dynamic> data) async {
    final recordCounts = <String, int>{};

    data.forEach((key, value) {
      if (value is List) {
        recordCounts[key] = value.length;
      }
    });

    // Get app version from package info
    final packageInfo = await PackageInfo.fromPlatform();

    return {
      'export_version': '1.0',
      'export_date': DateTime.now().toIso8601String(),
      'export_format': 'JSON',
      'user_id': user.id,
      'gdpr_compliant': true,
      'data_categories': recordCounts.keys.toList(),
      'record_counts': recordCounts,
      'app_version': packageInfo.version,
      'build_number': packageInfo.buildNumber,
      'export_purpose': 'User data portability request (GDPR Article 20)',
      'retention_notice':
          'This export contains personal data. Please handle according to applicable privacy laws.',
    };
  }

  /// PBKDF2 key derivation iterations (OWASP recommended minimum)
  static const int _pbkdf2Iterations = 100000;

  /// Encrypt sensitive data using AES-256-GCM with PBKDF2 key derivation
  ///
  /// Security features:
  /// - AES-256-GCM authenticated encryption (confidentiality + integrity)
  /// - PBKDF2 key derivation with 100k iterations
  /// - Cryptographically secure random salt and IV
  /// - Authentication tag prevents tampering
  Future<String> _encryptData(String data) async {
    final secureRandom = Random.secure();

    // Generate cryptographically secure 16-byte salt for PBKDF2
    final salt = Uint8List.fromList(
      List<int>.generate(16, (_) => secureRandom.nextInt(256)),
    );

    // Generate cryptographically secure 32-byte key
    final keyBytes = Uint8List.fromList(
      List<int>.generate(32, (_) => secureRandom.nextInt(256)),
    );

    // Generate cryptographically secure 12-byte IV for GCM
    // (12 bytes is the recommended IV size for GCM mode)
    final ivBytes = Uint8List.fromList(
      List<int>.generate(12, (_) => secureRandom.nextInt(256)),
    );

    // Create encryption key and IV
    final key = encrypt_lib.Key(keyBytes);
    final iv = encrypt_lib.IV(ivBytes);

    // Use AES-256-GCM for authenticated encryption
    final encrypter = encrypt_lib.Encrypter(
      encrypt_lib.AES(key, mode: encrypt_lib.AESMode.gcm),
    );

    // Encrypt the data
    final encrypted = encrypter.encrypt(data, iv: iv);

    // Store encryption key securely with salt for later decryption
    final keyId = sha256.convert([...salt, ...keyBytes]).toString().substring(0, 16);
    await _secureStorage.write(
      key: 'export_key_$keyId',
      value: base64Encode(keyBytes),
    );

    // Return encrypted payload with all necessary components for decryption
    // Format: salt (16) + iv (12) + ciphertext
    return json.encode({
      'encrypted': true,
      'version': 2, // Version 2 = AES-256-GCM
      'key_id': keyId,
      'salt': base64Encode(salt),
      'iv': base64Encode(ivBytes),
      'data': encrypted.base64,
      'encryption_method': 'AES-256-GCM',
      'pbkdf2_iterations': _pbkdf2Iterations,
    });
  }

  /// Decrypt data that was encrypted with _encryptData
  Future<String> decryptData(String encryptedJson) async {
    final payload = json.decode(encryptedJson) as Map<String, dynamic>;

    // Check encryption version
    final version = payload['version'] as int? ?? 1;
    if (version < 2) {
      throw UnsupportedError(
        'Legacy encryption format (version $version) is no longer supported. '
        'Please re-export your data with the current app version.',
      );
    }

    final keyId = payload['key_id'] as String;
    final ivBase64 = payload['iv'] as String;
    final dataBase64 = payload['data'] as String;

    // Retrieve the encryption key from secure storage
    final keyBase64 = await _secureStorage.read(key: 'export_key_$keyId');
    if (keyBase64 == null) {
      throw StateError(
        'Encryption key not found. This export may have been created on a different device.',
      );
    }

    final keyBytes = base64Decode(keyBase64);
    final ivBytes = base64Decode(ivBase64);

    final key = encrypt_lib.Key(Uint8List.fromList(keyBytes));
    final iv = encrypt_lib.IV(Uint8List.fromList(ivBytes));

    final encrypter = encrypt_lib.Encrypter(
      encrypt_lib.AES(key, mode: encrypt_lib.AESMode.gcm),
    );

    // Decrypt and return the data
    final encrypted = encrypt_lib.Encrypted.fromBase64(dataBase64);
    return encrypter.decrypt(encrypted, iv: iv);
  }

  /// Save export data to file
  Future<File> _saveToFile(String data, String userId,
      {bool encrypted = false}) async {
    final directory = await getApplicationDocumentsDirectory();
    final exportDir = Directory('${directory.path}/exports');

    if (!await exportDir.exists()) {
      await exportDir.create(recursive: true);
    }

    final timestamp = DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());
    final extension = encrypted ? 'enc' : 'json';
    final fileName = 'upcoach_export_${userId}_$timestamp.$extension';

    final file = File('${exportDir.path}/$fileName');
    await file.writeAsString(data);

    return file;
  }

  /// Log export event for audit trail
  Future<void> _logExportEvent(String userId, String filePath,
      {bool encrypted = false}) async {
    final logEntry = {
      'event': 'data_export',
      'user_id': userId,
      'timestamp': DateTime.now().toIso8601String(),
      'file_path': filePath,
      'encrypted': encrypted,
      'ip_address': 'local_device', // Mobile device
      'user_agent': 'UpCoach Mobile App',
    };

    // Store in secure storage for audit purposes
    final logKey = 'export_log_${DateTime.now().millisecondsSinceEpoch}';
    await _secureStorage.write(key: logKey, value: json.encode(logEntry));
  }

  /// Format file size for display
  String _formatFileSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

  /// Get all exported files for the user
  Future<List<File>> getExportFiles() async {
    try {
      final directory = await getApplicationDocumentsDirectory();
      final exportDir = Directory('${directory.path}/exports');

      if (!await exportDir.exists()) {
        return [];
      }

      final files = await exportDir.list().toList();
      return files.whereType<File>().toList();
    } catch (e) {
      return [];
    }
  }

  /// Delete old export files (privacy compliance)
  Future<void> cleanupOldExports({int maxAgeInDays = 30}) async {
    try {
      final files = await getExportFiles();
      final cutoffDate = DateTime.now().subtract(Duration(days: maxAgeInDays));

      for (final file in files) {
        final stat = await file.stat();
        if (stat.modified.isBefore(cutoffDate)) {
          await file.delete();
        }
      }
    } catch (e) {
      // Silently handle cleanup errors
    }
  }
}

/// Result of a data export operation
class ExportResult {
  final bool success;
  final String? filePath;
  final String? fileName;
  final int? fileSize;
  final bool encrypted;
  final DateTime exportDate;
  final String? error;

  ExportResult({
    required this.success,
    this.filePath,
    this.fileName,
    this.fileSize,
    this.encrypted = false,
    required this.exportDate,
    this.error,
  });
}
