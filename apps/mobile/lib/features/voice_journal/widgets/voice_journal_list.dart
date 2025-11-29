import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/constants/ui_constants.dart';
import '../providers/voice_journal_provider.dart';
import '../../../shared/models/voice_journal_entry.dart';

class VoiceJournalList extends ConsumerWidget {
  final List<VoiceJournalEntry>? filteredEntries;

  const VoiceJournalList({
    super.key,
    this.filteredEntries,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final voiceJournalState = ref.watch(voiceJournalProvider);
    final entries = filteredEntries ?? voiceJournalState.entries;

    if (entries.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.mic_none,
              size: 80,
              color: Colors.grey.shade400,
            ),
            const SizedBox(height: UIConstants.spacingMD),
            Text(
              filteredEntries != null ? 'No matching journals found' : 'No voice journals yet',
              style: TextStyle(
                fontSize: 18,
                color: Colors.grey.shade600,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: UIConstants.spacingSM),
            Text(
              filteredEntries != null
                  ? 'Try a different search term or check your spelling'
                  : 'Tap the Record tab to create your first voice journal',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade500,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      itemCount: entries.length,
      itemBuilder: (context, index) {
        final entry = entries[index];
        return VoiceJournalCard(entry: entry);
      },
    );
  }
}

class VoiceJournalCard extends ConsumerStatefulWidget {
  final VoiceJournalEntry entry;

  const VoiceJournalCard({
    super.key,
    required this.entry,
  });

  @override
  ConsumerState<VoiceJournalCard> createState() => _VoiceJournalCardState();
}

class _VoiceJournalCardState extends ConsumerState<VoiceJournalCard> {
  bool _isPlaying = false;
  bool _isExpanded = false;

  @override
  Widget build(BuildContext context) {
    final voiceJournalState = ref.watch(voiceJournalProvider);
    
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(UIConstants.radiusLG),
      ),
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Row
            Row(
              children: [
                // Play/Stop Button
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor,
                    shape: BoxShape.circle,
                  ),
                  child: IconButton(
                    icon: Icon(
                      _isPlaying ? Icons.stop : Icons.play_arrow,
                      color: Colors.white,
                    ),
                    onPressed: () => _togglePlayback(),
                  ),
                ),
                
                const SizedBox(width: UIConstants.spacingMD),
                
                // Title and Date
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.entry.title,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: UIConstants.spacingXS),
                      Text(
                        _formatDate(widget.entry.createdAt),
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                ),
                
                // Favorite Button
                IconButton(
                  icon: Icon(
                    widget.entry.isFavorite ? Icons.favorite : Icons.favorite_border,
                    color: widget.entry.isFavorite ? Colors.red : Colors.grey,
                  ),
                  onPressed: () {
                    ref.read(voiceJournalProvider.notifier).toggleFavorite(widget.entry.id);
                  },
                ),
                
                // More Options
                PopupMenuButton<String>(
                  onSelected: (value) => _handleMenuAction(value),
                  itemBuilder: (context) => [
                    const PopupMenuItem(
                      value: 'rename',
                      child: Row(
                        children: [
                          Icon(Icons.edit),
                          SizedBox(width: UIConstants.spacingSM),
                          Text('Rename'),
                        ],
                      ),
                    ),
                    if (!widget.entry.isTranscribed)
                      const PopupMenuItem(
                        value: 'transcribe',
                        child: Row(
                          children: [
                            Icon(Icons.transcribe),
                            SizedBox(width: UIConstants.spacingSM),
                            Text('Transcribe'),
                          ],
                        ),
                      ),
                    const PopupMenuItem(
                      value: 'share',
                      child: Row(
                        children: [
                          Icon(Icons.share),
                          SizedBox(width: UIConstants.spacingSM),
                          Text('Share'),
                        ],
                      ),
                    ),
                    const PopupMenuItem(
                      value: 'delete',
                      child: Row(
                        children: [
                          Icon(Icons.delete, color: Colors.red),
                          SizedBox(width: UIConstants.spacingSM),
                          Text('Delete', style: TextStyle(color: Colors.red)),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
            
            const SizedBox(height: UIConstants.spacingMD),
            
            // Duration and File Size
            Row(
              children: [
                Icon(Icons.access_time, size: 16, color: Colors.grey.shade600),
                const SizedBox(width: UIConstants.spacingXS),
                Text(
                  _formatDuration(Duration(seconds: widget.entry.durationSeconds)),
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey.shade600,
                  ),
                ),
                const SizedBox(width: UIConstants.spacingMD),
                Icon(Icons.storage, size: 16, color: Colors.grey.shade600),
                const SizedBox(width: UIConstants.spacingXS),
                Text(
                  _formatFileSize(widget.entry.fileSizeBytes),
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey.shade600,
                  ),
                ),
                if (widget.entry.isTranscribed) ...[
                  const SizedBox(width: UIConstants.spacingMD),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.green.shade100,
                      borderRadius: BorderRadius.circular(UIConstants.radiusLG),
                      border: Border.all(color: Colors.green.shade300),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.transcribe, size: 12, color: Colors.green.shade700),
                        const SizedBox(width: UIConstants.spacingXS),
                        Text(
                          'Transcribed',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.green.shade700,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
            
            // Transcription (if available and expanded)
            if (widget.entry.isTranscribed && widget.entry.transcriptionText != null) ...[
              const SizedBox(height: UIConstants.spacingMD),
              GestureDetector(
                onTap: () {
                  setState(() {
                    _isExpanded = !_isExpanded;
                  });
                },
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(UIConstants.spacingMD),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    borderRadius: BorderRadius.circular(UIConstants.radiusMD),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.transcribe, size: 16, color: Colors.grey.shade700),
                          const SizedBox(width: UIConstants.spacingXS),
                          Text(
                            'Transcription',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                              color: Colors.grey.shade700,
                            ),
                          ),
                          const Spacer(),
                          if (widget.entry.confidence > 0)
                            Text(
                              '${(widget.entry.confidence * 100).toInt()}% confidence',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey.shade600,
                              ),
                            ),
                          const SizedBox(width: UIConstants.spacingSM),
                          Icon(
                            _isExpanded ? Icons.expand_less : Icons.expand_more,
                            color: Colors.grey.shade600,
                          ),
                        ],
                      ),
                      if (_isExpanded) ...[
                        const SizedBox(height: UIConstants.spacingSM),
                        Text(
                          widget.entry.transcriptionText!,
                          style: const TextStyle(fontSize: 14),
                        ),
                      ] else ...[
                        const SizedBox(height: UIConstants.spacingXS),
                        Text(
                          widget.entry.transcriptionText!,
                          style: const TextStyle(fontSize: 14),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
            
            // Transcription Button (if not transcribed)
            if (!widget.entry.isTranscribed) ...[
              const SizedBox(height: UIConstants.spacingMD),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: voiceJournalState.isTranscribing
                      ? null
                      : () {
                          ref.read(voiceJournalProvider.notifier).transcribeEntry(widget.entry.id);
                        },
                  icon: voiceJournalState.isTranscribing
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.transcribe),
                  label: Text(voiceJournalState.isTranscribing ? 'Transcribing...' : 'Transcribe Audio'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _togglePlayback() {
    if (_isPlaying) {
      ref.read(voiceJournalProvider.notifier).stopPlayback();
      setState(() {
        _isPlaying = false;
      });
    } else {
      ref.read(voiceJournalProvider.notifier).playEntry(widget.entry.id);
      setState(() {
        _isPlaying = true;
      });
      
      // Auto-stop playing after duration (simplified)
      Future.delayed(Duration(seconds: widget.entry.durationSeconds), () {
        if (mounted) {
          setState(() {
            _isPlaying = false;
          });
        }
      });
    }
  }

  void _handleMenuAction(String action) {
    switch (action) {
      case 'rename':
        _showRenameDialog();
        break;
      case 'transcribe':
        ref.read(voiceJournalProvider.notifier).transcribeEntry(widget.entry.id);
        break;
      case 'share':
        _shareEntry();
        break;
      case 'delete':
        _showDeleteDialog();
        break;
    }
  }

  void _showRenameDialog() {
    final controller = TextEditingController(text: widget.entry.title);
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Rename Journal Entry'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(
            labelText: 'Title',
            border: OutlineInputBorder(),
          ),
          maxLength: 100,
        ),
        actions: [
          TextButton(
            onPressed: () => context.pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              ref.read(voiceJournalProvider.notifier).updateEntryTitle(
                widget.entry.id,
                controller.text.trim(),
              );
              context.pop();
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _shareEntry() async {
    try {
      final String shareText = '''
${widget.entry.title}

Recorded on: ${_formatDate(widget.entry.createdAt)}
Duration: ${_formatDuration(Duration(seconds: widget.entry.durationSeconds))}

${widget.entry.transcriptionText?.isNotEmpty == true ? 'Transcription:\n${widget.entry.transcriptionText!}' : 'Voice journal entry from UpCoach'}

---
Created with UpCoach - Your AI-powered coaching companion 🎯
''';

      final box = context.findRenderObject() as RenderBox?;
      await Share.share(
        shareText,
        subject: 'Voice Journal Entry: ${widget.entry.title}',
        sharePositionOrigin: box!.localToGlobal(Offset.zero) & box.size,
      );
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error sharing entry: $e')),
        );
      }
    }
  }

  void _showDeleteDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Journal Entry'),
        content: Text('Are you sure you want to delete "${widget.entry.title}"? This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => context.pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              ref.read(voiceJournalProvider.notifier).deleteEntry(widget.entry.id);
              context.pop();
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays == 0) {
      return 'Today ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    } else if (difference.inDays == 1) {
      return 'Yesterday ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    } else if (difference.inDays < 7) {
      final weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return '${weekdays[date.weekday - 1]} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }

  String _formatDuration(Duration duration) {
    String twoDigits(int n) => n.toString().padLeft(2, '0');
    final minutes = twoDigits(duration.inMinutes);
    final seconds = twoDigits(duration.inSeconds.remainder(60));
    return '$minutes:$seconds';
  }

  String _formatFileSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }
} 