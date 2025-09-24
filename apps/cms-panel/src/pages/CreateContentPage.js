import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
export default function CreateContentPage() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('content');
    const [preview, setPreview] = useState(false);
    const { register, handleSubmit, control, watch, formState: { errors }, setValue: _setValue, } = useForm({
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
        onSuccess: (data) => {
            toast('Article created successfully!', { type: 'success' });
            navigate(`/content/edit/${data.id}`);
        },
        onError: (error) => {
            toast(error instanceof Error ? error.message : 'Failed to create article', { type: 'error' });
        },
    });
    const onSubmit = async (data) => {
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
        }
        catch (error) {
            console.error('Error creating article:', error);
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const watchedContent = watch(['title', 'excerpt', 'content']);
    const estimatedReadTime = Math.ceil((watchedContent[2] || '').split(/\s+/).length / 200);
    if (preview) {
        return (_jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsxs("div", { className: "mb-6 flex items-center justify-between", children: [_jsxs("button", { onClick: () => setPreview(false), className: "flex items-center text-gray-600 hover:text-gray-900", children: [_jsx(ArrowLeft, { className: "h-4 w-4 mr-1" }), "Back to Editor"] }), _jsxs("div", { className: "text-sm text-gray-500", children: ["Preview Mode \u2022 ", estimatedReadTime, " min read"] })] }), _jsxs("article", { className: "bg-white rounded-lg shadow p-8", children: [_jsxs("header", { className: "mb-8", children: [watchedContent[0] && (_jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-4", children: watchedContent[0] })), watchedContent[1] && (_jsx("p", { className: "text-xl text-gray-600 leading-relaxed", children: watchedContent[1] }))] }), watchedContent[2] && (_jsx("div", { className: "prose prose-lg max-w-none", dangerouslySetInnerHTML: {
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
                            } }))] })] }));
    }
    return (_jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsx("div", { className: "mb-6", children: _jsxs("button", { onClick: () => navigate('/content'), className: "flex items-center text-gray-600 hover:text-gray-900", children: [_jsx(ArrowLeft, { className: "h-4 w-4 mr-1" }), "Back to Content"] }) }), _jsxs("div", { className: "bg-white rounded-lg shadow", children: [_jsx("div", { className: "px-6 py-4 border-b border-gray-200", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-xl font-semibold text-gray-900", children: "Create New Article" }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs("button", { type: "button", onClick: () => setPreview(true), className: "flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900", children: [_jsx(Eye, { className: "h-4 w-4 mr-1" }), "Preview"] }), _jsxs("div", { className: "text-sm text-gray-500", children: [estimatedReadTime, " min read"] })] })] }) }), _jsx("div", { className: "border-b border-gray-200", children: _jsx("nav", { className: "-mb-px flex space-x-8 px-6", children: [
                                { id: 'content', name: 'Content', icon: null },
                                { id: 'seo', name: 'SEO', icon: null },
                                { id: 'settings', name: 'Settings', icon: Settings },
                            ].map(tab => (_jsxs("button", { onClick: () => setActiveTab(tab.id), className: `${activeTab === tab.id
                                    ? 'border-secondary-500 text-secondary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`, children: [tab.icon && _jsx(tab.icon, { className: "h-4 w-4 mr-2" }), tab.name] }, tab.id))) }) }), _jsxs("form", { onSubmit: handleSubmit(onSubmit), className: "p-6 space-y-6", children: [activeTab === 'content' && (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Title ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { ...register('title'), type: "text", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500", placeholder: "Enter article title" }), errors.title && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.title.message }))] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Excerpt ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("textarea", { ...register('excerpt'), rows: 3, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500", placeholder: "Brief description of the article" }), errors.excerpt && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.excerpt.message }))] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Category ", _jsx("span", { className: "text-red-500", children: "*" })] }), categoriesLoading ? (_jsx("div", { className: "w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50", children: "Loading categories..." })) : (_jsxs("select", { ...register('categoryId'), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500", children: [_jsx("option", { value: "", children: "Select a category" }), categories.map((cat) => (_jsx("option", { value: cat.id, children: cat.name }, cat.id)))] })), errors.categoryId && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.categoryId.message }))] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Tags ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { ...register('tags'), type: "text", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500", placeholder: "productivity, leadership, goals" }), errors.tags && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.tags.message })), _jsx("p", { className: "mt-1 text-xs text-gray-500", children: "Separate tags with commas" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Featured Image" }), _jsx("input", { ...register('featuredImage'), type: "url", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500", placeholder: "https://example.com/image.jpg" }), errors.featuredImage && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.featuredImage.message }))] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Content ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx(Controller, { name: "content", control: control, render: ({ field }) => (_jsx(RichTextEditor, { content: field.value, onChange: field.onChange })) }), errors.content && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.content.message }))] })] })), activeTab === 'seo' && (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "SEO Title" }), _jsx("input", { ...register('seoTitle'), type: "text", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500", placeholder: "Optimized title for search engines" }), errors.seoTitle && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.seoTitle.message })), _jsx("p", { className: "mt-1 text-xs text-gray-500", children: "Recommended: 50-60 characters" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "SEO Description" }), _jsx("textarea", { ...register('seoDescription'), rows: 3, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500", placeholder: "Brief description for search engine results" }), errors.seoDescription && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.seoDescription.message })), _jsx("p", { className: "mt-1 text-xs text-gray-500", children: "Recommended: 150-160 characters" })] })] })), activeTab === 'settings' && (_jsx(_Fragment, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("input", { ...register('allowComments'), type: "checkbox", className: "rounded border-gray-300 text-secondary-600 focus:ring-secondary-500" }), _jsx("label", { className: "ml-2 text-sm text-gray-700", children: "Allow comments on this article" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx("input", { ...register('isFeatured'), type: "checkbox", className: "rounded border-gray-300 text-secondary-600 focus:ring-secondary-500" }), _jsx("label", { className: "ml-2 text-sm text-gray-700", children: "Mark as featured article" })] })] }) })), _jsxs("div", { className: "flex items-center justify-between pt-6 border-t border-gray-200", children: [_jsx("div", { children: _jsxs("label", { className: "flex items-center", children: [_jsx("input", { ...register('status'), type: "checkbox", value: "published", className: "rounded border-gray-300 text-secondary-600 focus:ring-secondary-500" }), _jsx("span", { className: "ml-2 text-sm text-gray-700", children: "Publish immediately" })] }) }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("button", { type: "button", onClick: () => navigate('/content'), className: "px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50", children: "Cancel" }), _jsx("button", { type: "submit", disabled: isSubmitting, className: "flex items-center px-4 py-2 text-sm font-medium text-white bg-secondary-600 rounded-lg hover:bg-secondary-700 disabled:opacity-50", children: isSubmitting ? (_jsx(LoadingSpinner, { size: "sm" })) : (_jsxs(_Fragment, { children: [_jsx(Save, { className: "h-4 w-4 mr-2" }), "Save Article"] })) })] })] })] })] })] }));
}
//# sourceMappingURL=CreateContentPage.js.map