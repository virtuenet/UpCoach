// Mock services for UpCoach Mobile App testing
//
// Provides mock implementations of core services

import 'dart:async';

/// Mock network service for testing
class MockNetworkService {
  bool _isOnline = true;
  final _connectivityController = StreamController<bool>.broadcast();

  bool get isOnline => _isOnline;
  Stream<bool> get connectivityStream => _connectivityController.stream;

  void setOnline(bool online) {
    _isOnline = online;
    _connectivityController.add(online);
  }

  void dispose() {
    _connectivityController.close();
  }
}

/// Mock storage service for testing
class MockStorageService {
  final Map<String, dynamic> _storage = {};

  Future<void> write(String key, dynamic value) async {
    _storage[key] = value;
  }

  Future<T?> read<T>(String key) async {
    return _storage[key] as T?;
  }

  Future<void> delete(String key) async {
    _storage.remove(key);
  }

  Future<void> clear() async {
    _storage.clear();
  }

  bool containsKey(String key) => _storage.containsKey(key);

  Map<String, dynamic> get allData => Map.from(_storage);
}

/// Mock authentication service for testing
class MockAuthService {
  String? _userId;
  String? _email;
  bool _isAuthenticated = false;
  final _authController = StreamController<bool>.broadcast();

  bool get isAuthenticated => _isAuthenticated;
  String? get userId => _userId;
  String? get email => _email;
  Stream<bool> get authStateStream => _authController.stream;

  Future<void> signIn({
    required String email,
    required String password,
  }) async {
    // Simulate network delay
    await Future.delayed(const Duration(milliseconds: 100));

    // Simple validation
    if (email.isEmpty || password.isEmpty) {
      throw MockAuthException('Invalid credentials');
    }

    _email = email;
    _userId = 'mock-user-${DateTime.now().millisecondsSinceEpoch}';
    _isAuthenticated = true;
    _authController.add(true);
  }

  Future<void> signOut() async {
    await Future.delayed(const Duration(milliseconds: 50));
    _email = null;
    _userId = null;
    _isAuthenticated = false;
    _authController.add(false);
  }

  Future<void> signUp({
    required String email,
    required String password,
    String? displayName,
  }) async {
    await Future.delayed(const Duration(milliseconds: 100));

    if (email.isEmpty || password.isEmpty) {
      throw MockAuthException('Invalid registration data');
    }

    _email = email;
    _userId = 'mock-user-${DateTime.now().millisecondsSinceEpoch}';
    _isAuthenticated = true;
    _authController.add(true);
  }

  void dispose() {
    _authController.close();
  }
}

/// Exception for mock auth errors
class MockAuthException implements Exception {
  final String message;
  MockAuthException(this.message);

  @override
  String toString() => 'MockAuthException: $message';
}

/// Mock API client for testing
class MockApiClient {
  final Map<String, dynamic Function(Map<String, dynamic>)> _handlers = {};
  final List<MockApiCall> _calls = [];
  Duration _responseDelay = const Duration(milliseconds: 50);
  bool _shouldFail = false;
  String? _failureMessage;

  /// Records of all API calls made
  List<MockApiCall> get calls => List.from(_calls);

  /// Sets the response delay for simulating network latency
  void setResponseDelay(Duration delay) {
    _responseDelay = delay;
  }

  /// Configures the mock to fail on next request
  void setFailure([String? message]) {
    _shouldFail = true;
    _failureMessage = message;
  }

  /// Clears failure state
  void clearFailure() {
    _shouldFail = false;
    _failureMessage = null;
  }

  /// Registers a handler for a specific endpoint
  void registerHandler(
    String endpoint,
    dynamic Function(Map<String, dynamic>) handler,
  ) {
    _handlers[endpoint] = handler;
  }

  /// Makes a mock GET request
  Future<Map<String, dynamic>> get(
    String endpoint, {
    Map<String, dynamic>? queryParams,
  }) async {
    return _makeRequest('GET', endpoint, queryParams);
  }

  /// Makes a mock POST request
  Future<Map<String, dynamic>> post(
    String endpoint, {
    Map<String, dynamic>? body,
  }) async {
    return _makeRequest('POST', endpoint, body);
  }

  /// Makes a mock PUT request
  Future<Map<String, dynamic>> put(
    String endpoint, {
    Map<String, dynamic>? body,
  }) async {
    return _makeRequest('PUT', endpoint, body);
  }

  /// Makes a mock DELETE request
  Future<Map<String, dynamic>> delete(String endpoint) async {
    return _makeRequest('DELETE', endpoint, null);
  }

  Future<Map<String, dynamic>> _makeRequest(
    String method,
    String endpoint,
    Map<String, dynamic>? data,
  ) async {
    await Future.delayed(_responseDelay);

    _calls.add(MockApiCall(
      method: method,
      endpoint: endpoint,
      data: data,
      timestamp: DateTime.now(),
    ));

    if (_shouldFail) {
      _shouldFail = false;
      throw MockApiException(
        _failureMessage ?? 'Mock API error',
        500,
      );
    }

    final handler = _handlers[endpoint];
    if (handler != null) {
      return handler(data ?? {});
    }

    // Default success response
    return {'success': true, 'data': {}};
  }

  /// Clears all recorded calls
  void clearCalls() {
    _calls.clear();
  }

  /// Checks if a specific endpoint was called
  bool wasEndpointCalled(String endpoint) {
    return _calls.any((call) => call.endpoint == endpoint);
  }

  /// Gets the number of times an endpoint was called
  int callCount(String endpoint) {
    return _calls.where((call) => call.endpoint == endpoint).length;
  }
}

/// Record of a mock API call
class MockApiCall {
  final String method;
  final String endpoint;
  final Map<String, dynamic>? data;
  final DateTime timestamp;

  MockApiCall({
    required this.method,
    required this.endpoint,
    this.data,
    required this.timestamp,
  });
}

/// Exception for mock API errors
class MockApiException implements Exception {
  final String message;
  final int statusCode;

  MockApiException(this.message, this.statusCode);

  @override
  String toString() => 'MockApiException: [$statusCode] $message';
}

/// Mock sync service for testing
class MockSyncService {
  bool _isSyncing = false;
  DateTime? _lastSyncTime;
  final List<String> _pendingOperations = [];
  final _syncController = StreamController<SyncState>.broadcast();

  bool get isSyncing => _isSyncing;
  DateTime? get lastSyncTime => _lastSyncTime;
  List<String> get pendingOperations => List.from(_pendingOperations);
  Stream<SyncState> get syncStateStream => _syncController.stream;

  Future<void> sync() async {
    _isSyncing = true;
    _syncController.add(SyncState.syncing);

    await Future.delayed(const Duration(milliseconds: 200));

    _pendingOperations.clear();
    _lastSyncTime = DateTime.now();
    _isSyncing = false;
    _syncController.add(SyncState.synced);
  }

  void addPendingOperation(String operationId) {
    _pendingOperations.add(operationId);
    _syncController.add(SyncState.pending);
  }

  void dispose() {
    _syncController.close();
  }
}

/// Sync state for mock service
enum SyncState {
  idle,
  pending,
  syncing,
  synced,
  error,
}

/// Mock analytics service for testing
class MockAnalyticsService {
  final List<MockAnalyticsEvent> _events = [];
  final Map<String, dynamic> _userProperties = {};

  List<MockAnalyticsEvent> get events => List.from(_events);
  Map<String, dynamic> get userProperties => Map.from(_userProperties);

  void logEvent(String name, [Map<String, dynamic>? parameters]) {
    _events.add(MockAnalyticsEvent(
      name: name,
      parameters: parameters,
      timestamp: DateTime.now(),
    ));
  }

  void setUserProperty(String name, dynamic value) {
    _userProperties[name] = value;
  }

  void setUserId(String? userId) {
    if (userId != null) {
      _userProperties['user_id'] = userId;
    } else {
      _userProperties.remove('user_id');
    }
  }

  void clearEvents() {
    _events.clear();
  }

  void clearAll() {
    _events.clear();
    _userProperties.clear();
  }

  bool hasEvent(String name) {
    return _events.any((event) => event.name == name);
  }

  int eventCount(String name) {
    return _events.where((event) => event.name == name).length;
  }
}

/// Record of a mock analytics event
class MockAnalyticsEvent {
  final String name;
  final Map<String, dynamic>? parameters;
  final DateTime timestamp;

  MockAnalyticsEvent({
    required this.name,
    this.parameters,
    required this.timestamp,
  });
}
