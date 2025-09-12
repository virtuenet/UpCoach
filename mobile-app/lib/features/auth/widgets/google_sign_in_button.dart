import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../providers/auth_provider.dart';

/// Material Design 3 Google Sign-In Button
class GoogleSignInButton extends ConsumerWidget {
  final VoidCallback? onPressed;
  final bool isLoading;
  final GoogleSignInButtonStyle style;
  final double? width;
  final double height;

  const GoogleSignInButton({
    Key? key,
    this.onPressed,
    this.isLoading = false,
    this.style = GoogleSignInButtonStyle.elevated,
    this.width,
    this.height = 48,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final isAuthLoading = authState.isLoading || isLoading;

    return SizedBox(
      width: width,
      height: height,
      child: _buildButton(context, ref, isAuthLoading),
    );
  }

  Widget _buildButton(BuildContext context, WidgetRef ref, bool isAuthLoading) {
    switch (style) {
      case GoogleSignInButtonStyle.elevated:
        return _buildElevatedButton(context, ref, isAuthLoading);
      case GoogleSignInButtonStyle.outlined:
        return _buildOutlinedButton(context, ref, isAuthLoading);
      case GoogleSignInButtonStyle.text:
        return _buildTextButton(context, ref, isAuthLoading);
      case GoogleSignInButtonStyle.icon:
        return _buildIconButton(context, ref, isAuthLoading);
    }
  }

  Widget _buildElevatedButton(BuildContext context, WidgetRef ref, bool isAuthLoading) {
    return ElevatedButton(
      onPressed: isAuthLoading ? null : (onPressed ?? () => _handleSignIn(ref)),
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        elevation: 1,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(height / 2),
          side: BorderSide(
            color: Colors.grey.shade300,
            width: 1,
          ),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16),
      ),
      child: _buildButtonContent(isAuthLoading),
    );
  }

  Widget _buildOutlinedButton(BuildContext context, WidgetRef ref, bool isAuthLoading) {
    return OutlinedButton(
      onPressed: isAuthLoading ? null : (onPressed ?? () => _handleSignIn(ref)),
      style: OutlinedButton.styleFrom(
        foregroundColor: Theme.of(context).brightness == Brightness.dark
            ? Colors.white
            : Colors.black87,
        side: BorderSide(
          color: Theme.of(context).brightness == Brightness.dark
              ? Colors.white24
              : Colors.black12,
          width: 1,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(height / 2),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16),
      ),
      child: _buildButtonContent(isAuthLoading),
    );
  }

  Widget _buildTextButton(BuildContext context, WidgetRef ref, bool isAuthLoading) {
    return TextButton(
      onPressed: isAuthLoading ? null : (onPressed ?? () => _handleSignIn(ref)),
      style: TextButton.styleFrom(
        foregroundColor: Theme.of(context).brightness == Brightness.dark
            ? Colors.white
            : Colors.black87,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(height / 2),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16),
      ),
      child: _buildButtonContent(isAuthLoading),
    );
  }

  Widget _buildIconButton(BuildContext context, WidgetRef ref, bool isAuthLoading) {
    return IconButton(
      onPressed: isAuthLoading ? null : (onPressed ?? () => _handleSignIn(ref)),
      icon: isAuthLoading
          ? SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(
                  Theme.of(context).colorScheme.primary,
                ),
              ),
            )
          : _buildGoogleLogo(24),
      iconSize: 24,
      padding: const EdgeInsets.all(12),
    );
  }

  Widget _buildButtonContent(bool isAuthLoading) {
    if (isAuthLoading) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation<Color>(Colors.grey.shade600),
            ),
          ),
          const SizedBox(width: 12),
          Text(
            'Signing in...',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: Colors.grey.shade600,
            ),
          ),
        ],
      );
    }

    return Row(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _buildGoogleLogo(20),
        const SizedBox(width: 12),
        const Text(
          'Continue with Google',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildGoogleLogo(double size) {
    // Using a simplified Google logo as SVG
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(size / 8),
      ),
      child: Center(
        child: Image.network(
          'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg',
          width: size * 0.9,
          height: size * 0.9,
          errorBuilder: (context, error, stackTrace) {
            // Fallback to a simple "G" if image fails to load
            return Container(
              width: size,
              height: size,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(size / 8),
                border: Border.all(color: Colors.grey.shade300, width: 1),
              ),
              child: Center(
                child: Text(
                  'G',
                  style: TextStyle(
                    fontSize: size * 0.6,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF4285F4),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Future<void> _handleSignIn(WidgetRef ref) async {
    final authNotifier = ref.read(authProvider.notifier);
    final success = await authNotifier.signInWithGoogle();
    
    if (!success) {
      final error = ref.read(authProvider).error;
      if (error != null && error.isNotEmpty) {
        // Show error to user (you might want to use a snackbar or dialog)
        debugPrint('Google Sign-In Error: $error');
      }
    }
  }
}

/// Google Sign-In button styles
enum GoogleSignInButtonStyle {
  elevated,
  outlined,
  text,
  icon,
}

/// Compact Google Sign-In Button for smaller spaces
class GoogleSignInCompactButton extends ConsumerWidget {
  final VoidCallback? onPressed;
  final bool showText;
  
  const GoogleSignInCompactButton({
    Key? key,
    this.onPressed,
    this.showText = true,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final isLoading = authState.isLoading;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: isLoading ? null : (onPressed ?? () => _handleSignIn(ref)),
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: EdgeInsets.symmetric(
            horizontal: showText ? 16 : 8,
            vertical: 8,
          ),
          decoration: BoxDecoration(
            border: Border.all(
              color: Theme.of(context).dividerColor,
              width: 1,
            ),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (isLoading)
                SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      Theme.of(context).colorScheme.primary,
                    ),
                  ),
                )
              else
                Image.network(
                  'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg',
                  width: 20,
                  height: 20,
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      width: 20,
                      height: 20,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: Colors.grey.shade300),
                      ),
                      child: const Center(
                        child: Text(
                          'G',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF4285F4),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              if (showText) ...[
                const SizedBox(width: 8),
                Text(
                  isLoading ? 'Signing in...' : 'Google',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: Theme.of(context).textTheme.bodyLarge?.color,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _handleSignIn(WidgetRef ref) async {
    final authNotifier = ref.read(authProvider.notifier);
    await authNotifier.signInWithGoogle();
  }
}