'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
import { Mic, Target, Camera, BarChart3, Wifi, Brain } from 'lucide-react';
const features = [
    {
        icon: Mic,
        title: 'Voice Journaling',
        description: 'Express yourself naturally with AI-powered voice journaling. Record your thoughts, get automatic transcriptions, and gain insights from your reflections.',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        highlights: ['AI Transcription', 'Voice Analytics', 'Mood Detection'],
    },
    {
        icon: Target,
        title: 'Smart Habit Tracking',
        description: 'Build lasting habits with our intelligent tracking system. Set goals, track streaks, and celebrate achievements with gamification features.',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        highlights: ['Streak Tracking', 'Gamification', 'Custom Reminders'],
    },
    {
        icon: Camera,
        title: 'Progress Photos',
        description: 'Visualize your transformation journey with before/after photo comparisons. Track physical changes and celebrate your progress.',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        highlights: ['Photo Timeline', 'Side-by-side Compare', 'Private Gallery'],
    },
    {
        icon: Brain,
        title: 'AI Coaching Intelligence',
        description: 'Get personalized guidance from an AI coach that learns your patterns and provides tailored recommendations for your growth.',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        highlights: ['Personalized Tips', 'Pattern Recognition', 'Smart Suggestions'],
    },
    {
        icon: Wifi,
        title: 'Offline-First Design',
        description: "Never lose your progress. All features work offline and automatically sync when you're back online. Your journey never stops.",
        color: 'text-pink-600',
        bgColor: 'bg-pink-100',
        highlights: ['Offline Mode', 'Auto Sync', 'Data Security'],
    },
    {
        icon: BarChart3,
        title: 'Advanced Analytics',
        description: 'Understand your progress with detailed analytics. Track trends, identify patterns, and make data-driven decisions about your growth.',
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100',
        highlights: ['Visual Charts', 'Weekly Reports', 'Trend Analysis'],
    },
];
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};
const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
        },
    },
};
export default function Features() {
    return (_jsx("section", { id: "features", className: "py-24 bg-gradient-to-b from-white to-gray-50", children: _jsxs("div", { className: "container mx-auto px-4", children: [_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 }, className: "text-center mb-16", children: [_jsx("span", { className: "text-primary-600 font-semibold text-sm uppercase tracking-wider", children: "Features" }), _jsxs("h2", { className: "text-4xl md:text-5xl font-bold text-gray-900 mb-4 mt-2", children: ["Everything You Need to", _jsxs("span", { className: "text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600", children: [' ', "Transform"] })] }), _jsx("p", { className: "text-xl text-gray-600 max-w-3xl mx-auto", children: "UpCoach combines voice journaling, habit tracking, and AI intelligence to create a personalized coaching experience that adapts to your unique journey." })] }), _jsx(motion.div, { variants: containerVariants, initial: "hidden", whileInView: "visible", viewport: { once: true }, className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8", children: features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (_jsxs(motion.div, { variants: itemVariants, className: "group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300" }), _jsx("div", { className: `${feature.bgColor} w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`, children: _jsx(Icon, { className: `w-8 h-8 ${feature.color}` }) }), _jsx("h3", { className: "text-2xl font-semibold text-gray-900 mb-3", children: feature.title }), _jsx("p", { className: "text-gray-600 leading-relaxed mb-4", children: feature.description }), _jsx("div", { className: "flex flex-wrap gap-2 mt-4", children: feature.highlights.map((highlight, idx) => (_jsx("span", { className: "text-xs font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full", children: highlight }, idx))) })] }, index));
                    }) }), _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6, delay: 0.4 }, className: "text-center mt-16", children: [_jsx("p", { className: "text-lg text-gray-600 mb-6", children: "Ready to start your transformation journey?" }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center", children: [_jsxs("a", { href: "#download", className: "inline-flex items-center px-8 py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors duration-300", children: ["Get Started Free", _jsx("svg", { className: "w-5 h-5 ml-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13 7l5 5m0 0l-5 5m5-5H6" }) })] }), _jsxs("a", { href: "#demo", className: "inline-flex items-center px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-gray-400 transition-colors duration-300", children: ["Watch Demo", _jsxs("svg", { className: "w-5 h-5 ml-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: [_jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" }), _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M21 12a9 9 0 11-18 0 9 9 0 0118 0z" })] })] })] })] })] }) }));
}
//# sourceMappingURL=Features.js.map