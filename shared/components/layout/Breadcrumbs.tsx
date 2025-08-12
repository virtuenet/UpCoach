import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../../utils/cn';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<any>;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className }) => {
  // Always add Home as the first item if not present
  const breadcrumbItems = items[0]?.label === 'Home' 
    ? items 
    : [{ label: 'Home', href: '/', icon: Home }, ...items];
  
  return (
    <nav
      className={cn('flex', className)}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-2">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          const Icon = item.icon;
          
          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight
                  className="h-4 w-4 text-gray-400 mx-2"
                  aria-hidden="true"
                />
              )}
              
              {isLast ? (
                <span
                  className="text-sm font-medium text-gray-900 flex items-center"
                  aria-current="page"
                >
                  {Icon && <Icon className="h-4 w-4 mr-1" aria-hidden="true" />}
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.href || '/'}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center transition-colors"
                >
                  {Icon && <Icon className="h-4 w-4 mr-1" aria-hidden="true" />}
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

// Hook to generate breadcrumbs from current route
export const useBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  const segments = pathname.split('/').filter(Boolean);
  
  if (segments.length === 0) {
    return [{ label: 'Home', href: '/' }];
  }
  
  const breadcrumbs: BreadcrumbItem[] = [];
  let currentPath = '';
  
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;
    
    // Format the label (capitalize, replace hyphens with spaces)
    const label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    breadcrumbs.push({
      label,
      href: isLast ? undefined : currentPath,
    });
  });
  
  return breadcrumbs;
};

export default Breadcrumbs;