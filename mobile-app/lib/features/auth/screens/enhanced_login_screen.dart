import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/services/auth_service.dart';
import '../../../shared/widgets/live_progress_indicator.dart';
import '../providers/enhanced_auth_provider.dart';

class EnhancedLoginScreen extends ConsumerStatefulWidget {
  const EnhancedLoginScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<EnhancedLoginScreen> createState() => _EnhancedLoginScreenState();
}

class _EnhancedLoginScreenState extends ConsumerState<EnhancedLoginScreen>
    with TickerProviderStateMixin {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  bool _isEmailLogin = false;
  bool _isPasswordVisible = false;
  bool _isLoading = false;
  bool _rememberMe = false;

  @override
  void initState() {
    super.initState();

    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _animationController, curve: Curves.easeOutCubic));

    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(enhancedAuthProvider);

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: SlideTransition(
              position: _slideAnimation,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 60),
                  _buildHeader(),
                  const SizedBox(height: 50),
                  _buildAuthMethods(),
                  const SizedBox(height: 30),
                  if (_isEmailLogin) ...[
                    _buildEmailLoginForm(),
                    const SizedBox(height: 20),
                  ],
                  _buildFooter(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      children: [
        Container(
          width: 100,
          height: 100,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                AppTheme.primaryColor,
                AppTheme.primaryColor.withOpacity(0.7),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(25),
            boxShadow: [
              BoxShadow(
                color: AppTheme.primaryColor.withOpacity(0.3),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: const Icon(
            CupertinoIcons.person_crop_circle,
            size: 50,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 24),
        const Text(
          'Welcome Back',
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Sign in to continue your coaching journey',
          style: TextStyle(
            fontSize: 16,
            color: Colors.grey.shade600,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildAuthMethods() {
    return Column(
      children: [
        // Google Sign-In
        _buildSocialLoginButton(
          icon: 'assets/icons/google.png', // You'll need to add this icon
          label: 'Continue with Google',
          onPressed: _signInWithGoogle,
          backgroundColor: Colors.white,
          textColor: Colors.black87,
          borderColor: Colors.grey.shade300,
        ),

        const SizedBox(height: 16),

        // Apple Sign-In (iOS only)
        if (Theme.of(context).platform == TargetPlatform.iOS)
          Column(
            children: [
              _buildSocialLoginButton(
                icon: 'assets/icons/apple.png', // You'll need to add this icon
                label: 'Continue with Apple',
                onPressed: _signInWithApple,
                backgroundColor: Colors.black,
                textColor: Colors.white,
                borderColor: Colors.black,
              ),
              const SizedBox(height: 16),
            ],
          ),

        // Facebook Sign-In
        _buildSocialLoginButton(
          icon: 'assets/icons/facebook.png', // You'll need to add this icon
          label: 'Continue with Facebook',
          onPressed: _signInWithFacebook,
          backgroundColor: const Color(0xFF1877F2),
          textColor: Colors.white,
          borderColor: const Color(0xFF1877F2),
        ),

        const SizedBox(height: 24),

        // Divider
        Row(
          children: [
            Expanded(child: Divider(color: Colors.grey.shade300)),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                'or',
                style: TextStyle(
                  color: Colors.grey.shade600,
                  fontSize: 14,
                ),
              ),
            ),
            Expanded(child: Divider(color: Colors.grey.shade300)),
          ],
        ),

        const SizedBox(height: 24),

        // Email Login Toggle
        _buildEmailLoginToggle(),
      ],
    );
  }

  Widget _buildSocialLoginButton({
    required String icon,
    required String label,
    required VoidCallback onPressed,
    required Color backgroundColor,
    required Color textColor,
    required Color borderColor,
  }) {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: ElevatedButton(
        onPressed: _isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: backgroundColor,
          foregroundColor: textColor,
          elevation: 2,
          shadowColor: Colors.black.withOpacity(0.1),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: BorderSide(color: borderColor),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Note: Replace with actual icons
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                color: textColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Icon(
                CupertinoIcons.person_circle,
                size: 16,
                color: textColor,
              ),
            ),
            const SizedBox(width: 16),
            Text(
              label,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: textColor,
              ),
            ),
            if (_isLoading) ...[
              const SizedBox(width: 16),
              SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(textColor),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildEmailLoginToggle() {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: OutlinedButton(
        onPressed: _toggleEmailLogin,
        style: OutlinedButton.styleFrom(
          side: BorderSide(color: AppTheme.primaryColor),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              _isEmailLogin ? CupertinoIcons.arrow_up : CupertinoIcons.mail,
              color: AppTheme.primaryColor,
            ),
            const SizedBox(width: 12),
            Text(
              _isEmailLogin ? 'Hide Email Login' : 'Continue with Email',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppTheme.primaryColor,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmailLoginForm() {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
      child: Form(
        key: _formKey,
        child: Column(
          children: [
            _buildEmailField(),
            const SizedBox(height: 16),
            _buildPasswordField(),
            const SizedBox(height: 16),
            _buildRememberMeRow(),
            const SizedBox(height: 24),
            _buildLoginButton(),
            const SizedBox(height: 16),
            _buildForgotPasswordLink(),
          ],
        ),
      ),
    );
  }

  Widget _buildEmailField() {
    return TextFormField(
      controller: _emailController,
      keyboardType: TextInputType.emailAddress,
      decoration: InputDecoration(
        labelText: 'Email',
        hintText: 'Enter your email address',
        prefixIcon: const Icon(CupertinoIcons.mail),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: AppTheme.primaryColor),
        ),
      ),
      validator: (value) {
        if (value == null || value.isEmpty) {
          return 'Please enter your email';
        }
        if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
          return 'Please enter a valid email';
        }
        return null;
      },
    );
  }

  Widget _buildPasswordField() {
    return TextFormField(
      controller: _passwordController,
      obscureText: !_isPasswordVisible,
      decoration: InputDecoration(
        labelText: 'Password',
        hintText: 'Enter your password',
        prefixIcon: const Icon(CupertinoIcons.lock),
        suffixIcon: IconButton(
          icon: Icon(
            _isPasswordVisible ? CupertinoIcons.eye_slash : CupertinoIcons.eye,
          ),
          onPressed: () {
            setState(() {
              _isPasswordVisible = !_isPasswordVisible;
            });
          },
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: AppTheme.primaryColor),
        ),
      ),
      validator: (value) {
        if (value == null || value.isEmpty) {
          return 'Please enter your password';
        }
        if (value.length < 6) {
          return 'Password must be at least 6 characters';
        }
        return null;
      },
    );
  }

  Widget _buildRememberMeRow() {
    return Row(
      children: [
        Checkbox(
          value: _rememberMe,
          onChanged: (value) {
            setState(() {
              _rememberMe = value ?? false;
            });
          },
          activeColor: AppTheme.primaryColor,
        ),
        const Text('Remember me'),
        const Spacer(),
        TextButton(
          onPressed: _forgotPassword,
          child: Text(
            'Forgot Password?',
            style: TextStyle(color: AppTheme.primaryColor),
          ),
        ),
      ],
    );
  }

  Widget _buildLoginButton() {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: ElevatedButton(
        onPressed: _isLoading ? null : _signInWithEmail,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppTheme.primaryColor,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
        child: _isLoading
            ? const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              )
            : const Text(
                'Sign In',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
      ),
    );
  }

  Widget _buildForgotPasswordLink() {
    return TextButton(
      onPressed: _forgotPassword,
      child: Text(
        'Forgot your password?',
        style: TextStyle(
          color: AppTheme.primaryColor,
          fontSize: 14,
        ),
      ),
    );
  }

  Widget _buildFooter() {
    return Column(
      children: [
        const SizedBox(height: 30),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text("Don't have an account? "),
            TextButton(
              onPressed: _navigateToRegister,
              child: Text(
                'Sign Up',
                style: TextStyle(
                  color: AppTheme.primaryColor,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),
        Text(
          'By continuing, you agree to our Terms of Service and Privacy Policy',
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey.shade600,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  // Authentication methods
  Future<void> _signInWithGoogle() async {
    setState(() => _isLoading = true);
    try {
      final authService = AuthService();
      final response = await authService.signInWithGoogle();

      if (mounted) {
        ref.read(enhancedAuthProvider.notifier).setAuthenticatedUser(response.user);
        _navigateToHome();
      }
    } catch (e) {
      if (mounted) {
        _showErrorSnackBar('Google Sign-In failed: ${e.toString()}');
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _signInWithApple() async {
    setState(() => _isLoading = true);
    try {
      final authService = AuthService();
      final response = await authService.signInWithApple();

      if (mounted) {
        ref.read(enhancedAuthProvider.notifier).setAuthenticatedUser(response.user);
        _navigateToHome();
      }
    } catch (e) {
      if (mounted) {
        _showErrorSnackBar('Apple Sign-In failed: ${e.toString()}');
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _signInWithFacebook() async {
    setState(() => _isLoading = true);
    try {
      final authService = AuthService();
      final response = await authService.signInWithFacebook();

      if (mounted) {
        ref.read(enhancedAuthProvider.notifier).setAuthenticatedUser(response.user);
        _navigateToHome();
      }
    } catch (e) {
      if (mounted) {
        _showErrorSnackBar('Facebook Sign-In failed: ${e.toString()}');
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _signInWithEmail() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    try {
      final authService = AuthService();
      final response = await authService.login(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );

      if (mounted) {
        ref.read(enhancedAuthProvider.notifier).setAuthenticatedUser(response.user);
        _navigateToHome();
      }
    } catch (e) {
      if (mounted) {
        _showErrorSnackBar('Email Sign-In failed: ${e.toString()}');
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _toggleEmailLogin() {
    setState(() {
      _isEmailLogin = !_isEmailLogin;
    });
  }

  void _forgotPassword() {
    // Navigate to forgot password screen
    Navigator.pushNamed(context, '/forgot-password');
  }

  void _navigateToRegister() {
    Navigator.pushNamed(context, '/register');
  }

  void _navigateToHome() {
    Navigator.pushReplacementNamed(context, '/home');
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
      ),
    );
  }
}