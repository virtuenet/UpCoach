import 'dart:io';
import 'dart:typed_data';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/ai/OnDeviceMLEngine.dart';
import '../../core/ai/FederatedLearning.dart';
import '../../core/ai/EdgeIntelligence.dart';

/// Mobile AI management and testing interface
class AIStudioScreen extends StatefulWidget {
  const AIStudioScreen({Key? key}) : super(key: key);

  @override
  State<AIStudioScreen> createState() => _AIStudioScreenState();
}

class _AIStudioScreenState extends State<AIStudioScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  final OnDeviceMLEngine _mlEngine = OnDeviceMLEngine();
  final FederatedLearning _federatedLearning = FederatedLearning();
  final EdgeIntelligence _edgeIntelligence = EdgeIntelligence();

  bool _isInitialized = false;
  bool _isLoading = false;

  // Models Tab
  final List<ModelInfo> _availableModels = [];
  String? _activeModelId;
  List<ClassificationResult>? _testResults;
  File? _testImage;

  // Performance Tab
  final List<PerformanceDataPoint> _latencyData = [];
  final List<PerformanceDataPoint> _accuracyData = [];

  // Federated Learning Tab
  bool _isTraining = false;
  final List<TrainingDataPoint> _trainingLossData = [];
  double _epsilon = 1.0;
  double _clipNorm = 1.0;

  // Edge Intelligence Tab
  EdgeAnalytics? _edgeAnalytics;
  EdgeContext? _edgeContext;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _initialize();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _initialize() async {
    setState(() => _isLoading = true);

    try {
      // Initialize AI engines
      await _mlEngine.initialize();
      await _federatedLearning.initialize();
      await _edgeIntelligence.initialize();

      // Load sample models
      _loadSampleModels();

      // Load initial data
      await _loadPerformanceData();
      await _loadEdgeData();

      setState(() => _isInitialized = true);
    } catch (e) {
      debugPrint('Initialization failed: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Initialization failed: $e')),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _loadSampleModels() {
    _availableModels.addAll([
      ModelInfo(
        id: 'mobilenet_v3',
        name: 'MobileNet V3',
        version: '1.0.0',
        sizeMB: 5.3,
        accuracy: 0.724,
        latencyMs: 45,
        type: 'Image Classification',
        isDownloaded: true,
      ),
      ModelInfo(
        id: 'efficientnet_lite',
        name: 'EfficientNet Lite',
        version: '1.2.0',
        sizeMB: 7.8,
        accuracy: 0.803,
        latencyMs: 68,
        type: 'Image Classification',
        isDownloaded: true,
      ),
      ModelInfo(
        id: 'ssd_mobilenet',
        name: 'SSD MobileNet',
        version: '2.0.0',
        sizeMB: 19.2,
        accuracy: 0.691,
        latencyMs: 112,
        type: 'Object Detection',
        isDownloaded: false,
      ),
      ModelInfo(
        id: 'text_classifier',
        name: 'Text Classifier',
        version: '1.1.0',
        sizeMB: 3.5,
        accuracy: 0.867,
        latencyMs: 23,
        type: 'Text Classification',
        isDownloaded: true,
      ),
      ModelInfo(
        id: 'recommendation_model',
        name: 'Recommendation Engine',
        version: '1.0.0',
        sizeMB: 12.4,
        accuracy: 0.758,
        latencyMs: 89,
        type: 'Recommendation',
        isDownloaded: false,
      ),
    ]);

    _activeModelId = _availableModels.firstWhere((m) => m.isDownloaded).id;
  }

  Future<void> _loadPerformanceData() async {
    // Generate sample performance data
    final now = DateTime.now();
    for (var i = 0; i < 100; i++) {
      _latencyData.add(PerformanceDataPoint(
        timestamp: now.subtract(Duration(minutes: 100 - i)),
        value: 40 + (i % 20) * 2.0 + (i % 5) * 5.0,
      ));

      _accuracyData.add(PerformanceDataPoint(
        timestamp: now.subtract(Duration(minutes: 100 - i)),
        value: 0.7 + (i % 30) * 0.01,
      ));
    }
  }

  Future<void> _loadEdgeData() async {
    try {
      _edgeAnalytics = _edgeIntelligence.getAnalytics();
      _edgeContext = _edgeIntelligence.getCurrentContext();
    } catch (e) {
      debugPrint('Failed to load edge data: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Studio'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(icon: Icon(Icons.model_training), text: 'Models'),
            Tab(icon: Icon(Icons.speed), text: 'Performance'),
            Tab(icon: Icon(Icons.people), text: 'Federated'),
            Tab(icon: Icon(Icons.cloud_off), text: 'Edge'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildModelsTab(),
                _buildPerformanceTab(),
                _buildFederatedLearningTab(),
                _buildEdgeIntelligenceTab(),
              ],
            ),
    );
  }

  // Models Tab
  Widget _buildModelsTab() {
    return Column(
      children: [
        Expanded(
          flex: 2,
          child: _buildModelGallery(),
        ),
        const Divider(),
        Expanded(
          flex: 3,
          child: _buildModelTesting(),
        ),
      ],
    );
  }

  Widget _buildModelGallery() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.all(16.0),
          child: Text(
            'Available Models',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
        ),
        Expanded(
          child: GridView.builder(
            padding: const EdgeInsets.all(16),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              childAspectRatio: 0.85,
            ),
            itemCount: _availableModels.length,
            itemBuilder: (context, index) {
              final model = _availableModels[index];
              return _buildModelCard(model);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildModelCard(ModelInfo model) {
    final isActive = model.id == _activeModelId;

    return Card(
      elevation: isActive ? 8 : 2,
      color: isActive ? Colors.blue.shade50 : null,
      child: InkWell(
        onTap: model.isDownloaded ? () => _selectModel(model) : null,
        child: Padding(
          padding: const EdgeInsets.all(12.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      model.name,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  if (isActive)
                    const Icon(Icons.check_circle, color: Colors.green, size: 20),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                'v${model.version}',
                style: TextStyle(fontSize: 12, color: Colors.grey[600]),
              ),
              const SizedBox(height: 8),
              Text(
                model.type,
                style: TextStyle(fontSize: 12, color: Colors.grey[700]),
              ),
              const Spacer(),
              Row(
                children: [
                  const Icon(Icons.storage, size: 14),
                  const SizedBox(width: 4),
                  Text('${model.sizeMB.toStringAsFixed(1)} MB', style: const TextStyle(fontSize: 12)),
                ],
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  const Icon(Icons.timer, size: 14),
                  const SizedBox(width: 4),
                  Text('${model.latencyMs}ms', style: const TextStyle(fontSize: 12)),
                ],
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  const Icon(Icons.accuracy, size: 14),
                  const SizedBox(width: 4),
                  Text('${(model.accuracy * 100).toStringAsFixed(1)}%', style: const TextStyle(fontSize: 12)),
                ],
              ),
              const SizedBox(height: 8),
              if (!model.isDownloaded)
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () => _downloadModel(model),
                    icon: const Icon(Icons.download, size: 16),
                    label: const Text('Download', style: TextStyle(fontSize: 12)),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildModelTesting() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.all(16.0),
          child: Text(
            'Model Testing',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0),
          child: Row(
            children: [
              ElevatedButton.icon(
                onPressed: _pickImage,
                icon: const Icon(Icons.image),
                label: const Text('Pick Image'),
              ),
              const SizedBox(width: 16),
              ElevatedButton.icon(
                onPressed: _testImage != null ? _runInference : null,
                icon: const Icon(Icons.play_arrow),
                label: const Text('Run Inference'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Expanded(
          child: _testImage != null
              ? _buildTestResults()
              : const Center(
                  child: Text('Select an image to test the model'),
                ),
        ),
      ],
    );
  }

  Widget _buildTestResults() {
    return Row(
      children: [
        Expanded(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Image.file(_testImage!, fit: BoxFit.contain),
          ),
        ),
        Expanded(
          child: _testResults != null
              ? ListView.builder(
                  padding: const EdgeInsets.all(16.0),
                  itemCount: _testResults!.length,
                  itemBuilder: (context, index) {
                    final result = _testResults![index];
                    return Card(
                      child: ListTile(
                        leading: CircleAvatar(
                          child: Text('${index + 1}'),
                        ),
                        title: Text(result.label),
                        subtitle: LinearProgressIndicator(
                          value: result.confidence,
                          backgroundColor: Colors.grey[300],
                        ),
                        trailing: Text(
                          '${(result.confidence * 100).toStringAsFixed(1)}%',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
                    );
                  },
                )
              : const Center(child: Text('Run inference to see results')),
        ),
      ],
    );
  }

  // Performance Tab
  Widget _buildPerformanceTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Inference Latency',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 250,
            child: _buildLatencyChart(),
          ),
          const SizedBox(height: 32),
          const Text(
            'Model Accuracy',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 250,
            child: _buildAccuracyChart(),
          ),
          const SizedBox(height: 32),
          _buildPerformanceMetrics(),
          const SizedBox(height: 32),
          _buildPerformanceRecommendations(),
        ],
      ),
    );
  }

  Widget _buildLatencyChart() {
    if (_latencyData.isEmpty) {
      return const Center(child: Text('No data available'));
    }

    return LineChart(
      LineChartData(
        gridData: FlGridData(show: true),
        titlesData: FlTitlesData(
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 40,
              getTitlesWidget: (value, meta) {
                return Text('${value.toInt()}ms', style: const TextStyle(fontSize: 10));
              },
            ),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 30,
              getTitlesWidget: (value, meta) {
                if (value.toInt() % 20 == 0) {
                  return Text('${value.toInt()}', style: const TextStyle(fontSize: 10));
                }
                return const Text('');
              },
            ),
          ),
          rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
          topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
        borderData: FlBorderData(show: true),
        lineBarsData: [
          LineChartBarData(
            spots: _latencyData
                .asMap()
                .entries
                .map((e) => FlSpot(e.key.toDouble(), e.value.value))
                .toList(),
            isCurved: true,
            color: Colors.blue,
            barWidth: 2,
            dotData: FlDotData(show: false),
          ),
        ],
      ),
    );
  }

  Widget _buildAccuracyChart() {
    if (_accuracyData.isEmpty) {
      return const Center(child: Text('No data available'));
    }

    return LineChart(
      LineChartData(
        gridData: FlGridData(show: true),
        titlesData: FlTitlesData(
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 40,
              getTitlesWidget: (value, meta) {
                return Text('${(value * 100).toInt()}%', style: const TextStyle(fontSize: 10));
              },
            ),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 30,
              getTitlesWidget: (value, meta) {
                if (value.toInt() % 20 == 0) {
                  return Text('${value.toInt()}', style: const TextStyle(fontSize: 10));
                }
                return const Text('');
              },
            ),
          ),
          rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
          topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
        borderData: FlBorderData(show: true),
        lineBarsData: [
          LineChartBarData(
            spots: _accuracyData
                .asMap()
                .entries
                .map((e) => FlSpot(e.key.toDouble(), e.value.value))
                .toList(),
            isCurved: true,
            color: Colors.green,
            barWidth: 2,
            dotData: FlDotData(show: false),
          ),
        ],
      ),
    );
  }

  Widget _buildPerformanceMetrics() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Resource Usage',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            _buildMetricRow('CPU Usage', '45%', Icons.memory),
            const SizedBox(height: 8),
            _buildMetricRow('Memory Usage', '128 MB', Icons.storage),
            const SizedBox(height: 8),
            _buildMetricRow('Battery Impact', '2.3% / hour', Icons.battery_charging_full),
            const SizedBox(height: 8),
            _buildMetricRow('Total Inferences', '1,247', Icons.analytics),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricRow(String label, String value, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 20, color: Colors.grey[700]),
        const SizedBox(width: 8),
        Expanded(
          child: Text(label, style: const TextStyle(fontSize: 14)),
        ),
        Text(
          value,
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
        ),
      ],
    );
  }

  Widget _buildPerformanceRecommendations() {
    return Card(
      color: Colors.orange.shade50,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: const [
                Icon(Icons.lightbulb, color: Colors.orange),
                SizedBox(width: 8),
                Text(
                  'Recommendations',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _buildRecommendation('Enable GPU acceleration for 30% faster inference'),
            _buildRecommendation('Use quantized model to reduce memory by 50%'),
            _buildRecommendation('Consider using smaller model for better battery life'),
          ],
        ),
      ),
    );
  }

  Widget _buildRecommendation(String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('• ', style: TextStyle(fontSize: 16)),
          Expanded(child: Text(text, style: const TextStyle(fontSize: 14))),
        ],
      ),
    );
  }

  // Federated Learning Tab
  Widget _buildFederatedLearningTab() {
    final status = _federatedLearning.getStatus();
    final privacySettings = _federatedLearning.getPrivacySettings();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildTrainingStatus(status),
          const SizedBox(height: 24),
          _buildTrainingControls(),
          const SizedBox(height: 24),
          _buildPrivacySettings(privacySettings),
          const SizedBox(height: 24),
          _buildTrainingHistory(status),
          const SizedBox(height: 24),
          _buildContributionMetrics(status),
        ],
      ),
    );
  }

  Widget _buildTrainingStatus(TrainingStatus status) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.info_outline, color: Colors.blue),
                const SizedBox(width: 8),
                const Text(
                  'Training Status',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (status.isTraining)
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Round ${status.roundsCompleted}/10',
                    style: const TextStyle(fontSize: 16),
                  ),
                  const SizedBox(height: 8),
                  LinearProgressIndicator(
                    value: status.roundsCompleted / 10,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Global Accuracy: ${(status.globalAccuracy * 100).toStringAsFixed(1)}%',
                    style: const TextStyle(fontSize: 16),
                  ),
                ],
              )
            else
              const Text(
                'Not training',
                style: TextStyle(fontSize: 16, color: Colors.grey),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildTrainingControls() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Controls',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                ElevatedButton.icon(
                  onPressed: _isTraining ? null : _startTraining,
                  icon: const Icon(Icons.play_arrow),
                  label: const Text('Start'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    foregroundColor: Colors.white,
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: _isTraining ? _pauseTraining : null,
                  icon: const Icon(Icons.pause),
                  label: const Text('Pause'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.orange,
                    foregroundColor: Colors.white,
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: _isTraining ? _stopTraining : null,
                  icon: const Icon(Icons.stop),
                  label: const Text('Stop'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red,
                    foregroundColor: Colors.white,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPrivacySettings(PrivacySettings settings) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: const [
                Icon(Icons.security, color: Colors.green),
                SizedBox(width: 8),
                Text(
                  'Privacy Settings',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text('Epsilon (Privacy Budget): ${_epsilon.toStringAsFixed(1)}'),
            Slider(
              value: _epsilon,
              min: 0.1,
              max: 10.0,
              divisions: 99,
              label: _epsilon.toStringAsFixed(1),
              onChanged: (value) {
                setState(() => _epsilon = value);
                _federatedLearning.updatePrivacySettings(epsilon: value);
              },
            ),
            const SizedBox(height: 8),
            Text('Gradient Clipping: ${_clipNorm.toStringAsFixed(1)}'),
            Slider(
              value: _clipNorm,
              min: 0.1,
              max: 5.0,
              divisions: 49,
              label: _clipNorm.toStringAsFixed(1),
              onChanged: (value) {
                setState(() => _clipNorm = value);
                _federatedLearning.updatePrivacySettings(clipNorm: value);
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTrainingHistory(TrainingStatus status) {
    if (status.trainingHistory.isEmpty) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(16.0),
          child: Center(
            child: Text('No training history available'),
          ),
        ),
      );
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Training History',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 250,
              child: _buildTrainingLossChart(status.trainingHistory),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTrainingLossChart(List<TrainingRound> history) {
    return LineChart(
      LineChartData(
        gridData: FlGridData(show: true),
        titlesData: FlTitlesData(
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 40,
              getTitlesWidget: (value, meta) {
                return Text(value.toStringAsFixed(2), style: const TextStyle(fontSize: 10));
              },
            ),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 30,
              getTitlesWidget: (value, meta) {
                return Text('R${value.toInt()}', style: const TextStyle(fontSize: 10));
              },
            ),
          ),
          rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
          topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
        borderData: FlBorderData(show: true),
        lineBarsData: [
          LineChartBarData(
            spots: history
                .asMap()
                .entries
                .map((e) => FlSpot(e.key.toDouble(), e.value.loss))
                .toList(),
            isCurved: true,
            color: Colors.purple,
            barWidth: 2,
            dotData: FlDotData(show: true),
          ),
        ],
      ),
    );
  }

  Widget _buildContributionMetrics(TrainingStatus status) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Contribution Metrics',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            _buildMetricRow('Gradients Contributed', '${status.gradientsContributed}', Icons.upload),
            const SizedBox(height: 8),
            _buildMetricRow(
              'Training Time',
              '${status.totalTrainingTimeMinutes.toStringAsFixed(1)} min',
              Icons.timer,
            ),
            const SizedBox(height: 8),
            _buildMetricRow(
              'Participation Rate',
              '${(status.participationRate * 100).toStringAsFixed(1)}%',
              Icons.people,
            ),
          ],
        ),
      ),
    );
  }

  // Edge Intelligence Tab
  Widget _buildEdgeIntelligenceTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildCacheStatistics(),
          const SizedBox(height: 24),
          _buildOfflineMode(),
          const SizedBox(height: 24),
          _buildContextDisplay(),
          const SizedBox(height: 24),
          _buildCacheActions(),
        ],
      ),
    );
  }

  Widget _buildCacheStatistics() {
    if (_edgeAnalytics == null) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(16.0),
          child: Center(child: CircularProgressIndicator()),
        ),
      );
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Cache Statistics',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            _buildMetricRow(
              'Hit Rate',
              '${(_edgeAnalytics!.cacheHitRate * 100).toStringAsFixed(1)}%',
              Icons.trending_up,
            ),
            const SizedBox(height: 8),
            _buildMetricRow(
              'Cache Size',
              '${_edgeAnalytics!.cacheSizeMB.toStringAsFixed(1)} MB',
              Icons.storage,
            ),
            const SizedBox(height: 16),
            const Text(
              'Top Predictions:',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            ..._edgeAnalytics!.topQueries.map((query) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4.0),
                  child: Row(
                    children: [
                      Expanded(child: Text(query.query)),
                      Text('${query.count}x', style: const TextStyle(fontWeight: FontWeight.bold)),
                    ],
                  ),
                )),
          ],
        ),
      ),
    );
  }

  Widget _buildOfflineMode() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.cloud_off,
                  color: _edgeAnalytics!.offlineRate > 0.5 ? Colors.green : Colors.grey,
                ),
                const SizedBox(width: 8),
                const Text(
                  'Offline Intelligence',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _buildMetricRow(
              'Offline Inferences',
              '${_edgeAnalytics!.offlineInferences}',
              Icons.cloud_off,
            ),
            const SizedBox(height: 8),
            _buildMetricRow(
              'Online Inferences',
              '${_edgeAnalytics!.onlineInferences}',
              Icons.cloud,
            ),
            const SizedBox(height: 8),
            _buildMetricRow(
              'Offline Rate',
              '${(_edgeAnalytics!.offlineRate * 100).toStringAsFixed(1)}%',
              Icons.analytics,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContextDisplay() {
    if (_edgeContext == null) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(16.0),
          child: Center(child: Text('Context not available')),
        ),
      );
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Current Context',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            _buildMetricRow(
              'Location',
              _edgeContext!.locationDescription,
              Icons.location_on,
            ),
            const SizedBox(height: 8),
            _buildMetricRow(
              'Activity',
              _edgeAnalytics!.currentActivity,
              Icons.directions_run,
            ),
            const SizedBox(height: 8),
            _buildMetricRow(
              'Time of Day',
              _edgeContext!.timeOfDay,
              Icons.access_time,
            ),
            const SizedBox(height: 8),
            _buildMetricRow(
              'Recommended Model',
              _edgeContext!.modelRecommendation,
              Icons.model_training,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCacheActions() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Actions',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _clearCache,
                icon: const Icon(Icons.delete),
                label: const Text('Clear Cache'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                  foregroundColor: Colors.white,
                ),
              ),
            ),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _warmupCache,
                icon: const Icon(Icons.refresh),
                label: const Text('Warm Up Cache'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  foregroundColor: Colors.white,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Actions
  void _selectModel(ModelInfo model) {
    setState(() {
      _activeModelId = model.id;
      _testResults = null;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Selected model: ${model.name}')),
    );
  }

  Future<void> _downloadModel(ModelInfo model) async {
    setState(() => _isLoading = true);

    try {
      // Simulate download
      await Future.delayed(const Duration(seconds: 2));

      setState(() {
        model.isDownloaded = true;
        _isLoading = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${model.name} downloaded successfully')),
        );
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Download failed: $e')),
        );
      }
    }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);

    if (pickedFile != null) {
      setState(() {
        _testImage = File(pickedFile.path);
        _testResults = null;
      });
    }
  }

  Future<void> _runInference() async {
    if (_testImage == null || _activeModelId == null) return;

    setState(() => _isLoading = true);

    try {
      final imageBytes = await _testImage!.readAsBytes();

      // Simulate inference (in production, use actual model)
      await Future.delayed(const Duration(milliseconds: 500));

      setState(() {
        _testResults = [
          ClassificationResult(classIndex: 0, label: 'Cat', confidence: 0.92),
          ClassificationResult(classIndex: 1, label: 'Dog', confidence: 0.05),
          ClassificationResult(classIndex: 2, label: 'Bird', confidence: 0.02),
          ClassificationResult(classIndex: 3, label: 'Fish', confidence: 0.01),
        ];
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Inference failed: $e')),
        );
      }
    }
  }

  void _startTraining() {
    setState(() => _isTraining = true);

    // Generate sample training data
    final trainingData = List.generate(
      100,
      (i) => TrainingExample(
        features: List.generate(128, (_) => (i % 10) / 10.0),
        label: i % 10,
      ),
    );

    _federatedLearning.startTraining(
      modelId: 'federated_model',
      localData: trainingData,
      maxRounds: 10,
    );

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Training started')),
    );
  }

  void _pauseTraining() {
    setState(() => _isTraining = false);
    _federatedLearning.pauseTraining();

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Training paused')),
    );
  }

  void _stopTraining() {
    setState(() => _isTraining = false);
    _federatedLearning.stopTraining();

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Training stopped')),
    );
  }

  void _clearCache() {
    _edgeIntelligence.clearCache();

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Cache cleared')),
    );

    _loadEdgeData();
  }

  Future<void> _warmupCache() async {
    setState(() => _isLoading = true);

    try {
      await _edgeIntelligence.warmupCache();

      setState(() => _isLoading = false);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Cache warmed up')),
        );
      }

      await _loadEdgeData();
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Warmup failed: $e')),
        );
      }
    }
  }
}

// Model info
class ModelInfo {
  final String id;
  final String name;
  final String version;
  final double sizeMB;
  final double accuracy;
  final int latencyMs;
  final String type;
  bool isDownloaded;

  ModelInfo({
    required this.id,
    required this.name,
    required this.version,
    required this.sizeMB,
    required this.accuracy,
    required this.latencyMs,
    required this.type,
    required this.isDownloaded,
  });
}

// Performance data point
class PerformanceDataPoint {
  final DateTime timestamp;
  final double value;

  PerformanceDataPoint({
    required this.timestamp,
    required this.value,
  });
}

// Training data point
class TrainingDataPoint {
  final int round;
  final double loss;

  TrainingDataPoint({
    required this.round,
    required this.loss,
  });
}
