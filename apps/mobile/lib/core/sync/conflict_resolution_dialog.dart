// Conflict Resolution Dialog Widget
//
// Provides a UI for users to manually resolve sync conflicts.

import 'package:flutter/material.dart';
import 'sync_manager.dart';

class ConflictResolutionDialog extends StatefulWidget {
  final SyncConflict conflict;
  final Function(ConflictResolution) onResolved;

  const ConflictResolutionDialog({
    super.key,
    required this.conflict,
    required this.onResolved,
  });

  @override
  State<ConflictResolutionDialog> createState() =>
      _ConflictResolutionDialogState();
}

class _ConflictResolutionDialogState extends State<ConflictResolutionDialog> {
  ConflictResolution? _selectedResolution;
  bool _showDetails = false;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Row(
        children: [
          const Icon(Icons.warning_amber_rounded, color: Colors.orange),
          const SizedBox(width: 8),
          const Expanded(
            child: Text(
              'Sync Conflict Detected',
              style: TextStyle(fontSize: 18),
            ),
          ),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Changes were made to this ${widget.conflict.entityType} both on this device and on the server.',
              style: TextStyle(color: Colors.grey[700]),
            ),
            const SizedBox(height: 16),
            _buildTimestampInfo(),
            const SizedBox(height: 16),
            _buildResolutionOptions(),
            const SizedBox(height: 16),
            _buildDetailsToggle(),
            if (_showDetails) ...[
              const SizedBox(height: 16),
              _buildDetailsView(),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: _selectedResolution != null
              ? () {
                  widget.onResolved(_selectedResolution!);
                  Navigator.of(context).pop();
                }
              : null,
          child: const Text('Resolve'),
        ),
      ],
    );
  }

  Widget _buildTimestampInfo() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.smartphone, size: 16),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Local: ${_formatTimestamp(widget.conflict.localTimestamp)}',
                  style: const TextStyle(fontSize: 13),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              const Icon(Icons.cloud, size: 16),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Server: ${_formatTimestamp(widget.conflict.serverTimestamp)}',
                  style: const TextStyle(fontSize: 13),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildResolutionOptions() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'How would you like to resolve this?',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        RadioGroup<ConflictResolution>(
          groupValue: _selectedResolution,
          onChanged: (value) => setState(() => _selectedResolution = value),
          child: Column(
            children: [
              RadioListTile<ConflictResolution>(
                title: const Text('Keep Local Changes'),
                subtitle: const Text('Use the version from this device'),
                value: ConflictResolution.keepLocal,
                dense: true,
              ),
              RadioListTile<ConflictResolution>(
                title: const Text('Keep Server Changes'),
                subtitle: const Text('Use the version from the server'),
                value: ConflictResolution.keepServer,
                dense: true,
              ),
              RadioListTile<ConflictResolution>(
                title: const Text('Use Newer Version'),
                subtitle: Text(
                  widget.conflict.localTimestamp
                          .isAfter(widget.conflict.serverTimestamp)
                      ? 'Local is newer'
                      : 'Server is newer',
                ),
                value: ConflictResolution.newerWins,
                dense: true,
              ),
              RadioListTile<ConflictResolution>(
                title: const Text('Merge Changes'),
                subtitle: const Text('Combine both versions (advanced)'),
                value: ConflictResolution.merge,
                dense: true,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildDetailsToggle() {
    return TextButton.icon(
      onPressed: () => setState(() => _showDetails = !_showDetails),
      icon: Icon(_showDetails ? Icons.expand_less : Icons.expand_more),
      label: Text(_showDetails ? 'Hide Details' : 'Show Details'),
    );
  }

  Widget _buildDetailsView() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey[300]!),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Local Data:',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          _buildDataPreview(widget.conflict.localData),
          const SizedBox(height: 12),
          const Text(
            'Server Data:',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          _buildDataPreview(widget.conflict.serverData),
        ],
      ),
    );
  }

  Widget _buildDataPreview(Map<String, dynamic> data) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(4),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: data.entries.map((entry) {
          if (entry.key == 'id' || entry.key.startsWith('_')) {
            return const SizedBox.shrink();
          }

          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 2),
            child: RichText(
              text: TextSpan(
                style: const TextStyle(color: Colors.black87, fontSize: 12),
                children: [
                  TextSpan(
                    text: '${entry.key}: ',
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  TextSpan(
                    text: _formatValue(entry.value),
                  ),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  String _formatTimestamp(DateTime timestamp) {
    final now = DateTime.now();
    final difference = now.difference(timestamp);

    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inHours < 1) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inDays < 1) {
      return '${difference.inHours}h ago';
    } else if (difference.inDays < 7) {
      return '${difference.inDays}d ago';
    } else {
      return '${timestamp.month}/${timestamp.day}/${timestamp.year}';
    }
  }

  String _formatValue(dynamic value) {
    if (value == null) return 'null';
    if (value is String) {
      return value.length > 50 ? '${value.substring(0, 50)}...' : value;
    }
    if (value is DateTime) return _formatTimestamp(value);
    return value.toString();
  }
}

/// Helper widget to show sync status
class SyncStatusIndicator extends StatelessWidget {
  final SyncManager syncManager;

  const SyncStatusIndicator({
    super.key,
    required this.syncManager,
  });

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: syncManager,
      builder: (context, _) {
        if (syncManager.status == SyncStatus.idle &&
            !syncManager.hasPendingOperations) {
          return const SizedBox.shrink();
        }

        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: _getStatusColor().withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: _getStatusColor()),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildStatusIcon(),
              const SizedBox(width: 8),
              Text(
                _getStatusText(),
                style: TextStyle(
                  color: _getStatusColor(),
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
              if (syncManager.pendingCount > 0) ...[
                const SizedBox(width: 4),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: _getStatusColor(),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    '${syncManager.pendingCount}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatusIcon() {
    switch (syncManager.status) {
      case SyncStatus.syncing:
        return const SizedBox(
          width: 12,
          height: 12,
          child: CircularProgressIndicator(strokeWidth: 2),
        );
      case SyncStatus.success:
        return const Icon(Icons.check_circle, size: 16);
      case SyncStatus.failed:
        return const Icon(Icons.error, size: 16);
      case SyncStatus.conflict:
        return const Icon(Icons.warning_amber_rounded, size: 16);
      case SyncStatus.idle:
        return const Icon(Icons.sync, size: 16);
    }
  }

  String _getStatusText() {
    switch (syncManager.status) {
      case SyncStatus.syncing:
        return 'Syncing...';
      case SyncStatus.success:
        return 'Synced';
      case SyncStatus.failed:
        return 'Sync Failed';
      case SyncStatus.conflict:
        return 'Conflicts (${syncManager.conflictCount})';
      case SyncStatus.idle:
        return syncManager.hasPendingOperations ? 'Pending' : 'Up to date';
    }
  }

  Color _getStatusColor() {
    switch (syncManager.status) {
      case SyncStatus.syncing:
        return Colors.blue;
      case SyncStatus.success:
        return Colors.green;
      case SyncStatus.failed:
        return Colors.red;
      case SyncStatus.conflict:
        return Colors.orange;
      case SyncStatus.idle:
        return Colors.grey;
    }
  }
}
