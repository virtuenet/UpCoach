/**
 * UpCoach Design System Tokens
 * Centralized design tokens for consistent cross-platform UI/UX
 * Following Material Design 3 and iOS Human Interface Guidelines
 */
export declare const colors: {
    primary: {
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
        950: string;
    };
    secondary: {
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
        950: string;
    };
    success: {
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
        950: string;
    };
    warning: {
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
        950: string;
    };
    error: {
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
        950: string;
    };
    info: {
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
        950: string;
    };
    neutral: {
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
        950: string;
    };
    surface: {
        background: string;
        paper: string;
        elevated: string;
        overlay: string;
        divider: string;
    };
    text: {
        primary: string;
        secondary: string;
        disabled: string;
        hint: string;
        inverse: string;
    };
};
export declare const typography: {
    fontFamily: {
        sans: string;
        mono: string;
    };
    fontSize: {
        xs: string;
        sm: string;
        base: string;
        lg: string;
        xl: string;
        '2xl': string;
        '3xl': string;
        '4xl': string;
        '5xl': string;
        '6xl': string;
        '7xl': string;
    };
    fontWeight: {
        thin: number;
        light: number;
        regular: number;
        medium: number;
        semibold: number;
        bold: number;
        extrabold: number;
        black: number;
    };
    lineHeight: {
        none: number;
        tight: number;
        snug: number;
        normal: number;
        relaxed: number;
        loose: number;
    };
    letterSpacing: {
        tighter: string;
        tight: string;
        normal: string;
        wide: string;
        wider: string;
        widest: string;
    };
};
export declare const spacing: {
    0: string;
    px: string;
    0.5: string;
    1: string;
    1.5: string;
    2: string;
    2.5: string;
    3: string;
    3.5: string;
    4: string;
    5: string;
    6: string;
    7: string;
    8: string;
    9: string;
    10: string;
    11: string;
    12: string;
    14: string;
    16: string;
    20: string;
    24: string;
    28: string;
    32: string;
    36: string;
    40: string;
    44: string;
    48: string;
    52: string;
    56: string;
    60: string;
    64: string;
    72: string;
    80: string;
    96: string;
};
export declare const borderRadius: {
    none: string;
    sm: string;
    default: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    full: string;
};
export declare const shadows: {
    none: string;
    sm: string;
    default: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    inner: string;
    elevation: {
        1: string;
        2: string;
        3: string;
        4: string;
        6: string;
        8: string;
        12: string;
        16: string;
        24: string;
    };
};
export declare const transitions: {
    duration: {
        shortest: number;
        shorter: number;
        short: number;
        standard: number;
        complex: number;
        enteringScreen: number;
        leavingScreen: number;
    };
    easing: {
        easeInOut: string;
        easeOut: string;
        easeIn: string;
        sharp: string;
    };
    create: (properties?: string | string[], options?: {
        duration?: number;
        easing?: string;
        delay?: number;
    }) => string;
};
export declare const breakpoints: any;
export declare const zIndex: {
    mobileStepper: number;
    fab: number;
    speedDial: number;
    appBar: number;
    drawer: number;
    modal: number;
    snackbar: number;
    tooltip: number;
};
export declare const animations: {
    fadeIn: {
        from: {
            opacity: number;
        };
        to: {
            opacity: number;
        };
    };
    fadeOut: {
        from: {
            opacity: number;
        };
        to: {
            opacity: number;
        };
    };
    slideIn: {
        from: {
            transform: string;
        };
        to: {
            transform: string;
        };
    };
    slideOut: {
        from: {
            transform: string;
        };
        to: {
            transform: string;
        };
    };
    slideUp: {
        from: {
            transform: string;
        };
        to: {
            transform: string;
        };
    };
    slideDown: {
        from: {
            transform: string;
        };
        to: {
            transform: string;
        };
    };
    scaleIn: {
        from: {
            transform: string;
        };
        to: {
            transform: string;
        };
    };
    scaleOut: {
        from: {
            transform: string;
        };
        to: {
            transform: string;
        };
    };
    rotate: {
        from: {
            transform: string;
        };
        to: {
            transform: string;
        };
    };
    pulse: {
        '0%, 100%': {
            opacity: number;
        };
        '50%': {
            opacity: number;
        };
    };
    bounce: {
        '0%, 100%': {
            transform: string;
        };
        '50%': {
            transform: string;
        };
    };
    shake: {
        '0%, 100%': {
            transform: string;
        };
        '10%, 30%, 50%, 70%, 90%': {
            transform: string;
        };
        '20%, 40%, 60%, 80%': {
            transform: string;
        };
    };
};
export declare const components: {
    button: {
        height: {
            sm: string;
            md: string;
            lg: string;
        };
        padding: {
            sm: string;
            md: string;
            lg: string;
        };
        fontSize: {
            sm: string;
            md: string;
            lg: string;
        };
    };
    input: {
        height: {
            sm: string;
            md: string;
            lg: string;
        };
        padding: string;
        borderWidth: string;
        borderRadius: string;
    };
    card: {
        padding: string;
        borderRadius: string;
        shadow: string;
    };
    modal: {
        maxWidth: {
            sm: string;
            md: string;
            lg: string;
            xl: string;
        };
        padding: string;
        borderRadius: string;
    };
};
export declare const a11y: {
    focusRing: {
        width: string;
        offset: string;
        color: string;
        style: string;
    };
    minimumTouchTarget: string;
    contrastRatio: {
        normal: number;
        large: number;
        enhanced: number;
    };
};
export declare const designTokens: {
    colors: {
        primary: {
            50: string;
            100: string;
            200: string;
            300: string;
            400: string;
            500: string;
            600: string;
            700: string;
            800: string;
            900: string;
            950: string;
        };
        secondary: {
            50: string;
            100: string;
            200: string;
            300: string;
            400: string;
            500: string;
            600: string;
            700: string;
            800: string;
            900: string;
            950: string;
        };
        success: {
            50: string;
            100: string;
            200: string;
            300: string;
            400: string;
            500: string;
            600: string;
            700: string;
            800: string;
            900: string;
            950: string;
        };
        warning: {
            50: string;
            100: string;
            200: string;
            300: string;
            400: string;
            500: string;
            600: string;
            700: string;
            800: string;
            900: string;
            950: string;
        };
        error: {
            50: string;
            100: string;
            200: string;
            300: string;
            400: string;
            500: string;
            600: string;
            700: string;
            800: string;
            900: string;
            950: string;
        };
        info: {
            50: string;
            100: string;
            200: string;
            300: string;
            400: string;
            500: string;
            600: string;
            700: string;
            800: string;
            900: string;
            950: string;
        };
        neutral: {
            50: string;
            100: string;
            200: string;
            300: string;
            400: string;
            500: string;
            600: string;
            700: string;
            800: string;
            900: string;
            950: string;
        };
        surface: {
            background: string;
            paper: string;
            elevated: string;
            overlay: string;
            divider: string;
        };
        text: {
            primary: string;
            secondary: string;
            disabled: string;
            hint: string;
            inverse: string;
        };
    };
    typography: {
        fontFamily: {
            sans: string;
            mono: string;
        };
        fontSize: {
            xs: string;
            sm: string;
            base: string;
            lg: string;
            xl: string;
            '2xl': string;
            '3xl': string;
            '4xl': string;
            '5xl': string;
            '6xl': string;
            '7xl': string;
        };
        fontWeight: {
            thin: number;
            light: number;
            regular: number;
            medium: number;
            semibold: number;
            bold: number;
            extrabold: number;
            black: number;
        };
        lineHeight: {
            none: number;
            tight: number;
            snug: number;
            normal: number;
            relaxed: number;
            loose: number;
        };
        letterSpacing: {
            tighter: string;
            tight: string;
            normal: string;
            wide: string;
            wider: string;
            widest: string;
        };
    };
    spacing: {
        0: string;
        px: string;
        0.5: string;
        1: string;
        1.5: string;
        2: string;
        2.5: string;
        3: string;
        3.5: string;
        4: string;
        5: string;
        6: string;
        7: string;
        8: string;
        9: string;
        10: string;
        11: string;
        12: string;
        14: string;
        16: string;
        20: string;
        24: string;
        28: string;
        32: string;
        36: string;
        40: string;
        44: string;
        48: string;
        52: string;
        56: string;
        60: string;
        64: string;
        72: string;
        80: string;
        96: string;
    };
    borderRadius: {
        none: string;
        sm: string;
        default: string;
        md: string;
        lg: string;
        xl: string;
        '2xl': string;
        '3xl': string;
        full: string;
    };
    shadows: {
        none: string;
        sm: string;
        default: string;
        md: string;
        lg: string;
        xl: string;
        '2xl': string;
        inner: string;
        elevation: {
            1: string;
            2: string;
            3: string;
            4: string;
            6: string;
            8: string;
            12: string;
            16: string;
            24: string;
        };
    };
    transitions: {
        duration: {
            shortest: number;
            shorter: number;
            short: number;
            standard: number;
            complex: number;
            enteringScreen: number;
            leavingScreen: number;
        };
        easing: {
            easeInOut: string;
            easeOut: string;
            easeIn: string;
            sharp: string;
        };
        create: (properties?: string | string[], options?: {
            duration?: number;
            easing?: string;
            delay?: number;
        }) => string;
    };
    breakpoints: any;
    zIndex: {
        mobileStepper: number;
        fab: number;
        speedDial: number;
        appBar: number;
        drawer: number;
        modal: number;
        snackbar: number;
        tooltip: number;
    };
    animations: {
        fadeIn: {
            from: {
                opacity: number;
            };
            to: {
                opacity: number;
            };
        };
        fadeOut: {
            from: {
                opacity: number;
            };
            to: {
                opacity: number;
            };
        };
        slideIn: {
            from: {
                transform: string;
            };
            to: {
                transform: string;
            };
        };
        slideOut: {
            from: {
                transform: string;
            };
            to: {
                transform: string;
            };
        };
        slideUp: {
            from: {
                transform: string;
            };
            to: {
                transform: string;
            };
        };
        slideDown: {
            from: {
                transform: string;
            };
            to: {
                transform: string;
            };
        };
        scaleIn: {
            from: {
                transform: string;
            };
            to: {
                transform: string;
            };
        };
        scaleOut: {
            from: {
                transform: string;
            };
            to: {
                transform: string;
            };
        };
        rotate: {
            from: {
                transform: string;
            };
            to: {
                transform: string;
            };
        };
        pulse: {
            '0%, 100%': {
                opacity: number;
            };
            '50%': {
                opacity: number;
            };
        };
        bounce: {
            '0%, 100%': {
                transform: string;
            };
            '50%': {
                transform: string;
            };
        };
        shake: {
            '0%, 100%': {
                transform: string;
            };
            '10%, 30%, 50%, 70%, 90%': {
                transform: string;
            };
            '20%, 40%, 60%, 80%': {
                transform: string;
            };
        };
    };
    components: {
        button: {
            height: {
                sm: string;
                md: string;
                lg: string;
            };
            padding: {
                sm: string;
                md: string;
                lg: string;
            };
            fontSize: {
                sm: string;
                md: string;
                lg: string;
            };
        };
        input: {
            height: {
                sm: string;
                md: string;
                lg: string;
            };
            padding: string;
            borderWidth: string;
            borderRadius: string;
        };
        card: {
            padding: string;
            borderRadius: string;
            shadow: string;
        };
        modal: {
            maxWidth: {
                sm: string;
                md: string;
                lg: string;
                xl: string;
            };
            padding: string;
            borderRadius: string;
        };
    };
    a11y: {
        focusRing: {
            width: string;
            offset: string;
            color: string;
            style: string;
        };
        minimumTouchTarget: string;
        contrastRatio: {
            normal: number;
            large: number;
            enhanced: number;
        };
    };
};
export default designTokens;
//# sourceMappingURL=design-tokens.d.ts.map