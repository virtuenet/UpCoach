class StreakGuardian {
  StreakGuardian({
    required this.id,
    required this.status,
    required this.partnerName,
    required this.partnerEmail,
    this.lastAlertAt,
  });

  final String id;
  final String status;
  final String partnerName;
  final String partnerEmail;
  final DateTime? lastAlertAt;

  bool get isAccepted => status == 'accepted';

  factory StreakGuardian.fromJson(Map<String, dynamic> json) {
    final guardian = json['guardian'] as Map<String, dynamic>? ?? const {};
    return StreakGuardian(
      id: json['id'] as String? ?? '',
      status: json['status'] as String? ?? 'pending',
      partnerName: guardian['name'] as String? ?? 'Partner',
      partnerEmail: guardian['email'] as String? ?? '',
      lastAlertAt: json['lastAlertAt'] != null
          ? DateTime.tryParse(json['lastAlertAt'] as String)
          : null,
    );
  }
}

