import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, Globe, Wand2, RefreshCcw, Trash2, UploadCloud } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { landingBlocksApi, LandingBlockType, RemoteCopyType } from '../api/landingBlocks';
import toast from 'react-hot-toast';

type BlockPickerOption = {
  label: string;
  value: LandingBlockType | RemoteCopyType;
  description: string;
};

const BLOCK_OPTIONS: BlockPickerOption[] = [
  { label: 'Hero & Sections', value: 'sections', description: 'Hero, feature and modular page sections' },
  { label: 'CTA Blocks', value: 'cta-blocks', description: 'Primary and secondary call-to-action modules' },
  { label: 'Pricing Tiers', value: 'pricing-tiers', description: 'Product tiers, billing intervals, currency' },
  { label: 'Testimonials', value: 'testimonials', description: 'Quote cards and success stories' },
  { label: 'Blog Cards', value: 'blog-cards', description: 'Curated blog/news cards with CTA links' },
  { label: 'Feature Comparisons', value: 'comparison-tables', description: 'Feature matrices comparing plans' },
  { label: 'Remote Copy (Mobile/Web)', value: 'remote-copy', description: 'String tables for landing + mobile apps' },
];

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  scheduled: 'bg-amber-100 text-amber-800',
  published: 'bg-emerald-100 text-emerald-800',
  archived: 'bg-slate-100 text-slate-500',
};

const DEFAULT_CONTENT = {
  headline: 'Untitled block',
  body: 'Add descriptive copy here',
};

const INITIAL_BLOCK_STATE = {
  key: '',
  namespace: 'landing',
  value: '',
  content: JSON.stringify(DEFAULT_CONTENT, null, 2),
  status: 'draft',
  notes: '',
  order: 0,
  platform: 'shared',
};

const DEFAULT_BLOG_CONTENT = {
  title: 'Blog highlight',
  slug: 'blog-highlight',
  summary: 'Short description for the featured story.',
  author: 'Marketing Team',
  publishDate: new Date().toISOString().slice(0, 10),
  tags: ['coaching', 'news'],
  coverImage: '',
  ctaLabel: 'Read more',
  ctaUrl: 'https://example.com/blog',
};

const DEFAULT_COMPARISON_CONTENT = {
  title: 'Compare plans',
  subtitle: 'See what fits best',
  columns: [
    { label: 'Basic', highlighted: false },
    { label: 'Pro', highlighted: true, badge: 'Most Popular' },
  ],
  features: [
    {
      feature: 'Voice Journals',
      values: [{ value: '10/mo' }, { value: 'Unlimited' }],
    },
    {
      feature: 'AI Insights',
      values: [{ value: 'Basic' }, { value: 'Advanced', icon: 'sparkles' }],
    },
  ],
  ctaLabel: 'Start free trial',
  ctaUrl: '#pricing',
};

type ComparisonFormState = typeof DEFAULT_COMPARISON_CONTENT & {
  columnsText: string;
  featuresText: string;
};

function formatDate(value?: string) {
  if (!value) return '--';
  return new Date(value).toLocaleString();
}

export default function LandingExperiencePage() {
  const [blockType, setBlockType] = useState<BlockPickerOption>(BLOCK_OPTIONS[0]);
  const [locale, setLocale] = useState('en-US');
  const [variant, setVariant] = useState('default');
  const [showComposer, setShowComposer] = useState(false);
  const [formState, setFormState] = useState(() => ({ ...INITIAL_BLOCK_STATE }));
  const [blogFields, setBlogFields] = useState(DEFAULT_BLOG_CONTENT);
  const [comparisonFields, setComparisonFields] = useState<ComparisonFormState>({
    ...DEFAULT_COMPARISON_CONTENT,
    columnsText: 'Basic|false|\nPro|true|Most Popular',
    featuresText: JSON.stringify(DEFAULT_COMPARISON_CONTENT.features, null, 2),
  });

  const queryClient = useQueryClient();
  const syncBlogContent = useCallback((payload: typeof DEFAULT_BLOG_CONTENT) => {
    setBlogFields(payload);
    setFormState(prev => ({
      ...prev,
      content: JSON.stringify(
        {
          ...payload,
          tags: payload.tags ?? [],
        },
        null,
        2
      ),
    }));
  }, []);
  const closeComposer = () => {
    setShowComposer(false);
    setFormState({ ...INITIAL_BLOCK_STATE });
  };

  useEffect(() => {
    if (!showComposer) return;
    if (blockType.value === 'blog-cards') {
      syncBlogContent(DEFAULT_BLOG_CONTENT);
    } else if (blockType.value === 'comparison-tables') {
      const defaults = {
        ...DEFAULT_COMPARISON_CONTENT,
        columnsText: 'Basic|false|\nPro|true|Most Popular',
        featuresText: JSON.stringify(DEFAULT_COMPARISON_CONTENT.features, null, 2),
      };
      setComparisonFields(defaults);
      setFormState(prev => ({
        ...prev,
        content: JSON.stringify(DEFAULT_COMPARISON_CONTENT, null, 2),
      }));
    }
  }, [blockType.value, showComposer, syncBlogContent]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['landing-blocks', blockType.value, locale, variant],
    queryFn: () =>
      landingBlocksApi
        .list(blockType.value, { locale, variant })
        .then(response => response.data),
  });

  const createMutation = useMutation({
    mutationFn: () => {
      const payload = buildPayload(formState, blockType.value, locale, variant);
      return landingBlocksApi.create(blockType.value, payload);
    },
    onSuccess: () => {
      toast.success('Block created');
      closeComposer();
      queryClient.invalidateQueries({ queryKey: ['landing-blocks', blockType.value, locale, variant] });
    },
    onError: () => toast.error('Failed to create block'),
  });

  const publishMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => landingBlocksApi.publish(blockType.value, id),
    onSuccess: () => {
      toast.success('Block published');
      queryClient.invalidateQueries({ queryKey: ['landing-blocks', blockType.value, locale, variant] });
    },
    onError: () => toast.error('Failed to publish block'),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => landingBlocksApi.remove(blockType.value, id),
    onSuccess: () => {
      toast.success('Block deleted');
      queryClient.invalidateQueries({ queryKey: ['landing-blocks', blockType.value, locale, variant] });
    },
    onError: () => toast.error('Failed to delete block'),
  });

  const selectedDescription = useMemo(
    () => BLOCK_OPTIONS.find(option => option.value === blockType.value)?.description,
    [blockType.value]
  );

  const blocks = data?.data ?? [];

  return (
    <div className="space-y-6 pb-10">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Omni-channel experience</p>
          <h1 className="text-3xl font-semibold text-gray-900 mt-1">Landing & Mobile Content</h1>
          <p className="text-gray-500 mt-1 max-w-2xl">
            Localized sections, CTA blocks, pricing tables, testimonials, and remote copy strings to power
            the Next.js landing site and Flutter apps without redeploys.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => {
              setFormState({
                ...INITIAL_BLOCK_STATE,
                namespace: blockType.value === 'remote-copy' ? 'mobile' : 'landing',
              });
              setShowComposer(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            New Block
          </button>
        </div>
      </header>

      <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Block type</label>
            <select
              value={blockType.value}
              onChange={event => {
                const next = BLOCK_OPTIONS.find(option => option.value === event.target.value as typeof blockType.value);
                if (next) {
                  setBlockType(next);
                  setShowComposer(false);
                }
              }}
              className="mt-1 w-full rounded-lg border-gray-300 focus:ring-secondary-500 focus:border-secondary-500"
            >
              {BLOCK_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">{selectedDescription}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
              Locale <Globe className="h-3 w-3" />
            </label>
            <input
              value={locale}
              onChange={event => setLocale(event.target.value)}
              className="mt-1 w-full rounded-lg border-gray-300 focus:ring-secondary-500 focus:border-secondary-500"
              placeholder="en-US"
            />
            <p className="text-xs text-gray-500 mt-1">Locale code (ISO 639-1 + region)</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
              Variant <Wand2 className="h-3 w-3" />
            </label>
            <input
              value={variant}
              onChange={event => setVariant(event.target.value)}
              className="mt-1 w-full rounded-lg border-gray-300 focus:ring-secondary-500 focus:border-secondary-500"
              placeholder="default, experiment-a"
            />
            <p className="text-xs text-gray-500 mt-1">Support A/B experiments or tenant overrides</p>
          </div>
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">{blockType.label}</p>
            <p className="text-xs text-gray-500">
              Showing {blocks.length} block{blocks.length === 1 ? '' : 's'} — locale {locale}, variant {variant}
            </p>
          </div>
          <span className="text-xs text-gray-400">Auto-preview hooks landing + mobile pipelines</span>
        </div>

        {isLoading ? (
          <div className="py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Key</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Locale</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Version</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Updated</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {blocks.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-6 text-center text-gray-500 text-sm">
                      No blocks yet. Create your first record to power the experience.
                    </td>
                  </tr>
                )}
                {blocks.map((block: any) => (
                  <tr key={block.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{block.key}</p>
                      {block.notes && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{block.notes}</p>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{block.locale}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{block.variant}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          STATUS_COLORS[block.status] ?? 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {block.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{block.version}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(block.updatedAt)}</td>
                    <td className="px-6 py-4 text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => publishMutation.mutate({ id: block.id })}
                          className="inline-flex items-center px-3 py-1 text-xs border border-emerald-200 text-emerald-700 rounded-full hover:bg-emerald-50 disabled:opacity-50"
                          disabled={publishMutation.isLoading}
                        >
                          <UploadCloud className="h-3.5 w-3.5 mr-1" />
                          Publish
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate({ id: block.id })}
                          className="inline-flex items-center px-3 py-1 text-xs border border-red-200 text-red-600 rounded-full hover:bg-red-50 disabled:opacity-50"
                          disabled={deleteMutation.isLoading}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showComposer && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-30">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Create {blockType.label}</h2>
                <p className="text-sm text-gray-500">
                  Define localized copy, metadata, ordering, and scheduling for this block.
                </p>
              </div>
              <button
                onClick={() => closeComposer()}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Key</label>
                <input
                  value={formState.key}
                  onChange={event => setFormState(prev => ({ ...prev, key: event.target.value }))}
                  className="mt-1 w-full rounded-lg border-gray-300 focus:ring-secondary-500 focus:border-secondary-500"
                  placeholder="hero.primary"
                />
              </div>

              {blockType.value === 'remote-copy' && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Namespace</label>
                  <input
                    value={formState.namespace}
                    onChange={event => setFormState(prev => ({ ...prev, namespace: event.target.value }))}
                    className="mt-1 w-full rounded-lg border-gray-300 focus:ring-secondary-500 focus:border-secondary-500"
                    placeholder="mobile.home"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <select
                  value={formState.status}
                  onChange={event => setFormState(prev => ({ ...prev, status: event.target.value }))}
                  className="mt-1 w-full rounded-lg border-gray-300 focus:ring-secondary-500 focus:border-secondary-500"
                >
                  {['draft', 'scheduled', 'published', 'archived'].map(statusValue => (
                    <option key={statusValue} value={statusValue}>
                      {statusValue}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Display order</label>
                <input
                  type="number"
                  value={formState.order}
                  onChange={event => setFormState(prev => ({ ...prev, order: Number(event.target.value) }))}
                  className="mt-1 w-full rounded-lg border-gray-300 focus:ring-secondary-500 focus:border-secondary-500"
                />
              </div>
            </div>

            {blockType.value === 'remote-copy' ? (
              <div>
                <label className="text-sm font-medium text-gray-600">Value</label>
                <textarea
                  value={formState.value}
                  onChange={event => setFormState(prev => ({ ...prev, value: event.target.value }))}
                  className="mt-1 w-full rounded-lg border-gray-300 focus:ring-secondary-500 focus:border-secondary-500"
                  rows={3}
                />
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-600">Content (JSON)</label>
                  <button
                    onClick={() =>
                      setFormState(prev => ({
                        ...prev,
                        content: JSON.stringify(DEFAULT_CONTENT, null, 2),
                      }))
                    }
                    className="text-xs text-secondary-600 hover:text-secondary-700"
                  >
                    Reset template
                  </button>
                </div>
                <textarea
                  value={formState.content}
                  onChange={event => setFormState(prev => ({ ...prev, content: event.target.value }))}
                  className="mt-1 w-full rounded-lg border-gray-300 font-mono text-xs focus:ring-secondary-500 focus:border-secondary-500"
                  rows={10}
                />
              </div>
            )}

            {blockType.value === 'blog-cards' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(['title', 'slug', 'summary', 'author', 'publishDate', 'coverImage'] as const).map(field => (
                  <div key={field}>
                    <label className="text-sm font-medium text-gray-600 capitalize">{field}</label>
                    <input
                      value={blogFields[field]}
                      onChange={event => {
                        const updated = { ...blogFields, [field]: event.target.value };
                        syncBlogContent(updated);
                      }}
                      className="mt-1 w-full rounded-lg border-gray-300 focus:ring-secondary-500 focus:border-secondary-500"
                    />
                  </div>
                ))}
                <div>
                  <label className="text-sm font-medium text-gray-600">Tags (comma separated)</label>
                  <input
                    value={blogFields.tags.join(', ')}
                    onChange={event => {
                      const tags = event.target.value
                        .split(',')
                        .map(tag => tag.trim())
                        .filter(Boolean);
                      const updated = { ...blogFields, tags };
                      syncBlogContent(updated);
                    }}
                    className="mt-1 w-full rounded-lg border-gray-300 focus:ring-secondary-500 focus:border-secondary-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">CTA Label</label>
                  <input
                    value={blogFields.ctaLabel}
                    onChange={event => {
                      const updated = { ...blogFields, ctaLabel: event.target.value };
                      syncBlogContent(updated);
                    }}
                    className="mt-1 w-full rounded-lg border-gray-300 focus:ring-secondary-500 focus:border-secondary-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">CTA URL</label>
                  <input
                    value={blogFields.ctaUrl}
                    onChange={event => {
                      const updated = { ...blogFields, ctaUrl: event.target.value };
                      syncBlogContent(updated);
                    }}
                    className="mt-1 w-full rounded-lg border-gray-300 focus:ring-secondary-500 focus:border-secondary-500"
                  />
                </div>
              </div>
            )}

            {blockType.value === 'comparison-tables' && (
              <div className="space-y-4">
                {(['title', 'subtitle', 'ctaLabel', 'ctaUrl'] as const).map(field => (
                  <div key={field}>
                    <label className="text-sm font-medium text-gray-600 capitalize">{field}</label>
                    <input
                      value={(comparisonFields as Record<string, string>)[field] ?? ''}
                      onChange={event => {
                        const updated = { ...comparisonFields, [field]: event.target.value };
                        setComparisonFields(updated);
                        const payload = buildComparisonPayload(updated);
                        setFormState(prev => ({
                          ...prev,
                          content: JSON.stringify(payload, null, 2),
                        }));
                      }}
                      className="mt-1 w-full rounded-lg border-gray-300 focus:ring-secondary-500 focus:border-secondary-500"
                    />
                  </div>
                ))}
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Columns (one per line: Label|highlighted|badge)
                  </label>
                  <textarea
                    value={comparisonFields.columnsText}
                    onChange={event => {
                      const updated = { ...comparisonFields, columnsText: event.target.value };
                      setComparisonFields(updated);
                      const payload = buildComparisonPayload(updated);
                      setFormState(prev => ({
                        ...prev,
                        content: JSON.stringify(payload, null, 2),
                      }));
                    }}
                    rows={3}
                    className="mt-1 w-full rounded-lg border-gray-300 focus:ring-secondary-500 focus:border-secondary-500 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Features JSON</label>
                  <textarea
                    value={comparisonFields.featuresText}
                    onChange={event => {
                      const updated = { ...comparisonFields, featuresText: event.target.value };
                      setComparisonFields(updated);
                      const payload = buildComparisonPayload(updated);
                      setFormState(prev => ({
                        ...prev,
                        content: JSON.stringify(payload, null, 2),
                      }));
                    }}
                    rows={6}
                    className="mt-1 w-full rounded-lg border-gray-300 focus:ring-secondary-500 focus:border-secondary-500 font-mono text-xs"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Provide an array like {`[{ "feature": "Storage", "values": [{ "value": "5GB" }] }]`}
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-600">Notes</label>
              <textarea
                value={formState.notes}
                onChange={event => setFormState(prev => ({ ...prev, notes: event.target.value }))}
                className="mt-1 w-full rounded-lg border-gray-300 focus:ring-secondary-500 focus:border-secondary-500"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-gray-500">
                Content is saved as JSON to support localized layouts, AB tests, and scheduling metadata.
              </p>
              <div className="space-x-3">
                <button
                  onClick={closeComposer}
                  onClick={closeComposer}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isLoading || !formState.key}
                  className="px-4 py-2 rounded-lg bg-secondary-600 text-white hover:bg-secondary-700 disabled:opacity-50"
                >
                  {createMutation.isLoading ? 'Saving...' : 'Save block'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function buildPayload(
  formState: typeof INITIAL_BLOCK_STATE,
  blockType: LandingBlockType | RemoteCopyType,
  locale: string,
  variant: string
) {
  if (blockType === 'remote-copy') {
    const payload = {
      key: formState.key,
      locale,
      variant,
      status: formState.status,
      order: formState.order,
      namespace: formState.namespace,
      value: formState.value,
      platform: formState.platform,
      notes: formState.notes,
      metadata: {},
    };
    return payload;
  }

  let parsedContent: Record<string, unknown> = {};
  try {
    parsedContent = JSON.parse(formState.content || '{}');
  } catch {
    parsedContent = DEFAULT_CONTENT;
  }

  return {
    key: formState.key,
    locale,
    variant,
    status: formState.status,
    order: formState.order,
    content: parsedContent,
    metadata: {},
    notes: formState.notes,
  };
}

function buildComparisonPayload(fields: ComparisonFormState) {
  const columns = fields.columnsText
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [label, highlighted, badge] = line.split('|').map(part => part?.trim());
      return {
        label: label ?? '',
        highlighted: highlighted === 'true',
        badge: badge || undefined,
      };
    })
    .filter(column => column.label.length > 0);

  let parsedFeatures = DEFAULT_COMPARISON_CONTENT.features;
  try {
    const candidate = JSON.parse(fields.featuresText || '[]');
    if (Array.isArray(candidate)) {
      parsedFeatures = candidate;
    }
  } catch {
    parsedFeatures = DEFAULT_COMPARISON_CONTENT.features;
  }

  return {
    title: fields.title,
    subtitle: fields.subtitle,
    columns: columns.length > 0 ? columns : DEFAULT_COMPARISON_CONTENT.columns,
    features: parsedFeatures,
    ctaLabel: fields.ctaLabel,
    ctaUrl: fields.ctaUrl,
  };
}


