/**
 * UpCoach Design System - Effects Tokens
 * Shadows, borders, and other visual effects
 */
export const shadows = {
    // Elevation levels
    none: 'none',
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
    // Component-specific shadows
    card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    dropdown: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    modal: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    button: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    buttonHover: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    // Colored shadows
    primary: '0 10px 15px -3px rgba(59, 130, 246, 0.2), 0 4px 6px -4px rgba(59, 130, 246, 0.1)',
    success: '0 10px 15px -3px rgba(16, 185, 129, 0.2), 0 4px 6px -4px rgba(16, 185, 129, 0.1)',
    error: '0 10px 15px -3px rgba(239, 68, 68, 0.2), 0 4px 6px -4px rgba(239, 68, 68, 0.1)',
};
export const borders = {
    // Border widths
    width: {
        none: '0',
        thin: '1px',
        medium: '2px',
        thick: '4px',
    },
    // Border styles
    style: {
        none: 'none',
        solid: 'solid',
        dashed: 'dashed',
        dotted: 'dotted',
    },
    // Border radius
    radius: {
        none: '0',
        sm: '0.125rem', // 2px
        md: '0.25rem', // 4px
        lg: '0.5rem', // 8px
        xl: '0.75rem', // 12px
        '2xl': '1rem', // 16px
        '3xl': '1.5rem', // 24px
        full: '9999px', // Fully rounded
        circle: '50%', // Perfect circle
    },
};
export const transitions = {
    // Durations
    duration: {
        instant: '0ms',
        fast: '150ms',
        base: '250ms',
        slow: '350ms',
        slower: '500ms',
        slowest: '750ms',
    },
    // Timing functions (easing)
    timing: {
        linear: 'linear',
        ease: 'ease',
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
    // Common transitions
    all: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    colors: 'background-color 250ms cubic-bezier(0.4, 0, 0.2, 1), border-color 250ms cubic-bezier(0.4, 0, 0.2, 1), color 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: 'opacity 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    shadow: 'box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)',
};
export const animation = {
    // Keyframes
    keyframes: {
        fadeIn: {
            from: { opacity: 0 },
            to: { opacity: 1 },
        },
        fadeOut: {
            from: { opacity: 1 },
            to: { opacity: 0 },
        },
        slideUp: {
            from: { transform: 'translateY(100%)', opacity: 0 },
            to: { transform: 'translateY(0)', opacity: 1 },
        },
        slideDown: {
            from: { transform: 'translateY(-100%)', opacity: 0 },
            to: { transform: 'translateY(0)', opacity: 1 },
        },
        slideLeft: {
            from: { transform: 'translateX(100%)', opacity: 0 },
            to: { transform: 'translateX(0)', opacity: 1 },
        },
        slideRight: {
            from: { transform: 'translateX(-100%)', opacity: 0 },
            to: { transform: 'translateX(0)', opacity: 1 },
        },
        scaleIn: {
            from: { transform: 'scale(0.95)', opacity: 0 },
            to: { transform: 'scale(1)', opacity: 1 },
        },
        scaleOut: {
            from: { transform: 'scale(1)', opacity: 1 },
            to: { transform: 'scale(0.95)', opacity: 0 },
        },
        spin: {
            from: { transform: 'rotate(0deg)' },
            to: { transform: 'rotate(360deg)' },
        },
        pulse: {
            '0%, 100%': { opacity: 1 },
            '50%': { opacity: 0.5 },
        },
        bounce: {
            '0%, 100%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(-25%)' },
        },
        shimmer: {
            from: { backgroundPosition: '-200% 0' },
            to: { backgroundPosition: '200% 0' },
        },
    },
    // Animation presets
    presets: {
        fadeIn: 'fadeIn 250ms ease-out',
        fadeOut: 'fadeOut 250ms ease-out',
        slideUp: 'slideUp 350ms cubic-bezier(0, 0, 0.2, 1)',
        slideDown: 'slideDown 350ms cubic-bezier(0, 0, 0.2, 1)',
        scaleIn: 'scaleIn 250ms cubic-bezier(0, 0, 0.2, 1)',
        scaleOut: 'scaleOut 250ms cubic-bezier(0, 0, 0.2, 1)',
        spin: 'spin 1s linear infinite',
        pulse: 'pulse 2s ease-in-out infinite',
        bounce: 'bounce 1s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
    },
};
export const blur = {
    none: '0',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    '3xl': '40px',
};
export const opacity = {
    0: '0',
    5: '0.05',
    10: '0.1',
    20: '0.2',
    25: '0.25',
    30: '0.3',
    40: '0.4',
    50: '0.5',
    60: '0.6',
    70: '0.7',
    75: '0.75',
    80: '0.8',
    90: '0.9',
    95: '0.95',
    100: '1',
};
// Z-index system
export const zIndex = {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
};
export default {
    shadows,
    borders,
    transitions,
    animation,
    blur,
    opacity,
    zIndex,
};
//# sourceMappingURL=effects.js.map