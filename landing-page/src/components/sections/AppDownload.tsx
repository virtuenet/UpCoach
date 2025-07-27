'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Apple, Smartphone, Download, Star } from 'lucide-react';

export default function AppDownload() {
  return (
    <section className="py-24 bg-gradient-to-br from-primary-600 to-secondary-600 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-white"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Start Your Transformation Journey Today
              </h2>
              <p className="text-xl mb-8 text-white/90">
                Download UpCoach now and join thousands who are achieving their goals with AI-powered coaching.
              </p>

              {/* App Store Stats */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="text-2xl font-bold">4.9/5</div>
                  <div className="text-sm text-white/70">10,000+ App Store Reviews</div>
                </div>
                <div>
                  <Download className="w-8 h-8 mb-2 text-white/80" />
                  <div className="text-2xl font-bold">50K+</div>
                  <div className="text-sm text-white/70">Downloads This Month</div>
                </div>
              </div>

              {/* Download Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="https://apps.apple.com/app/upcoach"
                  className="group bg-black text-white px-6 py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-900 transition-colors duration-300"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Apple className="w-8 h-8" />
                  <div className="text-left">
                    <div className="text-xs opacity-80">Download on the</div>
                    <div className="text-lg font-semibold">App Store</div>
                  </div>
                </Link>
                
                <Link
                  href="https://play.google.com/store/apps/details?id=com.upcoach.app"
                  className="group bg-black text-white px-6 py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-900 transition-colors duration-300"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-xs opacity-80">Get it on</div>
                    <div className="text-lg font-semibold">Google Play</div>
                  </div>
                </Link>
              </div>

              {/* QR Code Option */}
              <div className="mt-8 flex items-center gap-4">
                <div className="bg-white p-4 rounded-xl">
                  <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500 text-xs text-center">QR Code<br/>Placeholder</span>
                  </div>
                </div>
                <div className="text-sm">
                  <p className="font-semibold mb-1">Scan to Download</p>
                  <p className="text-white/70">Point your camera at the QR code to download the app instantly</p>
                </div>
              </div>
            </motion.div>

            {/* Phone Mockups */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative flex justify-center items-end gap-4">
                {/* iPhone Mockup */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="relative z-20"
                >
                  <div className="w-48 h-96 bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl">
                    <div className="w-full h-full bg-gray-800 rounded-[2.2rem] p-1">
                      <div className="w-full h-full bg-white rounded-[2rem] overflow-hidden">
                        <div className="h-full bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
                          <Smartphone className="w-16 h-16 text-gray-300" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Android Mockup */}
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                  className="relative z-10 -ml-12"
                >
                  <div className="w-48 h-96 bg-gray-900 rounded-[2rem] p-2 shadow-2xl">
                    <div className="w-full h-full bg-gray-800 rounded-[1.8rem] p-1">
                      <div className="w-full h-full bg-white rounded-[1.6rem] overflow-hidden">
                        <div className="h-full bg-gradient-to-b from-secondary-50 to-white flex items-center justify-center">
                          <Smartphone className="w-16 h-16 text-gray-300" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Floating Elements */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-xl"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-xl"
              />
            </motion.div>
          </div>

          {/* Bottom Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 text-white text-center"
          >
            <div>
              <div className="text-3xl mb-2">🔒</div>
              <div className="font-semibold">Secure & Private</div>
              <div className="text-sm text-white/70">End-to-end encryption</div>
            </div>
            <div>
              <div className="text-3xl mb-2">🌐</div>
              <div className="font-semibold">Works Offline</div>
              <div className="text-sm text-white/70">Sync when connected</div>
            </div>
            <div>
              <div className="text-3xl mb-2">💰</div>
              <div className="font-semibold">Free to Start</div>
              <div className="text-sm text-white/70">7-day trial included</div>
            </div>
            <div>
              <div className="text-3xl mb-2">🎯</div>
              <div className="font-semibold">AI-Powered</div>
              <div className="text-sm text-white/70">Personalized coaching</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}