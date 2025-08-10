"use client";

import Hero from "./sections/Hero";
import Features from "./sections/Features";
import Pricing from "./sections/Pricing";
import Testimonials from "./sections/Testimonials";
import FAQ from "./sections/FAQ";
import Footer from "./sections/Footer";
import Navigation from "./Navigation";
import TrustIndicators from "./sections/TrustIndicators";
import AppDownload from "./sections/AppDownload";
import LeadGeneration from "./sections/LeadGeneration";

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