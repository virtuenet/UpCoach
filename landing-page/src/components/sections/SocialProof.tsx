'use client';

import { motion } from 'framer-motion';
import { CheckCircle, TrendingUp, Users, Award, Clock } from 'lucide-react';
import Image from 'next/image';

const metrics = [
  {
    value: '50,000+',
    label: 'Active Users',
    description: 'Growing community of achievers',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    value: '92%',
    label: 'Goal Achievement',
    description: 'Users reaching their targets',
    icon: TrendingUp,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    value: '4.9/5',
    label: 'App Store Rating',
    description: 'From 10,000+ reviews',
    icon: Award,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  {
    value: '3M+',
    label: 'Habits Tracked',
    description: 'Total habits monitored',
    icon: CheckCircle,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
];

const successStories = [
  {
    name: 'Jessica Martinez',
    achievement: 'Lost 30 lbs in 4 months',
    story:
      'The progress photos feature kept me motivated. Seeing my transformation visually made all the difference.',
    beforeAfter: { before: '180 lbs', after: '150 lbs', duration: '4 months' },
    image: '/testimonials/jessica.jpg',
    category: 'Fitness',
  },
  {
    name: 'Ryan Chen',
    achievement: 'Built a $100K business',
    story:
      'Daily voice journaling helped me clarify my business vision. The AI insights identified opportunities I was missing.',
    beforeAfter: { before: '$0 MRR', after: '$8.5K MRR', duration: '8 months' },
    image: '/testimonials/ryan.jpg',
    category: 'Business',
  },
  {
    name: 'Maria Silva',
    achievement: 'Overcame anxiety & depression',
    story:
      'The mood tracking and AI coaching helped me identify triggers and develop healthy coping mechanisms.',
    beforeAfter: {
      before: 'Daily anxiety',
      after: '90% reduction',
      duration: '6 months',
    },
    image: '/testimonials/maria.jpg',
    category: 'Mental Health',
  },
];

const awards = [
  {
    title: 'App of the Day',
    provider: 'App Store',
    date: '2024',
    icon: '🏆',
  },
  {
    title: 'Best Wellness App',
    provider: 'TechCrunch',
    date: '2024',
    icon: '🥇',
  },
  {
    title: "Editor's Choice",
    provider: 'Google Play',
    date: '2024',
    icon: '⭐',
  },
  {
    title: 'Top 10 Productivity',
    provider: 'Product Hunt',
    date: '2023',
    icon: '🚀',
  },
];

export default function SocialProof() {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">
            Social Proof
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 mt-2">
            Trusted by Thousands
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600">
              {' '}
              Worldwide
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join a community of achievers who are transforming their lives with UpCoach
          </p>
        </motion.div>

        {/* Metrics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
        >
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div
                  className={`${metric.bgColor} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}
                >
                  <Icon className={`w-6 h-6 ${metric.color}`} />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{metric.value}</div>
                <div className="text-sm font-semibold text-gray-700">{metric.label}</div>
                <div className="text-xs text-gray-500 mt-1">{metric.description}</div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Awards & Recognition */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-20"
        >
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Awards & Recognition
          </h3>
          <div className="flex flex-wrap justify-center gap-6">
            {awards.map((award, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                className="bg-white rounded-xl px-6 py-4 shadow-md hover:shadow-lg transition-shadow duration-300 flex items-center gap-4"
              >
                <span className="text-3xl">{award.icon}</span>
                <div>
                  <div className="font-semibold text-gray-900">{award.title}</div>
                  <div className="text-sm text-gray-600">
                    {award.provider} • {award.date}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Success Stories */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-12">Success Stories</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {successStories.map((story, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group"
              >
                {/* Category Badge */}
                <div className="relative">
                  <div className="absolute top-4 left-4 z-10">
                    <span className="bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-700 px-3 py-1 rounded-full">
                      {story.category}
                    </span>
                  </div>
                  {/* Placeholder for image */}
                  <div className="h-48 bg-gradient-to-br from-primary-400 to-secondary-400 relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <div className="font-bold text-lg">{story.name}</div>
                      <div className="text-sm opacity-90">{story.achievement}</div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Story */}
                  <p className="text-gray-600 mb-4 italic">"{story.story}"</p>

                  {/* Before/After Stats */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <div className="text-xs text-gray-500">Before</div>
                        <div className="font-semibold text-gray-900">
                          {story.beforeAfter.before}
                        </div>
                      </div>
                      <div className="text-2xl">→</div>
                      <div>
                        <div className="text-xs text-gray-500">After</div>
                        <div className="font-semibold text-primary-600">
                          {story.beforeAfter.after}
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <Clock className="w-4 h-4 inline mr-1 text-gray-400" />
                      <span className="text-sm text-gray-600">{story.beforeAfter.duration}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-20 text-center"
        >
          <div className="flex flex-wrap justify-center items-center gap-8 mb-8">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-gray-600">HIPAA Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-gray-600">256-bit Encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-gray-600">GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-gray-600">SOC 2 Type II</span>
            </div>
          </div>

          {/* Media Mentions */}
          <div className="text-sm text-gray-500 mb-4">As featured in</div>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <span className="text-2xl font-bold text-gray-400">TechCrunch</span>
            <span className="text-2xl font-bold text-gray-400">Forbes</span>
            <span className="text-2xl font-bold text-gray-400">The Verge</span>
            <span className="text-2xl font-bold text-gray-400">Wired</span>
            <span className="text-2xl font-bold text-gray-400">Inc.</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
