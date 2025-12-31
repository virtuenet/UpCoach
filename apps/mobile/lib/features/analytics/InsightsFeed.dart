import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';
import 'package:share_plus/share_plus.dart';

/// Insights Feed
///
/// Personalized insights feed with AI-generated recommendations
/// and actionable insights based on analytics data.
///
/// Features:
/// - AI-generated insights
/// - Insight prioritization
/// - Action recommendations
/// - Insight history
/// - Sharing insights
/// - Bookmark favorites
/// - Insight categories

class InsightsFeed extends StatefulWidget {
  const InsightsFeed({Key? key}) : super(key: key);

  @override
  _InsightsFeedState createState() => _InsightsFeedState();
}

class _InsightsFeedState extends State<InsightsFeed>
    with SingleTickerProviderStateMixin {
  List<Insight> _insights = [];
  bool _isLoading = true;
  String? _error;
  late TabController _tabController;
  String _selectedCategory = 'all';

  final List<String> _categories = [
    'all',
    'performance',
    'engagement',
    'goals',
    'revenue',
    'trends',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _categories.length, vsync: this);
    _loadInsights();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadInsights() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await http.get(
        Uri.parse('https://api.upcoach.com/v1/analytics/insights'),
        headers: {
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _insights = (data['insights'] as List)
              .map((json) => Insight.fromJson(json))
              .toList();
          _isLoading = false;
        });
      } else {
        throw Exception('Failed to load insights');
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<String> _getAuthToken() async {
    // Implement token retrieval
    return 'dummy_token';
  }

  List<Insight> _filterInsights() {
    if (_selectedCategory == 'all') {
      return _insights;
    }
    return _insights.where((i) => i.category == _selectedCategory).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Insights'),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          onTap: (index) {
            setState(() {
              _selectedCategory = _categories[index];
            });
          },
          tabs: _categories.map((category) {
            return Tab(
              text: category.toUpperCase(),
            );
          }).toList(),
        ),
      ),
      body: _buildBody(),
      floatingActionButton: FloatingActionButton(
        onPressed: _loadInsights,
        child: Icon(Icons.refresh),
        tooltip: 'Refresh Insights',
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red),
            SizedBox(height: 16),
            Text('Failed to load insights'),
            SizedBox(height: 8),
            Text(_error!, style: TextStyle(fontSize: 12, color: Colors.grey)),
            SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadInsights,
              child: Text('Retry'),
            ),
          ],
        ),
      );
    }

    final filteredInsights = _filterInsights();

    if (filteredInsights.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.lightbulb_outline, size: 64, color: Colors.grey[400]),
            SizedBox(height: 16),
            Text(
              'No insights available',
              style: TextStyle(fontSize: 18, color: Colors.grey[600]),
            ),
            SizedBox(height: 8),
            Text(
              'Check back later for personalized insights',
              style: TextStyle(fontSize: 14, color: Colors.grey[500]),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadInsights,
      child: ListView.builder(
        padding: EdgeInsets.all(16),
        itemCount: filteredInsights.length,
        itemBuilder: (context, index) {
          return InsightCard(
            insight: filteredInsights[index],
            onAction: () => _handleInsightAction(filteredInsights[index]),
            onShare: () => _shareInsight(filteredInsights[index]),
            onBookmark: () => _toggleBookmark(filteredInsights[index]),
          );
        },
      ),
    );
  }

  void _handleInsightAction(Insight insight) {
    if (insight.actionUrl != null) {
      // Navigate to action URL
      Navigator.pushNamed(context, insight.actionUrl!);
    }
  }

  Future<void> _shareInsight(Insight insight) async {
    await Share.share(
      '${insight.title}\n\n${insight.description}\n\nGenerated by UpCoach Analytics',
      subject: insight.title,
    );
  }

  Future<void> _toggleBookmark(Insight insight) async {
    setState(() {
      insight.isBookmarked = !insight.isBookmarked;
    });

    try {
      await http.post(
        Uri.parse('https://api.upcoach.com/v1/analytics/insights/${insight.id}/bookmark'),
        headers: {
          'Authorization': 'Bearer ${await _getAuthToken()}',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({'bookmarked': insight.isBookmarked}),
      );
    } catch (e) {
      // Revert on error
      setState(() {
        insight.isBookmarked = !insight.isBookmarked;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to bookmark insight')),
      );
    }
  }
}

class InsightCard extends StatelessWidget {
  final Insight insight;
  final VoidCallback onAction;
  final VoidCallback onShare;
  final VoidCallback onBookmark;

  const InsightCard({
    Key? key,
    required this.insight,
    required this.onAction,
    required this.onShare,
    required this.onBookmark,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.only(bottom: 16),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Container(
            padding: EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: _getPriorityColor().withOpacity(0.1),
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(12),
                topRight: Radius.circular(12),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  _getCategoryIcon(),
                  color: _getPriorityColor(),
                  size: 24,
                ),
                SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        insight.title,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.grey[900],
                        ),
                      ),
                      SizedBox(height: 4),
                      Row(
                        children: [
                          _PriorityBadge(priority: insight.priority),
                          SizedBox(width: 8),
                          Text(
                            insight.category.toUpperCase(),
                            style: TextStyle(
                              fontSize: 10,
                              color: Colors.grey[600],
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          Spacer(),
                          Text(
                            _formatDate(insight.generatedAt),
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[500],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Content
          Padding(
            padding: EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  insight.description,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[700],
                    height: 1.5,
                  ),
                ),
                if (insight.metrics != null && insight.metrics!.isNotEmpty) ...[
                  SizedBox(height: 16),
                  _buildMetrics(),
                ],
                if (insight.recommendation != null) ...[
                  SizedBox(height: 16),
                  _buildRecommendation(),
                ],
              ],
            ),
          ),

          // Actions
          Divider(height: 1),
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            child: Row(
              children: [
                IconButton(
                  icon: Icon(
                    insight.isBookmarked ? Icons.bookmark : Icons.bookmark_border,
                  ),
                  onPressed: onBookmark,
                  color: insight.isBookmarked ? Colors.amber : Colors.grey,
                ),
                IconButton(
                  icon: Icon(Icons.share),
                  onPressed: onShare,
                  color: Colors.grey,
                ),
                Spacer(),
                if (insight.actionLabel != null)
                  TextButton.icon(
                    onPressed: onAction,
                    icon: Icon(Icons.arrow_forward, size: 16),
                    label: Text(insight.actionLabel!),
                    style: TextButton.styleFrom(
                      foregroundColor: _getPriorityColor(),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetrics() {
    return Container(
      padding: EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Key Metrics',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Colors.grey[700],
            ),
          ),
          SizedBox(height: 8),
          ...insight.metrics!.entries.map((entry) {
            return Padding(
              padding: EdgeInsets.symmetric(vertical: 4),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    entry.key,
                    style: TextStyle(fontSize: 13, color: Colors.grey[600]),
                  ),
                  Text(
                    _formatMetricValue(entry.value),
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: Colors.grey[900],
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        ],
      ),
    );
  }

  Widget _buildRecommendation() {
    return Container(
      padding: EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.blue[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.blue[200]!),
      ),
      child: Row(
        children: [
          Icon(Icons.tips_and_updates, color: Colors.blue[700], size: 20),
          SizedBox(width: 12),
          Expanded(
            child: Text(
              insight.recommendation!,
              style: TextStyle(
                fontSize: 13,
                color: Colors.blue[900],
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _getPriorityColor() {
    switch (insight.priority) {
      case 'critical':
        return Colors.red;
      case 'high':
        return Colors.orange;
      case 'medium':
        return Colors.blue;
      case 'low':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  IconData _getCategoryIcon() {
    switch (insight.category) {
      case 'performance':
        return Icons.trending_up;
      case 'engagement':
        return Icons.people;
      case 'goals':
        return Icons.flag;
      case 'revenue':
        return Icons.attach_money;
      case 'trends':
        return Icons.show_chart;
      default:
        return Icons.lightbulb;
    }
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);

    if (diff.inDays == 0) {
      if (diff.inHours == 0) {
        return '${diff.inMinutes}m ago';
      }
      return '${diff.inHours}h ago';
    } else if (diff.inDays < 7) {
      return '${diff.inDays}d ago';
    } else {
      return DateFormat('MMM dd').format(date);
    }
  }

  String _formatMetricValue(dynamic value) {
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

class _PriorityBadge extends StatelessWidget {
  final String priority;

  const _PriorityBadge({required this.priority});

  @override
  Widget build(BuildContext context) {
    Color color;
    String label;

    switch (priority) {
      case 'critical':
        color = Colors.red;
        label = 'CRITICAL';
        break;
      case 'high':
        color = Colors.orange;
        label = 'HIGH';
        break;
      case 'medium':
        color = Colors.blue;
        label = 'MEDIUM';
        break;
      case 'low':
        color = Colors.green;
        label = 'LOW';
        break;
      default:
        color = Colors.grey;
        label = priority.toUpperCase();
    }

    return Container(
      padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.2),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.bold,
          color: color.shade800,
        ),
      ),
    );
  }
}

// Data Models

class Insight {
  final String id;
  final String title;
  final String description;
  final String category;
  final String priority;
  final DateTime generatedAt;
  final Map<String, dynamic>? metrics;
  final String? recommendation;
  final String? actionLabel;
  final String? actionUrl;
  bool isBookmarked;
  final double confidence;

  Insight({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    required this.priority,
    required this.generatedAt,
    this.metrics,
    this.recommendation,
    this.actionLabel,
    this.actionUrl,
    this.isBookmarked = false,
    required this.confidence,
  });

  factory Insight.fromJson(Map<String, dynamic> json) {
    return Insight(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      category: json['category'],
      priority: json['priority'],
      generatedAt: DateTime.parse(json['generatedAt']),
      metrics: json['metrics'],
      recommendation: json['recommendation'],
      actionLabel: json['actionLabel'],
      actionUrl: json['actionUrl'],
      isBookmarked: json['isBookmarked'] ?? false,
      confidence: (json['confidence'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'category': category,
      'priority': priority,
      'generatedAt': generatedAt.toIso8601String(),
      'metrics': metrics,
      'recommendation': recommendation,
      'actionLabel': actionLabel,
      'actionUrl': actionUrl,
      'isBookmarked': isBookmarked,
      'confidence': confidence,
    };
  }
}
