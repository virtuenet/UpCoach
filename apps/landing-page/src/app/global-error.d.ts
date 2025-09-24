export default function GlobalError({ error: _error, reset, }: {
    error: Error & {
        digest?: string;
    };
    reset: () => void;
}): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=global-error.d.ts.map