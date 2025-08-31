import React, { useState, useEffect, useCallback, useMemo, useRef, useContext } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { FolderOpen, ExpandMore } from '@mui/icons-material';
import {
  Save,
  X,
  Eye,
  Calendar,
  Tag,
  FolderOpen,
  Image,
  Link,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import RichTextEditor from '../components/cms/RichTextEditor';
import MediaSelector from '../components/cms/MediaSelector';
import CategorySelector from '../components/cms/CategorySelector';
import TagSelector from '../components/cms/TagSelector';
import SEOSettings from '../components/cms/SEOSettings';

interface ContentFormData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  type: 'article' | 'guide' | 'exercise' | 'lesson' | 'tip';
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  categoryId: string;
  tagIds: string[];
  featuredImageUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  publishedAt?: string;
  scheduledAt?: string;
  isPremium: boolean;
  settings: {
    allowComments: boolean;
    showAuthor: boolean;
    showDate: boolean;
    showReadingTime: boolean;
  };
}

const ContentEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState<ContentFormData>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    type: 'article',
    status: 'draft',
    categoryId: '',
    tagIds: [],
    isPremium: false,
    settings: {
      allowComments: true,
      showAuthor: true,
      showDate: true,
      showReadingTime: true,
    },
  });

  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [showSEOSettings, setShowSEOSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'settings' | 'seo'>('content');

  useEffect(() => {
    if (isEditMode) {
      // Fetch content data
      // Simulate API call
      setFormData({
        title: '10 Habits of Highly Successful People',
        slug: '10-habits-highly-successful-people',
        content: '<p>Content goes here...</p>',
        excerpt: 'Discover the daily habits that set successful people apart.',
        type: 'article',
        status: 'published',
        categoryId: '1',
        tagIds: ['1', '2'],
        isPremium: false,
        settings: {
          allowComments: true,
          showAuthor: true,
          showDate: true,
          showReadingTime: true,
        },
      });
    }
  }, [id, isEditMode]);

  const handleSave = async (asDraft = false) => {
    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        status: asDraft ? 'draft' : formData.status,
      };

      // API call to save content
      console.log('Saving content:', dataToSave);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      navigate('/cms');
    } catch (error) {
      console.error('Error saving content:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = () => {
    setFormData(prev => ({ ...prev, status: 'published' }));
    handleSave(false);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: !prev.slug || prev.slug === generateSlug(prev.title) ? generateSlug(title) : prev.slug,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/cms')} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold">
              {isEditMode ? 'Edit Content' : 'Create New Content'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>

            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Save Draft
            </button>

            <button
              onClick={handlePublish}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isEditMode ? 'Update' : 'Publish'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 flex gap-6 border-t border-gray-200">
          <button
            onClick={() => setActiveTab('content')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'content'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Content
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Settings
          </button>
          <button
            onClick={() => setActiveTab('seo')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'seo'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            SEO
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {activeTab === 'content' && (
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <input
                    type="text"
                    placeholder="Enter title..."
                    value={formData.title}
                    onChange={e => handleTitleChange(e.target.value)}
                    className="w-full text-3xl font-bold border-0 focus:ring-0 px-0 placeholder-gray-400"
                  />
                </div>

                {/* Slug */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">Slug:</span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    className="flex-1 border-0 border-b border-gray-300 focus:border-blue-500 focus:ring-0 px-1"
                  />
                </div>

                {/* Excerpt */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Excerpt</label>
                  <textarea
                    value={formData.excerpt}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        excerpt: e.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description of your content..."
                  />
                </div>

                {/* Rich Text Editor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                  <RichTextEditor
                    value={formData.content}
                    onChange={content => setFormData(prev => ({ ...prev, content }))}
                    onImageClick={() => setShowMediaSelector(true)}
                  />
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white rounded-lg p-6 space-y-6">
                <h2 className="text-lg font-semibold">Content Settings</h2>

                {/* Content Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        type: e.target.value as ContentFormData['type'],
                      }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="article">Article</option>
                    <option value="guide">Guide</option>
                    <option value="exercise">Exercise</option>
                    <option value="lesson">Lesson</option>
                    <option value="tip">Tip</option>
                  </select>
                </div>

                {/* Display Settings */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Display Options</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.settings.allowComments}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            settings: {
                              ...prev.settings,
                              allowComments: e.target.checked,
                            },
                          }))
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Allow comments</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.settings.showAuthor}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            settings: {
                              ...prev.settings,
                              showAuthor: e.target.checked,
                            },
                          }))
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Show author</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.settings.showDate}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            settings: {
                              ...prev.settings,
                              showDate: e.target.checked,
                            },
                          }))
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Show publish date</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.settings.showReadingTime}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            settings: {
                              ...prev.settings,
                              showReadingTime: e.target.checked,
                            },
                          }))
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Show reading time</span>
                    </label>
                  </div>
                </div>

                {/* Premium Content */}
                <div>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.isPremium}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          isPremium: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium">Premium content</span>
                  </label>
                  <p className="text-sm text-gray-500 mt-1 ml-6">
                    Only premium subscribers can access this content
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'seo' && (
              <SEOSettings
                metaTitle={formData.metaTitle}
                metaDescription={formData.metaDescription}
                metaKeywords={formData.metaKeywords}
                onChange={seo => setFormData(prev => ({ ...prev, ...seo }))}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status & Visibility */}
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-medium mb-4">Status & Visibility</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        status: e.target.value as ContentFormData['status'],
                      }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                {formData.status === 'scheduled' && (
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Schedule Date</label>
                    <input
                      type="datetime-local"
                      value={formData.scheduledAt}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          scheduledAt: e.target.value,
                        }))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Featured Image */}
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-medium mb-4">Featured Image</h3>

              {formData.featuredImageUrl ? (
                <div className="relative">
                  <img
                    src={formData.featuredImageUrl}
                    alt="Featured"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <button
                    onClick={() =>
                      setFormData(prev => ({
                        ...prev,
                        featuredImageUrl: undefined,
                      }))
                    }
                    className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm hover:bg-gray-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowMediaSelector(true)}
                  className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-gray-400"
                >
                  <Image className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">Add featured image</span>
                </button>
              )}
            </div>

            {/* Category */}
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-medium mb-4">Category</h3>
              <CategorySelector
                value={formData.categoryId}
                onChange={categoryId => setFormData(prev => ({ ...prev, categoryId }))}
              />
            </div>

            {/* Tags */}
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-medium mb-4">Tags</h3>
              <TagSelector
                value={formData.tagIds}
                onChange={tagIds => setFormData(prev => ({ ...prev, tagIds }))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Media Selector Modal */}
      {showMediaSelector && (
        <MediaSelector
          onSelect={url => {
            setFormData(prev => ({ ...prev, featuredImageUrl: url }));
            setShowMediaSelector(false);
          }}
          onClose={() => setShowMediaSelector(false)}
        />
      )}
    </div>
  );
};

export default ContentEditorPage;
