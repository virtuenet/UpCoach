/// Image optimization utilities
///
/// Provides helpers for optimizing image loading and caching.

import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';

/// Optimized image widget with caching and placeholders
class OptimizedImage extends StatelessWidget {
  final String imageUrl;
  final double? width;
  final double? height;
  final BoxFit fit;
  final Widget? placeholder;
  final Widget? errorWidget;
  final bool enableMemCache;
  final Duration fadeInDuration;

  const OptimizedImage({
    Key? key,
    required this.imageUrl,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.placeholder,
    this.errorWidget,
    this.enableMemCache = true,
    this.fadeInDuration = const Duration(milliseconds: 300),
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return CachedNetworkImage(
      imageUrl: imageUrl,
      width: width,
      height: height,
      fit: fit,
      fadeInDuration: fadeInDuration,
      memCacheWidth: width != null ? (width! * 2).toInt() : null,
      memCacheHeight: height != null ? (height! * 2).toInt() : null,
      maxWidthDiskCache: 1000,
      maxHeightDiskCache: 1000,
      placeholder: (context, url) =>
          placeholder ??
          Container(
            color: Colors.grey[200],
            child: const Center(
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
          ),
      errorWidget: (context, url, error) =>
          errorWidget ??
          Container(
            color: Colors.grey[300],
            child: const Icon(Icons.error_outline, color: Colors.grey),
          ),
    );
  }
}

/// Avatar image with optimal sizing
class OptimizedAvatar extends StatelessWidget {
  final String? imageUrl;
  final double size;
  final String? initials;

  const OptimizedAvatar({
    Key? key,
    this.imageUrl,
    this.size = 40,
    this.initials,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (imageUrl == null || imageUrl!.isEmpty) {
      return CircleAvatar(
        radius: size / 2,
        child: Text(
          initials ?? '?',
          style: TextStyle(fontSize: size / 2.5),
        ),
      );
    }

    return ClipOval(
      child: OptimizedImage(
        imageUrl: imageUrl!,
        width: size,
        height: size,
        fit: BoxFit.cover,
        placeholder: CircleAvatar(
          radius: size / 2,
          child: const CircularProgressIndicator(strokeWidth: 2),
        ),
        errorWidget: CircleAvatar(
          radius: size / 2,
          child: Text(
            initials ?? '?',
            style: TextStyle(fontSize: size / 2.5),
          ),
        ),
      ),
    );
  }
}

/// Thumbnail image for lists
class ThumbnailImage extends StatelessWidget {
  final String imageUrl;
  final double size;
  final BoxFit fit;

  const ThumbnailImage({
    Key? key,
    required this.imageUrl,
    this.size = 80,
    this.fit = BoxFit.cover,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return OptimizedImage(
      imageUrl: imageUrl,
      width: size,
      height: size,
      fit: fit,
      // Aggressive caching for thumbnails
      fadeInDuration: const Duration(milliseconds: 150),
    );
  }
}

/// Hero image for detail pages
class HeroImage extends StatelessWidget {
  final String imageUrl;
  final String heroTag;
  final double? height;

  const HeroImage({
    Key? key,
    required this.imageUrl,
    required this.heroTag,
    this.height,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Hero(
      tag: heroTag,
      child: OptimizedImage(
        imageUrl: imageUrl,
        height: height ?? 250,
        width: double.infinity,
        fit: BoxFit.cover,
      ),
    );
  }
}

/// Image cache manager
class ImageCacheManager {
  static final ImageCacheManager _instance = ImageCacheManager._internal();
  factory ImageCacheManager() => _instance;
  ImageCacheManager._internal();

  /// Clear image cache
  Future<void> clearCache() async {
    // Clear Flutter image cache
    PaintingBinding.instance.imageCache.clear();
    PaintingBinding.instance.imageCache.clearLiveImages();

    // Clear CachedNetworkImage cache
    // Note: Requires cached_network_image package
    // await DefaultCacheManager().emptyCache();
  }

  /// Set cache size limits
  void setCacheLimits({
    int maxMemoryCacheSize = 100,
    int maxMemoryCacheCount = 100,
  }) {
    PaintingBinding.instance.imageCache.maximumSize = maxMemoryCacheCount;
    PaintingBinding.instance.imageCache.maximumSizeBytes =
        maxMemoryCacheSize * 1024 * 1024; // Convert MB to bytes
  }

  /// Get cache statistics
  Map<String, int> getCacheStats() {
    final cache = PaintingBinding.instance.imageCache;
    return {
      'currentSize': cache.currentSize,
      'currentSizeBytes': cache.currentSizeBytes,
      'liveImageCount': cache.liveImageCount,
      'pendingImageCount': cache.pendingImageCount,
    };
  }

  /// Precache images
  Future<void> precacheImages(
    BuildContext context,
    List<String> imageUrls,
  ) async {
    for (final url in imageUrls) {
      try {
        await precacheImage(
          CachedNetworkImageProvider(url),
          context,
        );
      } catch (e) {
        debugPrint('Failed to precache image: $url - $e');
      }
    }
  }
}

/// Image optimization utilities
class ImageOptimizationUtils {
  /// Get optimized image URL with resize parameters
  static String getOptimizedUrl(
    String originalUrl, {
    int? width,
    int? height,
    int quality = 80,
  }) {
    // This would integrate with your CDN/image service
    // Example for Cloudinary, Imgix, or similar services

    final uri = Uri.parse(originalUrl);

    // If using a service that supports query parameters for optimization
    final params = <String, String>{};

    if (width != null) params['w'] = width.toString();
    if (height != null) params['h'] = height.toString();
    params['q'] = quality.toString();
    params['auto'] = 'format'; // Auto-select best format (WebP, etc.)

    return uri.replace(queryParameters: params).toString();
  }

  /// Get thumbnail URL
  static String getThumbnailUrl(String originalUrl, {int size = 200}) {
    return getOptimizedUrl(
      originalUrl,
      width: size,
      height: size,
      quality: 60,
    );
  }

  /// Get responsive image URL based on device pixel ratio
  static String getResponsiveUrl(
    BuildContext context,
    String originalUrl, {
    double? width,
    double? height,
  }) {
    final devicePixelRatio = MediaQuery.of(context).devicePixelRatio;

    final actualWidth = width != null ? (width * devicePixelRatio).toInt() : null;
    final actualHeight = height != null ? (height * devicePixelRatio).toInt() : null;

    return getOptimizedUrl(
      originalUrl,
      width: actualWidth,
      height: actualHeight,
    );
  }

  /// Check if image should be loaded based on connection quality
  static bool shouldLoadImage(BuildContext context) {
    // This would integrate with connectivity monitoring
    // For now, always return true
    // In production, check connection type (WiFi vs cellular, speed, etc.)
    return true;
  }
}
