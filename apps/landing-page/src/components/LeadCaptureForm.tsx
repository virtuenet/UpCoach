'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, Mail, User, Briefcase } from 'lucide-react';
import { useState } from 'react';

import { trackFormSubmit } from '@/services/analytics';

interface LeadCaptureFormProps {
  source?: string;
  variant?: 'inline' | 'modal' | 'sidebar';
  onSuccess?: () => void;
}

export default function LeadCaptureForm({
  source = 'unknown',
  variant: _variant = 'inline',
  onSuccess,
}: LeadCaptureFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    role: '',
    interest: '',
    marketingConsent: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/lead-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          source,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Failed to submit form');

      // Track conversion
      trackFormSubmit('lead_capture', source);

      // Show success state
      setIsSuccess(true);

      // Trigger callback if provided
      if (onSuccess) onSuccess();

      // Reset form after delay
      setTimeout(() => {
        setFormData({
          name: '',
          email: '',
          company: '',
          role: '',
          interest: '',
          marketingConsent: true,
        });
        setIsSuccess(false);
      }, 3000);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error('Lead capture error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center p-8 bg-green-50 rounded-2xl"
      >
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Thank You!</h3>
        <p className="text-gray-600">
          We'll be in touch soon with exclusive updates and early access opportunities.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name Field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Full Name *
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
            placeholder="John Doe"
          />
        </div>
      </div>

      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Work Email *
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
            placeholder="john@company.com"
          />
        </div>
      </div>

      {/* Company Field */}
      <div>
        <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
          Company
        </label>
        <div className="relative">
          <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            id="company"
            name="company"
            value={formData.company}
            onChange={handleChange}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
            placeholder="Acme Inc."
          />
        </div>
      </div>

      {/* Role Field */}
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
          Your Role
        </label>
        <select
          id="role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200 bg-white"
        >
          <option value="">Select your role</option>
          <option value="executive">Executive/C-Suite</option>
          <option value="manager">Manager/Team Lead</option>
          <option value="professional">Individual Contributor</option>
          <option value="entrepreneur">Entrepreneur/Founder</option>
          <option value="student">Student</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Interest Field */}
      <div>
        <label htmlFor="interest" className="block text-sm font-medium text-gray-700 mb-1">
          Primary Interest
        </label>
        <select
          id="interest"
          name="interest"
          value={formData.interest}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200 bg-white"
        >
          <option value="">What brings you to UpCoach?</option>
          <option value="productivity">Productivity & Time Management</option>
          <option value="habits">Building Better Habits</option>
          <option value="wellness">Mental Health & Wellness</option>
          <option value="career">Career Development</option>
          <option value="leadership">Leadership Skills</option>
          <option value="personal">Personal Growth</option>
        </select>
      </div>

      {/* Marketing Consent */}
      <div className="flex items-start">
        <input
          type="checkbox"
          id="marketingConsent"
          name="marketingConsent"
          checked={formData.marketingConsent}
          onChange={handleChange}
          className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
        />
        <label htmlFor="marketingConsent" className="ml-2 text-sm text-gray-600">
          I agree to receive marketing communications from UpCoach. You can unsubscribe at any time.
        </label>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-red-600 text-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Submitting...
          </>
        ) : (
          'Get Early Access'
        )}
      </button>

      {/* Privacy Notice */}
      <p className="text-xs text-gray-500 text-center">
        By submitting this form, you agree to our{' '}
        <a href="/privacy" className="text-primary-600 hover:underline">
          Privacy Policy
        </a>{' '}
        and{' '}
        <a href="/terms" className="text-primary-600 hover:underline">
          Terms of Service
        </a>
        .
      </p>
    </form>
  );
}
