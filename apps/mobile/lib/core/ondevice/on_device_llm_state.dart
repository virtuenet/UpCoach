import 'package:equatable/equatable.dart';

import 'on_device_model.dart';

enum OnDeviceModelStatus {
  notInstalled,
  downloading,
  ready,
  error,
}

class OnDeviceLlmState extends Equatable {
  const OnDeviceLlmState({
    required this.enabled,
    required this.autoDownload,
    required this.status,
    required this.activeModel,
    required this.downloadProgress,
    required this.modelPath,
    this.lastUpdated,
    this.lastError,
    this.lastLatencyMs,
  });

  factory OnDeviceLlmState.initial() => OnDeviceLlmState(
        enabled: false,
        autoDownload: false,
        status: OnDeviceModelStatus.notInstalled,
        activeModel: defaultOnDeviceModel,
        downloadProgress: 0,
        modelPath: '',
      );

  final bool enabled;
  final bool autoDownload;
  final OnDeviceModelStatus status;
  final OnDeviceModel activeModel;
  final double downloadProgress;
  final String modelPath;
  final DateTime? lastUpdated;
  final String? lastError;
  final int? lastLatencyMs;

  OnDeviceLlmState copyWith({
    bool? enabled,
    bool? autoDownload,
    OnDeviceModelStatus? status,
    OnDeviceModel? activeModel,
    double? downloadProgress,
    String? modelPath,
    DateTime? lastUpdated,
    String? lastError,
    int? lastLatencyMs,
  }) {
    return OnDeviceLlmState(
      enabled: enabled ?? this.enabled,
      autoDownload: autoDownload ?? this.autoDownload,
      status: status ?? this.status,
      activeModel: activeModel ?? this.activeModel,
      downloadProgress: downloadProgress ?? this.downloadProgress,
      modelPath: modelPath ?? this.modelPath,
      lastUpdated: lastUpdated ?? this.lastUpdated,
      lastError: lastError,
      lastLatencyMs: lastLatencyMs ?? this.lastLatencyMs,
    );
  }

  @override
  List<Object?> get props => [
        enabled,
        autoDownload,
        status,
        activeModel,
        downloadProgress,
        modelPath,
        lastUpdated,
        lastError,
        lastLatencyMs,
      ];
}
