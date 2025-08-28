/**
 * UpCoach Design System - Typography Tokens
 * Unified typography system for consistent text styling
 */
export const typography = {
    // Font families
    fontFamily: {
        sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        mono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
        display: '"Inter Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    // Font sizes
    fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
        '6xl': '3.75rem',
        '7xl': '4.5rem',
        '8xl': '6rem', // 96px - Extra large display
    },
    // Line heights
    lineHeight: {
        none: 1,
        tight: 1.25,
        snug: 1.375,
        normal: 1.5,
        relaxed: 1.625,
        loose: 2,
    },
    // Font weights
    fontWeight: {
        thin: 100,
        extralight: 200,
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
        black: 900,
    },
    // Letter spacing
    letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.025em',
        normal: '0em',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
    },
    // Text styles (composite styles)
    textStyles: {
        // Display styles
        displayLarge: {
            fontSize: '4.5rem',
            lineHeight: 1,
            fontWeight: 700,
            letterSpacing: '-0.025em',
        },
        displayMedium: {
            fontSize: '3.75rem',
            lineHeight: 1,
            fontWeight: 700,
            letterSpacing: '-0.025em',
        },
        displaySmall: {
            fontSize: '3rem',
            lineHeight: 1.2,
            fontWeight: 600,
            letterSpacing: '-0.025em',
        },
        // Heading styles
        h1: {
            fontSize: '2.25rem',
            lineHeight: 1.2,
            fontWeight: 700,
            letterSpacing: '-0.025em',
        },
        h2: {
            fontSize: '1.875rem',
            lineHeight: 1.3,
            fontWeight: 700,
            letterSpacing: '-0.025em',
        },
        h3: {
            fontSize: '1.5rem',
            lineHeight: 1.3,
            fontWeight: 600,
            letterSpacing: '-0.025em',
        },
        h4: {
            fontSize: '1.25rem',
            lineHeight: 1.4,
            fontWeight: 600,
            letterSpacing: '0em',
        },
        h5: {
            fontSize: '1.125rem',
            lineHeight: 1.4,
            fontWeight: 600,
            letterSpacing: '0em',
        },
        h6: {
            fontSize: '1rem',
            lineHeight: 1.5,
            fontWeight: 600,
            letterSpacing: '0em',
        },
        // Body styles
        bodyLarge: {
            fontSize: '1.125rem',
            lineHeight: 1.625,
            fontWeight: 400,
            letterSpacing: '0em',
        },
        bodyMedium: {
            fontSize: '1rem',
            lineHeight: 1.5,
            fontWeight: 400,
            letterSpacing: '0em',
        },
        bodySmall: {
            fontSize: '0.875rem',
            lineHeight: 1.5,
            fontWeight: 400,
            letterSpacing: '0em',
        },
        // Label styles
        labelLarge: {
            fontSize: '0.875rem',
            lineHeight: 1.5,
            fontWeight: 500,
            letterSpacing: '0.025em',
        },
        labelMedium: {
            fontSize: '0.75rem',
            lineHeight: 1.5,
            fontWeight: 500,
            letterSpacing: '0.05em',
        },
        labelSmall: {
            fontSize: '0.6875rem',
            lineHeight: 1.5,
            fontWeight: 500,
            letterSpacing: '0.05em',
        },
        // Button text
        button: {
            fontSize: '0.875rem',
            lineHeight: 1.5,
            fontWeight: 500,
            letterSpacing: '0.025em',
            textTransform: 'none',
        },
        buttonLarge: {
            fontSize: '1rem',
            lineHeight: 1.5,
            fontWeight: 500,
            letterSpacing: '0.025em',
            textTransform: 'none',
        },
        buttonSmall: {
            fontSize: '0.75rem',
            lineHeight: 1.5,
            fontWeight: 500,
            letterSpacing: '0.025em',
            textTransform: 'none',
        },
        // Caption and overline
        caption: {
            fontSize: '0.75rem',
            lineHeight: 1.5,
            fontWeight: 400,
            letterSpacing: '0.05em',
        },
        overline: {
            fontSize: '0.75rem',
            lineHeight: 1.5,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
        },
        // Code
        code: {
            fontSize: '0.875rem',
            lineHeight: 1.5,
            fontWeight: 400,
            fontFamily: '"SF Mono", Monaco, Consolas, monospace',
        },
    },
};
// Helper function to create responsive typography
export const responsiveTypography = {
    display: {
        mobile: typography.textStyles.displaySmall,
        tablet: typography.textStyles.displayMedium,
        desktop: typography.textStyles.displayLarge,
    },
    h1: {
        mobile: {
            ...typography.textStyles.h2,
            fontSize: '1.75rem',
        },
        tablet: typography.textStyles.h1,
        desktop: typography.textStyles.h1,
    },
    h2: {
        mobile: {
            ...typography.textStyles.h3,
            fontSize: '1.375rem',
        },
        tablet: typography.textStyles.h2,
        desktop: typography.textStyles.h2,
    },
};
export default typography;
