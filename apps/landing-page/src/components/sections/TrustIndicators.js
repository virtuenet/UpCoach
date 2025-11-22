'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
import { Shield, Lock, CreditCard, RefreshCw, Award, Users } from 'lucide-react';
const indicators = [
    {
        icon: Shield,
        title: 'Enterprise-Grade Security',
        description: '256-bit encryption & SOC 2 compliant',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
    },
    {
        icon: Lock,
        title: 'Privacy First',
        description: 'Your data is never sold or shared',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
    },
    {
        icon: CreditCard,
        title: 'Secure Payments',
        description: 'Powered by Stripe with PCI compliance',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
    },
    {
        icon: RefreshCw,
        title: '30-Day Guarantee',
        description: 'Full refund if not satisfied',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
    },
    {
        icon: Award,
        title: 'Industry Recognition',
        description: "App Store Editor's Choice 2024",
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
    },
    {
        icon: Users,
        title: 'Trusted by 50K+',
        description: '92% user satisfaction rate',
        color: 'text-pink-600',
        bgColor: 'bg-pink-100',
    },
];
export default function TrustIndicators() {
    return (_jsx("section", { className: "py-16 bg-gray-50", children: _jsxs("div", { className: "container mx-auto px-4", children: [_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 }, className: "text-center mb-12", children: [_jsx("h3", { className: "text-2xl font-bold text-gray-900 mb-4", children: "Why UpCoach is the Trusted Choice" }), _jsx("p", { className: "text-lg text-gray-600 max-w-2xl mx-auto", children: "Join thousands who trust UpCoach with their personal development journey" })] }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6", children: indicators.map((indicator, index) => {
                        const Icon = indicator.icon;
                        return (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.4, delay: index * 0.1 }, className: "text-center group", children: [_jsx("div", { className: `${indicator.bgColor} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`, children: _jsx(Icon, { className: `w-8 h-8 ${indicator.color}` }) }), _jsx("h4", { className: "font-semibold text-gray-900 mb-1", children: indicator.title }), _jsx("p", { className: "text-sm text-gray-600", children: indicator.description })] }, index));
                    }) }), _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6, delay: 0.3 }, className: "mt-12 pt-12 border-t border-gray-200", children: [_jsx("p", { className: "text-center text-sm text-gray-500 mb-6", children: "Secure payment processing by" }), _jsxs("div", { className: "flex justify-center items-center gap-8 opacity-60", children: [_jsx("div", { className: "text-2xl font-bold text-gray-600", children: "Stripe" }), _jsx("div", { className: "text-2xl font-bold text-gray-600", children: "Apple Pay" }), _jsx("div", { className: "text-2xl font-bold text-gray-600", children: "Google Pay" })] })] }), _jsxs(motion.div, { initial: { opacity: 0 }, whileInView: { opacity: 1 }, viewport: { once: true }, transition: { duration: 0.6, delay: 0.4 }, className: "flex flex-wrap justify-center items-center gap-6 mt-8", children: [_jsxs("div", { className: "flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm", children: [_jsx(Shield, { className: "w-5 h-5 text-green-600" }), _jsx("span", { className: "text-sm font-medium text-gray-700", children: "GDPR Compliant" })] }), _jsxs("div", { className: "flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm", children: [_jsx(Shield, { className: "w-5 h-5 text-green-600" }), _jsx("span", { className: "text-sm font-medium text-gray-700", children: "HIPAA Compliant" })] }), _jsxs("div", { className: "flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm", children: [_jsx(Shield, { className: "w-5 h-5 text-green-600" }), _jsx("span", { className: "text-sm font-medium text-gray-700", children: "SOC 2 Type II" })] })] })] }) }));
}
//# sourceMappingURL=TrustIndicators.js.map