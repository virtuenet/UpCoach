import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, keepPreviousData, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Plus, Edit, Trash2, Eye, Calendar, Filter } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { contentApi } from '../api/content';
export default function ContentPage() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState('updatedAt');
    const [sortOrder, setSortOrder] = useState('DESC');
    const [showFilters, setShowFilters] = useState(false);
    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: contentApi.getCategories,
    });
    const { data: articlesData, isLoading, error, } = useQuery({
        queryKey: [
            'articles',
            searchTerm,
            statusFilter,
            categoryFilter,
            currentPage,
            sortBy,
            sortOrder,
        ],
        queryFn: () => contentApi.getArticles({
            search: searchTerm || undefined,
            status: statusFilter === 'all' ? undefined : statusFilter,
            category: categoryFilter === 'all' ? undefined : categoryFilter,
            page: currentPage,
            limit: 10,
            sortBy,
            sortOrder,
        }),
        placeholderData: keepPreviousData,
    });
    const deleteMutation = useMutation({
        mutationFn: contentApi.deleteArticle,
        onSuccess: () => {
            toast('Article deleted successfully', { type: 'success' });
            queryClient.invalidateQueries({ queryKey: ['articles'] });
        },
        onError: (error) => {
            toast(error instanceof Error ? error.message : 'Failed to delete article', { type: 'error' });
        },
    });
    const publishMutation = useMutation({
        mutationFn: contentApi.publishArticle,
        onSuccess: () => {
            toast('Article published successfully', { type: 'success' });
            queryClient.invalidateQueries({ queryKey: ['articles'] });
        },
        onError: (error) => {
            toast(error instanceof Error ? error.message : 'Failed to publish article', { type: 'error' });
        },
    });
    const archiveMutation = useMutation({
        mutationFn: contentApi.archiveArticle,
        onSuccess: () => {
            toast('Article archived successfully', { type: 'success' });
            queryClient.invalidateQueries({ queryKey: ['articles'] });
        },
        onError: (error) => {
            toast(error instanceof Error ? error.message : 'Failed to archive article', { type: 'error' });
        },
    });
    const handleDelete = async (article) => {
        if (window.confirm(`Are you sure you want to delete "${article.title}"?`)) {
            deleteMutation.mutate(article.id);
        }
    };
    const handlePublish = async (article) => {
        publishMutation.mutate(article.id);
    };
    const handleArchive = async (article) => {
        archiveMutation.mutate(article.id);
    };
    const getStatusBadge = (status) => {
        const colors = {
            published: 'bg-green-100 text-green-800',
            draft: 'bg-yellow-100 text-yellow-800',
            archived: 'bg-gray-100 text-gray-800',
        };
        return colors[status] || colors.draft;
    };
    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1);
    };
    const resetFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setCategoryFilter('all');
        setCurrentPage(1);
    };
    if (error) {
        return (_jsx("div", { className: "max-w-7xl mx-auto py-6", children: _jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4", children: _jsx("div", { className: "flex", children: _jsxs("div", { className: "ml-3", children: [_jsx("h3", { className: "text-sm font-medium text-red-800", children: "Error loading articles" }), _jsx("div", { className: "mt-2 text-sm text-red-700", children: error instanceof Error
                                    ? error.message
                                    : 'Failed to load articles. Please try again.' })] }) }) }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-semibold text-gray-900", children: "Content Management" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Create and manage your articles and educational content" })] }), _jsxs(Link, { to: "/content/create", className: "flex items-center gap-2 bg-secondary-600 text-white px-4 py-2 rounded-lg hover:bg-secondary-700 transition-colors", children: [_jsx(Plus, { className: "h-4 w-4" }), "New Article"] })] }), _jsx("div", { className: "bg-white p-4 rounded-lg shadow", children: _jsxs("form", { onSubmit: handleSearch, className: "space-y-4", children: [_jsxs("div", { className: "flex flex-col sm:flex-row gap-4", children: [_jsx("div", { className: "flex-1", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Search articles...", value: searchTerm, onChange: e => setSearchTerm(e.target.value), className: "pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500" })] }) }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("button", { type: "button", onClick: () => setShowFilters(!showFilters), className: "flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50", children: [_jsx(Filter, { className: "h-4 w-4" }), "Filters"] }), _jsx("button", { type: "submit", className: "px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700", children: "Search" })] })] }), showFilters && (_jsxs("div", { className: "flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200", children: [_jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Status" }), _jsxs("select", { value: statusFilter, onChange: e => setStatusFilter(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500", children: [_jsx("option", { value: "all", children: "All Status" }), _jsx("option", { value: "published", children: "Published" }), _jsx("option", { value: "draft", children: "Draft" }), _jsx("option", { value: "archived", children: "Archived" })] })] }), _jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Category" }), _jsxs("select", { value: categoryFilter, onChange: e => setCategoryFilter(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500", children: [_jsx("option", { value: "all", children: "All Categories" }), categories.map(cat => (_jsx("option", { value: cat.id, children: cat.name }, cat.id)))] })] }), _jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Sort By" }), _jsxs("select", { value: `${sortBy}-${sortOrder}`, onChange: e => {
                                                const [field, order] = e.target.value.split('-');
                                                setSortBy(field);
                                                setSortOrder(order);
                                            }, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500", children: [_jsx("option", { value: "updatedAt-DESC", children: "Last Updated" }), _jsx("option", { value: "createdAt-DESC", children: "Newest First" }), _jsx("option", { value: "createdAt-ASC", children: "Oldest First" }), _jsx("option", { value: "title-ASC", children: "Title A-Z" }), _jsx("option", { value: "title-DESC", children: "Title Z-A" }), _jsx("option", { value: "viewCount-DESC", children: "Most Viewed" })] })] }), _jsx("div", { className: "flex items-end", children: _jsx("button", { type: "button", onClick: resetFilters, className: "px-3 py-2 text-sm text-gray-600 hover:text-gray-900", children: "Clear" }) })] }))] }) }), _jsx("div", { className: "bg-white rounded-lg shadow overflow-hidden", children: isLoading ? (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx(LoadingSpinner, { size: "lg" }) })) : !articlesData?.data?.length ? (_jsxs("div", { className: "text-center py-12", children: [_jsx("div", { className: "text-gray-400 mb-4", children: _jsx(Edit, { className: "h-12 w-12 mx-auto" }) }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "No articles found" }), _jsx("p", { className: "text-gray-500 mb-4", children: searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                                ? 'Try adjusting your search criteria or filters.'
                                : 'Get started by creating your first article.' }), _jsxs(Link, { to: "/content/create", className: "inline-flex items-center gap-2 bg-secondary-600 text-white px-4 py-2 rounded-lg hover:bg-secondary-700", children: [_jsx(Plus, { className: "h-4 w-4" }), "Create Article"] })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Article" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Category" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Views" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Updated" }), _jsx("th", { className: "relative px-6 py-3", children: _jsx("span", { className: "sr-only", children: "Actions" }) })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: articlesData.data.map((article) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "flex items-start space-x-3", children: [article.featuredImage && (_jsx("img", { src: article.featuredImage, alt: "", className: "h-12 w-12 rounded-lg object-cover" })), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx(Link, { to: `/content/edit/${article.id}`, className: "text-sm font-medium text-gray-900 hover:text-secondary-600 line-clamp-2", children: article.title }), _jsx("p", { className: "text-sm text-gray-500 line-clamp-2 mt-1", children: article.excerpt }), _jsxs("div", { className: "flex items-center space-x-2 mt-2", children: [_jsxs("span", { className: "text-xs text-gray-400", children: [article.readTime, " min read"] }), article.settings?.isFeatured && (_jsx("span", { className: "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800", children: "Featured" }))] })] })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: "text-sm text-gray-500", children: article.category?.name || 'Uncategorized' }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(article.status)}`, children: article.status.charAt(0).toUpperCase() + article.status.slice(1) }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: _jsxs("div", { className: "flex items-center", children: [_jsx(Eye, { className: "h-4 w-4 mr-1" }), article.viewCount.toLocaleString()] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: _jsxs("div", { className: "flex items-center", children: [_jsx(Calendar, { className: "h-4 w-4 mr-1" }), format(new Date(article.updatedAt), 'MMM d, yyyy')] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-right text-sm font-medium", children: _jsxs("div", { className: "flex items-center justify-end space-x-2", children: [_jsx(Link, { to: `/content/edit/${article.id}`, className: "text-indigo-600 hover:text-indigo-900", title: "Edit", children: _jsx(Edit, { className: "h-4 w-4" }) }), article.status === 'draft' && (_jsx("button", { onClick: () => handlePublish(article), disabled: publishMutation.isPending, className: "text-green-600 hover:text-green-900", title: "Publish", children: _jsx(Eye, { className: "h-4 w-4" }) })), article.status === 'published' && (_jsx("button", { onClick: () => handleArchive(article), disabled: archiveMutation.isPending, className: "text-yellow-600 hover:text-yellow-900", title: "Archive", children: _jsx(Calendar, { className: "h-4 w-4" }) })), _jsx("button", { onClick: () => handleDelete(article), disabled: deleteMutation.isPending, className: "text-red-600 hover:text-red-900", title: "Delete", children: _jsx(Trash2, { className: "h-4 w-4" }) })] }) })] }, article.id))) })] }) }), articlesData.pagination && articlesData.pagination.totalPages > 1 && (_jsxs("div", { className: "bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6", children: [_jsxs("div", { className: "flex-1 flex justify-between sm:hidden", children: [_jsx("button", { onClick: () => setCurrentPage(Math.max(1, currentPage - 1)), disabled: currentPage === 1, className: "relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50", children: "Previous" }), _jsx("button", { onClick: () => setCurrentPage(Math.min(articlesData.pagination.totalPages, currentPage + 1)), disabled: currentPage === articlesData.pagination.totalPages, className: "ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50", children: "Next" })] }), _jsxs("div", { className: "hidden sm:flex-1 sm:flex sm:items-center sm:justify-between", children: [_jsx("div", { children: _jsxs("p", { className: "text-sm text-gray-700", children: ["Showing", ' ', _jsx("span", { className: "font-medium", children: (currentPage - 1) * articlesData.pagination.itemsPerPage + 1 }), ' ', "to", ' ', _jsx("span", { className: "font-medium", children: Math.min(currentPage * articlesData.pagination.itemsPerPage, articlesData.pagination.totalItems) }), ' ', "of ", _jsx("span", { className: "font-medium", children: articlesData.pagination.totalItems }), ' ', "results"] }) }), _jsx("div", { children: _jsxs("nav", { className: "relative z-0 inline-flex rounded-md shadow-sm -space-x-px", children: [_jsx("button", { onClick: () => setCurrentPage(Math.max(1, currentPage - 1)), disabled: currentPage === 1, className: "relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50", children: "Previous" }), Array.from({ length: Math.min(5, articlesData.pagination.totalPages) }, (_, i) => {
                                                        const page = i + 1;
                                                        return (_jsx("button", { onClick: () => setCurrentPage(page), className: `relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === currentPage
                                                                ? 'z-10 bg-secondary-50 border-secondary-500 text-secondary-600'
                                                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`, children: page }, page));
                                                    }), _jsx("button", { onClick: () => setCurrentPage(Math.min(articlesData.pagination.totalPages, currentPage + 1)), disabled: currentPage === articlesData.pagination.totalPages, className: "relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50", children: "Next" })] }) })] })] }))] })) })] }));
}
//# sourceMappingURL=ContentPage.js.map