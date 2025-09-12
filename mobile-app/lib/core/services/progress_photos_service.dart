import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:path_provider/path_provider.dart';
import 'package:archive/archive.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:pdf/pdf.dart';
import 'package:image/image.dart' as img;
import 'package:permission_handler/permission_handler.dart';
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
      print('Error deleting image file: $e');
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

  Future<List<ProgressPhoto>> getPhotosByDateRange(DateTime start, DateTime end) async {
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

  Future<String> exportAsPDF(List<ProgressPhoto> photos) async {
    try {
      // Request storage permission
      final storagePermission = await Permission.storage.request();
      if (storagePermission != PermissionStatus.granted) {
        throw Exception('Storage permission is required for PDF export');
      }

      // Create PDF document
      final pdf = pw.Document();
      
      // Add title page
      pdf.addPage(
        pw.Page(
          build: (pw.Context context) => pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Header(
                level: 0,
                child: pw.Text('Progress Photos Report'),
              ),
              pw.Padding(
                padding: const pw.EdgeInsets.only(top: 20),
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text('Generated: ${DateTime.now().toString().split('.')[0]}'),
                    pw.SizedBox(height: 10),
                    pw.Text('Total Photos: ${photos.length}'),
                    pw.SizedBox(height: 10),
                    pw.Text('Categories: ${photos.map((p) => p.category).toSet().join(', ')}'),
                  ],
                ),
              ),
            ],
          ),
        ),
      );

      // Sort photos by date (newest first)
      final sortedPhotos = photos..sort((a, b) => b.takenAt.compareTo(a.takenAt));

      // Add photo pages (process in batches to avoid memory issues)
      for (int i = 0; i < sortedPhotos.length; i += 4) {
        final batch = sortedPhotos.skip(i).take(4).toList();
        
        pdf.addPage(
          pw.Page(
            build: (pw.Context context) => pw.Column(
              children: batch.map((photo) => pw.Container(
                margin: const pw.EdgeInsets.only(bottom: 20),
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text(
                      photo.title ?? 'Untitled',
                      style: pw.TextStyle(
                        fontSize: 16,
                        fontWeight: pw.FontWeight.bold,
                      ),
                    ),
                    pw.SizedBox(height: 5),
                    pw.Text('Category: ${photo.category}'),
                    pw.Text('Date: ${photo.takenAt.toString().split('.')[0]}'),
                    if (photo.notes != null) ...[
                      pw.SizedBox(height: 5),
                      pw.Text('Notes: ${photo.notes}'),
                    ],
                    if (photo.tags.isNotEmpty) ...[
                      pw.SizedBox(height: 5),
                      pw.Text('Tags: ${photo.tags.join(', ')}'),
                    ],
                    pw.Divider(),
                  ],
                ),
              )).toList(),
            ),
          ),
        );
      }

      // Save PDF to device
      final output = await getApplicationDocumentsDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final pdfFile = File('${output.path}/progress_photos_$timestamp.pdf');
      await pdfFile.writeAsBytes(await pdf.save());

      return pdfFile.path;
    } catch (e) {
      throw Exception('Failed to export as PDF: $e');
    }
  }

  Future<String> exportAsZip(List<ProgressPhoto> photos) async {
    try {
      // Request storage permission
      final storagePermission = await Permission.storage.request();
      if (storagePermission != PermissionStatus.granted) {
        throw Exception('Storage permission is required for ZIP export');
      }

      // Create archive
      final archive = Archive();
      
      // Add metadata file
      final metadata = {
        'exportedAt': DateTime.now().toIso8601String(),
        'totalPhotos': photos.length,
        'categories': photos.map((p) => p.category).toSet().toList(),
        'photos': photos.map((p) => {
          'id': p.id,
          'title': p.title,
          'category': p.category,
          'takenAt': p.takenAt.toIso8601String(),
          'notes': p.notes,
          'tags': p.tags,
          'fileName': '${p.id}.jpg', // Standard filename for each photo
        }).toList(),
      };
      
      final metadataJson = jsonEncode(metadata);
      archive.addFile(ArchiveFile('metadata.json', metadataJson.length, metadataJson.codeUnits));

      // Add photo files
      int addedPhotos = 0;
      for (final photo in photos) {
        try {
          final file = File(photo.imagePath);
          if (await file.exists()) {
            final fileBytes = await file.readAsBytes();
            final fileName = '${photo.category}_${photo.id}.jpg';
            archive.addFile(ArchiveFile(fileName, fileBytes.length, fileBytes));
            addedPhotos++;
          }
        } catch (e) {
          print('Failed to add photo ${photo.id} to ZIP: $e');
          // Continue with other photos
        }
      }

      // Encode archive to ZIP
      final zipEncoder = ZipEncoder();
      final zipData = zipEncoder.encode(archive);
      
      if (zipData == null) {
        throw Exception('Failed to create ZIP archive');
      }

      // Save ZIP file
      final output = await getApplicationDocumentsDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final zipFile = File('${output.path}/progress_photos_$timestamp.zip');
      await zipFile.writeAsBytes(zipData);

      return zipFile.path;
    } catch (e) {
      throw Exception('Failed to export as ZIP: $e');
    }
  }

  Future<void> sharePhotos(List<ProgressPhoto> photos, {String shareMethod = 'files'}) async {
    try {
      if (photos.isEmpty) {
        throw Exception('No photos to share');
      }

      // Filter out photos that don't exist
      final validPhotos = <ProgressPhoto>[];
      for (final photo in photos) {
        final file = File(photo.imagePath);
        if (await file.exists()) {
          validPhotos.add(photo);
        }
      }

      if (validPhotos.isEmpty) {
        throw Exception('No valid photo files found to share');
      }

      switch (shareMethod) {
        case 'zip':
          // Export as ZIP and share the ZIP file
          final zipPath = await exportAsZip(validPhotos);
          await _shareFile(zipPath, 'Progress Photos Archive');
          break;
          
        case 'pdf':
          // Export as PDF and share the PDF
          final pdfPath = await exportAsPDF(validPhotos);
          await _shareFile(pdfPath, 'Progress Photos Report');
          break;
          
        case 'files':
        default:
          // Share individual image files
          await _shareImageFiles(validPhotos);
          break;
      }
    } catch (e) {
      throw Exception('Failed to share photos: $e');
    }
  }

  Future<void> _shareImageFiles(List<ProgressPhoto> photos) async {
    try {
      // For platforms that support file sharing, we would use share_plus
      // For now, we'll copy files to a shareable location
      final tempDir = await getTemporaryDirectory();
      final shareDir = Directory('${tempDir.path}/share_photos');
      
      if (await shareDir.exists()) {
        await shareDir.delete(recursive: true);
      }
      await shareDir.create();

      final copiedFiles = <String>[];
      for (int i = 0; i < photos.length; i++) {
        final photo = photos[i];
        final originalFile = File(photo.imagePath);
        
        if (await originalFile.exists()) {
          final fileName = '${photo.category}_${i + 1}_${photo.takenAt.millisecondsSinceEpoch}.jpg';
          final copiedFile = File('${shareDir.path}/$fileName');
          await originalFile.copy(copiedFile.path);
          copiedFiles.add(copiedFile.path);
        }
      }

      if (copiedFiles.isEmpty) {
        throw Exception('No valid photos to share');
      }

      // Here you would use share_plus to share the files
      // For now, just log the success
      print('Prepared ${copiedFiles.length} photos for sharing at: ${shareDir.path}');
      
      // In a real implementation:
      // await Share.shareFiles(copiedFiles, text: 'My Progress Photos');
    } catch (e) {
      throw Exception('Failed to prepare photos for sharing: $e');
    }
  }

  Future<void> _shareFile(String filePath, String subject) async {
    try {
      final file = File(filePath);
      if (!await file.exists()) {
        throw Exception('File not found: $filePath');
      }

      // Here you would use share_plus to share the single file
      print('Prepared file for sharing: $filePath');
      
      // In a real implementation:
      // await Share.shareFiles([filePath], text: subject);
    } catch (e) {
      throw Exception('Failed to share file: $e');
    }
  }

  Future<bool> hasPhotosToShare() async {
    final photos = await getAllPhotos();
    return photos.isNotEmpty;
  }

  Future<Map<String, dynamic>> getShareStatistics() async {
    final photos = await getAllPhotos();
    final validPhotos = <ProgressPhoto>[];
    
    for (final photo in photos) {
      final file = File(photo.imagePath);
      if (await file.exists()) {
        validPhotos.add(photo);
      }
    }

    return {
      'totalPhotos': photos.length,
      'validPhotos': validPhotos.length,
      'invalidPhotos': photos.length - validPhotos.length,
      'categories': validPhotos.map((p) => p.category).toSet().toList(),
      'totalSize': await _calculateTotalSize(validPhotos),
    };
  }

  Future<int> _calculateTotalSize(List<ProgressPhoto> photos) async {
    int totalSize = 0;
    for (final photo in photos) {
      try {
        final file = File(photo.imagePath);
        if (await file.exists()) {
          totalSize += await file.length();
        }
      } catch (e) {
        // Skip files that can't be accessed
      }
    }
    return totalSize;
  }

  Future<List<String>> getAvailableCategories() async {
    final photos = await getAllPhotos();
    return photos.map((p) => p.category).toSet().toList()..sort();
  }

  Future<Map<String, int>> getCategoryStatistics() async {
    final photos = await getAllPhotos();
    final Map<String, int> stats = {};
    
    for (final photo in photos) {
      stats[photo.category] = (stats[photo.category] ?? 0) + 1;
    }
    
    return stats;
  }

  Future<List<ProgressPhoto>> searchPhotos(String query) async {
    final photos = await getAllPhotos();
    final lowerQuery = query.toLowerCase();
    
    return photos.where((photo) {
      return (photo.title?.toLowerCase().contains(lowerQuery) ?? false) ||
             (photo.notes?.toLowerCase().contains(lowerQuery) ?? false) ||
             photo.category.toLowerCase().contains(lowerQuery) ||
             photo.tags.any((tag) => tag.toLowerCase().contains(lowerQuery));
    }).toList();
  }

  Future<void> _savePhotos(List<ProgressPhoto> photos) async {
    final prefs = await SharedPreferences.getInstance();
    final photosJson = photos.map((photo) => jsonEncode(photo.toJson())).toList();
    await prefs.setStringList(_photosKey, photosJson);
  }
}

// Provider
final progressPhotosServiceProvider = Provider<ProgressPhotosService>((ref) {
  return ProgressPhotosService();
}); 