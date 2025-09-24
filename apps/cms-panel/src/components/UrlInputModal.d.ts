interface UrlInputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (url: string) => void;
    title: string;
    placeholder?: string;
    validateImage?: boolean;
}
export default function UrlInputModal({ isOpen, onClose, onSubmit, title, placeholder, validateImage, }: UrlInputModalProps): import("react/jsx-runtime").JSX.Element | null;
export {};
//# sourceMappingURL=UrlInputModal.d.ts.map