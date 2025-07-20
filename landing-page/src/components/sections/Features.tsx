'use client';

import { Brain, Target, Calendar, BarChart3, Users, Shield } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Coaching',
    description: 'Get personalized guidance from an AI coach that learns your style and helps you achieve your goals faster.',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  {
    icon: Target,
    title: 'Smart Goal Tracking',
    description: 'Set meaningful goals and track your progress with intelligent insights and actionable recommendations.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  {
    icon: Calendar,
    title: 'Task Management',
    description: 'Stay organized with AI-assisted task prioritization and smart scheduling that adapts to your workflow.',
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  {
    icon: BarChart3,
    title: 'Progress Analytics',
    description: 'Visualize your growth with detailed analytics and receive weekly reports on your achievements.',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Connect with mentors, share progress with managers, and collaborate on shared goals effortlessly.',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100'
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Your data is encrypted and secure. We prioritize your privacy with enterprise-grade security.',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100'
  }
];

export default function Features() {
  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            UpCoach combines cutting-edge AI technology with proven coaching methodologies to help you reach your full potential.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={index}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className={`${feature.bgColor} w-16 h-16 rounded-xl flex items-center justify-center mb-6`}>
                  <Icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
} 