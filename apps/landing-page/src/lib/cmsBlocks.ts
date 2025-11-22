const CMS_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.API_BASE_URL ||
  'http://localhost:3001';

type PublicResponse<T> = {
  data: T[];
  locale: string;
  variant: string;
};

async function fetchPublic<T>(path: string, locale: string, variant: string): Promise<PublicResponse<T>> {
  const url = new URL(`${CMS_BASE_URL}${path}`);
  url.searchParams.set('locale', locale);
  url.searchParams.set('variant', variant);

  const response = await fetch(url.toString(), {
    next: {
      revalidate: 60,
      tags: ['landing-content'],
    },
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch CMS blocks from ${url}`);
  }

  return response.json();
}

export async function getHeroBlock(locale = 'en-US', variant = 'default') {
  const result = await fetchPublic<{ content: Record<string, unknown> }>('/api/public/landing/hero', locale, variant);
  return result.data[0]?.content ?? null;
}

export async function getFeatureBlocks(locale = 'en-US', variant = 'default') {
  const result = await fetchPublic<{ content: Record<string, unknown> }>('/api/public/landing/sections', locale, variant);
  return result.data.map(entry => entry.content);
}

export async function getPricingTiers(locale = 'en-US', variant = 'default') {
  const result = await fetchPublic<{ content: Record<string, unknown> }>('/api/public/landing/pricing', locale, variant);
  return result.data.map(entry => ({ ...entry.content, metadata: entry.metadata }));
}

export async function getTestimonials(locale = 'en-US', variant = 'default') {
  const result = await fetchPublic<{ content: Record<string, unknown> }>('/api/public/landing/testimonials', locale, variant);
  return result.data.map(entry => entry.content);
}

export async function getCtaBlocks(locale = 'en-US', variant = 'default') {
  const result = await fetchPublic<{ content: Record<string, unknown> }>('/api/public/landing/cta', locale, variant);
  return result.data.map(entry => entry.content);
}

export type BlogCardContent = {
  key?: string;
  title?: string;
  summary?: string;
  author?: string;
  publishDate?: string;
  tags?: string[];
  coverImage?: string;
  ctaLabel?: string;
  ctaUrl?: string;
};

export async function getBlogCards(locale = 'en-US', variant = 'default'): Promise<BlogCardContent[]> {
  const result = await fetchPublic<{ key: string; content: Record<string, unknown> }>('/api/public/landing/blog-cards', locale, variant);
  return result.data.map(entry => {
    const content = entry.content as BlogCardContent;
    return {
      key: (entry as Record<string, unknown>).key ?? content.title ?? 'blog-card',
      ...content,
      tags: Array.isArray(content.tags) ? content.tags : [],
    };
  });
}

export type ComparisonTableContent = {
  title?: string;
  subtitle?: string;
  columns?: Array<{ label: string; highlighted?: boolean; badge?: string }>;
  features?: Array<{ feature: string; values: Array<{ value: string; icon?: string }> }>;
  ctaLabel?: string;
  ctaUrl?: string;
};

export async function getComparisonTables(locale = 'en-US', variant = 'default'): Promise<ComparisonTableContent[]> {
  const result = await fetchPublic<{ content: Record<string, unknown> }>('/api/public/landing/comparisons', locale, variant);
  return result.data.map(entry => entry.content as ComparisonTableContent);
}

