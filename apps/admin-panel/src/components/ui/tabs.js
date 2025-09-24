import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Tabs component - Basic implementation for admin panel
 */
import { createContext, useContext, useState } from 'react';
const TabsContext = createContext(undefined);
export const Tabs = ({ value, onValueChange, defaultValue, children, className = '' }) => {
    const [internalValue, setInternalValue] = useState(defaultValue || '');
    const currentValue = value ?? internalValue;
    const handleValueChange = onValueChange ?? setInternalValue;
    return (_jsx(TabsContext.Provider, { value: { value: currentValue, onValueChange: handleValueChange }, children: _jsx("div", { className: `w-full ${className}`, children: children }) }));
};
export const TabsList = ({ children, className = '' }) => (_jsx("div", { className: `inline-flex h-9 items-center justify-center rounded-lg bg-gray-100 p-1 text-gray-500 ${className}`, children: children }));
export const TabsTrigger = ({ value, children, className = '' }) => {
    const context = useContext(TabsContext);
    if (!context) {
        throw new Error('TabsTrigger must be used within Tabs');
    }
    const isActive = context.value === value;
    return (_jsx("button", { className: `inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${isActive ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'} ${className}`, onClick: () => context.onValueChange(value), children: children }));
};
export const TabsContent = ({ value, children, className = '' }) => {
    const context = useContext(TabsContext);
    if (!context) {
        throw new Error('TabsContent must be used within Tabs');
    }
    if (context.value !== value) {
        return null;
    }
    return (_jsx("div", { className: `mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 ${className}`, children: children }));
};
//# sourceMappingURL=tabs.js.map