import { MessageSquare, Phone, MapPin, Clock, Users } from 'lucide-react';
import { Metadata } from 'next';

import ContactForm from '@/components/forms/ContactForm';
import NewsletterForm from '@/components/forms/NewsletterForm';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    "Get in touch with the UpCoach team. We're here to help you transform your professional development journey.",
  openGraph: {
    title: 'Contact UpCoach - Get in Touch',
    description:
      "Have questions about UpCoach? We'd love to hear from you. Contact our team for support, partnerships, or general inquiries.",
  },
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Get in Touch with
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600">
                {' '}
                UpCoach
              </span>
            </h1>
            <p className="text-xl text-gray-600">
              Have questions? Need help? We're here for you. Reach out and let's start a
              conversation.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <ContactForm variant="full" />
        </div>
      </section>

      {/* Contact Options */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Other Ways to Reach Us
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Phone Support</h3>
              <p className="text-gray-600 mb-4">Talk to our support team</p>
              <p className="font-medium text-primary-600">1-800-UPCOACH</p>
              <p className="text-sm text-gray-500 mt-2">Mon-Fri, 9am-6pm EST</p>
            </div>

            <div className="bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-secondary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-secondary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Live Chat</h3>
              <p className="text-gray-600 mb-4">Chat with our team in real-time</p>
              <button className="px-6 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors">
                Start Chat
              </button>
              <p className="text-sm text-gray-500 mt-2">Average response: 2 min</p>
            </div>

            <div className="bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Community</h3>
              <p className="text-gray-600 mb-4">Join our vibrant community</p>
              <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Join Discord
              </button>
              <p className="text-sm text-gray-500 mt-2">25,000+ members</p>
            </div>
          </div>
        </div>
      </section>

      {/* Office Locations */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Our Offices</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Headquarters</h3>
                  <p className="text-gray-600">
                    123 Innovation Drive
                    <br />
                    San Francisco, CA 94105
                    <br />
                    United States
                  </p>
                  <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>Mon-Fri, 9am-6pm PST</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-secondary-50 to-primary-50 rounded-2xl p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-secondary-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">European Office</h3>
                  <p className="text-gray-600">
                    456 Tech Park
                    <br />
                    London, EC2A 4BX
                    <br />
                    United Kingdom
                  </p>
                  <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>Mon-Fri, 9am-6pm GMT</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What's the best way to reach support?
              </h3>
              <p className="text-gray-600">
                For the fastest response, use our live chat feature available in the app and on our
                website. For complex issues, email support@upcoach.ai with detailed information.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Do you offer enterprise solutions?
              </h3>
              <p className="text-gray-600">
                Yes! We offer custom enterprise solutions for teams of 50+ users. Contact our
                enterprise team at enterprise@upcoach.ai to discuss your needs.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I schedule a product demo?
              </h3>
              <p className="text-gray-600">
                Absolutely! Fill out the contact form above and select "Product Demo" as your
                inquiry type. Our team will reach out within 24 hours to schedule a personalized
                demo.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Are you hiring?</h3>
              <p className="text-gray-600">
                We're always looking for talented individuals to join our team! Check out our
                careers page at upcoach.ai/careers or email jobs@upcoach.ai.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <NewsletterForm variant="hero" />
        </div>
      </section>
    </main>
  );
}
