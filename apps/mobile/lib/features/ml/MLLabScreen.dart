import 'dart:async';
import 'dart:math';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../../core/ml/NeuralArchitectureSearch.dart';
import '../../core/ml/ContinualLearning.dart';
import '../../core/ml/ExplainableAI.dart';

/// ML Lab Screen for experimentation and debugging
class MLLabScreen extends StatefulWidget {
  const MLLabScreen({Key? key}) : super(key: key);

  @override
  State<MLLabScreen> createState() => _MLLabScreenState();
}

class _MLLabScreenState extends State<MLLabScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // AutoML state
  final NeuralArchitectureSearch _nas = NeuralArchitectureSearch();
  AutoMLResult? _autoMLResult;
  bool _isAutoMLRunning = false;
  AutoMLProgress? _autoMLProgress;

  // Continual Learning state
  final ContinualLearning _continualLearning = ContinualLearning();
  final List<TaskPerformance> _taskPerformances = [];
  BufferStatistics? _bufferStats;

  // Explainability state
  final ExplainableAI _explainableAI = ExplainableAI();
  Explanation? _currentExplanation;
  SaliencyMap? _saliencyMap;
  ui.Image? _uploadedImage;
  File? _imageFile;
  Prediction? _imagePrediction;

  // Model Inspector state
  final List<ModelInfo> _models = [];
  ModelInfo? _selectedModel;

  // Experiments state
  final List<Experiment> _experiments = [];
  Experiment? _selectedExperiment;

  final Random _random = Random();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    _initializeMLLab();
  }

  Future<void> _initializeMLLab() async {
    await _continualLearning.initialize();
    _generateMockData();
  }

  void _generateMockData() {
    // Generate mock models
    _models.addAll([
      ModelInfo(
        id: 'model_1',
        name: 'EfficientNet-B0',
        architecture: 'Dense(128, relu) -> Dropout(0.3) -> Dense(10, softmax)',
        compressedSize: 2.4 * 1024 * 1024,
        uncompressedSize: 9.8 * 1024 * 1024,
        parameterCount: 1200000,
        avgInferenceTime: 45,
        minInferenceTime: 23,
        maxInferenceTime: 78,
      ),
      ModelInfo(
        id: 'model_2',
        name: 'MobileNetV3',
        architecture: 'Dense(64, relu) -> BatchNorm -> Dense(10, softmax)',
        compressedSize: 1.2 * 1024 * 1024,
        uncompressedSize: 4.5 * 1024 * 1024,
        parameterCount: 650000,
        avgInferenceTime: 28,
        minInferenceTime: 15,
        maxInferenceTime: 42,
      ),
    ]);

    // Generate mock experiments
    _experiments.addAll([
      Experiment(
        id: 'exp_1',
        name: 'Image Classification',
        status: ExperimentStatus.completed,
        bestMetric: 0.89,
        runtime: const Duration(minutes: 45),
        hyperparameters: {
          'learning_rate': 0.001,
          'batch_size': 32,
          'epochs': 50,
        },
        metrics: {
          'accuracy': [0.65, 0.72, 0.78, 0.83, 0.87, 0.89],
          'loss': [1.2, 0.95, 0.72, 0.58, 0.45, 0.38],
        },
      ),
      Experiment(
        id: 'exp_2',
        name: 'AutoML Search',
        status: ExperimentStatus.running,
        bestMetric: 0.85,
        runtime: const Duration(minutes: 12),
        hyperparameters: {
          'population_size': 10,
          'generations': 5,
        },
        metrics: {
          'accuracy': [0.70, 0.75, 0.80, 0.85],
          'loss': [0.85, 0.68, 0.55, 0.42],
        },
      ),
    ]);

    // Generate mock task performances
    _taskPerformances.addAll([
      TaskPerformance(
        taskId: 1,
        taskName: 'Flowers',
        accuracy: 0.90,
        timestamp: DateTime.now().subtract(const Duration(days: 10)),
      ),
      TaskPerformance(
        taskId: 2,
        taskName: 'Animals',
        accuracy: 0.87,
        timestamp: DateTime.now().subtract(const Duration(days: 5)),
      ),
      TaskPerformance(
        taskId: 3,
        taskName: 'Vehicles',
        accuracy: 0.85,
        timestamp: DateTime.now(),
      ),
    ]);

    _bufferStats = BufferStatistics(
      totalSamples: 500,
      samplesPerTask: {1: 180, 2: 170, 3: 150},
      averageImportance: 0.68,
    );

    setState(() {});
  }

  @override
  void dispose() {
    _tabController.dispose();
    _continualLearning.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('ML Lab'),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabs: const [
            Tab(text: 'AutoML'),
            Tab(text: 'Continual Learning'),
            Tab(text: 'Explainability'),
            Tab(text: 'Model Inspector'),
            Tab(text: 'Experiments'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildAutoMLTab(),
          _buildContinualLearningTab(),
          _buildExplainabilityTab(),
          _buildModelInspectorTab(),
          _buildExperimentsTab(),
        ],
      ),
    );
  }

  // AutoML Tab
  Widget _buildAutoMLTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionHeader('Architecture Search'),
          const SizedBox(height: 16),
          if (_autoMLProgress != null) ...[
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _autoMLProgress!.message,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),
                    LinearProgressIndicator(
                      value: _autoMLProgress!.progress,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${(_autoMLProgress!.progress * 100).toStringAsFixed(0)}% Complete',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],
          if (_autoMLResult != null) ...[
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Best Architecture',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _autoMLResult!.bestArchitecture.architecture.describe(),
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildMetricCard(
                          'Accuracy',
                          '${(_autoMLResult!.accuracy * 100).toStringAsFixed(1)}%',
                          Icons.check_circle,
                          Colors.green,
                        ),
                        _buildMetricCard(
                          'Latency',
                          '${_autoMLResult!.latency.toStringAsFixed(0)}ms',
                          Icons.speed,
                          Colors.blue,
                        ),
                        _buildMetricCard(
                          'Size',
                          '${(_autoMLResult!.modelSize / 1024 / 1024).toStringAsFixed(1)}MB',
                          Icons.storage,
                          Colors.orange,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            _buildSectionHeader('Pareto Frontier'),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: SizedBox(
                  height: 300,
                  child: _buildParetoFrontierChart(),
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],
          _buildSectionHeader('Compression Settings'),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Pruning Threshold',
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                  Slider(
                    value: 0.01,
                    min: 0,
                    max: 0.1,
                    divisions: 100,
                    label: '0.01',
                    onChanged: (value) {},
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Quantization',
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                  DropdownButton<String>(
                    value: 'int8',
                    items: const [
                      DropdownMenuItem(value: 'int8', child: Text('INT8')),
                      DropdownMenuItem(value: 'float16', child: Text('FP16')),
                    ],
                    onChanged: (value) {},
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _isAutoMLRunning ? null : _runAutoML,
              icon: const Icon(Icons.play_arrow),
              label: const Text('Start AutoML'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.all(16),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Continual Learning Tab
  Widget _buildContinualLearningTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionHeader('Task Timeline'),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: _taskPerformances.map((task) {
                  return ListTile(
                    leading: CircleAvatar(
                      child: Text('${task.taskId}'),
                    ),
                    title: Text(task.taskName),
                    subtitle: Text(
                      'Learned ${DateTime.now().difference(task.timestamp).inDays} days ago',
                    ),
                    trailing: Chip(
                      label: Text('${(task.accuracy * 100).toStringAsFixed(0)}%'),
                      backgroundColor: Colors.green.withOpacity(0.2),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
          const SizedBox(height: 16),
          _buildSectionHeader('Performance Matrix'),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: SizedBox(
                height: 300,
                child: _buildPerformanceMatrix(),
              ),
            ),
          ),
          const SizedBox(height: 16),
          _buildSectionHeader('Memory Buffer'),
          const SizedBox(height: 16),
          if (_bufferStats != null)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Buffer Status: ${_bufferStats!.totalSamples}/500 samples',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),
                    LinearProgressIndicator(
                      value: _bufferStats!.totalSamples / 500,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Samples per Task:',
                      style: Theme.of(context).textTheme.titleSmall,
                    ),
                    const SizedBox(height: 8),
                    ..._bufferStats!.samplesPerTask.entries.map((e) {
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Task ${e.key}'),
                            Text('${e.value} samples'),
                          ],
                        ),
                      );
                    }).toList(),
                  ],
                ),
              ),
            ),
          const SizedBox(height: 16),
          _buildSectionHeader('Forgetting Curve'),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: SizedBox(
                height: 250,
                child: _buildForgettingCurve(),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Explainability Tab
  Widget _buildExplainabilityTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionHeader('Image Upload'),
          const SizedBox(height: 16),
          Card(
            child: InkWell(
              onTap: _pickImage,
              child: Container(
                height: 200,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.grey[200],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: _imageFile != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.file(
                          _imageFile!,
                          fit: BoxFit.cover,
                        ),
                      )
                    : Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.cloud_upload, size: 48, color: Colors.grey[600]),
                          const SizedBox(height: 8),
                          Text(
                            'Tap to upload image',
                            style: TextStyle(color: Colors.grey[600]),
                          ),
                        ],
                      ),
              ),
            ),
          ),
          if (_imagePrediction != null) ...[
            const SizedBox(height: 16),
            _buildSectionHeader('Prediction'),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _imagePrediction!.className,
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${(_imagePrediction!.confidence * 100).toStringAsFixed(1)}% confidence',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            _buildSectionHeader('Top 3 Predictions'),
            const SizedBox(height: 16),
            ...(_imagePrediction!.topPredictions.take(3).map((pred) {
              return Card(
                child: ListTile(
                  leading: CircleAvatar(
                    child: Text('${pred.classId}'),
                  ),
                  title: Text(pred.className),
                  trailing: Text(
                    '${(pred.confidence * 100).toStringAsFixed(1)}%',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              );
            }).toList()),
          ],
          if (_currentExplanation != null) ...[
            const SizedBox(height: 16),
            _buildSectionHeader('Feature Importance'),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: SizedBox(
                  height: 300,
                  child: _buildFeatureImportanceChart(),
                ),
              ),
            ),
            const SizedBox(height: 16),
            _buildSectionHeader('Explanation'),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                  _currentExplanation!.naturalLanguage,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ),
            ),
          ],
          if (_saliencyMap != null && _imageFile != null) ...[
            const SizedBox(height: 16),
            _buildSectionHeader('Saliency Map'),
            const SizedBox(height: 16),
            Card(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Stack(
                  children: [
                    Image.file(_imageFile!),
                    CustomPaint(
                      painter: SaliencyPainter(_saliencyMap!),
                      child: Container(),
                    ),
                  ],
                ),
              ),
            ),
          ],
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _imageFile != null ? _explainPrediction : null,
                  icon: const Icon(Icons.analytics),
                  label: const Text('Explain'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _imageFile != null ? _generateSaliency : null,
                  icon: const Icon(Icons.map),
                  label: const Text('Saliency'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // Model Inspector Tab
  Widget _buildModelInspectorTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionHeader('Models'),
          const SizedBox(height: 16),
          ..._models.map((model) {
            final isSelected = _selectedModel?.id == model.id;
            return Card(
              color: isSelected ? Colors.blue.withOpacity(0.1) : null,
              child: ListTile(
                leading: const Icon(Icons.model_training),
                title: Text(model.name),
                subtitle: Text(
                  '${(model.compressedSize / 1024 / 1024).toStringAsFixed(1)}MB • ${model.parameterCount ~/ 1000}K params',
                ),
                trailing: isSelected ? const Icon(Icons.check_circle, color: Colors.blue) : null,
                onTap: () => setState(() => _selectedModel = model),
              ),
            );
          }).toList(),
          if (_selectedModel != null) ...[
            const SizedBox(height: 16),
            _buildSectionHeader('Architecture'),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _selectedModel!.architecture,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            fontFamily: 'monospace',
                          ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            _buildSectionHeader('Statistics'),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    _buildStatRow('Compressed Size',
                        '${(_selectedModel!.compressedSize / 1024 / 1024).toStringAsFixed(1)} MB'),
                    _buildStatRow('Uncompressed Size',
                        '${(_selectedModel!.uncompressedSize / 1024 / 1024).toStringAsFixed(1)} MB'),
                    _buildStatRow(
                        'Parameters', '${_selectedModel!.parameterCount ~/ 1000}K'),
                    _buildStatRow('Avg Inference', '${_selectedModel!.avgInferenceTime} ms'),
                    _buildStatRow('Min Inference', '${_selectedModel!.minInferenceTime} ms'),
                    _buildStatRow('Max Inference', '${_selectedModel!.maxInferenceTime} ms'),
                  ],
                ),
              ),
            ),
          ],
          if (_models.length >= 2) ...[
            const SizedBox(height: 16),
            _buildSectionHeader('Model Comparison'),
            const SizedBox(height: 16),
            Card(
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: DataTable(
                  columns: const [
                    DataColumn(label: Text('Metric')),
                    DataColumn(label: Text('Model 1')),
                    DataColumn(label: Text('Model 2')),
                  ],
                  rows: [
                    DataRow(cells: [
                      const DataCell(Text('Size (MB)')),
                      DataCell(Text(
                          '${(_models[0].compressedSize / 1024 / 1024).toStringAsFixed(1)}')),
                      DataCell(Text(
                          '${(_models[1].compressedSize / 1024 / 1024).toStringAsFixed(1)}')),
                    ]),
                    DataRow(cells: [
                      const DataCell(Text('Parameters')),
                      DataCell(Text('${_models[0].parameterCount ~/ 1000}K')),
                      DataCell(Text('${_models[1].parameterCount ~/ 1000}K')),
                    ]),
                    DataRow(cells: [
                      const DataCell(Text('Inference (ms)')),
                      DataCell(Text('${_models[0].avgInferenceTime}')),
                      DataCell(Text('${_models[1].avgInferenceTime}')),
                    ]),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  // Experiments Tab
  Widget _buildExperimentsTab() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  'Experiments',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
              ),
              ElevatedButton.icon(
                onPressed: _createExperiment,
                icon: const Icon(Icons.add),
                label: const Text('New'),
              ),
            ],
          ),
        ),
        Expanded(
          child: SingleChildScrollView(
            child: Column(
              children: [
                Card(
                  margin: const EdgeInsets.symmetric(horizontal: 16),
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: DataTable(
                      columns: const [
                        DataColumn(label: Text('Name')),
                        DataColumn(label: Text('Status')),
                        DataColumn(label: Text('Best Metric')),
                        DataColumn(label: Text('Runtime')),
                      ],
                      rows: _experiments.map((exp) {
                        return DataRow(
                          selected: _selectedExperiment?.id == exp.id,
                          onSelectChanged: (selected) {
                            if (selected == true) {
                              setState(() => _selectedExperiment = exp);
                            }
                          },
                          cells: [
                            DataCell(Text(exp.name)),
                            DataCell(_buildStatusChip(exp.status)),
                            DataCell(Text(exp.bestMetric?.toStringAsFixed(3) ?? '-')),
                            DataCell(Text(
                                '${exp.runtime?.inMinutes ?? 0}m ${(exp.runtime?.inSeconds ?? 0) % 60}s')),
                          ],
                        );
                      }).toList(),
                    ),
                  ),
                ),
                if (_selectedExperiment != null) ...[
                  const SizedBox(height: 16),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: _buildSectionHeader('Experiment Details'),
                  ),
                  const SizedBox(height: 16),
                  Card(
                    margin: const EdgeInsets.symmetric(horizontal: 16),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Hyperparameters',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(height: 8),
                          ..._selectedExperiment!.hyperparameters.entries.map((e) {
                            return Padding(
                              padding: const EdgeInsets.symmetric(vertical: 4),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(e.key),
                                  Text(
                                    e.value.toString(),
                                    style: const TextStyle(fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                            );
                          }).toList(),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Card(
                    margin: const EdgeInsets.symmetric(horizontal: 16),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Training Curves',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(height: 16),
                          SizedBox(
                            height: 250,
                            child: _buildTrainingCurves(_selectedExperiment!),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // Helper Widgets
  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
          ),
    );
  }

  Widget _buildMetricCard(String label, String value, IconData icon, Color color) {
    return Column(
      children: [
        Icon(icon, color: color, size: 32),
        const SizedBox(height: 8),
        Text(
          value,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ],
    );
  }

  Widget _buildStatRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label),
          Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusChip(ExperimentStatus status) {
    Color color;
    IconData icon;

    switch (status) {
      case ExperimentStatus.running:
        color = Colors.blue;
        icon = Icons.play_arrow;
        break;
      case ExperimentStatus.completed:
        color = Colors.green;
        icon = Icons.check_circle;
        break;
      case ExperimentStatus.failed:
        color = Colors.red;
        icon = Icons.error;
        break;
      case ExperimentStatus.cancelled:
        color = Colors.grey;
        icon = Icons.cancel;
        break;
    }

    return Chip(
      avatar: Icon(icon, size: 16, color: color),
      label: Text(status.name),
      backgroundColor: color.withOpacity(0.1),
    );
  }

  // Charts
  Widget _buildParetoFrontierChart() {
    if (_autoMLResult == null || _autoMLResult!.paretoFrontier.isEmpty) {
      return const Center(child: Text('No data'));
    }

    final spots = _autoMLResult!.paretoFrontier.map((candidate) {
      return ScatterSpot(
        candidate.latency,
        candidate.accuracy * 100,
      );
    }).toList();

    return ScatterChart(
      ScatterChartData(
        scatterSpots: spots,
        minX: spots.map((s) => s.x).reduce(min) - 5,
        maxX: spots.map((s) => s.x).reduce(max) + 5,
        minY: spots.map((s) => s.y).reduce(min) - 2,
        maxY: spots.map((s) => s.y).reduce(max) + 2,
        titlesData: FlTitlesData(
          leftTitles: AxisTitles(
            axisNameWidget: const Text('Accuracy (%)'),
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 40,
              getTitlesWidget: (value, meta) => Text(value.toStringAsFixed(0)),
            ),
          ),
          bottomTitles: AxisTitles(
            axisNameWidget: const Text('Latency (ms)'),
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (value, meta) => Text(value.toStringAsFixed(0)),
            ),
          ),
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
        scatterTouchData: ScatterTouchData(enabled: true),
      ),
    );
  }

  Widget _buildPerformanceMatrix() {
    return LineChart(
      LineChartData(
        lineBarsData: _taskPerformances.asMap().entries.map((entry) {
          final index = entry.key;
          final task = entry.value;
          return LineChartBarData(
            spots: [
              FlSpot(index.toDouble(), task.accuracy * 100),
            ],
            isCurved: true,
            color: Colors.primaries[index % Colors.primaries.length],
            barWidth: 3,
          );
        }).toList(),
        titlesData: FlTitlesData(
          leftTitles: AxisTitles(
            axisNameWidget: const Text('Accuracy (%)'),
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 40,
              getTitlesWidget: (value, meta) => Text(value.toStringAsFixed(0)),
            ),
          ),
          bottomTitles: AxisTitles(
            axisNameWidget: const Text('Task'),
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (value, meta) => Text('T${value.toInt() + 1}'),
            ),
          ),
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
        gridData: const FlGridData(show: true),
        borderData: FlBorderData(show: true),
      ),
    );
  }

  Widget _buildForgettingCurve() {
    final data = [
      FlSpot(0, 90),
      FlSpot(1, 88),
      FlSpot(2, 85),
    ];

    return LineChart(
      LineChartData(
        lineBarsData: [
          LineChartBarData(
            spots: data,
            isCurved: true,
            color: Colors.red,
            barWidth: 3,
            dotData: const FlDotData(show: true),
          ),
        ],
        titlesData: FlTitlesData(
          leftTitles: AxisTitles(
            axisNameWidget: const Text('Accuracy (%)'),
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 40,
              getTitlesWidget: (value, meta) => Text(value.toStringAsFixed(0)),
            ),
          ),
          bottomTitles: AxisTitles(
            axisNameWidget: const Text('Task'),
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (value, meta) => Text('T${value.toInt() + 1}'),
            ),
          ),
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
      ),
    );
  }

  Widget _buildFeatureImportanceChart() {
    if (_currentExplanation == null) {
      return const Center(child: Text('No data'));
    }

    final vizData = _explainableAI.prepareVisualization(_currentExplanation!);

    return BarChart(
      BarChartData(
        alignment: BarChartAlignment.spaceAround,
        maxY: vizData.values.map((v) => v.abs()).reduce(max) * 1.2,
        minY: -vizData.values.map((v) => v.abs()).reduce(max) * 1.2,
        barGroups: List.generate(vizData.featureNames.length, (index) {
          return BarChartGroupData(
            x: index,
            barRods: [
              BarChartRodData(
                toY: vizData.values[index],
                color: vizData.values[index] >= 0 ? Colors.green : Colors.red,
                width: 20,
              ),
            ],
          );
        }),
        titlesData: FlTitlesData(
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 40,
              getTitlesWidget: (value, meta) => Text(value.toStringAsFixed(2)),
            ),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (value, meta) {
                if (value.toInt() < vizData.featureNames.length) {
                  return Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      vizData.featureNames[value.toInt()],
                      style: const TextStyle(fontSize: 10),
                    ),
                  );
                }
                return const Text('');
              },
            ),
          ),
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
      ),
    );
  }

  Widget _buildTrainingCurves(Experiment experiment) {
    final accuracySpots = experiment.metrics['accuracy']
            ?.asMap()
            .entries
            .map((e) => FlSpot(e.key.toDouble(), e.value * 100))
            .toList() ??
        [];

    final lossSpots = experiment.metrics['loss']
            ?.asMap()
            .entries
            .map((e) => FlSpot(e.key.toDouble(), e.value * 100))
            .toList() ??
        [];

    return LineChart(
      LineChartData(
        lineBarsData: [
          LineChartBarData(
            spots: accuracySpots,
            isCurved: true,
            color: Colors.green,
            barWidth: 3,
            dotData: const FlDotData(show: false),
          ),
          LineChartBarData(
            spots: lossSpots,
            isCurved: true,
            color: Colors.red,
            barWidth: 3,
            dotData: const FlDotData(show: false),
          ),
        ],
        titlesData: FlTitlesData(
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 40,
              getTitlesWidget: (value, meta) => Text(value.toStringAsFixed(0)),
            ),
          ),
          bottomTitles: AxisTitles(
            axisNameWidget: const Text('Epoch'),
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (value, meta) => Text(value.toStringAsFixed(0)),
            ),
          ),
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
      ),
    );
  }

  // Actions
  Future<void> _runAutoML() async {
    setState(() => _isAutoMLRunning = true);

    try {
      // Generate mock training data
      final trainingData = List.generate(
        200,
        (_) => List.generate(10, (_) => _random.nextDouble() * 2 - 1),
      );
      final trainingLabels = List.generate(200, (_) => _random.nextInt(3));
      final validationData = List.generate(
        50,
        (_) => List.generate(10, (_) => _random.nextDouble() * 2 - 1),
      );
      final validationLabels = List.generate(50, (_) => _random.nextInt(3));

      final result = await _nas.runAutoML(
        trainingData: trainingData,
        trainingLabels: trainingLabels,
        validationData: validationData,
        validationLabels: validationLabels,
        objective: AutoMLObjective.balanced,
        onProgress: (progress) {
          setState(() => _autoMLProgress = progress);
        },
      );

      setState(() {
        _autoMLResult = result;
        _isAutoMLRunning = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('AutoML completed successfully')),
        );
      }
    } catch (e) {
      setState(() => _isAutoMLRunning = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('AutoML failed: $e')),
        );
      }
    }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);

    if (pickedFile != null) {
      final file = File(pickedFile.path);
      final bytes = await file.readAsBytes();
      final image = await decodeImageFromList(bytes);

      setState(() {
        _imageFile = file;
        _uploadedImage = image;
        _imagePrediction = SimpleModelPredictor().predictImage(image);
        _currentExplanation = null;
        _saliencyMap = null;
      });
    }
  }

  Future<void> _explainPrediction() async {
    if (_uploadedImage == null) return;

    try {
      // Generate mock features
      final features = List.generate(10, (_) => _random.nextDouble() * 2 - 1);

      final explanation = await _explainableAI.explain(
        model: SimpleModelPredictor(),
        input: features,
        method: ExplanationMethod.lime,
        featureNames: List.generate(10, (i) => 'Feature ${i + 1}'),
      );

      setState(() => _currentExplanation = explanation);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Explanation generated')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Explanation failed: $e')),
        );
      }
    }
  }

  Future<void> _generateSaliency() async {
    if (_uploadedImage == null) return;

    try {
      final saliencyMap = await _explainableAI.generateSaliencyMap(
        model: SimpleModelPredictor(),
        image: _uploadedImage!,
      );

      setState(() => _saliencyMap = saliencyMap);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Saliency map generated')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Saliency generation failed: $e')),
        );
      }
    }
  }

  Future<void> _createExperiment() async {
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
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Experiment created')),
              );
            },
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }
}

// Custom painter for saliency overlay
class SaliencyPainter extends CustomPainter {
  final SaliencyMap saliencyMap;

  SaliencyPainter(this.saliencyMap);

  @override
  void paint(Canvas canvas, Size size) {
    final scaleX = size.width / saliencyMap.width;
    final scaleY = size.height / saliencyMap.height;

    for (var y = 0; y < saliencyMap.height; y++) {
      for (var x = 0; x < saliencyMap.width; x++) {
        final value = saliencyMap.values[y][x];
        final paint = Paint()
          ..color = Colors.red.withOpacity(value * 0.7)
          ..style = PaintingStyle.fill;

        canvas.drawRect(
          Rect.fromLTWH(
            x * scaleX,
            y * scaleY,
            scaleX,
            scaleY,
          ),
          paint,
        );
      }
    }
  }

  @override
  bool shouldRepaint(SaliencyPainter oldDelegate) => true;
}

// Data models
class TaskPerformance {
  final int taskId;
  final String taskName;
  final double accuracy;
  final DateTime timestamp;

  TaskPerformance({
    required this.taskId,
    required this.taskName,
    required this.accuracy,
    required this.timestamp,
  });
}

class ModelInfo {
  final String id;
  final String name;
  final String architecture;
  final double compressedSize;
  final double uncompressedSize;
  final int parameterCount;
  final double avgInferenceTime;
  final double minInferenceTime;
  final double maxInferenceTime;

  ModelInfo({
    required this.id,
    required this.name,
    required this.architecture,
    required this.compressedSize,
    required this.uncompressedSize,
    required this.parameterCount,
    required this.avgInferenceTime,
    required this.minInferenceTime,
    required this.maxInferenceTime,
  });
}

class Experiment {
  final String id;
  final String name;
  final ExperimentStatus status;
  final double? bestMetric;
  final Duration? runtime;
  final Map<String, dynamic> hyperparameters;
  final Map<String, List<double>> metrics;

  Experiment({
    required this.id,
    required this.name,
    required this.status,
    this.bestMetric,
    this.runtime,
    required this.hyperparameters,
    required this.metrics,
  });
}

enum ExperimentStatus { running, completed, failed, cancelled }
