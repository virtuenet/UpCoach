import { ReactNode } from 'react';
interface ABTestProps {
    experimentId: string;
    children: ReactNode;
    fallback?: ReactNode;
}
export declare function ABTest({ experimentId, children, fallback }: ABTestProps): import("react/jsx-runtime").JSX.Element;
interface VariantProps {
    variant: string;
    children: ReactNode;
}
export declare function Variant({ variant, children }: VariantProps): import("react/jsx-runtime").JSX.Element;
interface ABTestSwitchProps {
    experimentId: string;
    children: ReactNode;
}
export declare function ABTestSwitch({ experimentId, children }: ABTestSwitchProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ABTest.d.ts.map