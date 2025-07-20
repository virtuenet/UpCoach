'use client';

import { useState } from 'react';
import { Play, Pause } from 'lucide-react';

export default function Demo() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section id="demo" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              See UpCoach in Action
            </h2>
            <p className="text-xl text-gray-600">
              Watch how UpCoach transforms your professional development journey
            </p>
          </div>
          
          <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gray-900">
            {/* Video placeholder */}
            <div className="aspect-video relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 opacity-90"></div>
              
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="bg-white rounded-full p-6 shadow-lg hover:scale-110 transition-transform duration-300"
                >
                  {isPlaying ? (
                    <Pause className="w-12 h-12 text-purple-600" />
                  ) : (
                    <Play className="w-12 h-12 text-purple-600 ml-1" />
                  )}
                </button>
              </div>
              
              {/* Demo UI Preview */}
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <div className="text-white text-center">
                  <p className="text-2xl font-semibold mb-2">Interactive Demo</p>
                  <p className="text-lg">Coming Soon</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">5 min</div>
              <p className="text-gray-600">Quick daily check-ins</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">87%</div>
              <p className="text-gray-600">Goal achievement rate</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">24/7</div>
              <p className="text-gray-600">AI coach availability</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 