import 'package:flutter/material.dart';
import 'package:upcoach_mobile/shared/constants/ui_constants.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/constants/app_text_styles.dart';

class HelpCenterScreen extends ConsumerStatefulWidget {
  const HelpCenterScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<HelpCenterScreen> createState() => _HelpCenterScreenState();
}

class _HelpCenterScreenState extends ConsumerState<HelpCenterScreen> {
  String _searchQuery = '';
  String _selectedCategory = 'All';

  final List<HelpCategory> _categories = [
    HelpCategory(
      name: 'Getting Started',
      icon: Icons.rocket_launch,
      color: AppColors.primary,
    ),
    HelpCategory(
      name: 'Account & Billing',
      icon: Icons.account_balance_wallet,
      color: Colors.blue,
    ),
    HelpCategory(
      name: 'AI Coach',
      icon: Icons.psychology,
      color: Colors.purple,
    ),
    HelpCategory(
      name: 'Goals & Tasks',
      icon: Icons.flag,
      color: Colors.orange,
    ),
    HelpCategory(
      name: 'Privacy & Security',
      icon: Icons.security,
      color: Colors.green,
    ),
    HelpCategory(
      name: 'Technical Issues',
      icon: Icons.build,
      color: Colors.red,
    ),
  ];

  final List<FAQItem> _faqs = [
    FAQItem(
      category: 'Getting Started',
      question: 'How do I create my first goal?',
      answer: 'To create your first goal, tap the Goals tab and press the + button. Enter your goal details, set a deadline, and choose if you want AI assistance to break it down into actionable tasks.',
    ),
    FAQItem(
      category: 'Getting Started',
      question: 'What is UpCoach?',
      answer: 'UpCoach is your personal AI-powered life coach that helps you achieve your goals, track your progress, and maintain healthy habits through personalized guidance and motivation.',
    ),
    FAQItem(
      category: 'Account & Billing',
      question: 'How do I upgrade my subscription?',
      answer: 'Go to Profile > Settings > Subscription to view available plans. Select your desired plan and follow the payment instructions. Your upgrade will be activated immediately.',
    ),
    FAQItem(
      category: 'Account & Billing',
      question: 'Can I cancel my subscription anytime?',
      answer: 'Yes, you can cancel your subscription at any time from Settings > Subscription. You\'ll continue to have access until the end of your current billing period.',
    ),
    FAQItem(
      category: 'AI Coach',
      question: 'How does the AI coach work?',
      answer: 'Our AI coach uses advanced language models to understand your goals, analyze your progress, and provide personalized advice. It learns from your interactions to offer increasingly relevant guidance.',
    ),
    FAQItem(
      category: 'AI Coach',
      question: 'Is my conversation with the AI private?',
      answer: 'Yes, all conversations with your AI coach are completely private and encrypted. We never share your personal data or conversations with third parties.',
    ),
    FAQItem(
      category: 'Goals & Tasks',
      question: 'How many goals can I create?',
      answer: 'Free users can create up to 3 active goals. Premium users have unlimited goals. You can archive completed goals to make room for new ones.',
    ),
    FAQItem(
      category: 'Goals & Tasks',
      question: 'Can I share my progress with others?',
      answer: 'Yes, you can share your progress through the share button on any goal or achievement. You can also export your progress reports as PDFs.',
    ),
    FAQItem(
      category: 'Privacy & Security',
      question: 'How is my data protected?',
      answer: 'We use industry-standard encryption for all data transmission and storage. Your data is stored securely in compliance with GDPR and other privacy regulations.',
    ),
    FAQItem(
      category: 'Privacy & Security',
      question: 'Can I delete my account and data?',
      answer: 'Yes, you can request account deletion from Settings > Privacy > Delete Account. This will permanently remove all your data within 30 days.',
    ),
    FAQItem(
      category: 'Technical Issues',
      question: 'The app is crashing, what should I do?',
      answer: 'Try these steps: 1) Force close and restart the app, 2) Check for app updates, 3) Clear app cache in your device settings, 4) Reinstall the app. If issues persist, contact support.',
    ),
    FAQItem(
      category: 'Technical Issues',
      question: 'How do I sync data across devices?',
      answer: 'Your data automatically syncs when you\'re logged into the same account on multiple devices. Ensure you have a stable internet connection for real-time syncing.',
    ),
  ];

  List<FAQItem> get filteredFAQs {
    var filtered = _faqs;
    
    if (_selectedCategory != 'All') {
      filtered = filtered.where((faq) => faq.category == _selectedCategory).toList();
    }
    
    if (_searchQuery.isNotEmpty) {
      filtered = filtered.where((faq) =>
        faq.question.toLowerCase().contains(_searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().contains(_searchQuery.toLowerCase())
      ).toList();
    }
    
    return filtered;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Help Center'),
        elevation: 0,
      ),
      body: Column(
        children: [
          // Search Bar
          Container(
            padding: const EdgeInsets.all(UIConstants.spacingMD),
            color: AppColors.surface,
            child: TextField(
              onChanged: (value) => setState(() => _searchQuery = value),
              decoration: InputDecoration(
                hintText: 'Search for help...',
                prefixIcon: const Icon(Icons.search),
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(UIConstants.radiusLG),
                  borderSide: BorderSide.none,
                ),
                suffixIcon: _searchQuery.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () => setState(() => _searchQuery = ''),
                    )
                  : null,
              ),
            ),
          ),
          
          // Quick Actions
          Container(
            padding: const EdgeInsets.all(UIConstants.spacingMD),
            child: Row(
              children: [
                Expanded(
                  child: _QuickActionCard(
                    icon: Icons.chat,
                    title: 'Contact Support',
                    subtitle: 'Get help from our team',
                    onTap: () => _contactSupport(),
                  ),
                ),
                const SizedBox(width: UIConstants.spacingMD),
                Expanded(
                  child: _QuickActionCard(
                    icon: Icons.play_circle,
                    title: 'Video Tutorials',
                    subtitle: 'Watch how-to guides',
                    onTap: () => _openVideoTutorials(),
                  ),
                ),
              ],
            ),
          ),
          
          // Category Filters
          if (_searchQuery.isEmpty) ...[
            SizedBox(
              height: 40,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  FilterChip(
                    label: const Text('All'),
                    selected: _selectedCategory == 'All',
                    onSelected: (_) => setState(() => _selectedCategory = 'All'),
                  ),
                  const SizedBox(width: UIConstants.spacingSM),
                  ..._categories.map((category) => Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      label: Text(category.name),
                      selected: _selectedCategory == category.name,
                      onSelected: (_) => setState(() => _selectedCategory = category.name),
                    ),
                  )),
                ],
              ),
            ),
            const SizedBox(height: UIConstants.spacingMD),
          ],
          
          // FAQ List or Categories Grid
          Expanded(
            child: _searchQuery.isEmpty && _selectedCategory == 'All'
              ? _buildCategoriesGrid()
              : _buildFAQList(),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoriesGrid() {
    return GridView.builder(
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
        childAspectRatio: 1.5,
      ),
      itemCount: _categories.length,
      itemBuilder: (context, index) {
        final category = _categories[index];
        final faqCount = _faqs.where((faq) => faq.category == category.name).length;
        
        return Card(
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(UIConstants.radiusLG),
          ),
          child: InkWell(
            onTap: () => setState(() => _selectedCategory = category.name),
            borderRadius: BorderRadius.circular(UIConstants.radiusLG),
            child: Padding(
              padding: const EdgeInsets.all(UIConstants.spacingMD),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    category.icon,
                    size: 32,
                    color: category.color,
                  ),
                  const SizedBox(height: UIConstants.spacingSM),
                  Text(
                    category.name,
                    style: AppTextStyles.h4,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: UIConstants.spacingXS),
                  Text(
                    '$faqCount articles',
                    style: AppTextStyles.bodySecondary,
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildFAQList() {
    final faqs = filteredFAQs;
    
    if (faqs.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.search_off,
              size: 64,
              color: AppColors.textSecondary,
            ),
            const SizedBox(height: UIConstants.spacingMD),
            Text(
              'No results found',
              style: AppTextStyles.h3,
            ),
            const SizedBox(height: UIConstants.spacingSM),
            Text(
              'Try different search terms',
              style: AppTextStyles.bodySecondary,
            ),
          ],
        ),
      );
    }
    
    return ListView.builder(
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      itemCount: faqs.length,
      itemBuilder: (context, index) {
        final faq = faqs[index];
        
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(UIConstants.radiusLG),
          ),
          child: Theme(
            data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
            child: ExpansionTile(
              title: Text(
                faq.question,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                ),
              ),
              subtitle: Text(
                faq.category,
                style: TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 12,
                ),
              ),
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  child: Text(
                    faq.answer,
                    style: const TextStyle(
                      fontSize: 14,
                      height: 1.5,
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  child: Row(
                    children: [
                      Text(
                        'Was this helpful?',
                        style: TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(width: UIConstants.spacingMD),
                      IconButton(
                        icon: const Icon(Icons.thumb_up_outlined),
                        onPressed: () => _rateFAQ(faq, true),
                        iconSize: 18,
                      ),
                      IconButton(
                        icon: const Icon(Icons.thumb_down_outlined),
                        onPressed: () => _rateFAQ(faq, false),
                        iconSize: 18,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _contactSupport() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(UIConstants.spacingLG),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Contact Support',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: UIConstants.spacingLG),
            ListTile(
              leading: const Icon(Icons.email),
              title: const Text('Email Support'),
              subtitle: const Text('support@upcoach.ai'),
              onTap: () {
                context.pop();
                _launchEmail();
              },
            ),
            ListTile(
              leading: const Icon(Icons.chat),
              title: const Text('Live Chat'),
              subtitle: const Text('Chat with our support team'),
              onTap: () {
                context.pop();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Live chat coming soon')),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.description),
              title: const Text('Submit a Ticket'),
              subtitle: const Text('Create a support request'),
              onTap: () {
                context.pop();
                context.go('/feedback');
              },
            ),
          ],
        ),
      ),
    );
  }

  void _openVideoTutorials() async {
    const url = 'https://upcoach.ai/tutorials';
    if (await canLaunchUrl(Uri.parse(url))) {
      await launchUrl(Uri.parse(url));
    }
  }

  void _launchEmail() async {
    final Uri emailUri = Uri(
      scheme: 'mailto',
      path: 'support@upcoach.ai',
      queryParameters: {
        'subject': 'Help Request from UpCoach App',
      },
    );
    
    if (await canLaunchUrl(emailUri)) {
      await launchUrl(emailUri);
    }
  }

  void _rateFAQ(FAQItem faq, bool helpful) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(helpful ? 'Thanks for your feedback!' : 'Sorry this wasn\'t helpful'),
        duration: const Duration(seconds: 2),
      ),
    );
  }
}

class HelpCategory {
  final String name;
  final IconData icon;
  final Color color;

  HelpCategory({
    required this.name,
    required this.icon,
    required this.color,
  });
}

class FAQItem {
  final String category;
  final String question;
  final String answer;

  FAQItem({
    required this.category,
    required this.question,
    required this.answer,
  });
}

class _QuickActionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _QuickActionCard({
    Key? key,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(UIConstants.radiusLG),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(UIConstants.radiusLG),
        child: Padding(
          padding: const EdgeInsets.all(UIConstants.spacingMD),
          child: Column(
            children: [
              Icon(
                icon,
                size: 32,
                color: AppColors.primary,
              ),
              const SizedBox(height: UIConstants.spacingSM),
              Text(
                title,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: UIConstants.spacingXS),
              Text(
                subtitle,
                style: TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 12,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}