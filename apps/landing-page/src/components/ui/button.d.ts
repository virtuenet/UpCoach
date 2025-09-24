import * as React from "react";
declare const buttonVariants: {
    variant: {
        default: string;
        primary: string;
        secondary: string;
        outline: string;
        ghost: string;
        danger: string;
    };
    size: {
        default: string;
        sm: string;
        lg: string;
        icon: string;
    };
};
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: keyof typeof buttonVariants.variant;
    size?: keyof typeof buttonVariants.size;
    asChild?: boolean;
}
declare const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;
export { Button };
//# sourceMappingURL=button.d.ts.map