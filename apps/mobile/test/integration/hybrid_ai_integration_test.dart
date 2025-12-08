import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:upcoach_mobile/core/services/hybrid_ai_service.dart';
import 'package:upcoach_mobile/core/ondevice/on_device_inference_engine.dart';
import 'package:upcoach_mobile/core/ondevice/on_device_llm_state.dart';
import 'package:upcoach_mobile/core/ondevice/on_device_model.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Hybrid AI Integration Tests', () {
    setUp(() {
      SharedPreferences.setMockInitialValues({});
    });

    // Note: Provider tests are skipped because hybridAIServiceProvider
    // creates OnDeviceInferenceEngine which requires native platform channels.
    // These should be run as integration tests on a device.
    group('AI Service Provider Integration', () {
      test('hybridAIServiceProvider creates service correctly', () {
        // This test verifies provider wiring works
        // Requires native platform channel
      }, skip: 'Requires native platform channel (run on device)');

      test('aiStatusProvider returns status map', () {
        // This test reads hybridAIServiceProvider which uses native channels
      }, skip: 'Requires native platform channel (run on device)');
    });

    group('Inference Mode Persistence', () {
      test('inference mode is saved to preferences', () async {
        SharedPreferences.setMockInitialValues({});

        // Test only SharedPreferences persistence - no native engine needed
        final prefs = await SharedPreferences.getInstance();
        await prefs.setInt(
            'hybrid_ai_inference_mode', AIInferenceMode.serverOnly.index);

        final savedMode = prefs.getInt('hybrid_ai_inference_mode');
        expect(savedMode, equals(AIInferenceMode.serverOnly.index));
      });

      test('offline mode setting is saved to preferences', () async {
        SharedPreferences.setMockInitialValues({});

        final prefs = await SharedPreferences.getInstance();
        await prefs.setBool('hybrid_ai_offline_mode', false);

        final savedMode = prefs.getBool('hybrid_ai_offline_mode');
        expect(savedMode, isFalse);
      });
    });

    group('On-Device LLM State Transitions', () {
      test('state transitions from notInstalled to downloading', () {
        final initialState = OnDeviceLlmState.initial();
        expect(initialState.status, equals(OnDeviceModelStatus.notInstalled));

        final downloadingState = initialState.copyWith(
          status: OnDeviceModelStatus.downloading,
          downloadProgress: 0.0,
        );
        expect(
            downloadingState.status, equals(OnDeviceModelStatus.downloading));
      });

      test('state transitions from downloading to ready', () {
        final downloadingState = OnDeviceLlmState(
          enabled: true,
          autoDownload: true,
          status: OnDeviceModelStatus.downloading,
          activeModel: defaultOnDeviceModel,
          downloadProgress: 0.5,
          modelPath: '',
        );

        final readyState = downloadingState.copyWith(
          status: OnDeviceModelStatus.ready,
          downloadProgress: 1.0,
          modelPath: '/path/to/model',
        );

        expect(readyState.status, equals(OnDeviceModelStatus.ready));
        expect(readyState.downloadProgress, equals(1.0));
        expect(readyState.modelPath, isNotEmpty);
      });

      test('state transitions to error on failure', () {
        final downloadingState = OnDeviceLlmState(
          enabled: true,
          autoDownload: true,
          status: OnDeviceModelStatus.downloading,
          activeModel: defaultOnDeviceModel,
          downloadProgress: 0.3,
          modelPath: '',
        );

        final errorState = downloadingState.copyWith(
          status: OnDeviceModelStatus.error,
          lastError: 'Download failed: Network error',
        );

        expect(errorState.status, equals(OnDeviceModelStatus.error));
        expect(errorState.lastError, contains('Network error'));
      });
    });

    group('Inference Backend Selection', () {
      test('InferenceBackend enum has expected values', () {
        expect(InferenceBackend.coreML.name, equals('coreML'));
        expect(InferenceBackend.nnapi.name, equals('nnapi'));
        expect(InferenceBackend.gpu.name, equals('gpu'));
        expect(InferenceBackend.cpu.name, equals('cpu'));
      });
    });

    group('Response Source Tracking', () {
      test('AIResponseSource enum has expected values', () {
        expect(AIResponseSource.server.name, equals('server'));
        expect(AIResponseSource.onDevice.name, equals('onDevice'));
        expect(AIResponseSource.cache.name, equals('cache'));
        expect(AIResponseSource.fallback.name, equals('fallback'));
      });
    });

    group('Configuration Defaults', () {
      test('HybridAIConfig has sensible defaults', () {
        const config = HybridAIConfig();

        // Verify defaults make sense for a coaching app
        expect(config.mode, equals(AIInferenceMode.auto));
        expect(config.serverTimeoutMs, greaterThanOrEqualTo(5000));
        expect(config.onDeviceMaxPromptLength, greaterThan(100));
        expect(config.enableOfflineMode, isTrue);
        expect(config.cacheResponses, isTrue);
      });

      test('InferenceConfig has sensible defaults for coaching', () {
        const config = InferenceConfig();

        // Temperature should allow some creativity
        expect(config.temperature, greaterThan(0.5));
        expect(config.temperature, lessThan(1.0));

        // Max tokens should allow decent responses
        expect(config.maxTokens, greaterThanOrEqualTo(128));

        // Stop sequences should be defined
        expect(config.stopSequences, isNotEmpty);
      });
    });
  });

  group('End-to-End Flow Tests', () {
    test('initial state is correct', () async {
      SharedPreferences.setMockInitialValues({});

      // Test state initialization without native engine
      final state = OnDeviceLlmState.initial();
      expect(state.status, equals(OnDeviceModelStatus.notInstalled));
      expect(state.enabled, isFalse); // Initially disabled until user opts in
      expect(state.autoDownload, isFalse);
    });

    // Note: Tests requiring OnDeviceInferenceEngine are skipped because they
    // need native platform channels which aren't available in unit tests.
    // These should be run as integration tests on a device.
    test('full initialization flow completes without error', () async {
      SharedPreferences.setMockInitialValues({});

      // Test only state initialization - engine tests require native platform
      final state = OnDeviceLlmState.initial();
      expect(state.status, equals(OnDeviceModelStatus.notInstalled));
    }, skip: 'Requires native platform channel (run on device)');

    test('model info retrieval works when not loaded', () async {
      // This test requires native platform channel
      // Skip in unit tests - run as integration test on device
    }, skip: 'Requires native platform channel (run on device)');
  });
}
