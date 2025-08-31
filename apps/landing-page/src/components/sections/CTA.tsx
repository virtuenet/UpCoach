'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Download, Star } from 'lucide-react';

export default function CTA() {
  return (
    <section
      id="download"
      className="py-24 bg-gradient-to-br from-primary-600 via-secondary-600 to-primary-700 relative overflow-hidden"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 bg-pattern opacity-10"></div>

      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-8">
            <Star className="w-5 h-5 text-yellow-300 fill-current" />
            <span className="text-white font-medium">Rated 4.9/5 by 50,000+ users</span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Start Your Transformation
            <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">
              Today
            </span>
          </h2>

          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
            Join thousands of professionals achieving their goals with AI-powered coaching. Download
            UpCoach now and get 7 days free.
          </p>

          {/* App Store Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="https://apps.apple.com/app/upcoach"
                className="group relative inline-flex items-center justify-center px-8 py-4 bg-black text-white rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl min-w-[220px]"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <div className="relative z-10 flex items-center gap-3">
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  <div className="text-left">
                    <div className="text-xs opacity-90">Download on the</div>
                    <div className="text-lg font-semibold -mt-1">App Store</div>
                  </div>
                </div>
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="https://play.google.com/store/apps/details?id=com.upcoach.app"
                className="group relative inline-flex items-center justify-center px-8 py-4 bg-black text-white rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl min-w-[220px]"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <div className="relative z-10 flex items-center gap-3">
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                  </svg>
                  <div className="text-left">
                    <div className="text-xs opacity-90">Get it on</div>
                    <div className="text-lg font-semibold -mt-1">Google Play</div>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>

          {/* Secondary CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link
              href="#demo"
              className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors group"
            >
              <span className="underline underline-offset-4">Watch 3-minute demo</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 pt-12 border-t border-white/20"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-white/80">
              <div className="text-center">
                <Download className="w-8 h-8 mx-auto mb-2 text-white/60" />
                <div className="text-2xl font-bold text-white">500K+</div>
                <div className="text-sm">Downloads</div>
              </div>
              <div className="text-center">
                <Star className="w-8 h-8 mx-auto mb-2 text-yellow-300" />
                <div className="text-2xl font-bold text-white">4.9/5</div>
                <div className="text-sm">Rating</div>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 mx-auto mb-2 text-3xl">🏆</div>
                <div className="text-2xl font-bold text-white">#1</div>
                <div className="text-sm">Productivity App</div>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 mx-auto mb-2 text-3xl">🌍</div>
                <div className="text-2xl font-bold text-white">120+</div>
                <div className="text-sm">Countries</div>
              </div>
            </div>
          </motion.div>

          <p className="text-white/60 text-sm mt-8">
            Free 7-day trial • No credit card required • Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  );
}
