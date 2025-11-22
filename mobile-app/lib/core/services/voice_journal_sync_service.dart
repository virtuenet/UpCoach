import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:workmanager/workmanager.dart';
import 'package:path/path.dart' as path;
import 'package:crypto/crypto.dart';
import 'package:collection/collection.dart';

import '../../shared/models/voice_journal_entry.dart';
import 'voice_journal_storage_service.dart';
import 'api_service.dart';
import 'auth_service.dart';
import 'offline_service.dart';

/// Conflict resolution strategies for sync operations
enum ConflictResolution {
  lastWriteWins,
  clientWins,
  serverWins,
  merge,
  manual,
}

/// Result of a conflict resolution operation
class ConflictResolutionResult {
  final VoiceJournalEntry resolvedEntry;
  final ConflictResolution strategy;
  final String? mergeNote;

  ConflictResolutionResult({
    required this.resolvedEntry,
    required this.strategy,
    this.mergeNote,
  });
}

/// Sync operation result
class SyncResult {
  final int uploaded;
  final int downloaded;
  final int conflicts;
  final int resolved;
  final int failed;
  final DateTime syncTime;
  final Duration duration;
  final List<String> errors;

  SyncResult({
    required this.uploaded,
    required this.downloaded,
    required this.conflicts,
    required this.resolved,
    required this.failed,
    required this.syncTime,
    required this.duration,
    this.errors = const [],
  });

  bool get isSuccess => failed == 0 && errors.isEmpty;
  
  Map<String, dynamic> toJson() => {
    'uploaded': uploaded,
    'downloaded': downloaded,
    'conflicts': conflicts,
    'resolved': resolved,
    'failed': failed,
    'syncTime': syncTime.toIso8601String(),
    'duration': duration.inMilliseconds,
    'errors': errors,
  };
}

/// Sync state tracking
class SyncState {
  final bool isSyncing;
  final double progress;
  final String? currentOperation;
  final DateTime? lastSyncTime;
  final SyncResult? lastSyncResult;
  final List<SyncConflict> pendingConflicts;
  final bool isBackgroundSyncEnabled;
  final int pendingUploads;
  final int pendingDownloads;

  SyncState({
    this.isSyncing = false,
    this.progress = 0.0,
    this.currentOperation,
    this.lastSyncTime,
    this.lastSyncResult,
    this.pendingConflicts = const [],
    this.isBackgroundSyncEnabled = false,
    this.pendingUploads = 0,
    this.pendingDownloads = 0,
  });

  SyncState copyWith({
    bool? isSyncing,
    double? progress,
    String? currentOperation,
    DateTime? lastSyncTime,
    SyncResult? lastSyncResult,
    List<SyncConflict>? pendingConflicts,
    bool? isBackgroundSyncEnabled,
    int? pendingUploads,
    int? pendingDownloads,
  }) {
    return SyncState(
      isSyncing: isSyncing ?? this.isSyncing,
      progress: progress ?? this.progress,
      currentOperation: currentOperation ?? this.currentOperation,
      lastSyncTime: lastSyncTime ?? this.lastSyncTime,
      lastSyncResult: lastSyncResult ?? this.lastSyncResult,
      pendingConflicts: pendingConflicts ?? this.pendingConflicts,
      isBackgroundSyncEnabled: isBackgroundSyncEnabled ?? this.isBackgroundSyncEnabled,
      pendingUploads: pendingUploads ?? this.pendingUploads,
      pendingDownloads: pendingDownloads ?? this.pendingDownloads,
    );
  }
}

/// Represents a sync conflict
class SyncConflict {
  final String entryId;
  final VoiceJournalEntry localEntry;
  final VoiceJournalEntry remoteEntry;
  final DateTime detectedAt;
  final String reason;

  SyncConflict({
    required this.entryId,
    required this.localEntry,
    required this.remoteEntry,
    required this.detectedAt,
    required this.reason,
  });

  /// Determine if the conflict can be auto-resolved
  bool get canAutoResolve {
    // Check if only metadata differs (not content)
    final localTranscription = localEntry.transcriptionText ?? '';
    final remoteTranscription = remoteEntry.transcriptionText ?? '';
    
    if (localTranscription == remoteTranscription &&
        localEntry.audioFilePath == remoteEntry.audioFilePath) {
      // Content is same, only metadata differs - can auto-resolve
      return true;
    }
    
    // Check if one is clearly newer with no overlapping changes
    final timeDiff = localEntry.updatedAt?.difference(remoteEntry.updatedAt ?? remoteEntry.createdAt).abs();
    if (timeDiff != null && timeDiff.inMinutes > 5) {
      return true; // Clear time difference, can use last-write-wins
    }
    
    return false;
  }
}

/// Voice Journal Cloud Synchronization Service
class VoiceJournalSyncService extends StateNotifier<SyncState> {
  VoiceJournalSyncService(
    this._storageService,
    this._apiService,
    this._authService,
    this._offlineService,
  ) : super(SyncState()) {
    _initialize();
  }

  final VoiceJournalStorageService _storageService;
  final ApiService _apiService;
  final AuthService _authService;
  final OfflineService _offlineService;
  
  static const String _backgroundTaskKey = 'voiceJournalSync';
  static const String _lastSyncKey = 'lastVoiceJournalSync';
  static const Duration _syncInterval = Duration(minutes: 15);
  static const int _batchSize = 10; // Process in batches for efficiency
  
  Timer? _periodicSyncTimer;
  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;
  final _syncLock = <String, bool>{};
  final _uploadQueue = <VoiceJournalEntry>[];
  final _downloadQueue = <String>[];
  
  /// Initialize the sync service
  Future<void> _initialize() async {
    // Restore last sync time
    final lastSyncStr = await _offlineService.getCachedData(_lastSyncKey);
    if (lastSyncStr != null) {
      state = state.copyWith(
        lastSyncTime: DateTime.tryParse(lastSyncStr as String),
      );
    }
    
    // Listen to connectivity changes
    _connectivitySubscription = Connectivity().onConnectivityChanged.listen(
      (results) {
        final isOnline = results.any((result) => result != ConnectivityResult.none);
        if (isOnline && !state.isSyncing) {
          // Network restored, trigger sync
          performSync();
        }
      },
    );
    
    // Check for pending conflicts
    await _checkPendingConflicts();
  }
  
  @override
  void dispose() {
    _periodicSyncTimer?.cancel();
    _connectivitySubscription?.cancel();
    super.dispose();
  }
  
  /// Main sync orchestration method with enhanced error recovery
  Future<SyncResult> performSync({bool force = false}) async {
    if (state.isSyncing && !force) {
      // Return last sync result if sync is already in progress
      return state.lastSyncResult ?? SyncResult(
        uploaded: 0,
        downloaded: 0,
        conflicts: 0,
        resolved: 0,
        failed: 0,
        syncTime: DateTime.now(),
        duration: Duration.zero,
        errors: ['Sync already in progress'],
      );
    }
    
    final stopwatch = Stopwatch()..start();
    state = state.copyWith(
      isSyncing: true,
      progress: 0.0,
      currentOperation: 'Preparing sync...',
    );
    
    int uploaded = 0;
    int downloaded = 0;
    int conflicts = 0;
    int resolved = 0;
    int failed = 0;
    final errors = <String>[];
    
    try {
      // Check authentication with retry
      bool isAuthenticated = await _authService.isAuthenticated();
      if (!isAuthenticated) {
        // Try to refresh authentication
        isAuthenticated = await _authService.refreshToken();
        if (!isAuthenticated) {
          throw Exception('Authentication failed. Please sign in again.');
        }
      }
      
      // Check network connectivity with retry
      bool isOnline = await _isOnline();
      if (!isOnline) {
        // Queue for later sync when online
        await _queueForOfflineSync();
        throw Exception('No network connection. Changes will sync when online.');
      }
      
      // Phase 1: Upload local changes
      state = state.copyWith(
        progress: 0.2,
        currentOperation: 'Uploading local changes...',
      );
      final uploadResult = await _uploadLocalChanges();
      uploaded = uploadResult['uploaded'] ?? 0;
      failed += uploadResult['failed'] ?? 0;
      errors.addAll((uploadResult['errors'] as List<String>?) ?? []);
      
      // Phase 2: Download remote changes
      state = state.copyWith(
        progress: 0.4,
        currentOperation: 'Downloading remote changes...',
      );
      final downloadResult = await _downloadRemoteChanges();
      downloaded = downloadResult['downloaded'] ?? 0;
      conflicts += downloadResult['conflicts'] ?? 0;
      
      // Phase 3: Resolve conflicts
      if (conflicts > 0) {
        state = state.copyWith(
          progress: 0.6,
          currentOperation: 'Resolving conflicts...',
        );
        final resolveResult = await _resolveConflicts();
        resolved = resolveResult['resolved'] ?? 0;
        failed += resolveResult['failed'] ?? 0;
      }
      
      // Phase 4: Sync audio files
      state = state.copyWith(
        progress: 0.8,
        currentOperation: 'Syncing audio files...',
      );
      await _syncAudioFiles();
      
      // Phase 5: Update sync metadata
      state = state.copyWith(
        progress: 0.9,
        currentOperation: 'Finalizing sync...',
      );
      await _updateSyncMetadata();
      
      // Save last sync time
      final syncTime = DateTime.now();
      await _offlineService.cacheData(_lastSyncKey, syncTime.toIso8601String());
      
      final result = SyncResult(
        uploaded: uploaded,
        downloaded: downloaded,
        conflicts: conflicts,
        resolved: resolved,
        failed: failed,
        syncTime: syncTime,
        duration: stopwatch.elapsed,
        errors: errors,
      );
      
      state = state.copyWith(
        isSyncing: false,
        progress: 1.0,
        currentOperation: null,
        lastSyncTime: syncTime,
        lastSyncResult: result,
        pendingUploads: 0,
        pendingDownloads: 0,
      );
      
      return result;
      
    } catch (e) {
      errors.add(e.toString());
      
      final result = SyncResult(
        uploaded: uploaded,
        downloaded: downloaded,
        conflicts: conflicts,
        resolved: resolved,
        failed: failed + 1,
        syncTime: DateTime.now(),
        duration: stopwatch.elapsed,
        errors: errors,
      );
      
      state = state.copyWith(
        isSyncing: false,
        progress: 0.0,
        currentOperation: null,
        lastSyncResult: result,
      );
      
      throw Exception('Sync failed: ${e.toString()}');
    }
  }
  
  /// Upload local changes to cloud
  Future<Map<String, dynamic>> _uploadLocalChanges() async {
    int uploaded = 0;
    int failed = 0;
    final errors = <String>[];
    
    try {
      // Get entries modified since last sync
      final lastSync = state.lastSyncTime ?? DateTime(2000);
      final modifiedEntries = await _storageService.getModifiedEntries(lastSync);
      
      if (modifiedEntries.isEmpty) {
        return {'uploaded': 0, 'failed': 0, 'errors': []};
      }
      
      state = state.copyWith(pendingUploads: modifiedEntries.length);
      
      // Process in batches
      for (int i = 0; i < modifiedEntries.length; i += _batchSize) {
        final batch = modifiedEntries.skip(i).take(_batchSize).toList();
        
        // Update progress
        final batchProgress = (i + batch.length) / modifiedEntries.length;
        state = state.copyWith(
          progress: 0.2 + (batchProgress * 0.2),
          currentOperation: 'Uploading batch ${(i ~/ _batchSize) + 1}...',
        );
        
        // Upload batch
        final batchResult = await _uploadBatch(batch);
        uploaded += batchResult['uploaded'] ?? 0;
        failed += batchResult['failed'] ?? 0;
        errors.addAll((batchResult['errors'] as List<String>?) ?? []);
        
        // Add delay between batches to avoid overwhelming server
        if (i + _batchSize < modifiedEntries.length) {
          await Future.delayed(const Duration(milliseconds: 500));
        }
      }
      
    } catch (e) {
      errors.add('Upload failed: ${e.toString()}');
      failed++;
    }
    
    return {
      'uploaded': uploaded,
      'failed': failed,
      'errors': errors,
    };
  }
  
  /// Upload a batch of entries
  Future<Map<String, dynamic>> _uploadBatch(List<VoiceJournalEntry> entries) async {
    int uploaded = 0;
    int failed = 0;
    final errors = <String>[];
    
    for (final entry in entries) {
      try {
        // Check if entry is already being synced
        if (_syncLock[entry.id] == true) {
          continue;
        }
        _syncLock[entry.id] = true;
        
        // Prepare entry data for upload
        final entryData = _prepareEntryForUpload(entry);
        
        // Upload entry metadata
        final response = await _apiService.post(
          '/api/voice-journal/entries',
          data: entryData,
        );
        
        if (response.statusCode == 200 || response.statusCode == 201) {
          // Upload audio file if needed
          if (entry.audioFilePath.isNotEmpty && !entry.isSyncedToCloud) {
            await _uploadAudioFile(entry.id, entry.audioFilePath);
          }
          
          // Mark as synced
          final updatedEntry = entry.copyWith(
            isSyncedToCloud: true,
            lastSyncedAt: DateTime.now(),
            cloudUrl: response.data['cloudUrl'] ?? '',
          );
          await _storageService.updateEntry(updatedEntry);
          
          uploaded++;
        } else {
          failed++;
          errors.add('Failed to upload ${entry.id}: ${response.statusMessage}');
        }
        
      } catch (e) {
        failed++;
        errors.add('Error uploading ${entry.id}: ${e.toString()}');
      } finally {
        _syncLock.remove(entry.id);
      }
    }
    
    return {
      'uploaded': uploaded,
      'failed': failed,
      'errors': errors,
    };
  }
  
  /// Download remote changes from cloud
  Future<Map<String, dynamic>> _downloadRemoteChanges() async {
    int downloaded = 0;
    int conflicts = 0;
    
    try {
      // Get remote entries modified since last sync
      final lastSync = state.lastSyncTime ?? DateTime(2000);
      final response = await _apiService.get(
        '/api/voice-journal/entries',
        queryParameters: {
          'modifiedSince': lastSync.toIso8601String(),
          'userId': await _authService.getCurrentUserId(),
        },
      );
      
      if (response.statusCode != 200) {
        throw Exception('Failed to fetch remote entries: ${response.statusMessage}');
      }
      
      final remoteEntries = (response.data['entries'] as List)
          .map((json) => VoiceJournalEntry.fromJson(json))
          .toList();
      
      if (remoteEntries.isEmpty) {
        return {'downloaded': 0, 'conflicts': 0};
      }
      
      state = state.copyWith(pendingDownloads: remoteEntries.length);
      
      // Process each remote entry
      for (final remoteEntry in remoteEntries) {
        final localEntry = await _storageService.getEntry(remoteEntry.id);
        
        if (localEntry == null) {
          // New entry from cloud
          await _downloadAndSaveEntry(remoteEntry);
          downloaded++;
        } else {
          // Check for conflicts
          final conflict = await _detectConflict(localEntry, remoteEntry);
          if (conflict != null) {
            conflicts++;
            state = state.copyWith(
              pendingConflicts: [...state.pendingConflicts, conflict],
            );
          } else {
            // No conflict, update local entry
            await _storageService.updateEntry(remoteEntry);
            downloaded++;
          }
        }
      }
      
    } catch (e) {
      throw Exception('Download failed: ${e.toString()}');
    }
    
    return {
      'downloaded': downloaded,
      'conflicts': conflicts,
    };
  }
  
  /// Detect conflict between local and remote entries
  Future<SyncConflict?> _detectConflict(
    VoiceJournalEntry localEntry,
    VoiceJournalEntry remoteEntry,
  ) async {
    // No conflict if entries are identical
    if (_entriesAreIdentical(localEntry, remoteEntry)) {
      return null;
    }
    
    // No conflict if remote is clearly newer and local hasn't been modified
    final localModified = localEntry.updatedAt ?? localEntry.createdAt;
    final remoteModified = remoteEntry.updatedAt ?? remoteEntry.createdAt;
    
    if (remoteModified.isAfter(localModified) && 
        localEntry.lastSyncedAt != null &&
        !localModified.isAfter(localEntry.lastSyncedAt!)) {
      return null; // Remote is newer and local hasn't changed since last sync
    }
    
    // Check for actual content differences
    final hasContentDifference = 
        localEntry.transcriptionText != remoteEntry.transcriptionText ||
        localEntry.summary != remoteEntry.summary ||
        localEntry.tags.join(',') != remoteEntry.tags.join(',');
    
    if (!hasContentDifference) {
      // Only metadata differs, can be auto-merged
      return null;
    }
    
    // We have a conflict
    return SyncConflict(
      entryId: localEntry.id,
      localEntry: localEntry,
      remoteEntry: remoteEntry,
      detectedAt: DateTime.now(),
      reason: _determineConflictReason(localEntry, remoteEntry),
    );
  }
  
  /// Resolve sync conflicts
  Future<Map<String, dynamic>> _resolveConflicts() async {
    int resolved = 0;
    int failed = 0;
    
    final conflicts = [...state.pendingConflicts];
    final remainingConflicts = <SyncConflict>[];
    
    for (final conflict in conflicts) {
      try {
        if (conflict.canAutoResolve) {
          // Auto-resolve using appropriate strategy
          final resolution = await _autoResolveConflict(conflict);
          await _applyConflictResolution(resolution);
          resolved++;
        } else {
          // Keep for manual resolution
          remainingConflicts.add(conflict);
        }
      } catch (e) {
        failed++;
        print('Failed to resolve conflict for ${conflict.entryId}: $e');
      }
    }
    
    state = state.copyWith(pendingConflicts: remainingConflicts);
    
    return {
      'resolved': resolved,
      'failed': failed,
    };
  }
  
  /// Auto-resolve a conflict
  Future<ConflictResolutionResult> _autoResolveConflict(SyncConflict conflict) async {
    // Determine best strategy based on conflict characteristics
    ConflictResolution strategy;
    VoiceJournalEntry resolvedEntry;
    String? mergeNote;
    
    final localModified = conflict.localEntry.updatedAt ?? conflict.localEntry.createdAt;
    final remoteModified = conflict.remoteEntry.updatedAt ?? conflict.remoteEntry.createdAt;
    
    if (conflict.localEntry.transcriptionText == conflict.remoteEntry.transcriptionText) {
      // Content is same, merge metadata
      strategy = ConflictResolution.merge;
      resolvedEntry = _mergeEntries(conflict.localEntry, conflict.remoteEntry);
      mergeNote = 'Auto-merged: content identical, combined metadata';
    } else if (remoteModified.isAfter(localModified.add(const Duration(minutes: 5)))) {
      // Remote is significantly newer
      strategy = ConflictResolution.serverWins;
      resolvedEntry = conflict.remoteEntry;
      mergeNote = 'Server version used: newer by ${remoteModified.difference(localModified).inMinutes} minutes';
    } else if (localModified.isAfter(remoteModified.add(const Duration(minutes: 5)))) {
      // Local is significantly newer
      strategy = ConflictResolution.clientWins;
      resolvedEntry = conflict.localEntry;
      mergeNote = 'Local version used: newer by ${localModified.difference(remoteModified).inMinutes} minutes';
    } else {
      // Default to last-write-wins
      strategy = ConflictResolution.lastWriteWins;
      resolvedEntry = localModified.isAfter(remoteModified) 
          ? conflict.localEntry 
          : conflict.remoteEntry;
      mergeNote = 'Last-write-wins: ${localModified.isAfter(remoteModified) ? "local" : "remote"} version';
    }
    
    return ConflictResolutionResult(
      resolvedEntry: resolvedEntry,
      strategy: strategy,
      mergeNote: mergeNote,
    );
  }
  
  /// Manually resolve a conflict (called from UI)
  Future<void> resolveConflictManually(
    String entryId,
    ConflictResolution strategy, {
    VoiceJournalEntry? customResolution,
  }) async {
    final conflictIndex = state.pendingConflicts.indexWhere(
      (c) => c.entryId == entryId,
    );
    
    if (conflictIndex == -1) {
      throw Exception('Conflict not found for entry $entryId');
    }
    
    final conflict = state.pendingConflicts[conflictIndex];
    VoiceJournalEntry resolvedEntry;
    
    switch (strategy) {
      case ConflictResolution.clientWins:
        resolvedEntry = conflict.localEntry;
        break;
      case ConflictResolution.serverWins:
        resolvedEntry = conflict.remoteEntry;
        break;
      case ConflictResolution.merge:
        resolvedEntry = _mergeEntries(conflict.localEntry, conflict.remoteEntry);
        break;
      case ConflictResolution.manual:
        if (customResolution == null) {
          throw Exception('Custom resolution required for manual strategy');
        }
        resolvedEntry = customResolution;
        break;
      default:
        resolvedEntry = conflict.localEntry;
    }
    
    final resolution = ConflictResolutionResult(
      resolvedEntry: resolvedEntry,
      strategy: strategy,
      mergeNote: 'Manually resolved by user',
    );
    
    await _applyConflictResolution(resolution);
    
    // Remove from pending conflicts
    final updatedConflicts = [...state.pendingConflicts];
    updatedConflicts.removeAt(conflictIndex);
    state = state.copyWith(pendingConflicts: updatedConflicts);
  }
  
  /// Apply conflict resolution
  Future<void> _applyConflictResolution(ConflictResolutionResult resolution) async {
    // Save resolved entry locally
    await _storageService.updateEntry(resolution.resolvedEntry);
    
    // Upload resolved entry to server
    await _apiService.put(
      '/api/voice-journal/entries/${resolution.resolvedEntry.id}',
      data: _prepareEntryForUpload(resolution.resolvedEntry),
    );
    
    // Log resolution for audit
    print('Conflict resolved for ${resolution.resolvedEntry.id}: ${resolution.strategy} - ${resolution.mergeNote}');
  }
  
  /// Sync audio files
  Future<void> _syncAudioFiles() async {
    // Get entries with audio that need syncing
    final entries = await _storageService.loadEntries();
    final needsAudioSync = entries.where((e) => 
      e.audioFilePath.isNotEmpty && 
      !e.isSyncedToCloud &&
      e.cloudUrl.isEmpty
    ).toList();
    
    for (final entry in needsAudioSync) {
      try {
        await _uploadAudioFile(entry.id, entry.audioFilePath);
        
        // Update entry with cloud URL
        final updatedEntry = entry.copyWith(
          isSyncedToCloud: true,
          cloudUrl: 'cloud://voice-journal/${entry.id}/audio',
          lastSyncedAt: DateTime.now(),
        );
        await _storageService.updateEntry(updatedEntry);
        
      } catch (e) {
        print('Failed to sync audio for ${entry.id}: $e');
      }
    }
  }
  
  /// Upload audio file to cloud storage with chunked upload for large files
  Future<void> _uploadAudioFile(String entryId, String filePath) async {
    final file = File(filePath);
    if (!await file.exists()) {
      throw Exception('Audio file not found: $filePath');
    }
    
    final fileSize = await file.length();
    const maxDirectUploadSize = 5 * 1024 * 1024; // 5MB
    
    try {
      if (fileSize <= maxDirectUploadSize) {
        // Direct upload for small files
        await _directUploadAudio(entryId, filePath, file);
      } else {
        // Chunked upload for large files
        await _chunkedUploadAudio(entryId, filePath, file, fileSize);
      }
    } catch (e) {
      // Retry with exponential backoff
      for (int retry = 0; retry < 3; retry++) {
        await Future.delayed(Duration(seconds: (retry + 1) * 2));
        try {
          if (fileSize <= maxDirectUploadSize) {
            await _directUploadAudio(entryId, filePath, file);
          } else {
            await _chunkedUploadAudio(entryId, filePath, file, fileSize);
          }
          return; // Success
        } catch (retryError) {
          if (retry == 2) {
            throw Exception('Failed to upload audio after 3 attempts: $retryError');
          }
        }
      }
    }
  }
  
  /// Direct upload for small audio files
  Future<void> _directUploadAudio(String entryId, String filePath, File file) async {
    final formData = FormData.fromMap({
      'entryId': entryId,
      'audio': await MultipartFile.fromFile(
        filePath,
        filename: path.basename(filePath),
      ),
    });
    
    final response = await _apiService.post(
      '/api/voice-journal/upload-audio',
      data: formData,
      options: Options(
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onSendProgress: (sent, total) {
          final progress = sent / total;
          state = state.copyWith(
            currentOperation: 'Uploading audio: ${(progress * 100).toStringAsFixed(1)}%',
          );
        },
      ),
    );
    
    if (response.statusCode != 200 && response.statusCode != 201) {
      throw Exception('Failed to upload audio: ${response.statusMessage}');
    }
  }
  
  /// Chunked upload for large audio files
  Future<void> _chunkedUploadAudio(String entryId, String filePath, File file, int fileSize) async {
    const chunkSize = 1024 * 1024; // 1MB chunks
    final totalChunks = (fileSize / chunkSize).ceil();
    
    // Initialize chunked upload session
    final initResponse = await _apiService.post(
      '/api/voice-journal/upload-audio/init',
      data: {
        'entryId': entryId,
        'fileName': path.basename(filePath),
        'fileSize': fileSize,
        'totalChunks': totalChunks,
      },
    );
    
    final uploadId = initResponse.data['uploadId'];
    
    // Upload chunks
    for (int i = 0; i < totalChunks; i++) {
      final start = i * chunkSize;
      final end = ((i + 1) * chunkSize).clamp(0, fileSize);
      final chunk = await file.openRead(start, end).toList();
      final chunkData = chunk.expand((x) => x).toList();
      
      final formData = FormData.fromMap({
        'uploadId': uploadId,
        'chunkIndex': i,
        'chunk': MultipartFile.fromBytes(
          chunkData,
          filename: '${path.basename(filePath)}.part$i',
        ),
      });
      
      await _apiService.post(
        '/api/voice-journal/upload-audio/chunk',
        data: formData,
        options: Options(
          headers: {'Content-Type': 'multipart/form-data'},
        ),
      );
      
      state = state.copyWith(
        currentOperation: 'Uploading audio: ${((i + 1) / totalChunks * 100).toStringAsFixed(1)}%',
      );
    }
    
    // Finalize upload
    await _apiService.post(
      '/api/voice-journal/upload-audio/complete',
      data: {
        'uploadId': uploadId,
        'entryId': entryId,
      },
    );
  }
  
  /// Download and save entry from cloud
  Future<void> _downloadAndSaveEntry(VoiceJournalEntry remoteEntry) async {
    // Download audio file if needed
    if (remoteEntry.cloudUrl.isNotEmpty && remoteEntry.audioFilePath.isEmpty) {
      final localPath = await _downloadAudioFile(
        remoteEntry.id,
        remoteEntry.cloudUrl,
      );
      
      // Update entry with local path
      final updatedEntry = remoteEntry.copyWith(
        audioFilePath: localPath,
        isSyncedToCloud: true,
        lastSyncedAt: DateTime.now(),
      );
      
      await _storageService.saveEntry(updatedEntry);
    } else {
      await _storageService.saveEntry(remoteEntry);
    }
  }
  
  /// Download audio file from cloud
  Future<String> _downloadAudioFile(String entryId, String cloudUrl) async {
    final response = await _apiService.get(
      '/api/voice-journal/download-audio/$entryId',
      options: Options(
        responseType: ResponseType.bytes,
      ),
    );
    
    if (response.statusCode != 200) {
      throw Exception('Failed to download audio: ${response.statusMessage}');
    }
    
    // Save to local storage
    final documentsDir = await _getDocumentsDirectory();
    final localPath = path.join(
      documentsDir.path,
      'voice_journal_${entryId}_${DateTime.now().millisecondsSinceEpoch}.m4a',
    );
    
    final file = File(localPath);
    await file.writeAsBytes(response.data);
    
    return localPath;
  }
  
  /// Update sync metadata
  Future<void> _updateSyncMetadata() async {
    // Update server with sync timestamp
    await _apiService.post(
      '/api/voice-journal/sync-metadata',
      data: {
        'lastSync': DateTime.now().toIso8601String(),
        'deviceId': await _getDeviceId(),
        'syncVersion': '1.0.0',
      },
    );
  }
  
  /// Schedule periodic background sync
  void schedulePeriodicSync({Duration interval = _syncInterval}) {
    _periodicSyncTimer?.cancel();
    
    if (!state.isBackgroundSyncEnabled) {
      return;
    }
    
    _periodicSyncTimer = Timer.periodic(interval, (_) async {
      if (!state.isSyncing) {
        try {
          await performSync();
        } catch (e) {
          print('Background sync failed: $e');
        }
      }
    });
    
    // Register background task for iOS/Android
    _registerBackgroundTask();
  }
  
  /// Register background task for native platforms
  Future<void> _registerBackgroundTask() async {
    await Workmanager().registerPeriodicTask(
      _backgroundTaskKey,
      _backgroundTaskKey,
      frequency: _syncInterval,
      constraints: Constraints(
        networkType: NetworkType.connected,
        requiresBatteryNotLow: true,
      ),
    );
  }
  
  /// Cancel background sync
  Future<void> cancelBackgroundSync() async {
    _periodicSyncTimer?.cancel();
    await Workmanager().cancelByUniqueName(_backgroundTaskKey);
    
    state = state.copyWith(isBackgroundSyncEnabled: false);
  }
  
  /// Enable background sync
  Future<void> enableBackgroundSync() async {
    state = state.copyWith(isBackgroundSyncEnabled: true);
    schedulePeriodicSync();
  }
  
  /// Show conflict resolution dialog (returns resolution choice)
  Future<ConflictResolution?> showConflictResolutionDialog(
    BuildContext context,
    SyncConflict conflict,
  ) async {
    return showDialog<ConflictResolution>(
      context: context,
      barrierDismissible: false,
      builder: (context) => _ConflictResolutionDialog(conflict: conflict),
    );
  }
  
  /// Check for pending conflicts on startup
  Future<void> _checkPendingConflicts() async {
    // This would typically load from persistent storage
    // For now, we'll just clear any stale conflicts
    state = state.copyWith(pendingConflicts: []);
  }
  
  // Helper methods
  
  /// Prepare entry for upload (remove local-only fields)
  Map<String, dynamic> _prepareEntryForUpload(VoiceJournalEntry entry) {
    final json = entry.toJson();
    
    // Remove local-only fields
    json.remove('audioFilePath'); // Don't send local path
    json.remove('thumbnailPath'); // Don't send local thumbnail path
    
    // Add sync metadata
    json['deviceId'] = _getDeviceId();
    json['syncVersion'] = '1.0.0';
    
    return json;
  }
  
  /// Check if two entries are identical
  bool _entriesAreIdentical(VoiceJournalEntry a, VoiceJournalEntry b) {
    return a.id == b.id &&
           a.title == b.title &&
           a.transcriptionText == b.transcriptionText &&
           a.summary == b.summary &&
           a.emotionalTone == b.emotionalTone &&
           const ListEquality().equals(a.tags, b.tags) &&
           a.isFavorite == b.isFavorite;
  }
  
  /// Merge two entries (combine metadata)
  VoiceJournalEntry _mergeEntries(
    VoiceJournalEntry local,
    VoiceJournalEntry remote,
  ) {
    // Take the most recent content
    final useLocal = (local.updatedAt ?? local.createdAt)
        .isAfter(remote.updatedAt ?? remote.createdAt);
    
    final base = useLocal ? local : remote;
    final other = useLocal ? remote : local;
    
    // Merge tags (union)
    final mergedTags = {...base.tags, ...other.tags}.toList();
    
    // Merge analysis results
    final mergedAnalysis = <String, dynamic>{};
    if (base.analysisResults != null) {
      mergedAnalysis.addAll(base.analysisResults!);
    }
    if (other.analysisResults != null) {
      mergedAnalysis.addAll(other.analysisResults!);
    }
    
    // Use the most complete transcription
    final transcription = (base.transcriptionText?.length ?? 0) > 
                         (other.transcriptionText?.length ?? 0)
        ? base.transcriptionText
        : other.transcriptionText;
    
    return base.copyWith(
      transcriptionText: transcription,
      tags: mergedTags,
      analysisResults: mergedAnalysis.isNotEmpty ? mergedAnalysis : null,
      isFavorite: base.isFavorite || other.isFavorite,
      isTranscribed: base.isTranscribed || other.isTranscribed,
      isAnalyzed: base.isAnalyzed || other.isAnalyzed,
      updatedAt: DateTime.now(),
    );
  }
  
  /// Determine conflict reason
  String _determineConflictReason(
    VoiceJournalEntry local,
    VoiceJournalEntry remote,
  ) {
    if (local.transcriptionText != remote.transcriptionText) {
      return 'Different transcriptions';
    }
    if (local.summary != remote.summary) {
      return 'Different summaries';
    }
    if (!const ListEquality().equals(local.tags, remote.tags)) {
      return 'Different tags';
    }
    if (local.isFavorite != remote.isFavorite) {
      return 'Different favorite status';
    }
    return 'Metadata differences';
  }
  
  /// Check network connectivity with quality assessment
  Future<bool> _isOnline() async {
    try {
      final connectivityResult = await Connectivity().checkConnectivity();
      final hasConnection = connectivityResult.any((result) => result != ConnectivityResult.none);
      
      if (!hasConnection) return false;
      
      // Perform actual connectivity test
      try {
        final response = await _apiService.get(
          '/api/health',
          options: Options(
            sendTimeout: const Duration(seconds: 5),
            receiveTimeout: const Duration(seconds: 5),
          ),
        );
        return response.statusCode == 200;
      } catch (e) {
        return false;
      }
    } catch (e) {
      return false;
    }
  }
  
  /// Queue entries for offline sync
  Future<void> _queueForOfflineSync() async {
    final lastSync = state.lastSyncTime ?? DateTime(2000);
    final modifiedEntries = await _storageService.getModifiedEntries(lastSync);
    
    for (final entry in modifiedEntries) {
      if (!_uploadQueue.contains(entry)) {
        _uploadQueue.add(entry);
      }
    }
    
    state = state.copyWith(
      pendingUploads: _uploadQueue.length,
    );
    
    // Save queue to persistent storage
    await _offlineService.cacheData(
      'syncQueue',
      _uploadQueue.map((e) => e.id).toList(),
    );
  }
  
  /// Process offline sync queue when connection is restored
  Future<void> _processOfflineQueue() async {
    if (_uploadQueue.isEmpty) return;
    
    final batchSize = 5;
    final batches = <List<VoiceJournalEntry>>[];
    
    for (int i = 0; i < _uploadQueue.length; i += batchSize) {
      batches.add(
        _uploadQueue.skip(i).take(batchSize).toList(),
      );
    }
    
    for (final batch in batches) {
      await _uploadBatch(batch);
      
      // Remove processed items from queue
      for (final entry in batch) {
        _uploadQueue.remove(entry);
      }
      
      state = state.copyWith(
        pendingUploads: _uploadQueue.length,
      );
    }
    
    // Clear queue from persistent storage
    await _offlineService.removeCache('syncQueue');
  }
  
  /// Get device ID for sync tracking
  Future<String> _getDeviceId() async {
    // This would use device_info_plus or similar
    // For now, return a placeholder
    return 'device_${DateTime.now().millisecondsSinceEpoch}';
  }
  
  /// Get documents directory
  Future<String> _getDocumentsDirectory() async {
    // This would use path_provider
    // For now, return a placeholder
    return '/documents';
  }
  
  /// Get current sync state
  SyncState get syncState => state;
  
  /// Check if sync is needed
  Future<bool> isSyncNeeded() async {
    final lastSync = state.lastSyncTime;
    if (lastSync == null) return true;
    
    // Check if any entries modified since last sync
    final modifiedEntries = await _storageService.getModifiedEntries(lastSync);
    return modifiedEntries.isNotEmpty;
  }
  
  /// Get sync statistics
  Map<String, dynamic> getSyncStatistics() {
    return {
      'lastSyncTime': state.lastSyncTime?.toIso8601String(),
      'pendingConflicts': state.pendingConflicts.length,
      'pendingUploads': state.pendingUploads,
      'pendingDownloads': state.pendingDownloads,
      'isBackgroundSyncEnabled': state.isBackgroundSyncEnabled,
      'lastSyncResult': state.lastSyncResult?.toJson(),
    };
  }
}

/// Conflict Resolution Dialog Widget
class _ConflictResolutionDialog extends StatelessWidget {
  final SyncConflict conflict;
  
  const _ConflictResolutionDialog({required this.conflict});
  
  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Sync Conflict Detected'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Entry: ${conflict.localEntry.title}',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Text('Reason: ${conflict.reason}'),
            const SizedBox(height: 16),
            _buildComparisonSection(
              context,
              'Local Version',
              conflict.localEntry,
            ),
            const SizedBox(height: 16),
            _buildComparisonSection(
              context,
              'Cloud Version',
              conflict.remoteEntry,
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(ConflictResolution.clientWins),
          child: const Text('Keep Local'),
        ),
        TextButton(
          onPressed: () => Navigator.of(context).pop(ConflictResolution.serverWins),
          child: const Text('Keep Cloud'),
        ),
        TextButton(
          onPressed: () => Navigator.of(context).pop(ConflictResolution.merge),
          child: const Text('Merge'),
        ),
      ],
    );
  }
  
  Widget _buildComparisonSection(
    BuildContext context,
    String title,
    VoiceJournalEntry entry,
  ) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.shade300),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text('Modified: ${entry.updatedAt ?? entry.createdAt}'),
          if (entry.transcriptionText?.isNotEmpty ?? false)
            Text(
              'Content: ${entry.transcriptionText!.substring(0, 100.clamp(0, entry.transcriptionText!.length))}...',
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          if (entry.tags.isNotEmpty)
            Text('Tags: ${entry.tags.join(', ')}'),
        ],
      ),
    );
  }
}

/// Provider for the sync service
final voiceJournalSyncServiceProvider = StateNotifierProvider<VoiceJournalSyncService, SyncState>((ref) {
  final storageService = ref.read(voiceJournalStorageServiceProvider);
  final apiService = ApiService();
  final authService = ref.read(authServiceProvider);
  final offlineService = OfflineService();
  
  return VoiceJournalSyncService(
    storageService,
    apiService,
    authService,
    offlineService,
  );
});

/// Provider for sync needed status
final syncNeededProvider = FutureProvider<bool>((ref) async {
  final syncService = ref.read(voiceJournalSyncServiceProvider.notifier);
  return syncService.isSyncNeeded();
});

/// Provider for sync statistics
final syncStatisticsProvider = Provider<Map<String, dynamic>>((ref) {
  final syncService = ref.watch(voiceJournalSyncServiceProvider.notifier);
  return syncService.getSyncStatistics();
});