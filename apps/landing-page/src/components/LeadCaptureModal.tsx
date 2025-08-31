'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Sparkles } from 'lucide-react';
import LeadCaptureForm from './LeadCaptureForm';
import { trackModalView } from '@/services/analytics';

interface LeadCaptureModalProps {
  trigger?: 'exit-intent' | 'time-based' | 'scroll' | 'manual';
  delay?: number;
  scrollPercentage?: number;
}

export default function LeadCaptureModal({
  trigger = 'time-based',
  delay = 30000, // 30 seconds
  scrollPercentage = 50,
}: LeadCaptureModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasBeenShown, setHasBeenShown] = useState(false);

  useEffect(() => {
    // Check if modal has been shown in this session
    const shown = sessionStorage.getItem('leadModalShown');
    if (shown) {
      setHasBeenShown(true);
      return;
    }

    let timeoutId: NodeJS.Timeout;
    let handleMouseLeave: (e: MouseEvent) => void;
    let handleScroll: () => void;

    switch (trigger) {
      case 'time-based':
        timeoutId = setTimeout(() => {
          if (!hasBeenShown) {
            showModal();
          }
        }, delay);
        break;

      case 'exit-intent':
        handleMouseLeave = (e: MouseEvent) => {
          if (e.clientY <= 0 && !hasBeenShown) {
            showModal();
          }
        };
        document.addEventListener('mouseleave', handleMouseLeave);
        break;

      case 'scroll':
        handleScroll = () => {
          const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
          const scrolled = (window.scrollY / scrollHeight) * 100;

          if (scrolled >= scrollPercentage && !hasBeenShown) {
            showModal();
          }
        };
        window.addEventListener('scroll', handleScroll);
        break;
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (handleMouseLeave) document.removeEventListener('mouseleave', handleMouseLeave);
      if (handleScroll) window.removeEventListener('scroll', handleScroll);
    };
  }, [trigger, delay, scrollPercentage, hasBeenShown]);

  const showModal = () => {
    setIsOpen(true);
    setHasBeenShown(true);
    sessionStorage.setItem('leadModalShown', 'true');
    trackModalView('lead_capture_modal', trigger);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const handleSuccess = () => {
    setTimeout(() => {
      closeModal();
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closeModal}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors duration-200"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            <div className="grid md:grid-cols-2">
              {/* Left Side - Offer */}
              <div className="bg-gradient-to-br from-primary-600 to-secondary-600 p-8 text-white">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Gift className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold">Get Early Access</h2>
                </div>

                <div className="space-y-4 mb-8">
                  <h3 className="text-3xl font-bold leading-tight">
                    Join 10,000+ professionals transforming their lives
                  </h3>
                  <p className="text-lg text-white/90">
                    Be the first to know about new features and get exclusive early-bird pricing.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-yellow-300" />
                    <span>50% off Pro plan for early adopters</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-yellow-300" />
                    <span>Exclusive AI coaching features</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-yellow-300" />
                    <span>Priority access to new releases</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-yellow-300" />
                    <span>Free coaching consultation</span>
                  </div>
                </div>

                {/* Trust Indicators */}
                <div className="mt-8 pt-8 border-t border-white/20">
                  <div className="flex items-center justify-between text-sm text-white/80">
                    <span>🔒 No spam, ever</span>
                    <span>✉️ Unsubscribe anytime</span>
                  </div>
                </div>
              </div>

              {/* Right Side - Form */}
              <div className="p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Reserve Your Spot</h3>
                <LeadCaptureForm
                  source={`modal-${trigger}`}
                  variant="modal"
                  onSuccess={handleSuccess}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
