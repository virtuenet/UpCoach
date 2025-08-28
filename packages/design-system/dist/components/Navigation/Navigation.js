import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * UpCoach Design System - Navigation Component
 * Unified navigation sidebar/header component
 */
import React, { useState } from 'react';
import { Drawer, AppBar, Toolbar, List, ListItem, ListItemButton, ListItemIcon, ListItemText, IconButton, Typography, Box, Collapse, Avatar, Menu, MenuItem, Divider, Badge, Tooltip, useTheme, useMediaQuery, } from '@mui/material';
import { Menu as MenuIcon, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon, ExpandLess, ExpandMore, Notifications as NotificationsIcon, AccountCircle as AccountIcon, } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
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
})(({ theme, variant }) => ({
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
})(({ theme, open }) => ({
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
export const Navigation = ({ items, logo, title = 'UpCoach', user, notifications = 0, onNavigate, onLogout, variant = 'permanent', position = 'left', currentPath = '', }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [open, setOpen] = useState(!isMobile);
    const [expandedItems, setExpandedItems] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);
    const handleDrawerToggle = () => {
        setOpen(!open);
    };
    const handleExpandToggle = (itemId) => {
        setExpandedItems((prev) => prev.includes(itemId)
            ? prev.filter((id) => id !== itemId)
            : [...prev, itemId]);
    };
    const handleNavigate = (path, onClick) => {
        if (onClick) {
            onClick();
        }
        else if (path && onNavigate) {
            onNavigate(path);
        }
        if (isMobile) {
            setOpen(false);
        }
    };
    const handleUserMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleUserMenuClose = () => {
        setAnchorEl(null);
    };
    const renderNavItems = (items, depth = 0) => {
        return items.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedItems.includes(item.id);
            const isActive = item.path === currentPath;
            return (_jsxs(React.Fragment, { children: [_jsx(ListItem, { disablePadding: true, sx: { pl: depth * 2 }, children: _jsxs(ListItemButton, { selected: isActive, onClick: () => {
                                if (hasChildren) {
                                    handleExpandToggle(item.id);
                                }
                                else {
                                    handleNavigate(item.path, item.onClick);
                                }
                            }, children: [item.icon && (_jsx(ListItemIcon, { children: item.badge ? (_jsx(Badge, { badgeContent: item.badge, color: "primary", children: item.icon })) : (item.icon) })), _jsx(ListItemText, { primary: item.label }), hasChildren && (isExpanded ? _jsx(ExpandLess, {}) : _jsx(ExpandMore, {}))] }) }), hasChildren && (_jsx(Collapse, { in: isExpanded, timeout: "auto", unmountOnExit: true, children: _jsx(List, { component: "div", disablePadding: true, children: renderNavItems(item.children, depth + 1) }) }))] }, item.id));
        });
    };
    const drawerContent = (_jsxs(_Fragment, { children: [_jsxs(DrawerHeader, { children: [_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 1 }, children: [logo, variant !== 'mini' && (_jsx(Typography, { variant: "h6", noWrap: true, children: title }))] }), variant !== 'temporary' && (_jsx(IconButton, { onClick: handleDrawerToggle, children: theme.direction === 'ltr' ? _jsx(ChevronLeftIcon, {}) : _jsx(ChevronRightIcon, {}) }))] }), _jsx(Divider, {}), _jsx(List, { children: renderNavItems(items) })] }));
    const appBarContent = (_jsx(AppBar, { position: "fixed", open: position === 'left' && open, children: _jsxs(Toolbar, { children: [_jsx(IconButton, { color: "inherit", "aria-label": "open drawer", onClick: handleDrawerToggle, edge: "start", sx: { mr: 2, ...(open && position === 'left' && { display: 'none' }) }, children: _jsx(MenuIcon, {}) }), _jsx(Typography, { variant: "h6", noWrap: true, component: "div", sx: { flexGrow: 1 }, children: title }), notifications > 0 && (_jsx(IconButton, { color: "inherit", children: _jsx(Badge, { badgeContent: notifications, color: "error", children: _jsx(NotificationsIcon, {}) }) })), user && (_jsxs(_Fragment, { children: [_jsx(Tooltip, { title: "Account", children: _jsx(IconButton, { onClick: handleUserMenuOpen, color: "inherit", children: user.avatar ? (_jsx(Avatar, { src: user.avatar, alt: user.name, sx: { width: 32, height: 32 } })) : (_jsx(AccountIcon, {})) }) }), _jsxs(Menu, { anchorEl: anchorEl, open: Boolean(anchorEl), onClose: handleUserMenuClose, children: [_jsxs(Box, { sx: { px: 2, py: 1 }, children: [_jsx(Typography, { variant: "subtitle1", children: user.name }), user.email && (_jsx(Typography, { variant: "body2", color: "text.secondary", children: user.email }))] }), _jsx(Divider, {}), _jsx(MenuItem, { onClick: () => { handleUserMenuClose(); onNavigate?.('/settings'); }, children: "Settings" }), _jsx(MenuItem, { onClick: () => { handleUserMenuClose(); onLogout?.(); }, children: "Logout" })] })] }))] }) }));
    if (position === 'top') {
        return appBarContent;
    }
    return (_jsxs(_Fragment, { children: [appBarContent, _jsx(StyledDrawer, { variant: isMobile ? 'temporary' : variant, open: open, onClose: handleDrawerToggle, ModalProps: { keepMounted: true }, children: drawerContent })] }));
};
export default Navigation;
