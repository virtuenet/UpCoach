import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/config/feature_flags.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/constants/ui_constants.dart';
import '../../../shared/widgets/custom_app_bar.dart';
import '../../../core/providers/connectivity_provider.dart';
import '../../../core/services/offline_sync_service.dart';
import '../../../core/services/sync_integration_service.dart';
import '../../../core/sync/sync_manager.dart' hide SyncStatus;
import '../../../core/sync/sync_manager.dart' as sync_manager show SyncStatus;

class OfflineSettingsScreen extends ConsumerStatefulWidget {
  const OfflineSettingsScreen({super.key});

  @override
  ConsumerState<OfflineSettingsScreen> createState() =>
      _OfflineSettingsScreenState();
}

class _OfflineSettingsScreenState extends ConsumerState<OfflineSettingsScreen> {
  bool _autoSync = true;
  bool _syncOnWifiOnly = false;
  bool _keepOfflineData = true;
  Map<String, dynamic>? _offlineDataStats;
  bool _isLoadingStats = true;

  @override
  void initState() {
    super.initState();
    _loadSettings();
    _loadOfflineDataStats();
  }

  Future<void> _loadSettings() async {
    // In a real app, load these from SharedPreferences
    setState(() {
      _autoSync = true;
      _syncOnWifiOnly = false;
      _keepOfflineData = true;
    });
  }

  Future<void> _loadOfflineDataStats() async {
    setState(() => _isLoadingStats = true);
    try {
      final syncService = ref.read(offlineSyncServiceProvider);
      final stats = await syncService.getOfflineDataSize();
      setState(() {
        _offlineDataStats = stats;
        _isLoadingStats = false;
      });
    } catch (e) {
      setState(() {
        _offlineDataStats = null;
        _isLoadingStats = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final connectivityState = ref.watch(connectivityProvider);

    return Scaffold(
      appBar: const CustomAppBar(title: 'Offline & Sync'),
      body: RefreshIndicator(
        onRefresh: () async {
          await ref.read(connectivityProvider.notifier).refresh();
          await _loadOfflineDataStats();
        },
        child: ListView(
          children: [
            // Connection Status Card
            _buildConnectionStatusCard(connectivityState),

            // Sync Controls Section
            _buildSyncControlsSection(connectivityState),

            const Divider(height: 32),

            // Sync Settings Section
            _buildSyncSettingsSection(),

            const Divider(height: 32),

            // Offline Data Section
            _buildOfflineDataSection(),

            const Divider(height: 32),

            // Pending Operations Section
            if (connectivityState.hasPendingChanges)
              _buildPendingOperationsSection(connectivityState),

            // Conflicts Section
            if (connectivityState.hasConflicts)
              _buildConflictsSection(connectivityState),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildConnectionStatusCard(ConnectivityState state) {
    final isOnline = state.isOnline;
    final statusColor = isOnline ? AppColors.success : AppColors.warning;
    final statusIcon = isOnline ? Icons.wifi : Icons.wifi_off;
    final statusText = isOnline ? 'Connected' : 'Offline Mode';

    return Container(
      margin: const EdgeInsets.all(UIConstants.spacingMD),
      padding: const EdgeInsets.all(UIConstants.spacingLG),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            statusColor.withValues(alpha: 0.1),
            statusColor.withValues(alpha: 0.05),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(UIConstants.radiusLG),
        border: Border.all(color: statusColor.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                ),
                child: Icon(statusIcon, color: statusColor, size: 32),
              ),
              const SizedBox(width: UIConstants.spacingMD),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      statusText,
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: statusColor,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      state.statusMessage,
                      style: TextStyle(
                        fontSize: 14,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              if (state.isSyncing)
                const SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
            ],
          ),
          if (state.lastSyncTime != null) ...[
            const SizedBox(height: UIConstants.spacingMD),
            Row(
              children: [
                Icon(Icons.sync, size: 16, color: AppColors.textSecondary),
                const SizedBox(width: 8),
                Text(
                  'Last synced: ${_formatLastSync(state.lastSyncTime!)}',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSyncControlsSection(ConnectivityState state) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: UIConstants.spacingMD),
      child: Row(
        children: [
          Expanded(
            child: ElevatedButton.icon(
              onPressed:
                  state.isOnline && !state.isSyncing ? () => _syncNow() : null,
              icon: state.isSyncing
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.sync),
              label: Text(state.isSyncing ? 'Syncing...' : 'Sync Now'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ),
          const SizedBox(width: UIConstants.spacingMD),
          Expanded(
            child: OutlinedButton.icon(
              onPressed: () => _showSyncHistory(),
              icon: const Icon(Icons.history),
              label: const Text('History'),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSyncSettingsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader('Sync Settings'),
        SwitchListTile(
          title: const Text('Auto-sync'),
          subtitle: const Text('Automatically sync when connected'),
          value: _autoSync,
          onChanged: (value) {
            setState(() => _autoSync = value);
            // Save preference
          },
          secondary: const Icon(Icons.autorenew),
        ),
        SwitchListTile(
          title: const Text('Sync on Wi-Fi only'),
          subtitle: const Text('Save mobile data by syncing only on Wi-Fi'),
          value: _syncOnWifiOnly,
          onChanged: _autoSync
              ? (value) {
                  setState(() => _syncOnWifiOnly = value);
                  // Save preference
                }
              : null,
          secondary: const Icon(Icons.wifi),
        ),
        SwitchListTile(
          title: const Text('Keep offline data'),
          subtitle: const Text('Store data locally for offline access'),
          value: _keepOfflineData,
          onChanged: (value) {
            if (!value) {
              _showDisableOfflineDataDialog();
            } else {
              setState(() => _keepOfflineData = value);
            }
          },
          secondary: const Icon(Icons.storage),
        ),
      ],
    );
  }

  Widget _buildOfflineDataSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader('Offline Data'),
        if (_isLoadingStats)
          const Padding(
            padding: EdgeInsets.all(UIConstants.spacingLG),
            child: Center(child: CircularProgressIndicator()),
          )
        else if (_offlineDataStats != null)
          _buildOfflineDataStats()
        else
          const ListTile(
            title: Text('Unable to load offline data statistics'),
            leading: Icon(Icons.error_outline, color: AppColors.error),
          ),
        const SizedBox(height: UIConstants.spacingSM),
        Padding(
          padding:
              const EdgeInsets.symmetric(horizontal: UIConstants.spacingMD),
          child: Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _exportOfflineData(),
                  icon: const Icon(Icons.upload),
                  label: const Text('Export'),
                ),
              ),
              const SizedBox(width: UIConstants.spacingSM),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _importOfflineData(),
                  icon: const Icon(Icons.download),
                  label: const Text('Import'),
                ),
              ),
              const SizedBox(width: UIConstants.spacingSM),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _showClearOfflineDataDialog(),
                  icon:
                      const Icon(Icons.delete_outline, color: AppColors.error),
                  label: const Text(
                    'Clear',
                    style: TextStyle(color: AppColors.error),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppColors.error),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildOfflineDataStats() {
    final stats = _offlineDataStats!;
    final totalBytes = stats['totalSizeBytes'] as int? ?? 0;
    final habitsCount = stats['habitsCount'] as int? ?? 0;
    final completionsCount = stats['completionsCount'] as int? ?? 0;
    final voiceJournalsCount = stats['voiceJournalsCount'] as int? ?? 0;
    final pendingOps = stats['pendingOperations'] as int? ?? 0;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: UIConstants.spacingMD),
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(UIConstants.radiusMD),
        border: Border.all(color: AppColors.outline),
      ),
      child: Column(
        children: [
          _buildStatRow(
            'Total Storage',
            _formatBytes(totalBytes),
            Icons.storage,
          ),
          const Divider(height: 16),
          _buildStatRow(
            'Habits',
            '$habitsCount items',
            Icons.check_circle_outline,
          ),
          _buildStatRow(
            'Completions',
            '$completionsCount records',
            Icons.done_all,
          ),
          _buildStatRow(
            'Voice Journals',
            '$voiceJournalsCount entries',
            Icons.mic,
          ),
          if (pendingOps > 0) ...[
            const Divider(height: 16),
            _buildStatRow(
              'Pending Sync',
              '$pendingOps operations',
              Icons.sync_problem,
              color: AppColors.warning,
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStatRow(String label, String value, IconData icon,
      {Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 20, color: color ?? AppColors.textSecondary),
          const SizedBox(width: 12),
          Text(
            label,
            style: TextStyle(
              color: color ?? AppColors.textSecondary,
            ),
          ),
          const Spacer(),
          Text(
            value,
            style: TextStyle(
              fontWeight: FontWeight.w600,
              color: color ?? AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPendingOperationsSection(ConnectivityState state) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader('Pending Changes'),
        Container(
          margin: const EdgeInsets.symmetric(horizontal: UIConstants.spacingMD),
          padding: const EdgeInsets.all(UIConstants.spacingMD),
          decoration: BoxDecoration(
            color: AppColors.warning.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(UIConstants.radiusMD),
            border: Border.all(color: AppColors.warning.withValues(alpha: 0.3)),
          ),
          child: Row(
            children: [
              const Icon(Icons.pending_actions, color: AppColors.warning),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${state.pendingOperationsCount} pending operations',
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        color: AppColors.warning,
                      ),
                    ),
                    const Text(
                      'These changes will sync when you\'re back online',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const Divider(height: 32),
      ],
    );
  }

  Widget _buildConflictsSection(ConnectivityState state) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader('Sync Conflicts'),
        Container(
          margin: const EdgeInsets.symmetric(horizontal: UIConstants.spacingMD),
          padding: const EdgeInsets.all(UIConstants.spacingMD),
          decoration: BoxDecoration(
            color: AppColors.error.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(UIConstants.radiusMD),
            border: Border.all(color: AppColors.error.withValues(alpha: 0.3)),
          ),
          child: Column(
            children: [
              Row(
                children: [
                  const Icon(Icons.warning_amber, color: AppColors.error),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${state.pendingConflictsCount} conflicts need resolution',
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            color: AppColors.error,
                          ),
                        ),
                        const Text(
                          'Some changes conflict with server data',
                          style: TextStyle(
                            fontSize: 12,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: UIConstants.spacingMD),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => _resolveAllConflicts(keepLocal: true),
                      child: const Text('Keep Local'),
                    ),
                  ),
                  const SizedBox(width: UIConstants.spacingSM),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => _resolveAllConflicts(keepLocal: false),
                      child: const Text('Keep Server'),
                    ),
                  ),
                  const SizedBox(width: UIConstants.spacingSM),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => _showConflictResolutionDialog(),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('Review'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const Divider(height: 32),
      ],
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        UIConstants.spacingMD,
        UIConstants.spacingMD,
        UIConstants.spacingMD,
        UIConstants.spacingSM,
      ),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: AppColors.textSecondary,
        ),
      ),
    );
  }

  String _formatLastSync(DateTime time) {
    final now = DateTime.now();
    final diff = now.difference(time);

    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes} minutes ago';
    if (diff.inHours < 24) return '${diff.inHours} hours ago';
    if (diff.inDays < 7) return '${diff.inDays} days ago';

    return DateFormat('MMM d, yyyy HH:mm').format(time);
  }

  String _formatBytes(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    if (bytes < 1024 * 1024 * 1024) {
      return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    }
    return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
  }

  Future<void> _syncNow() async {
    await ref.read(connectivityProvider.notifier).syncNow();
    await _loadOfflineDataStats();

    if (!mounted) return;
    final state = ref.read(connectivityProvider);
    if (state.syncStatus == sync_manager.SyncStatus.success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Sync completed successfully'),
          backgroundColor: AppColors.success,
        ),
      );
    } else if (state.syncStatus == sync_manager.SyncStatus.failed) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Sync failed: ${state.syncError ?? "Unknown error"}'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  void _showSyncHistory() {
    showModalBottomSheet(
      context: context,
      showDragHandle: true,
      builder: (context) => Container(
        padding: const EdgeInsets.all(UIConstants.spacingLG),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Sync History',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: UIConstants.spacingMD),
            const Text(
              'Recent sync activity will be shown here.',
              style: TextStyle(color: AppColors.textSecondary),
            ),
            const SizedBox(height: UIConstants.spacingLG),
            // Placeholder for sync history list
            Container(
              padding: const EdgeInsets.all(UIConstants.spacingMD),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(UIConstants.radiusMD),
              ),
              child: const Row(
                children: [
                  Icon(Icons.info_outline, color: AppColors.textSecondary),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Sync history tracking coming in a future update',
                      style: TextStyle(color: AppColors.textSecondary),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: UIConstants.spacingLG),
          ],
        ),
      ),
    );
  }

  void _showDisableOfflineDataDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Disable Offline Data?'),
        content: const Text(
          'Disabling offline data will clear all locally stored data. '
          'You will need an internet connection to use the app.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              setState(() => _keepOfflineData = false);
              // Clear offline data
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Disable'),
          ),
        ],
      ),
    );
  }

  void _showClearOfflineDataDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear Offline Data?'),
        content: const Text(
          'This will delete all locally cached data. '
          'Any pending changes that haven\'t been synced will be lost.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              await _clearOfflineData();
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Clear'),
          ),
        ],
      ),
    );
  }

  Future<void> _clearOfflineData() async {
    try {
      final syncService = ref.read(offlineSyncServiceProvider);
      await syncService.clearOfflineData();
      await _loadOfflineDataStats();

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Offline data cleared'),
          backgroundColor: AppColors.success,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to clear data: $e'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  Future<void> _exportOfflineData() async {
    try {
      final syncService = ref.read(offlineSyncServiceProvider);
      final data = await syncService.exportOfflineData();

      if (!mounted) return;
      // Show export dialog
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.check_circle, color: AppColors.success),
              SizedBox(width: 12),
              Text('Data Exported'),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Habits: ${(data['habits'] as List?)?.length ?? 0}'),
              Text(
                  'Completions: ${(data['completions'] as List?)?.length ?? 0}'),
              Text(
                  'Voice Journals: ${(data['voiceJournals'] as List?)?.length ?? 0}'),
              const SizedBox(height: 12),
              const Text(
                'Data exported to clipboard/file',
                style: TextStyle(color: AppColors.textSecondary),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('OK'),
            ),
          ],
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to export: $e'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  Future<void> _importOfflineData() async {
    // Show import dialog
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Import Offline Data'),
        content: const Text(
          'This feature allows you to restore offline data from a backup. '
          'Any existing data will be merged with the imported data.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: ref.read(isFeatureEnabledProvider(Feature.offlineImport))
                ? () {
                    Navigator.pop(context);
                    // TODO: Implement file picker for import when feature is enabled
                  }
                : () {
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Import from file is coming soon!'),
                      ),
                    );
                  },
            child: Text(
              ref.read(isFeatureEnabledProvider(Feature.offlineImport))
                  ? 'Select File'
                  : 'Coming Soon',
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _resolveAllConflicts({required bool keepLocal}) async {
    try {
      final syncService = ref.read(syncIntegrationServiceProvider);
      final conflicts = syncService.pendingConflicts;

      for (final conflict in conflicts) {
        await syncService.resolveConflict(
          conflict,
          keepLocal
              ? ConflictResolution.keepLocal
              : ConflictResolution.keepServer,
        );
      }

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Conflicts resolved - ${keepLocal ? "local" : "server"} data kept',
          ),
          backgroundColor: AppColors.success,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to resolve conflicts: $e'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  void _showConflictResolutionDialog() {
    final syncService = ref.read(syncIntegrationServiceProvider);
    final conflicts = syncService.pendingConflicts;

    if (conflicts.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No conflicts to resolve')),
      );
      return;
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (context, scrollController) => Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(UIConstants.spacingMD),
              child: Row(
                children: [
                  const Icon(Icons.warning_amber, color: AppColors.warning),
                  const SizedBox(width: 12),
                  Text(
                    '${conflicts.length} Conflicts',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
            const Divider(),
            Expanded(
              child: ListView.builder(
                controller: scrollController,
                itemCount: conflicts.length,
                itemBuilder: (context, index) {
                  final conflict = conflicts[index];
                  return _buildConflictTile(conflict);
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildConflictTile(SyncConflict conflict) {
    return ExpansionTile(
      leading: const Icon(Icons.sync_problem, color: AppColors.warning),
      title: Text('${conflict.entityType} - ${conflict.entityId}'),
      subtitle: Text(
        'Local: ${_formatLastSync(conflict.localTimestamp)} | '
        'Server: ${_formatLastSync(conflict.serverTimestamp)}',
        style: const TextStyle(fontSize: 12),
      ),
      children: [
        Padding(
          padding: const EdgeInsets.all(UIConstants.spacingMD),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Local Changes:',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  conflict.localData.toString(),
                  style: const TextStyle(fontSize: 12, fontFamily: 'monospace'),
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Server Data:',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  conflict.serverData.toString(),
                  style: const TextStyle(fontSize: 12, fontFamily: 'monospace'),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () async {
                        await ref
                            .read(syncIntegrationServiceProvider)
                            .resolveConflict(
                              conflict,
                              ConflictResolution.keepLocal,
                            );
                        if (mounted) Navigator.pop(context);
                      },
                      child: const Text('Keep Local'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () async {
                        await ref
                            .read(syncIntegrationServiceProvider)
                            .resolveConflict(
                              conflict,
                              ConflictResolution.keepServer,
                            );
                        if (mounted) Navigator.pop(context);
                      },
                      child: const Text('Keep Server'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}
