import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../stores/authStore';
import LoadingSpinner from '../components/LoadingSpinner';
import { BookOpen } from 'lucide-react';
const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});
export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuthStore();
    const { register, handleSubmit, formState: { errors }, } = useForm({
        resolver: zodResolver(loginSchema),
    });
    const onSubmit = async (data) => {
        try {
            setIsLoading(true);
            await login(data.email, data.password);
        }
        catch (error) {
            // Error is handled in the store
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary-50 to-primary-50 py-12 px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "max-w-md w-full space-y-8", children: [_jsxs("div", { children: [_jsx("div", { className: "flex justify-center", children: _jsx("div", { className: "h-16 w-16 bg-secondary-600 rounded-full flex items-center justify-center", children: _jsx(BookOpen, { className: "h-8 w-8 text-white" }) }) }), _jsx("h2", { className: "mt-6 text-center text-3xl font-extrabold text-gray-900", children: "UpCoach Content Management" }), _jsx("p", { className: "mt-2 text-center text-sm text-gray-600", children: "Sign in to create and manage coaching content" })] }), _jsxs("form", { className: "mt-8 space-y-6", onSubmit: handleSubmit(onSubmit), children: [_jsxs("div", { className: "rounded-md shadow-sm -space-y-px", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "sr-only", children: "Email address" }), _jsx("input", { ...register('email'), type: "email", autoComplete: "email", required: true, className: "appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-secondary-500 focus:border-secondary-500 focus:z-10 sm:text-sm", placeholder: "Email address" }), errors.email && _jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.email.message })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "password", className: "sr-only", children: "Password" }), _jsx("input", { ...register('password'), type: "password", autoComplete: "current-password", required: true, className: "appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-secondary-500 focus:border-secondary-500 focus:z-10 sm:text-sm", placeholder: "Password" }), errors.password && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.password.message }))] })] }), _jsx("div", { children: _jsx("button", { type: "submit", disabled: isLoading, className: "group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-secondary-600 hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 disabled:opacity-50 disabled:cursor-not-allowed", children: isLoading ? _jsx(LoadingSpinner, { size: "sm" }) : 'Sign in' }) })] })] }) }));
}
//# sourceMappingURL=LoginPage.js.map