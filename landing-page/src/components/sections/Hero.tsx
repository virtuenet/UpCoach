'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { trackAppDownload } from '@/services/analytics';
import { useExperiment } from '@/services/experiments';
import { ABTestSwitch, Variant } from '@/components/experiments/ABTest';
import { Play } from 'lucide-react';
import VideoModal from '@/components/VideoModal';

export default function Hero() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const { trackConversion } = useExperiment('heroButtonColor');

  const handleDownloadClick = (platform: 'ios' | 'android') => {
    trackAppDownload(platform, 'hero');
    trackConversion('download_click', 1);
  };

  const handleWatchDemo = () => {
    setShowVideoModal(true);
    trackConversion('demo_video_click', 1);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-hero-pattern opacity-10"></div>
      
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-accent-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="container relative z-10 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left"
            >
              {/* Badge */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-800 rounded-full text-sm font-medium mb-8"
              >
                <span className="animate-pulse mr-2">🎯</span>
                AI-Powered Personal Development
              </motion.div>
              
              {/* Headline */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Unlock Your Full Potential with
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600 mt-2">
                  AI-Driven Coaching
                </span>
              </h1>
              
              {/* Description */}
              <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl lg:max-w-none leading-relaxed">
                Transform your habits, achieve your goals, and track your progress with personalized AI coaching that adapts to your unique journey. Voice journaling, habit tracking, and intelligent insights - all in one app.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center mb-8">
                <ABTestSwitch experimentId="heroButtonColor">
                  <Variant variant="control">
                    <Link
                      href="https://apps.apple.com/app/upcoach"
                      className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-primary-600 rounded-xl overflow-hidden transition-all duration-300 hover:bg-primary-700 hover:scale-105 hover:shadow-2xl w-full sm:w-auto"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleDownloadClick('ios')}
                    >
                      <svg className="w-7 h-7 mr-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                      </svg>
                      <span>Download for iOS</span>
                    </Link>
                  </Variant>
                  <Variant variant="variant-a">
                    <Link
                      href="https://apps.apple.com/app/upcoach"
                      className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gray-900 rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl w-full sm:w-auto"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleDownloadClick('ios')}
                    >
                      <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary-600 to-secondary-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                      <svg className="w-7 h-7 mr-3 relative z-10" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                      </svg>
                      <span className="relative z-10">Download for iOS</span>
                    </Link>
                  </Variant>
                </ABTestSwitch>
                <Link
                  href="https://play.google.com/store/apps/details?id=com.upcoach.app"
                  className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-900 bg-white border-2 border-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-gray-300 w-full sm:w-auto"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleDownloadClick('android')}
                >
                  <svg className="w-7 h-7 mr-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                  <span>Download for Android</span>
                </Link>
              </div>

              {/* Watch Demo Button */}
              <div className="mt-4">
                <button
                  onClick={handleWatchDemo}
                  className="group inline-flex items-center gap-3 text-primary-600 hover:text-primary-700 font-medium transition-colors duration-300"
                >
                  <div className="relative w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center group-hover:bg-primary-200 transition-colors duration-300">
                    <Play className="w-5 h-5 ml-1" fill="currentColor" />
                    <div className="absolute inset-0 rounded-full border-2 border-primary-300 animate-ping opacity-50"></div>
                  </div>
                  <span className="text-lg">Watch 2-minute Demo</span>
                </button>
              </div>
              
              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 justify-center lg:justify-start mt-8">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Free 7-day trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Cancel anytime</span>
                </div>
              </div>
            </motion.div>
            
            {/* Hero Image/Mockup */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative"
            >
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Phone Mockup */}
                <div className="relative mx-auto w-[280px] h-[580px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-[3rem] opacity-20 blur-2xl"></div>
                  <div className="relative bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
                    <div className="bg-gray-800 rounded-[2.5rem] p-1">
                      <div className="bg-white rounded-[2.3rem] overflow-hidden">
                        {/* Screen Content */}
                        <div className="relative h-[520px] bg-gradient-to-b from-primary-50 to-white">
                          {/* Status Bar */}
                          <div className="flex justify-between items-center px-6 py-2 text-xs">
                            <span className="font-medium">9:41</span>
                            <div className="flex gap-1">
                              <div className="w-4 h-3 bg-gray-900 rounded-sm"></div>
                              <div className="w-4 h-3 bg-gray-900 rounded-sm"></div>
                              <div className="w-4 h-3 bg-gray-900 rounded-sm"></div>
                            </div>
                          </div>
                          
                          {/* App Header */}
                          <div className="px-6 py-4">
                            <h2 className="text-xl font-bold text-gray-900">Good morning, Sarah! 👋</h2>
                            <p className="text-sm text-gray-600 mt-1">Ready to crush your goals today?</p>
                          </div>
                          
                          {/* AI Coach Card */}
                          <div className="px-6 mt-4">
                            <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-4 text-white">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                  <span className="text-xl">🤖</span>
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium mb-1">Your AI Coach says:</p>
                                  <p className="text-xs opacity-90">"You're on a 5-day streak! Let's keep the momentum going with today's habit check-ins."</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Today's Habits */}
                          <div className="px-6 mt-6">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Today's Habits</h3>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                    <span>🧘</span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">Morning Meditation</p>
                                    <p className="text-xs text-gray-500">10 minutes</p>
                                  </div>
                                </div>
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <span>📚</span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">Read Industry News</p>
                                    <p className="text-xs text-gray-500">15 minutes</p>
                                  </div>
                                </div>
                                <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                              </div>
                              
                              <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <span>💪</span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">Workout Session</p>
                                    <p className="text-xs text-gray-500">30 minutes</p>
                                  </div>
                                </div>
                                <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Bottom Navigation */}
                          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100">
                            <div className="flex justify-around items-center py-2">
                              <div className="p-2">
                                <div className="w-6 h-6 bg-primary-500 rounded-lg"></div>
                              </div>
                              <div className="p-2">
                                <div className="w-6 h-6 bg-gray-300 rounded-lg"></div>
                              </div>
                              <div className="p-2">
                                <div className="w-6 h-6 bg-gray-300 rounded-lg"></div>
                              </div>
                              <div className="p-2">
                                <div className="w-6 h-6 bg-gray-300 rounded-lg"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating Elements */}
                <motion.div 
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-8 -left-8 bg-white rounded-2xl shadow-xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">🎯</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">Goal Achieved!</p>
                      <p className="text-xs text-gray-500">5-day streak</p>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div 
                  animate={{ y: [0, 20, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                  className="absolute -bottom-8 -right-8 bg-white rounded-2xl shadow-xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">📊</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">85% Progress</p>
                      <p className="text-xs text-gray-500">This week</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
          
          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mt-20"
          >
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">50K+</div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">4.9★</div>
              <div className="text-sm text-gray-600">App Rating</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">92%</div>
              <div className="text-sm text-gray-600">Goal Achievement</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">3M+</div>
              <div className="text-sm text-gray-600">Habits Tracked</div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-bounce"></div>
        </div>
      </motion.div>

      {/* Video Modal */}
      <VideoModal 
        isOpen={showVideoModal} 
        onClose={() => setShowVideoModal(false)}
        videoUrl="https://www.youtube.com/embed/dQw4w9WgXcQ" // Replace with actual demo video
      />
    </section>
  );
} 