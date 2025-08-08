"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  HelpCircle,
  MessageCircle,
  Shield,
  Smartphone,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import { trackFAQExpand } from "@/services/analytics";

const faqCategories = [
  {
    category: "Getting Started",
    icon: HelpCircle,
    faqs: [
      {
        question: "What is UpCoach and how does it work?",
        answer:
          "UpCoach is a personal development app that combines voice journaling, habit tracking, and AI coaching. Simply record your thoughts through voice journals, track your daily habits, capture progress photos, and receive personalized AI insights to accelerate your growth journey.",
      },
      {
        question: "How does voice journaling work?",
        answer:
          "Just tap the record button and speak your thoughts naturally. Our AI automatically transcribes your voice, analyzes the content, and provides insights about patterns, emotions, and areas for growth. You can record unlimited entries with a Pro subscription.",
      },
      {
        question: "What makes UpCoach different from other habit trackers?",
        answer:
          "UpCoach uniquely combines voice journaling with habit tracking, progress photos, and AI insights. Our gamification features, streak tracking, and personalized coaching create an engaging experience that adapts to your journey. Plus, everything works offline!",
      },
    ],
  },
  {
    category: "Features & Usage",
    icon: Smartphone,
    faqs: [
      {
        question: "Can I use UpCoach offline?",
        answer:
          "Yes! UpCoach is designed offline-first. All features including voice recording, habit tracking, and progress photos work without internet. Your data automatically syncs when you're back online, ensuring you never lose progress.",
      },
      {
        question: "How do progress photos work?",
        answer:
          "Capture photos to visually track your transformation. The app organizes them chronologically and provides side-by-side comparisons. You can create different galleries for various goals (fitness, projects, etc.) and all photos are stored privately on your device.",
      },
      {
        question: "What types of habits can I track?",
        answer:
          "Track any habit! We support four types: simple check-offs (meditation), count-based (glasses of water), time-based (exercise duration), and value-based (weight, mood score). Each habit can have custom reminders and targets.",
      },
    ],
  },
  {
    category: "Privacy & Security",
    icon: Shield,
    faqs: [
      {
        question: "Is my voice journal data private?",
        answer:
          "Absolutely. Your voice recordings and transcriptions are encrypted and stored securely. We never share your personal data with third parties. You have full control to export or delete your data at any time.",
      },
      {
        question: "Where is my data stored?",
        answer:
          "Your data is stored locally on your device first, then securely backed up to our encrypted cloud servers. Voice recordings can be kept locally only if you prefer. We use bank-level encryption for all data transfers.",
      },
    ],
  },
  {
    category: "Subscription & Billing",
    icon: CreditCard,
    faqs: [
      {
        question: "What's included in the free version?",
        answer:
          "The free Starter plan includes 5 voice journals per day, tracking for up to 3 habits, 10 progress photos, basic AI insights, and full offline functionality. It's perfect for trying out UpCoach!",
      },
      {
        question: "Can I cancel my subscription anytime?",
        answer:
          "Yes! You can cancel anytime from your account settings. You'll continue to have Pro access until the end of your billing period. No questions asked, no cancellation fees.",
      },
      {
        question: "Is there a free trial?",
        answer:
          "Yes! We offer a 7-day free trial of Pro features. You won't be charged until the trial ends, and you can cancel anytime during the trial period.",
      },
    ],
  },
];

export default function FAQ() {
  const [openCategory, setOpenCategory] = useState<number>(0);
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggleFAQ = (categoryIndex: number, faqIndex: number) => {
    const key = `${categoryIndex}-${faqIndex}`;
    const isOpening = openIndex !== key;
    setOpenIndex(isOpening ? key : null);

    // Track FAQ expansion
    if (isOpening) {
      const question = faqCategories[categoryIndex].faqs[faqIndex].question;
      trackFAQExpand(question);
    }
  };

  return (
    <section id="faq" className="py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">
            FAQ
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 mt-2">
            Got Questions?
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600">
              {" "}
              We've Got Answers
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to know about UpCoach and how it can transform
            your personal development journey.
          </p>
        </motion.div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {faqCategories.map((category, index) => {
            const Icon = category.icon;
            return (
              <motion.button
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onClick={() => setOpenCategory(index)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                  openCategory === index
                    ? "bg-primary-600 text-white shadow-lg"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                <Icon className="w-5 h-5" />
                {category.category}
              </motion.button>
            );
          })}
        </div>

        {/* FAQ Items */}
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={openCategory}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {faqCategories[openCategory].faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="mb-4"
                >
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
                    <button
                      onClick={() => toggleFAQ(openCategory, index)}
                      className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-semibold text-gray-900 pr-4 text-lg">
                        {faq.question}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${
                          openIndex === `${openCategory}-${index}`
                            ? "rotate-180"
                            : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {openIndex === `${openCategory}-${index}` && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                          <div className="px-6 pb-5 text-gray-600 leading-relaxed">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Contact Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-3xl p-12 max-w-2xl mx-auto">
            <MessageCircle className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Still have questions?
            </h3>
            <p className="text-gray-600 mb-6">
              Our support team is here to help. Get in touch and we'll respond
              as soon as we can.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@upcoach.app"
                className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors duration-300"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Contact Support
              </a>
              <a
                href="/help"
                className="inline-flex items-center px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-colors duration-300"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Visit Help Center
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
