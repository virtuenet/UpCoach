'use client';

import { Badge, Button } from '@upcoach/ui';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Star, Users, TrendingUp, Clock } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { trackEvent } from '@/services/analytics';

interface HeroSectionProps {
  variant?: 'default' | 'coach' | 'enterprise';
}

export default function HeroSection({ variant = 'default' }: HeroSectionProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userCount, setUserCount] = useState(50000);
  const { scrollY } = useScroll();
  
  // Parallax effect for background
  const y1 = useTransform(scrollY, [0, 300], [0, -50]);
  const y2 = useTransform(scrollY, [0, 300], [0, -100]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0.5]);

  // Simulate real-time user count
  useEffect(() => {
    const interval = setInterval(() => {
      setUserCount(prev => prev + Math.floor(Math.random() * 3));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    trackEvent('Hero CTA Clicked', {
      variant,
      email,
      source: 'hero-section',
    });

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Redirect to onboarding with email
    window.location.href = `/onboarding?email=${encodeURIComponent(email)}`;
  };

  const getContent = () => {
    switch (variant) {
      case 'coach':
        return {
          badge: 'For Professional Coaches',
          title: 'Scale Your Coaching Practice',
          subtitle: 'With AI-Powered Technology',
          description: 'Empower more clients, increase revenue, and deliver exceptional outcomes with UpCoach\'s intelligent platform.',
          cta: 'Start Your Practice',
        };
      case 'enterprise':
        return {
          badge: 'Enterprise Solution',
          title: 'Transform Your Organization',
          subtitle: 'With AI Coaching at Scale',
          description: 'Deploy personalized coaching to your entire workforce and see measurable improvements in performance and wellbeing.',
          cta: 'Request Demo',
        };
      default:
        return {
          badge: 'AI-Powered Personal Growth',
          title: 'Achieve Your Full Potential',
          subtitle: 'With Your Personal AI Coach',
          description: 'Get personalized guidance, track your progress, and transform your life with 24/7 AI coaching support.',
          cta: 'Start Free Trial',
        };
    }
  };

  const content = getContent();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <motion.div
          style={{ y: y1, opacity }}
          className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent"
        />
        <motion.div
          style={{ y: y2 }}
          className="absolute inset-0 bg-gradient-to-bl from-secondary/5 to-transparent"
        />
        
        {/* Floating orbs animation */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-300 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* Animated badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="mb-6 px-4 py-2 text-sm font-medium backdrop-blur-sm">
              {content.badge}
            </Badge>
          </motion.div>

          {/* Main headline with gradient text */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight"
          >
            <span className="block text-gray-900">{content.title}</span>
            <span className="block mt-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {content.subtitle}
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-gray-600"
          >
            {content.description}
          </motion.p>

          {/* Email capture form */}
          <motion.form
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            onSubmit={handleSubmit}
            className="mt-10 max-w-md mx-auto"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-5 py-4 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                required
                disabled={isSubmitting}
              />
              <Button
                type="submit"
                size="lg"
                className="px-8 py-4 text-base font-medium rounded-xl shadow-lg hover:shadow-xl transition-all"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <>
                    {content.cta}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          </motion.form>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm"
          >
            <div className="flex items-center gap-2 text-gray-600">
              <div className="flex -space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="font-medium">4.9/5 rating</span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="h-4 w-4" />
              <span className="font-medium">{userCount.toLocaleString()}+ active users</span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-600">
              <TrendingUp className="h-4 w-4" />
              <span className="font-medium">89% success rate</span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span className="font-medium">14-day free trial</span>
            </div>
          </motion.div>

          {/* Social proof logos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-16"
          >
            <p className="text-sm text-gray-500 mb-6">Trusted by teams at</p>
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-60 grayscale">
              {['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple'].map((company) => (
                <div key={company} className="text-2xl font-bold text-gray-400">
                  {company}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-gray-500">Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 border-2 border-gray-300 rounded-full flex justify-center"
          >
            <div className="w-1 h-2 bg-gray-400 rounded-full mt-2" />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}