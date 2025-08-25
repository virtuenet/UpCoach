import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Dashboard,
  People,
  ShoppingCart,
  Assessment,
  Inventory,
  LocalShipping,
  Build,
  AccountBalance,
  Settings,
} from "@mui/icons-material";
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
} from "@mui/material";
import { styled } from "@mui/material/styles";

const SidebarContainer = styled(Box)(({ }) => ({
  width: 260,
  height: "100vh",
  position: "fixed",
  left: 0,
  top: 0,
  backgroundColor: "#ffffff",
  borderRight: "1px solid #e5e7eb",
  boxShadow: "2px 0 4px rgba(0, 0, 0, 0.05)",
  display: "flex",
  flexDirection: "column",
  zIndex: 1200,
}));

const SidebarHeader = styled(Box)(({ }) => ({
  padding: "20px",
  borderBottom: "1px solid #e5e7eb",
  backgroundColor: "#ffffff",
}));

const Logo = styled(Typography)(({ }) => ({
  color: "#000000",
  fontSize: "20px",
  fontWeight: 700,
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  gap: "8px",
}));

const StyledListItem = styled(ListItem)<{ active?: boolean }>(
  ({ theme, active }) => ({
    padding: "12px 20px",
    color: "#000000",
    cursor: "pointer",
    transition: "all 0.2s ease",
    borderLeft: active ? "3px solid #3b82f6" : "3px solid transparent",
    backgroundColor: active ? "#e5e7eb" : "transparent",
    "&:hover": {
      backgroundColor: "#f3f4f6",
    },
    "& .MuiListItemIcon-root": {
      color: active ? "#3b82f6" : "#6b7280",
      minWidth: "40px",
    },
    "& .MuiListItemText-primary": {
      color: "#000000",
      fontWeight: active ? 600 : 500,
      fontSize: "14px",
    },
  }),
);

const SectionTitle = styled(Typography)(({ }) => ({
  color: "#6b7280",
  fontSize: "12px",
  fontWeight: 600,
  textTransform: "uppercase",
  padding: "8px 20px",
  marginTop: "16px",
}));

interface MenuItem {
  title: string;
  path: string;
  icon: React.ReactElement;
  section?: string;
}

const menuItems: MenuItem[] = [
  { title: "Dashboard", path: "/", icon: <Dashboard />, section: "Main" },
  { title: "Partners", path: "/partners", icon: <People />, section: "Main" },
  {
    title: "Procurement",
    path: "/procurement",
    icon: <ShoppingCart />,
    section: "Main",
  },
  {
    title: "Sales Orders",
    path: "/sales-orders",
    icon: <Assessment />,
    section: "Main",
  },
  {
    title: "Financials",
    path: "/financials",
    icon: <AccountBalance />,
    section: "Main",
  },
  {
    title: "Payroll",
    path: "/payroll",
    icon: <AccountBalance />,
    section: "Main",
  },
  {
    title: "Inventory",
    path: "/inventory",
    icon: <Inventory />,
    section: "Operations",
  },
  {
    title: "Manufacturing",
    path: "/manufacturing",
    icon: <Build />,
    section: "Operations",
  },
  {
    title: "Contracts",
    path: "/contracts",
    icon: <Assessment />,
    section: "Operations",
  },
  {
    title: "Field Services",
    path: "/field-services",
    icon: <LocalShipping />,
    section: "Operations",
  },
  {
    title: "BI Dashboards",
    path: "/bi-dashboards",
    icon: <Assessment />,
    section: "Analytics",
  },
  {
    title: "AI Assistant",
    path: "/ai-assistant",
    icon: <Assessment />,
    section: "Analytics",
  },
  {
    title: "Lark Integration",
    path: "/lark-integration",
    icon: <Build />,
    section: "Integrations",
  },
  {
    title: "Approvals",
    path: "/approvals",
    icon: <Assessment />,
    section: "Workflow",
  },
  {
    title: "Settings",
    path: "/settings",
    icon: <Settings />,
    section: "System",
  },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const groupedItems = menuItems.reduce(
    (acc, item) => {
      const section = item.section || "Other";
      if (!acc[section]) {
        acc[section] = [];
      }
      acc[section].push(item);
      return acc;
    },
    {} as Record<string, MenuItem[]>,
  );

  return (
    <SidebarContainer>
      <SidebarHeader>
        <Logo component={Link} to="/">
          <Build sx={{ fontSize: 28 }} />
          UpCoach Admin
        </Logo>
      </SidebarHeader>

      <Box sx={{ flex: 1, overflowY: "auto", py: 2 }}>
        {Object.entries(groupedItems).map(([section, items]) => (
          <Box key={section}>
            <SectionTitle>{section}</SectionTitle>
            <List sx={{ py: 0 }}>
              {items.map((item) => (
                <StyledListItem
                  key={item.path}
                  component={Link}
                  to={item.path}
                  active={currentPath === item.path}
                  disableRipple
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.title} />
                </StyledListItem>
              ))}
            </List>
          </Box>
        ))}
      </Box>

      <Divider />

      <Box sx={{ p: 2, backgroundColor: "#f9fafb" }}>
        <Typography variant="caption" sx={{ color: "#6b7280" }}>
          Version 1.0.0
        </Typography>
      </Box>
    </SidebarContainer>
  );
};

export default Sidebar;
