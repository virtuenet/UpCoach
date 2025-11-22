'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, Mail, User, Briefcase } from 'lucide-react';
import { useState } from 'react';
import { trackFormSubmit } from '@/services/analytics';
export default function LeadCaptureForm({ source = 'unknown', variant: _variant = 'inline', onSuccess, }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        company: '',
        role: '',
        interest: '',
        marketingConsent: true,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            const response = await fetch('/api/lead-capture', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    source,
                    timestamp: new Date().toISOString(),
                }),
            });
            if (!response.ok)
                throw new Error('Failed to submit form');
            // Track conversion
            trackFormSubmit('lead_capture', source);
            // Show success state
            setIsSuccess(true);
            // Trigger callback if provided
            if (onSuccess)
                onSuccess();
            // Reset form after delay
            setTimeout(() => {
                setFormData({
                    name: '',
                    email: '',
                    company: '',
                    role: '',
                    interest: '',
                    marketingConsent: true,
                });
                setIsSuccess(false);
            }, 3000);
        }
        catch (err) {
            setError('Something went wrong. Please try again.');
            console.error('Lead capture error:', err);
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? e.target.checked : value,
        }));
    };
    if (isSuccess) {
        return (_jsxs(motion.div, { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, className: "text-center p-8 bg-green-50 rounded-2xl", children: [_jsx("div", { className: "w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(Check, { className: "w-8 h-8 text-green-600" }) }), _jsx("h3", { className: "text-xl font-semibold text-gray-900 mb-2", children: "Thank You!" }), _jsx("p", { className: "text-gray-600", children: "We'll be in touch soon with exclusive updates and early access opportunities." })] }));
    }
    return (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "name", className: "block text-sm font-medium text-gray-700 mb-1", children: "Full Name *" }), _jsxs("div", { className: "relative", children: [_jsx(User, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" }), _jsx("input", { type: "text", id: "name", name: "name", value: formData.name, onChange: handleChange, required: true, className: "w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200", placeholder: "John Doe" })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700 mb-1", children: "Work Email *" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" }), _jsx("input", { type: "email", id: "email", name: "email", value: formData.email, onChange: handleChange, required: true, className: "w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200", placeholder: "john@company.com" })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "company", className: "block text-sm font-medium text-gray-700 mb-1", children: "Company" }), _jsxs("div", { className: "relative", children: [_jsx(Briefcase, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" }), _jsx("input", { type: "text", id: "company", name: "company", value: formData.company, onChange: handleChange, className: "w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200", placeholder: "Acme Inc." })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "role", className: "block text-sm font-medium text-gray-700 mb-1", children: "Your Role" }), _jsxs("select", { id: "role", name: "role", value: formData.role, onChange: handleChange, className: "w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200 bg-white", children: [_jsx("option", { value: "", children: "Select your role" }), _jsx("option", { value: "executive", children: "Executive/C-Suite" }), _jsx("option", { value: "manager", children: "Manager/Team Lead" }), _jsx("option", { value: "professional", children: "Individual Contributor" }), _jsx("option", { value: "entrepreneur", children: "Entrepreneur/Founder" }), _jsx("option", { value: "student", children: "Student" }), _jsx("option", { value: "other", children: "Other" })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "interest", className: "block text-sm font-medium text-gray-700 mb-1", children: "Primary Interest" }), _jsxs("select", { id: "interest", name: "interest", value: formData.interest, onChange: handleChange, className: "w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200 bg-white", children: [_jsx("option", { value: "", children: "What brings you to UpCoach?" }), _jsx("option", { value: "productivity", children: "Productivity & Time Management" }), _jsx("option", { value: "habits", children: "Building Better Habits" }), _jsx("option", { value: "wellness", children: "Mental Health & Wellness" }), _jsx("option", { value: "career", children: "Career Development" }), _jsx("option", { value: "leadership", children: "Leadership Skills" }), _jsx("option", { value: "personal", children: "Personal Growth" })] })] }), _jsxs("div", { className: "flex items-start", children: [_jsx("input", { type: "checkbox", id: "marketingConsent", name: "marketingConsent", checked: formData.marketingConsent, onChange: handleChange, className: "mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" }), _jsx("label", { htmlFor: "marketingConsent", className: "ml-2 text-sm text-gray-600", children: "I agree to receive marketing communications from UpCoach. You can unsubscribe at any time." })] }), _jsx(AnimatePresence, { children: error && (_jsx(motion.div, { initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: 'auto' }, exit: { opacity: 0, height: 0 }, className: "text-red-600 text-sm", children: error })) }), _jsx("button", { type: "submit", disabled: isSubmitting, className: "w-full bg-primary-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2", children: isSubmitting ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "w-5 h-5 animate-spin" }), "Submitting..."] })) : ('Get Early Access') }), _jsxs("p", { className: "text-xs text-gray-500 text-center", children: ["By submitting this form, you agree to our", ' ', _jsx("a", { href: "/privacy", className: "text-primary-600 hover:underline", children: "Privacy Policy" }), ' ', "and", ' ', _jsx("a", { href: "/terms", className: "text-primary-600 hover:underline", children: "Terms of Service" }), "."] })] }));
}
//# sourceMappingURL=LeadCaptureForm.js.map