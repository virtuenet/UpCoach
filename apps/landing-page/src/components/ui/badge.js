import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "@/lib/utils";
function Badge({ className, variant = 'default', ...props }) {
    return (_jsx("div", { className: cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", {
            'border-transparent bg-primary text-primary-foreground hover:bg-primary/80': variant === 'default',
            'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
            'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80': variant === 'destructive',
            'text-foreground': variant === 'outline',
        }, className), ...props }));
}
export { Badge };
//# sourceMappingURL=badge.js.map