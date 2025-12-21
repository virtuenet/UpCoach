/// RTL Support
///
/// Utilities and widgets for Right-to-Left (RTL) language support.
/// Handles text direction, mirroring, and layout adjustments for RTL locales.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'locale_service.dart';
import 'i18n_provider.dart';

/// RTL-aware text widget
class RTLText extends ConsumerWidget {
  final String text;
  final TextStyle? style;
  final TextAlign? textAlign;
  final int? maxLines;
  final TextOverflow? overflow;

  const RTLText(
    this.text, {
    super.key,
    this.style,
    this.textAlign,
    this.maxLines,
    this.overflow,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isRTL = ref.watch(isRTLProvider);

    return Text(
      text,
      style: style,
      textAlign: textAlign ?? (isRTL ? TextAlign.right : TextAlign.left),
      maxLines: maxLines,
      overflow: overflow,
      textDirection: isRTL ? TextDirection.rtl : TextDirection.ltr,
    );
  }
}

/// RTL-aware directional container
class RTLContainer extends ConsumerWidget {
  final Widget child;
  final bool? forceDirection;

  const RTLContainer({
    super.key,
    required this.child,
    this.forceDirection,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isRTL = forceDirection ?? ref.watch(isRTLProvider);

    return Directionality(
      textDirection: isRTL ? TextDirection.rtl : TextDirection.ltr,
      child: child,
    );
  }
}

/// RTL-aware row that reverses children for RTL locales
class RTLRow extends ConsumerWidget {
  final List<Widget> children;
  final MainAxisAlignment mainAxisAlignment;
  final MainAxisSize mainAxisSize;
  final CrossAxisAlignment crossAxisAlignment;

  const RTLRow({
    super.key,
    required this.children,
    this.mainAxisAlignment = MainAxisAlignment.start,
    this.mainAxisSize = MainAxisSize.max,
    this.crossAxisAlignment = CrossAxisAlignment.center,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isRTL = ref.watch(isRTLProvider);
    final orderedChildren = isRTL ? children.reversed.toList() : children;

    return Row(
      mainAxisAlignment: mainAxisAlignment,
      mainAxisSize: mainAxisSize,
      crossAxisAlignment: crossAxisAlignment,
      textDirection: isRTL ? TextDirection.rtl : TextDirection.ltr,
      children: orderedChildren,
    );
  }
}

/// RTL-aware padding
class RTLPadding extends ConsumerWidget {
  final Widget child;
  final double? start;
  final double? end;
  final double? top;
  final double? bottom;

  const RTLPadding({
    super.key,
    required this.child,
    this.start,
    this.end,
    this.top,
    this.bottom,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isRTL = ref.watch(isRTLProvider);

    return Padding(
      padding: EdgeInsetsDirectional.only(
        start: start ?? 0,
        end: end ?? 0,
        top: top ?? 0,
        bottom: bottom ?? 0,
      ),
      child: Directionality(
        textDirection: isRTL ? TextDirection.rtl : TextDirection.ltr,
        child: child,
      ),
    );
  }
}

/// RTL-aware icon that flips for RTL locales
class RTLIcon extends ConsumerWidget {
  final IconData icon;
  final double? size;
  final Color? color;
  final bool shouldFlip;

  const RTLIcon(
    this.icon, {
    super.key,
    this.size,
    this.color,
    this.shouldFlip = true,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isRTL = ref.watch(isRTLProvider);

    Widget iconWidget = Icon(
      icon,
      size: size,
      color: color,
    );

    if (shouldFlip && isRTL) {
      iconWidget = Transform.scale(
        scaleX: -1,
        child: iconWidget,
      );
    }

    return iconWidget;
  }
}

/// Icons that should flip in RTL
class RTLFlipIcons {
  static const List<IconData> _flipIcons = [
    Icons.arrow_back,
    Icons.arrow_forward,
    Icons.chevron_left,
    Icons.chevron_right,
    Icons.arrow_back_ios,
    Icons.arrow_forward_ios,
    Icons.keyboard_arrow_left,
    Icons.keyboard_arrow_right,
    Icons.first_page,
    Icons.last_page,
    Icons.navigate_before,
    Icons.navigate_next,
    Icons.reply,
    Icons.forward,
    Icons.redo,
    Icons.undo,
    Icons.send,
    Icons.exit_to_app,
    Icons.login,
    Icons.logout,
  ];

  /// Check if an icon should flip in RTL
  static bool shouldFlip(IconData icon) {
    return _flipIcons.contains(icon);
  }
}

/// RTL-aware animated container
class RTLAnimatedContainer extends ConsumerWidget {
  final Widget child;
  final Duration duration;
  final AlignmentDirectional alignment;

  const RTLAnimatedContainer({
    super.key,
    required this.child,
    this.duration = const Duration(milliseconds: 200),
    this.alignment = AlignmentDirectional.centerStart,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isRTL = ref.watch(isRTLProvider);

    return Directionality(
      textDirection: isRTL ? TextDirection.rtl : TextDirection.ltr,
      child: AnimatedContainer(
        duration: duration,
        alignment: alignment,
        child: child,
      ),
    );
  }
}

/// RTL-aware positioned widget
class RTLPositioned extends ConsumerWidget {
  final Widget child;
  final double? start;
  final double? end;
  final double? top;
  final double? bottom;
  final double? width;
  final double? height;

  const RTLPositioned({
    super.key,
    required this.child,
    this.start,
    this.end,
    this.top,
    this.bottom,
    this.width,
    this.height,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isRTL = ref.watch(isRTLProvider);

    return Positioned.directional(
      textDirection: isRTL ? TextDirection.rtl : TextDirection.ltr,
      start: start,
      end: end,
      top: top,
      bottom: bottom,
      width: width,
      height: height,
      child: child,
    );
  }
}

/// RTL-aware list tile
class RTLListTile extends ConsumerWidget {
  final Widget? leading;
  final Widget? title;
  final Widget? subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;
  final bool enabled;
  final EdgeInsetsGeometry? contentPadding;

  const RTLListTile({
    super.key,
    this.leading,
    this.title,
    this.subtitle,
    this.trailing,
    this.onTap,
    this.enabled = true,
    this.contentPadding,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isRTL = ref.watch(isRTLProvider);

    return Directionality(
      textDirection: isRTL ? TextDirection.rtl : TextDirection.ltr,
      child: ListTile(
        leading: leading,
        title: title,
        subtitle: subtitle,
        trailing: trailing,
        onTap: onTap,
        enabled: enabled,
        contentPadding: contentPadding,
      ),
    );
  }
}

/// Extension methods for RTL support
extension RTLExtensions on BuildContext {
  /// Check if current context is RTL
  bool get isRTL => Directionality.of(this) == TextDirection.rtl;

  /// Get text direction
  TextDirection get textDirection => Directionality.of(this);

  /// Get start alignment based on direction
  Alignment get startAlignment => isRTL ? Alignment.centerRight : Alignment.centerLeft;

  /// Get end alignment based on direction
  Alignment get endAlignment => isRTL ? Alignment.centerLeft : Alignment.centerRight;
}

/// Extension for EdgeInsets to convert to directional
extension EdgeInsetsRTL on EdgeInsets {
  /// Convert to EdgeInsetsDirectional
  EdgeInsetsDirectional toDirectional(bool isRTL) {
    return EdgeInsetsDirectional.only(
      start: isRTL ? right : left,
      end: isRTL ? left : right,
      top: top,
      bottom: bottom,
    );
  }
}

/// RTL-aware gradient
class RTLGradient extends ConsumerWidget {
  final Widget child;
  final List<Color> colors;
  final List<double>? stops;

  const RTLGradient({
    super.key,
    required this.child,
    required this.colors,
    this.stops,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isRTL = ref.watch(isRTLProvider);
    final orderedColors = isRTL ? colors.reversed.toList() : colors;
    final orderedStops = stops != null && isRTL
        ? stops!.map((s) => 1.0 - s).toList().reversed.toList()
        : stops;

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: orderedColors,
          stops: orderedStops,
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
      ),
      child: child,
    );
  }
}

/// RTL-aware drawer
class RTLDrawer extends ConsumerWidget {
  final Widget child;
  final double? width;
  final Color? backgroundColor;

  const RTLDrawer({
    super.key,
    required this.child,
    this.width,
    this.backgroundColor,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isRTL = ref.watch(isRTLProvider);

    return Directionality(
      textDirection: isRTL ? TextDirection.rtl : TextDirection.ltr,
      child: Drawer(
        width: width,
        backgroundColor: backgroundColor,
        child: child,
      ),
    );
  }
}

/// RTL-aware input decoration
InputDecoration createRTLInputDecoration({
  required BuildContext context,
  String? labelText,
  String? hintText,
  Widget? prefixIcon,
  Widget? suffixIcon,
  String? errorText,
  bool isRTL = false,
}) {
  return InputDecoration(
    labelText: labelText,
    hintText: hintText,
    prefixIcon: isRTL ? suffixIcon : prefixIcon,
    suffixIcon: isRTL ? prefixIcon : suffixIcon,
    errorText: errorText,
    alignLabelWithHint: true,
  );
}

/// RTL-aware button bar
class RTLButtonBar extends ConsumerWidget {
  final List<Widget> children;
  final MainAxisAlignment alignment;

  const RTLButtonBar({
    super.key,
    required this.children,
    this.alignment = MainAxisAlignment.end,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isRTL = ref.watch(isRTLProvider);

    return Directionality(
      textDirection: isRTL ? TextDirection.rtl : TextDirection.ltr,
      child: Row(
        mainAxisAlignment: alignment,
        children: children,
      ),
    );
  }
}

/// RTL text alignment helper
TextAlign getRTLTextAlign(bool isRTL, {TextAlign defaultAlign = TextAlign.start}) {
  if (defaultAlign == TextAlign.start) {
    return isRTL ? TextAlign.right : TextAlign.left;
  } else if (defaultAlign == TextAlign.end) {
    return isRTL ? TextAlign.left : TextAlign.right;
  }
  return defaultAlign;
}

/// RTL crossaxis alignment helper
CrossAxisAlignment getRTLCrossAxisAlignment(bool isRTL, {CrossAxisAlignment defaultAlign = CrossAxisAlignment.start}) {
  if (defaultAlign == CrossAxisAlignment.start) {
    return isRTL ? CrossAxisAlignment.end : CrossAxisAlignment.start;
  } else if (defaultAlign == CrossAxisAlignment.end) {
    return isRTL ? CrossAxisAlignment.start : CrossAxisAlignment.end;
  }
  return defaultAlign;
}
