import { useState, useCallback, useRef } from 'react';

interface ProgressState {
  progress: number;
  isActive: boolean;
  message?: string;
}

export const useProgress = () => {
  const [state, setState] = useState<ProgressState>({
    progress: 0,
    isActive: false,
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback((message?: string) => {
    setState({
      progress: 0,
      isActive: true,
      message,
    });

    // Simulate progress
    intervalRef.current = setInterval(() => {
      setState(prev => {
        if (prev.progress >= 100) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return { ...prev, isActive: false };
        }
        return { ...prev, progress: prev.progress + Math.random() * 10 };
      });
    }, 200);
  }, []);

  const update = useCallback((progress: number, message?: string) => {
    setState(prev => ({
      ...prev,
      progress: Math.min(Math.max(progress, 0), 100),
      message: message || prev.message,
    }));
  }, []);

  const complete = useCallback((message?: string) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setState({
      progress: 100,
      isActive: false,
      message: message || 'Terminé',
    });

    // Auto-hide after completion
    setTimeout(() => {
      setState({
        progress: 0,
        isActive: false,
      });
    }, 2000);
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setState({
      progress: 0,
      isActive: false,
    });
  }, []);

  const withProgress = useCallback(async <T>(
    asyncFn: (updateProgress: (progress: number, message?: string) => void) => Promise<T>,
    startMessage?: string
  ): Promise<T> => {
    start(startMessage);
    
    try {
      const result = await asyncFn(update);
      complete('Terminé avec succès');
      return result;
    } catch (error) {
      reset();
      throw error;
    }
  }, [start, update, complete, reset]);

  return {
    ...state,
    start,
    update,
    complete,
    reset,
    withProgress,
  };
};

export default useProgress;







