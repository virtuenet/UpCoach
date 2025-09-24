import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';
import '../../../shared/constants/ui_constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/voice_journal_entry.dart';

/// A beautifully designed bottom sheet for sharing voice journal entries
/// with transcription options and multiple export formats.
class VoiceJournalShareSheet extends ConsumerStatefulWidget {
  final VoiceJournalEntry entry;

  const VoiceJournalShareSheet({
    super.key,
    required this.entry,
  });

  @override
  ConsumerState<VoiceJournalShareSheet> createState() => _VoiceJournalShareSheetState();
}

class _VoiceJournalShareSheetState extends ConsumerState<VoiceJournalShareSheet>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _slideAnimation;

  String _selectedFormat = 'audio';
  bool _includeTranscription = true;
  bool _includeEmotions = true;
  bool _anonymize = false;
  bool _isProcessing = false;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: UIConstants.animationNormal,
      vsync: this,
    );
    _slideAnimation = CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOutCubic,
    );
    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SlideTransition(
      position: _slideAnimation.drive(
        Tween(
          begin: const Offset(0, 1),
          end: Offset.zero,
        ),
      ),
      child: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(UIConstants.radiusXL),
            topRight: Radius.circular(UIConstants.radiusXL),
          ),
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildHandle(),
              _buildHeader(),
              _buildEntryPreview(),
              _buildFormatSelector(),
              _buildShareOptions(),
              _buildPrivacyOptions(),
              _buildShareButtons(),
              SizedBox(height: MediaQuery.of(context).padding.bottom + UIConstants.spacingMD),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHandle() {
    return Center(
      child: Container(
        width: 40,
        height: 4,
        margin: const EdgeInsets.only(top: UIConstants.spacingSM),
        decoration: BoxDecoration(
          color: Colors.grey.shade300,
          borderRadius: BorderRadius.circular(2),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.share_rounded,
              color: AppTheme.primaryColor,
              size: 24,
            ),
          ),
          const SizedBox(width: UIConstants.spacingMD),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Share Voice Journal',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  'Choose how you want to share',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey.shade600,
                  ),
                ),
              ],
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

  Widget _buildEntryPreview() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: UIConstants.spacingMD),
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppTheme.primaryColor.withOpacity(0.05),
            AppTheme.primaryColor.withOpacity(0.1),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(UIConstants.radiusLG),
        border: Border.all(
          color: AppTheme.primaryColor.withOpacity(0.2),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.mic_rounded,
                color: AppTheme.primaryColor,
                size: 20,
              ),
              const SizedBox(width: UIConstants.spacingSM),
              Text(
                widget.entry.title ?? 'Voice Journal Entry',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: UIConstants.spacingSM),
          Row(
            children: [
              _buildInfoChip(
                Icons.calendar_today_rounded,
                _formatDate(widget.entry.recordedAt),
              ),
              const SizedBox(width: UIConstants.spacingSM),
              _buildInfoChip(
                Icons.timer_rounded,
                _formatDuration(widget.entry.duration),
              ),
              if (widget.entry.mood != null) ...[
                const SizedBox(width: UIConstants.spacingSM),
                _buildInfoChip(
                  Icons.mood_rounded,
                  widget.entry.mood!,
                ),
              ],
            ],
          ),
          if (widget.entry.transcription != null) ...[
            const SizedBox(height: UIConstants.spacingMD),
            Container(
              padding: const EdgeInsets.all(UIConstants.spacingSM),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.8),
                borderRadius: BorderRadius.circular(UIConstants.radiusMD),
              ),
              child: Text(
                widget.entry.transcription!,
                style: TextStyle(
                  fontSize: 13,
                  color: Colors.grey.shade700,
                  height: 1.4,
                ),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildInfoChip(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: UIConstants.spacingSM,
        vertical: UIConstants.spacingXS,
      ),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.8),
        borderRadius: BorderRadius.circular(UIConstants.radiusSM),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: AppTheme.primaryColor),
          const SizedBox(width: UIConstants.spacingXS),
          Text(
            label,
            style: const TextStyle(fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildFormatSelector() {
    return Padding(
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Export Format',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: UIConstants.spacingSM),
          Row(
            children: [
              Expanded(
                child: _buildFormatOption(
                  'audio',
                  'Audio',
                  Icons.audiotrack_rounded,
                  'MP3/WAV',
                ),
              ),
              const SizedBox(width: UIConstants.spacingSM),
              Expanded(
                child: _buildFormatOption(
                  'text',
                  'Text',
                  Icons.text_snippet_rounded,
                  'TXT/PDF',
                ),
              ),
              const SizedBox(width: UIConstants.spacingSM),
              Expanded(
                child: _buildFormatOption(
                  'both',
                  'Both',
                  Icons.library_books_rounded,
                  'Audio + Text',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFormatOption(
    String value,
    String title,
    IconData icon,
    String subtitle,
  ) {
    final isSelected = _selectedFormat == value;
    return InkWell(
      onTap: () {
        setState(() {
          _selectedFormat = value;
        });
      },
      borderRadius: BorderRadius.circular(UIConstants.radiusMD),
      child: Container(
        padding: const EdgeInsets.all(UIConstants.spacingSM),
        decoration: BoxDecoration(
          color: isSelected
              ? AppTheme.primaryColor.withOpacity(0.1)
              : Colors.grey.shade50,
          borderRadius: BorderRadius.circular(UIConstants.radiusMD),
          border: Border.all(
            color: isSelected
                ? AppTheme.primaryColor
                : Colors.grey.shade300,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            Icon(
              icon,
              color: isSelected ? AppTheme.primaryColor : Colors.grey.shade600,
              size: 24,
            ),
            const SizedBox(height: UIConstants.spacingXS),
            Text(
              title,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: isSelected ? AppTheme.primaryColor : Colors.black87,
              ),
            ),
            Text(
              subtitle,
              style: TextStyle(
                fontSize: 11,
                color: Colors.grey.shade600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildShareOptions() {
    if (_selectedFormat == 'audio') return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: UIConstants.spacingMD),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Include in Export',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: UIConstants.spacingSM),
          _buildToggleOption(
            'Full Transcription',
            'Include complete text transcript',
            Icons.format_quote_rounded,
            _includeTranscription,
            (value) {
              setState(() {
                _includeTranscription = value;
              });
            },
          ),
          const SizedBox(height: UIConstants.spacingSM),
          _buildToggleOption(
            'Emotion Analysis',
            'Include detected emotions and mood',
            Icons.psychology_rounded,
            _includeEmotions,
            (value) {
              setState(() {
                _includeEmotions = value;
              });
            },
          ),
        ],
      ),
    );
  }

  Widget _buildPrivacyOptions() {
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
          _buildToggleOption(
            'Anonymize Content',
            'Remove personal identifiers',
            Icons.privacy_tip_rounded,
            _anonymize,
            (value) {
              setState(() {
                _anonymize = value;
              });
            },
          ),
        ],
      ),
    );
  }

  Widget _buildToggleOption(
    String title,
    String subtitle,
    IconData icon,
    bool value,
    ValueChanged<bool> onChanged,
  ) {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.shade200),
        borderRadius: BorderRadius.circular(UIConstants.radiusMD),
      ),
      child: SwitchListTile(
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
        onChanged: onChanged,
        activeColor: AppTheme.primaryColor,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: UIConstants.spacingSM,
          vertical: 0,
        ),
        visualDensity: VisualDensity.compact,
      ),
    );
  }

  Widget _buildShareButtons() {
    return Padding(
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      child: Column(
        children: [
          if (_isProcessing) ...[
            const CircularProgressIndicator(),
            const SizedBox(height: UIConstants.spacingSM),
            const Text(
              'Preparing your journal...',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey,
              ),
            ),
          ] else ...[
            // Platform-specific share buttons
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildQuickShareButton(
                  Icons.email_rounded,
                  'Email',
                  Colors.blue,
                  _shareViaEmail,
                ),
                _buildQuickShareButton(
                  Icons.cloud_upload_rounded,
                  'Cloud',
                  Colors.green,
                  _shareToCloud,
                ),
                _buildQuickShareButton(
                  Icons.message_rounded,
                  'Message',
                  Colors.orange,
                  _shareViaMessage,
                ),
                _buildQuickShareButton(
                  Icons.folder_rounded,
                  'Save',
                  Colors.purple,
                  _saveToDevice,
                ),
              ],
            ),
            const SizedBox(height: UIConstants.spacingMD),
            // Main share button
            SizedBox(
              width: double.infinity,
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
                  elevation: 2,
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.share_rounded, size: 20),
                    SizedBox(width: UIConstants.spacingSM),
                    Text(
                      'Share Journal',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildQuickShareButton(
    IconData icon,
    String label,
    Color color,
    VoidCallback onTap,
  ) {
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
    setState(() {
      _isProcessing = true;
    });

    try {
      // Prepare content based on selected format
      String content = '';

      if (_selectedFormat != 'audio') {
        content = _prepareTextContent();
      }

      await Future.delayed(const Duration(seconds: 1)); // Simulate processing

      // Share using Share Plus
      if (_selectedFormat == 'audio' || _selectedFormat == 'both') {
        // Share audio file
        await Share.shareXFiles(
          [XFile(widget.entry.audioPath)],
          text: content.isEmpty ? null : content,
        );
      } else {
        // Share text only
        await Share.share(content);
      }

      if (mounted) {
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to share: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isProcessing = false;
        });
      }
    }
  }

  String _prepareTextContent() {
    final buffer = StringBuffer();

    buffer.writeln('Voice Journal Entry');
    buffer.writeln('=' * 30);
    buffer.writeln();

    if (widget.entry.title != null && !_anonymize) {
      buffer.writeln('Title: ${widget.entry.title}');
    }

    buffer.writeln('Date: ${_formatDate(widget.entry.recordedAt)}');
    buffer.writeln('Duration: ${_formatDuration(widget.entry.duration)}');

    if (widget.entry.mood != null && _includeEmotions) {
      buffer.writeln('Mood: ${widget.entry.mood}');
    }

    if (widget.entry.transcription != null && _includeTranscription) {
      buffer.writeln();
      buffer.writeln('Transcription:');
      buffer.writeln('-' * 30);
      buffer.writeln(widget.entry.transcription);
    }

    if (_includeEmotions && widget.entry.emotions != null) {
      buffer.writeln();
      buffer.writeln('Detected Emotions:');
      for (final emotion in widget.entry.emotions!) {
        buffer.writeln('• $emotion');
      }
    }

    buffer.writeln();
    buffer.writeln('Shared from UpCoach');

    return buffer.toString();
  }

  void _shareViaEmail() {
    // Implement email sharing
    _handleShare();
  }

  void _shareToCloud() {
    // Implement cloud sharing
    _handleShare();
  }

  void _shareViaMessage() {
    // Implement message sharing
    _handleShare();
  }

  void _saveToDevice() {
    // Implement save to device
    _handleShare();
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year} at ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }

  String _formatDuration(Duration duration) {
    final minutes = duration.inMinutes;
    final seconds = duration.inSeconds % 60;
    return '${minutes}m ${seconds}s';
  }
}