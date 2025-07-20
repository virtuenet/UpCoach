'use client';

import { Check, X } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for trying out UpCoach',
    features: [
      { text: 'AI Coach conversations (5/day)', included: true },
      { text: 'Basic goal tracking', included: true },
      { text: 'Mood tracking', included: true },
      { text: 'Weekly reports', included: false },
      { text: 'Advanced analytics', included: false },
      { text: 'Team collaboration', included: false },
      { text: 'Priority support', included: false }
    ],
    cta: 'Get Started',
    popular: false
  },
  {
    name: 'Pro',
    price: '$19',
    period: 'per month',
    description: 'For serious professionals',
    features: [
      { text: 'Unlimited AI Coach conversations', included: true },
      { text: 'Advanced goal tracking', included: true },
      { text: 'Mood tracking & insights', included: true },
      { text: 'Weekly reports', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'Team collaboration', included: false },
      { text: 'Priority support', included: true }
    ],
    cta: 'Start Free Trial',
    popular: true
  },
  {
    name: 'Team',
    price: '$49',
    period: 'per user/month',
    description: 'For teams and organizations',
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Team collaboration tools', included: true },
      { text: 'Manager dashboard', included: true },
      { text: 'Custom integrations', included: true },
      { text: 'Advanced security', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: '24/7 phone support', included: true }
    ],
    cta: 'Contact Sales',
    popular: false
  }
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the plan that fits your needs. Upgrade or downgrade anytime.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`relative bg-white rounded-2xl p-8 ${
                plan.popular 
                  ? 'ring-2 ring-purple-600 shadow-xl scale-105' 
                  : 'shadow-lg'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-2">
                  <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600 ml-2">{plan.period}</span>
                </div>
                <p className="text-gray-600">{plan.description}</p>
              </div>
              
              <ul className="mb-8 space-y-4">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 mr-3 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>
              
              <button className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                plan.popular
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-gray-600">
            All plans include a 14-day free trial. No credit card required.
          </p>
        </div>
      </div>
    </section>
  );
} 