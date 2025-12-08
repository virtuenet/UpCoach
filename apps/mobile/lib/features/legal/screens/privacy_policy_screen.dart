import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

/// Privacy Policy screen displaying the app's privacy policy
class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  static const String _privacyPolicyUrl = 'https://upcoach.com/privacy';
  static const String _lastUpdated = 'December 1, 2024';

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Privacy Policy'),
        actions: [
          IconButton(
            icon: const Icon(Icons.open_in_browser),
            onPressed: () => _openInBrowser(),
            tooltip: 'Open in browser',
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Privacy Policy',
              style: theme.textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Last updated: $_lastUpdated',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 24),
            _buildSection(
              context,
              'Introduction',
              '''UpCoach ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.

Please read this privacy policy carefully. By using the app, you agree to the collection and use of information in accordance with this policy.''',
            ),
            _buildSection(
              context,
              'Information We Collect',
              '''We collect information that you provide directly to us, including:

• Account Information: Email address, name, and profile picture when you create an account.

• Health & Wellness Data: Habits, goals, mood entries, journal entries, and progress data you choose to track.

• Voice Recordings: Audio recordings when you use voice coaching or voice journaling features (processed locally or with your consent).

• Usage Data: Information about how you interact with the app, including features used and time spent.

• Device Information: Device type, operating system, and unique device identifiers for app functionality and analytics.''',
            ),
            _buildSection(
              context,
              'How We Use Your Information',
              '''We use the information we collect to:

• Provide, maintain, and improve our services
• Personalize your coaching experience with AI recommendations
• Process your voice inputs for coaching and journaling features
• Send you notifications about your goals, habits, and achievements
• Analyze usage patterns to improve the app
• Communicate with you about updates, features, and support
• Ensure the security and integrity of our services''',
            ),
            _buildSection(
              context,
              'Data Storage & Security',
              '''Your data security is important to us:

• Data Encryption: All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption.

• Local Storage: Sensitive data like voice recordings can be stored locally on your device with your preference.

• Secure Authentication: We use industry-standard authentication methods including biometric options.

• Access Controls: Strict access controls limit who can access your data within our organization.

• Regular Audits: We conduct regular security audits and penetration testing.''',
            ),
            _buildSection(
              context,
              'Data Sharing',
              '''We do not sell your personal information. We may share your information only in the following circumstances:

• With your consent or at your direction
• With service providers who assist in operating our services (under strict confidentiality agreements)
• To comply with legal obligations or respond to lawful requests
• To protect our rights, privacy, safety, or property
• In connection with a merger, acquisition, or sale of assets (with prior notice)''',
            ),
            _buildSection(
              context,
              'Your Rights & Choices',
              '''You have the following rights regarding your data:

• Access: Request a copy of your personal data
• Correction: Update or correct inaccurate data
• Deletion: Request deletion of your account and data
• Export: Download your data in a portable format
• Opt-out: Disable analytics and non-essential data collection
• Notifications: Control push notification preferences

You can exercise these rights through the app settings or by contacting us.''',
            ),
            _buildSection(
              context,
              'Children\'s Privacy',
              '''UpCoach is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.''',
            ),
            _buildSection(
              context,
              'International Data Transfers',
              '''Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with this privacy policy.''',
            ),
            _buildSection(
              context,
              'Changes to This Policy',
              '''We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.''',
            ),
            _buildSection(
              context,
              'Contact Us',
              '''If you have any questions about this Privacy Policy, please contact us:

Email: privacy@upcoach.com
Website: https://upcoach.com/contact
Address: UpCoach Inc.''',
            ),
            const SizedBox(height: 32),
            Center(
              child: OutlinedButton.icon(
                onPressed: () => _openInBrowser(),
                icon: const Icon(Icons.open_in_browser),
                label: const Text('View Full Policy Online'),
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(BuildContext context, String title, String content) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: theme.textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            content,
            style: theme.textTheme.bodyMedium?.copyWith(
              height: 1.6,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _openInBrowser() async {
    final uri = Uri.parse(_privacyPolicyUrl);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}
