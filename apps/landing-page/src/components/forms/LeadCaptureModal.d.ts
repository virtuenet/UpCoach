interface LeadCaptureModalProps {
    trigger?: 'exit-intent' | 'time-based' | 'scroll-based' | 'manual';
    delay?: number;
    scrollPercentage?: number;
    isOpen?: boolean;
    onClose?: () => void;
}
export default function LeadCaptureModal({ trigger, delay, scrollPercentage, isOpen: controlledIsOpen, onClose: controlledOnClose, }: LeadCaptureModalProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=LeadCaptureModal.d.ts.map