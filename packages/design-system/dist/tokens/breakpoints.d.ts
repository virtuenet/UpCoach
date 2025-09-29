/**
 * UpCoach Design System - Breakpoint Tokens
 * Responsive design breakpoints and media queries
 */
export declare const breakpoints: {
    readonly xs: 0;
    readonly sm: 600;
    readonly md: 960;
    readonly lg: 1280;
    readonly xl: 1920;
};
export declare const viewports: {
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
export declare const devices: {
    readonly mobileS: 320;
    readonly mobileM: 375;
    readonly mobileL: 425;
    readonly tablet: 768;
    readonly laptop: 1024;
    readonly laptopL: 1440;
    readonly desktop: 1920;
    readonly desktopL: 2560;
};
export declare const media: {
    readonly up: (breakpoint: keyof typeof breakpoints) => string;
    readonly down: (breakpoint: keyof typeof breakpoints) => string;
    readonly between: (min: keyof typeof breakpoints, max: keyof typeof breakpoints) => string;
    readonly only: (breakpoint: keyof typeof breakpoints) => string;
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
export declare const container: {
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
export declare const grid: {
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
export declare const isBreakpoint: (breakpoint: keyof typeof breakpoints, width: number) => boolean;
export declare const getCurrentBreakpoint: (width: number) => keyof typeof breakpoints;
export declare const responsiveValue: <T>(values: Partial<Record<keyof typeof breakpoints, T>>, currentBreakpoint: keyof typeof breakpoints) => T | undefined;
declare const _default: {
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
        readonly up: (breakpoint: keyof typeof breakpoints) => string;
        readonly down: (breakpoint: keyof typeof breakpoints) => string;
        readonly between: (min: keyof typeof breakpoints, max: keyof typeof breakpoints) => string;
        readonly only: (breakpoint: keyof typeof breakpoints) => string;
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
    isBreakpoint: (breakpoint: keyof typeof breakpoints, width: number) => boolean;
    getCurrentBreakpoint: (width: number) => keyof typeof breakpoints;
    responsiveValue: <T>(values: Partial<Record<keyof typeof breakpoints, T>>, currentBreakpoint: keyof typeof breakpoints) => T | undefined;
};
export default _default;
//# sourceMappingURL=breakpoints.d.ts.map