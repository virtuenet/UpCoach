import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/models/payment_models.dart';
import '../providers/payment_provider.dart';

class PaymentHistoryScreen extends ConsumerStatefulWidget {
  const PaymentHistoryScreen({super.key});

  @override
  ConsumerState<PaymentHistoryScreen> createState() =>
      _PaymentHistoryScreenState();
}

class _PaymentHistoryScreenState extends ConsumerState<PaymentHistoryScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(paymentProvider.notifier).loadPaymentHistory();
      ref.read(paymentProvider.notifier).loadInvoices();
    });

    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      ref.read(paymentProvider.notifier).loadMoreHistory();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Payment History'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'All'),
            Tab(text: 'Receipts'),
            Tab(text: 'Invoices'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildPaymentsList(),
          _buildReceiptsList(),
          _buildInvoicesList(),
        ],
      ),
    );
  }

  Widget _buildPaymentsList() {
    final state = ref.watch(paymentProvider);

    if (state.isLoading && state.paymentHistory.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.paymentHistory.isEmpty) {
      return _buildEmptyState(
        icon: Icons.receipt_long,
        title: 'No Payments Yet',
        message: 'Your payment history will appear here',
      );
    }

    return RefreshIndicator(
      onRefresh: () =>
          ref.read(paymentProvider.notifier).loadPaymentHistory(refresh: true),
      child: ListView.builder(
        controller: _scrollController,
        padding: const EdgeInsets.all(16),
        itemCount: state.paymentHistory.length + (state.hasMoreHistory ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == state.paymentHistory.length) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: CircularProgressIndicator(),
              ),
            );
          }

          final payment = state.paymentHistory[index];
          return _buildPaymentCard(payment);
        },
      ),
    );
  }

  Widget _buildPaymentCard(PaymentRecord payment) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey[200]!),
      ),
      child: InkWell(
        onTap: () => _showPaymentDetails(payment),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: _getStatusColor(payment.status).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  _getTypeIcon(payment.type),
                  color: _getStatusColor(payment.status),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      payment.description ?? payment.typeLabel,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        _buildStatusChip(payment.status),
                        const SizedBox(width: 8),
                        Text(
                          _formatDate(payment.createdAt),
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Text(
                payment.formattedAmount,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: payment.isSuccessful
                      ? AppColors.success
                      : Colors.grey[600],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusChip(PaymentStatus status) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: _getStatusColor(status).withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        _getStatusLabel(status),
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: _getStatusColor(status),
        ),
      ),
    );
  }

  Color _getStatusColor(PaymentStatus status) {
    switch (status) {
      case PaymentStatus.succeeded:
        return AppColors.success;
      case PaymentStatus.pending:
      case PaymentStatus.processing:
        return Colors.orange;
      case PaymentStatus.failed:
        return AppColors.error;
      case PaymentStatus.cancelled:
        return Colors.grey;
      case PaymentStatus.refunded:
        return Colors.blue;
    }
  }

  String _getStatusLabel(PaymentStatus status) {
    switch (status) {
      case PaymentStatus.succeeded:
        return 'PAID';
      case PaymentStatus.pending:
        return 'PENDING';
      case PaymentStatus.processing:
        return 'PROCESSING';
      case PaymentStatus.failed:
        return 'FAILED';
      case PaymentStatus.cancelled:
        return 'CANCELLED';
      case PaymentStatus.refunded:
        return 'REFUNDED';
    }
  }

  IconData _getTypeIcon(PaymentType type) {
    switch (type) {
      case PaymentType.session:
        return Icons.video_call;
      case PaymentType.package:
        return Icons.inventory_2;
      case PaymentType.subscription:
        return Icons.repeat;
    }
  }

  String _formatDate(DateTime? date) {
    if (date == null) return '';
    return DateFormat('MMM d, yyyy').format(date);
  }

  void _showPaymentDetails(PaymentRecord payment) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) => PaymentDetailsSheet(payment: payment),
    );
  }

  Widget _buildReceiptsList() {
    final state = ref.watch(paymentProvider);
    final receipts = state.paymentHistory.where((p) => p.isSuccessful).toList();

    if (receipts.isEmpty) {
      return _buildEmptyState(
        icon: Icons.receipt,
        title: 'No Receipts',
        message: 'Receipts for completed payments will appear here',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: receipts.length,
      itemBuilder: (context, index) {
        final payment = receipts[index];
        return _buildReceiptCard(payment);
      },
    );
  }

  Widget _buildReceiptCard(PaymentRecord payment) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey[200]!),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: AppColors.success.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Icon(
            Icons.receipt,
            color: AppColors.success,
          ),
        ),
        title: Text(
          payment.description ?? payment.typeLabel,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: Text(_formatDate(payment.createdAt)),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              payment.formattedAmount,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(width: 8),
            IconButton(
              icon: const Icon(Icons.download),
              onPressed: () => _downloadReceipt(payment),
            ),
          ],
        ),
      ),
    );
  }

  void _downloadReceipt(PaymentRecord payment) {
    if (payment.receiptUrl != null) {
      // Open receipt URL
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Opening receipt...')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Receipt not available')),
      );
    }
  }

  Widget _buildInvoicesList() {
    final state = ref.watch(paymentProvider);

    if (state.invoices.isEmpty) {
      return _buildEmptyState(
        icon: Icons.description,
        title: 'No Invoices',
        message: 'Your invoices will appear here',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: state.invoices.length,
      itemBuilder: (context, index) {
        final invoice = state.invoices[index];
        return _buildInvoiceCard(invoice);
      },
    );
  }

  Widget _buildInvoiceCard(Invoice invoice) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey[200]!),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Icon(
            Icons.description,
            color: AppColors.primary,
          ),
        ),
        title: Text(
          'Invoice #${invoice.invoiceNumber}',
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: Text(_formatDate(invoice.createdAt)),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              invoice.formattedAmount,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(width: 8),
            IconButton(
              icon: const Icon(Icons.open_in_new),
              onPressed: () => _openInvoice(invoice),
            ),
          ],
        ),
      ),
    );
  }

  void _openInvoice(Invoice invoice) {
    if (invoice.hostedInvoiceUrl != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Opening invoice...')),
      );
    }
  }

  Widget _buildEmptyState({
    required IconData icon,
    required String title,
    required String message,
  }) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 64, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text(
            title,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            message,
            style: TextStyle(color: Colors.grey[500]),
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// Payment Details Bottom Sheet
// ============================================================================

class PaymentDetailsSheet extends ConsumerWidget {
  final PaymentRecord payment;

  const PaymentDetailsSheet({super.key, required this.payment});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      minChildSize: 0.4,
      maxChildSize: 0.9,
      expand: false,
      builder: (context, scrollController) {
        return Container(
          padding: const EdgeInsets.all(16),
          child: ListView(
            controller: scrollController,
            children: [
              // Handle
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Status Icon
              Center(
                child: Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color:
                        _getStatusColor(payment.status).withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    _getStatusIcon(payment.status),
                    size: 40,
                    color: _getStatusColor(payment.status),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Amount
              Center(
                child: Text(
                  payment.formattedAmount,
                  style: const TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(height: 8),

              // Status
              Center(
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color:
                        _getStatusColor(payment.status).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    payment.statusLabel,
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: _getStatusColor(payment.status),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 32),

              // Details
              _buildDetailRow('Description', payment.description ?? 'N/A'),
              _buildDetailRow('Type', payment.typeLabel),
              _buildDetailRow('Date', _formatDateTime(payment.createdAt)),
              _buildDetailRow('Payment ID', payment.paymentIntentId),
              if (payment.failureMessage != null)
                _buildDetailRow('Error', payment.failureMessage!,
                    isError: true),

              const SizedBox(height: 24),

              // Actions
              if (payment.isSuccessful && payment.receiptUrl != null)
                ElevatedButton.icon(
                  onPressed: () {
                    // Open receipt URL
                  },
                  icon: const Icon(Icons.receipt),
                  label: const Text('View Receipt'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),

              if (payment.isSuccessful)
                Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: OutlinedButton.icon(
                    onPressed: () => _requestRefund(context, ref),
                    icon: const Icon(Icons.undo),
                    label: const Text('Request Refund'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDetailRow(String label, String value, {bool isError = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: TextStyle(
                color: Colors.grey[600],
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontWeight: FontWeight.w500,
                color: isError ? AppColors.error : null,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(PaymentStatus status) {
    switch (status) {
      case PaymentStatus.succeeded:
        return AppColors.success;
      case PaymentStatus.pending:
      case PaymentStatus.processing:
        return Colors.orange;
      case PaymentStatus.failed:
        return AppColors.error;
      case PaymentStatus.cancelled:
        return Colors.grey;
      case PaymentStatus.refunded:
        return Colors.blue;
    }
  }

  IconData _getStatusIcon(PaymentStatus status) {
    switch (status) {
      case PaymentStatus.succeeded:
        return Icons.check_circle;
      case PaymentStatus.pending:
      case PaymentStatus.processing:
        return Icons.schedule;
      case PaymentStatus.failed:
        return Icons.error;
      case PaymentStatus.cancelled:
        return Icons.cancel;
      case PaymentStatus.refunded:
        return Icons.replay;
    }
  }

  String _formatDateTime(DateTime? date) {
    if (date == null) return 'N/A';
    return DateFormat('MMM d, yyyy \'at\' h:mm a').format(date);
  }

  void _requestRefund(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Request Refund'),
        content: const Text(
          'Are you sure you want to request a refund for this payment? '
          'This may take 5-10 business days to process.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              final refund =
                  await ref.read(paymentProvider.notifier).requestRefund(
                        paymentId: payment.id,
                      );
              if (refund != null && context.mounted) {
                Navigator.pop(context); // Close the details sheet
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Refund request submitted'),
                    backgroundColor: AppColors.success,
                  ),
                );
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
            ),
            child: const Text('Request Refund'),
          ),
        ],
      ),
    );
  }
}
