'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Mic, Target, Camera, Brain, ChevronLeft, ChevronRight } from 'lucide-react';

const demoScreens = [
  {
    id: 'voice-journal',
    title: 'Voice Journaling',
    icon: Mic,
    color: 'purple',
    content: {
      title: 'Express Yourself Naturally',
      description: 'Record your thoughts and feelings with our AI-powered voice journaling. Get instant transcriptions and deep insights.',
      features: [
        'One-tap voice recording',
        'AI-powered transcription',
        'Mood detection',
        'Pattern insights'
      ],
      preview: {
        type: 'voice',
        waveform: true
      }
    }
  },
  {
    id: 'habit-tracking',
    title: 'Habit Tracking',
    icon: Target,
    color: 'blue',
    content: {
      title: 'Build Lasting Habits',
      description: 'Track your daily habits with our gamified system. Build streaks, earn achievements, and transform your life.',
      features: [
        'Visual habit chains',
        'Smart reminders',
        'Achievement system',
        'Progress analytics'
      ],
      preview: {
        type: 'habits',
        habits: [
          { name: 'Morning Meditation', completed: true, streak: 15 },
          { name: 'Read 30 Minutes', completed: true, streak: 8 },
          { name: 'Exercise', completed: false, streak: 5 },
          { name: 'Gratitude Journal', completed: false, streak: 12 }
        ]
      }
    }
  },
  {
    id: 'progress-photos',
    title: 'Progress Photos',
    icon: Camera,
    color: 'green',
    content: {
      title: 'Visualize Your Journey',
      description: 'Track your physical transformation with before/after photos. See your progress over time with our timeline view.',
      features: [
        'Private photo gallery',
        'Side-by-side comparison',
        'Timeline view',
        'Milestone celebrations'
      ],
      preview: {
        type: 'photos',
        timeline: true
      }
    }
  },
  {
    id: 'ai-coaching',
    title: 'AI Coach',
    icon: Brain,
    color: 'orange',
    content: {
      title: 'Your Personal AI Coach',
      description: 'Get personalized guidance from an AI coach that learns your patterns and adapts to your unique journey.',
      features: [
        'Personalized insights',
        'Goal recommendations',
        'Motivational support',
        'Progress predictions'
      ],
      preview: {
        type: 'ai',
        messages: [
          { type: 'ai', text: "Great job on your 15-day meditation streak! I've noticed you're most consistent in the mornings." },
          { type: 'user', text: "Thanks! Any tips for my exercise habit?" },
          { type: 'ai', text: "Based on your patterns, try scheduling exercise right after meditation. Stack habits for better success!" }
        ]
      }
    }
  }
];

export default function Demo() {
  const [activeDemo, setActiveDemo] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const currentDemo = demoScreens[activeDemo];
  const Icon = currentDemo.icon;

  const nextDemo = () => {
    setActiveDemo((prev) => (prev + 1) % demoScreens.length);
  };

  const prevDemo = () => {
    setActiveDemo((prev) => (prev - 1 + demoScreens.length) % demoScreens.length);
  };

  return (
    <section id="demo" className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">Interactive Demo</span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 mt-2">
            Experience UpCoach
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600"> Live</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore our core features and see how UpCoach can transform your daily routines into lasting success
          </p>
        </motion.div>
        
        <div className="max-w-6xl mx-auto">
          {/* Demo Navigation */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {demoScreens.map((screen, index) => {
              const ScreenIcon = screen.icon;
              return (
                <button
                  key={screen.id}
                  onClick={() => setActiveDemo(index)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    index === activeDemo
                      ? `bg-${screen.color}-100 text-${screen.color}-700 border-2 border-${screen.color}-200`
                      : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <ScreenIcon className="w-5 h-5" />
                  <span>{screen.title}</span>
                </button>
              );
            })}
          </div>

          {/* Demo Content */}
          <motion.div 
            key={activeDemo}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            {/* Left: Feature Description */}
            <div>
              <div className={`inline-flex items-center justify-center w-16 h-16 bg-${currentDemo.color}-100 rounded-2xl mb-6`}>
                <Icon className={`w-8 h-8 text-${currentDemo.color}-600`} />
              </div>
              
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                {currentDemo.content.title}
              </h3>
              
              <p className="text-lg text-gray-600 mb-8">
                {currentDemo.content.description}
              </p>
              
              <ul className="space-y-3 mb-8">
                {currentDemo.content.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className={`w-2 h-2 bg-${currentDemo.color}-500 rounded-full`}></div>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <div className="flex gap-4">
                <button
                  onClick={prevDemo}
                  className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                  aria-label="Previous demo"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextDemo}
                  className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                  aria-label="Next demo"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Right: Interactive Preview */}
            <div className="relative">
              <div className="relative mx-auto w-[320px] h-[640px]">
                {/* Phone Frame */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-[3rem] p-3 shadow-2xl">
                  <div className="bg-gray-700 rounded-[2.5rem] p-1 h-full">
                    <div className="bg-white rounded-[2.3rem] overflow-hidden h-full">
                      {/* Screen Content */}
                      <div className="h-full flex flex-col">
                        {/* Status Bar */}
                        <div className="flex justify-between items-center px-6 py-2 text-xs">
                          <span className="font-medium">9:41</span>
                          <div className="flex gap-1">
                            <div className="w-4 h-3 bg-gray-900 rounded-sm"></div>
                            <div className="w-4 h-3 bg-gray-900 rounded-sm"></div>
                            <div className="w-4 h-3 bg-gray-900 rounded-sm"></div>
                          </div>
                        </div>
                        
                        {/* App Content */}
                        <div className="flex-1 px-6 py-4 overflow-hidden">
                          {currentDemo.content.preview.type === 'voice' && (
                            <div className="h-full flex flex-col items-center justify-center">
                              <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-8 animate-pulse">
                                <Mic className="w-16 h-16 text-white" />
                              </div>
                              <p className="text-gray-600 mb-4">Tap to start recording</p>
                              {currentDemo.content.preview.waveform && (
                                <div className="flex items-center gap-1 h-16">
                                  {[...Array(20)].map((_, i) => (
                                    <div
                                      key={i}
                                      className="w-1 bg-purple-400 rounded-full animate-pulse"
                                      style={{
                                        height: `${Math.random() * 100}%`,
                                        animationDelay: `${i * 0.1}s`
                                      }}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {currentDemo.content.preview.type === 'habits' && (
                            <div className="space-y-3">
                              <h4 className="font-semibold text-gray-900 mb-4">Today's Habits</h4>
                              {currentDemo.content.preview.habits?.map((habit, index) => (
                                <div key={index} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                      habit.completed ? 'bg-green-500' : 'border-2 border-gray-300'
                                    }`}>
                                      {habit.completed && (
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      )}
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">{habit.name}</p>
                                      <p className="text-xs text-gray-500">{habit.streak} day streak</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {currentDemo.content.preview.type === 'photos' && (
                            <div className="h-full flex flex-col items-center justify-center">
                              <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="w-32 h-40 bg-gray-200 rounded-xl flex items-center justify-center">
                                  <span className="text-gray-400">Before</span>
                                </div>
                                <div className="w-32 h-40 bg-green-100 rounded-xl flex items-center justify-center">
                                  <span className="text-green-600 font-medium">After</span>
                                </div>
                              </div>
                              <button className="bg-green-500 text-white px-6 py-3 rounded-xl font-medium">
                                Add Progress Photo
                              </button>
                            </div>
                          )}
                          
                          {currentDemo.content.preview.type === 'ai' && (
                            <div className="space-y-4">
                              {currentDemo.content.preview.messages?.map((message, index) => (
                                <div key={index} className={`flex ${
                                  message.type === 'ai' ? 'justify-start' : 'justify-end'
                                }`}>
                                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                                    message.type === 'ai' 
                                      ? 'bg-gray-100 text-gray-800' 
                                      : 'bg-blue-500 text-white'
                                  }`}>
                                    <p className="text-sm">{message.text}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Video Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-24"
          >
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Watch the Full Demo
              </h3>
              <p className="text-lg text-gray-600">
                See how real users transform their lives with UpCoach
              </p>
            </div>
            
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gray-900 max-w-4xl mx-auto">
              <div className="aspect-video relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-secondary-600 opacity-90"></div>
                
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="bg-white rounded-full p-6 shadow-lg hover:scale-110 transition-transform duration-300"
                  >
                    {isPlaying ? (
                      <Pause className="w-12 h-12 text-primary-600" />
                    ) : (
                      <Play className="w-12 h-12 text-primary-600 ml-1" />
                    )}
                  </button>
                </div>
                
                <div className="absolute bottom-8 left-8 text-white">
                  <p className="text-2xl font-semibold mb-2">Transform Your Life in 90 Days</p>
                  <p className="text-lg opacity-90">3-minute demo video</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
} 