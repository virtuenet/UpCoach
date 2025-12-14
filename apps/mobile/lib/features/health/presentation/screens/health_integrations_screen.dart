import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../shared/constants/ui_constants.dart';
import '../../models/health_data_point.dart';
import '../../models/health_integration.dart';
import '../../providers/health_provider.dart';
import '../../services/fitbit_service.dart';
import '../../services/garmin_service.dart';
import '../../services/oura_service.dart';
import '../../services/whoop_service.dart';

/// Screen for managing health and wearable integrations
class HealthIntegrationsScreen extends ConsumerStatefulWidget {
  const HealthIntegrationsScreen({super.key});

  @override
  ConsumerState<HealthIntegrationsScreen> createState() =>
      _HealthIntegrationsScreenState();
}

class _HealthIntegrationsScreenState
    extends ConsumerState<HealthIntegrationsScreen> {
  @override
  Widget build(BuildContext context) {
    final healthState = ref.watch(healthProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Health & Device Integrations'),
        centerTitle: true,
        actions: [
          if (healthState.isSyncing)
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            )
          else if (healthState.hasAnyConnection)
            IconButton(
              icon: const Icon(Icons.sync),
              onPressed: () => ref.read(healthProvider.notifier).syncAllData(),
              tooltip: 'Sync now',
            ),
        ],
      ),
      body: healthState.isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(UIConstants.spacingMD),
              children: [
                // Privacy banner
                _buildPrivacyBanner(context),
                const SizedBox(height: UIConstants.spacingMD),

                // Connection status
                if (healthState.hasAnyConnection) ...[
                  _buildConnectionStatusCard(healthState),
                  const SizedBox(height: UIConstants.spacingMD),
                ],

                // Platform Health Services
                _buildSectionHeader(
                  context,
                  'Platform Health Services',
                  Icons.phone_android,
                ),
                const SizedBox(height: UIConstants.spacingSM),
                _buildPlatformHealthCard(healthState),
                const SizedBox(height: UIConstants.spacingLG),

                // Premium Wearables
                _buildSectionHeader(
                  context,
                  'Premium Wearables',
                  Icons.watch,
                ),
                const SizedBox(height: UIConstants.spacingSM),
                ...HealthIntegrations.premiumWearables.map(
                  (integration) => _buildIntegrationTile(
                    context,
                    integration,
                    healthState.integrations,
                  ),
                ),
                const SizedBox(height: UIConstants.spacingLG),

                // Fitness & Sports Apps
                _buildSectionHeader(
                  context,
                  'Fitness & Sports Apps',
                  Icons.fitness_center,
                ),
                const SizedBox(height: UIConstants.spacingSM),
                ...HealthIntegrations.fitnessApps.map(
                  (integration) => _buildIntegrationTile(
                    context,
                    integration,
                    healthState.integrations,
                  ),
                ),
                const SizedBox(height: UIConstants.spacingLG),

                // Nutrition Apps
                _buildSectionHeader(
                  context,
                  'Nutrition & Diet Apps',
                  Icons.restaurant,
                ),
                const SizedBox(height: UIConstants.spacingSM),
                ...HealthIntegrations.nutritionApps.map(
                  (integration) => _buildIntegrationTile(
                    context,
                    integration,
                    healthState.integrations,
                  ),
                ),
                const SizedBox(height: UIConstants.spacingLG),

                // Wellness Apps
                _buildSectionHeader(
                  context,
                  'Wellness & Mental Health',
                  Icons.self_improvement,
                ),
                const SizedBox(height: UIConstants.spacingSM),
                ...HealthIntegrations.wellnessApps.map(
                  (integration) => _buildIntegrationTile(
                    context,
                    integration,
                    healthState.integrations,
                  ),
                ),
                const SizedBox(height: UIConstants.spacingLG),

                // Medical Devices
                _buildSectionHeader(
                  context,
                  'Medical & Health Monitoring',
                  Icons.medical_services,
                ),
                const SizedBox(height: UIConstants.spacingSM),
                ...HealthIntegrations.medicalDevices.map(
                  (integration) => _buildIntegrationTile(
                    context,
                    integration,
                    healthState.integrations,
                  ),
                ),
                const SizedBox(height: UIConstants.spacingXL),

                // Privacy settings link
                _buildPrivacySettingsCard(context),
                const SizedBox(height: UIConstants.spacingLG),
              ],
            ),
    );
  }

  Widget _buildPrivacyBanner(BuildContext context) {
    final privacySettings = ref.watch(healthProvider).privacySettings;

    return Container(
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      decoration: BoxDecoration(
        color: privacySettings.onDeviceOnly
            ? Colors.green.withValues(alpha: 0.1)
            : Colors.blue.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(UIConstants.radiusMD),
        border: Border.all(
          color: privacySettings.onDeviceOnly
              ? Colors.green.withValues(alpha: 0.3)
              : Colors.blue.withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        children: [
          Icon(
            privacySettings.onDeviceOnly ? Icons.lock : Icons.cloud_sync,
            color: privacySettings.onDeviceOnly ? Colors.green : Colors.blue,
            size: 24,
          ),
          const SizedBox(width: UIConstants.spacingMD),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  privacySettings.onDeviceOnly
                      ? 'Privacy Mode: ON'
                      : 'Cloud Sync: ON',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: privacySettings.onDeviceOnly
                            ? Colors.green
                            : Colors.blue,
                      ),
                ),
                const SizedBox(height: 2),
                Text(
                  privacySettings.onDeviceOnly
                      ? 'All health data processed on-device only'
                      : 'Health insights synced to your account',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.grey[600],
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildConnectionStatusCard(HealthState healthState) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.check_circle,
                  color: Colors.green,
                  size: 20,
                ),
                const SizedBox(width: UIConstants.spacingSM),
                Text(
                  '${healthState.connectedIntegrationsCount + (healthState.isPlatformHealthConnected ? 1 : 0)} Sources Connected',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ],
            ),
            if (healthState.lastSyncAt != null) ...[
              const SizedBox(height: UIConstants.spacingSM),
              Text(
                'Last synced: ${_formatLastSync(healthState.lastSyncAt!)}',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.grey[600],
                    ),
              ),
            ],
            if (healthState.totalDataPoints > 0) ...[
              const SizedBox(height: 4),
              Text(
                '${healthState.totalDataPoints} data points stored locally',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.grey[600],
                    ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(
    BuildContext context,
    String title,
    IconData icon,
  ) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppColors.primaryColor),
        const SizedBox(width: UIConstants.spacingSM),
        Text(
          title,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
      ],
    );
  }

  Widget _buildPlatformHealthCard(HealthState healthState) {
    final isConnected = healthState.isPlatformHealthConnected;
    final isAvailable = healthState.isPlatformHealthAvailable;

    return Card(
      child: InkWell(
        onTap: isAvailable
            ? () async {
                if (isConnected) {
                  _showDisconnectDialog(healthState.platformHealthName);
                } else {
                  await ref.read(healthProvider.notifier).connectPlatformHealth();
                }
              }
            : null,
        borderRadius: BorderRadius.circular(UIConstants.radiusMD),
        child: Padding(
          padding: const EdgeInsets.all(UIConstants.spacingMD),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: isConnected
                      ? Colors.green.withValues(alpha: 0.1)
                      : Colors.grey.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(UIConstants.radiusSM),
                ),
                child: Icon(
                  Icons.favorite,
                  color: isConnected ? Colors.green : Colors.grey,
                  size: 24,
                ),
              ),
              const SizedBox(width: UIConstants.spacingMD),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      healthState.platformHealthName,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      isConnected
                          ? 'Connected - Tap to disconnect'
                          : isAvailable
                              ? 'Tap to connect'
                              : 'Not available on this device',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: isConnected
                                ? Colors.green
                                : isAvailable
                                    ? Colors.grey[600]
                                    : Colors.orange,
                          ),
                    ),
                  ],
                ),
              ),
              if (isConnected)
                const Icon(Icons.check_circle, color: Colors.green)
              else if (isAvailable)
                const Icon(Icons.arrow_forward_ios, size: 16),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildIntegrationTile(
    BuildContext context,
    HealthIntegration defaultIntegration,
    List<HealthIntegration> savedIntegrations,
  ) {
    // Find saved state for this integration
    final integration = savedIntegrations.firstWhere(
      (i) => i.source == defaultIntegration.source,
      orElse: () => defaultIntegration,
    );

    final isConnected = integration.status == IntegrationStatus.connected;
    final isSyncing = integration.status == IntegrationStatus.syncing;

    return Card(
      margin: const EdgeInsets.only(bottom: UIConstants.spacingSM),
      child: InkWell(
        onTap: () => _showIntegrationDetails(integration),
        borderRadius: BorderRadius.circular(UIConstants.radiusMD),
        child: Padding(
          padding: const EdgeInsets.all(UIConstants.spacingMD),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Colors.grey.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(UIConstants.radiusSM),
                ),
                child: Icon(
                  _getIconForSource(integration.source),
                  size: 20,
                  color: isConnected ? AppColors.primaryColor : Colors.grey,
                ),
              ),
              const SizedBox(width: UIConstants.spacingMD),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      integration.displayName,
                      style: Theme.of(context).textTheme.titleSmall,
                    ),
                    if (isConnected && integration.lastSyncAt != null)
                      Text(
                        'Last sync: ${_formatLastSync(integration.lastSyncAt!)}',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Colors.grey[600],
                            ),
                      ),
                  ],
                ),
              ),
              if (isSyncing)
                const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              else if (isConnected)
                const Icon(Icons.check_circle, color: Colors.green, size: 20)
              else
                Text(
                  'Connect',
                  style: TextStyle(
                    color: AppColors.primaryColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPrivacySettingsCard(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: () => _showPrivacySettings(),
        borderRadius: BorderRadius.circular(UIConstants.radiusMD),
        child: Padding(
          padding: const EdgeInsets.all(UIConstants.spacingMD),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: Colors.blue.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(UIConstants.radiusSM),
                ),
                child: const Icon(
                  Icons.privacy_tip,
                  color: Colors.blue,
                  size: 24,
                ),
              ),
              const SizedBox(width: UIConstants.spacingMD),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Privacy & Data Settings',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Control how your health data is stored and used',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey[600],
                          ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios, size: 16),
            ],
          ),
        ),
      ),
    );
  }

  void _showDisconnectDialog(String serviceName) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Disconnect $serviceName?'),
        content: const Text(
          'This will stop syncing health data from this source. '
          'Your existing data will be preserved.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              ref.read(healthProvider.notifier).disconnectPlatformHealth();
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Disconnect'),
          ),
        ],
      ),
    );
  }

  void _showIntegrationDetails(HealthIntegration integration) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => _IntegrationDetailsSheet(integration: integration),
    );
  }

  void _showPrivacySettings() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const HealthPrivacySettingsScreen(),
      ),
    );
  }

  IconData _getIconForSource(AppHealthDataSource source) {
    switch (source) {
      case AppHealthDataSource.fitbit:
        return Icons.watch;
      case AppHealthDataSource.garmin:
        return Icons.watch_later;
      case AppHealthDataSource.whoop:
        return Icons.fitness_center;
      case AppHealthDataSource.oura:
        return Icons.ring_volume;
      case AppHealthDataSource.strava:
        return Icons.directions_run;
      case AppHealthDataSource.peloton:
        return Icons.directions_bike;
      case AppHealthDataSource.technogym:
        return Icons.fitness_center;
      case AppHealthDataSource.myFitnessPal:
        return Icons.restaurant_menu;
      case AppHealthDataSource.headspace:
        return Icons.self_improvement;
      case AppHealthDataSource.calm:
        return Icons.spa;
      case AppHealthDataSource.dexcom:
      case AppHealthDataSource.freestyleLibre:
        return Icons.medical_services;
      default:
        return Icons.health_and_safety;
    }
  }

  String _formatLastSync(DateTime lastSync) {
    final now = DateTime.now();
    final diff = now.difference(lastSync);

    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }
}

/// Bottom sheet for integration details
class _IntegrationDetailsSheet extends ConsumerStatefulWidget {
  final HealthIntegration integration;

  const _IntegrationDetailsSheet({required this.integration});

  @override
  ConsumerState<_IntegrationDetailsSheet> createState() =>
      _IntegrationDetailsSheetState();
}

class _IntegrationDetailsSheetState
    extends ConsumerState<_IntegrationDetailsSheet> {
  bool _isConnecting = false;

  @override
  Widget build(BuildContext context) {
    final isConnected =
        widget.integration.status == IntegrationStatus.connected;

    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      maxChildSize: 0.9,
      minChildSize: 0.4,
      expand: false,
      builder: (context, scrollController) => SingleChildScrollView(
        controller: scrollController,
        child: Padding(
          padding: const EdgeInsets.all(UIConstants.spacingLG),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: UIConstants.spacingLG),
              Row(
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: Colors.grey.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(UIConstants.radiusMD),
                    ),
                    child: Icon(
                      _getIconForSource(widget.integration.source),
                      size: 28,
                      color: isConnected ? AppColors.primaryColor : Colors.grey,
                    ),
                  ),
                  const SizedBox(width: UIConstants.spacingMD),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.integration.displayName,
                          style:
                              Theme.of(context).textTheme.titleLarge?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                        ),
                        Text(
                          isConnected ? 'Connected' : 'Not connected',
                          style:
                              Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: isConnected
                                        ? Colors.green
                                        : Colors.grey[600],
                                  ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: UIConstants.spacingLG),
              Text(
                'Available Data Types',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: UIConstants.spacingSM),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: widget.integration.supportedDataTypes.map((type) {
                  return Chip(
                    label: Text(
                      _formatDataType(type),
                      style: const TextStyle(fontSize: 12),
                    ),
                    backgroundColor: Colors.grey.withValues(alpha: 0.1),
                  );
                }).toList(),
              ),
              const SizedBox(height: UIConstants.spacingLG),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isConnecting
                      ? null
                      : () => _handleConnectionToggle(isConnected),
                  style: ElevatedButton.styleFrom(
                    backgroundColor:
                        isConnected ? Colors.red : AppColors.primaryColor,
                  ),
                  child: _isConnecting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : Text(isConnected ? 'Disconnect' : 'Connect'),
                ),
              ),
              const SizedBox(height: UIConstants.spacingMD),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _handleConnectionToggle(bool isConnected) async {
    if (isConnected) {
      await _handleDisconnect();
    } else {
      await _handleConnect();
    }
  }

  Future<void> _handleConnect() async {
    setState(() => _isConnecting = true);

    try {
      bool success = false;
      String? errorMessage;

      switch (widget.integration.source) {
        case AppHealthDataSource.fitbit:
          final fitbitService = ref.read(fitbitServiceProvider);
          success = await fitbitService.connect();
          break;

        case AppHealthDataSource.garmin:
          final garminService = ref.read(garminServiceProvider);
          success = await garminService.connect();
          break;

        case AppHealthDataSource.whoop:
          final whoopService = ref.read(whoopServiceProvider);
          success = await whoopService.connect();
          break;

        case AppHealthDataSource.oura:
          final ouraService = ref.read(ouraServiceProvider);
          success = await ouraService.connect();
          break;

        default:
          errorMessage =
              '${widget.integration.displayName} integration coming soon';
          break;
      }

      if (!mounted) return;

      Navigator.pop(context);

      if (success) {
        // Update the health provider state
        ref.read(healthProvider.notifier).updateIntegrationStatus(
              widget.integration.source,
              IntegrationStatus.connected,
            );

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content:
                Text('Connected to ${widget.integration.displayName}'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              errorMessage ??
                  'Failed to connect to ${widget.integration.displayName}',
            ),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;

      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isConnecting = false);
      }
    }
  }

  Future<void> _handleDisconnect() async {
    setState(() => _isConnecting = true);

    try {
      switch (widget.integration.source) {
        case AppHealthDataSource.fitbit:
          final fitbitService = ref.read(fitbitServiceProvider);
          await fitbitService.disconnect();
          break;

        case AppHealthDataSource.garmin:
          final garminService = ref.read(garminServiceProvider);
          await garminService.disconnect();
          break;

        case AppHealthDataSource.whoop:
          final whoopService = ref.read(whoopServiceProvider);
          await whoopService.disconnect();
          break;

        case AppHealthDataSource.oura:
          final ouraService = ref.read(ouraServiceProvider);
          await ouraService.disconnect();
          break;

        default:
          break;
      }

      if (!mounted) return;

      // Update the health provider state
      ref.read(healthProvider.notifier).updateIntegrationStatus(
            widget.integration.source,
            IntegrationStatus.notConnected,
          );

      Navigator.pop(context);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content:
              Text('Disconnected from ${widget.integration.displayName}'),
        ),
      );
    } catch (e) {
      if (!mounted) return;

      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error disconnecting: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isConnecting = false);
      }
    }
  }

  IconData _getIconForSource(AppHealthDataSource source) {
    switch (source) {
      case AppHealthDataSource.fitbit:
        return Icons.watch;
      case AppHealthDataSource.garmin:
        return Icons.watch_later;
      case AppHealthDataSource.whoop:
        return Icons.fitness_center;
      case AppHealthDataSource.oura:
        return Icons.ring_volume;
      case AppHealthDataSource.strava:
        return Icons.directions_run;
      case AppHealthDataSource.peloton:
        return Icons.directions_bike;
      case AppHealthDataSource.technogym:
        return Icons.fitness_center;
      case AppHealthDataSource.myFitnessPal:
        return Icons.restaurant_menu;
      case AppHealthDataSource.headspace:
        return Icons.self_improvement;
      case AppHealthDataSource.calm:
        return Icons.spa;
      case AppHealthDataSource.dexcom:
      case AppHealthDataSource.freestyleLibre:
        return Icons.medical_services;
      default:
        return Icons.health_and_safety;
    }
  }

  String _formatDataType(AppHealthDataType type) {
    return type.name
        .replaceAllMapped(
          RegExp(r'([A-Z])'),
          (match) => ' ${match.group(1)}',
        )
        .trim()
        .split(' ')
        .map((word) => word[0].toUpperCase() + word.substring(1).toLowerCase())
        .join(' ');
  }
}

/// Privacy settings screen
class HealthPrivacySettingsScreen extends ConsumerStatefulWidget {
  const HealthPrivacySettingsScreen({super.key});

  @override
  ConsumerState<HealthPrivacySettingsScreen> createState() =>
      _HealthPrivacySettingsScreenState();
}

class _HealthPrivacySettingsScreenState
    extends ConsumerState<HealthPrivacySettingsScreen> {
  late HealthPrivacySettings _settings;

  @override
  void initState() {
    super.initState();
    _settings = ref.read(healthProvider).privacySettings;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Privacy & Data'),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        children: [
          _buildPrivacyModeCard(),
          const SizedBox(height: UIConstants.spacingMD),
          _buildSyncSettingsCard(),
          const SizedBox(height: UIConstants.spacingMD),
          _buildDataRetentionCard(),
          const SizedBox(height: UIConstants.spacingMD),
          _buildAiCoachingCard(),
          const SizedBox(height: UIConstants.spacingLG),
          _buildDeleteDataCard(),
        ],
      ),
    );
  }

  Widget _buildPrivacyModeCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.lock, color: AppColors.primaryColor),
                const SizedBox(width: UIConstants.spacingSM),
                Expanded(
                  child: Text(
                    'On-Device Only Mode',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                ),
                Switch(
                  value: _settings.onDeviceOnly,
                  onChanged: (value) => _updateSettings(
                    _settings.copyWith(onDeviceOnly: value),
                  ),
                ),
              ],
            ),
            const SizedBox(height: UIConstants.spacingSM),
            Text(
              'When enabled, all health data stays on your device and is never sent to our servers. '
              'Your health insights are computed locally using on-device AI.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey[600],
                  ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSyncSettingsCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Sync Settings',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: UIConstants.spacingMD),
            SwitchListTile(
              title: const Text('Background Sync'),
              subtitle: const Text('Sync health data in the background'),
              value: _settings.backgroundSyncEnabled,
              onChanged: (value) => _updateSettings(
                _settings.copyWith(backgroundSyncEnabled: value),
              ),
              contentPadding: EdgeInsets.zero,
            ),
            SwitchListTile(
              title: const Text('WiFi Only'),
              subtitle: const Text('Only sync when connected to WiFi'),
              value: _settings.wifiOnlySync,
              onChanged: (value) => _updateSettings(
                _settings.copyWith(wifiOnlySync: value),
              ),
              contentPadding: EdgeInsets.zero,
            ),
            ListTile(
              title: const Text('Sync Frequency'),
              subtitle:
                  Text('Every ${_settings.syncIntervalMinutes} minutes'),
              trailing: const Icon(Icons.arrow_forward_ios, size: 16),
              contentPadding: EdgeInsets.zero,
              onTap: _showSyncFrequencyPicker,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDataRetentionCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Data Retention',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: UIConstants.spacingSM),
            Text(
              'How long to keep health data on your device',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey[600],
                  ),
            ),
            const SizedBox(height: UIConstants.spacingMD),
            _buildRetentionOption(30, '30 days'),
            _buildRetentionOption(90, '90 days'),
            _buildRetentionOption(180, '6 months'),
            _buildRetentionOption(365, '1 year'),
            _buildRetentionOption(0, 'Forever'),
          ],
        ),
      ),
    );
  }

  Widget _buildRetentionOption(int days, String label) {
    return RadioListTile<int>(
      title: Text(label),
      value: days,
      groupValue: _settings.dataRetentionDays,
      onChanged: (value) => _updateSettings(
        _settings.copyWith(dataRetentionDays: value ?? 90),
      ),
      contentPadding: EdgeInsets.zero,
    );
  }

  Widget _buildAiCoachingCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'AI Coaching',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: UIConstants.spacingMD),
            SwitchListTile(
              title: const Text('Use for AI Coaching'),
              subtitle: const Text(
                'Allow on-device AI to use health data for personalized coaching',
              ),
              value: _settings.useForAiCoaching,
              onChanged: (value) => _updateSettings(
                _settings.copyWith(useForAiCoaching: value),
              ),
              contentPadding: EdgeInsets.zero,
            ),
            SwitchListTile(
              title: const Text('Health Notifications'),
              subtitle: const Text(
                'Show health-based insights and recommendations',
              ),
              value: _settings.showHealthNotifications,
              onChanged: (value) => _updateSettings(
                _settings.copyWith(showHealthNotifications: value),
              ),
              contentPadding: EdgeInsets.zero,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDeleteDataCard() {
    return Card(
      color: Colors.red.withValues(alpha: 0.05),
      child: InkWell(
        onTap: _showDeleteConfirmation,
        borderRadius: BorderRadius.circular(UIConstants.radiusMD),
        child: Padding(
          padding: const EdgeInsets.all(UIConstants.spacingMD),
          child: Row(
            children: [
              Icon(Icons.delete_forever, color: Colors.red),
              const SizedBox(width: UIConstants.spacingMD),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Delete All Health Data',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            color: Colors.red,
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    Text(
                      'Permanently delete all stored health data',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.red.withValues(alpha: 0.7),
                          ),
                    ),
                  ],
                ),
              ),
              Icon(Icons.arrow_forward_ios, size: 16, color: Colors.red),
            ],
          ),
        ),
      ),
    );
  }

  void _updateSettings(HealthPrivacySettings settings) {
    setState(() => _settings = settings);
    ref.read(healthProvider.notifier).updatePrivacySettings(settings);
  }

  void _showSyncFrequencyPicker() {
    showModalBottomSheet(
      context: context,
      builder: (context) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: UIConstants.spacingMD),
          const Text(
            'Sync Frequency',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
          ),
          const SizedBox(height: UIConstants.spacingMD),
          ...[5, 15, 30, 60, 120].map((minutes) {
            return ListTile(
              title: Text(
                minutes < 60 ? '$minutes minutes' : '${minutes ~/ 60} hour(s)',
              ),
              trailing: _settings.syncIntervalMinutes == minutes
                  ? const Icon(Icons.check, color: Colors.green)
                  : null,
              onTap: () {
                _updateSettings(
                  _settings.copyWith(syncIntervalMinutes: minutes),
                );
                Navigator.pop(context);
              },
            );
          }),
          const SizedBox(height: UIConstants.spacingLG),
        ],
      ),
    );
  }

  void _showDeleteConfirmation() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete All Health Data?'),
        content: const Text(
          'This will permanently delete all health data stored on your device. '
          'This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              ref.read(healthProvider.notifier).deleteAllData();
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('All health data deleted'),
                  backgroundColor: Colors.red,
                ),
              );
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}
