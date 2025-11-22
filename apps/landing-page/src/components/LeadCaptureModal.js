'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { trackModalView } from '@/services/analytics';
import LeadCaptureForm from './LeadCaptureForm';
export default function LeadCaptureModal({ trigger = 'time-based', delay = 30000, // 30 seconds
scrollPercentage = 50, }) {
    const [isOpen, setIsOpen] = useState(false);
    const [hasBeenShown, setHasBeenShown] = useState(false);
    useEffect(() => {
        // Check if modal has been shown in this session
        const shown = sessionStorage.getItem('leadModalShown');
        if (shown) {
            setHasBeenShown(true);
            return;
        }
        let timeoutId;
        let handleMouseLeave;
        let handleScroll;
        switch (trigger) {
            case 'time-based':
                timeoutId = setTimeout(() => {
                    if (!hasBeenShown) {
                        showModal();
                    }
                }, delay);
                break;
            case 'exit-intent':
                handleMouseLeave = (e) => {
                    if (e.clientY <= 0 && !hasBeenShown) {
                        showModal();
                    }
                };
                document.addEventListener('mouseleave', handleMouseLeave);
                break;
            case 'scroll':
                handleScroll = () => {
                    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
                    const scrolled = (window.scrollY / scrollHeight) * 100;
                    if (scrolled >= scrollPercentage && !hasBeenShown) {
                        showModal();
                    }
                };
                window.addEventListener('scroll', handleScroll);
                break;
        }
        return () => {
            if (timeoutId)
                clearTimeout(timeoutId);
            if (handleMouseLeave)
                document.removeEventListener('mouseleave', handleMouseLeave);
            if (handleScroll)
                window.removeEventListener('scroll', handleScroll);
        };
    }, [trigger, delay, scrollPercentage, hasBeenShown]);
    const showModal = () => {
        setIsOpen(true);
        setHasBeenShown(true);
        sessionStorage.setItem('leadModalShown', 'true');
        trackModalView('lead_capture_modal', trigger);
    };
    const closeModal = () => {
        setIsOpen(false);
    };
    const handleSuccess = () => {
        setTimeout(() => {
            closeModal();
        }, 2000);
    };
    return (_jsx(AnimatePresence, { children: isOpen && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm", onClick: closeModal, children: _jsxs(motion.div, { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.9, opacity: 0 }, transition: { type: 'spring', damping: 30, stiffness: 300 }, className: "relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden", onClick: e => e.stopPropagation(), children: [_jsx("button", { onClick: closeModal, className: "absolute top-4 right-4 z-10 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors duration-200", "aria-label": "Close modal", children: _jsx(X, { className: "w-5 h-5 text-gray-600" }) }), _jsxs("div", { className: "grid md:grid-cols-2", children: [_jsxs("div", { className: "bg-gradient-to-br from-primary-600 to-secondary-600 p-8 text-white", children: [_jsxs("div", { className: "flex items-center gap-3 mb-6", children: [_jsx("div", { className: "w-12 h-12 bg-white/20 rounded-full flex items-center justify-center", children: _jsx(Gift, { className: "w-6 h-6" }) }), _jsx("h2", { className: "text-2xl font-bold", children: "Get Early Access" })] }), _jsxs("div", { className: "space-y-4 mb-8", children: [_jsx("h3", { className: "text-3xl font-bold leading-tight", children: "Join 10,000+ professionals transforming their lives" }), _jsx("p", { className: "text-lg text-white/90", children: "Be the first to know about new features and get exclusive early-bird pricing." })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Sparkles, { className: "w-5 h-5 text-yellow-300" }), _jsx("span", { children: "50% off Pro plan for early adopters" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Sparkles, { className: "w-5 h-5 text-yellow-300" }), _jsx("span", { children: "Exclusive AI coaching features" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Sparkles, { className: "w-5 h-5 text-yellow-300" }), _jsx("span", { children: "Priority access to new releases" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Sparkles, { className: "w-5 h-5 text-yellow-300" }), _jsx("span", { children: "Free coaching consultation" })] })] }), _jsx("div", { className: "mt-8 pt-8 border-t border-white/20", children: _jsxs("div", { className: "flex items-center justify-between text-sm text-white/80", children: [_jsx("span", { children: "\uD83D\uDD12 No spam, ever" }), _jsx("span", { children: "\u2709\uFE0F Unsubscribe anytime" })] }) })] }), _jsxs("div", { className: "p-8", children: [_jsx("h3", { className: "text-xl font-semibold text-gray-900 mb-6", children: "Reserve Your Spot" }), _jsx(LeadCaptureForm, { source: `modal-${trigger}`, variant: "modal", onSuccess: handleSuccess })] })] })] }) })) }));
}
//# sourceMappingURL=LeadCaptureModal.js.map