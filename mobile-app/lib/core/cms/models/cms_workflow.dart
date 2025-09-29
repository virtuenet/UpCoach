import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:flutter/foundation.dart';
import 'cms_content.dart';

part 'cms_workflow.freezed.dart';
part 'cms_workflow.g.dart';

enum WorkflowStatus {
  pending,
  inReview,
  approved,
  rejected,
  published,
}

enum WorkflowPriority {
  low,
  normal,
  high,
  urgent,
}

@freezed
class CMSWorkflow with _$CMSWorkflow {
  const factory CMSWorkflow({
    required String id,
    required String contentId,
    required WorkflowStatus status,
    required WorkflowPriority priority,
    required String title,
    String? description,
    required String submittedBy,
    String? submitterName,
    DateTime? submittedAt,
    String? assignedTo,
    String? assigneeName,
    DateTime? assignedAt,
    String? approvedBy,
    String? approverName,
    DateTime? approvedAt,
    String? rejectedBy,
    String? rejecterName,
    DateTime? rejectedAt,
    String? rejectionReason,
    @Default([]) List<WorkflowComment> comments,
    @Default([]) List<WorkflowHistory> history,
    ContentVersion? currentVersion,
    ContentVersion? proposedVersion,
    DateTime? dueDate,
    @Default({}) Map<String, dynamic> metadata,
  }) = _CMSWorkflow;

  factory CMSWorkflow.fromJson(Map<String, dynamic> json) =>
      _$CMSWorkflowFromJson(json);
}

@freezed
class WorkflowComment with _$WorkflowComment {
  const factory WorkflowComment({
    required String id,
    required String workflowId,
    required String userId,
    required String userName,
    required String comment,
    required DateTime createdAt,
    String? userAvatar,
    @Default([]) List<String> attachments,
  }) = _WorkflowComment;

  factory WorkflowComment.fromJson(Map<String, dynamic> json) =>
      _$WorkflowCommentFromJson(json);
}

@freezed
class WorkflowHistory with _$WorkflowHistory {
  const factory WorkflowHistory({
    required String id,
    required String workflowId,
    required WorkflowAction action,
    required String userId,
    required String userName,
    required DateTime timestamp,
    String? comment,
    Map<String, dynamic>? metadata,
  }) = _WorkflowHistory;

  factory WorkflowHistory.fromJson(Map<String, dynamic> json) =>
      _$WorkflowHistoryFromJson(json);
}

enum WorkflowAction {
  created,
  submitted,
  assigned,
  commented,
  approved,
  rejected,
  published,
  archived,
  reopened,
}

@freezed
class WorkflowNotification with _$WorkflowNotification {
  const factory WorkflowNotification({
    required String id,
    required String workflowId,
    required WorkflowNotificationType type,
    required String title,
    required String body,
    String? imageUrl,
    required bool isRead,
    required DateTime createdAt,
    Map<String, dynamic>? data,
    List<NotificationAction>? actions,
  }) = _WorkflowNotification;

  factory WorkflowNotification.fromJson(Map<String, dynamic> json) =>
      _$WorkflowNotificationFromJson(json);
}

enum WorkflowNotificationType {
  newSubmission,
  assignedToYou,
  statusChanged,
  commentAdded,
  approvalRequired,
  approvalReceived,
  rejectionReceived,
  published,
  dueDateReminder,
}

@freezed
class NotificationAction with _$NotificationAction {
  const factory NotificationAction({
    required String id,
    required String label,
    required NotificationActionType type,
    String? icon,
    Map<String, dynamic>? data,
  }) = _NotificationAction;

  factory NotificationAction.fromJson(Map<String, dynamic> json) =>
      _$NotificationActionFromJson(json);
}

enum NotificationActionType {
  approve,
  reject,
  view,
  edit,
  comment,
  assign,
  dismiss,
}