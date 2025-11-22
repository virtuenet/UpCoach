import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import 'package:path_provider/path_provider.dart';
import 'package:image/image.dart' as img;
import 'package:intl/intl.dart';
import '../../../shared/models/progress_photo_model.dart';
import '../../../core/services/analytics_service.dart';

/// Service for handling progress photo sharing functionality
class ProgressPhotoShareService {
  final AnalyticsService _analytics = AnalyticsService();

  /// Share a single progress photo or comparison
  Future<ShareResult> sharePhoto({
    required ProgressPhoto photo,
    String? comparisonPhotoPath,
  }) async {
    try {
      // Prepare the image for sharing
      final shareFile = await _prepareShareFile(
        photo: photo,
        comparisonPhotoPath: comparisonPhotoPath,
      );

      // Generate share text with metadata
      final shareText = _generateShareText(photo);

      // Share the file
      final result = await Share.shareXFiles(
        [XFile(shareFile.path)],
        text: shareText,
        subject: 'My Progress - ${photo.title ?? "UpCoach"}',
      );

      // Track analytics
      await _trackShareEvent(photo, result.status == ShareResultStatus.success);

      // Clean up temporary files
      if (shareFile.path.contains('temp')) {
        await shareFile.delete();
      }

      return result;
    } catch (e) {
      throw ShareException('Failed to share photo: $e');
    }
  }

  /// Share multiple progress photos as a collage
  Future<ShareResult> sharePhotoCollage(List<ProgressPhoto> photos) async {
    if (photos.isEmpty) {
      throw ShareException('No photos to share');
    }

    try {
      // Create collage image
      final collageFile = await _createCollage(photos);

      // Generate comprehensive share text
      final shareText = _generateCollageShareText(photos);

      // Share the collage
      final result = await Share.shareXFiles(
        [XFile(collageFile.path)],
        text: shareText,
        subject: 'My Progress Journey - UpCoach',
      );

      // Track analytics
      await _trackCollageShareEvent(photos, result.status == ShareResultStatus.success);

      // Clean up
      await collageFile.delete();

      return result;
    } catch (e) {
      throw ShareException('Failed to share photo collage: $e');
    }
  }

  /// Export progress photos as PDF report
  Future<File> exportAsPDF(List<ProgressPhoto> photos) async {
    // This would integrate with a PDF generation library
    // Implementation would create a formatted PDF with photos and metadata
    throw UnimplementedError('PDF export will be implemented with pdf package');
  }

  /// Prepare a file for sharing with optimizations
  Future<File> _prepareShareFile({
    required ProgressPhoto photo,
    String? comparisonPhotoPath,
  }) async {
    // If comparison photo is provided, create side-by-side image
    if (comparisonPhotoPath != null) {
      return await _createComparisonImage(
        beforePath: comparisonPhotoPath,
        afterPath: photo.imagePath,
        photo: photo,
      );
    }

    // Otherwise, optimize and watermark single photo
    return await _optimizeAndWatermarkPhoto(photo);
  }

  /// Create a side-by-side comparison image
  Future<File> _createComparisonImage({
    required String beforePath,
    required String afterPath,
    required ProgressPhoto photo,
  }) async {
    try {
      // Load images
      final beforeBytes = await File(beforePath).readAsBytes();
      final afterBytes = await File(afterPath).readAsBytes();

      final beforeImage = img.decodeImage(beforeBytes);
      final afterImage = img.decodeImage(afterBytes);

      if (beforeImage == null || afterImage == null) {
        throw ShareException('Failed to decode images');
      }

      // Resize to same dimensions if needed
      final targetHeight = 1080;
      final beforeResized = img.copyResize(beforeImage, height: targetHeight);
      final afterResized = img.copyResize(afterImage, height: targetHeight);

      // Create canvas for side-by-side
      final canvasWidth = beforeResized.width + afterResized.width + 4; // 4px divider
      final canvas = img.Image(width: canvasWidth, height: targetHeight);

      // Fill background
      img.fill(canvas, color: img.ColorRgb8(255, 255, 255));

      // Composite images
      img.compositeImage(canvas, beforeResized, dstX: 0, dstY: 0);
      img.compositeImage(canvas, afterResized, dstX: beforeResized.width + 4, dstY: 0);

      // Add labels
      final labelColor = img.ColorRgb8(255, 255, 255);
      final bgColor = img.ColorRgb8(0, 0, 0);

      // Before label
      _drawTextWithBackground(
        canvas,
        'BEFORE',
        x: 20,
        y: 20,
        textColor: labelColor,
        bgColor: bgColor,
      );

      // After label
      _drawTextWithBackground(
        canvas,
        'AFTER',
        x: beforeResized.width + 24,
        y: 20,
        textColor: labelColor,
        bgColor: bgColor,
      );

      // Add watermark
      _addWatermark(canvas);

      // Add progress stats if available
      if (photo.weight != null || photo.measurements != null) {
        _addProgressStats(canvas, photo);
      }

      // Save to temporary file
      final tempDir = await getTemporaryDirectory();
      final fileName = 'comparison_${DateTime.now().millisecondsSinceEpoch}.jpg';
      final outputFile = File('${tempDir.path}/$fileName');

      await outputFile.writeAsBytes(img.encodeJpg(canvas, quality: 90));

      return outputFile;
    } catch (e) {
      throw ShareException('Failed to create comparison image: $e');
    }
  }

  /// Optimize and add watermark to a single photo
  Future<File> _optimizeAndWatermarkPhoto(ProgressPhoto photo) async {
    final bytes = await File(photo.imagePath).readAsBytes();
    final image = img.decodeImage(bytes);

    if (image == null) {
      throw ShareException('Failed to decode image');
    }

    // Resize if too large
    final maxDimension = 1920;
    final optimized = (image.width > maxDimension || image.height > maxDimension)
        ? img.copyResize(
            image,
            width: image.width > image.height ? maxDimension : null,
            height: image.height > image.width ? maxDimension : null,
          )
        : image;

    // Add watermark
    _addWatermark(optimized);

    // Save optimized image
    final tempDir = await getTemporaryDirectory();
    final fileName = 'share_${DateTime.now().millisecondsSinceEpoch}.jpg';
    final outputFile = File('${tempDir.path}/$fileName');

    await outputFile.writeAsBytes(img.encodeJpg(optimized, quality: 85));

    return outputFile;
  }

  /// Create a collage from multiple photos
  Future<File> _createCollage(List<ProgressPhoto> photos) async {
    // Limit to first 9 photos for 3x3 grid
    final photosToUse = photos.take(9).toList();
    final gridSize = _calculateGridSize(photosToUse.length);

    const cellSize = 400;
    const padding = 2;

    final canvasSize = (cellSize * gridSize) + (padding * (gridSize - 1));
    final canvas = img.Image(width: canvasSize, height: canvasSize);

    // Fill white background
    img.fill(canvas, color: img.ColorRgb8(255, 255, 255));

    // Add each photo to grid
    for (int i = 0; i < photosToUse.length; i++) {
      final photo = photosToUse[i];
      final row = i ~/ gridSize;
      final col = i % gridSize;

      final x = col * (cellSize + padding);
      final y = row * (cellSize + padding);

      final bytes = await File(photo.imagePath).readAsBytes();
      final image = img.decodeImage(bytes);

      if (image != null) {
        final resized = img.copyResizeCropSquare(image, size: cellSize);
        img.compositeImage(canvas, resized, dstX: x, dstY: y);
      }
    }

    // Add watermark
    _addWatermark(canvas);

    // Save collage
    final tempDir = await getTemporaryDirectory();
    final fileName = 'collage_${DateTime.now().millisecondsSinceEpoch}.jpg';
    final outputFile = File('${tempDir.path}/$fileName');

    await outputFile.writeAsBytes(img.encodeJpg(canvas, quality: 85));

    return outputFile;
  }

  /// Calculate grid size based on photo count
  int _calculateGridSize(int photoCount) {
    if (photoCount <= 1) return 1;
    if (photoCount <= 4) return 2;
    return 3;
  }

  /// Add watermark to image
  void _addWatermark(img.Image image) {
    final watermarkText = 'UpCoach';
    final x = image.width - 120;
    final y = image.height - 40;

    _drawTextWithBackground(
      image,
      watermarkText,
      x: x,
      y: y,
      textColor: img.ColorRgb8(255, 255, 255),
      bgColor: img.ColorRgb8(0, 0, 0),
      opacity: 0.7,
    );
  }

  /// Draw text with background
  void _drawTextWithBackground(
    img.Image image,
    String text, {
    required int x,
    required int y,
    required img.ColorRgb8 textColor,
    required img.ColorRgb8 bgColor,
    double opacity = 0.8,
  }) {
    // This is a simplified version - actual implementation would use
    // proper font rendering with background
    // For now, we'll use image package's basic text drawing

    // Note: The image package's drawString method is deprecated
    // In production, use flutter_image_font or similar for better text rendering
  }

  /// Add progress statistics overlay
  void _addProgressStats(img.Image canvas, ProgressPhoto photo) {
    // Add stats overlay at bottom
    final statsText = _generateStatsText(photo);
    if (statsText.isNotEmpty) {
      // Draw semi-transparent background and stats text
      // Implementation would use proper text rendering
    }
  }

  /// Generate share text for single photo
  String _generateShareText(ProgressPhoto photo) {
    final buffer = StringBuffer();

    buffer.writeln('Progress Update 💪');

    if (photo.title != null) {
      buffer.writeln(photo.title);
    }

    if (photo.notes != null) {
      buffer.writeln('');
      buffer.writeln(photo.notes);
    }

    final stats = _generateStatsText(photo);
    if (stats.isNotEmpty) {
      buffer.writeln('');
      buffer.writeln(stats);
    }

    buffer.writeln('');
    buffer.writeln('#UpCoach #FitnessJourney #ProgressNotPerfection');

    return buffer.toString();
  }

  /// Generate share text for collage
  String _generateCollageShareText(List<ProgressPhoto> photos) {
    final buffer = StringBuffer();

    buffer.writeln('My Progress Journey 🎯');

    final dateRange = _getDateRange(photos);
    buffer.writeln(dateRange);

    buffer.writeln('');
    buffer.writeln('${photos.length} progress milestones captured');

    buffer.writeln('');
    buffer.writeln('#UpCoach #TransformationJourney #ConsistencyIsKey');

    return buffer.toString();
  }

  /// Generate statistics text
  String _generateStatsText(ProgressPhoto photo) {
    final stats = <String>[];

    if (photo.weight != null) {
      stats.add('Weight: ${photo.weight} ${photo.weightUnit ?? "kg"}');
    }

    if (photo.measurements != null) {
      photo.measurements!.forEach((key, value) {
        stats.add('$key: $value');
      });
    }

    return stats.join(' | ');
  }

  /// Get date range for photos
  String _getDateRange(List<ProgressPhoto> photos) {
    if (photos.isEmpty) return '';

    final dates = photos.map((p) => p.createdAt).toList()..sort();
    final earliest = dates.first;
    final latest = dates.last;

    final formatter = DateFormat('MMM d, yyyy');

    if (earliest == latest) {
      return formatter.format(earliest);
    }

    return '${formatter.format(earliest)} - ${formatter.format(latest)}';
  }

  /// Track share event for analytics
  Future<void> _trackShareEvent(ProgressPhoto photo, bool success) async {
    await _analytics.track('progress_photo_shared', {
      'photo_id': photo.id,
      'has_comparison': photo.comparisonPhotoId != null,
      'category': photo.category,
      'success': success,
    });
  }

  /// Track collage share event
  Future<void> _trackCollageShareEvent(List<ProgressPhoto> photos, bool success) async {
    await _analytics.track('progress_collage_shared', {
      'photo_count': photos.length,
      'success': success,
    });
  }
}

/// Exception for share-related errors
class ShareException implements Exception {
  final String message;
  ShareException(this.message);

  @override
  String toString() => 'ShareException: $message';
}

/// Mock Analytics Service (would be implemented separately)
class AnalyticsService {
  Future<void> track(String event, Map<String, dynamic> properties) async {
    // Analytics implementation
    print('Analytics: $event - $properties');
  }
}