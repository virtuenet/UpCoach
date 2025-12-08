import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

/// Terms of Service screen displaying the app's terms and conditions
class TermsOfServiceScreen extends StatelessWidget {
  const TermsOfServiceScreen({super.key});

  static const String _termsUrl = 'https://upcoach.com/terms';
  static const String _lastUpdated = 'December 1, 2024';

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Terms of Service'),
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
              'Terms of Service',
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
              'Agreement to Terms',
              '''By accessing or using the UpCoach mobile application ("App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the App.

These Terms constitute a legally binding agreement between you and UpCoach Inc. ("Company", "we", "us", or "our") concerning your use of the App.''',
            ),
            _buildSection(
              context,
              'Description of Service',
              '''UpCoach is an AI-powered personal coaching application that provides:

• AI voice coaching and guidance
• Habit tracking and analytics
• Goal setting and progress monitoring
• Mood and wellness tracking
• Voice journaling capabilities
• Community features
• Gamification elements

The App is designed to support your personal development journey but is not a substitute for professional medical, psychological, or therapeutic advice.''',
            ),
            _buildSection(
              context,
              'User Accounts',
              '''To use certain features of the App, you must create an account. You agree to:

• Provide accurate, current, and complete information during registration
• Maintain and promptly update your account information
• Keep your login credentials secure and confidential
• Notify us immediately of any unauthorized use of your account
• Accept responsibility for all activities that occur under your account

We reserve the right to suspend or terminate accounts that violate these Terms.''',
            ),
            _buildSection(
              context,
              'User Content',
              '''You retain ownership of content you create within the App, including:

• Journal entries and notes
• Goals and habit data
• Voice recordings
• Profile information

By using the App, you grant us a non-exclusive, worldwide, royalty-free license to use, store, and process your content solely for the purpose of providing and improving our services.

You agree not to submit content that:
• Is illegal, harmful, or offensive
• Infringes on intellectual property rights
• Contains malware or harmful code
• Violates the privacy of others''',
            ),
            _buildSection(
              context,
              'Subscription & Payments',
              '''UpCoach offers both free and premium subscription tiers:

Free Tier: Basic access to core features with limitations.

Premium Subscription: Full access to all features, including:
• Unlimited AI coaching conversations
• Advanced analytics and insights
• Priority support
• Exclusive content and features

Subscription Terms:
• Subscriptions automatically renew unless cancelled
• Cancellation must be done at least 24 hours before renewal
• Refunds are handled according to app store policies
• Prices may change with reasonable notice''',
            ),
            _buildSection(
              context,
              'Acceptable Use',
              '''You agree to use the App only for lawful purposes and in accordance with these Terms. You agree NOT to:

• Use the App in any way that violates applicable laws
• Attempt to gain unauthorized access to our systems
• Interfere with or disrupt the App's functionality
• Use automated systems to access the App without permission
• Collect user information without consent
• Impersonate others or provide false information
• Use the App for commercial purposes without authorization
• Reverse engineer, decompile, or modify the App''',
            ),
            _buildSection(
              context,
              'AI and Health Disclaimer',
              '''IMPORTANT: The AI coaching features in UpCoach are designed to provide general guidance and support for personal development. They are NOT:

• Medical advice or diagnosis
• Psychological or psychiatric treatment
• A substitute for professional healthcare
• Emergency mental health services

If you are experiencing a medical or mental health emergency, please contact emergency services or a qualified healthcare provider immediately.

The AI may occasionally provide inaccurate or inappropriate responses. Always use your own judgment and consult professionals for important decisions.''',
            ),
            _buildSection(
              context,
              'Intellectual Property',
              '''The App and its original content, features, and functionality are owned by UpCoach Inc. and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.

Our trademarks may not be used without our prior written consent. You may not copy, modify, distribute, sell, or lease any part of our App or included software.''',
            ),
            _buildSection(
              context,
              'Limitation of Liability',
              '''TO THE MAXIMUM EXTENT PERMITTED BY LAW:

• The App is provided "AS IS" without warranties of any kind
• We do not guarantee uninterrupted or error-free service
• We are not liable for any indirect, incidental, special, or consequential damages
• Our total liability is limited to the amount you paid us in the past 12 months
• We are not responsible for third-party content or services

Some jurisdictions do not allow certain limitations of liability, so some of these may not apply to you.''',
            ),
            _buildSection(
              context,
              'Indemnification',
              '''You agree to indemnify and hold harmless UpCoach Inc. and its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:

• Your use of the App
• Your violation of these Terms
• Your violation of any third-party rights
• Any content you submit through the App''',
            ),
            _buildSection(
              context,
              'Changes to Terms',
              '''We reserve the right to modify these Terms at any time. We will notify you of material changes through the App or via email. Your continued use of the App after changes are posted constitutes acceptance of the modified Terms.

We encourage you to review these Terms periodically.''',
            ),
            _buildSection(
              context,
              'Termination',
              '''We may terminate or suspend your account and access to the App immediately, without prior notice, for conduct that we believe:

• Violates these Terms
• Is harmful to other users
• Is harmful to our business interests

Upon termination, your right to use the App will cease immediately. You may request export of your data before account deletion.''',
            ),
            _buildSection(
              context,
              'Governing Law',
              '''These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions.

Any disputes arising from these Terms shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.''',
            ),
            _buildSection(
              context,
              'Contact Information',
              '''For questions about these Terms of Service, please contact us:

Email: legal@upcoach.com
Website: https://upcoach.com/contact
Address: UpCoach Inc.''',
            ),
            const SizedBox(height: 32),
            Center(
              child: OutlinedButton.icon(
                onPressed: () => _openInBrowser(),
                icon: const Icon(Icons.open_in_browser),
                label: const Text('View Full Terms Online'),
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
    final uri = Uri.parse(_termsUrl);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}
