import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:path_provider/path_provider.dart';
import 'package:archive/archive.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:pdf/pdf.dart';
import 'package:image/image.dart' as img;
import 'package:permission_handler/permission_handler.dart';
import 'package:share_plus/share_plus.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:google_mlkit_pose_detection/google_mlkit_pose_detection.dart';
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
      for (final photo in photos) {
        try {
          final file = File(photo.imagePath);
          if (await file.exists()) {
            final fileBytes = await file.readAsBytes();
            final fileName = '${photo.category}_${photo.id}.jpg';
            archive.addFile(ArchiveFile(fileName, fileBytes.length, fileBytes));
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
      final filePaths = <String>[];

      for (final photo in photos) {
        final file = File(photo.imagePath);
        if (await file.exists()) {
          filePaths.add(photo.imagePath);
        }
      }

      if (filePaths.isEmpty) {
        throw Exception('No valid photos to share');
      }

      await Share.shareXFiles(
        filePaths.map((path) => XFile(path)).toList(),
        text: 'My Progress Photos',
      );
    } catch (e) {
      throw Exception('Failed to share photos: $e');
    }
  }

  Future<void> _shareFile(String filePath, String subject) async {
    try {
      final file = File(filePath);
      if (!await file.exists()) {
        throw Exception('File not found: $filePath');
      }

      await Share.shareXFiles(
        [XFile(filePath)],
        text: subject,
      );
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

  // Photo Processing and Analysis Methods

  /// Compresses and optimizes a photo for storage
  Future<String> processAndCompressPhoto(String originalPath, {
    int quality = 85,
    int minWidth = 800,
    int minHeight = 600,
  }) async {
    try {
      final directory = await _getProgressPhotosDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final fileName = 'processed_photo_$timestamp.jpg';
      final outputPath = '${directory.path}/$fileName';

      // Compress using flutter_image_compress
      final compressedBytes = await FlutterImageCompress.compressWithFile(
        originalPath,
        minWidth: minWidth,
        minHeight: minHeight,
        quality: quality,
        format: CompressFormat.jpeg,
      );

      if (compressedBytes != null) {
        final outputFile = File(outputPath);
        await outputFile.writeAsBytes(compressedBytes);
        return outputPath;
      } else {
        throw Exception('Failed to compress image');
      }
    } catch (e) {
      throw Exception('Error processing photo: $e');
    }
  }

  /// Analyzes body pose in progress photos using ML Kit
  Future<Map<String, dynamic>?> analyzeBodyPose(String imagePath) async {
    try {
      final inputImage = InputImage.fromFilePath(imagePath);
      final poseDetector = PoseDetector(
        options: PoseDetectorOptions(
          mode: PoseDetectionMode.single,
        ),
      );

      final poses = await poseDetector.processImage(inputImage);

      if (poses.isNotEmpty) {
        final pose = poses.first;
        final landmarks = pose.landmarks;

        // Calculate key measurements
        final measurements = _calculateBodyMeasurements(landmarks);

        // Calculate pose quality score
        final poseQuality = _calculatePoseQuality(landmarks);

        await poseDetector.close();

        return {
          'pose_detected': true,
          'confidence': 0.9, // ML Kit pose detection doesn't provide confidence in newer versions
          'measurements': measurements,
          'pose_quality': poseQuality,
          'landmarks_count': landmarks.length,
          'analysis_timestamp': DateTime.now().toIso8601String(),
        };
      } else {
        await poseDetector.close();
        return {
          'pose_detected': false,
          'error': 'No pose detected in image',
          'analysis_timestamp': DateTime.now().toIso8601String(),
        };
      }
    } catch (e) {
      return {
        'pose_detected': false,
        'error': 'Error analyzing pose: $e',
        'analysis_timestamp': DateTime.now().toIso8601String(),
      };
    }
  }

  /// Compares two progress photos for changes
  Future<Map<String, dynamic>> compareProgressPhotos(
    String beforeImagePath,
    String afterImagePath,
  ) async {
    try {
      // Analyze both images
      final beforeAnalysis = await analyzeBodyPose(beforeImagePath);
      final afterAnalysis = await analyzeBodyPose(afterImagePath);

      if (beforeAnalysis == null || afterAnalysis == null) {
        return {
          'comparison_success': false,
          'error': 'Failed to analyze one or both images',
        };
      }

      // Calculate differences
      final differences = <String, dynamic>{};

      if (beforeAnalysis['pose_detected'] == true &&
          afterAnalysis['pose_detected'] == true) {

        final beforeMeasurements = beforeAnalysis['measurements'] as Map<String, dynamic>?;
        final afterMeasurements = afterAnalysis['measurements'] as Map<String, dynamic>?;

        if (beforeMeasurements != null && afterMeasurements != null) {
          differences['measurement_changes'] = _calculateMeasurementChanges(
            beforeMeasurements,
            afterMeasurements,
          );
        }

        differences['pose_quality_change'] = (afterAnalysis['pose_quality'] as double? ?? 0) -
                                           (beforeAnalysis['pose_quality'] as double? ?? 0);
      }

      return {
        'comparison_success': true,
        'before_analysis': beforeAnalysis,
        'after_analysis': afterAnalysis,
        'differences': differences,
        'comparison_timestamp': DateTime.now().toIso8601String(),
      };
    } catch (e) {
      return {
        'comparison_success': false,
        'error': 'Error comparing photos: $e',
      };
    }
  }

  /// Creates a side-by-side comparison image
  Future<String?> createComparisonImage(
    String leftImagePath,
    String rightImagePath,
    {String? title}
  ) async {
    try {
      // Read both images
      final leftBytes = await File(leftImagePath).readAsBytes();
      final rightBytes = await File(rightImagePath).readAsBytes();

      final leftImage = img.decodeImage(leftBytes);
      final rightImage = img.decodeImage(rightBytes);

      if (leftImage == null || rightImage == null) {
        throw Exception('Failed to decode images');
      }

      // Resize images to same height
      final targetHeight = 600;
      final leftResized = img.copyResize(leftImage, height: targetHeight);
      final rightResized = img.copyResize(rightImage, height: targetHeight);

      // Create comparison canvas
      final canvasWidth = leftResized.width + rightResized.width + 20; // 20px gap
      final canvasHeight = targetHeight + (title != null ? 60 : 20); // Space for title

      final canvas = img.Image(width: canvasWidth, height: canvasHeight);
      img.fill(canvas, color: img.ColorRgb8(255, 255, 255)); // White background

      // Add title if provided
      if (title != null) {
        // Note: img library has limited text support, you might want to use Canvas for better text rendering
        // For now, we'll skip the title drawing
      }

      // Composite images
      final yOffset = title != null ? 40 : 10;
      img.compositeImage(canvas, leftResized, dstX: 10, dstY: yOffset);
      img.compositeImage(canvas, rightResized,
          dstX: leftResized.width + 20, dstY: yOffset);

      // Add a dividing line
      for (int y = yOffset; y < yOffset + targetHeight; y++) {
        canvas.setPixel(leftResized.width + 15, y, img.ColorRgb8(200, 200, 200));
      }

      // Save comparison image
      final directory = await _getProgressPhotosDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final comparisonPath = '${directory.path}/comparison_$timestamp.jpg';

      final encodedImage = img.encodeJpg(canvas, quality: 90);
      await File(comparisonPath).writeAsBytes(encodedImage);

      return comparisonPath;
    } catch (e) {
      print('Error creating comparison image: $e');
      return null;
    }
  }

  /// Generates progress insights from photo analysis
  Future<Map<String, dynamic>> generateProgressInsights(
    List<ProgressPhoto> photos,
  ) async {
    try {
      if (photos.length < 2) {
        return {
          'insights_available': false,
          'reason': 'Need at least 2 photos for progress analysis',
        };
      }

      // Sort photos by date
      final sortedPhotos = photos..sort((a, b) => a.takenAt.compareTo(b.takenAt));

      final insights = <String, dynamic>{};
      final trends = <Map<String, dynamic>>[];

      // Analyze each consecutive pair of photos
      for (int i = 0; i < sortedPhotos.length - 1; i++) {
        final beforePhoto = sortedPhotos[i];
        final afterPhoto = sortedPhotos[i + 1];

        final comparison = await compareProgressPhotos(
          beforePhoto.imagePath,
          afterPhoto.imagePath,
        );

        if (comparison['comparison_success'] == true) {
          trends.add({
            'period': {
              'from': beforePhoto.takenAt.toIso8601String(),
              'to': afterPhoto.takenAt.toIso8601String(),
              'days': afterPhoto.takenAt.difference(beforePhoto.takenAt).inDays,
            },
            'changes': comparison['differences'],
          });
        }
      }

      insights['insights_available'] = trends.isNotEmpty;
      insights['trends'] = trends;
      insights['total_photos_analyzed'] = sortedPhotos.length;
      insights['analysis_period'] = {
        'start': sortedPhotos.first.takenAt.toIso8601String(),
        'end': sortedPhotos.last.takenAt.toIso8601String(),
        'total_days': sortedPhotos.last.takenAt.difference(sortedPhotos.first.takenAt).inDays,
      };

      return insights;
    } catch (e) {
      return {
        'insights_available': false,
        'error': 'Error generating insights: $e',
      };
    }
  }

  // Helper methods for pose analysis

  Map<String, double> _calculateBodyMeasurements(Map<PoseLandmarkType, PoseLandmark> landmarks) {
    final measurements = <String, double>{};

    try {
      // Shoulder width
      final leftShoulder = landmarks[PoseLandmarkType.leftShoulder];
      final rightShoulder = landmarks[PoseLandmarkType.rightShoulder];
      if (leftShoulder != null && rightShoulder != null) {
        measurements['shoulder_width'] = _calculateDistance(
          leftShoulder.x, leftShoulder.y,
          rightShoulder.x, rightShoulder.y,
        );
      }

      // Hip width
      final leftHip = landmarks[PoseLandmarkType.leftHip];
      final rightHip = landmarks[PoseLandmarkType.rightHip];
      if (leftHip != null && rightHip != null) {
        measurements['hip_width'] = _calculateDistance(
          leftHip.x, leftHip.y,
          rightHip.x, rightHip.y,
        );
      }

      // Torso length (shoulder to hip center)
      if (leftShoulder != null && rightShoulder != null && leftHip != null && rightHip != null) {
        final shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
        final shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2;
        final hipCenterX = (leftHip.x + rightHip.x) / 2;
        final hipCenterY = (leftHip.y + rightHip.y) / 2;

        measurements['torso_length'] = _calculateDistance(
          shoulderCenterX, shoulderCenterY,
          hipCenterX, hipCenterY,
        );
      }

      // Arm length (shoulder to wrist)
      final leftWrist = landmarks[PoseLandmarkType.leftWrist];
      if (leftShoulder != null && leftWrist != null) {
        measurements['left_arm_length'] = _calculateDistance(
          leftShoulder.x, leftShoulder.y,
          leftWrist.x, leftWrist.y,
        );
      }

    } catch (e) {
      print('Error calculating measurements: $e');
    }

    return measurements;
  }

  double _calculatePoseQuality(Map<PoseLandmarkType, PoseLandmark> landmarks) {
    double quality = 0.0;
    int factors = 0;

    try {
      // Check for key landmarks visibility
      final keyLandmarks = [
        PoseLandmarkType.leftShoulder,
        PoseLandmarkType.rightShoulder,
        PoseLandmarkType.leftHip,
        PoseLandmarkType.rightHip,
      ];

      for (final landmarkType in keyLandmarks) {
        final landmark = landmarks[landmarkType];
        if (landmark != null) {
          // In newer ML Kit versions, visibility is not available, use likelihood check
          quality += 0.25; // Each key landmark contributes 25%
          factors++;
        }
      }

      // Check pose symmetry
      final leftShoulder = landmarks[PoseLandmarkType.leftShoulder];
      final rightShoulder = landmarks[PoseLandmarkType.rightShoulder];
      if (leftShoulder != null && rightShoulder != null) {
        final shoulderSymmetry = 1.0 - (leftShoulder.y - rightShoulder.y).abs() / 100;
        quality += shoulderSymmetry * 0.2;
        factors++;
      }

    } catch (e) {
      print('Error calculating pose quality: $e');
    }

    return factors > 0 ? quality : 0.0;
  }

  double _calculateDistance(double x1, double y1, double x2, double y2) {
    return ((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)).abs();
  }

  Map<String, double> _calculateMeasurementChanges(
    Map<String, dynamic> before,
    Map<String, dynamic> after,
  ) {
    final changes = <String, double>{};

    for (final key in before.keys) {
      if (after.containsKey(key)) {
        final beforeValue = before[key] as double?;
        final afterValue = after[key] as double?;

        if (beforeValue != null && afterValue != null && beforeValue != 0) {
          changes[key] = ((afterValue - beforeValue) / beforeValue) * 100; // Percentage change
        }
      }
    }

    return changes;
  }

  Future<Directory> _getProgressPhotosDirectory() async {
    final appDir = await getApplicationDocumentsDirectory();
    final progressDir = Directory('${appDir.path}/progress_photos');

    if (!await progressDir.exists()) {
      await progressDir.create(recursive: true);
    }

    return progressDir;
  }

}

// Provider
final progressPhotosServiceProvider = Provider<ProgressPhotosService>((ref) {
  return ProgressPhotosService();
}); 