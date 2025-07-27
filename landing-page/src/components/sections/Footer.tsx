'use client';

import Link from 'next/link';
import { Twitter, Linkedin, Youtube, Mail } from 'lucide-react';
import NewsletterForm from '@/components/forms/NewsletterForm';

const footerLinks = {
  Product: [
    { name: 'Features', href: '#features' },
    { name: 'How it Works', href: '#how-it-works' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Demo', href: '#demo' }
  ],
  Company: [
    { name: 'About Us', href: '/about' },
    { name: 'Careers', href: '/careers' },
    { name: 'Blog', href: '/blog' },
    { name: 'Press', href: '/press' }
  ],
  Support: [
    { name: 'Help Center', href: '/help' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'API Documentation', href: '/api-docs' },
    { name: 'Status', href: '/status' }
  ],
  Legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Cookie Policy', href: '/cookies' },
    { name: 'Security', href: '/security' }
  ]
};

const socialLinks = [
  { name: 'Twitter', icon: Twitter, href: 'https://twitter.com/upcoach' },
  { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com/company/upcoach' },
  { name: 'YouTube', icon: Youtube, href: 'https://youtube.com/@upcoach' },
  { name: 'Email', icon: Mail, href: 'mailto:hello@upcoach.ai' }
];

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        {/* Newsletter Section */}
        <div className="border-b border-gray-800 pb-12 mb-12">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-white mb-4">
              Stay Ahead of the Curve
            </h3>
            <p className="text-gray-400 mb-6">
              Get weekly insights on productivity, AI coaching tips, and exclusive updates.
            </p>
            <div className="max-w-md mx-auto">
              <NewsletterForm variant="inline" />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Logo and description */}
          <div className="col-span-2">
            <div className="mb-4">
              <h3 className="text-2xl font-bold text-white">UpCoach</h3>
              <p className="text-purple-400 text-sm">AI-Powered Coaching</p>
            </div>
            <p className="text-gray-400 mb-6 max-w-sm">
              Transform your professional development with personalized AI coaching that helps you achieve your goals faster.
            </p>
            
            {/* App Store Badges */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Link
                href="https://apps.apple.com/app/upcoach"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <img 
                  src="/app-store-badge.svg" 
                  alt="Download on the App Store" 
                  className="h-10"
                />
              </Link>
              <Link
                href="https://play.google.com/store/apps/details?id=com.upcoach.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <img 
                  src="/google-play-badge.svg" 
                  alt="Get it on Google Play" 
                  className="h-10"
                />
              </Link>
            </div>
            
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label={social.name}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>
          
          {/* Links sections */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-white mb-4">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        {/* Bottom section */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2024 UpCoach. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="/cookies" className="text-gray-400 hover:text-white transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 