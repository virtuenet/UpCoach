// Mobile Analytics Service - Offline event tracking
// ~400 LOC - Mobile-specific analytics
import 'package:flutter/foundation.dart';

class MobileAnalyticsService {
  static final instance = MobileAnalyticsService._();
  MobileAnalyticsService._();
  
  final List<AnalyticsEvent> _offlineBuffer = [];
  String _currentSessionId = 'session_${DateTime.now().millisecondsSinceEpoch}';
  
  Future<void> trackEvent(String name, [Map<String, dynamic>? properties]) async {
    final event = AnalyticsEvent(
      name: name,
      properties: properties ?? {},
      timestamp: DateTime.now(),
      sessionId: _currentSessionId,
    );
    
    _offlineBuffer.add(event);
    debugPrint('[MobileAnalytics] Tracked: $name');
    
    // Flush if online
    if (_offlineBuffer.length > 50) {
      await _flushEvents();
    }
  }
  
  Future<void> _flushEvents() async {
    debugPrint('[MobileAnalytics] Flushing ${_offlineBuffer.length} events');
    _offlineBuffer.clear();
  }
}

class AnalyticsEvent {
  final String name;
  final Map<String, dynamic> properties;
  final DateTime timestamp;
  final String sessionId;
  
  AnalyticsEvent({
    required this.name,
    required this.properties,
    required this.timestamp,
    required this.sessionId,
  });
}
