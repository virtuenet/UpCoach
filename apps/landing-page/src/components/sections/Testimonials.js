'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { useState } from 'react';
const testimonials = [
    {
        name: 'Sarah Chen',
        role: 'Senior Product Manager',
        company: 'TechCorp',
        avatar: 'SC',
        avatarBg: 'bg-gradient-to-br from-purple-500 to-pink-500',
        content: 'Voice journaling changed my life. I process my thoughts better by speaking, and the AI insights help me identify patterns I never noticed. My productivity has increased by 40% in just 2 months.',
        rating: 5,
        feature: 'Voice Journaling',
    },
    {
        name: 'Michael Rodriguez',
        role: 'Entrepreneur',
        company: 'StartupHub',
        avatar: 'MR',
        avatarBg: 'bg-gradient-to-br from-blue-500 to-cyan-500',
        content: "The habit tracking with gamification keeps me engaged. I've built 12 new habits and maintained a 90-day streak. The progress photos feature helps me visualize my fitness transformation.",
        rating: 5,
        feature: 'Habit Tracking',
    },
    {
        name: 'Emily Thompson',
        role: 'Marketing Director',
        company: 'Growth Agency',
        avatar: 'ET',
        avatarBg: 'bg-gradient-to-br from-green-500 to-emerald-500',
        content: 'The offline-first design is brilliant. I travel frequently and never lose my data. The AI coach adapts to my schedule and provides personalized recommendations that actually work.',
        rating: 5,
        feature: 'AI Coaching',
    },
    {
        name: 'David Kim',
        role: 'Software Engineer',
        company: 'DevOps Inc',
        avatar: 'DK',
        avatarBg: 'bg-gradient-to-br from-orange-500 to-red-500',
        content: "As someone who struggles with consistency, the streak tracking and achievements keep me motivated. I've completed 30 days of meditation and feel more focused than ever.",
        rating: 5,
        feature: 'Gamification',
    },
    {
        name: 'Lisa Anderson',
        role: 'Fitness Coach',
        company: 'FitLife Pro',
        avatar: 'LA',
        avatarBg: 'bg-gradient-to-br from-indigo-500 to-purple-500',
        content: 'The progress photos feature is incredible for tracking client transformations. The side-by-side comparisons and timeline view make it easy to show real results.',
        rating: 5,
        feature: 'Progress Photos',
    },
    {
        name: 'James Wilson',
        role: 'Executive Coach',
        company: 'Leadership Plus',
        avatar: 'JW',
        avatarBg: 'bg-gradient-to-br from-pink-500 to-rose-500',
        content: 'UpCoach complements my coaching practice perfectly. The analytics help me track client progress between sessions, and the voice notes provide deeper insights into their journey.',
        rating: 5,
        feature: 'Analytics',
    },
];
export default function Testimonials() {
    const [activeIndex, setActiveIndex] = useState(0);
    return (_jsx("section", { id: "testimonials", className: "py-24 bg-gradient-to-b from-gray-50 to-white overflow-hidden", children: _jsxs("div", { className: "container mx-auto px-4", children: [_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 }, className: "text-center mb-16", children: [_jsx("span", { className: "text-primary-600 font-semibold text-sm uppercase tracking-wider", children: "Testimonials" }), _jsxs("h2", { className: "text-4xl md:text-5xl font-bold text-gray-900 mb-4 mt-2", children: ["Real Stories,", _jsxs("span", { className: "text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600", children: [' ', "Real Results"] })] }), _jsx("p", { className: "text-xl text-gray-600 max-w-3xl mx-auto", children: "Join thousands of users who have transformed their lives with UpCoach's innovative features" })] }), _jsx(motion.div, { initial: { opacity: 0, scale: 0.95 }, whileInView: { opacity: 1, scale: 1 }, viewport: { once: true }, transition: { duration: 0.6 }, className: "max-w-4xl mx-auto mb-16", children: _jsxs("div", { className: "bg-white rounded-3xl shadow-2xl p-8 md:p-12 relative", children: [_jsx(Quote, { className: "absolute top-8 left-8 w-12 h-12 text-primary-100" }), _jsxs("div", { className: "relative z-10", children: [_jsxs("div", { className: "flex items-center mb-6", children: [[...Array(testimonials[activeIndex].rating)].map((_, i) => (_jsx(Star, { className: "w-6 h-6 text-yellow-400 fill-current" }, i))), _jsx("span", { className: "ml-4 text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full", children: testimonials[activeIndex].feature })] }), _jsxs("p", { className: "text-xl md:text-2xl text-gray-800 leading-relaxed mb-8", children: ["\"", testimonials[activeIndex].content, "\""] }), _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: `w-16 h-16 rounded-full ${testimonials[activeIndex].avatarBg} flex items-center justify-center text-white font-bold text-xl mr-4`, children: testimonials[activeIndex].avatar }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold text-lg text-gray-900", children: testimonials[activeIndex].name }), _jsxs("p", { className: "text-gray-600", children: [testimonials[activeIndex].role, " at ", testimonials[activeIndex].company] })] })] })] }), _jsx("div", { className: "flex justify-center gap-2 mt-8", children: testimonials.map((_, index) => (_jsx("button", { onClick: () => setActiveIndex(index), className: `w-2 h-2 rounded-full transition-all duration-300 ${index === activeIndex ? 'w-8 bg-primary-600' : 'bg-gray-300 hover:bg-gray-400'}`, "aria-label": `Go to testimonial ${index + 1}` }, index))) })] }) }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto", children: testimonials.slice(0, 3).map((testimonial, index) => (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5, delay: index * 0.1 }, className: "bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300", children: [_jsx("div", { className: "flex items-center mb-4", children: [...Array(testimonial.rating)].map((_, i) => (_jsx(Star, { className: "w-4 h-4 text-yellow-400 fill-current" }, i))) }), _jsxs("p", { className: "text-gray-700 mb-6 leading-relaxed", children: ["\"", testimonial.content, "\""] }), _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: `w-10 h-10 rounded-full ${testimonial.avatarBg} flex items-center justify-center text-white font-semibold text-sm mr-3`, children: testimonial.avatar }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold text-gray-900", children: testimonial.name }), _jsx("p", { className: "text-sm text-gray-600", children: testimonial.role })] })] })] }, index))) }), _jsx(motion.div, { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6, delay: 0.3 }, className: "mt-20", children: _jsx("div", { className: "bg-gradient-to-r from-primary-600 to-secondary-600 rounded-3xl p-12", children: _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-8 text-white", children: [_jsxs("div", { className: "text-center", children: [_jsx(motion.div, { initial: { scale: 0 }, whileInView: { scale: 1 }, viewport: { once: true }, transition: { duration: 0.5, delay: 0.1 }, className: "text-4xl md:text-5xl font-bold mb-2", children: "50K+" }), _jsx("p", { className: "text-white/80", children: "Active Users" })] }), _jsxs("div", { className: "text-center", children: [_jsx(motion.div, { initial: { scale: 0 }, whileInView: { scale: 1 }, viewport: { once: true }, transition: { duration: 0.5, delay: 0.2 }, className: "text-4xl md:text-5xl font-bold mb-2", children: "4.9\u2605" }), _jsx("p", { className: "text-white/80", children: "App Store Rating" })] }), _jsxs("div", { className: "text-center", children: [_jsx(motion.div, { initial: { scale: 0 }, whileInView: { scale: 1 }, viewport: { once: true }, transition: { duration: 0.5, delay: 0.3 }, className: "text-4xl md:text-5xl font-bold mb-2", children: "3M+" }), _jsx("p", { className: "text-white/80", children: "Habits Tracked" })] }), _jsxs("div", { className: "text-center", children: [_jsx(motion.div, { initial: { scale: 0 }, whileInView: { scale: 1 }, viewport: { once: true }, transition: { duration: 0.5, delay: 0.4 }, className: "text-4xl md:text-5xl font-bold mb-2", children: "92%" }), _jsx("p", { className: "text-white/80", children: "Goal Achievement" })] })] }) }) })] }) }));
}
//# sourceMappingURL=Testimonials.js.map