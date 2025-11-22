'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Download, Zap, BookOpen, Brain } from 'lucide-react';
import NewsletterForm from './NewsletterForm';
import { useExperiment } from '@/services/experiments';
import { ABTestSwitch, Variant } from '@/components/experiments/ABTest';
export default function LeadCaptureModal({ trigger = 'time-based', delay = 30, scrollPercentage = 50, isOpen: controlledIsOpen, onClose: controlledOnClose, }) {
    const [isOpen, setIsOpen] = useState(false);
    const [hasBeenShown, setHasBeenShown] = useState(false);
    const { trackConversion } = useExperiment('leadMagnetCopy');
    const isControlled = controlledIsOpen !== undefined;
    const modalIsOpen = isControlled ? controlledIsOpen : isOpen;
    const handleClose = () => {
        if (isControlled) {
            controlledOnClose?.();
        }
        else {
            setIsOpen(false);
        }
        // Set cookie to prevent showing again in this session
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('leadModalShown', 'true');
        }
    };
    const handleSuccess = async (email) => {
        // Track successful lead capture
        const { trackLeadCapture } = await import('@/services/analytics');
        trackLeadCapture(trigger);
        trackConversion('lead_capture', 1);
        // Close modal after success
        setTimeout(handleClose, 2000);
    };
    useEffect(() => {
        // Check if modal has already been shown
        if (typeof window !== 'undefined') {
            const hasShown = sessionStorage.getItem('leadModalShown');
            if (hasShown || hasBeenShown || isControlled)
                return;
        }
        let timeoutId;
        let handleExitIntent;
        let handleScroll;
        switch (trigger) {
            case 'time-based':
                timeoutId = setTimeout(() => {
                    setIsOpen(true);
                    setHasBeenShown(true);
                }, delay * 1000);
                break;
            case 'exit-intent':
                handleExitIntent = (e) => {
                    if (e.clientY <= 0 && !hasBeenShown) {
                        setIsOpen(true);
                        setHasBeenShown(true);
                    }
                };
                document.addEventListener('mouseleave', handleExitIntent);
                break;
            case 'scroll-based':
                handleScroll = () => {
                    const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
                    if (scrolled >= scrollPercentage && !hasBeenShown) {
                        setIsOpen(true);
                        setHasBeenShown(true);
                        window.removeEventListener('scroll', handleScroll);
                    }
                };
                window.addEventListener('scroll', handleScroll);
                break;
        }
        return () => {
            if (timeoutId)
                clearTimeout(timeoutId);
            if (handleExitIntent)
                document.removeEventListener('mouseleave', handleExitIntent);
            if (handleScroll)
                window.removeEventListener('scroll', handleScroll);
        };
    }, [trigger, delay, scrollPercentage, hasBeenShown, isControlled]);
    return (_jsx(AnimatePresence, { children: modalIsOpen && (_jsxs(_Fragment, { children: [_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "fixed inset-0 bg-black/50 backdrop-blur-sm z-50", onClick: handleClose }), _jsx(motion.div, { initial: { opacity: 0, scale: 0.9, y: 20 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.9, y: 20 }, transition: { type: 'spring', duration: 0.5 }, className: "fixed inset-0 flex items-center justify-center z-50 p-4", onClick: handleClose, children: _jsxs("div", { className: "relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden", onClick: e => e.stopPropagation(), children: [_jsx("button", { onClick: handleClose, className: "absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10", "aria-label": "Close modal", children: _jsx(X, { className: "w-5 h-5 text-gray-600" }) }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-primary-100 via-secondary-100 to-white opacity-50" }), _jsxs("div", { className: "relative p-8 md:p-12", children: [_jsxs(ABTestSwitch, { experimentId: "leadMagnetCopy", children: [_jsx(Variant, { variant: "control", children: _jsx("div", { className: "w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg", children: _jsx(Gift, { className: "w-10 h-10 text-white" }) }) }), _jsx(Variant, { variant: "variant-a", children: _jsx("div", { className: "w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg", children: _jsx(BookOpen, { className: "w-10 h-10 text-white" }) }) }), _jsx(Variant, { variant: "variant-b", children: _jsx("div", { className: "w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg", children: _jsx(Brain, { className: "w-10 h-10 text-white" }) }) })] }), _jsxs(ABTestSwitch, { experimentId: "leadMagnetCopy", children: [_jsx(Variant, { variant: "control", children: _jsxs("div", { className: "text-center mb-8", children: [_jsxs("h2", { className: "text-3xl md:text-4xl font-bold text-gray-900 mb-4", children: ["Get Your Free", _jsxs("span", { className: "text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600", children: [' ', "Productivity Guide"] })] }), _jsx("p", { className: "text-lg text-gray-600 max-w-md mx-auto", children: "Join 25,000+ professionals and get our exclusive guide: \"10 Science-Backed Habits for Peak Performance\"" })] }) }), _jsx(Variant, { variant: "variant-a", children: _jsxs("div", { className: "text-center mb-8", children: [_jsxs("h2", { className: "text-3xl md:text-4xl font-bold text-gray-900 mb-4", children: ["Download Your Free", _jsxs("span", { className: "text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600", children: [' ', "Habit Tracker"] })] }), _jsx("p", { className: "text-lg text-gray-600 max-w-md mx-auto", children: "The same template used by 25,000+ high performers to build life-changing habits in 30 days" })] }) }), _jsx(Variant, { variant: "variant-b", children: _jsxs("div", { className: "text-center mb-8", children: [_jsxs("h2", { className: "text-3xl md:text-4xl font-bold text-gray-900 mb-4", children: ["Unlock AI Coaching", _jsxs("span", { className: "text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600", children: [' ', "Secrets"] })] }), _jsx("p", { className: "text-lg text-gray-600 max-w-md mx-auto", children: "Discover how AI can 10x your personal growth with our exclusive insider guide" })] }) })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-2", children: _jsx(Zap, { className: "w-6 h-6 text-primary-600" }) }), _jsx("p", { className: "text-sm font-medium text-gray-700", children: "Boost Productivity" }), _jsx("p", { className: "text-xs text-gray-500", children: "by 40% in 30 days" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-2", children: _jsx(Download, { className: "w-6 h-6 text-secondary-600" }) }), _jsx("p", { className: "text-sm font-medium text-gray-700", children: "Instant Download" }), _jsx("p", { className: "text-xs text-gray-500", children: "PDF + Checklist" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2", children: _jsx(Gift, { className: "w-6 h-6 text-green-600" }) }), _jsx("p", { className: "text-sm font-medium text-gray-700", children: "100% Free" }), _jsx("p", { className: "text-xs text-gray-500", children: "No credit card" })] })] }), _jsx(NewsletterForm, { variant: "modal", onSuccess: handleSuccess }), _jsx("p", { className: "text-xs text-gray-500 text-center mt-6", children: "We'll also send you weekly tips. Unsubscribe anytime." })] })] })] }) })] })) }));
}
//# sourceMappingURL=LeadCaptureModal.js.map