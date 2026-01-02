import 'dart:async';
import 'dart:collection';
import 'dart:convert';
import 'dart:io';
import 'dart:math' as math;
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:path_provider/path_provider.dart';
import 'package:sensors_plus/sensors_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sqflite/sqflite.dart';

/// Edge computing and distributed intelligence across devices
class EdgeIntelligence {
  static final EdgeIntelligence _instance = EdgeIntelligence._internal();
  factory EdgeIntelligence() => _instance;
  EdgeIntelligence._internal();

  bool _isInitialized = false;
  Database? _database;

  // Caching
  final _InferenceCache _resultCache = _InferenceCache(maxSize: 1000);
  final Map<String, dynamic> _predictiveCache = {};
  final int _maxCacheSizeMB = 100;

  // Knowledge base
  final Map<String, List<double>> _embeddings = {};
  final Map<String, dynamic> _documents = {};

  // Context awareness
  Position? _currentPosition;
  String _currentActivity = 'unknown';
  DateTime? _lastActivityUpdate;
  final List<ActivitySample> _activityHistory = [];

  // Analytics
  int _offlineInferences = 0;
  int _onlineInferences = 0;
  final Map<String, int> _queryFrequency = {};

  // Model ensemble
  final Map<String, double> _modelWeights = {};

  // Sensor streams
  StreamSubscription<AccelerometerEvent>? _accelerometerSubscription;
  StreamSubscription<GyroscopeEvent>? _gyroscopeSubscription;
  final List<double> _accelerometerData = [];
  final List<double> _gyroscopeData = [];

  /// Initialize edge intelligence
  Future<void> initialize() async {
    if (_isInitialized) {
      debugPrint('EdgeIntelligence already initialized');
      return;
    }

    try {
      debugPrint('Initializing EdgeIntelligence...');

      // Initialize database
      await _initializeDatabase();

      // Initialize location tracking
      await _initializeLocationTracking();

      // Initialize activity recognition
      await _initializeActivityRecognition();

      // Load cached data
      await _loadCachedData();

      _isInitialized = true;
      debugPrint('EdgeIntelligence initialized successfully');
    } catch (e) {
      debugPrint('Failed to initialize EdgeIntelligence: $e');
      rethrow;
    }
  }

  /// Initialize local database
  Future<void> _initializeDatabase() async {
    try {
      final directory = await getApplicationDocumentsDirectory();
      final path = '${directory.path}/edge_intelligence.db';

      _database = await openDatabase(
        path,
        version: 1,
        onCreate: (db, version) async {
          // Embeddings table
          await db.execute('''
            CREATE TABLE embeddings (
              id TEXT PRIMARY KEY,
              vector TEXT NOT NULL,
              metadata TEXT,
              created_at INTEGER NOT NULL
            )
          ''');

          // Documents table
          await db.execute('''
            CREATE TABLE documents (
              id TEXT PRIMARY KEY,
              content TEXT NOT NULL,
              embedding_id TEXT,
              metadata TEXT,
              created_at INTEGER NOT NULL,
              FOREIGN KEY (embedding_id) REFERENCES embeddings (id)
            )
          ''');

          // Inference results table
          await db.execute('''
            CREATE TABLE inference_results (
              id TEXT PRIMARY KEY,
              query TEXT NOT NULL,
              result TEXT NOT NULL,
              confidence REAL NOT NULL,
              created_at INTEGER NOT NULL
            )
          ''');

          // Activity history table
          await db.execute('''
            CREATE TABLE activity_history (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              activity TEXT NOT NULL,
              confidence REAL NOT NULL,
              timestamp INTEGER NOT NULL
            )
          ''');

          debugPrint('Database tables created');
        },
      );

      debugPrint('Database initialized at: $path');
    } catch (e) {
      debugPrint('Failed to initialize database: $e');
      rethrow;
    }
  }

  /// Initialize location tracking
  Future<void> _initializeLocationTracking() async {
    try {
      // Check location permission
      final permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        debugPrint('Location permission denied');
        return;
      }

      // Get current position
      _currentPosition = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.medium,
      );

      debugPrint('Current position: ${_currentPosition?.latitude}, ${_currentPosition?.longitude}');

      // Listen to position updates
      Geolocator.getPositionStream(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.medium,
          distanceFilter: 100,
        ),
      ).listen((position) {
        _currentPosition = position;
        debugPrint('Position updated: ${position.latitude}, ${position.longitude}');
      });
    } catch (e) {
      debugPrint('Failed to initialize location tracking: $e');
    }
  }

  /// Initialize activity recognition
  Future<void> _initializeActivityRecognition() async {
    try {
      // Subscribe to accelerometer
      _accelerometerSubscription = accelerometerEvents.listen((event) {
        _accelerometerData.add(event.x);
        _accelerometerData.add(event.y);
        _accelerometerData.add(event.z);

        // Keep only last 100 samples
        if (_accelerometerData.length > 300) {
          _accelerometerData.removeRange(0, 3);
        }

        // Recognize activity periodically
        if (_lastActivityUpdate == null ||
            DateTime.now().difference(_lastActivityUpdate!).inSeconds > 5) {
          _recognizeActivity();
        }
      });

      // Subscribe to gyroscope
      _gyroscopeSubscription = gyroscopeEvents.listen((event) {
        _gyroscopeData.add(event.x);
        _gyroscopeData.add(event.y);
        _gyroscopeData.add(event.z);

        // Keep only last 100 samples
        if (_gyroscopeData.length > 300) {
          _gyroscopeData.removeRange(0, 3);
        }
      });

      debugPrint('Activity recognition initialized');
    } catch (e) {
      debugPrint('Failed to initialize activity recognition: $e');
    }
  }

  /// Recognize current activity
  void _recognizeActivity() {
    if (_accelerometerData.length < 30) return;

    try {
      // Calculate magnitude of acceleration
      var totalMagnitude = 0.0;
      for (var i = 0; i < _accelerometerData.length; i += 3) {
        final x = _accelerometerData[i];
        final y = _accelerometerData[i + 1];
        final z = _accelerometerData[i + 2];
        final magnitude = math.sqrt(x * x + y * y + z * z);
        totalMagnitude += magnitude;
      }

      final avgMagnitude = totalMagnitude / (_accelerometerData.length / 3);

      // Simple activity classification
      String activity;
      double confidence;

      if (avgMagnitude < 1.0) {
        activity = 'still';
        confidence = 0.9;
      } else if (avgMagnitude < 5.0) {
        activity = 'walking';
        confidence = 0.8;
      } else if (avgMagnitude < 10.0) {
        activity = 'running';
        confidence = 0.85;
      } else {
        activity = 'moving';
        confidence = 0.7;
      }

      if (activity != _currentActivity) {
        _currentActivity = activity;
        _lastActivityUpdate = DateTime.now();

        // Record activity
        _activityHistory.add(ActivitySample(
          activity: activity,
          confidence: confidence,
          timestamp: DateTime.now(),
        ));

        // Keep only last 1000 samples
        if (_activityHistory.length > 1000) {
          _activityHistory.removeAt(0);
        }

        debugPrint('Activity recognized: $activity (confidence: ${confidence.toStringAsFixed(2)})');

        // Save to database
        _saveActivity(activity, confidence);
      }
    } catch (e) {
      debugPrint('Error recognizing activity: $e');
    }
  }

  /// Save activity to database
  Future<void> _saveActivity(String activity, double confidence) async {
    if (_database == null) return;

    try {
      await _database!.insert(
        'activity_history',
        {
          'activity': activity,
          'confidence': confidence,
          'timestamp': DateTime.now().millisecondsSinceEpoch,
        },
      );
    } catch (e) {
      debugPrint('Failed to save activity: $e');
    }
  }

  /// Load cached data
  Future<void> _loadCachedData() async {
    try {
      final prefs = await SharedPreferences.getInstance();

      // Load query frequency
      final queryFreqJson = prefs.getString('query_frequency');
      if (queryFreqJson != null) {
        final data = json.decode(queryFreqJson) as Map<String, dynamic>;
        _queryFrequency.addAll(data.map((k, v) => MapEntry(k, v as int)));
      }

      // Load model weights
      final modelWeightsJson = prefs.getString('model_weights');
      if (modelWeightsJson != null) {
        final data = json.decode(modelWeightsJson) as Map<String, dynamic>;
        _modelWeights.addAll(data.map((k, v) => MapEntry(k, v as double)));
      }

      debugPrint('Cached data loaded');
    } catch (e) {
      debugPrint('Failed to load cached data: $e');
    }
  }

  /// Save cached data
  Future<void> _saveCachedData() async {
    try {
      final prefs = await SharedPreferences.getInstance();

      await prefs.setString('query_frequency', json.encode(_queryFrequency));
      await prefs.setString('model_weights', json.encode(_modelWeights));

      debugPrint('Cached data saved');
    } catch (e) {
      debugPrint('Failed to save cached data: $e');
    }
  }

  /// Run offline inference
  Future<InferenceResult> runOfflineInference({
    required String query,
    String? context,
  }) async {
    if (!_isInitialized) {
      throw Exception('EdgeIntelligence not initialized');
    }

    debugPrint('Running offline inference for query: $query');

    // Check cache
    final cacheKey = _generateCacheKey(query, context);
    final cached = _resultCache.get(cacheKey);
    if (cached != null) {
      debugPrint('Cache hit for offline inference');
      return cached as InferenceResult;
    }

    final stopwatch = Stopwatch()..start();

    try {
      // Update query frequency
      _queryFrequency[query] = (_queryFrequency[query] ?? 0) + 1;

      // Search knowledge base
      final searchResults = await _searchKnowledgeBase(query);

      // Generate response based on context
      final result = _generateOfflineResponse(query, searchResults, context);

      stopwatch.stop();

      // Cache result
      _resultCache.put(cacheKey, result);

      // Update analytics
      _offlineInferences++;

      debugPrint('Offline inference completed in ${stopwatch.elapsedMilliseconds}ms');

      return result;
    } catch (e) {
      debugPrint('Offline inference failed: $e');
      rethrow;
    }
  }

  /// Generate cache key
  String _generateCacheKey(String query, String? context) {
    final combined = '$query:${context ?? ''}';
    return combined.hashCode.toString();
  }

  /// Search knowledge base
  Future<List<DocumentMatch>> _searchKnowledgeBase(String query) async {
    if (_database == null) return [];

    try {
      // Simple keyword-based search (BM25-like)
      final queryTokens = _tokenize(query);

      // Get all documents
      final documents = await _database!.query('documents');

      final matches = <DocumentMatch>[];

      for (final doc in documents) {
        final content = doc['content'] as String;
        final score = _calculateBM25Score(queryTokens, content);

        if (score > 0) {
          matches.add(DocumentMatch(
            documentId: doc['id'] as String,
            content: content,
            score: score,
          ));
        }
      }

      // Sort by score
      matches.sort((a, b) => b.score.compareTo(a.score));

      debugPrint('Found ${matches.length} matching documents');

      return matches.take(5).toList();
    } catch (e) {
      debugPrint('Knowledge base search failed: $e');
      return [];
    }
  }

  /// Tokenize text
  List<String> _tokenize(String text) {
    return text
        .toLowerCase()
        .replaceAll(RegExp(r'[^\w\s]'), '')
        .split(RegExp(r'\s+'))
        .where((token) => token.isNotEmpty)
        .toList();
  }

  /// Calculate BM25 score
  double _calculateBM25Score(List<String> queryTokens, String document) {
    final docTokens = _tokenize(document);
    final docLength = docTokens.length;

    // BM25 parameters
    const k1 = 1.2;
    const b = 0.75;
    const avgDocLength = 100.0;

    var score = 0.0;

    for (final term in queryTokens) {
      final termFreq = docTokens.where((t) => t == term).length;
      if (termFreq > 0) {
        // Simplified BM25 (without IDF component)
        final numerator = termFreq * (k1 + 1);
        final denominator = termFreq + k1 * (1 - b + b * docLength / avgDocLength);
        score += numerator / denominator;
      }
    }

    return score;
  }

  /// Generate offline response
  InferenceResult _generateOfflineResponse(
    String query,
    List<DocumentMatch> matches,
    String? context,
  ) {
    if (matches.isEmpty) {
      return InferenceResult(
        query: query,
        result: 'No relevant information found',
        confidence: 0.0,
        sources: [],
        isOffline: true,
      );
    }

    // Use top match
    final topMatch = matches.first;

    // Simple response generation
    final response = topMatch.content.length > 200
        ? '${topMatch.content.substring(0, 200)}...'
        : topMatch.content;

    return InferenceResult(
      query: query,
      result: response,
      confidence: math.min(topMatch.score / 10.0, 1.0),
      sources: matches.map((m) => m.documentId).toList(),
      isOffline: true,
    );
  }

  /// Add document to knowledge base
  Future<void> addDocument({
    required String documentId,
    required String content,
    Map<String, dynamic>? metadata,
  }) async {
    if (_database == null) return;

    try {
      // Generate embedding (simplified: use word counts)
      final embedding = _generateEmbedding(content);

      // Save embedding
      await _database!.insert(
        'embeddings',
        {
          'id': '${documentId}_embedding',
          'vector': json.encode(embedding),
          'metadata': metadata != null ? json.encode(metadata) : null,
          'created_at': DateTime.now().millisecondsSinceEpoch,
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );

      // Save document
      await _database!.insert(
        'documents',
        {
          'id': documentId,
          'content': content,
          'embedding_id': '${documentId}_embedding',
          'metadata': metadata != null ? json.encode(metadata) : null,
          'created_at': DateTime.now().millisecondsSinceEpoch,
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );

      debugPrint('Document added: $documentId');
    } catch (e) {
      debugPrint('Failed to add document: $e');
      rethrow;
    }
  }

  /// Generate simple embedding
  List<double> _generateEmbedding(String text) {
    // Simplified: TF-IDF-like embedding
    final tokens = _tokenize(text);
    final vocabulary = tokens.toSet().toList();

    // Create fixed-size embedding (100 dimensions)
    final embedding = List<double>.filled(100, 0.0);

    for (var i = 0; i < vocabulary.length && i < 100; i++) {
      final term = vocabulary[i];
      final tf = tokens.where((t) => t == term).length / tokens.length;
      embedding[i] = tf;
    }

    return embedding;
  }

  /// Recommend items using collaborative filtering
  Future<List<RecommendationItem>> recommendOffline({
    required String userId,
    required Map<String, double> userPreferences,
    int topK = 10,
  }) async {
    debugPrint('Generating offline recommendations for user: $userId');

    try {
      // Simple item-based collaborative filtering
      final itemScores = <String, double>{};

      // Calculate scores based on user preferences
      for (final entry in userPreferences.entries) {
        final itemId = entry.key;
        final preference = entry.value;

        // Find similar items (simplified: use random similarity)
        final similarItems = _findSimilarItems(itemId);

        for (final similar in similarItems.entries) {
          itemScores[similar.key] = (itemScores[similar.key] ?? 0.0) + preference * similar.value;
        }
      }

      // Remove already seen items
      for (final itemId in userPreferences.keys) {
        itemScores.remove(itemId);
      }

      // Sort and take top K
      final recommendations = itemScores.entries.toList()
        ..sort((a, b) => b.value.compareTo(a.value));

      return recommendations
          .take(topK)
          .map((entry) => RecommendationItem(
                itemId: entry.key,
                score: entry.value,
              ))
          .toList();
    } catch (e) {
      debugPrint('Offline recommendation failed: $e');
      return [];
    }
  }

  /// Find similar items (simplified)
  Map<String, double> _findSimilarItems(String itemId) {
    // Simplified: return random similar items
    final random = math.Random(itemId.hashCode);
    final similarItems = <String, double>{};

    for (var i = 0; i < 10; i++) {
      final similarId = 'item_${random.nextInt(1000)}';
      final similarity = 0.5 + random.nextDouble() * 0.5;
      similarItems[similarId] = similarity;
    }

    return similarItems;
  }

  /// Predictive caching
  Future<void> predictiveCache(List<String> likelyQueries) async {
    debugPrint('Running predictive caching for ${likelyQueries.length} queries');

    for (final query in likelyQueries) {
      try {
        final result = await runOfflineInference(query: query);
        _predictiveCache[query] = result;
      } catch (e) {
        debugPrint('Failed to cache query "$query": $e');
      }
    }

    debugPrint('Predictive caching completed');
  }

  /// Warm up cache on app start
  Future<void> warmupCache() async {
    debugPrint('Warming up cache...');

    // Get most frequent queries
    final frequentQueries = _queryFrequency.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    final topQueries = frequentQueries.take(20).map((e) => e.key).toList();

    await predictiveCache(topQueries);

    debugPrint('Cache warmed up with ${topQueries.length} queries');
  }

  /// Clear cache
  void clearCache() {
    _resultCache.clear();
    _predictiveCache.clear();
    debugPrint('Cache cleared');
  }

  /// Get context-aware model
  String getContextAwareModel() {
    // Select model based on context

    // Location-based
    if (_currentPosition != null) {
      final latitude = _currentPosition!.latitude;

      if (latitude > 40 && latitude < 50) {
        // Northern regions - use specific model
        return 'model_north';
      }
    }

    // Time-based
    final hour = DateTime.now().hour;
    if (hour >= 6 && hour < 12) {
      return 'model_morning';
    } else if (hour >= 18 && hour < 22) {
      return 'model_evening';
    }

    // Activity-based
    if (_currentActivity == 'running') {
      return 'model_active';
    } else if (_currentActivity == 'still') {
      return 'model_stationary';
    }

    return 'model_default';
  }

  /// Ensemble prediction with model voting
  Future<EnsemblePrediction> ensemblePredict({
    required Map<String, dynamic> modelPredictions,
    EnsembleStrategy strategy = EnsembleStrategy.weightedVote,
  }) async {
    debugPrint('Running ensemble prediction with ${modelPredictions.length} models');

    try {
      if (strategy == EnsembleStrategy.majorityVote) {
        return _majorityVote(modelPredictions);
      } else if (strategy == EnsembleStrategy.weightedVote) {
        return _weightedVote(modelPredictions);
      } else {
        return _confidenceBasedSelection(modelPredictions);
      }
    } catch (e) {
      debugPrint('Ensemble prediction failed: $e');
      rethrow;
    }
  }

  /// Majority vote ensemble
  EnsemblePrediction _majorityVote(Map<String, dynamic> predictions) {
    final votes = <dynamic, int>{};

    for (final prediction in predictions.values) {
      votes[prediction] = (votes[prediction] ?? 0) + 1;
    }

    final winner = votes.entries.reduce((a, b) => a.value > b.value ? a : b);

    return EnsemblePrediction(
      prediction: winner.key,
      confidence: winner.value / predictions.length,
      modelContributions: predictions,
    );
  }

  /// Weighted vote ensemble
  EnsemblePrediction _weightedVote(Map<String, dynamic> predictions) {
    final scores = <dynamic, double>{};

    for (final entry in predictions.entries) {
      final modelId = entry.key;
      final prediction = entry.value;
      final weight = _modelWeights[modelId] ?? 1.0;

      scores[prediction] = (scores[prediction] ?? 0.0) + weight;
    }

    final winner = scores.entries.reduce((a, b) => a.value > b.value ? a : b);
    final totalWeight = scores.values.reduce((a, b) => a + b);

    return EnsemblePrediction(
      prediction: winner.key,
      confidence: winner.value / totalWeight,
      modelContributions: predictions,
    );
  }

  /// Confidence-based selection
  EnsemblePrediction _confidenceBasedSelection(Map<String, dynamic> predictions) {
    // Assume predictions are maps with 'value' and 'confidence'
    var bestPrediction = predictions.values.first;
    var bestConfidence = 0.0;

    for (final prediction in predictions.values) {
      if (prediction is Map && prediction.containsKey('confidence')) {
        final confidence = prediction['confidence'] as double;
        if (confidence > bestConfidence) {
          bestConfidence = confidence;
          bestPrediction = prediction;
        }
      }
    }

    return EnsemblePrediction(
      prediction: bestPrediction,
      confidence: bestConfidence,
      modelContributions: predictions,
    );
  }

  /// Update model weights based on performance
  void updateModelWeights(String modelId, double performance) {
    _modelWeights[modelId] = performance;
    debugPrint('Updated model weight for $modelId: $performance');
    _saveCachedData();
  }

  /// Get edge analytics
  EdgeAnalytics getAnalytics() {
    final totalInferences = _offlineInferences + _onlineInferences;
    final offlineRate = totalInferences > 0 ? _offlineInferences / totalInferences : 0.0;

    // Calculate cache statistics
    final cacheStats = _resultCache.getStatistics();

    // Get top queries
    final topQueries = _queryFrequency.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return EdgeAnalytics(
      offlineInferences: _offlineInferences,
      onlineInferences: _onlineInferences,
      offlineRate: offlineRate,
      cacheHitRate: cacheStats['hitRate'] as double,
      cacheSizeMB: cacheStats['sizeMB'] as double,
      topQueries: topQueries.take(5).map((e) => TopQuery(query: e.key, count: e.value)).toList(),
      currentActivity: _currentActivity,
      currentLocation: _currentPosition,
    );
  }

  /// Get current context
  EdgeContext getCurrentContext() {
    return EdgeContext(
      location: _currentPosition,
      activity: _currentActivity,
      time: DateTime.now(),
      modelRecommendation: getContextAwareModel(),
    );
  }

  /// Dispose resources
  void dispose() {
    _accelerometerSubscription?.cancel();
    _gyroscopeSubscription?.cancel();
    _database?.close();
    _isInitialized = false;
    debugPrint('EdgeIntelligence disposed');
  }
}

/// Inference cache with LRU eviction
class _InferenceCache {
  final int maxSize;
  final LinkedHashMap<String, dynamic> _cache = LinkedHashMap();
  int _hits = 0;
  int _misses = 0;

  _InferenceCache({required this.maxSize});

  dynamic get(String key) {
    if (_cache.containsKey(key)) {
      _hits++;
      final value = _cache.remove(key);
      _cache[key] = value;
      return value;
    }
    _misses++;
    return null;
  }

  void put(String key, dynamic value) {
    if (_cache.containsKey(key)) {
      _cache.remove(key);
    } else if (_cache.length >= maxSize) {
      _cache.remove(_cache.keys.first);
    }
    _cache[key] = value;
  }

  void clear() {
    _cache.clear();
    _hits = 0;
    _misses = 0;
  }

  Map<String, dynamic> getStatistics() {
    final total = _hits + _misses;
    final hitRate = total > 0 ? _hits / total : 0.0;

    // Rough cache size estimate (1KB per entry)
    final sizeMB = _cache.length * 0.001;

    return {
      'hitRate': hitRate,
      'hits': _hits,
      'misses': _misses,
      'entries': _cache.length,
      'sizeMB': sizeMB,
    };
  }
}

/// Activity sample
class ActivitySample {
  final String activity;
  final double confidence;
  final DateTime timestamp;

  ActivitySample({
    required this.activity,
    required this.confidence,
    required this.timestamp,
  });
}

/// Document match
class DocumentMatch {
  final String documentId;
  final String content;
  final double score;

  DocumentMatch({
    required this.documentId,
    required this.content,
    required this.score,
  });
}

/// Inference result
class InferenceResult {
  final String query;
  final String result;
  final double confidence;
  final List<String> sources;
  final bool isOffline;

  InferenceResult({
    required this.query,
    required this.result,
    required this.confidence,
    required this.sources,
    required this.isOffline,
  });
}

/// Recommendation item
class RecommendationItem {
  final String itemId;
  final double score;

  RecommendationItem({
    required this.itemId,
    required this.score,
  });
}

/// Ensemble strategy
enum EnsembleStrategy {
  majorityVote,
  weightedVote,
  confidenceBasedSelection,
}

/// Ensemble prediction
class EnsemblePrediction {
  final dynamic prediction;
  final double confidence;
  final Map<String, dynamic> modelContributions;

  EnsemblePrediction({
    required this.prediction,
    required this.confidence,
    required this.modelContributions,
  });
}

/// Edge analytics
class EdgeAnalytics {
  final int offlineInferences;
  final int onlineInferences;
  final double offlineRate;
  final double cacheHitRate;
  final double cacheSizeMB;
  final List<TopQuery> topQueries;
  final String currentActivity;
  final Position? currentLocation;

  EdgeAnalytics({
    required this.offlineInferences,
    required this.onlineInferences,
    required this.offlineRate,
    required this.cacheHitRate,
    required this.cacheSizeMB,
    required this.topQueries,
    required this.currentActivity,
    required this.currentLocation,
  });
}

/// Top query
class TopQuery {
  final String query;
  final int count;

  TopQuery({
    required this.query,
    required this.count,
  });
}

/// Edge context
class EdgeContext {
  final Position? location;
  final String activity;
  final DateTime time;
  final String modelRecommendation;

  EdgeContext({
    required this.location,
    required this.activity,
    required this.time,
    required this.modelRecommendation,
  });

  String get locationDescription {
    if (location == null) return 'Unknown';
    return '${location!.latitude.toStringAsFixed(2)}, ${location!.longitude.toStringAsFixed(2)}';
  }

  String get timeOfDay {
    final hour = time.hour;
    if (hour >= 6 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 18) return 'Afternoon';
    if (hour >= 18 && hour < 22) return 'Evening';
    return 'Night';
  }
}
