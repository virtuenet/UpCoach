/**
 * CMS Panel Theme Configuration
 * Uses the unified UpCoach Design System
 */
import { lightTheme, darkTheme } from '@upcoach/design-system';
import { createTheme } from '@mui/material/styles';
// Use the unified light theme from the design system
const theme = lightTheme;
// CMS-specific theme customizations
const cmsTheme = createTheme(theme, {
    // CMS-specific customizations
    components: {
        ...theme.components,
        // CMS-specific content editor styling
        MuiPaper: {
            styleOverrides: {
                ...(theme.components?.MuiPaper?.styleOverrides || {}),
                root: {
                    ...(typeof theme.components?.MuiPaper?.styleOverrides?.root === 'object' ? theme.components.MuiPaper.styleOverrides.root : {}),
                    '&.content-editor': {
                        padding: theme.spacing(3),
                        backgroundColor: theme.palette.background.paper,
                    },
                },
            },
        },
        // Content management specific table styling
        MuiTableContainer: {
            styleOverrides: {
                root: {
                    borderRadius: theme.shape.borderRadius,
                    border: `1px solid ${theme.palette.divider}`,
                },
            },
        },
        MuiTableHead: {
            styleOverrides: {
                root: {
                    backgroundColor: theme.palette.grey[50],
                },
            },
        },
        // Form elements for content editing
        MuiTextField: {
            defaultProps: {
                variant: 'outlined',
                fullWidth: true,
            },
            styleOverrides: {
                ...theme.components?.MuiTextField?.styleOverrides,
            },
        },
        // Rich text editor container styling
        MuiBox: {
            styleOverrides: {
                root: {
                    '&.editor-container': {
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: theme.shape.borderRadius,
                        padding: theme.spacing(2),
                        minHeight: 400,
                        backgroundColor: theme.palette.background.paper,
                        '&:focus-within': {
                            borderColor: theme.palette.primary.main,
                            borderWidth: 2,
                        },
                    },
                },
            },
        },
    },
});
export default cmsTheme;
export { lightTheme, darkTheme };
//# sourceMappingURL=index.js.map