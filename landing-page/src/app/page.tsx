import { Metadata } from 'next';
import Hero from '@/components/sections/Hero';
import Features from '@/components/sections/Features';
import Demo from '@/components/sections/Demo';
import Testimonials from '@/components/sections/Testimonials';
import HowItWorks from '@/components/sections/HowItWorks';
import Pricing from '@/components/sections/Pricing';
import FAQ from '@/components/sections/FAQ';
import CTA from '@/components/sections/CTA';
import Footer from '@/components/sections/Footer';

export const metadata: Metadata = {
  title: 'UpCoach - AI-Powered Personal Coaching Platform',
  description: 'Transform your professional development with UpCoach. Get personalized AI coaching, smart task management, mood tracking, and progress reports to achieve your goals faster.',
};

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <Demo />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
} 