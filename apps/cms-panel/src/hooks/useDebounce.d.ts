/**
 * Debounce and Search Hooks
 * Optimized search and filtering with debouncing
 */
/**
 * Debounce hook for delayed value updates
 */
export declare function useDebounce<T>(value: T, delay?: number): T;
/**
 * Debounced callback hook
 */
export declare function useDebouncedCallback<T extends (...args: any[]) => any>(callback: T, delay?: number): [T, () => void];
/**
 * Throttle hook for rate-limiting function calls
 */
export declare function useThrottle<T extends (...args: any[]) => any>(callback: T, delay?: number): T;
/**
 * Search hook with debouncing and caching
 */
export interface UseSearchOptions {
    delay?: number;
    minLength?: number;
    maxResults?: number;
    cacheResults?: boolean;
    onSearch?: (query: string) => void;
}
export declare function useSearch<T = any>(items: T[], searchKeys: (keyof T)[], options?: UseSearchOptions): {
    query: string;
    setQuery: import("react").Dispatch<import("react").SetStateAction<string>>;
    debouncedQuery: string;
    results: T[];
    isSearching: boolean;
    clearSearch: () => void;
    resultCount: number;
    hasResults: boolean;
};
/**
 * Advanced filter hook with multiple criteria
 */
export interface FilterCriteria<T> {
    field: keyof T;
    operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'gte' | 'lte' | 'between' | 'in';
    value: any;
    caseSensitive?: boolean;
}
export declare function useFilter<T = any>(items: T[], initialFilters?: FilterCriteria<T>[]): {
    filters: FilterCriteria<T>[];
    setFilters: import("react").Dispatch<import("react").SetStateAction<FilterCriteria<T>[]>>;
    addFilter: (filter: FilterCriteria<T>) => void;
    removeFilter: (index: number) => void;
    updateFilter: (index: number, filter: FilterCriteria<T>) => void;
    clearFilters: () => void;
    setFieldFilter: (field: keyof T, value: any, operator?: FilterCriteria<T>["operator"]) => void;
    filteredItems: T[];
    isFiltering: boolean;
    resultCount: number;
    hasResults: boolean;
};
/**
 * Combined search and filter hook
 */
export declare function useSearchAndFilter<T = any>(items: T[], searchKeys: (keyof T)[], searchOptions?: UseSearchOptions, initialFilters?: FilterCriteria<T>[]): {
    query: string;
    setQuery: import("react").Dispatch<import("react").SetStateAction<string>>;
    debouncedQuery: string;
    clearSearch: () => void;
    isSearching: boolean;
    filters: FilterCriteria<T>[];
    setFilters: import("react").Dispatch<import("react").SetStateAction<FilterCriteria<T>[]>>;
    addFilter: (filter: FilterCriteria<T>) => void;
    removeFilter: (index: number) => void;
    updateFilter: (index: number, filter: FilterCriteria<T>) => void;
    clearFilters: () => void;
    setFieldFilter: (field: keyof T, value: any, operator?: "endsWith" | "startsWith" | "in" | "equals" | "contains" | "gt" | "lt" | "gte" | "lte" | "between") => void;
    isFiltering: boolean;
    results: T[];
    resultCount: number;
    hasResults: boolean;
    reset: () => void;
};
/**
 * Auto-suggest hook for search inputs
 */
export declare function useAutoSuggest<T = any>(getSuggestions: (query: string) => Promise<T[]> | T[], options?: {
    delay?: number;
    minLength?: number;
    maxSuggestions?: number;
}): {
    query: string;
    setQuery: import("react").Dispatch<import("react").SetStateAction<string>>;
    suggestions: T[];
    isLoading: boolean;
    selectedIndex: number;
    selectNext: () => void;
    selectPrevious: () => void;
    selectSuggestion: (index: number) => T | null;
    clearSuggestions: () => void;
    hasSuggestions: boolean;
};
//# sourceMappingURL=useDebounce.d.ts.map