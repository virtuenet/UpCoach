import 'package:equatable/equatable.dart';
import 'chat_message.dart';

class Conversation extends Equatable {
  final String id;
  final String title;
  final String userId;
  final List<ChatMessage> messages;
  final DateTime createdAt;
  final DateTime updatedAt;
  final Map<String, dynamic>? metadata;

  const Conversation({
    required this.id,
    required this.title,
    required this.userId,
    this.messages = const [],
    required this.createdAt,
    required this.updatedAt,
    this.metadata,
  });

  factory Conversation.fromJson(Map<String, dynamic> json) {
    return Conversation(
      id: json['id'] as String,
      title: json['title'] as String,
      userId: json['user_id'] as String,
      messages: (json['messages'] as List<dynamic>?)
              ?.map((m) => ChatMessage.fromJson(m as Map<String, dynamic>))
              .toList() ??
          [],
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
      metadata: json['metadata'] as Map<String, dynamic>?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'user_id': userId,
      'messages': messages.map((m) => m.toJson()).toList(),
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'metadata': metadata,
    };
  }

  Conversation copyWith({
    String? id,
    String? title,
    String? userId,
    List<ChatMessage>? messages,
    DateTime? createdAt,
    DateTime? updatedAt,
    Map<String, dynamic>? metadata,
  }) {
    return Conversation(
      id: id ?? this.id,
      title: title ?? this.title,
      userId: userId ?? this.userId,
      messages: messages ?? this.messages,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      metadata: metadata ?? this.metadata,
    );
  }

  Conversation addMessage(ChatMessage message) {
    return copyWith(
      messages: [...messages, message],
      updatedAt: DateTime.now(),
    );
  }

  Conversation updateMessage(String messageId, ChatMessage updatedMessage) {
    final updatedMessages = messages.map((message) {
      return message.id == messageId ? updatedMessage : message;
    }).toList();

    return copyWith(
      messages: updatedMessages,
      updatedAt: DateTime.now(),
    );
  }

  ChatMessage? get lastMessage => messages.isNotEmpty ? messages.last : null;
  
  int get messageCount => messages.length;
  
  bool get isEmpty => messages.isEmpty;

  @override
  List<Object?> get props => [
        id,
        title,
        userId,
        messages,
        createdAt,
        updatedAt,
        metadata,
      ];
} 