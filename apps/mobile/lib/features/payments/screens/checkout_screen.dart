import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/models/payment_models.dart';
import '../providers/payment_provider.dart';

class CheckoutScreen extends ConsumerStatefulWidget {
  final int amount;
  final PaymentType type;
  final int? sessionId;
  final int? packageId;
  final String title;
  final String description;
  final VoidCallback? onSuccess;

  const CheckoutScreen({
    super.key,
    required this.amount,
    required this.type,
    this.sessionId,
    this.packageId,
    required this.title,
    required this.description,
    this.onSuccess,
  });

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  @override
  void initState() {
    super.initState();
    // Set up checkout details
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(checkoutProvider.notifier).setCheckoutDetails(
            amount: widget.amount,
            type: widget.type,
            sessionId: widget.sessionId,
            packageId: widget.packageId,
            description: widget.description,
          );
    });
  }

  Future<void> _handleCheckout() async {
    final result = await ref.read(checkoutProvider.notifier).checkout();

    if (result.success && mounted) {
      _showSuccessDialog();
    } else if (!result.success &&
        result.status != PaymentStatus.cancelled &&
        mounted) {
      _showErrorSnackbar(result.errorMessage ?? 'Payment failed');
    }
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppColors.success.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.check_circle,
                size: 50,
                color: AppColors.success,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Payment Successful!',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Your payment of ${_formatAmount(widget.amount)} has been processed successfully.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
        actions: [
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                context.pop(true); // Return success to previous screen
                widget.onSuccess?.call();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text('Continue'),
            ),
          ),
        ],
      ),
    );
  }

  void _showErrorSnackbar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  String _formatAmount(int cents) {
    final dollars = cents / 100;
    return '\$${dollars.toStringAsFixed(2)}';
  }

  @override
  Widget build(BuildContext context) {
    final checkoutState = ref.watch(checkoutProvider);
    final paymentState = ref.watch(paymentProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Checkout'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => context.pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Order Summary Card
            _buildOrderSummary(),
            const SizedBox(height: 24),

            // Payment Method Section
            _buildPaymentMethodSection(paymentState),
            const SizedBox(height: 24),

            // Security Notice
            _buildSecurityNotice(),
          ],
        ),
      ),
      bottomNavigationBar: _buildCheckoutButton(checkoutState),
    );
  }

  Widget _buildOrderSummary() {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey[200]!),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Order Summary',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    _getTypeIcon(),
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.title,
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        widget.description,
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const Divider(height: 32),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Subtotal'),
                Text(_formatAmount(widget.amount)),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Tax',
                  style: TextStyle(color: Colors.grey[600]),
                ),
                Text(
                  '\$0.00',
                  style: TextStyle(color: Colors.grey[600]),
                ),
              ],
            ),
            const Divider(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Total',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  _formatAmount(widget.amount),
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  IconData _getTypeIcon() {
    switch (widget.type) {
      case PaymentType.session:
        return Icons.video_call;
      case PaymentType.package:
        return Icons.inventory_2;
      case PaymentType.subscription:
        return Icons.repeat;
    }
  }

  Widget _buildPaymentMethodSection(PaymentState state) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey[200]!),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Payment Method',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (state.hasPaymentMethods)
                  TextButton(
                    onPressed: () => _showPaymentMethodsSheet(state),
                    child: const Text('Change'),
                  ),
              ],
            ),
            const SizedBox(height: 16),
            if (state.defaultPaymentMethod != null)
              _buildPaymentMethodTile(state.defaultPaymentMethod!)
            else
              _buildAddPaymentMethodButton(),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentMethodTile(PaymentMethod method) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.primary),
        borderRadius: BorderRadius.circular(8),
        color: AppColors.primary.withValues(alpha: 0.05),
      ),
      child: Row(
        children: [
          _buildCardBrandIcon(method.brand),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  method.displayName,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                if (method.expiryDisplay.isNotEmpty)
                  Text(
                    'Expires ${method.expiryDisplay}',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
              ],
            ),
          ),
          const Icon(
            Icons.check_circle,
            color: AppColors.primary,
          ),
        ],
      ),
    );
  }

  Widget _buildCardBrandIcon(String? brand) {
    IconData icon;
    Color color;

    switch (brand?.toLowerCase()) {
      case 'visa':
        icon = Icons.credit_card;
        color = Colors.blue;
        break;
      case 'mastercard':
        icon = Icons.credit_card;
        color = Colors.orange;
        break;
      case 'amex':
        icon = Icons.credit_card;
        color = Colors.indigo;
        break;
      default:
        icon = Icons.credit_card;
        color = Colors.grey;
    }

    return Container(
      width: 40,
      height: 28,
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Icon(icon, color: color, size: 20),
    );
  }

  Widget _buildAddPaymentMethodButton() {
    return InkWell(
      onTap: _addPaymentMethod,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border:
              Border.all(color: Colors.grey[300]!, style: BorderStyle.solid),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.add, color: Colors.grey[600]),
            const SizedBox(width: 8),
            Text(
              'Add Payment Method',
              style: TextStyle(
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _addPaymentMethod() async {
    final success = await ref.read(paymentProvider.notifier).addPaymentMethod();
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Payment method added successfully'),
          backgroundColor: AppColors.success,
        ),
      );
    }
  }

  void _showPaymentMethodsSheet(PaymentState state) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) => PaymentMethodsSheet(
        methods: state.paymentMethods,
        selectedId: state.defaultPaymentMethod?.id,
        onSelect: (method) {
          ref.read(paymentProvider.notifier).setDefaultPaymentMethod(method.id);
          Navigator.pop(context);
        },
        onAddNew: () {
          Navigator.pop(context);
          _addPaymentMethod();
        },
      ),
    );
  }

  Widget _buildSecurityNotice() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Icon(Icons.lock, size: 20, color: Colors.grey[600]),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'Your payment information is encrypted and secure. We never store your full card details.',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCheckoutButton(CheckoutState state) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SafeArea(
        child: SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: state.isProcessing ? null : _handleCheckout,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: state.isProcessing
                ? const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation(Colors.white),
                    ),
                  )
                : Text(
                    'Pay ${_formatAmount(widget.amount)}',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
          ),
        ),
      ),
    );
  }
}

// ============================================================================
// Payment Methods Bottom Sheet
// ============================================================================

class PaymentMethodsSheet extends StatelessWidget {
  final List<PaymentMethod> methods;
  final String? selectedId;
  final Function(PaymentMethod) onSelect;
  final VoidCallback onAddNew;

  const PaymentMethodsSheet({
    super.key,
    required this.methods,
    this.selectedId,
    required this.onSelect,
    required this.onAddNew,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Select Payment Method',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          ...methods.map((method) => _buildMethodTile(context, method)),
          const Divider(height: 24),
          ListTile(
            leading: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.add, color: AppColors.primary),
            ),
            title: const Text('Add New Card'),
            onTap: onAddNew,
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildMethodTile(BuildContext context, PaymentMethod method) {
    final isSelected = method.id == selectedId;
    return ListTile(
      leading: Container(
        width: 40,
        height: 28,
        decoration: BoxDecoration(
          color: Colors.grey[100],
          borderRadius: BorderRadius.circular(4),
        ),
        child: const Icon(Icons.credit_card, size: 20),
      ),
      title: Text(method.displayName),
      subtitle: method.expiryDisplay.isNotEmpty
          ? Text('Expires ${method.expiryDisplay}')
          : null,
      trailing: isSelected
          ? const Icon(Icons.check_circle, color: AppColors.primary)
          : null,
      onTap: () => onSelect(method),
    );
  }
}
