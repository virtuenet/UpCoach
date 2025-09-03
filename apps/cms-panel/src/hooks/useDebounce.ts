/**
 * Debounce and Search Hooks
 * Optimized search and filtering with debouncing
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

/**
 * Debounce hook for delayed value updates
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounced callback hook
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): [T, () => void] {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);

  // Update callback ref on each render
  useEffect(() => {
    callbackRef.current = callback;
  });

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  ) as T;

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [debouncedCallback, cancel];
}

/**
 * Throttle hook for rate-limiting function calls
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): T {
  const lastRunRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);

  // Update callback ref on each render
  useEffect(() => {
    callbackRef.current = callback;
  });

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRunRef.current;

      if (timeSinceLastRun >= delay) {
        lastRunRef.current = now;
        callbackRef.current(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          lastRunRef.current = Date.now();
          callbackRef.current(...args);
        }, delay - timeSinceLastRun);
      }
    },
    [delay]
  ) as T;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
}

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

export function useSearch<T = any>(
  items: T[],
  searchKeys: (keyof T)[],
  options: UseSearchOptions = {}
) {
  const { delay = 300, minLength = 2, maxResults = 100, cacheResults = true, onSearch } = options;

  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(query, delay);
  const cacheRef = useRef<Map<string, T[]>>(new Map());

  // Perform search
  const searchResults = useMemo(() => {
    if (debouncedQuery.length < minLength) {
      return items;
    }

    // Check cache
    if (cacheResults && cacheRef.current.has(debouncedQuery)) {
      return cacheRef.current.get(debouncedQuery)!;
    }

    setIsSearching(true);

    const lowerQuery = debouncedQuery.toLowerCase();
    const results = items
      .filter(item => {
        return searchKeys.some(key => {
          const value = item[key];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(lowerQuery);
          }
          if (typeof value === 'number') {
            return value.toString().includes(lowerQuery);
          }
          return false;
        });
      })
      .slice(0, maxResults);

    // Cache results
    if (cacheResults) {
      cacheRef.current.set(debouncedQuery, results);
    }

    setIsSearching(false);

    // Callback
    if (onSearch) {
      onSearch(debouncedQuery);
    }

    return results;
  }, [debouncedQuery, items, searchKeys, minLength, maxResults, cacheResults, onSearch]);

  // Clear cache when items change
  useEffect(() => {
    cacheRef.current.clear();
  }, [items]);

  return {
    query,
    setQuery,
    debouncedQuery,
    results: searchResults,
    isSearching,
    clearSearch: () => setQuery(''),
    resultCount: searchResults.length,
    hasResults: searchResults.length > 0,
  };
}

/**
 * Advanced filter hook with multiple criteria
 */
export interface FilterCriteria<T> {
  field: keyof T;
  operator:
    | 'equals'
    | 'contains'
    | 'startsWith'
    | 'endsWith'
    | 'gt'
    | 'lt'
    | 'gte'
    | 'lte'
    | 'between'
    | 'in';
  value: any;
  caseSensitive?: boolean;
}

export function useFilter<T = any>(items: T[], initialFilters: FilterCriteria<T>[] = []) {
  const [filters, setFilters] = useState<FilterCriteria<T>[]>(initialFilters);
  const [isFiltering, setIsFiltering] = useState(false);

  const filteredItems = useMemo(() => {
    if (filters.length === 0) {
      return items;
    }

    setIsFiltering(true);

    const results = items.filter(item => {
      return filters.every(filter => {
        const itemValue = item[filter.field];
        const filterValue = filter.value;
        const caseSensitive = filter.caseSensitive ?? false;

        // Handle null/undefined
        if (itemValue === null || itemValue === undefined) {
          return filterValue === null || filterValue === undefined;
        }

        // String operations
        if (typeof itemValue === 'string') {
          const compareValue = caseSensitive ? itemValue : itemValue.toLowerCase();
          const compareFilter = caseSensitive
            ? filterValue
            : (filterValue?.toLowerCase?.() ?? filterValue);

          switch (filter.operator) {
            case 'equals':
              return compareValue === compareFilter;
            case 'contains':
              return compareValue.includes(compareFilter);
            case 'startsWith':
              return compareValue.startsWith(compareFilter);
            case 'endsWith':
              return compareValue.endsWith(compareFilter);
            case 'in':
              return Array.isArray(filterValue) && filterValue.includes(itemValue);
            default:
              return true;
          }
        }

        // Number operations
        if (typeof itemValue === 'number') {
          switch (filter.operator) {
            case 'equals':
              return itemValue === filterValue;
            case 'gt':
              return itemValue > filterValue;
            case 'lt':
              return itemValue < filterValue;
            case 'gte':
              return itemValue >= filterValue;
            case 'lte':
              return itemValue <= filterValue;
            case 'between':
              return (
                Array.isArray(filterValue) &&
                itemValue >= filterValue[0] &&
                itemValue <= filterValue[1]
              );
            case 'in':
              return Array.isArray(filterValue) && filterValue.includes(itemValue);
            default:
              return true;
          }
        }

        // Array operations
        if (Array.isArray(itemValue)) {
          switch (filter.operator) {
            case 'contains':
              return itemValue.includes(filterValue);
            case 'in':
              return Array.isArray(filterValue) && filterValue.some(v => itemValue.includes(v));
            default:
              return true;
          }
        }

        return true;
      });
    });

    setIsFiltering(false);
    return results;
  }, [items, filters]);

  const addFilter = useCallback((filter: FilterCriteria<T>) => {
    setFilters(prev => [...prev, filter]);
  }, []);

  const removeFilter = useCallback((index: number) => {
    setFilters(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateFilter = useCallback((index: number, filter: FilterCriteria<T>) => {
    setFilters(prev => prev.map((f, i) => (i === index ? filter : f)));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters([]);
  }, []);

  const setFieldFilter = useCallback(
    (field: keyof T, value: any, operator: FilterCriteria<T>['operator'] = 'equals') => {
      setFilters(prev => {
        const existing = prev.findIndex(f => f.field === field);
        const newFilter: FilterCriteria<T> = { field, value, operator };

        if (existing >= 0) {
          return prev.map((f, i) => (i === existing ? newFilter : f));
        }
        return [...prev, newFilter];
      });
    },
    []
  );

  return {
    filters,
    setFilters,
    addFilter,
    removeFilter,
    updateFilter,
    clearFilters,
    setFieldFilter,
    filteredItems,
    isFiltering,
    resultCount: filteredItems.length,
    hasResults: filteredItems.length > 0,
  };
}

/**
 * Combined search and filter hook
 */
export function useSearchAndFilter<T = any>(
  items: T[],
  searchKeys: (keyof T)[],
  searchOptions?: UseSearchOptions,
  initialFilters?: FilterCriteria<T>[]
) {
  const search = useSearch(items, searchKeys, searchOptions);
  const filter = useFilter(search.results, initialFilters);

  return {
    // Search
    query: search.query,
    setQuery: search.setQuery,
    debouncedQuery: search.debouncedQuery,
    clearSearch: search.clearSearch,
    isSearching: search.isSearching,

    // Filter
    filters: filter.filters,
    setFilters: filter.setFilters,
    addFilter: filter.addFilter,
    removeFilter: filter.removeFilter,
    updateFilter: filter.updateFilter,
    clearFilters: filter.clearFilters,
    setFieldFilter: filter.setFieldFilter,
    isFiltering: filter.isFiltering,

    // Results
    results: filter.filteredItems,
    resultCount: filter.resultCount,
    hasResults: filter.hasResults,

    // Reset all
    reset: () => {
      search.clearSearch();
      filter.clearFilters();
    },
  };
}

/**
 * Auto-suggest hook for search inputs
 */
export function useAutoSuggest<T = any>(
  getSuggestions: (query: string) => Promise<T[]> | T[],
  options: {
    delay?: number;
    minLength?: number;
    maxSuggestions?: number;
  } = {}
) {
  const { delay = 300, minLength = 2, maxSuggestions = 10 } = options;

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const debouncedQuery = useDebounce(query, delay);

  useEffect(() => {
    if (debouncedQuery.length < minLength) {
      setSuggestions([]);
      setSelectedIndex(-1);
      return;
    }

    let cancelled = false;

    const fetchSuggestions = async () => {
      setIsLoading(true);

      try {
        const results = await getSuggestions(debouncedQuery);

        if (!cancelled) {
          setSuggestions(results.slice(0, maxSuggestions));
          setSelectedIndex(-1);
        }
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
        if (!cancelled) {
          setSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchSuggestions();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, minLength, maxSuggestions, getSuggestions]);

  const selectNext = useCallback(() => {
    setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
  }, [suggestions.length]);

  const selectPrevious = useCallback(() => {
    setSelectedIndex(prev => (prev > -1 ? prev - 1 : -1));
  }, []);

  const selectSuggestion = useCallback(
    (index: number) => {
      if (index >= 0 && index < suggestions.length) {
        setSelectedIndex(index);
        return suggestions[index];
      }
      return null;
    },
    [suggestions]
  );

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setSelectedIndex(-1);
  }, []);

  return {
    query,
    setQuery,
    suggestions,
    isLoading,
    selectedIndex,
    selectNext,
    selectPrevious,
    selectSuggestion,
    clearSuggestions,
    hasSuggestions: suggestions.length > 0,
  };
}
