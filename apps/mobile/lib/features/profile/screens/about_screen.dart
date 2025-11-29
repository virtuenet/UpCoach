import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';
import '../../../shared/widgets/custom_app_bar.dart';
import '../../../core/theme/app_colors.dart';

class AboutScreen extends StatefulWidget {
  const AboutScreen({super.key});

  @override
  State<AboutScreen> createState() => _AboutScreenState();
}

class _AboutScreenState extends State<AboutScreen> {
  PackageInfo? _packageInfo;

  @override
  void initState() {
    super.initState();
    _loadPackageInfo();
  }

  Future<void> _loadPackageInfo() async {
    final info = await PackageInfo.fromPlatform();
    setState(() => _packageInfo = info);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const CustomAppBar(title: 'About'),
      body: ListView(
        children: [
          const SizedBox(height: 32),
          _buildAppInfo(),
          const SizedBox(height: 32),
          _buildLinkTile(
            icon: Icons.description,
            title: 'Terms of Service',
            onTap: () {
              // TODO: Open terms of service
            },
          ),
          _buildLinkTile(
            icon: Icons.privacy_tip,
            title: 'Privacy Policy',
            onTap: () {
              // TODO: Open privacy policy
            },
          ),
          _buildLinkTile(
            icon: Icons.gavel,
            title: 'Licenses',
            onTap: () {
              showLicensePage(
                context: context,
                applicationName: 'UpCoach',
                applicationVersion: _packageInfo?.version ?? '1.0.0',
              );
            },
          ),
          const Divider(),
          _buildLinkTile(
            icon: Icons.star,
            title: 'Rate the App',
            onTap: () {
              // TODO: Open app store rating
            },
          ),
          _buildLinkTile(
            icon: Icons.share,
            title: 'Share with Friends',
            onTap: () {
              // TODO: Open share sheet
            },
          ),
          _buildLinkTile(
            icon: Icons.language,
            title: 'Visit Website',
            onTap: () {
              // TODO: Open website
            },
          ),
          const SizedBox(height: 32),
          _buildFooter(),
        ],
      ),
    );
  }

  Widget _buildAppInfo() {
    return Column(
      children: [
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: AppColors.primary,
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Icon(
            Icons.fitness_center,
            size: 40,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          'UpCoach',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Version ${_packageInfo?.version ?? '1.0.0'} (${_packageInfo?.buildNumber ?? '1'})',
          style: const TextStyle(
            fontSize: 14,
            color: AppColors.textSecondary,
          ),
        ),
        const SizedBox(height: 8),
        const Text(
          'Your personal coaching companion',
          style: TextStyle(
            fontSize: 14,
            color: AppColors.textSecondary,
          ),
        ),
      ],
    );
  }

  Widget _buildLinkTile({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Icon(icon, color: AppColors.primary),
      title: Text(title),
      trailing: const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }

  Widget _buildFooter() {
    return const Padding(
      padding: EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          Text(
            '© 2024 UpCoach. All rights reserved.',
            style: TextStyle(
              fontSize: 12,
              color: AppColors.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
          SizedBox(height: 4),
          Text(
            'Made with ❤️ for coaches and clients',
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
}
