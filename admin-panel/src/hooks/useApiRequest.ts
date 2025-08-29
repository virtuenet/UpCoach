import axios from 'axios';

interface UseApiRequestOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  retryCount?: number;
  retryDelay?: number;
}

interface UseApiRequestReturn<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  execute: (config?: AxiosRequestConfig) => Promise<T>;
  cancel: () => void;
  reset: () => void;
}

/**
 * Custom hook for API requests with automatic cancellation
 * Prevents state updates on unmounted components
 */
export function useApiRequest<T = any>(
  defaultConfig?: AxiosRequestConfig,
  options: UseApiRequestOptions = {}
): UseApiRequestReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  
  const cancelTokenRef = useRef<CancelTokenSource | null>(null);
  const mountedRef = useRef(true);
  const retryCountRef = useRef(0);

  // Cancel any pending request
  const cancel = useCallback(() => {
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel('Request cancelled by user or component unmount');
      cancelTokenRef.current = null;
    }
  }, []);

  // Reset state
  const reset = useCallback(() => {
    cancel();
    if (mountedRef.current) {
      setData(null);
      setError(null);
      setLoading(false);
      retryCountRef.current = 0;
    }
  }, [cancel]);

  // Execute API request with cancellation support
  const execute = useCallback(async (overrideConfig?: AxiosRequestConfig): Promise<T> => {
    // Cancel any existing request
    cancel();

    // Create new cancel token
    cancelTokenRef.current = axios.CancelToken.source();

    // Merge configurations
    const config: AxiosRequestConfig = {
      ...defaultConfig,
      ...overrideConfig,
      cancelToken: cancelTokenRef.current.token,
    };

    // Update state only if mounted
    if (mountedRef.current) {
      setLoading(true);
      setError(null);
    }

    try {
      const response: AxiosResponse<T> = await apiClient.request(config);
      
      // Only update state if component is still mounted
      if (mountedRef.current) {
        setData(response.data);
        setLoading(false);
        options.onSuccess?.(response.data);
        retryCountRef.current = 0;
      }
      
      return response.data;
    } catch (err: any) {
      // Check if request was cancelled
      if (axios.isCancel(err)) {
        console.log('Request cancelled:', err.message);
        if (mountedRef.current) {
          setLoading(false);
        }
        throw err;
      }

      // Handle network errors with retry
      if (err.code === 'ECONNABORTED' || !err.response) {
        const maxRetries = options.retryCount || 0;
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          const delay = options.retryDelay || 1000;
          
          console.log(`Retrying request (${retryCountRef.current}/${maxRetries})...`);
          
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, retryCountRef.current - 1)));
          
          // Retry the request
          return execute(overrideConfig);
        }
      }

      // Update error state only if mounted
      if (mountedRef.current) {
        setError(err);
        setLoading(false);
        options.onError?.(err);
      }
      
      throw err;
    } finally {
      // Clear cancel token reference
      if (cancelTokenRef.current?.token.reason) {
        cancelTokenRef.current = null;
      }
    }
  }, [defaultConfig, options]);

  // Execute immediately if requested
  useEffect(() => {
    if (options.immediate && defaultConfig) {
      execute();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      cancel();
    };
  }, [cancel]);

  return {
    data,
    error,
    loading,
    execute,
    cancel,
    reset,
  };
}

/**
 * Specialized hook for GET requests
 */
export function useApiGet<T = any>(
  url: string,
  options: UseApiRequestOptions = {}
): UseApiRequestReturn<T> {
  return useApiRequest<T>(
    { method: 'GET', url },
    options
  );
}

/**
 * Specialized hook for POST requests
 */
export function useApiPost<T = any>(
  url: string,
  options: UseApiRequestOptions = {}
): UseApiRequestReturn<T> {
  return useApiRequest<T>(
    { method: 'POST', url },
    options
  );
}

/**
 * Specialized hook for PUT requests
 */
export function useApiPut<T = any>(
  url: string,
  options: UseApiRequestOptions = {}
): UseApiRequestReturn<T> {
  return useApiRequest<T>(
    { method: 'PUT', url },
    options
  );
}

/**
 * Specialized hook for DELETE requests
 */
export function useApiDelete<T = any>(
  url: string,
  options: UseApiRequestOptions = {}
): UseApiRequestReturn<T> {
  return useApiRequest<T>(
    { method: 'DELETE', url },
    options
  );
}

/**
 * Hook for parallel API requests with cancellation
 */
export function useParallelApiRequests<T extends readonly unknown[]>(
  configs: { [K in keyof T]: AxiosRequestConfig }
): {
  data: { [K in keyof T]: T[K] | null };
  errors: { [K in keyof T]: Error | null };
  loading: boolean;
  execute: () => Promise<{ [K in keyof T]: T[K] }>;
  cancel: () => void;
} {
  const [data, setData] = useState<{ [K in keyof T]: T[K] | null }>(
    configs.map(() => null) as any
  );
  const [errors, setErrors] = useState<{ [K in keyof T]: Error | null }>(
    configs.map(() => null) as any
  );
  const [loading, setLoading] = useState(false);
  
  const cancelTokensRef = useRef<CancelTokenSource[]>([]);
  const mountedRef = useRef(true);

  const cancel = useCallback(() => {
    cancelTokensRef.current.forEach(source => {
      source.cancel('Parallel requests cancelled');
    });
    cancelTokensRef.current = [];
  }, []);

  const execute = useCallback(async () => {
    cancel();
    
    if (mountedRef.current) {
      setLoading(true);
      setErrors(configs.map(() => null) as any);
    }

    const sources = configs.map(() => axios.CancelToken.source());
    cancelTokensRef.current = sources;

    try {
      const promises = configs.map((config, index) =>
        apiClient.request({
          ...config,
          cancelToken: sources[index].token,
        })
      );

      const responses = await Promise.all(promises);
      const responseData = responses.map(r => r.data) as { [K in keyof T]: T[K] };

      if (mountedRef.current) {
        setData(responseData);
        setLoading(false);
      }

      return responseData;
    } catch (err: any) {
      if (mountedRef.current && !axios.isCancel(err)) {
        setLoading(false);
      }
      throw err;
    }
  }, [configs, cancel]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cancel();
    };
  }, [cancel]);

  return {
    data,
    errors,
    loading,
    execute,
    cancel,
  };
}

/**
 * Hook for sequential API requests with proper cancellation
 */
export function useSequentialApiRequests<T extends readonly unknown[]>(
  configs: { [K in keyof T]: AxiosRequestConfig | ((prevData: any) => AxiosRequestConfig) }
): {
  data: { [K in keyof T]: T[K] | null };
  currentStep: number;
  totalSteps: number;
  error: Error | null;
  loading: boolean;
  execute: () => Promise<{ [K in keyof T]: T[K] }>;
  cancel: () => void;
} {
  const [data, setData] = useState<{ [K in keyof T]: T[K] | null }>(
    configs.map(() => null) as any
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  
  const cancelTokenRef = useRef<CancelTokenSource | null>(null);
  const mountedRef = useRef(true);

  const cancel = useCallback(() => {
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel('Sequential requests cancelled');
      cancelTokenRef.current = null;
    }
  }, []);

  const execute = useCallback(async () => {
    cancel();
    
    if (mountedRef.current) {
      setLoading(true);
      setError(null);
      setCurrentStep(0);
      setData(configs.map(() => null) as any);
    }

    const results: any[] = [];

    try {
      for (let i = 0; i < configs.length; i++) {
        if (mountedRef.current) {
          setCurrentStep(i + 1);
        }

        cancelTokenRef.current = axios.CancelToken.source();
        
        const config = typeof configs[i] === 'function' 
          ? (configs[i] as Function)(results[i - 1])
          : configs[i];

        const response = await apiClient.request({
          ...config,
          cancelToken: cancelTokenRef.current.token,
        });

        results.push(response.data);
        
        if (mountedRef.current) {
          setData(prev => {
            const newData = [...prev] as any;
            newData[i] = response.data;
            return newData;
          });
        }
      }

      if (mountedRef.current) {
        setLoading(false);
      }

      return results as { [K in keyof T]: T[K] };
    } catch (err: any) {
      if (mountedRef.current && !axios.isCancel(err)) {
        setError(err);
        setLoading(false);
      }
      throw err;
    }
  }, [configs, cancel]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cancel();
    };
  }, [cancel]);

  return {
    data,
    currentStep,
    totalSteps: configs.length,
    error,
    loading,
    execute,
    cancel,
  };
}