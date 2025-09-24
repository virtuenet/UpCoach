'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Badge, Button, Card } from '@upcoach/ui';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Users, Calendar, DollarSign, BarChart3, MessageSquare, Sparkles, Shield, Globe, Award, } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { trackEvent } from '@/services/analytics';
const features = [
    {
        icon: Users,
        title: 'Expand Your Reach',
        description: 'Connect with clients globally and scale your coaching practice beyond geographical limits.',
    },
    {
        icon: Calendar,
        title: 'Flexible Scheduling',
        description: 'AI handles scheduling, reminders, and follow-ups so you can focus on coaching.',
    },
    {
        icon: DollarSign,
        title: 'Increase Revenue',
        description: 'Serve more clients efficiently with AI assistance, multiplying your income potential.',
    },
    {
        icon: BarChart3,
        title: 'Track Progress',
        description: 'Advanced analytics show client progress and coaching effectiveness in real-time.',
    },
    {
        icon: MessageSquare,
        title: '24/7 AI Support',
        description: 'Your AI assistant provides support to clients between sessions, enhancing outcomes.',
    },
    {
        icon: Sparkles,
        title: 'Personalized Programs',
        description: "AI helps create customized coaching programs based on each client's unique needs.",
    },
];
const testimonials = [
    {
        name: 'Sarah Johnson',
        role: 'Executive Coach',
        image: '/images/coach-1.jpg',
        quote: "UpCoach has transformed my practice. I'm now helping 3x more clients while maintaining quality.",
        revenue: '+180% revenue increase',
    },
    {
        name: 'Michael Chen',
        role: 'Life Coach',
        image: '/images/coach-2.jpg',
        quote: 'The AI assistant handles routine tasks, letting me focus on deep, transformative coaching work.',
        revenue: '500+ clients served',
    },
    {
        name: 'Emma Williams',
        role: 'Career Coach',
        image: '/images/coach-3.jpg',
        quote: 'My clients love the 24/7 support. Their progress has accelerated dramatically.',
        revenue: '95% client retention',
    },
];
const benefits = [
    { label: 'Average Revenue Increase', value: '156%' },
    { label: 'Client Capacity', value: '3-5x' },
    { label: 'Time Saved Weekly', value: '15+ hours' },
    { label: 'Client Satisfaction', value: '4.9/5' },
];
export default function ForCoachesPage() {
    const [email, setEmail] = useState('');
    const handleSubmit = (e) => {
        e.preventDefault();
        trackEvent('Coach Signup Started', {
            source: 'for-coaches-page',
            email,
        });
        // Handle coach signup
    };
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-b from-white to-gray-50", children: [_jsx("section", { className: "pt-20 pb-16 px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "max-w-7xl mx-auto", children: [_jsxs("div", { className: "text-center", children: [_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, children: [_jsx(Badge, { className: "mb-4", variant: "secondary", children: "For Professional Coaches" }), _jsxs("h1", { className: "text-5xl md:text-6xl font-bold text-gray-900 mb-6", children: ["Scale Your Coaching Practice", _jsx("span", { className: "text-primary block", children: "With AI Technology" })] }), _jsx("p", { className: "text-xl text-gray-600 max-w-3xl mx-auto mb-8", children: "Empower more clients, increase your revenue, and deliver better outcomes with UpCoach's AI-enhanced coaching platform." })] }), _jsxs(motion.form, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.5, delay: 0.2 }, onSubmit: handleSubmit, className: "max-w-md mx-auto flex gap-4", children: [_jsx("input", { type: "email", placeholder: "Enter your email", value: email, onChange: e => setEmail(e.target.value), className: "flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary", required: true }), _jsxs(Button, { type: "submit", size: "lg", children: ["Get Started", _jsx(ArrowRight, { className: "ml-2 h-5 w-5" })] })] }), _jsx(motion.p, { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.5, delay: 0.4 }, className: "mt-4 text-sm text-gray-600", children: "Join 5,000+ coaches already using UpCoach \u2022 No credit card required" })] }), _jsx(motion.div, { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, viewport: { once: true }, className: "grid grid-cols-2 md:grid-cols-4 gap-8 mt-16", children: benefits.map((benefit, index) => (_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-3xl md:text-4xl font-bold text-primary mb-2", children: benefit.value }), _jsx("div", { className: "text-gray-600", children: benefit.label })] }, index))) })] }) }), _jsx("section", { className: "py-20 px-4 sm:px-6 lg:px-8 bg-white", children: _jsxs("div", { className: "max-w-7xl mx-auto", children: [_jsxs("div", { className: "text-center mb-16", children: [_jsx("h2", { className: "text-4xl font-bold text-gray-900 mb-4", children: "Everything You Need to Scale" }), _jsx("p", { className: "text-xl text-gray-600", children: "Powerful tools designed specifically for professional coaches" })] }), _jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-8", children: features.map((feature, index) => (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: index * 0.1 }, viewport: { once: true }, children: _jsxs(Card, { className: "p-6 h-full hover:shadow-lg transition-shadow", children: [_jsx(feature.icon, { className: "h-12 w-12 text-primary mb-4" }), _jsx("h3", { className: "text-xl font-semibold mb-2", children: feature.title }), _jsx("p", { className: "text-gray-600", children: feature.description })] }) }, index))) })] }) }), _jsx("section", { className: "py-20 px-4 sm:px-6 lg:px-8", children: _jsx("div", { className: "max-w-7xl mx-auto", children: _jsxs("div", { className: "grid lg:grid-cols-2 gap-12 items-center", children: [_jsxs(motion.div, { initial: { opacity: 0, x: -20 }, whileInView: { opacity: 1, x: 0 }, transition: { duration: 0.5 }, viewport: { once: true }, children: [_jsx("h2", { className: "text-4xl font-bold text-gray-900 mb-6", children: "How AI Enhances Your Coaching" }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex gap-4", children: [_jsx("div", { className: "flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center", children: _jsx("span", { className: "text-primary font-bold", children: "1" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-lg mb-1", children: "Onboard Clients Seamlessly" }), _jsx("p", { className: "text-gray-600", children: "AI helps assess client needs, set goals, and create personalized coaching plans." })] })] }), _jsxs("div", { className: "flex gap-4", children: [_jsx("div", { className: "flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center", children: _jsx("span", { className: "text-primary font-bold", children: "2" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-lg mb-1", children: "Provide 24/7 Support" }), _jsx("p", { className: "text-gray-600", children: "Your AI assistant engages clients between sessions, reinforcing your coaching." })] })] }), _jsxs("div", { className: "flex gap-4", children: [_jsx("div", { className: "flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center", children: _jsx("span", { className: "text-primary font-bold", children: "3" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-lg mb-1", children: "Track & Optimize" }), _jsx("p", { className: "text-gray-600", children: "Get insights on client progress and coaching effectiveness to improve outcomes." })] })] })] })] }), _jsxs(motion.div, { initial: { opacity: 0, x: 20 }, whileInView: { opacity: 1, x: 0 }, transition: { duration: 0.5 }, viewport: { once: true }, className: "relative", children: [_jsx("img", { src: "/images/coach-dashboard.png", alt: "Coach Dashboard", className: "rounded-2xl shadow-2xl" }), _jsxs("div", { className: "absolute -top-6 -right-6 bg-green-500 text-white p-4 rounded-xl shadow-xl", children: [_jsx(TrendingUp, { className: "h-6 w-6 mb-1" }), _jsx("p", { className: "font-semibold", children: "156% Growth" })] })] })] }) }) }), _jsx("section", { className: "py-20 px-4 sm:px-6 lg:px-8 bg-gray-50", children: _jsxs("div", { className: "max-w-7xl mx-auto", children: [_jsxs("div", { className: "text-center mb-16", children: [_jsx("h2", { className: "text-4xl font-bold text-gray-900 mb-4", children: "Coaches Love UpCoach" }), _jsx("p", { className: "text-xl text-gray-600", children: "See how coaches are transforming their practices" })] }), _jsx("div", { className: "grid md:grid-cols-3 gap-8", children: testimonials.map((testimonial, index) => (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: index * 0.1 }, viewport: { once: true }, children: _jsxs(Card, { className: "p-6 h-full", children: [_jsxs("div", { className: "flex items-center gap-4 mb-4", children: [_jsx("img", { src: testimonial.image, alt: testimonial.name, className: "w-16 h-16 rounded-full object-cover" }), _jsxs("div", { children: [_jsx("h4", { className: "font-semibold", children: testimonial.name }), _jsx("p", { className: "text-sm text-gray-600", children: testimonial.role })] })] }), _jsxs("p", { className: "text-gray-700 mb-4 italic", children: ["\"", testimonial.quote, "\""] }), _jsx(Badge, { variant: "secondary", children: testimonial.revenue })] }) }, index))) })] }) }), _jsx("section", { className: "py-20 px-4 sm:px-6 lg:px-8 bg-white", children: _jsxs("div", { className: "max-w-7xl mx-auto", children: [_jsxs("div", { className: "text-center mb-16", children: [_jsx("h2", { className: "text-4xl font-bold text-gray-900 mb-4", children: "Coach Partnership Plans" }), _jsx("p", { className: "text-xl text-gray-600", children: "Flexible pricing that grows with your practice" })] }), _jsxs("div", { className: "grid md:grid-cols-3 gap-8 max-w-5xl mx-auto", children: [_jsxs(Card, { className: "p-8", children: [_jsx("h3", { className: "text-2xl font-bold mb-2", children: "Starter" }), _jsx("p", { className: "text-gray-600 mb-4", children: "For coaches getting started" }), _jsxs("div", { className: "text-4xl font-bold mb-6", children: ["$99", _jsx("span", { className: "text-base font-normal text-gray-600", children: "/month" })] }), _jsxs("ul", { className: "space-y-3 mb-8", children: [_jsxs("li", { className: "flex items-center gap-2", children: [_jsx(Shield, { className: "h-5 w-5 text-green-600" }), _jsx("span", { children: "Up to 25 clients" })] }), _jsxs("li", { className: "flex items-center gap-2", children: [_jsx(Shield, { className: "h-5 w-5 text-green-600" }), _jsx("span", { children: "AI coaching assistant" })] }), _jsxs("li", { className: "flex items-center gap-2", children: [_jsx(Shield, { className: "h-5 w-5 text-green-600" }), _jsx("span", { children: "Basic analytics" })] })] }), _jsx(Button, { className: "w-full", variant: "outline", children: "Get Started" })] }), _jsxs(Card, { className: "p-8 border-primary shadow-lg relative", children: [_jsx(Badge, { className: "absolute -top-3 right-6", children: "Most Popular" }), _jsx("h3", { className: "text-2xl font-bold mb-2", children: "Professional" }), _jsx("p", { className: "text-gray-600 mb-4", children: "For growing practices" }), _jsxs("div", { className: "text-4xl font-bold mb-6", children: ["$249", _jsx("span", { className: "text-base font-normal text-gray-600", children: "/month" })] }), _jsxs("ul", { className: "space-y-3 mb-8", children: [_jsxs("li", { className: "flex items-center gap-2", children: [_jsx(Shield, { className: "h-5 w-5 text-green-600" }), _jsx("span", { children: "Up to 100 clients" })] }), _jsxs("li", { className: "flex items-center gap-2", children: [_jsx(Shield, { className: "h-5 w-5 text-green-600" }), _jsx("span", { children: "Advanced AI features" })] }), _jsxs("li", { className: "flex items-center gap-2", children: [_jsx(Shield, { className: "h-5 w-5 text-green-600" }), _jsx("span", { children: "Full analytics suite" })] }), _jsxs("li", { className: "flex items-center gap-2", children: [_jsx(Shield, { className: "h-5 w-5 text-green-600" }), _jsx("span", { children: "White-label options" })] })] }), _jsx(Button, { className: "w-full", children: "Get Started" })] }), _jsxs(Card, { className: "p-8", children: [_jsx("h3", { className: "text-2xl font-bold mb-2", children: "Enterprise" }), _jsx("p", { className: "text-gray-600 mb-4", children: "For coaching organizations" }), _jsx("div", { className: "text-4xl font-bold mb-6", children: "Custom" }), _jsxs("ul", { className: "space-y-3 mb-8", children: [_jsxs("li", { className: "flex items-center gap-2", children: [_jsx(Shield, { className: "h-5 w-5 text-green-600" }), _jsx("span", { children: "Unlimited clients" })] }), _jsxs("li", { className: "flex items-center gap-2", children: [_jsx(Shield, { className: "h-5 w-5 text-green-600" }), _jsx("span", { children: "Custom AI training" })] }), _jsxs("li", { className: "flex items-center gap-2", children: [_jsx(Shield, { className: "h-5 w-5 text-green-600" }), _jsx("span", { children: "API access" })] }), _jsxs("li", { className: "flex items-center gap-2", children: [_jsx(Shield, { className: "h-5 w-5 text-green-600" }), _jsx("span", { children: "Dedicated support" })] })] }), _jsx(Button, { className: "w-full", variant: "outline", children: "Contact Sales" })] })] })] }) }), _jsx("section", { className: "py-20 px-4 sm:px-6 lg:px-8 bg-primary text-white", children: _jsxs("div", { className: "max-w-4xl mx-auto text-center", children: [_jsx("h2", { className: "text-4xl font-bold mb-4", children: "Ready to Scale Your Coaching Practice?" }), _jsx("p", { className: "text-xl mb-8 opacity-90", children: "Join thousands of coaches already transforming lives with AI" }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center", children: [_jsx(Link, { href: "/register?type=coach", children: _jsxs(Button, { size: "lg", variant: "secondary", className: "text-lg px-8 py-6", children: ["Start Free Trial", _jsx(ArrowRight, { className: "ml-2 h-5 w-5" })] }) }), _jsx(Link, { href: "/contact-sales", children: _jsx(Button, { size: "lg", variant: "outline", className: "text-lg px-8 py-6 bg-transparent text-white border-white hover:bg-white hover:text-primary", children: "Schedule Demo" }) })] }), _jsxs("div", { className: "mt-8 flex items-center justify-center gap-8 text-sm", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Award, { className: "h-5 w-5" }), _jsx("span", { children: "30-day money back guarantee" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Globe, { className: "h-5 w-5" }), _jsx("span", { children: "Available in 25+ countries" })] })] })] }) })] }));
}
//# sourceMappingURL=page.js.map