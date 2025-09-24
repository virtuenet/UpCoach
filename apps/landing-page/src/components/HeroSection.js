'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Badge, Button } from '@upcoach/ui';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Star, Users, TrendingUp, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { trackEvent } from '@/services/analytics';
export default function HeroSection({ variant = 'default' }) {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userCount, setUserCount] = useState(50000);
    const { scrollY } = useScroll();
    // Parallax effect for background
    const y1 = useTransform(scrollY, [0, 300], [0, -50]);
    const y2 = useTransform(scrollY, [0, 300], [0, -100]);
    const opacity = useTransform(scrollY, [0, 300], [1, 0.5]);
    // Simulate real-time user count
    useEffect(() => {
        const interval = setInterval(() => {
            setUserCount(prev => prev + Math.floor(Math.random() * 3));
        }, 5000);
        return () => clearInterval(interval);
    }, []);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        trackEvent('Hero CTA Clicked', {
            variant,
            email,
            source: 'hero-section',
        });
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Redirect to onboarding with email
        window.location.href = `/onboarding?email=${encodeURIComponent(email)}`;
    };
    const getContent = () => {
        switch (variant) {
            case 'coach':
                return {
                    badge: 'For Professional Coaches',
                    title: 'Scale Your Coaching Practice',
                    subtitle: 'With AI-Powered Technology',
                    description: 'Empower more clients, increase revenue, and deliver exceptional outcomes with UpCoach\'s intelligent platform.',
                    cta: 'Start Your Practice',
                };
            case 'enterprise':
                return {
                    badge: 'Enterprise Solution',
                    title: 'Transform Your Organization',
                    subtitle: 'With AI Coaching at Scale',
                    description: 'Deploy personalized coaching to your entire workforce and see measurable improvements in performance and wellbeing.',
                    cta: 'Request Demo',
                };
            default:
                return {
                    badge: 'AI-Powered Personal Growth',
                    title: 'Achieve Your Full Potential',
                    subtitle: 'With Your Personal AI Coach',
                    description: 'Get personalized guidance, track your progress, and transform your life with 24/7 AI coaching support.',
                    cta: 'Start Free Trial',
                };
        }
    };
    const content = getContent();
    return (_jsxs("section", { className: "relative min-h-screen flex items-center justify-center overflow-hidden", children: [_jsxs("div", { className: "absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50", children: [_jsx(motion.div, { style: { y: y1, opacity }, className: "absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent" }), _jsx(motion.div, { style: { y: y2 }, className: "absolute inset-0 bg-gradient-to-bl from-secondary/5 to-transparent" }), _jsx("div", { className: "absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full filter blur-3xl opacity-20 animate-blob" }), _jsx("div", { className: "absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-2000" }), _jsx("div", { className: "absolute bottom-20 left-1/2 w-72 h-72 bg-pink-300 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-4000" })] }), _jsx("div", { className: "relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20", children: _jsxs("div", { className: "text-center", children: [_jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, children: _jsx(Badge, { className: "mb-6 px-4 py-2 text-sm font-medium backdrop-blur-sm", children: content.badge }) }), _jsxs(motion.h1, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: 0.1 }, className: "text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight", children: [_jsx("span", { className: "block text-gray-900", children: content.title }), _jsx("span", { className: "block mt-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent", children: content.subtitle })] }), _jsx(motion.p, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: 0.2 }, className: "mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-gray-600", children: content.description }), _jsx(motion.form, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.5, delay: 0.3 }, onSubmit: handleSubmit, className: "mt-10 max-w-md mx-auto", children: _jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [_jsx("input", { type: "email", placeholder: "Enter your email", value: email, onChange: (e) => setEmail(e.target.value), className: "flex-1 px-5 py-4 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all", required: true, disabled: isSubmitting }), _jsx(Button, { type: "submit", size: "lg", className: "px-8 py-4 text-base font-medium rounded-xl shadow-lg hover:shadow-xl transition-all", disabled: isSubmitting, children: isSubmitting ? (_jsxs("span", { className: "flex items-center", children: [_jsxs("svg", { className: "animate-spin -ml-1 mr-3 h-5 w-5", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), "Processing..."] })) : (_jsxs(_Fragment, { children: [content.cta, _jsx(ArrowRight, { className: "ml-2 h-5 w-5" })] })) })] }) }), _jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.5, delay: 0.4 }, className: "mt-8 flex flex-wrap items-center justify-center gap-6 text-sm", children: [_jsxs("div", { className: "flex items-center gap-2 text-gray-600", children: [_jsx("div", { className: "flex -space-x-1", children: [...Array(5)].map((_, i) => (_jsx(Star, { className: "h-4 w-4 fill-yellow-400 text-yellow-400" }, i))) }), _jsx("span", { className: "font-medium", children: "4.9/5 rating" })] }), _jsxs("div", { className: "flex items-center gap-2 text-gray-600", children: [_jsx(Users, { className: "h-4 w-4" }), _jsxs("span", { className: "font-medium", children: [userCount.toLocaleString(), "+ active users"] })] }), _jsxs("div", { className: "flex items-center gap-2 text-gray-600", children: [_jsx(TrendingUp, { className: "h-4 w-4" }), _jsx("span", { className: "font-medium", children: "89% success rate" })] }), _jsxs("div", { className: "flex items-center gap-2 text-gray-600", children: [_jsx(Clock, { className: "h-4 w-4" }), _jsx("span", { className: "font-medium", children: "14-day free trial" })] })] }), _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: 0.5 }, className: "mt-16", children: [_jsx("p", { className: "text-sm text-gray-500 mb-6", children: "Trusted by teams at" }), _jsx("div", { className: "flex flex-wrap items-center justify-center gap-8 opacity-60 grayscale", children: ['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple'].map((company) => (_jsx("div", { className: "text-2xl font-bold text-gray-400", children: company }, company))) })] })] }) }), _jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 1, delay: 1 }, className: "absolute bottom-8 left-1/2 transform -translate-x-1/2", children: _jsxs("div", { className: "flex flex-col items-center gap-2", children: [_jsx("span", { className: "text-xs text-gray-500", children: "Scroll to explore" }), _jsx(motion.div, { animate: { y: [0, 8, 0] }, transition: { duration: 1.5, repeat: Infinity }, className: "w-6 h-10 border-2 border-gray-300 rounded-full flex justify-center", children: _jsx("div", { className: "w-1 h-2 bg-gray-400 rounded-full mt-2" }) })] }) })] }));
}
//# sourceMappingURL=HeroSection.js.map