import { useState, useCallback } from 'react';

interface LoadingState {
  [key: string]: boolean;
}

export const useLoading = (initialState: LoadingState = {}) => {
  const [loading, setLoading] = useState<LoadingState>(initialState);

  const setLoadingState = useCallback((key: string, value: boolean) => {
    setLoading(prev => ({ ...prev, [key]: value }));
  }, []);

  const startLoading = useCallback((key: string) => {
    setLoadingState(key, true);
  }, [setLoadingState]);

  const stopLoading = useCallback((key: string) => {
    setLoadingState(key, false);
  }, [setLoadingState]);

  const isLoading = useCallback((key: string) => {
    return loading[key] || false;
  }, [loading]);

  const withLoading = useCallback(async <T>(
    key: string,
    asyncFn: () => Promise<T>
  ): Promise<T> => {
    try {
      startLoading(key);
      const result = await asyncFn();
      return result;
    } finally {
      stopLoading(key);
    }
  }, [startLoading, stopLoading]);

  return {
    loading,
    setLoadingState,
    startLoading,
    stopLoading,
    isLoading,
    withLoading,
  };
};

export default useLoading;


