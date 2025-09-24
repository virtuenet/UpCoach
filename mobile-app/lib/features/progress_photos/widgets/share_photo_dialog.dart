import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/services.dart';
import 'dart:io';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/progress_photo.dart';

class SharePhotoDialog extends StatefulWidget {
  final ProgressPhoto photo;
  final Function(ShareOptions) onShare;

  const SharePhotoDialog({
    Key? key,
    required this.photo,
    required this.onShare,
  }) : super(key: key);

  @override
  State<SharePhotoDialog> createState() => _SharePhotoDialogState();
}

class _SharePhotoDialogState extends State<SharePhotoDialog> {
  ShareOptions _selectedOptions = ShareOptions();
  final TextEditingController _captionController = TextEditingController();

  @override
  void dispose() {
    _captionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24),
      ),
      child: Container(
        padding: const EdgeInsets.all(20),
        constraints: const BoxConstraints(maxWidth: 400),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header
            Row(
              children: [
                const Icon(
                  CupertinoIcons.share,
                  color: AppTheme.primaryColor,
                  size: 24,
                ),
                const SizedBox(width: 12),
                const Text(
                  'Share Progress',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Photo Preview
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: AspectRatio(
                aspectRatio: 16 / 9,
                child: widget.photo.imagePath != null
                    ? Image.file(
                        File(widget.photo.imagePath!),
                        fit: BoxFit.cover,
                      )
                    : Container(
                        color: Colors.grey.shade200,
                        child: const Icon(
                          CupertinoIcons.photo,
                          size: 48,
                          color: Colors.grey,
                        ),
                      ),
              ),
            ),
            const SizedBox(height: 16),

            // Caption Input
            TextField(
              controller: _captionController,
              maxLines: 3,
              decoration: InputDecoration(
                hintText: 'Add a caption...',
                hintStyle: TextStyle(color: Colors.grey.shade500),
                filled: true,
                fillColor: Colors.grey.shade50,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.all(12),
              ),
              onChanged: (value) {
                setState(() {
                  _selectedOptions.caption = value;
                });
              },
            ),
            const SizedBox(height: 16),

            // Privacy Options
            const Text(
              'Share with:',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),

            _buildShareOption(
              title: 'Community',
              subtitle: 'Share with the UpCoach community',
              icon: CupertinoIcons.person_3_fill,
              value: _selectedOptions.shareToCommunity,
              onChanged: (value) {
                setState(() {
                  _selectedOptions.shareToCommunity = value ?? false;
                });
              },
            ),

            _buildShareOption(
              title: 'My Coach',
              subtitle: 'Share with your personal coach',
              icon: CupertinoIcons.person_badge_plus,
              value: _selectedOptions.shareToCoach,
              onChanged: (value) {
                setState(() {
                  _selectedOptions.shareToCoach = value ?? false;
                });
              },
            ),

            _buildShareOption(
              title: 'Export to Gallery',
              subtitle: 'Save to your device gallery',
              icon: CupertinoIcons.square_arrow_down,
              value: _selectedOptions.exportToGallery,
              onChanged: (value) {
                setState(() {
                  _selectedOptions.exportToGallery = value ?? false;
                });
              },
            ),
            const SizedBox(height: 16),

            // Include Metrics Toggle
            SwitchListTile(
              title: const Text(
                'Include Metrics',
                style: TextStyle(fontSize: 14),
              ),
              subtitle: Text(
                'Add weight and body fat data',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey.shade600,
                ),
              ),
              value: _selectedOptions.includeMetrics,
              onChanged: (value) {
                setState(() {
                  _selectedOptions.includeMetrics = value;
                });
              },
              contentPadding: EdgeInsets.zero,
              activeColor: AppTheme.primaryColor,
            ),
            const SizedBox(height: 20),

            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: TextButton(
                    onPressed: () => Navigator.pop(context),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(color: Colors.grey.shade300),
                      ),
                    ),
                    child: const Text(
                      'Cancel',
                      style: TextStyle(color: Colors.grey),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: ElevatedButton(
                    onPressed: _canShare() ? _handleShare : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'Share',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildShareOption({
    required String title,
    required String subtitle,
    required IconData icon,
    required bool value,
    required Function(bool?) onChanged,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: value ? AppTheme.primaryColor.withOpacity(0.05) : Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: value ? AppTheme.primaryColor : Colors.transparent,
          width: 1.5,
        ),
      ),
      child: CheckboxListTile(
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
        secondary: Icon(
          icon,
          color: value ? AppTheme.primaryColor : Colors.grey.shade400,
          size: 20,
        ),
        value: value,
        onChanged: onChanged,
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        activeColor: AppTheme.primaryColor,
        checkboxShape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(4),
        ),
      ),
    );
  }

  bool _canShare() {
    return _selectedOptions.shareToCommunity ||
        _selectedOptions.shareToCoach ||
        _selectedOptions.exportToGallery;
  }

  void _handleShare() {
    HapticFeedback.mediumImpact();
    widget.onShare(_selectedOptions);
    Navigator.pop(context);

    // Show success feedback
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Row(
          children: [
            Icon(Icons.check_circle, color: Colors.white),
            SizedBox(width: 8),
            Text('Photo shared successfully!'),
          ],
        ),
        backgroundColor: Colors.green,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
        duration: const Duration(seconds: 2),
      ),
    );
  }
}

class ShareOptions {
  bool shareToCommunity = false;
  bool shareToCoach = false;
  bool exportToGallery = false;
  bool includeMetrics = true;
  String? caption;

  ShareOptions({
    this.shareToCommunity = false,
    this.shareToCoach = false,
    this.exportToGallery = false,
    this.includeMetrics = true,
    this.caption,
  });
}