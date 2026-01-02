import 'dart:async';
import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../core/ml/ModelMonitoring.dart';
import '../../core/ml/ABTestingFramework.dart';
import '../../core/ml/ModelDeployment.dart';

/// MLOps dashboard for production ML management
class MLOpsScreen extends StatefulWidget {
  const MLOpsScreen({Key? key}) : super(key: key);

  @override
  State<MLOpsScreen> createState() => _MLOpsScreenState();
}

class _MLOpsScreenState extends State<MLOpsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final ModelMonitoring _monitoring = ModelMonitoring();
  final ABTestingFramework _abTesting = ABTestingFramework();
  final ModelDeployment _deployment = ModelDeployment();

  PerformanceStats? _performanceStats;
  List<Alert> _alerts = [];
  List<Experiment> _experiments = [];
  List<ModelMetadata> _models = [];
  ModelMetadata? _activeModel;
  DeploymentRecord? _latestDeployment;
  bool _isLoading = true;
  StreamSubscription<Alert>? _alertSubscription;

  // Settings
  bool _autoUpdate = true;
  bool _wifiOnly = true;
  String _logLevel = 'Info';
  double _sampleRate = 100.0;
  double _latencyThreshold = 100.0;
  double _accuracyThreshold = 90.0;
  double _errorRateThreshold = 5.0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    _initialize();
  }

  Future<void> _initialize() async {
    try {
      await _monitoring.initialize();
      await _abTesting.initialize();
      await _deployment.initialize();

      // Subscribe to alerts
      _alertSubscription = _monitoring.alertStream.listen((alert) {
        setState(() {
          _alerts.insert(0, alert);
        });
      });

      await _loadData();
    } catch (e) {
      debugPrint('Error initializing MLOps: $e');
    }
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);

    try {
      final stats = await _monitoring.getPerformanceStats(
        window: const Duration(hours: 24),
      );

      final alerts = _monitoring.getActiveAlerts();
      final experiments = await _abTesting.getAllExperiments();
      final models = _deployment.getAllModels();
      final activeModel = _deployment.getActiveModel();

      final deploymentHistory = await _deployment.getDeploymentHistory();
      final latestDeployment = deploymentHistory.isNotEmpty ? deploymentHistory.first : null;

      setState(() {
        _performanceStats = stats;
        _alerts = alerts;
        _experiments = experiments;
        _models = models;
        _activeModel = activeModel;
        _latestDeployment = latestDeployment;
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('Error loading data: $e');
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('MLOps Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadData,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabs: const [
            Tab(text: 'Monitoring', icon: Icon(Icons.monitor_heart)),
            Tab(text: 'Experiments', icon: Icon(Icons.science)),
            Tab(text: 'Deployment', icon: Icon(Icons.rocket_launch)),
            Tab(text: 'Quality', icon: Icon(Icons.verified)),
            Tab(text: 'Settings', icon: Icon(Icons.settings)),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildMonitoringTab(),
                _buildExperimentsTab(),
                _buildDeploymentTab(),
                _buildQualityTab(),
                _buildSettingsTab(),
              ],
            ),
    );
  }

  /// Build monitoring tab
  Widget _buildMonitoringTab() {
    if (_performanceStats == null) {
      return const Center(child: Text('No monitoring data available'));
    }

    final stats = _performanceStats!;
    final healthScore = _calculateHealthScore(stats);

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Health Score
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Model Health Score',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  Center(
                    child: SizedBox(
                      width: 150,
                      height: 150,
                      child: CircularProgressIndicator(
                        value: healthScore / 100,
                        strokeWidth: 12,
                        backgroundColor: Colors.grey[300],
                        valueColor: AlwaysStoppedAnimation<Color>(
                          _getHealthColor(healthScore),
                        ),
                      ),
                    ),
                  ),
                  Center(
                    child: Padding(
                      padding: const EdgeInsets.only(top: 16),
                      child: Text(
                        '${healthScore.toStringAsFixed(1)}%',
                        style: const TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Performance Metrics
          Row(
            children: [
              Expanded(
                child: _buildMetricCard(
                  'Latency (p50)',
                  '${stats.p50Latency.toStringAsFixed(1)}ms',
                  Icons.speed,
                  Colors.blue,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildMetricCard(
                  'Latency (p95)',
                  '${stats.p95Latency.toStringAsFixed(1)}ms',
                  Icons.speed_outlined,
                  Colors.orange,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          Row(
            children: [
              Expanded(
                child: _buildMetricCard(
                  'Throughput',
                  '${stats.avgThroughput.toStringAsFixed(1)} inf/s',
                  Icons.analytics,
                  Colors.green,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildMetricCard(
                  'Error Rate',
                  '${stats.errorRate.toStringAsFixed(2)}%',
                  Icons.error_outline,
                  stats.errorRate > 5 ? Colors.red : Colors.green,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Error Rate Chart
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Error Rate (Last 24h)',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    height: 200,
                    child: _buildErrorRateChart(),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Resource Usage
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Resource Usage',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  _buildResourceBar('CPU', stats.cpuUsage, Colors.blue),
                  const SizedBox(height: 12),
                  _buildResourceBar('Memory', stats.memoryUsage, Colors.orange),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const Icon(Icons.battery_charging_full, size: 20),
                      const SizedBox(width: 8),
                      Text('Battery: ${stats.batteryDrain.toStringAsFixed(1)}% per hour'),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // SLO Compliance
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'SLO Compliance',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _calculateSLOCompliance(stats),
                    style: const TextStyle(fontSize: 14),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Alerts
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Active Alerts',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      Chip(
                        label: Text('${_alerts.length}'),
                        backgroundColor: _alerts.isEmpty ? Colors.green : Colors.red,
                        labelStyle: const TextStyle(color: Colors.white),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  if (_alerts.isEmpty)
                    const Center(
                      child: Padding(
                        padding: EdgeInsets.all(16),
                        child: Text('No active alerts'),
                      ),
                    )
                  else
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _alerts.take(5).length,
                      itemBuilder: (context, index) => _buildAlertItem(_alerts[index]),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Build experiments tab
  Widget _buildExperimentsTab() {
    final activeExperiments = _experiments
        .where((e) => e.status == ExperimentStatus.active)
        .toList();

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Active Experiments',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              ElevatedButton.icon(
                onPressed: _showCreateExperimentDialog,
                icon: const Icon(Icons.add),
                label: const Text('Create'),
              ),
            ],
          ),
          const SizedBox(height: 16),

          if (activeExperiments.isEmpty)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(32),
                child: Text('No active experiments'),
              ),
            )
          else
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: activeExperiments.length,
              itemBuilder: (context, index) {
                final experiment = activeExperiments[index];
                return _buildExperimentCard(experiment);
              },
            ),
        ],
      ),
    );
  }

  /// Build deployment tab
  Widget _buildDeploymentTab() {
    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Active Model
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Active Model',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  if (_activeModel != null)
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${_activeModel!.name} v${_activeModel!.version}',
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Chip(
                              label: Text(_activeModel!.status.toString().split('.').last),
                              backgroundColor: Colors.green,
                              labelStyle: const TextStyle(color: Colors.white),
                            ),
                            const SizedBox(width: 8),
                            if (_activeModel!.accuracy != null)
                              Chip(
                                label: Text('Accuracy: ${_activeModel!.accuracy!.toStringAsFixed(1)}%'),
                              ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text('Size: ${(_activeModel!.sizeBytes / 1024 / 1024).toStringAsFixed(1)} MB'),
                      ],
                    )
                  else
                    const Text('No active model'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Deployment Status
          if (_latestDeployment != null)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Deployment Status',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        Chip(
                          label: Text(_latestDeployment!.status.toString().split('.').last),
                          backgroundColor: _getDeploymentStatusColor(_latestDeployment!.status),
                          labelStyle: const TextStyle(color: Colors.white),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text('Strategy: ${_latestDeployment!.strategy.toString().split('.').last}'),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Text('Rollout: '),
                        Expanded(
                          child: LinearProgressIndicator(
                            value: _latestDeployment!.rolloutPercentage / 100,
                            backgroundColor: Colors.grey[300],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text('${_latestDeployment!.rolloutPercentage.toStringAsFixed(0)}%'),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          const SizedBox(height: 16),

          // Model Version History
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Model Versions',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _models.take(5).length,
                    itemBuilder: (context, index) {
                      final model = _models[index];
                      return ListTile(
                        leading: Icon(
                          model.status == ModelStatus.production
                              ? Icons.check_circle
                              : Icons.circle_outlined,
                          color: model.status == ModelStatus.production
                              ? Colors.green
                              : Colors.grey,
                        ),
                        title: Text('${model.name} v${model.version}'),
                        subtitle: Text(model.status.toString().split('.').last),
                        trailing: model.accuracy != null
                            ? Text('${model.accuracy!.toStringAsFixed(1)}%')
                            : null,
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Actions
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _showDeployDialog,
                  icon: const Icon(Icons.upload),
                  label: const Text('Deploy New Model'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.all(16),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _showRollbackDialog,
                  icon: const Icon(Icons.undo),
                  label: const Text('Rollback'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.all(16),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  /// Build quality tab
  Widget _buildQualityTab() {
    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Data Quality Score
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Data Quality Score',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  Center(
                    child: SizedBox(
                      width: 120,
                      height: 120,
                      child: CircularProgressIndicator(
                        value: 0.92,
                        strokeWidth: 10,
                        backgroundColor: Colors.grey[300],
                        valueColor: const AlwaysStoppedAnimation<Color>(Colors.green),
                      ),
                    ),
                  ),
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.only(top: 8),
                      child: Text(
                        '92%',
                        style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Data Drift Alerts
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Data Drift Alerts',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  DataTable(
                    columns: const [
                      DataColumn(label: Text('Feature')),
                      DataColumn(label: Text('Drift Score')),
                      DataColumn(label: Text('Status')),
                    ],
                    rows: [
                      _buildDriftRow('user_age', 0.03, false),
                      _buildDriftRow('session_duration', 0.12, true),
                      _buildDriftRow('engagement_score', 0.05, false),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Prediction Drift Chart
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Prediction Distribution',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    height: 200,
                    child: _buildPredictionDriftChart(),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Bias Metrics
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Bias Metrics',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  DataTable(
                    columns: const [
                      DataColumn(label: Text('Group')),
                      DataColumn(label: Text('Dem. Parity')),
                      DataColumn(label: Text('Eq. Odds')),
                    ],
                    rows: [
                      _buildBiasRow('Group A', 0.02, 0.01),
                      _buildBiasRow('Group B', 0.03, 0.02),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // OOD Detection
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Out-of-Distribution Detection',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  const Text('2.3% of inputs out-of-distribution'),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Build settings tab
  Widget _buildSettingsTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text(
          'Model Preferences',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Active Model'),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  value: _activeModel?.id,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                  items: _models.map((model) {
                    return DropdownMenuItem(
                      value: model.id,
                      child: Text('${model.name} v${model.version}'),
                    );
                  }).toList(),
                  onChanged: (value) {
                    // Handle model selection
                  },
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),

        const Text(
          'Update Settings',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        Card(
          child: Column(
            children: [
              SwitchListTile(
                title: const Text('Auto-update models'),
                subtitle: const Text('Automatically download new models'),
                value: _autoUpdate,
                onChanged: (value) => setState(() => _autoUpdate = value),
              ),
              const Divider(),
              SwitchListTile(
                title: const Text('WiFi only'),
                subtitle: const Text('Only download over WiFi'),
                value: _wifiOnly,
                onChanged: (value) => setState(() => _wifiOnly = value),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),

        const Text(
          'Monitoring Settings',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Log Level'),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  value: _logLevel,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                  items: ['Debug', 'Info', 'Warn', 'Error'].map((level) {
                    return DropdownMenuItem(value: level, child: Text(level));
                  }).toList(),
                  onChanged: (value) => setState(() => _logLevel = value!),
                ),
                const SizedBox(height: 16),
                Text('Sample Rate: ${_sampleRate.toStringAsFixed(0)}%'),
                Slider(
                  value: _sampleRate,
                  min: 1,
                  max: 100,
                  divisions: 99,
                  label: '${_sampleRate.toStringAsFixed(0)}%',
                  onChanged: (value) => setState(() => _sampleRate = value),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),

        const Text(
          'Alert Settings',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Latency Threshold: ${_latencyThreshold.toStringAsFixed(0)}ms'),
                Slider(
                  value: _latencyThreshold,
                  min: 50,
                  max: 500,
                  divisions: 45,
                  label: '${_latencyThreshold.toStringAsFixed(0)}ms',
                  onChanged: (value) => setState(() => _latencyThreshold = value),
                ),
                const SizedBox(height: 16),
                Text('Accuracy Threshold: ${_accuracyThreshold.toStringAsFixed(0)}%'),
                Slider(
                  value: _accuracyThreshold,
                  min: 50,
                  max: 100,
                  divisions: 50,
                  label: '${_accuracyThreshold.toStringAsFixed(0)}%',
                  onChanged: (value) => setState(() => _accuracyThreshold = value),
                ),
                const SizedBox(height: 16),
                Text('Error Rate Threshold: ${_errorRateThreshold.toStringAsFixed(1)}%'),
                Slider(
                  value: _errorRateThreshold,
                  min: 1,
                  max: 20,
                  divisions: 19,
                  label: '${_errorRateThreshold.toStringAsFixed(1)}%',
                  onChanged: (value) => setState(() => _errorRateThreshold = value),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),

        const Text(
          'Storage Management',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Models: 45 MB / 100 MB'),
                const SizedBox(height: 8),
                LinearProgressIndicator(
                  value: 0.45,
                  backgroundColor: Colors.grey[300],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () {},
                        child: const Text('Clear Cache'),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () {},
                        child: const Text('Delete Old Models'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  /// Build metric card
  Widget _buildMetricCard(String title, String value, IconData icon, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: color, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    title,
                    style: const TextStyle(fontSize: 12),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              value,
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }

  /// Build resource usage bar
  Widget _buildResourceBar(String label, double percentage, Color color) {
    return Row(
      children: [
        SizedBox(
          width: 80,
          child: Text(label),
        ),
        Expanded(
          child: LinearProgressIndicator(
            value: percentage / 100,
            backgroundColor: Colors.grey[300],
            valueColor: AlwaysStoppedAnimation<Color>(color),
          ),
        ),
        const SizedBox(width: 8),
        Text('${percentage.toStringAsFixed(1)}%'),
      ],
    );
  }

  /// Build alert item
  Widget _buildAlertItem(Alert alert) {
    return ListTile(
      leading: Icon(
        _getAlertIcon(alert.severity),
        color: _getAlertColor(alert.severity),
      ),
      title: Text(alert.message),
      subtitle: Text(_formatTimestamp(alert.timestamp)),
      trailing: IconButton(
        icon: const Icon(Icons.close),
        onPressed: () => _monitoring.acknowledgeAlert(alert.id),
      ),
    );
  }

  /// Build experiment card
  Widget _buildExperimentCard(Experiment experiment) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  experiment.name,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                Chip(
                  label: Text(experiment.status.toString().split('.').last),
                  backgroundColor: Colors.blue,
                  labelStyle: const TextStyle(color: Colors.white),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text('Primary Metric: ${experiment.primaryMetric}'),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: experiment.variants.map((variant) {
                return Chip(label: Text(variant));
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }

  /// Build error rate chart
  Widget _buildErrorRateChart() {
    return LineChart(
      LineChartData(
        gridData: FlGridData(show: true),
        titlesData: FlTitlesData(
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 40,
              getTitlesWidget: (value, meta) => Text(
                '${value.toInt()}%',
                style: const TextStyle(fontSize: 10),
              ),
            ),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (value, meta) => Text(
                '${value.toInt()}h',
                style: const TextStyle(fontSize: 10),
              ),
            ),
          ),
          rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
          topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
        borderData: FlBorderData(show: true),
        lineBarsData: [
          LineChartBarData(
            spots: List.generate(24, (i) {
              return FlSpot(i.toDouble(), (2 + i % 3).toDouble());
            }),
            isCurved: true,
            color: Colors.red,
            barWidth: 2,
            dotData: FlDotData(show: false),
          ),
        ],
      ),
    );
  }

  /// Build prediction drift chart
  Widget _buildPredictionDriftChart() {
    return LineChart(
      LineChartData(
        gridData: FlGridData(show: true),
        titlesData: FlTitlesData(
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 40,
            ),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (value, meta) => Text(
                'Day ${value.toInt()}',
                style: const TextStyle(fontSize: 10),
              ),
            ),
          ),
          rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
          topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
        borderData: FlBorderData(show: true),
        lineBarsData: [
          LineChartBarData(
            spots: List.generate(7, (i) {
              return FlSpot(i.toDouble(), 0.5 + (i % 3) * 0.1);
            }),
            isCurved: true,
            color: Colors.blue,
            barWidth: 2,
            dotData: FlDotData(show: true),
          ),
        ],
      ),
    );
  }

  /// Build drift row
  DataRow _buildDriftRow(String feature, double driftScore, bool isDrifted) {
    return DataRow(cells: [
      DataCell(Text(feature)),
      DataCell(Text(driftScore.toStringAsFixed(2))),
      DataCell(
        Chip(
          label: Text(isDrifted ? 'Drifted' : 'Normal'),
          backgroundColor: isDrifted ? Colors.red : Colors.green,
          labelStyle: const TextStyle(color: Colors.white, fontSize: 12),
        ),
      ),
    ]);
  }

  /// Build bias row
  DataRow _buildBiasRow(String group, double demParity, double eqOdds) {
    return DataRow(cells: [
      DataCell(Text(group)),
      DataCell(Text(demParity.toStringAsFixed(2))),
      DataCell(Text(eqOdds.toStringAsFixed(2))),
    ]);
  }

  /// Calculate health score
  double _calculateHealthScore(PerformanceStats stats) {
    double score = 0;

    // Accuracy (40%)
    score += 0.4 * 100; // Default 100 if no accuracy data

    // Latency (30%)
    final latencyScore = stats.p95Latency < 100 ? 100 : (100 - (stats.p95Latency - 100) / 10);
    score += 0.3 * latencyScore.clamp(0, 100);

    // Error rate (20%)
    final errorScore = stats.errorRate < 1 ? 100 : (100 - stats.errorRate * 10);
    score += 0.2 * errorScore.clamp(0, 100);

    // Data quality (10%)
    score += 0.1 * 92; // Default 92%

    return score.clamp(0, 100);
  }

  /// Get health color
  Color _getHealthColor(double score) {
    if (score >= 90) return Colors.green;
    if (score >= 70) return Colors.orange;
    return Colors.red;
  }

  /// Calculate SLO compliance
  String _calculateSLOCompliance(PerformanceStats stats) {
    final compliance = stats.p95Latency < 100 ? 99.2 : 95.0;
    return '$compliance% of requests < 100ms (target: 99%)';
  }

  /// Get alert icon
  IconData _getAlertIcon(AlertSeverity severity) {
    switch (severity) {
      case AlertSeverity.critical:
        return Icons.error;
      case AlertSeverity.high:
        return Icons.warning;
      case AlertSeverity.medium:
        return Icons.info;
      case AlertSeverity.low:
        return Icons.info_outline;
    }
  }

  /// Get alert color
  Color _getAlertColor(AlertSeverity severity) {
    switch (severity) {
      case AlertSeverity.critical:
        return Colors.red;
      case AlertSeverity.high:
        return Colors.orange;
      case AlertSeverity.medium:
        return Colors.blue;
      case AlertSeverity.low:
        return Colors.grey;
    }
  }

  /// Get deployment status color
  Color _getDeploymentStatusColor(DeploymentStatus status) {
    switch (status) {
      case DeploymentStatus.inProgress:
        return Colors.blue;
      case DeploymentStatus.completed:
        return Colors.green;
      case DeploymentStatus.failed:
        return Colors.red;
      case DeploymentStatus.rolledBack:
        return Colors.orange;
    }
  }

  /// Format timestamp
  String _formatTimestamp(DateTime timestamp) {
    final now = DateTime.now();
    final diff = now.difference(timestamp);

    if (diff.inMinutes < 60) {
      return '${diff.inMinutes}m ago';
    } else if (diff.inHours < 24) {
      return '${diff.inHours}h ago';
    } else {
      return '${diff.inDays}d ago';
    }
  }

  /// Show create experiment dialog
  void _showCreateExperimentDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Create Experiment'),
        content: const Text('Experiment creation dialog would go here'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // Create experiment
            },
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }

  /// Show deploy dialog
  void _showDeployDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Deploy Model'),
        content: const Text('Select deployment strategy and configuration'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // Start deployment
            },
            child: const Text('Deploy'),
          ),
        ],
      ),
    );
  }

  /// Show rollback dialog
  void _showRollbackDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Rollback Deployment'),
        content: const Text('Are you sure you want to rollback to the previous version?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // Perform rollback
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Rollback'),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    _alertSubscription?.cancel();
    super.dispose();
  }
}
