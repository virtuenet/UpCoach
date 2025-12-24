import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/certification_models.dart';
import '../providers/certification_provider.dart';
import 'certification_program_detail_screen.dart';

/// Certification programs discovery screen
class CertificationProgramsScreen extends ConsumerStatefulWidget {
  const CertificationProgramsScreen({super.key});

  @override
  ConsumerState<CertificationProgramsScreen> createState() =>
      _CertificationProgramsScreenState();
}

class _CertificationProgramsScreenState
    extends ConsumerState<CertificationProgramsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  CertificationLevel? _selectedLevel;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Certifications'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'All Programs'),
            Tab(text: 'My Progress'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildProgramsTab(),
          _buildMyProgressTab(),
        ],
      ),
    );
  }

  Widget _buildProgramsTab() {
    final programs = ref.watch(certificationProgramsProvider);

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(certificationProgramsProvider);
      },
      child: CustomScrollView(
        slivers: [
          // Level filter
          SliverToBoxAdapter(
            child: _buildLevelFilter(),
          ),

          // Programs list
          programs.when(
            data: (programList) {
              final filtered = _filterPrograms(programList);

              if (filtered.isEmpty) {
                return const SliverFillRemaining(
                  child: Center(child: Text('No programs available')),
                );
              }

              return SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final program = filtered[index];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: ProgramCard(
                          program: program,
                          onTap: () => _openProgram(program.id),
                        ),
                      );
                    },
                    childCount: filtered.length,
                  ),
                ),
              );
            },
            loading: () => const SliverFillRemaining(
              child: Center(child: CircularProgressIndicator()),
            ),
            error: (error, stack) => SliverFillRemaining(
              child: Center(child: Text('Error: $error')),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMyProgressTab() {
    final myCertifications = ref.watch(myCertificationsProvider);

    return myCertifications.when(
      data: (certifications) {
        if (certifications.isEmpty) {
          return _buildEmptyState();
        }

        return RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(myCertificationsProvider);
          },
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: certifications.length,
            itemBuilder: (context, index) {
              final cert = certifications[index];
              return Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: CertificationProgressCard(
                  certification: cert,
                  onTap: () => _openProgram(cert.programId),
                ),
              );
            },
          ),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) => Center(child: Text('Error: $error')),
    );
  }

  Widget _buildLevelFilter() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          _buildLevelChip(null, 'All Levels'),
          ...CertificationLevel.values.map(
            (level) => _buildLevelChip(level, level.displayName),
          ),
        ],
      ),
    );
  }

  Widget _buildLevelChip(CertificationLevel? level, String label) {
    final isSelected = _selectedLevel == level;

    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (selected) {
          setState(() {
            _selectedLevel = selected ? level : null;
          });
        },
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.workspace_premium_outlined,
              size: 64,
              color: Theme.of(context).colorScheme.outline,
            ),
            const SizedBox(height: 16),
            Text(
              'No Certifications Yet',
              style: Theme.of(context).textTheme.titleLarge,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Start a certification program to track your progress',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.outline,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => _tabController.animateTo(0),
              child: const Text('Browse Programs'),
            ),
          ],
        ),
      ),
    );
  }

  List<CertificationProgram> _filterPrograms(List<CertificationProgram> programs) {
    if (_selectedLevel == null) return programs;
    return programs.where((p) => p.level == _selectedLevel).toList();
  }

  void _openProgram(String programId) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => CertificationProgramDetailScreen(programId: programId),
      ),
    );
  }
}

/// Program card widget
class ProgramCard extends StatelessWidget {
  final CertificationProgram program;
  final VoidCallback onTap;

  const ProgramCard({
    super.key,
    required this.program,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Badge and level
              Row(
                children: [
                  if (program.badgeImageUrl != null)
                    Image.network(
                      program.badgeImageUrl!,
                      width: 48,
                      height: 48,
                      errorBuilder: (_, __, ___) => const Icon(
                        Icons.workspace_premium,
                        size: 48,
                      ),
                    )
                  else
                    const Icon(Icons.workspace_premium, size: 48),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          program.name,
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Chip(
                          label: Text(program.level.displayName),
                          visualDensity: VisualDensity.compact,
                          materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 12),

              // Description
              Text(
                program.description,
                style: theme.textTheme.bodyMedium,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),

              const SizedBox(height: 12),

              // Requirements count
              Row(
                children: [
                  const Icon(Icons.checklist, size: 16),
                  const SizedBox(width: 4),
                  Text(
                    '${program.totalRequirements} requirements',
                    style: theme.textTheme.bodySmall,
                  ),
                  const SizedBox(width: 16),
                  const Icon(Icons.people, size: 16),
                  const SizedBox(width: 4),
                  Text(
                    '${program.totalCertified} certified',
                    style: theme.textTheme.bodySmall,
                  ),
                ],
              ),

              const SizedBox(height: 12),

              // Price and action
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    program.priceDisplay,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: program.isFree
                          ? Colors.green
                          : theme.colorScheme.primary,
                    ),
                  ),
                  TextButton(
                    onPressed: onTap,
                    child: const Text('Learn More'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Certification progress card widget
class CertificationProgressCard extends StatelessWidget {
  final CoachCertification certification;
  final VoidCallback onTap;

  const CertificationProgressCard({
    super.key,
    required this.certification,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Status badge
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Chip(
                    label: Text(certification.status.displayName),
                    backgroundColor: _getStatusColor(certification.status),
                  ),
                  if (certification.certifiedAt != null)
                    Text(
                      'Certified ${_formatDate(certification.certifiedAt!)}',
                      style: theme.textTheme.bodySmall,
                    ),
                ],
              ),

              const SizedBox(height: 12),

              // Progress bar
              LinearProgressIndicator(
                value: certification.completionPercentage / 100,
                backgroundColor: theme.colorScheme.surfaceContainerHighest,
              ),

              const SizedBox(height: 8),

              // Progress text
              Text(
                '${certification.completionPercentage}% Complete',
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),

              const SizedBox(height: 4),

              Text(
                certification.requirementsDisplay,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.outline,
                ),
              ),

              const SizedBox(height: 12),

              // Quick stats
              Wrap(
                spacing: 16,
                runSpacing: 8,
                children: [
                  if (certification.quizPassed)
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.check_circle,
                          size: 16,
                          color: Colors.green,
                        ),
                        const SizedBox(width: 4),
                        const Text('Quiz Passed'),
                      ],
                    ),
                  if (certification.courseCompleted)
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.check_circle,
                          size: 16,
                          color: Colors.green,
                        ),
                        const SizedBox(width: 4),
                        const Text('Course Complete'),
                      ],
                    ),
                  if (certification.portfolioApprovedAt != null)
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.check_circle,
                          size: 16,
                          color: Colors.green,
                        ),
                        const SizedBox(width: 4),
                        const Text('Portfolio Approved'),
                      ],
                    ),
                ],
              ),

              if (certification.expiresAt != null) ...[
                const SizedBox(height: 12),
                Text(
                  certification.isExpired
                      ? 'Expired ${_formatDate(certification.expiresAt!)}'
                      : 'Expires ${_formatDate(certification.expiresAt!)}',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: certification.isExpired ? Colors.red : Colors.orange,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Color _getStatusColor(CertificationStatus status) {
    switch (status) {
      case CertificationStatus.certified:
        return Colors.green.shade100;
      case CertificationStatus.inProgress:
        return Colors.blue.shade100;
      case CertificationStatus.pendingReview:
        return Colors.orange.shade100;
      case CertificationStatus.expired:
        return Colors.red.shade100;
      default:
        return Colors.grey.shade100;
    }
  }

  String _formatDate(DateTime dateTime) {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];
    return '${months[dateTime.month - 1]} ${dateTime.day}, ${dateTime.year}';
  }
}
