import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import dynamic from 'next/dynamic';
import ClientWrapper from '@/components/ClientWrapper';
import LazySection from '@/components/LazySection';
import LeadCaptureModal from '@/components/LeadCaptureModal';
import Hero from '@/components/sections/Hero';
// Lazy load non-critical sections
const Features = dynamic(() => import('@/components/sections/Features'), {
    loading: () => _jsx("div", { className: "h-96 bg-gray-50 animate-pulse" }),
});
const SocialProof = dynamic(() => import('@/components/sections/SocialProof'), {
    loading: () => _jsx("div", { className: "h-96 bg-gray-50 animate-pulse" }),
});
const Demo = dynamic(() => import('@/components/sections/Demo'), {
    loading: () => _jsx("div", { className: "h-96 bg-gray-50 animate-pulse" }),
});
const Testimonials = dynamic(() => import('@/components/sections/Testimonials'), {
    loading: () => _jsx("div", { className: "h-96 bg-gray-50 animate-pulse" }),
});
const HowItWorks = dynamic(() => import('@/components/sections/HowItWorks'), {
    loading: () => _jsx("div", { className: "h-96 bg-gray-50 animate-pulse" }),
});
const LeadGeneration = dynamic(() => import('@/components/sections/LeadGeneration'), {
    loading: () => _jsx("div", { className: "h-96 bg-gray-50 animate-pulse" }),
});
const Pricing = dynamic(() => import('@/components/sections/Pricing'), {
    loading: () => _jsx("div", { className: "h-96 bg-gray-50 animate-pulse" }),
});
const TrustIndicators = dynamic(() => import('@/components/sections/TrustIndicators'), {
    loading: () => _jsx("div", { className: "h-64 bg-gray-50 animate-pulse" }),
});
const FAQ = dynamic(() => import('@/components/sections/FAQ'), {
    loading: () => _jsx("div", { className: "h-96 bg-gray-50 animate-pulse" }),
});
const AppDownload = dynamic(() => import('@/components/sections/AppDownload'), {
    loading: () => (_jsx("div", { className: "h-96 bg-gradient-to-r from-primary-600 to-secondary-600 animate-pulse" })),
});
const CTA = dynamic(() => import('@/components/sections/CTA'), {
    loading: () => (_jsx("div", { className: "h-64 bg-gradient-to-r from-primary-600 to-secondary-600 animate-pulse" })),
});
const Footer = dynamic(() => import('@/components/sections/Footer'), {
    loading: () => _jsx("div", { className: "h-64 bg-gray-900 animate-pulse" }),
});
export const metadata = {
    title: 'UpCoach - AI-Powered Personal Coaching Platform',
    description: 'Transform your professional development with UpCoach. Get personalized AI coaching, smart task management, mood tracking, and progress reports to achieve your goals faster.',
};
export default function HomePage() {
    return (_jsxs(ClientWrapper, { children: [_jsxs("main", { className: "min-h-screen", children: [_jsx(Hero, {}), _jsx(LazySection, { children: _jsx(Features, {}) }), _jsx(LazySection, { children: _jsx(SocialProof, {}) }), _jsx(LazySection, { children: _jsx(Demo, {}) }), _jsx(LazySection, { children: _jsx(HowItWorks, {}) }), _jsx(LazySection, { children: _jsx(Testimonials, {}) }), _jsx(LazySection, { children: _jsx(LeadGeneration, {}) }), _jsx(LazySection, { children: _jsx(Pricing, {}) }), _jsx(LazySection, { children: _jsx(TrustIndicators, {}) }), _jsx(LazySection, { children: _jsx(FAQ, {}) }), _jsx(LazySection, { children: _jsx(AppDownload, {}) }), _jsx(LazySection, { children: _jsx(CTA, {}) }), _jsx(LazySection, { children: _jsx(Footer, {}) })] }), _jsx(LeadCaptureModal, { trigger: "time-based", delay: 45000 })] }));
}
//# sourceMappingURL=page.js.map