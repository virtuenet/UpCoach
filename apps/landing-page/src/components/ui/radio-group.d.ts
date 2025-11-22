import * as React from "react";
export interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
    value?: string;
    onValueChange?: (value: string) => void;
}
export declare const RadioGroup: React.ForwardRefExoticComponent<RadioGroupProps & React.RefAttributes<HTMLDivElement>>;
export interface RadioGroupItemProps extends React.InputHTMLAttributes<HTMLInputElement> {
    value: string;
}
export declare const RadioGroupItem: React.ForwardRefExoticComponent<RadioGroupItemProps & React.RefAttributes<HTMLInputElement>>;
//# sourceMappingURL=radio-group.d.ts.map