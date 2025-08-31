'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Zap, Shield, Award, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { trackEvent } from '@/services/analytics';

interface Step {
  number: number;
  title: string;
  description: string;
  icon: React.ElementType;
  time: string;
}

const steps: Step[] = [
  {
    number: 1,
    title: 'Create Your Account',
    description: 'Sign up in seconds with your email or social accounts. No credit card required.',
    icon: Zap,
    time: '30 seconds',
  },
  {
    number: 2,
    title: 'Complete Your Profile',
    description: 'Tell us about your goals, interests, and what you want to achieve.',
    icon: Award,
    time: '2 minutes',
  },
  {
    number: 3,
    title: 'Meet Your AI Coach',
    description: 'Get matched with a personalized AI coach tailored to your needs.',
    icon: Users,
    time: '1 minute',
  },
  {
    number: 4,
    title: 'Start Your Journey',
    description: 'Begin with your first coaching session and personalized action plan.',
    icon: ArrowRight,
    time: 'Ongoing',
  },
];

const benefits = [
  'Personalized AI coaching available 24/7',
  'Goal tracking and progress analytics',
  'Evidence-based coaching methodologies',
  'Private and secure conversations',
  'Mobile app for coaching on-the-go',
  'Community support and resources',
];

export default function GetStartedPage() {
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro' | 'premium'>('pro');

  const handleGetStarted = (source: string) => {
    trackEvent('Get Started Clicked', {
      source,
      selectedPlan,
      page: 'get-started',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Start Your Transformation Today
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Join thousands of people achieving their goals with personalized AI coaching. Get
              started in minutes and see results from day one.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
          >
            <Button
              size="lg"
              className="text-lg px-8 py-6"
              onClick={() => handleGetStarted('hero')}
              asChild
            >
              <Link href="/register">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6" asChild>
              <Link href="#how-it-works">See How It Works</Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex items-center justify-center gap-8 text-sm text-gray-600"
          >
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>50,000+ active users</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Get Started in 4 Simple Steps</h2>
            <p className="text-xl text-gray-600">
              From sign-up to your first coaching session in under 5 minutes
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-6 h-full hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl font-bold text-primary/20">{step.number}</span>
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-gray-600 mb-4">{step.description}</p>
                  <p className="text-sm text-primary font-medium">Time: {step.time}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Everything You Need to Succeed
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Our platform provides all the tools and support you need to achieve your personal
                and professional goals.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-3"
                  >
                    <Check className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-lg text-gray-700">{benefit}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="relative"
            >
              <img
                src="/images/app-mockup.png"
                alt="UpCoach App"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -right-6 bg-primary text-white p-4 rounded-xl shadow-xl">
                <p className="font-semibold">Join 50,000+ Users</p>
                <p className="text-sm opacity-90">Growing every day</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h2>
          <p className="text-xl text-gray-600 mb-8">Start free and upgrade anytime</p>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {['basic', 'pro', 'premium'].map(plan => (
              <motion.div
                key={plan}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedPlan(plan as any)}
                className={`cursor-pointer ${selectedPlan === plan ? 'ring-2 ring-primary' : ''}`}
              >
                <Card className="p-6 h-full">
                  <h3 className="text-2xl font-bold capitalize mb-2">{plan}</h3>
                  <p className="text-gray-600 mb-4">
                    {plan === 'basic' && 'Perfect for getting started'}
                    {plan === 'pro' && 'Most popular choice'}
                    {plan === 'premium' && 'For serious achievers'}
                  </p>
                  <div className="text-3xl font-bold mb-4">
                    ${plan === 'basic' ? '9' : plan === 'pro' ? '29' : '49'}
                    <span className="text-base font-normal text-gray-600">/month</span>
                  </div>
                  <Button
                    className="w-full"
                    variant={selectedPlan === plan ? 'default' : 'outline'}
                    onClick={() => handleGetStarted(`pricing-${plan}`)}
                    asChild
                  >
                    <Link href={`/register?plan=${plan}`}>Select {plan}</Link>
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>

          <p className="mt-8 text-gray-600">
            All plans include a 14-day free trial. No credit card required.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Life?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of people already achieving their goals with UpCoach
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="text-lg px-8 py-6"
            onClick={() => handleGetStarted('final-cta')}
            asChild
          >
            <Link href="/register">
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <p className="mt-4 text-sm opacity-75">No credit card required • Cancel anytime</p>
        </div>
      </section>
    </div>
  );
}
