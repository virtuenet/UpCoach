// Performance overlay for development
//
// Displays real-time performance metrics during development.

import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'performance_monitor.dart';
import 'image_optimizer.dart';

/// Performance overlay widget (dev mode only)
class PerformanceOverlay extends StatefulWidget {
  final Widget child;
  final bool enabled;

  const PerformanceOverlay({
    super.key,
    required this.child,
    this.enabled = kDebugMode,
  });

  @override
  State<PerformanceOverlay> createState() => _PerformanceOverlayState();
}

class _PerformanceOverlayState extends State<PerformanceOverlay> {
  final PerformanceMonitor _monitor = PerformanceMonitor();
  PerformanceMetrics? _currentMetrics;
  bool _isExpanded = false;

  @override
  void initState() {
    super.initState();
    if (widget.enabled) {
      _monitor.startMonitoring();
      _monitor.addMetricsCallback(_onMetricsUpdate);
    }
  }

  @override
  void dispose() {
    if (widget.enabled) {
      _monitor.removeMetricsCallback(_onMetricsUpdate);
      _monitor.dispose();
    }
    super.dispose();
  }

  void _onMetricsUpdate(PerformanceMetrics metrics) {
    if (mounted) {
      setState(() {
        _currentMetrics = metrics;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.enabled) {
      return widget.child;
    }

    return Stack(
      children: [
        widget.child,
        Positioned(
          top: MediaQuery.of(context).padding.top + 10,
          right: 10,
          child: _buildOverlayCard(),
        ),
      ],
    );
  }

  Widget _buildOverlayCard() {
    if (_currentMetrics == null) {
      return const SizedBox.shrink();
    }

    final isGood = _monitor.isPerformanceGood();
    final color = isGood ? Colors.green : Colors.orange;

    return GestureDetector(
      onTap: () => setState(() => _isExpanded = !_isExpanded),
      child: Card(
        color: Colors.black.withValues(alpha: 0.8),
        child: Padding(
          padding: const EdgeInsets.all(8.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.speed, color: color, size: 16),
                  const SizedBox(width: 4),
                  Text(
                    '${_currentMetrics!.averageFps.toStringAsFixed(1)} FPS',
                    style: TextStyle(
                      color: color,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Icon(
                    _isExpanded ? Icons.expand_less : Icons.expand_more,
                    color: Colors.white,
                    size: 16,
                  ),
                ],
              ),
              if (_isExpanded) ...[
                const Divider(color: Colors.white24, height: 16),
                _buildMetricRow(
                  'Max Frame',
                  '${_currentMetrics!.maxFrameTime.toStringAsFixed(2)}ms',
                  _currentMetrics!.maxFrameTime < 16.67
                      ? Colors.green
                      : Colors.red,
                ),
                _buildMetricRow(
                  'Memory',
                  '${_currentMetrics!.memoryUsageMb}MB',
                  _currentMetrics!.memoryUsageMb < 150
                      ? Colors.green
                      : Colors.orange,
                ),
                _buildMetricRow(
                  'Frames',
                  '${_currentMetrics!.frameCount}',
                  Colors.blue,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMetricRow(String label, String value, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: 70,
            child: Text(
              label,
              style: const TextStyle(color: Colors.white70, fontSize: 10),
            ),
          ),
          Text(
            value,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.bold,
              fontSize: 10,
            ),
          ),
        ],
      ),
    );
  }
}

/// Performance debug screen
class PerformanceDebugScreen extends StatefulWidget {
  const PerformanceDebugScreen({super.key});

  @override
  State<PerformanceDebugScreen> createState() => _PerformanceDebugScreenState();
}

class _PerformanceDebugScreenState extends State<PerformanceDebugScreen> {
  final PerformanceMonitor _monitor = PerformanceMonitor();

  @override
  void initState() {
    super.initState();
    _monitor.startMonitoring();
  }

  @override
  void dispose() {
    _monitor.stopMonitoring();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Performance Debug'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => setState(() {}),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildCurrentMetricsCard(),
          const SizedBox(height: 16),
          _buildRouteStatsCard(),
          const SizedBox(height: 16),
          _buildWarningsCard(),
          const SizedBox(height: 16),
          _buildActionsCard(),
        ],
      ),
    );
  }

  Widget _buildCurrentMetricsCard() {
    final metrics = _monitor.getMetrics();
    final isGood = _monitor.isPerformanceGood();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  isGood ? Icons.check_circle : Icons.warning,
                  color: isGood ? Colors.green : Colors.orange,
                ),
                const SizedBox(width: 8),
                Text(
                  'Current Performance',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
              ],
            ),
            const Divider(),
            _buildMetricTile(
                'Average FPS', metrics.averageFps.toStringAsFixed(1)),
            _buildMetricTile('Max Frame Time',
                '${metrics.maxFrameTime.toStringAsFixed(2)}ms'),
            _buildMetricTile('Memory Usage', '${metrics.memoryUsageMb}MB'),
            _buildMetricTile('Total Frames', '${metrics.frameCount}'),
          ],
        ),
      ),
    );
  }

  Widget _buildRouteStatsCard() {
    final routeStats = _monitor.getAllRouteStats();

    if (routeStats.isEmpty) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Route Performance',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              const Text('No route timing data available'),
            ],
          ),
        ),
      );
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Route Performance',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const Divider(),
            ...routeStats.entries.map((entry) {
              final stats = entry.value;
              return ListTile(
                dense: true,
                title: Text(entry.key),
                subtitle: Text(
                  'Avg: ${stats['avgNavigationMs']}ms | '
                  'Min: ${stats['minNavigationMs']}ms | '
                  'Max: ${stats['maxNavigationMs']}ms',
                  style: const TextStyle(fontSize: 11),
                ),
                trailing: Chip(
                  label: Text('${stats['count']}'),
                  visualDensity: VisualDensity.compact,
                ),
              );
            }),
          ],
        ),
      ),
    );
  }

  Widget _buildWarningsCard() {
    final warnings = _monitor.getPerformanceWarnings();

    if (warnings.isEmpty) {
      return const SizedBox.shrink();
    }

    return Card(
      color: Colors.orange.shade50,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.warning, color: Colors.orange),
                const SizedBox(width: 8),
                Text(
                  'Performance Warnings',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
              ],
            ),
            const Divider(),
            ...warnings.map((warning) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline,
                          size: 16, color: Colors.orange),
                      const SizedBox(width: 8),
                      Text(warning),
                    ],
                  ),
                )),
          ],
        ),
      ),
    );
  }

  Widget _buildActionsCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Actions',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            ElevatedButton.icon(
              onPressed: () {
                ImageCacheManager().clearCache();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Image cache cleared')),
                );
              },
              icon: const Icon(Icons.delete_sweep),
              label: const Text('Clear Image Cache'),
            ),
            const SizedBox(height: 8),
            ElevatedButton.icon(
              onPressed: () {
                final stats = ImageCacheManager().getCacheStats();
                showDialog(
                  context: context,
                  builder: (context) => AlertDialog(
                    title: const Text('Cache Statistics'),
                    content: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Current Size: ${stats['currentSize']}'),
                        Text('Current Bytes: ${stats['currentSizeBytes']}'),
                        Text('Live Images: ${stats['liveImageCount']}'),
                        Text('Pending: ${stats['pendingImageCount']}'),
                      ],
                    ),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('Close'),
                      ),
                    ],
                  ),
                );
              },
              icon: const Icon(Icons.info_outline),
              label: const Text('View Cache Stats'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricTile(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontWeight: FontWeight.w500)),
          Text(value, style: const TextStyle(color: Colors.blue)),
        ],
      ),
    );
  }
}
