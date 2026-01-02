import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math' as math;
import 'dart:typed_data';
import 'package:battery_plus/battery_plus.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:crypto/crypto.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Privacy-preserving federated learning on mobile devices
class FederatedLearning {
  static final FederatedLearning _instance = FederatedLearning._internal();
  factory FederatedLearning() => _instance;
  FederatedLearning._internal();

  final Battery _battery = Battery();
  final Connectivity _connectivity = Connectivity();

  bool _isInitialized = false;
  bool _isTraining = false;
  String? _currentRound;
  Timer? _trainingTimer;

  // Hyperparameters
  double _learningRate = 0.01;
  int _batchSize = 32;
  int _localEpochs = 1;
  double _clipNorm = 1.0;
  double _epsilon = 1.0;
  double _delta = 1e-5;
  int _minDevicesForAggregation = 10;

  // Training state
  final Map<String, dynamic> _globalModel = {};
  final Map<String, dynamic> _localModel = {};
  final List<Map<String, dynamic>> _localGradients = [];
  final List<double> _trainingLosses = [];
  final Map<String, dynamic> _trainingConfig = {};

  // Analytics
  int _roundsCompleted = 0;
  int _gradientsContributed = 0;
  double _totalTrainingTimeMinutes = 0.0;
  double _globalAccuracy = 0.0;
  double _localAccuracy = 0.0;
  final List<TrainingRound> _trainingHistory = [];

  // Server configuration
  String _serverUrl = 'https://api.upcoach.com/federated';
  String _clientId = '';

  /// Initialize federated learning
  Future<void> initialize({
    String? serverUrl,
    String? clientId,
  }) async {
    if (_isInitialized) {
      debugPrint('FederatedLearning already initialized');
      return;
    }

    try {
      debugPrint('Initializing FederatedLearning...');

      if (serverUrl != null) _serverUrl = serverUrl;
      if (clientId != null) _clientId = clientId;

      // Generate client ID if not provided
      if (_clientId.isEmpty) {
        _clientId = await _generateClientId();
      }

      // Load saved state
      await _loadState();

      _isInitialized = true;
      debugPrint('FederatedLearning initialized with client ID: $_clientId');
    } catch (e) {
      debugPrint('Failed to initialize FederatedLearning: $e');
      rethrow;
    }
  }

  /// Generate unique client ID
  Future<String> _generateClientId() async {
    final prefs = await SharedPreferences.getInstance();
    var clientId = prefs.getString('federated_client_id');

    if (clientId == null) {
      clientId = 'client_${DateTime.now().millisecondsSinceEpoch}_${math.Random().nextInt(999999)}';
      await prefs.setString('federated_client_id', clientId);
    }

    return clientId;
  }

  /// Load saved training state
  Future<void> _loadState() async {
    try {
      final prefs = await SharedPreferences.getInstance();

      _roundsCompleted = prefs.getInt('fl_rounds_completed') ?? 0;
      _gradientsContributed = prefs.getInt('fl_gradients_contributed') ?? 0;
      _totalTrainingTimeMinutes = prefs.getDouble('fl_total_training_time') ?? 0.0;
      _globalAccuracy = prefs.getDouble('fl_global_accuracy') ?? 0.0;
      _localAccuracy = prefs.getDouble('fl_local_accuracy') ?? 0.0;

      // Load training config
      final configJson = prefs.getString('fl_training_config');
      if (configJson != null) {
        _trainingConfig.addAll(json.decode(configJson) as Map<String, dynamic>);
      }

      debugPrint('Loaded federated learning state: $_roundsCompleted rounds completed');
    } catch (e) {
      debugPrint('Failed to load state: $e');
    }
  }

  /// Save training state
  Future<void> _saveState() async {
    try {
      final prefs = await SharedPreferences.getInstance();

      await prefs.setInt('fl_rounds_completed', _roundsCompleted);
      await prefs.setInt('fl_gradients_contributed', _gradientsContributed);
      await prefs.setDouble('fl_total_training_time', _totalTrainingTimeMinutes);
      await prefs.setDouble('fl_global_accuracy', _globalAccuracy);
      await prefs.setDouble('fl_local_accuracy', _localAccuracy);
      await prefs.setString('fl_training_config', json.encode(_trainingConfig));

      debugPrint('Saved federated learning state');
    } catch (e) {
      debugPrint('Failed to save state: $e');
    }
  }

  /// Start federated training
  Future<void> startTraining({
    required String modelId,
    required List<TrainingExample> localData,
    int maxRounds = 10,
    Duration roundInterval = const Duration(hours: 1),
  }) async {
    if (!_isInitialized) {
      throw Exception('FederatedLearning not initialized');
    }

    if (_isTraining) {
      debugPrint('Training already in progress');
      return;
    }

    // Check resource constraints
    if (!await _canTrain()) {
      debugPrint('Cannot train due to resource constraints');
      return;
    }

    _isTraining = true;
    debugPrint('Starting federated training for model: $modelId');

    try {
      // Register with server
      await _registerClient(modelId);

      // Start training rounds
      for (var round = 0; round < maxRounds; round++) {
        if (!_isTraining) break;

        debugPrint('Starting training round ${round + 1}/$maxRounds');
        _currentRound = 'round_$round';

        // Download global model
        await _downloadGlobalModel(modelId);

        // Local training
        final trainingResult = await _trainLocally(localData);

        // Upload gradients with differential privacy
        await _uploadGradients(modelId, trainingResult.gradients);

        // Update analytics
        _roundsCompleted++;
        _gradientsContributed++;
        _totalTrainingTimeMinutes += trainingResult.trainingTimeMinutes;
        _localAccuracy = trainingResult.accuracy;

        // Record training round
        _trainingHistory.add(TrainingRound(
          roundNumber: round + 1,
          loss: trainingResult.loss,
          accuracy: trainingResult.accuracy,
          trainingTime: trainingResult.trainingTimeMinutes,
          timestamp: DateTime.now(),
        ));

        // Save state
        await _saveState();

        debugPrint('Round ${round + 1} completed. Loss: ${trainingResult.loss.toStringAsFixed(4)}, Accuracy: ${trainingResult.accuracy.toStringAsFixed(4)}');

        // Wait for next round
        if (round < maxRounds - 1) {
          await Future.delayed(roundInterval);
        }
      }

      debugPrint('Federated training completed');
    } catch (e) {
      debugPrint('Training failed: $e');
      rethrow;
    } finally {
      _isTraining = false;
      _currentRound = null;
    }
  }

  /// Pause training
  void pauseTraining() {
    if (_isTraining) {
      _isTraining = false;
      _trainingTimer?.cancel();
      debugPrint('Training paused');
    }
  }

  /// Stop training
  void stopTraining() {
    if (_isTraining) {
      _isTraining = false;
      _trainingTimer?.cancel();
      _currentRound = null;
      debugPrint('Training stopped');
    }
  }

  /// Check if device can train
  Future<bool> _canTrain() async {
    try {
      // Check battery level
      final batteryLevel = await _battery.batteryLevel;
      if (batteryLevel < 50) {
        debugPrint('Battery level too low: $batteryLevel%');
        return false;
      }

      // Check if charging
      final batteryState = await _battery.batteryState;
      if (batteryState != BatteryState.charging && batteryState != BatteryState.full) {
        debugPrint('Device not charging');
        return false;
      }

      // Check network connectivity
      final connectivityResult = await _connectivity.checkConnectivity();
      if (connectivityResult != ConnectivityResult.wifi) {
        debugPrint('Not connected to WiFi');
        return false;
      }

      // Check available storage
      final directory = await getApplicationDocumentsDirectory();
      final stat = await directory.stat();
      // Simplified storage check (in production, use proper storage APIs)

      return true;
    } catch (e) {
      debugPrint('Error checking training constraints: $e');
      return false;
    }
  }

  /// Register client with server
  Future<void> _registerClient(String modelId) async {
    try {
      debugPrint('Registering client with server...');

      final response = await http.post(
        Uri.parse('$_serverUrl/register'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'client_id': _clientId,
          'model_id': modelId,
          'timestamp': DateTime.now().toIso8601String(),
        }),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        _trainingConfig.addAll(data['config'] ?? {});
        debugPrint('Client registered successfully');
      } else {
        throw Exception('Registration failed: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Failed to register client: $e');
      // Continue with default config
    }
  }

  /// Download global model from server
  Future<void> _downloadGlobalModel(String modelId) async {
    try {
      debugPrint('Downloading global model...');

      final response = await http.get(
        Uri.parse('$_serverUrl/models/$modelId/global'),
        headers: {'X-Client-ID': _clientId},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        _globalModel.clear();
        _globalModel.addAll(data['weights'] ?? {});
        _globalAccuracy = data['accuracy'] ?? 0.0;

        // Copy to local model for training
        _localModel.clear();
        _localModel.addAll(_globalModel);

        debugPrint('Global model downloaded. Accuracy: $_globalAccuracy');
      } else {
        throw Exception('Download failed: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Failed to download global model: $e');

      // Initialize with random weights if download fails
      if (_globalModel.isEmpty) {
        _initializeRandomModel();
      }
    }
  }

  /// Initialize model with random weights
  void _initializeRandomModel() {
    debugPrint('Initializing random model weights');

    final random = math.Random();

    // Simple 2-layer neural network weights
    _globalModel['layer1_weights'] = List.generate(128, (_) => List.generate(64, (_) => random.nextDouble() * 0.1 - 0.05));
    _globalModel['layer1_bias'] = List.generate(64, (_) => 0.0);
    _globalModel['layer2_weights'] = List.generate(64, (_) => List.generate(10, (_) => random.nextDouble() * 0.1 - 0.05));
    _globalModel['layer2_bias'] = List.generate(10, (_) => 0.0);

    _localModel.clear();
    _localModel.addAll(_globalModel);
  }

  /// Train locally on device data
  Future<LocalTrainingResult> _trainLocally(List<TrainingExample> localData) async {
    debugPrint('Starting local training with ${localData.length} examples');

    final stopwatch = Stopwatch()..start();
    final losses = <double>[];
    var correctPredictions = 0;

    try {
      // Mini-batch SGD
      final numBatches = (localData.length / _batchSize).ceil();

      for (var epoch = 0; epoch < _localEpochs; epoch++) {
        // Shuffle data
        final shuffled = List<TrainingExample>.from(localData)..shuffle();

        for (var batchIdx = 0; batchIdx < numBatches; batchIdx++) {
          final start = batchIdx * _batchSize;
          final end = math.min(start + _batchSize, shuffled.length);
          final batch = shuffled.sublist(start, end);

          // Forward pass and compute gradients
          final batchGradients = <String, dynamic>{};
          var batchLoss = 0.0;

          for (final example in batch) {
            final result = _forwardPass(example.features);
            final loss = _computeLoss(result.output, example.label);
            batchLoss += loss;

            // Backward pass
            final gradients = _backwardPass(example.features, result.hidden, example.label);

            // Accumulate gradients
            _accumulateGradients(batchGradients, gradients);

            // Check prediction
            final prediction = _argmax(result.output);
            if (prediction == example.label) {
              correctPredictions++;
            }
          }

          // Average batch loss
          batchLoss /= batch.length;
          losses.add(batchLoss);

          // Average gradients
          _averageGradients(batchGradients, batch.length);

          // Clip gradients
          _clipGradients(batchGradients, _clipNorm);

          // Update local model
          _updateModel(batchGradients, _learningRate);
        }

        debugPrint('Epoch ${epoch + 1}/$_localEpochs completed');
      }

      stopwatch.stop();

      // Compute final gradients (difference from global model)
      final finalGradients = _computeModelDifference();

      // Apply differential privacy
      _applyDifferentialPrivacy(finalGradients);

      final averageLoss = losses.isEmpty ? 0.0 : losses.reduce((a, b) => a + b) / losses.length;
      final accuracy = localData.isNotEmpty ? correctPredictions / localData.length : 0.0;
      final trainingTimeMinutes = stopwatch.elapsedMilliseconds / 60000.0;

      debugPrint('Local training completed in ${trainingTimeMinutes.toStringAsFixed(2)} minutes');
      debugPrint('Average loss: ${averageLoss.toStringAsFixed(4)}, Accuracy: ${accuracy.toStringAsFixed(4)}');

      return LocalTrainingResult(
        gradients: finalGradients,
        loss: averageLoss,
        accuracy: accuracy,
        trainingTimeMinutes: trainingTimeMinutes,
      );
    } catch (e) {
      debugPrint('Local training failed: $e');
      rethrow;
    }
  }

  /// Forward pass through the model
  ForwardPassResult _forwardPass(List<double> features) {
    // Layer 1
    final layer1Weights = _localModel['layer1_weights'] as List<dynamic>;
    final layer1Bias = _localModel['layer1_bias'] as List<dynamic>;

    final hidden = List<double>.filled(layer1Bias.length, 0.0);
    for (var i = 0; i < hidden.length; i++) {
      var sum = layer1Bias[i] as double;
      for (var j = 0; j < features.length; j++) {
        sum += features[j] * (layer1Weights[j][i] as double);
      }
      hidden[i] = _relu(sum);
    }

    // Layer 2
    final layer2Weights = _localModel['layer2_weights'] as List<dynamic>;
    final layer2Bias = _localModel['layer2_bias'] as List<dynamic>;

    final output = List<double>.filled(layer2Bias.length, 0.0);
    for (var i = 0; i < output.length; i++) {
      var sum = layer2Bias[i] as double;
      for (var j = 0; j < hidden.length; j++) {
        sum += hidden[j] * (layer2Weights[j][i] as double);
      }
      output[i] = sum;
    }

    // Apply softmax
    final softmaxOutput = _softmax(output);

    return ForwardPassResult(hidden: hidden, output: softmaxOutput);
  }

  /// Compute loss (cross-entropy)
  double _computeLoss(List<double> output, int label) {
    final epsilon = 1e-7;
    return -math.log(output[label] + epsilon);
  }

  /// Backward pass to compute gradients
  Map<String, dynamic> _backwardPass(
    List<double> features,
    List<double> hidden,
    int label,
  ) {
    final gradients = <String, dynamic>{};

    // Output layer gradients
    final layer2Weights = _localModel['layer2_weights'] as List<dynamic>;
    final layer2Bias = _localModel['layer2_bias'] as List<dynamic>;

    final outputGrad = List<double>.filled(layer2Bias.length, 0.0);
    for (var i = 0; i < outputGrad.length; i++) {
      outputGrad[i] = i == label ? -1.0 : 0.0; // Simplified gradient
    }

    // Layer 2 weight gradients
    final layer2WeightGrad = List.generate(
      hidden.length,
      (i) => List.generate(outputGrad.length, (j) => hidden[i] * outputGrad[j]),
    );

    gradients['layer2_weights'] = layer2WeightGrad;
    gradients['layer2_bias'] = outputGrad;

    // Hidden layer gradients
    final hiddenGrad = List<double>.filled(hidden.length, 0.0);
    for (var i = 0; i < hidden.length; i++) {
      var grad = 0.0;
      for (var j = 0; j < outputGrad.length; j++) {
        grad += outputGrad[j] * (layer2Weights[i][j] as double);
      }
      hiddenGrad[i] = hidden[i] > 0 ? grad : 0.0; // ReLU derivative
    }

    // Layer 1 weight gradients
    final layer1WeightGrad = List.generate(
      features.length,
      (i) => List.generate(hiddenGrad.length, (j) => features[i] * hiddenGrad[j]),
    );

    gradients['layer1_weights'] = layer1WeightGrad;
    gradients['layer1_bias'] = hiddenGrad;

    return gradients;
  }

  /// Accumulate gradients from batch
  void _accumulateGradients(Map<String, dynamic> accumulated, Map<String, dynamic> gradients) {
    for (final key in gradients.keys) {
      if (!accumulated.containsKey(key)) {
        accumulated[key] = _copyGradient(gradients[key]);
      } else {
        _addGradients(accumulated[key], gradients[key]);
      }
    }
  }

  /// Copy gradient
  dynamic _copyGradient(dynamic gradient) {
    if (gradient is List) {
      if (gradient.isNotEmpty && gradient[0] is List) {
        return gradient.map((row) => List<double>.from(row as List)).toList();
      } else {
        return List<double>.from(gradient as List);
      }
    }
    return gradient;
  }

  /// Add gradients
  void _addGradients(dynamic target, dynamic source) {
    if (target is List && source is List) {
      if (target.isNotEmpty && target[0] is List) {
        for (var i = 0; i < target.length; i++) {
          for (var j = 0; j < (target[i] as List).length; j++) {
            target[i][j] += source[i][j];
          }
        }
      } else {
        for (var i = 0; i < target.length; i++) {
          target[i] += source[i];
        }
      }
    }
  }

  /// Average gradients
  void _averageGradients(Map<String, dynamic> gradients, int count) {
    for (final key in gradients.keys) {
      _scaleGradient(gradients[key], 1.0 / count);
    }
  }

  /// Scale gradient
  void _scaleGradient(dynamic gradient, double scale) {
    if (gradient is List) {
      if (gradient.isNotEmpty && gradient[0] is List) {
        for (var i = 0; i < gradient.length; i++) {
          for (var j = 0; j < (gradient[i] as List).length; j++) {
            gradient[i][j] *= scale;
          }
        }
      } else {
        for (var i = 0; i < gradient.length; i++) {
          gradient[i] *= scale;
        }
      }
    }
  }

  /// Clip gradients by norm
  void _clipGradients(Map<String, dynamic> gradients, double clipNorm) {
    var totalNorm = 0.0;

    // Calculate total norm
    for (final value in gradients.values) {
      totalNorm += _gradientNorm(value);
    }

    totalNorm = math.sqrt(totalNorm);

    // Clip if needed
    if (totalNorm > clipNorm) {
      final scale = clipNorm / totalNorm;
      for (final key in gradients.keys) {
        _scaleGradient(gradients[key], scale);
      }
      debugPrint('Gradients clipped: norm $totalNorm -> $clipNorm');
    }
  }

  /// Calculate gradient norm
  double _gradientNorm(dynamic gradient) {
    var norm = 0.0;

    if (gradient is List) {
      if (gradient.isNotEmpty && gradient[0] is List) {
        for (var i = 0; i < gradient.length; i++) {
          for (var j = 0; j < (gradient[i] as List).length; j++) {
            final value = gradient[i][j] as double;
            norm += value * value;
          }
        }
      } else {
        for (var i = 0; i < gradient.length; i++) {
          final value = gradient[i] as double;
          norm += value * value;
        }
      }
    }

    return norm;
  }

  /// Update local model with gradients
  void _updateModel(Map<String, dynamic> gradients, double learningRate) {
    for (final key in gradients.keys) {
      final modelParam = _localModel[key];
      final gradient = gradients[key];

      _updateParameter(modelParam, gradient, learningRate);
    }
  }

  /// Update parameter
  void _updateParameter(dynamic param, dynamic gradient, double learningRate) {
    if (param is List && gradient is List) {
      if (param.isNotEmpty && param[0] is List) {
        for (var i = 0; i < param.length; i++) {
          for (var j = 0; j < (param[i] as List).length; j++) {
            param[i][j] -= learningRate * gradient[i][j];
          }
        }
      } else {
        for (var i = 0; i < param.length; i++) {
          param[i] -= learningRate * gradient[i];
        }
      }
    }
  }

  /// Compute model difference (local - global)
  Map<String, dynamic> _computeModelDifference() {
    final difference = <String, dynamic>{};

    for (final key in _localModel.keys) {
      final localParam = _localModel[key];
      final globalParam = _globalModel[key];

      difference[key] = _subtractParameters(localParam, globalParam);
    }

    return difference;
  }

  /// Subtract parameters
  dynamic _subtractParameters(dynamic local, dynamic global) {
    if (local is List && global is List) {
      if (local.isNotEmpty && local[0] is List) {
        return List.generate(
          local.length,
          (i) => List.generate(
            (local[i] as List).length,
            (j) => local[i][j] - global[i][j],
          ),
        );
      } else {
        return List.generate(local.length, (i) => local[i] - global[i]);
      }
    }
    return local;
  }

  /// Apply differential privacy to gradients
  void _applyDifferentialPrivacy(Map<String, dynamic> gradients) {
    debugPrint('Applying differential privacy (epsilon=$_epsilon, delta=$_delta)');

    // Calculate noise scale: sigma = clip_norm * sqrt(2 * ln(1.25/delta)) / epsilon
    final sigma = _clipNorm * math.sqrt(2 * math.log(1.25 / _delta)) / _epsilon;

    final random = math.Random();

    // Add Gaussian noise to gradients
    for (final key in gradients.keys) {
      _addGaussianNoise(gradients[key], sigma, random);
    }

    debugPrint('Differential privacy applied with noise scale: ${sigma.toStringAsFixed(4)}');
  }

  /// Add Gaussian noise
  void _addGaussianNoise(dynamic gradient, double sigma, math.Random random) {
    if (gradient is List) {
      if (gradient.isNotEmpty && gradient[0] is List) {
        for (var i = 0; i < gradient.length; i++) {
          for (var j = 0; j < (gradient[i] as List).length; j++) {
            gradient[i][j] += _gaussianNoise(sigma, random);
          }
        }
      } else {
        for (var i = 0; i < gradient.length; i++) {
          gradient[i] += _gaussianNoise(sigma, random);
        }
      }
    }
  }

  /// Generate Gaussian noise (Box-Muller transform)
  double _gaussianNoise(double sigma, math.Random random) {
    final u1 = random.nextDouble();
    final u2 = random.nextDouble();
    final z0 = math.sqrt(-2.0 * math.log(u1)) * math.cos(2.0 * math.pi * u2);
    return z0 * sigma;
  }

  /// Upload gradients to server
  Future<void> _uploadGradients(String modelId, Map<String, dynamic> gradients) async {
    try {
      debugPrint('Uploading gradients to server...');

      // Encrypt gradients (simplified - in production use proper encryption)
      final encryptedGradients = _encryptGradients(gradients);

      final response = await http.post(
        Uri.parse('$_serverUrl/models/$modelId/gradients'),
        headers: {
          'Content-Type': 'application/json',
          'X-Client-ID': _clientId,
        },
        body: json.encode({
          'gradients': encryptedGradients,
          'round': _currentRound,
          'timestamp': DateTime.now().toIso8601String(),
        }),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        _globalAccuracy = data['global_accuracy'] ?? _globalAccuracy;
        debugPrint('Gradients uploaded successfully. Global accuracy: $_globalAccuracy');
      } else {
        throw Exception('Upload failed: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Failed to upload gradients: $e');
      // Continue training even if upload fails
    }
  }

  /// Encrypt gradients for secure aggregation
  Map<String, dynamic> _encryptGradients(Map<String, dynamic> gradients) {
    // Simplified encryption (in production, use proper secure aggregation)
    final encrypted = <String, dynamic>{};

    for (final key in gradients.keys) {
      encrypted[key] = _encryptValue(gradients[key]);
    }

    return encrypted;
  }

  /// Encrypt value
  dynamic _encryptValue(dynamic value) {
    // Simplified: just return the value (in production, use proper encryption)
    return value;
  }

  /// Activation functions
  double _relu(double x) => x > 0 ? x : 0.0;

  List<double> _softmax(List<double> logits) {
    final max = logits.reduce((a, b) => a > b ? a : b);
    final exp = logits.map((x) => math.exp(x - max)).toList();
    final sum = exp.reduce((a, b) => a + b);
    return exp.map((x) => x / sum).toList();
  }

  int _argmax(List<double> values) {
    var maxIndex = 0;
    var maxValue = values[0];

    for (var i = 1; i < values.length; i++) {
      if (values[i] > maxValue) {
        maxValue = values[i];
        maxIndex = i;
      }
    }

    return maxIndex;
  }

  /// Get training status
  TrainingStatus getStatus() {
    return TrainingStatus(
      isTraining: _isTraining,
      currentRound: _currentRound,
      roundsCompleted: _roundsCompleted,
      gradientsContributed: _gradientsContributed,
      totalTrainingTimeMinutes: _totalTrainingTimeMinutes,
      globalAccuracy: _globalAccuracy,
      localAccuracy: _localAccuracy,
      trainingHistory: List.unmodifiable(_trainingHistory),
    );
  }

  /// Get privacy settings
  PrivacySettings getPrivacySettings() {
    return PrivacySettings(
      epsilon: _epsilon,
      delta: _delta,
      clipNorm: _clipNorm,
      minDevicesForAggregation: _minDevicesForAggregation,
    );
  }

  /// Update privacy settings
  void updatePrivacySettings({
    double? epsilon,
    double? delta,
    double? clipNorm,
    int? minDevicesForAggregation,
  }) {
    if (epsilon != null) _epsilon = epsilon;
    if (delta != null) _delta = delta;
    if (clipNorm != null) _clipNorm = clipNorm;
    if (minDevicesForAggregation != null) {
      _minDevicesForAggregation = minDevicesForAggregation;
    }

    debugPrint('Privacy settings updated: epsilon=$_epsilon, delta=$_delta, clipNorm=$_clipNorm');
  }

  /// Update hyperparameters
  void updateHyperparameters({
    double? learningRate,
    int? batchSize,
    int? localEpochs,
  }) {
    if (learningRate != null) _learningRate = learningRate;
    if (batchSize != null) _batchSize = batchSize;
    if (localEpochs != null) _localEpochs = localEpochs;

    debugPrint('Hyperparameters updated: lr=$_learningRate, batch=$_batchSize, epochs=$_localEpochs');
  }

  /// Dispose resources
  void dispose() {
    _trainingTimer?.cancel();
    _isTraining = false;
    _isInitialized = false;
    debugPrint('FederatedLearning disposed');
  }
}

/// Training example
class TrainingExample {
  final List<double> features;
  final int label;

  TrainingExample({
    required this.features,
    required this.label,
  });
}

/// Forward pass result
class ForwardPassResult {
  final List<double> hidden;
  final List<double> output;

  ForwardPassResult({
    required this.hidden,
    required this.output,
  });
}

/// Local training result
class LocalTrainingResult {
  final Map<String, dynamic> gradients;
  final double loss;
  final double accuracy;
  final double trainingTimeMinutes;

  LocalTrainingResult({
    required this.gradients,
    required this.loss,
    required this.accuracy,
    required this.trainingTimeMinutes,
  });
}

/// Training round
class TrainingRound {
  final int roundNumber;
  final double loss;
  final double accuracy;
  final double trainingTime;
  final DateTime timestamp;

  TrainingRound({
    required this.roundNumber,
    required this.loss,
    required this.accuracy,
    required this.trainingTime,
    required this.timestamp,
  });
}

/// Training status
class TrainingStatus {
  final bool isTraining;
  final String? currentRound;
  final int roundsCompleted;
  final int gradientsContributed;
  final double totalTrainingTimeMinutes;
  final double globalAccuracy;
  final double localAccuracy;
  final List<TrainingRound> trainingHistory;

  TrainingStatus({
    required this.isTraining,
    required this.currentRound,
    required this.roundsCompleted,
    required this.gradientsContributed,
    required this.totalTrainingTimeMinutes,
    required this.globalAccuracy,
    required this.localAccuracy,
    required this.trainingHistory,
  });

  double get participationRate {
    // Simplified: assume 100 total rounds
    return roundsCompleted / 100.0;
  }
}

/// Privacy settings
class PrivacySettings {
  final double epsilon;
  final double delta;
  final double clipNorm;
  final int minDevicesForAggregation;

  PrivacySettings({
    required this.epsilon,
    required this.delta,
    required this.clipNorm,
    required this.minDevicesForAggregation,
  });
}
