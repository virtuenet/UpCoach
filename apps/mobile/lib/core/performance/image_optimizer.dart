// Image optimization utilities
//
// Provides helpers for optimizing image loading and caching.

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';

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
    super.key,
    required this.imageUrl,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.placeholder,
    this.errorWidget,
    this.enableMemCache = true,
    this.fadeInDuration = const Duration(milliseconds: 300),
  });

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
    super.key,
    this.imageUrl,
    this.size = 40,
    this.initials,
  });

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
    super.key,
    required this.imageUrl,
    this.size = 80,
    this.fit = BoxFit.cover,
  });

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
    super.key,
    required this.imageUrl,
    required this.heroTag,
    this.height,
  });

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

    final actualWidth =
        width != null ? (width * devicePixelRatio).toInt() : null;
    final actualHeight =
        height != null ? (height * devicePixelRatio).toInt() : null;

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

/// Shimmer placeholder for images
class ShimmerImagePlaceholder extends StatelessWidget {
  final double? width;
  final double? height;
  final double borderRadius;

  const ShimmerImagePlaceholder({
    super.key,
    this.width,
    this.height,
    this.borderRadius = 8,
  });

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: Colors.grey[300],
          borderRadius: BorderRadius.circular(borderRadius),
        ),
      ),
    );
  }
}

/// Progressive image that loads thumbnail first, then full resolution
class ProgressiveImage extends StatefulWidget {
  final String thumbnailUrl;
  final String fullUrl;
  final double? width;
  final double? height;
  final BoxFit fit;

  const ProgressiveImage({
    super.key,
    required this.thumbnailUrl,
    required this.fullUrl,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
  });

  @override
  State<ProgressiveImage> createState() => _ProgressiveImageState();
}

class _ProgressiveImageState extends State<ProgressiveImage> {
  bool _fullImageLoaded = false;

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.passthrough,
      children: [
        // Thumbnail (blurred/low quality)
        if (!_fullImageLoaded)
          CachedNetworkImage(
            imageUrl: widget.thumbnailUrl,
            width: widget.width,
            height: widget.height,
            fit: widget.fit,
            placeholder: (context, url) => ShimmerImagePlaceholder(
              width: widget.width,
              height: widget.height,
            ),
            errorWidget: (context, url, error) => const Icon(Icons.error),
          ),
        // Full resolution image
        CachedNetworkImage(
          imageUrl: widget.fullUrl,
          width: widget.width,
          height: widget.height,
          fit: widget.fit,
          fadeInDuration: const Duration(milliseconds: 300),
          placeholder: (context, url) => const SizedBox.shrink(),
          errorWidget: (context, url, error) => const SizedBox.shrink(),
          imageBuilder: (context, imageProvider) {
            // Mark full image as loaded
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (mounted && !_fullImageLoaded) {
                setState(() => _fullImageLoaded = true);
              }
            });
            return Image(
              image: imageProvider,
              width: widget.width,
              height: widget.height,
              fit: widget.fit,
            );
          },
        ),
      ],
    );
  }
}

/// Lazy-loaded image that only loads when visible
class LazyImage extends StatefulWidget {
  final String imageUrl;
  final double? width;
  final double? height;
  final BoxFit fit;
  final Widget? placeholder;

  const LazyImage({
    super.key,
    required this.imageUrl,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.placeholder,
  });

  @override
  State<LazyImage> createState() => _LazyImageState();
}

class _LazyImageState extends State<LazyImage> {
  bool _shouldLoad = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Check if widget is in viewport
    _checkVisibility();
  }

  void _checkVisibility() {
    // Simple visibility check - loads after first frame
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted && !_shouldLoad) {
        setState(() => _shouldLoad = true);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!_shouldLoad) {
      return widget.placeholder ??
          ShimmerImagePlaceholder(
            width: widget.width,
            height: widget.height,
          );
    }

    return OptimizedImage(
      imageUrl: widget.imageUrl,
      width: widget.width,
      height: widget.height,
      fit: widget.fit,
      placeholder: widget.placeholder,
    );
  }
}

/// Image preloader for upcoming images
class ImagePreloader {
  static final ImagePreloader _instance = ImagePreloader._internal();
  factory ImagePreloader() => _instance;
  ImagePreloader._internal();

  final Set<String> _preloadedUrls = {};
  final Map<String, Completer<void>> _pendingPreloads = {};

  /// Preload a single image
  Future<void> preload(BuildContext context, String url) async {
    if (_preloadedUrls.contains(url)) return;
    if (_pendingPreloads.containsKey(url)) {
      return _pendingPreloads[url]!.future;
    }

    final completer = Completer<void>();
    _pendingPreloads[url] = completer;

    try {
      await precacheImage(CachedNetworkImageProvider(url), context);
      _preloadedUrls.add(url);
      completer.complete();
    } catch (e) {
      debugPrint('Failed to preload image: $url - $e');
      completer.completeError(e);
    } finally {
      _pendingPreloads.remove(url);
    }
  }

  /// Preload multiple images
  Future<void> preloadAll(BuildContext context, List<String> urls) async {
    await Future.wait(
      urls.map((url) => preload(context, url)),
      eagerError: false,
    );
  }

  /// Check if image is preloaded
  bool isPreloaded(String url) => _preloadedUrls.contains(url);

  /// Clear preload cache
  void clear() {
    _preloadedUrls.clear();
  }
}

/// Responsive image that loads different resolutions based on screen
class ResponsiveImage extends StatelessWidget {
  final String baseUrl;
  final double? width;
  final double? height;
  final BoxFit fit;
  final Map<double, String>? breakpointUrls;

  const ResponsiveImage({
    super.key,
    required this.baseUrl,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.breakpointUrls,
  });

  String _getUrlForContext(BuildContext context) {
    if (breakpointUrls == null || breakpointUrls!.isEmpty) {
      return ImageOptimizationUtils.getResponsiveUrl(
        context,
        baseUrl,
        width: width,
        height: height,
      );
    }

    final screenWidth = MediaQuery.of(context).size.width;
    final sortedBreakpoints = breakpointUrls!.keys.toList()..sort();

    for (final breakpoint in sortedBreakpoints.reversed) {
      if (screenWidth >= breakpoint) {
        return breakpointUrls![breakpoint]!;
      }
    }

    return breakpointUrls![sortedBreakpoints.first] ?? baseUrl;
  }

  @override
  Widget build(BuildContext context) {
    return OptimizedImage(
      imageUrl: _getUrlForContext(context),
      width: width,
      height: height,
      fit: fit,
    );
  }
}

/// Blurred placeholder image
class BlurredPlaceholderImage extends StatelessWidget {
  final String imageUrl;
  final String? blurHash;
  final double? width;
  final double? height;
  final BoxFit fit;

  const BlurredPlaceholderImage({
    super.key,
    required this.imageUrl,
    this.blurHash,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
  });

  @override
  Widget build(BuildContext context) {
    return CachedNetworkImage(
      imageUrl: imageUrl,
      width: width,
      height: height,
      fit: fit,
      fadeInDuration: const Duration(milliseconds: 300),
      placeholder: (context, url) {
        // If blur hash provided, could use flutter_blurhash package
        // For now, use shimmer placeholder
        return ShimmerImagePlaceholder(
          width: width,
          height: height,
        );
      },
      errorWidget: (context, url, error) => Container(
        width: width,
        height: height,
        color: Colors.grey[300],
        child: const Icon(Icons.broken_image, color: Colors.grey),
      ),
    );
  }
}
