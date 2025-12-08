import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';

/// A button with proper semantic labels for screen readers
class AccessibleButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final Widget child;
  final String semanticLabel;
  final String? semanticHint;
  final bool isEnabled;
  final ButtonStyle? style;

  const AccessibleButton({
    super.key,
    required this.onPressed,
    required this.child,
    required this.semanticLabel,
    this.semanticHint,
    this.isEnabled = true,
    this.style,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      enabled: isEnabled && onPressed != null,
      label: semanticLabel,
      hint: semanticHint,
      child: ElevatedButton(
        onPressed: isEnabled ? onPressed : null,
        style: style,
        child: ExcludeSemantics(child: child),
      ),
    );
  }
}

/// An icon button with proper semantic labels
class AccessibleIconButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final IconData icon;
  final String semanticLabel;
  final String? semanticHint;
  final Color? color;
  final double? size;
  final bool isEnabled;

  const AccessibleIconButton({
    super.key,
    required this.onPressed,
    required this.icon,
    required this.semanticLabel,
    this.semanticHint,
    this.color,
    this.size,
    this.isEnabled = true,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      enabled: isEnabled && onPressed != null,
      label: semanticLabel,
      hint: semanticHint,
      child: IconButton(
        onPressed: isEnabled ? onPressed : null,
        icon: Icon(icon, color: color, size: size),
        tooltip: semanticLabel,
      ),
    );
  }
}

/// A card with proper semantic grouping
class AccessibleCard extends StatelessWidget {
  final Widget child;
  final String? semanticLabel;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;

  const AccessibleCard({
    super.key,
    required this.child,
    this.semanticLabel,
    this.onTap,
    this.padding,
    this.margin,
  });

  @override
  Widget build(BuildContext context) {
    Widget card = Card(
      margin: margin,
      child: Padding(
        padding: padding ?? const EdgeInsets.all(16),
        child: child,
      ),
    );

    if (onTap != null) {
      card = InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: card,
      );
    }

    if (semanticLabel != null) {
      return Semantics(
        container: true,
        label: semanticLabel,
        child: card,
      );
    }

    return card;
  }
}

/// A text field with proper semantic labels
class AccessibleTextField extends StatelessWidget {
  final TextEditingController? controller;
  final String label;
  final String? hint;
  final String? semanticLabel;
  final String? errorText;
  final bool obscureText;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onChanged;
  final VoidCallback? onEditingComplete;
  final bool autofocus;
  final int? maxLines;
  final int? maxLength;
  final bool enabled;
  final Widget? prefixIcon;
  final Widget? suffixIcon;

  const AccessibleTextField({
    super.key,
    this.controller,
    required this.label,
    this.hint,
    this.semanticLabel,
    this.errorText,
    this.obscureText = false,
    this.keyboardType,
    this.textInputAction,
    this.onChanged,
    this.onEditingComplete,
    this.autofocus = false,
    this.maxLines = 1,
    this.maxLength,
    this.enabled = true,
    this.prefixIcon,
    this.suffixIcon,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      textField: true,
      label: semanticLabel ?? label,
      hint: hint,
      enabled: enabled,
      child: TextField(
        controller: controller,
        decoration: InputDecoration(
          labelText: label,
          hintText: hint,
          errorText: errorText,
          prefixIcon: prefixIcon,
          suffixIcon: suffixIcon,
        ),
        obscureText: obscureText,
        keyboardType: keyboardType,
        textInputAction: textInputAction,
        onChanged: onChanged,
        onEditingComplete: onEditingComplete,
        autofocus: autofocus,
        maxLines: maxLines,
        maxLength: maxLength,
        enabled: enabled,
      ),
    );
  }
}

/// A list tile with proper semantic information
class AccessibleListTile extends StatelessWidget {
  final Widget? leading;
  final Widget? title;
  final Widget? subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;
  final String semanticLabel;
  final String? semanticHint;
  final bool selected;
  final bool enabled;

  const AccessibleListTile({
    super.key,
    this.leading,
    this.title,
    this.subtitle,
    this.trailing,
    this.onTap,
    required this.semanticLabel,
    this.semanticHint,
    this.selected = false,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: onTap != null,
      enabled: enabled,
      selected: selected,
      label: semanticLabel,
      hint: semanticHint,
      child: ListTile(
        leading: leading,
        title: title,
        subtitle: subtitle,
        trailing: trailing,
        onTap: enabled ? onTap : null,
        selected: selected,
        enabled: enabled,
      ),
    );
  }
}

/// A switch with proper semantic labels
class AccessibleSwitch extends StatelessWidget {
  final bool value;
  final ValueChanged<bool>? onChanged;
  final String semanticLabel;
  final String? semanticHint;
  final bool enabled;

  const AccessibleSwitch({
    super.key,
    required this.value,
    required this.onChanged,
    required this.semanticLabel,
    this.semanticHint,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      toggled: value,
      label: semanticLabel,
      hint: semanticHint,
      enabled: enabled,
      child: Switch(
        value: value,
        onChanged: enabled ? onChanged : null,
      ),
    );
  }
}

/// A checkbox with proper semantic labels
class AccessibleCheckbox extends StatelessWidget {
  final bool value;
  final ValueChanged<bool?>? onChanged;
  final String semanticLabel;
  final String? semanticHint;
  final bool enabled;

  const AccessibleCheckbox({
    super.key,
    required this.value,
    required this.onChanged,
    required this.semanticLabel,
    this.semanticHint,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      checked: value,
      label: semanticLabel,
      hint: semanticHint,
      enabled: enabled,
      child: Checkbox(
        value: value,
        onChanged: enabled ? onChanged : null,
      ),
    );
  }
}

/// A slider with proper semantic labels
class AccessibleSlider extends StatelessWidget {
  final double value;
  final double min;
  final double max;
  final int? divisions;
  final ValueChanged<double>? onChanged;
  final String semanticLabel;
  final String Function(double)? semanticValueFormatter;
  final bool enabled;

  const AccessibleSlider({
    super.key,
    required this.value,
    this.min = 0.0,
    this.max = 1.0,
    this.divisions,
    required this.onChanged,
    required this.semanticLabel,
    this.semanticValueFormatter,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    final valueText =
        semanticValueFormatter?.call(value) ?? '${(value * 100).round()}%';

    return Semantics(
      slider: true,
      value: valueText,
      label: semanticLabel,
      enabled: enabled,
      increasedValue: value < max ? 'Increase' : null,
      decreasedValue: value > min ? 'Decrease' : null,
      child: Slider(
        value: value,
        min: min,
        max: max,
        divisions: divisions,
        onChanged: enabled ? onChanged : null,
      ),
    );
  }
}

/// A progress indicator with proper semantic labels
class AccessibleProgressIndicator extends StatelessWidget {
  final double? value;
  final String semanticLabel;
  final Color? color;
  final double strokeWidth;

  const AccessibleProgressIndicator({
    super.key,
    this.value,
    required this.semanticLabel,
    this.color,
    this.strokeWidth = 4.0,
  });

  @override
  Widget build(BuildContext context) {
    final progressText =
        value != null ? '${(value! * 100).round()}% complete' : 'Loading';

    return Semantics(
      label: '$semanticLabel, $progressText',
      child: CircularProgressIndicator(
        value: value,
        color: color,
        strokeWidth: strokeWidth,
      ),
    );
  }
}

/// A linear progress indicator with proper semantic labels
class AccessibleLinearProgress extends StatelessWidget {
  final double? value;
  final String semanticLabel;
  final Color? color;
  final Color? backgroundColor;

  const AccessibleLinearProgress({
    super.key,
    this.value,
    required this.semanticLabel,
    this.color,
    this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    final progressText =
        value != null ? '${(value! * 100).round()}% complete' : 'Loading';

    return Semantics(
      label: '$semanticLabel, $progressText',
      child: LinearProgressIndicator(
        value: value,
        color: color,
        backgroundColor: backgroundColor,
      ),
    );
  }
}

/// An image with proper semantic description
class AccessibleImage extends StatelessWidget {
  final ImageProvider image;
  final String semanticLabel;
  final double? width;
  final double? height;
  final BoxFit? fit;
  final bool excludeFromSemantics;

  const AccessibleImage({
    super.key,
    required this.image,
    required this.semanticLabel,
    this.width,
    this.height,
    this.fit,
    this.excludeFromSemantics = false,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      image: true,
      label: semanticLabel,
      excludeSemantics: excludeFromSemantics,
      child: Image(
        image: image,
        width: width,
        height: height,
        fit: fit,
        semanticLabel: excludeFromSemantics ? null : semanticLabel,
      ),
    );
  }
}

/// A heading for screen readers (announces as heading)
class AccessibleHeading extends StatelessWidget {
  final String text;
  final TextStyle? style;
  final int level; // 1-6 like HTML headings
  final TextAlign? textAlign;

  const AccessibleHeading({
    super.key,
    required this.text,
    this.style,
    this.level = 1,
    this.textAlign,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      header: true,
      child: Text(
        text,
        style: style ?? _getDefaultStyle(context),
        textAlign: textAlign,
      ),
    );
  }

  TextStyle _getDefaultStyle(BuildContext context) {
    final theme = Theme.of(context).textTheme;
    switch (level) {
      case 1:
        return theme.headlineLarge!;
      case 2:
        return theme.headlineMedium!;
      case 3:
        return theme.headlineSmall!;
      case 4:
        return theme.titleLarge!;
      case 5:
        return theme.titleMedium!;
      case 6:
      default:
        return theme.titleSmall!;
    }
  }
}

/// Extension methods for easier semantic annotations
extension SemanticWidgetExtensions on Widget {
  /// Wrap widget with semantic label
  Widget withSemanticLabel(String label, {String? hint}) {
    return Semantics(
      label: label,
      hint: hint,
      child: this,
    );
  }

  /// Mark as a button for screen readers
  Widget asSemanticButton(String label, {String? hint, bool enabled = true}) {
    return Semantics(
      button: true,
      enabled: enabled,
      label: label,
      hint: hint,
      child: this,
    );
  }

  /// Mark as a container/group for screen readers
  Widget asSemanticContainer(String label) {
    return Semantics(
      container: true,
      label: label,
      child: this,
    );
  }

  /// Exclude from semantics tree (decorative elements)
  Widget excludeFromSemantics() {
    return ExcludeSemantics(child: this);
  }

  /// Merge semantics with descendants
  Widget mergeSemantics() {
    return MergeSemantics(child: this);
  }
}

/// A focus-aware wrapper that announces focus changes
class FocusAnnouncer extends StatefulWidget {
  final Widget child;
  final String focusLabel;
  final String? blurLabel;

  const FocusAnnouncer({
    super.key,
    required this.child,
    required this.focusLabel,
    this.blurLabel,
  });

  @override
  State<FocusAnnouncer> createState() => _FocusAnnouncerState();
}

class _FocusAnnouncerState extends State<FocusAnnouncer> {
  final FocusNode _focusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    _focusNode.addListener(_onFocusChange);
  }

  @override
  void dispose() {
    _focusNode.removeListener(_onFocusChange);
    _focusNode.dispose();
    super.dispose();
  }

  void _onFocusChange() {
    if (_focusNode.hasFocus) {
      SemanticsService.announce(widget.focusLabel, TextDirection.ltr);
    } else if (widget.blurLabel != null) {
      SemanticsService.announce(widget.blurLabel!, TextDirection.ltr);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Focus(
      focusNode: _focusNode,
      child: widget.child,
    );
  }
}
