# ADR-003: Mobile Platform Integration Strategy

## Status
Accepted - 2024-01-15

## Context

UpCoach's local LLM implementation requires native mobile integration to provide on-device AI processing capabilities. This integration must balance performance, battery life, device compatibility, and user experience across iOS and Android platforms. The solution must work efficiently across a wide range of device capabilities while maintaining quality standards.

### Mobile-Specific Challenges
- **Hardware Constraints**: Limited memory, CPU, and battery capacity
- **Platform Differences**: iOS Core ML vs Android ONNX Runtime ecosystems
- **Model Size Limitations**: App store restrictions and user storage concerns
- **Performance Variability**: Wide range of device capabilities across user base
- **Battery Optimization**: Minimizing impact on device battery life

### Business Requirements
- Support for offline coaching functionality
- Gradual rollout based on device capabilities
- Maintain app performance and user experience
- Enable privacy-focused local processing
- Support for 85%+ of active user devices

## Decision

We will implement **platform-specific native integration** using each platform's optimized AI frameworks with a unified Flutter API layer.

### Core Architecture

```
┌─────────────────────┐
│   Flutter Layer     │ ← Unified Dart API
├─────────────────────┤
│  Platform Channel   │ ← Method channel communication
├─────────────────────┤
│   Native Bridge     │ ← Platform-specific implementations
├──────────┬──────────┤
│ iOS Core │ Android  │
│    ML    │   ONNX   │ ← Native inference engines
└──────────┴──────────┘
```

### Platform-Specific Implementations

#### iOS Implementation: Core ML + Neural Engine

**Technology Stack:**
- **Framework**: Core ML with MLModel format
- **Acceleration**: Neural Engine for A12+ devices, GPU fallback
- **Language**: Swift with Objective-C bridge
- **Model Format**: Quantized Core ML models (.mlmodel)

**Key Features:**
- Neural Engine optimization for A12+ Bionic chips
- Automatic GPU/CPU fallback for older devices
- iOS 14+ optimization APIs
- Memory pressure handling
- Background processing limitations compliance

```swift
class CoreMLLLMService {
    private var model: MLModel?
    private let modelConfiguration = MLModelConfiguration()
    
    func loadModel(modelName: String) async throws -> LoadResult {
        modelConfiguration.computeUnits = .all // Neural Engine + GPU + CPU
        modelConfiguration.allowLowPrecisionAccumulationOnGPU = true
        
        let modelURL = Bundle.main.url(forResource: modelName, withExtension: "mlmodel")!
        self.model = try await MLModel.load(contentsOf: modelURL, configuration: modelConfiguration)
        
        return LoadResult(success: true, memoryUsage: getMemoryUsage())
    }
    
    func generateResponse(prompt: String) async throws -> InferenceResult {
        guard let model = self.model else { throw LLMError.modelNotLoaded }
        
        // Implement tokenization and inference
        let input = try MLDictionaryFeatureProvider(dictionary: ["input_ids": prompt])
        let output = try await model.prediction(from: input)
        
        return InferenceResult(
            content: extractText(from: output),
            latency: measureLatency(),
            energyUsed: measureEnergyUsage()
        )
    }
}
```

#### Android Implementation: ONNX Runtime + NNAPI

**Technology Stack:**
- **Framework**: ONNX Runtime with NNAPI provider
- **Acceleration**: NNAPI for hardware acceleration, GPU fallback
- **Language**: Kotlin with JNI bridge
- **Model Format**: Quantized ONNX models (.onnx)

**Key Features:**
- NNAPI acceleration for compatible devices
- GPU acceleration via OpenCL/Vulkan
- CPU optimization with ARM NEON
- Memory management and thermal monitoring
- Battery optimization APIs integration

```kotlin
class ONNXLLMService {
    private var ortSession: OrtSession? = null
    private val ortEnvironment = OrtEnvironment.getEnvironment()
    
    suspend fun loadModel(modelName: String): LoadResult = withContext(Dispatchers.IO) {
        val sessionOptions = OrtSession.SessionOptions().apply {
            addNnapi() // Enable NNAPI acceleration
            setIntraOpNumThreads(4)
            setInterOpNumThreads(2)
            setOptimizationLevel(OrtSession.SessionOptions.OptLevel.ALL_OPT)
        }
        
        val modelBytes = context.assets.open(modelName).readBytes()
        ortSession = ortEnvironment.createSession(modelBytes, sessionOptions)
        
        return@withContext LoadResult(
            success = true,
            memoryUsage = getMemoryUsage(),
            accelerationUsed = getAccelerationType()
        )
    }
    
    suspend fun generateResponse(prompt: String): InferenceResult = withContext(Dispatchers.Default) {
        val session = ortSession ?: throw IllegalStateException("Model not loaded")
        
        // Tokenization and inference
        val inputTensor = OnnxTensor.createTensorFromArray(ortEnvironment, tokenize(prompt))
        val inputs = mapOf("input_ids" to inputTensor)
        
        val outputs = session.run(inputs)
        val result = processOutput(outputs)
        
        return@withContext InferenceResult(
            content = result,
            latency = measureLatency(),
            energyUsed = estimateEnergyUsage()
        )
    }
}
```

### Flutter Integration Layer

```dart
class LocalLLMService {
    static const MethodChannel _channel = MethodChannel('com.upcoach.local_llm');
    
    Future<bool> initialize() async {
        try {
            final result = await _channel.invokeMethod<bool>('initialize');
            return result ?? false;
        } catch (e) {
            debugPrint('Local LLM initialization failed: $e');
            return false;
        }
    }
    
    Future<LoadResult> loadModel(String modelName, {ModelConfig? config}) async {
        final arguments = {
            'modelName': modelName,
            'config': config?.toMap() ?? {},
        };
        
        final result = await _channel.invokeMethod<Map>('loadModel', arguments);
        return LoadResult.fromMap(Map<String, dynamic>.from(result!));
    }
    
    Stream<String> generateResponseStream(String prompt) async* {
        final completer = Completer<void>();
        late StreamSubscription subscription;
        
        subscription = EventChannel('com.upcoach.local_llm.stream')
            .receiveBroadcastStream({'prompt': prompt})
            .listen(
                (dynamic token) => yield token.toString(),
                onDone: () => completer.complete(),
                onError: (error) => completer.completeError(error),
            );
        
        await completer.future;
        await subscription.cancel();
    }
}
```

### Model Selection Strategy

#### Device Capability Tiers

**Tier 1: High-Performance Devices**
- iOS: iPhone 13+ (A15 Bionic+), iPad Pro M1+
- Android: Snapdragon 8 Gen 1+, Google Tensor G2+
- Model: Phi-2 Quantized (3.8B parameters, ~500MB)
- Expected Performance: 15-25 tokens/sec

**Tier 2: Mid-Range Devices**
- iOS: iPhone 11-12 (A13-A14), iPad Air
- Android: Snapdragon 7-series, MediaTek Dimensity 1000+
- Model: TinyLlama (1.1B parameters, ~250MB)
- Expected Performance: 8-15 tokens/sec

**Tier 3: Legacy/Budget Devices**
- iOS: iPhone XS and older
- Android: Snapdragon 6-series and older
- Model: Cloud-only processing
- Fallback: Hybrid with preference for cloud

#### Dynamic Model Selection

```dart
class DeviceCapabilityAssessment {
    Future<DeviceCapability> assessDevice() async {
        final deviceInfo = await DeviceInfoPlugin().deviceInfo;
        final memoryInfo = await getMemoryInfo();
        final thermalInfo = await getThermalState();
        
        if (Platform.isIOS) {
            return assessiOSDevice(deviceInfo as IosDeviceInfo, memoryInfo);
        } else {
            return assessAndroidDevice(deviceInfo as AndroidDeviceInfo, memoryInfo);
        }
    }
    
    DeviceCapability assessiOSDevice(IosDeviceInfo info, MemoryInfo memory) {
        // A15+ with 6GB+ RAM = Tier 1
        if (isA15OrNewer(info.utsname.machine) && memory.totalRAM >= 6000) {
            return DeviceCapability(
                tier: DeviceTier.highPerformance,
                recommendedModel: 'phi-2-quantized',
                maxTokens: 2048,
                estimatedLatency: 60, // ms per token
            );
        }
        
        // A13-A14 with 4GB+ RAM = Tier 2
        if (isA13OrNewer(info.utsname.machine) && memory.totalRAM >= 4000) {
            return DeviceCapability(
                tier: DeviceTier.midRange,
                recommendedModel: 'tinyllama-optimized',
                maxTokens: 1024,
                estimatedLatency: 100,
            );
        }
        
        // Older devices = Cloud only
        return DeviceCapability(
            tier: DeviceTier.cloudOnly,
            recommendedModel: null,
            maxTokens: 0,
            estimatedLatency: 0,
        );
    }
}
```

### Alternative Integration Approaches Considered

#### Option 1: Flutter Plugin with Shared C++ Library (Rejected)
- **Approach**: Single C++ implementation with Flutter FFI
- **Pros**: Code reuse, consistent behavior across platforms
- **Cons**: Poor platform optimization, complex build system, limited native features
- **Rejection Reason**: Suboptimal performance compared to platform-native solutions

#### Option 2: WebAssembly in WebView (Rejected)
- **Approach**: Run inference in WebView using WASM
- **Pros**: Cross-platform, easier deployment
- **Cons**: Poor performance, no hardware acceleration, large bundle size
- **Rejection Reason**: Performance insufficient for real-time inference

#### Option 3: Server-Sent Events from Local Backend (Rejected)
- **Approach**: Local HTTP server in Flutter app
- **Pros**: API compatibility, easier testing
- **Cons**: Battery drain, security concerns, app store restrictions
- **Rejection Reason**: App store policies and battery impact

#### Option 4: React Native with Native Modules (Rejected)
- **Approach**: Use React Native instead of Flutter
- **Pros**: Rich native module ecosystem
- **Cons**: Migration effort, performance overhead, maintenance complexity
- **Rejection Reason**: Existing Flutter investment and performance requirements

## Consequences

### Positive Consequences

1. **Optimal Performance**
   - Platform-native optimization for each ecosystem
   - Hardware acceleration utilization (Neural Engine, NNAPI)
   - Efficient memory management and battery usage

2. **Device Compatibility**
   - Graceful degradation across device capabilities
   - Automatic fallback for unsupported devices
   - Future-ready for new hardware features

3. **User Experience**
   - Seamless integration with existing Flutter app
   - Offline functionality for privacy-conscious users
   - Responsive performance with streaming capabilities

4. **Maintainability**
   - Clear separation between platform-specific code
   - Unified Dart API for application logic
   - Independent optimization for each platform

### Negative Consequences

1. **Development Complexity**
   - Dual platform implementation and maintenance
   - Platform-specific debugging and optimization
   - Complex build and deployment pipeline

2. **App Size Impact**
   - Model files increase app download size
   - Platform-specific binaries add overhead
   - Potential app store review challenges

3. **Testing Overhead**
   - Device-specific testing requirements
   - Performance validation across hardware variants
   - Battery and thermal impact assessment

4. **Maintenance Burden**
   - Multiple codebases to maintain and update
   - Platform-specific bug fixes and optimizations
   - Model updates and compatibility management

### Risk Mitigation Strategies

1. **Gradual Rollout**
   - Feature flags for controlled deployment
   - Device capability-based enablement
   - A/B testing for performance validation

2. **Performance Monitoring**
   - Real-time latency and battery tracking
   - Crash reporting and error analytics
   - User feedback collection and analysis

3. **Fallback Mechanisms**
   - Automatic cloud fallback for failures
   - Progressive enhancement approach
   - User preference override options

## Implementation Plan

### Phase 1: iOS Core ML Implementation (Weeks 7-10)
- Core ML model integration and optimization
- Flutter plugin development for iOS
- Device capability assessment implementation
- Basic inference and streaming support

### Phase 2: Android ONNX Implementation (Weeks 8-11)
- ONNX Runtime integration with NNAPI
- Android-specific optimizations
- Unified Flutter API completion
- Cross-platform testing framework

### Phase 3: Optimization and Polish (Weeks 12-14)
- Battery usage optimization
- Memory pressure handling
- Performance benchmarking and tuning
- User experience refinements

### Model Distribution Strategy

#### Progressive Download System
```dart
class ModelDownloadManager {
    Future<void> downloadModelIfNeeded(String modelName) async {
        final capability = await deviceCapabilityService.assessDevice();
        
        if (!capability.supportsLocalLLM) return;
        
        final modelInfo = await getModelInfo(modelName);
        final hasSpace = await checkStorageSpace(modelInfo.size);
        
        if (!hasSpace) {
            await showStorageWarning();
            return;
        }
        
        // Download in background with progress updates
        await downloadWithProgress(modelInfo, onProgress: (progress) {
            notifyDownloadProgress(progress);
        });
        
        // Verify integrity and prepare for use
        await verifyAndPrepareModel(modelName);
    }
}
```

#### Cache Management
- Intelligent model caching based on usage patterns
- Automatic cleanup for unused models
- User control over storage usage
- Background downloading during charging

## Performance Targets

### Latency Targets
- **Tier 1 Devices**: <80ms per token (P95)
- **Tier 2 Devices**: <120ms per token (P95)
- **Model Loading**: <30 seconds for any supported model

### Battery Impact Targets
- **Continuous Usage**: <10% battery drain per hour
- **Idle Impact**: <1% additional background drain
- **Thermal Management**: No thermal throttling under normal usage

### Quality Targets
- **Response Relevance**: >85% compared to cloud responses
- **User Satisfaction**: >80% rating for local responses
- **Fallback Rate**: <15% fallback to cloud processing

## Monitoring and Analytics

### Performance Metrics
```dart
class MobilePerformanceTracker {
    void trackInference(InferenceMetrics metrics) {
        analytics.track('mobile_llm_inference', {
            'device_tier': metrics.deviceTier,
            'model_name': metrics.modelName,
            'latency_ms': metrics.latency,
            'tokens_generated': metrics.tokensGenerated,
            'battery_used_mah': metrics.batteryUsed,
            'thermal_state': metrics.thermalState,
            'memory_usage_mb': metrics.memoryUsage,
        });
    }
    
    void trackError(LLMError error) {
        crashlytics.recordError(error, {
            'device_info': deviceInfo.toMap(),
            'model_state': modelManager.getState(),
            'memory_pressure': memoryMonitor.getCurrentPressure(),
        });
    }
}
```

### User Experience Metrics
- Model download completion rates
- Feature adoption by device tier
- User preference patterns (local vs cloud)
- Battery usage satisfaction scores

## Related ADRs

- [ADR-001: Local LLM Technology Choice](ADR-001-local-llm-technology-choice.md)
- [ADR-002: Hybrid Routing Architecture](ADR-002-hybrid-routing-architecture.md)
- [ADR-004: Security Architecture Enhancements](ADR-004-security-architecture-enhancements.md)

## References

- [Core ML Performance Best Practices](https://developer.apple.com/documentation/coreml/core_ml_performance_best_practices)
- [ONNX Runtime Mobile](https://onnxruntime.ai/docs/tutorials/mobile/)
- [Flutter Platform Channels](https://docs.flutter.dev/development/platform-integration/platform-channels)
- [Mobile AI Performance Benchmarks](https://ai-benchmark.com/ranking_smartphones.html)

---

**Decision Date**: 2024-01-15  
**Review Date**: 2024-05-15 (4 months)  
**Decision Maker**: Mobile Team Lead, AI Team Lead, Product Manager  
**Stakeholders**: Mobile Team, AI Team, Product Team, QA Team