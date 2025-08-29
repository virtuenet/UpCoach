import React from "react";
import {
  AppBar,
  Toolbar,
  TextField,
  InputAdornment,
  Avatar,
  Box,
  Typography,
  IconButton,
  Badge,
} from "@mui/material";

const StyledAppBar = styled(AppBar)(() => ({
  backgroundColor: "#ffffff",
  borderBottom: "1px solid #e5e7eb",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  position: "fixed",
  top: 0,
  left: 260,
  width: "calc(100% - 260px)",
  zIndex: 1100,
}));

const SearchField = styled(TextField)(() => ({
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  "& .MuiOutlinedInput-root": {
    "& fieldset": {
      border: "1px solid #e5e7eb",
    },
    "&:hover fieldset": {
      borderColor: "#d1d5db",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#3b82f6",
      borderWidth: "1px",
    },
  },
  "& .MuiInputBase-input": {
    padding: "8px 16px",
    fontSize: "14px",
    color: "#000000",
    "&::placeholder": {
      color: "#9ca3af",
    },
  },
}));

const UserInfo = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "8px 16px",
  borderRadius: "8px",
  cursor: "pointer",
  transition: "background-color 0.2s",
  "&:hover": {
    backgroundColor: "#f3f4f6",
  },
}));

export interface TopBarProps {
  userName?: string;
  userRole?: string | 'admin' | 'moderator' | 'coach' | 'user';
  userAvatar?: string;
  onMenuClick?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({
  userName = "John Doe",
  userRole = "Admin",
  userAvatar,
}) => {
  return (
    <StyledAppBar elevation={0}>
      <Toolbar sx={{ height: 64, px: 3 }}>
        {/* Search Bar */}
        <Box sx={{ flex: 1, maxWidth: 600, mr: 3 }}>
          <SearchField
            fullWidth
            size="small"
            placeholder="Search..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: "#9ca3af", fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Right side actions */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {/* Notifications */}
          <IconButton size="small">
            <Badge badgeContent={3} color="error">
              <Notifications sx={{ color: "#6b7280" }} />
            </Badge>
          </IconButton>

          {/* Settings */}
          <IconButton size="small">
            <Settings sx={{ color: "#6b7280" }} />
          </IconButton>

          {/* User Profile */}
          <UserInfo>
            <Box sx={{ textAlign: "right" }}>
              <Typography
                variant="body2"
                sx={{
                  color: "#000000",
                  fontWeight: 500,
                  fontSize: "14px",
                  lineHeight: 1.2,
                }}
              >
                {userName}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "#6b7280",
                  fontSize: "12px",
                }}
              >
                {userRole}
              </Typography>
            </Box>
            <Avatar
              src={userAvatar}
              alt={userName}
              sx={{
                width: 36,
                height: 36,
                bgcolor: "#3b82f6",
                fontSize: "14px",
              }}
            >
              {userName.charAt(0)}
            </Avatar>
          </UserInfo>
        </Box>
      </Toolbar>
    </StyledAppBar>
  );
};

export default TopBar;
