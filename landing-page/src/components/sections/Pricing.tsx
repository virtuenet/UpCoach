'use client';

import { motion } from 'framer-motion';
import { Check, X, Sparkles, Zap, Crown } from 'lucide-react';
import { useState } from 'react';

const plans = [
  {
    name: 'Starter',
    icon: Sparkles,
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started',
    features: [
      { text: '5 voice journal entries/day', included: true },
      { text: 'Basic habit tracking (3 habits)', included: true },
      { text: 'Progress photos (10 photos)', included: true },
      { text: 'AI insights (basic)', included: true },
      { text: 'Offline mode', included: true },
      { text: 'Unlimited voice journals', included: false },
      { text: 'Advanced analytics', included: false },
      { text: 'Priority support', included: false }
    ],
    cta: 'Start Free',
    ctaAction: 'https://apps.apple.com/app/upcoach',
    popular: false,
    color: 'gray'
  },
  {
    name: 'Pro',
    icon: Zap,
    price: '$14.99',
    originalPrice: '$19.99',
    period: 'per month',
    description: 'For serious personal growth',
    features: [
      { text: 'Unlimited voice journal entries', included: true },
      { text: 'Unlimited habit tracking', included: true },
      { text: 'Unlimited progress photos', included: true },
      { text: 'Advanced AI insights & coaching', included: true },
      { text: 'Detailed analytics & reports', included: true },
      { text: 'Custom reminders & notifications', included: true },
      { text: 'Export data (CSV/PDF)', included: true },
      { text: 'Priority support', included: true }
    ],
    cta: 'Start 7-Day Free Trial',
    ctaAction: 'https://apps.apple.com/app/upcoach',
    popular: true,
    color: 'primary',
    savings: 'Save 25%'
  },
  {
    name: 'Pro Annual',
    icon: Crown,
    price: '$119.99',
    originalPrice: '$179.88',
    period: 'per year',
    description: 'Best value for committed users',
    features: [
      { text: 'Everything in Pro', included: true },
      { text: '2 months free (save $30)', included: true },
      { text: 'Early access to new features', included: true },
      { text: 'Exclusive webinars & content', included: true },
      { text: 'Personal onboarding session', included: true },
      { text: 'Custom AI coach personality', included: true },
      { text: 'API access (coming soon)', included: true },
      { text: 'Dedicated success manager', included: true }
    ],
    cta: 'Save 33% Annually',
    ctaAction: 'https://apps.apple.com/app/upcoach',
    popular: false,
    color: 'secondary',
    savings: 'Best Value'
  }
];

export default function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">Pricing</span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 mt-2">
            Choose Your
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600"> Growth Plan</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Start free and upgrade when you're ready. No hidden fees, cancel anytime.
          </p>
          
          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                billingPeriod === 'monthly' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                billingPeriod === 'annual' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Annual
              <span className="ml-1 text-xs text-green-600 font-semibold">Save 33%</span>
            </button>
          </div>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const isVisible = billingPeriod === 'monthly' ? plan.name !== 'Pro Annual' : plan.name !== 'Pro';
            
            if (!isVisible) return null;
            
            return (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative bg-white rounded-3xl ${
                  plan.popular 
                    ? 'shadow-2xl border-2 border-primary-200' 
                    : 'shadow-xl border border-gray-100'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-5 left-0 right-0 flex justify-center">
                    <span className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                      MOST POPULAR
                    </span>
                  </div>
                )}
                
                {plan.savings && (
                  <div className="absolute -top-3 -right-3">
                    <span className="bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg transform rotate-12">
                      {plan.savings}
                    </span>
                  </div>
                )}
                
                <div className="p-8">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 ${
                      plan.color === 'primary' ? 'bg-primary-100' :
                      plan.color === 'secondary' ? 'bg-secondary-100' : 'bg-gray-100'
                    }`}>
                      <Icon className={`w-7 h-7 ${
                        plan.color === 'primary' ? 'text-primary-600' :
                        plan.color === 'secondary' ? 'text-secondary-600' : 'text-gray-600'
                      }`} />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-6">{plan.description}</p>
                    
                    <div className="mb-6">
                      {plan.originalPrice && (
                        <span className="text-gray-400 line-through text-lg mr-2">{plan.originalPrice}</span>
                      )}
                      <div>
                        <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                        <span className="text-gray-600 ml-2">/{plan.period}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Features */}
                  <ul className="mb-8 space-y-4">
                    {plan.features.map((feature, featureIndex) => (
                      <motion.li 
                        key={featureIndex} 
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: featureIndex * 0.05 }}
                        className="flex items-start"
                      >
                        {feature.included ? (
                          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-green-600" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                            <X className="w-3 h-3 text-gray-400" />
                          </div>
                        )}
                        <span className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                          {feature.text}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                  
                  {/* CTA Button */}
                  <a
                    href={plan.ctaAction}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block w-full py-4 px-6 rounded-xl font-semibold text-center transition-all duration-300 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white hover:shadow-lg hover:scale-105'
                        : plan.color === 'secondary'
                        ? 'bg-secondary-600 text-white hover:bg-secondary-700 hover:shadow-lg'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {plan.cta}
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {/* Trust Badges */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <div className="flex flex-wrap items-center justify-center gap-8 mb-8">
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>7-day free trial</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Cancel anytime</span>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 max-w-2xl mx-auto">
            Prices are in USD. Subscriptions renew automatically. You can cancel anytime from your account settings. 
            Pro features require an active subscription after the trial period.
          </p>
        </motion.div>
      </div>
    </section>
  );
} 