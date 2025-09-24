'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from 'next/link';
import { Twitter, Linkedin, Youtube, Mail } from 'lucide-react';
import NewsletterForm from '@/components/forms/NewsletterForm';
const footerLinks = {
    Product: [
        { name: 'Features', href: '#features' },
        { name: 'How it Works', href: '#how-it-works' },
        { name: 'Pricing', href: '#pricing' },
        { name: 'Demo', href: '#demo' },
    ],
    Company: [
        { name: 'About Us', href: '/about' },
        { name: 'Careers', href: '/careers' },
        { name: 'Blog', href: '/blog' },
        { name: 'Press', href: '/press' },
    ],
    Support: [
        { name: 'Help Center', href: '/help' },
        { name: 'Contact Us', href: '/contact' },
        { name: 'API Documentation', href: '/api-docs' },
        { name: 'Status', href: '/status' },
    ],
    Legal: [
        { name: 'Privacy Policy', href: '/privacy' },
        { name: 'Terms of Service', href: '/terms' },
        { name: 'Cookie Policy', href: '/cookies' },
        { name: 'Security', href: '/security' },
    ],
};
const socialLinks = [
    { name: 'Twitter', icon: Twitter, href: 'https://twitter.com/upcoach' },
    {
        name: 'LinkedIn',
        icon: Linkedin,
        href: 'https://linkedin.com/company/upcoach',
    },
    { name: 'YouTube', icon: Youtube, href: 'https://youtube.com/@upcoach' },
    { name: 'Email', icon: Mail, href: 'mailto:hello@upcoach.ai' },
];
export default function Footer() {
    return (_jsx("footer", { className: "bg-gray-900 text-gray-300", children: _jsxs("div", { className: "container mx-auto px-4 py-12", children: [_jsx("div", { className: "border-b border-gray-800 pb-12 mb-12", children: _jsxs("div", { className: "max-w-4xl mx-auto text-center", children: [_jsx("h3", { className: "text-2xl font-bold text-white mb-4", children: "Stay Ahead of the Curve" }), _jsx("p", { className: "text-gray-400 mb-6", children: "Get weekly insights on productivity, AI coaching tips, and exclusive updates." }), _jsx("div", { className: "max-w-md mx-auto", children: _jsx(NewsletterForm, { variant: "inline" }) })] }) }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-6 gap-8", children: [_jsxs("div", { className: "col-span-2", children: [_jsxs("div", { className: "mb-4", children: [_jsx("h3", { className: "text-2xl font-bold text-white", children: "UpCoach" }), _jsx("p", { className: "text-purple-400 text-sm", children: "AI-Powered Coaching" })] }), _jsx("p", { className: "text-gray-400 mb-6 max-w-sm", children: "Transform your professional development with personalized AI coaching that helps you achieve your goals faster." }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-3 mb-6", children: [_jsx(Link, { href: "https://apps.apple.com/app/upcoach", target: "_blank", rel: "noopener noreferrer", className: "inline-block", children: _jsx("img", { src: "/app-store-badge.svg", alt: "Download on the App Store", className: "h-10" }) }), _jsx(Link, { href: "https://play.google.com/store/apps/details?id=com.upcoach.app", target: "_blank", rel: "noopener noreferrer", className: "inline-block", children: _jsx("img", { src: "/google-play-badge.svg", alt: "Get it on Google Play", className: "h-10" }) })] }), _jsx("div", { className: "flex space-x-4", children: socialLinks.map(social => {
                                        const Icon = social.icon;
                                        return (_jsx("a", { href: social.href, target: "_blank", rel: "noopener noreferrer", className: "text-gray-400 hover:text-white transition-colors", "aria-label": social.name, children: _jsx(Icon, { className: "w-5 h-5" }) }, social.name));
                                    }) })] }), Object.entries(footerLinks).map(([category, links]) => (_jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-white mb-4", children: category }), _jsx("ul", { className: "space-y-2", children: links.map(link => (_jsx("li", { children: _jsx(Link, { href: link.href, className: "text-gray-400 hover:text-white transition-colors text-sm", children: link.name }) }, link.name))) })] }, category)))] }), _jsx("div", { className: "border-t border-gray-800 mt-12 pt-8", children: _jsxs("div", { className: "flex flex-col md:flex-row justify-between items-center", children: [_jsx("p", { className: "text-gray-400 text-sm mb-4 md:mb-0", children: "\u00A9 2024 UpCoach. All rights reserved." }), _jsxs("div", { className: "flex space-x-6 text-sm", children: [_jsx(Link, { href: "/privacy", className: "text-gray-400 hover:text-white transition-colors", children: "Privacy" }), _jsx(Link, { href: "/terms", className: "text-gray-400 hover:text-white transition-colors", children: "Terms" }), _jsx(Link, { href: "/cookies", className: "text-gray-400 hover:text-white transition-colors", children: "Cookies" })] })] }) })] }) }));
}
//# sourceMappingURL=Footer.js.map