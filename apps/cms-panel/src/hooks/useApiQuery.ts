/**
 * React Query Hooks for Optimized Data Fetching
 * Implements caching, prefetching, and optimistic updates
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
  useInfiniteQuery,
  UseInfiniteQueryOptions,
} from '@tanstack/react-query';
import { validatedApi } from '../services/api/validatedApiClient';
import { logger } from '../utils/logger';
import { toast } from 'react-hot-toast';

// Query key factory for consistent cache keys
export const queryKeys = {
  all: ['api'] as const,

  // Users
  users: () => [...queryKeys.all, 'users'] as const,
  user: (id: string) => [...queryKeys.users(), id] as const,
  userList: (filters?: any) => [...queryKeys.users(), 'list', filters] as const,

  // Content
  content: () => [...queryKeys.all, 'content'] as const,
  contentItem: (id: string) => [...queryKeys.content(), id] as const,
  contentList: (filters?: any) => [...queryKeys.content(), 'list', filters] as const,
  contentVersions: (id: string) => [...queryKeys.content(), id, 'versions'] as const,

  // Media
  media: () => [...queryKeys.all, 'media'] as const,
  mediaItem: (id: string) => [...queryKeys.media(), id] as const,
  mediaList: (filters?: any) => [...queryKeys.media(), 'list', filters] as const,

  // Analytics
  analytics: () => [...queryKeys.all, 'analytics'] as const,
  analyticsOverview: (range?: any) => [...queryKeys.analytics(), 'overview', range] as const,
  analyticsContent: (range?: any) => [...queryKeys.analytics(), 'content', range] as const,

  // Settings
  settings: () => [...queryKeys.all, 'settings'] as const,
  setting: (key: string) => [...queryKeys.settings(), key] as const,
};

// Default query options
const defaultQueryOptions: Partial<UseQueryOptions> = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  retry: 3,
  retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  refetchOnWindowFocus: false,
  refetchOnReconnect: 'always',
};

/**
 * Generic data fetching hook with caching
 */
export function useApiQuery<T = any>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  options?: Partial<UseQueryOptions<T, Error, T, readonly unknown[]>>
) {
  return useQuery<T, Error, T, readonly unknown[]>({
    queryKey,
    queryFn: async () => {
      try {
        logger.debug('Fetching data', { queryKey });
        const data = await queryFn();
        logger.debug('Data fetched successfully', { queryKey });
        return data;
      } catch (error) {
        logger.error('Query failed', { queryKey, error });
        throw error;
      }
    },
    ...defaultQueryOptions,
    ...options,
  } as any);
}

/**
 * Paginated data fetching hook
 */
export function usePaginatedQuery<T = any>(
  queryKey: readonly unknown[],
  queryFn: (page: number) => Promise<{ data: T[]; total: number; page: number; pageSize: number }>,
  page: number = 1,
  options?: Partial<
    UseQueryOptions<
      { data: T[]; total: number; page: number; pageSize: number },
      Error,
      { data: T[]; total: number; page: number; pageSize: number },
      readonly unknown[]
    >
  >
) {
  return useApiQuery([...queryKey, { page }], () => queryFn(page), options);
}

/**
 * Infinite scrolling hook
 */
export function useInfiniteApiQuery<T = any>(
  queryKey: readonly unknown[],
  queryFn: ({ pageParam }: { pageParam?: any }) => Promise<{
    data: T[];
    nextPage?: number;
    hasMore: boolean;
  }>,
  options?: Partial<
    UseInfiniteQueryOptions<
      {
        data: T[];
        nextPage?: number;
        hasMore: boolean;
      },
      Error,
      { data: T[]; nextPage?: number; hasMore: boolean },
      any,
      any
    >
  >
) {
  return useInfiniteQuery({
    queryKey,
    queryFn: queryFn as any,
    initialPageParam: 1,
    getNextPageParam: (lastPage: { data: any[]; nextPage?: number; hasMore: boolean }) =>
      lastPage.hasMore ? lastPage.nextPage : undefined,
    ...options,
  } as any);
}

/**
 * Mutation hook with optimistic updates
 */
export function useApiMutation<TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, Error, TVariables> & {
    invalidateQueries?: readonly unknown[][];
    optimisticUpdate?: (queryClient: any, variables: TVariables) => void;
    successMessage?: string;
    errorMessage?: string;
  }
) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    mutationFn,
    onMutate: async variables => {
      // Optimistic update
      if (options?.optimisticUpdate) {
        options.optimisticUpdate(queryClient, variables);
      }

      // Call original onMutate if provided
      if (options?.onMutate) {
        return options.onMutate(variables);
      }
    },
    onSuccess: (data, variables, context) => {
      // Show success message
      if (options?.successMessage) {
        toast(options.successMessage);
      }

      // Invalidate related queries
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }

      // Call original onSuccess if provided
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      // Show error message
      const message = options?.errorMessage || error.message || 'An error occurred';
      toast(message);

      // Log error
      logger.error('Mutation failed', { error, variables });

      // Call original onError if provided
      if (options?.onError) {
        options.onError(error, variables, context);
      }
    },
    ...options,
  });
}

/**
 * Hook for users data
 */
export function useUsers(filters?: any) {
  return useApiQuery(queryKeys.userList(filters), () => validatedApi.paginated('/users', filters));
}

/**
 * Hook for single user
 */
export function useUser(id: string) {
  return useApiQuery(queryKeys.user(id), () => validatedApi.get(`/users/${id}`), {
    enabled: !!id,
  });
}

/**
 * Hook for content list
 */
export function useContent(filters?: any) {
  return useApiQuery(
    queryKeys.contentList(filters),
    () => validatedApi.paginated('/content', filters),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes for content
    }
  );
}

/**
 * Hook for single content item
 */
export function useContentItem(id: string) {
  return useApiQuery(queryKeys.contentItem(id), () => validatedApi.get(`/content/${id}`), {
    enabled: !!id,
  });
}

/**
 * Hook for creating content with optimistic update
 */
export function useCreateContent() {
  return useApiMutation((data: any) => validatedApi.post('/content', data), {
    optimisticUpdate: (client, newContent) => {
      // Add new content to list optimistically
      client.setQueryData(queryKeys.contentList(), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: [newContent, ...old.data],
          total: old.total + 1,
        };
      });
    },
    invalidateQueries: [[...queryKeys.content()]],
    successMessage: 'Content created successfully',
    errorMessage: 'Failed to create content',
  });
}

/**
 * Hook for updating content with optimistic update
 */
export function useUpdateContent(id: string) {
  return useApiMutation((data: any) => validatedApi.put(`/content/${id}`, data), {
    optimisticUpdate: (client, updatedContent) => {
      // Update content in cache optimistically
      client.setQueryData(queryKeys.contentItem(id), updatedContent);

      // Update in list if exists
      client.setQueryData(queryKeys.contentList(), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((item: any) =>
            item.id === id ? { ...item, ...updatedContent } : item
          ),
        };
      });
    },
    invalidateQueries: [[...queryKeys.contentItem(id)], [...queryKeys.contentList()]],
    successMessage: 'Content updated successfully',
    errorMessage: 'Failed to update content',
  });
}

/**
 * Hook for deleting content
 */
export function useDeleteContent() {
  return useApiMutation((id: string) => validatedApi.delete(`/content/${id}`), {
    optimisticUpdate: (client, id) => {
      // Remove from list optimistically
      client.setQueryData(queryKeys.contentList(), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.filter((item: any) => item.id !== id),
          total: old.total - 1,
        };
      });
    },
    invalidateQueries: [[...queryKeys.content()]],
    successMessage: 'Content deleted successfully',
    errorMessage: 'Failed to delete content',
  });
}

/**
 * Hook for analytics overview
 */
export function useAnalyticsOverview(dateRange?: { start: Date; end: Date }) {
  return useApiQuery(
    queryKeys.analyticsOverview(dateRange),
    () => validatedApi.get('/analytics/overview', { dateRange }),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes for analytics
    }
  );
}

/**
 * Hook for media with infinite scrolling
 */
export function useInfiniteMedia(filters?: any) {
  return useInfiniteApiQuery(queryKeys.mediaList(filters), async ({ pageParam = 1 }) => {
    const result = await validatedApi.paginated('/media', {
      ...filters,
      page: pageParam,
      limit: 20,
    });

    return {
      data: result.data,
      nextPage: pageParam + 1,
      hasMore: pageParam * 20 < result.pagination.total,
    };
  });
}

/**
 * Hook for file upload with progress
 */
export function useFileUpload() {
  return useApiMutation(
    async ({ file, onProgress }: { file: File; onProgress?: (progress: number) => void }) => {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Upload with progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', e => {
          if (e.lengthComputable && onProgress) {
            const progress = Math.round((e.loaded / e.total) * 100);
            onProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.open('POST', '/api/media/upload');
        xhr.send(formData);
      });
    },
    {
      invalidateQueries: [[...queryKeys.media()]],
      successMessage: 'File uploaded successfully',
      errorMessage: 'Failed to upload file',
    }
  );
}

/**
 * Prefetch data for better UX
 */
export function usePrefetchContent(id: string) {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.contentItem(id),
      queryFn: () => validatedApi.get(`/content/${id}`),
      staleTime: 10 * 60 * 1000,
    });
  };
}

/**
 * Hook for real-time data with polling
 */
export function useRealtimeData<T = any>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  pollingInterval: number = 30000, // 30 seconds default
  enabled: boolean = true
) {
  return useApiQuery(queryKey, queryFn, {
    refetchInterval: enabled ? pollingInterval : false,
    refetchIntervalInBackground: false,
  });
}

/**
 * Hook for search with debouncing (handled by component)
 */
export function useSearch(query: string, type: 'content' | 'users' | 'media') {
  return useApiQuery(
    [queryKeys.all, 'search', type, query],
    () => validatedApi.get(`/search/${type}`, { q: query }),
    {
      enabled: query.length >= 2, // Only search with 2+ characters
      staleTime: 60000, // 1 minute
      placeholderData: previousData => previousData,
    }
  );
}

/**
 * Hook to invalidate all queries (for logout, etc.)
 */
export function useInvalidateAll() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.all });
    queryClient.clear(); // Clear all cache
  };
}
