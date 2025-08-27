/**
 * Virtualized List Component
 * High-performance list rendering for large datasets
 */

import React, { useRef, useCallback, useMemo, CSSProperties } from 'react';
import { VariableSizeList as List, FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import InfiniteLoader from 'react-window-infinite-loader';
import { cn } from '../../lib/utils';

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

export function VirtualizedList<T = any>({
  items,
  renderItem,
  itemHeight = 50,
  overscanCount = 5,
  hasNextPage = false,
  isNextPageLoading = false,
  loadNextPage,
  threshold = 15,
  className,
  emptyMessage = 'No items to display',
  loadingComponent,
  estimatedItemSize = 50,
  onScroll,
  header,
  footer,
}: VirtualizedListProps<T>) {
  const listRef = useRef<List | FixedSizeList>(null);
  const itemCount = hasNextPage ? items.length + 1 : items.length;
  
  // Check if all items are loaded
  const isItemLoaded = useCallback(
    (index: number) => !hasNextPage || index < items.length,
    [hasNextPage, items.length]
  );

  // Load more items
  const loadMoreItems = useCallback(
    () => {
      if (isNextPageLoading || !loadNextPage) {
        return Promise.resolve();
      }
      return loadNextPage();
    },
    [isNextPageLoading, loadNextPage]
  );

  // Render individual item
  const Item = useCallback(
    ({ index, style }: { index: number; style: CSSProperties }) => {
      // Loading indicator for next page
      if (!isItemLoaded(index)) {
        return (
          <div style={style} className="flex items-center justify-center p-4">
            {loadingComponent || (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground">Loading more...</span>
              </div>
            )}
          </div>
        );
      }

      const item = items[index];
      return renderItem(item, index, style);
    },
    [items, isItemLoaded, renderItem, loadingComponent]
  );

  // Calculate item height
  const getItemSize = useCallback(
    (index: number) => {
      if (typeof itemHeight === 'function') {
        return itemHeight(index);
      }
      return itemHeight;
    },
    [itemHeight]
  );

  // Handle scroll events
  const handleScroll = useCallback(
    ({ scrollDirection, scrollOffset }: any) => {
      if (onScroll) {
        onScroll(scrollOffset, scrollDirection);
      }
    },
    [onScroll]
  );

  // Empty state
  if (items.length === 0 && !isNextPageLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  const isVariableHeight = typeof itemHeight === 'function';
  const ListComponent = isVariableHeight ? List : FixedSizeList;

  return (
    <div className={cn('h-full w-full', className)}>
      {header}
      <AutoSizer>
        {({ height, width }) => (
          <InfiniteLoader
            isItemLoaded={isItemLoaded}
            itemCount={itemCount}
            loadMoreItems={loadMoreItems}
            threshold={threshold}
          >
            {({ onItemsRendered, ref }) => {
              if (isVariableHeight) {
                return (
                  <List
                    ref={(list) => {
                      ref(list);
                      (listRef as any).current = list;
                    }}
                    height={height}
                    width={width}
                    itemCount={itemCount}
                    itemSize={getItemSize}
                    onItemsRendered={onItemsRendered}
                    onScroll={handleScroll}
                    overscanCount={overscanCount}
                    estimatedItemSize={estimatedItemSize}
                  >
                    {Item}
                  </List>
                );
              } else {
                return (
                  <FixedSizeList
                    ref={(list) => {
                      ref(list);
                      (listRef as any).current = list;
                    }}
                    height={height}
                    width={width}
                    itemCount={itemCount}
                    itemSize={itemHeight as number}
                    onItemsRendered={onItemsRendered}
                    onScroll={handleScroll}
                    overscanCount={overscanCount}
                  >
                    {Item}
                  </FixedSizeList>
                );
              }
            }}
          </InfiniteLoader>
        )}
      </AutoSizer>
      {footer}
    </div>
  );
}

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

export function VirtualizedGrid<T = any>({
  items,
  renderItem,
  columnCount,
  rowHeight = 200,
  columnWidth,
  gap = 16,
  overscanRowCount = 2,
  overscanColumnCount = 2,
  className,
  emptyMessage = 'No items to display',
}: VirtualizedGridProps<T>) {
  const rowCount = Math.ceil(items.length / columnCount);

  const Cell = useCallback(
    ({ columnIndex, rowIndex, style }: any) => {
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
    },
    [items, columnCount, renderItem, gap]
  );

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn('h-full w-full', className)}>
      <AutoSizer>
        {({ height, width }) => {
          const calculatedColumnWidth = columnWidth || width / columnCount;
          
          return (
            <FixedSizeGrid
              height={height}
              width={width}
              rowCount={rowCount}
              columnCount={columnCount}
              rowHeight={typeof rowHeight === 'function' ? rowHeight(0) : rowHeight}
              columnWidth={
                typeof calculatedColumnWidth === 'function'
                  ? calculatedColumnWidth(0)
                  : calculatedColumnWidth
              }
              overscanRowCount={overscanRowCount}
              overscanColumnCount={overscanColumnCount}
            >
              {Cell}
            </FixedSizeGrid>
          );
        }}
      </AutoSizer>
    </div>
  );
}

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

export function VirtualizedTable<T = any>({
  items,
  columns,
  rowHeight = 48,
  headerHeight = 48,
  overscanCount = 5,
  onRowClick,
  selectedIndex,
  className,
  emptyMessage = 'No data available',
  stickyHeader = true,
}: VirtualizedTableProps<T>) {
  const listRef = useRef<FixedSizeList>(null);

  const Row = useCallback(
    ({ index, style }: { index: number; style: CSSProperties }) => {
      const item = items[index];
      const isSelected = index === selectedIndex;

      return (
        <div
          style={style}
          className={cn(
            'flex items-center border-b border-border hover:bg-accent/50 cursor-pointer transition-colors',
            isSelected && 'bg-accent'
          )}
          onClick={() => onRowClick?.(item, index)}
        >
          {columns.map((column) => (
            <div
              key={column.key}
              className={cn('px-4 py-2 truncate', column.className)}
              style={{ width: column.width || `${100 / columns.length}%` }}
            >
              {column.render(item)}
            </div>
          ))}
        </div>
      );
    },
    [items, columns, selectedIndex, onRowClick]
  );

  const Header = useMemo(
    () => (
      <div
        className={cn(
          'flex items-center border-b-2 border-border bg-muted font-medium',
          stickyHeader && 'sticky top-0 z-10'
        )}
        style={{ height: headerHeight }}
      >
        {columns.map((column) => (
          <div
            key={column.key}
            className={cn('px-4 py-2 truncate', column.className)}
            style={{ width: column.width || `${100 / columns.length}%` }}
          >
            {column.header}
          </div>
        ))}
      </div>
    ),
    [columns, headerHeight, stickyHeader]
  );

  if (items.length === 0) {
    return (
      <div className={className}>
        {Header}
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('h-full w-full', className)}>
      {Header}
      <AutoSizer>
        {({ height, width }) => (
          <FixedSizeList
            ref={listRef}
            height={height - headerHeight}
            width={width}
            itemCount={items.length}
            itemSize={rowHeight}
            overscanCount={overscanCount}
          >
            {Row}
          </FixedSizeList>
        )}
      </AutoSizer>
    </div>
  );
}

// Import FixedSizeGrid if not available
const FixedSizeGrid = (List as any).FixedSizeGrid || List;