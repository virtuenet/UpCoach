import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, ArrowLeft, Eye, Trash2, Archive, Upload, Settings } from 'lucide-react';
import DOMPurify from 'isomorphic-dompurify';
import RichTextEditor from '../components/RichTextEditor';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { contentApi } from '../api/content';
import { format } from 'date-fns';

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

export default function EditContentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'settings' | 'analytics'>(
    'content'
  );
  const [preview, setPreview] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    // setValue,
    formState: { errors, isDirty },
    reset,
  } = useForm<ContentFormData>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      status: 'draft',
      categoryId: '',
      allowComments: true,
      isFeatured: false,
    },
  });

  // Fetch article data
  const {
    data: article,
    isPending: articleLoading,
    error,
  } = useQuery({
    queryKey: ['article', id],
    queryFn: () => contentApi.getArticle(id!, false),
    enabled: !!id,
  });

  // Populate form with article data when loaded
  useEffect(() => {
    if (article) {
      reset({
        title: article.title,
        excerpt: article.excerpt,
        content: article.content,
        categoryId: article.categoryId,
        tags: article.seoKeywords?.join(', ') || '',
        status: article.status as 'draft' | 'published',
        featuredImage: article.featuredImage || '',
        seoTitle: article.seoTitle || '',
        seoDescription: article.seoDescription || '',
        allowComments: article.settings?.allowComments ?? true,
        isFeatured: article.settings?.isFeatured ?? false,
      });
    }
  }, [article, reset]);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: contentApi.getCategories,
  });

  // Fetch analytics
  const { data: analytics } = useQuery({
    queryKey: ['article-analytics', id],
    queryFn: () => contentApi.getArticleAnalytics(id!),
    enabled: !!id && activeTab === 'analytics',
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => contentApi.updateArticle(id!, data),
    onSuccess: () => {
      toast.success('Article updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['article', id] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (error: any) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update article');
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => contentApi.publishArticle(id!),
    onSuccess: () => {
      toast.success('Article published successfully!');
      queryClient.invalidateQueries({ queryKey: ['article', id] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (error: any) => {
      toast.error(error instanceof Error ? error.message : 'Failed to publish article');
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => contentApi.archiveArticle(id!),
    onSuccess: () => {
      toast.success('Article archived successfully!');
      queryClient.invalidateQueries({ queryKey: ['article', id] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (error: any) => {
      toast.error(error instanceof Error ? error.message : 'Failed to archive article');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => contentApi.deleteArticle(id!),
    onSuccess: () => {
      toast.success('Article deleted successfully!');
      navigate('/content');
    },
    onError: (error: any) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete article');
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

      await updateMutation.mutateAsync(articleData);
    } catch (error) {
      console.error('Error updating article:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = () => {
    publishMutation.mutate();
  };

  const handleArchive = () => {
    if (window.confirm('Are you sure you want to archive this article?')) {
      archiveMutation.mutate();
    }
  };

  const handleDelete = () => {
    if (
      window.confirm('Are you sure you want to delete this article? This action cannot be undone.')
    ) {
      deleteMutation.mutate();
    }
  };

  const watchedContent = watch(['title', 'excerpt', 'content']);
  const estimatedReadTime = Math.ceil((watchedContent[2] || '').split(/\s+/).length / 200);

  if (articleLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-red-800">Article not found</h3>
          <p className="text-red-700 mt-2">
            The article you're looking for doesn't exist or you don't have permission to edit it.
          </p>
          <button
            onClick={() => navigate('/content')}
            className="mt-4 text-red-600 hover:text-red-500"
          >
            ← Back to Content
          </button>
        </div>
      </div>
    );
  }

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
            <div className="flex items-center space-x-4 mt-6 text-sm text-gray-500">
              <span>
                Published{' '}
                {format(new Date(article.publishedAt || article.createdAt), 'MMM d, yyyy')}
              </span>
              <span>•</span>
              <span>{estimatedReadTime} min read</span>
              <span>•</span>
              <span>{article.viewCount} views</span>
            </div>
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
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Edit Article</h1>
              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                <span>Created {format(new Date(article.createdAt), 'MMM d, yyyy')}</span>
                <span>•</span>
                <span>Updated {format(new Date(article.updatedAt), 'MMM d, yyyy')}</span>
                <span>•</span>
                <span>{article.viewCount} views</span>
              </div>
            </div>
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
              { id: 'analytics', name: 'Analytics', icon: null },
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

        {activeTab === 'analytics' ? (
          <div className="p-6">
            {analytics ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {analytics.analytics.totalViews}
                    </div>
                    <div className="text-sm text-blue-600">Total Views</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {analytics.analytics.uniqueUsers}
                    </div>
                    <div className="text-sm text-green-600">Unique Readers</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(analytics.analytics.averageReadTime / 60)}m
                    </div>
                    <div className="text-sm text-purple-600">Avg Read Time</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {Math.round(analytics.analytics.engagementScore)}
                    </div>
                    <div className="text-sm text-orange-600">Engagement Score</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Top Referrers</h3>
                    <div className="space-y-2">
                      {analytics.analytics.topReferrers.map((referrer, index) => (
                        <div key={index} className="flex justify-between">
                          <span className="text-sm text-gray-600">{referrer}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Device Breakdown</h3>
                    <div className="space-y-2">
                      {Object.entries(analytics.analytics.deviceBreakdown).map(
                        ([device, count]) => (
                          <div key={device} className="flex justify-between">
                            <span className="text-sm text-gray-600 capitalize">{device}</span>
                            <span className="text-sm font-medium">{count}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <LoadingSpinner size="lg" />
                <p className="text-gray-500 mt-4">Loading analytics...</p>
              </div>
            )}
          </div>
        ) : (
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
                    <select
                      {...register('categoryId')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500"
                    >
                      <option value="">Select a category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
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

                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Danger Zone</h3>
                  <div className="space-y-3">
                    {article.status === 'published' && (
                      <button
                        type="button"
                        onClick={handleArchive}
                        disabled={archiveMutation.isPending}
                        className="flex items-center px-4 py-2 text-sm font-medium text-orange-700 bg-orange-100 border border-orange-300 rounded-lg hover:bg-orange-200 disabled:opacity-50"
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Archive Article
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleteMutation.isPending}
                      className="flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-lg hover:bg-red-200 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Article
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                {article.status === 'draft' && (
                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={publishMutation.isPending}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Publish Now
                  </button>
                )}
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    article.status === 'published'
                      ? 'bg-green-100 text-green-800'
                      : article.status === 'draft'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
                </span>
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
                  disabled={isSubmitting || !isDirty}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-secondary-600 rounded-lg hover:bg-secondary-700 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
