/**
 * Skeleton Loading Components
 * Provides loading placeholders for better perceived performance
 */
import React from 'react';
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
    width?: string | number;
    height?: string | number;
    animation?: 'pulse' | 'wave' | 'none';
}
export declare function Skeleton({ className, variant, width, height, animation, ...props }: SkeletonProps): import("react/jsx-runtime").JSX.Element;
/**
 * Card Skeleton
 */
export declare function CardSkeleton({ className }: {
    className?: string;
}): import("react/jsx-runtime").JSX.Element;
/**
 * List Item Skeleton
 */
export declare function ListItemSkeleton({ showAvatar, lines, }: {
    showAvatar?: boolean;
    lines?: number;
}): import("react/jsx-runtime").JSX.Element;
/**
 * Table Skeleton
 */
export declare function TableSkeleton({ rows, columns }: {
    rows?: number;
    columns?: number;
}): import("react/jsx-runtime").JSX.Element;
/**
 * Chart Skeleton
 */
export declare function ChartSkeleton({ height }: {
    height?: number;
}): import("react/jsx-runtime").JSX.Element;
/**
 * Form Skeleton
 */
export declare function FormSkeleton({ fields }: {
    fields?: number;
}): import("react/jsx-runtime").JSX.Element;
/**
 * Dashboard Skeleton
 */
export declare function DashboardSkeleton(): import("react/jsx-runtime").JSX.Element;
/**
 * Content Editor Skeleton
 */
export declare function ContentEditorSkeleton(): import("react/jsx-runtime").JSX.Element;
/**
 * Profile Skeleton
 */
export declare function ProfileSkeleton(): import("react/jsx-runtime").JSX.Element;
/**
 * Media Gallery Skeleton
 */
export declare function MediaGallerySkeleton({ items }: {
    items?: number;
}): import("react/jsx-runtime").JSX.Element;
/**
 * Navigation Skeleton
 */
export declare function NavigationSkeleton({ items }: {
    items?: number;
}): import("react/jsx-runtime").JSX.Element;
/**
 * Comment Skeleton
 */
export declare function CommentSkeleton(): import("react/jsx-runtime").JSX.Element;
/**
 * Skeleton Container with loading state management
 */
export declare function SkeletonContainer({ isLoading, skeleton, children, fallback, }: {
    isLoading: boolean;
    skeleton: React.ReactNode;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=skeleton.d.ts.map