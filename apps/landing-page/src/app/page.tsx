import { Metadata } from 'next';
import dynamic from 'next/dynamic';

import ClientWrapper from '@/components/ClientWrapper';
import LazySection from '@/components/LazySection';
import LeadCaptureModal from '@/components/LeadCaptureModal';
import Hero, { HeroContent } from '@/components/sections/Hero';
import type { FeatureContent } from '@/components/sections/Features';
import type { PricingTier } from '@/components/sections/Pricing';
import type { TestimonialContent } from '@/components/sections/Testimonials';
import type { CtaContent } from '@/components/sections/CTA';
import {
  getHeroBlock,
  getFeatureBlocks,
  getPricingTiers,
  getTestimonials,
  getCtaBlocks,
  getBlogCards,
  getComparisonTables,
  type BlogCardContent,
  type ComparisonTableContent,
} from '@/lib/cmsBlocks';

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

const BlogHighlights = dynamic(() => import('@/components/sections/BlogHighlights'), {
  loading: () => <div className="h-96 bg-gray-50 animate-pulse" />,
});

const ComparisonTable = dynamic(() => import('@/components/sections/ComparisonTable'), {
  loading: () => <div className="h-96 bg-gray-50 animate-pulse" />,
});

const ProgressTheater = dynamic(
  () => import('@/components/sections/ProgressTheater').then(mod => mod.ProgressTheater),
  {
    loading: () => <div className="h-96 bg-slate-900 animate-pulse" />,
  }
);

export const metadata: Metadata = {
  title: 'UpCoach - AI-Powered Personal Coaching Platform',
  description:
    'Transform your professional development with UpCoach. Get personalized AI coaching, smart task management, mood tracking, and progress reports to achieve your goals faster.',
};

export default async function HomePage() {
  const locale = 'en-US';
  const variant = 'default';

  const [
    heroBlock,
    featureBlocks,
    pricingBlocks,
    testimonialBlocks,
    ctaBlocks,
    blogCards,
    comparisonTables,
  ] = await Promise.all([
    getHeroBlock(locale, variant).catch(() => null),
    getFeatureBlocks(locale, variant).catch(() => []),
    getPricingTiers(locale, variant).catch(() => []),
    getTestimonials(locale, variant).catch(() => []),
    getCtaBlocks(locale, variant).catch(() => []),
    getBlogCards(locale, variant).catch(() => []),
    getComparisonTables(locale, variant).catch(() => []),
  ]);

  const heroContent = heroBlock as HeroContent | null;
  const featureContent = normalizeFeatureBlocks(featureBlocks);
  const pricingContent = normalizePricingBlocks(pricingBlocks);
  const testimonialContent = normalizeTestimonialBlocks(testimonialBlocks);
  const ctaContent = normalizeCtaBlock(ctaBlocks?.[0]);
  const blogContent = blogCards as BlogCardContent[];
  const comparisonContent = (comparisonTables?.[0] as ComparisonTableContent | undefined) ?? null;
  const progressHighlights = [
    {
      id: 'demo-1',
      title: 'Goal streak',
      summary: 'Coaching teams completed 3 major deliverables this week.',
      metricLabel: 'Goals shipped',
      metricValue: '3',
    },
    {
      id: 'demo-2',
      title: 'Habit momentum',
      summary: 'Morning sessions hit 78% adherence across cohorts.',
      metricLabel: 'Habit completion',
      metricValue: '78%',
    },
    {
      id: 'demo-3',
      title: 'Energy check',
      summary: 'Daily mood check-ins jumped 42% after launching nudges.',
      metricLabel: 'Mood entries',
      metricValue: '+42%',
    },
  ];

  return (
    <ClientWrapper>
      <main className="min-h-screen">
        {/* Hero is critical, load immediately */}
        <Hero content={heroContent} />

        {/* Lazy load other sections */}
        <LazySection>
          <Features features={featureContent} />
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
          <Testimonials testimonials={testimonialContent} />
        </LazySection>

        <LazySection>
          <BlogHighlights cards={blogContent} />
        </LazySection>

        <LazySection>
          <ProgressTheater highlights={progressHighlights} />
        </LazySection>

        <LazySection>
          <LeadGeneration />
        </LazySection>

        <LazySection>
          <ComparisonTable comparison={comparisonContent} />
        </LazySection>

        <LazySection>
          <Pricing tiers={pricingContent} />
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
          <CTA content={ctaContent} />
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

function normalizeFeatureBlocks(blocks: Record<string, unknown>[]): FeatureContent[] {
  if (!Array.isArray(blocks)) return [];
  return blocks.map(block => ({
    title: (block.title as string) ?? 'Feature',
    description: (block.description as string) ?? '',
    highlights: (block.highlights as string[]) ?? [],
    icon: (block.icon as string) ?? undefined,
    color: (block.color as string) ?? undefined,
    bgColor: (block.bgColor as string) ?? undefined,
  }));
}

function normalizePricingBlocks(blocks: Record<string, unknown>[]): PricingTier[] {
  if (!Array.isArray(blocks)) return [];
  return blocks.map(block => ({
    name: (block.name as string) ?? 'Plan',
    icon: (block.icon as string) ?? undefined,
    price: (block.price as string) ?? '$0',
    period: (block.period as string) ?? 'per month',
    description: (block.description as string) ?? '',
    features: Array.isArray(block.features) ? (block.features as PricingTier['features']) : [],
    cta: (block.cta as string) ?? 'Get Started',
    ctaAction: (block.ctaAction as string) ?? '#download',
    popular: Boolean(block.popular),
    color: (block.color as 'primary' | 'secondary' | 'gray') ?? 'gray',
    savings: (block.savings as string) ?? undefined,
    billingInterval: (block.billingInterval as PricingTier['billingInterval']) ?? 'both',
    originalPrice: (block.originalPrice as string) ?? undefined,
  }));
}

function normalizeTestimonialBlocks(blocks: Record<string, unknown>[]): TestimonialContent[] {
  if (!Array.isArray(blocks)) return [];
  return blocks.map(block => ({
    name: (block.name as string) ?? 'Customer',
    role: (block.role as string) ?? '',
    company: (block.company as string) ?? undefined,
    avatar: (block.avatar as string) ?? '😊',
    avatarBg: (block.avatarBg as string) ?? 'bg-primary-500',
    content: (block.content as string) ?? '',
    rating: Number(block.rating) || 5,
    feature: (block.feature as string) ?? undefined,
  }));
}

function normalizeCtaBlock(block?: Record<string, unknown>): CtaContent | null {
  if (!block) return null;
  return {
    badge: (block.badge as string) ?? undefined,
    headline: (block.headline as string) ?? undefined,
    highlight: (block.highlight as string) ?? undefined,
    description: (block.description as string) ?? undefined,
    metrics: Array.isArray(block.metrics) ? (block.metrics as { label: string; value: string }[]) : undefined,
  };
}
