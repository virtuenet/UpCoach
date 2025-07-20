import 'package:equatable/equatable.dart';

class User extends Equatable {
  final String id;
  final String email;
  final String fullName;
  final String? avatarUrl;
  final String? phone;
  final String? department;
  final String? jobTitle;
  final String? company;
  final String timezone;
  final bool onboardingCompleted;
  final String role;
  final String subscriptionPlan;
  final DateTime createdAt;
  final DateTime? updatedAt;

  const User({
    required this.id,
    required this.email,
    required this.fullName,
    this.avatarUrl,
    this.phone,
    this.department,
    this.jobTitle,
    this.company,
    this.timezone = 'UTC',
    this.onboardingCompleted = false,
    this.role = 'user',
    this.subscriptionPlan = 'free',
    required this.createdAt,
    this.updatedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      email: json['email'] as String,
      fullName: json['full_name'] as String,
      avatarUrl: json['avatar_url'] as String?,
      phone: json['phone'] as String?,
      department: json['department'] as String?,
      jobTitle: json['job_title'] as String?,
      company: json['company'] as String?,
      timezone: json['timezone'] as String? ?? 'UTC',
      onboardingCompleted: json['onboarding_completed'] as bool? ?? false,
      role: json['role'] as String? ?? 'user',
      subscriptionPlan: json['subscription_plan'] as String? ?? 'free',
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: json['updated_at'] != null 
          ? DateTime.parse(json['updated_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'full_name': fullName,
      'avatar_url': avatarUrl,
      'phone': phone,
      'department': department,
      'job_title': jobTitle,
      'company': company,
      'timezone': timezone,
      'onboarding_completed': onboardingCompleted,
      'role': role,
      'subscription_plan': subscriptionPlan,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  User copyWith({
    String? id,
    String? email,
    String? fullName,
    String? avatarUrl,
    String? phone,
    String? department,
    String? jobTitle,
    String? company,
    String? timezone,
    bool? onboardingCompleted,
    String? role,
    String? subscriptionPlan,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return User(
      id: id ?? this.id,
      email: email ?? this.email,
      fullName: fullName ?? this.fullName,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      phone: phone ?? this.phone,
      department: department ?? this.department,
      jobTitle: jobTitle ?? this.jobTitle,
      company: company ?? this.company,
      timezone: timezone ?? this.timezone,
      onboardingCompleted: onboardingCompleted ?? this.onboardingCompleted,
      role: role ?? this.role,
      subscriptionPlan: subscriptionPlan ?? this.subscriptionPlan,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  List<Object?> get props => [
    id,
    email,
    fullName,
    avatarUrl,
    phone,
    department,
    jobTitle,
    company,
    timezone,
    onboardingCompleted,
    role,
    subscriptionPlan,
    createdAt,
    updatedAt,
  ];
} 