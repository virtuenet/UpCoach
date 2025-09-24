'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Mic, Target, Camera, Brain, ChevronLeft, ChevronRight } from 'lucide-react';
const demoScreens = [
    {
        id: 'voice-journal',
        title: 'Voice Journaling',
        icon: Mic,
        color: 'purple',
        content: {
            title: 'Express Yourself Naturally',
            description: 'Record your thoughts and feelings with our AI-powered voice journaling. Get instant transcriptions and deep insights.',
            features: [
                'One-tap voice recording',
                'AI-powered transcription',
                'Mood detection',
                'Pattern insights',
            ],
            preview: {
                type: 'voice',
                waveform: true,
            },
        },
    },
    {
        id: 'habit-tracking',
        title: 'Habit Tracking',
        icon: Target,
        color: 'blue',
        content: {
            title: 'Build Lasting Habits',
            description: 'Track your daily habits with our gamified system. Build streaks, earn achievements, and transform your life.',
            features: [
                'Visual habit chains',
                'Smart reminders',
                'Achievement system',
                'Progress analytics',
            ],
            preview: {
                type: 'habits',
                habits: [
                    { name: 'Morning Meditation', completed: true, streak: 15 },
                    { name: 'Read 30 Minutes', completed: true, streak: 8 },
                    { name: 'Exercise', completed: false, streak: 5 },
                    { name: 'Gratitude Journal', completed: false, streak: 12 },
                ],
            },
        },
    },
    {
        id: 'progress-photos',
        title: 'Progress Photos',
        icon: Camera,
        color: 'green',
        content: {
            title: 'Visualize Your Journey',
            description: 'Track your physical transformation with before/after photos. See your progress over time with our timeline view.',
            features: [
                'Private photo gallery',
                'Side-by-side comparison',
                'Timeline view',
                'Milestone celebrations',
            ],
            preview: {
                type: 'photos',
                timeline: true,
            },
        },
    },
    {
        id: 'ai-coaching',
        title: 'AI Coach',
        icon: Brain,
        color: 'orange',
        content: {
            title: 'Your Personal AI Coach',
            description: 'Get personalized guidance from an AI coach that learns your patterns and adapts to your unique journey.',
            features: [
                'Personalized insights',
                'Goal recommendations',
                'Motivational support',
                'Progress predictions',
            ],
            preview: {
                type: 'ai',
                messages: [
                    {
                        type: 'ai',
                        text: "Great job on your 15-day meditation streak! I've noticed you're most consistent in the mornings.",
                    },
                    { type: 'user', text: 'Thanks! Any tips for my exercise habit?' },
                    {
                        type: 'ai',
                        text: 'Based on your patterns, try scheduling exercise right after meditation. Stack habits for better success!',
                    },
                ],
            },
        },
    },
];
export default function Demo() {
    const [activeDemo, setActiveDemo] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const currentDemo = demoScreens[activeDemo];
    const Icon = currentDemo.icon;
    const nextDemo = () => {
        setActiveDemo(prev => (prev + 1) % demoScreens.length);
    };
    const prevDemo = () => {
        setActiveDemo(prev => (prev - 1 + demoScreens.length) % demoScreens.length);
    };
    return (_jsx("section", { id: "demo", className: "py-24 bg-gradient-to-b from-white to-gray-50", children: _jsxs("div", { className: "container mx-auto px-4", children: [_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 }, className: "text-center mb-16", children: [_jsx("span", { className: "text-primary-600 font-semibold text-sm uppercase tracking-wider", children: "Interactive Demo" }), _jsxs("h2", { className: "text-4xl md:text-5xl font-bold text-gray-900 mb-4 mt-2", children: ["Experience UpCoach", _jsxs("span", { className: "text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600", children: [' ', "Live"] })] }), _jsx("p", { className: "text-xl text-gray-600 max-w-3xl mx-auto", children: "Explore our core features and see how UpCoach can transform your daily routines into lasting success" })] }), _jsxs("div", { className: "max-w-6xl mx-auto", children: [_jsx("div", { className: "flex flex-wrap justify-center gap-4 mb-12", children: demoScreens.map((screen, index) => {
                                const ScreenIcon = screen.icon;
                                return (_jsxs("button", { onClick: () => setActiveDemo(index), className: `flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${index === activeDemo
                                        ? `bg-${screen.color}-100 text-${screen.color}-700 border-2 border-${screen.color}-200`
                                        : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-gray-300'}`, children: [_jsx(ScreenIcon, { className: "w-5 h-5" }), _jsx("span", { children: screen.title })] }, screen.id));
                            }) }), _jsxs(motion.div, { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.5 }, className: "grid lg:grid-cols-2 gap-12 items-center", children: [_jsxs("div", { children: [_jsx("div", { className: `inline-flex items-center justify-center w-16 h-16 bg-${currentDemo.color}-100 rounded-2xl mb-6`, children: _jsx(Icon, { className: `w-8 h-8 text-${currentDemo.color}-600` }) }), _jsx("h3", { className: "text-3xl font-bold text-gray-900 mb-4", children: currentDemo.content.title }), _jsx("p", { className: "text-lg text-gray-600 mb-8", children: currentDemo.content.description }), _jsx("ul", { className: "space-y-3 mb-8", children: currentDemo.content.features.map((feature, index) => (_jsxs("li", { className: "flex items-center gap-3", children: [_jsx("div", { className: `w-2 h-2 bg-${currentDemo.color}-500 rounded-full` }), _jsx("span", { className: "text-gray-700", children: feature })] }, index))) }), _jsxs("div", { className: "flex gap-4", children: [_jsx("button", { onClick: prevDemo, className: "p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors", "aria-label": "Previous demo", children: _jsx(ChevronLeft, { className: "w-5 h-5" }) }), _jsx("button", { onClick: nextDemo, className: "p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors", "aria-label": "Next demo", children: _jsx(ChevronRight, { className: "w-5 h-5" }) })] })] }), _jsx("div", { className: "relative", children: _jsx("div", { className: "relative mx-auto w-[320px] h-[640px]", children: _jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-[3rem] p-3 shadow-2xl", children: _jsx("div", { className: "bg-gray-700 rounded-[2.5rem] p-1 h-full", children: _jsx("div", { className: "bg-white rounded-[2.3rem] overflow-hidden h-full", children: _jsxs("div", { className: "h-full flex flex-col", children: [_jsxs("div", { className: "flex justify-between items-center px-6 py-2 text-xs", children: [_jsx("span", { className: "font-medium", children: "9:41" }), _jsxs("div", { className: "flex gap-1", children: [_jsx("div", { className: "w-4 h-3 bg-gray-900 rounded-sm" }), _jsx("div", { className: "w-4 h-3 bg-gray-900 rounded-sm" }), _jsx("div", { className: "w-4 h-3 bg-gray-900 rounded-sm" })] })] }), _jsxs("div", { className: "flex-1 px-6 py-4 overflow-hidden", children: [currentDemo.content.preview.type === 'voice' && (_jsxs("div", { className: "h-full flex flex-col items-center justify-center", children: [_jsx("div", { className: "w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-8 animate-pulse", children: _jsx(Mic, { className: "w-16 h-16 text-white" }) }), _jsx("p", { className: "text-gray-600 mb-4", children: "Tap to start recording" }), currentDemo.content.preview.waveform && (_jsx("div", { className: "flex items-center gap-1 h-16", children: [...Array(20)].map((_, i) => (_jsx("div", { className: "w-1 bg-purple-400 rounded-full animate-pulse", style: {
                                                                                        height: `${Math.random() * 100}%`,
                                                                                        animationDelay: `${i * 0.1}s`,
                                                                                    } }, i))) }))] })), currentDemo.content.preview.type === 'habits' && (_jsxs("div", { className: "space-y-3", children: [_jsx("h4", { className: "font-semibold text-gray-900 mb-4", children: "Today's Habits" }), currentDemo.content.preview.habits?.map((habit, index) => (_jsx("div", { className: "flex items-center justify-between bg-gray-50 rounded-xl p-3", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: `w-6 h-6 rounded-full flex items-center justify-center ${habit.completed
                                                                                                ? 'bg-green-500'
                                                                                                : 'border-2 border-gray-300'}`, children: habit.completed && (_jsx("svg", { className: "w-4 h-4 text-white", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z", clipRule: "evenodd" }) })) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: habit.name }), _jsxs("p", { className: "text-xs text-gray-500", children: [habit.streak, " day streak"] })] })] }) }, index)))] })), currentDemo.content.preview.type === 'photos' && (_jsxs("div", { className: "h-full flex flex-col items-center justify-center", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4 mb-6", children: [_jsx("div", { className: "w-32 h-40 bg-gray-200 rounded-xl flex items-center justify-center", children: _jsx("span", { className: "text-gray-400", children: "Before" }) }), _jsx("div", { className: "w-32 h-40 bg-green-100 rounded-xl flex items-center justify-center", children: _jsx("span", { className: "text-green-600 font-medium", children: "After" }) })] }), _jsx("button", { className: "bg-green-500 text-white px-6 py-3 rounded-xl font-medium", children: "Add Progress Photo" })] })), currentDemo.content.preview.type === 'ai' && (_jsx("div", { className: "space-y-4", children: currentDemo.content.preview.messages?.map((message, index) => (_jsx("div", { className: `flex ${message.type === 'ai' ? 'justify-start' : 'justify-end'}`, children: _jsx("div", { className: `max-w-[80%] rounded-2xl px-4 py-3 ${message.type === 'ai'
                                                                                    ? 'bg-gray-100 text-gray-800'
                                                                                    : 'bg-blue-500 text-white'}`, children: _jsx("p", { className: "text-sm", children: message.text }) }) }, index))) }))] })] }) }) }) }) }) })] }, activeDemo), _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6, delay: 0.2 }, className: "mt-24", children: [_jsxs("div", { className: "text-center mb-12", children: [_jsx("h3", { className: "text-3xl font-bold text-gray-900 mb-4", children: "Watch the Full Demo" }), _jsx("p", { className: "text-lg text-gray-600", children: "See how real users transform their lives with UpCoach" })] }), _jsx("div", { className: "relative rounded-2xl overflow-hidden shadow-2xl bg-gray-900 max-w-4xl mx-auto", children: _jsxs("div", { className: "aspect-video relative", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-primary-600 to-secondary-600 opacity-90" }), _jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: _jsx("button", { onClick: () => setIsPlaying(!isPlaying), className: "bg-white rounded-full p-6 shadow-lg hover:scale-110 transition-transform duration-300", children: isPlaying ? (_jsx(Pause, { className: "w-12 h-12 text-primary-600" })) : (_jsx(Play, { className: "w-12 h-12 text-primary-600 ml-1" })) }) }), _jsxs("div", { className: "absolute bottom-8 left-8 text-white", children: [_jsx("p", { className: "text-2xl font-semibold mb-2", children: "Transform Your Life in 90 Days" }), _jsx("p", { className: "text-lg opacity-90", children: "3-minute demo video" })] })] }) })] })] })] }) }));
}
//# sourceMappingURL=Demo.js.map