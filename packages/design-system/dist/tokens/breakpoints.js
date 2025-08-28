/**
 * UpCoach Design System - Breakpoint Tokens
 * Responsive design breakpoints and media queries
 */
// Breakpoint values
export const breakpoints = {
    xs: 0,
    sm: 600,
    md: 960,
    lg: 1280,
    xl: 1920, // Large desktop
};
// Viewport ranges
export const viewports = {
    mobile: { min: 0, max: 599 },
    tablet: { min: 600, max: 959 },
    desktop: { min: 960, max: 1279 },
    wide: { min: 1280, max: 1919 },
    ultrawide: { min: 1920, max: Infinity },
};
// Device-specific breakpoints
export const devices = {
    mobileS: 320,
    mobileM: 375,
    mobileL: 425,
    tablet: 768,
    laptop: 1024,
    laptopL: 1440,
    desktop: 1920,
    desktopL: 2560,
};
// Media query helpers
export const media = {
    // Minimum width queries (mobile-first)
    up: (breakpoint) => `@media (min-width: ${breakpoints[breakpoint]}px)`,
    // Maximum width queries
    down: (breakpoint) => `@media (max-width: ${breakpoints[breakpoint] - 1}px)`,
    // Range queries
    between: (min, max) => `@media (min-width: ${breakpoints[min]}px) and (max-width: ${breakpoints[max] - 1}px)`,
    // Only queries (exact range)
    only: (breakpoint) => {
        const breakpointKeys = Object.keys(breakpoints);
        const currentIndex = breakpointKeys.indexOf(breakpoint);
        const nextBreakpoint = breakpointKeys[currentIndex + 1];
        if (!nextBreakpoint) {
            return `@media (min-width: ${breakpoints[breakpoint]}px)`;
        }
        return `@media (min-width: ${breakpoints[breakpoint]}px) and (max-width: ${breakpoints[nextBreakpoint] - 1}px)`;
    },
    // Device queries
    device: {
        mobile: '@media (max-width: 599px)',
        tablet: '@media (min-width: 600px) and (max-width: 959px)',
        desktop: '@media (min-width: 960px)',
        touch: '@media (hover: none) and (pointer: coarse)',
        mouse: '@media (hover: hover) and (pointer: fine)',
    },
    // Orientation queries
    orientation: {
        portrait: '@media (orientation: portrait)',
        landscape: '@media (orientation: landscape)',
    },
    // High resolution queries
    retina: '@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)',
    // Dark mode
    darkMode: '@media (prefers-color-scheme: dark)',
    lightMode: '@media (prefers-color-scheme: light)',
    // Reduced motion
    reducedMotion: '@media (prefers-reduced-motion: reduce)',
    motion: '@media (prefers-reduced-motion: no-preference)',
    // Print
    print: '@media print',
};
// Container queries (for container query support)
export const container = {
    xs: '20rem',
    sm: '24rem',
    md: '28rem',
    lg: '32rem',
    xl: '36rem',
    '2xl': '42rem',
    '3xl': '48rem',
    '4xl': '56rem',
    '5xl': '64rem',
    '6xl': '72rem',
    '7xl': '80rem', // 1280px
};
// Grid system
export const grid = {
    // Number of columns at each breakpoint
    columns: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 12,
        xl: 12,
    },
    // Gutter widths at each breakpoint
    gutters: {
        xs: 16,
        sm: 16,
        md: 24,
        lg: 24,
        xl: 24,
    },
    // Container max widths at each breakpoint
    maxWidths: {
        xs: '100%',
        sm: '540px',
        md: '720px',
        lg: '1140px',
        xl: '1320px',
    },
    // Container padding at each breakpoint
    padding: {
        xs: 16,
        sm: 24,
        md: 32,
        lg: 32,
        xl: 32,
    },
};
// Helper functions
export const isBreakpoint = (breakpoint, width) => {
    const breakpointKeys = Object.keys(breakpoints);
    const currentIndex = breakpointKeys.indexOf(breakpoint);
    const minWidth = breakpoints[breakpoint];
    const nextBreakpoint = breakpointKeys[currentIndex + 1];
    const maxWidth = nextBreakpoint ? breakpoints[nextBreakpoint] - 1 : Infinity;
    return width >= minWidth && width <= maxWidth;
};
export const getCurrentBreakpoint = (width) => {
    const breakpointKeys = Object.keys(breakpoints).reverse();
    for (const key of breakpointKeys) {
        if (width >= breakpoints[key]) {
            return key;
        }
    }
    return 'xs';
};
// Responsive value helper
export const responsiveValue = (values, currentBreakpoint) => {
    const breakpointKeys = Object.keys(breakpoints);
    const currentIndex = breakpointKeys.indexOf(currentBreakpoint);
    // Try to find value for current breakpoint or fall back to smaller ones
    for (let i = currentIndex; i >= 0; i--) {
        const key = breakpointKeys[i];
        if (key in values) {
            return values[key];
        }
    }
    return undefined;
};
export default {
    breakpoints,
    viewports,
    devices,
    media,
    container,
    grid,
    isBreakpoint,
    getCurrentBreakpoint,
    responsiveValue,
};
