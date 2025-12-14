import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';
import '../../../shared/models/progress_photo.dart';
import '../../../core/theme/app_colors.dart';
import '../providers/progress_photos_provider.dart';

class PhotoViewerScreen extends ConsumerStatefulWidget {
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
  ConsumerState<PhotoViewerScreen> createState() => _PhotoViewerScreenState();
}

class _PhotoViewerScreenState extends ConsumerState<PhotoViewerScreen> {
  final TransformationController _transformationController =
      TransformationController();
  late PageController _pageController;
  late int _currentIndex;
  bool _showOverlay = true;
  late List<ProgressPhoto> _photos;

  ProgressPhoto get _currentPhoto => _photos[_currentIndex];

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _photos = List.from(widget.photos);
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
    // Watch for changes in the provider to update local state
    ref.listen<ProgressPhotosState>(progressPhotosProvider, (previous, next) {
      // Update local photos list when provider changes
      final updatedPhotos = <ProgressPhoto>[];
      for (final photo in _photos) {
        final updated = next.photos.firstWhere(
          (p) => p.id == photo.id,
          orElse: () => photo,
        );
        updatedPhotos.add(updated);
      }
      setState(() => _photos = updatedPhotos);
    });

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
            _photos.length > 1
                ? PageView.builder(
                    controller: _pageController,
                    itemCount: _photos.length,
                    onPageChanged: (index) {
                      setState(() => _currentIndex = index);
                    },
                    itemBuilder: (context, index) {
                      return InteractiveViewer(
                        transformationController: _transformationController,
                        minScale: 0.5,
                        maxScale: 4.0,
                        child: Center(
                          child: _buildImage(_photos[index]),
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
            if (_showOverlay && _photos.length > 1)
              Positioned(
                bottom: 120,
                left: 0,
                right: 0,
                child: Center(
                  child: Text(
                    '${_currentIndex + 1} / ${_photos.length}',
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
                _currentPhoto.isFavorite
                    ? Icons.favorite
                    : Icons.favorite_border,
                color:
                    _currentPhoto.isFavorite ? AppColors.error : Colors.white,
              ),
              onPressed: _toggleFavorite,
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
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
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
              if (_currentPhoto.notes != null &&
                  _currentPhoto.notes!.isNotEmpty) ...[
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
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 2),
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

  void _toggleFavorite() {
    ref.read(progressPhotosProvider.notifier).toggleFavorite(_currentPhoto.id);
    // Update local state immediately for responsive UI
    setState(() {
      _photos[_currentIndex] = _currentPhoto.copyWith(
        isFavorite: !_currentPhoto.isFavorite,
      );
    });
  }

  Future<void> _sharePhoto() async {
    final photo = _currentPhoto;
    final imagePath = photo.imagePath;

    try {
      if (imagePath.startsWith('http')) {
        // For network images, share the URL
        await Share.share(
          'Check out my progress photo!\n$imagePath',
          subject: photo.title ?? 'Progress Photo',
        );
      } else {
        // For local files, share the file
        final file = XFile(imagePath);
        await Share.shareXFiles(
          [file],
          text: photo.title ?? 'My progress photo',
          subject: 'Progress Photo',
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to share photo: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
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
                _sharePhoto();
              },
            ),
            ListTile(
              leading: const Icon(Icons.edit),
              title: const Text('Edit'),
              onTap: () {
                Navigator.pop(context);
                _showEditDialog();
              },
            ),
            ListTile(
              leading: const Icon(Icons.delete, color: AppColors.error),
              title: const Text('Delete',
                  style: TextStyle(color: AppColors.error)),
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

  void _showEditDialog() {
    final photo = _currentPhoto;
    final titleController = TextEditingController(text: photo.title ?? '');
    final notesController = TextEditingController(text: photo.notes ?? '');
    String selectedCategory = photo.category;
    List<String> tags = List.from(photo.tags);
    final tagController = TextEditingController();

    final categories = [
      'General',
      'Front',
      'Back',
      'Side',
      'Arms',
      'Legs',
      'Core',
      'Before/After',
    ];

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Edit Photo Details'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextField(
                  controller: titleController,
                  decoration: const InputDecoration(
                    labelText: 'Title',
                    hintText: 'Enter a title for this photo',
                  ),
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: selectedCategory,
                  decoration: const InputDecoration(
                    labelText: 'Category',
                  ),
                  items: categories.map((category) {
                    return DropdownMenuItem(
                      value: category,
                      child: Text(category),
                    );
                  }).toList(),
                  onChanged: (value) {
                    if (value != null) {
                      setDialogState(() => selectedCategory = value);
                    }
                  },
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: notesController,
                  decoration: const InputDecoration(
                    labelText: 'Notes',
                    hintText: 'Add any notes about this photo',
                  ),
                  maxLines: 3,
                ),
                const SizedBox(height: 16),
                const Text(
                  'Tags',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 4,
                  children: [
                    ...tags.map((tag) {
                      return Chip(
                        label: Text(tag),
                        deleteIcon: const Icon(Icons.close, size: 16),
                        onDeleted: () {
                          setDialogState(() => tags.remove(tag));
                        },
                      );
                    }),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: tagController,
                        decoration: const InputDecoration(
                          hintText: 'Add tag',
                          isDense: true,
                        ),
                        onSubmitted: (value) {
                          if (value.isNotEmpty && !tags.contains(value)) {
                            setDialogState(() {
                              tags.add(value);
                              tagController.clear();
                            });
                          }
                        },
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.add),
                      onPressed: () {
                        final value = tagController.text.trim();
                        if (value.isNotEmpty && !tags.contains(value)) {
                          setDialogState(() {
                            tags.add(value);
                            tagController.clear();
                          });
                        }
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () async {
                final updatedPhoto = photo.copyWith(
                  title: titleController.text.isEmpty
                      ? null
                      : titleController.text,
                  category: selectedCategory,
                  notes: notesController.text.isEmpty
                      ? null
                      : notesController.text,
                  tags: tags,
                  updatedAt: DateTime.now(),
                );

                final success = await ref
                    .read(progressPhotosProvider.notifier)
                    .updatePhoto(updatedPhoto);

                if (!context.mounted) return;

                if (success) {
                  setState(() {
                    _photos[_currentIndex] = updatedPhoto;
                  });
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Photo updated successfully'),
                    ),
                  );
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Failed to update photo'),
                      backgroundColor: AppColors.error,
                    ),
                  );
                }
              },
              child: const Text('Save'),
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
            onPressed: () async {
              final photoId = _currentPhoto.id;
              final navigator = Navigator.of(this.context);
              final scaffoldMessenger = ScaffoldMessenger.of(this.context);
              Navigator.pop(context);

              final success = await ref
                  .read(progressPhotosProvider.notifier)
                  .deletePhoto(photoId);

              if (!mounted) return;

              if (success) {
                navigator.pop(true); // Return true to indicate deletion
              } else {
                scaffoldMessenger.showSnackBar(
                  const SnackBar(
                    content: Text('Failed to delete photo'),
                    backgroundColor: AppColors.error,
                  ),
                );
              }
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
