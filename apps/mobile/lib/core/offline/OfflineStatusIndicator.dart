import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'OfflineDataSyncEngine.dart';
import 'ConflictResolutionService.dart';

/// Offline status indicator widget
///
/// Displays:
/// - Sync status (online, offline, syncing)
/// - Pending changes counter
/// - Sync progress
/// - Error states
/// - Manual sync trigger
/// - Sync history
class OfflineStatusIndicator extends StatefulWidget {
  final OfflineDataSyncEngine syncEngine;
  final ConflictResolutionService conflictResolver;
  final bool showDetailedInfo;
  final bool allowManualSync;
  final EdgeInsets? padding;
  final bool showOnboardingTips;

  const OfflineStatusIndicator({
    Key? key,
    required this.syncEngine,
    required this.conflictResolver,
    this.showDetailedInfo = false,
    this.allowManualSync = true,
    this.padding,
    this.showOnboardingTips = false,
  }) : super(key: key);

  @override
  State<OfflineStatusIndicator> createState() => _OfflineStatusIndicatorState();
}

class _OfflineStatusIndicatorState extends State<OfflineStatusIndicator>
    with SingleTickerProviderStateMixin {
  SyncStatus _currentStatus = SyncStatus.idle;
  SyncProgress? _currentProgress;
  int _pendingChanges = 0;
  int _pendingConflicts = 0;

  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  StreamSubscription<SyncStatus>? _statusSubscription;
  StreamSubscription<SyncProgress>? _progressSubscription;
  StreamSubscription<int>? _pendingSubscription;
  StreamSubscription<Conflict>? _conflictSubscription;

  bool _showDetails = false;
  bool _showOnboarding = false;

  @override
  void initState() {
    super.initState();
    _initializeAnimations();
    _subscribeToStreams();
    _loadInitialData();

    if (widget.showOnboardingTips) {
      _checkOnboardingStatus();
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _statusSubscription?.cancel();
    _progressSubscription?.cancel();
    _pendingSubscription?.cancel();
    _conflictSubscription?.cancel();
    super.dispose();
  }

  void _initializeAnimations() {
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );

    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.15).animate(
      CurvedAnimation(
        parent: _pulseController,
        curve: Curves.easeInOut,
      ),
    );

    _pulseController.repeat(reverse: true);
  }

  void _subscribeToStreams() {
    _statusSubscription = widget.syncEngine.syncStatusStream.listen((status) {
      if (mounted) {
        setState(() {
          _currentStatus = status;
        });
      }
    });

    _progressSubscription = widget.syncEngine.syncProgressStream.listen((progress) {
      if (mounted) {
        setState(() {
          _currentProgress = progress;
        });
      }
    });

    _pendingSubscription = widget.syncEngine.pendingChangesStream.listen((count) {
      if (mounted) {
        setState(() {
          _pendingChanges = count;
        });
      }
    });

    _conflictSubscription = widget.conflictResolver.conflictStream.listen((_) {
      _loadConflictCount();
    });
  }

  Future<void> _loadInitialData() async {
    await _loadConflictCount();
  }

  Future<void> _loadConflictCount() async {
    final conflicts = await widget.conflictResolver.getPendingConflicts();
    if (mounted) {
      setState(() {
        _pendingConflicts = conflicts.length;
      });
    }
  }

  Future<void> _checkOnboardingStatus() async {
    // Check if user has seen offline mode onboarding
    // In a real app, this would check SharedPreferences
    await Future.delayed(const Duration(milliseconds: 500));
    if (mounted && _pendingChanges == 0) {
      setState(() {
        _showOnboarding = false;
      });
    }
  }

  void _triggerManualSync() async {
    if (_currentStatus == SyncStatus.syncing) return;

    final result = await widget.syncEngine.performSync(SyncType.full);

    if (!mounted) return;

    if (result.success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Sync completed: ${result.itemsSynced} items synced',
          ),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Sync failed: ${result.error}'),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
          action: SnackBarAction(
            label: 'Retry',
            textColor: Colors.white,
            onPressed: _triggerManualSync,
          ),
        ),
      );
    }
  }

  void _showSyncHistory() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _SyncHistorySheet(
        syncEngine: widget.syncEngine,
        conflictResolver: widget.conflictResolver,
      ),
    );
  }

  void _showConflicts() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _ConflictListSheet(
        conflictResolver: widget.conflictResolver,
      ),
    );
  }

  Color _getStatusColor() {
    switch (_currentStatus) {
      case SyncStatus.idle:
        return Colors.grey;
      case SyncStatus.connecting:
        return Colors.orange;
      case SyncStatus.syncing:
        return Colors.blue;
      case SyncStatus.synced:
        return Colors.green;
      case SyncStatus.error:
        return Colors.red;
    }
  }

  IconData _getStatusIcon() {
    switch (_currentStatus) {
      case SyncStatus.idle:
        return Icons.cloud_off;
      case SyncStatus.connecting:
        return Icons.cloud_queue;
      case SyncStatus.syncing:
        return Icons.cloud_sync;
      case SyncStatus.synced:
        return Icons.cloud_done;
      case SyncStatus.error:
        return Icons.cloud_off;
    }
  }

  String _getStatusText() {
    switch (_currentStatus) {
      case SyncStatus.idle:
        return 'Offline';
      case SyncStatus.connecting:
        return 'Connecting...';
      case SyncStatus.syncing:
        return _getSyncingText();
      case SyncStatus.synced:
        return 'Synced';
      case SyncStatus.error:
        return 'Sync Error';
    }
  }

  String _getSyncingText() {
    if (_currentProgress == null) return 'Syncing...';

    final percent = (_currentProgress!.progress * 100).toInt();
    switch (_currentProgress!.stage) {
      case SyncStage.uploadingChanges:
        return 'Uploading $percent%';
      case SyncStage.downloadingChanges:
        return 'Downloading $percent%';
      case SyncStage.resolvingConflicts:
        return 'Resolving conflicts...';
    }
  }

  String _getLastSyncText() {
    final lastSync = widget.syncEngine.lastSyncTime;
    if (lastSync == null) return 'Never synced';

    final diff = DateTime.now().difference(lastSync);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }

  @override
  Widget build(BuildContext context) {
    if (_showOnboarding) {
      return _buildOnboarding();
    }

    if (!widget.showDetailedInfo) {
      return _buildCompactIndicator();
    }

    return _buildDetailedIndicator();
  }

  Widget _buildOnboarding() {
    return Material(
      color: Colors.blue.shade50,
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Icon(Icons.info_outline, color: Colors.blue.shade700, size: 32),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Offline Mode Available',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            color: Colors.blue.shade900,
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () {
                      setState(() {
                        _showOnboarding = false;
                      });
                    },
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                'You can now use UpCoach without an internet connection. '
                'All your changes will be automatically synced when you\'re back online.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.blue.shade900,
                    ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  _buildOnboardingFeature(
                    Icons.offline_bolt,
                    'Work Offline',
                    'Full app functionality',
                  ),
                  const SizedBox(width: 16),
                  _buildOnboardingFeature(
                    Icons.sync,
                    'Auto Sync',
                    'Seamless updates',
                  ),
                  const SizedBox(width: 16),
                  _buildOnboardingFeature(
                    Icons.security,
                    'Conflict Free',
                    'Smart merging',
                  ),
                ],
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  setState(() {
                    _showOnboarding = false;
                  });
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue.shade700,
                  minimumSize: const Size(double.infinity, 48),
                ),
                child: const Text('Got it!'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildOnboardingFeature(IconData icon, String title, String subtitle) {
    return Expanded(
      child: Column(
        children: [
          Icon(icon, color: Colors.blue.shade700, size: 32),
          const SizedBox(height: 8),
          Text(
            title,
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
                  color: Colors.blue.shade900,
                  fontWeight: FontWeight.bold,
                ),
            textAlign: TextAlign.center,
          ),
          Text(
            subtitle,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: Colors.blue.shade700,
                ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildCompactIndicator() {
    return Semantics(
      label: 'Sync status: ${_getStatusText()}',
      button: true,
      child: GestureDetector(
        onTap: () {
          setState(() {
            _showDetails = !_showDetails;
          });
        },
        child: Container(
          margin: widget.padding,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: _getStatusColor().withOpacity(0.1),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: _getStatusColor().withOpacity(0.3),
              width: 1,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (_currentStatus == SyncStatus.syncing)
                ScaleTransition(
                  scale: _pulseAnimation,
                  child: Icon(
                    _getStatusIcon(),
                    size: 20,
                    color: _getStatusColor(),
                  ),
                )
              else
                Icon(
                  _getStatusIcon(),
                  size: 20,
                  color: _getStatusColor(),
                ),
              const SizedBox(width: 8),
              Text(
                _getStatusText(),
                style: TextStyle(
                  color: _getStatusColor(),
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
              if (_pendingChanges > 0) ...[
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: _getStatusColor(),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    '$_pendingChanges',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailedIndicator() {
    return Card(
      margin: widget.padding ?? const EdgeInsets.all(16),
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                if (_currentStatus == SyncStatus.syncing)
                  ScaleTransition(
                    scale: _pulseAnimation,
                    child: Icon(
                      _getStatusIcon(),
                      size: 32,
                      color: _getStatusColor(),
                    ),
                  )
                else
                  Icon(
                    _getStatusIcon(),
                    size: 32,
                    color: _getStatusColor(),
                  ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _getStatusText(),
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      Text(
                        'Last sync: ${_getLastSyncText()}',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Colors.grey.shade600,
                            ),
                      ),
                    ],
                  ),
                ),
                if (widget.allowManualSync)
                  IconButton(
                    icon: const Icon(Icons.refresh),
                    onPressed: _currentStatus == SyncStatus.syncing
                        ? null
                        : _triggerManualSync,
                    tooltip: 'Sync now',
                  ),
              ],
            ),
            if (_currentProgress != null && _currentStatus == SyncStatus.syncing) ...[
              const SizedBox(height: 16),
              LinearProgressIndicator(
                value: _currentProgress!.progress,
                backgroundColor: Colors.grey.shade200,
                valueColor: AlwaysStoppedAnimation<Color>(_getStatusColor()),
              ),
              const SizedBox(height: 8),
              Text(
                '${_currentProgress!.itemsProcessed} of ${_currentProgress!.totalItems} items',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _buildInfoChip(
                  icon: Icons.pending_actions,
                  label: 'Pending',
                  value: '$_pendingChanges',
                  color: _pendingChanges > 0 ? Colors.orange : Colors.grey,
                ),
                if (_pendingConflicts > 0)
                  _buildInfoChip(
                    icon: Icons.warning,
                    label: 'Conflicts',
                    value: '$_pendingConflicts',
                    color: Colors.red,
                    onTap: _showConflicts,
                  ),
                _buildInfoChip(
                  icon: Icons.data_usage,
                  label: 'Bandwidth',
                  value: _formatBytes(
                    widget.syncEngine.bandwidthUsage['total'] ?? 0,
                  ),
                  color: Colors.blue,
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _showSyncHistory,
                    icon: const Icon(Icons.history, size: 18),
                    label: const Text('History'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _currentStatus == SyncStatus.syncing
                        ? null
                        : _triggerManualSync,
                    icon: const Icon(Icons.sync, size: 18),
                    label: const Text('Sync Now'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _getStatusColor(),
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

  Widget _buildInfoChip({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
    VoidCallback? onTap,
  }) {
    return Semantics(
      label: '$label: $value',
      button: onTap != null,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Chip(
          avatar: Icon(icon, size: 16, color: color),
          label: Text('$label: $value'),
          labelStyle: const TextStyle(fontSize: 12),
          backgroundColor: color.withOpacity(0.1),
          side: BorderSide(color: color.withOpacity(0.3)),
        ),
      ),
    );
  }

  String _formatBytes(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }
}

class _SyncHistorySheet extends StatelessWidget {
  final OfflineDataSyncEngine syncEngine;
  final ConflictResolutionService conflictResolver;

  const _SyncHistorySheet({
    required this.syncEngine,
    required this.conflictResolver,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border(
                bottom: BorderSide(color: Colors.grey.shade200),
              ),
            ),
            child: Row(
              children: [
                const Icon(Icons.history),
                const SizedBox(width: 12),
                Text(
                  'Sync History',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          Expanded(
            child: syncEngine.syncHistory.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.history, size: 64, color: Colors.grey.shade300),
                        const SizedBox(height: 16),
                        Text(
                          'No sync history yet',
                          style: TextStyle(
                            color: Colors.grey.shade600,
                            fontSize: 16,
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    itemCount: syncEngine.syncHistory.length,
                    itemBuilder: (context, index) {
                      final entry = syncEngine.syncHistory[index];
                      return _buildHistoryItem(context, entry);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildHistoryItem(BuildContext context, SyncHistoryEntry entry) {
    return ListTile(
      leading: Icon(
        entry.success ? Icons.check_circle : Icons.error,
        color: entry.success ? Colors.green : Colors.red,
      ),
      title: Text(
        entry.success
            ? '${entry.itemsSynced} items synced'
            : 'Sync failed',
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(_formatDateTime(entry.timestamp)),
          if (entry.conflicts > 0)
            Text(
              '${entry.conflicts} conflicts resolved',
              style: const TextStyle(color: Colors.orange),
            ),
          if (entry.error != null)
            Text(
              entry.error!,
              style: const TextStyle(color: Colors.red),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
        ],
      ),
      trailing: entry.duration != null
          ? Text(
              '${entry.duration!.inSeconds}s',
              style: Theme.of(context).textTheme.bodySmall,
            )
          : null,
    );
  }

  String _formatDateTime(DateTime dateTime) {
    final now = DateTime.now();
    final diff = now.difference(dateTime);

    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays == 1) return 'Yesterday';
    if (diff.inDays < 7) return '${diff.inDays}d ago';

    return '${dateTime.month}/${dateTime.day}/${dateTime.year}';
  }
}

class _ConflictListSheet extends StatefulWidget {
  final ConflictResolutionService conflictResolver;

  const _ConflictListSheet({
    required this.conflictResolver,
  });

  @override
  State<_ConflictListSheet> createState() => _ConflictListSheetState();
}

class _ConflictListSheetState extends State<_ConflictListSheet> {
  List<Conflict> _conflicts = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadConflicts();
  }

  Future<void> _loadConflicts() async {
    final conflicts = await widget.conflictResolver.getPendingConflicts();
    setState(() {
      _conflicts = conflicts;
      _loading = false;
    });
  }

  void _resolveConflict(Conflict conflict, bool useLocal) async {
    final resolvedData = useLocal ? conflict.localData : conflict.remoteData;

    await widget.conflictResolver.resolveManually(
      conflict.id,
      resolvedData,
    );

    await _loadConflicts();

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Conflict resolved'),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border(
                bottom: BorderSide(color: Colors.grey.shade200),
              ),
            ),
            child: Row(
              children: [
                const Icon(Icons.warning, color: Colors.orange),
                const SizedBox(width: 12),
                Text(
                  'Conflicts (${_conflicts.length})',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _conflicts.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.check_circle,
                                size: 64, color: Colors.green.shade300),
                            const SizedBox(height: 16),
                            Text(
                              'No conflicts to resolve',
                              style: TextStyle(
                                color: Colors.grey.shade600,
                                fontSize: 16,
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        itemCount: _conflicts.length,
                        itemBuilder: (context, index) {
                          final conflict = _conflicts[index];
                          return _buildConflictItem(context, conflict);
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildConflictItem(BuildContext context, Conflict conflict) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.warning, color: Colors.orange.shade700, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    '${conflict.entityType} conflict',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'ID: ${conflict.entityId}',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey.shade600,
                  ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => _resolveConflict(conflict, true),
                    icon: const Icon(Icons.phone_android, size: 18),
                    label: const Text('Keep Local'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => _resolveConflict(conflict, false),
                    icon: const Icon(Icons.cloud, size: 18),
                    label: const Text('Keep Server'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
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
}
