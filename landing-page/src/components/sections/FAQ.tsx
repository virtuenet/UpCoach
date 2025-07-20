'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'What is UpCoach and how does it work?',
    answer: 'UpCoach is an AI-powered personal coaching platform that helps professionals achieve their goals. Our AI coach provides personalized guidance, tracks your progress, and offers actionable insights based on your unique needs and working style.'
  },
  {
    question: 'Is my data private and secure?',
    answer: 'Yes, absolutely. We use enterprise-grade encryption to protect your data. All conversations with your AI coach are private and confidential. We never share your personal information with third parties, and you have full control over your data.'
  },
  {
    question: 'Can I use UpCoach with my team?',
    answer: 'Yes! Our Team plan includes collaboration features, manager dashboards, and team analytics. Team members can share goals, celebrate achievements together, and managers can support their team\'s development while respecting individual privacy.'
  },
  {
    question: 'How is the AI coach different from a human coach?',
    answer: 'The AI coach is available 24/7, provides instant responses, and learns from millions of coaching interactions to offer evidence-based advice. While it doesn\'t replace human connection, it provides consistent, unbiased support whenever you need it.'
  },
  {
    question: 'Can I cancel or change my subscription anytime?',
    answer: 'Yes, you can upgrade, downgrade, or cancel your subscription at any time. There are no long-term contracts or cancellation fees. If you cancel, you\'ll continue to have access until the end of your billing period.'
  },
  {
    question: 'What kind of goals can UpCoach help me with?',
    answer: 'UpCoach can help with various professional goals including career advancement, skill development, productivity improvement, work-life balance, leadership development, and personal growth. The AI coach adapts to your specific needs and objectives.'
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Got questions? We've got answers. If you can't find what you're looking for, feel free to contact our support team.
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="mb-4 bg-gray-50 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-100 transition-colors"
              >
                <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                <ChevronDown 
                  className={`w-5 h-5 text-gray-500 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ${
                openIndex === index ? 'max-h-96' : 'max-h-0'
              }`}>
                <div className="px-6 pb-4 text-gray-600">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">Still have questions?</p>
          <button className="btn-secondary">
            Contact Support
          </button>
        </div>
      </div>
    </section>
  );
} 