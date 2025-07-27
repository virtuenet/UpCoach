'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getActiveExperiments, markReturningUser } from '@/services/experiments';

interface ExperimentContextType {
  experiments: Record<string, string>;
  isLoading: boolean;
}

const ExperimentContext = createContext<ExperimentContextType>({
  experiments: {},
  isLoading: true,
});

export function useExperiments() {
  return useContext(ExperimentContext);
}

interface ExperimentProviderProps {
  children: ReactNode;
}

export function ExperimentProvider({ children }: ExperimentProviderProps) {
  const [experiments, setExperiments] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get active experiments
    const activeExperiments = getActiveExperiments();
    setExperiments(activeExperiments);
    setIsLoading(false);
    
    // Mark as returning user after first visit
    const timer = setTimeout(() => {
      markReturningUser();
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <ExperimentContext.Provider value={{ experiments, isLoading }}>
      {children}
    </ExperimentContext.Provider>
  );
}