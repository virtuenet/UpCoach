import { jsx as _jsx } from "react/jsx-runtime";
import { Breadcrumbs as MuiBreadcrumbs, Link, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { NavigateNext } from '@mui/icons-material';
export default function Breadcrumbs({ items }) {
    return (_jsx(MuiBreadcrumbs, { separator: _jsx(NavigateNext, { fontSize: "small" }), "aria-label": "breadcrumb", sx: { fontSize: '0.875rem' }, children: items.map((item, index) => {
            const isLast = index === items.length - 1;
            if (isLast || !item.path) {
                return (_jsx(Typography, { color: "text.primary", sx: { fontSize: '0.875rem', fontWeight: 500 }, children: item.label }, index));
            }
            return (_jsx(Link, { component: RouterLink, to: item.path, color: "inherit", sx: {
                    fontSize: '0.875rem',
                    textDecoration: 'none',
                    '&:hover': {
                        textDecoration: 'underline',
                    },
                }, children: item.label }, index));
        }) }));
}
//# sourceMappingURL=Breadcrumbs.js.map