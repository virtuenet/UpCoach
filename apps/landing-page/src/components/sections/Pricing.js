'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
import { Check, X, Sparkles, Zap, Crown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { trackPricingView, trackPlanSelect, trackCTAClick } from '@/services/analytics';
const plans = [
    {
        name: 'Starter',
        icon: Sparkles,
        price: '$0',
        period: 'forever',
        description: 'Perfect for getting started',
        features: [
            { text: '5 voice journal entries/day', included: true },
            { text: 'Basic habit tracking (3 habits)', included: true },
            { text: 'Progress photos (10 photos)', included: true },
            { text: 'AI insights (basic)', included: true },
            { text: 'Offline mode', included: true },
            { text: '7-day trial of Pro features', included: true },
            { text: 'Unlimited voice journals', included: false },
            { text: 'Advanced analytics', included: false },
            { text: 'Priority support', included: false },
        ],
        cta: 'Start Free',
        ctaAction: 'https://apps.apple.com/app/upcoach',
        popular: false,
        color: 'gray',
    },
    {
        name: 'Pro',
        icon: Zap,
        price: '$14.99',
        originalPrice: '$19.99',
        period: 'per month',
        description: 'For serious personal growth',
        features: [
            { text: 'Unlimited voice journal entries', included: true },
            { text: 'Unlimited habit tracking', included: true },
            { text: 'Unlimited progress photos', included: true },
            { text: 'Advanced AI insights & coaching', included: true },
            { text: 'Detailed analytics & reports', included: true },
            { text: 'Custom reminders & notifications', included: true },
            { text: 'Export data (CSV/PDF)', included: true },
            { text: 'Priority support', included: true },
        ],
        cta: 'Start 7-Day Free Trial',
        ctaAction: 'https://apps.apple.com/app/upcoach',
        popular: true,
        color: 'primary',
        savings: 'Save 25%',
    },
    {
        name: 'Pro Annual',
        icon: Crown,
        price: '$119.99',
        originalPrice: '$179.88',
        period: 'per year',
        description: 'Best value for committed users',
        features: [
            { text: 'Everything in Pro', included: true },
            { text: '2 months free (save $30)', included: true },
            { text: 'Early access to new features', included: true },
            { text: 'Exclusive webinars & content', included: true },
            { text: 'Personal onboarding session', included: true },
            { text: 'Custom AI coach personality', included: true },
            { text: 'API access (coming soon)', included: true },
            { text: 'Dedicated success manager', included: true },
        ],
        cta: 'Save 33% Annually',
        ctaAction: 'https://apps.apple.com/app/upcoach',
        popular: false,
        color: 'secondary',
        savings: 'Best Value',
    },
];
export default function Pricing() {
    const [billingPeriod, setBillingPeriod] = useState('monthly');
    // Track pricing section view
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                trackPricingView();
                observer.disconnect();
            }
        }, { threshold: 0.5 });
        const section = document.getElementById('pricing');
        if (section) {
            observer.observe(section);
        }
        return () => observer.disconnect();
    }, []);
    return (_jsx("section", { id: "pricing", className: "py-24 bg-white", children: _jsxs("div", { className: "container mx-auto px-4", children: [_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 }, className: "text-center mb-12", children: [_jsx("span", { className: "text-primary-600 font-semibold text-sm uppercase tracking-wider", children: "Pricing" }), _jsxs("h2", { className: "text-4xl md:text-5xl font-bold text-gray-900 mb-4 mt-2", children: ["Choose Your", _jsxs("span", { className: "text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600", children: [' ', "Growth Plan"] })] }), _jsx("p", { className: "text-xl text-gray-600 max-w-3xl mx-auto mb-8", children: "Start free and upgrade when you're ready. No hidden fees, cancel anytime." }), _jsxs("div", { className: "inline-flex items-center bg-gray-100 rounded-full p-1", children: [_jsx("button", { onClick: () => setBillingPeriod('monthly'), className: `px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${billingPeriod === 'monthly'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'}`, children: "Monthly" }), _jsxs("button", { onClick: () => setBillingPeriod('annual'), className: `px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${billingPeriod === 'annual'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'}`, children: ["Annual", _jsx("span", { className: "ml-1 text-xs text-green-600 font-semibold", children: "Save 33%" })] })] })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto", children: plans.map((plan, index) => {
                        const Icon = plan.icon;
                        const isVisible = billingPeriod === 'monthly' ? plan.name !== 'Pro Annual' : plan.name !== 'Pro';
                        if (!isVisible)
                            return null;
                        return (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5, delay: index * 0.1 }, className: `relative bg-white rounded-3xl ${plan.popular
                                ? 'shadow-2xl border-2 border-primary-200'
                                : 'shadow-xl border border-gray-100'}`, "data-testid": `pricing-plan-${plan.name.toLowerCase().replace(/\s+/g, '-')}`, children: [plan.popular && (_jsx("div", { className: "absolute -top-5 left-0 right-0 flex justify-center", children: _jsx("span", { className: "bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg", children: "MOST POPULAR" }) })), plan.savings && (_jsx("div", { className: "absolute -top-3 -right-3", children: _jsx("span", { className: "bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg transform rotate-12", children: plan.savings }) })), _jsxs("div", { className: "p-8", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("div", { className: `inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 ${plan.color === 'primary'
                                                        ? 'bg-primary-100'
                                                        : plan.color === 'secondary'
                                                            ? 'bg-secondary-100'
                                                            : 'bg-gray-100'}`, children: _jsx(Icon, { className: `w-7 h-7 ${plan.color === 'primary'
                                                            ? 'text-primary-600'
                                                            : plan.color === 'secondary'
                                                                ? 'text-secondary-600'
                                                                : 'text-gray-600'}` }) }), _jsx("h3", { className: "text-2xl font-bold text-gray-900 mb-2", children: plan.name }), _jsx("p", { className: "text-gray-600 mb-6", children: plan.description }), _jsxs("div", { className: "mb-6", children: [plan.originalPrice && (_jsx("span", { className: "text-gray-400 line-through text-lg mr-2", children: plan.originalPrice })), _jsxs("div", { children: [_jsx("span", { className: "text-5xl font-bold text-gray-900", children: plan.price }), _jsxs("span", { className: "text-gray-600 ml-2", children: ["/", plan.period] })] })] })] }), _jsx("ul", { className: "mb-8 space-y-4", children: plan.features.map((feature, featureIndex) => (_jsxs(motion.li, { initial: { opacity: 0, x: -20 }, whileInView: { opacity: 1, x: 0 }, viewport: { once: true }, transition: {
                                                    duration: 0.3,
                                                    delay: featureIndex * 0.05,
                                                }, className: "flex items-start", children: [feature.included ? (_jsx("div", { className: "w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5", children: _jsx(Check, { className: "w-3 h-3 text-green-600" }) })) : (_jsx("div", { className: "w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5", children: _jsx(X, { className: "w-3 h-3 text-gray-400" }) })), _jsx("span", { className: `text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`, children: feature.text })] }, featureIndex))) }), _jsx("a", { href: plan.ctaAction, target: "_blank", rel: "noopener noreferrer", onClick: () => {
                                                trackPlanSelect(plan.name, billingPeriod);
                                                trackCTAClick(plan.cta, 'pricing');
                                            }, className: `block w-full py-4 px-6 rounded-xl font-semibold text-center transition-all duration-300 ${plan.popular
                                                ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white hover:shadow-lg hover:scale-105'
                                                : plan.color === 'secondary'
                                                    ? 'bg-secondary-600 text-white hover:bg-secondary-700 hover:shadow-lg'
                                                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`, "data-testid": `cta-${plan.name.toLowerCase().replace(/\s+/g, '-')}`, children: plan.cta })] })] }, index));
                    }) }), _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6, delay: 0.3 }, className: "mt-24 max-w-5xl mx-auto", children: [_jsxs("div", { className: "text-center mb-12", children: [_jsx("h3", { className: "text-3xl font-bold text-gray-900 mb-4", children: "Detailed Feature Comparison" }), _jsx("p", { className: "text-lg text-gray-600", children: "Everything you need to know about each plan" })] }), _jsx("div", { className: "bg-white rounded-2xl shadow-xl overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-gray-200", children: [_jsx("th", { className: "text-left p-6 font-semibold text-gray-900", children: "Features" }), _jsxs("th", { className: "text-center p-6", children: [_jsx("div", { className: "text-lg font-semibold text-gray-900", children: "Starter" }), _jsx("div", { className: "text-sm text-gray-600", children: "Free forever" })] }), _jsxs("th", { className: "text-center p-6 bg-primary-50", children: [_jsx("div", { className: "text-lg font-semibold text-primary-900", children: "Pro" }), _jsx("div", { className: "text-sm text-primary-700", children: "$14.99/mo" }), _jsx("div", { className: "text-xs text-primary-600 font-medium mt-1", children: "MOST POPULAR" })] }), _jsxs("th", { className: "text-center p-6", children: [_jsx("div", { className: "text-lg font-semibold text-gray-900", children: "Pro Annual" }), _jsx("div", { className: "text-sm text-gray-600", children: "$119.99/yr" }), _jsx("div", { className: "text-xs text-green-600 font-medium mt-1", children: "SAVE 33%" })] })] }) }), _jsxs("tbody", { className: "divide-y divide-gray-100", children: [_jsx("tr", { className: "bg-gray-50", children: _jsx("td", { colSpan: 4, className: "px-6 py-3 text-sm font-semibold text-gray-700", children: "Core Features" }) }), _jsxs("tr", { children: [_jsx("td", { className: "p-6 text-gray-700", children: "Voice Journaling" }), _jsx("td", { className: "p-6 text-center text-gray-600", children: "5/day" }), _jsx("td", { className: "p-6 text-center bg-primary-50 font-semibold text-primary-900", children: "Unlimited" }), _jsx("td", { className: "p-6 text-center font-semibold", children: "Unlimited" })] }), _jsxs("tr", { children: [_jsx("td", { className: "p-6 text-gray-700", children: "Habit Tracking" }), _jsx("td", { className: "p-6 text-center text-gray-600", children: "3 habits" }), _jsx("td", { className: "p-6 text-center bg-primary-50 font-semibold text-primary-900", children: "Unlimited" }), _jsx("td", { className: "p-6 text-center font-semibold", children: "Unlimited" })] }), _jsxs("tr", { children: [_jsx("td", { className: "p-6 text-gray-700", children: "Progress Photos" }), _jsx("td", { className: "p-6 text-center text-gray-600", children: "10 photos" }), _jsx("td", { className: "p-6 text-center bg-primary-50 font-semibold text-primary-900", children: "Unlimited" }), _jsx("td", { className: "p-6 text-center font-semibold", children: "Unlimited" })] }), _jsxs("tr", { children: [_jsx("td", { className: "p-6 text-gray-700", children: "Offline Mode" }), _jsx("td", { className: "p-6 text-center", children: _jsx(Check, { className: "w-5 h-5 text-green-500 mx-auto" }) }), _jsx("td", { className: "p-6 text-center bg-primary-50", children: _jsx(Check, { className: "w-5 h-5 text-green-500 mx-auto" }) }), _jsx("td", { className: "p-6 text-center", children: _jsx(Check, { className: "w-5 h-5 text-green-500 mx-auto" }) })] }), _jsx("tr", { className: "bg-gray-50", children: _jsx("td", { colSpan: 4, className: "px-6 py-3 text-sm font-semibold text-gray-700", children: "AI & Analytics" }) }), _jsxs("tr", { children: [_jsx("td", { className: "p-6 text-gray-700", children: "AI Insights" }), _jsx("td", { className: "p-6 text-center text-gray-600", children: "Basic" }), _jsx("td", { className: "p-6 text-center bg-primary-50 font-semibold text-primary-900", children: "Advanced" }), _jsx("td", { className: "p-6 text-center font-semibold", children: "Advanced + Custom" })] }), _jsxs("tr", { children: [_jsx("td", { className: "p-6 text-gray-700", children: "Analytics Dashboard" }), _jsx("td", { className: "p-6 text-center", children: _jsx(X, { className: "w-5 h-5 text-gray-300 mx-auto" }) }), _jsx("td", { className: "p-6 text-center bg-primary-50", children: _jsx(Check, { className: "w-5 h-5 text-green-500 mx-auto" }) }), _jsx("td", { className: "p-6 text-center", children: _jsx(Check, { className: "w-5 h-5 text-green-500 mx-auto" }) })] }), _jsxs("tr", { children: [_jsx("td", { className: "p-6 text-gray-700", children: "Progress Reports" }), _jsx("td", { className: "p-6 text-center text-gray-600", children: "Weekly" }), _jsx("td", { className: "p-6 text-center bg-primary-50 font-semibold text-primary-900", children: "Daily" }), _jsx("td", { className: "p-6 text-center font-semibold", children: "Real-time" })] }), _jsxs("tr", { children: [_jsx("td", { className: "p-6 text-gray-700", children: "AI Coach Personality" }), _jsx("td", { className: "p-6 text-center text-gray-600", children: "Default" }), _jsx("td", { className: "p-6 text-center bg-primary-50 text-gray-600", children: "3 options" }), _jsx("td", { className: "p-6 text-center font-semibold text-primary-900", children: "Customizable" })] }), _jsx("tr", { className: "bg-gray-50", children: _jsx("td", { colSpan: 4, className: "px-6 py-3 text-sm font-semibold text-gray-700", children: "Advanced Features" }) }), _jsxs("tr", { children: [_jsx("td", { className: "p-6 text-gray-700", children: "Data Export" }), _jsx("td", { className: "p-6 text-center", children: _jsx(X, { className: "w-5 h-5 text-gray-300 mx-auto" }) }), _jsx("td", { className: "p-6 text-center bg-primary-50", children: _jsx(Check, { className: "w-5 h-5 text-green-500 mx-auto" }) }), _jsx("td", { className: "p-6 text-center", children: _jsx(Check, { className: "w-5 h-5 text-green-500 mx-auto" }) })] }), _jsxs("tr", { children: [_jsx("td", { className: "p-6 text-gray-700", children: "Custom Reminders" }), _jsx("td", { className: "p-6 text-center", children: _jsx(X, { className: "w-5 h-5 text-gray-300 mx-auto" }) }), _jsx("td", { className: "p-6 text-center bg-primary-50", children: _jsx(Check, { className: "w-5 h-5 text-green-500 mx-auto" }) }), _jsx("td", { className: "p-6 text-center", children: _jsx(Check, { className: "w-5 h-5 text-green-500 mx-auto" }) })] }), _jsxs("tr", { children: [_jsx("td", { className: "p-6 text-gray-700", children: "Early Access" }), _jsx("td", { className: "p-6 text-center", children: _jsx(X, { className: "w-5 h-5 text-gray-300 mx-auto" }) }), _jsx("td", { className: "p-6 text-center bg-primary-50", children: _jsx(X, { className: "w-5 h-5 text-gray-300 mx-auto" }) }), _jsx("td", { className: "p-6 text-center", children: _jsx(Check, { className: "w-5 h-5 text-green-500 mx-auto" }) })] }), _jsxs("tr", { children: [_jsx("td", { className: "p-6 text-gray-700", children: "API Access" }), _jsx("td", { className: "p-6 text-center", children: _jsx(X, { className: "w-5 h-5 text-gray-300 mx-auto" }) }), _jsx("td", { className: "p-6 text-center bg-primary-50", children: _jsx(X, { className: "w-5 h-5 text-gray-300 mx-auto" }) }), _jsx("td", { className: "p-6 text-center text-gray-600", children: "Coming Soon" })] }), _jsx("tr", { className: "bg-gray-50", children: _jsx("td", { colSpan: 4, className: "px-6 py-3 text-sm font-semibold text-gray-700", children: "Support & Resources" }) }), _jsxs("tr", { children: [_jsx("td", { className: "p-6 text-gray-700", children: "Customer Support" }), _jsx("td", { className: "p-6 text-center text-gray-600", children: "Community" }), _jsx("td", { className: "p-6 text-center bg-primary-50 font-semibold text-primary-900", children: "Priority Email" }), _jsx("td", { className: "p-6 text-center font-semibold", children: "Dedicated Manager" })] }), _jsxs("tr", { children: [_jsx("td", { className: "p-6 text-gray-700", children: "Onboarding" }), _jsx("td", { className: "p-6 text-center text-gray-600", children: "Self-guided" }), _jsx("td", { className: "p-6 text-center bg-primary-50 text-gray-600", children: "Video tutorials" }), _jsx("td", { className: "p-6 text-center font-semibold text-primary-900", children: "1-on-1 session" })] }), _jsxs("tr", { children: [_jsx("td", { className: "p-6 text-gray-700", children: "Exclusive Content" }), _jsx("td", { className: "p-6 text-center", children: _jsx(X, { className: "w-5 h-5 text-gray-300 mx-auto" }) }), _jsx("td", { className: "p-6 text-center bg-primary-50", children: _jsx(X, { className: "w-5 h-5 text-gray-300 mx-auto" }) }), _jsx("td", { className: "p-6 text-center", children: _jsx(Check, { className: "w-5 h-5 text-green-500 mx-auto" }) })] })] })] }) }) }), _jsxs("div", { className: "text-center mt-8", children: [_jsx("p", { className: "text-gray-600 mb-4", children: "Still not sure? Try Pro free for 7 days and experience the difference." }), _jsxs("a", { href: "https://apps.apple.com/app/upcoach", target: "_blank", rel: "noopener noreferrer", className: "inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300", children: ["Start Your Free Trial", _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13 7l5 5m0 0l-5 5m5-5H6" }) })] })] })] }), _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6, delay: 0.4 }, className: "mt-16 text-center", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-center gap-8 mb-8", children: [_jsxs("div", { className: "flex items-center gap-2 text-gray-600", children: [_jsx("svg", { className: "w-5 h-5 text-green-500", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", clipRule: "evenodd" }) }), _jsx("span", { children: "7-day free trial" })] }), _jsxs("div", { className: "flex items-center gap-2 text-gray-600", children: [_jsx("svg", { className: "w-5 h-5 text-green-500", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", clipRule: "evenodd" }) }), _jsx("span", { children: "No credit card required" })] }), _jsxs("div", { className: "flex items-center gap-2 text-gray-600", children: [_jsx("svg", { className: "w-5 h-5 text-green-500", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", clipRule: "evenodd" }) }), _jsx("span", { children: "Cancel anytime" })] })] }), _jsx("p", { className: "text-sm text-gray-500 max-w-2xl mx-auto", children: "Prices are in USD. Subscriptions renew automatically. You can cancel anytime from your account settings. Pro features require an active subscription after the trial period." })] }), _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6, delay: 0.5 }, className: "mt-24 max-w-3xl mx-auto", children: [_jsx("h3", { className: "text-2xl font-bold text-gray-900 text-center mb-8", children: "Frequently Asked Questions" }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-gray-50 rounded-xl p-6", children: [_jsx("h4", { className: "font-semibold text-gray-900 mb-2", children: "What happens after my 7-day free trial?" }), _jsx("p", { className: "text-gray-600", children: "After your trial ends, you'll be automatically subscribed to the Pro plan unless you cancel. You can cancel anytime during the trial without being charged." })] }), _jsxs("div", { className: "bg-gray-50 rounded-xl p-6", children: [_jsx("h4", { className: "font-semibold text-gray-900 mb-2", children: "Can I switch plans anytime?" }), _jsx("p", { className: "text-gray-600", children: "Yes! You can upgrade, downgrade, or switch between monthly and annual billing at any time. Changes take effect at your next billing cycle." })] }), _jsxs("div", { className: "bg-gray-50 rounded-xl p-6", children: [_jsx("h4", { className: "font-semibold text-gray-900 mb-2", children: "Do you offer refunds?" }), _jsx("p", { className: "text-gray-600", children: "We offer a 30-day money-back guarantee for annual plans. For monthly plans, you can cancel anytime and won't be charged for the next month." })] }), _jsxs("div", { className: "bg-gray-50 rounded-xl p-6", children: [_jsx("h4", { className: "font-semibold text-gray-900 mb-2", children: "Is there a student discount?" }), _jsx("p", { className: "text-gray-600", children: "Yes! Students get 50% off Pro plans with a valid .edu email address. Contact support@upcoach.ai to verify your student status." })] }), _jsxs("div", { className: "bg-gray-50 rounded-xl p-6", children: [_jsx("h4", { className: "font-semibold text-gray-900 mb-2", children: "What payment methods do you accept?" }), _jsx("p", { className: "text-gray-600", children: "We accept all major credit cards, debit cards, Apple Pay, Google Pay, and PayPal. All payments are processed securely through Stripe." })] })] })] })] }) }));
}
//# sourceMappingURL=Pricing.js.map