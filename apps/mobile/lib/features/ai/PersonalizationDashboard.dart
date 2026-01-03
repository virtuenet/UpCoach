import 'dart:async';
import 'dart:math';

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../core/ai/UniversalPersonalization.dart';
import '../../core/ai/IntelligentContentRouter.dart';

/// Personalization dashboard with privacy controls and insights
class PersonalizationDashboard extends StatefulWidget {
  const PersonalizationDashboard({super.key});

  @override
  State<PersonalizationDashboard> createState() =>
      _PersonalizationDashboardState();
}

class _PersonalizationDashboardState extends State<PersonalizationDashboard>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // Services
  UniversalPersonalization? _personalization;
  IntelligentContentRouter? _contentRouter;

  // State
  bool _isLoading = true;
  bool _isSaving = false;

  // Profile data
  UserProfile? _userProfile;
  Map<String, double> _profileRadarData = {};

  // Privacy settings
  PrivacySettings _privacySettings = PrivacySettings();
  bool _allowDataCollection = true;
  bool _allowPersonalization = true;
  bool _allowCrossDevice = true;
  bool _allowFederatedLearning = false;
  int _dataRetentionDays = 90;
  bool _encryptLocalData = true;

  // Performance metrics
  int _totalInteractions = 0;
  double _modelAccuracy = 0.0;
  double _cacheHitRate = 0.0;
  double _cacheSizeMB = 0.0;

  // Content preferences
  final Map<String, double> _contentTypePreferences = {
    'Articles': 0.8,
    'Videos': 0.6,
    'Podcasts': 0.4,
    'Courses': 0.7,
    'Live Sessions': 0.5,
  };

  final Map<String, double> _topicPreferences = {
    'Fitness': 0.9,
    'Nutrition': 0.8,
    'Mindfulness': 0.7,
    'Productivity': 0.6,
    'Sleep': 0.5,
    'Stress': 0.4,
  };

  // Timeline data
  final List<Map<String, dynamic>> _timeline = [];

  // Data usage
  int _dataUsedMB = 0;
  int _dataLimitMB = 1000;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    _initializeServices();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _personalization?.dispose();
    _contentRouter?.dispose();
    super.dispose();
  }

  /// Initialize services
  Future<void> _initializeServices() async {
    try {
      setState(() => _isLoading = true);

      // Initialize personalization
      _personalization = UniversalPersonalization();
      await _personalization!.initialize();

      // Initialize content router
      _contentRouter = IntelligentContentRouter();
      await _contentRouter!.initialize();

      // Load data
      await _loadData();

      setState(() => _isLoading = false);
    } catch (e) {
      debugPrint('[PersonalizationDashboard] Init error: $e');
      setState(() => _isLoading = false);
      _showError('Failed to initialize: $e');
    }
  }

  /// Load dashboard data
  Future<void> _loadData() async {
    // Load user profile
    _userProfile = _personalization?.userProfile;

    // Load privacy settings
    _privacySettings = _personalization?.privacySettings ?? PrivacySettings();
    _allowDataCollection = _privacySettings.allowDataCollection;
    _allowPersonalization = _privacySettings.allowPersonalization;
    _allowCrossDevice = _privacySettings.allowCrossDeviceMerge;
    _allowFederatedLearning = _privacySettings.allowFederatedLearning;
    _dataRetentionDays = _privacySettings.dataRetentionDays;
    _encryptLocalData = _privacySettings.encryptLocalData;

    // Generate profile radar data
    _generateProfileRadarData();

    // Load performance metrics
    _totalInteractions = await _personalization?.getInteractionCount() ?? 0;
    _modelAccuracy = _calculateModelAccuracy();
    _cacheHitRate = await _contentRouter?.getCacheHitRate() ?? 0.0;
    _cacheSizeMB = _contentRouter?.cacheSizeMB ?? 0.0;

    // Generate timeline
    _generateTimeline();

    // Calculate data usage
    _calculateDataUsage();
  }

  /// Generate profile radar chart data
  void _generateProfileRadarData() {
    if (_userProfile == null) {
      _profileRadarData = {
        'Engagement': 0.5,
        'Consistency': 0.5,
        'Diversity': 0.5,
        'Activity': 0.5,
        'Social': 0.5,
      };
      return;
    }

    // Extract meaningful dimensions from profile
    final preferences = _userProfile!.preferences;
    final behaviors = _userProfile!.behaviorPatterns;

    _profileRadarData = {
      'Engagement':
          min(1.0, (preferences['engagement'] ?? 0.5) + (behaviors['active_days'] ?? 0.0) / 30),
      'Consistency': min(1.0, (behaviors['streak_days'] ?? 0.0) / 30),
      'Diversity': min(1.0, (behaviors['content_variety'] ?? 0.3) * 2),
      'Activity': min(1.0, _userProfile!.interactionCount / 100.0),
      'Social': min(1.0, (behaviors['social_interactions'] ?? 0.0) / 50),
    };
  }

  /// Calculate model accuracy (simplified)
  double _calculateModelAccuracy() {
    if (_userProfile == null || _userProfile!.isColdStart) {
      return 0.0;
    }

    // Accuracy improves with more interactions
    final interactions = _userProfile!.interactionCount;
    return min(1.0, 0.5 + (interactions / 200.0) * 0.5);
  }

  /// Generate timeline
  void _generateTimeline() {
    _timeline.clear();

    final now = DateTime.now();

    // Add sample timeline events
    _timeline.addAll([
      {
        'date': now.subtract(const Duration(days: 1)),
        'title': 'Profile Updated',
        'description': 'Your preferences were updated based on recent activity',
        'icon': Icons.person,
        'color': Colors.blue,
      },
      {
        'date': now.subtract(const Duration(days: 3)),
        'title': 'Model Improved',
        'description': 'Recommendation accuracy improved by 5%',
        'icon': Icons.trending_up,
        'color': Colors.green,
      },
      {
        'date': now.subtract(const Duration(days: 7)),
        'title': 'Cache Optimized',
        'description': 'Content cache optimized, saved 50MB',
        'icon': Icons.storage,
        'color': Colors.orange,
      },
      {
        'date': now.subtract(const Duration(days: 14)),
        'title': 'Privacy Updated',
        'description': 'Privacy settings were updated',
        'icon': Icons.security,
        'color': Colors.purple,
      },
    ]);

    _timeline.sort((a, b) =>
        (b['date'] as DateTime).compareTo(a['date'] as DateTime));
  }

  /// Calculate data usage
  void _calculateDataUsage() {
    _dataUsedMB = (_cacheSizeMB + (_totalInteractions * 0.01)).round();
  }

  /// Save privacy settings
  Future<void> _savePrivacySettings() async {
    try {
      setState(() => _isSaving = true);

      final settings = PrivacySettings(
        level: PrivacyLevel.custom,
        allowDataCollection: _allowDataCollection,
        allowPersonalization: _allowPersonalization,
        allowCrossDeviceMerge: _allowCrossDevice,
        allowFederatedLearning: _allowFederatedLearning,
        dataRetentionDays: _dataRetentionDays,
        encryptLocalData: _encryptLocalData,
      );

      await _personalization?.updatePrivacySettings(settings);

      setState(() {
        _isSaving = false;
        _privacySettings = settings;
      });

      _showSuccess('Privacy settings saved');
    } catch (e) {
      setState(() => _isSaving = false);
      _showError('Failed to save settings: $e');
    }
  }

  /// Delete all user data
  Future<void> _deleteAllData() async {
    final confirmed = await _showConfirmDialog(
      'Delete All Data',
      'This will permanently delete all your personalization data. This action cannot be undone.',
    );

    if (confirmed != true) return;

    try {
      await _personalization?.deleteAllUserData();
      await _loadData();
      setState(() {});
      _showSuccess('All data deleted');
    } catch (e) {
      _showError('Failed to delete data: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Personalization Dashboard'),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabs: const [
            Tab(icon: Icon(Icons.person), text: 'Profile'),
            Tab(icon: Icon(Icons.security), text: 'Privacy'),
            Tab(icon: Icon(Icons.info), text: 'Explanations'),
            Tab(icon: Icon(Icons.analytics), text: 'Performance'),
            Tab(icon: Icon(Icons.tune), text: 'Preferences'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildProfileTab(),
                _buildPrivacyTab(),
                _buildExplanationsTab(),
                _buildPerformanceTab(),
                _buildPreferencesTab(),
              ],
            ),
    );
  }

  /// Build profile tab
  Widget _buildProfileTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Profile overview card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const CircleAvatar(
                        radius: 32,
                        child: Icon(Icons.person, size: 32),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _userProfile?.userId ?? 'Anonymous',
                              style: Theme.of(context).textTheme.titleLarge,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _userProfile?.isColdStart ?? true
                                  ? 'New User - Building Profile'
                                  : 'Personalized Profile Active',
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '$_totalInteractions interactions',
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Divider(),
                  const SizedBox(height: 16),
                  Text(
                    'Member Since',
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                  Text(
                    _userProfile != null
                        ? DateFormat.yMMMMd().format(_userProfile!.createdAt)
                        : 'N/A',
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Last Updated',
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                  Text(
                    _userProfile != null
                        ? DateFormat.yMMMMd()
                            .add_jm()
                            .format(_userProfile!.lastUpdated)
                        : 'N/A',
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Radar chart
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Profile Dimensions',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    height: 300,
                    child: _buildRadarChart(),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Timeline
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Activity Timeline',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 16),
                  ..._timeline.take(5).map((event) => _buildTimelineItem(event)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Build privacy tab
  Widget _buildPrivacyTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Privacy level
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Privacy Level',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 16),
                  SegmentedButton<String>(
                    segments: const [
                      ButtonSegment(
                        value: 'minimal',
                        label: Text('Minimal'),
                        icon: Icon(Icons.visibility),
                      ),
                      ButtonSegment(
                        value: 'balanced',
                        label: Text('Balanced'),
                        icon: Icon(Icons.shield),
                      ),
                      ButtonSegment(
                        value: 'strict',
                        label: Text('Strict'),
                        icon: Icon(Icons.security),
                      ),
                    ],
                    selected: {_privacySettings.level.toString().split('.').last},
                    onSelectionChanged: (selected) {
                      setState(() {
                        if (selected.first == 'minimal') {
                          _privacySettings = PrivacySettings.minimal();
                        } else if (selected.first == 'strict') {
                          _privacySettings = PrivacySettings.strict();
                        } else {
                          _privacySettings = PrivacySettings();
                        }
                        _allowDataCollection = _privacySettings.allowDataCollection;
                        _allowPersonalization = _privacySettings.allowPersonalization;
                        _allowCrossDevice = _privacySettings.allowCrossDeviceMerge;
                        _allowFederatedLearning = _privacySettings.allowFederatedLearning;
                        _dataRetentionDays = _privacySettings.dataRetentionDays;
                        _encryptLocalData = _privacySettings.encryptLocalData;
                      });
                      _savePrivacySettings();
                    },
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Privacy controls
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Privacy Controls',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 16),
                  SwitchListTile(
                    title: const Text('Allow Data Collection'),
                    subtitle:
                        const Text('Collect usage data to improve recommendations'),
                    value: _allowDataCollection,
                    onChanged: (value) {
                      setState(() => _allowDataCollection = value);
                    },
                  ),
                  SwitchListTile(
                    title: const Text('Allow Personalization'),
                    subtitle:
                        const Text('Use your data to personalize content'),
                    value: _allowPersonalization,
                    onChanged: (value) {
                      setState(() => _allowPersonalization = value);
                    },
                  ),
                  SwitchListTile(
                    title: const Text('Cross-Device Sync'),
                    subtitle: const Text('Merge profile across your devices'),
                    value: _allowCrossDevice,
                    onChanged: (value) {
                      setState(() => _allowCrossDevice = value);
                    },
                  ),
                  SwitchListTile(
                    title: const Text('Federated Learning'),
                    subtitle: const Text(
                        'Contribute to global models (privacy-preserving)'),
                    value: _allowFederatedLearning,
                    onChanged: (value) {
                      setState(() => _allowFederatedLearning = value);
                    },
                  ),
                  SwitchListTile(
                    title: const Text('Encrypt Local Data'),
                    subtitle: const Text('Encrypt stored profile data'),
                    value: _encryptLocalData,
                    onChanged: (value) {
                      setState(() => _encryptLocalData = value);
                    },
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Data Retention: $_dataRetentionDays days',
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                  Slider(
                    value: _dataRetentionDays.toDouble(),
                    min: 7,
                    max: 365,
                    divisions: 51,
                    label: '$_dataRetentionDays days',
                    onChanged: (value) {
                      setState(() => _dataRetentionDays = value.round());
                    },
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _isSaving ? null : _savePrivacySettings,
                          icon: _isSaving
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              : const Icon(Icons.save),
                          label: const Text('Save Settings'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Data usage
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Data Usage',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 16),
                  LinearProgressIndicator(
                    value: _dataUsedMB / _dataLimitMB,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '$_dataUsedMB MB / $_dataLimitMB MB used',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  const SizedBox(height: 16),
                  _buildDataBreakdown(),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Danger zone
          Card(
            color: Colors.red.shade50,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Danger Zone',
                    style: Theme.of(context)
                        .textTheme
                        .titleMedium
                        ?.copyWith(color: Colors.red.shade900),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: _deleteAllData,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red,
                      foregroundColor: Colors.white,
                    ),
                    icon: const Icon(Icons.delete_forever),
                    label: const Text('Delete All Data'),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Build explanations tab
  Widget _buildExplanationsTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Why This Content?',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 16),
                  _buildExplanationItem(
                    'Fitness Challenge',
                    'Recommended because of: high engagement with fitness (90%), recent workout streak (75%), similar users liked this (68%)',
                    Icons.fitness_center,
                    Colors.blue,
                  ),
                  const Divider(height: 24),
                  _buildExplanationItem(
                    'Nutrition Guide',
                    'Recommended because of: interest in nutrition (80%), complementary to your fitness goals (85%)',
                    Icons.restaurant,
                    Colors.green,
                  ),
                  const Divider(height: 24),
                  _buildExplanationItem(
                    'Meditation Session',
                    'Recommended because of: stress level indicators (60%), time of day preference (70%)',
                    Icons.self_improvement,
                    Colors.purple,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'How We Personalize',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 16),
                  _buildHowItWorksStep(
                    1,
                    'Collect Data',
                    'We track your interactions, preferences, and context',
                    Icons.data_usage,
                  ),
                  _buildHowItWorksStep(
                    2,
                    'Build Profile',
                    'Create a multi-dimensional profile of your interests',
                    Icons.person,
                  ),
                  _buildHowItWorksStep(
                    3,
                    'Score Content',
                    'Use ML algorithms to score content relevance',
                    Icons.score,
                  ),
                  _buildHowItWorksStep(
                    4,
                    'Recommend',
                    'Show you the most relevant content',
                    Icons.recommend,
                  ),
                  _buildHowItWorksStep(
                    5,
                    'Learn',
                    'Continuously improve based on your feedback',
                    Icons.trending_up,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Build performance tab
  Widget _buildPerformanceTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Metrics overview
          Row(
            children: [
              Expanded(
                child: _buildMetricCard(
                  'Interactions',
                  _totalInteractions.toString(),
                  Icons.touch_app,
                  Colors.blue,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildMetricCard(
                  'Accuracy',
                  '${(_modelAccuracy * 100).toStringAsFixed(0)}%',
                  Icons.check_circle,
                  Colors.green,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _buildMetricCard(
                  'Cache Hit',
                  '${(_cacheHitRate * 100).toStringAsFixed(0)}%',
                  Icons.speed,
                  Colors.orange,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildMetricCard(
                  'Cache Size',
                  '${_cacheSizeMB.toStringAsFixed(1)} MB',
                  Icons.storage,
                  Colors.purple,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Accuracy chart
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Model Accuracy Over Time',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    height: 200,
                    child: _buildAccuracyChart(),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Cache performance
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Cache Performance',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    height: 200,
                    child: _buildCacheChart(),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Interaction distribution
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Interaction Distribution',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    height: 200,
                    child: _buildInteractionChart(),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Build preferences tab
  Widget _buildPreferencesTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Content type preferences
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Content Type Preferences',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 16),
                  ..._contentTypePreferences.entries.map((entry) {
                    return Column(
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(entry.key),
                            ),
                            Text('${(entry.value * 100).toInt()}%'),
                          ],
                        ),
                        Slider(
                          value: entry.value,
                          onChanged: (value) {
                            setState(() {
                              _contentTypePreferences[entry.key] = value;
                            });
                          },
                        ),
                        const SizedBox(height: 8),
                      ],
                    );
                  }),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Topic preferences
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Topic Preferences',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    height: 250,
                    child: _buildTopicPreferencesChart(),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Notification preferences
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Notification Preferences',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 16),
                  CheckboxListTile(
                    title: const Text('Content Recommendations'),
                    subtitle: const Text('Get notified about new content'),
                    value: true,
                    onChanged: (value) {},
                  ),
                  CheckboxListTile(
                    title: const Text('Personalization Updates'),
                    subtitle: const Text('When your profile improves'),
                    value: true,
                    onChanged: (value) {},
                  ),
                  CheckboxListTile(
                    title: const Text('Privacy Changes'),
                    subtitle: const Text('When privacy settings change'),
                    value: true,
                    onChanged: (value) {},
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Build radar chart
  Widget _buildRadarChart() {
    return RadarChart(
      RadarChartData(
        radarShape: RadarShape.polygon,
        tickCount: 5,
        ticksTextStyle: const TextStyle(fontSize: 10, color: Colors.transparent),
        radarBorderData: const BorderSide(color: Colors.grey, width: 2),
        gridBorderData: const BorderSide(color: Colors.grey, width: 1),
        tickBorderData: const BorderSide(color: Colors.transparent),
        getTitle: (index, angle) {
          final titles = _profileRadarData.keys.toList();
          return RadarChartTitle(
            text: titles[index],
            angle: angle,
          );
        },
        dataSets: [
          RadarDataSet(
            fillColor: Colors.blue.withOpacity(0.3),
            borderColor: Colors.blue,
            borderWidth: 2,
            dataEntries: _profileRadarData.values
                .map((value) => RadarEntry(value: value * 5))
                .toList(),
          ),
        ],
      ),
    );
  }

  /// Build timeline item
  Widget _buildTimelineItem(Map<String, dynamic> event) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 20,
            backgroundColor: event['color'],
            child: Icon(event['icon'], color: Colors.white, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  event['title'],
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                Text(
                  event['description'],
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                Text(
                  DateFormat.yMMMd().format(event['date']),
                  style: Theme.of(context)
                      .textTheme
                      .bodySmall
                      ?.copyWith(color: Colors.grey),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// Build data breakdown
  Widget _buildDataBreakdown() {
    return Column(
      children: [
        _buildDataRow('Profile Data', 2, Colors.blue),
        _buildDataRow('Interaction History', 5, Colors.green),
        _buildDataRow('Cache', _cacheSizeMB.round(), Colors.orange),
        _buildDataRow('Models', 3, Colors.purple),
      ],
    );
  }

  Widget _buildDataRow(String label, int mb, Color color) {
    final percentage = mb / _dataLimitMB;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(child: Text(label)),
          Text('$mb MB'),
          const SizedBox(width: 8),
          SizedBox(
            width: 50,
            child: LinearProgressIndicator(
              value: percentage.clamp(0.0, 1.0),
              backgroundColor: Colors.grey.shade200,
              valueColor: AlwaysStoppedAnimation(color),
            ),
          ),
        ],
      ),
    );
  }

  /// Build explanation item
  Widget _buildExplanationItem(
    String title,
    String explanation,
    IconData icon,
    Color color,
  ) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        CircleAvatar(
          backgroundColor: color.withOpacity(0.2),
          child: Icon(icon, color: color),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: Theme.of(context).textTheme.titleSmall,
              ),
              const SizedBox(height: 4),
              Text(
                explanation,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
        ),
      ],
    );
  }

  /// Build how it works step
  Widget _buildHowItWorksStep(
    int step,
    String title,
    String description,
    IconData icon,
  ) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: Theme.of(context).primaryColor,
            child: Text(
              '$step',
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(icon, size: 16),
                    const SizedBox(width: 4),
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleSmall,
                    ),
                  ],
                ),
                Text(
                  description,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// Build metric card
  Widget _buildMetricCard(
    String title,
    String value,
    IconData icon,
    Color color,
  ) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Icon(icon, color: color, size: 32),
            const SizedBox(height: 8),
            Text(
              value,
              style: Theme.of(context)
                  .textTheme
                  .headlineSmall
                  ?.copyWith(fontWeight: FontWeight.bold),
            ),
            Text(
              title,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
      ),
    );
  }

  /// Build accuracy chart
  Widget _buildAccuracyChart() {
    final spots = List.generate(7, (i) {
      final accuracy = 0.5 + (i / 7) * 0.4 + (Random().nextDouble() * 0.05);
      return FlSpot(i.toDouble(), accuracy);
    });

    return LineChart(
      LineChartData(
        gridData: const FlGridData(show: true),
        titlesData: FlTitlesData(
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 40,
              getTitlesWidget: (value, meta) {
                return Text('${(value * 100).toInt()}%');
              },
            ),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (value, meta) {
                return Text('D${value.toInt() + 1}');
              },
            ),
          ),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
        borderData: FlBorderData(show: true),
        minY: 0,
        maxY: 1,
        lineBarsData: [
          LineChartBarData(
            spots: spots,
            isCurved: true,
            color: Colors.green,
            barWidth: 3,
            dotData: const FlDotData(show: true),
            belowBarData: BarAreaData(
              show: true,
              color: Colors.green.withOpacity(0.2),
            ),
          ),
        ],
      ),
    );
  }

  /// Build cache chart
  Widget _buildCacheChart() {
    return BarChart(
      BarChartData(
        barGroups: [
          BarChartGroupData(x: 0, barRods: [BarChartRodData(toY: 0.8, color: Colors.blue)]),
          BarChartGroupData(x: 1, barRods: [BarChartRodData(toY: 0.6, color: Colors.blue)]),
          BarChartGroupData(x: 2, barRods: [BarChartRodData(toY: 0.9, color: Colors.blue)]),
          BarChartGroupData(x: 3, barRods: [BarChartRodData(toY: 0.7, color: Colors.blue)]),
          BarChartGroupData(x: 4, barRods: [BarChartRodData(toY: 0.85, color: Colors.blue)]),
        ],
        titlesData: FlTitlesData(
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 40,
              getTitlesWidget: (value, meta) {
                return Text('${(value * 100).toInt()}%');
              },
            ),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (value, meta) {
                final labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
                if (value.toInt() < labels.length) {
                  return Text(labels[value.toInt()]);
                }
                return const Text('');
              },
            ),
          ),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
      ),
    );
  }

  /// Build interaction chart
  Widget _buildInteractionChart() {
    return PieChart(
      PieChartData(
        sections: [
          PieChartSectionData(
            value: 35,
            title: 'Views',
            color: Colors.blue,
            radius: 60,
          ),
          PieChartSectionData(
            value: 25,
            title: 'Likes',
            color: Colors.green,
            radius: 60,
          ),
          PieChartSectionData(
            value: 20,
            title: 'Shares',
            color: Colors.orange,
            radius: 60,
          ),
          PieChartSectionData(
            value: 20,
            title: 'Other',
            color: Colors.purple,
            radius: 60,
          ),
        ],
        sectionsSpace: 2,
        centerSpaceRadius: 40,
      ),
    );
  }

  /// Build topic preferences chart
  Widget _buildTopicPreferencesChart() {
    final sortedTopics = _topicPreferences.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return BarChart(
      BarChartData(
        alignment: BarChartAlignment.spaceAround,
        barGroups: sortedTopics.asMap().entries.map((entry) {
          return BarChartGroupData(
            x: entry.key,
            barRods: [
              BarChartRodData(
                toY: entry.value.value,
                color: Colors.purple,
                width: 20,
              ),
            ],
          );
        }).toList(),
        titlesData: FlTitlesData(
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 40,
              getTitlesWidget: (value, meta) {
                return Text('${(value * 100).toInt()}%');
              },
            ),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (value, meta) {
                if (value.toInt() < sortedTopics.length) {
                  return Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      sortedTopics[value.toInt()].key,
                      style: const TextStyle(fontSize: 10),
                    ),
                  );
                }
                return const Text('');
              },
            ),
          ),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
      ),
    );
  }

  /// Show error snackbar
  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  /// Show success snackbar
  void _showSuccess(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green,
      ),
    );
  }

  /// Show confirm dialog
  Future<bool?> _showConfirmDialog(String title, String message) {
    return showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
  }
}
