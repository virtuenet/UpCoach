import 'dart:async';
import 'dart:math';

import '../on_device_inference_engine.dart';

/// Coaching NLU Model
/// On-device natural language understanding for coaching intents
/// Model size: <5MB, Latency target: <50ms
class CoachingNLUModel {
  static const String modelId = 'coaching_nlu_v1';
  static const String modelPath = 'assets/models/coaching_nlu.tflite';
  static const int maxSequenceLength = 128;
  static const int vocabularySize = 10000;

  bool _isLoaded = false;
  final Map<String, int> _vocabulary = {};
  final List<String> _intentLabels = [];
  final List<String> _entityLabels = [];

  // Simulated model weights (in production, loaded from TFLite)
  late List<List<double>> _intentClassifierWeights;
  late List<List<double>> _entityRecognizerWeights;

  CoachingNLUModel() {
    _initializeVocabulary();
    _initializeLabels();
    _initializeWeights();
  }

  /// Load the model
  Future<void> load() async {
    if (_isLoaded) return;

    // Simulate model loading delay
    await Future.delayed(const Duration(milliseconds: 100));
    _isLoaded = true;
  }

  /// Unload the model to free memory
  void unload() {
    _isLoaded = false;
  }

  /// Check if model is loaded
  bool get isLoaded => _isLoaded;

  /// Process text and extract intents and entities
  Future<NLUResult> process(String text) async {
    if (!_isLoaded) {
      await load();
    }

    final startTime = DateTime.now();

    // Tokenize and encode
    final tokens = _tokenize(text);
    final encoded = _encode(tokens);

    // Intent classification
    final intentScores = _classifyIntent(encoded);
    final topIntents = _getTopIntents(intentScores, topK: 3);

    // Entity extraction
    final entities = _extractEntities(tokens, encoded);

    // Sentiment analysis
    final sentiment = _analyzeSentiment(tokens);

    // Topic detection
    final topics = _detectTopics(tokens);

    final latencyMs = DateTime.now().difference(startTime).inMilliseconds;

    return NLUResult(
      text: text,
      intents: topIntents,
      entities: entities,
      sentiment: sentiment,
      topics: topics,
      latencyMs: latencyMs,
      confidence: topIntents.isNotEmpty ? topIntents.first.confidence : 0.0,
    );
  }

  /// Quick intent check without full processing
  Future<String?> quickIntentCheck(String text) async {
    if (!_isLoaded) {
      await load();
    }

    final tokens = _tokenize(text);
    final encoded = _encode(tokens);
    final intentScores = _classifyIntent(encoded);

    final maxIndex = intentScores.indexOf(intentScores.reduce(max));
    final confidence = intentScores[maxIndex];

    if (confidence > 0.5) {
      return _intentLabels[maxIndex];
    }
    return null;
  }

  // ==================== Private Methods ====================

  void _initializeVocabulary() {
    // Common coaching-related words
    final words = [
      'goal', 'habit', 'progress', 'help', 'stuck', 'motivation',
      'schedule', 'session', 'coach', 'advice', 'plan', 'track',
      'complete', 'start', 'stop', 'change', 'improve', 'achieve',
      'struggle', 'success', 'fail', 'try', 'want', 'need',
      'feel', 'think', 'believe', 'can', 'will', 'should',
      'today', 'tomorrow', 'week', 'month', 'year', 'daily',
      'workout', 'exercise', 'meditation', 'reading', 'learning',
      'sleep', 'diet', 'health', 'fitness', 'mindfulness',
      'stress', 'anxiety', 'focus', 'productivity', 'balance',
      'relationship', 'career', 'finance', 'personal', 'growth',
      'set', 'create', 'update', 'delete', 'show', 'list',
      'remind', 'notify', 'when', 'how', 'what', 'why',
      'good', 'bad', 'better', 'worse', 'more', 'less',
      'i', 'my', 'me', 'we', 'our', 'you', 'your',
      'the', 'a', 'an', 'is', 'are', 'was', 'were',
      'to', 'for', 'with', 'about', 'on', 'in', 'at',
    ];

    for (var i = 0; i < words.length; i++) {
      _vocabulary[words[i]] = i + 1; // 0 reserved for unknown
    }
  }

  void _initializeLabels() {
    _intentLabels.addAll([
      'create_goal',
      'update_goal',
      'check_progress',
      'request_advice',
      'schedule_session',
      'log_habit',
      'ask_motivation',
      'report_struggle',
      'celebrate_success',
      'request_resources',
      'set_reminder',
      'general_chat',
      'feedback',
      'greeting',
      'farewell',
    ]);

    _entityLabels.addAll([
      'goal_type',
      'habit_name',
      'time_period',
      'date',
      'frequency',
      'metric',
      'emotion',
      'topic',
      'person',
      'location',
    ]);
  }

  void _initializeWeights() {
    final random = Random(42);

    // Initialize intent classifier weights
    _intentClassifierWeights = List.generate(
      _intentLabels.length,
      (_) => List.generate(vocabularySize, (_) => random.nextDouble() * 2 - 1),
    );

    // Initialize entity recognizer weights
    _entityRecognizerWeights = List.generate(
      _entityLabels.length,
      (_) => List.generate(vocabularySize, (_) => random.nextDouble() * 2 - 1),
    );
  }

  List<String> _tokenize(String text) {
    // Simple tokenization (lowercase, split on whitespace and punctuation)
    return text
        .toLowerCase()
        .replaceAll(RegExp(r'[^\w\s]'), ' ')
        .split(RegExp(r'\s+'))
        .where((t) => t.isNotEmpty)
        .toList();
  }

  List<int> _encode(List<String> tokens) {
    return tokens.map((t) => _vocabulary[t] ?? 0).take(maxSequenceLength).toList();
  }

  List<double> _classifyIntent(List<int> encoded) {
    // Simulated neural network forward pass
    final scores = List<double>.filled(_intentLabels.length, 0.0);

    for (var i = 0; i < _intentLabels.length; i++) {
      double sum = 0.0;
      for (final tokenId in encoded) {
        if (tokenId < _intentClassifierWeights[i].length) {
          sum += _intentClassifierWeights[i][tokenId];
        }
      }
      scores[i] = _sigmoid(sum / (encoded.length + 1));
    }

    return _softmax(scores);
  }

  List<IntentPrediction> _getTopIntents(List<double> scores, {int topK = 3}) {
    final indexed = scores.asMap().entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return indexed.take(topK).map((e) {
      return IntentPrediction(
        intent: _intentLabels[e.key],
        confidence: e.value,
      );
    }).toList();
  }

  List<EntityPrediction> _extractEntities(List<String> tokens, List<int> encoded) {
    final entities = <EntityPrediction>[];

    // Rule-based entity extraction combined with model scores
    for (var i = 0; i < tokens.length; i++) {
      final token = tokens[i];
      final tokenId = encoded[i];

      // Check for time entities
      if (_isTimeWord(token)) {
        entities.add(EntityPrediction(
          entity: 'time_period',
          value: token,
          start: i,
          end: i + 1,
          confidence: 0.9,
        ));
      }

      // Check for frequency entities
      if (_isFrequencyWord(token)) {
        entities.add(EntityPrediction(
          entity: 'frequency',
          value: token,
          start: i,
          end: i + 1,
          confidence: 0.85,
        ));
      }

      // Check for emotion entities
      if (_isEmotionWord(token)) {
        entities.add(EntityPrediction(
          entity: 'emotion',
          value: token,
          start: i,
          end: i + 1,
          confidence: 0.8,
        ));
      }

      // Check for habit/goal types
      if (_isActivityWord(token)) {
        entities.add(EntityPrediction(
          entity: 'goal_type',
          value: token,
          start: i,
          end: i + 1,
          confidence: 0.75,
        ));
      }
    }

    return entities;
  }

  SentimentResult _analyzeSentiment(List<String> tokens) {
    const positiveWords = {
      'good', 'great', 'excellent', 'amazing', 'happy', 'success',
      'achieve', 'complete', 'better', 'improve', 'progress', 'motivated',
    };

    const negativeWords = {
      'bad', 'terrible', 'fail', 'stuck', 'struggle', 'anxious',
      'stress', 'worse', 'difficult', 'hard', 'frustrated', 'sad',
    };

    var positiveCount = 0;
    var negativeCount = 0;

    for (final token in tokens) {
      if (positiveWords.contains(token)) positiveCount++;
      if (negativeWords.contains(token)) negativeCount++;
    }

    final total = positiveCount + negativeCount;
    if (total == 0) {
      return SentimentResult(
        label: 'neutral',
        score: 0.0,
        confidence: 0.5,
      );
    }

    final score = (positiveCount - negativeCount) / total;
    final label = score > 0.2 ? 'positive' : (score < -0.2 ? 'negative' : 'neutral');

    return SentimentResult(
      label: label,
      score: score,
      confidence: total / tokens.length,
    );
  }

  List<String> _detectTopics(List<String> tokens) {
    final topicKeywords = {
      'fitness': ['workout', 'exercise', 'gym', 'fitness', 'strength'],
      'mindfulness': ['meditation', 'mindfulness', 'calm', 'peace', 'breathe'],
      'productivity': ['productivity', 'focus', 'work', 'task', 'deadline'],
      'health': ['health', 'diet', 'nutrition', 'sleep', 'wellness'],
      'career': ['career', 'job', 'work', 'professional', 'skills'],
      'relationships': ['relationship', 'family', 'friend', 'social', 'communication'],
      'learning': ['learn', 'study', 'read', 'course', 'education'],
      'finance': ['finance', 'money', 'budget', 'save', 'invest'],
    };

    final detectedTopics = <String>[];

    for (final entry in topicKeywords.entries) {
      for (final keyword in entry.value) {
        if (tokens.contains(keyword)) {
          detectedTopics.add(entry.key);
          break;
        }
      }
    }

    return detectedTopics.isEmpty ? ['general'] : detectedTopics;
  }

  bool _isTimeWord(String word) {
    const timeWords = {
      'today', 'tomorrow', 'yesterday', 'week', 'month', 'year',
      'morning', 'afternoon', 'evening', 'night', 'daily', 'weekly',
      'monthly', 'yearly', 'hour', 'minute', 'second',
    };
    return timeWords.contains(word);
  }

  bool _isFrequencyWord(String word) {
    const freqWords = {
      'daily', 'weekly', 'monthly', 'yearly', 'always', 'never',
      'sometimes', 'often', 'rarely', 'once', 'twice', 'everyday',
    };
    return freqWords.contains(word);
  }

  bool _isEmotionWord(String word) {
    const emotionWords = {
      'happy', 'sad', 'angry', 'frustrated', 'excited', 'anxious',
      'stressed', 'calm', 'motivated', 'tired', 'energetic', 'hopeful',
    };
    return emotionWords.contains(word);
  }

  bool _isActivityWord(String word) {
    const activityWords = {
      'workout', 'exercise', 'meditation', 'reading', 'learning',
      'coding', 'writing', 'running', 'walking', 'yoga', 'sleep',
    };
    return activityWords.contains(word);
  }

  double _sigmoid(double x) {
    return 1.0 / (1.0 + exp(-x));
  }

  List<double> _softmax(List<double> scores) {
    final maxScore = scores.reduce(max);
    final expScores = scores.map((s) => exp(s - maxScore)).toList();
    final sumExp = expScores.reduce((a, b) => a + b);
    return expScores.map((e) => e / sumExp).toList();
  }
}

/// NLU processing result
class NLUResult {
  final String text;
  final List<IntentPrediction> intents;
  final List<EntityPrediction> entities;
  final SentimentResult sentiment;
  final List<String> topics;
  final int latencyMs;
  final double confidence;

  NLUResult({
    required this.text,
    required this.intents,
    required this.entities,
    required this.sentiment,
    required this.topics,
    required this.latencyMs,
    required this.confidence,
  });

  /// Get the primary intent
  String? get primaryIntent => intents.isNotEmpty ? intents.first.intent : null;

  /// Check if a specific intent is detected
  bool hasIntent(String intent, {double minConfidence = 0.5}) {
    return intents.any((i) => i.intent == intent && i.confidence >= minConfidence);
  }

  /// Get entities of a specific type
  List<EntityPrediction> getEntities(String entityType) {
    return entities.where((e) => e.entity == entityType).toList();
  }

  Map<String, dynamic> toJson() => {
    'text': text,
    'intents': intents.map((i) => i.toJson()).toList(),
    'entities': entities.map((e) => e.toJson()).toList(),
    'sentiment': sentiment.toJson(),
    'topics': topics,
    'latencyMs': latencyMs,
    'confidence': confidence,
  };
}

/// Intent prediction
class IntentPrediction {
  final String intent;
  final double confidence;

  IntentPrediction({
    required this.intent,
    required this.confidence,
  });

  Map<String, dynamic> toJson() => {
    'intent': intent,
    'confidence': confidence,
  };
}

/// Entity prediction
class EntityPrediction {
  final String entity;
  final String value;
  final int start;
  final int end;
  final double confidence;

  EntityPrediction({
    required this.entity,
    required this.value,
    required this.start,
    required this.end,
    required this.confidence,
  });

  Map<String, dynamic> toJson() => {
    'entity': entity,
    'value': value,
    'start': start,
    'end': end,
    'confidence': confidence,
  };
}

/// Sentiment analysis result
class SentimentResult {
  final String label; // positive, negative, neutral
  final double score; // -1 to 1
  final double confidence;

  SentimentResult({
    required this.label,
    required this.score,
    required this.confidence,
  });

  Map<String, dynamic> toJson() => {
    'label': label,
    'score': score,
    'confidence': confidence,
  };
}
