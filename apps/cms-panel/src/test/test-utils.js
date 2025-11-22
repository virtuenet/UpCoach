import { jsx as _jsx } from "react/jsx-runtime";
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const createTestQueryClient = () => new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
            gcTime: 0,
            staleTime: 0,
        },
        mutations: {
            retry: false,
        },
    },
});
const AllTheProviders = ({ children, routerProps = {}, }) => {
    const queryClient = createTestQueryClient();
    return (_jsx(QueryClientProvider, { client: queryClient, children: _jsx(MemoryRouter, { ...routerProps, children: children }) }));
};
const customRender = (ui, options) => {
    const { routerProps, ...renderOptions } = options || {};
    return render(ui, {
        wrapper: ({ children }) => (_jsx(AllTheProviders, { routerProps: routerProps, children: children })),
        ...renderOptions,
    });
};
// Re-export everything
export * from '@testing-library/react';
export { customRender as render, createTestQueryClient };
//# sourceMappingURL=test-utils.js.map