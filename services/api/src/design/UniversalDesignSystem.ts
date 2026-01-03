import { EventEmitter } from 'events';

/**
 * Universal Design System - Phase 36 Week 2
 * Complete design token system with platform-specific adaptations
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface DesignToken {
  name: string;
  value: any;
  type: TokenType;
  category: string;
  platform?: PlatformType;
  metadata?: TokenMetadata;
}

export type TokenType =
  | 'color'
  | 'typography'
  | 'spacing'
  | 'shadow'
  | 'radius'
  | 'zIndex'
  | 'motion'
  | 'breakpoint';

export type PlatformType = 'web' | 'ios' | 'android' | 'desktop' | 'universal';

export interface TokenMetadata {
  description?: string;
  deprecated?: boolean;
  aliasOf?: string;
  wcagLevel?: 'AA' | 'AAA';
  platforms?: PlatformType[];
}

export interface ColorToken {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  opacity?: number;
  contrastRatio?: number;
}

export interface TypographyToken {
  fontFamily: string;
  fontSize: string | number;
  fontWeight: number;
  lineHeight: string | number;
  letterSpacing?: string | number;
  textTransform?: string;
}

export interface SpacingToken {
  value: number;
  unit: 'px' | 'rem' | 'em' | '%';
}

export interface ShadowToken {
  offsetX: number;
  offsetY: number;
  blurRadius: number;
  spreadRadius: number;
  color: string;
  inset?: boolean;
}

export interface MotionToken {
  duration: number;
  easing: string | CubicBezier;
  delay?: number;
}

export interface CubicBezier {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Breakpoint {
  name: string;
  minWidth: number;
  maxWidth?: number;
  columns: number;
  gutter: number;
}

export interface ComponentPrimitive {
  name: string;
  variants: Record<string, ComponentVariant>;
  states: ComponentState[];
  defaultProps: Record<string, any>;
}

export interface ComponentVariant {
  name: string;
  tokens: Record<string, string>;
  props?: Record<string, any>;
}

export interface ComponentState {
  name: string;
  selector: string;
  tokens: Record<string, string>;
}

export interface AccessibilityValidation {
  passed: boolean;
  level: 'A' | 'AA' | 'AAA';
  issues: AccessibilityIssue[];
}

export interface AccessibilityIssue {
  type: 'contrast' | 'focus' | 'aria' | 'keyboard';
  severity: 'error' | 'warning' | 'info';
  message: string;
  element?: string;
  suggestion?: string;
}

export interface PlatformConvention {
  platform: PlatformType;
  guidelines: string;
  overrides: Record<string, any>;
}

export interface ThemeConfiguration {
  mode: 'light' | 'dark';
  tokens: Record<string, DesignToken>;
  components: Record<string, ComponentPrimitive>;
  accessibility: AccessibilityConfig;
  internationalization: I18nConfig;
}

export interface AccessibilityConfig {
  minimumContrastRatio: number;
  focusIndicatorWidth: number;
  touchTargetSize: number;
  enforceWCAG: 'A' | 'AA' | 'AAA';
}

export interface I18nConfig {
  direction: 'ltr' | 'rtl';
  locale: string;
  dateFormat: string;
  numberFormat: string;
}

// ============================================================================
// Universal Design System Class
// ============================================================================

export class UniversalDesignSystem extends EventEmitter {
  private tokens: Map<string, DesignToken> = new Map();
  private components: Map<string, ComponentPrimitive> = new Map();
  private themes: Map<string, ThemeConfiguration> = new Map();
  private currentTheme: string = 'default';
  private currentPlatform: PlatformType = 'web';

  constructor() {
    super();
    this.initializeDefaultTokens();
    this.initializeComponents();
    this.initializeThemes();
  }

  // ============================================================================
  // Token Management
  // ============================================================================

  private initializeDefaultTokens(): void {
    // Color tokens
    const colorTokens: DesignToken[] = [
      // Primary colors
      {
        name: 'color.primary.50',
        value: this.createColorToken('#e3f2fd'),
        type: 'color',
        category: 'primary',
      },
      {
        name: 'color.primary.100',
        value: this.createColorToken('#bbdefb'),
        type: 'color',
        category: 'primary',
      },
      {
        name: 'color.primary.200',
        value: this.createColorToken('#90caf9'),
        type: 'color',
        category: 'primary',
      },
      {
        name: 'color.primary.300',
        value: this.createColorToken('#64b5f6'),
        type: 'color',
        category: 'primary',
      },
      {
        name: 'color.primary.400',
        value: this.createColorToken('#42a5f5'),
        type: 'color',
        category: 'primary',
      },
      {
        name: 'color.primary.500',
        value: this.createColorToken('#2196f3'),
        type: 'color',
        category: 'primary',
      },
      {
        name: 'color.primary.600',
        value: this.createColorToken('#1e88e5'),
        type: 'color',
        category: 'primary',
      },
      {
        name: 'color.primary.700',
        value: this.createColorToken('#1976d2'),
        type: 'color',
        category: 'primary',
      },
      {
        name: 'color.primary.800',
        value: this.createColorToken('#1565c0'),
        type: 'color',
        category: 'primary',
      },
      {
        name: 'color.primary.900',
        value: this.createColorToken('#0d47a1'),
        type: 'color',
        category: 'primary',
      },
      // Neutral colors
      {
        name: 'color.neutral.white',
        value: this.createColorToken('#ffffff'),
        type: 'color',
        category: 'neutral',
      },
      {
        name: 'color.neutral.50',
        value: this.createColorToken('#fafafa'),
        type: 'color',
        category: 'neutral',
      },
      {
        name: 'color.neutral.100',
        value: this.createColorToken('#f5f5f5'),
        type: 'color',
        category: 'neutral',
      },
      {
        name: 'color.neutral.200',
        value: this.createColorToken('#eeeeee'),
        type: 'color',
        category: 'neutral',
      },
      {
        name: 'color.neutral.300',
        value: this.createColorToken('#e0e0e0'),
        type: 'color',
        category: 'neutral',
      },
      {
        name: 'color.neutral.400',
        value: this.createColorToken('#bdbdbd'),
        type: 'color',
        category: 'neutral',
      },
      {
        name: 'color.neutral.500',
        value: this.createColorToken('#9e9e9e'),
        type: 'color',
        category: 'neutral',
      },
      {
        name: 'color.neutral.600',
        value: this.createColorToken('#757575'),
        type: 'color',
        category: 'neutral',
      },
      {
        name: 'color.neutral.700',
        value: this.createColorToken('#616161'),
        type: 'color',
        category: 'neutral',
      },
      {
        name: 'color.neutral.800',
        value: this.createColorToken('#424242'),
        type: 'color',
        category: 'neutral',
      },
      {
        name: 'color.neutral.900',
        value: this.createColorToken('#212121'),
        type: 'color',
        category: 'neutral',
      },
      {
        name: 'color.neutral.black',
        value: this.createColorToken('#000000'),
        type: 'color',
        category: 'neutral',
      },
      // Semantic colors
      {
        name: 'color.success.500',
        value: this.createColorToken('#4caf50'),
        type: 'color',
        category: 'semantic',
      },
      {
        name: 'color.warning.500',
        value: this.createColorToken('#ff9800'),
        type: 'color',
        category: 'semantic',
      },
      {
        name: 'color.error.500',
        value: this.createColorToken('#f44336'),
        type: 'color',
        category: 'semantic',
      },
      {
        name: 'color.info.500',
        value: this.createColorToken('#2196f3'),
        type: 'color',
        category: 'semantic',
      },
    ];

    // Typography tokens
    const typographyTokens: DesignToken[] = [
      {
        name: 'typography.h1',
        value: {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 96,
          fontWeight: 300,
          lineHeight: 1.167,
          letterSpacing: -1.5,
        },
        type: 'typography',
        category: 'heading',
      },
      {
        name: 'typography.h2',
        value: {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 60,
          fontWeight: 300,
          lineHeight: 1.2,
          letterSpacing: -0.5,
        },
        type: 'typography',
        category: 'heading',
      },
      {
        name: 'typography.h3',
        value: {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 48,
          fontWeight: 400,
          lineHeight: 1.167,
          letterSpacing: 0,
        },
        type: 'typography',
        category: 'heading',
      },
      {
        name: 'typography.h4',
        value: {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 34,
          fontWeight: 400,
          lineHeight: 1.235,
          letterSpacing: 0.25,
        },
        type: 'typography',
        category: 'heading',
      },
      {
        name: 'typography.h5',
        value: {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 24,
          fontWeight: 400,
          lineHeight: 1.334,
          letterSpacing: 0,
        },
        type: 'typography',
        category: 'heading',
      },
      {
        name: 'typography.h6',
        value: {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 20,
          fontWeight: 500,
          lineHeight: 1.6,
          letterSpacing: 0.15,
        },
        type: 'typography',
        category: 'heading',
      },
      {
        name: 'typography.body1',
        value: {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 16,
          fontWeight: 400,
          lineHeight: 1.5,
          letterSpacing: 0.15,
        },
        type: 'typography',
        category: 'body',
      },
      {
        name: 'typography.body2',
        value: {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 14,
          fontWeight: 400,
          lineHeight: 1.43,
          letterSpacing: 0.17,
        },
        type: 'typography',
        category: 'body',
      },
      {
        name: 'typography.button',
        value: {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 14,
          fontWeight: 500,
          lineHeight: 1.75,
          letterSpacing: 0.4,
          textTransform: 'uppercase',
        },
        type: 'typography',
        category: 'interactive',
      },
      {
        name: 'typography.caption',
        value: {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 12,
          fontWeight: 400,
          lineHeight: 1.66,
          letterSpacing: 0.4,
        },
        type: 'typography',
        category: 'utility',
      },
    ];

    // Spacing tokens
    const spacingTokens: DesignToken[] = [
      { name: 'spacing.0', value: { value: 0, unit: 'px' }, type: 'spacing', category: 'spacing' },
      { name: 'spacing.1', value: { value: 4, unit: 'px' }, type: 'spacing', category: 'spacing' },
      { name: 'spacing.2', value: { value: 8, unit: 'px' }, type: 'spacing', category: 'spacing' },
      { name: 'spacing.3', value: { value: 12, unit: 'px' }, type: 'spacing', category: 'spacing' },
      { name: 'spacing.4', value: { value: 16, unit: 'px' }, type: 'spacing', category: 'spacing' },
      { name: 'spacing.5', value: { value: 20, unit: 'px' }, type: 'spacing', category: 'spacing' },
      { name: 'spacing.6', value: { value: 24, unit: 'px' }, type: 'spacing', category: 'spacing' },
      { name: 'spacing.7', value: { value: 28, unit: 'px' }, type: 'spacing', category: 'spacing' },
      { name: 'spacing.8', value: { value: 32, unit: 'px' }, type: 'spacing', category: 'spacing' },
      { name: 'spacing.9', value: { value: 36, unit: 'px' }, type: 'spacing', category: 'spacing' },
      { name: 'spacing.10', value: { value: 40, unit: 'px' }, type: 'spacing', category: 'spacing' },
      { name: 'spacing.12', value: { value: 48, unit: 'px' }, type: 'spacing', category: 'spacing' },
      { name: 'spacing.16', value: { value: 64, unit: 'px' }, type: 'spacing', category: 'spacing' },
      { name: 'spacing.20', value: { value: 80, unit: 'px' }, type: 'spacing', category: 'spacing' },
      { name: 'spacing.24', value: { value: 96, unit: 'px' }, type: 'spacing', category: 'spacing' },
    ];

    // Shadow tokens
    const shadowTokens: DesignToken[] = [
      {
        name: 'shadow.none',
        value: { offsetX: 0, offsetY: 0, blurRadius: 0, spreadRadius: 0, color: 'transparent' },
        type: 'shadow',
        category: 'elevation',
      },
      {
        name: 'shadow.sm',
        value: { offsetX: 0, offsetY: 1, blurRadius: 2, spreadRadius: 0, color: 'rgba(0,0,0,0.05)' },
        type: 'shadow',
        category: 'elevation',
      },
      {
        name: 'shadow.md',
        value: { offsetX: 0, offsetY: 4, blurRadius: 6, spreadRadius: -1, color: 'rgba(0,0,0,0.1)' },
        type: 'shadow',
        category: 'elevation',
      },
      {
        name: 'shadow.lg',
        value: { offsetX: 0, offsetY: 10, blurRadius: 15, spreadRadius: -3, color: 'rgba(0,0,0,0.1)' },
        type: 'shadow',
        category: 'elevation',
      },
      {
        name: 'shadow.xl',
        value: { offsetX: 0, offsetY: 20, blurRadius: 25, spreadRadius: -5, color: 'rgba(0,0,0,0.1)' },
        type: 'shadow',
        category: 'elevation',
      },
      {
        name: 'shadow.2xl',
        value: { offsetX: 0, offsetY: 25, blurRadius: 50, spreadRadius: -12, color: 'rgba(0,0,0,0.25)' },
        type: 'shadow',
        category: 'elevation',
      },
    ];

    // Radius tokens
    const radiusTokens: DesignToken[] = [
      { name: 'radius.none', value: { value: 0, unit: 'px' }, type: 'radius', category: 'shape' },
      { name: 'radius.sm', value: { value: 2, unit: 'px' }, type: 'radius', category: 'shape' },
      { name: 'radius.md', value: { value: 4, unit: 'px' }, type: 'radius', category: 'shape' },
      { name: 'radius.lg', value: { value: 8, unit: 'px' }, type: 'radius', category: 'shape' },
      { name: 'radius.xl', value: { value: 12, unit: 'px' }, type: 'radius', category: 'shape' },
      { name: 'radius.2xl', value: { value: 16, unit: 'px' }, type: 'radius', category: 'shape' },
      { name: 'radius.full', value: { value: 9999, unit: 'px' }, type: 'radius', category: 'shape' },
    ];

    // Z-index tokens
    const zIndexTokens: DesignToken[] = [
      { name: 'zIndex.hide', value: -1, type: 'zIndex', category: 'layer' },
      { name: 'zIndex.base', value: 0, type: 'zIndex', category: 'layer' },
      { name: 'zIndex.dropdown', value: 1000, type: 'zIndex', category: 'layer' },
      { name: 'zIndex.sticky', value: 1100, type: 'zIndex', category: 'layer' },
      { name: 'zIndex.fixed', value: 1200, type: 'zIndex', category: 'layer' },
      { name: 'zIndex.overlay', value: 1300, type: 'zIndex', category: 'layer' },
      { name: 'zIndex.modal', value: 1400, type: 'zIndex', category: 'layer' },
      { name: 'zIndex.popover', value: 1500, type: 'zIndex', category: 'layer' },
      { name: 'zIndex.toast', value: 1600, type: 'zIndex', category: 'layer' },
      { name: 'zIndex.tooltip', value: 1700, type: 'zIndex', category: 'layer' },
    ];

    // Motion tokens
    const motionTokens: DesignToken[] = [
      {
        name: 'motion.duration.instant',
        value: { duration: 100, easing: { x1: 0.4, y1: 0, x2: 0.2, y2: 1 } },
        type: 'motion',
        category: 'duration',
      },
      {
        name: 'motion.duration.fast',
        value: { duration: 200, easing: { x1: 0.4, y1: 0, x2: 0.2, y2: 1 } },
        type: 'motion',
        category: 'duration',
      },
      {
        name: 'motion.duration.normal',
        value: { duration: 300, easing: { x1: 0.4, y1: 0, x2: 0.2, y2: 1 } },
        type: 'motion',
        category: 'duration',
      },
      {
        name: 'motion.duration.slow',
        value: { duration: 500, easing: { x1: 0.4, y1: 0, x2: 0.2, y2: 1 } },
        type: 'motion',
        category: 'duration',
      },
      {
        name: 'motion.easing.linear',
        value: { duration: 300, easing: { x1: 0, y1: 0, x2: 1, y2: 1 } },
        type: 'motion',
        category: 'easing',
      },
      {
        name: 'motion.easing.easeIn',
        value: { duration: 300, easing: { x1: 0.4, y1: 0, x2: 1, y2: 1 } },
        type: 'motion',
        category: 'easing',
      },
      {
        name: 'motion.easing.easeOut',
        value: { duration: 300, easing: { x1: 0, y1: 0, x2: 0.2, y2: 1 } },
        type: 'motion',
        category: 'easing',
      },
      {
        name: 'motion.easing.easeInOut',
        value: { duration: 300, easing: { x1: 0.4, y1: 0, x2: 0.2, y2: 1 } },
        type: 'motion',
        category: 'easing',
      },
      {
        name: 'motion.easing.spring',
        value: { duration: 300, easing: { x1: 0.68, y1: -0.55, x2: 0.265, y2: 1.55 } },
        type: 'motion',
        category: 'easing',
      },
    ];

    // Breakpoint tokens
    const breakpointTokens: DesignToken[] = [
      {
        name: 'breakpoint.xs',
        value: { name: 'xs', minWidth: 0, maxWidth: 599, columns: 4, gutter: 16 },
        type: 'breakpoint',
        category: 'layout',
      },
      {
        name: 'breakpoint.sm',
        value: { name: 'sm', minWidth: 600, maxWidth: 959, columns: 8, gutter: 16 },
        type: 'breakpoint',
        category: 'layout',
      },
      {
        name: 'breakpoint.md',
        value: { name: 'md', minWidth: 960, maxWidth: 1279, columns: 12, gutter: 24 },
        type: 'breakpoint',
        category: 'layout',
      },
      {
        name: 'breakpoint.lg',
        value: { name: 'lg', minWidth: 1280, maxWidth: 1919, columns: 12, gutter: 24 },
        type: 'breakpoint',
        category: 'layout',
      },
      {
        name: 'breakpoint.xl',
        value: { name: 'xl', minWidth: 1920, maxWidth: 2559, columns: 12, gutter: 32 },
        type: 'breakpoint',
        category: 'layout',
      },
      {
        name: 'breakpoint.xxl',
        value: { name: 'xxl', minWidth: 2560, columns: 12, gutter: 32 },
        type: 'breakpoint',
        category: 'layout',
      },
    ];

    // Register all tokens
    [...colorTokens, ...typographyTokens, ...spacingTokens, ...shadowTokens, ...radiusTokens, ...zIndexTokens, ...motionTokens, ...breakpointTokens].forEach(token => {
      this.tokens.set(token.name, token);
    });
  }

  private createColorToken(hex: string): ColorToken {
    const rgb = this.hexToRgb(hex);
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    return { hex, rgb, hsl };
  }

  public getToken(name: string, platform?: PlatformType): DesignToken | undefined {
    const token = this.tokens.get(name);
    if (!token) return undefined;

    // Apply platform overrides if specified
    if (platform && token.platform === 'universal') {
      return this.applyPlatformOverride(token, platform);
    }

    return token;
  }

  public setToken(token: DesignToken): void {
    this.tokens.set(token.name, token);
    this.emit('token:updated', token);
  }

  public getAllTokens(category?: string): DesignToken[] {
    const allTokens = Array.from(this.tokens.values());
    if (category) {
      return allTokens.filter(token => token.category === category);
    }
    return allTokens;
  }

  // ============================================================================
  // Component Management
  // ============================================================================

  private initializeComponents(): void {
    // Button component
    this.components.set('Button', {
      name: 'Button',
      variants: {
        primary: {
          name: 'primary',
          tokens: {
            backgroundColor: 'color.primary.500',
            color: 'color.neutral.white',
            borderRadius: 'radius.md',
            padding: 'spacing.4',
            fontSize: 'typography.button',
          },
        },
        secondary: {
          name: 'secondary',
          tokens: {
            backgroundColor: 'color.neutral.200',
            color: 'color.neutral.900',
            borderRadius: 'radius.md',
            padding: 'spacing.4',
            fontSize: 'typography.button',
          },
        },
        outlined: {
          name: 'outlined',
          tokens: {
            backgroundColor: 'transparent',
            color: 'color.primary.500',
            border: '1px solid',
            borderColor: 'color.primary.500',
            borderRadius: 'radius.md',
            padding: 'spacing.4',
            fontSize: 'typography.button',
          },
        },
        text: {
          name: 'text',
          tokens: {
            backgroundColor: 'transparent',
            color: 'color.primary.500',
            borderRadius: 'radius.md',
            padding: 'spacing.4',
            fontSize: 'typography.button',
          },
        },
      },
      states: [
        {
          name: 'hover',
          selector: ':hover',
          tokens: {
            opacity: '0.9',
            transform: 'translateY(-1px)',
            shadow: 'shadow.md',
          },
        },
        {
          name: 'active',
          selector: ':active',
          tokens: {
            opacity: '0.8',
            transform: 'translateY(0)',
            shadow: 'shadow.sm',
          },
        },
        {
          name: 'focus',
          selector: ':focus',
          tokens: {
            outline: '2px solid',
            outlineColor: 'color.primary.300',
            outlineOffset: '2px',
          },
        },
        {
          name: 'disabled',
          selector: ':disabled',
          tokens: {
            opacity: '0.5',
            cursor: 'not-allowed',
          },
        },
      ],
      defaultProps: {
        variant: 'primary',
        size: 'medium',
      },
    });

    // Input component
    this.components.set('Input', {
      name: 'Input',
      variants: {
        outlined: {
          name: 'outlined',
          tokens: {
            backgroundColor: 'color.neutral.white',
            color: 'color.neutral.900',
            border: '1px solid',
            borderColor: 'color.neutral.300',
            borderRadius: 'radius.md',
            padding: 'spacing.4',
            fontSize: 'typography.body1',
          },
        },
        filled: {
          name: 'filled',
          tokens: {
            backgroundColor: 'color.neutral.100',
            color: 'color.neutral.900',
            border: 'none',
            borderRadius: 'radius.md',
            padding: 'spacing.4',
            fontSize: 'typography.body1',
          },
        },
      },
      states: [
        {
          name: 'focus',
          selector: ':focus',
          tokens: {
            borderColor: 'color.primary.500',
            outline: 'none',
            shadow: 'shadow.sm',
          },
        },
        {
          name: 'error',
          selector: '.error',
          tokens: {
            borderColor: 'color.error.500',
          },
        },
        {
          name: 'disabled',
          selector: ':disabled',
          tokens: {
            backgroundColor: 'color.neutral.100',
            opacity: '0.6',
            cursor: 'not-allowed',
          },
        },
      ],
      defaultProps: {
        variant: 'outlined',
        size: 'medium',
      },
    });

    // Card component
    this.components.set('Card', {
      name: 'Card',
      variants: {
        elevated: {
          name: 'elevated',
          tokens: {
            backgroundColor: 'color.neutral.white',
            borderRadius: 'radius.lg',
            padding: 'spacing.6',
            shadow: 'shadow.md',
          },
        },
        outlined: {
          name: 'outlined',
          tokens: {
            backgroundColor: 'color.neutral.white',
            border: '1px solid',
            borderColor: 'color.neutral.200',
            borderRadius: 'radius.lg',
            padding: 'spacing.6',
            shadow: 'shadow.none',
          },
        },
        flat: {
          name: 'flat',
          tokens: {
            backgroundColor: 'color.neutral.50',
            borderRadius: 'radius.lg',
            padding: 'spacing.6',
            shadow: 'shadow.none',
          },
        },
      },
      states: [
        {
          name: 'hover',
          selector: ':hover',
          tokens: {
            shadow: 'shadow.lg',
            transform: 'translateY(-2px)',
          },
        },
      ],
      defaultProps: {
        variant: 'elevated',
      },
    });

    // Modal component
    this.components.set('Modal', {
      name: 'Modal',
      variants: {
        default: {
          name: 'default',
          tokens: {
            backgroundColor: 'color.neutral.white',
            borderRadius: 'radius.xl',
            padding: 'spacing.8',
            shadow: 'shadow.2xl',
            maxWidth: '600px',
          },
        },
        fullscreen: {
          name: 'fullscreen',
          tokens: {
            backgroundColor: 'color.neutral.white',
            borderRadius: 'radius.none',
            padding: 'spacing.8',
            width: '100vw',
            height: '100vh',
          },
        },
      },
      states: [],
      defaultProps: {
        variant: 'default',
      },
    });
  }

  public getComponent(name: string): ComponentPrimitive | undefined {
    return this.components.get(name);
  }

  public getAllComponents(): ComponentPrimitive[] {
    return Array.from(this.components.values());
  }

  // ============================================================================
  // Theme Management
  // ============================================================================

  private initializeThemes(): void {
    // Light theme
    const lightTheme: ThemeConfiguration = {
      mode: 'light',
      tokens: Object.fromEntries(this.tokens.entries()),
      components: Object.fromEntries(this.components.entries()),
      accessibility: {
        minimumContrastRatio: 7.0,
        focusIndicatorWidth: 2,
        touchTargetSize: 44,
        enforceWCAG: 'AAA',
      },
      internationalization: {
        direction: 'ltr',
        locale: 'en-US',
        dateFormat: 'MM/DD/YYYY',
        numberFormat: '1,000.00',
      },
    };

    // Dark theme
    const darkTheme: ThemeConfiguration = {
      mode: 'dark',
      tokens: this.generateDarkModeTokens(),
      components: Object.fromEntries(this.components.entries()),
      accessibility: {
        minimumContrastRatio: 7.0,
        focusIndicatorWidth: 2,
        touchTargetSize: 44,
        enforceWCAG: 'AAA',
      },
      internationalization: {
        direction: 'ltr',
        locale: 'en-US',
        dateFormat: 'MM/DD/YYYY',
        numberFormat: '1,000.00',
      },
    };

    this.themes.set('default', lightTheme);
    this.themes.set('light', lightTheme);
    this.themes.set('dark', darkTheme);
  }

  private generateDarkModeTokens(): Record<string, DesignToken> {
    const darkTokens = new Map<string, DesignToken>(this.tokens);

    // Invert neutral colors for dark mode
    const neutralColorMap = [
      ['color.neutral.white', 'color.neutral.black'],
      ['color.neutral.50', 'color.neutral.900'],
      ['color.neutral.100', 'color.neutral.800'],
      ['color.neutral.200', 'color.neutral.700'],
      ['color.neutral.300', 'color.neutral.600'],
      ['color.neutral.400', 'color.neutral.500'],
    ];

    neutralColorMap.forEach(([light, dark]) => {
      const lightToken = this.tokens.get(light);
      const darkToken = this.tokens.get(dark);
      if (lightToken && darkToken) {
        darkTokens.set(light, { ...darkToken, name: light });
        darkTokens.set(dark, { ...lightToken, name: dark });
      }
    });

    return Object.fromEntries(darkTokens.entries());
  }

  public getTheme(name: string): ThemeConfiguration | undefined {
    return this.themes.get(name);
  }

  public setTheme(name: string): void {
    if (this.themes.has(name)) {
      this.currentTheme = name;
      this.emit('theme:changed', name);
    }
  }

  public getCurrentTheme(): ThemeConfiguration {
    return this.themes.get(this.currentTheme)!;
  }

  // ============================================================================
  // Platform Overrides
  // ============================================================================

  private applyPlatformOverride(token: DesignToken, platform: PlatformType): DesignToken {
    const platformConventions = this.getPlatformConventions(platform);
    const override = platformConventions.overrides[token.name];

    if (override) {
      return {
        ...token,
        value: override,
        platform,
      };
    }

    return token;
  }

  private getPlatformConventions(platform: PlatformType): PlatformConvention {
    const conventions: Record<PlatformType, PlatformConvention> = {
      web: {
        platform: 'web',
        guidelines: 'W3C Web Standards',
        overrides: {},
      },
      ios: {
        platform: 'ios',
        guidelines: 'Apple Human Interface Guidelines',
        overrides: {
          'spacing.4': { value: 16, unit: 'px' },
          'radius.md': { value: 10, unit: 'px' },
          'typography.button': {
            fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro',
            fontSize: 17,
            fontWeight: 600,
            lineHeight: 1.29,
            letterSpacing: -0.41,
          },
        },
      },
      android: {
        platform: 'android',
        guidelines: 'Material Design 3',
        overrides: {
          'spacing.4': { value: 16, unit: 'px' },
          'radius.md': { value: 12, unit: 'px' },
          'typography.button': {
            fontFamily: 'Roboto, system-ui, sans-serif',
            fontSize: 14,
            fontWeight: 500,
            lineHeight: 1.71,
            letterSpacing: 1.25,
            textTransform: 'uppercase',
          },
        },
      },
      desktop: {
        platform: 'desktop',
        guidelines: 'Desktop UI Conventions',
        overrides: {
          'spacing.4': { value: 12, unit: 'px' },
          'radius.md': { value: 4, unit: 'px' },
        },
      },
      universal: {
        platform: 'universal',
        guidelines: 'Cross-platform Standards',
        overrides: {},
      },
    };

    return conventions[platform];
  }

  // ============================================================================
  // Color Utilities
  // ============================================================================

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : { r: 0, g: 0, b: 0 };
  }

  private rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  }

  // ============================================================================
  // Accessibility Validation (WCAG 2.2)
  // ============================================================================

  public validateAccessibility(component: ComponentPrimitive): AccessibilityValidation {
    const issues: AccessibilityIssue[] = [];
    const theme = this.getCurrentTheme();

    // Check contrast ratios
    Object.entries(component.variants).forEach(([variantName, variant]) => {
      const bgColor = variant.tokens.backgroundColor;
      const fgColor = variant.tokens.color;

      if (bgColor && fgColor) {
        const bgToken = this.getToken(bgColor);
        const fgToken = this.getToken(fgColor);

        if (bgToken && fgToken && bgToken.type === 'color' && fgToken.type === 'color') {
          const contrastRatio = this.calculateContrastRatio(
            bgToken.value as ColorToken,
            fgToken.value as ColorToken
          );

          if (contrastRatio < theme.accessibility.minimumContrastRatio) {
            issues.push({
              type: 'contrast',
              severity: 'error',
              message: `Insufficient contrast ratio (${contrastRatio.toFixed(2)}) for ${component.name} ${variantName} variant`,
              element: `${component.name}.${variantName}`,
              suggestion: `Minimum contrast ratio is ${theme.accessibility.minimumContrastRatio}`,
            });
          }
        }
      }
    });

    // Check focus indicators
    const focusState = component.states.find(s => s.name === 'focus');
    if (!focusState || !focusState.tokens.outline) {
      issues.push({
        type: 'focus',
        severity: 'error',
        message: `Missing focus indicator for ${component.name}`,
        element: component.name,
        suggestion: 'Add visible focus state with outline or border',
      });
    }

    // Determine WCAG level
    let level: 'A' | 'AA' | 'AAA' = 'AAA';
    const hasErrors = issues.some(i => i.severity === 'error');
    const hasWarnings = issues.some(i => i.severity === 'warning');

    if (hasErrors) {
      level = 'A';
    } else if (hasWarnings) {
      level = 'AA';
    }

    return {
      passed: issues.length === 0,
      level,
      issues,
    };
  }

  public calculateContrastRatio(color1: ColorToken, color2: ColorToken): number {
    const l1 = this.getRelativeLuminance(color1.rgb);
    const l2 = this.getRelativeLuminance(color2.rgb);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  private getRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
    const rsRGB = rgb.r / 255;
    const gsRGB = rgb.g / 255;
    const bsRGB = rgb.b / 255;

    const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  // ============================================================================
  // Motion & Animation
  // ============================================================================

  public evaluateBezier(bezier: CubicBezier, t: number): number {
    // Cubic Bezier curve calculation
    const { x1, y1, x2, y2 } = bezier;

    // Newton-Raphson iteration for x to t
    let t2 = t;
    for (let i = 0; i < 8; i++) {
      const x = this.bezierX(t2, x1, x2);
      const dx = x - t;
      if (Math.abs(dx) < 0.001) break;
      const derivative = this.bezierXDerivative(t2, x1, x2);
      if (Math.abs(derivative) < 0.000001) break;
      t2 -= dx / derivative;
    }

    return this.bezierY(t2, y1, y2);
  }

  private bezierX(t: number, x1: number, x2: number): number {
    return 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t;
  }

  private bezierY(t: number, y1: number, y2: number): number {
    return 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t;
  }

  private bezierXDerivative(t: number, x1: number, x2: number): number {
    return 3 * (1 - t) * (1 - t) * x1 + 6 * (1 - t) * t * (x2 - x1) + 3 * t * t * (1 - x2);
  }

  public generateAnimationCurve(motionToken: string, steps: number = 60): number[] {
    const token = this.getToken(motionToken);
    if (!token || token.type !== 'motion') {
      return Array(steps).fill(0).map((_, i) => i / (steps - 1));
    }

    const motion = token.value as MotionToken;
    if (typeof motion.easing === 'string') {
      return Array(steps).fill(0).map((_, i) => i / (steps - 1));
    }

    return Array(steps).fill(0).map((_, i) => {
      const t = i / (steps - 1);
      return this.evaluateBezier(motion.easing as CubicBezier, t);
    });
  }

  // ============================================================================
  // Responsive Breakpoints
  // ============================================================================

  public getBreakpoint(width: number): Breakpoint | undefined {
    const breakpoints = this.getAllTokens('layout')
      .filter(t => t.type === 'breakpoint')
      .map(t => t.value as Breakpoint)
      .sort((a, b) => a.minWidth - b.minWidth);

    return breakpoints.find(bp => {
      if (bp.maxWidth) {
        return width >= bp.minWidth && width <= bp.maxWidth;
      }
      return width >= bp.minWidth;
    });
  }

  public getAllBreakpoints(): Breakpoint[] {
    return this.getAllTokens('layout')
      .filter(t => t.type === 'breakpoint')
      .map(t => t.value as Breakpoint)
      .sort((a, b) => a.minWidth - b.minWidth);
  }

  // ============================================================================
  // Export Functionality
  // ============================================================================

  public exportToCSSVariables(): string {
    let css = ':root {\n';

    this.tokens.forEach((token, name) => {
      const cssName = `--${name.replace(/\./g, '-')}`;
      let value = '';

      switch (token.type) {
        case 'color':
          value = (token.value as ColorToken).hex;
          break;
        case 'spacing':
        case 'radius':
          const spacing = token.value as SpacingToken;
          value = `${spacing.value}${spacing.unit}`;
          break;
        case 'shadow':
          const shadow = token.value as ShadowToken;
          value = `${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blurRadius}px ${shadow.spreadRadius}px ${shadow.color}`;
          break;
        case 'zIndex':
          value = String(token.value);
          break;
        case 'motion':
          const motion = token.value as MotionToken;
          value = `${motion.duration}ms`;
          break;
        default:
          value = JSON.stringify(token.value);
      }

      css += `  ${cssName}: ${value};\n`;
    });

    css += '}\n';
    return css;
  }

  public exportToJSON(): string {
    return JSON.stringify({
      tokens: Array.from(this.tokens.entries()).map(([name, token]) => ({
        name,
        ...token,
      })),
      components: Array.from(this.components.entries()).map(([name, component]) => ({
        name,
        ...component,
      })),
      themes: Array.from(this.themes.entries()).map(([name, theme]) => ({
        name,
        ...theme,
      })),
    }, null, 2);
  }

  public exportToFigmaTokens(): string {
    const figmaTokens: any = {};

    this.tokens.forEach((token) => {
      const path = token.name.split('.');
      let current = figmaTokens;

      path.forEach((segment, index) => {
        if (index === path.length - 1) {
          current[segment] = {
            value: this.formatFigmaTokenValue(token),
            type: token.type,
          };
        } else {
          current[segment] = current[segment] || {};
          current = current[segment];
        }
      });
    });

    return JSON.stringify(figmaTokens, null, 2);
  }

  private formatFigmaTokenValue(token: DesignToken): any {
    switch (token.type) {
      case 'color':
        return (token.value as ColorToken).hex;
      case 'spacing':
      case 'radius':
        const spacing = token.value as SpacingToken;
        return `${spacing.value}${spacing.unit}`;
      case 'typography':
        return token.value;
      case 'shadow':
        const shadow = token.value as ShadowToken;
        return {
          x: shadow.offsetX,
          y: shadow.offsetY,
          blur: shadow.blurRadius,
          spread: shadow.spreadRadius,
          color: shadow.color,
        };
      default:
        return token.value;
    }
  }
}

export default UniversalDesignSystem;
