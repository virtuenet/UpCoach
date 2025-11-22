import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/voice_journal_sync_service.dart';
import '../providers/voice_journal_provider.dart';

/// Widget to display sync status and controls
class VoiceJournalSyncWidget extends ConsumerWidget {
  const VoiceJournalSyncWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final syncState = ref.watch(voiceJournalSyncServiceProvider);
    final voiceJournalState = ref.watch(voiceJournalProvider);
    
    return Card(
      margin: const EdgeInsets.all(16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildSyncHeader(context, ref, syncState, voiceJournalState),
            if (syncState.isSyncing) ...[
              const SizedBox(height: 16),
              _buildSyncProgress(syncState),
            ],
            if (syncState.pendingConflicts.isNotEmpty) ...[
              const SizedBox(height: 16),
              _buildConflictIndicator(context, ref, syncState),
            ],
            if (syncState.lastSyncResult != null) ...[
              const SizedBox(height: 16),
              _buildLastSyncInfo(syncState),
            ],
            const SizedBox(height: 16),
            _buildSyncActions(context, ref, syncState, voiceJournalState),
          ],
        ),
      ),
    );
  }
  
  Widget _buildSyncHeader(
    BuildContext context,
    WidgetRef ref,
    SyncState syncState,
    VoiceJournalState voiceJournalState,
  ) {
    return Row(
      children: [
        Icon(
          syncState.isSyncing 
              ? Icons.sync 
              : voiceJournalState.isCloudSyncEnabled 
                  ? Icons.cloud_done 
                  : Icons.cloud_off,
          color: syncState.isSyncing 
              ? Colors.blue 
              : voiceJournalState.isCloudSyncEnabled 
                  ? Colors.green 
                  : Colors.grey,
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                syncState.isSyncing 
                    ? 'Syncing...' 
                    : voiceJournalState.isCloudSyncEnabled 
                        ? 'Cloud Sync Enabled' 
                        : 'Cloud Sync Disabled',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              if (syncState.currentOperation != null)
                Text(
                  syncState.currentOperation!,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
            ],
          ),
        ),
        if (syncState.isSyncing)
          const SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
      ],
    );
  }
  
  Widget _buildSyncProgress(SyncState syncState) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        LinearProgressIndicator(
          value: syncState.progress,
          backgroundColor: Colors.grey.shade200,
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              '${(syncState.progress * 100).toInt()}%',
              style: const TextStyle(fontSize: 12),
            ),
            if (syncState.pendingUploads > 0 || syncState.pendingDownloads > 0)
              Text(
                '↑ ${syncState.pendingUploads} | ↓ ${syncState.pendingDownloads}',
                style: const TextStyle(fontSize: 12),
              ),
          ],
        ),
      ],
    );
  }
  
  Widget _buildConflictIndicator(
    BuildContext context,
    WidgetRef ref,
    SyncState syncState,
  ) {
    return InkWell(
      onTap: () => _showConflictResolutionDialog(context, ref, syncState),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.orange.shade50,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.orange.shade200),
        ),
        child: Row(
          children: [
            Icon(Icons.warning, color: Colors.orange.shade700, size: 20),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                '${syncState.pendingConflicts.length} conflict(s) need resolution',
                style: TextStyle(color: Colors.orange.shade700),
              ),
            ),
            Icon(Icons.arrow_forward_ios, size: 16, color: Colors.orange.shade700),
          ],
        ),
      ),
    );
  }
  
  Widget _buildLastSyncInfo(SyncState syncState) {
    final result = syncState.lastSyncResult!;
    final isSuccess = result.isSuccess;
    
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isSuccess ? Colors.green.shade50 : Colors.red.shade50,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                isSuccess ? Icons.check_circle : Icons.error,
                color: isSuccess ? Colors.green : Colors.red,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                'Last sync: ${_formatDateTime(result.syncTime)}',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: isSuccess ? Colors.green.shade700 : Colors.red.shade700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            '↑ ${result.uploaded} uploaded | ↓ ${result.downloaded} downloaded',
            style: const TextStyle(fontSize: 12),
          ),
          if (result.conflicts > 0)
            Text(
              '⚠ ${result.conflicts} conflicts (${result.resolved} resolved)',
              style: const TextStyle(fontSize: 12),
            ),
          if (result.errors.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              'Errors: ${result.errors.first}',
              style: TextStyle(fontSize: 12, color: Colors.red.shade700),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ],
      ),
    );
  }
  
  Widget _buildSyncActions(
    BuildContext context,
    WidgetRef ref,
    SyncState syncState,
    VoiceJournalState voiceJournalState,
  ) {
    return Row(
      children: [
        Expanded(
          child: OutlinedButton.icon(
            onPressed: syncState.isSyncing ? null : () => _toggleCloudSync(ref, voiceJournalState),
            icon: Icon(
              voiceJournalState.isCloudSyncEnabled 
                  ? Icons.cloud_off 
                  : Icons.cloud_queue,
            ),
            label: Text(
              voiceJournalState.isCloudSyncEnabled 
                  ? 'Disable Sync' 
                  : 'Enable Sync',
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: ElevatedButton.icon(
            onPressed: syncState.isSyncing || !voiceJournalState.isCloudSyncEnabled 
                ? null 
                : () => _performManualSync(ref),
            icon: const Icon(Icons.sync),
            label: const Text('Sync Now'),
          ),
        ),
      ],
    );
  }
  
  Future<void> _toggleCloudSync(WidgetRef ref, VoiceJournalState state) async {
    final notifier = ref.read(voiceJournalProvider.notifier);
    
    if (state.isCloudSyncEnabled) {
      await notifier.disableCloudSync();
    } else {
      await notifier.enableCloudSync();
    }
  }
  
  Future<void> _performManualSync(WidgetRef ref) async {
    final notifier = ref.read(voiceJournalProvider.notifier);
    await notifier.syncToCloud();
  }
  
  void _showConflictResolutionDialog(
    BuildContext context,
    WidgetRef ref,
    SyncState syncState,
  ) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => ConflictResolutionSheet(
        conflicts: syncState.pendingConflicts,
      ),
    );
  }
  
  String _formatDateTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);
    
    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inHours < 1) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inDays < 1) {
      return '${difference.inHours}h ago';
    } else if (difference.inDays < 7) {
      return '${difference.inDays}d ago';
    } else {
      return '${dateTime.day}/${dateTime.month}/${dateTime.year}';
    }
  }
}

/// Bottom sheet for resolving sync conflicts
class ConflictResolutionSheet extends ConsumerStatefulWidget {
  final List<SyncConflict> conflicts;
  
  const ConflictResolutionSheet({
    super.key,
    required this.conflicts,
  });
  
  @override
  ConsumerState<ConflictResolutionSheet> createState() => _ConflictResolutionSheetState();
}

class _ConflictResolutionSheetState extends ConsumerState<ConflictResolutionSheet> {
  int _currentConflictIndex = 0;
  
  SyncConflict get _currentConflict => widget.conflicts[_currentConflictIndex];
  bool get _hasNext => _currentConflictIndex < widget.conflicts.length - 1;
  bool get _hasPrevious => _currentConflictIndex > 0;
  
  @override
  Widget build(BuildContext context) {
    if (widget.conflicts.isEmpty) {
      return const SizedBox(
        height: 200,
        child: Center(
          child: Text('No conflicts to resolve'),
        ),
      );
    }
    
    return DraggableScrollableSheet(
      initialChildSize: 0.9,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (context, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              _buildHandle(),
              _buildHeader(context),
              Expanded(
                child: SingleChildScrollView(
                  controller: scrollController,
                  padding: const EdgeInsets.all(16),
                  child: _buildConflictDetails(),
                ),
              ),
              _buildActions(context),
            ],
          ),
        );
      },
    );
  }
  
  Widget _buildHandle() {
    return Container(
      margin: const EdgeInsets.only(top: 12),
      width: 40,
      height: 4,
      decoration: BoxDecoration(
        color: Colors.grey.shade300,
        borderRadius: BorderRadius.circular(2),
      ),
    );
  }
  
  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: Colors.grey.shade200),
        ),
      ),
      child: Row(
        children: [
          IconButton(
            onPressed: _hasPrevious ? _previousConflict : null,
            icon: const Icon(Icons.arrow_back),
          ),
          Expanded(
            child: Column(
              children: [
                Text(
                  'Resolve Conflict',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 4),
                Text(
                  '${_currentConflictIndex + 1} of ${widget.conflicts.length}',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: _hasNext ? _nextConflict : null,
            icon: const Icon(Icons.arrow_forward),
          ),
        ],
      ),
    );
  }
  
  Widget _buildConflictDetails() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildConflictInfo(),
        const SizedBox(height: 24),
        _buildVersionComparison(),
      ],
    );
  }
  
  Widget _buildConflictInfo() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.amber.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.amber.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.info, color: Colors.amber.shade700, size: 20),
              const SizedBox(width: 8),
              Text(
                'Conflict Details',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.amber.shade700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text('Entry: ${_currentConflict.localEntry.title}'),
          Text('Reason: ${_currentConflict.reason}'),
          Text('Detected: ${_formatDateTime(_currentConflict.detectedAt)}'),
          if (_currentConflict.canAutoResolve)
            Container(
              margin: const EdgeInsets.only(top: 8),
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.green.shade100,
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Text(
                'Can be auto-resolved',
                style: TextStyle(fontSize: 12, color: Colors.green),
              ),
            ),
        ],
      ),
    );
  }
  
  Widget _buildVersionComparison() {
    return Column(
      children: [
        _buildVersionCard(
          'Your Version (Local)',
          _currentConflict.localEntry,
          Colors.blue,
        ),
        const SizedBox(height: 16),
        _buildVersionCard(
          'Cloud Version',
          _currentConflict.remoteEntry,
          Colors.purple,
        ),
      ],
    );
  }
  
  Widget _buildVersionCard(
    String title,
    VoiceJournalEntry entry,
    Color color,
  ) {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: color.withOpacity(0.3)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(7)),
            ),
            child: Row(
              children: [
                Icon(Icons.folder, color: color, size: 20),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildEntryField('Title', entry.title),
                if (entry.transcriptionText?.isNotEmpty ?? false)
                  _buildEntryField(
                    'Content',
                    entry.transcriptionText!.length > 200
                        ? '${entry.transcriptionText!.substring(0, 200)}...'
                        : entry.transcriptionText!,
                  ),
                if (entry.summary.isNotEmpty)
                  _buildEntryField('Summary', entry.summary),
                if (entry.tags.isNotEmpty)
                  _buildEntryField('Tags', entry.tags.join(', ')),
                _buildEntryField(
                  'Modified',
                  _formatDateTime(entry.updatedAt ?? entry.createdAt),
                ),
                Row(
                  children: [
                    if (entry.isFavorite)
                      const Icon(Icons.star, size: 16, color: Colors.amber),
                    if (entry.isTranscribed)
                      const Icon(Icons.text_fields, size: 16, color: Colors.blue),
                    if (entry.isAnalyzed)
                      const Icon(Icons.analytics, size: 16, color: Colors.green),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildEntryField(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              '$label:',
              style: const TextStyle(
                fontWeight: FontWeight.w500,
                fontSize: 12,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildActions(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        border: Border(
          top: BorderSide(color: Colors.grey.shade200),
        ),
      ),
      child: Column(
        children: [
          if (_currentConflict.canAutoResolve)
            Container(
              margin: const EdgeInsets.only(bottom: 12),
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => _resolveAutomatically(context),
                icon: const Icon(Icons.auto_fix_high),
                label: const Text('Auto-Resolve'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  foregroundColor: Colors.white,
                ),
              ),
            ),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => _resolveConflict(context, ConflictResolution.clientWins),
                  child: const Text('Keep Local'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton(
                  onPressed: () => _resolveConflict(context, ConflictResolution.serverWins),
                  child: const Text('Keep Cloud'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton(
                  onPressed: () => _resolveConflict(context, ConflictResolution.merge),
                  child: const Text('Merge'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
  
  void _previousConflict() {
    if (_hasPrevious) {
      setState(() {
        _currentConflictIndex--;
      });
    }
  }
  
  void _nextConflict() {
    if (_hasNext) {
      setState(() {
        _currentConflictIndex++;
      });
    }
  }
  
  Future<void> _resolveAutomatically(BuildContext context) async {
    await _resolveConflict(context, ConflictResolution.lastWriteWins);
  }
  
  Future<void> _resolveConflict(BuildContext context, ConflictResolution resolution) async {
    final notifier = ref.read(voiceJournalProvider.notifier);
    
    await notifier.resolveSyncConflict(
      _currentConflict.entryId,
      resolution,
    );
    
    if (_hasNext) {
      _nextConflict();
    } else {
      if (context.mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('All conflicts resolved'),
            backgroundColor: Colors.green,
          ),
        );
      }
    }
  }
  
  String _formatDateTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);
    
    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inHours < 1) {
      return '${difference.inMinutes} minutes ago';
    } else if (difference.inDays < 1) {
      return '${difference.inHours} hours ago';
    } else {
      return '${dateTime.day}/${dateTime.month}/${dateTime.year} ${dateTime.hour}:${dateTime.minute.toString().padLeft(2, '0')}';
    }
  }
}

/// Sync status indicator for app bar
class VoiceJournalSyncIndicator extends ConsumerWidget {
  const VoiceJournalSyncIndicator({super.key});
  
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final syncState = ref.watch(voiceJournalSyncServiceProvider);
    final voiceJournalState = ref.watch(voiceJournalProvider);
    
    if (!voiceJournalState.isCloudSyncEnabled) {
      return IconButton(
        icon: const Icon(Icons.cloud_off),
        onPressed: () => _showSyncSettings(context),
        tooltip: 'Cloud sync disabled',
      );
    }
    
    if (syncState.isSyncing) {
      return const Padding(
        padding: EdgeInsets.all(12),
        child: SizedBox(
          width: 24,
          height: 24,
          child: CircularProgressIndicator(
            strokeWidth: 2,
            color: Colors.white,
          ),
        ),
      );
    }
    
    if (syncState.pendingConflicts.isNotEmpty) {
      return IconButton(
        icon: Badge(
          label: Text('${syncState.pendingConflicts.length}'),
          child: const Icon(Icons.sync_problem),
        ),
        onPressed: () => _showConflicts(context, ref, syncState),
        tooltip: '${syncState.pendingConflicts.length} sync conflicts',
      );
    }
    
    return IconButton(
      icon: Icon(
        Icons.cloud_done,
        color: syncState.lastSyncResult?.isSuccess ?? true 
            ? Colors.white 
            : Colors.orange,
      ),
      onPressed: () => _performSync(ref),
      tooltip: syncState.lastSyncTime != null 
          ? 'Last sync: ${_formatLastSync(syncState.lastSyncTime!)}'
          : 'Sync now',
    );
  }
  
  void _showSyncSettings(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) => const VoiceJournalSyncWidget(),
    );
  }
  
  void _showConflicts(BuildContext context, WidgetRef ref, SyncState syncState) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => ConflictResolutionSheet(
        conflicts: syncState.pendingConflicts,
      ),
    );
  }
  
  Future<void> _performSync(WidgetRef ref) async {
    final notifier = ref.read(voiceJournalProvider.notifier);
    await notifier.syncToCloud();
  }
  
  String _formatLastSync(DateTime lastSync) {
    final difference = DateTime.now().difference(lastSync);
    
    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inHours < 1) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inDays < 1) {
      return '${difference.inHours}h ago';
    } else {
      return '${difference.inDays}d ago';
    }
  }
}