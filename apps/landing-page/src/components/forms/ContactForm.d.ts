interface ContactFormProps {
    variant?: 'default' | 'sidebar' | 'full';
    onSuccess?: (data: ContactFormData) => void;
    className?: string;
}
interface ContactFormData {
    name: string;
    email: string;
    company?: string;
    message: string;
    source?: string;
}
export default function ContactForm({ variant, onSuccess, className, }: ContactFormProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ContactForm.d.ts.map