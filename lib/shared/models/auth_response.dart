import 'package:equatable/equatable.dart';
import 'user_model.dart';

class AuthResponse extends Equatable {
  final User user;
  final AuthTokens tokens;

  const AuthResponse({
    required this.user,
    required this.tokens,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      user: User.fromJson(json['user'] as Map<String, dynamic>),
      tokens: AuthTokens.fromJson(json['tokens'] as Map<String, dynamic>),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'user': user.toJson(),
      'tokens': tokens.toJson(),
    };
  }

  @override
  List<Object?> get props => [user, tokens];
}

class AuthTokens extends Equatable {
  final String accessToken;
  final String refreshToken;

  const AuthTokens({
    required this.accessToken,
    required this.refreshToken,
  });

  factory AuthTokens.fromJson(Map<String, dynamic> json) {
    return AuthTokens(
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'accessToken': accessToken,
      'refreshToken': refreshToken,
    };
  }

  @override
  List<Object?> get props => [accessToken, refreshToken];
}

class LoginRequest extends Equatable {
  final String email;
  final String password;

  const LoginRequest({
    required this.email,
    required this.password,
  });

  Map<String, dynamic> toJson() {
    return {
      'email': email,
      'password': password,
    };
  }

  @override
  List<Object?> get props => [email, password];
}

class RegisterRequest extends Equatable {
  final String email;
  final String password;
  final String fullName;
  final String? companyName;

  const RegisterRequest({
    required this.email,
    required this.password,
    required this.fullName,
    this.companyName,
  });

  Map<String, dynamic> toJson() {
    return {
      'email': email,
      'password': password,
      'fullName': fullName,
      if (companyName != null) 'companyName': companyName,
    };
  }

  @override
  List<Object?> get props => [email, password, fullName, companyName];
} 