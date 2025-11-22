import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:image/image.dart' as img;
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as path;
import 'package:uuid/uuid.dart';
import '../../../core/database/app_database.dart';
import '../models/progress_photo.dart';

/// Repository for managing progress photos with proper error handling
class ProgressPhotosRepository {
  final AppDatabase _database;
  final _uuid = const Uuid();

  ProgressPhotosRepository({AppDatabase? database})
      : _database = database ?? AppDatabase();

  /// Save a photo with automatic thumbnail generation
  Future<ProgressPhoto> savePhoto({
    required File imageFile,
    String? caption,
    String category = 'general',
  }) async {
    try {
      final id = _uuid.v4();
      final appDir = await getApplicationDocumentsDirectory();
      final photosDir = Directory('${appDir.path}/progress_photos');

      if (!await photosDir.exists()) {
        await photosDir.create(recursive: true);
      }

      // Copy original file
      final fileName = '$id${path.extension(imageFile.path)}';
      final savedFile = await imageFile.copy('${photosDir.path}/$fileName');

      // Generate thumbnail in isolate to avoid blocking UI
      String? thumbnailPath;
      try {
        thumbnailPath = await compute(_generateThumbnail, {
          'sourcePath': savedFile.path,
          'targetDir': photosDir.path,
          'id': id,
        });
      } catch (e) {
        debugPrint('Thumbnail generation failed: $e');
        // Continue without thumbnail
      }

      // Save to database
      final photo = ProgressPhoto(
        id: id,
        filePath: savedFile.path,
        thumbnailPath: thumbnailPath,
        caption: caption,
        category: category,
        createdAt: DateTime.now(),
      );

      final db = await _database.database;
      await db.insert('progress_photos', photo.toDatabase());

      return photo;
    } catch (e) {
      throw DatabaseException('Failed to save photo', e);
    }
  }

  /// Get all photos with pagination support
  Future<List<ProgressPhoto>> getPhotos({
    int limit = 20,
    int offset = 0,
    String? category,
  }) async {
    try {
      final db = await _database.database;

      String whereClause = '';
      List<dynamic> whereArgs = [];

      if (category != null) {
        whereClause = 'category = ?';
        whereArgs = [category];
      }

      final maps = await db.query(
        'progress_photos',
        where: whereClause.isEmpty ? null : whereClause,
        whereArgs: whereArgs.isEmpty ? null : whereArgs,
        orderBy: 'created_at DESC',
        limit: limit,
        offset: offset,
      );

      return maps.map((map) => ProgressPhoto.fromDatabase(map)).toList();
    } catch (e) {
      throw DatabaseException('Failed to load photos', e);
    }
  }

  /// Get photo by ID
  Future<ProgressPhoto?> getPhotoById(String id) async {
    try {
      final db = await _database.database;
      final maps = await db.query(
        'progress_photos',
        where: 'id = ?',
        whereArgs: [id],
        limit: 1,
      );

      if (maps.isEmpty) return null;
      return ProgressPhoto.fromDatabase(maps.first);
    } catch (e) {
      throw DatabaseException('Failed to get photo', e);
    }
  }

  /// Update photo caption
  Future<void> updateCaption(String id, String? caption) async {
    try {
      final db = await _database.database;
      await db.update(
        'progress_photos',
        {
          'caption': caption,
          'updated_at': DateTime.now().millisecondsSinceEpoch,
        },
        where: 'id = ?',
        whereArgs: [id],
      );
    } catch (e) {
      throw DatabaseException('Failed to update caption', e);
    }
  }

  /// Delete photo and its files
  Future<void> deletePhoto(String id) async {
    try {
      final photo = await getPhotoById(id);
      if (photo == null) return;

      // Delete files
      await _deletePhotoFiles(photo);

      // Delete from database
      final db = await _database.database;
      await db.delete(
        'progress_photos',
        where: 'id = ?',
        whereArgs: [id],
      );
    } catch (e) {
      throw DatabaseException('Failed to delete photo', e);
    }
  }

  /// Delete multiple photos
  Future<void> deletePhotos(List<String> ids) async {
    if (ids.isEmpty) return;

    try {
      await _database.transaction((txn) async {
        for (final id in ids) {
          final maps = await txn.query(
            'progress_photos',
            where: 'id = ?',
            whereArgs: [id],
            limit: 1,
          );

          if (maps.isNotEmpty) {
            final photo = ProgressPhoto.fromDatabase(maps.first);
            await _deletePhotoFiles(photo);

            await txn.delete(
              'progress_photos',
              where: 'id = ?',
              whereArgs: [id],
            );
          }
        }
      });
    } catch (e) {
      throw DatabaseException('Failed to delete photos', e);
    }
  }

  /// Get photo statistics
  Future<Map<String, dynamic>> getStatistics() async {
    try {
      final db = await _database.database;

      // Total photos count
      final countResult = await db.rawQuery(
        'SELECT COUNT(*) as total FROM progress_photos'
      );
      final totalPhotos = (countResult.first['total'] as int?) ?? 0;

      // Photos by category
      final categoryResult = await db.rawQuery('''
        SELECT category, COUNT(*) as count
        FROM progress_photos
        GROUP BY category
      ''');

      final categoryCounts = <String, int>{};
      for (final row in categoryResult) {
        categoryCounts[row['category'] as String] = (row['count'] as int?) ?? 0;
      }

      // Recent photos (last 7 days)
      final sevenDaysAgo = DateTime.now()
          .subtract(const Duration(days: 7))
          .millisecondsSinceEpoch;
      final recentResult = await db.rawQuery(
        'SELECT COUNT(*) as recent FROM progress_photos WHERE created_at > ?',
        [sevenDaysAgo],
      );
      final recentPhotos = (recentResult.first['recent'] as int?) ?? 0;

      return {
        'totalPhotos': totalPhotos,
        'categoryCounts': categoryCounts,
        'recentPhotos': recentPhotos,
      };
    } catch (e) {
      throw DatabaseException('Failed to get statistics', e);
    }
  }

  /// Export photos data as JSON
  Future<List<Map<String, dynamic>>> exportPhotos() async {
    try {
      final photos = await getPhotos(limit: 10000); // Get all photos
      return photos.map((photo) => photo.toJson()).toList();
    } catch (e) {
      throw DatabaseException('Failed to export photos', e);
    }
  }

  /// Clean up orphaned files
  Future<int> cleanupOrphanedFiles() async {
    try {
      final appDir = await getApplicationDocumentsDirectory();
      final photosDir = Directory('${appDir.path}/progress_photos');

      if (!await photosDir.exists()) return 0;

      final db = await _database.database;
      final result = await db.query('progress_photos', columns: ['file_path', 'thumbnail_path']);

      final validPaths = <String>{};
      for (final row in result) {
        if (row['file_path'] != null) validPaths.add(row['file_path'] as String);
        if (row['thumbnail_path'] != null) validPaths.add(row['thumbnail_path'] as String);
      }

      int deletedCount = 0;
      await for (final file in photosDir.list()) {
        if (file is File && !validPaths.contains(file.path)) {
          await file.delete();
          deletedCount++;
        }
      }

      return deletedCount;
    } catch (e) {
      throw DatabaseException('Failed to cleanup orphaned files', e);
    }
  }

  Future<void> _deletePhotoFiles(ProgressPhoto photo) async {
    try {
      final file = File(photo.filePath);
      if (await file.exists()) {
        await file.delete();
      }

      if (photo.thumbnailPath != null) {
        final thumbnailFile = File(photo.thumbnailPath!);
        if (await thumbnailFile.exists()) {
          await thumbnailFile.delete();
        }
      }
    } catch (e) {
      debugPrint('Failed to delete photo files: $e');
    }
  }

  /// Generate thumbnail in isolate
  static Future<String?> _generateThumbnail(Map<String, String> params) async {
    try {
      final sourcePath = params['sourcePath']!;
      final targetDir = params['targetDir']!;
      final id = params['id']!;

      final sourceFile = File(sourcePath);
      final bytes = await sourceFile.readAsBytes();

      final image = img.decodeImage(bytes);
      if (image == null) return null;

      // Create thumbnail (max 200x200)
      final thumbnail = img.copyResize(
        image,
        width: image.width > image.height ? null : 200,
        height: image.width > image.height ? 200 : null,
      );

      final thumbnailPath = '$targetDir/${id}_thumb.jpg';
      final thumbnailFile = File(thumbnailPath);

      await thumbnailFile.writeAsBytes(
        img.encodeJpg(thumbnail, quality: 80),
      );

      return thumbnailPath;
    } catch (e) {
      debugPrint('Thumbnail generation error: $e');
      return null;
    }
  }
}