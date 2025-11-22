'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button, Card } from '@upcoach/ui';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Zap, Shield, Award, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { trackEvent } from '@/services/analytics';
const steps = [
    {
        number: 1,
        title: 'Create Your Account',
        description: 'Sign up in seconds with your email or social accounts. No credit card required.',
        icon: Zap,
        time: '30 seconds',
    },
    {
        number: 2,
        title: 'Complete Your Profile',
        description: 'Tell us about your goals, interests, and what you want to achieve.',
        icon: Award,
        time: '2 minutes',
    },
    {
        number: 3,
        title: 'Meet Your AI Coach',
        description: 'Get matched with a personalized AI coach tailored to your needs.',
        icon: Users,
        time: '1 minute',
    },
    {
        number: 4,
        title: 'Start Your Journey',
        description: 'Begin with your first coaching session and personalized action plan.',
        icon: ArrowRight,
        time: 'Ongoing',
    },
];
const benefits = [
    'Personalized AI coaching available 24/7',
    'Goal tracking and progress analytics',
    'Evidence-based coaching methodologies',
    'Private and secure conversations',
    'Mobile app for coaching on-the-go',
    'Community support and resources',
];
export default function GetStartedPage() {
    const [selectedPlan, setSelectedPlan] = useState('pro');
    const handleGetStarted = (source) => {
        trackEvent('Get Started Clicked', {
            source,
            selectedPlan,
            page: 'get-started',
        });
    };
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-b from-white to-gray-50", children: [_jsx("section", { className: "pt-20 pb-16 px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "max-w-7xl mx-auto text-center", children: [_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, children: [_jsx("h1", { className: "text-5xl font-bold text-gray-900 mb-6", children: "Start Your Transformation Today" }), _jsx("p", { className: "text-xl text-gray-600 max-w-3xl mx-auto mb-8", children: "Join thousands of people achieving their goals with personalized AI coaching. Get started in minutes and see results from day one." })] }), _jsxs(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.5, delay: 0.2 }, className: "flex flex-col sm:flex-row gap-4 justify-center mb-8", children: [_jsx(Link, { href: "/register", children: _jsxs(Button, { size: "lg", className: "text-lg px-8 py-6", onClick: () => handleGetStarted('hero'), children: ["Get Started Free", _jsx(ArrowRight, { className: "ml-2 h-5 w-5" })] }) }), _jsx(Link, { href: "#how-it-works", children: _jsx(Button, { size: "lg", variant: "outline", className: "text-lg px-8 py-6", children: "See How It Works" }) })] }), _jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.5, delay: 0.4 }, className: "flex items-center justify-center gap-8 text-sm text-gray-600", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Shield, { className: "h-4 w-4" }), _jsx("span", { children: "No credit card required" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Check, { className: "h-4 w-4 text-green-600" }), _jsx("span", { children: "14-day free trial" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Users, { className: "h-4 w-4" }), _jsx("span", { children: "50,000+ active users" })] })] })] }) }), _jsx("section", { id: "how-it-works", className: "py-20 px-4 sm:px-6 lg:px-8 bg-white", children: _jsxs("div", { className: "max-w-7xl mx-auto", children: [_jsxs("div", { className: "text-center mb-16", children: [_jsx("h2", { className: "text-4xl font-bold text-gray-900 mb-4", children: "Get Started in 4 Simple Steps" }), _jsx("p", { className: "text-xl text-gray-600", children: "From sign-up to your first coaching session in under 5 minutes" })] }), _jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-4 gap-8", children: steps.map((step, index) => (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: index * 0.1 }, viewport: { once: true }, children: _jsxs(Card, { className: "p-6 h-full hover:shadow-lg transition-shadow", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("span", { className: "text-4xl font-bold text-primary/20", children: step.number }), _jsx(step.icon, { className: "h-8 w-8 text-primary" })] }), _jsx("h3", { className: "text-xl font-semibold mb-2", children: step.title }), _jsx("p", { className: "text-gray-600 mb-4", children: step.description }), _jsxs("p", { className: "text-sm text-primary font-medium", children: ["Time: ", step.time] })] }) }, step.number))) })] }) }), _jsx("section", { className: "py-20 px-4 sm:px-6 lg:px-8", children: _jsx("div", { className: "max-w-7xl mx-auto", children: _jsxs("div", { className: "grid lg:grid-cols-2 gap-12 items-center", children: [_jsxs(motion.div, { initial: { opacity: 0, x: -20 }, whileInView: { opacity: 1, x: 0 }, transition: { duration: 0.5 }, viewport: { once: true }, children: [_jsx("h2", { className: "text-4xl font-bold text-gray-900 mb-6", children: "Everything You Need to Succeed" }), _jsx("p", { className: "text-xl text-gray-600 mb-8", children: "Our platform provides all the tools and support you need to achieve your personal and professional goals." }), _jsx("ul", { className: "space-y-4", children: benefits.map((benefit, index) => (_jsxs(motion.li, { initial: { opacity: 0, x: -20 }, whileInView: { opacity: 1, x: 0 }, transition: { duration: 0.5, delay: index * 0.1 }, viewport: { once: true }, className: "flex items-start gap-3", children: [_jsx(Check, { className: "h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" }), _jsx("span", { className: "text-lg text-gray-700", children: benefit })] }, index))) })] }), _jsxs(motion.div, { initial: { opacity: 0, x: 20 }, whileInView: { opacity: 1, x: 0 }, transition: { duration: 0.5 }, viewport: { once: true }, className: "relative", children: [_jsx("img", { src: "/images/app-mockup.png", alt: "UpCoach App", className: "rounded-2xl shadow-2xl" }), _jsxs("div", { className: "absolute -bottom-6 -right-6 bg-primary text-white p-4 rounded-xl shadow-xl", children: [_jsx("p", { className: "font-semibold", children: "Join 50,000+ Users" }), _jsx("p", { className: "text-sm opacity-90", children: "Growing every day" })] })] })] }) }) }), _jsx("section", { className: "py-20 px-4 sm:px-6 lg:px-8 bg-gray-50", children: _jsxs("div", { className: "max-w-7xl mx-auto text-center", children: [_jsx("h2", { className: "text-4xl font-bold text-gray-900 mb-4", children: "Choose Your Plan" }), _jsx("p", { className: "text-xl text-gray-600 mb-8", children: "Start free and upgrade anytime" }), _jsx("div", { className: "grid md:grid-cols-3 gap-8 max-w-5xl mx-auto", children: ['basic', 'pro', 'premium'].map(plan => (_jsx(motion.div, { whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 }, onClick: () => setSelectedPlan(plan), className: `cursor-pointer ${selectedPlan === plan ? 'ring-2 ring-primary' : ''}`, children: _jsxs(Card, { className: "p-6 h-full", children: [_jsx("h3", { className: "text-2xl font-bold capitalize mb-2", children: plan }), _jsxs("p", { className: "text-gray-600 mb-4", children: [plan === 'basic' && 'Perfect for getting started', plan === 'pro' && 'Most popular choice', plan === 'premium' && 'For serious achievers'] }), _jsxs("div", { className: "text-3xl font-bold mb-4", children: ["$", plan === 'basic' ? '9' : plan === 'pro' ? '29' : '49', _jsx("span", { className: "text-base font-normal text-gray-600", children: "/month" })] }), _jsx(Link, { href: `/register?plan=${plan}`, children: _jsxs(Button, { className: "w-full", variant: selectedPlan === plan ? 'primary' : 'outline', onClick: () => handleGetStarted(`pricing-${plan}`), children: ["Select ", plan] }) })] }) }, plan))) }), _jsx("p", { className: "mt-8 text-gray-600", children: "All plans include a 14-day free trial. No credit card required." })] }) }), _jsx("section", { className: "py-20 px-4 sm:px-6 lg:px-8 bg-primary text-white", children: _jsxs("div", { className: "max-w-4xl mx-auto text-center", children: [_jsx("h2", { className: "text-4xl font-bold mb-4", children: "Ready to Transform Your Life?" }), _jsx("p", { className: "text-xl mb-8 opacity-90", children: "Join thousands of people already achieving their goals with UpCoach" }), _jsx(Link, { href: "/register", children: _jsxs(Button, { size: "lg", variant: "secondary", className: "text-lg px-8 py-6", onClick: () => handleGetStarted('final-cta'), children: ["Start Your Free Trial", _jsx(ArrowRight, { className: "ml-2 h-5 w-5" })] }) }), _jsx("p", { className: "mt-4 text-sm opacity-75", children: "No credit card required \u2022 Cancel anytime" })] }) })] }));
}
//# sourceMappingURL=page.js.map