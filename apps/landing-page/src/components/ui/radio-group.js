import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "@/lib/utils";
export const RadioGroup = React.forwardRef(({ className, children, value, onValueChange, ...props }, ref) => {
    const handleChange = (event) => {
        if (onValueChange) {
            onValueChange(event.target.value);
        }
    };
    return (_jsx("div", { ref: ref, role: "radiogroup", className: cn("space-y-2", className), ...props, children: React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
                return React.cloneElement(child, {
                    checked: child.props.value === value,
                    onChange: handleChange,
                });
            }
            return child;
        }) }));
});
RadioGroup.displayName = "RadioGroup";
export const RadioGroupItem = React.forwardRef(({ children, value, className, ...props }, ref) => {
    return (_jsxs("label", { className: cn("flex items-center space-x-2 cursor-pointer", "data-[state=checked]:text-primary", className), children: [_jsx("input", { type: "radio", value: value, ref: ref, className: "form-radio text-primary focus:ring-primary", ...props }), children] }));
});
RadioGroupItem.displayName = "RadioGroupItem";
//# sourceMappingURL=radio-group.js.map