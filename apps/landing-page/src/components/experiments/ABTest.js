'use client';
import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { useExperiment } from '@/services/experiments';
export function ABTest({ experimentId, children, fallback }) {
    const { variant } = useExperiment(experimentId);
    // If no variant or control, show fallback or first child
    if (variant === 'control') {
        return _jsx(_Fragment, { children: fallback || children });
    }
    return _jsx(_Fragment, { children: children });
}
export function Variant({ variant, children }) {
    return _jsx("div", { "data-variant": variant, children: children });
}
export function ABTestSwitch({ experimentId, children }) {
    const { variant } = useExperiment(experimentId);
    // Find matching variant child
    const variantElements = Array.isArray(children) ? children : [children];
    for (const child of variantElements) {
        if (child && typeof child === 'object' && 'props' in child) {
            if (child.props.variant === variant) {
                return _jsx(_Fragment, { children: child });
            }
        }
    }
    // Return first child as fallback
    return _jsx(_Fragment, { children: variantElements[0] });
}
//# sourceMappingURL=ABTest.js.map