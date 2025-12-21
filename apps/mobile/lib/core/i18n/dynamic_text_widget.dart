/// Dynamic Text Widget
///
/// Flutter widgets for displaying dynamically localized content
/// with automatic translation and caching.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'content_localization_service.dart';
import 'i18n_provider.dart';
import 'rtl_support.dart';

/// Widget that displays dynamically localized text
class DynamicLocalizedText extends ConsumerWidget {
  final String contentId;
  final LocalizableContentType contentType;
  final String sourceText;
  final String sourceLocale;
  final TextStyle? style;
  final TextAlign? textAlign;
  final int? maxLines;
  final TextOverflow? overflow;
  final bool showLoadingIndicator;
  final Widget? loadingWidget;
  final Widget? errorWidget;

  const DynamicLocalizedText({
    super.key,
    required this.contentId,
    required this.contentType,
    required this.sourceText,
    this.sourceLocale = 'en',
    this.style,
    this.textAlign,
    this.maxLines,
    this.overflow,
    this.showLoadingIndicator = false,
    this.loadingWidget,
    this.errorWidget,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final params = LocalizedContentParams(
      contentId: contentId,
      contentType: contentType,
      sourceText: sourceText,
      sourceLocale: sourceLocale,
    );

    final asyncValue = ref.watch(localizedContentProvider(params));
    final isRTL = ref.watch(isRTLProvider);

    return asyncValue.when(
      data: (text) => Text(
        text,
        style: style,
        textAlign: textAlign ?? (isRTL ? TextAlign.right : TextAlign.left),
        maxLines: maxLines,
        overflow: overflow,
        textDirection: isRTL ? TextDirection.rtl : TextDirection.ltr,
      ),
      loading: () {
        if (showLoadingIndicator) {
          return loadingWidget ??
              SizedBox(
                height: style?.fontSize ?? 16,
                width: 100,
                child: LinearProgressIndicator(
                  backgroundColor: Colors.grey[200],
                  valueColor: AlwaysStoppedAnimation<Color>(
                    Theme.of(context).primaryColor.withOpacity(0.5),
                  ),
                ),
              );
        }
        // Show source text while loading
        return Text(
          sourceText,
          style: style,
          textAlign: textAlign,
          maxLines: maxLines,
          overflow: overflow,
        );
      },
      error: (error, stack) {
        // Show source text on error
        return errorWidget ??
            Text(
              sourceText,
              style: style,
              textAlign: textAlign,
              maxLines: maxLines,
              overflow: overflow,
            );
      },
    );
  }
}

/// Widget that displays localized coaching tip
class LocalizedCoachingTip extends ConsumerWidget {
  final String tipId;
  final String tipText;
  final String? sourceLocale;
  final TextStyle? titleStyle;
  final TextStyle? bodyStyle;
  final Color? backgroundColor;
  final EdgeInsets? padding;
  final BorderRadius? borderRadius;

  const LocalizedCoachingTip({
    super.key,
    required this.tipId,
    required this.tipText,
    this.sourceLocale = 'en',
    this.titleStyle,
    this.bodyStyle,
    this.backgroundColor,
    this.padding,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isRTL = ref.watch(isRTLProvider);

    return Container(
      padding: padding ?? const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: backgroundColor ?? Colors.blue.withOpacity(0.1),
        borderRadius: borderRadius ?? BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment:
            isRTL ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          RTLRow(
            children: [
              RTLIcon(
                icon: Icons.lightbulb_outline,
                color: Colors.amber,
                size: 24,
              ),
              const SizedBox(width: 8),
              Text(
                'Coaching Tip',
                style: titleStyle ??
                    TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Colors.blue[700],
                    ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          DynamicLocalizedText(
            contentId: tipId,
            contentType: LocalizableContentType.coachingTip,
            sourceText: tipText,
            sourceLocale: sourceLocale!,
            style: bodyStyle ?? const TextStyle(fontSize: 14),
          ),
        ],
      ),
    );
  }
}

/// Widget that displays localized notification content
class LocalizedNotification extends ConsumerWidget {
  final String notificationId;
  final String title;
  final String body;
  final String? sourceLocale;
  final IconData? icon;
  final Color? iconColor;
  final VoidCallback? onTap;
  final VoidCallback? onDismiss;

  const LocalizedNotification({
    super.key,
    required this.notificationId,
    required this.title,
    required this.body,
    this.sourceLocale = 'en',
    this.icon,
    this.iconColor,
    this.onTap,
    this.onDismiss,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isRTL = ref.watch(isRTLProvider);

    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            textDirection: isRTL ? TextDirection.rtl : TextDirection.ltr,
            children: [
              if (icon != null) ...[
                Icon(icon, color: iconColor ?? Colors.blue, size: 32),
                const SizedBox(width: 12),
              ],
              Expanded(
                child: Column(
                  crossAxisAlignment:
                      isRTL ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                  children: [
                    DynamicLocalizedText(
                      contentId: '${notificationId}_title',
                      contentType: LocalizableContentType.notification,
                      sourceText: title,
                      sourceLocale: sourceLocale!,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 4),
                    DynamicLocalizedText(
                      contentId: '${notificationId}_body',
                      contentType: LocalizableContentType.notification,
                      sourceText: body,
                      sourceLocale: sourceLocale!,
                      style: TextStyle(
                        color: Colors.grey[600],
                        fontSize: 14,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              if (onDismiss != null) ...[
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.close, size: 20),
                  onPressed: onDismiss,
                  color: Colors.grey,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

/// Widget that displays localized AI response
class LocalizedAIResponse extends ConsumerWidget {
  final String responseId;
  final String responseText;
  final String? sourceLocale;
  final bool isLoading;
  final TextStyle? style;

  const LocalizedAIResponse({
    super.key,
    required this.responseId,
    required this.responseText,
    this.sourceLocale = 'en',
    this.isLoading = false,
    this.style,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isRTL = ref.watch(isRTLProvider);

    if (isLoading) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.grey[100],
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(
                  Theme.of(context).primaryColor,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Text(
              'Thinking...',
              style: TextStyle(
                color: Colors.grey[600],
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.blue.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment:
            isRTL ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          RTLRow(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.blue,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.auto_awesome,
                  color: Colors.white,
                  size: 16,
                ),
              ),
              const SizedBox(width: 8),
              const Text(
                'AI Coach',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.blue,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          DynamicLocalizedText(
            contentId: responseId,
            contentType: LocalizableContentType.aiResponse,
            sourceText: responseText,
            sourceLocale: sourceLocale!,
            style: style ?? const TextStyle(fontSize: 15, height: 1.5),
          ),
        ],
      ),
    );
  }
}

/// Widget for displaying localized habit description
class LocalizedHabitCard extends ConsumerWidget {
  final String habitId;
  final String habitName;
  final String habitDescription;
  final String? sourceLocale;
  final IconData? icon;
  final Color? color;
  final bool isCompleted;
  final VoidCallback? onTap;
  final VoidCallback? onComplete;

  const LocalizedHabitCard({
    super.key,
    required this.habitId,
    required this.habitName,
    required this.habitDescription,
    this.sourceLocale = 'en',
    this.icon,
    this.color,
    this.isCompleted = false,
    this.onTap,
    this.onComplete,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isRTL = ref.watch(isRTLProvider);
    final effectiveColor = color ?? Colors.blue;

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            textDirection: isRTL ? TextDirection.rtl : TextDirection.ltr,
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: effectiveColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  icon ?? Icons.check_circle_outline,
                  color: effectiveColor,
                  size: 28,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment:
                      isRTL ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                  children: [
                    DynamicLocalizedText(
                      contentId: '${habitId}_name',
                      contentType: LocalizableContentType.habitDescription,
                      sourceText: habitName,
                      sourceLocale: sourceLocale!,
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        decoration:
                            isCompleted ? TextDecoration.lineThrough : null,
                        color: isCompleted ? Colors.grey : null,
                      ),
                    ),
                    const SizedBox(height: 4),
                    DynamicLocalizedText(
                      contentId: '${habitId}_desc',
                      contentType: LocalizableContentType.habitDescription,
                      sourceText: habitDescription,
                      sourceLocale: sourceLocale!,
                      style: TextStyle(
                        color: Colors.grey[600],
                        fontSize: 14,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              if (onComplete != null)
                IconButton(
                  icon: Icon(
                    isCompleted
                        ? Icons.check_circle
                        : Icons.radio_button_unchecked,
                    color: isCompleted ? Colors.green : Colors.grey,
                    size: 32,
                  ),
                  onPressed: onComplete,
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Widget for displaying localized goal
class LocalizedGoalCard extends ConsumerWidget {
  final String goalId;
  final String goalTitle;
  final String goalDescription;
  final String? sourceLocale;
  final double progress;
  final Color? color;
  final VoidCallback? onTap;

  const LocalizedGoalCard({
    super.key,
    required this.goalId,
    required this.goalTitle,
    required this.goalDescription,
    this.sourceLocale = 'en',
    this.progress = 0,
    this.color,
    this.onTap,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isRTL = ref.watch(isRTLProvider);
    final effectiveColor = color ?? Colors.purple;

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment:
                isRTL ? CrossAxisAlignment.end : CrossAxisAlignment.start,
            children: [
              RTLRow(
                children: [
                  Icon(Icons.flag, color: effectiveColor),
                  const SizedBox(width: 8),
                  Expanded(
                    child: DynamicLocalizedText(
                      contentId: '${goalId}_title',
                      contentType: LocalizableContentType.goalDescription,
                      sourceText: goalTitle,
                      sourceLocale: sourceLocale!,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              DynamicLocalizedText(
                contentId: '${goalId}_desc',
                contentType: LocalizableContentType.goalDescription,
                sourceText: goalDescription,
                sourceLocale: sourceLocale!,
                style: TextStyle(
                  color: Colors.grey[600],
                  fontSize: 14,
                ),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 16),
              Row(
                textDirection: isRTL ? TextDirection.rtl : TextDirection.ltr,
                children: [
                  Expanded(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: LinearProgressIndicator(
                        value: progress,
                        backgroundColor: effectiveColor.withOpacity(0.1),
                        valueColor: AlwaysStoppedAnimation<Color>(effectiveColor),
                        minHeight: 8,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    '${(progress * 100).toInt()}%',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: effectiveColor,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
