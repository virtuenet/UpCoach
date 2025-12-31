import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

/// Mobile Report Viewer
///
/// Mobile-optimized report viewer with offline caching,
/// synchronization, and export capabilities.
///
/// Features:
/// - Offline report caching
/// - Report synchronization
/// - Interactive charts on mobile
/// - Share report functionality
/// - Export options (PDF, Excel, CSV)
/// - Pull-to-refresh
/// - Favorite reports

class MobileReportViewer extends StatefulWidget {
  final String reportId;

  const MobileReportViewer({
    Key? key,
    required this.reportId,
  }) : super(key: key);

  @override
  _MobileReportViewerState createState() => _MobileReportViewerState();
}

class _MobileReportViewerState extends State<MobileReportViewer> {
  Report? _report;
  ReportData? _reportData;
  bool _isLoading = true;
  bool _isOffline = false;
  bool _isFavorite = false;
  String? _error;

  final ReportCacheManager _cacheManager = ReportCacheManager();
  final ReportSyncService _syncService = ReportSyncService();

  @override
  void initState() {
    super.initState();
    _loadReport();
    _checkConnectivity();
  }

  Future<void> _checkConnectivity() async {
    final connectivityResult = await Connectivity().checkConnectivity();
    setState(() {
      _isOffline = connectivityResult == ConnectivityResult.none;
    });

    Connectivity().onConnectivityChanged.listen((result) {
      setState(() {
        _isOffline = result == ConnectivityResult.none;
      });

      if (!_isOffline) {
        _syncReport();
      }
    });
  }

  Future<void> _loadReport() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Try to load from cache first
      final cachedReport = await _cacheManager.getCachedReport(widget.reportId);
      if (cachedReport != null) {
        setState(() {
          _report = cachedReport.report;
          _reportData = cachedReport.data;
          _isLoading = false;
        });
      }

      // Fetch fresh data if online
      if (!_isOffline) {
        await _fetchReport();
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _fetchReport() async {
    try {
      final response = await http.get(
        Uri.parse('https://api.upcoach.com/v1/reporting/reports/${widget.reportId}'),
        headers: {
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
      );

      if (response.statusCode == 200) {
        final json = jsonDecode(response.body);
        final report = Report.fromJson(json['report']);
        final data = ReportData.fromJson(json['data']);

        await _cacheManager.cacheReport(widget.reportId, report, data);

        setState(() {
          _report = report;
          _reportData = data;
          _isLoading = false;
        });
      } else {
        throw Exception('Failed to load report');
      }
    } catch (e) {
      if (_report == null) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _syncReport() async {
    if (_isOffline) return;

    await _syncService.syncReport(widget.reportId);
    await _fetchReport();
  }

  Future<void> _exportReport(String format) async {
    try {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          content: Row(
            children: [
              CircularProgressIndicator(),
              SizedBox(width: 16),
              Text('Exporting report...'),
            ],
          ),
        ),
      );

      final response = await http.get(
        Uri.parse(
          'https://api.upcoach.com/v1/reporting/reports/${widget.reportId}/export?format=$format',
        ),
        headers: {
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
      );

      Navigator.pop(context); // Close loading dialog

      if (response.statusCode == 200) {
        final bytes = response.bodyBytes;
        final tempDir = await getTemporaryDirectory();
        final file = File('${tempDir.path}/report.$format');
        await file.writeAsBytes(bytes);

        await Share.shareXFiles(
          [XFile(file.path)],
          subject: _report?.name ?? 'Report',
        );
      } else {
        throw Exception('Export failed');
      }
    } catch (e) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Export failed: $e')),
      );
    }
  }

  Future<void> _toggleFavorite() async {
    setState(() {
      _isFavorite = !_isFavorite;
    });

    await _cacheManager.setFavorite(widget.reportId, _isFavorite);
  }

  Future<String> _getAuthToken() async {
    // Implement auth token retrieval
    return 'dummy_token';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_report?.name ?? 'Report'),
        actions: [
          if (_isOffline)
            Padding(
              padding: EdgeInsets.all(8.0),
              child: Chip(
                label: Text('Offline', style: TextStyle(fontSize: 12)),
                backgroundColor: Colors.orange[100],
              ),
            ),
          IconButton(
            icon: Icon(_isFavorite ? Icons.star : Icons.star_border),
            onPressed: _toggleFavorite,
          ),
          PopupMenuButton<String>(
            onSelected: (value) {
              if (value == 'refresh') {
                _syncReport();
              } else if (value.startsWith('export_')) {
                final format = value.substring(7);
                _exportReport(format);
              }
            },
            itemBuilder: (context) => [
              PopupMenuItem(
                value: 'refresh',
                child: Row(
                  children: [
                    Icon(Icons.refresh),
                    SizedBox(width: 8),
                    Text('Refresh'),
                  ],
                ),
              ),
              PopupMenuDivider(),
              PopupMenuItem(
                value: 'export_pdf',
                child: Row(
                  children: [
                    Icon(Icons.picture_as_pdf),
                    SizedBox(width: 8),
                    Text('Export as PDF'),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'export_excel',
                child: Row(
                  children: [
                    Icon(Icons.table_chart),
                    SizedBox(width: 8),
                    Text('Export as Excel'),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'export_csv',
                child: Row(
                  children: [
                    Icon(Icons.text_snippet),
                    SizedBox(width: 8),
                    Text('Export as CSV'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading && _report == null) {
      return Center(child: CircularProgressIndicator());
    }

    if (_error != null && _report == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red),
            SizedBox(height: 16),
            Text('Failed to load report'),
            SizedBox(height: 8),
            Text(_error!, style: TextStyle(fontSize: 12, color: Colors.grey)),
            SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadReport,
              child: Text('Retry'),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _syncReport,
      child: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(),
            SizedBox(height: 24),
            _buildMetrics(),
            SizedBox(height: 24),
            _buildVisualizations(),
            SizedBox(height: 24),
            _buildDataPreview(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _report?.name ?? '',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            if (_report?.description != null && _report!.description.isNotEmpty)
              Padding(
                padding: EdgeInsets.only(top: 8),
                child: Text(
                  _report!.description,
                  style: TextStyle(color: Colors.grey[600]),
                ),
              ),
            SizedBox(height: 12),
            Row(
              children: [
                Icon(Icons.access_time, size: 16, color: Colors.grey),
                SizedBox(width: 4),
                Text(
                  'Generated: ${_formatDate(_reportData?.generatedAt)}',
                  style: TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetrics() {
    if (_reportData?.metrics == null || _reportData!.metrics.isEmpty) {
      return SizedBox.shrink();
    }

    final metrics = _reportData!.metrics.entries.toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Key Metrics',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        SizedBox(height: 12),
        GridView.builder(
          shrinkWrap: true,
          physics: NeverScrollableScrollPhysics(),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 1.5,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
          ),
          itemCount: metrics.length,
          itemBuilder: (context, index) {
            final entry = metrics[index];
            return _MetricCard(
              name: entry.key,
              value: entry.value,
            );
          },
        ),
      ],
    );
  }

  Widget _buildVisualizations() {
    if (_reportData?.visualizations == null || _reportData!.visualizations.isEmpty) {
      return SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Visualizations',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        SizedBox(height: 12),
        ...(_reportData!.visualizations.map((viz) => _buildVisualization(viz))),
      ],
    );
  }

  Widget _buildVisualization(Visualization viz) {
    return Card(
      margin: EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              viz.config.title ?? '',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            SizedBox(height: 16),
            SizedBox(
              height: 250,
              child: _buildChart(viz),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChart(Visualization viz) {
    if (viz.type == 'chart') {
      switch (viz.chartType) {
        case 'line':
          return _buildLineChart(viz);
        case 'bar':
          return _buildBarChart(viz);
        case 'pie':
          return _buildPieChart(viz);
        default:
          return Center(child: Text('Unsupported chart type'));
      }
    } else if (viz.type == 'metric') {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              viz.data['value']?.toString() ?? '0',
              style: TextStyle(fontSize: 48, fontWeight: FontWeight.bold),
            ),
            Text(
              viz.data['name'] ?? '',
              style: TextStyle(fontSize: 16, color: Colors.grey),
            ),
          ],
        ),
      );
    }

    return SizedBox.shrink();
  }

  Widget _buildLineChart(Visualization viz) {
    final data = viz.data as List<dynamic>? ?? [];
    if (data.isEmpty) return Center(child: Text('No data'));

    return LineChart(
      LineChartData(
        gridData: FlGridData(show: true),
        titlesData: FlTitlesData(
          leftTitles: AxisTitles(
            sideTitles: SideTitles(showTitles: true, reservedSize: 40),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(showTitles: true, reservedSize: 30),
          ),
          rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
          topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
        borderData: FlBorderData(show: true),
        lineBarsData: [
          LineChartBarData(
            spots: data
                .asMap()
                .entries
                .map((e) => FlSpot(
                      e.key.toDouble(),
                      (e.value['y'] ?? 0).toDouble(),
                    ))
                .toList(),
            isCurved: true,
            color: Colors.blue,
            barWidth: 3,
            dotData: FlDotData(show: false),
          ),
        ],
      ),
    );
  }

  Widget _buildBarChart(Visualization viz) {
    final data = viz.data as List<dynamic>? ?? [];
    if (data.isEmpty) return Center(child: Text('No data'));

    return BarChart(
      BarChartData(
        gridData: FlGridData(show: true),
        titlesData: FlTitlesData(
          leftTitles: AxisTitles(
            sideTitles: SideTitles(showTitles: true, reservedSize: 40),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(showTitles: true, reservedSize: 30),
          ),
          rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
          topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
        borderData: FlBorderData(show: true),
        barGroups: data
            .asMap()
            .entries
            .map((e) => BarChartGroupData(
                  x: e.key,
                  barRods: [
                    BarChartRodData(
                      toY: (e.value['value'] ?? 0).toDouble(),
                      color: Colors.blue,
                      width: 20,
                    ),
                  ],
                ))
            .toList(),
      ),
    );
  }

  Widget _buildPieChart(Visualization viz) {
    final data = viz.data as List<dynamic>? ?? [];
    if (data.isEmpty) return Center(child: Text('No data'));

    final colors = [
      Colors.blue,
      Colors.purple,
      Colors.green,
      Colors.orange,
      Colors.red,
    ];

    return PieChart(
      PieChartData(
        sections: data
            .asMap()
            .entries
            .map((e) => PieChartSectionData(
                  value: (e.value['value'] ?? 0).toDouble(),
                  title: '${e.value['name']}',
                  color: colors[e.key % colors.length],
                  radius: 100,
                ))
            .toList(),
        sectionsSpace: 2,
        centerSpaceRadius: 40,
      ),
    );
  }

  Widget _buildDataPreview() {
    if (_reportData?.data == null || _reportData!.data.isEmpty) {
      return SizedBox.shrink();
    }

    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Data Preview',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            SizedBox(height: 12),
            Text(
              'Showing first 5 of ${_reportData!.data.length} records',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
            SizedBox(height: 12),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: DataTable(
                columns: _getTableColumns(),
                rows: _getTableRows(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<DataColumn> _getTableColumns() {
    if (_reportData!.data.isEmpty) return [];

    final firstRow = _reportData!.data.first as Map<String, dynamic>;
    return firstRow.keys
        .map((key) => DataColumn(label: Text(key)))
        .toList();
  }

  List<DataRow> _getTableRows() {
    final preview = _reportData!.data.take(5);
    return preview.map((row) {
      final rowData = row as Map<String, dynamic>;
      return DataRow(
        cells: rowData.values
            .map((value) => DataCell(Text(value?.toString() ?? '-')))
            .toList(),
      );
    }).toList();
  }

  String _formatDate(DateTime? date) {
    if (date == null) return 'Unknown';
    return '${date.day}/${date.month}/${date.year} ${date.hour}:${date.minute}';
  }
}

class _MetricCard extends StatelessWidget {
  final String name;
  final dynamic value;

  const _MetricCard({
    required this.name,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: EdgeInsets.all(12),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              _formatValue(value),
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: Colors.blue,
              ),
            ),
            SizedBox(height: 8),
            Text(
              name,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  String _formatValue(dynamic value) {
    if (value is num) {
      if (value >= 1000000) {
        return '${(value / 1000000).toStringAsFixed(1)}M';
      } else if (value >= 1000) {
        return '${(value / 1000).toStringAsFixed(1)}K';
      }
      return value.toStringAsFixed(0);
    }
    return value.toString();
  }
}

// Data Models

class Report {
  final String id;
  final String name;
  final String description;
  final DateTime createdAt;
  final DateTime updatedAt;

  Report({
    required this.id,
    required this.name,
    required this.description,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Report.fromJson(Map<String, dynamic> json) {
    return Report(
      id: json['id'],
      name: json['name'],
      description: json['description'] ?? '',
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}

class ReportData {
  final DateTime generatedAt;
  final List<dynamic> data;
  final Map<String, dynamic> metrics;
  final List<Visualization> visualizations;

  ReportData({
    required this.generatedAt,
    required this.data,
    required this.metrics,
    required this.visualizations,
  });

  factory ReportData.fromJson(Map<String, dynamic> json) {
    return ReportData(
      generatedAt: DateTime.parse(json['generatedAt']),
      data: json['data'] ?? [],
      metrics: Map<String, dynamic>.from(json['metrics'] ?? {}),
      visualizations: (json['visualizations'] as List<dynamic>?)
              ?.map((v) => Visualization.fromJson(v))
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'generatedAt': generatedAt.toIso8601String(),
      'data': data,
      'metrics': metrics,
      'visualizations': visualizations.map((v) => v.toJson()).toList(),
    };
  }
}

class Visualization {
  final String id;
  final String type;
  final String? chartType;
  final dynamic data;
  final VisualizationConfig config;

  Visualization({
    required this.id,
    required this.type,
    this.chartType,
    required this.data,
    required this.config,
  });

  factory Visualization.fromJson(Map<String, dynamic> json) {
    return Visualization(
      id: json['id'],
      type: json['type'],
      chartType: json['chartType'],
      data: json['data'],
      config: VisualizationConfig.fromJson(json['config']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type,
      'chartType': chartType,
      'data': data,
      'config': config.toJson(),
    };
  }
}

class VisualizationConfig {
  final String? title;
  final String? dataKey;

  VisualizationConfig({
    this.title,
    this.dataKey,
  });

  factory VisualizationConfig.fromJson(Map<String, dynamic> json) {
    return VisualizationConfig(
      title: json['title'],
      dataKey: json['dataKey'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'dataKey': dataKey,
    };
  }
}

class CachedReport {
  final Report report;
  final ReportData data;
  final DateTime cachedAt;

  CachedReport({
    required this.report,
    required this.data,
    required this.cachedAt,
  });

  factory CachedReport.fromJson(Map<String, dynamic> json) {
    return CachedReport(
      report: Report.fromJson(json['report']),
      data: ReportData.fromJson(json['data']),
      cachedAt: DateTime.parse(json['cachedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'report': report.toJson(),
      'data': data.toJson(),
      'cachedAt': cachedAt.toIso8601String(),
    };
  }
}

// Services

class ReportCacheManager {
  Future<CachedReport?> getCachedReport(String reportId) async {
    try {
      final directory = await getApplicationDocumentsDirectory();
      final file = File('${directory.path}/reports/$reportId.json');

      if (!await file.exists()) return null;

      final json = jsonDecode(await file.readAsString());
      return CachedReport.fromJson(json);
    } catch (e) {
      return null;
    }
  }

  Future<void> cacheReport(
    String reportId,
    Report report,
    ReportData data,
  ) async {
    try {
      final directory = await getApplicationDocumentsDirectory();
      final reportsDir = Directory('${directory.path}/reports');

      if (!await reportsDir.exists()) {
        await reportsDir.create(recursive: true);
      }

      final file = File('${reportsDir.path}/$reportId.json');
      final cached = CachedReport(
        report: report,
        data: data,
        cachedAt: DateTime.now(),
      );

      await file.writeAsString(jsonEncode(cached.toJson()));
    } catch (e) {
      print('Failed to cache report: $e');
    }
  }

  Future<void> setFavorite(String reportId, bool isFavorite) async {
    // Implement favorite persistence
  }
}

class ReportSyncService {
  Future<void> syncReport(String reportId) async {
    // Implement sync logic
  }
}
