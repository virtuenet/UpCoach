import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:animations/animations.dart';
import '../../models/voice_journal_entry.dart';
import '../../services/voice_journal_service.dart';
import '../../widgets/voice_journal/recording_button.dart';
import '../../widgets/voice_journal/voice_wave_form.dart';
import '../../widgets/voice_journal/journal_entry_card.dart';
import '../../widgets/voice_journal/category_selector.dart';
import '../../widgets/voice_journal/search_bar.dart';
import '../../widgets/voice_journal/filter_sheet.dart';
import '../../widgets/common/loading_overlay.dart';
import '../../widgets/common/empty_state.dart';
import '../../utils/app_colors.dart';
import '../../utils/app_spacing.dart';
import 'voice_journal_detail_screen.dart';
import 'voice_journal_stats_screen.dart';

/// Main Voice Journal Screen
/// Handles voice recording, playback, and journal entry management
class VoiceJournalScreen extends StatefulWidget {
  const VoiceJournalScreen({Key? key}) : super(key: key);

  @override
  State<VoiceJournalScreen> createState() => _VoiceJournalScreenState();
}

class _VoiceJournalScreenState extends State<VoiceJournalScreen>
    with TickerProviderStateMixin {
  final VoiceJournalService _voiceService = VoiceJournalService();
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _searchController = TextEditingController();

  // Animation controllers
  late AnimationController _recordingAnimationController;
  late AnimationController _pulseAnimationController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _pulseAnimation;

  // State variables
  List<VoiceJournalEntry> _entries = [];
  List<VoiceJournalEntry> _filteredEntries = [];
  JournalCategory? _selectedCategory;
  bool _isLoading = false;
  bool _isRecording = false;
  String _searchQuery = '';
  VoiceJournalEntry? _currentPlayingEntry;

  // Recording state
  String? _recordingTitle;
  String? _recordingDescription;
  List<String> _recordingTags = [];

  @override
  void initState() {
    super.initState();
    _initializeAnimations();
    _setupListeners();
    _loadEntries();
  }

  void _initializeAnimations() {
    _recordingAnimationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );

    _pulseAnimationController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );

    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 1.2,
    ).animate(CurvedAnimation(
      parent: _recordingAnimationController,
      curve: Curves.easeInOut,
    ));

    _pulseAnimation = Tween<double>(
      begin: 1.0,
      end: 1.5,
    ).animate(CurvedAnimation(
      parent: _pulseAnimationController,
      curve: Curves.easeInOut,
    ));
  }

  void _setupListeners() {
    // Recording state listener
    _voiceService.recordingStateStream.listen((state) {
      setState(() {
        _isRecording = state.isRecording;
      });

      if (state.isRecording) {
        _recordingAnimationController.forward();
        _pulseAnimationController.repeat(reverse: true);
      } else {
        _recordingAnimationController.reverse();
        _pulseAnimationController.stop();
      }
    });

    // Transcription listener
    _voiceService.transcriptionStream.listen((update) {
      if (update.status == TranscriptionStatus.completed) {
        _loadEntries(); // Refresh entries when transcription completes
        _showTranscriptionCompleteSnackBar(update.entryId);
      }
    });

    // Search listener
    _searchController.addListener(_onSearchChanged);
  }

  void _onSearchChanged() {
    setState(() {
      _searchQuery = _searchController.text;
      _filterEntries();
    });
  }

  Future<void> _loadEntries() async {
    setState(() => _isLoading = true);

    try {
      final entries = await _voiceService.getAllEntries(
        category: _selectedCategory,
        limit: 100,
      );

      setState(() {
        _entries = entries;
        _filterEntries();
      });
    } catch (e) {
      _showErrorSnackBar('Failed to load entries: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _filterEntries() {
    _filteredEntries = _entries.where((entry) {
      // Search filter
      if (_searchQuery.isNotEmpty) {
        final searchLower = _searchQuery.toLowerCase();
        final titleMatch = entry.title.toLowerCase().contains(searchLower);
        final transcriptionMatch = entry.transcription
            ?.toLowerCase()
            .contains(searchLower) ?? false;
        final tagsMatch = entry.tags.any((tag) => 
            tag.toLowerCase().contains(searchLower));

        if (!titleMatch && !transcriptionMatch && !tagsMatch) {
          return false;
        }
      }

      // Category filter
      if (_selectedCategory != null && entry.category != _selectedCategory) {
        return false;
      }

      return true;
    }).toList();

    // Sort by creation date (newest first)
    _filteredEntries.sort((a, b) => b.createdAt.compareTo(a.createdAt));
  }

  Future<void> _startRecording() async {
    try {
      // Request microphone permission
      final hasPermission = await _requestMicrophonePermission();
      if (!hasPermission) {
        _showErrorSnackBar('Microphone permission is required');
        return;
      }

      // Start recording
      final success = await _voiceService.startRecording();
      if (success) {
        HapticFeedback.lightImpact();
        _showRecordingDialog();
      } else {
        _showErrorSnackBar('Failed to start recording');
      }
    } catch (e) {
      _showErrorSnackBar('Recording error: $e');
    }
  }

  Future<void> _stopRecording() async {
    try {
      final entry = await _voiceService.stopRecording(
        title: _recordingTitle,
        description: _recordingDescription,
        category: _selectedCategory ?? JournalCategory.personal,
        tags: _recordingTags,
      );

      if (entry != null) {
        HapticFeedback.mediumImpact();
        Navigator.of(context).pop(); // Close recording dialog
        await _loadEntries();
        _showRecordingCompleteSnackBar(entry);
      } else {
        _showErrorSnackBar('Failed to save recording');
      }
    } catch (e) {
      _showErrorSnackBar('Save error: $e');
    }
  }

  Future<void> _cancelRecording() async {
    await _voiceService.cancelRecording();
    Navigator.of(context).pop(); // Close recording dialog
    _resetRecordingState();
  }

  void _resetRecordingState() {
    _recordingTitle = null;
    _recordingDescription = null;
    _recordingTags = [];
  }

  void _showRecordingDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => RecordingDialog(
        onStop: _stopRecording,
        onCancel: _cancelRecording,
        onTitleChanged: (title) => _recordingTitle = title,
        onDescriptionChanged: (description) => _recordingDescription = description,
        onCategoryChanged: (category) => setState(() => _selectedCategory = category),
        onTagsChanged: (tags) => _recordingTags = tags,
        voiceService: _voiceService,
      ),
    );
  }

  Future<bool> _requestMicrophonePermission() async {
    // TODO: Implement proper permission handling
    return true;
  }

  void _showTranscriptionCompleteSnackBar(String entryId) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Row(
          children: [
            Icon(Icons.check_circle, color: Colors.white),
            SizedBox(width: 8),
            Text('Transcription completed'),
          ],
        ),
        backgroundColor: AppColors.success,
        action: SnackBarAction(
          label: 'View',
          textColor: Colors.white,
          onPressed: () => _openEntryDetail(entryId),
        ),
      ),
    );
  }

  void _showRecordingCompleteSnackBar(VoiceJournalEntry entry) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.mic, color: Colors.white),
            const SizedBox(width: 8),
            Expanded(
              child: Text('Recorded "${entry.title}" (${entry.formattedDuration})'),
            ),
          ],
        ),
        backgroundColor: AppColors.primary,
        action: SnackBarAction(
          label: 'View',
          textColor: Colors.white,
          onPressed: () => _openEntryDetail(entry.id),
        ),
      ),
    );
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.error, color: Colors.white),
            const SizedBox(width: 8),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: AppColors.error,
      ),
    );
  }

  void _openEntryDetail(String entryId) {
    final entry = _entries.firstWhere((e) => e.id == entryId);
    Navigator.push(
      context,
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) =>
            VoiceJournalDetailScreen(entry: entry),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return SharedAxisTransition(
            animation: animation,
            secondaryAnimation: secondaryAnimation,
            transitionType: SharedAxisTransitionType.horizontal,
            child: child,
          );
        },
      ),
    );
  }

  void _openStats() {
    Navigator.push(
      context,
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) =>
            const VoiceJournalStatsScreen(),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return SharedAxisTransition(
            animation: animation,
            secondaryAnimation: secondaryAnimation,
            transitionType: SharedAxisTransitionType.vertical,
            child: child,
          );
        },
      ),
    );
  }

  void _showFilterSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => VoiceJournalFilterSheet(
        selectedCategory: _selectedCategory,
        onCategoryChanged: (category) {
          setState(() {
            _selectedCategory = category;
            _filterEntries();
          });
        },
        onClearFilters: () {
          setState(() {
            _selectedCategory = null;
            _searchController.clear();
            _searchQuery = '';
            _filterEntries();
          });
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            _buildSearchAndFilter(),
            if (_selectedCategory != null) _buildCategoryChip(),
            Expanded(child: _buildEntriesList()),
          ],
        ),
      ),
      floatingActionButton: _buildRecordingFab(),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Voice Journal',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                Text(
                  '${_filteredEntries.length} ${_filteredEntries.length == 1 ? 'entry' : 'entries'}',
                  style: const TextStyle(
                    fontSize: 16,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: _openStats,
            icon: const Icon(Icons.analytics_outlined),
            iconSize: 28,
            color: AppColors.primary,
          ),
        ],
      ),
    );
  }

  Widget _buildSearchAndFilter() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Row(
        children: [
          Expanded(
            child: VoiceJournalSearchBar(
              controller: _searchController,
              hintText: 'Search entries...',
              onChanged: (query) => _onSearchChanged(),
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          IconButton(
            onPressed: _showFilterSheet,
            icon: const Icon(Icons.tune),
            iconSize: 24,
            color: AppColors.primary,
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryChip() {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.sm,
      ),
      child: Row(
        children: [
          Chip(
            label: Text(_selectedCategory!.displayName),
            avatar: Text(_selectedCategory!.icon),
            onDeleted: () {
              setState(() {
                _selectedCategory = null;
                _filterEntries();
              });
            },
            backgroundColor: AppColors.primary.withOpacity(0.1),
            deleteIconColor: AppColors.primary,
          ),
        ],
      ),
    );
  }

  Widget _buildEntriesList() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_filteredEntries.isEmpty) {
      return EmptyState(
        icon: Icons.mic_none,
        title: _searchQuery.isNotEmpty ? 'No matching entries' : 'No voice journals yet',
        description: _searchQuery.isNotEmpty
            ? 'Try adjusting your search or filters'
            : 'Tap the record button to create your first voice journal entry',
        actionText: _searchQuery.isEmpty ? 'Start Recording' : null,
        onAction: _searchQuery.isEmpty ? _startRecording : null,
      );
    }

    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.all(AppSpacing.lg),
      itemCount: _filteredEntries.length,
      itemBuilder: (context, index) {
        final entry = _filteredEntries[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: AppSpacing.md),
          child: JournalEntryCard(
            entry: entry,
            onTap: () => _openEntryDetail(entry.id),
            onPlay: () => _playEntry(entry),
            onFavorite: () => _toggleFavorite(entry),
            isPlaying: _currentPlayingEntry?.id == entry.id,
          ),
        );
      },
    );
  }

  Widget _buildRecordingFab() {
    return AnimatedBuilder(
      animation: _scaleAnimation,
      builder: (context, child) {
        return Transform.scale(
          scale: _scaleAnimation.value,
          child: AnimatedBuilder(
            animation: _pulseAnimation,
            builder: (context, child) {
              return Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  boxShadow: _isRecording
                      ? [
                          BoxShadow(
                            color: AppColors.primary.withOpacity(0.3),
                            blurRadius: 20 * _pulseAnimation.value,
                            spreadRadius: 10 * _pulseAnimation.value,
                          ),
                        ]
                      : null,
                ),
                child: RecordingButton(
                  isRecording: _isRecording,
                  onPressed: _isRecording ? null : _startRecording,
                  size: 72,
                ),
              );
            },
          ),
        );
      },
    );
  }

  Future<void> _playEntry(VoiceJournalEntry entry) async {
    if (_currentPlayingEntry?.id == entry.id) {
      await _voiceService.stopPlayback();
      setState(() => _currentPlayingEntry = null);
    } else {
      final success = await _voiceService.playEntry(entry);
      if (success) {
        setState(() => _currentPlayingEntry = entry);
      }
    }
  }

  Future<void> _toggleFavorite(VoiceJournalEntry entry) async {
    final updatedEntry = entry.copyWith(isFavorite: !entry.isFavorite);
    await _voiceService.updateEntry(updatedEntry);
    await _loadEntries();
  }

  @override
  void dispose() {
    _recordingAnimationController.dispose();
    _pulseAnimationController.dispose();
    _scrollController.dispose();
    _searchController.dispose();
    _voiceService.dispose();
    super.dispose();
  }
}

/// Recording Dialog
class RecordingDialog extends StatefulWidget {
  final VoidCallback onStop;
  final VoidCallback onCancel;
  final ValueChanged<String> onTitleChanged;
  final ValueChanged<String> onDescriptionChanged;
  final ValueChanged<JournalCategory> onCategoryChanged;
  final ValueChanged<List<String>> onTagsChanged;
  final VoiceJournalService voiceService;

  const RecordingDialog({
    Key? key,
    required this.onStop,
    required this.onCancel,
    required this.onTitleChanged,
    required this.onDescriptionChanged,
    required this.onCategoryChanged,
    required this.onTagsChanged,
    required this.voiceService,
  }) : super(key: key);

  @override
  State<RecordingDialog> createState() => _RecordingDialogState();
}

class _RecordingDialogState extends State<RecordingDialog> {
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  final TextEditingController _tagController = TextEditingController();
  
  JournalCategory _selectedCategory = JournalCategory.personal;
  List<String> _tags = [];
  int _recordingDuration = 0;

  @override
  void initState() {
    super.initState();
    _setupListeners();
  }

  void _setupListeners() {
    // Listen to recording state for duration updates
    widget.voiceService.recordingStateStream.listen((state) {
      if (mounted) {
        setState(() {
          _recordingDuration = state.duration;
        });
      }
    });
  }

  void _addTag() {
    final tag = _tagController.text.trim();
    if (tag.isNotEmpty && !_tags.contains(tag)) {
      setState(() {
        _tags.add(tag);
        _tagController.clear();
      });
      widget.onTagsChanged(_tags);
    }
  }

  void _removeTag(String tag) {
    setState(() {
      _tags.remove(tag);
    });
    widget.onTagsChanged(_tags);
  }

  String _formatDuration(int milliseconds) {
    final duration = Duration(milliseconds: milliseconds);
    final minutes = duration.inMinutes;
    final seconds = duration.inSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Recording indicator
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.error.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.mic,
                size: 40,
                color: AppColors.error,
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Duration
            Text(
              _formatDuration(_recordingDuration),
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            
            const SizedBox(height: 8),
            
            const Text(
              'Recording in progress...',
              style: TextStyle(
                fontSize: 16,
                color: AppColors.textSecondary,
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Title input
            TextField(
              controller: _titleController,
              onChanged: widget.onTitleChanged,
              decoration: const InputDecoration(
                labelText: 'Title (optional)',
                border: OutlineInputBorder(),
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Category selector
            CategorySelector(
              selectedCategory: _selectedCategory,
              onCategoryChanged: (category) {
                setState(() => _selectedCategory = category);
                widget.onCategoryChanged(category);
              },
            ),
            
            const SizedBox(height: 24),
            
            // Action buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: widget.onCancel,
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: widget.onStop,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                    ),
                    child: const Text('Save'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _tagController.dispose();
    super.dispose();
  }
} 