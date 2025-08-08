"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle,
  Users,
  TrendingUp,
  Award,
} from "lucide-react";
import LeadCaptureForm from "../LeadCaptureForm";
import { useState } from "react";

const benefits = [
  {
    icon: Users,
    title: "Join 50,000+ Users",
    description: "Be part of a growing community of achievers",
  },
  {
    icon: TrendingUp,
    title: "Early Bird Pricing",
    description: "Lock in 50% off lifetime discount",
  },
  {
    icon: Award,
    title: "Exclusive Features",
    description: "Get access to beta features first",
  },
];

export default function LeadGeneration() {
  const [formSubmitted, setFormSubmitted] = useState(false);

  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">
                Limited Time Offer
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 mt-2">
                Get Early Access &
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600">
                  {" "}
                  Save 50%
                </span>
              </h2>

              <p className="text-xl text-gray-600 mb-8">
                Join thousands of professionals who are transforming their lives
                with UpCoach. Sign up now to secure your lifetime discount and
                exclusive benefits.
              </p>

              {/* Benefits */}
              <div className="space-y-4 mb-8">
                {benefits.map((benefit, index) => {
                  const Icon = benefit.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.1 + index * 0.1 }}
                      className="flex items-start gap-4"
                    >
                      <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {benefit.title}
                        </h3>
                        <p className="text-gray-600">{benefit.description}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Success Metrics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-primary-50 rounded-2xl p-6"
              >
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary-600">
                      92%
                    </div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary-600">
                      4.9★
                    </div>
                    <div className="text-sm text-gray-600">User Rating</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary-600">
                      30d
                    </div>
                    <div className="text-sm text-gray-600">Avg. to Results</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                {/* Timer/Urgency */}
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-center">
                  <p className="text-red-600 font-semibold">
                    🔥 Early bird offer ends in 48 hours
                  </p>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Reserve Your Spot
                </h3>
                <p className="text-gray-600 mb-6">
                  No credit card required. Unsubscribe anytime.
                </p>

                <LeadCaptureForm
                  source="lead-generation-section"
                  onSuccess={() => setFormSubmitted(true)}
                />

                {/* Trust Badges */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>SSL Secure</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>GDPR Compliant</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>No Spam</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Proof */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-6 text-center"
              >
                <p className="text-sm text-gray-600 mb-3">
                  Join professionals from these companies:
                </p>
                <div className="flex flex-wrap justify-center items-center gap-6 opacity-60">
                  <span className="text-lg font-semibold text-gray-400">
                    Google
                  </span>
                  <span className="text-lg font-semibold text-gray-400">
                    Microsoft
                  </span>
                  <span className="text-lg font-semibold text-gray-400">
                    Apple
                  </span>
                  <span className="text-lg font-semibold text-gray-400">
                    Meta
                  </span>
                  <span className="text-lg font-semibold text-gray-400">
                    Amazon
                  </span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
