import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/accessibility/accessibility_service.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/constants/ui_constants.dart';

class AccessibilitySettingsScreen extends ConsumerWidget {
  const AccessibilitySettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final a11yState = ref.watch(accessibilityProvider);
    final a11yNotifier = ref.read(accessibilityProvider.notifier);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Accessibility'),
        actions: [
          TextButton(
            onPressed: () => _showResetDialog(context, a11yNotifier),
            child: const Text('Reset'),
          ),
        ],
      ),
      body: ListView(
        children: [
          _buildSectionHeader(context, 'Vision'),

          // Large Text
          Semantics(
            toggled: a11yState.largeText,
            label:
                'Large text, ${a11yState.largeText ? "enabled" : "disabled"}',
            hint: 'Double tap to toggle larger text size',
            child: SwitchListTile(
              title: const Text('Larger Text'),
              subtitle: const Text('Increase text size throughout the app'),
              value: a11yState.largeText,
              onChanged: a11yNotifier.setLargeText,
              secondary: const Icon(Icons.text_fields),
            ),
          ),

          // Bold Text
          Semantics(
            toggled: a11yState.boldText,
            label: 'Bold text, ${a11yState.boldText ? "enabled" : "disabled"}',
            hint: 'Double tap to toggle bold text',
            child: SwitchListTile(
              title: const Text('Bold Text'),
              subtitle: const Text('Make text easier to read'),
              value: a11yState.boldText,
              onChanged: a11yNotifier.setBoldText,
              secondary: const Icon(Icons.format_bold),
            ),
          ),

          // High Contrast
          Semantics(
            toggled: a11yState.highContrast,
            label:
                'High contrast, ${a11yState.highContrast ? "enabled" : "disabled"}',
            hint: 'Double tap to toggle high contrast mode',
            child: SwitchListTile(
              title: const Text('High Contrast'),
              subtitle:
                  const Text('Increase color contrast for better visibility'),
              value: a11yState.highContrast,
              onChanged: a11yNotifier.setHighContrast,
              secondary: const Icon(Icons.contrast),
            ),
          ),

          // Reduce Transparency
          Semantics(
            toggled: a11yState.reduceTransparency,
            label:
                'Reduce transparency, ${a11yState.reduceTransparency ? "enabled" : "disabled"}',
            hint: 'Double tap to toggle reduced transparency',
            child: SwitchListTile(
              title: const Text('Reduce Transparency'),
              subtitle: const Text('Make backgrounds more opaque'),
              value: a11yState.reduceTransparency,
              onChanged: a11yNotifier.setReduceTransparency,
              secondary: const Icon(Icons.opacity),
            ),
          ),

          // Text Scale Slider
          _buildTextScaleSection(context, a11yState, a11yNotifier),

          const Divider(),

          _buildSectionHeader(context, 'Motion'),

          // Reduce Motion
          Semantics(
            toggled: a11yState.reduceMotion,
            label:
                'Reduce motion, ${a11yState.reduceMotion ? "enabled" : "disabled"}',
            hint: 'Double tap to toggle reduced animations',
            child: SwitchListTile(
              title: const Text('Reduce Motion'),
              subtitle: const Text('Minimize animations and motion effects'),
              value: a11yState.reduceMotion,
              onChanged: a11yNotifier.setReduceMotion,
              secondary: const Icon(Icons.animation),
            ),
          ),

          const Divider(),

          _buildSectionHeader(context, 'Screen Reader'),

          // Screen Reader Info
          ListTile(
            leading: const Icon(Icons.record_voice_over),
            title: const Text('Screen Reader'),
            subtitle: Text(
              a11yState.screenReaderEnabled
                  ? 'VoiceOver/TalkBack is active'
                  : 'Enable in system settings',
            ),
            trailing: Icon(
              a11yState.screenReaderEnabled
                  ? Icons.check_circle
                  : Icons.info_outline,
              color: a11yState.screenReaderEnabled
                  ? AppTheme.successColor
                  : AppTheme.textSecondary,
            ),
          ),

          const Divider(),

          _buildSectionHeader(context, 'Accessibility Shortcuts'),

          ListTile(
            leading: const Icon(Icons.keyboard),
            title: const Text('Keyboard Shortcuts'),
            subtitle: const Text('View available keyboard shortcuts'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _showKeyboardShortcuts(context),
          ),

          const SizedBox(height: UIConstants.spacingXL),

          // Info section
          Padding(
            padding: const EdgeInsets.all(UIConstants.spacingMD),
            child: Container(
              padding: const EdgeInsets.all(UIConstants.spacingMD),
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(UIConstants.radiusMD),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.info_outline,
                        color: AppTheme.primaryColor,
                        size: 20,
                      ),
                      const SizedBox(width: UIConstants.spacingSM),
                      Text(
                        'System Accessibility',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: AppTheme.primaryColor,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: UIConstants.spacingSM),
                  const Text(
                    'For additional accessibility features like screen readers, '
                    'switch control, and voice control, please enable them in '
                    'your device\'s system settings.',
                    style: TextStyle(fontSize: 14),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: UIConstants.spacingXL),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title) {
    return Semantics(
      header: true,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
        child: Text(
          title,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: AppTheme.textSecondary,
          ),
        ),
      ),
    );
  }

  Widget _buildTextScaleSection(
    BuildContext context,
    AccessibilityState state,
    AccessibilityNotifier notifier,
  ) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.format_size, color: AppTheme.textSecondary),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Text Size',
                      style: TextStyle(fontSize: 16),
                    ),
                    Text(
                      '${(state.textScaleFactor * 100).round()}%',
                      style: const TextStyle(
                        fontSize: 14,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Semantics(
            slider: true,
            value: '${(state.textScaleFactor * 100).round()}%',
            label: 'Text size',
            hint: 'Adjust text size',
            child: Slider(
              value: state.textScaleFactor,
              min: 0.8,
              max: 2.0,
              divisions: 12,
              label: '${(state.textScaleFactor * 100).round()}%',
              onChanged: notifier.setTextScaleFactor,
            ),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'A',
                style: TextStyle(
                  fontSize: 12,
                  color: AppTheme.textSecondary,
                ),
              ),
              Text(
                'A',
                style: TextStyle(
                  fontSize: 24,
                  color: AppTheme.textSecondary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Preview text
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.grey.shade300),
            ),
            child: Text(
              'Preview: This is how text will appear throughout the app.',
              style: TextStyle(
                fontSize: 14 * state.effectiveTextScale,
                fontWeight:
                    state.boldText ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showResetDialog(BuildContext context, AccessibilityNotifier notifier) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reset Accessibility Settings'),
        content: const Text(
          'This will reset all accessibility settings to their defaults. '
          'System settings will not be affected.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              notifier.resetToDefaults();
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Accessibility settings reset to defaults'),
                ),
              );
            },
            child: const Text('Reset'),
          ),
        ],
      ),
    );
  }

  void _showKeyboardShortcuts(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Keyboard Shortcuts'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildShortcutItem('Tab', 'Move to next element'),
              _buildShortcutItem('Shift + Tab', 'Move to previous element'),
              _buildShortcutItem('Enter/Space', 'Activate button'),
              _buildShortcutItem('Escape', 'Close dialog/modal'),
              _buildShortcutItem('Arrow Keys', 'Navigate lists'),
              const Divider(),
              const Text(
                'Screen Reader Gestures',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              _buildShortcutItem('Swipe Right', 'Next element'),
              _buildShortcutItem('Swipe Left', 'Previous element'),
              _buildShortcutItem('Double Tap', 'Activate element'),
              _buildShortcutItem('Three Finger Swipe', 'Scroll'),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  Widget _buildShortcutItem(String shortcut, String description) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.grey.shade200,
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              shortcut,
              style: const TextStyle(
                fontFamily: 'monospace',
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              description,
              style: const TextStyle(fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }
}
