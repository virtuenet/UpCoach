import { parse } from '@babel/parser';
import generate from '@babel/generator';
import * as t from '@babel/types';
import postcss from 'postcss';
import Yoga, { YogaNode } from 'yoga-layout-prebuilt';

/**
 * Platform Adaptive Components - Phase 36 Week 2
 * Universal component system with cross-platform code generation
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

export type TargetPlatform = 'react' | 'flutter' | 'swiftui' | 'compose';
export type StyleFormat = 'css' | 'tailwind' | 'styled-components' | 'flutter-theme' | 'swiftui-modifiers';
export type LayoutSystem = 'flexbox' | 'grid' | 'stack';

export interface ComponentSpec {
  id: string;
  type: string;
  props: Record<string, any>;
  children?: ComponentSpec[];
  styles?: StyleSpec;
  layout?: LayoutSpec;
  platform?: TargetPlatform;
  conditionalRendering?: ConditionalRenderSpec[];
}

export interface StyleSpec {
  className?: string;
  inline?: Record<string, any>;
  theme?: string;
  variants?: Record<string, any>;
  responsive?: ResponsiveStyles;
}

export interface ResponsiveStyles {
  xs?: Record<string, any>;
  sm?: Record<string, any>;
  md?: Record<string, any>;
  lg?: Record<string, any>;
  xl?: Record<string, any>;
}

export interface LayoutSpec {
  system: LayoutSystem;
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  gap?: number;
  wrap?: boolean;
  gridTemplate?: string;
}

export interface ConditionalRenderSpec {
  condition: string;
  platform?: TargetPlatform;
  component?: ComponentSpec;
  fallback?: ComponentSpec;
}

export interface CodeGenerationResult {
  platform: TargetPlatform;
  code: string;
  styles?: string;
  imports?: string[];
  dependencies?: string[];
}

export interface ComponentRegistry {
  [key: string]: UniversalComponent;
}

export interface UniversalComponent {
  name: string;
  type: string;
  defaultProps: Record<string, any>;
  platformMappings: {
    react?: ReactMapping;
    flutter?: FlutterMapping;
    swiftui?: SwiftUIMapping;
    compose?: ComposeMapping;
  };
  styleMapping: StyleMapping;
  polyfills?: string[];
}

export interface ReactMapping {
  component: string;
  import: string;
  propsTransform?: (props: any) => any;
}

export interface FlutterMapping {
  widget: string;
  import: string;
  propsTransform?: (props: any) => any;
}

export interface SwiftUIMapping {
  view: string;
  import?: string;
  modifierTransform?: (props: any) => string[];
}

export interface ComposeMapping {
  composable: string;
  import: string;
  propsTransform?: (props: any) => any;
}

export interface StyleMapping {
  cssProperties: string[];
  tailwindClasses?: (props: any) => string[];
  flutterTheme?: (props: any) => Record<string, any>;
  swiftUIModifiers?: (props: any) => string[];
}

export interface LayoutCalculation {
  width: number;
  height: number;
  x: number;
  y: number;
  children?: LayoutCalculation[];
}

export interface TreeShakingResult {
  used: Set<string>;
  unused: Set<string>;
  optimizedCode: string;
  sizeBefore: number;
  sizeAfter: number;
  savings: number;
}

// ============================================================================
// Platform Adaptive Components Class
// ============================================================================

export class PlatformAdaptiveComponents {
  private registry: ComponentRegistry = {};
  private yogaConfig: any;

  constructor() {
    this.initializeYoga();
    this.initializeRegistry();
  }

  // ============================================================================
  // Registry Initialization
  // ============================================================================

  private initializeYoga(): void {
    this.yogaConfig = Yoga.Config.create();
  }

  private initializeRegistry(): void {
    // Button Component
    this.registry['Button'] = {
      name: 'Button',
      type: 'interactive',
      defaultProps: {
        variant: 'primary',
        size: 'medium',
        disabled: false,
        fullWidth: false,
      },
      platformMappings: {
        react: {
          component: 'Button',
          import: '@mui/material',
          propsTransform: (props) => ({
            variant: props.variant === 'primary' ? 'contained' : props.variant,
            size: props.size,
            disabled: props.disabled,
            fullWidth: props.fullWidth,
            children: props.label,
          }),
        },
        flutter: {
          widget: 'ElevatedButton',
          import: 'package:flutter/material.dart',
          propsTransform: (props) => ({
            onPressed: props.disabled ? 'null' : props.onPress,
            child: `Text('${props.label}')`,
          }),
        },
        swiftui: {
          view: 'Button',
          modifierTransform: (props) => [
            `.buttonStyle(.borderedProminent)`,
            props.fullWidth ? `.frame(maxWidth: .infinity)` : '',
            props.disabled ? `.disabled(true)` : '',
          ],
        },
        compose: {
          composable: 'Button',
          import: 'androidx.compose.material3',
          propsTransform: (props) => ({
            onClick: props.onPress || '{}',
            enabled: !props.disabled,
            modifier: props.fullWidth ? 'Modifier.fillMaxWidth()' : 'Modifier',
          }),
        },
      },
      styleMapping: {
        cssProperties: ['backgroundColor', 'color', 'padding', 'borderRadius', 'fontSize'],
        tailwindClasses: (props) => {
          const classes = ['px-4', 'py-2', 'rounded'];
          if (props.variant === 'primary') classes.push('bg-blue-500', 'text-white');
          if (props.variant === 'outlined') classes.push('border', 'border-blue-500', 'text-blue-500');
          if (props.fullWidth) classes.push('w-full');
          return classes;
        },
      },
    };

    // Input Component
    this.registry['Input'] = {
      name: 'Input',
      type: 'form',
      defaultProps: {
        variant: 'outlined',
        size: 'medium',
        disabled: false,
        fullWidth: true,
      },
      platformMappings: {
        react: {
          component: 'TextField',
          import: '@mui/material',
          propsTransform: (props) => ({
            variant: props.variant,
            size: props.size,
            disabled: props.disabled,
            fullWidth: props.fullWidth,
            label: props.label,
            placeholder: props.placeholder,
            value: props.value,
            onChange: props.onChange,
          }),
        },
        flutter: {
          widget: 'TextField',
          import: 'package:flutter/material.dart',
          propsTransform: (props) => ({
            decoration: `InputDecoration(labelText: '${props.label}', hintText: '${props.placeholder}')`,
            enabled: !props.disabled,
          }),
        },
        swiftui: {
          view: 'TextField',
          modifierTransform: (props) => [
            `.textFieldStyle(.roundedBorder)`,
            props.disabled ? `.disabled(true)` : '',
          ],
        },
        compose: {
          composable: 'OutlinedTextField',
          import: 'androidx.compose.material3',
          propsTransform: (props) => ({
            value: props.value || '""',
            onValueChange: props.onChange || '{}',
            label: `{ Text("${props.label}") }`,
            enabled: !props.disabled,
          }),
        },
      },
      styleMapping: {
        cssProperties: ['width', 'padding', 'borderColor', 'borderRadius', 'fontSize'],
      },
    };

    // Card Component
    this.registry['Card'] = {
      name: 'Card',
      type: 'container',
      defaultProps: {
        variant: 'elevated',
        padding: 16,
      },
      platformMappings: {
        react: {
          component: 'Card',
          import: '@mui/material',
          propsTransform: (props) => ({
            variant: props.variant === 'elevated' ? 'elevation' : 'outlined',
            elevation: props.variant === 'elevated' ? 2 : 0,
          }),
        },
        flutter: {
          widget: 'Card',
          import: 'package:flutter/material.dart',
          propsTransform: (props) => ({
            elevation: props.variant === 'elevated' ? '2.0' : '0.0',
            child: 'Container(...)',
          }),
        },
        swiftui: {
          view: 'VStack',
          modifierTransform: (props) => [
            `.padding(${props.padding})`,
            `.background(Color.white)`,
            `.cornerRadius(8)`,
            props.variant === 'elevated' ? `.shadow(radius: 2)` : '',
          ],
        },
        compose: {
          composable: 'Card',
          import: 'androidx.compose.material3',
          propsTransform: (props) => ({
            modifier: 'Modifier.fillMaxWidth()',
            elevation: props.variant === 'elevated' ? 'CardDefaults.cardElevation(2.dp)' : 'CardDefaults.cardElevation(0.dp)',
          }),
        },
      },
      styleMapping: {
        cssProperties: ['backgroundColor', 'padding', 'borderRadius', 'boxShadow'],
      },
    };

    // Text Component
    this.registry['Text'] = {
      name: 'Text',
      type: 'content',
      defaultProps: {
        variant: 'body1',
        color: 'textPrimary',
      },
      platformMappings: {
        react: {
          component: 'Typography',
          import: '@mui/material',
          propsTransform: (props) => ({
            variant: props.variant,
            color: props.color,
            children: props.children,
          }),
        },
        flutter: {
          widget: 'Text',
          import: 'package:flutter/material.dart',
          propsTransform: (props) => ({
            style: 'TextStyle(fontSize: 16)',
          }),
        },
        swiftui: {
          view: 'Text',
          modifierTransform: (props) => [
            props.variant === 'h1' ? `.font(.largeTitle)` : `.font(.body)`,
            `.foregroundColor(.primary)`,
          ],
        },
        compose: {
          composable: 'Text',
          import: 'androidx.compose.material3',
          propsTransform: (props) => ({
            text: props.children || '""',
            style: `MaterialTheme.typography.${props.variant}`,
          }),
        },
      },
      styleMapping: {
        cssProperties: ['fontSize', 'fontWeight', 'color', 'lineHeight'],
      },
    };

    // Container Component
    this.registry['Container'] = {
      name: 'Container',
      type: 'layout',
      defaultProps: {
        padding: 0,
        margin: 0,
      },
      platformMappings: {
        react: {
          component: 'Box',
          import: '@mui/material',
          propsTransform: (props) => ({
            sx: {
              padding: props.padding,
              margin: props.margin,
            },
          }),
        },
        flutter: {
          widget: 'Container',
          import: 'package:flutter/material.dart',
          propsTransform: (props) => ({
            padding: `EdgeInsets.all(${props.padding})`,
            margin: `EdgeInsets.all(${props.margin})`,
          }),
        },
        swiftui: {
          view: 'VStack',
          modifierTransform: (props) => [
            `.padding(${props.padding})`,
          ],
        },
        compose: {
          composable: 'Box',
          import: 'androidx.compose.foundation.layout',
          propsTransform: (props) => ({
            modifier: `Modifier.padding(${props.padding}.dp)`,
          }),
        },
      },
      styleMapping: {
        cssProperties: ['padding', 'margin', 'width', 'height', 'backgroundColor'],
      },
    };

    // Image Component
    this.registry['Image'] = {
      name: 'Image',
      type: 'media',
      defaultProps: {
        alt: '',
        objectFit: 'cover',
      },
      platformMappings: {
        react: {
          component: 'img',
          import: '',
          propsTransform: (props) => ({
            src: props.src,
            alt: props.alt,
            style: { objectFit: props.objectFit, width: '100%' },
          }),
        },
        flutter: {
          widget: 'Image.network',
          import: 'package:flutter/material.dart',
          propsTransform: (props) => ({
            url: `'${props.src}'`,
            fit: 'BoxFit.cover',
          }),
        },
        swiftui: {
          view: 'AsyncImage',
          modifierTransform: (props) => [
            `.resizable()`,
            `.aspectRatio(contentMode: .fill)`,
          ],
        },
        compose: {
          composable: 'AsyncImage',
          import: 'coil.compose',
          propsTransform: (props) => ({
            model: `"${props.src}"`,
            contentDescription: `"${props.alt}"`,
            contentScale: 'ContentScale.Crop',
          }),
        },
      },
      styleMapping: {
        cssProperties: ['width', 'height', 'objectFit', 'borderRadius'],
      },
    };
  }

  // ============================================================================
  // Component Registry Management
  // ============================================================================

  public registerComponent(component: UniversalComponent): void {
    this.registry[component.name] = component;
  }

  public getComponent(name: string): UniversalComponent | undefined {
    return this.registry[name];
  }

  public getAllComponents(): UniversalComponent[] {
    return Object.values(this.registry);
  }

  // ============================================================================
  // Code Generation
  // ============================================================================

  public generateCode(spec: ComponentSpec, platform: TargetPlatform): CodeGenerationResult {
    switch (platform) {
      case 'react':
        return this.generateReactCode(spec);
      case 'flutter':
        return this.generateFlutterCode(spec);
      case 'swiftui':
        return this.generateSwiftUICode(spec);
      case 'compose':
        return this.generateComposeCode(spec);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  // ============================================================================
  // React Code Generation
  // ============================================================================

  private generateReactCode(spec: ComponentSpec): CodeGenerationResult {
    const component = this.registry[spec.type];
    if (!component || !component.platformMappings.react) {
      throw new Error(`Component ${spec.type} not found or doesn't support React`);
    }

    const mapping = component.platformMappings.react;
    const imports = new Set<string>();
    const dependencies = new Set<string>();

    if (mapping.import) {
      imports.add(mapping.import);
      dependencies.add(mapping.import.split('/')[0]);
    }

    const componentName = mapping.component;
    let props = spec.props;

    if (mapping.propsTransform) {
      props = mapping.propsTransform(props);
    }

    const propsString = this.buildReactPropsString(props);
    const childrenCode = spec.children ? spec.children.map(child => this.generateReactCode(child).code).join('\n') : '';

    let code = `<${componentName}${propsString}>`;
    if (childrenCode) {
      code += `\n${this.indent(childrenCode, 1)}\n`;
    } else if (props.children) {
      code += props.children;
    }
    code += `</${componentName}>`;

    let styles = '';
    if (spec.styles) {
      styles = this.compileReactStyles(spec.styles, spec.type);
    }

    return {
      platform: 'react',
      code,
      styles,
      imports: Array.from(imports),
      dependencies: Array.from(dependencies),
    };
  }

  private buildReactPropsString(props: Record<string, any>): string {
    const propStrings: string[] = [];

    Object.entries(props).forEach(([key, value]) => {
      if (key === 'children') return;

      if (typeof value === 'string') {
        propStrings.push(`${key}="${value}"`);
      } else if (typeof value === 'boolean') {
        if (value) {
          propStrings.push(key);
        }
      } else if (typeof value === 'object') {
        propStrings.push(`${key}={${JSON.stringify(value)}}`);
      } else {
        propStrings.push(`${key}={${value}}`);
      }
    });

    return propStrings.length > 0 ? ' ' + propStrings.join(' ') : '';
  }

  private compileReactStyles(styles: StyleSpec, componentType: string): string {
    if (styles.inline) {
      return JSON.stringify(styles.inline);
    }

    if (styles.className) {
      return `.${styles.className} {\n${this.cssObjectToString(styles.inline || {})}\n}`;
    }

    return '';
  }

  // ============================================================================
  // Flutter Code Generation
  // ============================================================================

  private generateFlutterCode(spec: ComponentSpec): CodeGenerationResult {
    const component = this.registry[spec.type];
    if (!component || !component.platformMappings.flutter) {
      throw new Error(`Component ${spec.type} not found or doesn't support Flutter`);
    }

    const mapping = component.platformMappings.flutter;
    const imports = new Set<string>([mapping.import]);

    let props = spec.props;
    if (mapping.propsTransform) {
      props = mapping.propsTransform(props);
    }

    const propsString = this.buildFlutterPropsString(props);
    const childrenCode = spec.children ? spec.children.map(child => this.generateFlutterCode(child).code).join(',\n') : '';

    let code = `${mapping.widget}(`;
    if (propsString) {
      code += `\n${this.indent(propsString, 1)}`;
    }
    if (childrenCode) {
      code += `,\n${this.indent(`children: [`, 1)}\n${this.indent(childrenCode, 2)}\n${this.indent(']', 1)}`;
    }
    code += '\n)';

    return {
      platform: 'flutter',
      code,
      imports: Array.from(imports),
      dependencies: ['flutter'],
    };
  }

  private buildFlutterPropsString(props: Record<string, any>): string {
    const propStrings: string[] = [];

    Object.entries(props).forEach(([key, value]) => {
      if (typeof value === 'string' && !value.startsWith('EdgeInsets') && !value.startsWith('Text')) {
        propStrings.push(`${key}: '${value}'`);
      } else {
        propStrings.push(`${key}: ${value}`);
      }
    });

    return propStrings.join(',\n');
  }

  // ============================================================================
  // SwiftUI Code Generation
  // ============================================================================

  private generateSwiftUICode(spec: ComponentSpec): CodeGenerationResult {
    const component = this.registry[spec.type];
    if (!component || !component.platformMappings.swiftui) {
      throw new Error(`Component ${spec.type} not found or doesn't support SwiftUI`);
    }

    const mapping = component.platformMappings.swiftui;
    const imports = new Set<string>(['SwiftUI']);

    if (mapping.import) {
      imports.add(mapping.import);
    }

    const viewName = mapping.view;
    let code = '';

    if (spec.type === 'Text') {
      code = `${viewName}("${spec.props.children || ''}")`;
    } else if (spec.type === 'Button') {
      code = `${viewName}("${spec.props.label || ''}")${spec.props.onPress ? ' { ' + spec.props.onPress + ' }' : ' { }'}`;
    } else {
      const childrenCode = spec.children ? spec.children.map(child => this.generateSwiftUICode(child).code).join('\n') : '';

      if (childrenCode) {
        code = `${viewName} {\n${this.indent(childrenCode, 1)}\n}`;
      } else {
        code = viewName;
      }
    }

    if (mapping.modifierTransform) {
      const modifiers = mapping.modifierTransform(spec.props).filter(m => m);
      if (modifiers.length > 0) {
        code += '\n' + modifiers.map(m => this.indent(m, 0)).join('\n');
      }
    }

    return {
      platform: 'swiftui',
      code,
      imports: Array.from(imports),
      dependencies: [],
    };
  }

  // ============================================================================
  // Jetpack Compose Code Generation
  // ============================================================================

  private generateComposeCode(spec: ComponentSpec): CodeGenerationResult {
    const component = this.registry[spec.type];
    if (!component || !component.platformMappings.compose) {
      throw new Error(`Component ${spec.type} not found or doesn't support Compose`);
    }

    const mapping = component.platformMappings.compose;
    const imports = new Set<string>([mapping.import]);

    let props = spec.props;
    if (mapping.propsTransform) {
      props = mapping.propsTransform(props);
    }

    const propsString = this.buildComposePropsString(props);
    const childrenCode = spec.children ? spec.children.map(child => this.generateComposeCode(child).code).join('\n') : '';

    let code = `${mapping.composable}(`;
    if (propsString) {
      code += `\n${this.indent(propsString, 1)}`;
    }
    code += '\n)';

    if (childrenCode) {
      code += ` {\n${this.indent(childrenCode, 1)}\n}`;
    }

    return {
      platform: 'compose',
      code,
      imports: Array.from(imports),
      dependencies: ['androidx.compose'],
    };
  }

  private buildComposePropsString(props: Record<string, any>): string {
    const propStrings: string[] = [];

    Object.entries(props).forEach(([key, value]) => {
      if (typeof value === 'string' && !value.startsWith('Modifier') && !value.startsWith('{')) {
        propStrings.push(`${key} = "${value}"`);
      } else {
        propStrings.push(`${key} = ${value}`);
      }
    });

    return propStrings.join(',\n');
  }

  // ============================================================================
  // Style Compilation
  // ============================================================================

  public compileStyles(spec: ComponentSpec, format: StyleFormat): string {
    switch (format) {
      case 'css':
        return this.compileToCSSs(spec);
      case 'tailwind':
        return this.compileToTailwind(spec);
      case 'styled-components':
        return this.compileToStyledComponents(spec);
      case 'flutter-theme':
        return this.compileToFlutterTheme(spec);
      case 'swiftui-modifiers':
        return this.compileToSwiftUIModifiers(spec);
      default:
        throw new Error(`Unsupported style format: ${format}`);
    }
  }

  private compileToCSSs(spec: ComponentSpec): string {
    if (!spec.styles?.inline) return '';

    const className = spec.styles.className || `component-${spec.id}`;
    return `.${className} {\n${this.cssObjectToString(spec.styles.inline)}\n}`;
  }

  private compileToTailwind(spec: ComponentSpec): string {
    const component = this.registry[spec.type];
    if (!component?.styleMapping.tailwindClasses) return '';

    const classes = component.styleMapping.tailwindClasses(spec.props);
    return classes.join(' ');
  }

  private compileToStyledComponents(spec: ComponentSpec): string {
    if (!spec.styles?.inline) return '';

    return `const StyledComponent = styled.div\`
${this.cssObjectToString(spec.styles.inline, '  ')}
\`;`;
  }

  private compileToFlutterTheme(spec: ComponentSpec): string {
    const component = this.registry[spec.type];
    if (!component?.styleMapping.flutterTheme) return '';

    const theme = component.styleMapping.flutterTheme(spec.props);
    return JSON.stringify(theme, null, 2);
  }

  private compileToSwiftUIModifiers(spec: ComponentSpec): string {
    const component = this.registry[spec.type];
    if (!component?.platformMappings.swiftui?.modifierTransform) return '';

    const modifiers = component.platformMappings.swiftui.modifierTransform(spec.props);
    return modifiers.filter(m => m).join('\n');
  }

  private cssObjectToString(obj: Record<string, any>, indent: string = '  '): string {
    return Object.entries(obj)
      .map(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${indent}${cssKey}: ${value};`;
      })
      .join('\n');
  }

  // ============================================================================
  // Layout Engine
  // ============================================================================

  public calculateLayout(spec: ComponentSpec, constraints: { width: number; height: number }): LayoutCalculation {
    const root = this.createYogaNode(spec);
    root.calculateLayout(constraints.width, constraints.height, Yoga.DIRECTION_LTR);

    return this.extractLayoutFromYoga(root);
  }

  private createYogaNode(spec: ComponentSpec): YogaNode {
    const node = Yoga.Node.create(this.yogaConfig);

    if (spec.layout) {
      this.applyLayoutToYoga(node, spec.layout);
    }

    if (spec.styles?.inline) {
      this.applyStylesToYoga(node, spec.styles.inline);
    }

    if (spec.children) {
      spec.children.forEach((child, index) => {
        const childNode = this.createYogaNode(child);
        node.insertChild(childNode, index);
      });
    }

    return node;
  }

  private applyLayoutToYoga(node: YogaNode, layout: LayoutSpec): void {
    if (layout.direction) {
      node.setFlexDirection(
        layout.direction === 'row' ? Yoga.FLEX_DIRECTION_ROW :
        layout.direction === 'column' ? Yoga.FLEX_DIRECTION_COLUMN :
        layout.direction === 'row-reverse' ? Yoga.FLEX_DIRECTION_ROW_REVERSE :
        Yoga.FLEX_DIRECTION_COLUMN_REVERSE
      );
    }

    if (layout.justifyContent) {
      const justify = {
        'flex-start': Yoga.JUSTIFY_FLEX_START,
        'center': Yoga.JUSTIFY_CENTER,
        'flex-end': Yoga.JUSTIFY_FLEX_END,
        'space-between': Yoga.JUSTIFY_SPACE_BETWEEN,
        'space-around': Yoga.JUSTIFY_SPACE_AROUND,
        'space-evenly': Yoga.JUSTIFY_SPACE_EVENLY,
      }[layout.justifyContent];
      if (justify !== undefined) {
        node.setJustifyContent(justify);
      }
    }

    if (layout.alignItems) {
      const align = {
        'flex-start': Yoga.ALIGN_FLEX_START,
        'center': Yoga.ALIGN_CENTER,
        'flex-end': Yoga.ALIGN_FLEX_END,
        'stretch': Yoga.ALIGN_STRETCH,
        'baseline': Yoga.ALIGN_BASELINE,
      }[layout.alignItems];
      if (align !== undefined) {
        node.setAlignItems(align);
      }
    }

    if (layout.wrap) {
      node.setFlexWrap(Yoga.WRAP_WRAP);
    }

    if (layout.gap) {
      node.setGap(Yoga.GUTTER_ALL, layout.gap);
    }
  }

  private applyStylesToYoga(node: YogaNode, styles: Record<string, any>): void {
    if (styles.width) {
      const width = parseFloat(styles.width);
      if (!isNaN(width)) {
        node.setWidth(width);
      } else if (styles.width === '100%') {
        node.setWidthPercent(100);
      }
    }

    if (styles.height) {
      const height = parseFloat(styles.height);
      if (!isNaN(height)) {
        node.setHeight(height);
      } else if (styles.height === '100%') {
        node.setHeightPercent(100);
      }
    }

    if (styles.padding) {
      const padding = parseFloat(styles.padding);
      if (!isNaN(padding)) {
        node.setPadding(Yoga.EDGE_ALL, padding);
      }
    }

    if (styles.margin) {
      const margin = parseFloat(styles.margin);
      if (!isNaN(margin)) {
        node.setMargin(Yoga.EDGE_ALL, margin);
      }
    }

    if (styles.flex) {
      node.setFlex(parseFloat(styles.flex) || 1);
    }
  }

  private extractLayoutFromYoga(node: YogaNode): LayoutCalculation {
    const layout: LayoutCalculation = {
      width: node.getComputedWidth(),
      height: node.getComputedHeight(),
      x: node.getComputedLeft(),
      y: node.getComputedTop(),
    };

    const childCount = node.getChildCount();
    if (childCount > 0) {
      layout.children = [];
      for (let i = 0; i < childCount; i++) {
        const child = node.getChild(i);
        layout.children.push(this.extractLayoutFromYoga(child));
      }
    }

    return layout;
  }

  // ============================================================================
  // Platform Polyfills
  // ============================================================================

  public generatePolyfills(spec: ComponentSpec, platform: TargetPlatform): string[] {
    const polyfills: string[] = [];
    const component = this.registry[spec.type];

    if (component?.polyfills) {
      polyfills.push(...component.polyfills);
    }

    if (platform === 'react') {
      if (spec.props.lazy) {
        polyfills.push('intersection-observer');
      }
    }

    if (spec.children) {
      spec.children.forEach(child => {
        polyfills.push(...this.generatePolyfills(child, platform));
      });
    }

    return Array.from(new Set(polyfills));
  }

  // ============================================================================
  // Feature Detection
  // ============================================================================

  public detectFeatureSupport(feature: string): boolean {
    if (typeof window === 'undefined') return false;

    const featureChecks: Record<string, () => boolean> = {
      'flexbox': () => CSS.supports('display', 'flex'),
      'grid': () => CSS.supports('display', 'grid'),
      'intersection-observer': () => 'IntersectionObserver' in window,
      'resize-observer': () => 'ResizeObserver' in window,
      'custom-properties': () => CSS.supports('--test', '0'),
      'backdrop-filter': () => CSS.supports('backdrop-filter', 'blur(10px)'),
      'aspect-ratio': () => CSS.supports('aspect-ratio', '16/9'),
      'container-queries': () => CSS.supports('container-type', 'inline-size'),
    };

    const check = featureChecks[feature];
    return check ? check() : false;
  }

  // ============================================================================
  // Code Splitting & Lazy Loading
  // ============================================================================

  public generateLazyLoadCode(spec: ComponentSpec, platform: TargetPlatform): CodeGenerationResult {
    switch (platform) {
      case 'react':
        return {
          platform: 'react',
          code: `const ${spec.type} = React.lazy(() => import('./${spec.type}'));`,
          imports: ['react'],
          dependencies: ['react'],
        };
      case 'flutter':
        return {
          platform: 'flutter',
          code: `// Flutter uses deferred loading: import '${spec.type}.dart' deferred as ${spec.type};`,
          imports: [],
          dependencies: [],
        };
      default:
        return this.generateCode(spec, platform);
    }
  }

  // ============================================================================
  // Tree Shaking
  // ============================================================================

  public performTreeShaking(code: string, usedExports: string[]): TreeShakingResult {
    try {
      const ast = parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
      });

      const used = new Set<string>(usedExports);
      const unused = new Set<string>();

      const visitor = {
        ExportNamedDeclaration(path: any) {
          const declaration = path.node.declaration;
          if (declaration && t.isVariableDeclaration(declaration)) {
            declaration.declarations.forEach((decl: any) => {
              if (t.isIdentifier(decl.id)) {
                if (!used.has(decl.id.name)) {
                  unused.add(decl.id.name);
                  path.remove();
                }
              }
            });
          }
        },
        ExportDefaultDeclaration(path: any) {
          if (!used.has('default')) {
            unused.add('default');
            path.remove();
          }
        },
      };

      const output = generate(ast, {}, code);
      const sizeBefore = code.length;
      const sizeAfter = output.code.length;
      const savings = ((sizeBefore - sizeAfter) / sizeBefore) * 100;

      return {
        used,
        unused,
        optimizedCode: output.code,
        sizeBefore,
        sizeAfter,
        savings,
      };
    } catch (error) {
      return {
        used: new Set(usedExports),
        unused: new Set(),
        optimizedCode: code,
        sizeBefore: code.length,
        sizeAfter: code.length,
        savings: 0,
      };
    }
  }

  // ============================================================================
  // Conditional Rendering
  // ============================================================================

  public applyConditionalRendering(spec: ComponentSpec, context: Record<string, any>): ComponentSpec {
    if (!spec.conditionalRendering) return spec;

    const applicableCondition = spec.conditionalRendering.find(condition => {
      try {
        const fn = new Function(...Object.keys(context), `return ${condition.condition}`);
        return fn(...Object.values(context));
      } catch (error) {
        return false;
      }
    });

    if (applicableCondition?.component) {
      return applicableCondition.component;
    }

    if (applicableCondition?.fallback) {
      return applicableCondition.fallback;
    }

    return spec;
  }

  // ============================================================================
  // Component Composition
  // ============================================================================

  public composeComponents(specs: ComponentSpec[]): ComponentSpec {
    if (specs.length === 0) {
      throw new Error('Cannot compose empty array of components');
    }

    if (specs.length === 1) {
      return specs[0];
    }

    const root = specs[0];
    root.children = specs.slice(1);

    return root;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private indent(text: string, level: number): string {
    const indentation = '  '.repeat(level);
    return text.split('\n').map(line => indentation + line).join('\n');
  }

  public dispose(): void {
    if (this.yogaConfig) {
      this.yogaConfig.free();
    }
  }
}

export default PlatformAdaptiveComponents;
