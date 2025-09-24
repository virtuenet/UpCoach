'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
import { getActiveExperiments, markReturningUser } from '@/services/experiments';
const ExperimentContext = createContext({
    experiments: {},
    isLoading: true,
});
export function useExperiments() {
    return useContext(ExperimentContext);
}
export function ExperimentProvider({ children }) {
    const [experiments, setExperiments] = useState({});
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
    return (_jsx(ExperimentContext.Provider, { value: { experiments, isLoading }, children: children }));
}
//# sourceMappingURL=ExperimentProvider.js.map