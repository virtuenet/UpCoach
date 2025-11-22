'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

import type { BlogCardContent } from '@/lib/cmsBlocks';

type Props = {
  cards?: BlogCardContent[];
};

export default function BlogHighlights({ cards = [] }: Props) {
  if (!cards.length) {
    return null;
  }

  return (
    <section id="blog" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">Insights</span>
          <h2 className="text-4xl font-bold text-gray-900 mt-2">From the UpCoach blog</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mt-3">
            Latest stories from our coaching and product teams.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cards.slice(0, 6).map(card => {
            const displayTitle = card.title ?? 'Untitled story';
            const displaySummary = card.summary ?? '';
            const displayAuthor = card.author ?? 'UpCoach Team';
            const ctaLabel = card.ctaLabel ?? 'Read more';
            return (
            <motion.article
              key={card.key ?? displayTitle}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="bg-gray-50 rounded-3xl overflow-hidden flex flex-col shadow-sm hover:shadow-lg transition-shadow"
            >
              {card.coverImage ? (
                <div className="relative h-48 w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card.coverImage}
                    alt={card.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-r from-primary-50 to-secondary-50" />
              )}

              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center text-xs uppercase tracking-wide text-primary-600 font-semibold gap-2">
                  {card.tags?.slice(0, 2).map(tag => (
                    <span key={tag} className="bg-primary-50 px-2 py-1 rounded-full text-primary-700">
                      {tag}
                    </span>
                  ))}
                  {card.publishDate && (
                    <span className="text-gray-500">{new Date(card.publishDate).toLocaleDateString()}</span>
                  )}
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-4">{displayTitle}</h3>
                <p className="text-gray-600 mt-3 flex-1">{displaySummary}</p>

                <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                  <span>{displayAuthor}</span>
                  {card.ctaUrl && (
                    <Link
                      href={card.ctaUrl}
                      className="text-primary-600 font-semibold hover:text-primary-700"
                    >
                      {ctaLabel}
                    </Link>
                  )}
                </div>
              </div>
            </motion.article>
          );
          })}
        </div>
      </div>
    </section>
  );
}

