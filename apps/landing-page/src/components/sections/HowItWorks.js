'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { UserPlus, MessageSquare, Target, TrendingUp } from 'lucide-react';
const steps = [
    {
        number: '01',
        icon: UserPlus,
        title: 'Sign Up & Onboard',
        description: 'Create your account and complete a quick assessment to help your AI coach understand your goals and working style.',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
    },
    {
        number: '02',
        icon: MessageSquare,
        title: 'Chat with Your AI Coach',
        description: 'Have meaningful conversations with your AI coach anytime. Get personalized advice, set goals, and track your mood.',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
    },
    {
        number: '03',
        icon: Target,
        title: 'Set Goals & Tasks',
        description: 'Work with your coach to set SMART goals and break them down into actionable tasks with realistic timelines.',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
    },
    {
        number: '04',
        icon: TrendingUp,
        title: 'Track & Improve',
        description: 'Monitor your progress with detailed analytics. Receive weekly reports and celebrate your achievements.',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
    },
];
export default function HowItWorks() {
    return (_jsx("section", { id: "how-it-works", className: "py-20 bg-gray-50", children: _jsxs("div", { className: "container mx-auto px-4", children: [_jsxs("div", { className: "text-center mb-16", children: [_jsx("h2", { className: "text-4xl font-bold text-gray-900 mb-4", children: "How UpCoach Works" }), _jsx("p", { className: "text-xl text-gray-600 max-w-3xl mx-auto", children: "Getting started with UpCoach is simple. Follow these four steps to begin your transformation journey." })] }), _jsx("div", { className: "max-w-5xl mx-auto", children: steps.map((step, index) => {
                        const Icon = step.icon;
                        return (_jsxs("div", { className: "flex flex-col md:flex-row items-center mb-12 last:mb-0", children: [_jsx("div", { className: "flex-shrink-0 mb-6 md:mb-0 md:mr-8", children: _jsx("div", { className: "w-20 h-20 rounded-full bg-gray-900 flex items-center justify-center", children: _jsx("span", { className: "text-3xl font-bold text-white", children: step.number }) }) }), _jsx("div", { className: "flex-1 bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300", children: _jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: `${step.bgColor} w-14 h-14 rounded-xl flex items-center justify-center mr-6 flex-shrink-0`, children: _jsx(Icon, { className: `w-7 h-7 ${step.color}` }) }), _jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "text-2xl font-semibold text-gray-900 mb-3", children: step.title }), _jsx("p", { className: "text-gray-600 leading-relaxed", children: step.description })] })] }) }), index < steps.length - 1 && (_jsx("div", { className: "hidden md:block absolute left-10 top-20 w-px h-24 bg-gray-300 -translate-x-1/2" }))] }, index));
                    }) }), _jsx("div", { className: "text-center mt-16", children: _jsx("button", { className: "btn-primary text-lg px-8 py-4", children: "Start Your Journey" }) })] }) }));
}
//# sourceMappingURL=HowItWorks.js.map