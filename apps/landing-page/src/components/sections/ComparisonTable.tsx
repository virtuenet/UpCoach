'use client';

import { motion } from 'framer-motion';

import type { ComparisonTableContent } from '@/lib/cmsBlocks';

type Props = {
  comparison?: ComparisonTableContent | null;
};

export default function ComparisonTable({ comparison }: Props) {
  if (!comparison || !comparison.columns?.length || !comparison.features?.length) {
    return null;
  }

  const { columns, features } = comparison;

  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white" id="comparison">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">
            Feature comparison
          </span>
          <h2 className="text-4xl font-bold text-gray-900 mt-2">{comparison.title}</h2>
          {comparison.subtitle && <p className="text-gray-600 mt-3">{comparison.subtitle}</p>}
        </motion.div>

        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-3">
            <thead>
              <tr>
                <th className="text-left text-gray-500 text-sm px-4 py-2">Features</th>
                {columns.map(column => (
                  <th key={column.label} className="text-center px-4 py-2">
                    <div
                      className={`rounded-2xl px-6 py-4 ${
                        column.highlighted ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="font-semibold text-lg">{column.label}</p>
                      {column.badge && (
                        <span className="text-xs uppercase tracking-wide font-semibold">{column.badge}</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map(feature => (
                <tr key={feature.feature} className="bg-white shadow-sm rounded-2xl">
                  <td className="px-4 py-4 font-medium text-gray-900">{feature.feature}</td>
                  {columns.map((column, columnIndex) => {
                    const value = feature.values?.[columnIndex]?.value ?? '—';
                    return (
                      <td key={`${feature.feature}-${column.label}`} className="text-center px-4 py-4 text-gray-700">
                        {feature.values?.[columnIndex]?.icon ? (
                          <span className="inline-flex items-center gap-1 justify-center">
                            <span>{value}</span>
                            <span>{feature.values[columnIndex]?.icon}</span>
                          </span>
                        ) : (
                          value
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {comparison.ctaUrl && (
          <div className="text-center mt-12">
            <a
              href={comparison.ctaUrl}
              className="inline-flex items-center px-8 py-4 rounded-full bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
            >
              {comparison.ctaLabel ?? 'Choose plan'}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

