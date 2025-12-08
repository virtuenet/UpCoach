import 'package:flutter_test/flutter_test.dart';

import 'package:upcoach_mobile/core/services/hybrid_ai_service.dart';
import 'package:upcoach_mobile/core/ondevice/on_device_llm_state.dart';

// Note: Full mock tests are skipped until build_runner generates the mocks file.
// Run `flutter pub run build_runner build` to generate mocks.

void main() {
  // Placeholder group - full tests require mock generation
  group('HybridAIService Tests', skip: true, () {
    test('placeholder test', () {
      expect(true, isTrue);
    });
  });

  group('AIInferenceMode Tests', () {
    test('all inference modes are defined', () {
      expect(AIInferenceMode.values.length, equals(5));
      expect(AIInferenceMode.values, contains(AIInferenceMode.serverOnly));
      expect(AIInferenceMode.values, contains(AIInferenceMode.onDeviceOnly));
      expect(
          AIInferenceMode.values, contains(AIInferenceMode.onDevicePreferred));
      expect(AIInferenceMode.values, contains(AIInferenceMode.serverPreferred));
      expect(AIInferenceMode.values, contains(AIInferenceMode.auto));
    });
  });

  group('AIResponseSource Tests', () {
    test('all response sources are defined', () {
      expect(AIResponseSource.values.length, equals(4));
      expect(AIResponseSource.values, contains(AIResponseSource.server));
      expect(AIResponseSource.values, contains(AIResponseSource.onDevice));
      expect(AIResponseSource.values, contains(AIResponseSource.cache));
      expect(AIResponseSource.values, contains(AIResponseSource.fallback));
    });
  });

  group('HybridAIConfig Tests', () {
    test('default config has correct values', () {
      const config = HybridAIConfig();

      expect(config.mode, equals(AIInferenceMode.auto));
      expect(config.serverTimeoutMs, equals(10000));
      expect(config.onDeviceMaxPromptLength, equals(500));
      expect(config.enableOfflineMode, isTrue);
      expect(config.cacheResponses, isTrue);
    });

    test('custom config values are set correctly', () {
      const config = HybridAIConfig(
        mode: AIInferenceMode.serverOnly,
        serverTimeoutMs: 5000,
        onDeviceMaxPromptLength: 300,
        enableOfflineMode: false,
        cacheResponses: false,
      );

      expect(config.mode, equals(AIInferenceMode.serverOnly));
      expect(config.serverTimeoutMs, equals(5000));
      expect(config.onDeviceMaxPromptLength, equals(300));
      expect(config.enableOfflineMode, isFalse);
      expect(config.cacheResponses, isFalse);
    });
  });

  group('OnDeviceLlmState Tests', () {
    test('initial state has correct default values', () {
      final state = OnDeviceLlmState.initial();

      expect(state.enabled, isFalse);
      expect(state.autoDownload, isFalse);
      expect(state.status, equals(OnDeviceModelStatus.notInstalled));
      expect(state.downloadProgress, equals(0));
      expect(state.modelPath, isEmpty);
      expect(state.lastUpdated, isNull);
      expect(state.lastError, isNull);
      expect(state.lastLatencyMs, isNull);
    });

    test('copyWith updates specific fields', () {
      final state = OnDeviceLlmState.initial();
      final updatedState = state.copyWith(
        enabled: true,
        status: OnDeviceModelStatus.ready,
      );

      expect(updatedState.enabled, isTrue);
      expect(updatedState.status, equals(OnDeviceModelStatus.ready));
      expect(updatedState.autoDownload, isFalse); // Unchanged
    });
  });
}
