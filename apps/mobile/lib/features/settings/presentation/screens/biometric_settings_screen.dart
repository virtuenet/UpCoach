import 'package:flutter/material.dart';
import 'package:upcoach_mobile/shared/constants/ui_constants.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/services/biometric_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../l10n/app_localizations.dart';

class BiometricSettingsScreen extends ConsumerStatefulWidget {
  const BiometricSettingsScreen({super.key});

  @override
  ConsumerState<BiometricSettingsScreen> createState() =>
      _BiometricSettingsScreenState();
}

class _BiometricSettingsScreenState
    extends ConsumerState<BiometricSettingsScreen> {
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final biometricAvailable = ref.watch(isBiometricAvailableProvider);
    final biometricEnabled = ref.watch(isBiometricEnabledProvider);
    final availableBiometrics = ref.watch(availableBiometricsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.security),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        children: [
          _buildBiometricCard(l10n, biometricAvailable, biometricEnabled),
          const SizedBox(height: UIConstants.spacingMD),
          if (biometricEnabled.value ?? false) ...[
            _buildAuthTimeoutCard(l10n),
            const SizedBox(height: UIConstants.spacingMD),
          ],
          _buildAvailableBiometricsCard(l10n, availableBiometrics),
          const SizedBox(height: UIConstants.spacingMD),
          _buildSecurityTips(l10n),
        ],
      ),
    );
  }

  Widget _buildBiometricCard(
    AppLocalizations l10n,
    AsyncValue<bool> biometricAvailable,
    AsyncValue<bool> biometricEnabled,
  ) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.fingerprint,
                  color: AppColors.primaryColor,
                  size: 28,
                ),
                const SizedBox(width: UIConstants.spacingMD),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Biometric Authentication',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: UIConstants.spacingXS),
                      Text(
                        'Use your fingerprint or face to unlock the app',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Colors.grey[600],
                            ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: UIConstants.spacingMD),
            biometricAvailable.when(
              data: (isAvailable) {
                if (!isAvailable) {
                  return Container(
                    padding: const EdgeInsets.all(UIConstants.spacingMD),
                    decoration: BoxDecoration(
                      color: Colors.orange.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(UIConstants.radiusMD),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.info_outline,
                          color: Colors.orange,
                          size: 20,
                        ),
                        const SizedBox(width: UIConstants.spacingSM),
                        Expanded(
                          child: Text(
                            'Biometric authentication is not available on this device',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ),
                      ],
                    ),
                  );
                }

                return biometricEnabled.when(
                  data: (isEnabled) => SwitchListTile(
                    value: isEnabled,
                    onChanged:
                        _isLoading ? null : (value) => _toggleBiometric(value),
                    title: Text(isEnabled ? 'Enabled' : 'Disabled'),
                    contentPadding: EdgeInsets.zero,
                  ),
                  loading: () => const CircularProgressIndicator(),
                  error: (_, _) => const Text('Error loading settings'),
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (_, _) =>
                  const Text('Error checking biometric availability'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAuthTimeoutCard(AppLocalizations l10n) {
    final biometricService = ref.read(biometricServiceProvider);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Re-authentication Required',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: UIConstants.spacingSM),
            Text(
              'How often should you re-authenticate?',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey[600],
                  ),
            ),
            const SizedBox(height: UIConstants.spacingMD),
            FutureBuilder<int>(
              future: biometricService.getAuthRequiredAfter(),
              builder: (context, snapshot) {
                final currentValue = snapshot.data ?? 300;
                return RadioGroup<int>(
                  groupValue: currentValue,
                  onChanged: (value) async {
                    if (value != null) {
                      final service = ref.read(biometricServiceProvider);
                      await service.setAuthRequiredAfter(value);
                      setState(() {});
                    }
                  },
                  child: Column(
                    children: [
                      _buildTimeoutOption('Immediately', 0),
                      _buildTimeoutOption('After 5 minutes', 300),
                      _buildTimeoutOption('After 15 minutes', 900),
                      _buildTimeoutOption('After 30 minutes', 1800),
                      _buildTimeoutOption('After 1 hour', 3600),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTimeoutOption(String label, int seconds) {
    return RadioListTile<int>(
      value: seconds,
      title: Text(label),
      contentPadding: EdgeInsets.zero,
    );
  }

  Widget _buildAvailableBiometricsCard(
    AppLocalizations l10n,
    AsyncValue<List<AppBiometricType>> availableBiometrics,
  ) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Available Biometric Methods',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: UIConstants.spacingMD),
            availableBiometrics.when(
              data: (biometrics) {
                if (biometrics.isEmpty) {
                  return Text(
                    'No biometric methods available',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.grey[600],
                        ),
                  );
                }
                return Column(
                  children: biometrics.map((type) {
                    IconData icon;
                    String label;
                    switch (type) {
                      case AppBiometricType.face:
                        icon = Icons.face;
                        label = 'Face Recognition';
                        break;
                      case AppBiometricType.fingerprint:
                        icon = Icons.fingerprint;
                        label = 'Fingerprint';
                        break;
                      case AppBiometricType.iris:
                        icon = Icons.remove_red_eye;
                        label = 'Iris Scan';
                        break;
                      case AppBiometricType.unknown:
                        icon = Icons.security;
                        label = 'Unknown';
                        break;
                    }
                    return ListTile(
                      leading: Icon(icon, color: AppColors.primaryColor),
                      title: Text(label),
                      contentPadding: EdgeInsets.zero,
                    );
                  }).toList(),
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (_, _) => const Text('Error loading biometric methods'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSecurityTips(AppLocalizations l10n) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.lightbulb_outline,
                  color: Colors.amber,
                  size: 24,
                ),
                const SizedBox(width: UIConstants.spacingSM),
                Text(
                  'Security Tips',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ],
            ),
            const SizedBox(height: UIConstants.spacingMD),
            _buildTip(
                'Enable biometric authentication for quick and secure access'),
            _buildTip('Your biometric data is stored securely on your device'),
            _buildTip('We never have access to your biometric information'),
            _buildTip('You can always use your password as a backup'),
          ],
        ),
      ),
    );
  }

  Widget _buildTip(String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('• ', style: TextStyle(color: Colors.grey[600])),
          Expanded(
            child: Text(
              text,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey[600],
                  ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _toggleBiometric(bool enable) async {
    setState(() => _isLoading = true);

    try {
      final biometricService = ref.read(biometricServiceProvider);

      if (enable) {
        // Authenticate first before enabling
        final authenticated = await biometricService.authenticateWithBiometrics(
          reason: 'Authenticate to enable biometric login',
        );

        if (authenticated) {
          await biometricService.setBiometricEnabled(true);
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Biometric authentication enabled'),
                backgroundColor: Colors.green,
              ),
            );
          }
        }
      } else {
        await biometricService.setBiometricEnabled(false);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Biometric authentication disabled'),
            ),
          );
        }
      }

      // Refresh the state
      ref.invalidate(isBiometricEnabledProvider);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }
}
