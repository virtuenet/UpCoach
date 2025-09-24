'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Button } from '@upcoach/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Copy, Check, Share2, Users, DollarSign, TrendingUp, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { trackEvent } from '@/services/analytics';
import api from '@/services/api';
export default function ReferralWidget({ isAuthenticated = false, userId }) {
    const [isOpen, setIsOpen] = useState(false);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [shareEmails, setShareEmails] = useState('');
    const [sharing, setSharing] = useState(false);
    useEffect(() => {
        if (isAuthenticated && userId) {
            fetchReferralStats();
        }
    }, [isAuthenticated, userId]);
    const fetchReferralStats = async () => {
        setLoading(true);
        try {
            const response = await api.get('/referrals/stats');
            setStats(response.data.data);
        }
        catch (error) {
            console.error('Failed to fetch referral stats:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const generateReferralCode = async () => {
        try {
            const response = await api.post('/referrals/code');
            const newCode = response.data.data.code;
            setStats(prev => (prev ? { ...prev, referralCode: newCode } : null));
            trackEvent('Referral Code Generated', { source: 'widget' });
        }
        catch (error) {
            console.error('Failed to generate referral code:', error);
        }
    };
    const copyReferralLink = () => {
        if (stats?.referralCode) {
            const link = `${window.location.origin}/signup?ref=${stats.referralCode}`;
            navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            trackEvent('Referral Link Copied', { code: stats.referralCode });
        }
    };
    const shareViaEmail = async () => {
        if (!shareEmails || !stats?.referralCode)
            return;
        setSharing(true);
        try {
            const emails = shareEmails.split(',').map(e => e.trim());
            await api.post('/referrals/share', { emails });
            setShareEmails('');
            trackEvent('Referral Shared', { method: 'email', count: emails.length });
        }
        catch (error) {
            console.error('Failed to share referral:', error);
        }
        finally {
            setSharing(false);
        }
    };
    const shareOnSocial = (platform) => {
        if (!stats?.referralCode)
            return;
        const link = `${window.location.origin}/signup?ref=${stats.referralCode}`;
        const text = 'Join me on UpCoach and get 20% off your first month! 🎉';
        let shareUrl = '';
        switch (platform) {
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`;
                break;
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
                break;
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`;
                break;
        }
        if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400');
            trackEvent('Referral Shared', { method: platform });
        }
    };
    if (!isAuthenticated) {
        return (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "fixed bottom-8 right-8 z-50", children: _jsx(Card, { className: "p-4 shadow-lg", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Gift, { className: "h-6 w-6 text-primary" }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold", children: "Earn rewards!" }), _jsx("p", { className: "text-sm text-gray-600", children: "Sign up to start referring friends" })] })] }) }) }));
    }
    return (_jsxs(_Fragment, { children: [_jsxs(motion.button, { initial: { scale: 0 }, animate: { scale: 1 }, whileHover: { scale: 1.1 }, whileTap: { scale: 0.9 }, onClick: () => setIsOpen(true), className: "fixed bottom-8 right-8 z-40 bg-primary text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-shadow", children: [_jsx(Gift, { className: "h-6 w-6" }), stats && stats.totalEarnings > 0 && (_jsxs(Badge, { className: "absolute -top-2 -right-2 bg-green-500", children: ["$", stats.totalEarnings] }))] }), _jsx(AnimatePresence, { children: isOpen && (_jsxs(_Fragment, { children: [_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, onClick: () => setIsOpen(false), className: "fixed inset-0 bg-black/50 z-40" }), _jsx(motion.div, { initial: { opacity: 0, scale: 0.9, y: 20 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.9, y: 20 }, className: "fixed bottom-20 right-8 z-50 w-96 max-w-[calc(100vw-2rem)]", children: _jsxs(Card, { className: "p-6 shadow-2xl", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-xl font-bold", children: "Referral Program" }), _jsx("button", { onClick: () => setIsOpen(false), className: "text-gray-400 hover:text-gray-600", children: _jsx(X, { className: "h-5 w-5" }) })] }), loading ? (_jsx("div", { className: "text-center py-8", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" }) })) : stats ? (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { className: "text-center p-3 bg-gray-50 rounded-lg", children: [_jsx(Users, { className: "h-5 w-5 text-primary mx-auto mb-1" }), _jsx("div", { className: "text-2xl font-bold", children: stats.totalReferrals }), _jsx("div", { className: "text-xs text-gray-600", children: "Total Referrals" })] }), _jsxs("div", { className: "text-center p-3 bg-gray-50 rounded-lg", children: [_jsx(DollarSign, { className: "h-5 w-5 text-green-600 mx-auto mb-1" }), _jsxs("div", { className: "text-2xl font-bold", children: ["$", stats.totalEarnings] }), _jsx("div", { className: "text-xs text-gray-600", children: "Total Earned" })] })] }), stats.pendingEarnings > 0 && (_jsxs("div", { className: "flex items-center justify-between p-3 bg-yellow-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(TrendingUp, { className: "h-5 w-5 text-yellow-600" }), _jsx("span", { className: "text-sm", children: "Pending Earnings" })] }), _jsxs("span", { className: "font-semibold", children: ["$", stats.pendingEarnings] })] })), stats.referralCode ? (_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-700", children: "Your Referral Code" }), _jsxs("div", { className: "flex gap-2 mt-1", children: [_jsx(Input, { value: stats.referralCode, readOnly: true, className: "font-mono" }), _jsx(Button, { variant: "outline", size: "sm", onClick: copyReferralLink, children: copied ? (_jsx(Check, { className: "h-4 w-4 text-green-600" })) : (_jsx(Copy, { className: "h-4 w-4" })) })] }), _jsx("p", { className: "text-xs text-gray-600 mt-1", children: "Friends get 20% off, you earn 20% commission!" })] })) : (_jsx(Button, { onClick: generateReferralCode, className: "w-full", children: "Generate Referral Code" })), stats.referralCode && (_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-700", children: "Share Your Code" }), _jsxs("div", { className: "flex gap-2 mt-2", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => shareOnSocial('twitter'), children: "Twitter" }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => shareOnSocial('facebook'), children: "Facebook" }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => shareOnSocial('linkedin'), children: "LinkedIn" })] }), _jsxs("div", { className: "mt-3", children: [_jsx(Input, { placeholder: "Email addresses (comma separated)", value: shareEmails, onChange: e => setShareEmails(e.target.value), onKeyPress: e => e.key === 'Enter' && shareViaEmail() }), _jsxs(Button, { onClick: shareViaEmail, disabled: !shareEmails || sharing, className: "w-full mt-2", variant: "outline", children: [_jsx(Share2, { className: "h-4 w-4 mr-2" }), sharing ? 'Sending...' : 'Share via Email'] })] })] })), _jsxs("p", { className: "text-xs text-gray-500 text-center", children: ["By participating, you agree to our", ' ', _jsx("a", { href: "/terms#referral", className: "underline", children: "referral terms" })] })] })) : (_jsxs("div", { className: "text-center py-8", children: [_jsx("p", { className: "text-gray-600", children: "Unable to load referral data" }), _jsx(Button, { onClick: fetchReferralStats, className: "mt-4", children: "Retry" })] }))] }) })] })) })] }));
}
//# sourceMappingURL=ReferralWidget.js.map