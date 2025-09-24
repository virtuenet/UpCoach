import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Save, ArrowLeft, Eye, Settings } from 'lucide-react';
import DOMPurify from 'isomorphic-dompurify';
import RichTextEditor from '../components/RichTextEditor';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { contentApi } from '../api/content';

const contentSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be less than 200 characters'),
  excerpt: z
    .string()
    .min(20, 'Excerpt must be at least 20 characters')
    .max(500, 'Excerpt must be less than 500 characters'),
  content: z.string().min(100, 'Content must be at least 100 characters'),
  categoryId: z.string().min(1, 'Please select a category'),
  tags: z.string().min(1, 'Please add at least one tag'),
  status: z.enum(['draft', 'published']),
  featuredImage: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  seoTitle: z.string().max(60, 'SEO title must be 60 characters or less').optional(),
  seoDescription: z.string().max(160, 'SEO description must be 160 characters or less').optional(),
  allowComments: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

type ContentFormData = z.infer<typeof contentSchema>;

export default function CreateContentPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'settings'>('content');
  const [preview, setPreview] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    setValue: _setValue,
  } = useForm<ContentFormData>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      status: 'draft',
      categoryId: '',
      allowComments: true,
      isFeatured: false,
    },
  });

  // Fetch categories
  const { data: categories = [], isPending: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: contentApi.getCategories,
  });

  const createMutation = useMutation({
    mutationFn: contentApi.createArticle,
    onSuccess: (data: any) => {
      toast('Article created successfully!', { type: 'success' });
      navigate(`/content/edit/${data.id}`);
    },
    onError: (error: any) => {
      toast(error instanceof Error ? error.message : 'Failed to create article', { type: 'error' });
    },
  });

  const onSubmit = async (data: ContentFormData) => {
    setIsSubmitting(true);
    try {
      const tags = data.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean);

      const articleData = {
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        categoryId: data.categoryId,
        status: data.status,
        featuredImage: data.featuredImage || undefined,
        seoTitle: data.seoTitle || undefined,
        seoDescription: data.seoDescription || undefined,
        seoKeywords: tags,
        settings: {
          allowComments: data.allowComments ?? true,
          enableNotifications: true,
          isFeatured: data.isFeatured ?? false,
          isTemplate: false,
        },
      };

      await createMutation.mutateAsync(articleData);
    } catch (error) {
      console.error('Error creating article:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const watchedContent = watch(['title', 'excerpt', 'content']);
  const estimatedReadTime = Math.ceil((watchedContent[2] || '').split(/\s+/).length / 200);

  if (preview) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => setPreview(false)}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Editor
          </button>
          <div className="text-sm text-gray-500">Preview Mode • {estimatedReadTime} min read</div>
        </div>

        <article className="bg-white rounded-lg shadow p-8">
          <header className="mb-8">
            {watchedContent[0] && (
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{watchedContent[0]}</h1>
            )}
            {watchedContent[1] && (
              <p className="text-xl text-gray-600 leading-relaxed">{watchedContent[1]}</p>
            )}
          </header>
          {watchedContent[2] && (
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(watchedContent[2], {
                  ALLOWED_TAGS: [
                    'p',
                    'br',
                    'strong',
                    'em',
                    'u',
                    'i',
                    'b',
                    'h1',
                    'h2',
                    'h3',
                    'h4',
                    'h5',
                    'h6',
                    'ul',
                    'ol',
                    'li',
                    'blockquote',
                    'code',
                    'pre',
                    'a',
                    'img',
                    'table',
                    'thead',
                    'tbody',
                    'tr',
                    'td',
                    'th',
                  ],
                  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id'],
                  FORBID_TAGS: ['script', 'style', 'iframe', 'form'],
                  FORBID_ATTR: ['onerror', 'onload', 'onclick'],
                }),
              }}
            />
          )}
        </article>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/content')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Content
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Create New Article</h1>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setPreview(true)}
                className="flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
              >
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </button>
              <div className="text-sm text-gray-500">{estimatedReadTime} min read</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'content', name: 'Content', icon: null },
              { id: 'seo', name: 'SEO', icon: null },
              { id: 'settings', name: 'Settings', icon: Settings },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`${
                  activeTab === tab.id
                    ? 'border-secondary-500 text-secondary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                {tab.icon && <tab.icon className="h-4 w-4 mr-2" />}
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Content Tab */}
          {activeTab === 'content' && (
            <>
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('title')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500"
                  placeholder="Enter article title"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Excerpt <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('excerpt')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500"
                  placeholder="Brief description of the article"
                />
                {errors.excerpt && (
                  <p className="mt-1 text-sm text-red-600">{errors.excerpt.message}</p>
                )}
              </div>

              {/* Category and Tags Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  {categoriesLoading ? (
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                      Loading categories...
                    </div>
                  ) : (
                    <select
                      {...register('categoryId')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500"
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat: any) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.categoryId && (
                    <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('tags')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500"
                    placeholder="productivity, leadership, goals"
                  />
                  {errors.tags && (
                    <p className="mt-1 text-sm text-red-600">{errors.tags.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Separate tags with commas</p>
                </div>
              </div>

              {/* Featured Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Featured Image
                </label>
                <input
                  {...register('featuredImage')}
                  type="url"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500"
                  placeholder="https://example.com/image.jpg"
                />
                {errors.featuredImage && (
                  <p className="mt-1 text-sm text-red-600">{errors.featuredImage.message}</p>
                )}
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="content"
                  control={control}
                  render={({ field }) => (
                    <RichTextEditor content={field.value} onChange={field.onChange} />
                  )}
                />
                {errors.content && (
                  <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
                )}
              </div>
            </>
          )}

          {/* SEO Tab */}
          {activeTab === 'seo' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SEO Title</label>
                <input
                  {...register('seoTitle')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500"
                  placeholder="Optimized title for search engines"
                />
                {errors.seoTitle && (
                  <p className="mt-1 text-sm text-red-600">{errors.seoTitle.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Recommended: 50-60 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SEO Description
                </label>
                <textarea
                  {...register('seoDescription')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500"
                  placeholder="Brief description for search engine results"
                />
                {errors.seoDescription && (
                  <p className="mt-1 text-sm text-red-600">{errors.seoDescription.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Recommended: 150-160 characters</p>
              </div>
            </>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    {...register('allowComments')}
                    type="checkbox"
                    className="rounded border-gray-300 text-secondary-600 focus:ring-secondary-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Allow comments on this article
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    {...register('isFeatured')}
                    type="checkbox"
                    className="rounded border-gray-300 text-secondary-600 focus:ring-secondary-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">Mark as featured article</label>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div>
              <label className="flex items-center">
                <input
                  {...register('status')}
                  type="checkbox"
                  value="published"
                  className="rounded border-gray-300 text-secondary-600 focus:ring-secondary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Publish immediately</span>
              </label>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => navigate('/content')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-secondary-600 rounded-lg hover:bg-secondary-700 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Article
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
