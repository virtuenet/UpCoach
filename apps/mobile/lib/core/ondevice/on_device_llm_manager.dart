import 'dart:async';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path/path.dart' as path;
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'on_device_llm_engine.dart';
import 'on_device_llm_state.dart';

const _prefsEnabledKey = 'on_device_llm_enabled';
const _prefsModelPathKey = 'on_device_llm_model_path';
const _prefsLastUpdatedKey = 'on_device_llm_last_updated';
const _prefsAutoDownloadKey = 'on_device_llm_auto_download';

class OnDeviceLlmManager extends StateNotifier<OnDeviceLlmState> {
  OnDeviceLlmManager(this._dio, this._engine) : super(OnDeviceLlmState.initial()) {
    _hydrate();
  }

  final Dio _dio;
  final OnDeviceLlmEngine _engine;
  CancelToken? _downloadToken;

  Future<void> _hydrate() async {
    final prefs = await SharedPreferences.getInstance();
    final enabled = prefs.getBool(_prefsEnabledKey) ?? false;
    final modelPath = prefs.getString(_prefsModelPathKey) ?? '';
    final autoDownload = prefs.getBool(_prefsAutoDownloadKey) ?? false;
    final lastUpdatedMillis = prefs.getInt(_prefsLastUpdatedKey);

    var status = OnDeviceModelStatus.notInstalled;
    if (modelPath.isNotEmpty && await File(modelPath).exists()) {
      status = OnDeviceModelStatus.ready;
    }

    state = state.copyWith(
      enabled: enabled,
      modelPath: modelPath,
      status: status,
      autoDownload: autoDownload,
      lastUpdated: lastUpdatedMillis != null
          ? DateTime.fromMillisecondsSinceEpoch(lastUpdatedMillis)
          : null,
    );

    if (enabled && autoDownload && status == OnDeviceModelStatus.notInstalled) {
      unawaited(downloadActiveModel());
    }
  }

  Future<void> setEnabled(bool enabled) async {
    state = state.copyWith(enabled: enabled);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_prefsEnabledKey, enabled);
    if (enabled && state.status == OnDeviceModelStatus.notInstalled) {
      await downloadActiveModel();
    }
  }

  Future<void> setAutoDownload(bool enabled) async {
    state = state.copyWith(autoDownload: enabled);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_prefsAutoDownloadKey, enabled);
  }

  Future<void> downloadActiveModel() async {
    if (_downloadToken != null) {
      return;
    }

    try {
      state = state.copyWith(
        status: OnDeviceModelStatus.downloading,
        downloadProgress: 0,
        lastError: null,
      );

      _downloadToken = CancelToken();
      final directory = await getApplicationSupportDirectory();
      final filePath = path.join(directory.path, '${state.activeModel.id}.bin');
      final file = File(filePath);

      // Simulate download to avoid moving massive binaries in dev environments
      const simulatedSize = 5 * 1024 * 1024; // 5 MB
      final sink = file.openWrite();
      const chunkSize = 256 * 1024;
      var written = 0;

      while (written < simulatedSize) {
        if (_downloadToken?.isCancelled ?? false) {
          throw Exception('Download cancelled');
        }
        sink.add(List<int>.filled(chunkSize, 0));
        written += chunkSize;
        final progress = written / simulatedSize;
        state = state.copyWith(downloadProgress: progress.clamp(0, 1));
        await Future.delayed(const Duration(milliseconds: 75));
      }

      await sink.close();

      state = state.copyWith(
        status: OnDeviceModelStatus.ready,
        downloadProgress: 1,
        modelPath: filePath,
        lastUpdated: DateTime.now(),
        lastError: null,
      );

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_prefsModelPathKey, filePath);
      await prefs.setInt(_prefsLastUpdatedKey, DateTime.now().millisecondsSinceEpoch);
    } catch (error) {
      state = state.copyWith(
        status: OnDeviceModelStatus.error,
        lastError: error.toString(),
      );
    } finally {
      _downloadToken = null;
    }
  }

  Future<void> cancelDownload() async {
    _downloadToken?.cancel('User cancelled');
    _downloadToken = null;
    state = state.copyWith(
      status: OnDeviceModelStatus.notInstalled,
      downloadProgress: 0,
    );
  }

  Future<void> removeModel() async {
    try {
      if (state.modelPath.isNotEmpty) {
        final file = File(state.modelPath);
        if (await file.exists()) {
          await file.delete();
        }
      }
    } catch (error) {
      debugPrint('[OnDeviceLlmManager] Failed to delete model: $error');
    } finally {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_prefsModelPathKey);
      await prefs.remove(_prefsLastUpdatedKey);
      state = state.copyWith(
        status: OnDeviceModelStatus.notInstalled,
        downloadProgress: 0,
        modelPath: '',
      );
    }
  }

  Future<String?> maybeGenerate(String prompt) async {
    if (!state.enabled || state.status != OnDeviceModelStatus.ready) {
      return null;
    }
    if (prompt.length > 600) {
      return null;
    }

    try {
      final started = DateTime.now();
      final output = await _engine.generate(prompt);
      final latency = DateTime.now().difference(started).inMilliseconds;
      state = state.copyWith(lastLatencyMs: latency, lastError: null);
      return output;
    } catch (error) {
      state = state.copyWith(
        status: OnDeviceModelStatus.error,
        lastError: error.toString(),
      );
      return null;
    }
  }
}

final onDeviceLlmManagerProvider =
    StateNotifierProvider<OnDeviceLlmManager, OnDeviceLlmState>((ref) {
  final dio = Dio();
  final engine = OnDeviceLlmEngine();
  return OnDeviceLlmManager(dio, engine);
});

