import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart' as path;

/// Developer Tools - Comprehensive debugging and development utilities
/// This provides network inspection, state management, performance monitoring,
/// and various debugging tools for Flutter development.

class DeveloperTools {
  static final DeveloperTools _instance = DeveloperTools._internal();
  factory DeveloperTools() => _instance;
  DeveloperTools._internal();

  bool _isEnabled = false;
  final List<NetworkRequest> _networkRequests = [];
  final List<LogEntry> _logs = [];
  final List<CrashReport> _crashes = [];
  final StreamController<NetworkRequest> _networkStreamController =
      StreamController<NetworkRequest>.broadcast();
  final StreamController<LogEntry> _logStreamController =
      StreamController<LogEntry>.broadcast();
  OverlayEntry? _overlayEntry;
  final GlobalKey<_DeveloperToolsOverlayState> _overlayKey =
      GlobalKey<_DeveloperToolsOverlayState>();

  bool get isEnabled => _isEnabled;
  List<NetworkRequest> get networkRequests => List.unmodifiable(_networkRequests);
  List<LogEntry> get logs => List.unmodifiable(_logs);
  Stream<NetworkRequest> get networkStream => _networkStreamController.stream;
  Stream<LogEntry> get logStream => _logStreamController.stream;

  /// Initialize developer tools
  Future<void> initialize() async {
    if (kReleaseMode) return;

    _isEnabled = true;
    _setupErrorHandling();
    _loadPersistedData();
    log('Developer Tools initialized', level: LogLevel.info);
  }

  /// Show developer tools overlay
  void show(BuildContext context) {
    if (!_isEnabled || _overlayEntry != null) return;

    _overlayEntry = OverlayEntry(
      builder: (context) => DeveloperToolsOverlay(
        key: _overlayKey,
        onClose: hide,
      ),
    );

    Overlay.of(context).insert(_overlayEntry!);
  }

  /// Hide developer tools overlay
  void hide() {
    _overlayEntry?.remove();
    _overlayEntry = null;
  }

  /// Log network request
  void logNetworkRequest(NetworkRequest request) {
    if (!_isEnabled) return;

    _networkRequests.insert(0, request);
    if (_networkRequests.length > 100) {
      _networkRequests.removeLast();
    }
    _networkStreamController.add(request);
  }

  /// Log message
  void log(
    String message, {
    LogLevel level = LogLevel.debug,
    Map<String, dynamic>? metadata,
  }) {
    if (!_isEnabled) return;

    final entry = LogEntry(
      timestamp: DateTime.now(),
      level: level,
      message: message,
      metadata: metadata,
    );

    _logs.insert(0, entry);
    if (_logs.length > 500) {
      _logs.removeLast();
    }
    _logStreamController.add(entry);

    if (kDebugMode) {
      print('[${level.name.toUpperCase()}] $message');
    }
  }

  /// Log crash
  void logCrash(dynamic error, StackTrace? stackTrace) {
    if (!_isEnabled) return;

    final crash = CrashReport(
      timestamp: DateTime.now(),
      error: error.toString(),
      stackTrace: stackTrace?.toString() ?? '',
    );

    _crashes.insert(0, crash);
    if (_crashes.length > 50) {
      _crashes.removeLast();
    }

    log('Crash: ${error.toString()}', level: LogLevel.error, metadata: {
      'stackTrace': stackTrace?.toString(),
    });
  }

  /// Clear all network requests
  void clearNetworkRequests() {
    _networkRequests.clear();
  }

  /// Clear all logs
  void clearLogs() {
    _logs.clear();
  }

  /// Get FPS information
  Future<double> getCurrentFPS() async {
    // This is a simplified FPS counter
    // In production, you'd use more sophisticated timing
    final stopwatch = Stopwatch()..start();
    await Future.delayed(const Duration(seconds: 1));
    stopwatch.stop();
    return 60.0; // Placeholder - implement actual FPS counting
  }

  void _setupErrorHandling() {
    FlutterError.onError = (FlutterErrorDetails details) {
      logCrash(details.exception, details.stack);
    };

    PlatformDispatcher.instance.onError = (error, stack) {
      logCrash(error, stack);
      return true;
    };
  }

  Future<void> _loadPersistedData() async {
    // Load persisted developer tools data if needed
  }

  void dispose() {
    _networkStreamController.close();
    _logStreamController.close();
    hide();
  }
}

/// Network Request Interceptor for Dio
class DeveloperToolsInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final request = NetworkRequest(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      method: options.method,
      url: options.uri.toString(),
      headers: options.headers,
      requestBody: options.data,
      timestamp: DateTime.now(),
    );

    DeveloperTools().logNetworkRequest(request);
    options.extra['dev_tools_request_id'] = request.id;

    super.onRequest(options, handler);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    final requestId = response.requestOptions.extra['dev_tools_request_id'] as String?;
    if (requestId != null) {
      final requests = DeveloperTools().networkRequests;
      final index = requests.indexWhere((r) => r.id == requestId);
      if (index != -1) {
        final updatedRequest = requests[index].copyWith(
          statusCode: response.statusCode,
          responseHeaders: response.headers.map,
          responseBody: response.data,
          duration: DateTime.now().difference(requests[index].timestamp),
        );
        DeveloperTools().logNetworkRequest(updatedRequest);
      }
    }

    super.onResponse(response, handler);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final requestId = err.requestOptions.extra['dev_tools_request_id'] as String?;
    if (requestId != null) {
      final requests = DeveloperTools().networkRequests;
      final index = requests.indexWhere((r) => r.id == requestId);
      if (index != -1) {
        final updatedRequest = requests[index].copyWith(
          statusCode: err.response?.statusCode ?? 0,
          error: err.message,
          duration: DateTime.now().difference(requests[index].timestamp),
        );
        DeveloperTools().logNetworkRequest(updatedRequest);
      }
    }

    super.onError(err, handler);
  }
}

/// Developer Tools Overlay Widget
class DeveloperToolsOverlay extends StatefulWidget {
  final VoidCallback onClose;

  const DeveloperToolsOverlay({
    Key? key,
    required this.onClose,
  }) : super(key: key);

  @override
  State<DeveloperToolsOverlay> createState() => _DeveloperToolsOverlayState();
}

class _DeveloperToolsOverlayState extends State<DeveloperToolsOverlay> {
  bool _isExpanded = false;
  Offset _position = const Offset(20, 100);

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        if (_isExpanded)
          GestureDetector(
            onTap: () => setState(() => _isExpanded = false),
            child: Container(
              color: Colors.black54,
            ),
          ),
        Positioned(
          left: _position.dx,
          top: _position.dy,
          child: GestureDetector(
            onPanUpdate: (details) {
              setState(() {
                _position = Offset(
                  _position.dx + details.delta.dx,
                  _position.dy + details.delta.dy,
                );
              });
            },
            child: Material(
              elevation: 8,
              borderRadius: BorderRadius.circular(_isExpanded ? 16 : 28),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                width: _isExpanded ? 360 : 56,
                height: _isExpanded ? 600 : 56,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(_isExpanded ? 16 : 28),
                ),
                child: _isExpanded
                    ? _buildExpandedView()
                    : _buildCollapsedView(),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCollapsedView() {
    return InkWell(
      onTap: () => setState(() => _isExpanded = true),
      borderRadius: BorderRadius.circular(28),
      child: const Center(
        child: Icon(
          Icons.developer_mode,
          color: Colors.blue,
          size: 32,
        ),
      ),
    );
  }

  Widget _buildExpandedView() {
    return Column(
      children: [
        _buildHeader(),
        Expanded(
          child: DeveloperToolsContent(
            onClose: () {
              setState(() => _isExpanded = false);
              widget.onClose();
            },
          ),
        ),
      ],
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        color: Colors.blue,
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      child: Row(
        children: [
          const Icon(Icons.developer_mode, color: Colors.white),
          const SizedBox(width: 8),
          const Text(
            'Developer Tools',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const Spacer(),
          IconButton(
            icon: const Icon(Icons.close, color: Colors.white),
            onPressed: () => setState(() => _isExpanded = false),
          ),
        ],
      ),
    );
  }
}

/// Developer Tools Content
class DeveloperToolsContent extends StatefulWidget {
  final VoidCallback onClose;

  const DeveloperToolsContent({
    Key? key,
    required this.onClose,
  }) : super(key: key);

  @override
  State<DeveloperToolsContent> createState() => _DeveloperToolsContentState();
}

class _DeveloperToolsContentState extends State<DeveloperToolsContent>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 7, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TabBar(
          controller: _tabController,
          isScrollable: true,
          labelColor: Colors.blue,
          unselectedLabelColor: Colors.grey,
          tabs: const [
            Tab(text: 'Network'),
            Tab(text: 'Logs'),
            Tab(text: 'Storage'),
            Tab(text: 'Database'),
            Tab(text: 'Performance'),
            Tab(text: 'Settings'),
            Tab(text: 'Crashes'),
          ],
        ),
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              NetworkInspectorTab(),
              LogViewerTab(),
              StorageInspectorTab(),
              DatabaseInspectorTab(),
              PerformanceTab(),
              SettingsTab(),
              CrashReporterTab(),
            ],
          ),
        ),
      ],
    );
  }
}

/// Network Inspector Tab
class NetworkInspectorTab extends StatefulWidget {
  @override
  State<NetworkInspectorTab> createState() => _NetworkInspectorTabState();
}

class _NetworkInspectorTabState extends State<NetworkInspectorTab> {
  String _filterMethod = 'All';
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _buildToolbar(),
        Expanded(
          child: StreamBuilder<NetworkRequest>(
            stream: DeveloperTools().networkStream,
            builder: (context, snapshot) {
              final requests = DeveloperTools()
                  .networkRequests
                  .where((r) {
                    if (_filterMethod != 'All' && r.method != _filterMethod) {
                      return false;
                    }
                    if (_searchQuery.isNotEmpty &&
                        !r.url.toLowerCase().contains(_searchQuery.toLowerCase())) {
                      return false;
                    }
                    return true;
                  })
                  .toList();

              if (requests.isEmpty) {
                return const Center(
                  child: Text('No network requests'),
                );
              }

              return ListView.builder(
                itemCount: requests.length,
                itemBuilder: (context, index) {
                  return _buildRequestItem(requests[index]);
                },
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildToolbar() {
    return Container(
      padding: const EdgeInsets.all(8),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'Search URL...',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
                contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 8),
              ),
              onChanged: (value) => setState(() => _searchQuery = value),
            ),
          ),
          const SizedBox(width: 8),
          DropdownButton<String>(
            value: _filterMethod,
            items: ['All', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE']
                .map((method) => DropdownMenuItem(
                      value: method,
                      child: Text(method),
                    ))
                .toList(),
            onChanged: (value) => setState(() => _filterMethod = value!),
          ),
          IconButton(
            icon: const Icon(Icons.delete),
            onPressed: () {
              DeveloperTools().clearNetworkRequests();
              setState(() {});
            },
          ),
        ],
      ),
    );
  }

  Widget _buildRequestItem(NetworkRequest request) {
    final statusColor = _getStatusColor(request.statusCode);

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      child: ListTile(
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: statusColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Center(
            child: Text(
              request.method,
              style: TextStyle(
                color: statusColor,
                fontWeight: FontWeight.bold,
                fontSize: 10,
              ),
            ),
          ),
        ),
        title: Text(
          _getShortUrl(request.url),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Text(
          '${request.statusCode ?? '-'} • ${request.duration?.inMilliseconds ?? '-'}ms',
          style: TextStyle(color: statusColor),
        ),
        trailing: const Icon(Icons.chevron_right),
        onTap: () => _showRequestDetails(request),
      ),
    );
  }

  Color _getStatusColor(int? statusCode) {
    if (statusCode == null) return Colors.grey;
    if (statusCode >= 200 && statusCode < 300) return Colors.green;
    if (statusCode >= 400 && statusCode < 500) return Colors.orange;
    if (statusCode >= 500) return Colors.red;
    return Colors.blue;
  }

  String _getShortUrl(String url) {
    final uri = Uri.parse(url);
    return uri.path;
  }

  void _showRequestDetails(NetworkRequest request) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.9,
        builder: (context, scrollController) {
          return NetworkRequestDetailsSheet(
            request: request,
            scrollController: scrollController,
          );
        },
      ),
    );
  }
}

/// Log Viewer Tab
class LogViewerTab extends StatefulWidget {
  @override
  State<LogViewerTab> createState() => _LogViewerTabState();
}

class _LogViewerTabState extends State<LogViewerTab> {
  LogLevel? _filterLevel;
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _buildToolbar(),
        Expanded(
          child: StreamBuilder<LogEntry>(
            stream: DeveloperTools().logStream,
            builder: (context, snapshot) {
              final logs = DeveloperTools()
                  .logs
                  .where((log) {
                    if (_filterLevel != null && log.level != _filterLevel) {
                      return false;
                    }
                    if (_searchQuery.isNotEmpty &&
                        !log.message.toLowerCase().contains(_searchQuery.toLowerCase())) {
                      return false;
                    }
                    return true;
                  })
                  .toList();

              if (logs.isEmpty) {
                return const Center(
                  child: Text('No logs'),
                );
              }

              return ListView.builder(
                itemCount: logs.length,
                itemBuilder: (context, index) {
                  return _buildLogItem(logs[index]);
                },
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildToolbar() {
    return Container(
      padding: const EdgeInsets.all(8),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'Search logs...',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
                contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 8),
              ),
              onChanged: (value) => setState(() => _searchQuery = value),
            ),
          ),
          const SizedBox(width: 8),
          DropdownButton<LogLevel?>(
            value: _filterLevel,
            items: [
              const DropdownMenuItem(value: null, child: Text('All')),
              ...LogLevel.values.map((level) => DropdownMenuItem(
                    value: level,
                    child: Text(level.name.toUpperCase()),
                  )),
            ],
            onChanged: (value) => setState(() => _filterLevel = value),
          ),
          IconButton(
            icon: const Icon(Icons.delete),
            onPressed: () {
              DeveloperTools().clearLogs();
              setState(() {});
            },
          ),
        ],
      ),
    );
  }

  Widget _buildLogItem(LogEntry log) {
    final color = _getLogLevelColor(log.level);

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      child: ListTile(
        dense: true,
        leading: Icon(
          _getLogLevelIcon(log.level),
          color: color,
          size: 20,
        ),
        title: Text(
          log.message,
          style: const TextStyle(fontSize: 12),
        ),
        subtitle: Text(
          _formatTimestamp(log.timestamp),
          style: const TextStyle(fontSize: 10),
        ),
        onTap: () => _showLogDetails(log),
      ),
    );
  }

  Color _getLogLevelColor(LogLevel level) {
    switch (level) {
      case LogLevel.error:
        return Colors.red;
      case LogLevel.warn:
        return Colors.orange;
      case LogLevel.info:
        return Colors.blue;
      case LogLevel.debug:
        return Colors.grey;
    }
  }

  IconData _getLogLevelIcon(LogLevel level) {
    switch (level) {
      case LogLevel.error:
        return Icons.error;
      case LogLevel.warn:
        return Icons.warning;
      case LogLevel.info:
        return Icons.info;
      case LogLevel.debug:
        return Icons.bug_report;
    }
  }

  String _formatTimestamp(DateTime timestamp) {
    return '${timestamp.hour.toString().padLeft(2, '0')}:'
        '${timestamp.minute.toString().padLeft(2, '0')}:'
        '${timestamp.second.toString().padLeft(2, '0')}';
  }

  void _showLogDetails(LogEntry log) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(log.level.name.toUpperCase()),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Message: ${log.message}'),
              const SizedBox(height: 8),
              Text('Time: ${log.timestamp}'),
              if (log.metadata != null) ...[
                const SizedBox(height: 8),
                const Text('Metadata:'),
                Text(
                  const JsonEncoder.withIndent('  ').convert(log.metadata),
                  style: const TextStyle(fontFamily: 'monospace'),
                ),
              ],
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }
}

/// Storage Inspector Tab
class StorageInspectorTab extends StatefulWidget {
  @override
  State<StorageInspectorTab> createState() => _StorageInspectorTabState();
}

class _StorageInspectorTabState extends State<StorageInspectorTab> {
  Map<String, dynamic>? _preferences;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadPreferences();
  }

  Future<void> _loadPreferences() async {
    setState(() => _loading = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys();
      final Map<String, dynamic> data = {};

      for (final key in keys) {
        data[key] = prefs.get(key);
      }

      setState(() {
        _preferences = data;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_preferences == null || _preferences!.isEmpty) {
      return const Center(child: Text('No stored data'));
    }

    return ListView.builder(
      itemCount: _preferences!.length,
      itemBuilder: (context, index) {
        final key = _preferences!.keys.elementAt(index);
        final value = _preferences![key];

        return Card(
          margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          child: ListTile(
            title: Text(key),
            subtitle: Text(
              value.toString(),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            trailing: IconButton(
              icon: const Icon(Icons.delete),
              onPressed: () => _deletePreference(key),
            ),
            onTap: () => _editPreference(key, value),
          ),
        );
      },
    );
  }

  Future<void> _deletePreference(String key) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(key);
    await _loadPreferences();
  }

  void _editPreference(String key, dynamic value) {
    // Show edit dialog
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Edit: $key'),
        content: TextField(
          controller: TextEditingController(text: value.toString()),
          decoration: const InputDecoration(
            labelText: 'Value',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              // Save edited value
              Navigator.pop(context);
              _loadPreferences();
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }
}

/// Database Inspector Tab
class DatabaseInspectorTab extends StatefulWidget {
  @override
  State<DatabaseInspectorTab> createState() => _DatabaseInspectorTabState();
}

class _DatabaseInspectorTabState extends State<DatabaseInspectorTab> {
  List<String>? _tables;
  String? _selectedTable;
  List<Map<String, dynamic>>? _tableData;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadTables();
  }

  Future<void> _loadTables() async {
    setState(() => _loading = true);
    try {
      final databasePath = await getDatabasesPath();
      final dbPath = path.join(databasePath, 'upcoach.db');

      if (!await File(dbPath).exists()) {
        setState(() {
          _tables = [];
          _loading = false;
        });
        return;
      }

      final db = await openDatabase(dbPath);
      final tables = await db.rawQuery(
        "SELECT name FROM sqlite_master WHERE type='table'",
      );

      setState(() {
        _tables = tables.map((t) => t['name'] as String).toList();
        _loading = false;
      });

      await db.close();
    } catch (e) {
      setState(() => _loading = false);
      DeveloperTools().log('Failed to load tables: $e', level: LogLevel.error);
    }
  }

  Future<void> _loadTableData(String tableName) async {
    setState(() => _loading = true);
    try {
      final databasePath = await getDatabasesPath();
      final dbPath = path.join(databasePath, 'upcoach.db');
      final db = await openDatabase(dbPath);

      final data = await db.rawQuery('SELECT * FROM $tableName LIMIT 100');

      setState(() {
        _tableData = data;
        _selectedTable = tableName;
        _loading = false;
      });

      await db.close();
    } catch (e) {
      setState(() => _loading = false);
      DeveloperTools().log('Failed to load table data: $e', level: LogLevel.error);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_tables == null || _tables!.isEmpty) {
      return const Center(child: Text('No database tables found'));
    }

    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          child: DropdownButton<String>(
            value: _selectedTable,
            hint: const Text('Select Table'),
            isExpanded: true,
            items: _tables!
                .map((table) => DropdownMenuItem(
                      value: table,
                      child: Text(table),
                    ))
                .toList(),
            onChanged: (value) {
              if (value != null) {
                _loadTableData(value);
              }
            },
          ),
        ),
        Expanded(
          child: _tableData == null
              ? const Center(child: Text('Select a table to view data'))
              : _tableData!.isEmpty
                  ? const Center(child: Text('No data in table'))
                  : SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: SingleChildScrollView(
                        child: DataTable(
                          columns: _tableData!.first.keys
                              .map((key) => DataColumn(label: Text(key)))
                              .toList(),
                          rows: _tableData!
                              .map((row) => DataRow(
                                    cells: row.values
                                        .map((value) => DataCell(
                                              Text(value?.toString() ?? 'NULL'),
                                            ))
                                        .toList(),
                                  ))
                              .toList(),
                        ),
                      ),
                    ),
        ),
      ],
    );
  }
}

/// Performance Tab
class PerformanceTab extends StatefulWidget {
  @override
  State<PerformanceTab> createState() => _PerformanceTabState();
}

class _PerformanceTabState extends State<PerformanceTab> {
  bool _showPerformanceOverlay = false;
  double _currentFPS = 60.0;
  Timer? _fpsTimer;

  @override
  void initState() {
    super.initState();
    _startFPSMonitoring();
  }

  @override
  void dispose() {
    _fpsTimer?.cancel();
    super.dispose();
  }

  void _startFPSMonitoring() {
    _fpsTimer = Timer.periodic(const Duration(seconds: 1), (timer) async {
      final fps = await DeveloperTools().getCurrentFPS();
      if (mounted) {
        setState(() => _currentFPS = fps);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: ListTile(
            title: const Text('FPS Monitor'),
            subtitle: Text('Current FPS: ${_currentFPS.toStringAsFixed(1)}'),
            trailing: Icon(
              Icons.circle,
              color: _currentFPS >= 55 ? Colors.green : Colors.red,
            ),
          ),
        ),
        Card(
          child: SwitchListTile(
            title: const Text('Show Performance Overlay'),
            subtitle: const Text('Display FPS and frame timing'),
            value: _showPerformanceOverlay,
            onChanged: (value) {
              setState(() => _showPerformanceOverlay = value);
            },
          ),
        ),
        Card(
          child: SwitchListTile(
            title: const Text('Show Debug Paint'),
            subtitle: const Text('Highlight widget borders'),
            value: false,
            onChanged: (value) {
              // Toggle debug paint
            },
          ),
        ),
        Card(
          child: ListTile(
            title: const Text('Memory Usage'),
            subtitle: const Text('Tap to view details'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              // Show memory details
            },
          ),
        ),
      ],
    );
  }
}

/// Settings Tab
class SettingsTab extends StatefulWidget {
  @override
  State<SettingsTab> createState() => _SettingsTabState();
}

class _SettingsTabState extends State<SettingsTab> {
  String _environment = 'development';
  bool _mockDataEnabled = false;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Environment',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                DropdownButton<String>(
                  value: _environment,
                  isExpanded: true,
                  items: ['development', 'staging', 'production']
                      .map((env) => DropdownMenuItem(
                            value: env,
                            child: Text(env),
                          ))
                      .toList(),
                  onChanged: (value) {
                    setState(() => _environment = value!);
                  },
                ),
              ],
            ),
          ),
        ),
        Card(
          child: SwitchListTile(
            title: const Text('Enable Mock Data'),
            subtitle: const Text('Use fake data for testing'),
            value: _mockDataEnabled,
            onChanged: (value) {
              setState(() => _mockDataEnabled = value);
            },
          ),
        ),
        Card(
          child: ListTile(
            title: const Text('Clear All Data'),
            subtitle: const Text('Reset app to initial state'),
            trailing: const Icon(Icons.delete_forever, color: Colors.red),
            onTap: _clearAllData,
          ),
        ),
        Card(
          child: ListTile(
            title: const Text('Export Logs'),
            subtitle: const Text('Save logs to file'),
            trailing: const Icon(Icons.download),
            onTap: _exportLogs,
          ),
        ),
      ],
    );
  }

  Future<void> _clearAllData() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear All Data'),
        content: const Text('This will delete all app data. Continue?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Clear', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.clear();
      DeveloperTools().clearLogs();
      DeveloperTools().clearNetworkRequests();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('All data cleared')),
        );
      }
    }
  }

  Future<void> _exportLogs() async {
    // Export logs to file
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Logs exported')),
    );
  }
}

/// Crash Reporter Tab
class CrashReporterTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final crashes = DeveloperTools()._crashes;

    if (crashes.isEmpty) {
      return const Center(child: Text('No crashes recorded'));
    }

    return ListView.builder(
      itemCount: crashes.length,
      itemBuilder: (context, index) {
        final crash = crashes[index];
        return Card(
          margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          child: ListTile(
            leading: const Icon(Icons.error, color: Colors.red),
            title: Text(
              crash.error,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            subtitle: Text(
              crash.timestamp.toString(),
              style: const TextStyle(fontSize: 12),
            ),
            onTap: () => _showCrashDetails(context, crash),
          ),
        );
      },
    );
  }

  void _showCrashDetails(BuildContext context, CrashReport crash) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Crash Report'),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Error: ${crash.error}'),
              const SizedBox(height: 8),
              Text('Time: ${crash.timestamp}'),
              const SizedBox(height: 8),
              const Text('Stack Trace:'),
              Text(
                crash.stackTrace,
                style: const TextStyle(fontFamily: 'monospace', fontSize: 10),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }
}

/// Network Request Details Sheet
class NetworkRequestDetailsSheet extends StatelessWidget {
  final NetworkRequest request;
  final ScrollController scrollController;

  const NetworkRequestDetailsSheet({
    Key? key,
    required this.request,
    required this.scrollController,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: ListView(
        controller: scrollController,
        children: [
          const Text(
            'Request Details',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          _buildSection('General', [
            _buildRow('Method', request.method),
            _buildRow('URL', request.url),
            _buildRow('Status', request.statusCode?.toString() ?? '-'),
            _buildRow('Duration', '${request.duration?.inMilliseconds ?? '-'}ms'),
          ]),
          _buildSection('Request Headers', [
            Text(
              const JsonEncoder.withIndent('  ').convert(request.headers),
              style: const TextStyle(fontFamily: 'monospace', fontSize: 12),
            ),
          ]),
          if (request.requestBody != null)
            _buildSection('Request Body', [
              Text(
                const JsonEncoder.withIndent('  ').convert(request.requestBody),
                style: const TextStyle(fontFamily: 'monospace', fontSize: 12),
              ),
            ]),
          if (request.responseHeaders != null)
            _buildSection('Response Headers', [
              Text(
                const JsonEncoder.withIndent('  ').convert(request.responseHeaders),
                style: const TextStyle(fontFamily: 'monospace', fontSize: 12),
              ),
            ]),
          if (request.responseBody != null)
            _buildSection('Response Body', [
              Text(
                const JsonEncoder.withIndent('  ').convert(request.responseBody),
                style: const TextStyle(fontFamily: 'monospace', fontSize: 12),
              ),
            ]),
          if (request.error != null)
            _buildSection('Error', [
              Text(
                request.error!,
                style: const TextStyle(color: Colors.red),
              ),
            ]),
        ],
      ),
    );
  }

  Widget _buildSection(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 16),
        Text(
          title,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        ...children,
      ],
    );
  }

  Widget _buildRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}

/// Data Models

class NetworkRequest {
  final String id;
  final String method;
  final String url;
  final Map<String, dynamic> headers;
  final dynamic requestBody;
  final DateTime timestamp;
  final int? statusCode;
  final Map<String, dynamic>? responseHeaders;
  final dynamic responseBody;
  final Duration? duration;
  final String? error;

  NetworkRequest({
    required this.id,
    required this.method,
    required this.url,
    required this.headers,
    this.requestBody,
    required this.timestamp,
    this.statusCode,
    this.responseHeaders,
    this.responseBody,
    this.duration,
    this.error,
  });

  NetworkRequest copyWith({
    int? statusCode,
    Map<String, dynamic>? responseHeaders,
    dynamic responseBody,
    Duration? duration,
    String? error,
  }) {
    return NetworkRequest(
      id: id,
      method: method,
      url: url,
      headers: headers,
      requestBody: requestBody,
      timestamp: timestamp,
      statusCode: statusCode ?? this.statusCode,
      responseHeaders: responseHeaders ?? this.responseHeaders,
      responseBody: responseBody ?? this.responseBody,
      duration: duration ?? this.duration,
      error: error ?? this.error,
    );
  }
}

enum LogLevel {
  debug,
  info,
  warn,
  error,
}

class LogEntry {
  final DateTime timestamp;
  final LogLevel level;
  final String message;
  final Map<String, dynamic>? metadata;

  LogEntry({
    required this.timestamp,
    required this.level,
    required this.message,
    this.metadata,
  });
}

class CrashReport {
  final DateTime timestamp;
  final String error;
  final String stackTrace;

  CrashReport({
    required this.timestamp,
    required this.error,
    required this.stackTrace,
  });
}
