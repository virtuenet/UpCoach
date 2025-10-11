import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/constants/ui_constants.dart';
import '../../../shared/models/voice_journal_entry.dart';
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
  String _searchQuery = '';
  List<VoiceJournalEntry> _filteredEntries = [];

  // Voice Journal Settings
  bool _autoTranscription = true;
  bool _highQualityAudio = false;
  String _storageLocation = 'Internal Storage';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadSettings();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  // Load settings from SharedPreferences
  Future<void> _loadSettings() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      setState(() {
        _autoTranscription = prefs.getBool('voice_journal_auto_transcription') ?? true;
        _highQualityAudio = prefs.getBool('voice_journal_high_quality_audio') ?? false;
        _storageLocation = prefs.getString('voice_journal_storage_location') ?? 'Internal Storage';
      });
    } catch (e) {
      // Handle error silently or show a message
    }
  }

  // Save settings to SharedPreferences
  Future<void> _saveSettings() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('voice_journal_auto_transcription', _autoTranscription);
      await prefs.setBool('voice_journal_high_quality_audio', _highQualityAudio);
      await prefs.setString('voice_journal_storage_location', _storageLocation);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save settings: $e')),
        );
      }
    }
  }

  // Show storage options dialog
  Future<void> _showStorageOptions() async {
    final storageOptions = ['Internal Storage', 'SD Card', 'Cloud Storage'];

    final selectedOption = await showDialog<String>(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Storage Location'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: storageOptions.map((option) {
              return RadioListTile<String>(
                title: Text(option),
                value: option,
                groupValue: _storageLocation,
                onChanged: (value) {
                  Navigator.of(context).pop(value);
                },
              );
            }).toList(),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
          ],
        );
      },
    );

    if (selectedOption != null && selectedOption != _storageLocation) {
      setState(() {
        _storageLocation = selectedOption;
      });
      await _saveSettings();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Storage location changed to $selectedOption')),
        );
      }
    }
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
                  _performSearch(value);
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
                  _searchQuery = '';
                  _filteredEntries.clear();
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
              // Search results indicator
              if (_isSearching && _searchQuery.isNotEmpty)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(UIConstants.spacingMD),
                  margin: const EdgeInsets.symmetric(horizontal: UIConstants.spacingMD, vertical: UIConstants.spacingSM),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(UIConstants.radiusMD),
                    border: Border.all(color: AppTheme.primaryColor.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.search, color: AppTheme.primaryColor, size: 20),
                      const SizedBox(width: UIConstants.spacingSM),
                      Expanded(
                        child: Text(
                          '${_filteredEntries.length} result${_filteredEntries.length == 1 ? '' : 's'} for "$_searchQuery"',
                          style: const TextStyle(
                            color: AppTheme.primaryColor,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                      if (_filteredEntries.isNotEmpty)
                        IconButton(
                          icon: const Icon(Icons.clear, size: 18),
                          color: AppTheme.primaryColor,
                          onPressed: () {
                            setState(() {
                              _searchController.clear();
                              _searchQuery = '';
                              _filteredEntries.clear();
                            });
                          },
                        ),
                    ],
                  ),
                ),
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
                    : VoiceJournalList(
                        filteredEntries: _isSearching && _searchQuery.isNotEmpty
                            ? _filteredEntries
                            : null,
                      ),
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
              value: _autoTranscription,
              onChanged: (value) {
                setState(() {
                  _autoTranscription = value;
                });
                _saveSettings();
              },
            ),
            SwitchListTile(
              title: const Text('High Quality Audio'),
              subtitle: const Text('Record in higher quality (larger files)'),
              value: _highQualityAudio,
              onChanged: (value) {
                setState(() {
                  _highQualityAudio = value;
                });
                _saveSettings();
              },
            ),
            ListTile(
              title: const Text('Storage Location'),
              subtitle: Text(_storageLocation),
              trailing: const Icon(Icons.arrow_forward_ios),
              onTap: () => _showStorageOptions(),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  void _performSearch(String query) {
    setState(() {
      _searchQuery = query;
      if (query.isEmpty) {
        _filteredEntries.clear();
      } else {
        final voiceJournalNotifier = ref.read(voiceJournalProvider.notifier);
        _filteredEntries = voiceJournalNotifier.searchEntries(query);
      }
    });
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