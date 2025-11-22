import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { cn } from '../../lib/utils';
export function Skeleton({ className, variant = 'text', width, height, animation = 'pulse', ...props }) {
    const variantClasses = {
        text: 'h-4 w-full rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-none',
        rounded: 'rounded-md',
    };
    const animationClasses = {
        pulse: 'animate-pulse',
        wave: 'animate-shimmer',
        none: '',
    };
    return (_jsx("div", { className: cn('bg-muted', variantClasses[variant], animationClasses[animation], className), style: {
            width: width,
            height: height || (variant === 'text' ? '1em' : height),
        }, ...props }));
}
/**
 * Card Skeleton
 */
export function CardSkeleton({ className }) {
    return (_jsxs("div", { className: cn('p-6 border rounded-lg', className), children: [_jsx(Skeleton, { variant: "rectangular", height: 200, className: "mb-4" }), _jsx(Skeleton, { variant: "text", className: "mb-2" }), _jsx(Skeleton, { variant: "text", width: "60%" })] }));
}
/**
 * List Item Skeleton
 */
export function ListItemSkeleton({ showAvatar = true, lines = 2, }) {
    return (_jsxs("div", { className: "flex items-start space-x-4 p-4", children: [showAvatar && _jsx(Skeleton, { variant: "circular", width: 40, height: 40 }), _jsxs("div", { className: "flex-1 space-y-2", children: [_jsx(Skeleton, { variant: "text", width: "40%" }), Array.from({ length: lines - 1 }).map((_, i) => (_jsx(Skeleton, { variant: "text", width: "100%" }, i)))] })] }));
}
/**
 * Table Skeleton
 */
export function TableSkeleton({ rows = 5, columns = 4 }) {
    return (_jsxs("div", { className: "w-full", children: [_jsx("div", { className: "flex border-b p-4 bg-muted/50", children: Array.from({ length: columns }).map((_, i) => (_jsx("div", { className: "flex-1 px-2", children: _jsx(Skeleton, { variant: "text", width: "80%" }) }, i))) }), Array.from({ length: rows }).map((_, rowIndex) => (_jsx("div", { className: "flex border-b p-4", children: Array.from({ length: columns }).map((_, colIndex) => (_jsx("div", { className: "flex-1 px-2", children: _jsx(Skeleton, { variant: "text", width: `${Math.random() * 40 + 60}%` }) }, colIndex))) }, rowIndex)))] }));
}
/**
 * Chart Skeleton
 */
export function ChartSkeleton({ height = 300 }) {
    return (_jsx("div", { className: "w-full", style: { height }, children: _jsx("div", { className: "flex items-end justify-between h-full space-x-2", children: Array.from({ length: 12 }).map((_, i) => (_jsx(Skeleton, { variant: "rectangular", className: "flex-1", height: `${Math.random() * 60 + 40}%` }, i))) }) }));
}
/**
 * Form Skeleton
 */
export function FormSkeleton({ fields = 4 }) {
    return (_jsxs("div", { className: "space-y-6", children: [Array.from({ length: fields }).map((_, i) => (_jsxs("div", { className: "space-y-2", children: [_jsx(Skeleton, { variant: "text", width: "30%", height: 20 }), _jsx(Skeleton, { variant: "rounded", height: 40 })] }, i))), _jsxs("div", { className: "flex space-x-4", children: [_jsx(Skeleton, { variant: "rounded", width: 100, height: 40 }), _jsx(Skeleton, { variant: "rounded", width: 100, height: 40 })] })] }));
}
/**
 * Dashboard Skeleton
 */
export function DashboardSkeleton() {
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: Array.from({ length: 4 }).map((_, i) => (_jsxs("div", { className: "p-6 border rounded-lg", children: [_jsx(Skeleton, { variant: "text", width: "60%", className: "mb-2" }), _jsx(Skeleton, { variant: "text", width: "40%", height: 32 })] }, i))) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "p-6 border rounded-lg", children: [_jsx(Skeleton, { variant: "text", width: "40%", className: "mb-4" }), _jsx(ChartSkeleton, { height: 250 })] }), _jsxs("div", { className: "p-6 border rounded-lg", children: [_jsx(Skeleton, { variant: "text", width: "40%", className: "mb-4" }), _jsx(ChartSkeleton, { height: 250 })] })] }), _jsxs("div", { className: "border rounded-lg", children: [_jsx("div", { className: "p-4 border-b", children: _jsx(Skeleton, { variant: "text", width: "30%" }) }), _jsx(TableSkeleton, { rows: 5, columns: 5 })] })] }));
}
/**
 * Content Editor Skeleton
 */
export function ContentEditorSkeleton() {
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "flex items-center space-x-2 p-4 border rounded-lg", children: Array.from({ length: 8 }).map((_, i) => (_jsx(Skeleton, { variant: "rounded", width: 32, height: 32 }, i))) }), _jsxs("div", { className: "p-4 border rounded-lg min-h-[400px]", children: [_jsx(Skeleton, { variant: "text", width: "80%", className: "mb-4" }), _jsx(Skeleton, { variant: "text", width: "100%", className: "mb-2" }), _jsx(Skeleton, { variant: "text", width: "100%", className: "mb-2" }), _jsx(Skeleton, { variant: "text", width: "70%", className: "mb-4" }), _jsx(Skeleton, { variant: "text", width: "90%", className: "mb-2" }), _jsx(Skeleton, { variant: "text", width: "100%" })] }), _jsxs("div", { className: "flex justify-end space-x-4", children: [_jsx(Skeleton, { variant: "rounded", width: 100, height: 40 }), _jsx(Skeleton, { variant: "rounded", width: 100, height: 40 })] })] }));
}
/**
 * Profile Skeleton
 */
export function ProfileSkeleton() {
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx(Skeleton, { variant: "circular", width: 80, height: 80 }), _jsxs("div", { className: "space-y-2", children: [_jsx(Skeleton, { variant: "text", width: 200, height: 24 }), _jsx(Skeleton, { variant: "text", width: 150 })] })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: Array.from({ length: 3 }).map((_, i) => (_jsxs("div", { className: "space-y-2", children: [_jsx(Skeleton, { variant: "text", width: "40%" }), _jsx(Skeleton, { variant: "text", width: "80%", height: 20 })] }, i))) }), _jsxs("div", { className: "space-y-2", children: [_jsx(Skeleton, { variant: "text", width: "30%", height: 24 }), _jsx(Skeleton, { variant: "rectangular", height: 100 })] })] }));
}
/**
 * Media Gallery Skeleton
 */
export function MediaGallerySkeleton({ items = 12 }) {
    return (_jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4", children: Array.from({ length: items }).map((_, i) => (_jsx("div", { className: "aspect-square", children: _jsx(Skeleton, { variant: "rounded", className: "w-full h-full" }) }, i))) }));
}
/**
 * Navigation Skeleton
 */
export function NavigationSkeleton({ items = 5 }) {
    return (_jsx("nav", { className: "space-y-2", children: Array.from({ length: items }).map((_, i) => (_jsxs("div", { className: "flex items-center space-x-3 p-2", children: [_jsx(Skeleton, { variant: "circular", width: 24, height: 24 }), _jsx(Skeleton, { variant: "text", width: `${Math.random() * 40 + 60}%` })] }, i))) }));
}
/**
 * Comment Skeleton
 */
export function CommentSkeleton() {
    return (_jsxs("div", { className: "flex space-x-3 p-4", children: [_jsx(Skeleton, { variant: "circular", width: 40, height: 40 }), _jsxs("div", { className: "flex-1 space-y-2", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Skeleton, { variant: "text", width: 120 }), _jsx(Skeleton, { variant: "text", width: 80, height: 14 })] }), _jsx(Skeleton, { variant: "text", width: "100%" }), _jsx(Skeleton, { variant: "text", width: "80%" })] })] }));
}
/**
 * Skeleton Container with loading state management
 */
export function SkeletonContainer({ isLoading, skeleton, children, fallback, }) {
    if (isLoading) {
        return _jsx(_Fragment, { children: skeleton });
    }
    if (!children && fallback) {
        return _jsx(_Fragment, { children: fallback });
    }
    return _jsx(_Fragment, { children: children });
}
// Add shimmer animation to global styles
const shimmerStyles = `
  @keyframes shimmer {
    0% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  }

  .animate-shimmer {
    background: linear-gradient(
      90deg,
      hsl(var(--muted)) 0px,
      hsl(var(--muted-foreground) / 0.1) 20px,
      hsl(var(--muted)) 40px
    );
    background-size: 1000px 100%;
    animation: shimmer 2s infinite linear;
  }
`;
// Inject styles
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = shimmerStyles;
    document.head.appendChild(style);
}
//# sourceMappingURL=skeleton.js.map