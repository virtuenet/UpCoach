import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Save, User, Bell, Shield } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../api/auth';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
const profileSchema = z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
    expertise: z.string().optional(),
});
export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('profile');
    const { user, updateProfile } = useAuthStore();
    const { register, handleSubmit, formState: { errors }, } = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            fullName: user?.fullName || '',
            email: user?.email || '',
            bio: user?.bio || '',
            expertise: user?.expertise?.join(', ') || '',
        },
    });
    const updateMutation = useMutation({
        mutationFn: authApi.updateProfile,
        onSuccess: data => {
            updateProfile(data);
            toast('Profile updated successfully');
        },
        onError: () => {
            toast('Failed to update profile');
        },
    });
    const onSubmit = async (data) => {
        const expertise = data.expertise
            ? data.expertise
                .split(',')
                .map(e => e.trim())
                .filter(Boolean)
            : [];
        await updateMutation.mutateAsync({
            ...data,
            expertise,
        });
    };
    const tabs = [
        { id: 'profile', name: 'Profile', icon: User },
        { id: 'notifications', name: 'Notifications', icon: Bell },
        { id: 'security', name: 'Security', icon: Shield },
    ];
    return (_jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsxs("div", { className: "mb-8", children: [_jsx("h1", { className: "text-2xl font-semibold text-gray-900", children: "Settings" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Manage your profile and preferences" })] }), _jsxs("div", { className: "bg-white shadow rounded-lg", children: [_jsx("div", { className: "border-b border-gray-200", children: _jsx("nav", { className: "-mb-px flex space-x-8 px-6", children: tabs.map(tab => {
                                const Icon = tab.icon;
                                return (_jsxs("button", { onClick: () => setActiveTab(tab.id), className: `py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === tab.id
                                        ? 'border-secondary-500 text-secondary-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`, children: [_jsx(Icon, { className: "h-4 w-4" }), tab.name] }, tab.id));
                            }) }) }), _jsxs("div", { className: "p-6", children: [activeTab === 'profile' && (_jsxs("form", { onSubmit: handleSubmit(onSubmit), className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Full Name" }), _jsx("input", { ...register('fullName'), type: "text", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500" }), errors.fullName && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.fullName.message }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Email" }), _jsx("input", { ...register('email'), type: "email", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500", disabled: true }), errors.email && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.email.message }))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Bio" }), _jsx("textarea", { ...register('bio'), rows: 4, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500", placeholder: "Tell us about yourself and your coaching experience" }), errors.bio && _jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.bio.message })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Areas of Expertise" }), _jsx("input", { ...register('expertise'), type: "text", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500", placeholder: "e.g., Leadership, Productivity, Career Development" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Separate multiple areas with commas" })] }), _jsx("div", { className: "flex justify-end", children: _jsx("button", { type: "submit", disabled: updateMutation.isPending, className: "flex items-center px-4 py-2 text-sm font-medium text-white bg-secondary-600 rounded-lg hover:bg-secondary-700 disabled:opacity-50", children: updateMutation.isPending ? (_jsx(LoadingSpinner, { size: "sm" })) : (_jsxs(_Fragment, { children: [_jsx(Save, { className: "h-4 w-4 mr-2" }), "Save Changes"] })) }) })] })), activeTab === 'notifications' && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium text-gray-900", children: "Email Notifications" }), _jsx("p", { className: "text-sm text-gray-500", children: "Receive updates about your content performance" })] }), _jsxs("label", { className: "relative inline-flex items-center cursor-pointer", children: [_jsx("input", { type: "checkbox", className: "sr-only peer", defaultChecked: true }), _jsx("div", { className: "w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary-600" })] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium text-gray-900", children: "Weekly Reports" }), _jsx("p", { className: "text-sm text-gray-500", children: "Get weekly analytics summary" })] }), _jsxs("label", { className: "relative inline-flex items-center cursor-pointer", children: [_jsx("input", { type: "checkbox", className: "sr-only peer", defaultChecked: true }), _jsx("div", { className: "w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary-600" })] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium text-gray-900", children: "Content Feedback" }), _jsx("p", { className: "text-sm text-gray-500", children: "Notify when learners leave feedback" })] }), _jsxs("label", { className: "relative inline-flex items-center cursor-pointer", children: [_jsx("input", { type: "checkbox", className: "sr-only peer" }), _jsx("div", { className: "w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary-600" })] })] })] })), activeTab === 'security' && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "Change Password" }), _jsxs("form", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Current Password" }), _jsx("input", { type: "password", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "New Password" }), _jsx("input", { type: "password", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Confirm New Password" }), _jsx("input", { type: "password", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500" })] }), _jsx("button", { type: "submit", className: "px-4 py-2 text-sm font-medium text-white bg-secondary-600 rounded-lg hover:bg-secondary-700", children: "Update Password" })] })] }), _jsxs("div", { className: "pt-6 border-t border-gray-200", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "Two-Factor Authentication" }), _jsx("p", { className: "text-sm text-gray-600 mb-4", children: "Add an extra layer of security to your account" }), _jsx("button", { className: "px-4 py-2 text-sm font-medium text-secondary-600 border border-secondary-600 rounded-lg hover:bg-secondary-50", children: "Enable 2FA" })] })] }))] })] })] }));
}
//# sourceMappingURL=SettingsPage.js.map