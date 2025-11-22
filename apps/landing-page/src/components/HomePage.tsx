'use client';

import Navigation from './Navigation';
import AppDownload from './sections/AppDownload';
import FAQ from './sections/FAQ';
import Features from './sections/Features';
import Footer from './sections/Footer';
import Hero from './sections/Hero';
import LeadGeneration from './sections/LeadGeneration';
import Pricing from './sections/Pricing';
import Testimonials from './sections/Testimonials';
import TrustIndicators from './sections/TrustIndicators';

export default function HomePage() {
  return (
    <>
      <Navigation />
      <main>
        <Hero />
        <Features />
        <TrustIndicators />
        <Pricing />
        <Testimonials />
        <AppDownload />
        <LeadGeneration />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
