/**
 * useApi Hook
 * 
 * Generic hook for making API calls with loading and error states
 */

'use client';

import { useState, useCallback } from 'react';
import { UseApiReturn, APIResponse } from '@/types';

export function useApi<T>(
  apiCall: () => Promise<APIResponse<T>>
): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiCall();

      if (response.error) {
        setError(response.error.message);
        setData(null);
      } else if (response.data) {
        setData(response.data);
        setError(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [apiCall]);

  return {
    data,
    error,
    isLoading,
    refetch,
  };
}
