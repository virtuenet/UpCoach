import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card as MuiCard, CardContent, CardHeader, CardActions, CardMedia, Skeleton, } from '@mui/material';
import { styled } from '@mui/material/styles';
const StyledCard = styled(MuiCard, {
    shouldForwardProp: prop => prop !== 'variant' && prop !== 'padding',
})(({ theme, variant = 'elevated' }) => ({
    transition: theme.transitions.create(['box-shadow', 'transform'], {
        duration: theme.transitions.duration.short,
    }),
    ...(variant === 'filled' && {
        backgroundColor: theme.palette.grey[50],
        boxShadow: 'none',
    }),
    '&:hover': {
        ...(variant === 'elevated' && {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[4],
        }),
    },
}));
const getPaddingValue = (padding, theme) => {
    switch (padding) {
        case 'none':
            return 0;
        case 'small':
            return theme?.spacing(2);
        case 'large':
            return theme?.spacing(4);
        case 'medium':
        default:
            return theme?.spacing(3);
    }
};
export const Card = ({ title, subtitle, headerAction, media, actions, loading = false, variant = 'elevated', padding = 'medium', children, ...props }) => {
    const cardVariant = variant === 'outlined' ? 'outlined' : 'elevation';
    if (loading) {
        return (_jsxs(StyledCard, { variant: cardVariant, ...props, children: [(title || subtitle) && (_jsx(CardHeader, { title: _jsx(Skeleton, { variant: "text", width: "60%" }), subheader: subtitle && _jsx(Skeleton, { variant: "text", width: "40%" }) })), media && _jsx(Skeleton, { variant: "rectangular", height: media.height || 200 }), _jsxs(CardContent, { sx: { padding: theme => getPaddingValue(padding, theme) }, children: [_jsx(Skeleton, { variant: "text" }), _jsx(Skeleton, { variant: "text" }), _jsx(Skeleton, { variant: "text", width: "80%" })] }), actions && (_jsx(CardActions, { children: _jsx(Skeleton, { variant: "rectangular", width: 100, height: 36 }) }))] }));
    }
    return (_jsxs(StyledCard, { variant: cardVariant, ...props, children: [(title || subtitle || headerAction) && (_jsx(CardHeader, { title: title, subheader: subtitle, action: headerAction })), media && (_jsx(CardMedia, { component: "img", height: media.height || 200, image: media.src, alt: media.alt })), children && (_jsx(CardContent, { sx: { padding: theme => getPaddingValue(padding, theme) }, children: children })), actions && _jsx(CardActions, { children: actions })] }));
};
export default Card;
//# sourceMappingURL=Card.js.map