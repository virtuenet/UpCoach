import 'dart:io';
import 'package:flutter/material.dart';
import '../../../shared/models/progress_photo.dart';
import '../../../shared/widgets/custom_app_bar.dart';
import '../../../core/theme/app_colors.dart';

class PhotoViewerScreen extends StatefulWidget {
  final List<ProgressPhoto> photos;
  final int initialIndex;

  const PhotoViewerScreen({
    super.key,
    required this.photos,
    this.initialIndex = 0,
  });

  /// Convenience constructor for single photo
  factory PhotoViewerScreen.single({
    Key? key,
    required ProgressPhoto photo,
  }) {
    return PhotoViewerScreen(
      key: key,
      photos: [photo],
      initialIndex: 0,
    );
  }

  @override
  State<PhotoViewerScreen> createState() => _PhotoViewerScreenState();
}

class _PhotoViewerScreenState extends State<PhotoViewerScreen> {
  final TransformationController _transformationController = TransformationController();
  late PageController _pageController;
  late int _currentIndex;
  bool _showOverlay = true;

  ProgressPhoto get _currentPhoto => widget.photos[_currentIndex];

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _pageController = PageController(initialPage: _currentIndex);
  }

  @override
  void dispose() {
    _transformationController.dispose();
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: GestureDetector(
        onTap: () {
          setState(() => _showOverlay = !_showOverlay);
        },
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Image viewer with PageView for gallery support
            widget.photos.length > 1
                ? PageView.builder(
                    controller: _pageController,
                    itemCount: widget.photos.length,
                    onPageChanged: (index) {
                      setState(() => _currentIndex = index);
                    },
                    itemBuilder: (context, index) {
                      return InteractiveViewer(
                        transformationController: _transformationController,
                        minScale: 0.5,
                        maxScale: 4.0,
                        child: Center(
                          child: _buildImage(widget.photos[index]),
                        ),
                      );
                    },
                  )
                : InteractiveViewer(
                    transformationController: _transformationController,
                    minScale: 0.5,
                    maxScale: 4.0,
                    child: Center(
                      child: _buildImage(_currentPhoto),
                    ),
                  ),
            // Top overlay
            if (_showOverlay)
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                child: _buildTopOverlay(),
              ),
            // Bottom overlay with details
            if (_showOverlay)
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: _buildBottomOverlay(),
              ),
            // Page indicator for gallery
            if (_showOverlay && widget.photos.length > 1)
              Positioned(
                bottom: 120,
                left: 0,
                right: 0,
                child: Center(
                  child: Text(
                    '${_currentIndex + 1} / ${widget.photos.length}',
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 14,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildImage(ProgressPhoto photo) {
    final imagePath = photo.imagePath;

    if (imagePath.startsWith('http')) {
      return Image.network(
        imagePath,
        fit: BoxFit.contain,
        errorBuilder: (context, error, stackTrace) => _buildErrorWidget(),
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) return child;
          return Center(
            child: CircularProgressIndicator(
              value: loadingProgress.expectedTotalBytes != null
                  ? loadingProgress.cumulativeBytesLoaded /
                      loadingProgress.expectedTotalBytes!
                  : null,
              color: Colors.white,
            ),
          );
        },
      );
    } else {
      return Image.file(
        File(imagePath),
        fit: BoxFit.contain,
        errorBuilder: (context, error, stackTrace) => _buildErrorWidget(),
      );
    }
  }

  Widget _buildErrorWidget() {
    return const Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.broken_image, size: 64, color: Colors.white54),
        SizedBox(height: 16),
        Text(
          'Failed to load image',
          style: TextStyle(color: Colors.white54),
        ),
      ],
    );
  }

  Widget _buildTopOverlay() {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Colors.black.withValues(alpha: 0.7),
            Colors.transparent,
          ],
        ),
      ),
      child: SafeArea(
        child: Row(
          children: [
            IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.white),
              onPressed: () => Navigator.pop(context),
            ),
            Expanded(
              child: Text(
                _currentPhoto.title ?? 'Progress Photo',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            IconButton(
              icon: Icon(
                _currentPhoto.isFavorite ? Icons.favorite : Icons.favorite_border,
                color: _currentPhoto.isFavorite ? AppColors.error : Colors.white,
              ),
              onPressed: () {
                // TODO: Toggle favorite
              },
            ),
            IconButton(
              icon: const Icon(Icons.more_vert, color: Colors.white),
              onPressed: () {
                _showOptionsMenu();
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomOverlay() {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.bottomCenter,
          end: Alignment.topCenter,
          colors: [
            Colors.black.withValues(alpha: 0.7),
            Colors.transparent,
          ],
        ),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.8),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      _currentPhoto.category,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    _formatDate(_currentPhoto.takenAt),
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
              if (_currentPhoto.notes != null && _currentPhoto.notes!.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  _currentPhoto.notes!,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                  ),
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
              if (_currentPhoto.tags.isNotEmpty) ...[
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 4,
                  children: _currentPhoto.tags.map((tag) {
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '#$tag',
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 12,
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  void _showOptionsMenu() {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.share),
              title: const Text('Share'),
              onTap: () {
                Navigator.pop(context);
                // TODO: Share photo
              },
            ),
            ListTile(
              leading: const Icon(Icons.edit),
              title: const Text('Edit'),
              onTap: () {
                Navigator.pop(context);
                // TODO: Edit photo details
              },
            ),
            ListTile(
              leading: const Icon(Icons.delete, color: AppColors.error),
              title: const Text('Delete', style: TextStyle(color: AppColors.error)),
              onTap: () {
                Navigator.pop(context);
                _showDeleteConfirmation();
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showDeleteConfirmation() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Photo'),
        content: const Text('Are you sure you want to delete this photo?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(context, true); // Return true to indicate deletion
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
