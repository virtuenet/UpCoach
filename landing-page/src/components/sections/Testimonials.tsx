'use client';

import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Product Manager at TechCorp',
    avatar: 'SC',
    content: 'UpCoach has been a game-changer for my career. The AI coach helped me identify blind spots and develop leadership skills that led to my recent promotion.',
    rating: 5
  },
  {
    name: 'Michael Rodriguez',
    role: 'Software Engineer',
    avatar: 'MR',
    content: 'The personalized goal tracking and daily check-ins keep me accountable. I\'ve achieved more in 3 months with UpCoach than I did in the previous year.',
    rating: 5
  },
  {
    name: 'Emily Thompson',
    role: 'Marketing Director',
    avatar: 'ET',
    content: 'What I love most is the 24/7 availability. Whether I need advice at midnight or during lunch, my AI coach is always there with thoughtful guidance.',
    rating: 5
  }
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Trusted by Professionals Worldwide
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands of professionals who have transformed their careers with UpCoach
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300"
            >
              {/* Rating stars */}
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              
              {/* Content */}
              <p className="text-gray-700 mb-6 leading-relaxed italic">
                "{testimonial.content}"
              </p>
              
              {/* Author */}
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold mr-4">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">10,000+</div>
            <p className="text-gray-600">Active Users</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">4.8/5</div>
            <p className="text-gray-600">Average Rating</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">95%</div>
            <p className="text-gray-600">User Satisfaction</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">50+</div>
            <p className="text-gray-600">Countries</p>
          </div>
        </div>
      </div>
    </section>
  );
} 