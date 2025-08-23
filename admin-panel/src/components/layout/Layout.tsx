import React, { useState } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { styled } from "@mui/material/styles";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useAuth } from "../../contexts/AuthContext";

const MainContent = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'sidebarOpen'
})<{ sidebarOpen?: boolean }>(({ theme, sidebarOpen }) => ({
  marginLeft: sidebarOpen ? 260 : 0,
  paddingTop: 64,
  minHeight: "100vh",
  backgroundColor: "#f9fafb",
  transition: "margin-left 0.3s ease",
  [theme.breakpoints.down('md')]: {
    marginLeft: 0,
  },
}))

const ContentWrapper = styled(Box)(({ theme }) => ({
  padding: "24px",
  maxWidth: "100%",
  margin: "0 auto",
}));

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Show loading state while checking auth
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        Loading...
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} isMobile={isMobile} />
      <TopBar 
        userName={user?.name || "Guest"} 
        userRole={user?.role || "user"}
        onMenuClick={handleSidebarToggle}
      />
      <MainContent sidebarOpen={!isMobile && sidebarOpen}>
        <ContentWrapper>{children}</ContentWrapper>
      </MainContent>
    </Box>
  );
};

export default Layout;
