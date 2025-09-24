import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Typography, Card, CardContent } from '@mui/material';
import { People } from '@mui/icons-material';
export default function UsersPage() {
    return (_jsxs(Box, { children: [_jsx(Typography, { variant: "h4", sx: { fontWeight: 600, mb: 3 }, children: "User Management" }), _jsx(Card, { children: _jsxs(CardContent, { children: [_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 2, mb: 2 }, children: [_jsx(People, { color: "primary" }), _jsx(Typography, { variant: "h6", children: "Users Dashboard" })] }), _jsx(Typography, { color: "text.secondary", children: "User management functionality will be implemented here. This includes user listings, role management, and user activity monitoring." })] }) })] }));
}
//# sourceMappingURL=UsersPage.js.map