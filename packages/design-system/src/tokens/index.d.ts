/**
 * UpCoach Design System - Token Exports
 * Central export point for all design tokens
 */
export * from './colors';
export * from './typography';
export * from './spacing';
export * from './effects';
export * from './breakpoints';
export { default as colors } from './colors';
export { default as typography } from './typography';
export { default as spacing } from './spacing';
export { default as effects } from './effects';
export { default as breakpoints } from './breakpoints';
export { darkColors, withOpacity } from './colors';
export { responsiveTypography } from './typography';
export { componentSpacing, layout, getSpacing, createSpacing } from './spacing';
export { shadows, borders, transitions, animation, blur, opacity, zIndex } from './effects';
export { media, container, grid, isBreakpoint, getCurrentBreakpoint, responsiveValue, } from './breakpoints';
export declare const tokens: {
    readonly colors: {
        readonly brand: {
            readonly primary: "#3b82f6";
            readonly primaryLight: "#60a5fa";
            readonly primaryDark: "#2563eb";
            readonly secondary: "#8b5cf6";
            readonly secondaryLight: "#a78bfa";
            readonly secondaryDark: "#7c3aed";
            readonly tertiary: "#06b6d4";
        };
        readonly semantic: {
            readonly success: "#10b981";
            readonly successLight: "#34d399";
            readonly successDark: "#059669";
            readonly successBackground: "#ecfdf5";
            readonly warning: "#f59e0b";
            readonly warningLight: "#fbbf24";
            readonly warningDark: "#d97706";
            readonly warningBackground: "#fffbeb";
            readonly error: "#ef4444";
            readonly errorLight: "#f87171";
            readonly errorDark: "#dc2626";
            readonly errorBackground: "#fef2f2";
            readonly info: "#3b82f6";
            readonly infoLight: "#60a5fa";
            readonly infoDark: "#2563eb";
            readonly infoBackground: "#eff6ff";
        };
        readonly neutral: {
            readonly 0: "#ffffff";
            readonly 50: "#f9fafb";
            readonly 100: "#f3f4f6";
            readonly 200: "#e5e7eb";
            readonly 300: "#d1d5db";
            readonly 400: "#9ca3af";
            readonly 500: "#6b7280";
            readonly 600: "#4b5563";
            readonly 700: "#374151";
            readonly 800: "#1f2937";
            readonly 900: "#111827";
            readonly 1000: "#000000";
        };
        readonly text: {
            readonly primary: "#111827";
            readonly secondary: "#6b7280";
            readonly tertiary: "#9ca3af";
            readonly disabled: "#d1d5db";
            readonly inverse: "#ffffff";
            readonly link: "#3b82f6";
            readonly linkHover: "#2563eb";
        };
        readonly background: {
            readonly primary: "#ffffff";
            readonly secondary: "#f9fafb";
            readonly tertiary: "#f3f4f6";
            readonly elevated: "#ffffff";
            readonly overlay: "rgba(0, 0, 0, 0.5)";
            readonly hover: "#f3f4f6";
            readonly pressed: "#e5e7eb";
        };
        readonly border: {
            readonly default: "#e5e7eb";
            readonly light: "#f3f4f6";
            readonly dark: "#d1d5db";
            readonly focus: "#3b82f6";
            readonly error: "#ef4444";
        };
        readonly chart: {
            readonly blue: "#3b82f6";
            readonly purple: "#8b5cf6";
            readonly cyan: "#06b6d4";
            readonly green: "#10b981";
            readonly yellow: "#f59e0b";
            readonly red: "#ef4444";
            readonly pink: "#ec4899";
            readonly indigo: "#6366f1";
            readonly teal: "#14b8a6";
            readonly orange: "#fb923c";
        };
        readonly alpha: {
            readonly black5: "rgba(0, 0, 0, 0.05)";
            readonly black10: "rgba(0, 0, 0, 0.10)";
            readonly black20: "rgba(0, 0, 0, 0.20)";
            readonly black30: "rgba(0, 0, 0, 0.30)";
            readonly black50: "rgba(0, 0, 0, 0.50)";
            readonly white10: "rgba(255, 255, 255, 0.10)";
            readonly white20: "rgba(255, 255, 255, 0.20)";
            readonly white50: "rgba(255, 255, 255, 0.50)";
            readonly white80: "rgba(255, 255, 255, 0.80)";
        };
    };
    readonly typography: {
        readonly fontFamily: {
            readonly sans: "\"Inter\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif";
            readonly mono: "\"SF Mono\", Monaco, \"Cascadia Code\", \"Roboto Mono\", Consolas, \"Courier New\", monospace";
            readonly display: "\"Inter Display\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif";
        };
        readonly fontSize: {
            readonly xs: "0.75rem";
            readonly sm: "0.875rem";
            readonly base: "1rem";
            readonly lg: "1.125rem";
            readonly xl: "1.25rem";
            readonly '2xl': "1.5rem";
            readonly '3xl': "1.875rem";
            readonly '4xl': "2.25rem";
            readonly '5xl': "3rem";
            readonly '6xl': "3.75rem";
            readonly '7xl': "4.5rem";
            readonly '8xl': "6rem";
        };
        readonly lineHeight: {
            readonly none: 1;
            readonly tight: 1.25;
            readonly snug: 1.375;
            readonly normal: 1.5;
            readonly relaxed: 1.625;
            readonly loose: 2;
        };
        readonly fontWeight: {
            readonly thin: 100;
            readonly extralight: 200;
            readonly light: 300;
            readonly normal: 400;
            readonly medium: 500;
            readonly semibold: 600;
            readonly bold: 700;
            readonly extrabold: 800;
            readonly black: 900;
        };
        readonly letterSpacing: {
            readonly tighter: "-0.05em";
            readonly tight: "-0.025em";
            readonly normal: "0em";
            readonly wide: "0.025em";
            readonly wider: "0.05em";
            readonly widest: "0.1em";
        };
        readonly textStyles: {
            readonly displayLarge: {
                readonly fontSize: "4.5rem";
                readonly lineHeight: 1;
                readonly fontWeight: 700;
                readonly letterSpacing: "-0.025em";
            };
            readonly displayMedium: {
                readonly fontSize: "3.75rem";
                readonly lineHeight: 1;
                readonly fontWeight: 700;
                readonly letterSpacing: "-0.025em";
            };
            readonly displaySmall: {
                readonly fontSize: "3rem";
                readonly lineHeight: 1.2;
                readonly fontWeight: 600;
                readonly letterSpacing: "-0.025em";
            };
            readonly h1: {
                readonly fontSize: "2.25rem";
                readonly lineHeight: 1.2;
                readonly fontWeight: 700;
                readonly letterSpacing: "-0.025em";
            };
            readonly h2: {
                readonly fontSize: "1.875rem";
                readonly lineHeight: 1.3;
                readonly fontWeight: 700;
                readonly letterSpacing: "-0.025em";
            };
            readonly h3: {
                readonly fontSize: "1.5rem";
                readonly lineHeight: 1.3;
                readonly fontWeight: 600;
                readonly letterSpacing: "-0.025em";
            };
            readonly h4: {
                readonly fontSize: "1.25rem";
                readonly lineHeight: 1.4;
                readonly fontWeight: 600;
                readonly letterSpacing: "0em";
            };
            readonly h5: {
                readonly fontSize: "1.125rem";
                readonly lineHeight: 1.4;
                readonly fontWeight: 600;
                readonly letterSpacing: "0em";
            };
            readonly h6: {
                readonly fontSize: "1rem";
                readonly lineHeight: 1.5;
                readonly fontWeight: 600;
                readonly letterSpacing: "0em";
            };
            readonly bodyLarge: {
                readonly fontSize: "1.125rem";
                readonly lineHeight: 1.625;
                readonly fontWeight: 400;
                readonly letterSpacing: "0em";
            };
            readonly bodyMedium: {
                readonly fontSize: "1rem";
                readonly lineHeight: 1.5;
                readonly fontWeight: 400;
                readonly letterSpacing: "0em";
            };
            readonly bodySmall: {
                readonly fontSize: "0.875rem";
                readonly lineHeight: 1.5;
                readonly fontWeight: 400;
                readonly letterSpacing: "0em";
            };
            readonly labelLarge: {
                readonly fontSize: "0.875rem";
                readonly lineHeight: 1.5;
                readonly fontWeight: 500;
                readonly letterSpacing: "0.025em";
            };
            readonly labelMedium: {
                readonly fontSize: "0.75rem";
                readonly lineHeight: 1.5;
                readonly fontWeight: 500;
                readonly letterSpacing: "0.05em";
            };
            readonly labelSmall: {
                readonly fontSize: "0.6875rem";
                readonly lineHeight: 1.5;
                readonly fontWeight: 500;
                readonly letterSpacing: "0.05em";
            };
            readonly button: {
                readonly fontSize: "0.875rem";
                readonly lineHeight: 1.5;
                readonly fontWeight: 500;
                readonly letterSpacing: "0.025em";
                readonly textTransform: "none";
            };
            readonly buttonLarge: {
                readonly fontSize: "1rem";
                readonly lineHeight: 1.5;
                readonly fontWeight: 500;
                readonly letterSpacing: "0.025em";
                readonly textTransform: "none";
            };
            readonly buttonSmall: {
                readonly fontSize: "0.75rem";
                readonly lineHeight: 1.5;
                readonly fontWeight: 500;
                readonly letterSpacing: "0.025em";
                readonly textTransform: "none";
            };
            readonly caption: {
                readonly fontSize: "0.75rem";
                readonly lineHeight: 1.5;
                readonly fontWeight: 400;
                readonly letterSpacing: "0.05em";
            };
            readonly overline: {
                readonly fontSize: "0.75rem";
                readonly lineHeight: 1.5;
                readonly fontWeight: 600;
                readonly letterSpacing: "0.1em";
                readonly textTransform: "uppercase";
            };
            readonly code: {
                readonly fontSize: "0.875rem";
                readonly lineHeight: 1.5;
                readonly fontWeight: 400;
                readonly fontFamily: "\"SF Mono\", Monaco, Consolas, monospace";
            };
        };
    };
    readonly spacing: {
        readonly 0: "0";
        readonly 0.5: "2px";
        readonly 1: "4px";
        readonly 1.5: "6px";
        readonly 2: "8px";
        readonly 2.5: "10px";
        readonly 3: "12px";
        readonly 3.5: "14px";
        readonly 4: "16px";
        readonly 5: "20px";
        readonly 6: "24px";
        readonly 7: "28px";
        readonly 8: "32px";
        readonly 9: "36px";
        readonly 10: "40px";
        readonly 11: "44px";
        readonly 12: "48px";
        readonly 14: "56px";
        readonly 16: "64px";
        readonly 20: "80px";
        readonly 24: "96px";
        readonly 28: "112px";
        readonly 32: "128px";
        readonly 36: "144px";
        readonly 40: "160px";
        readonly 44: "176px";
        readonly 48: "192px";
        readonly 52: "208px";
        readonly 56: "224px";
        readonly 60: "240px";
        readonly 64: "256px";
        readonly 72: "288px";
        readonly 80: "320px";
        readonly 96: "384px";
        readonly none: "0";
        readonly xs: "4px";
        readonly sm: "8px";
        readonly md: "16px";
        readonly lg: "24px";
        readonly xl: "32px";
        readonly '2xl': "48px";
        readonly '3xl': "64px";
        readonly '4xl': "80px";
        readonly '5xl': "96px";
    };
    readonly effects: {
        shadows: {
            readonly none: "none";
            readonly xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
            readonly sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)";
            readonly md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)";
            readonly lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)";
            readonly xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)";
            readonly '2xl': "0 25px 50px -12px rgba(0, 0, 0, 0.25)";
            readonly inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)";
            readonly card: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)";
            readonly dropdown: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)";
            readonly modal: "0 25px 50px -12px rgba(0, 0, 0, 0.25)";
            readonly button: "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
            readonly buttonHover: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)";
            readonly primary: "0 10px 15px -3px rgba(59, 130, 246, 0.2), 0 4px 6px -4px rgba(59, 130, 246, 0.1)";
            readonly success: "0 10px 15px -3px rgba(16, 185, 129, 0.2), 0 4px 6px -4px rgba(16, 185, 129, 0.1)";
            readonly error: "0 10px 15px -3px rgba(239, 68, 68, 0.2), 0 4px 6px -4px rgba(239, 68, 68, 0.1)";
        };
        borders: {
            readonly width: {
                readonly none: "0";
                readonly thin: "1px";
                readonly medium: "2px";
                readonly thick: "4px";
            };
            readonly style: {
                readonly none: "none";
                readonly solid: "solid";
                readonly dashed: "dashed";
                readonly dotted: "dotted";
            };
            readonly radius: {
                readonly none: "0";
                readonly sm: "0.125rem";
                readonly md: "0.25rem";
                readonly lg: "0.5rem";
                readonly xl: "0.75rem";
                readonly '2xl': "1rem";
                readonly '3xl': "1.5rem";
                readonly full: "9999px";
                readonly circle: "50%";
            };
        };
        transitions: {
            readonly duration: {
                readonly instant: "0ms";
                readonly fast: "150ms";
                readonly base: "250ms";
                readonly slow: "350ms";
                readonly slower: "500ms";
                readonly slowest: "750ms";
            };
            readonly timing: {
                readonly linear: "linear";
                readonly ease: "ease";
                readonly easeIn: "cubic-bezier(0.4, 0, 1, 1)";
                readonly easeOut: "cubic-bezier(0, 0, 0.2, 1)";
                readonly easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)";
                readonly bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)";
                readonly sharp: "cubic-bezier(0.4, 0, 0.6, 1)";
            };
            readonly all: "all 250ms cubic-bezier(0.4, 0, 0.2, 1)";
            readonly colors: "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1), border-color 250ms cubic-bezier(0.4, 0, 0.2, 1), color 250ms cubic-bezier(0.4, 0, 0.2, 1)";
            readonly opacity: "opacity 250ms cubic-bezier(0.4, 0, 0.2, 1)";
            readonly shadow: "box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1)";
            readonly transform: "transform 250ms cubic-bezier(0.4, 0, 0.2, 1)";
        };
        animation: {
            readonly keyframes: {
                readonly fadeIn: {
                    readonly from: {
                        readonly opacity: 0;
                    };
                    readonly to: {
                        readonly opacity: 1;
                    };
                };
                readonly fadeOut: {
                    readonly from: {
                        readonly opacity: 1;
                    };
                    readonly to: {
                        readonly opacity: 0;
                    };
                };
                readonly slideUp: {
                    readonly from: {
                        readonly transform: "translateY(100%)";
                        readonly opacity: 0;
                    };
                    readonly to: {
                        readonly transform: "translateY(0)";
                        readonly opacity: 1;
                    };
                };
                readonly slideDown: {
                    readonly from: {
                        readonly transform: "translateY(-100%)";
                        readonly opacity: 0;
                    };
                    readonly to: {
                        readonly transform: "translateY(0)";
                        readonly opacity: 1;
                    };
                };
                readonly slideLeft: {
                    readonly from: {
                        readonly transform: "translateX(100%)";
                        readonly opacity: 0;
                    };
                    readonly to: {
                        readonly transform: "translateX(0)";
                        readonly opacity: 1;
                    };
                };
                readonly slideRight: {
                    readonly from: {
                        readonly transform: "translateX(-100%)";
                        readonly opacity: 0;
                    };
                    readonly to: {
                        readonly transform: "translateX(0)";
                        readonly opacity: 1;
                    };
                };
                readonly scaleIn: {
                    readonly from: {
                        readonly transform: "scale(0.95)";
                        readonly opacity: 0;
                    };
                    readonly to: {
                        readonly transform: "scale(1)";
                        readonly opacity: 1;
                    };
                };
                readonly scaleOut: {
                    readonly from: {
                        readonly transform: "scale(1)";
                        readonly opacity: 1;
                    };
                    readonly to: {
                        readonly transform: "scale(0.95)";
                        readonly opacity: 0;
                    };
                };
                readonly spin: {
                    readonly from: {
                        readonly transform: "rotate(0deg)";
                    };
                    readonly to: {
                        readonly transform: "rotate(360deg)";
                    };
                };
                readonly pulse: {
                    readonly '0%, 100%': {
                        readonly opacity: 1;
                    };
                    readonly '50%': {
                        readonly opacity: 0.5;
                    };
                };
                readonly bounce: {
                    readonly '0%, 100%': {
                        readonly transform: "translateY(0)";
                    };
                    readonly '50%': {
                        readonly transform: "translateY(-25%)";
                    };
                };
                readonly shimmer: {
                    readonly from: {
                        readonly backgroundPosition: "-200% 0";
                    };
                    readonly to: {
                        readonly backgroundPosition: "200% 0";
                    };
                };
            };
            readonly presets: {
                readonly fadeIn: "fadeIn 250ms ease-out";
                readonly fadeOut: "fadeOut 250ms ease-out";
                readonly slideUp: "slideUp 350ms cubic-bezier(0, 0, 0.2, 1)";
                readonly slideDown: "slideDown 350ms cubic-bezier(0, 0, 0.2, 1)";
                readonly scaleIn: "scaleIn 250ms cubic-bezier(0, 0, 0.2, 1)";
                readonly scaleOut: "scaleOut 250ms cubic-bezier(0, 0, 0.2, 1)";
                readonly spin: "spin 1s linear infinite";
                readonly pulse: "pulse 2s ease-in-out infinite";
                readonly bounce: "bounce 1s ease-in-out infinite";
                readonly shimmer: "shimmer 2s linear infinite";
            };
        };
        blur: {
            readonly none: "0";
            readonly sm: "4px";
            readonly md: "8px";
            readonly lg: "12px";
            readonly xl: "16px";
            readonly '2xl': "24px";
            readonly '3xl': "40px";
        };
        opacity: {
            readonly 0: "0";
            readonly 5: "0.05";
            readonly 10: "0.1";
            readonly 20: "0.2";
            readonly 25: "0.25";
            readonly 30: "0.3";
            readonly 40: "0.4";
            readonly 50: "0.5";
            readonly 60: "0.6";
            readonly 70: "0.7";
            readonly 75: "0.75";
            readonly 80: "0.8";
            readonly 90: "0.9";
            readonly 95: "0.95";
            readonly 100: "1";
        };
        zIndex: {
            readonly hide: -1;
            readonly auto: "auto";
            readonly base: 0;
            readonly docked: 10;
            readonly dropdown: 1000;
            readonly sticky: 1100;
            readonly banner: 1200;
            readonly overlay: 1300;
            readonly modal: 1400;
            readonly popover: 1500;
            readonly skipLink: 1600;
            readonly toast: 1700;
            readonly tooltip: 1800;
        };
    };
    readonly breakpoints: {
        breakpoints: {
            readonly xs: 0;
            readonly sm: 600;
            readonly md: 960;
            readonly lg: 1280;
            readonly xl: 1920;
        };
        viewports: {
            readonly mobile: {
                readonly min: 0;
                readonly max: 599;
            };
            readonly tablet: {
                readonly min: 600;
                readonly max: 959;
            };
            readonly desktop: {
                readonly min: 960;
                readonly max: 1279;
            };
            readonly wide: {
                readonly min: 1280;
                readonly max: 1919;
            };
            readonly ultrawide: {
                readonly min: 1920;
                readonly max: number;
            };
        };
        devices: {
            readonly mobileS: 320;
            readonly mobileM: 375;
            readonly mobileL: 425;
            readonly tablet: 768;
            readonly laptop: 1024;
            readonly laptopL: 1440;
            readonly desktop: 1920;
            readonly desktopL: 2560;
        };
        media: {
            readonly up: (breakpoint: keyof typeof import("./breakpoints").breakpoints) => string;
            readonly down: (breakpoint: keyof typeof import("./breakpoints").breakpoints) => string;
            readonly between: (min: keyof typeof import("./breakpoints").breakpoints, max: keyof typeof import("./breakpoints").breakpoints) => string;
            readonly only: (breakpoint: keyof typeof import("./breakpoints").breakpoints) => string;
            readonly device: {
                readonly mobile: "@media (max-width: 599px)";
                readonly tablet: "@media (min-width: 600px) and (max-width: 959px)";
                readonly desktop: "@media (min-width: 960px)";
                readonly touch: "@media (hover: none) and (pointer: coarse)";
                readonly mouse: "@media (hover: hover) and (pointer: fine)";
            };
            readonly orientation: {
                readonly portrait: "@media (orientation: portrait)";
                readonly landscape: "@media (orientation: landscape)";
            };
            readonly retina: "@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)";
            readonly darkMode: "@media (prefers-color-scheme: dark)";
            readonly lightMode: "@media (prefers-color-scheme: light)";
            readonly reducedMotion: "@media (prefers-reduced-motion: reduce)";
            readonly motion: "@media (prefers-reduced-motion: no-preference)";
            readonly print: "@media print";
        };
        container: {
            readonly xs: "20rem";
            readonly sm: "24rem";
            readonly md: "28rem";
            readonly lg: "32rem";
            readonly xl: "36rem";
            readonly '2xl': "42rem";
            readonly '3xl': "48rem";
            readonly '4xl': "56rem";
            readonly '5xl': "64rem";
            readonly '6xl': "72rem";
            readonly '7xl': "80rem";
        };
        grid: {
            readonly columns: {
                readonly xs: 4;
                readonly sm: 8;
                readonly md: 12;
                readonly lg: 12;
                readonly xl: 12;
            };
            readonly gutters: {
                readonly xs: 16;
                readonly sm: 16;
                readonly md: 24;
                readonly lg: 24;
                readonly xl: 24;
            };
            readonly maxWidths: {
                readonly xs: "100%";
                readonly sm: "540px";
                readonly md: "720px";
                readonly lg: "1140px";
                readonly xl: "1320px";
            };
            readonly padding: {
                readonly xs: 16;
                readonly sm: 24;
                readonly md: 32;
                readonly lg: 32;
                readonly xl: 32;
            };
        };
        isBreakpoint: (breakpoint: keyof typeof import("./breakpoints").breakpoints, width: number) => boolean;
        getCurrentBreakpoint: (width: number) => keyof typeof import("./breakpoints").breakpoints;
        responsiveValue: <T>(values: Partial<Record<keyof typeof import("./breakpoints").breakpoints, T>>, currentBreakpoint: keyof typeof import("./breakpoints").breakpoints) => T | undefined;
    };
};
export default tokens;
//# sourceMappingURL=index.d.ts.map