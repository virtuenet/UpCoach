'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
import { CheckCircle, Users, TrendingUp, Award } from 'lucide-react';
import LeadCaptureForm from '../LeadCaptureForm';
import { useState } from 'react';
const benefits = [
    {
        icon: Users,
        title: 'Join 50,000+ Users',
        description: 'Be part of a growing community of achievers',
    },
    {
        icon: TrendingUp,
        title: 'Early Bird Pricing',
        description: 'Lock in 50% off lifetime discount',
    },
    {
        icon: Award,
        title: 'Exclusive Features',
        description: 'Get access to beta features first',
    },
];
export default function LeadGeneration() {
    const [formSubmitted, setFormSubmitted] = useState(false);
    return (_jsx("section", { className: "py-24 bg-gradient-to-b from-gray-50 to-white", children: _jsx("div", { className: "container mx-auto px-4", children: _jsx("div", { className: "max-w-6xl mx-auto", children: _jsxs("div", { className: "grid lg:grid-cols-2 gap-12 items-center", children: [_jsxs(motion.div, { initial: { opacity: 0, x: -20 }, whileInView: { opacity: 1, x: 0 }, viewport: { once: true }, transition: { duration: 0.6 }, children: [_jsx("span", { className: "text-primary-600 font-semibold text-sm uppercase tracking-wider", children: "Limited Time Offer" }), _jsxs("h2", { className: "text-4xl md:text-5xl font-bold text-gray-900 mb-6 mt-2", children: ["Get Early Access &", _jsxs("span", { className: "text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600", children: [' ', "Save 50%"] })] }), _jsx("p", { className: "text-xl text-gray-600 mb-8", children: "Join thousands of professionals who are transforming their lives with UpCoach. Sign up now to secure your lifetime discount and exclusive benefits." }), _jsx("div", { className: "space-y-4 mb-8", children: benefits.map((benefit, index) => {
                                        const Icon = benefit.icon;
                                        return (_jsxs(motion.div, { initial: { opacity: 0, x: -20 }, whileInView: { opacity: 1, x: 0 }, viewport: { once: true }, transition: { duration: 0.4, delay: 0.1 + index * 0.1 }, className: "flex items-start gap-4", children: [_jsx("div", { className: "w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0", children: _jsx(Icon, { className: "w-6 h-6 text-primary-600" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-900", children: benefit.title }), _jsx("p", { className: "text-gray-600", children: benefit.description })] })] }, index));
                                    }) }), _jsx(motion.div, { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6, delay: 0.3 }, className: "bg-primary-50 rounded-2xl p-6", children: _jsxs("div", { className: "grid grid-cols-3 gap-4 text-center", children: [_jsxs("div", { children: [_jsx("div", { className: "text-2xl font-bold text-primary-600", children: "92%" }), _jsx("div", { className: "text-sm text-gray-600", children: "Success Rate" })] }), _jsxs("div", { children: [_jsx("div", { className: "text-2xl font-bold text-primary-600", children: "4.9\u2605" }), _jsx("div", { className: "text-sm text-gray-600", children: "User Rating" })] }), _jsxs("div", { children: [_jsx("div", { className: "text-2xl font-bold text-primary-600", children: "30d" }), _jsx("div", { className: "text-sm text-gray-600", children: "Avg. to Results" })] })] }) })] }), _jsxs(motion.div, { initial: { opacity: 0, x: 20 }, whileInView: { opacity: 1, x: 0 }, viewport: { once: true }, transition: { duration: 0.6, delay: 0.2 }, children: [_jsxs("div", { className: "bg-white rounded-2xl shadow-xl p-8 border border-gray-100", children: [_jsx("div", { className: "bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-center", children: _jsx("p", { className: "text-red-600 font-semibold", children: "\uD83D\uDD25 Early bird offer ends in 48 hours" }) }), _jsx("h3", { className: "text-2xl font-bold text-gray-900 mb-2", children: "Reserve Your Spot" }), _jsx("p", { className: "text-gray-600 mb-6", children: "No credit card required. Unsubscribe anytime." }), _jsx(LeadCaptureForm, { source: "lead-generation-section", onSuccess: () => setFormSubmitted(true) }), _jsx("div", { className: "mt-6 pt-6 border-t border-gray-200", children: _jsxs("div", { className: "flex items-center justify-center gap-6 text-sm text-gray-500", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(CheckCircle, { className: "w-4 h-4 text-green-500" }), _jsx("span", { children: "SSL Secure" })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(CheckCircle, { className: "w-4 h-4 text-green-500" }), _jsx("span", { children: "GDPR Compliant" })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(CheckCircle, { className: "w-4 h-4 text-green-500" }), _jsx("span", { children: "No Spam" })] })] }) })] }), _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6, delay: 0.4 }, className: "mt-6 text-center", children: [_jsx("p", { className: "text-sm text-gray-600 mb-3", children: "Join professionals from these companies:" }), _jsxs("div", { className: "flex flex-wrap justify-center items-center gap-6 opacity-60", children: [_jsx("span", { className: "text-lg font-semibold text-gray-400", children: "Google" }), _jsx("span", { className: "text-lg font-semibold text-gray-400", children: "Microsoft" }), _jsx("span", { className: "text-lg font-semibold text-gray-400", children: "Apple" }), _jsx("span", { className: "text-lg font-semibold text-gray-400", children: "Meta" }), _jsx("span", { className: "text-lg font-semibold text-gray-400", children: "Amazon" })] })] })] })] }) }) }) }));
}
//# sourceMappingURL=LeadGeneration.js.map