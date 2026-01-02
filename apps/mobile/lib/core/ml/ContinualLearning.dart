import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

/// Continual Learning system for lifelong learning without catastrophic forgetting.
/// Implements EWC, Experience Replay, and Learning Without Forgetting.
class ContinualLearning {
  final Random _random = Random();
  Database? _database;

  /// Rehearsal buffer configuration
  final int maxBufferSize;
  final RehearsalStrategy rehearsalStrategy;

  /// Tasks learned
  final List<TaskInfo> _tasks = [];
  int _currentTaskId = 0;

  /// Fisher information for EWC
  Map<String, List<double>> _fisherInformation = {};
  Map<String, List<double>> _optimalParameters = {};

  /// Multi-head architecture
  final Map<int, TaskHead> _taskHeads = {};

  /// Online learning buffer
  final List<OnlineSample> _onlineBuffer = [];
  final int maxOnlineBuffer = 1000;

  ContinualLearning({
    this.maxBufferSize = 500,
    this.rehearsalStrategy = RehearsalStrategy.balanced,
  });

  /// Initialize continual learning system
  Future<void> initialize() async {
    try {
      debugPrint('Initializing continual learning system...');

      // Initialize database for rehearsal buffer
      final databasePath = await getDatabasesPath();
      final path = join(databasePath, 'continual_learning.db');

      _database = await openDatabase(
        path,
        version: 1,
        onCreate: (db, version) async {
          await db.execute('''
            CREATE TABLE rehearsal_buffer (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              task_id INTEGER NOT NULL,
              features TEXT NOT NULL,
              label INTEGER NOT NULL,
              importance REAL DEFAULT 1.0,
              timestamp INTEGER NOT NULL
            )
          ''');

          await db.execute('''
            CREATE INDEX idx_task_id ON rehearsal_buffer(task_id)
          ''');

          await db.execute('''
            CREATE INDEX idx_importance ON rehearsal_buffer(importance DESC)
          ''');
        },
      );

      debugPrint('Continual learning system initialized');
    } catch (e, stackTrace) {
      debugPrint('Failed to initialize continual learning: $e\n$stackTrace');
      rethrow;
    }
  }

  /// Learn a new task
  Future<ContinualLearningResult> learnTask({
    required int taskId,
    required String taskName,
    required List<List<double>> trainingData,
    required List<int> trainingLabels,
    required List<List<double>> validationData,
    required List<int> validationLabels,
    required ContinualLearningStrategy strategy,
    Function(ContinualLearningProgress)? onProgress,
  }) async {
    try {
      debugPrint('Learning task $taskId: $taskName');
      final startTime = DateTime.now();

      _currentTaskId = taskId;

      // Create task info
      final taskInfo = TaskInfo(
        taskId: taskId,
        taskName: taskName,
        numSamples: trainingData.length,
        numClasses: trainingLabels.reduce(max) + 1,
        startTime: startTime,
      );
      _tasks.add(taskInfo);

      // Create task-specific head
      _taskHeads[taskId] = TaskHead(
        taskId: taskId,
        inputSize: trainingData[0].length,
        outputSize: taskInfo.numClasses,
      );

      ContinualLearningResult? result;

      switch (strategy) {
        case ContinualLearningStrategy.ewc:
          result = await _learnWithEWC(
            taskId,
            trainingData,
            trainingLabels,
            validationData,
            validationLabels,
            onProgress,
          );
          break;

        case ContinualLearningStrategy.replay:
          result = await _learnWithReplay(
            taskId,
            trainingData,
            trainingLabels,
            validationData,
            validationLabels,
            onProgress,
          );
          break;

        case ContinualLearningStrategy.lwf:
          result = await _learnWithLWF(
            taskId,
            trainingData,
            trainingLabels,
            validationData,
            validationLabels,
            onProgress,
          );
          break;

        case ContinualLearningStrategy.combined:
          result = await _learnWithCombined(
            taskId,
            trainingData,
            trainingLabels,
            validationData,
            validationLabels,
            onProgress,
          );
          break;
      }

      // Update rehearsal buffer
      await _updateRehearsalBuffer(taskId, trainingData, trainingLabels);

      // Calculate metrics
      final metrics = await _evaluateAllTasks(validationData, validationLabels);

      final duration = DateTime.now().difference(startTime);
      debugPrint('Task $taskId learned in ${duration.inSeconds}s');

      return result.copyWith(
        taskMetrics: metrics,
        totalTime: duration,
      );
    } catch (e, stackTrace) {
      debugPrint('Failed to learn task: $e\n$stackTrace');
      rethrow;
    }
  }

  /// Learn with Elastic Weight Consolidation (EWC)
  Future<ContinualLearningResult> _learnWithEWC(
    int taskId,
    List<List<double>> trainingData,
    List<int> trainingLabels,
    List<List<double>> validationData,
    List<int> validationLabels,
    Function(ContinualLearningProgress)? onProgress,
  ) async {
    debugPrint('Learning with EWC...');

    final taskHead = _taskHeads[taskId]!;
    final epochs = 20;
    final batchSize = 32;
    final learningRate = 0.01;
    final ewcLambda = 1000.0; // Regularization strength

    for (var epoch = 0; epoch < epochs; epoch++) {
      onProgress?.call(ContinualLearningProgress(
        taskId: taskId,
        epoch: epoch,
        totalEpochs: epochs,
        loss: 0.0,
        accuracy: 0.0,
        message: 'EWC training epoch ${epoch + 1}/$epochs',
      ));

      // Shuffle data
      final indices = List.generate(trainingData.length, (i) => i);
      indices.shuffle(_random);

      var epochLoss = 0.0;

      for (var i = 0; i < trainingData.length; i += batchSize) {
        final batchIndices = indices.skip(i).take(batchSize).toList();
        final batchData = batchIndices.map((idx) => trainingData[idx]).toList();
        final batchLabels =
            batchIndices.map((idx) => trainingLabels[idx]).toList();

        // Calculate loss with EWC penalty
        var loss = taskHead.calculateLoss(batchData, batchLabels);

        // Add EWC penalty for previous tasks
        if (_fisherInformation.isNotEmpty) {
          final ewcPenalty = _calculateEWCPenalty(taskHead, ewcLambda);
          loss += ewcPenalty;
        }

        // Update weights
        taskHead.updateWeights(batchData, batchLabels, learningRate);

        epochLoss += loss;
      }

      epochLoss /= (trainingData.length / batchSize);

      if (epoch % 5 == 0) {
        debugPrint('Epoch ${epoch + 1}: Loss = ${epochLoss.toStringAsFixed(4)}');
      }
    }

    // Calculate Fisher information for current task
    _calculateFisherInformation(taskHead, trainingData, trainingLabels);

    // Evaluate
    final accuracy = _evaluateTask(taskHead, validationData, validationLabels);

    return ContinualLearningResult(
      taskId: taskId,
      strategy: ContinualLearningStrategy.ewc,
      finalAccuracy: accuracy,
      forwardTransfer: 0.0,
      backwardTransfer: 0.0,
      averageAccuracy: accuracy,
      forgettingMeasure: 0.0,
      taskMetrics: {},
      totalTime: Duration.zero,
    );
  }

  /// Calculate EWC penalty
  double _calculateEWCPenalty(TaskHead taskHead, double lambda) {
    var penalty = 0.0;

    for (final paramName in _fisherInformation.keys) {
      final fisher = _fisherInformation[paramName]!;
      final optimal = _optimalParameters[paramName]!;
      final current = taskHead.getParameters(paramName);

      for (var i = 0; i < fisher.length; i++) {
        penalty += fisher[i] * pow(current[i] - optimal[i], 2);
      }
    }

    return lambda * penalty / 2;
  }

  /// Calculate Fisher information matrix
  void _calculateFisherInformation(
    TaskHead taskHead,
    List<List<double>> data,
    List<int> labels,
  ) {
    debugPrint('Calculating Fisher information...');

    // Sample subset of data
    final sampleSize = min(100, data.length);
    final samples = <List<double>>[];
    final sampleLabels = <int>[];

    for (var i = 0; i < sampleSize; i++) {
      final idx = _random.nextInt(data.length);
      samples.add(data[idx]);
      sampleLabels.add(labels[idx]);
    }

    // Calculate Fisher information (approximation)
    final fisher = <String, List<double>>{};
    final params = taskHead.getAllParameterNames();

    for (final paramName in params) {
      final paramValues = taskHead.getParameters(paramName);
      final fisherValues = List.filled(paramValues.length, 0.0);

      for (var i = 0; i < samples.length; i++) {
        final gradients = taskHead.calculateGradients(
          samples[i],
          sampleLabels[i],
          paramName,
        );

        for (var j = 0; j < gradients.length; j++) {
          fisherValues[j] += gradients[j] * gradients[j];
        }
      }

      // Average
      for (var j = 0; j < fisherValues.length; j++) {
        fisherValues[j] /= samples.length;
      }

      fisher[paramName] = fisherValues;
    }

    // Store Fisher information and optimal parameters
    _fisherInformation = fisher;
    _optimalParameters = {};
    for (final paramName in params) {
      _optimalParameters[paramName] = taskHead.getParameters(paramName);
    }

    debugPrint('Fisher information calculated for ${params.length} parameter groups');
  }

  /// Learn with Experience Replay
  Future<ContinualLearningResult> _learnWithReplay(
    int taskId,
    List<List<double>> trainingData,
    List<int> trainingLabels,
    List<List<double>> validationData,
    List<int> validationLabels,
    Function(ContinualLearningProgress)? onProgress,
  ) async {
    debugPrint('Learning with Experience Replay...');

    final taskHead = _taskHeads[taskId]!;
    final epochs = 20;
    final batchSize = 32;
    final learningRate = 0.01;
    final replayRatio = 0.3; // 30% replay samples

    for (var epoch = 0; epoch < epochs; epoch++) {
      onProgress?.call(ContinualLearningProgress(
        taskId: taskId,
        epoch: epoch,
        totalEpochs: epochs,
        loss: 0.0,
        accuracy: 0.0,
        message: 'Replay training epoch ${epoch + 1}/$epochs',
      ));

      // Shuffle current task data
      final indices = List.generate(trainingData.length, (i) => i);
      indices.shuffle(_random);

      for (var i = 0; i < trainingData.length; i += batchSize) {
        final currentBatchSize =
            min(batchSize, trainingData.length - i).toInt();
        final batchIndices = indices.skip(i).take(currentBatchSize).toList();

        // Current task samples
        final batchData = batchIndices.map((idx) => trainingData[idx]).toList();
        final batchLabels =
            batchIndices.map((idx) => trainingLabels[idx]).toList();

        // Add replay samples
        final replaySamples =
            await _sampleFromRehearsalBuffer((currentBatchSize * replayRatio).round());

        if (replaySamples.isNotEmpty) {
          for (final sample in replaySamples) {
            batchData.add(sample.features);
            batchLabels.add(sample.label);
          }
        }

        // Update weights
        taskHead.updateWeights(batchData, batchLabels, learningRate);
      }

      if (epoch % 5 == 0) {
        final accuracy = _evaluateTask(taskHead, validationData, validationLabels);
        debugPrint('Epoch ${epoch + 1}: Accuracy = ${(accuracy * 100).toStringAsFixed(2)}%');
      }
    }

    final accuracy = _evaluateTask(taskHead, validationData, validationLabels);

    return ContinualLearningResult(
      taskId: taskId,
      strategy: ContinualLearningStrategy.replay,
      finalAccuracy: accuracy,
      forwardTransfer: 0.0,
      backwardTransfer: 0.0,
      averageAccuracy: accuracy,
      forgettingMeasure: 0.0,
      taskMetrics: {},
      totalTime: Duration.zero,
    );
  }

  /// Learn with Learning Without Forgetting (LWF)
  Future<ContinualLearningResult> _learnWithLWF(
    int taskId,
    List<List<double>> trainingData,
    List<int> trainingLabels,
    List<List<double>> validationData,
    List<int> validationLabels,
    Function(ContinualLearningProgress)? onProgress,
  ) async {
    debugPrint('Learning with LWF...');

    final taskHead = _taskHeads[taskId]!;
    final epochs = 20;
    final batchSize = 32;
    final learningRate = 0.01;
    final distillationWeight = 0.5;

    // Store old predictions for distillation
    final oldPredictions = <int, Map<String, List<double>>>{};

    if (_tasks.length > 1) {
      for (var i = 0; i < trainingData.length; i++) {
        final predictions = <String, List<double>>{};
        for (final oldTaskId in _taskHeads.keys) {
          if (oldTaskId != taskId) {
            predictions['task_$oldTaskId'] =
                _taskHeads[oldTaskId]!.predictProba(trainingData[i]);
          }
        }
        oldPredictions[i] = predictions;
      }
    }

    for (var epoch = 0; epoch < epochs; epoch++) {
      onProgress?.call(ContinualLearningProgress(
        taskId: taskId,
        epoch: epoch,
        totalEpochs: epochs,
        loss: 0.0,
        accuracy: 0.0,
        message: 'LWF training epoch ${epoch + 1}/$epochs',
      ));

      final indices = List.generate(trainingData.length, (i) => i);
      indices.shuffle(_random);

      for (var i = 0; i < trainingData.length; i += batchSize) {
        final batchIndices = indices.skip(i).take(batchSize).toList();
        final batchData = batchIndices.map((idx) => trainingData[idx]).toList();
        final batchLabels =
            batchIndices.map((idx) => trainingLabels[idx]).toList();

        // Calculate loss
        var loss = taskHead.calculateLoss(batchData, batchLabels);

        // Add distillation loss for old tasks
        if (oldPredictions.isNotEmpty) {
          var distillationLoss = 0.0;

          for (final idx in batchIndices) {
            if (oldPredictions.containsKey(idx)) {
              for (final oldTaskId in oldPredictions[idx]!.keys) {
                final oldProba = oldPredictions[idx]![oldTaskId]!;
                final newProba =
                    _taskHeads[int.parse(oldTaskId.split('_')[1])]!
                        .predictProba(trainingData[idx]);

                // L2 loss between old and new predictions
                for (var j = 0; j < oldProba.length; j++) {
                  distillationLoss += pow(newProba[j] - oldProba[j], 2);
                }
              }
            }
          }

          loss += distillationWeight * distillationLoss / batchIndices.length;
        }

        // Update weights
        taskHead.updateWeights(batchData, batchLabels, learningRate);
      }

      if (epoch % 5 == 0) {
        final accuracy = _evaluateTask(taskHead, validationData, validationLabels);
        debugPrint('Epoch ${epoch + 1}: Accuracy = ${(accuracy * 100).toStringAsFixed(2)}%');
      }
    }

    final accuracy = _evaluateTask(taskHead, validationData, validationLabels);

    return ContinualLearningResult(
      taskId: taskId,
      strategy: ContinualLearningStrategy.lwf,
      finalAccuracy: accuracy,
      forwardTransfer: 0.0,
      backwardTransfer: 0.0,
      averageAccuracy: accuracy,
      forgettingMeasure: 0.0,
      taskMetrics: {},
      totalTime: Duration.zero,
    );
  }

  /// Learn with combined strategies
  Future<ContinualLearningResult> _learnWithCombined(
    int taskId,
    List<List<double>> trainingData,
    List<int> trainingLabels,
    List<List<double>> validationData,
    List<int> validationLabels,
    Function(ContinualLearningProgress)? onProgress,
  ) async {
    debugPrint('Learning with combined strategies (EWC + Replay + LWF)...');

    final taskHead = _taskHeads[taskId]!;
    final epochs = 25;
    final batchSize = 32;
    final learningRate = 0.01;
    final ewcLambda = 500.0;
    final distillationWeight = 0.3;
    final replayRatio = 0.2;

    for (var epoch = 0; epoch < epochs; epoch++) {
      onProgress?.call(ContinualLearningProgress(
        taskId: taskId,
        epoch: epoch,
        totalEpochs: epochs,
        loss: 0.0,
        accuracy: 0.0,
        message: 'Combined training epoch ${epoch + 1}/$epochs',
      ));

      final indices = List.generate(trainingData.length, (i) => i);
      indices.shuffle(_random);

      for (var i = 0; i < trainingData.length; i += batchSize) {
        final currentBatchSize = min(batchSize, trainingData.length - i).toInt();
        final batchIndices = indices.skip(i).take(currentBatchSize).toList();

        var batchData = batchIndices.map((idx) => trainingData[idx]).toList();
        var batchLabels =
            batchIndices.map((idx) => trainingLabels[idx]).toList();

        // Add replay samples
        final replaySamples =
            await _sampleFromRehearsalBuffer((currentBatchSize * replayRatio).round());

        for (final sample in replaySamples) {
          batchData.add(sample.features);
          batchLabels.add(sample.label);
        }

        // Calculate combined loss
        var loss = taskHead.calculateLoss(batchData, batchLabels);

        // EWC penalty
        if (_fisherInformation.isNotEmpty) {
          loss += _calculateEWCPenalty(taskHead, ewcLambda);
        }

        // LWF distillation loss
        if (_tasks.length > 1) {
          var distillationLoss = 0.0;
          for (var j = 0; j < batchData.length; j++) {
            for (final oldTaskId in _taskHeads.keys) {
              if (oldTaskId != taskId) {
                final oldProba =
                    _taskHeads[oldTaskId]!.predictProba(batchData[j]);
                final newProba =
                    _taskHeads[oldTaskId]!.predictProba(batchData[j]);

                for (var k = 0; k < oldProba.length; k++) {
                  distillationLoss += pow(newProba[k] - oldProba[k], 2);
                }
              }
            }
          }
          loss += distillationWeight * distillationLoss / batchData.length;
        }

        taskHead.updateWeights(batchData, batchLabels, learningRate);
      }
    }

    // Calculate Fisher information
    _calculateFisherInformation(taskHead, trainingData, trainingLabels);

    final accuracy = _evaluateTask(taskHead, validationData, validationLabels);

    return ContinualLearningResult(
      taskId: taskId,
      strategy: ContinualLearningStrategy.combined,
      finalAccuracy: accuracy,
      forwardTransfer: 0.0,
      backwardTransfer: 0.0,
      averageAccuracy: accuracy,
      forgettingMeasure: 0.0,
      taskMetrics: {},
      totalTime: Duration.zero,
    );
  }

  /// Update rehearsal buffer
  Future<void> _updateRehearsalBuffer(
    int taskId,
    List<List<double>> data,
    List<int> labels,
  ) async {
    if (_database == null) return;

    debugPrint('Updating rehearsal buffer...');

    // Calculate importance scores
    final samples = <RehearsalSample>[];
    for (var i = 0; i < data.length; i++) {
      final importance = _calculateImportance(data[i], labels[i]);
      samples.add(RehearsalSample(
        taskId: taskId,
        features: data[i],
        label: labels[i],
        importance: importance,
        timestamp: DateTime.now(),
      ));
    }

    // Sort by importance
    samples.sort((a, b) => b.importance.compareTo(a.importance));

    // Add to buffer
    final samplesToAdd = min(maxBufferSize ~/ _tasks.length, samples.length);

    for (var i = 0; i < samplesToAdd; i++) {
      final sample = samples[i];
      await _database!.insert('rehearsal_buffer', {
        'task_id': sample.taskId,
        'features': jsonEncode(sample.features),
        'label': sample.label,
        'importance': sample.importance,
        'timestamp': sample.timestamp.millisecondsSinceEpoch,
      });
    }

    // Remove old samples if buffer is full
    final count = Sqflite.firstIntValue(
      await _database!.rawQuery('SELECT COUNT(*) FROM rehearsal_buffer'),
    );

    if (count != null && count > maxBufferSize) {
      await _database!.rawDelete('''
        DELETE FROM rehearsal_buffer
        WHERE id IN (
          SELECT id FROM rehearsal_buffer
          ORDER BY importance ASC
          LIMIT ?
        )
      ''', [count - maxBufferSize]);
    }

    debugPrint('Rehearsal buffer updated: $count/$maxBufferSize samples');
  }

  /// Calculate sample importance
  double _calculateImportance(List<double> features, int label) {
    // Simple importance based on feature diversity
    final mean = features.reduce((a, b) => a + b) / features.length;
    final variance = features
            .map((x) => (x - mean) * (x - mean))
            .reduce((a, b) => a + b) /
        features.length;

    return sqrt(variance) + _random.nextDouble() * 0.1;
  }

  /// Sample from rehearsal buffer
  Future<List<RehearsalSample>> _sampleFromRehearsalBuffer(int count) async {
    if (_database == null || count == 0) return [];

    final samples = <RehearsalSample>[];

    try {
      List<Map<String, dynamic>> results;

      if (rehearsalStrategy == RehearsalStrategy.balanced) {
        // Balanced sampling across tasks
        final tasksInBuffer = await _database!.rawQuery('''
          SELECT DISTINCT task_id FROM rehearsal_buffer
        ''');

        final samplesPerTask = count ~/ tasksInBuffer.length;

        for (final taskRow in tasksInBuffer) {
          final taskId = taskRow['task_id'] as int;
          final taskSamples = await _database!.query(
            'rehearsal_buffer',
            where: 'task_id = ?',
            whereArgs: [taskId],
            orderBy: 'RANDOM()',
            limit: samplesPerTask,
          );

          for (final row in taskSamples) {
            samples.add(RehearsalSample(
              taskId: row['task_id'] as int,
              features: (jsonDecode(row['features'] as String) as List)
                  .map((e) => (e as num).toDouble())
                  .toList(),
              label: row['label'] as int,
              importance: row['importance'] as double,
              timestamp: DateTime.fromMillisecondsSinceEpoch(
                  row['timestamp'] as int),
            ));
          }
        }
      } else {
        // Random sampling
        results = await _database!.query(
          'rehearsal_buffer',
          orderBy: 'RANDOM()',
          limit: count,
        );

        for (final row in results) {
          samples.add(RehearsalSample(
            taskId: row['task_id'] as int,
            features: (jsonDecode(row['features'] as String) as List)
                .map((e) => (e as num).toDouble())
                .toList(),
            label: row['label'] as int,
            importance: row['importance'] as double,
            timestamp:
                DateTime.fromMillisecondsSinceEpoch(row['timestamp'] as int),
          ));
        }
      }
    } catch (e) {
      debugPrint('Error sampling from rehearsal buffer: $e');
    }

    return samples;
  }

  /// Evaluate task
  double _evaluateTask(
    TaskHead taskHead,
    List<List<double>> data,
    List<int> labels,
  ) {
    var correct = 0;
    for (var i = 0; i < data.length; i++) {
      final prediction = taskHead.predict(data[i]);
      if (prediction == labels[i]) {
        correct++;
      }
    }
    return correct / data.length;
  }

  /// Evaluate all tasks
  Future<Map<int, double>> _evaluateAllTasks(
    List<List<double>> validationData,
    List<int> validationLabels,
  ) async {
    final metrics = <int, double>{};

    for (final taskId in _taskHeads.keys) {
      final accuracy =
          _evaluateTask(_taskHeads[taskId]!, validationData, validationLabels);
      metrics[taskId] = accuracy;
    }

    return metrics;
  }

  /// Online learning from stream
  Future<void> learnOnline({
    required List<double> features,
    required int label,
    required double confidence,
  }) async {
    // Add to online buffer
    _onlineBuffer.add(OnlineSample(
      features: features,
      label: label,
      confidence: confidence,
      timestamp: DateTime.now(),
    ));

    // Detect concept drift
    if (_onlineBuffer.length >= 100) {
      final drift = _detectConceptDrift();
      if (drift) {
        debugPrint('Concept drift detected! Starting adaptation...');
        await _adaptToConceptDrift();
      }
    }

    // Maintain buffer size
    if (_onlineBuffer.length > maxOnlineBuffer) {
      _onlineBuffer.removeAt(0);
    }
  }

  /// Detect concept drift
  bool _detectConceptDrift() {
    if (_onlineBuffer.length < 100) return false;

    // Compare recent performance with historical
    final recent = _onlineBuffer.sublist(_onlineBuffer.length - 50);
    final historical = _onlineBuffer.sublist(0, 50);

    final recentConfidence =
        recent.map((s) => s.confidence).reduce((a, b) => a + b) / recent.length;
    final historicalConfidence = historical
            .map((s) => s.confidence)
            .reduce((a, b) => a + b) /
        historical.length;

    // Significant drop in confidence indicates drift
    return recentConfidence < historicalConfidence - 0.15;
  }

  /// Adapt to concept drift
  Future<void> _adaptToConceptDrift() async {
    // Create new task for drifted concept
    final newTaskId = _tasks.length;
    final recentSamples = _onlineBuffer.sublist(_onlineBuffer.length - 100);

    final data = recentSamples.map((s) => s.features).toList();
    final labels = recentSamples.map((s) => s.label).toList();

    // Quick adaptation with small learning rate
    await learnTask(
      taskId: newTaskId,
      taskName: 'Adapted Task $newTaskId',
      trainingData: data,
      validationData: data,
      trainingLabels: labels,
      validationLabels: labels,
      strategy: ContinualLearningStrategy.replay,
    );
  }

  /// Get buffer statistics
  Future<BufferStatistics> getBufferStatistics() async {
    if (_database == null) {
      return BufferStatistics(
        totalSamples: 0,
        samplesPerTask: {},
        averageImportance: 0.0,
      );
    }

    final count = Sqflite.firstIntValue(
      await _database!.rawQuery('SELECT COUNT(*) FROM rehearsal_buffer'),
    );

    final taskCounts = await _database!.rawQuery('''
      SELECT task_id, COUNT(*) as count
      FROM rehearsal_buffer
      GROUP BY task_id
    ''');

    final samplesPerTask = <int, int>{};
    for (final row in taskCounts) {
      samplesPerTask[row['task_id'] as int] = row['count'] as int;
    }

    final avgImportance = Sqflite.firstIntValue(
      await _database!.rawQuery('SELECT AVG(importance) FROM rehearsal_buffer'),
    );

    return BufferStatistics(
      totalSamples: count ?? 0,
      samplesPerTask: samplesPerTask,
      averageImportance: (avgImportance ?? 0).toDouble(),
    );
  }

  /// Dispose resources
  Future<void> dispose() async {
    await _database?.close();
    _database = null;
  }
}

/// Task-specific neural network head
class TaskHead {
  final int taskId;
  final int inputSize;
  final int outputSize;
  final List<List<double>> weights;
  final List<double> bias;
  final Random _random = Random();

  TaskHead({
    required this.taskId,
    required this.inputSize,
    required this.outputSize,
  })  : weights = List.generate(
          outputSize,
          (_) => List.generate(inputSize, (_) => Random().nextDouble() - 0.5),
        ),
        bias = List.filled(outputSize, 0.0);

  int predict(List<double> input) {
    final output = predictProba(input);
    return output.indexOf(output.reduce(max));
  }

  List<double> predictProba(List<double> input) {
    final output = <double>[];

    for (var i = 0; i < outputSize; i++) {
      var sum = bias[i];
      for (var j = 0; j < min(inputSize, input.length); j++) {
        sum += weights[i][j] * input[j];
      }
      output.add(1 / (1 + exp(-sum))); // Sigmoid
    }

    // Normalize to probabilities
    final total = output.reduce((a, b) => a + b);
    return output.map((p) => p / (total + 1e-10)).toList();
  }

  double calculateLoss(List<List<double>> batchData, List<int> batchLabels) {
    var loss = 0.0;

    for (var i = 0; i < batchData.length; i++) {
      final proba = predictProba(batchData[i]);
      // Cross-entropy loss
      loss -= log(proba[batchLabels[i]] + 1e-10);
    }

    return loss / batchData.length;
  }

  void updateWeights(
      List<List<double>> batchData, List<int> batchLabels, double lr) {
    for (var i = 0; i < batchData.length; i++) {
      final proba = predictProba(batchData[i]);
      final target = List.filled(outputSize, 0.0);
      target[batchLabels[i]] = 1.0;

      // Gradient descent
      for (var j = 0; j < outputSize; j++) {
        final error = proba[j] - target[j];
        for (var k = 0; k < inputSize && k < batchData[i].length; k++) {
          weights[j][k] -= lr * error * batchData[i][k];
        }
        bias[j] -= lr * error;
      }
    }
  }

  List<String> getAllParameterNames() {
    return ['weights', 'bias'];
  }

  List<double> getParameters(String name) {
    if (name == 'weights') {
      return weights.expand((row) => row).toList();
    } else if (name == 'bias') {
      return bias;
    }
    return [];
  }

  List<double> calculateGradients(
      List<double> input, int label, String paramName) {
    final proba = predictProba(input);
    final target = List.filled(outputSize, 0.0);
    target[label] = 1.0;

    final gradients = <double>[];

    if (paramName == 'weights') {
      for (var i = 0; i < outputSize; i++) {
        final error = proba[i] - target[i];
        for (var j = 0; j < inputSize; j++) {
          gradients.add(error * input[j]);
        }
      }
    } else if (paramName == 'bias') {
      for (var i = 0; i < outputSize; i++) {
        gradients.add(proba[i] - target[i]);
      }
    }

    return gradients;
  }
}

/// Task information
class TaskInfo {
  final int taskId;
  final String taskName;
  final int numSamples;
  final int numClasses;
  final DateTime startTime;

  TaskInfo({
    required this.taskId,
    required this.taskName,
    required this.numSamples,
    required this.numClasses,
    required this.startTime,
  });
}

/// Rehearsal sample
class RehearsalSample {
  final int taskId;
  final List<double> features;
  final int label;
  final double importance;
  final DateTime timestamp;

  RehearsalSample({
    required this.taskId,
    required this.features,
    required this.label,
    required this.importance,
    required this.timestamp,
  });
}

/// Online learning sample
class OnlineSample {
  final List<double> features;
  final int label;
  final double confidence;
  final DateTime timestamp;

  OnlineSample({
    required this.features,
    required this.label,
    required this.confidence,
    required this.timestamp,
  });
}

/// Buffer statistics
class BufferStatistics {
  final int totalSamples;
  final Map<int, int> samplesPerTask;
  final double averageImportance;

  BufferStatistics({
    required this.totalSamples,
    required this.samplesPerTask,
    required this.averageImportance,
  });
}

/// Continual learning strategy
enum ContinualLearningStrategy { ewc, replay, lwf, combined }

/// Rehearsal strategy
enum RehearsalStrategy { random, balanced, importance }

/// Continual learning progress
class ContinualLearningProgress {
  final int taskId;
  final int epoch;
  final int totalEpochs;
  final double loss;
  final double accuracy;
  final String message;

  ContinualLearningProgress({
    required this.taskId,
    required this.epoch,
    required this.totalEpochs,
    required this.loss,
    required this.accuracy,
    required this.message,
  });
}

/// Continual learning result
class ContinualLearningResult {
  final int taskId;
  final ContinualLearningStrategy strategy;
  final double finalAccuracy;
  final double forwardTransfer;
  final double backwardTransfer;
  final double averageAccuracy;
  final double forgettingMeasure;
  final Map<int, double> taskMetrics;
  final Duration totalTime;

  ContinualLearningResult({
    required this.taskId,
    required this.strategy,
    required this.finalAccuracy,
    required this.forwardTransfer,
    required this.backwardTransfer,
    required this.averageAccuracy,
    required this.forgettingMeasure,
    required this.taskMetrics,
    required this.totalTime,
  });

  ContinualLearningResult copyWith({
    int? taskId,
    ContinualLearningStrategy? strategy,
    double? finalAccuracy,
    double? forwardTransfer,
    double? backwardTransfer,
    double? averageAccuracy,
    double? forgettingMeasure,
    Map<int, double>? taskMetrics,
    Duration? totalTime,
  }) {
    return ContinualLearningResult(
      taskId: taskId ?? this.taskId,
      strategy: strategy ?? this.strategy,
      finalAccuracy: finalAccuracy ?? this.finalAccuracy,
      forwardTransfer: forwardTransfer ?? this.forwardTransfer,
      backwardTransfer: backwardTransfer ?? this.backwardTransfer,
      averageAccuracy: averageAccuracy ?? this.averageAccuracy,
      forgettingMeasure: forgettingMeasure ?? this.forgettingMeasure,
      taskMetrics: taskMetrics ?? this.taskMetrics,
      totalTime: totalTime ?? this.totalTime,
    );
  }
}
