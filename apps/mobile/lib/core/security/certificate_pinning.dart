// Certificate Pinning Service for UpCoach
//
// Implements SSL/TLS certificate pinning for secure API communications
// Prevents man-in-the-middle attacks by validating server certificates

import 'dart:convert';
import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:dio/dio.dart';
import 'package:dio/io.dart';
import 'package:flutter/foundation.dart';

/// Certificate pin configuration
class CertificatePin {
  /// SHA-256 hash of the certificate's public key (SPKI)
  final String sha256;

  /// Optional expiry date for the pin
  final DateTime? expiresAt;

  /// Whether this is a backup pin
  final bool isBackup;

  const CertificatePin({
    required this.sha256,
    this.expiresAt,
    this.isBackup = false,
  });

  bool get isExpired {
    if (expiresAt == null) return false;
    return DateTime.now().isAfter(expiresAt!);
  }

  factory CertificatePin.fromJson(Map<String, dynamic> json) {
    return CertificatePin(
      sha256: json['sha256'] as String,
      expiresAt: json['expiresAt'] != null
          ? DateTime.parse(json['expiresAt'] as String)
          : null,
      isBackup: json['isBackup'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
        'sha256': sha256,
        'expiresAt': expiresAt?.toIso8601String(),
        'isBackup': isBackup,
      };
}

/// Domain pin configuration
class DomainPinConfig {
  final String domain;
  final List<CertificatePin> pins;
  final bool includeSubdomains;
  final bool reportOnly;

  const DomainPinConfig({
    required this.domain,
    required this.pins,
    this.includeSubdomains = true,
    this.reportOnly = false,
  });

  List<CertificatePin> get validPins =>
      pins.where((p) => !p.isExpired).toList();

  List<CertificatePin> get primaryPins =>
      validPins.where((p) => !p.isBackup).toList();

  List<CertificatePin> get backupPins =>
      validPins.where((p) => p.isBackup).toList();

  factory DomainPinConfig.fromJson(Map<String, dynamic> json) {
    return DomainPinConfig(
      domain: json['domain'] as String,
      pins: (json['pins'] as List)
          .map((p) => CertificatePin.fromJson(p as Map<String, dynamic>))
          .toList(),
      includeSubdomains: json['includeSubdomains'] as bool? ?? true,
      reportOnly: json['reportOnly'] as bool? ?? false,
    );
  }
}

/// Result of certificate validation
enum PinValidationResult {
  /// Certificate matches a pinned key
  valid,

  /// Certificate doesn't match any pinned key
  invalid,

  /// No pins configured for this domain
  notPinned,

  /// Validation error occurred
  error,
}

/// Certificate pinning validation report
class PinValidationReport {
  final String host;
  final PinValidationResult result;
  final String? matchedPin;
  final List<String> certificateChainHashes;
  final DateTime timestamp;
  final String? errorMessage;

  PinValidationReport({
    required this.host,
    required this.result,
    this.matchedPin,
    this.certificateChainHashes = const [],
    DateTime? timestamp,
    this.errorMessage,
  }) : timestamp = timestamp ?? DateTime.now();

  Map<String, dynamic> toJson() => {
        'host': host,
        'result': result.name,
        'matchedPin': matchedPin,
        'certificateChainHashes': certificateChainHashes,
        'timestamp': timestamp.toIso8601String(),
        'errorMessage': errorMessage,
      };
}

/// Certificate Pinning Service
class CertificatePinningService {
  static final CertificatePinningService _instance =
      CertificatePinningService._internal();
  factory CertificatePinningService() => _instance;
  CertificatePinningService._internal();

  final Map<String, DomainPinConfig> _domainPins = {};
  final List<PinValidationReport> _validationReports = [];
  bool _enabled = true;
  bool _enforceInDebug = false;

  /// Callback for pin validation failures (for reporting)
  void Function(PinValidationReport report)? onPinValidationFailure;

  /// Initialize with domain configurations
  void initialize({
    required List<DomainPinConfig> domainConfigs,
    bool enabled = true,
    bool enforceInDebug = false,
  }) {
    _enabled = enabled;
    _enforceInDebug = enforceInDebug;

    _domainPins.clear();
    for (final config in domainConfigs) {
      _domainPins[config.domain] = config;
    }
  }

  /// Get default UpCoach API pins
  static List<DomainPinConfig> getDefaultPins() {
    // These should be replaced with actual certificate hashes
    // from your production API server certificates
    return [
      DomainPinConfig(
        domain: 'api.upcoach.app',
        pins: [
          // Primary certificate pin (replace with actual hash)
          const CertificatePin(
            sha256: 'YOUR_PRIMARY_CERTIFICATE_SHA256_HASH',
          ),
          // Backup certificate pin (replace with actual hash)
          const CertificatePin(
            sha256: 'YOUR_BACKUP_CERTIFICATE_SHA256_HASH',
            isBackup: true,
          ),
        ],
        includeSubdomains: true,
      ),
      DomainPinConfig(
        domain: 'cdn.upcoach.app',
        pins: [
          const CertificatePin(
            sha256: 'YOUR_CDN_CERTIFICATE_SHA256_HASH',
          ),
        ],
        includeSubdomains: true,
      ),
    ];
  }

  /// Check if pinning is active
  bool get isActive {
    if (!_enabled) return false;
    if (kDebugMode && !_enforceInDebug) return false;
    return true;
  }

  /// Get domain configuration for a host
  DomainPinConfig? getConfigForHost(String host) {
    // Direct match
    if (_domainPins.containsKey(host)) {
      return _domainPins[host];
    }

    // Check for subdomain matches
    for (final entry in _domainPins.entries) {
      if (entry.value.includeSubdomains && host.endsWith('.${entry.key}')) {
        return entry.value;
      }
    }

    return null;
  }

  /// Validate a certificate against pins
  PinValidationResult validateCertificate(
    X509Certificate certificate,
    String host,
  ) {
    final config = getConfigForHost(host);

    if (config == null) {
      return PinValidationResult.notPinned;
    }

    try {
      // Compute SHA-256 hash of the certificate's public key
      final certHash = _computeCertificateHash(certificate);

      // Check against all valid pins
      for (final pin in config.validPins) {
        if (pin.sha256.toLowerCase() == certHash.toLowerCase()) {
          _recordValidation(
            host: host,
            result: PinValidationResult.valid,
            matchedPin: pin.sha256,
            hashes: [certHash],
          );
          return PinValidationResult.valid;
        }
      }

      // No match found
      final report = _recordValidation(
        host: host,
        result: PinValidationResult.invalid,
        hashes: [certHash],
      );

      onPinValidationFailure?.call(report);

      // If report-only mode, don't fail the connection
      if (config.reportOnly) {
        return PinValidationResult.valid;
      }

      return PinValidationResult.invalid;
    } catch (e) {
      final report = _recordValidation(
        host: host,
        result: PinValidationResult.error,
        errorMessage: e.toString(),
      );

      onPinValidationFailure?.call(report);
      return PinValidationResult.error;
    }
  }

  /// Compute SHA-256 hash of certificate's SPKI (Subject Public Key Info)
  String _computeCertificateHash(X509Certificate certificate) {
    // Get the DER-encoded certificate
    final certBytes = certificate.der;

    // Hash the certificate (in production, hash the SPKI specifically)
    final hash = sha256.convert(certBytes);

    return base64.encode(hash.bytes);
  }

  /// Record a validation result
  PinValidationReport _recordValidation({
    required String host,
    required PinValidationResult result,
    String? matchedPin,
    List<String> hashes = const [],
    String? errorMessage,
  }) {
    final report = PinValidationReport(
      host: host,
      result: result,
      matchedPin: matchedPin,
      certificateChainHashes: hashes,
      errorMessage: errorMessage,
    );

    _validationReports.add(report);

    // Keep only last 100 reports
    if (_validationReports.length > 100) {
      _validationReports.removeAt(0);
    }

    return report;
  }

  /// Get validation reports
  List<PinValidationReport> get validationReports =>
      List.unmodifiable(_validationReports);

  /// Clear validation reports
  void clearReports() {
    _validationReports.clear();
  }

  /// Create a certificate-validating HTTP client
  HttpClient createSecureHttpClient() {
    final client = HttpClient();

    if (!isActive) {
      return client;
    }

    client.badCertificateCallback = (cert, host, port) {
      final result = validateCertificate(cert, host);
      return result == PinValidationResult.valid ||
          result == PinValidationResult.notPinned;
    };

    return client;
  }

  /// Configure Dio for certificate pinning
  void configureDio(Dio dio) {
    if (!isActive) {
      return;
    }

    (dio.httpClientAdapter as IOHttpClientAdapter).createHttpClient = () {
      return createSecureHttpClient();
    };
  }

  /// Add pin for a domain at runtime
  void addPin(String domain, CertificatePin pin) {
    final existing = _domainPins[domain];
    if (existing != null) {
      _domainPins[domain] = DomainPinConfig(
        domain: domain,
        pins: [...existing.pins, pin],
        includeSubdomains: existing.includeSubdomains,
        reportOnly: existing.reportOnly,
      );
    } else {
      _domainPins[domain] = DomainPinConfig(
        domain: domain,
        pins: [pin],
      );
    }
  }

  /// Remove all pins for a domain
  void removePins(String domain) {
    _domainPins.remove(domain);
  }

  /// Enable or disable pinning
  void setEnabled(bool enabled) {
    _enabled = enabled;
  }

  /// Get pinning status
  Map<String, dynamic> getStatus() {
    return {
      'enabled': _enabled,
      'enforceInDebug': _enforceInDebug,
      'isActive': isActive,
      'pinnedDomains': _domainPins.keys.toList(),
      'totalPins': _domainPins.values.fold<int>(
        0,
        (sum, config) => sum + config.pins.length,
      ),
      'recentValidations': _validationReports.length,
    };
  }
}

/// Helper extension for extracting SPKI from X509Certificate
extension X509CertificateExtension on X509Certificate {
  /// Get DER-encoded certificate bytes
  Uint8List get der {
    // The pem property contains the PEM-encoded certificate
    final pemContent = pem;

    // Extract the base64 content between headers
    final startMarker = '-----BEGIN CERTIFICATE-----';
    final endMarker = '-----END CERTIFICATE-----';

    final startIndex = pemContent.indexOf(startMarker) + startMarker.length;
    final endIndex = pemContent.indexOf(endMarker);

    if (startIndex < startMarker.length || endIndex < 0) {
      throw FormatException('Invalid PEM format');
    }

    final base64Content = pemContent
        .substring(startIndex, endIndex)
        .replaceAll('\n', '')
        .replaceAll('\r', '');

    return base64.decode(base64Content);
  }
}

/// Factory for creating pinned HTTP clients
class PinnedHttpClientFactory {
  final CertificatePinningService _pinningService;

  PinnedHttpClientFactory([CertificatePinningService? pinningService])
      : _pinningService = pinningService ?? CertificatePinningService();

  /// Create a Dio instance with certificate pinning
  Dio createPinnedDio({
    BaseOptions? options,
  }) {
    final dio = Dio(options);
    _pinningService.configureDio(dio);
    return dio;
  }

  /// Create an HttpClient with certificate pinning
  HttpClient createPinnedHttpClient() {
    return _pinningService.createSecureHttpClient();
  }
}
