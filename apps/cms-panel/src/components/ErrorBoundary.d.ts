import { Component, ReactNode, ErrorInfo } from 'react';
interface Props {
    children: ReactNode;
    fallback?: (error: Error, resetError: () => void, errorInfo?: ErrorInfo) => ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    level?: 'app' | 'route' | 'component';
}
interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    errorCount: number;
}
export default class ErrorBoundary extends Component<Props, State> {
    private resetTimeoutId;
    constructor(props: Props);
    static getDerivedStateFromError(error: Error): Partial<State>;
    componentDidCatch(error: Error, errorInfo: ErrorInfo): void;
    componentWillUnmount(): void;
    reportError(error: Error, errorInfo: ErrorInfo): void;
    scheduleReset(delay: number): void;
    resetError: () => void;
    render(): string | number | boolean | Iterable<ReactNode> | import("react/jsx-runtime").JSX.Element | null | undefined;
}
export { default as RouteErrorBoundary } from './ErrorBoundary/RouteErrorBoundary';
export { default as AsyncBoundary } from './ErrorBoundary/AsyncBoundary';
//# sourceMappingURL=ErrorBoundary.d.ts.map