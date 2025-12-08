import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/ondevice/on_device_llm_manager.dart';
import '../../../../core/ondevice/on_device_llm_state.dart';
import '../../../../core/services/hybrid_ai_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/constants/ui_constants.dart';

class OnDeviceAISettingsScreen extends ConsumerWidget {
  const OnDeviceAISettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final llmState = ref.watch(onDeviceLlmManagerProvider);
    final hybridAI = ref.watch(hybridAIServiceProvider);
    final aiStatus = hybridAI.getStatus();

    return Scaffold(
      appBar: AppBar(
        title: const Text('On-Device AI'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        children: [
          _buildStatusCard(context, llmState, aiStatus),
          const SizedBox(height: UIConstants.spacingMD),
          _buildSettingsSection(context, ref, llmState),
          const SizedBox(height: UIConstants.spacingMD),
          _buildInferenceModeSection(context, ref, hybridAI),
          const SizedBox(height: UIConstants.spacingMD),
          _buildModelSection(context, ref, llmState),
          if (llmState.status == OnDeviceModelStatus.ready) ...[
            const SizedBox(height: UIConstants.spacingMD),
            _buildPerformanceSection(context, ref, llmState),
          ],
        ],
      ),
    );
  }

  Widget _buildStatusCard(
    BuildContext context,
    OnDeviceLlmState state,
    Map<String, dynamic> aiStatus,
  ) {
    Color statusColor;
    IconData statusIcon;
    String statusText;

    switch (state.status) {
      case OnDeviceModelStatus.ready:
        statusColor = Colors.green;
        statusIcon = Icons.check_circle;
        statusText = 'Ready';
        break;
      case OnDeviceModelStatus.downloading:
        statusColor = Colors.blue;
        statusIcon = Icons.downloading;
        statusText = 'Downloading (${(state.downloadProgress * 100).toInt()}%)';
        break;
      case OnDeviceModelStatus.error:
        statusColor = Colors.red;
        statusIcon = Icons.error;
        statusText = 'Error';
        break;
      case OnDeviceModelStatus.notInstalled:
        statusColor = Colors.grey;
        statusIcon = Icons.cloud_download;
        statusText = 'Not Installed';
        break;
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(statusIcon, color: statusColor, size: 32),
                ),
                const SizedBox(width: UIConstants.spacingMD),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'On-Device AI Status',
                        style:
                            Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              color: statusColor,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            statusText,
                            style: TextStyle(color: statusColor),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            if (state.status == OnDeviceModelStatus.downloading) ...[
              const SizedBox(height: UIConstants.spacingMD),
              LinearProgressIndicator(
                value: state.downloadProgress,
                backgroundColor: Colors.grey[200],
                valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
              ),
            ],
            if (state.lastError != null) ...[
              const SizedBox(height: UIConstants.spacingSM),
              Text(
                state.lastError!,
                style: TextStyle(color: Colors.red[700], fontSize: 12),
              ),
            ],
            const SizedBox(height: UIConstants.spacingMD),
            Row(
              children: [
                _StatusChip(
                  label: 'Online',
                  isActive: aiStatus['isOnline'] == true,
                ),
                const SizedBox(width: 8),
                _StatusChip(
                  label: 'Offline Ready',
                  isActive: aiStatus['onDeviceAvailable'] == true,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSettingsSection(
    BuildContext context,
    WidgetRef ref,
    OnDeviceLlmState state,
  ) {
    return Card(
      child: Column(
        children: [
          SwitchListTile(
            title: const Text('Enable On-Device AI'),
            subtitle: const Text(
              'Use local AI model for faster, offline responses',
            ),
            value: state.enabled,
            onChanged: (value) {
              ref.read(onDeviceLlmManagerProvider.notifier).setEnabled(value);
            },
          ),
          const Divider(height: 1),
          SwitchListTile(
            title: const Text('Auto-Download Model'),
            subtitle: const Text(
              'Automatically download model when enabled',
            ),
            value: state.autoDownload,
            onChanged: state.enabled
                ? (value) {
                    ref
                        .read(onDeviceLlmManagerProvider.notifier)
                        .setAutoDownload(value);
                  }
                : null,
          ),
        ],
      ),
    );
  }

  Widget _buildInferenceModeSection(
    BuildContext context,
    WidgetRef ref,
    HybridAIService hybridAI,
  ) {
    final currentMode = hybridAI.config.mode;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Inference Mode',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'Choose how AI responses are generated',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey[600],
                  ),
            ),
            const SizedBox(height: UIConstants.spacingMD),
            ...AIInferenceMode.values.map((mode) {
              final isSelected = mode == currentMode;
              return ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Container(
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isSelected ? AppColors.primary : Colors.grey,
                      width: 2,
                    ),
                  ),
                  child: isSelected
                      ? Center(
                          child: Container(
                            width: 12,
                            height: 12,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: AppColors.primary,
                            ),
                          ),
                        )
                      : null,
                ),
                title: Text(_getModeName(mode)),
                subtitle: Text(
                  _getModeDescription(mode),
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                onTap: () {
                  hybridAI.setConfig(HybridAIConfig(mode: mode));
                },
              );
            }),
          ],
        ),
      ),
    );
  }

  Widget _buildModelSection(
    BuildContext context,
    WidgetRef ref,
    OnDeviceLlmState state,
  ) {
    final model = state.activeModel;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Model',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                if (state.status == OnDeviceModelStatus.ready)
                  TextButton.icon(
                    icon: const Icon(Icons.delete_outline, size: 18),
                    label: const Text('Remove'),
                    onPressed: () {
                      _showRemoveModelDialog(context, ref);
                    },
                  ),
              ],
            ),
            const SizedBox(height: UIConstants.spacingMD),
            Container(
              padding: const EdgeInsets.all(UIConstants.spacingMD),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.memory, size: 24),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              model.name,
                              style: Theme.of(context)
                                  .textTheme
                                  .titleSmall
                                  ?.copyWith(fontWeight: FontWeight.bold),
                            ),
                            Text(
                              'Backend: ${model.backend}',
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        ),
                      ),
                      Text(
                        '${model.sizeMB} MB',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                    ],
                  ),
                  if (state.lastUpdated != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      'Last updated: ${_formatDate(state.lastUpdated!)}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey[600],
                          ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: UIConstants.spacingMD),
            if (state.status == OnDeviceModelStatus.notInstalled)
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  icon: const Icon(Icons.download),
                  label: const Text('Download Model'),
                  onPressed: state.enabled
                      ? () {
                          ref
                              .read(onDeviceLlmManagerProvider.notifier)
                              .downloadActiveModel();
                        }
                      : null,
                ),
              ),
            if (state.status == OnDeviceModelStatus.downloading)
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  icon: const Icon(Icons.cancel),
                  label: const Text('Cancel Download'),
                  onPressed: () {
                    ref
                        .read(onDeviceLlmManagerProvider.notifier)
                        .cancelDownload();
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildPerformanceSection(
    BuildContext context,
    WidgetRef ref,
    OnDeviceLlmState state,
  ) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Performance',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: UIConstants.spacingMD),
            if (state.lastLatencyMs != null)
              _PerformanceRow(
                label: 'Last Response Time',
                value: '${state.lastLatencyMs} ms',
                icon: Icons.speed,
              ),
            const SizedBox(height: 8),
            _PerformanceRow(
              label: 'Model Status',
              value: state.status.name,
              icon: Icons.info_outline,
            ),
          ],
        ),
      ),
    );
  }

  void _showRemoveModelDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove Model?'),
        content: const Text(
          'This will delete the downloaded model from your device. '
          'You can re-download it later.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              ref.read(onDeviceLlmManagerProvider.notifier).removeModel();
              Navigator.pop(context);
            },
            child: const Text('Remove'),
          ),
        ],
      ),
    );
  }

  String _getModeName(AIInferenceMode mode) {
    switch (mode) {
      case AIInferenceMode.serverOnly:
        return 'Server Only';
      case AIInferenceMode.onDeviceOnly:
        return 'On-Device Only';
      case AIInferenceMode.onDevicePreferred:
        return 'On-Device Preferred';
      case AIInferenceMode.serverPreferred:
        return 'Server Preferred';
      case AIInferenceMode.auto:
        return 'Automatic';
    }
  }

  String _getModeDescription(AIInferenceMode mode) {
    switch (mode) {
      case AIInferenceMode.serverOnly:
        return 'Always use cloud AI (requires internet)';
      case AIInferenceMode.onDeviceOnly:
        return 'Always use local AI (works offline)';
      case AIInferenceMode.onDevicePreferred:
        return 'Use local AI when possible, cloud as fallback';
      case AIInferenceMode.serverPreferred:
        return 'Use cloud AI when online, local as fallback';
      case AIInferenceMode.auto:
        return 'Automatically choose based on query and connection';
    }
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year} ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
  }
}

class _StatusChip extends StatelessWidget {
  final String label;
  final bool isActive;

  const _StatusChip({required this.label, required this.isActive});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color:
            isActive ? Colors.green.withValues(alpha: 0.1) : Colors.grey[200],
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isActive ? Colors.green : Colors.grey[400]!,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isActive ? Icons.check_circle : Icons.cancel,
            size: 14,
            color: isActive ? Colors.green : Colors.grey[600],
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: isActive ? Colors.green[700] : Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }
}

class _PerformanceRow extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;

  const _PerformanceRow({
    required this.label,
    required this.value,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 20, color: Colors.grey[600]),
        const SizedBox(width: 12),
        Expanded(child: Text(label)),
        Text(
          value,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
      ],
    );
  }
}
