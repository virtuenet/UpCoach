import { ReactElement } from 'react';
import { RenderOptions, RenderResult } from '@testing-library/react';
import { MemoryRouterProps } from 'react-router-dom';
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
    routerProps?: MemoryRouterProps;
}
declare const createTestQueryClient: () => any;
declare const customRender: (ui: ReactElement, options?: CustomRenderOptions) => RenderResult;
export * from '@testing-library/react';
export { customRender as render, createTestQueryClient };
//# sourceMappingURL=test-utils.d.ts.map