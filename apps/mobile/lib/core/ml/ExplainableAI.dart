import 'dart:async';
import 'dart:math';
import 'dart:ui' as ui;
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

/// Explainable AI system for model interpretability.
/// Implements LIME, SHAP, saliency maps, and counterfactual explanations.
class ExplainableAI {
  final Random _random = Random();

  /// Generate explanation for a prediction
  Future<Explanation> explain({
    required ModelPredictor model,
    required List<double> input,
    required ExplanationMethod method,
    List<String>? featureNames,
    int? numSamples,
  }) async {
    try {
      debugPrint('Generating ${method.name} explanation...');

      switch (method) {
        case ExplanationMethod.lime:
          return await _explainWithLIME(
            model,
            input,
            featureNames ?? _generateFeatureNames(input.length),
            numSamples ?? 1000,
          );

        case ExplanationMethod.shap:
          return await _explainWithSHAP(
            model,
            input,
            featureNames ?? _generateFeatureNames(input.length),
            numSamples ?? 100,
          );

        case ExplanationMethod.permutation:
          return await _explainWithPermutation(
            model,
            input,
            featureNames ?? _generateFeatureNames(input.length),
          );

        case ExplanationMethod.gradients:
          return await _explainWithGradients(
            model,
            input,
            featureNames ?? _generateFeatureNames(input.length),
          );
      }
    } catch (e, stackTrace) {
      debugPrint('Explanation failed: $e\n$stackTrace');
      rethrow;
    }
  }

  /// LIME explanation (Local Interpretable Model-agnostic Explanations)
  Future<Explanation> _explainWithLIME(
    ModelPredictor model,
    List<double> input,
    List<String> featureNames,
    int numSamples,
  ) async {
    debugPrint('Generating LIME explanation with $numSamples samples...');

    final prediction = model.predict(input);
    final predictedClass = prediction.predictedClass;
    final confidence = prediction.confidence;

    // Generate perturbations
    final perturbations = <List<double>>[];
    final predictions = <int>[];
    final distances = <double>[];

    for (var i = 0; i < numSamples; i++) {
      final perturbed = _perturbInput(input);
      perturbations.add(perturbed);

      final pred = model.predict(perturbed);
      predictions.add(pred.predictedClass);

      // Calculate distance
      final distance = _euclideanDistance(input, perturbed);
      distances.add(distance);
    }

    // Calculate weights (exponential kernel)
    final weights = distances.map((d) => exp(-d * d / 0.5)).toList();

    // Fit linear model
    final featureImportances = _fitWeightedLinearModel(
      perturbations,
      predictions,
      weights,
      predictedClass,
    );

    // Create feature importance map
    final importanceMap = <String, double>{};
    for (var i = 0; i < featureNames.length; i++) {
      importanceMap[featureNames[i]] = featureImportances[i];
    }

    // Sort by absolute importance
    final sortedFeatures = importanceMap.entries.toList()
      ..sort((a, b) => b.value.abs().compareTo(a.value.abs()));

    // Generate natural language explanation
    final explanation = _generateNaturalLanguageExplanation(
      predictedClass: predictedClass,
      confidence: confidence,
      featureImportances: sortedFeatures.take(5).toList(),
      method: 'LIME',
    );

    return Explanation(
      method: ExplanationMethod.lime,
      predictedClass: predictedClass,
      confidence: confidence,
      featureImportances: importanceMap,
      naturalLanguage: explanation,
      topFeatures: sortedFeatures.take(5).map((e) => e.key).toList(),
    );
  }

  /// SHAP explanation (SHapley Additive exPlanations)
  Future<Explanation> _explainWithSHAP(
    ModelPredictor model,
    List<double> input,
    List<String> featureNames,
    int numSamples,
  ) async {
    debugPrint('Generating SHAP explanation with $numSamples samples...');

    final prediction = model.predict(input);
    final predictedClass = prediction.predictedClass;
    final confidence = prediction.confidence;

    // Permutation-based SHAP approximation
    final shapValues = <double>[];

    for (var i = 0; i < input.length; i++) {
      var contribution = 0.0;

      for (var sample = 0; sample < numSamples; sample++) {
        // Create two inputs: with and without feature i
        final withFeature = List<double>.from(input);
        final withoutFeature = List<double>.from(input);

        // Randomize feature i
        withoutFeature[i] = _random.nextDouble() * 2 - 1;

        final predWith = model.predict(withFeature);
        final predWithout = model.predict(withoutFeature);

        // Contribution is difference in predictions
        contribution += (predWith.probabilities[predictedClass] -
            predWithout.probabilities[predictedClass]);
      }

      shapValues.add(contribution / numSamples);
    }

    // Create feature importance map
    final importanceMap = <String, double>{};
    for (var i = 0; i < featureNames.length; i++) {
      importanceMap[featureNames[i]] = shapValues[i];
    }

    // Sort by absolute importance
    final sortedFeatures = importanceMap.entries.toList()
      ..sort((a, b) => b.value.abs().compareTo(a.value.abs()));

    // Generate natural language explanation
    final explanation = _generateNaturalLanguageExplanation(
      predictedClass: predictedClass,
      confidence: confidence,
      featureImportances: sortedFeatures.take(5).toList(),
      method: 'SHAP',
    );

    return Explanation(
      method: ExplanationMethod.shap,
      predictedClass: predictedClass,
      confidence: confidence,
      featureImportances: importanceMap,
      naturalLanguage: explanation,
      topFeatures: sortedFeatures.take(5).map((e) => e.key).toList(),
      shapValues: shapValues,
    );
  }

  /// Permutation importance explanation
  Future<Explanation> _explainWithPermutation(
    ModelPredictor model,
    List<double> input,
    List<String> featureNames,
  ) async {
    debugPrint('Generating permutation importance explanation...');

    final prediction = model.predict(input);
    final predictedClass = prediction.predictedClass;
    final confidence = prediction.confidence;
    final baselineAccuracy = confidence;

    final importances = <double>[];

    for (var i = 0; i < input.length; i++) {
      // Permute feature i
      final permuted = List<double>.from(input);
      permuted[i] = _random.nextDouble() * 2 - 1;

      final permutedPred = model.predict(permuted);
      final permutedAccuracy = permutedPred.probabilities[predictedClass];

      // Importance is drop in accuracy
      final importance = baselineAccuracy - permutedAccuracy;
      importances.add(importance);
    }

    // Create feature importance map
    final importanceMap = <String, double>{};
    for (var i = 0; i < featureNames.length; i++) {
      importanceMap[featureNames[i]] = importances[i];
    }

    // Sort by importance
    final sortedFeatures = importanceMap.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    // Generate natural language explanation
    final explanation = _generateNaturalLanguageExplanation(
      predictedClass: predictedClass,
      confidence: confidence,
      featureImportances: sortedFeatures.take(5).toList(),
      method: 'Permutation',
    );

    return Explanation(
      method: ExplanationMethod.permutation,
      predictedClass: predictedClass,
      confidence: confidence,
      featureImportances: importanceMap,
      naturalLanguage: explanation,
      topFeatures: sortedFeatures.take(5).map((e) => e.key).toList(),
    );
  }

  /// Gradient-based explanation (saliency)
  Future<Explanation> _explainWithGradients(
    ModelPredictor model,
    List<double> input,
    List<String> featureNames,
  ) async {
    debugPrint('Generating gradient-based explanation...');

    final prediction = model.predict(input);
    final predictedClass = prediction.predictedClass;
    final confidence = prediction.confidence;

    // Approximate gradients using finite differences
    final gradients = <double>[];
    final epsilon = 0.01;

    for (var i = 0; i < input.length; i++) {
      final inputPlus = List<double>.from(input);
      final inputMinus = List<double>.from(input);

      inputPlus[i] += epsilon;
      inputMinus[i] -= epsilon;

      final predPlus = model.predict(inputPlus);
      final predMinus = model.predict(inputMinus);

      final gradient = (predPlus.probabilities[predictedClass] -
              predMinus.probabilities[predictedClass]) /
          (2 * epsilon);

      gradients.add(gradient.abs());
    }

    // Create feature importance map
    final importanceMap = <String, double>{};
    for (var i = 0; i < featureNames.length; i++) {
      importanceMap[featureNames[i]] = gradients[i];
    }

    // Sort by gradient magnitude
    final sortedFeatures = importanceMap.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    // Generate natural language explanation
    final explanation = _generateNaturalLanguageExplanation(
      predictedClass: predictedClass,
      confidence: confidence,
      featureImportances: sortedFeatures.take(5).toList(),
      method: 'Gradient',
    );

    return Explanation(
      method: ExplanationMethod.gradients,
      predictedClass: predictedClass,
      confidence: confidence,
      featureImportances: importanceMap,
      naturalLanguage: explanation,
      topFeatures: sortedFeatures.take(5).map((e) => e.key).toList(),
      gradients: gradients,
    );
  }

  /// Generate saliency map for image
  Future<SaliencyMap> generateSaliencyMap({
    required ModelPredictor model,
    required ui.Image image,
    int? targetClass,
  }) async {
    debugPrint('Generating saliency map...');

    final width = image.width;
    final height = image.height;

    // Convert image to pixels
    final byteData = await image.toByteData(format: ui.ImageByteFormat.rawRgba);
    if (byteData == null) {
      throw Exception('Failed to convert image to byte data');
    }

    final pixels = byteData.buffer.asUint8List();

    // Get baseline prediction
    final baselinePred = model.predictImage(image);
    final classToExplain = targetClass ?? baselinePred.predictedClass;

    // Calculate gradient for each pixel
    final saliency = List.generate(
      height,
      (_) => List.filled(width, 0.0),
    );

    final epsilon = 5.0; // Pixel perturbation

    for (var y = 0; y < height; y += 4) {
      // Sample every 4 pixels for speed
      for (var x = 0; x < width; x += 4) {
        // Perturb pixel
        final perturbedPixels = Uint8List.fromList(pixels);
        final idx = (y * width + x) * 4;

        if (idx + 2 < perturbedPixels.length) {
          perturbedPixels[idx] =
              (perturbedPixels[idx] + epsilon).clamp(0, 255).toInt();
          perturbedPixels[idx + 1] =
              (perturbedPixels[idx + 1] + epsilon).clamp(0, 255).toInt();
          perturbedPixels[idx + 2] =
              (perturbedPixels[idx + 2] + epsilon).clamp(0, 255).toInt();

          // Create perturbed image
          final perturbedImage = await _createImageFromPixels(
            perturbedPixels,
            width,
            height,
          );

          // Get perturbed prediction
          final perturbedPred = model.predictImage(perturbedImage);

          // Calculate gradient
          final gradient = (perturbedPred.probabilities[classToExplain] -
                  baselinePred.probabilities[classToExplain]) /
              epsilon;

          // Fill surrounding pixels
          for (var dy = 0; dy < 4 && y + dy < height; dy++) {
            for (var dx = 0; dx < 4 && x + dx < width; dx++) {
              saliency[y + dy][x + dx] = gradient.abs();
            }
          }
        }
      }

      if (y % 20 == 0) {
        debugPrint('Saliency map progress: ${(y / height * 100).toStringAsFixed(0)}%');
      }
    }

    // Normalize saliency
    final maxSaliency =
        saliency.expand((row) => row).reduce((a, b) => a > b ? a : b);
    if (maxSaliency > 0) {
      for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
          saliency[y][x] /= maxSaliency;
        }
      }
    }

    return SaliencyMap(
      values: saliency,
      width: width,
      height: height,
      targetClass: classToExplain,
      maxValue: maxSaliency,
    );
  }

  /// Find counterfactual explanation
  Future<CounterfactualExplanation> findCounterfactual({
    required ModelPredictor model,
    required List<double> input,
    required int targetClass,
    int maxIterations = 100,
    double learningRate = 0.1,
  }) async {
    debugPrint(
        'Finding counterfactual for target class $targetClass...');

    final prediction = model.predict(input);
    final originalClass = prediction.predictedClass;

    if (originalClass == targetClass) {
      return CounterfactualExplanation(
        original: input,
        counterfactual: input,
        targetClass: targetClass,
        found: true,
        distance: 0.0,
        iterations: 0,
        changes: {},
      );
    }

    // Start from original input
    var current = List<double>.from(input);
    var bestCounterfactual = List<double>.from(input);
    var bestDistance = double.infinity;
    var found = false;

    for (var iter = 0; iter < maxIterations; iter++) {
      final pred = model.predict(current);

      if (pred.predictedClass == targetClass) {
        final distance = _euclideanDistance(input, current);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestCounterfactual = List<double>.from(current);
          found = true;
        }
      }

      // Gradient descent towards target class
      final gradients = _approximateGradients(model, current, targetClass);

      for (var i = 0; i < current.length; i++) {
        current[i] += learningRate * gradients[i];
        current[i] = current[i].clamp(-1.0, 1.0);
      }

      if (iter % 20 == 0) {
        debugPrint('Iteration $iter: Distance = ${bestDistance.toStringAsFixed(4)}');
      }
    }

    // Calculate changes
    final changes = <int, FeatureChange>{};
    for (var i = 0; i < input.length; i++) {
      if ((bestCounterfactual[i] - input[i]).abs() > 0.01) {
        changes[i] = FeatureChange(
          featureIndex: i,
          originalValue: input[i],
          newValue: bestCounterfactual[i],
          delta: bestCounterfactual[i] - input[i],
        );
      }
    }

    return CounterfactualExplanation(
      original: input,
      counterfactual: bestCounterfactual,
      targetClass: targetClass,
      found: found,
      distance: bestDistance,
      iterations: maxIterations,
      changes: changes,
    );
  }

  /// Generate global feature importance
  Future<GlobalExplanation> generateGlobalExplanation({
    required ModelPredictor model,
    required List<List<double>> dataset,
    required List<int> labels,
    List<String>? featureNames,
  }) async {
    debugPrint('Generating global explanation from ${dataset.length} samples...');

    final names = featureNames ?? _generateFeatureNames(dataset[0].length);

    // Aggregate LIME explanations
    final aggregatedImportances = List.filled(dataset[0].length, 0.0);

    for (var i = 0; i < min(100, dataset.length); i++) {
      final explanation = await _explainWithLIME(
        model,
        dataset[i],
        names,
        200,
      );

      for (var j = 0; j < dataset[0].length; j++) {
        aggregatedImportances[j] +=
            explanation.featureImportances[names[j]]?.abs() ?? 0.0;
      }

      if (i % 20 == 0) {
        debugPrint('Global explanation progress: $i/100');
      }
    }

    // Average importances
    for (var i = 0; i < aggregatedImportances.length; i++) {
      aggregatedImportances[i] /= min(100, dataset.length);
    }

    // Create importance map
    final importanceMap = <String, double>{};
    for (var i = 0; i < names.length; i++) {
      importanceMap[names[i]] = aggregatedImportances[i];
    }

    // Sort features
    final sortedFeatures = importanceMap.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return GlobalExplanation(
      featureImportances: importanceMap,
      topFeatures: sortedFeatures.take(10).map((e) => e.key).toList(),
      numSamples: min(100, dataset.length),
    );
  }

  /// Generate visualization-ready data
  VisualizationData prepareVisualization(Explanation explanation) {
    final sortedFeatures = explanation.featureImportances.entries.toList()
      ..sort((a, b) => b.value.abs().compareTo(a.value.abs()));

    final topN = min(10, sortedFeatures.length);
    final features = sortedFeatures.take(topN).map((e) => e.key).toList();
    final values = sortedFeatures.take(topN).map((e) => e.value).toList();

    return VisualizationData(
      featureNames: features,
      values: values,
      colors: values
          .map((v) => v >= 0 ? Colors.green : Colors.red)
          .toList(),
    );
  }

  /// Helper: Perturb input
  List<double> _perturbInput(List<double> input) {
    final perturbed = <double>[];
    for (final value in input) {
      // Add Gaussian noise
      final noise = _randomGaussian() * 0.2;
      perturbed.add((value + noise).clamp(-1.0, 1.0));
    }
    return perturbed;
  }

  /// Helper: Fit weighted linear model
  List<double> _fitWeightedLinearModel(
    List<List<double>> X,
    List<int> y,
    List<double> weights,
    int targetClass,
  ) {
    final numFeatures = X[0].length;
    final coefficients = List.filled(numFeatures, 0.0);

    // Convert to binary classification (target class vs rest)
    final binaryY = y.map((label) => label == targetClass ? 1.0 : 0.0).toList();

    // Weighted least squares (simplified)
    for (var feature = 0; feature < numFeatures; feature++) {
      var numerator = 0.0;
      var denominator = 0.0;

      for (var i = 0; i < X.length; i++) {
        numerator += weights[i] * X[i][feature] * binaryY[i];
        denominator += weights[i] * X[i][feature] * X[i][feature];
      }

      if (denominator > 1e-10) {
        coefficients[feature] = numerator / denominator;
      }
    }

    return coefficients;
  }

  /// Helper: Euclidean distance
  double _euclideanDistance(List<double> a, List<double> b) {
    var sum = 0.0;
    for (var i = 0; i < a.length; i++) {
      sum += (a[i] - b[i]) * (a[i] - b[i]);
    }
    return sqrt(sum);
  }

  /// Helper: Approximate gradients
  List<double> _approximateGradients(
    ModelPredictor model,
    List<double> input,
    int targetClass,
  ) {
    final gradients = <double>[];
    final epsilon = 0.01;

    for (var i = 0; i < input.length; i++) {
      final inputPlus = List<double>.from(input);
      final inputMinus = List<double>.from(input);

      inputPlus[i] += epsilon;
      inputMinus[i] -= epsilon;

      final predPlus = model.predict(inputPlus);
      final predMinus = model.predict(inputMinus);

      final gradient = (predPlus.probabilities[targetClass] -
              predMinus.probabilities[targetClass]) /
          (2 * epsilon);

      gradients.add(gradient);
    }

    return gradients;
  }

  /// Helper: Random Gaussian
  double _randomGaussian() {
    // Box-Muller transform
    final u1 = _random.nextDouble();
    final u2 = _random.nextDouble();
    return sqrt(-2 * log(u1)) * cos(2 * pi * u2);
  }

  /// Helper: Generate feature names
  List<String> _generateFeatureNames(int count) {
    return List.generate(count, (i) => 'Feature ${i + 1}');
  }

  /// Helper: Create image from pixels
  Future<ui.Image> _createImageFromPixels(
    Uint8List pixels,
    int width,
    int height,
  ) async {
    final completer = Completer<ui.Image>();

    ui.decodeImageFromPixels(
      pixels,
      width,
      height,
      ui.PixelFormat.rgba8888,
      (image) => completer.complete(image),
    );

    return completer.future;
  }

  /// Helper: Generate natural language explanation
  String _generateNaturalLanguageExplanation({
    required int predictedClass,
    required double confidence,
    required List<MapEntry<String, double>> featureImportances,
    required String method,
  }) {
    final buffer = StringBuffer();

    buffer.writeln(
        'Predicted class $predictedClass with ${(confidence * 100).toStringAsFixed(1)}% confidence.');
    buffer.writeln();
    buffer.writeln('$method Analysis:');

    for (var i = 0; i < min(3, featureImportances.length); i++) {
      final entry = featureImportances[i];
      final importance = entry.value;
      final direction = importance > 0 ? 'increases' : 'decreases';
      final strength = importance.abs() > 0.1
          ? 'strongly'
          : importance.abs() > 0.05
              ? 'moderately'
              : 'slightly';

      buffer.writeln(
          '• ${entry.key} $strength $direction confidence (${(importance * 100).toStringAsFixed(1)}%)');
    }

    return buffer.toString();
  }
}

/// Model predictor interface
abstract class ModelPredictor {
  Prediction predict(List<double> input);
  Prediction predictImage(ui.Image image);
}

/// Prediction result
class Prediction {
  final int predictedClass;
  final double confidence;
  final List<double> probabilities;
  final Map<int, String> classNames;

  Prediction({
    required this.predictedClass,
    required this.confidence,
    required this.probabilities,
    this.classNames = const {},
  });

  String get className =>
      classNames[predictedClass] ?? 'Class $predictedClass';

  List<ClassPrediction> get topPredictions {
    final predictions = <ClassPrediction>[];
    for (var i = 0; i < probabilities.length; i++) {
      predictions.add(ClassPrediction(
        classId: i,
        className: classNames[i] ?? 'Class $i',
        confidence: probabilities[i],
      ));
    }
    predictions.sort((a, b) => b.confidence.compareTo(a.confidence));
    return predictions;
  }
}

/// Class prediction
class ClassPrediction {
  final int classId;
  final String className;
  final double confidence;

  ClassPrediction({
    required this.classId,
    required this.className,
    required this.confidence,
  });
}

/// Explanation method
enum ExplanationMethod { lime, shap, permutation, gradients }

/// Explanation result
class Explanation {
  final ExplanationMethod method;
  final int predictedClass;
  final double confidence;
  final Map<String, double> featureImportances;
  final String naturalLanguage;
  final List<String> topFeatures;
  final List<double>? shapValues;
  final List<double>? gradients;

  Explanation({
    required this.method,
    required this.predictedClass,
    required this.confidence,
    required this.featureImportances,
    required this.naturalLanguage,
    required this.topFeatures,
    this.shapValues,
    this.gradients,
  });
}

/// Saliency map
class SaliencyMap {
  final List<List<double>> values;
  final int width;
  final int height;
  final int targetClass;
  final double maxValue;

  SaliencyMap({
    required this.values,
    required this.width,
    required this.height,
    required this.targetClass,
    required this.maxValue,
  });

  /// Convert to heatmap image
  Future<ui.Image> toHeatmap() async {
    final pixels = Uint8List(width * height * 4);

    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        final idx = (y * width + x) * 4;
        final value = values[y][x];

        // Red heatmap
        pixels[idx] = (255 * value).toInt(); // R
        pixels[idx + 1] = 0; // G
        pixels[idx + 2] = 0; // B
        pixels[idx + 3] = (180 * value).toInt(); // A
      }
    }

    final completer = Completer<ui.Image>();

    ui.decodeImageFromPixels(
      pixels,
      width,
      height,
      ui.PixelFormat.rgba8888,
      (image) => completer.complete(image),
    );

    return completer.future;
  }
}

/// Counterfactual explanation
class CounterfactualExplanation {
  final List<double> original;
  final List<double> counterfactual;
  final int targetClass;
  final bool found;
  final double distance;
  final int iterations;
  final Map<int, FeatureChange> changes;

  CounterfactualExplanation({
    required this.original,
    required this.counterfactual,
    required this.targetClass,
    required this.found,
    required this.distance,
    required this.iterations,
    required this.changes,
  });

  String describeChanges(List<String> featureNames) {
    if (changes.isEmpty) {
      return 'No changes needed.';
    }

    final buffer = StringBuffer();
    buffer.writeln('To predict class $targetClass:');

    final sortedChanges = changes.values.toList()
      ..sort((a, b) => b.delta.abs().compareTo(a.delta.abs()));

    for (var i = 0; i < min(5, sortedChanges.length); i++) {
      final change = sortedChanges[i];
      final featureName = change.featureIndex < featureNames.length
          ? featureNames[change.featureIndex]
          : 'Feature ${change.featureIndex}';

      final direction = change.delta > 0 ? 'increase' : 'decrease';
      buffer.writeln(
          '• $direction $featureName by ${change.delta.abs().toStringAsFixed(3)}');
    }

    return buffer.toString();
  }
}

/// Feature change
class FeatureChange {
  final int featureIndex;
  final double originalValue;
  final double newValue;
  final double delta;

  FeatureChange({
    required this.featureIndex,
    required this.originalValue,
    required this.newValue,
    required this.delta,
  });
}

/// Global explanation
class GlobalExplanation {
  final Map<String, double> featureImportances;
  final List<String> topFeatures;
  final int numSamples;

  GlobalExplanation({
    required this.featureImportances,
    required this.topFeatures,
    required this.numSamples,
  });
}

/// Visualization data
class VisualizationData {
  final List<String> featureNames;
  final List<double> values;
  final List<Color> colors;

  VisualizationData({
    required this.featureNames,
    required this.values,
    required this.colors,
  });
}

/// Simple model predictor implementation for testing
class SimpleModelPredictor implements ModelPredictor {
  final Random _random = Random();

  @override
  Prediction predict(List<double> input) {
    // Simple linear classifier
    final score = input.reduce((a, b) => a + b) / input.length;

    final probabilities = [
      max(0, 1 - score.abs()),
      max(0, score),
      max(0, -score),
    ];

    final sum = probabilities.reduce((a, b) => a + b);
    final normalized = probabilities.map((p) => p / (sum + 1e-10)).toList();

    final predictedClass = normalized.indexOf(normalized.reduce(max));

    return Prediction(
      predictedClass: predictedClass,
      confidence: normalized[predictedClass],
      probabilities: normalized,
      classNames: {
        0: 'Neutral',
        1: 'Positive',
        2: 'Negative',
      },
    );
  }

  @override
  Prediction predictImage(ui.Image image) {
    // Random prediction for images
    final probabilities = [
      _random.nextDouble(),
      _random.nextDouble(),
      _random.nextDouble(),
    ];

    final sum = probabilities.reduce((a, b) => a + b);
    final normalized = probabilities.map((p) => p / sum).toList();

    final predictedClass = normalized.indexOf(normalized.reduce(max));

    return Prediction(
      predictedClass: predictedClass,
      confidence: normalized[predictedClass],
      probabilities: normalized,
      classNames: {
        0: 'Cat',
        1: 'Dog',
        2: 'Bird',
      },
    );
  }
}
