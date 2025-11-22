import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/constants/ui_constants.dart';
import '../providers/voice_journal_provider.dart';
import '../widgets/voice_recording_widget.dart';
import '../widgets/voice_journal_list.dart';
import '../widgets/voice_journal_statistics.dart';

class VoiceJournalScreen extends ConsumerStatefulWidget {
  const VoiceJournalScreen({super.key});

  @override
  ConsumerState<VoiceJournalScreen> createState() => _VoiceJournalScreenState();
}

class _VoiceJournalScreenState extends ConsumerState<VoiceJournalScreen>
    with TickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  bool _isSearching = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final voiceJournalState = ref.watch(voiceJournalProvider);
    
    return Scaffold(
      backgroundColor: AppTheme.lightBackground,
      appBar: AppBar(
        title: _isSearching
            ? TextField(
                controller: _searchController,
                decoration: const InputDecoration(
                  hintText: 'Search voice journals...',
                  border: InputBorder.none,
                  hintStyle: TextStyle(color: Colors.white70),
                ),
                style: const TextStyle(color: Colors.white),
                autofocus: true,
                onChanged: (value) {
                  ref.read(voiceJournalProvider.notifier).performSearch(value);
                },
              )
            : const Text('Voice Journal'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          if (_isSearching)
            IconButton(
              icon: const Icon(Icons.close),
              onPressed: () {
                setState(() {
                  _isSearching = false;
                  _searchController.clear();
                });
              },
            )
          else
            IconButton(
              icon: const Icon(Icons.search),
              onPressed: () {
                setState(() {
                  _isSearching = true;
                });
              },
            ),
          PopupMenuButton<String>(
            onSelected: (value) {
              switch (value) {
                case 'settings':
                  _showSettingsDialog();
                  break;
                case 'export':
                  _exportJournals();
                  break;
                case 'import':
                  _importJournals();
                  break;
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'settings',
                child: Row(
                  children: [
                    Icon(Icons.settings),
                    SizedBox(width: UIConstants.spacingSM),
                    Text('Settings'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'export',
                child: Row(
                  children: [
                    Icon(Icons.file_download),
                    SizedBox(width: UIConstants.spacingSM),
                    Text('Export'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'import',
                child: Row(
                  children: [
                    Icon(Icons.file_upload),
                    SizedBox(width: UIConstants.spacingSM),
                    Text('Import'),
                  ],
                ),
              ),
            ],
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Record', icon: Icon(Icons.mic)),
            Tab(text: 'Journals', icon: Icon(Icons.list)),
            Tab(text: 'Statistics', icon: Icon(Icons.analytics)),
          ],
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Recording Tab
          const VoiceRecordingWidget(),
          
          // Journals List Tab
          Column(
            children: [
              if (voiceJournalState.error != null)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(UIConstants.spacingMD),
                  margin: const EdgeInsets.all(UIConstants.spacingMD),
                  decoration: BoxDecoration(
                    color: Colors.red.shade100,
                    borderRadius: BorderRadius.circular(UIConstants.radiusMD),
                    border: Border.all(color: Colors.red.shade300),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.error, color: Colors.red.shade700),
                      const SizedBox(width: UIConstants.spacingSM),
                      Expanded(
                        child: Text(
                          voiceJournalState.error!,
                          style: TextStyle(color: Colors.red.shade700),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () {
                          ref.read(voiceJournalProvider.notifier).clearError();
                        },
                      ),
                    ],
                  ),
                ),
              Expanded(
                child: voiceJournalState.isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : const VoiceJournalList(),
              ),
            ],
          ),
          
          // Statistics Tab
          const VoiceJournalStatistics(),
        ],
      ),
      floatingActionButton: _tabController.index == 0
          ? null
          : FloatingActionButton(
              onPressed: () {
                _tabController.animateTo(0);
              },
              backgroundColor: AppTheme.primaryColor,
              child: const Icon(Icons.mic, color: Colors.white),
            ),
    );
  }

  void _showSettingsDialog() {
    final voiceJournalState = ref.read(voiceJournalProvider);
    bool autoTranscribe = true; // Default setting
    bool highQualityAudio = false; // Default setting
    bool cloudSyncEnabled = voiceJournalState.isCloudSyncEnabled;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Voice Journal Settings'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SwitchListTile(
                  title: const Text('Auto Transcription'),
                  subtitle: const Text('Automatically transcribe recordings'),
                  value: autoTranscribe,
                  onChanged: (value) {
                    setState(() {
                      autoTranscribe = value;
                    });
                    // Save to preferences
                    _updateAutoTranscribeSetting(value);
                  },
                ),
                const Divider(),
                SwitchListTile(
                  title: const Text('High Quality Audio'),
                  subtitle: const Text('Record in higher quality (larger files)'),
                  value: highQualityAudio,
                  onChanged: (value) {
                    setState(() {
                      highQualityAudio = value;
                    });
                    // Save to preferences
                    _updateAudioQualitySetting(value);
                  },
                ),
                const Divider(),
                SwitchListTile(
                  title: const Text('Cloud Sync'),
                  subtitle: const Text('Sync journals across devices'),
                  value: cloudSyncEnabled,
                  onChanged: (value) async {
                    setState(() {
                      cloudSyncEnabled = value;
                    });

                    if (value) {
                      await ref.read(voiceJournalProvider.notifier).enableCloudSync();
                    } else {
                      await ref.read(voiceJournalProvider.notifier).disableCloudSync();
                    }
                  },
                ),
                if (cloudSyncEnabled && voiceJournalState.lastSyncTime != null) ...[
                  const SizedBox(height: UIConstants.spacingSM),
                  Text(
                    'Last synced: ${_formatSyncTime(voiceJournalState.lastSyncTime!)}',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
                    ),
                  ),
                ],
                const Divider(),
                ListTile(
                  title: const Text('Batch Processing'),
                  subtitle: const Text('Process all unprocessed entries'),
                  trailing: const Icon(Icons.arrow_forward_ios),
                  onTap: () {
                    context.pop();
                    _showBatchProcessingOptions();
                  },
                ),
                ListTile(
                  title: const Text('Storage Management'),
                  subtitle: const Text('Manage local storage'),
                  trailing: const Icon(Icons.arrow_forward_ios),
                  onTap: () {
                    context.pop();
                    _showStorageManagement();
                  },
                ),
                ListTile(
                  title: const Text('Privacy & Security'),
                  subtitle: const Text('Configure privacy settings'),
                  trailing: const Icon(Icons.arrow_forward_ios),
                  onTap: () {
                    context.pop();
                    context.push('/settings/privacy');
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => context.pop(),
              child: const Text('Done'),
            ),
          ],
        ),
      ),
    );
  }

  void _updateAutoTranscribeSetting(bool value) async {
    // Save to shared preferences or settings service
    // This would typically be handled by a settings provider
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Auto transcription ${value ? "enabled" : "disabled"}'),
      ),
    );
  }

  void _updateAudioQualitySetting(bool value) async {
    // Save to shared preferences or settings service
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('High quality audio ${value ? "enabled" : "disabled"}'),
      ),
    );
  }

  void _showBatchProcessingOptions() {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Batch Processing',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: UIConstants.spacingMD),
            ListTile(
              leading: const Icon(Icons.transcribe),
              title: const Text('Transcribe All'),
              subtitle: const Text('Transcribe all untranscribed entries'),
              onTap: () async {
                context.pop();
                await ref.read(voiceJournalProvider.notifier).batchProcessEntries(
                  transcribeAll: true,
                  analyzeAll: false,
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.analytics),
              title: const Text('Analyze All'),
              subtitle: const Text('Analyze all unanalyzed entries'),
              onTap: () async {
                context.pop();
                await ref.read(voiceJournalProvider.notifier).batchProcessEntries(
                  transcribeAll: false,
                  analyzeAll: true,
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.psychology),
              title: const Text('Process All'),
              subtitle: const Text('Transcribe and analyze all entries'),
              onTap: () async {
                context.pop();
                await ref.read(voiceJournalProvider.notifier).batchProcessEntries(
                  transcribeAll: true,
                  analyzeAll: true,
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showStorageManagement() {
    final stats = ref.read(voiceJournalProvider.notifier).getStatistics();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Storage Management'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildStorageItem('Total Entries', '${stats['totalEntries']} entries'),
            _buildStorageItem('Total Duration', '${stats['totalDurationMinutes']} minutes'),
            _buildStorageItem('Transcribed', '${stats['transcribedEntries']} entries'),
            const Divider(),
            const SizedBox(height: UIConstants.spacingMD),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  context.pop();
                  _clearOldEntries();
                },
                icon: const Icon(Icons.delete_sweep),
                label: const Text('Clear Old Entries'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orange,
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => context.pop(),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  Widget _buildStorageItem(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: UIConstants.spacingXS),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey.shade600)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  void _clearOldEntries() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear Old Entries'),
        content: const Text(
          'This will delete all voice journal entries older than 30 days. This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        // Calculate cutoff date (30 days ago)
        final cutoffDate = DateTime.now().subtract(const Duration(days: 30));

        // Delete old entries through the provider
        final deletedCount = await ref.read(voiceJournalProvider.notifier).deleteOldEntries(cutoffDate);

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Deleted $deletedCount old entries successfully'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Failed to clear old entries: $e'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  String _formatSyncTime(DateTime time) {
    final now = DateTime.now();
    final difference = now.difference(time);

    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes} minutes ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours} hours ago';
    } else {
      return '${difference.inDays} days ago';
    }
  }

  void _exportJournals() async {
    try {
      final success = await ref.read(voiceJournalProvider.notifier).exportJournals();
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Journals exported successfully!'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Export failed - no journals to export'),
            backgroundColor: Colors.orange,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Export failed: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _importJournals() async {
    try {
      final success = await ref.read(voiceJournalProvider.notifier).importJournals();
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Journals imported successfully!'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Import cancelled or failed'),
            backgroundColor: Colors.orange,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Import failed: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
} 