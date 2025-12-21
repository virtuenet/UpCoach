import 'package:flutter/material.dart';

import '../models/certification_models.dart';

/// Program Card Widget
/// Displays a certification program in a card format
class ProgramCard extends StatelessWidget {
  final CertificationProgram program;
  final VoidCallback? onTap;

  const ProgramCard({
    super.key,
    required this.program,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final color = Color(
      int.parse(program.colorHex?.replaceFirst('#', '0xFF') ?? '0xFF4299E1'),
    );

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with gradient
            Container(
              height: 80,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    color,
                    color.withValues(alpha: 0.7),
                  ],
                ),
              ),
              child: Stack(
                children: [
                  // Icon
                  Positioned(
                    right: -20,
                    bottom: -20,
                    child: Icon(
                      _getLevelIcon(program.level),
                      size: 100,
                      color: Colors.white.withValues(alpha: 0.2),
                    ),
                  ),
                  // Level badge
                  Positioned(
                    top: 12,
                    left: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Text(
                        program.level.displayName,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  // Price badge
                  Positioned(
                    top: 12,
                    right: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Text(
                        program.priceDisplay,
                        style: TextStyle(
                          color: color,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Content
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title
                  Text(
                    program.name,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),

                  // Description
                  Text(
                    program.description,
                    style: TextStyle(
                      color: Colors.grey[600],
                      fontSize: 13,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 12),

                  // Stats row
                  Row(
                    children: [
                      // Certified count
                      _StatChip(
                        icon: Icons.people,
                        value: '${program.totalCertified}',
                        label: 'certified',
                      ),
                      const SizedBox(width: 12),
                      // Requirements
                      _StatChip(
                        icon: Icons.checklist,
                        value: '${program.totalRequirements}',
                        label: 'requirements',
                      ),
                      const Spacer(),
                      // Arrow
                      Icon(
                        Icons.arrow_forward_ios,
                        size: 16,
                        color: Colors.grey[400],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  IconData _getLevelIcon(CertificationLevel level) {
    switch (level) {
      case CertificationLevel.foundation:
        return Icons.school;
      case CertificationLevel.professional:
        return Icons.workspace_premium;
      case CertificationLevel.master:
        return Icons.military_tech;
      case CertificationLevel.expert:
        return Icons.emoji_events;
    }
  }
}

class _StatChip extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;

  const _StatChip({
    required this.icon,
    required this.value,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: Colors.grey[600]),
        const SizedBox(width: 4),
        Text(
          '$value $label',
          style: TextStyle(
            color: Colors.grey[600],
            fontSize: 12,
          ),
        ),
      ],
    );
  }
}

/// Compact program card for list views
class CompactProgramCard extends StatelessWidget {
  final CertificationProgram program;
  final VoidCallback? onTap;

  const CompactProgramCard({
    super.key,
    required this.program,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final color = Color(
      int.parse(program.colorHex?.replaceFirst('#', '0xFF') ?? '0xFF4299E1'),
    );

    return Card(
      child: ListTile(
        onTap: onTap,
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            _getLevelIcon(program.level),
            color: color,
          ),
        ),
        title: Text(
          program.name,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: Text(
          '${program.level.displayName} • ${program.totalRequirements} requirements',
          style: TextStyle(
            color: Colors.grey[600],
            fontSize: 12,
          ),
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              program.priceDisplay,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            if (program.validityMonths != null)
              Text(
                '${program.validityMonths}mo validity',
                style: TextStyle(
                  color: Colors.grey[500],
                  fontSize: 10,
                ),
              ),
          ],
        ),
      ),
    );
  }

  IconData _getLevelIcon(CertificationLevel level) {
    switch (level) {
      case CertificationLevel.foundation:
        return Icons.school;
      case CertificationLevel.professional:
        return Icons.workspace_premium;
      case CertificationLevel.master:
        return Icons.military_tech;
      case CertificationLevel.expert:
        return Icons.emoji_events;
    }
  }
}
