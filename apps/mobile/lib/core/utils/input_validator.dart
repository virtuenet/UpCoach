// Input validation utilities for the UpCoach app.
//
// Provides comprehensive validation for user inputs including
// email, password, username, phone numbers, and sanitization
// of potentially dangerous content.

/// Result of validation containing validity status and error message
class ValidationResult {
  final bool isValid;
  final String? errorMessage;

  const ValidationResult.valid()
      : isValid = true,
        errorMessage = null;

  const ValidationResult.invalid(String message)
      : isValid = false,
        errorMessage = message;
}

/// Comprehensive input validator for user inputs
class InputValidator {
  // Private constructor to prevent instantiation
  InputValidator._();

  // ============================================================================
  // Email Validation
  // ============================================================================

  /// Validates an email address format
  static ValidationResult validateEmail(String? value) {
    if (value == null || value.isEmpty) {
      return const ValidationResult.invalid('Email is required');
    }

    final trimmedValue = value.trim();

    // RFC 5322 compliant email regex (simplified)
    final emailRegex = RegExp(
      r'^[a-zA-Z0-9.!#$%&*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,253}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,253}[a-zA-Z0-9])?)*$',
    );

    if (!emailRegex.hasMatch(trimmedValue)) {
      return const ValidationResult.invalid('Please enter a valid email');
    }

    // Check for reasonable length
    if (trimmedValue.length > 254) {
      return const ValidationResult.invalid('Email is too long');
    }

    return const ValidationResult.valid();
  }

  /// Returns error message for email or null if valid (for TextFormField)
  static String? emailValidator(String? value) {
    return validateEmail(value).errorMessage;
  }

  // ============================================================================
  // Password Validation
  // ============================================================================

  /// Validates password strength
  static ValidationResult validatePassword(String? value, {
    int minLength = 8,
    bool requireUppercase = true,
    bool requireLowercase = true,
    bool requireNumber = true,
    bool requireSpecialChar = false,
  }) {
    if (value == null || value.isEmpty) {
      return const ValidationResult.invalid('Password is required');
    }

    if (value.length < minLength) {
      return ValidationResult.invalid(
        'Password must be at least $minLength characters',
      );
    }

    if (value.length > 128) {
      return const ValidationResult.invalid('Password is too long');
    }

    if (requireUppercase && !value.contains(RegExp(r'[A-Z]'))) {
      return const ValidationResult.invalid(
        'Password must contain at least one uppercase letter',
      );
    }

    if (requireLowercase && !value.contains(RegExp(r'[a-z]'))) {
      return const ValidationResult.invalid(
        'Password must contain at least one lowercase letter',
      );
    }

    if (requireNumber && !value.contains(RegExp(r'[0-9]'))) {
      return const ValidationResult.invalid(
        'Password must contain at least one number',
      );
    }

    if (requireSpecialChar && !value.contains(RegExp(r'[!@#$%^&*(),.?":{}|<>]'))) {
      return const ValidationResult.invalid(
        'Password must contain at least one special character',
      );
    }

    return const ValidationResult.valid();
  }

  /// Returns error message for password or null if valid (for TextFormField)
  static String? passwordValidator(String? value) {
    return validatePassword(value).errorMessage;
  }

  /// Validates password confirmation matches
  static ValidationResult validatePasswordConfirmation(
    String? password,
    String? confirmation,
  ) {
    if (confirmation == null || confirmation.isEmpty) {
      return const ValidationResult.invalid('Please confirm your password');
    }

    if (password != confirmation) {
      return const ValidationResult.invalid('Passwords do not match');
    }

    return const ValidationResult.valid();
  }

  // ============================================================================
  // Username Validation
  // ============================================================================

  /// Validates username format
  static ValidationResult validateUsername(String? value, {
    int minLength = 3,
    int maxLength = 30,
  }) {
    if (value == null || value.isEmpty) {
      return const ValidationResult.invalid('Username is required');
    }

    final trimmedValue = value.trim();

    if (trimmedValue.length < minLength) {
      return ValidationResult.invalid(
        'Username must be at least $minLength characters',
      );
    }

    if (trimmedValue.length > maxLength) {
      return ValidationResult.invalid(
        'Username cannot exceed $maxLength characters',
      );
    }

    // Only allow alphanumeric, underscores, and hyphens
    if (!RegExp(r'^[a-zA-Z0-9_-]+$').hasMatch(trimmedValue)) {
      return const ValidationResult.invalid(
        'Username can only contain letters, numbers, underscores, and hyphens',
      );
    }

    // Must start with a letter
    if (!RegExp(r'^[a-zA-Z]').hasMatch(trimmedValue)) {
      return const ValidationResult.invalid('Username must start with a letter');
    }

    return const ValidationResult.valid();
  }

  /// Returns error message for username or null if valid (for TextFormField)
  static String? usernameValidator(String? value) {
    return validateUsername(value).errorMessage;
  }

  // ============================================================================
  // Name Validation
  // ============================================================================

  /// Validates a display name or full name
  static ValidationResult validateName(String? value, {
    int minLength = 1,
    int maxLength = 100,
    String fieldName = 'Name',
  }) {
    if (value == null || value.isEmpty) {
      return ValidationResult.invalid('$fieldName is required');
    }

    final trimmedValue = value.trim();

    if (trimmedValue.length < minLength) {
      return ValidationResult.invalid(
        '$fieldName must be at least $minLength character(s)',
      );
    }

    if (trimmedValue.length > maxLength) {
      return ValidationResult.invalid(
        '$fieldName cannot exceed $maxLength characters',
      );
    }

    // Check for suspicious patterns (potential injection)
    if (_containsSuspiciousPatterns(trimmedValue)) {
      return ValidationResult.invalid('$fieldName contains invalid characters');
    }

    return const ValidationResult.valid();
  }

  // ============================================================================
  // Phone Number Validation
  // ============================================================================

  /// Validates phone number format
  static ValidationResult validatePhoneNumber(String? value) {
    if (value == null || value.isEmpty) {
      return const ValidationResult.invalid('Phone number is required');
    }

    // Remove common formatting characters
    final cleanedNumber = value.replaceAll(RegExp(r'[\s\-\(\)\.]'), '');

    // Check if it starts with + for international format
    final isInternational = cleanedNumber.startsWith('+');
    final digitsOnly = cleanedNumber.replaceAll('+', '');

    // Must only contain digits (after removing +)
    if (!RegExp(r'^\d+$').hasMatch(digitsOnly)) {
      return const ValidationResult.invalid('Phone number contains invalid characters');
    }

    // Check reasonable length (7-15 digits)
    if (digitsOnly.length < 7) {
      return const ValidationResult.invalid('Phone number is too short');
    }

    if (digitsOnly.length > 15) {
      return const ValidationResult.invalid('Phone number is too long');
    }

    // For international, require country code
    if (isInternational && digitsOnly.length < 10) {
      return const ValidationResult.invalid('Invalid international phone number');
    }

    return const ValidationResult.valid();
  }

  // ============================================================================
  // URL Validation
  // ============================================================================

  /// Validates a URL format
  static ValidationResult validateUrl(String? value, {
    bool allowEmpty = false,
    List<String>? allowedSchemes,
  }) {
    if (value == null || value.isEmpty) {
      return allowEmpty
          ? const ValidationResult.valid()
          : const ValidationResult.invalid('URL is required');
    }

    final trimmedValue = value.trim();

    try {
      final uri = Uri.parse(trimmedValue);

      if (!uri.hasScheme) {
        return const ValidationResult.invalid('URL must include http:// or https://');
      }

      final schemes = allowedSchemes ?? ['http', 'https'];
      if (!schemes.contains(uri.scheme.toLowerCase())) {
        return ValidationResult.invalid(
          'URL must use ${schemes.join(' or ')}',
        );
      }

      if (uri.host.isEmpty) {
        return const ValidationResult.invalid('URL must have a valid host');
      }

      return const ValidationResult.valid();
    } catch (_) {
      return const ValidationResult.invalid('Invalid URL format');
    }
  }

  // ============================================================================
  // Generic Required Field Validation
  // ============================================================================

  /// Validates that a field is not empty
  static ValidationResult validateRequired(String? value, {
    String fieldName = 'This field',
    int? maxLength,
  }) {
    if (value == null || value.trim().isEmpty) {
      return ValidationResult.invalid('$fieldName is required');
    }

    if (maxLength != null && value.length > maxLength) {
      return ValidationResult.invalid(
        '$fieldName cannot exceed $maxLength characters',
      );
    }

    return const ValidationResult.valid();
  }

  /// Returns error message for required field or null if valid (for TextFormField)
  static String? requiredValidator(String? value, {String fieldName = 'This field'}) {
    return validateRequired(value, fieldName: fieldName).errorMessage;
  }

  // ============================================================================
  // Number Validation
  // ============================================================================

  /// Validates a numeric input
  static ValidationResult validateNumber(
    String? value, {
    String fieldName = 'Value',
    double? min,
    double? max,
    bool allowDecimal = true,
  }) {
    if (value == null || value.isEmpty) {
      return ValidationResult.invalid('$fieldName is required');
    }

    final pattern = allowDecimal ? r'^-?\d+\.?\d*$' : r'^-?\d+$';
    if (!RegExp(pattern).hasMatch(value)) {
      return ValidationResult.invalid('$fieldName must be a valid number');
    }

    final number = double.tryParse(value);
    if (number == null) {
      return ValidationResult.invalid('$fieldName must be a valid number');
    }

    if (min != null && number < min) {
      return ValidationResult.invalid('$fieldName must be at least $min');
    }

    if (max != null && number > max) {
      return ValidationResult.invalid('$fieldName cannot exceed $max');
    }

    return const ValidationResult.valid();
  }

  // ============================================================================
  // Sanitization
  // ============================================================================

  /// Sanitizes input by removing potentially dangerous HTML/script content
  static String sanitizeHtml(String input) {
    // Remove script tags and their content
    String sanitized = input.replaceAll(
      RegExp(r'<script[^>]*>[\s\S]*?</script>', caseSensitive: false),
      '',
    );

    // Remove event handlers like onclick, onload, etc.
    sanitized = sanitized.replaceAll(
      RegExp('\\son\\w+\\s*=\\s*["\'][^"\']*["\']', caseSensitive: false),
      '',
    );

    // Remove javascript: protocol
    sanitized = sanitized.replaceAll(
      RegExp(r'javascript:', caseSensitive: false),
      '',
    );

    // Remove data: protocol (can be used for XSS)
    sanitized = sanitized.replaceAll(
      RegExp(r'data:', caseSensitive: false),
      '',
    );

    // Remove vbscript: protocol
    sanitized = sanitized.replaceAll(
      RegExp(r'vbscript:', caseSensitive: false),
      '',
    );

    // Remove style attributes (can contain expressions)
    sanitized = sanitized.replaceAll(
      RegExp('\\sstyle\\s*=\\s*["\'][^"\']*["\']', caseSensitive: false),
      '',
    );

    return sanitized;
  }

  /// Escapes HTML special characters
  static String escapeHtml(String input) {
    return input
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
  }

  /// Sanitizes input for SQL queries (basic - prefer parameterized queries)
  static String sanitizeSql(String input) {
    return input
        .replaceAll("'", "''")
        .replaceAll('\\', '\\\\')
        .replaceAll('\x00', '')
        .replaceAll('\n', '\\n')
        .replaceAll('\r', '\\r')
        .replaceAll('\x1a', '\\Z');
  }

  /// Trims and normalizes whitespace
  static String normalizeWhitespace(String input) {
    return input.trim().replaceAll(RegExp(r'\s+'), ' ');
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  /// Checks for suspicious patterns that might indicate injection attempts
  static bool _containsSuspiciousPatterns(String value) {
    final suspiciousPatterns = [
      RegExp(r'<script', caseSensitive: false),
      RegExp(r'javascript:', caseSensitive: false),
      RegExp(r'on\w+\s*=', caseSensitive: false),
      RegExp(r'<iframe', caseSensitive: false),
      RegExp(r'<object', caseSensitive: false),
      RegExp(r'<embed', caseSensitive: false),
      RegExp(r'<form', caseSensitive: false),
      RegExp(r'<input', caseSensitive: false),
      RegExp(r'data:', caseSensitive: false),
      // SQL injection patterns
      RegExp(r"'\s*or\s*'", caseSensitive: false),
      RegExp(r"'\s*;\s*--", caseSensitive: false),
      RegExp('union\\s+select', caseSensitive: false),
      RegExp('drop\\s+table', caseSensitive: false),
    ];

    for (final pattern in suspiciousPatterns) {
      if (pattern.hasMatch(value)) {
        return true;
      }
    }

    return false;
  }
}

/// Extension methods for String validation
extension StringValidationExtension on String {
  /// Check if this string is a valid email
  bool get isValidEmail => InputValidator.validateEmail(this).isValid;

  /// Check if this string is a valid username
  bool get isValidUsername => InputValidator.validateUsername(this).isValid;

  /// Check if this string is a valid phone number
  bool get isValidPhoneNumber => InputValidator.validatePhoneNumber(this).isValid;

  /// Check if this string is a valid URL
  bool get isValidUrl => InputValidator.validateUrl(this).isValid;

  /// Sanitize this string for HTML
  String get htmlSanitized => InputValidator.sanitizeHtml(this);

  /// Escape HTML characters in this string
  String get htmlEscaped => InputValidator.escapeHtml(this);

  /// Normalize whitespace in this string
  String get whitespaceNormalized => InputValidator.normalizeWhitespace(this);
}
