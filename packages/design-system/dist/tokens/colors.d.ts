/**
 * UpCoach Design System - Color Tokens
 * Unified color palette for consistent visual language across all platforms
 */
export declare const colors: {
  readonly brand: {
    readonly primary: '#3b82f6';
    readonly primaryLight: '#60a5fa';
    readonly primaryDark: '#2563eb';
    readonly secondary: '#8b5cf6';
    readonly secondaryLight: '#a78bfa';
    readonly secondaryDark: '#7c3aed';
    readonly tertiary: '#06b6d4';
  };
  readonly semantic: {
    readonly success: '#10b981';
    readonly successLight: '#34d399';
    readonly successDark: '#059669';
    readonly successBackground: '#ecfdf5';
    readonly warning: '#f59e0b';
    readonly warningLight: '#fbbf24';
    readonly warningDark: '#d97706';
    readonly warningBackground: '#fffbeb';
    readonly error: '#ef4444';
    readonly errorLight: '#f87171';
    readonly errorDark: '#dc2626';
    readonly errorBackground: '#fef2f2';
    readonly info: '#3b82f6';
    readonly infoLight: '#60a5fa';
    readonly infoDark: '#2563eb';
    readonly infoBackground: '#eff6ff';
  };
  readonly neutral: {
    readonly 0: '#ffffff';
    readonly 50: '#f9fafb';
    readonly 100: '#f3f4f6';
    readonly 200: '#e5e7eb';
    readonly 300: '#d1d5db';
    readonly 400: '#9ca3af';
    readonly 500: '#6b7280';
    readonly 600: '#4b5563';
    readonly 700: '#374151';
    readonly 800: '#1f2937';
    readonly 900: '#111827';
    readonly 1000: '#000000';
  };
  readonly text: {
    readonly primary: '#111827';
    readonly secondary: '#6b7280';
    readonly tertiary: '#9ca3af';
    readonly disabled: '#d1d5db';
    readonly inverse: '#ffffff';
    readonly link: '#3b82f6';
    readonly linkHover: '#2563eb';
  };
  readonly background: {
    readonly primary: '#ffffff';
    readonly secondary: '#f9fafb';
    readonly tertiary: '#f3f4f6';
    readonly elevated: '#ffffff';
    readonly overlay: 'rgba(0, 0, 0, 0.5)';
    readonly hover: '#f3f4f6';
    readonly pressed: '#e5e7eb';
  };
  readonly border: {
    readonly default: '#e5e7eb';
    readonly light: '#f3f4f6';
    readonly dark: '#d1d5db';
    readonly focus: '#3b82f6';
    readonly error: '#ef4444';
  };
  readonly chart: {
    readonly blue: '#3b82f6';
    readonly purple: '#8b5cf6';
    readonly cyan: '#06b6d4';
    readonly green: '#10b981';
    readonly yellow: '#f59e0b';
    readonly red: '#ef4444';
    readonly pink: '#ec4899';
    readonly indigo: '#6366f1';
    readonly teal: '#14b8a6';
    readonly orange: '#fb923c';
  };
  readonly alpha: {
    readonly black5: 'rgba(0, 0, 0, 0.05)';
    readonly black10: 'rgba(0, 0, 0, 0.10)';
    readonly black20: 'rgba(0, 0, 0, 0.20)';
    readonly black30: 'rgba(0, 0, 0, 0.30)';
    readonly black50: 'rgba(0, 0, 0, 0.50)';
    readonly white10: 'rgba(255, 255, 255, 0.10)';
    readonly white20: 'rgba(255, 255, 255, 0.20)';
    readonly white50: 'rgba(255, 255, 255, 0.50)';
    readonly white80: 'rgba(255, 255, 255, 0.80)';
  };
};
export declare const withOpacity: (hexColor: string, opacity: number) => string;
export declare const darkColors: {
  readonly text: {
    readonly primary: '#f9fafb';
    readonly secondary: '#d1d5db';
    readonly tertiary: '#9ca3af';
    readonly disabled: '#6b7280';
    readonly inverse: '#111827';
    readonly link: '#60a5fa';
    readonly linkHover: '#93c5fd';
  };
  readonly background: {
    readonly primary: '#111827';
    readonly secondary: '#1f2937';
    readonly tertiary: '#374151';
    readonly elevated: '#1f2937';
    readonly overlay: 'rgba(0, 0, 0, 0.7)';
    readonly hover: '#374151';
    readonly pressed: '#4b5563';
  };
  readonly border: {
    readonly default: '#374151';
    readonly light: '#1f2937';
    readonly dark: '#4b5563';
    readonly focus: '#60a5fa';
    readonly error: '#f87171';
  };
};
export default colors;
//# sourceMappingURL=colors.d.ts.map
