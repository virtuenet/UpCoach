import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/certification_models.dart';
import '../providers/certification_provider.dart';
import '../widgets/program_card.dart';

/// Programs List Screen
/// Browse available certification programs
class ProgramsListScreen extends ConsumerWidget {
  const ProgramsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final programsAsync = ref.watch(certificationProgramsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Certifications'),
        actions: [
          IconButton(
            icon: const Icon(Icons.card_membership),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => const MyCertificationsScreen(),
                ),
              );
            },
            tooltip: 'My Certifications',
          ),
        ],
      ),
      body: programsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              Text('Error loading programs: $err'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.refresh(certificationProgramsProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (state) => _ProgramsContent(state: state),
      ),
    );
  }
}

class _ProgramsContent extends ConsumerWidget {
  final CertificationProgramsState state;

  const _ProgramsContent({required this.state});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return CustomScrollView(
      slivers: [
        // Header
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Get Certified',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Advance your coaching career with professional certifications.',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
        ),

        // Level filter chips
        SliverToBoxAdapter(
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                FilterChip(
                  label: const Text('All'),
                  selected: state.selectedLevel == null,
                  onSelected: (_) => ref
                      .read(certificationProgramsProvider.notifier)
                      .setLevelFilter(null),
                ),
                const SizedBox(width: 8),
                ...CertificationLevel.values.map((level) => Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(level.displayName),
                    selected: state.selectedLevel == level,
                    onSelected: (_) => ref
                        .read(certificationProgramsProvider.notifier)
                        .setLevelFilter(level),
                  ),
                )),
              ],
            ),
          ),
        ),

        const SliverToBoxAdapter(child: SizedBox(height: 16)),

        // Programs list
        if (state.filteredPrograms.isEmpty)
          SliverFillRemaining(
            hasScrollBody: false,
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.school_outlined, size: 64, color: Colors.grey[400]),
                  const SizedBox(height: 16),
                  Text(
                    'No programs available',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ],
              ),
            ),
          )
        else
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final program = state.filteredPrograms[index];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: ProgramCard(
                      program: program,
                      onTap: () {
                        ref.read(selectedProgramProvider.notifier).state = program;
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => ProgramDetailScreen(program: program),
                          ),
                        );
                      },
                    ),
                  );
                },
                childCount: state.filteredPrograms.length,
              ),
            ),
          ),

        // Bottom padding
        const SliverToBoxAdapter(child: SizedBox(height: 32)),
      ],
    );
  }
}

/// My Certifications Screen
class MyCertificationsScreen extends ConsumerWidget {
  const MyCertificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final certificationsAsync = ref.watch(myCertificationsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Certifications'),
      ),
      body: certificationsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
        data: (state) {
          if (state.certifications.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.card_membership, size: 64, color: Colors.grey[400]),
                  const SizedBox(height: 16),
                  Text(
                    'No certifications yet',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: Colors.grey[600],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Start a certification program to see it here.',
                    style: TextStyle(color: Colors.grey[500]),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('Browse Programs'),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: state.certifications.length,
            itemBuilder: (context, index) {
              final cert = state.certifications[index];
              return _CertificationProgressCard(certification: cert);
            },
          );
        },
      ),
    );
  }
}

/// Certification progress card
class _CertificationProgressCard extends StatelessWidget {
  final CoachCertification certification;

  const _CertificationProgressCard({required this.certification});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status badge
            Row(
              children: [
                _StatusBadge(status: certification.status),
                const Spacer(),
                Text(
                  certification.progressDisplay,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Program name (would need to look up from program ID)
            Text(
              'Program: ${certification.programId}',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),

            // Progress bar
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: certification.completionPercentage / 100,
                backgroundColor: Colors.grey[200],
                minHeight: 8,
              ),
            ),
            const SizedBox(height: 8),

            // Requirements met
            Text(
              '${certification.requirementsMet} of ${certification.totalRequirements} requirements met',
              style: TextStyle(color: Colors.grey[600]),
            ),
            const SizedBox(height: 12),

            // Actions
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                if (certification.status == CertificationStatus.inProgress)
                  TextButton(
                    onPressed: () {
                      // Navigate to continue certification
                    },
                    child: const Text('Continue'),
                  ),
                if (certification.status == CertificationStatus.certified)
                  TextButton.icon(
                    onPressed: () {
                      // View certificate
                    },
                    icon: const Icon(Icons.download, size: 18),
                    label: const Text('Certificate'),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Status badge
class _StatusBadge extends StatelessWidget {
  final CertificationStatus status;

  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    Color backgroundColor;
    Color textColor;

    switch (status) {
      case CertificationStatus.certified:
        backgroundColor = Colors.green;
        textColor = Colors.white;
        break;
      case CertificationStatus.inProgress:
        backgroundColor = Colors.blue;
        textColor = Colors.white;
        break;
      case CertificationStatus.pendingReview:
        backgroundColor = Colors.orange;
        textColor = Colors.white;
        break;
      case CertificationStatus.expired:
      case CertificationStatus.revoked:
        backgroundColor = Colors.red;
        textColor = Colors.white;
        break;
      default:
        backgroundColor = Colors.grey;
        textColor = Colors.white;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        status.displayName,
        style: TextStyle(
          color: textColor,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}

/// Program Detail Screen
class ProgramDetailScreen extends ConsumerWidget {
  final CertificationProgram program;

  const ProgramDetailScreen({super.key, required this.program});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final myCertsAsync = ref.watch(myCertificationsProvider);

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // App bar with gradient
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              title: Text(program.name),
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Color(int.parse(program.colorHex?.replaceFirst('#', '0xFF') ?? '0xFF4299E1')),
                      Color(int.parse(program.colorHex?.replaceFirst('#', '0xFF') ?? '0xFF4299E1'))
                          .withValues(alpha: 0.7),
                    ],
                  ),
                ),
                child: Center(
                  child: Icon(
                    _getLevelIcon(program.level),
                    size: 80,
                    color: Colors.white.withValues(alpha: 0.3),
                  ),
                ),
              ),
            ),
          ),

          // Content
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Level and tier badges
                  Row(
                    children: [
                      Chip(
                        label: Text(program.level.displayName),
                        backgroundColor: Color(int.parse(
                            program.colorHex?.replaceFirst('#', '0xFF') ?? '0xFF4299E1'))
                            .withValues(alpha: 0.2),
                      ),
                      const SizedBox(width: 8),
                      Chip(label: Text(program.tier.displayName)),
                      const Spacer(),
                      Text(
                        program.priceDisplay,
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Description
                  Text(
                    program.description,
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                  const SizedBox(height: 24),

                  // Stats
                  Row(
                    children: [
                      _StatItem(
                        icon: Icons.people,
                        value: '${program.totalCertified}',
                        label: 'Certified',
                      ),
                      _StatItem(
                        icon: Icons.trending_up,
                        value: '${program.completionRate.toStringAsFixed(0)}%',
                        label: 'Success Rate',
                      ),
                      if (program.validityMonths != null)
                        _StatItem(
                          icon: Icons.calendar_today,
                          value: '${program.validityMonths}mo',
                          label: 'Validity',
                        ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Requirements
                  Text(
                    'Requirements',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  ...program.requirements.map((req) => _RequirementItem(
                    requirement: req,
                  )),
                  const SizedBox(height: 24),

                  // Benefits
                  Text(
                    'Benefits',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  ...program.benefits.map((benefit) => _BenefitItem(
                    benefit: benefit,
                  )),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: myCertsAsync.when(
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const SizedBox.shrink(),
            data: (state) {
              final existingCert = state.getCertificationForProgram(program.id);

              if (existingCert != null) {
                return ElevatedButton(
                  onPressed: () {
                    // Continue certification
                  },
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: Text(
                    existingCert.status == CertificationStatus.certified
                        ? 'View Certificate'
                        : 'Continue (${existingCert.progressDisplay})',
                  ),
                );
              }

              return ElevatedButton(
                onPressed: () async {
                  await ref
                      .read(myCertificationsProvider.notifier)
                      .startCertification(program.id);
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Certification started!'),
                      ),
                    );
                  }
                },
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: Text(program.isFree ? 'Start Free' : 'Enroll Now'),
              );
            },
          ),
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

class _StatItem extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;

  const _StatItem({
    required this.icon,
    required this.value,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Icon(icon, color: Theme.of(context).colorScheme.primary),
          const SizedBox(height: 4),
          Text(
            value,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            label,
            style: TextStyle(color: Colors.grey[600], fontSize: 12),
          ),
        ],
      ),
    );
  }
}

class _RequirementItem extends StatelessWidget {
  final ProgramRequirement requirement;

  const _RequirementItem({required this.requirement});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              _getRequirementIcon(requirement.type),
              size: 20,
              color: Theme.of(context).colorScheme.primary,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(requirement.description),
          ),
        ],
      ),
    );
  }

  IconData _getRequirementIcon(String type) {
    switch (type) {
      case 'sessions':
        return Icons.video_call;
      case 'rating':
        return Icons.star;
      case 'quiz':
        return Icons.quiz;
      case 'portfolio':
        return Icons.folder;
      case 'course':
        return Icons.school;
      default:
        return Icons.check_circle;
    }
  }
}

class _BenefitItem extends StatelessWidget {
  final ProgramBenefit benefit;

  const _BenefitItem({required this.benefit});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          const Icon(Icons.check_circle, color: Colors.green, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  benefit.title,
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
                Text(
                  benefit.description,
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
