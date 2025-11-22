import { ReactNode } from 'react';
interface AsyncBoundaryProps {
    children: ReactNode;
    loadingFallback?: ReactNode;
    errorFallback?: (error: Error, resetError: () => void) => ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}
/**
 * Combines Suspense and Error Boundary for async components
 */
export default function AsyncBoundary({ children, loadingFallback, errorFallback, onError, }: AsyncBoundaryProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=AsyncBoundary.d.ts.map