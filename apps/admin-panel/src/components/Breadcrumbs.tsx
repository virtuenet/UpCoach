import { Breadcrumbs as MuiBreadcrumbs, Link, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { NavigateNext } from '@mui/icons-material';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <MuiBreadcrumbs
      separator={<NavigateNext fontSize="small" />}
      aria-label="breadcrumb"
      sx={{ fontSize: '0.875rem' }}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        if (isLast || !item.path) {
          return (
            <Typography
              key={index}
              color="text.primary"
              sx={{ fontSize: '0.875rem', fontWeight: 500 }}
            >
              {item.label}
            </Typography>
          );
        }
        
        return (
          <Link
            key={index}
            component={RouterLink}
            to={item.path}
            color="inherit"
            sx={{ 
              fontSize: '0.875rem',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </MuiBreadcrumbs>
  );
}