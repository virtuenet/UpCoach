import { Link as RouterLink } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="breadcrumb" className="breadcrumbs">
      <ol className="breadcrumb-list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="breadcrumb-item">
              {isLast || !item.path ? (
                <span className="breadcrumb-current">{item.label}</span>
              ) : (
                <RouterLink to={item.path} className="breadcrumb-link">
                  {item.label}
                </RouterLink>
              )}
              {!isLast && <span className="breadcrumb-separator"> / </span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}