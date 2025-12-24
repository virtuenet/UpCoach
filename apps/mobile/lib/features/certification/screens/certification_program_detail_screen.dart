import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/certification_models.dart';
import '../providers/certification_provider.dart';

/// Certification program detail screen
class CertificationProgramDetailScreen extends ConsumerWidget {
  final String programId;

  const CertificationProgramDetailScreen({
    super.key,
    required this.programId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final programAsync = ref.watch(certificationProgramProvider(programId));
    final myCertAsync = ref.watch(myProgramCertificationProvider(programId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Certification Program'),
      ),
      body: programAsync.when(
        data: (program) => _buildContent(context, ref, program, myCertAsync),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 48),
              const SizedBox(height: 16),
              Text('Error: $error'),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildContent(
    BuildContext context,
    WidgetRef ref,
    CertificationProgram program,
    AsyncValue<CoachCertification?> myCertAsync,
  ) {
    final theme = Theme.of(context);

    return CustomScrollView(
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.all(16),
          sliver: SliverList(
            delegate: SliverChildListDelegate([
              // Badge and title
              Center(
                child: Column(
                  children: [
                    if (program.badgeImageUrl != null)
                      Image.network(
                        program.badgeImageUrl!,
                        width: 100,
                        height: 100,
                        errorBuilder: (_, __, ___) => const Icon(
                          Icons.workspace_premium,
                          size: 100,
                        ),
                      )
                    else
                      const Icon(Icons.workspace_premium, size: 100),
                    const SizedBox(height: 16),
                    Text(
                      program.name,
                      style: theme.textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Chip(label: Text(program.level.displayName)),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Description
              Text('About', style: theme.textTheme.titleMedium),
              const SizedBox(height: 8),
              Text(program.description),

              const SizedBox(height: 24),

              // Requirements
              Text('Requirements', style: theme.textTheme.titleMedium),
              const SizedBox(height: 8),
              ...program.requirements.map((req) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.fiber_manual_record, size: 8),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text('${req.description} (${req.targetValue})'),
                        ),
                      ],
                    ),
                  )),

              const SizedBox(height: 24),

              // Benefits
              if (program.benefits.isNotEmpty) ...[
                Text('Benefits', style: theme.textTheme.titleMedium),
                const SizedBox(height: 8),
                ...program.benefits.map((benefit) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(Icons.check_circle, size: 20, color: Colors.green),
                          const SizedBox(width: 8),
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
                                  style: theme.textTheme.bodySmall,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    )),
                const SizedBox(height: 24),
              ],

              // Stats
              Text('Program Stats', style: theme.textTheme.titleMedium),
              const SizedBox(height: 8),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      _buildStatRow(
                        'Coaches Certified',
                        program.totalCertified.toString(),
                      ),
                      const Divider(),
                      _buildStatRow(
                        'In Progress',
                        program.totalInProgress.toString(),
                      ),
                      const Divider(),
                      _buildStatRow(
                        'Completion Rate',
                        '${program.completionRate.toStringAsFixed(1)}%',
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // My progress if enrolled
              myCertAsync.when(
                data: (myCert) {
                  if (myCert != null) {
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('My Progress', style: theme.textTheme.titleMedium),
                        const SizedBox(height: 8),
                        Card(
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      myCert.status.displayName,
                                      style: theme.textTheme.titleSmall,
                                    ),
                                    Text(
                                      myCert.progressDisplay,
                                      style: theme.textTheme.titleSmall?.copyWith(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                LinearProgressIndicator(
                                  value: myCert.completionPercentage / 100,
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  '${myCert.requirementsMet} of ${myCert.totalRequirements} requirements completed',
                                  style: theme.textTheme.bodySmall,
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),
                      ],
                    );
                  }
                  return const SizedBox.shrink();
                },
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
              ),

              // Price
              if (!program.isFree) ...[
                Text('Price', style: theme.textTheme.titleMedium),
                const SizedBox(height: 8),
                Text(
                  program.priceDisplay,
                  style: theme.textTheme.headlineMedium?.copyWith(
                    color: theme.colorScheme.primary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (program.validityMonths != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    'Valid for ${program.validityMonths} months',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.outline,
                    ),
                  ),
                ],
                const SizedBox(height: 100),
              ],
            ]),
          ),
        ),
      ],
      bottomSheet: _buildBottomSheet(context, ref, program, myCertAsync),
    );
  }

  Widget _buildStatRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label),
        Text(
          value,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
      ],
    );
  }

  Widget? _buildBottomSheet(
    BuildContext context,
    WidgetRef ref,
    CertificationProgram program,
    AsyncValue<CoachCertification?> myCertAsync,
  ) {
    return myCertAsync.when(
      data: (myCert) {
        final isEnrolled = myCert != null;

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Theme.of(context).scaffoldBackgroundColor,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 4,
                offset: const Offset(0, -2),
              ),
            ],
          ),
          child: SafeArea(
            child: Row(
              children: [
                if (!program.isFree && !isEnrolled)
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Price',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      Text(
                        program.priceDisplay,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                    ],
                  ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: isEnrolled
                        ? null
                        : () => _startCertification(context, ref),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      backgroundColor: program.isFree ? Colors.green : null,
                    ),
                    child: Text(
                      isEnrolled ? 'Already Enrolled' : 'Start Certification',
                      style: const TextStyle(fontSize: 16),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
      loading: () => null,
      error: (_, __) => null,
    );
  }

  Future<void> _startCertification(BuildContext context, WidgetRef ref) async {
    try {
      await ref.read(certificationServiceProvider).startCertification(
            programId: programId,
          );
      ref.invalidate(myProgramCertificationProvider(programId));
      ref.invalidate(myCertificationsProvider);

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Certification started successfully!')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to start: $e')),
        );
      }
    }
  }
}
