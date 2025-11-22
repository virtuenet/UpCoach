'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
export default function NewsletterForm({ variant = 'inline', className = '', onSuccess, }) {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setStatus('error');
            setMessage('Please enter a valid email address');
            return;
        }
        setStatus('loading');
        try {
            // Send to your API endpoint
            const response = await fetch('/api/newsletter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            if (response.ok) {
                setStatus('success');
                setMessage('Welcome aboard! Check your email for confirmation.');
                setEmail('');
                // Track conversion
                const { trackNewsletterSignup } = await import('@/services/analytics');
                trackNewsletterSignup(variant);
                onSuccess?.(email);
            }
            else {
                setStatus('error');
                setMessage(data.message || 'Something went wrong. Please try again.');
            }
        }
        catch (error) {
            setStatus('error');
            setMessage('Network error. Please try again later.');
        }
        // Reset status after 5 seconds
        setTimeout(() => {
            setStatus('idle');
            setMessage('');
        }, 5000);
    };
    if (variant === 'hero') {
        return (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6 }, className: `${className}`, children: _jsx("div", { className: "bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-8 md:p-12 text-white", children: _jsxs("div", { className: "max-w-2xl mx-auto text-center", children: [_jsx(Mail, { className: "w-16 h-16 mx-auto mb-6 opacity-90" }), _jsx("h3", { className: "text-3xl font-bold mb-4", children: "Get Weekly Productivity Tips" }), _jsx("p", { className: "text-lg mb-8 opacity-90", children: "Join 25,000+ professionals receiving actionable insights to boost their performance" }), _jsxs("form", { onSubmit: handleSubmit, className: "max-w-md mx-auto", children: [_jsxs("div", { className: "flex flex-col sm:flex-row gap-4", children: [_jsx("input", { type: "email", value: email, onChange: e => setEmail(e.target.value), placeholder: "Enter your email", className: "flex-1 px-6 py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/70 focus:outline-none focus:border-white/40 transition-colors", disabled: status === 'loading' || status === 'success', required: true }), _jsxs("button", { type: "submit", disabled: status === 'loading' || status === 'success', className: "px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2", children: [status === 'loading' && _jsx(Loader2, { className: "w-5 h-5 animate-spin" }), status === 'success' && _jsx(CheckCircle, { className: "w-5 h-5" }), status === 'idle' && 'Subscribe', status === 'loading' && 'Subscribing...', status === 'success' && 'Subscribed!'] })] }), message && (_jsxs(motion.div, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, className: `mt-4 text-sm flex items-center gap-2 ${status === 'error' ? 'text-red-200' : 'text-green-200'}`, children: [status === 'error' ? (_jsx(AlertCircle, { className: "w-4 h-4" })) : (_jsx(CheckCircle, { className: "w-4 h-4" })), message] }))] }), _jsx("p", { className: "text-sm mt-6 opacity-70", children: "No spam, ever. Unsubscribe anytime. We respect your privacy." })] }) }) }));
    }
    if (variant === 'modal') {
        return (_jsxs("div", { className: `bg-white rounded-2xl p-8 max-w-md w-full ${className}`, children: [_jsxs("div", { className: "text-center mb-6", children: [_jsx("div", { className: "w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(Mail, { className: "w-8 h-8 text-primary-600" }) }), _jsx("h3", { className: "text-2xl font-bold text-gray-900 mb-2", children: "Stay Updated" }), _jsx("p", { className: "text-gray-600", children: "Get the latest tips and updates delivered to your inbox" })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsx("input", { type: "email", value: email, onChange: e => setEmail(e.target.value), placeholder: "Enter your email", className: "w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 transition-colors", disabled: status === 'loading' || status === 'success', required: true }), _jsxs("button", { type: "submit", disabled: status === 'loading' || status === 'success', className: "w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2", children: [status === 'loading' && _jsx(Loader2, { className: "w-5 h-5 animate-spin" }), status === 'success' && _jsx(CheckCircle, { className: "w-5 h-5" }), "Subscribe"] }), message && (_jsx("p", { className: `text-sm text-center ${status === 'error' ? 'text-red-600' : 'text-green-600'}`, children: message }))] })] }));
    }
    // Default inline variant
    return (_jsxs("div", { className: className, "data-testid": "newsletter-form", children: [_jsxs("form", { onSubmit: handleSubmit, className: "flex gap-2", children: [_jsx("input", { type: "email", value: email, onChange: e => setEmail(e.target.value), placeholder: "Enter your email", className: "flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 transition-colors text-sm", disabled: status === 'loading' || status === 'success', required: true, "data-testid": "newsletter-email-input" }), _jsx("button", { type: "submit", disabled: status === 'loading' || status === 'success', className: "px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap", "data-testid": "newsletter-submit-button", children: status === 'loading' ? 'Subscribing...' : 'Subscribe' })] }), message && (_jsx("p", { className: `text-sm mt-2 ${status === 'error' ? 'text-red-600' : 'text-green-600'}`, children: message }))] }));
}
//# sourceMappingURL=NewsletterForm.js.map