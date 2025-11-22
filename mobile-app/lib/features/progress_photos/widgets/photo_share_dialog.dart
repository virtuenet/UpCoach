import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';
import 'dart:io';
import '../../../shared/constants/ui_constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/progress_photo.dart';

/// A comprehensive share dialog for progress photos with multiple sharing options
/// and privacy controls. Designed with accessibility and intuitive user flow in mind.
class PhotoShareDialog extends ConsumerStatefulWidget {
  final ProgressPhoto photo;
  final List<ProgressPhoto>? additionalPhotos;

  const PhotoShareDialog({
    super.key,
    required this.photo,
    this.additionalPhotos,
  });

  @override
  ConsumerState<PhotoShareDialog> createState() => _PhotoShareDialogState();
}

class _PhotoShareDialogState extends ConsumerState<PhotoShareDialog> {
  bool _includeMetadata = true;
  bool _includeWatermark = false;
  bool _shareAsComparison = false;
  String _privacyLevel = 'friends';
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
        borderRadius: BorderRadius.circular(UIConstants.radiusXL),
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildHeader(),
            _buildPhotoPreview(),
            _buildShareOptions(),
            _buildPrivacySettings(),
            _buildCaption(),
            _buildActionButtons(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      decoration: BoxDecoration(
        color: AppTheme.primaryColor.withOpacity(0.1),
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(UIConstants.radiusXL),
          topRight: Radius.circular(UIConstants.radiusXL),
        ),
      ),
      child: Row(
        children: [
          Icon(
            Icons.share_rounded,
            color: AppTheme.primaryColor,
            size: 24,
          ),
          const SizedBox(width: UIConstants.spacingSM),
          const Expanded(
            child: Text(
              'Share Progress Photo',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.close_rounded),
            onPressed: () => Navigator.of(context).pop(),
            visualDensity: VisualDensity.compact,
          ),
        ],
      ),
    );
  }

  Widget _buildPhotoPreview() {
    return Container(
      height: 200,
      margin: const EdgeInsets.all(UIConstants.spacingMD),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(UIConstants.radiusLG),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(UIConstants.radiusLG),
        child: Stack(
          children: [
            Image.file(
              File(widget.photo.imagePath),
              width: double.infinity,
              height: double.infinity,
              fit: BoxFit.cover,
            ),
            if (_includeWatermark)
              Positioned(
                bottom: UIConstants.spacingSM,
                right: UIConstants.spacingSM,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: UIConstants.spacingSM,
                    vertical: UIConstants.spacingXS,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.7),
                    borderRadius: BorderRadius.circular(UIConstants.radiusSM),
                  ),
                  child: const Text(
                    'UpCoach',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildShareOptions() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: UIConstants.spacingMD),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Share Options',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: UIConstants.spacingSM),
          _buildOptionTile(
            title: 'Include Details',
            subtitle: 'Share date, category, and notes',
            value: _includeMetadata,
            onChanged: (value) {
              setState(() {
                _includeMetadata = value;
              });
            },
          ),
          _buildOptionTile(
            title: 'Add Watermark',
            subtitle: 'Protect your photo with UpCoach branding',
            value: _includeWatermark,
            onChanged: (value) {
              setState(() {
                _includeWatermark = value;
              });
            },
          ),
          if (widget.additionalPhotos != null && widget.additionalPhotos!.isNotEmpty)
            _buildOptionTile(
              title: 'Share as Comparison',
              subtitle: 'Create before/after comparison',
              value: _shareAsComparison,
              onChanged: (value) {
                setState(() {
                  _shareAsComparison = value;
                });
              },
            ),
        ],
      ),
    );
  }

  Widget _buildOptionTile({
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: UIConstants.spacingXS),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.shade200),
        borderRadius: BorderRadius.circular(UIConstants.radiusMD),
      ),
      child: SwitchListTile(
        title: Text(
          title,
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
        ),
        subtitle: Text(
          subtitle,
          style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
        ),
        value: value,
        onChanged: onChanged,
        activeColor: AppTheme.primaryColor,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: UIConstants.spacingSM,
        ),
        visualDensity: VisualDensity.compact,
      ),
    );
  }

  Widget _buildPrivacySettings() {
    return Padding(
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Privacy',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: UIConstants.spacingSM),
          Container(
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey.shade300),
              borderRadius: BorderRadius.circular(UIConstants.radiusMD),
            ),
            child: Column(
              children: [
                _buildPrivacyOption(
                  'public',
                  'Public',
                  'Anyone can see this',
                  Icons.public_rounded,
                ),
                Divider(height: 1, color: Colors.grey.shade200),
                _buildPrivacyOption(
                  'friends',
                  'Friends Only',
                  'Only your connections',
                  Icons.people_rounded,
                ),
                Divider(height: 1, color: Colors.grey.shade200),
                _buildPrivacyOption(
                  'private',
                  'Private Link',
                  'Share with specific people',
                  Icons.link_rounded,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPrivacyOption(
    String value,
    String title,
    String subtitle,
    IconData icon,
  ) {
    final isSelected = _privacyLevel == value;
    return InkWell(
      onTap: () {
        setState(() {
          _privacyLevel = value;
        });
      },
      child: Container(
        padding: const EdgeInsets.all(UIConstants.spacingSM),
        color: isSelected ? AppTheme.primaryColor.withOpacity(0.05) : null,
        child: Row(
          children: [
            Icon(
              icon,
              size: 20,
              color: isSelected ? AppTheme.primaryColor : Colors.grey.shade600,
            ),
            const SizedBox(width: UIConstants.spacingSM),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: isSelected ? AppTheme.primaryColor : Colors.black87,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
                    ),
                  ),
                ],
              ),
            ),
            if (isSelected)
              Icon(
                Icons.check_circle_rounded,
                size: 20,
                color: AppTheme.primaryColor,
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildCaption() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: UIConstants.spacingMD),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Add Caption (Optional)',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: UIConstants.spacingSM),
          TextField(
            controller: _captionController,
            maxLines: 3,
            maxLength: 280,
            decoration: InputDecoration(
              hintText: 'Share your progress story...',
              hintStyle: TextStyle(color: Colors.grey.shade400),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(UIConstants.radiusMD),
                borderSide: BorderSide(color: Colors.grey.shade300),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(UIConstants.radiusMD),
                borderSide: BorderSide(color: AppTheme.primaryColor, width: 2),
              ),
              contentPadding: const EdgeInsets.all(UIConstants.spacingSM),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons() {
    return Padding(
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      child: Column(
        children: [
          // Quick share platforms
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildPlatformButton(
                icon: Icons.message_rounded,
                label: 'Message',
                color: const Color(0xFF25D366),
                onTap: () => _shareToWhatsApp(),
              ),
              _buildPlatformButton(
                icon: Icons.camera_alt_rounded,
                label: 'Instagram',
                color: const Color(0xFFE4405F),
                onTap: () => _shareToInstagram(),
              ),
              _buildPlatformButton(
                icon: Icons.facebook_rounded,
                label: 'Facebook',
                color: const Color(0xFF1877F2),
                onTap: () => _shareToFacebook(),
              ),
              _buildPlatformButton(
                icon: Icons.more_horiz_rounded,
                label: 'More',
                color: Colors.grey.shade600,
                onTap: () => _showMoreOptions(),
              ),
            ],
          ),
          const SizedBox(height: UIConstants.spacingMD),
          // Main action buttons
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => Navigator.of(context).pop(),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(
                      vertical: UIConstants.spacingMD,
                    ),
                    side: BorderSide(color: Colors.grey.shade300),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(UIConstants.radiusMD),
                    ),
                  ),
                  child: const Text('Cancel'),
                ),
              ),
              const SizedBox(width: UIConstants.spacingSM),
              Expanded(
                child: ElevatedButton(
                  onPressed: _handleShare,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryColor,
                    padding: const EdgeInsets.symmetric(
                      vertical: UIConstants.spacingMD,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(UIConstants.radiusMD),
                    ),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.share_rounded, size: 18),
                      SizedBox(width: UIConstants.spacingXS),
                      Text('Share'),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPlatformButton({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(UIConstants.radiusMD),
      child: Container(
        padding: const EdgeInsets.all(UIConstants.spacingSM),
        child: Column(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(height: UIConstants.spacingXS),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey.shade700,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handleShare() async {
    try {
      String message = '';

      if (_includeMetadata) {
        message = 'Check out my progress!\n';
        if (widget.photo.title != null) {
          message += '${widget.photo.title}\n';
        }
        message += 'Category: ${widget.photo.category}\n';
        message += 'Date: ${_formatDate(widget.photo.takenAt)}\n';
        if (widget.photo.notes != null) {
          message += '\n${widget.photo.notes}\n';
        }
      }

      if (_captionController.text.isNotEmpty) {
        message += '\n${_captionController.text}';
      }

      await Share.shareXFiles(
        [XFile(widget.photo.imagePath)],
        text: message.isEmpty ? null : message,
      );

      if (mounted) {
        Navigator.of(context).pop(true);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to share: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _shareToWhatsApp() {
    // Implement WhatsApp specific sharing
    _handleShare();
  }

  void _shareToInstagram() {
    // Implement Instagram specific sharing
    _handleShare();
  }

  void _shareToFacebook() {
    // Implement Facebook specific sharing
    _handleShare();
  }

  void _showMoreOptions() {
    // Show additional sharing options
    _handleShare();
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}