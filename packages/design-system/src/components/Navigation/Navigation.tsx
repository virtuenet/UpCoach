/**
 * UpCoach Design System - Navigation Component
 * Unified navigation sidebar/header component
 */

import React, { useState } from 'react';
import {
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Box,
  Collapse,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Badge,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ExpandLess,
  ExpandMore,
  Notifications as NotificationsIcon,
  AccountCircle as AccountIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

export interface NavigationItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  path?: string;
  badge?: number | string;
  children?: NavigationItem[];
  onClick?: () => void;
}

export interface NavigationProps {
  items: NavigationItem[];
  logo?: React.ReactNode;
  title?: string;
  user?: {
    name: string;
    email?: string;
    avatar?: string;
  };
  notifications?: number;
  onNavigate?: (path: string) => void;
  onLogout?: () => void;
  variant?: 'permanent' | 'temporary' | 'mini';
  position?: 'left' | 'top';
  currentPath?: string;
}

const drawerWidth = 260;
const miniDrawerWidth = 72;

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'space-between',
}));

const StyledDrawer = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== 'variant'
})<{ variant: string }>(({ theme, variant }) => ({
  width: variant === 'mini' ? miniDrawerWidth : drawerWidth,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: variant === 'mini' ? miniDrawerWidth : drawerWidth,
    boxSizing: 'border-box',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
}));

const StyledAppBar = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'open'
})<{ open?: boolean }>(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

export const Navigation: React.FC<NavigationProps> = ({
  items,
  logo,
  title = 'UpCoach',
  user,
  notifications = 0,
  onNavigate,
  onLogout,
  variant = 'permanent',
  position = 'left',
  currentPath = '',
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(!isMobile);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleExpandToggle = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleNavigate = (path?: string, onClick?: () => void) => {
    if (onClick) {
      onClick();
    } else if (path && onNavigate) {
      onNavigate(path);
    }
    if (isMobile) {
      setOpen(false);
    }
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const renderNavItems = (items: NavigationItem[], depth = 0) => {
    return items.map((item) => {
      const hasChildren = item.children && item.children.length > 0;
      const isExpanded = expandedItems.includes(item.id);
      const isActive = item.path === currentPath;

      return (
        <React.Fragment key={item.id}>
          <ListItem disablePadding sx={{ pl: depth * 2 }}>
            <ListItemButton
              selected={isActive}
              onClick={() => {
                if (hasChildren) {
                  handleExpandToggle(item.id);
                } else {
                  handleNavigate(item.path, item.onClick);
                }
              }}
            >
              {item.icon && (
                <ListItemIcon>
                  {item.badge ? (
                    <Badge badgeContent={item.badge} color="primary">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
              )}
              <ListItemText primary={item.label} />
              {hasChildren && (isExpanded ? <ExpandLess /> : <ExpandMore />)}
            </ListItemButton>
          </ListItem>
          {hasChildren && (
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {renderNavItems(item.children!, depth + 1)}
              </List>
            </Collapse>
          )}
        </React.Fragment>
      );
    });
  };

  const drawerContent = (
    <>
      <DrawerHeader>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {logo}
          {variant !== 'mini' && (
            <Typography variant="h6" noWrap>
              {title}
            </Typography>
          )}
        </Box>
        {variant !== 'temporary' && (
          <IconButton onClick={handleDrawerToggle}>
            {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        )}
      </DrawerHeader>
      <Divider />
      <List>{renderNavItems(items)}</List>
    </>
  );

  const appBarContent = (
    <AppBar position="fixed" open={position === 'left' && open}>
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={handleDrawerToggle}
          edge="start"
          sx={{ mr: 2, ...(open && position === 'left' && { display: 'none' }) }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        {notifications > 0 && (
          <IconButton color="inherit">
            <Badge badgeContent={notifications} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        )}
        {user && (
          <>
            <Tooltip title="Account">
              <IconButton onClick={handleUserMenuOpen} color="inherit">
                {user.avatar ? (
                  <Avatar src={user.avatar} alt={user.name} sx={{ width: 32, height: 32 }} />
                ) : (
                  <AccountIcon />
                )}
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleUserMenuClose}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle1">{user.name}</Typography>
                {user.email && (
                  <Typography variant="body2" color="text.secondary">
                    {user.email}
                  </Typography>
                )}
              </Box>
              <Divider />
              <MenuItem onClick={() => { handleUserMenuClose(); onNavigate?.('/settings'); }}>
                Settings
              </MenuItem>
              <MenuItem onClick={() => { handleUserMenuClose(); onLogout?.(); }}>
                Logout
              </MenuItem>
            </Menu>
          </>
        )}
      </Toolbar>
    </AppBar>
  );

  if (position === 'top') {
    return appBarContent;
  }

  return (
    <>
      {appBarContent}
      <StyledDrawer
        variant={isMobile ? 'temporary' : variant}
        open={open}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
      >
        {drawerContent}
      </StyledDrawer>
    </>
  );
};

export default Navigation;