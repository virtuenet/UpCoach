# Accessibility Testing Checklist

## Overview

This document provides a comprehensive accessibility testing checklist for the UpCoach CMS platform, ensuring WCAG 2.1 AA compliance across all interfaces. The checklist covers automated testing tools, manual testing procedures, and platform-specific accessibility requirements.

## WCAG 2.1 AA Compliance Framework

### 1. Perceivable (Guideline 1)

#### 1.1 Text Alternatives
```yaml
Requirements:
  - All images have appropriate alt text
  - Decorative images have empty alt attributes
  - Complex images have detailed descriptions
  - Icons have accessible names or are hidden from screen readers

Automated Tests:
  - axe-core: image-alt rule
  - Pa11y: missing alt text detection
  - Lighthouse: accessibility audit

Manual Tests:
  - Screen reader testing with images
  - Alt text quality assessment
  - Context appropriateness verification
```

#### 1.2 Time-based Media
```yaml
Requirements:
  - Videos have captions
  - Audio content has transcripts
  - Video descriptions for visual content
  - Media controls are accessible

Testing Checklist:
  ✓ Video player controls are keyboard accessible
  ✓ Captions are accurate and synchronized
  ✓ Transcript content matches audio
  ✓ Auto-play is avoided or controllable
```

#### 1.3 Adaptable Content
```yaml
Requirements:
  - Content order is logical without CSS
  - Information is not conveyed by color alone
  - Layout adapts to different screen sizes
  - Content can be presented in different ways

Automated Tests:
  - CSS disabled testing
  - Mobile responsiveness checks
  - Color contrast validation
  - Semantic structure validation
```

#### 1.4 Distinguishable
```yaml
Color Contrast Requirements:
  - Normal text: 4.5:1 minimum ratio
  - Large text (18pt+): 3:1 minimum ratio
  - UI components: 3:1 minimum ratio
  - Graphical objects: 3:1 minimum ratio

Audio Requirements:
  - Background audio is 20dB lower than foreground
  - Audio can be paused or volume controlled
  - No audio plays automatically for more than 3 seconds

Visual Requirements:
  - Text can be resized to 200% without horizontal scrolling
  - Images of text are avoided
  - Focus indicators are visible
```

### 2. Operable (Guideline 2)

#### 2.1 Keyboard Accessible
```yaml
Keyboard Navigation Requirements:
  - All functionality available via keyboard
  - No keyboard traps
  - Tab order is logical
  - Keyboard shortcuts don't conflict

Testing Checklist:
  ✓ Tab through entire interface
  ✓ Use only keyboard for all tasks
  ✓ Test Shift+Tab reverse navigation
  ✓ Test arrow keys for grouped controls
  ✓ Verify escape key functionality
  ✓ Test Enter and Space key actions
```

#### 2.2 Enough Time
```yaml
Timing Requirements:
  - Users can extend time limits
  - Users can pause moving content
  - Time limits have warnings
  - Sessions don't expire without warning

Testing Checklist:
  ✓ Session timeout warnings appear
  ✓ Timeout extensions are possible
  ✓ Auto-refresh can be disabled
  ✓ Moving content can be paused
```

#### 2.3 Seizures and Physical Reactions
```yaml
Requirements:
  - No content flashes more than 3 times per second
  - Motion can be disabled
  - Parallax effects can be reduced

Testing Checklist:
  ✓ Check for flashing content
  ✓ Verify motion controls
  ✓ Test with reduced motion preference
```

#### 2.4 Navigable
```yaml
Navigation Requirements:
  - Page titles are descriptive
  - Focus order is logical
  - Link purposes are clear
  - Multiple navigation methods exist
  - Headings are descriptive

Testing Checklist:
  ✓ Every page has unique, descriptive title
  ✓ Skip links are provided
  ✓ Breadcrumbs are present where appropriate
  ✓ Search functionality is available
  ✓ Sitemap is accessible
```

#### 2.5 Input Modalities
```yaml
Requirements:
  - All functionality works with various input methods
  - Path-based gestures have alternatives
  - Click targets are at least 44x44 pixels
  - Accidental activation is prevented

Mobile Testing Checklist:
  ✓ Touch targets meet minimum size
  ✓ Gestures have alternative methods
  ✓ Device orientation changes work
  ✓ Voice input is supported where appropriate
```

### 3. Understandable (Guideline 3)

#### 3.1 Readable
```yaml
Language Requirements:
  - Page language is identified
  - Language changes are marked
  - Content uses clear language

Testing Checklist:
  ✓ HTML lang attribute is set
  ✓ Language changes are marked with lang
  ✓ Reading level is appropriate
  ✓ Technical terms are defined
```

#### 3.2 Predictable
```yaml
Consistency Requirements:
  - Navigation is consistent
  - Functionality is consistent
  - Changes are predictable

Testing Checklist:
  ✓ Navigation appears in same location
  ✓ Components behave consistently
  ✓ Context changes are user-initiated
  ✓ Forms provide clear instructions
```

#### 3.3 Input Assistance
```yaml
Error Handling Requirements:
  - Errors are identified and described
  - Labels and instructions are provided
  - Error prevention is implemented
  - Help is available

Testing Checklist:
  ✓ Form validation messages are clear
  ✓ Required fields are identified
  ✓ Input format is explained
  ✓ Error suggestions are provided
```

### 4. Robust (Guideline 4)

#### 4.1 Compatible
```yaml
Compatibility Requirements:
  - Valid HTML markup
  - Proper ARIA usage
  - Assistive technology compatibility

Testing Checklist:
  ✓ HTML validates without errors
  ✓ ARIA attributes are used correctly
  ✓ Custom components have proper roles
  ✓ Status messages are announced
```

## Automated Accessibility Testing Framework

### 1. axe-core Integration
```typescript
// packages/test-utils/src/accessibility/axe-config.ts
import { configureAxe } from 'jest-axe';

export const axeConfig = configureAxe({
  rules: {
    // Color and contrast
    'color-contrast': { enabled: true },
    'color-contrast-enhanced': { enabled: true },

    // Keyboard navigation
    'keyboard-navigation': { enabled: true },
    'focus-order-semantics': { enabled: true },

    // ARIA and semantics
    'aria-allowed-attr': { enabled: true },
    'aria-required-attr': { enabled: true },
    'aria-valid-attr': { enabled: true },
    'aria-valid-attr-value': { enabled: true },
    'button-name': { enabled: true },
    'image-alt': { enabled: true },
    'label': { enabled: true },

    // Document structure
    'document-title': { enabled: true },
    'html-has-lang': { enabled: true },
    'landmark-one-main': { enabled: true },
    'page-has-heading-one': { enabled: true },

    // Form accessibility
    'form-field-multiple-labels': { enabled: true },
    'input-button-name': { enabled: true },
    'select-name': { enabled: true },

    // Custom rules for CMS
    'cms-editor-accessible': {
      enabled: true,
      tags: ['custom', 'cms']
    },
    'rich-text-accessible': {
      enabled: true,
      tags: ['custom', 'editor']
    }
  },
  tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
});

// Enhanced accessibility testing utility
export async function testAccessibility(
  element: HTMLElement | ReactWrapper,
  options: {
    rules?: object;
    tags?: string[];
    exclude?: string[];
  } = {}
): Promise<void> {
  const results = await axeConfig(element, {
    rules: options.rules,
    tags: options.tags || ['wcag2a', 'wcag2aa'],
    exclude: options.exclude
  });

  expect(results).toHaveNoViolations();

  // Additional custom validations
  await validateCustomAccessibilityRules(element);
}

async function validateCustomAccessibilityRules(element: HTMLElement | ReactWrapper): Promise<void> {
  // Check for proper heading hierarchy
  const headings = Array.from(element.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  validateHeadingHierarchy(headings);

  // Check for proper landmark usage
  const landmarks = Array.from(element.querySelectorAll('[role], main, nav, aside, header, footer'));
  validateLandmarkUsage(landmarks);

  // Check for proper form structure
  const forms = Array.from(element.querySelectorAll('form'));
  forms.forEach(validateFormAccessibility);
}
```

### 2. Component-Level Accessibility Tests
```typescript
// apps/cms-panel/src/components/ContentEditor/ContentEditor.a11y.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { testAccessibility } from '@upcoach/test-utils';
import { ContentEditor } from './ContentEditor';

describe('ContentEditor Accessibility', () => {
  test('should meet WCAG 2.1 AA standards', async () => {
    const { container } = render(<ContentEditor />);
    await testAccessibility(container);
  });

  test('should support keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<ContentEditor />);

    // Test tab order
    await user.tab();
    expect(screen.getByLabelText(/title/i)).toHaveFocus();

    await user.tab();
    expect(screen.getByLabelText(/content/i)).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: /save/i })).toHaveFocus();

    // Test rich text editor keyboard shortcuts
    const contentArea = screen.getByLabelText(/content/i);
    await user.click(contentArea);

    // Test bold shortcut
    await user.keyboard('{Control>}b{/Control}');
    // Verify bold formatting is applied and announced

    // Test heading shortcut
    await user.keyboard('{Control>}{Alt>}1{/Alt}{/Control}');
    // Verify heading is applied and announced
  });

  test('should provide proper ARIA labels and descriptions', () => {
    render(<ContentEditor />);

    // Check form labels
    expect(screen.getByLabelText(/article title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/article content/i)).toBeInTheDocument();

    // Check button labels
    expect(screen.getByRole('button', { name: /save draft/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /publish article/i })).toBeInTheDocument();

    // Check status announcements
    const statusRegion = screen.getByRole('status');
    expect(statusRegion).toHaveAttribute('aria-live', 'polite');
  });

  test('should handle error states accessibly', async () => {
    const user = userEvent.setup();
    render(<ContentEditor />);

    // Trigger validation error
    const publishButton = screen.getByRole('button', { name: /publish/i });
    await user.click(publishButton);

    // Check error announcement
    const errorMessage = await screen.findByRole('alert');
    expect(errorMessage).toHaveTextContent(/title is required/i);
    expect(errorMessage).toHaveAttribute('aria-live', 'assertive');

    // Check focus management
    const titleInput = screen.getByLabelText(/title/i);
    expect(titleInput).toHaveFocus();
    expect(titleInput).toHaveAttribute('aria-invalid', 'true');
    expect(titleInput).toHaveAttribute('aria-describedby');
  });

  test('should support screen reader announcements', async () => {
    const user = userEvent.setup();
    const announcements = [];

    // Mock screen reader announcements
    const mockAnnounce = jest.fn((message) => announcements.push(message));
    global.speechSynthesis = { speak: mockAnnounce };

    render(<ContentEditor />);

    // Test save action announcement
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(announcements).toContain('Article saved successfully');
    });

    // Test publish action announcement
    const publishButton = screen.getByRole('button', { name: /publish/i });
    await user.click(publishButton);

    await waitFor(() => {
      expect(announcements).toContain('Article published successfully');
    });
  });
});
```

### 3. End-to-End Accessibility Testing
```typescript
// tests/e2e/specs/accessibility/cms-accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('CMS Panel Accessibility', () => {
  test('should pass axe accessibility tests on all pages', async ({ page }) => {
    const pages = [
      '/cms/login',
      '/cms/dashboard',
      '/cms/content',
      '/cms/content/new',
      '/cms/users',
      '/cms/settings'
    ];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    }
  });

  test('should support complete keyboard navigation workflow', async ({ page }) => {
    await page.goto('/cms/content/new');

    // Navigate using only keyboard
    await page.keyboard.press('Tab'); // Skip link
    await page.keyboard.press('Enter'); // Activate skip link

    // Should focus on main content
    const mainContent = page.locator('main');
    await expect(mainContent).toBeFocused();

    // Navigate through form
    await page.keyboard.press('Tab'); // Title field
    await page.keyboard.type('Test Article Title');

    await page.keyboard.press('Tab'); // Content field
    await page.keyboard.type('Test article content');

    await page.keyboard.press('Tab'); // Category dropdown
    await page.keyboard.press('ArrowDown'); // Select category
    await page.keyboard.press('Enter');

    await page.keyboard.press('Tab'); // Tags field
    await page.keyboard.type('test, accessibility');

    await page.keyboard.press('Tab'); // Save button
    await page.keyboard.press('Enter'); // Save article

    // Verify success message is announced
    const successMessage = page.locator('[role="alert"]');
    await expect(successMessage).toBeVisible();
    await expect(successMessage).toContainText('Article saved successfully');
  });

  test('should provide proper focus management', async ({ page }) => {
    await page.goto('/cms/content');

    // Open article editor
    await page.click('text=New Article');

    // Focus should be on first form field
    const titleField = page.locator('input[name="title"]');
    await expect(titleField).toBeFocused();

    // Open modal dialog
    await page.click('text=Insert Image');

    // Focus should move to modal
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    const modalCloseButton = modal.locator('button[aria-label="Close"]');
    await expect(modalCloseButton).toBeFocused();

    // Close modal with Escape
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();

    // Focus should return to trigger button
    const insertImageButton = page.locator('text=Insert Image');
    await expect(insertImageButton).toBeFocused();
  });

  test('should handle screen reader announcements', async ({ page }) => {
    // Enable screen reader simulation
    await page.addInitScript(() => {
      window.screenReaderAnnouncements = [];
      const originalSpeak = window.speechSynthesis.speak;
      window.speechSynthesis.speak = function(utterance) {
        window.screenReaderAnnouncements.push(utterance.text);
        return originalSpeak.call(this, utterance);
      };
    });

    await page.goto('/cms/content/new');

    // Fill form and save
    await page.fill('input[name="title"]', 'Accessibility Test Article');
    await page.fill('textarea[name="content"]', 'Content for testing');
    await page.click('button:has-text("Save Draft")');

    // Check announcements
    const announcements = await page.evaluate(() => window.screenReaderAnnouncements);
    expect(announcements).toContain('Article saved as draft');
  });

  test('should support high contrast mode', async ({ page }) => {
    // Simulate high contrast mode
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.addStyleTag({
      content: `
        @media (prefers-contrast: high) {
          * {
            background: black !important;
            color: white !important;
            border: 1px solid white !important;
          }
        }
      `
    });

    await page.goto('/cms/dashboard');

    // Verify elements are still visible and functional
    const navigationLinks = page.locator('nav a');
    await expect(navigationLinks.first()).toBeVisible();

    const contentCards = page.locator('[data-testid="content-card"]');
    await expect(contentCards.first()).toBeVisible();

    // Test interaction in high contrast mode
    await page.click('text=New Article');
    await expect(page.locator('h1:has-text("Create New Article")')).toBeVisible();
  });
});
```

## Platform-Specific Accessibility Requirements

### 1. Web Applications (CMS & Admin Panels)

#### React Component Accessibility Patterns
```typescript
// packages/ui/src/components/AccessibleForm/AccessibleForm.tsx
import React, { useId } from 'react';

interface AccessibleFormProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  onSubmit: (data: FormData) => void;
}

export const AccessibleForm: React.FC<AccessibleFormProps> = ({
  title,
  description,
  children,
  onSubmit
}) => {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <form
      onSubmit={onSubmit}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      noValidate // Handle validation ourselves for better accessibility
    >
      <h2 id={titleId}>{title}</h2>
      {description && (
        <p id={descriptionId} className="form-description">
          {description}
        </p>
      )}

      <fieldset>
        <legend className="sr-only">{title} form fields</legend>
        {children}
      </fieldset>
    </form>
  );
};

// packages/ui/src/components/AccessibleFormField/AccessibleFormField.tsx
interface AccessibleFormFieldProps {
  label: string;
  error?: string;
  help?: string;
  required?: boolean;
  children: React.ReactElement;
}

export const AccessibleFormField: React.FC<AccessibleFormFieldProps> = ({
  label,
  error,
  help,
  required,
  children
}) => {
  const fieldId = useId();
  const errorId = useId();
  const helpId = useId();

  const childWithProps = React.cloneElement(children, {
    id: fieldId,
    'aria-required': required,
    'aria-invalid': !!error,
    'aria-describedby': [
      error ? errorId : null,
      help ? helpId : null
    ].filter(Boolean).join(' ') || undefined
  });

  return (
    <div className="form-field">
      <label htmlFor={fieldId} className="form-label">
        {label}
        {required && <span aria-label="required">*</span>}
      </label>

      {childWithProps}

      {help && (
        <div id={helpId} className="form-help">
          {help}
        </div>
      )}

      {error && (
        <div id={errorId} className="form-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};
```

#### Rich Text Editor Accessibility
```typescript
// apps/cms-panel/src/components/RichTextEditor/AccessibleRichTextEditor.tsx
import { Editor } from '@tiptap/react';
import { useCallback, useRef } from 'react';

export const AccessibleRichTextEditor: React.FC<{
  content: string;
  onChange: (content: string) => void;
  label: string;
}> = ({ content, onChange, label }) => {
  const editorRef = useRef<Editor>(null);

  const handleKeyboardShortcut = useCallback((event: KeyboardEvent) => {
    if (!editorRef.current) return;

    // Announce formatting changes to screen readers
    const announceFormatting = (format: string) => {
      const announcement = `${format} formatting applied`;
      // Create temporary element for screen reader announcement
      const announcer = document.createElement('div');
      announcer.setAttribute('aria-live', 'assertive');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      announcer.textContent = announcement;
      document.body.appendChild(announcer);
      setTimeout(() => document.body.removeChild(announcer), 1000);
    };

    if (event.ctrlKey || event.metaKey) {
      switch (event.key.toLowerCase()) {
        case 'b':
          event.preventDefault();
          editorRef.current.chain().focus().toggleBold().run();
          announceFormatting('Bold');
          break;
        case 'i':
          event.preventDefault();
          editorRef.current.chain().focus().toggleItalic().run();
          announceFormatting('Italic');
          break;
        case '1':
          if (event.altKey) {
            event.preventDefault();
            editorRef.current.chain().focus().toggleHeading({ level: 1 }).run();
            announceFormatting('Heading 1');
          }
          break;
      }
    }
  }, []);

  return (
    <div className="rich-text-editor">
      <div className="editor-toolbar" role="toolbar" aria-label="Text formatting">
        <button
          type="button"
          aria-label="Bold"
          aria-pressed={editorRef.current?.isActive('bold')}
          onClick={() => {
            editorRef.current?.chain().focus().toggleBold().run();
          }}
        >
          <strong>B</strong>
        </button>
        {/* Additional toolbar buttons */}
      </div>

      <div
        className="editor-content"
        role="textbox"
        aria-multiline="true"
        aria-label={label}
        onKeyDown={handleKeyboardShortcut}
      >
        <Editor
          ref={editorRef}
          content={content}
          onUpdate={({ editor }) => onChange(editor.getHTML())}
          editorProps={{
            attributes: {
              'aria-label': label,
              'role': 'textbox',
              'aria-multiline': 'true'
            }
          }}
        />
      </div>
    </div>
  );
};
```

### 2. Mobile Application Accessibility

#### Flutter Accessibility Implementation
```dart
// mobile-app/lib/widgets/accessible_content_card.dart
import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';

class AccessibleContentCard extends StatelessWidget {
  final String title;
  final String content;
  final String? imageUrl;
  final VoidCallback? onTap;
  final bool isRead;

  const AccessibleContentCard({
    Key? key,
    required this.title,
    required this.content,
    this.imageUrl,
    this.onTap,
    this.isRead = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: onTap != null,
      enabled: onTap != null,
      label: _buildSemanticLabel(),
      hint: 'Double tap to read article',
      child: Card(
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (imageUrl != null)
                  Semantics(
                    image: true,
                    label: 'Article image for $title',
                    child: Image.network(
                      imageUrl!,
                      excludeFromSemantics: false,
                    ),
                  ),
                Semantics(
                  header: true,
                  child: Text(
                    title,
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                ),
                const SizedBox(height: 8),
                Semantics(
                  readOnly: true,
                  child: Text(
                    content,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (isRead)
                  Semantics(
                    label: 'Read article',
                    child: const Icon(
                      Icons.check_circle,
                      color: Colors.green,
                      semanticLabel: 'Article completed',
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _buildSemanticLabel() {
    final buffer = StringBuffer();
    buffer.write('Article: $title. ');
    buffer.write('Preview: ${content.substring(0, 100)}...');
    if (isRead) {
      buffer.write(' This article has been read.');
    }
    return buffer.toString();
  }
}
```

#### Voice Input Accessibility
```dart
// mobile-app/lib/features/ai/widgets/accessible_voice_input.dart
class AccessibleVoiceInput extends StatefulWidget {
  final Function(String) onTranscription;
  final VoidCallback? onError;

  const AccessibleVoiceInput({
    Key? key,
    required this.onTranscription,
    this.onError,
  }) : super(key: key);

  @override
  State<AccessibleVoiceInput> createState() => _AccessibleVoiceInputState();
}

class _AccessibleVoiceInputState extends State<AccessibleVoiceInput> {
  bool _isListening = false;
  String _currentTranscription = '';

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Semantics(
          button: true,
          enabled: true,
          label: _isListening
            ? 'Stop recording voice input'
            : 'Start recording voice input',
          hint: _isListening
            ? 'Tap to stop recording'
            : 'Tap to start voice input',
          child: FloatingActionButton(
            onPressed: _toggleListening,
            backgroundColor: _isListening ? Colors.red : Colors.blue,
            child: Icon(
              _isListening ? Icons.stop : Icons.mic,
              semanticLabel: _isListening ? 'Stop recording' : 'Start recording',
            ),
          ),
        ),
        const SizedBox(height: 16),
        if (_currentTranscription.isNotEmpty)
          Semantics(
            liveRegion: true,
            label: 'Voice transcription: $_currentTranscription',
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                _currentTranscription,
                style: Theme.of(context).textTheme.bodyLarge,
              ),
            ),
          ),
      ],
    );
  }

  void _toggleListening() {
    setState(() {
      _isListening = !_isListening;
    });

    if (_isListening) {
      _startListening();
    } else {
      _stopListening();
    }

    // Announce state change to screen reader
    SemanticsService.announce(
      _isListening ? 'Voice recording started' : 'Voice recording stopped',
      TextDirection.ltr,
    );
  }

  void _startListening() {
    // Implementation for starting voice recognition
    // Announce when speech is detected
    SemanticsService.announce(
      'Listening... Speak now',
      TextDirection.ltr,
    );
  }

  void _stopListening() {
    // Implementation for stopping voice recognition
    if (_currentTranscription.isNotEmpty) {
      widget.onTranscription(_currentTranscription);
      SemanticsService.announce(
        'Transcription complete: $_currentTranscription',
        TextDirection.ltr,
      );
    }
  }
}
```

## Manual Testing Procedures

### 1. Screen Reader Testing Protocol

#### NVDA Testing (Windows)
```yaml
Test Procedure:
  1. Launch NVDA with Firefox/Chrome
  2. Navigate to application without mouse
  3. Use screen reader commands:
     - NVDA+Space: Browse/Focus mode toggle
     - H: Navigate by headings
     - F: Navigate by form fields
     - B: Navigate by buttons
     - L: Navigate by links
     - T: Navigate by tables

Verification Points:
  ✓ All content is announced correctly
  ✓ Navigation is logical and efficient
  ✓ Form fields have proper labels
  ✓ Error messages are announced
  ✓ Dynamic content updates are announced
  ✓ Tables have proper headers
  ✓ Images have meaningful alt text
```

#### VoiceOver Testing (macOS/iOS)
```yaml
Test Procedure:
  1. Enable VoiceOver (Cmd+F5)
  2. Navigate using VoiceOver commands:
     - VO+Right/Left: Navigate elements
     - VO+Cmd+H: Navigate by headings
     - VO+Cmd+L: Navigate by links
     - VO+Cmd+J: Navigate by form controls

Mobile VoiceOver:
  1. Settings > Accessibility > VoiceOver
  2. Use gestures:
     - Single tap: Select item
     - Double tap: Activate
     - Three-finger swipe: Scroll
     - Rotor: Change navigation mode
```

### 2. Keyboard Navigation Testing

#### Comprehensive Keyboard Testing Checklist
```yaml
Basic Navigation:
  ✓ Tab moves forward through interactive elements
  ✓ Shift+Tab moves backward
  ✓ Enter activates buttons and links
  ✓ Space activates buttons and checkboxes
  ✓ Arrow keys navigate grouped controls
  ✓ Escape closes dialogs and dropdowns
  ✓ Home/End keys work in text fields

Focus Management:
  ✓ Focus is visible at all times
  ✓ Focus order is logical
  ✓ Focus is trapped in modal dialogs
  ✓ Focus returns to trigger after modal closes
  ✓ Skip links are provided and functional

Form Interaction:
  ✓ All form fields are reachable via keyboard
  ✓ Validation errors receive focus
  ✓ Dropdown lists can be operated with arrow keys
  ✓ Date pickers are keyboard accessible
  ✓ File uploads work with keyboard

Rich Interactions:
  ✓ Drag and drop has keyboard alternatives
  ✓ Sliders can be operated with arrow keys
  ✓ Tabs can be navigated with arrow keys
  ✓ Accordion panels open/close with Enter/Space
  ✓ Sortable lists have keyboard controls
```

### 3. Color and Contrast Testing

#### Color Contrast Testing Tools
```yaml
Automated Tools:
  - Colour Contrast Analyser (CCA)
  - WebAIM Contrast Checker
  - Chrome DevTools Contrast Ratio
  - axe-core color-contrast rule

Manual Testing:
  ✓ Test with grayscale filter
  ✓ Test with color blindness simulators
  ✓ Verify information isn't conveyed by color alone
  ✓ Check focus indicators have sufficient contrast
  ✓ Test custom UI components contrast ratios

Contrast Requirements:
  - Normal text: 4.5:1 minimum
  - Large text (18pt+/14pt bold+): 3:1 minimum
  - UI components and graphics: 3:1 minimum
  - Enhanced (AAA): 7:1 for normal text, 4.5:1 for large text
```

### 4. Mobile Accessibility Testing

#### Touch Target Testing
```yaml
Touch Target Requirements:
  - Minimum size: 44x44 pixels (iOS) / 48x48dp (Android)
  - Adequate spacing between targets
  - Larger targets for primary actions

Testing Procedure:
  ✓ Measure touch targets with design tools
  ✓ Test with various finger sizes
  ✓ Verify targets don't overlap
  ✓ Test with thick fingers/gloves simulation
  ✓ Check touch target spacing
```

#### Device Orientation Testing
```yaml
Orientation Testing:
  ✓ All functionality works in both orientations
  ✓ Content reflows appropriately
  ✓ Focus is maintained during rotation
  ✓ Touch targets remain accessible
  ✓ Reading order remains logical
```

## Accessibility Testing Tools Integration

### 1. CI/CD Accessibility Pipeline
```yaml
# .github/workflows/accessibility-testing.yml
name: Accessibility Testing

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  accessibility-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build applications
        run: npm run build

      - name: Start test servers
        run: |
          npm run start:test:parallel &
          sleep 30

      - name: Run axe-core tests
        run: npm run test:a11y:axe

      - name: Run Pa11y tests
        run: npm run test:a11y:pa11y

      - name: Run Lighthouse accessibility audit
        run: npm run test:a11y:lighthouse

      - name: Generate accessibility report
        run: npm run test:a11y:report

      - name: Upload accessibility artifacts
        uses: actions/upload-artifact@v3
        with:
          name: accessibility-report
          path: |
            accessibility-report.html
            axe-results.json
            pa11y-results.json
            lighthouse-accessibility.json
```

### 2. Comprehensive Accessibility Test Suite
```javascript
// tests/accessibility/comprehensive-a11y.test.js
const { AxePuppeteer } = require('@axe-core/puppeteer');
const pa11y = require('pa11y');

describe('Comprehensive Accessibility Testing', () => {
  const testPages = [
    { url: 'http://localhost:3000', name: 'Landing Page' },
    { url: 'http://localhost:7002/cms', name: 'CMS Login' },
    { url: 'http://localhost:7002/cms/dashboard', name: 'CMS Dashboard' },
    { url: 'http://localhost:7002/cms/content/new', name: 'Content Editor' },
    { url: 'http://localhost:8006/admin', name: 'Admin Panel' },
  ];

  test.each(testPages)('$name should pass axe accessibility tests', async ({ url, name }) => {
    const page = await browser.newPage();
    await page.goto(url);
    await page.waitForLoadState('networkidle');

    const results = await new AxePuppeteer(page)
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toHaveLength(0);
    await page.close();
  });

  test.each(testPages)('$name should pass Pa11y tests', async ({ url, name }) => {
    const results = await pa11y(url, {
      standard: 'WCAG2AA',
      includeNotices: false,
      includeWarnings: true,
      runners: ['axe', 'htmlcs'],
    });

    expect(results.issues.filter(issue => issue.type === 'error')).toHaveLength(0);
  });
});
```

This comprehensive accessibility testing checklist ensures that the UpCoach platform meets WCAG 2.1 AA standards across all platforms while providing an excellent user experience for users with disabilities.