'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Hero() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section className="relative min-h-screen flex items-center justify-center gradient-bg overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-hero-pattern opacity-50"></div>
      
      <div className="container relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-800 rounded-full text-sm font-medium mb-8 animate-fade-in">
            🚀 Introducing AI-Powered Personal Coaching
          </div>
          
          {/* Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 animate-slide-up">
            Transform Your
            <span className="block text-gradient">Professional Growth</span>
            with AI Coaching
          </h1>
          
          {/* Description */}
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed animate-slide-up animation-delay-200">
            Get personalized guidance, smart task management, and progress tracking 
            that adapts to your unique goals and learning style.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 animate-slide-up animation-delay-400">
            <Link
              href="https://apps.apple.com"
              className="btn-primary btn-lg w-full sm:w-auto"
              data-testid="ios-download"
            >
              📱 Download for iOS
            </Link>
            <Link
              href="https://play.google.com"
              className="btn-secondary btn-lg w-full sm:w-auto"
              data-testid="android-download"
            >
              🤖 Download for Android
            </Link>
          </div>
          
          {/* Hero Image/Mockup */}
          <div className="relative max-w-2xl mx-auto animate-slide-up animation-delay-600">
            <div className="relative">
              <img
                src="https://via.placeholder.com/600x400/3b82f6/ffffff?text=UpCoach+App+Mockup"
                alt="UpCoach mobile app mockup showing AI coaching interface"
                className="w-full rounded-2xl shadow-2xl"
                data-testid="hero-image"
              />
              
              {/* Play Button Overlay */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-2xl transition-opacity hover:bg-opacity-30"
                data-testid="play-video"
                aria-label="Play demo video"
              >
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-primary-600 ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto mt-16 animate-fade-in animation-delay-600">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary-600">10K+</div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary-600">4.9★</div>
              <div className="text-sm text-gray-600">App Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary-600">85%</div>
              <div className="text-sm text-gray-600">Goal Achievement</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-bounce-gentle"></div>
        </div>
      </div>
    </section>
  );
} 