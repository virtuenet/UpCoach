'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
import { CheckCircle, TrendingUp, Users, Award, Clock } from 'lucide-react';
const metrics = [
    {
        value: '50,000+',
        label: 'Active Users',
        description: 'Growing community of achievers',
        icon: Users,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
    },
    {
        value: '92%',
        label: 'Goal Achievement',
        description: 'Users reaching their targets',
        icon: TrendingUp,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
    },
    {
        value: '4.9/5',
        label: 'App Store Rating',
        description: 'From 10,000+ reviews',
        icon: Award,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
    },
    {
        value: '3M+',
        label: 'Habits Tracked',
        description: 'Total habits monitored',
        icon: CheckCircle,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
    },
];
const successStories = [
    {
        name: 'Jessica Martinez',
        achievement: 'Lost 30 lbs in 4 months',
        story: 'The progress photos feature kept me motivated. Seeing my transformation visually made all the difference.',
        beforeAfter: { before: '180 lbs', after: '150 lbs', duration: '4 months' },
        image: '/testimonials/jessica.jpg',
        category: 'Fitness',
    },
    {
        name: 'Ryan Chen',
        achievement: 'Built a $100K business',
        story: 'Daily voice journaling helped me clarify my business vision. The AI insights identified opportunities I was missing.',
        beforeAfter: { before: '$0 MRR', after: '$8.5K MRR', duration: '8 months' },
        image: '/testimonials/ryan.jpg',
        category: 'Business',
    },
    {
        name: 'Maria Silva',
        achievement: 'Overcame anxiety & depression',
        story: 'The mood tracking and AI coaching helped me identify triggers and develop healthy coping mechanisms.',
        beforeAfter: {
            before: 'Daily anxiety',
            after: '90% reduction',
            duration: '6 months',
        },
        image: '/testimonials/maria.jpg',
        category: 'Mental Health',
    },
];
const awards = [
    {
        title: 'App of the Day',
        provider: 'App Store',
        date: '2024',
        icon: '🏆',
    },
    {
        title: 'Best Wellness App',
        provider: 'TechCrunch',
        date: '2024',
        icon: '🥇',
    },
    {
        title: "Editor's Choice",
        provider: 'Google Play',
        date: '2024',
        icon: '⭐',
    },
    {
        title: 'Top 10 Productivity',
        provider: 'Product Hunt',
        date: '2023',
        icon: '🚀',
    },
];
export default function SocialProof() {
    return (_jsx("section", { className: "py-24 bg-gradient-to-b from-white to-gray-50 overflow-hidden", children: _jsxs("div", { className: "container mx-auto px-4", children: [_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 }, className: "text-center mb-16", children: [_jsx("span", { className: "text-primary-600 font-semibold text-sm uppercase tracking-wider", children: "Social Proof" }), _jsxs("h2", { className: "text-4xl md:text-5xl font-bold text-gray-900 mb-4 mt-2", children: ["Trusted by Thousands", _jsxs("span", { className: "text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600", children: [' ', "Worldwide"] })] }), _jsx("p", { className: "text-xl text-gray-600 max-w-3xl mx-auto", children: "Join a community of achievers who are transforming their lives with UpCoach" })] }), _jsx(motion.div, { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6, delay: 0.1 }, className: "grid grid-cols-2 md:grid-cols-4 gap-6 mb-20", children: metrics.map((metric, index) => {
                        const Icon = metric.icon;
                        return (_jsxs(motion.div, { initial: { opacity: 0, scale: 0.9 }, whileInView: { opacity: 1, scale: 1 }, viewport: { once: true }, transition: { duration: 0.4, delay: index * 0.1 }, className: "bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300", children: [_jsx("div", { className: `${metric.bgColor} w-12 h-12 rounded-xl flex items-center justify-center mb-4`, children: _jsx(Icon, { className: `w-6 h-6 ${metric.color}` }) }), _jsx("div", { className: "text-3xl font-bold text-gray-900 mb-1", children: metric.value }), _jsx("div", { className: "text-sm font-semibold text-gray-700", children: metric.label }), _jsx("div", { className: "text-xs text-gray-500 mt-1", children: metric.description })] }, index));
                    }) }), _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6, delay: 0.2 }, className: "mb-20", children: [_jsx("h3", { className: "text-2xl font-bold text-center text-gray-900 mb-8", children: "Awards & Recognition" }), _jsx("div", { className: "flex flex-wrap justify-center gap-6", children: awards.map((award, index) => (_jsxs(motion.div, { initial: { opacity: 0, y: 10 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.4, delay: 0.3 + index * 0.1 }, className: "bg-white rounded-xl px-6 py-4 shadow-md hover:shadow-lg transition-shadow duration-300 flex items-center gap-4", children: [_jsx("span", { className: "text-3xl", children: award.icon }), _jsxs("div", { children: [_jsx("div", { className: "font-semibold text-gray-900", children: award.title }), _jsxs("div", { className: "text-sm text-gray-600", children: [award.provider, " \u2022 ", award.date] })] })] }, index))) })] }), _jsxs(motion.div, { initial: { opacity: 0 }, whileInView: { opacity: 1 }, viewport: { once: true }, transition: { duration: 0.6, delay: 0.3 }, children: [_jsx("h3", { className: "text-2xl font-bold text-center text-gray-900 mb-12", children: "Success Stories" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8", children: successStories.map((story, index) => (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5, delay: 0.4 + index * 0.1 }, className: "bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group", children: [_jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute top-4 left-4 z-10", children: _jsx("span", { className: "bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-700 px-3 py-1 rounded-full", children: story.category }) }), _jsxs("div", { className: "h-48 bg-gradient-to-br from-primary-400 to-secondary-400 relative overflow-hidden", children: [_jsx("div", { className: "absolute inset-0 bg-black/20" }), _jsxs("div", { className: "absolute bottom-4 left-4 text-white", children: [_jsx("div", { className: "font-bold text-lg", children: story.name }), _jsx("div", { className: "text-sm opacity-90", children: story.achievement })] })] })] }), _jsxs("div", { className: "p-6", children: [_jsxs("p", { className: "text-gray-600 mb-4 italic", children: ["\"", story.story, "\""] }), _jsxs("div", { className: "bg-gray-50 rounded-xl p-4", children: [_jsxs("div", { className: "flex justify-between items-center mb-2", children: [_jsxs("div", { children: [_jsx("div", { className: "text-xs text-gray-500", children: "Before" }), _jsx("div", { className: "font-semibold text-gray-900", children: story.beforeAfter.before })] }), _jsx("div", { className: "text-2xl", children: "\u2192" }), _jsxs("div", { children: [_jsx("div", { className: "text-xs text-gray-500", children: "After" }), _jsx("div", { className: "font-semibold text-primary-600", children: story.beforeAfter.after })] })] }), _jsxs("div", { className: "text-center", children: [_jsx(Clock, { className: "w-4 h-4 inline mr-1 text-gray-400" }), _jsx("span", { className: "text-sm text-gray-600", children: story.beforeAfter.duration })] })] })] })] }, index))) })] }), _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6, delay: 0.5 }, className: "mt-20 text-center", children: [_jsxs("div", { className: "flex flex-wrap justify-center items-center gap-8 mb-8", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(CheckCircle, { className: "w-5 h-5 text-green-500" }), _jsx("span", { className: "text-gray-600", children: "HIPAA Compliant" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(CheckCircle, { className: "w-5 h-5 text-green-500" }), _jsx("span", { className: "text-gray-600", children: "256-bit Encryption" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(CheckCircle, { className: "w-5 h-5 text-green-500" }), _jsx("span", { className: "text-gray-600", children: "GDPR Compliant" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(CheckCircle, { className: "w-5 h-5 text-green-500" }), _jsx("span", { className: "text-gray-600", children: "SOC 2 Type II" })] })] }), _jsx("div", { className: "text-sm text-gray-500 mb-4", children: "As featured in" }), _jsxs("div", { className: "flex flex-wrap justify-center items-center gap-8 opacity-60", children: [_jsx("span", { className: "text-2xl font-bold text-gray-400", children: "TechCrunch" }), _jsx("span", { className: "text-2xl font-bold text-gray-400", children: "Forbes" }), _jsx("span", { className: "text-2xl font-bold text-gray-400", children: "The Verge" }), _jsx("span", { className: "text-2xl font-bold text-gray-400", children: "Wired" }), _jsx("span", { className: "text-2xl font-bold text-gray-400", children: "Inc." })] })] })] }) }));
}
//# sourceMappingURL=SocialProof.js.map