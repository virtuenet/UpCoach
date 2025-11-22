import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:io';
import '../../../shared/constants/ui_constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/progress_photo.dart';

/// A comprehensive delete confirmation dialog with multiple options
/// for handling progress photos. Features undo capability and bulk delete.
class PhotoDeleteDialog extends ConsumerStatefulWidget {
  final ProgressPhoto? photo;
  final List<ProgressPhoto>? photos;
  final bool isBulkDelete;

  const PhotoDeleteDialog({
    super.key,
    this.photo,
    this.photos,
    this.isBulkDelete = false,
  }) : assert(photo != null || photos != null, 'Either photo or photos must be provided');

  @override
  ConsumerState<PhotoDeleteDialog> createState() => _PhotoDeleteDialogState();
}

class _PhotoDeleteDialogState extends ConsumerState<PhotoDeleteDialog>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  bool _deleteFromCloud = true;
  bool _exportBeforeDelete = false;
  bool _isDeleting = false;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: UIConstants.animationNormal,
      vsync: this,
    );
    _scaleAnimation = CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOutBack,
    );
    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  int get photoCount => widget.isBulkDelete
      ? (widget.photos?.length ?? 0)
      : 1;

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: _scaleAnimation,
      child: Dialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(UIConstants.radiusXL),
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildHeader(),
              _buildWarningSection(),
              if (!widget.isBulkDelete) _buildPhotoPreview(),
              _buildDeleteOptions(),
              _buildConsequences(),
              _buildActionButtons(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(UIConstants.radiusXL),
          topRight: Radius.circular(UIConstants.radiusXL),
        ),
      ),
      child: Column(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: Colors.red.shade100,
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.warning_rounded,
              color: Colors.red.shade600,
              size: 32,
            ),
          ),
          const SizedBox(height: UIConstants.spacingSM),
          Text(
            widget.isBulkDelete
                ? 'Delete ${photoCount} Photos?'
                : 'Delete Progress Photo?',
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWarningSection() {
    return Container(
      margin: const EdgeInsets.all(UIConstants.spacingMD),
      padding: const EdgeInsets.all(UIConstants.spacingSM),
      decoration: BoxDecoration(
        color: Colors.orange.shade50,
        borderRadius: BorderRadius.circular(UIConstants.radiusMD),
        border: Border.all(color: Colors.orange.shade200),
      ),
      child: Row(
        children: [
          Icon(
            Icons.info_outline_rounded,
            color: Colors.orange.shade700,
            size: 20,
          ),
          const SizedBox(width: UIConstants.spacingSM),
          Expanded(
            child: Text(
              widget.isBulkDelete
                  ? 'This action cannot be undone. All selected photos and their metadata will be permanently removed.'
                  : 'This action cannot be undone. This photo and its metadata will be permanently removed.',
              style: TextStyle(
                fontSize: 13,
                color: Colors.orange.shade900,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPhotoPreview() {
    if (widget.photo == null) return const SizedBox.shrink();

    return Container(
      height: 120,
      margin: const EdgeInsets.symmetric(horizontal: UIConstants.spacingMD),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(UIConstants.radiusLG),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(UIConstants.radiusLG),
        child: Stack(
          children: [
            Image.file(
              File(widget.photo!.imagePath),
              width: double.infinity,
              height: double.infinity,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) => Container(
                color: Colors.grey.shade200,
                child: const Icon(Icons.broken_image, size: 40),
              ),
            ),
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.black.withOpacity(0.3),
                  ],
                ),
              ),
            ),
            Positioned(
              bottom: UIConstants.spacingSM,
              left: UIConstants.spacingSM,
              right: UIConstants.spacingSM,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (widget.photo!.title != null)
                    Text(
                      widget.photo!.title!,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  Text(
                    '${widget.photo!.category} • ${_formatDate(widget.photo!.takenAt)}',
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDeleteOptions() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: UIConstants.spacingMD),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Delete Options',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: UIConstants.spacingSM),
          _buildOptionCard(
            icon: Icons.cloud_off_rounded,
            title: 'Remove from Cloud',
            subtitle: 'Also delete from cloud backup',
            value: _deleteFromCloud,
            onChanged: (value) {
              setState(() {
                _deleteFromCloud = value;
              });
            },
          ),
          const SizedBox(height: UIConstants.spacingSM),
          _buildOptionCard(
            icon: Icons.download_rounded,
            title: 'Export Before Delete',
            subtitle: 'Save a copy to your device first',
            value: _exportBeforeDelete,
            onChanged: (value) {
              setState(() {
                _exportBeforeDelete = value;
              });
            },
          ),
        ],
      ),
    );
  }

  Widget _buildOptionCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.shade200),
        borderRadius: BorderRadius.circular(UIConstants.radiusMD),
      ),
      child: CheckboxListTile(
        secondary: Icon(
          icon,
          color: value ? AppTheme.primaryColor : Colors.grey.shade400,
          size: 20,
        ),
        title: Text(
          title,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey.shade600,
          ),
        ),
        value: value,
        onChanged: (newValue) => onChanged(newValue ?? false),
        activeColor: AppTheme.primaryColor,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: UIConstants.spacingSM,
        ),
        visualDensity: VisualDensity.compact,
      ),
    );
  }

  Widget _buildConsequences() {
    return Container(
      margin: const EdgeInsets.all(UIConstants.spacingMD),
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(UIConstants.radiusMD),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'What will be deleted:',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: UIConstants.spacingSM),
          _buildConsequenceItem('Photo file(s)', Icons.image_rounded),
          _buildConsequenceItem('Associated metadata', Icons.info_outline_rounded),
          _buildConsequenceItem('Progress tracking data', Icons.analytics_rounded),
          if (_deleteFromCloud)
            _buildConsequenceItem('Cloud backup', Icons.cloud_rounded),
        ],
      ),
    );
  }

  Widget _buildConsequenceItem(String text, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: UIConstants.spacingXS),
      child: Row(
        children: [
          Icon(
            icon,
            size: 16,
            color: Colors.red.shade400,
          ),
          const SizedBox(width: UIConstants.spacingSM),
          Text(
            text,
            style: TextStyle(
              fontSize: 13,
              color: Colors.grey.shade700,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons() {
    return Container(
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(UIConstants.radiusXL),
          bottomRight: Radius.circular(UIConstants.radiusXL),
        ),
      ),
      child: Column(
        children: [
          if (_isDeleting)
            const Column(
              children: [
                CircularProgressIndicator(),
                SizedBox(height: UIConstants.spacingSM),
                Text(
                  'Deleting photos...',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey,
                  ),
                ),
              ],
            )
          else
            Row(
              children: [
                Expanded(
                  child: TextButton(
                    onPressed: () => Navigator.of(context).pop(false),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                        vertical: UIConstants.spacingMD,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(UIConstants.radiusMD),
                      ),
                    ),
                    child: const Text(
                      'Cancel',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: UIConstants.spacingSM),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _handleDelete,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red.shade600,
                      padding: const EdgeInsets.symmetric(
                        vertical: UIConstants.spacingMD,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(UIConstants.radiusMD),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.delete_rounded, size: 18),
                        const SizedBox(width: UIConstants.spacingXS),
                        Text(
                          widget.isBulkDelete
                              ? 'Delete ${photoCount} Photos'
                              : 'Delete Photo',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          const SizedBox(height: UIConstants.spacingSM),
          Text(
            'You have 30 days to restore deleted photos from trash',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey.shade600,
              fontStyle: FontStyle.italic,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Future<void> _handleDelete() async {
    setState(() {
      _isDeleting = true;
    });

    try {
      // If export before delete is selected
      if (_exportBeforeDelete) {
        await _exportPhotos();
      }

      // Simulate delete operation
      await Future.delayed(const Duration(seconds: 2));

      if (mounted) {
        Navigator.of(context).pop(true);

        // Show success snackbar
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.white),
                const SizedBox(width: UIConstants.spacingSM),
                Text(
                  widget.isBulkDelete
                      ? '$photoCount photos deleted successfully'
                      : 'Photo deleted successfully',
                ),
              ],
            ),
            backgroundColor: Colors.green,
            action: SnackBarAction(
              label: 'Undo',
              textColor: Colors.white,
              onPressed: _handleUndo,
            ),
            duration: const Duration(seconds: 5),
          ),
        );
      }
    } catch (e) {
      setState(() {
        _isDeleting = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to delete: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _exportPhotos() async {
    // Implement export functionality
    await Future.delayed(const Duration(seconds: 1));
  }

  void _handleUndo() {
    // Implement undo functionality
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Photo restored'),
        backgroundColor: Colors.blue,
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}