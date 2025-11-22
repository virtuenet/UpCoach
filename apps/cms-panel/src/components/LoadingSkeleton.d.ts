interface LoadingSkeletonProps {
    type?: 'card' | 'table' | 'form' | 'list' | 'spinner';
    rows?: number;
    className?: string;
}
export default function LoadingSkeleton({ type, rows, className, }: LoadingSkeletonProps): import("react/jsx-runtime").JSX.Element;
export declare function CardSkeleton({ className }: {
    className?: string;
}): import("react/jsx-runtime").JSX.Element;
export declare function TableSkeleton({ rows, className }: {
    rows?: number;
    className?: string;
}): import("react/jsx-runtime").JSX.Element;
export declare function FormSkeleton({ fields, className, }: {
    fields?: number;
    className?: string;
}): import("react/jsx-runtime").JSX.Element;
export declare function ListSkeleton({ items, className, }: {
    items?: number;
    className?: string;
}): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=LoadingSkeleton.d.ts.map