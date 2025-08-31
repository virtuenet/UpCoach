import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import Hero from '@/components/sections/Hero';
import LazySection from '@/components/LazySection';
import ClientWrapper from '@/components/ClientWrapper';
import LeadCaptureModal from '@/components/LeadCaptureModal';

// Lazy load non-critical sections
const Features = dynamic(() => import('@/components/sections/Features'), {
  loading: () => <div className="h-96 bg-gray-50 animate-pulse" />,
});

const SocialProof = dynamic(() => import('@/components/sections/SocialProof'), {
  loading: () => <div className="h-96 bg-gray-50 animate-pulse" />,
});

const Demo = dynamic(() => import('@/components/sections/Demo'), {
  loading: () => <div className="h-96 bg-gray-50 animate-pulse" />,
});

const Testimonials = dynamic(() => import('@/components/sections/Testimonials'), {
  loading: () => <div className="h-96 bg-gray-50 animate-pulse" />,
});

const HowItWorks = dynamic(() => import('@/components/sections/HowItWorks'), {
  loading: () => <div className="h-96 bg-gray-50 animate-pulse" />,
});

const LeadGeneration = dynamic(() => import('@/components/sections/LeadGeneration'), {
  loading: () => <div className="h-96 bg-gray-50 animate-pulse" />,
});

const Pricing = dynamic(() => import('@/components/sections/Pricing'), {
  loading: () => <div className="h-96 bg-gray-50 animate-pulse" />,
});

const TrustIndicators = dynamic(() => import('@/components/sections/TrustIndicators'), {
  loading: () => <div className="h-64 bg-gray-50 animate-pulse" />,
});

const FAQ = dynamic(() => import('@/components/sections/FAQ'), {
  loading: () => <div className="h-96 bg-gray-50 animate-pulse" />,
});

const AppDownload = dynamic(() => import('@/components/sections/AppDownload'), {
  loading: () => (
    <div className="h-96 bg-gradient-to-r from-primary-600 to-secondary-600 animate-pulse" />
  ),
});

const CTA = dynamic(() => import('@/components/sections/CTA'), {
  loading: () => (
    <div className="h-64 bg-gradient-to-r from-primary-600 to-secondary-600 animate-pulse" />
  ),
});

const Footer = dynamic(() => import('@/components/sections/Footer'), {
  loading: () => <div className="h-64 bg-gray-900 animate-pulse" />,
});

export const metadata: Metadata = {
  title: 'UpCoach - AI-Powered Personal Coaching Platform',
  description:
    'Transform your professional development with UpCoach. Get personalized AI coaching, smart task management, mood tracking, and progress reports to achieve your goals faster.',
};

export default function HomePage() {
  return (
    <ClientWrapper>
      <main className="min-h-screen">
        {/* Hero is critical, load immediately */}
        <Hero />

        {/* Lazy load other sections */}
        <LazySection>
          <Features />
        </LazySection>

        <LazySection>
          <SocialProof />
        </LazySection>

        <LazySection>
          <Demo />
        </LazySection>

        <LazySection>
          <HowItWorks />
        </LazySection>

        <LazySection>
          <Testimonials />
        </LazySection>

        <LazySection>
          <LeadGeneration />
        </LazySection>

        <LazySection>
          <Pricing />
        </LazySection>

        <LazySection>
          <TrustIndicators />
        </LazySection>

        <LazySection>
          <FAQ />
        </LazySection>

        <LazySection>
          <AppDownload />
        </LazySection>

        <LazySection>
          <CTA />
        </LazySection>

        <LazySection>
          <Footer />
        </LazySection>
      </main>

      {/* Lead Capture Modal - triggers based on user behavior */}
      <LeadCaptureModal trigger="time-based" delay={45000} />
    </ClientWrapper>
  );
}
