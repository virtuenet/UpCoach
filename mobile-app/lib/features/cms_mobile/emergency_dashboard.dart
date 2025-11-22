import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Emergency Dashboard for critical admin actions
/// Designed for one-handed mobile operation with maximum 3-tap interactions
class EmergencyDashboard extends ConsumerStatefulWidget {
  const EmergencyDashboard({super.key});

  @override
  ConsumerState<EmergencyDashboard> createState() => _EmergencyDashboardState();
}

class _EmergencyDashboardState extends ConsumerState<EmergencyDashboard> {
  bool _isEmergencyMode = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _isEmergencyMode ? Colors.red.shade50 : null,
      appBar: AppBar(
        title: const Text('Emergency Dashboard'),
        backgroundColor: _isEmergencyMode ? Colors.red : null,
        actions: [
          Switch(
            value: _isEmergencyMode,
            onChanged: (value) {
              HapticFeedback.mediumImpact();
              setState(() => _isEmergencyMode = value);
            },
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Critical alerts banner
            const _AlertBanner(),

            // System status
            const _SystemStatusBar(),

            // Quick actions grid
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: GridView.count(
                  crossAxisCount: 2,
                  mainAxisSpacing: 16,
                  crossAxisSpacing: 16,
                  children: [
                    _QuickActionTile(
                      icon: Icons.block,
                      label: 'Block User',
                      color: Colors.red,
                      onTap: () => _showBlockUserDialog(context),
                      requiresConfirmation: true,
                    ),
                    _QuickActionTile(
                      icon: Icons.flag,
                      label: 'Review Flagged',
                      badge: '3',
                      color: Colors.orange,
                      onTap: () => _navigateToFlagged(context),
                    ),
                    _QuickActionTile(
                      icon: Icons.warning_amber,
                      label: 'System Alerts',
                      color: Colors.amber,
                      onTap: () => _showSystemAlerts(context),
                    ),
                    _QuickActionTile(
                      icon: Icons.campaign,
                      label: 'Broadcast',
                      color: Colors.blue,
                      onTap: () => _showBroadcastDialog(context),
                      requiresConfirmation: true,
                    ),
                    _QuickActionTile(
                      icon: Icons.person_add_disabled,
                      label: 'Stop Signups',
                      color: Colors.purple,
                      onTap: () => _toggleRegistrations(context),
                      requiresConfirmation: true,
                    ),
                    _QuickActionTile(
                      icon: Icons.cleaning_services,
                      label: 'Clear Cache',
                      color: Colors.teal,
                      onTap: () => _clearSystemCache(context),
                    ),
                  ],
                ),
              ),
            ),

            // Recent actions log
            Container(
              height: 100,
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                border: Border(
                  top: BorderSide(color: Colors.grey.shade300),
                ),
              ),
              child: const _RecentActionsLog(),
            ),
          ],
        ),
      ),
    );
  }

  void _showBlockUserDialog(BuildContext context) {
    HapticFeedback.heavyImpact();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const _BlockUserSheet(),
    );
  }

  void _navigateToFlagged(BuildContext context) {
    HapticFeedback.selectionClick();
    Navigator.pushNamed(context, '/flagged-content');
  }

  void _showSystemAlerts(BuildContext context) {
    HapticFeedback.selectionClick();
    showModalBottomSheet(
      context: context,
      builder: (context) => const _SystemAlertsSheet(),
    );
  }

  void _showBroadcastDialog(BuildContext context) {
    HapticFeedback.mediumImpact();
    showDialog(
      context: context,
      builder: (context) => const _BroadcastDialog(),
    );
  }

  void _toggleRegistrations(BuildContext context) {
    HapticFeedback.heavyImpact();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Stop New Registrations?'),
        content: const Text(
          'This will prevent all new users from signing up until manually re-enabled.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              // API call to toggle registrations
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Registrations disabled'),
                  backgroundColor: Colors.red,
                ),
              );
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Stop Registrations'),
          ),
        ],
      ),
    );
  }

  void _clearSystemCache(BuildContext context) {
    HapticFeedback.lightImpact();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Cache cleared successfully'),
        backgroundColor: Colors.green,
        duration: Duration(seconds: 2),
      ),
    );
  }
}

class _AlertBanner extends StatelessWidget {
  const _AlertBanner();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.red.shade100,
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          Icon(Icons.error_outline, color: Colors.red.shade700),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              '2 critical issues require attention',
              style: TextStyle(
                color: Colors.red.shade700,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          TextButton(
            onPressed: () {},
            child: const Text('View'),
          ),
        ],
      ),
    );
  }
}

class _SystemStatusBar extends StatelessWidget {
  const _SystemStatusBar();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _StatusIndicator(
            label: 'API',
            status: SystemStatus.healthy,
            responseTime: '45ms',
          ),
          _StatusIndicator(
            label: 'Database',
            status: SystemStatus.warning,
            responseTime: '320ms',
          ),
          _StatusIndicator(
            label: 'Cache',
            status: SystemStatus.healthy,
            responseTime: '12ms',
          ),
          _StatusIndicator(
            label: 'Storage',
            status: SystemStatus.healthy,
            usage: '45%',
          ),
        ],
      ),
    );
  }
}

class _StatusIndicator extends StatelessWidget {
  final String label;
  final SystemStatus status;
  final String? responseTime;
  final String? usage;

  const _StatusIndicator({
    required this.label,
    required this.status,
    this.responseTime,
    this.usage,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: _getStatusColor(),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
        ),
        Text(
          responseTime ?? usage ?? '',
          style: TextStyle(fontSize: 10, color: Colors.grey.shade600),
        ),
      ],
    );
  }

  Color _getStatusColor() {
    switch (status) {
      case SystemStatus.healthy:
        return Colors.green;
      case SystemStatus.warning:
        return Colors.orange;
      case SystemStatus.critical:
        return Colors.red;
    }
  }
}

class _QuickActionTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  final String? badge;
  final bool requiresConfirmation;

  const _QuickActionTile({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
    this.badge,
    this.requiresConfirmation = false,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: color.withOpacity(0.1),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: () {
          if (requiresConfirmation) {
            HapticFeedback.mediumImpact();
          } else {
            HapticFeedback.lightImpact();
          }
          onTap();
        },
        borderRadius: BorderRadius.circular(16),
        child: Stack(
          children: [
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(icon, size: 40, color: color),
                  const SizedBox(height: 8),
                  Text(
                    label,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: color.withOpacity(0.9),
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
            if (badge != null)
              Positioned(
                top: 12,
                right: 12,
                child: Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: Colors.red,
                    shape: BoxShape.circle,
                  ),
                  child: Text(
                    badge!,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _RecentActionsLog extends StatelessWidget {
  const _RecentActionsLog();

  @override
  Widget build(BuildContext context) {
    return ListView(
      scrollDirection: Axis.horizontal,
      children: [
        _ActionLogItem(
          time: '2m ago',
          action: 'User blocked',
          user: 'admin@example.com',
        ),
        _ActionLogItem(
          time: '15m ago',
          action: 'Cache cleared',
          user: 'system',
        ),
        _ActionLogItem(
          time: '1h ago',
          action: 'Broadcast sent',
          user: 'admin@example.com',
        ),
      ],
    );
  }
}

class _ActionLogItem extends StatelessWidget {
  final String time;
  final String action;
  final String user;

  const _ActionLogItem({
    required this.time,
    required this.action,
    required this.user,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 200,
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            time,
            style: TextStyle(fontSize: 10, color: Colors.grey.shade600),
          ),
          Text(
            action,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
          ),
          Text(
            user,
            style: TextStyle(fontSize: 11, color: Colors.grey.shade700),
          ),
        ],
      ),
    );
  }
}

class _BlockUserSheet extends StatelessWidget {
  const _BlockUserSheet();

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              color: Colors.grey.shade300,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const Padding(
            padding: EdgeInsets.all(16),
            child: Text(
              'Block User',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: TextField(
              decoration: InputDecoration(
                labelText: 'User email or ID',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                prefixIcon: const Icon(Icons.person),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: TextField(
              decoration: InputDecoration(
                labelText: 'Reason (optional)',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                prefixIcon: const Icon(Icons.comment),
              ),
              maxLines: 3,
            ),
          ),
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      HapticFeedback.heavyImpact();
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('User blocked successfully'),
                          backgroundColor: Colors.red,
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red,
                    ),
                    child: const Text('Block User'),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}

class _SystemAlertsSheet extends StatelessWidget {
  const _SystemAlertsSheet();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'System Alerts',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          _AlertItem(
            severity: AlertSeverity.critical,
            title: 'Database response time high',
            time: '5 minutes ago',
            action: () {},
          ),
          _AlertItem(
            severity: AlertSeverity.warning,
            title: 'Storage usage at 85%',
            time: '1 hour ago',
            action: () {},
          ),
          _AlertItem(
            severity: AlertSeverity.info,
            title: 'Scheduled maintenance tomorrow',
            time: '2 hours ago',
            action: () {},
          ),
        ],
      ),
    );
  }
}

class _AlertItem extends StatelessWidget {
  final AlertSeverity severity;
  final String title;
  final String time;
  final VoidCallback action;

  const _AlertItem({
    required this.severity,
    required this.title,
    required this.time,
    required this.action,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(
        Icons.warning_amber,
        color: _getSeverityColor(),
      ),
      title: Text(title),
      subtitle: Text(time),
      trailing: IconButton(
        icon: const Icon(Icons.chevron_right),
        onPressed: action,
      ),
    );
  }

  Color _getSeverityColor() {
    switch (severity) {
      case AlertSeverity.critical:
        return Colors.red;
      case AlertSeverity.warning:
        return Colors.orange;
      case AlertSeverity.info:
        return Colors.blue;
    }
  }
}

class _BroadcastDialog extends StatefulWidget {
  const _BroadcastDialog();

  @override
  State<_BroadcastDialog> createState() => _BroadcastDialogState();
}

class _BroadcastDialogState extends State<_BroadcastDialog> {
  final _messageController = TextEditingController();
  BroadcastPriority _priority = BroadcastPriority.normal;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Send Broadcast'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            controller: _messageController,
            decoration: const InputDecoration(
              labelText: 'Message',
              hintText: 'Enter broadcast message',
              border: OutlineInputBorder(),
            ),
            maxLines: 3,
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<BroadcastPriority>(
            value: _priority,
            decoration: const InputDecoration(
              labelText: 'Priority',
              border: OutlineInputBorder(),
            ),
            items: BroadcastPriority.values.map((priority) {
              return DropdownMenuItem(
                value: priority,
                child: Text(priority.name),
              );
            }).toList(),
            onChanged: (value) {
              if (value != null) {
                setState(() => _priority = value);
              }
            },
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: () {
            HapticFeedback.mediumImpact();
            Navigator.pop(context);
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Broadcast sent successfully'),
                backgroundColor: Colors.green,
              ),
            );
          },
          child: const Text('Send'),
        ),
      ],
    );
  }

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }
}

enum SystemStatus { healthy, warning, critical }
enum AlertSeverity { critical, warning, info }
enum BroadcastPriority { low, normal, high, urgent }