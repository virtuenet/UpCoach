import { jsx as _jsx } from "react/jsx-runtime";
import { Suspense } from 'react';
import RouteErrorBoundary from './RouteErrorBoundary';
import LoadingSkeleton from '../LoadingSkeleton';
/**
 * Combines Suspense and Error Boundary for async components
 */
export default function AsyncBoundary({ children, loadingFallback, errorFallback, onError, }) {
    return (_jsx(RouteErrorBoundary, { fallback: errorFallback, onError: onError, isolate: true, children: _jsx(Suspense, { fallback: loadingFallback || _jsx(LoadingSkeleton, {}), children: children }) }));
}
//# sourceMappingURL=AsyncBoundary.js.map