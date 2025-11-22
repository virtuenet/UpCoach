/**
 * UpCoach Design System - MUI Theme Adapter
 * Converts design tokens to MUI theme configuration
 */
import { createTheme } from '@mui/material/styles';
import { colors, typography, spacing, shadows, borders, transitions, zIndex, breakpoints, } from '../tokens';
// Convert our breakpoints to MUI format
const muiBreakpoints = {
    values: breakpoints.breakpoints,
};
// Convert our palette to MUI format
const muiPalette = {
    mode: 'light',
    primary: {
        main: colors.brand.primary,
        light: colors.brand.primaryLight,
        dark: colors.brand.primaryDark,
        contrastText: colors.neutral[0],
    },
    secondary: {
        main: colors.brand.secondary,
        light: colors.brand.secondaryLight,
        dark: colors.brand.secondaryDark,
        contrastText: colors.neutral[0],
    },
    error: {
        main: colors.semantic.error,
        light: colors.semantic.errorLight,
        dark: colors.semantic.errorDark,
        contrastText: colors.neutral[0],
    },
    warning: {
        main: colors.semantic.warning,
        light: colors.semantic.warningLight,
        dark: colors.semantic.warningDark,
        contrastText: colors.neutral[900],
    },
    info: {
        main: colors.semantic.info,
        light: colors.semantic.infoLight,
        dark: colors.semantic.infoDark,
        contrastText: colors.neutral[0],
    },
    success: {
        main: colors.semantic.success,
        light: colors.semantic.successLight,
        dark: colors.semantic.successDark,
        contrastText: colors.neutral[0],
    },
    grey: {
        50: colors.neutral[50],
        100: colors.neutral[100],
        200: colors.neutral[200],
        300: colors.neutral[300],
        400: colors.neutral[400],
        500: colors.neutral[500],
        600: colors.neutral[600],
        700: colors.neutral[700],
        800: colors.neutral[800],
        900: colors.neutral[900],
    },
    text: {
        primary: colors.text.primary,
        secondary: colors.text.secondary,
        disabled: colors.text.disabled,
    },
    background: {
        default: colors.background.primary,
        paper: colors.background.tertiary,
    },
    divider: colors.border.default,
    action: {
        active: colors.text.primary,
        hover: colors.alpha.black5,
        hoverOpacity: 0.04,
        selected: colors.alpha.black10,
        selectedOpacity: 0.08,
        disabled: colors.text.disabled,
        disabledBackground: colors.neutral[100],
        disabledOpacity: 0.38,
        focus: colors.alpha.black10,
        focusOpacity: 0.12,
        activatedOpacity: 0.12,
    },
};
// Convert our typography to MUI format
const muiTypography = {
    fontFamily: typography.fontFamily.sans,
    fontSize: 14,
    fontWeightLight: typography.fontWeight.light,
    fontWeightRegular: typography.fontWeight.normal,
    fontWeightMedium: typography.fontWeight.medium,
    fontWeightBold: typography.fontWeight.bold,
    h1: {
        ...typography.textStyles.h1,
        color: colors.text.primary,
    },
    h2: {
        ...typography.textStyles.h2,
        color: colors.text.primary,
    },
    h3: {
        ...typography.textStyles.h3,
        color: colors.text.primary,
    },
    h4: {
        ...typography.textStyles.h4,
        color: colors.text.primary,
    },
    h5: {
        ...typography.textStyles.h5,
        color: colors.text.primary,
    },
    h6: {
        ...typography.textStyles.h6,
        color: colors.text.primary,
    },
    subtitle1: {
        ...typography.textStyles.bodyLarge,
        fontWeight: typography.fontWeight.medium,
    },
    subtitle2: {
        ...typography.textStyles.bodyMedium,
        fontWeight: typography.fontWeight.medium,
    },
    body1: typography.textStyles.bodyMedium,
    body2: typography.textStyles.bodySmall,
    button: typography.textStyles.button,
    caption: typography.textStyles.caption,
    overline: typography.textStyles.overline,
};
// Convert our spacing to MUI format (MUI uses a factor of 8px by default)
const muiSpacing = 8;
// Convert our shadows to MUI format
const muiShadows = [
    'none',
    shadows.xs,
    shadows.xs,
    shadows.sm,
    shadows.sm,
    shadows.md,
    shadows.md,
    shadows.md,
    shadows.lg,
    shadows.lg,
    shadows.lg,
    shadows.lg,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows['2xl'],
    shadows['2xl'],
    shadows['2xl'],
    shadows['2xl'],
    shadows['2xl'],
    shadows['2xl'],
    shadows['2xl'],
    shadows['2xl'],
];
// Shape configuration
const muiShape = {
    borderRadius: parseInt(borders.radius.lg), // Convert to number for MUI
};
// Z-index configuration
const muiZIndex = {
    mobileStepper: zIndex.docked,
    fab: zIndex.sticky,
    speedDial: zIndex.sticky,
    appBar: zIndex.sticky,
    drawer: zIndex.overlay,
    modal: zIndex.modal,
    snackbar: zIndex.toast,
    tooltip: zIndex.tooltip,
};
// Transitions configuration
const muiTransitions = {
    easing: {
        easeInOut: transitions.timing.easeInOut,
        easeOut: transitions.timing.easeOut,
        easeIn: transitions.timing.easeIn,
        sharp: transitions.timing.sharp,
    },
    duration: {
        shortest: parseInt(transitions.duration.instant),
        shorter: parseInt(transitions.duration.fast),
        short: parseInt(transitions.duration.base),
        standard: parseInt(transitions.duration.base),
        complex: parseInt(transitions.duration.slow),
        enteringScreen: parseInt(transitions.duration.base),
        leavingScreen: parseInt(transitions.duration.fast),
    },
};
// Component overrides
const muiComponents = {
    MuiCssBaseline: {
        styleOverrides: {
            body: {
                scrollbarColor: `${colors.neutral[300]} ${colors.neutral[100]}`,
                '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
                    width: 12,
                    height: 12,
                },
                '&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track': {
                    background: colors.neutral[100],
                },
                '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
                    backgroundColor: colors.neutral[300],
                    borderRadius: borders.radius.full,
                    border: `3px solid ${colors.neutral[100]}`,
                },
                '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
                    backgroundColor: colors.neutral[400],
                },
            },
        },
    },
    MuiButton: {
        styleOverrides: {
            root: {
                borderRadius: borders.radius.lg,
                textTransform: 'none',
                fontWeight: typography.fontWeight.medium,
                transition: transitions.all,
                '&:focus-visible': {
                    outline: `2px solid ${colors.brand.primary}`,
                    outlineOffset: '2px',
                },
            },
            sizeLarge: {
                padding: `${spacing[3]} ${spacing[6]}`,
                fontSize: typography.fontSize.base,
            },
            sizeMedium: {
                padding: `${spacing[2]} ${spacing[4]}`,
                fontSize: typography.fontSize.sm,
            },
            sizeSmall: {
                padding: `${spacing[1.5]} ${spacing[3]}`,
                fontSize: typography.fontSize.xs,
            },
        },
        defaultProps: {
            disableElevation: true,
        },
    },
    MuiCard: {
        styleOverrides: {
            root: {
                boxShadow: shadows.card,
                borderRadius: borders.radius.xl,
                border: `1px solid ${colors.border.default}`,
                transition: transitions.all,
            },
        },
    },
    MuiPaper: {
        styleOverrides: {
            root: {
                backgroundImage: 'none',
            },
            rounded: {
                borderRadius: borders.radius.lg,
            },
            elevation1: {
                boxShadow: shadows.sm,
            },
            elevation2: {
                boxShadow: shadows.md,
            },
            elevation3: {
                boxShadow: shadows.lg,
            },
        },
    },
    MuiTextField: {
        defaultProps: {
            variant: 'outlined',
        },
        styleOverrides: {
            root: {
                '& .MuiOutlinedInput-root': {
                    borderRadius: borders.radius.lg,
                    transition: transitions.all,
                    '&:hover': {
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: colors.brand.primary,
                        },
                    },
                    '&.Mui-focused': {
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: colors.brand.primary,
                            borderWidth: '2px',
                        },
                    },
                },
            },
        },
    },
    MuiChip: {
        styleOverrides: {
            root: {
                borderRadius: borders.radius.full,
                fontWeight: typography.fontWeight.medium,
            },
        },
    },
    MuiTooltip: {
        styleOverrides: {
            tooltip: {
                backgroundColor: colors.neutral[800],
                color: colors.neutral[0],
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.medium,
                borderRadius: borders.radius.md,
                padding: `${spacing[1]} ${spacing[2]}`,
            },
            arrow: {
                color: colors.neutral[800],
            },
        },
    },
    MuiAlert: {
        styleOverrides: {
            root: {
                borderRadius: borders.radius.lg,
            },
            standardSuccess: {
                backgroundColor: colors.semantic.successBackground,
                color: colors.semantic.successDark,
            },
            standardError: {
                backgroundColor: colors.semantic.errorBackground,
                color: colors.semantic.errorDark,
            },
            standardWarning: {
                backgroundColor: colors.semantic.warningBackground,
                color: colors.semantic.warningDark,
            },
            standardInfo: {
                backgroundColor: colors.semantic.infoBackground,
                color: colors.semantic.infoDark,
            },
        },
    },
};
// Create the light theme
export const lightTheme = createTheme({
    breakpoints: muiBreakpoints,
    palette: muiPalette,
    typography: muiTypography,
    spacing: muiSpacing,
    shadows: muiShadows,
    shape: muiShape,
    zIndex: muiZIndex,
    transitions: muiTransitions,
    components: muiComponents,
});
// Create the dark theme
export const darkTheme = createTheme({
    breakpoints: muiBreakpoints,
    palette: {
        ...muiPalette,
        mode: 'dark',
        background: {
            default: colors.neutral[900],
            paper: colors.neutral[800],
        },
        text: {
            primary: colors.neutral[50],
            secondary: colors.neutral[300],
            disabled: colors.neutral[500],
        },
    },
    typography: muiTypography,
    spacing: muiSpacing,
    shadows: muiShadows,
    shape: muiShape,
    zIndex: muiZIndex,
    transitions: muiTransitions,
    components: {
        ...muiComponents,
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    scrollbarColor: `${colors.neutral[600]} ${colors.neutral[800]}`,
                    '&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track': {
                        background: colors.neutral[800],
                    },
                    '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
                        backgroundColor: colors.neutral[600],
                        border: `3px solid ${colors.neutral[800]}`,
                    },
                    '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
                        backgroundColor: colors.neutral[500],
                    },
                },
            },
        },
    },
});
// Export a function to create custom themes
export const createCustomTheme = (overrides) => {
    return createTheme(lightTheme, overrides);
};
export default lightTheme;
//# sourceMappingURL=mui-theme.js.map