# UpCoach Design System

## Overview
This design system ensures consistency and accessibility across all UpCoach platforms (Web, Mobile, Admin, CMS).

## Design Principles

### 1. Clarity
- Clear visual hierarchy
- Intuitive navigation
- Readable typography
- Meaningful feedback

### 2. Consistency
- Unified component library
- Standardized patterns
- Predictable interactions
- Cross-platform coherence

### 3. Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- High contrast modes

### 4. Performance
- Optimized assets
- Lazy loading
- Progressive enhancement
- Smooth animations

## Color Palette

### Primary Colors
```css
--primary-50: #EEF2FF;
--primary-100: #E0E7FF;
--primary-200: #C7D2FE;
--primary-300: #A5B4FC;
--primary-400: #818CF8;
--primary-500: #6366F1;  /* Main Primary */
--primary-600: #4F46E5;
--primary-700: #4338CA;
--primary-800: #3730A3;
--primary-900: #312E81;
```

### Secondary Colors
```css
--secondary-50: #ECFDF5;
--secondary-100: #D1FAE5;
--secondary-200: #A7F3D0;
--secondary-300: #6EE7B7;
--secondary-400: #34D399;
--secondary-500: #10B981; /* Main Secondary */
--secondary-600: #059669;
--secondary-700: #047857;
--secondary-800: #065F46;
--secondary-900: #064E3B;
```

### Neutral Colors
```css
--gray-50: #F9FAFB;
--gray-100: #F3F4F6;
--gray-200: #E5E7EB;
--gray-300: #D1D5DB;
--gray-400: #9CA3AF;
--gray-500: #6B7280;
--gray-600: #4B5563;
--gray-700: #374151;
--gray-800: #1F2937;
--gray-900: #111827;
```

### Semantic Colors
```css
--success: #10B981;
--warning: #F59E0B;
--error: #EF4444;
--info: #3B82F6;
```

### Color Contrast Requirements
- Normal text: Minimum 4.5:1 ratio
- Large text: Minimum 3:1 ratio
- Interactive elements: Minimum 3:1 ratio
- Use #595959 minimum for body text on white

## Typography

### Font Stack
```css
--font-sans: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
--font-mono: "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
```

### Type Scale
```css
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
--text-5xl: 3rem;      /* 48px */
```

### Font Weights
```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Line Heights
```css
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;
```

## Spacing System

### Base Unit: 8px
```css
--space-xs: 4px;    /* 0.5 unit */
--space-sm: 8px;    /* 1 unit */
--space-md: 16px;   /* 2 units */
--space-lg: 24px;   /* 3 units */
--space-xl: 32px;   /* 4 units */
--space-2xl: 48px;  /* 6 units */
--space-3xl: 64px;  /* 8 units */
--space-4xl: 96px;  /* 12 units */
```

## Layout

### Breakpoints
```css
--breakpoint-sm: 640px;   /* Mobile landscape */
--breakpoint-md: 768px;   /* Tablet portrait */
--breakpoint-lg: 1024px;  /* Tablet landscape */
--breakpoint-xl: 1280px;  /* Desktop */
--breakpoint-2xl: 1536px; /* Large desktop */
```

### Grid System
- 12-column grid
- Mobile: 1-2 columns
- Tablet: 2-3 columns
- Desktop: 3-4 columns
- Gap: 16px (mobile), 24px (desktop)

### Container Widths
```css
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;
```

## Components

### Buttons

#### Sizes
- Small: Height 32px, padding 8px 16px
- Medium: Height 40px, padding 10px 20px
- Large: Height 56px, padding 14px 28px (Mobile default)

#### Variants
1. **Primary**: Solid background, primary color
2. **Secondary**: Solid background, secondary color
3. **Outline**: Border only, transparent background
4. **Ghost**: No border, transparent background
5. **Danger**: Red color scheme for destructive actions

#### States
- Default
- Hover: Darken 10%
- Active: Darken 20%
- Disabled: Opacity 50%
- Loading: Show spinner

### Touch Targets
- Minimum size: 48x48px (WCAG requirement)
- Recommended: 56x56px for primary actions
- Icon buttons: 44x44px minimum
- Spacing between targets: 8px minimum

### Forms

#### Input Fields
- Height: 56px (mobile), 48px (desktop)
- Border: 1px solid gray-300
- Focus: 2px primary-500 border
- Error: 2px error border
- Padding: 12px 16px
- Border radius: 8px

#### Labels
- Position: Above input
- Font size: 14px
- Font weight: 500
- Required indicator: Red asterisk
- Help text: Below input, gray-500

#### Validation
- Real-time validation on blur
- Error messages below input
- Success checkmark in input
- ARIA live regions for announcements

### Cards
```css
.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card:hover {
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
  transition: all 0.3s ease;
}
```

### Modals
- Backdrop: rgba(0, 0, 0, 0.5)
- Content background: White
- Border radius: 16px
- Max width: 600px
- Padding: 32px
- Close button: Top right
- Focus trap enabled

## Icons

### Standard Set
Using Lucide React icons for consistency:
- Size: 24px default, 20px small, 32px large
- Stroke width: 2px
- Color: Inherit from parent

### Usage Guidelines
- Use outlined icons for navigation
- Use filled icons for selected states
- Maintain consistent metaphors
- Include aria-labels for accessibility

## Animation

### Timing Functions
```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Durations
```css
--duration-fast: 200ms;
--duration-normal: 300ms;
--duration-slow: 500ms;
```

### Common Animations
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

## Accessibility

### Focus States
- Visible focus indicators (2px outline)
- Focus trap in modals
- Skip navigation links
- Logical tab order

### ARIA Guidelines
- Use semantic HTML first
- Add ARIA labels for icons
- Include live regions for updates
- Proper heading hierarchy

### Keyboard Navigation
- Tab: Navigate forward
- Shift+Tab: Navigate backward
- Enter/Space: Activate buttons
- Escape: Close modals/menus
- Arrow keys: Navigate menus

### Screen Reader Support
- Alt text for images
- Descriptive link text
- Form field labels
- Error announcements
- Loading state announcements

## Mobile Considerations

### Touch Interactions
- Swipe gestures for navigation
- Pull-to-refresh
- Long press for context menus
- Pinch to zoom (where appropriate)

### Haptic Feedback
- Light: Selection, toggle
- Medium: Success, confirmation
- Heavy: Error, warning

### Platform Differences
#### iOS
- Safe area insets
- Notch considerations
- iOS-specific gestures

#### Android
- Material Design adaptations
- Back button handling
- System UI coordination

## Dark Mode

### Color Adaptations
- Background: gray-900
- Surface: gray-800
- Text: gray-100
- Borders: gray-700

### Considerations
- Reduced contrast in dark mode
- Adjusted shadows
- Inverted elevation
- Image brightness adjustments

## Performance

### Image Optimization
- WebP format with fallbacks
- Responsive images
- Lazy loading
- Progressive enhancement

### Code Splitting
- Route-based splitting
- Component lazy loading
- Dynamic imports
- Tree shaking

### Caching Strategy
- Static assets: 1 year
- API responses: Context-dependent
- Service worker for offline

## Implementation Guide

### Web (React)
```jsx
import { Button } from '@/shared/components/ui/Button';
import { Icons } from '@/shared/icons';

<Button variant="primary" size="large" leftIcon={<Icons.Save />}>
  Save Changes
</Button>
```

### Mobile (Flutter)
```dart
import 'package:upcoach/shared/constants/ui_constants.dart';

ElevatedButton(
  style: ElevatedButton.styleFrom(
    minimumSize: Size(double.infinity, UIConstants.buttonHeight),
  ),
  onPressed: () {},
  child: Text('Save Changes'),
)
```

## Maintenance

### Version Control
- Document all changes
- Semantic versioning
- Deprecation warnings
- Migration guides

### Testing
- Visual regression tests
- Accessibility audits
- Cross-browser testing
- Device testing

### Documentation
- Component examples
- Code snippets
- Best practices
- Common patterns