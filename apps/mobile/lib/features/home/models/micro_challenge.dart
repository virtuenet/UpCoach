class MicroChallenge {
  MicroChallenge({
    required this.id,
    required this.title,
    required this.description,
    required this.microCopy,
    required this.durationMinutes,
    required this.rewardXp,
    required this.category,
    required this.status,
    required this.reason,
  });

  final String id;
  final String title;
  final String description;
  final String microCopy;
  final int durationMinutes;
  final int rewardXp;
  final String category;
  final String status;
  final String reason;

  factory MicroChallenge.fromJson(Map<String, dynamic> json) {
    return MicroChallenge(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      microCopy: json['microCopy'] as String? ?? '',
      durationMinutes: json['durationMinutes'] as int? ?? 0,
      rewardXp: json['rewardXp'] as int? ?? 0,
      category: json['category'] as String? ?? 'focus',
      status: json['status'] as String? ?? 'available',
      reason: json['reason'] as String? ?? '',
    );
  }
}
