import { ReactNode } from 'react';
interface ExperimentContextType {
    experiments: Record<string, string>;
    isLoading: boolean;
}
export declare function useExperiments(): ExperimentContextType;
interface ExperimentProviderProps {
    children: ReactNode;
}
export declare function ExperimentProvider({ children }: ExperimentProviderProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ExperimentProvider.d.ts.map