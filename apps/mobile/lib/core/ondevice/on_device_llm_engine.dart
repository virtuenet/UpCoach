import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

class OnDeviceLlmEngine {
  static const MethodChannel _channel = MethodChannel('com.upcoach/on_device_llm');

  Future<String> generate(String prompt, {int maxTokens = 160}) async {
    try {
      final response = await _channel.invokeMethod<String>('generate', {
        'prompt': prompt,
        'maxTokens': maxTokens,
      });

      if (response != null && response.isNotEmpty) {
        return response;
      }
    } on MissingPluginException {
      debugPrint('[OnDeviceLlmEngine] Native plugin missing, falling back to Dart summarizer');
    } catch (error) {
      debugPrint('[OnDeviceLlmEngine] Native inference failed: $error');
    }

    return _fallbackCompletion(prompt, maxTokens: maxTokens);
  }

  String _fallbackCompletion(String prompt, {int maxTokens = 160}) {
    final normalized = prompt.trim();
    if (normalized.isEmpty) {
      return 'On-device assistant is ready. Ask me something concise.';
    }

    final sentences = normalized.split(RegExp(r'(?<=[.!?])\s+'));
    final summaryCount = min(2, sentences.length);
    final summary = sentences.take(summaryCount).join(' ');

    return '✨ Offline insight: ${summary.length > maxTokens ? summary.substring(0, maxTokens).trim() : summary}';
  }
}

