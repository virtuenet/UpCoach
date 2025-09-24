import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, CircularProgress, Container, Avatar, InputAdornment, IconButton, } from '@mui/material';
import { Visibility, VisibilityOff, AdminPanelSettings } from '@mui/icons-material';
import { useAuthStore } from '../stores/authStore';
export default function LoginPage() {
    const navigate = useNavigate();
    const { login, isLoading, error, isAuthenticated, clearError } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);
    useEffect(() => {
        // Clear any previous errors when component mounts
        clearError();
    }, [clearError]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        await login(email, password);
    };
    const handleTogglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };
    return (_jsx(Container, { component: "main", maxWidth: "sm", sx: {
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }, children: _jsx(Card, { elevation: 24, sx: {
                width: '100%',
                maxWidth: 400,
                borderRadius: 2,
                overflow: 'hidden',
            }, children: _jsxs(CardContent, { sx: { p: 4 }, children: [_jsxs(Box, { sx: {
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            mb: 3,
                        }, children: [_jsx(Avatar, { sx: {
                                    m: 1,
                                    bgcolor: 'primary.main',
                                    width: 56,
                                    height: 56,
                                }, children: _jsx(AdminPanelSettings, { fontSize: "large" }) }), _jsx(Typography, { component: "h1", variant: "h4", sx: { fontWeight: 600 }, children: "UpCoach Admin" }), _jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mt: 1 }, children: "Administrative Dashboard" })] }), error && (_jsx(Alert, { severity: "error", sx: { mb: 3 }, children: error })), _jsxs(Box, { component: "form", onSubmit: handleSubmit, sx: { mt: 1 }, children: [_jsx(TextField, { margin: "normal", required: true, fullWidth: true, id: "email", label: "Email Address", name: "email", autoComplete: "email", autoFocus: true, value: email, onChange: (e) => setEmail(e.target.value), disabled: isLoading, sx: { mb: 2 } }), _jsx(TextField, { margin: "normal", required: true, fullWidth: true, name: "password", label: "Password", type: showPassword ? 'text' : 'password', id: "password", autoComplete: "current-password", value: password, onChange: (e) => setPassword(e.target.value), disabled: isLoading, InputProps: {
                                    endAdornment: (_jsx(InputAdornment, { position: "end", children: _jsx(IconButton, { "aria-label": "toggle password visibility", onClick: handleTogglePasswordVisibility, edge: "end", disabled: isLoading, children: showPassword ? _jsx(VisibilityOff, {}) : _jsx(Visibility, {}) }) })),
                                } }), _jsx(Button, { type: "submit", fullWidth: true, variant: "contained", disabled: isLoading || !email || !password, sx: {
                                    mt: 3,
                                    mb: 2,
                                    py: 1.5,
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    borderRadius: 2,
                                }, children: isLoading ? (_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 1 }, children: [_jsx(CircularProgress, { size: 20, color: "inherit" }), "Signing In..."] })) : ('Sign In') })] }), _jsxs(Box, { sx: { mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", sx: { display: 'block', mb: 1 }, children: "Demo Credentials:" }), _jsxs(Typography, { variant: "body2", sx: { fontFamily: 'monospace' }, children: ["Email: admin@upcoach.ai", _jsx("br", {}), "Password: admin123"] })] })] }) }) }));
}
//# sourceMappingURL=LoginPage.js.map