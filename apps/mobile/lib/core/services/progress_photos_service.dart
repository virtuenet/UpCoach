import 'package:flutter/foundation.dart';
import 'dart:convert';
import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../shared/models/progress_photo.dart';

class ProgressPhotosService {
  static const String _photosKey = 'progress_photos';

  Future<List<ProgressPhoto>> getAllPhotos() async {
    final prefs = await SharedPreferences.getInstance();
    final photosJson = prefs.getStringList(_photosKey) ?? [];

    return photosJson.map((jsonString) {
      final json = jsonDecode(jsonString) as Map<String, dynamic>;
      return ProgressPhoto.fromJson(json);
    }).toList();
  }

  Future<ProgressPhoto> addPhoto(ProgressPhoto photo) async {
    final existingPhotos = await getAllPhotos();

    existingPhotos.add(photo);
    await _savePhotos(existingPhotos);

    return photo;
  }

  Future<void> updatePhoto(ProgressPhoto photo) async {
    final existingPhotos = await getAllPhotos();
    final index = existingPhotos.indexWhere((p) => p.id == photo.id);

    if (index != -1) {
      existingPhotos[index] = photo.copyWith(updatedAt: DateTime.now());
      await _savePhotos(existingPhotos);
    }
  }

  Future<void> deletePhoto(String photoId) async {
    final existingPhotos = await getAllPhotos();
    final photo = existingPhotos.firstWhere((p) => p.id == photoId);

    // Delete the actual image file
    try {
      final file = File(photo.imagePath);
      if (await file.exists()) {
        await file.delete();
      }
    } catch (e) {
      debugPrint('Error deleting image file: $e');
    }

    // Remove from list
    existingPhotos.removeWhere((p) => p.id == photoId);
    await _savePhotos(existingPhotos);
  }

  Future<ProgressPhoto?> getPhotoById(String photoId) async {
    final photos = await getAllPhotos();
    try {
      return photos.firstWhere((p) => p.id == photoId);
    } catch (e) {
      return null;
    }
  }

  Future<List<ProgressPhoto>> getPhotosByCategory(String category) async {
    final allPhotos = await getAllPhotos();
    return allPhotos.where((p) => p.category == category).toList();
  }

  Future<List<ProgressPhoto>> getPhotosByDateRange(
      DateTime start, DateTime end) async {
    final allPhotos = await getAllPhotos();
    return allPhotos.where((p) {
      return p.takenAt.isAfter(start) && p.takenAt.isBefore(end);
    }).toList();
  }

  Future<Map<String, dynamic>> exportPhotos() async {
    final photos = await getAllPhotos();

    return {
      'photos': photos.map((p) => p.toJson()).toList(),
      'exportedAt': DateTime.now().toIso8601String(),
      'version': '1.0',
    };
  }

  Future<void> importPhotos(Map<String, dynamic> data) async {
    try {
      if (data['photos'] != null) {
        final photos = (data['photos'] as List)
            .map((json) => ProgressPhoto.fromJson(json as Map<String, dynamic>))
            .toList();
        await _savePhotos(photos);
      }
    } catch (e) {
      throw Exception('Failed to import photos: $e');
    }
  }

  Future<void> _savePhotos(List<ProgressPhoto> photos) async {
    final prefs = await SharedPreferences.getInstance();
    final photosJson =
        photos.map((photo) => jsonEncode(photo.toJson())).toList();
    await prefs.setStringList(_photosKey, photosJson);
  }
}

// Provider
final progressPhotosServiceProvider = Provider<ProgressPhotosService>((ref) {
  return ProgressPhotosService();
});
