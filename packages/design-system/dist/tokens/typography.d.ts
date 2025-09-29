/**
 * UpCoach Design System - Typography Tokens
 * Unified typography system for consistent text styling
 */
export declare const typography: {
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
export declare const responsiveTypography: {
    readonly display: {
        readonly mobile: {
            readonly fontSize: "3rem";
            readonly lineHeight: 1.2;
            readonly fontWeight: 600;
            readonly letterSpacing: "-0.025em";
        };
        readonly tablet: {
            readonly fontSize: "3.75rem";
            readonly lineHeight: 1;
            readonly fontWeight: 700;
            readonly letterSpacing: "-0.025em";
        };
        readonly desktop: {
            readonly fontSize: "4.5rem";
            readonly lineHeight: 1;
            readonly fontWeight: 700;
            readonly letterSpacing: "-0.025em";
        };
    };
    readonly h1: {
        readonly mobile: {
            readonly fontSize: "1.75rem";
            readonly lineHeight: 1.3;
            readonly fontWeight: 700;
            readonly letterSpacing: "-0.025em";
        };
        readonly tablet: {
            readonly fontSize: "2.25rem";
            readonly lineHeight: 1.2;
            readonly fontWeight: 700;
            readonly letterSpacing: "-0.025em";
        };
        readonly desktop: {
            readonly fontSize: "2.25rem";
            readonly lineHeight: 1.2;
            readonly fontWeight: 700;
            readonly letterSpacing: "-0.025em";
        };
    };
    readonly h2: {
        readonly mobile: {
            readonly fontSize: "1.375rem";
            readonly lineHeight: 1.3;
            readonly fontWeight: 600;
            readonly letterSpacing: "-0.025em";
        };
        readonly tablet: {
            readonly fontSize: "1.875rem";
            readonly lineHeight: 1.3;
            readonly fontWeight: 700;
            readonly letterSpacing: "-0.025em";
        };
        readonly desktop: {
            readonly fontSize: "1.875rem";
            readonly lineHeight: 1.3;
            readonly fontWeight: 700;
            readonly letterSpacing: "-0.025em";
        };
    };
};
export default typography;
//# sourceMappingURL=typography.d.ts.map