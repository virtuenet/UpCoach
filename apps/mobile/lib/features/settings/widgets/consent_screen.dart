/// Consent Management Screen - Phase 14 Week 4
/// GDPR/CCPA compliant consent management UI

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

enum ConsentType {
  essential,
  analytics,
  marketing,
  personalization,
  thirdPartySharing,
}

class ConsentItem {
  final ConsentType type;
  final String title;
  final String description;
  final bool required;
  bool granted;

  ConsentItem({
    required this.type,
    required this.title,
    required this.description,
    required this.required,
    this.granted = false,
  });
}

class ConsentScreen extends ConsumerStatefulWidget {
  final bool isOnboarding;
  final String? countryCode;

  const ConsentScreen({
    Key? key,
    this.isOnboarding = false,
    this.countryCode,
  }) : super(key: key);

  @override
  ConsumerState<ConsentScreen> createState() => _ConsentScreenState();
}

class _ConsentScreenState extends ConsumerState<ConsentScreen> {
  late List<ConsentItem> consentItems;
  bool isLoading = false;
  bool showDetailedView = false;

  @override
  void initState() {
    super.initState();
    _initializeConsents();
  }

  void _initializeConsents() {
    // Determine consent requirements based on region
    final isEU = _isEUCountry(widget.countryCode);
    final isCalifornia = widget.countryCode == 'US'; // Would check state in production

    consentItems = [
      ConsentItem(
        type: ConsentType.essential,
        title: 'Essential Services',
        description: 'Required for the app to function properly. Includes authentication, account management, and core features.',
        required: true,
        granted: true, // Always granted
      ),
      ConsentItem(
        type: ConsentType.analytics,
        title: 'Analytics & Performance',
        description: 'Helps us understand how you use the app and improve performance. Includes anonymized usage statistics and crash reports.',
        required: false,
        granted: !isEU, // Default opt-in for non-EU, opt-out for EU
      ),
      ConsentItem(
        type: ConsentType.personalization,
        title: 'Personalization',
        description: 'Enables personalized recommendations, habit suggestions, and coaching tips based on your activity.',
        required: false,
        granted: !isEU,
      ),
      ConsentItem(
        type: ConsentType.marketing,
        title: 'Marketing Communications',
        description: 'Receive emails, push notifications about new features, special offers, and personalized tips.',
        required: false,
        granted: false, // Always default opt-out
      ),
      ConsentItem(
        type: ConsentType.thirdPartySharing,
        title: 'Third-Party Sharing',
        description: 'Share anonymized data with partners for research and product improvement. You can see our partners in the privacy policy.',
        required: false,
        granted: false, // Always default opt-out
      ),
    ];
  }

  bool _isEUCountry(String? countryCode) {
    if (countryCode == null) return false;

    const euCountries = [
      'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
      'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
      'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB',
    ];

    return euCountries.contains(countryCode.toUpperCase());
  }

  Future<void> _saveConsents() async {
    setState(() => isLoading = true);

    try {
      // TODO: Save consents to backend
      await Future.delayed(const Duration(seconds: 1)); // Simulated API call

      if (!mounted) return;

      if (widget.isOnboarding) {
        // Navigate to next onboarding step
        Navigator.of(context).pop(true);
      } else {
        // Show confirmation
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Consent preferences saved successfully'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.of(context).pop();
      }
    } catch (error) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error saving consents: $error'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() => isLoading = false);
    }
  }

  void _acceptAll() {
    setState(() {
      for (var consent in consentItems) {
        consent.granted = true;
      }
    });
  }

  void _rejectAll() {
    setState(() {
      for (var consent in consentItems) {
        consent.granted = consent.required; // Keep only required consents
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.isOnboarding ? 'Privacy Preferences' : 'Manage Consent'),
        elevation: 0,
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildHeader(),
                  const SizedBox(height: 24),
                  if (!showDetailedView) _buildQuickActions(),
                  const SizedBox(height: 24),
                  _buildConsentList(),
                  const SizedBox(height: 24),
                  _buildFooter(),
                ],
              ),
            ),
          ),
          _buildBottomBar(),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Your Privacy Matters',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 8),
        Text(
          'We respect your privacy and are committed to protecting your personal data. Choose how we can use your information.',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey[600],
              ),
        ),
      ],
    );
  }

  Widget _buildQuickActions() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Quick Actions',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _acceptAll,
                    icon: const Icon(Icons.check_circle_outline),
                    label: const Text('Accept All'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.green,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _rejectAll,
                    icon: const Icon(Icons.cancel_outlined),
                    label: const Text('Reject All'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.red,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            TextButton.icon(
              onPressed: () {
                setState(() => showDetailedView = !showDetailedView);
              },
              icon: Icon(
                showDetailedView ? Icons.expand_less : Icons.expand_more,
              ),
              label: Text(
                showDetailedView ? 'Hide Details' : 'Show Details',
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildConsentList() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Consent Preferences',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 16),
        ...consentItems.map((consent) => _buildConsentItem(consent)).toList(),
      ],
    );
  }

  Widget _buildConsentItem(ConsentItem consent) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            consent.title,
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                          if (consent.required) ...[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.blue[100],
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                'Required',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.blue[900],
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      if (showDetailedView) ...[
                        const SizedBox(height: 8),
                        Text(
                          consent.description,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: Colors.grey[600],
                              ),
                        ),
                      ],
                    ],
                  ),
                ),
                Switch(
                  value: consent.granted,
                  onChanged: consent.required
                      ? null
                      : (value) {
                          setState(() {
                            consent.granted = value;
                          });
                        },
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFooter() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Divider(),
        const SizedBox(height: 16),
        Text(
          'Learn More',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 12),
        ListTile(
          leading: const Icon(Icons.policy),
          title: const Text('Privacy Policy'),
          trailing: const Icon(Icons.arrow_forward_ios, size: 16),
          onTap: () {
            // TODO: Open privacy policy
          },
        ),
        ListTile(
          leading: const Icon(Icons.cookie),
          title: const Text('Cookie Policy'),
          trailing: const Icon(Icons.arrow_forward_ios, size: 16),
          onTap: () {
            // TODO: Open cookie policy
          },
        ),
        ListTile(
          leading: const Icon(Icons.security),
          title: const Text('Data Security'),
          trailing: const Icon(Icons.arrow_forward_ios, size: 16),
          onTap: () {
            // TODO: Open data security info
          },
        ),
      ],
    );
  }

  Widget _buildBottomBar() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (widget.isOnboarding)
              Text(
                'You can change these preferences anytime in Settings',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.grey[600],
                    ),
                textAlign: TextAlign.center,
              ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: isLoading ? null : _saveConsents,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : Text(
                        widget.isOnboarding ? 'Continue' : 'Save Preferences',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Consent status summary widget for settings
class ConsentStatusSummary extends StatelessWidget {
  final Map<ConsentType, bool> consents;

  const ConsentStatusSummary({
    Key? key,
    required this.consents,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final grantedCount = consents.values.where((granted) => granted).length;
    final totalCount = consents.length;

    return Card(
      child: ListTile(
        leading: Icon(
          Icons.privacy_tip,
          color: Theme.of(context).primaryColor,
        ),
        title: const Text('Privacy & Consent'),
        subtitle: Text('$grantedCount of $totalCount permissions granted'),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) => const ConsentScreen(isOnboarding: false),
            ),
          );
        },
      ),
    );
  }
}
