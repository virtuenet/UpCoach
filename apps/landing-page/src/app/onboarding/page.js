'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Button, Card, Input, Label, Progress, Textarea } from '@upcoach/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, User, Target, Calendar, Brain, Sparkles, ChevronRight, } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { trackEvent } from '@/services/analytics';
import api from '@/services/api';
const steps = [
    { id: 'welcome', title: 'Welcome', icon: Sparkles },
    { id: 'profile', title: 'Your Profile', icon: User },
    { id: 'goals', title: 'Your Goals', icon: Target },
    { id: 'preferences', title: 'Preferences', icon: Brain },
    { id: 'availability', title: 'Availability', icon: Calendar },
    { id: 'complete', title: 'All Set!', icon: Check },
];
const goalOptions = [
    'Career Growth',
    'Personal Development',
    'Health & Wellness',
    'Relationship Building',
    'Financial Success',
    'Work-Life Balance',
    'Leadership Skills',
    'Stress Management',
];
const coachingStyles = [
    {
        value: 'supportive',
        label: 'Supportive & Encouraging',
        description: 'Gentle guidance with positive reinforcement',
    },
    {
        value: 'challenging',
        label: 'Direct & Challenging',
        description: 'Push boundaries and challenge comfort zones',
    },
    {
        value: 'analytical',
        label: 'Analytical & Strategic',
        description: 'Data-driven approach with clear strategies',
    },
    {
        value: 'holistic',
        label: 'Holistic & Balanced',
        description: 'Consider all aspects of life and well-being',
    },
];
export default function OnboardingPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [data, setData] = useState({
        profile: { name: '' },
        goals: { primaryGoal: '', specificGoals: [], timeline: '' },
        preferences: {
            coachingStyle: '',
            sessionFrequency: '',
            focusAreas: [],
            challenges: '',
        },
        availability: {
            preferredDays: [],
            preferredTimes: [],
            commitmentLevel: '',
        },
    });
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        trackEvent('Onboarding Started', { step: steps[currentStep].id });
    }, []);
    const updateData = (section, field, value) => {
        setData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value,
            },
        }));
    };
    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            trackEvent('Onboarding Step Completed', {
                step: steps[currentStep].id,
                nextStep: steps[currentStep + 1].id,
            });
            setCurrentStep(currentStep + 1);
        }
    };
    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };
    const completeOnboarding = async () => {
        setLoading(true);
        try {
            await api.post('/users/onboarding', data);
            trackEvent('Onboarding Completed', {
                goals: data.goals.specificGoals.length,
                coachingStyle: data.preferences.coachingStyle,
            });
            router.push('/dashboard');
        }
        catch (error) {
            console.error('Failed to complete onboarding:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const progress = ((currentStep + 1) / steps.length) * 100;
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4", children: _jsxs("div", { className: "max-w-3xl mx-auto", children: [_jsxs("div", { className: "mb-8", children: [_jsx(Progress, { value: progress, className: "h-2" }), _jsx("div", { className: "flex justify-between mt-4", children: steps.map((step, index) => (_jsxs("div", { className: `flex flex-col items-center ${index <= currentStep ? 'text-primary' : 'text-gray-400'}`, children: [_jsx("div", { className: `w-10 h-10 rounded-full flex items-center justify-center border-2 ${index < currentStep
                                            ? 'bg-primary border-primary text-white'
                                            : index === currentStep
                                                ? 'border-primary'
                                                : 'border-gray-300'}`, children: index < currentStep ? (_jsx(Check, { className: "h-5 w-5" })) : (_jsx(step.icon, { className: "h-5 w-5" })) }), _jsx("span", { className: "text-xs mt-1 hidden sm:block", children: step.title })] }, step.id))) })] }), _jsx(AnimatePresence, { mode: "wait", children: _jsx(motion.div, { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 }, transition: { duration: 0.3 }, children: _jsxs(Card, { className: "p-8", children: [currentStep === 0 && (_jsxs("div", { className: "text-center space-y-6", children: [_jsx(Sparkles, { className: "h-16 w-16 text-primary mx-auto" }), _jsx("h1", { className: "text-3xl font-bold", children: "Welcome to UpCoach!" }), _jsx("p", { className: "text-lg text-gray-600 max-w-md mx-auto", children: "Let's personalize your coaching experience. This will take about 5 minutes." }), _jsxs("div", { className: "space-y-4 text-left max-w-md mx-auto", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx(Check, { className: "h-5 w-5 text-green-600 mt-0.5" }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold", children: "Personalized AI Coach" }), _jsx("p", { className: "text-sm text-gray-600", children: "We'll match you with an AI coach tailored to your needs" })] })] }), _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(Check, { className: "h-5 w-5 text-green-600 mt-0.5" }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold", children: "Custom Action Plans" }), _jsx("p", { className: "text-sm text-gray-600", children: "Get specific steps to achieve your goals" })] })] }), _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(Check, { className: "h-5 w-5 text-green-600 mt-0.5" }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold", children: "24/7 Support" }), _jsx("p", { className: "text-sm text-gray-600", children: "Your AI coach is always available when you need guidance" })] })] })] })] })), currentStep === 1 && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold mb-2", children: "Tell us about yourself" }), _jsx("p", { className: "text-gray-600", children: "This helps us personalize your coaching experience" })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "name", children: "Your Name *" }), _jsx(Input, { id: "name", value: data.profile.name, onChange: (e) => updateData('profile', 'name', e.target.value), placeholder: "John Doe", className: "mt-1" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "age", children: "Age (optional)" }), _jsx(Input, { id: "age", type: "number", value: data.profile.age || '', onChange: (e) => updateData('profile', 'age', parseInt(e.target.value)), placeholder: "25", className: "mt-1" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "occupation", children: "Occupation (optional)" }), _jsx(Input, { id: "occupation", value: data.profile.occupation || '', onChange: (e) => updateData('profile', 'occupation', e.target.value), placeholder: "Software Engineer", className: "mt-1" })] })] })] })), currentStep === 2 && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold mb-2", children: "What are your goals?" }), _jsx("p", { className: "text-gray-600", children: "Select your primary focus area and specific goals" })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "Primary Goal Area" }), _jsx("div", { className: "mt-2 space-y-2", children: goalOptions.map(goal => (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "radio", name: "primaryGoal", value: goal, checked: data.goals.primaryGoal === goal, onChange: (e) => updateData('goals', 'primaryGoal', e.target.value), className: "h-4 w-4" }), _jsx(Label, { className: "cursor-pointer", children: goal })] }, goal))) })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "specific-goals", children: "Specific Goals" }), _jsx(Textarea, { id: "specific-goals", placeholder: "e.g., Get promoted to senior position, improve work-life balance, develop leadership skills...", value: data.goals.specificGoals.join('\n'), onChange: e => updateData('goals', 'specificGoals', e.target.value.split('\n').filter(g => g)), className: "mt-1", rows: 4 })] }), _jsxs("div", { children: [_jsx(Label, { children: "Timeline" }), _jsx("div", { className: "mt-2 grid grid-cols-2 gap-4", children: ['1-3 months', '3-6 months', '6-12 months', '1+ years'].map(time => (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "radio", name: "timeline", value: time, checked: data.goals.timeline === time, onChange: (e) => updateData('goals', 'timeline', e.target.value), className: "h-4 w-4" }), _jsx(Label, { className: "cursor-pointer", children: time })] }, time))) })] })] })] })), currentStep === 3 && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold mb-2", children: "Your coaching preferences" }), _jsx("p", { className: "text-gray-600", children: "Help us understand how you'd like to be coached" })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "Preferred Coaching Style" }), _jsx("div", { className: "mt-2 space-y-3", children: coachingStyles.map(style => (_jsx("div", { className: `p-4 border rounded-lg cursor-pointer transition-colors ${data.preferences.coachingStyle === style.value
                                                                    ? 'border-primary bg-primary/5'
                                                                    : 'border-gray-200 hover:border-gray-300'}`, children: _jsxs("div", { className: "flex items-start space-x-2", children: [_jsx("input", { type: "radio", name: "coachingStyle", value: style.value, checked: data.preferences.coachingStyle === style.value, onChange: (e) => updateData('preferences', 'coachingStyle', e.target.value), className: "h-4 w-4 mt-1" }), _jsxs("div", { className: "flex-1", children: [_jsx(Label, { htmlFor: style.value, className: "cursor-pointer font-semibold", children: style.label }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: style.description })] })] }) }, style.value))) })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "challenges", children: "Current Challenges" }), _jsx(Textarea, { id: "challenges", placeholder: "What obstacles are you facing in achieving your goals?", value: data.preferences.challenges, onChange: e => updateData('preferences', 'challenges', e.target.value), className: "mt-1", rows: 4 })] })] })] })), currentStep === 4 && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold mb-2", children: "Your availability" }), _jsx("p", { className: "text-gray-600", children: "When would you like to engage with your AI coach?" })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "Preferred Days" }), _jsx("div", { className: "grid grid-cols-2 gap-2 mt-2", children: [
                                                                'Monday',
                                                                'Tuesday',
                                                                'Wednesday',
                                                                'Thursday',
                                                                'Friday',
                                                                'Saturday',
                                                                'Sunday',
                                                            ].map(day => (_jsxs("label", { className: "flex items-center space-x-2 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: data.availability.preferredDays.includes(day), onChange: e => {
                                                                            const days = e.target.checked
                                                                                ? [...data.availability.preferredDays, day]
                                                                                : data.availability.preferredDays.filter(d => d !== day);
                                                                            updateData('availability', 'preferredDays', days);
                                                                        }, className: "rounded" }), _jsx("span", { children: day })] }, day))) })] }), _jsxs("div", { children: [_jsx(Label, { children: "Commitment Level" }), _jsx("div", { className: "mt-2", children: _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "radio", name: "commitmentLevel", value: "daily", checked: data.availability.commitmentLevel === 'daily', onChange: (e) => updateData('availability', 'commitmentLevel', e.target.value), className: "h-4 w-4" }), _jsx(Label, { htmlFor: "daily", className: "cursor-pointer", children: "Daily (10-15 minutes per day)" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "radio", name: "commitmentLevel", value: "regular", checked: data.availability.commitmentLevel === 'regular', onChange: (e) => updateData('availability', 'commitmentLevel', e.target.value), className: "h-4 w-4" }), _jsx(Label, { htmlFor: "regular", className: "cursor-pointer", children: "Regular (3-4 times per week)" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "radio", name: "commitmentLevel", value: "weekly", checked: data.availability.commitmentLevel === 'weekly', onChange: (e) => updateData('availability', 'commitmentLevel', e.target.value), className: "h-4 w-4" }), _jsx(Label, { htmlFor: "weekly", className: "cursor-pointer", children: "Weekly (1-2 times per week)" })] })] }) })] })] })] })), currentStep === 5 && (_jsxs("div", { className: "text-center space-y-6", children: [_jsx(Check, { className: "h-16 w-16 text-green-600 mx-auto" }), _jsx("h1", { className: "text-3xl font-bold", children: "You're all set!" }), _jsx("p", { className: "text-lg text-gray-600 max-w-md mx-auto", children: "Your personalized AI coach is ready. Let's start your journey to success!" }), _jsxs("div", { className: "bg-gray-50 rounded-lg p-6 max-w-md mx-auto", children: [_jsx("h3", { className: "font-semibold mb-3", children: "What happens next?" }), _jsxs("ul", { className: "space-y-2 text-left", children: [_jsxs("li", { className: "flex items-start gap-2", children: [_jsx(ChevronRight, { className: "h-5 w-5 text-primary mt-0.5" }), _jsx("span", { children: "Your AI coach will create a personalized action plan" })] }), _jsxs("li", { className: "flex items-start gap-2", children: [_jsx(ChevronRight, { className: "h-5 w-5 text-primary mt-0.5" }), _jsx("span", { children: "You'll receive daily check-ins and motivation" })] }), _jsxs("li", { className: "flex items-start gap-2", children: [_jsx(ChevronRight, { className: "h-5 w-5 text-primary mt-0.5" }), _jsx("span", { children: "Track your progress with insights and analytics" })] })] })] })] })), _jsxs("div", { className: "flex justify-between mt-8", children: [_jsxs(Button, { variant: "outline", onClick: prevStep, disabled: currentStep === 0, className: currentStep === 0 ? 'invisible' : '', children: [_jsx(ArrowLeft, { className: "h-4 w-4 mr-2" }), "Back"] }), currentStep < steps.length - 1 ? (_jsxs(Button, { onClick: nextStep, disabled: (currentStep === 1 && !data.profile.name) ||
                                                (currentStep === 2 && !data.goals.primaryGoal) ||
                                                (currentStep === 3 && !data.preferences.coachingStyle) ||
                                                (currentStep === 4 && !data.availability.commitmentLevel), children: ["Next", _jsx(ArrowRight, { className: "h-4 w-4 ml-2" })] })) : (_jsx(Button, { onClick: completeOnboarding, disabled: loading, className: "min-w-[150px]", children: loading ? (_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-white" })) : (_jsxs(_Fragment, { children: ["Start Coaching", _jsx(ArrowRight, { className: "h-4 w-4 ml-2" })] })) }))] })] }) }, currentStep) })] }) }));
}
//# sourceMappingURL=page.js.map