import 'package:equatable/equatable.dart';

enum MessageType {
  user,
  assistant,
  system,
}

enum MessageStatus {
  sending,
  sent,
  failed,
}

class ChatMessage extends Equatable {
  final String id;
  final String content;
  final MessageType type;
  final MessageStatus status;
  final DateTime timestamp;
  final String? conversationId;
  final Map<String, dynamic>? metadata;

  const ChatMessage({
    required this.id,
    required this.content,
    required this.type,
    this.status = MessageStatus.sent,
    required this.timestamp,
    this.conversationId,
    this.metadata,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'] as String,
      content: json['content'] as String,
      type: MessageType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => MessageType.user,
      ),
      status: MessageStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => MessageStatus.sent,
      ),
      timestamp: DateTime.parse(json['timestamp'] as String),
      conversationId: json['conversation_id'] as String?,
      metadata: json['metadata'] as Map<String, dynamic>?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'content': content,
      'type': type.name,
      'status': status.name,
      'timestamp': timestamp.toIso8601String(),
      'conversation_id': conversationId,
      'metadata': metadata,
    };
  }

  ChatMessage copyWith({
    String? id,
    String? content,
    MessageType? type,
    MessageStatus? status,
    DateTime? timestamp,
    String? conversationId,
    Map<String, dynamic>? metadata,
  }) {
    return ChatMessage(
      id: id ?? this.id,
      content: content ?? this.content,
      type: type ?? this.type,
      status: status ?? this.status,
      timestamp: timestamp ?? this.timestamp,
      conversationId: conversationId ?? this.conversationId,
      metadata: metadata ?? this.metadata,
    );
  }

  bool get isUser => type == MessageType.user;
  bool get isAssistant => type == MessageType.assistant;
  bool get isSystem => type == MessageType.system;
  bool get isPending => status == MessageStatus.sending;
  bool get hasFailed => status == MessageStatus.failed;

  @override
  List<Object?> get props => [
        id,
        content,
        type,
        status,
        timestamp,
        conversationId,
        metadata,
      ];
}
