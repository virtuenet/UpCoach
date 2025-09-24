import * as React from "react";
export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}
declare function Badge({ className, variant, ...props }: BadgeProps): import("react/jsx-runtime").JSX.Element;
export { Badge };
//# sourceMappingURL=badge.d.ts.map