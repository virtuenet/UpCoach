import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Knowledge node representing a concept, skill, or learning item
class KnowledgeNode {
  final String id;
  final String label;
  final String type; // 'concept', 'skill', 'habit', 'goal', 'insight'
  final Map<String, dynamic> metadata;
  double mastery; // 0.0 - 1.0
  int accessCount;
  DateTime lastAccessed;
  DateTime createdAt;

  KnowledgeNode({
    required this.id,
    required this.label,
    required this.type,
    this.metadata = const {},
    this.mastery = 0.0,
    this.accessCount = 0,
    DateTime? lastAccessed,
    DateTime? createdAt,
  })  : lastAccessed = lastAccessed ?? DateTime.now(),
        createdAt = createdAt ?? DateTime.now();

  Map<String, dynamic> toJson() => {
        'id': id,
        'label': label,
        'type': type,
        'metadata': metadata,
        'mastery': mastery,
        'accessCount': accessCount,
        'lastAccessed': lastAccessed.toIso8601String(),
        'createdAt': createdAt.toIso8601String(),
      };

  factory KnowledgeNode.fromJson(Map<String, dynamic> json) => KnowledgeNode(
        id: json['id'],
        label: json['label'],
        type: json['type'],
        metadata: Map<String, dynamic>.from(json['metadata'] ?? {}),
        mastery: (json['mastery'] ?? 0.0).toDouble(),
        accessCount: json['accessCount'] ?? 0,
        lastAccessed: DateTime.parse(
            json['lastAccessed'] ?? DateTime.now().toIso8601String()),
        createdAt: DateTime.parse(
            json['createdAt'] ?? DateTime.now().toIso8601String()),
      );
}

/// Edge connecting two knowledge nodes
class KnowledgeEdge {
  final String sourceId;
  final String targetId;
  final String type; // 'prerequisite', 'related', 'supports', 'leads_to'
  double weight; // Connection strength 0.0 - 1.0
  int traversalCount;

  KnowledgeEdge({
    required this.sourceId,
    required this.targetId,
    required this.type,
    this.weight = 0.5,
    this.traversalCount = 0,
  });

  Map<String, dynamic> toJson() => {
        'sourceId': sourceId,
        'targetId': targetId,
        'type': type,
        'weight': weight,
        'traversalCount': traversalCount,
      };

  factory KnowledgeEdge.fromJson(Map<String, dynamic> json) => KnowledgeEdge(
        sourceId: json['sourceId'],
        targetId: json['targetId'],
        type: json['type'],
        weight: (json['weight'] ?? 0.5).toDouble(),
        traversalCount: json['traversalCount'] ?? 0,
      );
}

/// Learning path through the knowledge graph
class LearningPath {
  final String id;
  final String name;
  final String description;
  final List<String> nodeIds;
  final double progress;
  final DateTime createdAt;

  const LearningPath({
    required this.id,
    required this.name,
    required this.description,
    required this.nodeIds,
    this.progress = 0.0,
    required this.createdAt,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'description': description,
        'nodeIds': nodeIds,
        'progress': progress,
        'createdAt': createdAt.toIso8601String(),
      };

  factory LearningPath.fromJson(Map<String, dynamic> json) => LearningPath(
        id: json['id'],
        name: json['name'],
        description: json['description'],
        nodeIds: List<String>.from(json['nodeIds']),
        progress: (json['progress'] ?? 0.0).toDouble(),
        createdAt: DateTime.parse(json['createdAt']),
      );
}

/// Knowledge Graph Service for connected learning
class KnowledgeGraphService {
  static const _prefsNodesKey = 'knowledge_nodes';
  static const _prefsEdgesKey = 'knowledge_edges';
  static const _prefsPathsKey = 'learning_paths';

  final Map<String, KnowledgeNode> _nodes = {};
  final List<KnowledgeEdge> _edges = [];
  final List<LearningPath> _paths = [];

  // Adjacency list for efficient graph traversal
  final Map<String, List<String>> _adjacencyList = {};

  // Stream controllers
  final _nodesController = StreamController<List<KnowledgeNode>>.broadcast();
  final _pathsController = StreamController<List<LearningPath>>.broadcast();

  /// Stream of nodes
  Stream<List<KnowledgeNode>> get nodesStream => _nodesController.stream;

  /// Stream of paths
  Stream<List<LearningPath>> get pathsStream => _pathsController.stream;

  /// Get all nodes
  List<KnowledgeNode> get nodes => _nodes.values.toList();

  /// Get all edges
  List<KnowledgeEdge> get edges => List.unmodifiable(_edges);

  /// Get all paths
  List<LearningPath> get paths => List.unmodifiable(_paths);

  /// Initialize the knowledge graph
  Future<void> initialize() async {
    await _loadGraph();
    _buildAdjacencyList();
    debugPrint(
        '[KnowledgeGraph] Initialized with ${_nodes.length} nodes, ${_edges.length} edges');
  }

  /// Load graph from storage
  Future<void> _loadGraph() async {
    final prefs = await SharedPreferences.getInstance();

    // Load nodes
    final nodesJson = prefs.getString(_prefsNodesKey);
    if (nodesJson != null) {
      final List<dynamic> decoded = jsonDecode(nodesJson);
      for (final json in decoded) {
        final node = KnowledgeNode.fromJson(json);
        _nodes[node.id] = node;
      }
    }

    // Load edges
    final edgesJson = prefs.getString(_prefsEdgesKey);
    if (edgesJson != null) {
      final List<dynamic> decoded = jsonDecode(edgesJson);
      _edges.addAll(decoded.map((j) => KnowledgeEdge.fromJson(j)));
    }

    // Load paths
    final pathsJson = prefs.getString(_prefsPathsKey);
    if (pathsJson != null) {
      final List<dynamic> decoded = jsonDecode(pathsJson);
      _paths.addAll(decoded.map((j) => LearningPath.fromJson(j)));
    }

    _nodesController.add(nodes);
    _pathsController.add(_paths);
  }

  /// Save graph to storage
  Future<void> _saveGraph() async {
    final prefs = await SharedPreferences.getInstance();

    await prefs.setString(
      _prefsNodesKey,
      jsonEncode(nodes.map((n) => n.toJson()).toList()),
    );
    await prefs.setString(
      _prefsEdgesKey,
      jsonEncode(_edges.map((e) => e.toJson()).toList()),
    );
    await prefs.setString(
      _prefsPathsKey,
      jsonEncode(_paths.map((p) => p.toJson()).toList()),
    );

    _nodesController.add(nodes);
    _pathsController.add(_paths);
  }

  /// Build adjacency list from edges
  void _buildAdjacencyList() {
    _adjacencyList.clear();

    for (final node in _nodes.values) {
      _adjacencyList[node.id] = [];
    }

    for (final edge in _edges) {
      _adjacencyList[edge.sourceId]?.add(edge.targetId);
      // Add reverse edge for 'related' type (bidirectional)
      if (edge.type == 'related') {
        _adjacencyList[edge.targetId]?.add(edge.sourceId);
      }
    }
  }

  /// Add a node to the graph
  Future<void> addNode(KnowledgeNode node) async {
    _nodes[node.id] = node;
    _adjacencyList[node.id] = [];
    await _saveGraph();
  }

  /// Add multiple nodes
  Future<void> addNodes(List<KnowledgeNode> nodes) async {
    for (final node in nodes) {
      _nodes[node.id] = node;
      _adjacencyList[node.id] = [];
    }
    await _saveGraph();
  }

  /// Add an edge between nodes
  Future<void> addEdge(KnowledgeEdge edge) async {
    // Verify nodes exist
    if (!_nodes.containsKey(edge.sourceId) ||
        !_nodes.containsKey(edge.targetId)) {
      throw Exception('Cannot add edge: source or target node not found');
    }

    // Check for duplicate
    final exists = _edges
        .any((e) => e.sourceId == edge.sourceId && e.targetId == edge.targetId);
    if (!exists) {
      _edges.add(edge);
      _adjacencyList[edge.sourceId]?.add(edge.targetId);
      if (edge.type == 'related') {
        _adjacencyList[edge.targetId]?.add(edge.sourceId);
      }
      await _saveGraph();
    }
  }

  /// Get a node by ID
  KnowledgeNode? getNode(String id) => _nodes[id];

  /// Update node mastery
  Future<void> updateMastery(String nodeId, double mastery) async {
    final node = _nodes[nodeId];
    if (node != null) {
      node.mastery = mastery.clamp(0.0, 1.0);
      node.accessCount++;
      node.lastAccessed = DateTime.now();
      await _saveGraph();
    }
  }

  /// Record node access (for analytics and edge weight adjustment)
  Future<void> recordAccess(String nodeId, {String? fromNodeId}) async {
    final node = _nodes[nodeId];
    if (node != null) {
      node.accessCount++;
      node.lastAccessed = DateTime.now();

      // Strengthen edge if accessed from another node
      if (fromNodeId != null) {
        for (final edge in _edges) {
          if ((edge.sourceId == fromNodeId && edge.targetId == nodeId) ||
              (edge.type == 'related' &&
                  edge.sourceId == nodeId &&
                  edge.targetId == fromNodeId)) {
            edge.traversalCount++;
            // Increase weight based on traversal frequency
            edge.weight = min(1.0, edge.weight + 0.05);
          }
        }
      }

      await _saveGraph();
    }
  }

  /// Get connected nodes
  List<KnowledgeNode> getConnectedNodes(String nodeId) {
    final connected = <KnowledgeNode>[];
    final neighborIds = _adjacencyList[nodeId] ?? [];

    for (final id in neighborIds) {
      final node = _nodes[id];
      if (node != null) {
        connected.add(node);
      }
    }

    return connected;
  }

  /// Get prerequisite nodes (nodes that should be learned before this one)
  List<KnowledgeNode> getPrerequisites(String nodeId) {
    final prerequisites = <KnowledgeNode>[];

    for (final edge in _edges) {
      if (edge.targetId == nodeId && edge.type == 'prerequisite') {
        final node = _nodes[edge.sourceId];
        if (node != null) {
          prerequisites.add(node);
        }
      }
    }

    return prerequisites;
  }

  /// Get nodes that this node leads to
  List<KnowledgeNode> getNextNodes(String nodeId) {
    final nextNodes = <KnowledgeNode>[];

    for (final edge in _edges) {
      if (edge.sourceId == nodeId && edge.type == 'leads_to') {
        final node = _nodes[edge.targetId];
        if (node != null) {
          nextNodes.add(node);
        }
      }
    }

    return nextNodes;
  }

  /// Find shortest path between two nodes using BFS
  List<String>? findPath(String startId, String endId) {
    if (!_nodes.containsKey(startId) || !_nodes.containsKey(endId)) {
      return null;
    }

    if (startId == endId) return [startId];

    final visited = <String>{};
    final queue = <List<String>>[
      [startId]
    ];

    while (queue.isNotEmpty) {
      final path = queue.removeAt(0);
      final current = path.last;

      if (visited.contains(current)) continue;
      visited.add(current);

      for (final neighbor in _adjacencyList[current] ?? []) {
        final newPath = <String>[...path, neighbor];

        if (neighbor == endId) {
          return newPath;
        }

        if (!visited.contains(neighbor)) {
          queue.add(newPath);
        }
      }
    }

    return null; // No path found
  }

  /// Get recommended next learning items based on current mastery
  List<KnowledgeNode> getRecommendedNodes({int limit = 5}) {
    final recommendations = <MapEntry<KnowledgeNode, double>>[];

    for (final node in _nodes.values) {
      // Score based on:
      // 1. Low mastery (needs work)
      // 2. Prerequisites are mastered
      // 3. Connection to recently accessed nodes
      // 4. Recency of last access (prefer items not accessed recently)

      var score = 0.0;

      // Mastery factor (lower mastery = higher priority)
      score += (1 - node.mastery) * 0.4;

      // Prerequisites check
      final prerequisites = getPrerequisites(node.id);
      if (prerequisites.isEmpty ||
          prerequisites.every((p) => p.mastery >= 0.7)) {
        score += 0.3;
      } else {
        // Skip if prerequisites not met
        continue;
      }

      // Connection strength to recently accessed nodes
      for (final edge in _edges) {
        if (edge.targetId == node.id) {
          final source = _nodes[edge.sourceId];
          if (source != null) {
            final daysSinceAccess =
                DateTime.now().difference(source.lastAccessed).inDays;
            if (daysSinceAccess < 7) {
              score += 0.1 * edge.weight;
            }
          }
        }
      }

      // Recency penalty (avoid items accessed very recently)
      final hoursSinceAccess =
          DateTime.now().difference(node.lastAccessed).inHours;
      if (hoursSinceAccess < 24) {
        score -= 0.2;
      }

      recommendations.add(MapEntry(node, score));
    }

    recommendations.sort((a, b) => b.value.compareTo(a.value));

    return recommendations.take(limit).map((e) => e.key).toList();
  }

  /// Generate an optimized learning path using topological sort
  LearningPath generateLearningPath(
    String name,
    List<String> goalNodeIds, {
    String? description,
  }) {
    final pathNodes = <String>[];
    final visited = <String>{};
    final inPath = <String>{};

    // DFS to collect all prerequisite nodes
    void collectPrerequisites(String nodeId) {
      if (visited.contains(nodeId)) return;
      visited.add(nodeId);

      for (final edge in _edges) {
        if (edge.targetId == nodeId && edge.type == 'prerequisite') {
          collectPrerequisites(edge.sourceId);
        }
      }

      if (!inPath.contains(nodeId)) {
        pathNodes.add(nodeId);
        inPath.add(nodeId);
      }
    }

    // Collect prerequisites for all goal nodes
    for (final goalId in goalNodeIds) {
      collectPrerequisites(goalId);
    }

    // Add goal nodes if not already in path
    for (final goalId in goalNodeIds) {
      if (!inPath.contains(goalId)) {
        pathNodes.add(goalId);
      }
    }

    final path = LearningPath(
      id: 'path_${DateTime.now().millisecondsSinceEpoch}',
      name: name,
      description: description ?? 'Custom learning path',
      nodeIds: pathNodes,
      progress: _calculatePathProgress(pathNodes),
      createdAt: DateTime.now(),
    );

    _paths.add(path);
    _saveGraph();

    return path;
  }

  /// Calculate path progress based on node mastery
  double _calculatePathProgress(List<String> nodeIds) {
    if (nodeIds.isEmpty) return 0.0;

    var totalMastery = 0.0;
    var count = 0;

    for (final id in nodeIds) {
      final node = _nodes[id];
      if (node != null) {
        totalMastery += node.mastery;
        count++;
      }
    }

    return count > 0 ? totalMastery / count : 0.0;
  }

  /// Get learning path progress
  double getPathProgress(String pathId) {
    final path = _paths.firstWhere(
      (p) => p.id == pathId,
      orElse: () => throw Exception('Path not found'),
    );

    return _calculatePathProgress(path.nodeIds);
  }

  /// Find knowledge gaps (prerequisites with low mastery)
  List<KnowledgeNode> findKnowledgeGaps() {
    final gaps = <KnowledgeNode>[];

    for (final node in _nodes.values) {
      // Check if this node has high mastery
      if (node.mastery < 0.7) continue;

      // Find prerequisites with low mastery
      for (final edge in _edges) {
        if (edge.targetId == node.id && edge.type == 'prerequisite') {
          final prereq = _nodes[edge.sourceId];
          if (prereq != null && prereq.mastery < 0.5) {
            if (!gaps.contains(prereq)) {
              gaps.add(prereq);
            }
          }
        }
      }
    }

    return gaps;
  }

  /// Get graph statistics
  Map<String, dynamic> getStatistics() {
    final nodesByType = <String, int>{};
    var totalMastery = 0.0;
    var masteredCount = 0;

    for (final node in _nodes.values) {
      nodesByType[node.type] = (nodesByType[node.type] ?? 0) + 1;
      totalMastery += node.mastery;
      if (node.mastery >= 0.8) masteredCount++;
    }

    final avgMastery = _nodes.isNotEmpty ? totalMastery / _nodes.length : 0.0;

    return {
      'totalNodes': _nodes.length,
      'totalEdges': _edges.length,
      'totalPaths': _paths.length,
      'nodesByType': nodesByType,
      'averageMastery': avgMastery,
      'masteredNodes': masteredCount,
      'knowledgeGaps': findKnowledgeGaps().length,
      'graphDensity': _nodes.length > 1
          ? _edges.length / (_nodes.length * (_nodes.length - 1))
          : 0.0,
    };
  }

  /// Auto-generate edges based on content similarity (simple keyword matching)
  Future<void> autoGenerateEdges() async {
    // Simple keyword-based edge generation
    final keywords = <String, Set<String>>{};

    for (final node in _nodes.values) {
      final words = node.label.toLowerCase().split(RegExp(r'\s+'));
      keywords[node.id] = words.toSet();
    }

    for (final node1 in _nodes.values) {
      for (final node2 in _nodes.values) {
        if (node1.id == node2.id) continue;

        // Check if edge already exists
        final exists = _edges.any((e) =>
            (e.sourceId == node1.id && e.targetId == node2.id) ||
            (e.sourceId == node2.id && e.targetId == node1.id));

        if (exists) continue;

        // Calculate similarity
        final intersection =
            keywords[node1.id]!.intersection(keywords[node2.id]!);
        final union = keywords[node1.id]!.union(keywords[node2.id]!);
        final similarity =
            union.isNotEmpty ? intersection.length / union.length : 0.0;

        // Create edge if similarity is high enough
        if (similarity >= 0.3) {
          await addEdge(KnowledgeEdge(
            sourceId: node1.id,
            targetId: node2.id,
            type: 'related',
            weight: similarity,
          ));
        }
      }
    }
  }

  /// Cleanup and dispose
  void dispose() {
    _nodesController.close();
    _pathsController.close();
  }
}

// ============================================================================
// Providers
// ============================================================================

final knowledgeGraphServiceProvider = Provider<KnowledgeGraphService>((ref) {
  final service = KnowledgeGraphService();
  service.initialize();

  ref.onDispose(() {
    service.dispose();
  });

  return service;
});

/// Provider for recommended learning nodes
final recommendedNodesProvider = Provider<List<KnowledgeNode>>((ref) {
  final service = ref.watch(knowledgeGraphServiceProvider);
  return service.getRecommendedNodes();
});

/// Provider for knowledge graph statistics
final knowledgeGraphStatsProvider = Provider<Map<String, dynamic>>((ref) {
  final service = ref.watch(knowledgeGraphServiceProvider);
  return service.getStatistics();
});

/// Provider for knowledge gaps
final knowledgeGapsProvider = Provider<List<KnowledgeNode>>((ref) {
  final service = ref.watch(knowledgeGraphServiceProvider);
  return service.findKnowledgeGaps();
});
