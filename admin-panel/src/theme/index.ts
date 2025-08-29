/**
 * Admin Panel Theme Configuration
 * Uses the unified UpCoach Design System
 */


// Use the unified light theme from the design system
const theme = lightTheme;

// Optional: Add any admin-panel specific overrides if needed
const adminTheme = createTheme(theme, {
  // Admin-specific customizations can go here
  components: {
    ...theme.components,
    // Example: Admin-specific sidebar styling
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: theme.palette.background.paper,
          borderRight: `1px solid ${theme.palette.divider}`,
        },
      },
    },
  },
});

export default adminTheme;
export { lightTheme, darkTheme };
