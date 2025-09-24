'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle, AlertCircle, Loader2, User, Mail, MessageSquare, Building, } from 'lucide-react';
export default function ContactForm({ variant = 'default', onSuccess, className = '', }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        company: '',
        message: '',
        source: 'contact-form',
    });
    const [status, setStatus] = useState('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [touched, setTouched] = useState({});
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user starts typing
        if (status === 'error') {
            setStatus('idle');
            setErrorMessage('');
        }
    };
    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };
    const validateForm = () => {
        if (!formData.name.trim()) {
            setErrorMessage('Please enter your name');
            setStatus('error');
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setErrorMessage('Please enter a valid email address');
            setStatus('error');
            return false;
        }
        if (!formData.message.trim()) {
            setErrorMessage('Please enter a message');
            setStatus('error');
            return false;
        }
        if (formData.message.length < 10) {
            setErrorMessage('Message must be at least 10 characters');
            setStatus('error');
            return false;
        }
        return true;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm())
            return;
        setStatus('loading');
        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (response.ok) {
                setStatus('success');
                // Track conversion
                const { trackContactForm } = await import('@/services/analytics');
                trackContactForm(variant);
                onSuccess?.(formData);
                // Reset form after delay
                setTimeout(() => {
                    setFormData({
                        name: '',
                        email: '',
                        company: '',
                        message: '',
                        source: 'contact-form',
                    });
                    setTouched({});
                    setStatus('idle');
                }, 3000);
            }
            else {
                setStatus('error');
                setErrorMessage(data.message || 'Something went wrong. Please try again.');
            }
        }
        catch (error) {
            setStatus('error');
            setErrorMessage('Network error. Please try again later.');
        }
    };
    const getFieldError = (field) => {
        if (!touched[field])
            return null;
        switch (field) {
            case 'name':
                return formData.name.trim() ? null : 'Name is required';
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(formData.email) ? null : 'Valid email is required';
            case 'message':
                if (!formData.message.trim())
                    return 'Message is required';
                if (formData.message.length < 10)
                    return 'Message must be at least 10 characters';
                return null;
            default:
                return null;
        }
    };
    if (variant === 'sidebar') {
        return (_jsxs("div", { className: `bg-gray-50 rounded-2xl p-6 ${className}`, children: [_jsx("h3", { className: "text-xl font-bold text-gray-900 mb-4", children: "Get in Touch" }), _jsx("p", { className: "text-gray-600 mb-6", children: "Have questions? We'd love to hear from you." }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("input", { type: "text", name: "name", value: formData.name, onChange: handleChange, onBlur: () => handleBlur('name'), placeholder: "Your name", className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${getFieldError('name') ? 'border-red-500' : 'border-gray-200'}`, disabled: status === 'loading' || status === 'success' }), getFieldError('name') && (_jsx("p", { className: "text-red-500 text-sm mt-1", children: getFieldError('name') }))] }), _jsxs("div", { children: [_jsx("input", { type: "email", name: "email", value: formData.email, onChange: handleChange, onBlur: () => handleBlur('email'), placeholder: "Email address", className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${getFieldError('email') ? 'border-red-500' : 'border-gray-200'}`, disabled: status === 'loading' || status === 'success' }), getFieldError('email') && (_jsx("p", { className: "text-red-500 text-sm mt-1", children: getFieldError('email') }))] }), _jsxs("div", { children: [_jsx("textarea", { name: "message", value: formData.message, onChange: handleChange, onBlur: () => handleBlur('message'), placeholder: "Your message", rows: 4, className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none ${getFieldError('message') ? 'border-red-500' : 'border-gray-200'}`, disabled: status === 'loading' || status === 'success' }), getFieldError('message') && (_jsx("p", { className: "text-red-500 text-sm mt-1", children: getFieldError('message') }))] }), _jsxs("button", { type: "submit", disabled: status === 'loading' || status === 'success', className: "w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2", children: [status === 'loading' && _jsx(Loader2, { className: "w-5 h-5 animate-spin" }), status === 'success' && _jsx(CheckCircle, { className: "w-5 h-5" }), status === 'idle' && _jsx(Send, { className: "w-5 h-5" }), status === 'loading' && 'Sending...', status === 'success' && 'Sent!', status === 'idle' && 'Send Message', status === 'error' && 'Try Again'] }), status === 'error' && errorMessage && (_jsxs("p", { className: "text-red-600 text-sm flex items-center gap-1", children: [_jsx(AlertCircle, { className: "w-4 h-4" }), errorMessage] }))] })] }));
    }
    if (variant === 'full') {
        return (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6 }, className: `max-w-4xl mx-auto ${className}`, children: _jsxs("div", { className: "grid md:grid-cols-2 gap-8 lg:gap-12", children: [_jsxs("div", { children: [_jsxs("h2", { className: "text-3xl md:text-4xl font-bold text-gray-900 mb-4", children: ["Let's Build Something", _jsxs("span", { className: "text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600", children: [' ', "Amazing Together"] })] }), _jsx("p", { className: "text-lg text-gray-600 mb-8", children: "Whether you have a question, feedback, or want to explore partnership opportunities, we're here to help." }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-start gap-4", children: [_jsx("div", { className: "w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0", children: _jsx(Mail, { className: "w-6 h-6 text-primary-600" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-1", children: "Email Us" }), _jsx("p", { className: "text-gray-600", children: "hello@upcoach.ai" }), _jsx("p", { className: "text-sm text-gray-500", children: "We'll respond within 24 hours" })] })] }), _jsxs("div", { className: "flex items-start gap-4", children: [_jsx("div", { className: "w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center flex-shrink-0", children: _jsx(MessageSquare, { className: "w-6 h-6 text-secondary-600" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-1", children: "Live Chat" }), _jsx("p", { className: "text-gray-600", children: "Available Mon-Fri, 9am-6pm EST" }), _jsx("p", { className: "text-sm text-gray-500", children: "Average response time: 2 minutes" })] })] }), _jsxs("div", { className: "flex items-start gap-4", children: [_jsx("div", { className: "w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0", children: _jsx(Building, { className: "w-6 h-6 text-green-600" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-1", children: "Enterprise" }), _jsx("p", { className: "text-gray-600", children: "For teams of 50+" }), _jsx("p", { className: "text-sm text-gray-500", children: "enterprise@upcoach.ai" })] })] })] })] }), _jsx("div", { className: "bg-white rounded-2xl shadow-xl p-8", children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { className: "grid sm:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "full-name", className: "block text-sm font-medium text-gray-700 mb-2", children: "Name *" }), _jsxs("div", { className: "relative", children: [_jsx(User, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" }), _jsx("input", { id: "full-name", type: "text", name: "name", value: formData.name, onChange: handleChange, onBlur: () => handleBlur('name'), className: `w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${getFieldError('name') ? 'border-red-500' : 'border-gray-200'}`, disabled: status === 'loading' || status === 'success' })] }), getFieldError('name') && (_jsx("p", { className: "text-red-500 text-sm mt-1", children: getFieldError('name') }))] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "company", className: "block text-sm font-medium text-gray-700 mb-2", children: "Company" }), _jsxs("div", { className: "relative", children: [_jsx(Building, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" }), _jsx("input", { id: "company", type: "text", name: "company", value: formData.company, onChange: handleChange, className: "w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all", disabled: status === 'loading' || status === 'success' })] })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700 mb-2", children: "Email *" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" }), _jsx("input", { id: "email", type: "email", name: "email", value: formData.email, onChange: handleChange, onBlur: () => handleBlur('email'), className: `w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${getFieldError('email') ? 'border-red-500' : 'border-gray-200'}`, disabled: status === 'loading' || status === 'success' })] }), getFieldError('email') && (_jsx("p", { className: "text-red-500 text-sm mt-1", children: getFieldError('email') }))] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "message", className: "block text-sm font-medium text-gray-700 mb-2", children: "Message *" }), _jsxs("div", { className: "relative", children: [_jsx(MessageSquare, { className: "absolute left-3 top-3 w-5 h-5 text-gray-400" }), _jsx("textarea", { id: "message", name: "message", value: formData.message, onChange: handleChange, onBlur: () => handleBlur('message'), rows: 5, className: `w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none ${getFieldError('message') ? 'border-red-500' : 'border-gray-200'}`, disabled: status === 'loading' || status === 'success' })] }), getFieldError('message') && (_jsx("p", { className: "text-red-500 text-sm mt-1", children: getFieldError('message') }))] }), _jsxs("button", { type: "submit", disabled: status === 'loading' || status === 'success', className: "w-full py-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2", children: [status === 'loading' && _jsx(Loader2, { className: "w-5 h-5 animate-spin" }), status === 'success' && _jsx(CheckCircle, { className: "w-5 h-5" }), status === 'idle' && _jsx(Send, { className: "w-5 h-5" }), status === 'loading' && 'Sending Your Message...', status === 'success' && 'Message Sent Successfully!', status === 'idle' && 'Send Message', status === 'error' && 'Try Again'] }), status === 'success' && (_jsx(motion.p, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: "text-green-600 text-center", children: "Thank you! We'll get back to you within 24 hours." })), status === 'error' && errorMessage && (_jsxs(motion.p, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: "text-red-600 text-center flex items-center justify-center gap-2", children: [_jsx(AlertCircle, { className: "w-4 h-4" }), errorMessage] }))] }) })] }) }));
    }
    // Default variant
    return (_jsxs("form", { onSubmit: handleSubmit, className: `space-y-4 ${className}`, children: [_jsxs("div", { className: "grid sm:grid-cols-2 gap-4", children: [_jsx("input", { type: "text", name: "name", value: formData.name, onChange: handleChange, onBlur: () => handleBlur('name'), placeholder: "Your name", className: `px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${getFieldError('name') ? 'border-red-500' : 'border-gray-200'}`, disabled: status === 'loading' || status === 'success' }), _jsx("input", { type: "email", name: "email", value: formData.email, onChange: handleChange, onBlur: () => handleBlur('email'), placeholder: "Email address", className: `px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${getFieldError('email') ? 'border-red-500' : 'border-gray-200'}`, disabled: status === 'loading' || status === 'success' })] }), _jsx("textarea", { name: "message", value: formData.message, onChange: handleChange, onBlur: () => handleBlur('message'), placeholder: "Your message", rows: 4, className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none ${getFieldError('message') ? 'border-red-500' : 'border-gray-200'}`, disabled: status === 'loading' || status === 'success' }), _jsxs("button", { type: "submit", disabled: status === 'loading' || status === 'success', className: "w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2", children: [status === 'loading' && _jsx(Loader2, { className: "w-5 h-5 animate-spin" }), status === 'success' && _jsx(CheckCircle, { className: "w-5 h-5" }), "Send Message"] }), (status === 'error' || status === 'success') && (_jsx("p", { className: `text-sm text-center ${status === 'error' ? 'text-red-600' : 'text-green-600'}`, children: status === 'error' ? errorMessage : 'Message sent successfully!' }))] }));
}
//# sourceMappingURL=ContactForm.js.map