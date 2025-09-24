/**
 * React Query Hooks for Optimized Data Fetching
 * Implements caching, prefetching, and optimistic updates
 */
import { UseQueryOptions, UseMutationOptions, UseInfiniteQueryOptions } from '@tanstack/react-query';
export declare const queryKeys: {
    all: readonly ["api"];
    users: () => readonly ["api", "users"];
    user: (id: string) => readonly ["api", "users", string];
    userList: (filters?: any) => readonly ["api", "users", "list", any];
    content: () => readonly ["api", "content"];
    contentItem: (id: string) => readonly ["api", "content", string];
    contentList: (filters?: any) => readonly ["api", "content", "list", any];
    contentVersions: (id: string) => readonly ["api", "content", string, "versions"];
    media: () => readonly ["api", "media"];
    mediaItem: (id: string) => readonly ["api", "media", string];
    mediaList: (filters?: any) => readonly ["api", "media", "list", any];
    analytics: () => readonly ["api", "analytics"];
    analyticsOverview: (range?: any) => readonly ["api", "analytics", "overview", any];
    analyticsContent: (range?: any) => readonly ["api", "analytics", "content", any];
    settings: () => readonly ["api", "settings"];
    setting: (key: string) => readonly ["api", "settings", string];
};
/**
 * Generic data fetching hook with caching
 */
export declare function useApiQuery<T = any>(queryKey: readonly unknown[], queryFn: () => Promise<T>, options?: Partial<UseQueryOptions<T, Error, T, readonly unknown[]>>): any;
/**
 * Paginated data fetching hook
 */
export declare function usePaginatedQuery<T = any>(queryKey: readonly unknown[], queryFn: (page: number) => Promise<{
    data: T[];
    total: number;
    page: number;
    pageSize: number;
}>, page?: number, options?: Partial<UseQueryOptions<{
    data: T[];
    total: number;
    page: number;
    pageSize: number;
}, Error, {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
}, readonly unknown[]>>): any;
/**
 * Infinite scrolling hook
 */
export declare function useInfiniteApiQuery<T = any>(queryKey: readonly unknown[], queryFn: ({ pageParam }: {
    pageParam?: any;
}) => Promise<{
    data: T[];
    nextPage?: number;
    hasMore: boolean;
}>, options?: Partial<UseInfiniteQueryOptions<{
    data: T[];
    nextPage?: number;
    hasMore: boolean;
}, Error, {
    data: T[];
    nextPage?: number;
    hasMore: boolean;
}, any, any>>): any;
/**
 * Mutation hook with optimistic updates
 */
export declare function useApiMutation<TData = any, TVariables = any>(mutationFn: (variables: TVariables) => Promise<TData>, options?: UseMutationOptions<TData, Error, TVariables> & {
    invalidateQueries?: readonly unknown[][];
    optimisticUpdate?: (queryClient: any, variables: TVariables) => void;
    successMessage?: string;
    errorMessage?: string;
}): any;
/**
 * Hook for users data
 */
export declare function useUsers(filters?: any): any;
/**
 * Hook for single user
 */
export declare function useUser(id: string): any;
/**
 * Hook for content list
 */
export declare function useContent(filters?: any): any;
/**
 * Hook for single content item
 */
export declare function useContentItem(id: string): any;
/**
 * Hook for creating content with optimistic update
 */
export declare function useCreateContent(): any;
/**
 * Hook for updating content with optimistic update
 */
export declare function useUpdateContent(id: string): any;
/**
 * Hook for deleting content
 */
export declare function useDeleteContent(): any;
/**
 * Hook for analytics overview
 */
export declare function useAnalyticsOverview(dateRange?: {
    start: Date;
    end: Date;
}): any;
/**
 * Hook for media with infinite scrolling
 */
export declare function useInfiniteMedia(filters?: any): any;
/**
 * Hook for file upload with progress
 */
export declare function useFileUpload(): any;
/**
 * Prefetch data for better UX
 */
export declare function usePrefetchContent(id: string): () => void;
/**
 * Hook for real-time data with polling
 */
export declare function useRealtimeData<T = any>(queryKey: readonly unknown[], queryFn: () => Promise<T>, pollingInterval?: number, // 30 seconds default
enabled?: boolean): any;
/**
 * Hook for search with debouncing (handled by component)
 */
export declare function useSearch(query: string, type: 'content' | 'users' | 'media'): any;
/**
 * Hook to invalidate all queries (for logout, etc.)
 */
export declare function useInvalidateAll(): () => void;
//# sourceMappingURL=useApiQuery.d.ts.map