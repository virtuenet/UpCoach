import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:share_plus/share_plus.dart';
import 'package:file_picker/file_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/constants/ui_constants.dart';
import '../../../shared/models/voice_journal_entry.dart';
import '../../../core/services/voice_journal_storage_service.dart';
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
  bool _isExporting = false;
  bool _isImporting = false;

  // Voice Journal Settings
  bool _autoTranscription = true;
  bool _highQualityAudio = false;
  String _storageLocation = 'Internal Storage';

  final VoiceJournalStorageService _storageService =
      VoiceJournalStorageService();

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
        _autoTranscription =
            prefs.getBool('voice_journal_auto_transcription') ?? true;
        _highQualityAudio =
            prefs.getBool('voice_journal_high_quality_audio') ?? false;
        _storageLocation = prefs.getString('voice_journal_storage_location') ??
            'Internal Storage';
      });
    } catch (e) {
      // Handle error silently or show a message
    }
  }

  // Save settings to SharedPreferences
  Future<void> _saveSettings() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(
          'voice_journal_auto_transcription', _autoTranscription);
      await prefs.setBool(
          'voice_journal_high_quality_audio', _highQualityAudio);
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
      builder: (BuildContext dialogContext) {
        return AlertDialog(
          title: const Text('Storage Location'),
          content: RadioGroup<String>(
            groupValue: _storageLocation,
            onChanged: (value) {
              Navigator.of(dialogContext).pop(value);
            },
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: storageOptions.map((option) {
                return RadioListTile<String>(
                  title: Text(option),
                  value: option,
                );
              }).toList(),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
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
          SnackBar(
              content: Text('Storage location changed to $selectedOption')),
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
                  _showExportDialog();
                  break;
                case 'import':
                  _showImportDialog();
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
              PopupMenuItem(
                value: 'export',
                enabled: !_isExporting,
                child: Row(
                  children: [
                    _isExporting
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.file_download),
                    const SizedBox(width: UIConstants.spacingSM),
                    Text(_isExporting ? 'Exporting...' : 'Export'),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'import',
                enabled: !_isImporting,
                child: Row(
                  children: [
                    _isImporting
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.file_upload),
                    const SizedBox(width: UIConstants.spacingSM),
                    Text(_isImporting ? 'Importing...' : 'Import'),
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
                  margin: const EdgeInsets.symmetric(
                      horizontal: UIConstants.spacingMD,
                      vertical: UIConstants.spacingSM),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(UIConstants.radiusMD),
                    border: Border.all(
                        color: AppTheme.primaryColor.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.search,
                          color: AppTheme.primaryColor, size: 20),
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

  // Export functionality
  Future<void> _showExportDialog() async {
    final voiceJournalState = ref.read(voiceJournalProvider);
    final entries = voiceJournalState.entries;

    if (entries.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No voice journals to export')),
      );
      return;
    }

    bool includeTranscriptions = true;
    bool includeStatistics = true;

    final result = await showDialog<Map<String, bool>>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Export Voice Journals'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Export ${entries.length} journal${entries.length == 1 ? '' : 's'} to JSON format.',
                style: const TextStyle(color: AppColors.textSecondary),
              ),
              const SizedBox(height: UIConstants.spacingMD),
              CheckboxListTile(
                title: const Text('Include Transcriptions'),
                subtitle: const Text('Export text from voice-to-text'),
                value: includeTranscriptions,
                onChanged: (value) {
                  setDialogState(() => includeTranscriptions = value ?? true);
                },
                controlAffinity: ListTileControlAffinity.leading,
                contentPadding: EdgeInsets.zero,
              ),
              CheckboxListTile(
                title: const Text('Include Statistics'),
                subtitle: const Text('Export usage statistics'),
                value: includeStatistics,
                onChanged: (value) {
                  setDialogState(() => includeStatistics = value ?? true);
                },
                controlAffinity: ListTileControlAffinity.leading,
                contentPadding: EdgeInsets.zero,
              ),
              const SizedBox(height: UIConstants.spacingSM),
              Container(
                padding: const EdgeInsets.all(UIConstants.spacingSM),
                decoration: BoxDecoration(
                  color: Colors.orange.shade50,
                  borderRadius: BorderRadius.circular(UIConstants.radiusSM),
                  border: Border.all(color: Colors.orange.shade200),
                ),
                child: Row(
                  children: [
                    Icon(Icons.info_outline,
                        color: Colors.orange.shade700, size: 20),
                    const SizedBox(width: UIConstants.spacingSM),
                    Expanded(
                      child: Text(
                        'Note: Audio files are not included in the export.',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.orange.shade700,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('Cancel'),
            ),
            ElevatedButton.icon(
              onPressed: () {
                Navigator.pop(dialogContext, {
                  'includeTranscriptions': includeTranscriptions,
                  'includeStatistics': includeStatistics,
                });
              },
              icon: const Icon(Icons.file_download),
              label: const Text('Export'),
            ),
          ],
        ),
      ),
    );

    if (result == null) return;

    await _exportJournals(
      includeTranscriptions: result['includeTranscriptions'] ?? true,
      includeStatistics: result['includeStatistics'] ?? true,
    );
  }

  Future<void> _exportJournals({
    bool includeTranscriptions = true,
    bool includeStatistics = true,
  }) async {
    setState(() => _isExporting = true);

    try {
      await _storageService.initialize();
      final exportData = await _storageService.exportToJson();

      if (exportData.isEmpty) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No data to export')),
        );
        setState(() => _isExporting = false);
        return;
      }

      // Filter data based on options
      if (!includeTranscriptions && exportData['entries'] != null) {
        final entries = exportData['entries'] as List;
        for (var entry in entries) {
          if (entry is Map) {
            entry.remove('transcriptionText');
          }
        }
      }

      if (!includeStatistics) {
        exportData.remove('statistics');
      }

      // Convert to JSON string
      final jsonString = const JsonEncoder.withIndent('  ').convert(exportData);

      // Save to file
      final directory = await getApplicationDocumentsDirectory();
      final exportDir = Directory('${directory.path}/exports');
      if (!await exportDir.exists()) {
        await exportDir.create(recursive: true);
      }

      final timestamp = DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());
      final fileName = 'voice_journals_export_$timestamp.json';
      final file = File('${exportDir.path}/$fileName');
      await file.writeAsString(jsonString);

      setState(() => _isExporting = false);

      if (!mounted) return;

      // Show success dialog with share option
      _showExportSuccessDialog(file, exportData);
    } catch (e) {
      setState(() => _isExporting = false);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Export failed: $e'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
  }

  void _showExportSuccessDialog(File file, Map<String, dynamic> exportData) {
    final entryCount = (exportData['entries'] as List?)?.length ?? 0;
    final fileSize = file.lengthSync();

    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        icon: const Icon(Icons.check_circle,
            color: AppTheme.successColor, size: 48),
        title: const Text('Export Complete'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Your voice journals have been exported successfully.'),
            const SizedBox(height: UIConstants.spacingMD),
            _buildDetailRow('Entries', '$entryCount'),
            _buildDetailRow('File', file.path.split('/').last),
            _buildDetailRow('Size', _formatFileSize(fileSize)),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Done'),
          ),
          ElevatedButton.icon(
            onPressed: () async {
              Navigator.pop(dialogContext);
              try {
                await SharePlus.instance.share(
                  ShareParams(
                    files: [XFile(file.path)],
                    subject: 'Voice Journals Export',
                    text:
                        'My UpCoach voice journals backup ($entryCount entries)',
                  ),
                );
              } catch (e) {
                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Failed to share: $e')),
                );
              }
            },
            icon: const Icon(Icons.share),
            label: const Text('Share'),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppColors.textSecondary)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  String _formatFileSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

  // Import functionality
  Future<void> _showImportDialog() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Import Voice Journals'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Select a JSON file to import voice journal entries.',
              style: TextStyle(color: AppColors.textSecondary),
            ),
            const SizedBox(height: UIConstants.spacingMD),
            Container(
              padding: const EdgeInsets.all(UIConstants.spacingSM),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(UIConstants.radiusSM),
                border: Border.all(color: Colors.blue.shade200),
              ),
              child: Row(
                children: [
                  Icon(Icons.info_outline,
                      color: Colors.blue.shade700, size: 20),
                  const SizedBox(width: UIConstants.spacingSM),
                  Expanded(
                    child: Text(
                      'Only metadata will be imported. Audio files must be restored separately.',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.blue.shade700,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: UIConstants.spacingSM),
            Container(
              padding: const EdgeInsets.all(UIConstants.spacingSM),
              decoration: BoxDecoration(
                color: Colors.orange.shade50,
                borderRadius: BorderRadius.circular(UIConstants.radiusSM),
                border: Border.all(color: Colors.orange.shade200),
              ),
              child: Row(
                children: [
                  Icon(Icons.warning_amber,
                      color: Colors.orange.shade700, size: 20),
                  const SizedBox(width: UIConstants.spacingSM),
                  Expanded(
                    child: Text(
                      'Duplicate entries will be skipped.',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.orange.shade700,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton.icon(
            onPressed: () => Navigator.pop(dialogContext, true),
            icon: const Icon(Icons.folder_open),
            label: const Text('Select File'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await _importJournals();
    }
  }

  Future<void> _importJournals() async {
    setState(() => _isImporting = true);

    try {
      // Pick a JSON file
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['json'],
        allowMultiple: false,
      );

      if (result == null || result.files.isEmpty) {
        setState(() => _isImporting = false);
        return;
      }

      final filePath = result.files.single.path;
      if (filePath == null) {
        setState(() => _isImporting = false);
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not access the selected file')),
        );
        return;
      }

      // Read and parse the file
      final file = File(filePath);
      final jsonString = await file.readAsString();
      final Map<String, dynamic> importData;

      try {
        importData = json.decode(jsonString) as Map<String, dynamic>;
      } catch (e) {
        setState(() => _isImporting = false);
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Invalid JSON file format'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
        return;
      }

      // Validate the import data
      if (!importData.containsKey('entries')) {
        setState(() => _isImporting = false);
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Invalid export file - missing entries'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
        return;
      }

      // Perform the import
      await _storageService.initialize();
      final success = await _storageService.importFromJson(importData);

      setState(() => _isImporting = false);

      if (!mounted) return;

      if (success) {
        // Refresh the provider
        ref.read(voiceJournalProvider.notifier).loadEntries();

        final importedCount = (importData['entries'] as List).length;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Successfully imported from $importedCount entries'),
            backgroundColor: AppTheme.successColor,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('No new entries were imported (all duplicates)'),
            backgroundColor: AppTheme.warningColor,
          ),
        );
      }
    } catch (e) {
      setState(() => _isImporting = false);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Import failed: $e'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
  }
}
