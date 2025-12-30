# Phase 25 Week 1: Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### 1. Mobile App Setup (Flutter/Dart)

```dart
// 1. Add dependencies to pubspec.yaml
dependencies:
  tflite_flutter: ^0.10.0
  shared_preferences: ^2.0.0
  path_provider: ^2.0.0
  http: ^0.13.0

// 2. Initialize ML components
import 'package:upcoach/ml/MLModelManager.dart';
import 'package:upcoach/ml/FeatureStore.dart';

Future<void> initializeML() async {
  // Initialize model manager
  await MLModelManager().initialize(
    baseUrl: 'https://api.upcoach.com',
    apiKey: 'your-api-key',
    preloadModels: ['goal_success_predictor'],
  );

  // Initialize feature store
  await FeatureStore().initialize();
}

// 3. Use in your app
class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return FutureBuilder(
      future: initializeML(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.done) {
          return YourMainApp();
        }
        return LoadingScreen();
      },
    );
  }
}
```

### 2. Backend Setup (TypeScript/Node.js)

```typescript
// 1. Import ML services
import { PersonalizationEngine } from './ml/PersonalizationEngine';
import { PredictiveAnalytics } from './ml/PredictiveAnalytics';

// 2. Initialize services
const personalization = new PersonalizationEngine();
const analytics = new PredictiveAnalytics();

// 3. Set up event listeners
personalization.on('recommendations', (data) => {
  console.log(`Generated ${data.recommendations.length} recs for ${data.userId}`);
});

// 4. Use in API routes
app.post('/api/interactions', async (req, res) => {
  await personalization.trackInteraction({
    userId: req.body.userId,
    itemId: req.body.itemId,
    type: req.body.type,
    timestamp: new Date(),
  });
  res.json({ success: true });
});

app.get('/api/recommendations/:userId', async (req, res) => {
  const recs = await personalization.getRecommendations(
    req.params.userId,
    10,
    { excludeViewed: true }
  );
  res.json({ recommendations: recs });
});
```

## 📋 Common Use Cases

### Use Case 1: Predict Goal Success

```dart
// Mobile
final activity = UserActivity(
  userId: 'user123',
  events: userEvents,
  profile: userProfile,
);

final features = await FeatureStore().getFeatureVector(
  ['completion_rate', 'streak_length', 'engagement_score'],
  activity,
);

final prediction = await MLModelManager().runInference(
  modelId: 'goal_success_predictor',
  input: [
    features['completion_rate'] ?? 0,
    features['streak_length'] ?? 0,
    features['engagement_score'] ?? 0,
  ],
);

print('Success probability: ${prediction[0]}');
```

### Use Case 2: Generate Recommendations

```typescript
// Backend
await engine.trackInteraction({
  userId: 'user123',
  itemId: 'goal456',
  type: InteractionType.COMPLETE,
  timestamp: new Date(),
});

const recommendations = await engine.getRecommendations('user123', 10);

recommendations.forEach(rec => {
  console.log(`${rec.itemId}: score=${rec.score}, reasons=${rec.reasons.join(', ')}`);
});
```

### Use Case 3: Identify At-Risk Users

```typescript
// Backend
const userFeatures = {
  engagement_score: 0.2,
  days_since_last_activity: 10,
  completion_rate: 0.3,
  activity_trend: -0.4,
};

const churnPrediction = await analytics.predictChurn(userFeatures);
const risks = await analytics.identifyRiskFactors(userFeatures);

if (churnPrediction.value > 0.7) {
  console.log('HIGH RISK USER');
  console.log('Risk factors:', risks.map(r => r.description));
  // Trigger retention campaign
}
```

### Use Case 4: Real-time User Insights

```dart
// Mobile
final insights = await UserAnalyticsService().getUserInsights('user123');

print('Completion Rate: ${insights['performance']['completionRate']}');
print('Current Streak: ${insights['performance']['currentStreak']}');
print('Engagement Score: ${insights['engagement']['score']}');
print('Badges: ${insights['badges'].join(', ')}');
print('Recommendations: ${insights['recommendations'].join('\n')}');
```

## 🎯 API Reference

### MLModelManager (Dart)

```dart
// Initialize
await MLModelManager().initialize(
  baseUrl: String,
  apiKey: String,
  preloadModels: List<String>?,
);

// Run inference
Future<List<double>> runInference({
  required String modelId,
  required List<double> input,
  Map<String, dynamic>? options,
});

// Get performance stats
Map<String, dynamic> getPerformanceStats(String modelId);

// Update model
Future<void> updateModel(String modelId);

// Clear cache
Future<void> clearCache();
```

### FeatureStore (Dart)

```dart
// Initialize
await FeatureStore().initialize();

// Get single feature
Future<double> getFeature(
  String featureName,
  UserActivity activity,
  {String version = '1.0'}
);

// Get feature vector
Future<Map<String, double>> getFeatureVector(
  List<String> featureNames,
  UserActivity activity,
);

// Invalidate cache
void invalidateFeature(String userId, String featureName, {String version});
void invalidateUserFeatures(String userId);

// Clear all
Future<void> clearCache();
```

### PersonalizationEngine (TypeScript)

```typescript
// Track interaction
async trackInteraction(interaction: UserInteraction): Promise<void>

// Register item
async registerItem(metadata: ItemMetadata): Promise<void>

// Get recommendations
async getRecommendations(
  userId: string,
  limit: number = 10,
  options?: {
    excludeViewed?: boolean;
    itemType?: string;
    algorithm?: string;
  }
): Promise<Recommendation[]>

// Create A/B test
createABTest(config: ABTestConfig): void

// Get user profile
getUserProfile(userId: string): UserProfile | undefined
```

### PredictiveAnalytics (TypeScript)

```typescript
// Predict success
async predictSuccess(features: FeatureVector): Promise<PredictionResult>

// Train success model
async trainSuccessModel(data: TrainingData[]): Promise<ModelMetrics>

// Predict churn
async predictChurn(features: FeatureVector): Promise<PredictionResult>

// Train churn model
async trainChurnModel(
  data: TrainingData[],
  ensembleSize: number = 5
): Promise<ModelMetrics>

// Estimate completion time
async estimateCompletionTime(features: FeatureVector): Promise<PredictionResult>

// Forecast trend
async forecastTrend(
  seriesId: string,
  periods: number = 7
): Promise<{ forecasts: number[]; confidence: number }>

// Identify risk factors
async identifyRiskFactors(features: FeatureVector): Promise<RiskFactor[]>
```

## 🔧 Configuration

### Environment Variables

```bash
# Backend
ML_MODEL_BASE_URL=https://api.upcoach.com
ML_MODEL_API_KEY=your-api-key
ML_CACHE_TTL=3600
ML_ENABLE_AB_TESTING=true

# Model Training
ML_TRAIN_SCHEDULE=0 0 * * 0  # Weekly on Sunday
ML_MIN_TRAINING_SAMPLES=1000
ML_MAX_TRAINING_SAMPLES=100000
```

### Mobile Config

```yaml
# assets/ml_config.yaml
models:
  goal_success_predictor:
    version: "1.0.0"
    preload: true
    platform: auto

features:
  cache_ttl: 3600  # 1 hour
  max_cache_size: 1000

performance:
  max_inference_time: 100  # ms
  max_pool_size: 3
```

## 📊 Monitoring

### Key Metrics to Track

```typescript
// Model Performance
MLModelManager().metricsStream.listen((metrics) => {
  logMetric('ml.inference.latency', metrics.inferenceTime.inMilliseconds);
  logMetric('ml.inference.success', metrics.success ? 1 : 0);
});

// Recommendation Quality
personalization.on('recommendations', (data) => {
  const avgConfidence = data.recommendations
    .reduce((sum, r) => sum + r.confidence, 0) / data.recommendations.length;

  logMetric('ml.recommendations.confidence', avgConfidence);
  logMetric('ml.recommendations.count', data.recommendations.length);
});

// Prediction Accuracy
analytics.on('modelTrained', (data) => {
  logMetric('ml.model.accuracy', data.metrics.accuracy);
  logMetric('ml.model.f1score', data.metrics.f1Score);
});
```

## 🐛 Troubleshooting

### Issue: Model not loading

```dart
// Check model path
final stats = MLModelManager().getPerformanceStats('model_id');
if (stats['totalRuns'] == 0) {
  // Model never ran - check if file exists
  await MLModelManager().updateModel('model_id');
}
```

### Issue: Slow inference

```dart
// Check performance metrics
final stats = MLModelManager().getPerformanceStats('model_id');
print('Average time: ${stats['avgInferenceTime']}ms');
print('P95 time: ${stats['p95InferenceTime']}ms');

// If slow, ensure model is preloaded
await MLModelManager().initialize(
  preloadModels: ['model_id'],  // Add to preload list
);
```

### Issue: Low recommendation quality

```typescript
// Check data quality
const profile = engine.getUserProfile(userId);
console.log('Interactions:', profile.interactionHistory.length);

// Need more data if < 10 interactions
if (profile.interactionHistory.length < 10) {
  // Use popular items instead
  // or encourage more interactions
}
```

## 📚 Further Reading

1. **Implementation Details**: See `PHASE_25_WEEK_1_IMPLEMENTATION.md`
2. **Code Examples**: See `PHASE_25_WEEK_1_EXAMPLES.md`
3. **Architecture**: See `PHASE_25_WEEK_1_ARCHITECTURE.md`
4. **Full Summary**: See `PHASE_25_WEEK_1_SUMMARY.md`

## 🎓 Best Practices

### 1. Feature Engineering
- Invalidate features when underlying data changes
- Use appropriate TTL for different feature types
- Batch compute features when possible

### 2. Model Management
- Preload critical models on app startup
- Monitor inference latency and error rates
- Update models during off-peak hours

### 3. Recommendations
- Track user interactions consistently
- Register all items with proper metadata
- Use A/B testing to optimize algorithms

### 4. Performance
- Cache recommendations with reasonable TTL
- Use interpreter pooling for heavy models
- Profile feature computation times

### 5. Privacy
- Process sensitive data on-device when possible
- Anonymize user IDs in logs
- Allow users to clear ML caches

## ✅ Checklist for Production

- [ ] Dependencies installed and configured
- [ ] ML models downloaded and tested
- [ ] Feature store initialized with user data
- [ ] API endpoints secured with authentication
- [ ] Performance monitoring in place
- [ ] Error alerting configured
- [ ] A/B tests set up (if applicable)
- [ ] Documentation reviewed by team
- [ ] Load testing completed
- [ ] Privacy compliance verified

## 🚦 Quick Health Check

```typescript
// Backend health check
app.get('/health/ml', async (req, res) => {
  const health = {
    personalization: {
      userProfiles: personalization.getUserProfile('test')?.userId ? 'OK' : 'ERROR',
      itemsRegistered: /* count */ ,
    },
    analytics: {
      successModelTrained: /* check */ ,
      churnModelTrained: /* check */ ,
    },
  };

  res.json(health);
});
```

```dart
// Mobile health check
Future<Map<String, dynamic>> checkMLHealth() async {
  final stats = MLModelManager().getPerformanceStats('goal_success_predictor');

  return {
    'modelManager': {
      'initialized': stats['totalRuns'] > 0,
      'avgInferenceTime': stats['avgInferenceTime'],
      'successRate': stats['successRate'],
    },
    'featureStore': {
      'initialized': true,
      'cachedFeatures': /* count */,
    },
  };
}
```

---

**Ready to implement Week 2: Smart Content Recommendations & Adaptive Learning Paths!**
