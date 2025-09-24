/**
 * Virtualized List Component
 * High-performance list rendering for large datasets
 */
import React, { CSSProperties } from 'react';
export interface VirtualizedListProps<T = any> {
    items: T[];
    renderItem: (item: T, index: number, style: CSSProperties) => React.ReactNode;
    itemHeight?: number | ((index: number) => number);
    overscanCount?: number;
    hasNextPage?: boolean;
    isNextPageLoading?: boolean;
    loadNextPage?: () => Promise<void>;
    threshold?: number;
    className?: string;
    emptyMessage?: string;
    loadingComponent?: React.ReactNode;
    estimatedItemSize?: number;
    onScroll?: (scrollOffset: number, scrollDirection: 'forward' | 'backward') => void;
    header?: React.ReactNode;
    footer?: React.ReactNode;
}
export declare function VirtualizedList<T = any>({ items, renderItem, itemHeight, overscanCount, hasNextPage, isNextPageLoading, loadNextPage, threshold, className, emptyMessage, loadingComponent, estimatedItemSize, onScroll, header, footer, }: VirtualizedListProps<T>): import("react/jsx-runtime").JSX.Element;
/**
 * Virtualized Grid Component
 */
export interface VirtualizedGridProps<T = any> {
    items: T[];
    renderItem: (item: T, index: number, style: CSSProperties) => React.ReactNode;
    columnCount: number;
    rowHeight?: number | ((index: number) => number);
    columnWidth?: number | ((index: number) => number);
    gap?: number;
    overscanRowCount?: number;
    overscanColumnCount?: number;
    className?: string;
    emptyMessage?: string;
}
export declare function VirtualizedGrid<T = any>({ items, renderItem, columnCount, rowHeight, columnWidth, gap, overscanRowCount, overscanColumnCount, className, emptyMessage, }: VirtualizedGridProps<T>): import("react/jsx-runtime").JSX.Element;
/**
 * Virtualized Table Component
 */
export interface VirtualizedTableColumn<T = any> {
    key: string;
    header: string;
    width?: number;
    render: (item: T) => React.ReactNode;
    className?: string;
}
export interface VirtualizedTableProps<T = any> {
    items: T[];
    columns: VirtualizedTableColumn<T>[];
    rowHeight?: number;
    headerHeight?: number;
    overscanCount?: number;
    onRowClick?: (item: T, index: number) => void;
    selectedIndex?: number;
    className?: string;
    emptyMessage?: string;
    stickyHeader?: boolean;
}
export declare function VirtualizedTable<T = any>({ items, columns, rowHeight, headerHeight, overscanCount, onRowClick, selectedIndex, className, emptyMessage, stickyHeader, }: VirtualizedTableProps<T>): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=VirtualizedList.d.ts.map