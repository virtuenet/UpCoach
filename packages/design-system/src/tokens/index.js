/**
 * UpCoach Design System - Token Exports
 * Central export point for all design tokens
 */
export * from './colors';
export * from './typography';
export * from './spacing';
export * from './effects';
export * from './breakpoints';
// Re-export as named collections
export { default as colors } from './colors';
export { default as typography } from './typography';
export { default as spacing } from './spacing';
export { default as effects } from './effects';
export { default as breakpoints } from './breakpoints';
// Convenience exports
export { darkColors, withOpacity } from './colors';
export { responsiveTypography } from './typography';
export { componentSpacing, layout, getSpacing, createSpacing } from './spacing';
export { shadows, borders, transitions, animation, blur, opacity, zIndex } from './effects';
export { media, container, grid, isBreakpoint, getCurrentBreakpoint, responsiveValue, } from './breakpoints';
// Import defaults for tokens object
import colorsDefault from './colors';
import typographyDefault from './typography';
import spacingDefault from './spacing';
import effectsDefault from './effects';
import breakpointsDefault from './breakpoints';
// Complete tokens object
export const tokens = {
    colors: colorsDefault,
    typography: typographyDefault,
    spacing: spacingDefault,
    effects: effectsDefault,
    breakpoints: breakpointsDefault,
};
export default tokens;
//# sourceMappingURL=index.js.map