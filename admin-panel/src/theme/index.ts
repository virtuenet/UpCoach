import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#3b82f6",
      light: "#60a5fa",
      dark: "#2563eb",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#8b5cf6",
      light: "#a78bfa",
      dark: "#7c3aed",
      contrastText: "#ffffff",
    },
    error: {
      main: "#ef4444",
      light: "#f87171",
      dark: "#dc2626",
    },
    warning: {
      main: "#f59e0b",
      light: "#fbbf24",
      dark: "#d97706",
    },
    success: {
      main: "#10b981",
      light: "#34d399",
      dark: "#059669",
    },
    info: {
      main: "#3b82f6",
      light: "#60a5fa",
      dark: "#2563eb",
    },
    grey: {
      50: "#f9fafb",
      100: "#f3f4f6",
      200: "#e5e7eb",
      300: "#d1d5db",
      400: "#9ca3af",
      500: "#6b7280",
      600: "#4b5563",
      700: "#374151",
      800: "#1f2937",
      900: "#111827",
    },
    text: {
      primary: "#000000",
      secondary: "#6b7280",
      disabled: "#9ca3af",
    },
    background: {
      default: "#f9fafb",
      paper: "#ffffff",
    },
    divider: "#e5e7eb",
  },
  typography: {
    fontFamily:
      '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
      lineHeight: 1.2,
      color: "#000000",
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 700,
      lineHeight: 1.3,
      color: "#000000",
    },
    h3: {
      fontSize: "1.75rem",
      fontWeight: 600,
      lineHeight: 1.3,
      color: "#000000",
    },
    h4: {
      fontSize: "1.5rem",
      fontWeight: 600,
      lineHeight: 1.4,
      color: "#000000",
    },
    h5: {
      fontSize: "1.25rem",
      fontWeight: 600,
      lineHeight: 1.4,
      color: "#000000",
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 600,
      lineHeight: 1.4,
      color: "#000000",
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.5,
      color: "#000000",
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.5,
      color: "#000000",
    },
    button: {
      textTransform: "none",
      fontWeight: 500,
    },
    caption: {
      fontSize: "0.75rem",
      lineHeight: 1.5,
      color: "#6b7280",
    },
    overline: {
      fontSize: "0.75rem",
      fontWeight: 600,
      lineHeight: 1.5,
      textTransform: "uppercase",
      color: "#6b7280",
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    "none",
    "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: "#d1d5db #f3f4f6",
          "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
            width: 8,
            height: 8,
          },
          "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
            borderRadius: 4,
            backgroundColor: "#d1d5db",
          },
          "&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover":
            {
              backgroundColor: "#9ca3af",
            },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          fontWeight: 500,
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow:
            "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          "&.Mui-selected": {
            backgroundColor: "#e5e7eb",
            "&:hover": {
              backgroundColor: "#d1d5db",
            },
          },
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          color: "#000000",
        },
        secondary: {
          color: "#6b7280",
        },
      },
    },
  },
});

export default theme;
