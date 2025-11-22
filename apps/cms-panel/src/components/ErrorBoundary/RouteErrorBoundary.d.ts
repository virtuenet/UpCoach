import { Component, ReactNode } from 'react';
interface Props {
    children: ReactNode;
    fallback?: (error: Error, resetError: () => void, errorInfo?: React.ErrorInfo) => ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    isolate?: boolean;
}
interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}
export default class RouteErrorBoundary extends Component<Props, State> {
    constructor(props: Props);
    static getDerivedStateFromError(error: Error): Partial<State>;
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void;
    componentDidUpdate(prevProps: Props): void;
    reportError(error: Error, errorInfo: React.ErrorInfo): void;
    resetError: () => void;
    render(): string | number | boolean | Iterable<ReactNode> | import("react/jsx-runtime").JSX.Element | null | undefined;
}
export {};
//# sourceMappingURL=RouteErrorBoundary.d.ts.map