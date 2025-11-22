import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Alert component - re-exported from @upcoach/ui
 */
import React from 'react';
export const Alert = React.forwardRef(({ className = '', variant = 'default', children, ...props }, ref) => (_jsx("div", { ref: ref, role: "alert", className: `relative w-full rounded-lg border px-4 py-3 text-sm ${className} ${variant === 'destructive' ? 'border-red-200 bg-red-50 text-red-900' : 'border-blue-200 bg-blue-50 text-blue-900'}`, ...props, children: children })));
Alert.displayName = 'Alert';
export const AlertDescription = React.forwardRef(({ className = '', ...props }, ref) => (_jsx("div", { ref: ref, className: `text-sm [&_p]:leading-relaxed ${className}`, ...props })));
AlertDescription.displayName = 'AlertDescription';
export const AlertTitle = React.forwardRef(({ className = '', ...props }, ref) => (_jsx("h5", { ref: ref, className: `mb-1 font-medium leading-none tracking-tight ${className}`, ...props })));
AlertTitle.displayName = 'AlertTitle';
//# sourceMappingURL=alert.js.map