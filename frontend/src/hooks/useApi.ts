/**
 * useApi Hook
 * 
 * Generic hook for making API calls with loading and error states
 * T078 - Supports client-side caching with TTL
 */

'use client';

import { useState, useCallback } from 'react';
import { UseApiReturn, APIResponse } from '@/types';
import { apiCache } from '@/lib/cache';

interface UseApiOptions {
  /**
   * Enable caching (default: false)
   */
  cache?: boolean;
  
  /**
   * Cache key (required if cache is enabled)
   */
  cacheKey?: string;
  
  /**
   * Cache TTL in milliseconds (default: 5 minutes)
   */
  cacheTTL?: number;
}

export function useApi<T>(
  apiCall: () => Promise<APIResponse<T>>,
  options?: UseApiOptions
): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refetch = useCallback(async (skipCache: boolean = false) => {
    setIsLoading(true);
    setError(null);

    try {
      // T078: Check cache first if enabled
      if (options?.cache && options?.cacheKey && !skipCache) {
        const cachedData = apiCache.get<T>(options.cacheKey, options.cacheTTL);
        
        if (cachedData) {
          setData(cachedData);
          setError(null);
          setIsLoading(false);
          return;
        }
      }

      const response = await apiCall();

      if (response.error) {
        setError(response.error.message);
        setData(null);
      } else if (response.data) {
        setData(response.data);
        setError(null);
        
        // T078: Cache successful response
        if (options?.cache && options?.cacheKey) {
          apiCache.set(options.cacheKey, response.data);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [apiCall, options]);

  return {
    data,
    error,
    isLoading,
    refetch,
  };
}
