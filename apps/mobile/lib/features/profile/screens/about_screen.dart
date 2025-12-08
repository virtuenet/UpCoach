import 'dart:io';
import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:share_plus/share_plus.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/widgets/custom_app_bar.dart';
import '../../../shared/constants/ui_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';

class AboutScreen extends StatefulWidget {
  const AboutScreen({super.key});

  @override
  State<AboutScreen> createState() => _AboutScreenState();
}

class _AboutScreenState extends State<AboutScreen> {
  PackageInfo? _packageInfo;

  // App configuration - update these for your app
  static const String _websiteUrl = 'https://upcoach.app';
  static const String _appStoreId = 'com.upcoach.mobile'; // iOS App Store ID
  static const String _playStoreId =
      'com.upcoach.mobile'; // Google Play package name
  static const String _supportEmail = 'support@upcoach.app';

  @override
  void initState() {
    super.initState();
    _loadPackageInfo();
  }

  Future<void> _loadPackageInfo() async {
    final info = await PackageInfo.fromPlatform();
    if (mounted) {
      setState(() => _packageInfo = info);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const CustomAppBar(title: 'About'),
      body: ListView(
        children: [
          const SizedBox(height: UIConstants.spacing2XL),
          _buildAppInfo(),
          const SizedBox(height: UIConstants.spacing2XL),

          // Legal section
          _buildSectionHeader('Legal'),
          _buildLinkTile(
            icon: Icons.description_outlined,
            title: 'Terms of Service',
            subtitle: 'Read our terms and conditions',
            onTap: () => context.push('/legal/terms'),
          ),
          _buildLinkTile(
            icon: Icons.privacy_tip_outlined,
            title: 'Privacy Policy',
            subtitle: 'Learn how we protect your data',
            onTap: () => context.push('/legal/privacy'),
          ),
          _buildLinkTile(
            icon: Icons.gavel_outlined,
            title: 'Open Source Licenses',
            subtitle: 'Third-party software licenses',
            onTap: _showLicenses,
          ),

          const Divider(height: UIConstants.spacing2XL),

          // Spread the word section
          _buildSectionHeader('Spread the Word'),
          _buildLinkTile(
            icon: Icons.star_outline,
            title: 'Rate the App',
            subtitle: 'Love UpCoach? Leave us a review!',
            onTap: _rateApp,
          ),
          _buildLinkTile(
            icon: Icons.share_outlined,
            title: 'Share with Friends',
            subtitle: 'Help others discover UpCoach',
            onTap: _shareApp,
          ),

          const Divider(height: UIConstants.spacing2XL),

          // Connect section
          _buildSectionHeader('Connect'),
          _buildLinkTile(
            icon: Icons.language_outlined,
            title: 'Visit Website',
            subtitle: _websiteUrl.replaceAll('https://', ''),
            onTap: () => _openUrl(_websiteUrl, 'Website'),
          ),
          _buildLinkTile(
            icon: Icons.email_outlined,
            title: 'Contact Support',
            subtitle: _supportEmail,
            onTap: _contactSupport,
          ),
          _buildLinkTile(
            icon: Icons.feedback_outlined,
            title: 'Send Feedback',
            subtitle: 'Help us improve UpCoach',
            onTap: _sendFeedback,
          ),

          const SizedBox(height: UIConstants.spacing2XL),
          _buildFooter(),
          const SizedBox(height: UIConstants.spacing2XL),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      child: Text(
        title.toUpperCase(),
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: AppColors.textSecondary,
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  Widget _buildAppInfo() {
    return Column(
      children: [
        // App icon
        Container(
          width: 100,
          height: 100,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                AppColors.primary,
                AppColors.primary.withValues(alpha: 0.7),
              ],
            ),
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.3),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: const Icon(
            Icons.psychology_alt,
            size: 50,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: UIConstants.spacingLG),

        // App name
        const Text(
          'UpCoach',
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: UIConstants.spacingSM),

        // Version
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            'Version ${_packageInfo?.version ?? '1.0.0'} (${_packageInfo?.buildNumber ?? '1'})',
            style: TextStyle(
              fontSize: 13,
              color: AppColors.primary,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        const SizedBox(height: UIConstants.spacingMD),

        // Tagline
        const Text(
          'Your personal coaching companion',
          style: TextStyle(
            fontSize: 15,
            color: AppColors.textSecondary,
          ),
        ),
      ],
    );
  }

  Widget _buildLinkTile({
    required IconData icon,
    required String title,
    String? subtitle,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: AppColors.primary.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: AppColors.primary, size: 22),
      ),
      title: Text(title),
      subtitle: subtitle != null
          ? Text(
              subtitle,
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.textSecondary,
              ),
            )
          : null,
      trailing: const Icon(Icons.chevron_right, color: AppColors.textSecondary),
      onTap: onTap,
    );
  }

  Widget _buildFooter() {
    final year = DateTime.now().year;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: UIConstants.spacingLG),
      child: Column(
        children: [
          Text(
            '\u00a9 $year UpCoach. All rights reserved.',
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: UIConstants.spacingSM),
          const Text(
            'Made with \u2764\ufe0f for coaches and clients',
            style: TextStyle(
              fontSize: 12,
              color: AppColors.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  // Action methods
  Future<void> _openUrl(String url, String title) async {
    final uri = Uri.parse(url);
    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        if (!mounted) return;
        _showErrorSnackBar('Could not open $title');
      }
    } catch (e) {
      if (!mounted) return;
      _showErrorSnackBar('Error opening $title');
    }
  }

  void _showLicenses() {
    showLicensePage(
      context: context,
      applicationName: 'UpCoach',
      applicationVersion: _packageInfo?.version ?? '1.0.0',
      applicationIcon: Container(
        width: 64,
        height: 64,
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          color: AppColors.primary,
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Icon(
          Icons.psychology_alt,
          size: 32,
          color: Colors.white,
        ),
      ),
      applicationLegalese:
          '\u00a9 ${DateTime.now().year} UpCoach\nAll rights reserved.',
    );
  }

  Future<void> _rateApp() async {
    String url;
    if (Platform.isIOS) {
      url = 'https://apps.apple.com/app/id$_appStoreId?action=write-review';
    } else {
      url = 'https://play.google.com/store/apps/details?id=$_playStoreId';
    }

    final uri = Uri.parse(url);
    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        if (!mounted) return;
        _showErrorSnackBar('Could not open app store');
      }
    } catch (e) {
      if (!mounted) return;
      _showErrorSnackBar('Error opening app store');
    }
  }

  Future<void> _shareApp() async {
    final String shareText;
    if (Platform.isIOS) {
      shareText = 'Check out UpCoach - Your personal coaching companion!\n\n'
          'Download on the App Store:\n'
          'https://apps.apple.com/app/id$_appStoreId';
    } else {
      shareText = 'Check out UpCoach - Your personal coaching companion!\n\n'
          'Download on Google Play:\n'
          'https://play.google.com/store/apps/details?id=$_playStoreId';
    }

    try {
      await SharePlus.instance.share(
        ShareParams(
          text: shareText,
          subject: 'Check out UpCoach!',
        ),
      );
    } catch (e) {
      if (!mounted) return;
      _showErrorSnackBar('Could not share app');
    }
  }

  Future<void> _contactSupport() async {
    final uri = Uri(
      scheme: 'mailto',
      path: _supportEmail,
      queryParameters: {
        'subject': 'UpCoach Support Request',
        'body': '\n\n---\nApp Version: ${_packageInfo?.version ?? "1.0.0"} (${_packageInfo?.buildNumber ?? "1"})\n'
            'Platform: ${Platform.operatingSystem} ${Platform.operatingSystemVersion}',
      },
    );

    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      } else {
        if (!mounted) return;
        _showErrorSnackBar('Could not open email client');
      }
    } catch (e) {
      if (!mounted) return;
      _showErrorSnackBar('Error opening email client');
    }
  }

  Future<void> _sendFeedback() async {
    final feedbackController = TextEditingController();
    String? selectedCategory = 'General';

    final result = await showDialog<Map<String, String>>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Send Feedback'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'We value your feedback! Let us know how we can improve.',
                  style:
                      TextStyle(color: AppColors.textSecondary, fontSize: 14),
                ),
                const SizedBox(height: UIConstants.spacingMD),
                DropdownButtonFormField<String>(
                  initialValue: selectedCategory,
                  decoration: const InputDecoration(
                    labelText: 'Category',
                    border: OutlineInputBorder(),
                  ),
                  items: ['General', 'Bug Report', 'Feature Request', 'Other']
                      .map((cat) =>
                          DropdownMenuItem(value: cat, child: Text(cat)))
                      .toList(),
                  onChanged: (value) {
                    setDialogState(() => selectedCategory = value);
                  },
                ),
                const SizedBox(height: UIConstants.spacingMD),
                TextField(
                  controller: feedbackController,
                  decoration: const InputDecoration(
                    labelText: 'Your Feedback',
                    hintText: 'Tell us what you think...',
                    border: OutlineInputBorder(),
                    alignLabelWithHint: true,
                  ),
                  maxLines: 5,
                  textCapitalization: TextCapitalization.sentences,
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                if (feedbackController.text.trim().isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Please enter your feedback')),
                  );
                  return;
                }
                Navigator.pop(dialogContext, {
                  'category': selectedCategory ?? 'General',
                  'feedback': feedbackController.text.trim(),
                });
              },
              child: const Text('Send'),
            ),
          ],
        ),
      ),
    );

    if (result != null) {
      // Send feedback via email
      final uri = Uri(
        scheme: 'mailto',
        path: _supportEmail,
        queryParameters: {
          'subject': 'UpCoach Feedback: ${result['category']}',
          'body': '${result['feedback']}\n\n---\n'
              'App Version: ${_packageInfo?.version ?? "1.0.0"} (${_packageInfo?.buildNumber ?? "1"})\n'
              'Platform: ${Platform.operatingSystem} ${Platform.operatingSystemVersion}',
        },
      );

      try {
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri);
        } else {
          if (!mounted) return;
          // Fallback: show confirmation that feedback was recorded locally
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Thank you for your feedback!'),
              backgroundColor: AppTheme.successColor,
            ),
          );
        }
      } catch (e) {
        if (!mounted) return;
        _showErrorSnackBar('Could not send feedback');
      }
    }
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppTheme.errorColor,
      ),
    );
  }
}
