import React from "react";
import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

const MainContent = styled(Box)(({ theme }) => ({
  marginLeft: 260,
  paddingTop: 64,
  minHeight: "100vh",
  backgroundColor: "#f9fafb",
}));

const ContentWrapper = styled(Box)(({ theme }) => ({
  padding: "24px",
  maxWidth: "100%",
  margin: "0 auto",
}));

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <TopBar userName="John Doe" userRole="Admin" />
      <MainContent>
        <ContentWrapper>{children}</ContentWrapper>
      </MainContent>
    </Box>
  );
};

export default Layout;
