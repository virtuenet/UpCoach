import React from 'react';

type Highlight = {
  id: string;
  title: string;
  summary: string;
  metricLabel: string;
  metricValue: string;
};

interface ProgressTheaterProps {
  highlights: Highlight[];
}

export function ProgressTheater({ highlights }: ProgressTheaterProps) {
  if (!highlights.length) {
    return null;
  }

  return (
    <section className="py-20 bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400">
              Progress Theater
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Highlights worth sharing
            </h2>
            <p className="mt-2 text-base text-slate-300">
              UpCoach turns anonymous usage into anonymized wins teams can celebrate.
            </p>
          </div>
          <a
            href="#"
            className="inline-flex items-center rounded-full border border-indigo-400 px-5 py-2 text-sm font-semibold text-indigo-100 hover:bg-indigo-500/10"
          >
            See success stories
            <svg className="ml-2 h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.5 5.5l5 5-5 5M19.5 10.5h-11" />
            </svg>
          </a>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {highlights.map(highlight => (
            <article
              key={highlight.id}
              className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/0 p-6 shadow-xl backdrop-blur"
            >
              <p className="text-sm font-medium uppercase tracking-wide text-indigo-300">
                {highlight.title}
              </p>
              <p className="mt-3 text-lg font-semibold">{highlight.summary}</p>
              <div className="mt-6 rounded-xl bg-white/5 p-4">
                <p className="text-xs uppercase tracking-wide text-white/60">
                  {highlight.metricLabel}
                </p>
                <p className="mt-1 text-3xl font-semibold text-white">{highlight.metricValue}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

