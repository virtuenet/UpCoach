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
export { media, container, grid, isBreakpoint, getCurrentBreakpoint, responsiveValue } from './breakpoints';
export declare const tokens: {
    readonly colors: any;
    readonly typography: any;
    readonly spacing: any;
    readonly effects: any;
    readonly breakpoints: any;
};
export default tokens;
//# sourceMappingURL=index.d.ts.map