import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
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
                  // TODO: Implement search functionality
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
                          // TODO: Clear error
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
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Voice Journal Settings'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SwitchListTile(
              title: const Text('Auto Transcription'),
              subtitle: const Text('Automatically transcribe recordings'),
              value: true, // TODO: Get from settings
              onChanged: (value) {
                // TODO: Update settings
              },
            ),
            SwitchListTile(
              title: const Text('High Quality Audio'),
              subtitle: const Text('Record in higher quality (larger files)'),
              value: false, // TODO: Get from settings
              onChanged: (value) {
                // TODO: Update settings
              },
            ),
            ListTile(
              title: const Text('Storage Location'),
              subtitle: const Text('Internal Storage'),
              trailing: const Icon(Icons.arrow_forward_ios),
              onTap: () {
                // TODO: Show storage options
              },
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

  void _exportJournals() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Export feature coming soon!')),
    );
  }

  void _importJournals() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Import feature coming soon!')),
    );
  }
} 