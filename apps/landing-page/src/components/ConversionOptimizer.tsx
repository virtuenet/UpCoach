'use client';

import { Button } from '@upcoach/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Clock, Users, TrendingUp, Shield } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { trackEvent } from '@/services/analytics';

interface ConversionOptimizerProps {
  variant?: 'popup' | 'banner' | 'slide-in';
}

export default function ConversionOptimizer({ variant = 'popup' }: ConversionOptimizerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [timeOnPage, setTimeOnPage] = useState(0);
  const [exitIntent, setExitIntent] = useState(false);

  // Track time on page
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeOnPage(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Exit intent detection
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !hasInteracted && timeOnPage > 5) {
        setExitIntent(true);
        setIsVisible(true);
        trackEvent('Exit Intent Triggered', {
          timeOnPage,
          variant,
        });
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [hasInteracted, timeOnPage, variant]);

  // Time-based trigger
  useEffect(() => {
    if (timeOnPage === 30 && !hasInteracted && !exitIntent) {
      setIsVisible(true);
      trackEvent('Time-based Popup Triggered', {
        timeOnPage,
        variant,
      });
    }
  }, [timeOnPage, hasInteracted, exitIntent, variant]);

  // Scroll-based trigger
  useEffect(() => {
    const handleScroll = () => {
      const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      
      if (scrollPercentage > 50 && !hasInteracted && !exitIntent && timeOnPage > 10) {
        setIsVisible(true);
        trackEvent('Scroll-based Popup Triggered', {
          scrollPercentage,
          timeOnPage,
          variant,
        });
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasInteracted, exitIntent, timeOnPage, variant]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasInteracted(true);
    
    trackEvent('Conversion Optimizer Submit', {
      email,
      trigger: exitIntent ? 'exit-intent' : 'time-based',
      timeOnPage,
      variant,
    });

    // Redirect to onboarding
    window.location.href = `/onboarding?email=${encodeURIComponent(email)}&source=optimizer`;
  };

  const handleClose = () => {
    setIsVisible(false);
    setHasInteracted(true);
    
    trackEvent('Conversion Optimizer Closed', {
      trigger: exitIntent ? 'exit-intent' : 'time-based',
      timeOnPage,
      variant,
    });
  };

  if (!isVisible) return null;

  const renderContent = () => {
    const content = (
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-lg w-full mx-4">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          
          <div className="flex items-center gap-3 mb-3">
            <Gift className="h-8 w-8" />
            <h2 className="text-2xl font-bold">Wait! Special Offer</h2>
          </div>
          
          <p className="text-white/90">
            Get 30% off your first month plus exclusive bonuses when you start today!
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Countdown timer */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium text-red-900">Limited time offer</span>
              </div>
              <CountdownTimer />
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Join 50,000+ successful users</p>
                <p className="text-sm text-gray-600">Average 3x improvement in 90 days</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">AI-powered personalization</p>
                <p className="text-sm text-gray-600">Tailored coaching for your unique goals</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">30-day money-back guarantee</p>
                <p className="text-sm text-gray-600">No questions asked refund policy</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Enter your email to claim offer"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            
            <Button type="submit" className="w-full py-3 text-lg font-medium">
              Claim Your 30% Discount
            </Button>
            
            <p className="text-xs text-center text-gray-500">
              No credit card required • Cancel anytime
            </p>
          </form>

          {/* Social proof */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-center gap-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 border-2 border-white"
                  />
                ))}
              </div>
              <p className="text-sm text-gray-600">
                <span className="font-medium">2,847 people</span> claimed this offer today
              </p>
            </div>
          </div>
        </div>
      </div>
    );

    switch (variant) {
      case 'banner':
        return (
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary to-secondary p-4"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4 text-white">
                <Gift className="h-6 w-6" />
                <p className="font-medium">
                  Limited offer: Get 30% off your first month!
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="secondary" size="sm" onClick={() => setIsVisible(true)}>
                  Claim Offer
                </Button>
                <button onClick={handleClose} className="text-white/80 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.div>
        );

      case 'slide-in':
        return (
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            className="fixed bottom-4 right-4 z-50 max-w-sm"
          >
            {content}
          </motion.div>
        );

      default: // popup
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {content}
            </motion.div>
          </motion.div>
        );
    }
  };

  return <AnimatePresence>{renderContent()}</AnimatePresence>;
}

// Countdown timer component
function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex items-center gap-1 text-red-600 font-mono font-bold">
      <span className="bg-red-100 px-2 py-1 rounded">{String(minutes).padStart(2, '0')}</span>
      <span>:</span>
      <span className="bg-red-100 px-2 py-1 rounded">{String(seconds).padStart(2, '0')}</span>
    </div>
  );
}