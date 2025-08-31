'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  BarChart3,
  MessageSquare,
  Sparkles,
  Shield,
  Globe,
  Award,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trackEvent } from '@/services/analytics';

const features = [
  {
    icon: Users,
    title: 'Expand Your Reach',
    description:
      'Connect with clients globally and scale your coaching practice beyond geographical limits.',
  },
  {
    icon: Calendar,
    title: 'Flexible Scheduling',
    description: 'AI handles scheduling, reminders, and follow-ups so you can focus on coaching.',
  },
  {
    icon: DollarSign,
    title: 'Increase Revenue',
    description:
      'Serve more clients efficiently with AI assistance, multiplying your income potential.',
  },
  {
    icon: BarChart3,
    title: 'Track Progress',
    description: 'Advanced analytics show client progress and coaching effectiveness in real-time.',
  },
  {
    icon: MessageSquare,
    title: '24/7 AI Support',
    description:
      'Your AI assistant provides support to clients between sessions, enhancing outcomes.',
  },
  {
    icon: Sparkles,
    title: 'Personalized Programs',
    description:
      "AI helps create customized coaching programs based on each client's unique needs.",
  },
];

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Executive Coach',
    image: '/images/coach-1.jpg',
    quote:
      "UpCoach has transformed my practice. I'm now helping 3x more clients while maintaining quality.",
    revenue: '+180% revenue increase',
  },
  {
    name: 'Michael Chen',
    role: 'Life Coach',
    image: '/images/coach-2.jpg',
    quote:
      'The AI assistant handles routine tasks, letting me focus on deep, transformative coaching work.',
    revenue: '500+ clients served',
  },
  {
    name: 'Emma Williams',
    role: 'Career Coach',
    image: '/images/coach-3.jpg',
    quote: 'My clients love the 24/7 support. Their progress has accelerated dramatically.',
    revenue: '95% client retention',
  },
];

const benefits = [
  { label: 'Average Revenue Increase', value: '156%' },
  { label: 'Client Capacity', value: '3-5x' },
  { label: 'Time Saved Weekly', value: '15+ hours' },
  { label: 'Client Satisfaction', value: '4.9/5' },
];

export default function ForCoachesPage() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    trackEvent('Coach Signup Started', {
      source: 'for-coaches-page',
      email,
    });
    // Handle coach signup
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="mb-4" variant="secondary">
                For Professional Coaches
              </Badge>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                Scale Your Coaching Practice
                <span className="text-primary block">With AI Technology</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                Empower more clients, increase your revenue, and deliver better outcomes with
                UpCoach's AI-enhanced coaching platform.
              </p>
            </motion.div>

            <motion.form
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              onSubmit={handleSubmit}
              className="max-w-md mx-auto flex gap-4"
            >
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <Button type="submit" size="lg">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.form>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-4 text-sm text-gray-600"
            >
              Join 5,000+ coaches already using UpCoach • No credit card required
            </motion.p>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16"
          >
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {benefit.value}
                </div>
                <div className="text-gray-600">{benefit.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything You Need to Scale</h2>
            <p className="text-xl text-gray-600">
              Powerful tools designed specifically for professional coaches
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-6 h-full hover:shadow-lg transition-shadow">
                  <feature.icon className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
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
                How AI Enhances Your Coaching
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Onboard Clients Seamlessly</h3>
                    <p className="text-gray-600">
                      AI helps assess client needs, set goals, and create personalized coaching
                      plans.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-primary font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Provide 24/7 Support</h3>
                    <p className="text-gray-600">
                      Your AI assistant engages clients between sessions, reinforcing your coaching.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-primary font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Track & Optimize</h3>
                    <p className="text-gray-600">
                      Get insights on client progress and coaching effectiveness to improve
                      outcomes.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="relative"
            >
              <img
                src="/images/coach-dashboard.png"
                alt="Coach Dashboard"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -top-6 -right-6 bg-green-500 text-white p-4 rounded-xl shadow-xl">
                <TrendingUp className="h-6 w-6 mb-1" />
                <p className="font-semibold">156% Growth</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Coaches Love UpCoach</h2>
            <p className="text-xl text-gray-600">
              See how coaches are transforming their practices
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-6 h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-semibold">{testimonial.name}</h4>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-4 italic">"{testimonial.quote}"</p>
                  <Badge variant="secondary">{testimonial.revenue}</Badge>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Coach Partnership Plans</h2>
            <p className="text-xl text-gray-600">Flexible pricing that grows with your practice</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="p-8">
              <h3 className="text-2xl font-bold mb-2">Starter</h3>
              <p className="text-gray-600 mb-4">For coaches getting started</p>
              <div className="text-4xl font-bold mb-6">
                $99
                <span className="text-base font-normal text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span>Up to 25 clients</span>
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span>AI coaching assistant</span>
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span>Basic analytics</span>
                </li>
              </ul>
              <Button className="w-full" variant="outline">
                Get Started
              </Button>
            </Card>

            <Card className="p-8 border-primary shadow-lg relative">
              <Badge className="absolute -top-3 right-6">Most Popular</Badge>
              <h3 className="text-2xl font-bold mb-2">Professional</h3>
              <p className="text-gray-600 mb-4">For growing practices</p>
              <div className="text-4xl font-bold mb-6">
                $249
                <span className="text-base font-normal text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span>Up to 100 clients</span>
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span>Advanced AI features</span>
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span>Full analytics suite</span>
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span>White-label options</span>
                </li>
              </ul>
              <Button className="w-full">Get Started</Button>
            </Card>

            <Card className="p-8">
              <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
              <p className="text-gray-600 mb-4">For coaching organizations</p>
              <div className="text-4xl font-bold mb-6">Custom</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span>Unlimited clients</span>
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span>Custom AI training</span>
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span>API access</span>
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span>Dedicated support</span>
                </li>
              </ul>
              <Button className="w-full" variant="outline">
                Contact Sales
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Scale Your Coaching Practice?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of coaches already transforming lives with AI
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6" asChild>
              <Link href="/register?type=coach">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 bg-transparent text-white border-white hover:bg-white hover:text-primary"
              asChild
            >
              <Link href="/contact-sales">Schedule Demo</Link>
            </Button>
          </div>
          <div className="mt-8 flex items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              <span>30-day money back guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              <span>Available in 25+ countries</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
