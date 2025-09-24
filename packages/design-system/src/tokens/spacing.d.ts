/**
 * UpCoach Design System - Spacing Tokens
 * Unified spacing system for consistent layouts
 */
export declare const spacing: {
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
export declare const componentSpacing: {
    readonly button: {
        readonly xs: {
            readonly x: "8px";
            readonly y: "4px";
        };
        readonly sm: {
            readonly x: "12px";
            readonly y: "6px";
        };
        readonly md: {
            readonly x: "16px";
            readonly y: "8px";
        };
        readonly lg: {
            readonly x: "24px";
            readonly y: "12px";
        };
        readonly xl: {
            readonly x: "32px";
            readonly y: "16px";
        };
    };
    readonly card: {
        readonly sm: "12px";
        readonly md: "16px";
        readonly lg: "24px";
        readonly xl: "32px";
    };
    readonly input: {
        readonly sm: {
            readonly x: "12px";
            readonly y: "6px";
        };
        readonly md: {
            readonly x: "12px";
            readonly y: "8px";
        };
        readonly lg: {
            readonly x: "16px";
            readonly y: "12px";
        };
    };
    readonly modal: {
        readonly header: "24px";
        readonly body: "24px";
        readonly footer: "16px";
    };
    readonly section: {
        readonly sm: "32px";
        readonly md: "48px";
        readonly lg: "64px";
        readonly xl: "80px";
    };
    readonly grid: {
        readonly xs: "8px";
        readonly sm: "12px";
        readonly md: "16px";
        readonly lg: "24px";
        readonly xl: "32px";
    };
    readonly stack: {
        readonly xs: "4px";
        readonly sm: "8px";
        readonly md: "16px";
        readonly lg: "24px";
        readonly xl: "32px";
    };
    readonly inline: {
        readonly xs: "4px";
        readonly sm: "8px";
        readonly md: "12px";
        readonly lg: "16px";
        readonly xl: "24px";
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
        readonly mobile: "16px";
        readonly tablet: "24px";
        readonly desktop: "32px";
    };
    readonly pageMargin: {
        readonly mobile: "16px";
        readonly tablet: "32px";
        readonly desktop: "48px";
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