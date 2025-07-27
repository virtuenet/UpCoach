'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface NewsletterFormProps {
  variant?: 'inline' | 'modal' | 'hero';
  className?: string;
  onSuccess?: (email: string) => void;
}

export default function NewsletterForm({ 
  variant = 'inline', 
  className = '',
  onSuccess 
}: NewsletterFormProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setStatus('loading');
    
    try {
      // Send to your API endpoint
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Welcome aboard! Check your email for confirmation.');
        setEmail('');
        
        // Track conversion
        const { trackNewsletterSignup } = await import('@/services/analytics');
        trackNewsletterSignup(variant);
        
        onSuccess?.(email);
      } else {
        setStatus('error');
        setMessage(data.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error. Please try again later.');
    }

    // Reset status after 5 seconds
    setTimeout(() => {
      setStatus('idle');
      setMessage('');
    }, 5000);
  };

  if (variant === 'hero') {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`${className}`}
      >
        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-8 md:p-12 text-white">
          <div className="max-w-2xl mx-auto text-center">
            <Mail className="w-16 h-16 mx-auto mb-6 opacity-90" />
            <h3 className="text-3xl font-bold mb-4">
              Get Weekly Productivity Tips
            </h3>
            <p className="text-lg mb-8 opacity-90">
              Join 25,000+ professionals receiving actionable insights to boost their performance
            </p>
            
            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-6 py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/70 focus:outline-none focus:border-white/40 transition-colors"
                  disabled={status === 'loading' || status === 'success'}
                  required
                />
                <button
                  type="submit"
                  disabled={status === 'loading' || status === 'success'}
                  className="px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {status === 'loading' && <Loader2 className="w-5 h-5 animate-spin" />}
                  {status === 'success' && <CheckCircle className="w-5 h-5" />}
                  {status === 'idle' && 'Subscribe'}
                  {status === 'loading' && 'Subscribing...'}
                  {status === 'success' && 'Subscribed!'}
                </button>
              </div>
              
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-4 text-sm flex items-center gap-2 ${
                    status === 'error' ? 'text-red-200' : 'text-green-200'
                  }`}
                >
                  {status === 'error' ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {message}
                </motion.div>
              )}
            </form>
            
            <p className="text-sm mt-6 opacity-70">
              No spam, ever. Unsubscribe anytime. We respect your privacy.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (variant === 'modal') {
    return (
      <div className={`bg-white rounded-2xl p-8 max-w-md w-full ${className}`}>
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Stay Updated
          </h3>
          <p className="text-gray-600">
            Get the latest tips and updates delivered to your inbox
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 transition-colors"
            disabled={status === 'loading' || status === 'success'}
            required
          />
          
          <button
            type="submit"
            disabled={status === 'loading' || status === 'success'}
            className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {status === 'loading' && <Loader2 className="w-5 h-5 animate-spin" />}
            {status === 'success' && <CheckCircle className="w-5 h-5" />}
            Subscribe
          </button>
          
          {message && (
            <p className={`text-sm text-center ${
              status === 'error' ? 'text-red-600' : 'text-green-600'
            }`}>
              {message}
            </p>
          )}
        </form>
      </div>
    );
  }

  // Default inline variant
  return (
    <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 transition-colors text-sm"
        disabled={status === 'loading' || status === 'success'}
        required
      />
      <button
        type="submit"
        disabled={status === 'loading' || status === 'success'}
        className="px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
      >
        {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
      </button>
    </form>
  );
}