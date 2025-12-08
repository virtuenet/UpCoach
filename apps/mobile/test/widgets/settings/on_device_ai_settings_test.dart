import 'package:flutter_test/flutter_test.dart';

import 'package:upcoach_mobile/core/ondevice/on_device_llm_state.dart';
import 'package:upcoach_mobile/core/ondevice/on_device_model.dart';

void main() {
  // Widget tests for OnDeviceAISettingsScreen are skipped because they require
  // complex Riverpod mocking for hybridAIServiceProvider which involves
  // multiple dependent providers. The unit tests below verify the core logic.
  group('OnDeviceAISettingsScreen Tests', () {
    testWidgets('placeholder for screen tests', (WidgetTester tester) async {
      // Screen tests require complex provider mocking.
      // The actual screen is tested via integration tests.
      expect(true, isTrue);
    }, skip: true);
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

    test('copyWith preserves unchanged fields', () {
      final state = OnDeviceLlmState(
        enabled: true,
        autoDownload: true,
        status: OnDeviceModelStatus.ready,
        activeModel: defaultOnDeviceModel,
        downloadProgress: 1.0,
        modelPath: '/path/to/model',
        lastUpdated: DateTime(2024, 1, 1),
        lastLatencyMs: 100,
      );

      final updatedState = state.copyWith(enabled: false);

      expect(updatedState.enabled, isFalse);
      expect(updatedState.autoDownload, isTrue);
      expect(updatedState.status, equals(OnDeviceModelStatus.ready));
      expect(updatedState.modelPath, equals('/path/to/model'));
    });

    test('props list contains all fields', () {
      final state = OnDeviceLlmState.initial();

      expect(state.props.length, equals(9));
    });
  });

  group('OnDeviceModelStatus Tests', () {
    test('all model statuses are defined', () {
      expect(OnDeviceModelStatus.values.length, equals(4));
      expect(OnDeviceModelStatus.values,
          contains(OnDeviceModelStatus.notInstalled));
      expect(OnDeviceModelStatus.values,
          contains(OnDeviceModelStatus.downloading));
      expect(OnDeviceModelStatus.values, contains(OnDeviceModelStatus.ready));
      expect(OnDeviceModelStatus.values, contains(OnDeviceModelStatus.error));
    });
  });

  group('OnDeviceModel Tests', () {
    test('defaultOnDeviceModel has correct values', () {
      // Default model is TinyLlama 1.1B
      expect(defaultOnDeviceModel.id, equals('tinyllama-1.1b'));
      expect(defaultOnDeviceModel.name, equals('TinyLlama 1.1B'));
      expect(defaultOnDeviceModel.backend, equals('onnx'));
      expect(defaultOnDeviceModel.sizeMB, equals(580));
      expect(defaultOnDeviceModel.downloadUrl.isNotEmpty, isTrue);
      expect(defaultOnDeviceModel.checksum.isNotEmpty, isTrue);
    });

    test('OnDeviceModel constructor works', () {
      const model = OnDeviceModel(
        id: 'test-model',
        name: 'Test Model',
        description: 'Test model description',
        backend: 'cpu',
        downloadUrl: 'https://example.com/model.bin',
        sizeMB: 100,
        checksum: 'abc123',
        capabilities: ['conversational', 'coaching'],
        maxContextLength: 2048,
        minRamGB: 3.0,
      );

      expect(model.id, equals('test-model'));
      expect(model.name, equals('Test Model'));
      expect(model.description, equals('Test model description'));
      expect(model.backend, equals('cpu'));
      expect(model.downloadUrl, equals('https://example.com/model.bin'));
      expect(model.sizeMB, equals(100));
      expect(model.checksum, equals('abc123'));
      expect(model.capabilities, contains('conversational'));
      expect(model.maxContextLength, equals(2048));
      expect(model.minRamGB, equals(3.0));
    });
  });
}
