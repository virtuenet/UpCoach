/**
 * UpCoach Design System - Spacing Tokens
 * Unified spacing system for consistent layouts
 */
export declare const spacing: {
    readonly 0: "0";
    readonly 0.5: `${number}px`;
    readonly 1: `${number}px`;
    readonly 1.5: `${number}px`;
    readonly 2: `${number}px`;
    readonly 2.5: `${number}px`;
    readonly 3: `${number}px`;
    readonly 3.5: `${number}px`;
    readonly 4: `${number}px`;
    readonly 5: `${number}px`;
    readonly 6: `${number}px`;
    readonly 7: `${number}px`;
    readonly 8: `${number}px`;
    readonly 9: `${number}px`;
    readonly 10: `${number}px`;
    readonly 11: `${number}px`;
    readonly 12: `${number}px`;
    readonly 14: `${number}px`;
    readonly 16: `${number}px`;
    readonly 20: `${number}px`;
    readonly 24: `${number}px`;
    readonly 28: `${number}px`;
    readonly 32: `${number}px`;
    readonly 36: `${number}px`;
    readonly 40: `${number}px`;
    readonly 44: `${number}px`;
    readonly 48: `${number}px`;
    readonly 52: `${number}px`;
    readonly 56: `${number}px`;
    readonly 60: `${number}px`;
    readonly 64: `${number}px`;
    readonly 72: `${number}px`;
    readonly 80: `${number}px`;
    readonly 96: `${number}px`;
    readonly none: "0";
    readonly xs: `${number}px`;
    readonly sm: `${number}px`;
    readonly md: `${number}px`;
    readonly lg: `${number}px`;
    readonly xl: `${number}px`;
    readonly '2xl': `${number}px`;
    readonly '3xl': `${number}px`;
    readonly '4xl': `${number}px`;
    readonly '5xl': `${number}px`;
};
export declare const componentSpacing: {
    readonly button: {
        readonly xs: {
            readonly x: `${number}px`;
            readonly y: `${number}px`;
        };
        readonly sm: {
            readonly x: `${number}px`;
            readonly y: `${number}px`;
        };
        readonly md: {
            readonly x: `${number}px`;
            readonly y: `${number}px`;
        };
        readonly lg: {
            readonly x: `${number}px`;
            readonly y: `${number}px`;
        };
        readonly xl: {
            readonly x: `${number}px`;
            readonly y: `${number}px`;
        };
    };
    readonly card: {
        readonly sm: `${number}px`;
        readonly md: `${number}px`;
        readonly lg: `${number}px`;
        readonly xl: `${number}px`;
    };
    readonly input: {
        readonly sm: {
            readonly x: `${number}px`;
            readonly y: `${number}px`;
        };
        readonly md: {
            readonly x: `${number}px`;
            readonly y: `${number}px`;
        };
        readonly lg: {
            readonly x: `${number}px`;
            readonly y: `${number}px`;
        };
    };
    readonly modal: {
        readonly header: `${number}px`;
        readonly body: `${number}px`;
        readonly footer: `${number}px`;
    };
    readonly section: {
        readonly sm: `${number}px`;
        readonly md: `${number}px`;
        readonly lg: `${number}px`;
        readonly xl: `${number}px`;
    };
    readonly grid: {
        readonly xs: `${number}px`;
        readonly sm: `${number}px`;
        readonly md: `${number}px`;
        readonly lg: `${number}px`;
        readonly xl: `${number}px`;
    };
    readonly stack: {
        readonly xs: `${number}px`;
        readonly sm: `${number}px`;
        readonly md: `${number}px`;
        readonly lg: `${number}px`;
        readonly xl: `${number}px`;
    };
    readonly inline: {
        readonly xs: `${number}px`;
        readonly sm: `${number}px`;
        readonly md: `${number}px`;
        readonly lg: `${number}px`;
        readonly xl: `${number}px`;
    };
};
export declare const layout: {
    readonly maxWidth: {
        readonly xs: "320px";
        readonly sm: "640px";
        readonly md: "768px";
        readonly lg: "1024px";
        readonly xl: "1280px";
        readonly '2xl': "1536px";
        readonly full: "100%";
        readonly prose: "65ch";
    };
    readonly containerPadding: {
        readonly mobile: `${number}px`;
        readonly tablet: `${number}px`;
        readonly desktop: `${number}px`;
    };
    readonly pageMargin: {
        readonly mobile: `${number}px`;
        readonly tablet: `${number}px`;
        readonly desktop: `${number}px`;
    };
    readonly sidebar: {
        readonly collapsed: "64px";
        readonly narrow: "200px";
        readonly default: "240px";
        readonly wide: "280px";
    };
    readonly header: {
        readonly mobile: "56px";
        readonly desktop: "64px";
    };
    readonly footer: {
        readonly default: "240px";
        readonly minimal: "120px";
    };
};
export declare const getSpacing: (value: keyof typeof spacing) => string;
export declare const createSpacing: (top: keyof typeof spacing, right?: keyof typeof spacing, bottom?: keyof typeof spacing, left?: keyof typeof spacing) => string;
export default spacing;
//# sourceMappingURL=spacing.d.ts.map