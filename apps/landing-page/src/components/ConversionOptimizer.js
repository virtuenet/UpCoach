'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from '@upcoach/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Clock, Users, TrendingUp, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { trackEvent } from '@/services/analytics';
export default function ConversionOptimizer({ variant = 'popup' }) {
    const [isVisible, setIsVisible] = useState(false);
    const [email, setEmail] = useState('');
    const [hasInteracted, setHasInteracted] = useState(false);
    const [timeOnPage, setTimeOnPage] = useState(0);
    const [exitIntent, setExitIntent] = useState(false);
    // Track time on page
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeOnPage(prev => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);
    // Exit intent detection
    useEffect(() => {
        const handleMouseLeave = (e) => {
            if (e.clientY <= 0 && !hasInteracted && timeOnPage > 5) {
                setExitIntent(true);
                setIsVisible(true);
                trackEvent('Exit Intent Triggered', {
                    timeOnPage,
                    variant,
                });
            }
        };
        document.addEventListener('mouseleave', handleMouseLeave);
        return () => document.removeEventListener('mouseleave', handleMouseLeave);
    }, [hasInteracted, timeOnPage, variant]);
    // Time-based trigger
    useEffect(() => {
        if (timeOnPage === 30 && !hasInteracted && !exitIntent) {
            setIsVisible(true);
            trackEvent('Time-based Popup Triggered', {
                timeOnPage,
                variant,
            });
        }
    }, [timeOnPage, hasInteracted, exitIntent, variant]);
    // Scroll-based trigger
    useEffect(() => {
        const handleScroll = () => {
            const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            if (scrollPercentage > 50 && !hasInteracted && !exitIntent && timeOnPage > 10) {
                setIsVisible(true);
                trackEvent('Scroll-based Popup Triggered', {
                    scrollPercentage,
                    timeOnPage,
                    variant,
                });
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [hasInteracted, exitIntent, timeOnPage, variant]);
    const handleSubmit = (e) => {
        e.preventDefault();
        setHasInteracted(true);
        trackEvent('Conversion Optimizer Submit', {
            email,
            trigger: exitIntent ? 'exit-intent' : 'time-based',
            timeOnPage,
            variant,
        });
        // Redirect to onboarding
        window.location.href = `/onboarding?email=${encodeURIComponent(email)}&source=optimizer`;
    };
    const handleClose = () => {
        setIsVisible(false);
        setHasInteracted(true);
        trackEvent('Conversion Optimizer Closed', {
            trigger: exitIntent ? 'exit-intent' : 'time-based',
            timeOnPage,
            variant,
        });
    };
    if (!isVisible)
        return null;
    const renderContent = () => {
        const content = (_jsxs("div", { className: "bg-white rounded-2xl shadow-2xl overflow-hidden max-w-lg w-full mx-4", children: [_jsxs("div", { className: "bg-gradient-to-r from-primary to-secondary p-6 text-white relative", children: [_jsx("button", { onClick: handleClose, className: "absolute top-4 right-4 text-white/80 hover:text-white transition-colors", children: _jsx(X, { className: "h-6 w-6" }) }), _jsxs("div", { className: "flex items-center gap-3 mb-3", children: [_jsx(Gift, { className: "h-8 w-8" }), _jsx("h2", { className: "text-2xl font-bold", children: "Wait! Special Offer" })] }), _jsx("p", { className: "text-white/90", children: "Get 30% off your first month plus exclusive bonuses when you start today!" })] }), _jsxs("div", { className: "p-6", children: [_jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4 mb-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Clock, { className: "h-5 w-5 text-red-600" }), _jsx("span", { className: "text-sm font-medium text-red-900", children: "Limited time offer" })] }), _jsx(CountdownTimer, {})] }) }), _jsxs("div", { className: "space-y-3 mb-6", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx(Users, { className: "h-5 w-5 text-green-600 mt-0.5" }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: "Join 50,000+ successful users" }), _jsx("p", { className: "text-sm text-gray-600", children: "Average 3x improvement in 90 days" })] })] }), _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(TrendingUp, { className: "h-5 w-5 text-green-600 mt-0.5" }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: "AI-powered personalization" }), _jsx("p", { className: "text-sm text-gray-600", children: "Tailored coaching for your unique goals" })] })] }), _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(Shield, { className: "h-5 w-5 text-green-600 mt-0.5" }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: "30-day money-back guarantee" }), _jsx("p", { className: "text-sm text-gray-600", children: "No questions asked refund policy" })] })] })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsx("input", { type: "email", placeholder: "Enter your email to claim offer", value: email, onChange: (e) => setEmail(e.target.value), className: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary", required: true }), _jsx(Button, { type: "submit", className: "w-full py-3 text-lg font-medium", children: "Claim Your 30% Discount" }), _jsx("p", { className: "text-xs text-center text-gray-500", children: "No credit card required \u2022 Cancel anytime" })] }), _jsx("div", { className: "mt-6 pt-6 border-t border-gray-100", children: _jsxs("div", { className: "flex items-center justify-center gap-4", children: [_jsx("div", { className: "flex -space-x-2", children: [1, 2, 3, 4, 5].map((i) => (_jsx("div", { className: "w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 border-2 border-white" }, i))) }), _jsxs("p", { className: "text-sm text-gray-600", children: [_jsx("span", { className: "font-medium", children: "2,847 people" }), " claimed this offer today"] })] }) })] })] }));
        switch (variant) {
            case 'banner':
                return (_jsx(motion.div, { initial: { y: -100 }, animate: { y: 0 }, exit: { y: -100 }, className: "fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary to-secondary p-4", children: _jsxs("div", { className: "max-w-7xl mx-auto flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4 text-white", children: [_jsx(Gift, { className: "h-6 w-6" }), _jsx("p", { className: "font-medium", children: "Limited offer: Get 30% off your first month!" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Button, { variant: "secondary", size: "sm", onClick: () => setIsVisible(true), children: "Claim Offer" }), _jsx("button", { onClick: handleClose, className: "text-white/80 hover:text-white", children: _jsx(X, { className: "h-5 w-5" }) })] })] }) }));
            case 'slide-in':
                return (_jsx(motion.div, { initial: { x: 400 }, animate: { x: 0 }, exit: { x: 400 }, className: "fixed bottom-4 right-4 z-50 max-w-sm", children: content }));
            default: // popup
                return (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm", onClick: handleClose, children: _jsx(motion.div, { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.9, opacity: 0 }, onClick: (e) => e.stopPropagation(), children: content }) }));
        }
    };
    return _jsx(AnimatePresence, { children: renderContent() });
}
// Countdown timer component
function CountdownTimer() {
    const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return (_jsxs("div", { className: "flex items-center gap-1 text-red-600 font-mono font-bold", children: [_jsx("span", { className: "bg-red-100 px-2 py-1 rounded", children: String(minutes).padStart(2, '0') }), _jsx("span", { children: ":" }), _jsx("span", { className: "bg-red-100 px-2 py-1 rounded", children: String(seconds).padStart(2, '0') })] }));
}
//# sourceMappingURL=ConversionOptimizer.js.map