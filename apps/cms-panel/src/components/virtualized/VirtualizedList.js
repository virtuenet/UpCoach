import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Virtualized List Component
 * High-performance list rendering for large datasets
 */
import { useRef, useCallback, useMemo } from 'react';
import { VariableSizeList as List, FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import InfiniteLoader from 'react-window-infinite-loader';
import { cn } from '../../lib/utils';
export function VirtualizedList({ items, renderItem, itemHeight = 50, overscanCount = 5, hasNextPage = false, isNextPageLoading = false, loadNextPage, threshold = 15, className, emptyMessage = 'No items to display', loadingComponent, estimatedItemSize = 50, onScroll, header, footer, }) {
    const listRef = useRef(null);
    const itemCount = hasNextPage ? items.length + 1 : items.length;
    // Check if all items are loaded
    const isItemLoaded = useCallback((index) => !hasNextPage || index < items.length, [hasNextPage, items.length]);
    // Load more items
    const loadMoreItems = useCallback(() => {
        if (isNextPageLoading || !loadNextPage) {
            return Promise.resolve();
        }
        return loadNextPage();
    }, [isNextPageLoading, loadNextPage]);
    // Render individual item
    const Item = useCallback(({ index, style }) => {
        // Loading indicator for next page
        if (!isItemLoaded(index)) {
            return (_jsx("div", { style: style, className: "flex items-center justify-center p-4", children: loadingComponent || (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" }), _jsx("span", { className: "text-sm text-muted-foreground", children: "Loading more..." })] })) }));
        }
        const item = items[index];
        return renderItem(item, index, style);
    }, [items, isItemLoaded, renderItem, loadingComponent]);
    // Calculate item height
    const getItemSize = useCallback((index) => {
        if (typeof itemHeight === 'function') {
            return itemHeight(index);
        }
        return itemHeight;
    }, [itemHeight]);
    // Handle scroll events
    const handleScroll = useCallback(({ scrollDirection, scrollOffset }) => {
        if (onScroll) {
            onScroll(scrollOffset, scrollDirection);
        }
    }, [onScroll]);
    // Empty state
    if (items.length === 0 && !isNextPageLoading) {
        return (_jsx("div", { className: "flex items-center justify-center h-64 text-muted-foreground", children: emptyMessage }));
    }
    const isVariableHeight = typeof itemHeight === 'function';
    return (_jsxs("div", { className: cn('h-full w-full', className), children: [header, _jsx(AutoSizer, { children: ({ height, width }) => (_jsx(InfiniteLoader, { isItemLoaded: isItemLoaded, itemCount: itemCount, loadMoreItems: loadMoreItems, threshold: threshold, children: ({ onItemsRendered, ref }) => {
                        if (isVariableHeight) {
                            return (_jsx(List, { ref: (list) => {
                                    ref(list);
                                    listRef.current = list;
                                }, height: height, width: width, itemCount: itemCount, itemSize: getItemSize, onItemsRendered: onItemsRendered, onScroll: handleScroll, overscanCount: overscanCount, estimatedItemSize: estimatedItemSize, children: Item }));
                        }
                        else {
                            return (_jsx(FixedSizeList, { ref: (list) => {
                                    ref(list);
                                    listRef.current = list;
                                }, height: height, width: width, itemCount: itemCount, itemSize: itemHeight, onItemsRendered: onItemsRendered, onScroll: handleScroll, overscanCount: overscanCount, children: Item }));
                        }
                    } })) }), footer] }));
}
export function VirtualizedGrid({ items, renderItem, columnCount, rowHeight = 200, columnWidth, gap = 16, overscanRowCount = 2, overscanColumnCount = 2, className, emptyMessage = 'No items to display', }) {
    const rowCount = Math.ceil(items.length / columnCount);
    const Cell = useCallback(({ columnIndex, rowIndex, style }) => {
        const index = rowIndex * columnCount + columnIndex;
        if (index >= items.length) {
            return null;
        }
        const item = items[index];
        const adjustedStyle = {
            ...style,
            left: style.left + gap / 2,
            top: style.top + gap / 2,
            width: style.width - gap,
            height: style.height - gap,
        };
        return renderItem(item, index, adjustedStyle);
    }, [items, columnCount, renderItem, gap]);
    if (items.length === 0) {
        return (_jsx("div", { className: "flex items-center justify-center h-64 text-muted-foreground", children: emptyMessage }));
    }
    return (_jsx("div", { className: cn('h-full w-full', className), children: _jsx(AutoSizer, { children: ({ height, width }) => {
                const calculatedColumnWidth = columnWidth || width / columnCount;
                return (_jsx(FixedSizeGrid, { height: height, width: width, rowCount: rowCount, columnCount: columnCount, rowHeight: typeof rowHeight === 'function' ? rowHeight(0) : rowHeight, columnWidth: typeof calculatedColumnWidth === 'function'
                        ? calculatedColumnWidth(0)
                        : calculatedColumnWidth, overscanRowCount: overscanRowCount, overscanColumnCount: overscanColumnCount, children: Cell }));
            } }) }));
}
export function VirtualizedTable({ items, columns, rowHeight = 48, headerHeight = 48, overscanCount = 5, onRowClick, selectedIndex, className, emptyMessage = 'No data available', stickyHeader = true, }) {
    const listRef = useRef(null);
    const Row = useCallback(({ index, style }) => {
        const item = items[index];
        const isSelected = index === selectedIndex;
        return (_jsx("div", { style: style, className: cn('flex items-center border-b border-border hover:bg-accent/50 cursor-pointer transition-colors', isSelected && 'bg-accent'), onClick: () => onRowClick?.(item, index), children: columns.map(column => (_jsx("div", { className: cn('px-4 py-2 truncate', column.className), style: { width: column.width || `${100 / columns.length}%` }, children: column.render(item) }, column.key))) }));
    }, [items, columns, selectedIndex, onRowClick]);
    const Header = useMemo(() => (_jsx("div", { className: cn('flex items-center border-b-2 border-border bg-muted font-medium', stickyHeader && 'sticky top-0 z-10'), style: { height: headerHeight }, children: columns.map(column => (_jsx("div", { className: cn('px-4 py-2 truncate', column.className), style: { width: column.width || `${100 / columns.length}%` }, children: column.header }, column.key))) })), [columns, headerHeight, stickyHeader]);
    if (items.length === 0) {
        return (_jsxs("div", { className: className, children: [Header, _jsx("div", { className: "flex items-center justify-center h-64 text-muted-foreground", children: emptyMessage })] }));
    }
    return (_jsxs("div", { className: cn('h-full w-full', className), children: [Header, _jsx(AutoSizer, { children: ({ height, width }) => (_jsx(FixedSizeList, { ref: listRef, height: height - headerHeight, width: width, itemCount: items.length, itemSize: rowHeight, overscanCount: overscanCount, children: Row })) })] }));
}
// Import FixedSizeGrid if not available
const FixedSizeGrid = List.FixedSizeGrid || List;
//# sourceMappingURL=VirtualizedList.js.map