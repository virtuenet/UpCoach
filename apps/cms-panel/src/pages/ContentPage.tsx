import { useState } from 'react';
import { useQuery, useMutation, keepPreviousData, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, Edit, Trash2, Eye, Calendar, Filter } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { contentApi, Article } from '../api/content';

export default function ContentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [showFilters, setShowFilters] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: contentApi.getCategories,
  });

  const {
    data: articlesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      'articles',
      searchTerm,
      statusFilter,
      categoryFilter,
      currentPage,
      sortBy,
      sortOrder,
    ],
    queryFn: () =>
      contentApi.getArticles({
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
      toast.success('Article deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (error: any) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete article');
    },
  });

  const publishMutation = useMutation({
    mutationFn: contentApi.publishArticle,
    onSuccess: () => {
      toast.success('Article published successfully');
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (error: any) => {
      toast.error(error instanceof Error ? error.message : 'Failed to publish article');
    },
  });

  const archiveMutation = useMutation({
    mutationFn: contentApi.archiveArticle,
    onSuccess: () => {
      toast.success('Article archived successfully');
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (error: any) => {
      toast.error(error instanceof Error ? error.message : 'Failed to archive article');
    },
  });

  const handleDelete = async (article: Article) => {
    if (window.confirm(`Are you sure you want to delete "${article.title}"?`)) {
      deleteMutation.mutate(article.id);
    }
  };

  const handlePublish = async (article: Article) => {
    publishMutation.mutate(article.id);
  };

  const handleArchive = async (article: Article) => {
    archiveMutation.mutate(article.id);
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-800',
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  const handleSearch = (e: React.FormEvent) => {
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
    return (
      <div className="max-w-7xl mx-auto py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading articles</h3>
              <div className="mt-2 text-sm text-red-700">
                {error instanceof Error
                  ? error.message
                  : 'Failed to load articles. Please try again.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Content Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage your articles and educational content
          </p>
        </div>
        <Link
          to="/content/create"
          className="flex items-center gap-2 bg-secondary-600 text-white px-4 py-2 rounded-lg hover:bg-secondary-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Article
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700"
              >
                Search
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500"
                >
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={e => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order as 'ASC' | 'DESC');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500"
                >
                  <option value="updatedAt-DESC">Last Updated</option>
                  <option value="createdAt-DESC">Newest First</option>
                  <option value="createdAt-ASC">Oldest First</option>
                  <option value="title-ASC">Title A-Z</option>
                  <option value="title-DESC">Title Z-A</option>
                  <option value="viewCount-DESC">Most Viewed</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Articles List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : !articlesData?.data?.length ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Edit className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try adjusting your search criteria or filters.'
                : 'Get started by creating your first article.'}
            </p>
            <Link
              to="/content/create"
              className="inline-flex items-center gap-2 bg-secondary-600 text-white px-4 py-2 rounded-lg hover:bg-secondary-700"
            >
              <Plus className="h-4 w-4" />
              Create Article
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Article
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Views
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Updated
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {articlesData.data.map((article: Article) => (
                    <tr key={article.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-3">
                          {article.featuredImage && (
                            <img
                              src={article.featuredImage}
                              alt=""
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <Link
                              to={`/content/edit/${article.id}`}
                              className="text-sm font-medium text-gray-900 hover:text-secondary-600 line-clamp-2"
                            >
                              {article.title}
                            </Link>
                            <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                              {article.excerpt}
                            </p>
                            <div className="flex items-center space-x-2 mt-2">
                              <span className="text-xs text-gray-400">
                                {article.readTime} min read
                              </span>
                              {article.settings?.isFeatured && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  Featured
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500">
                          {article.category?.name || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(article.status)}`}
                        >
                          {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Eye className="h-4 w-4 mr-1" />
                          {article.viewCount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {format(new Date(article.updatedAt), 'MMM d, yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            to={`/content/edit/${article.id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>

                          {article.status === 'draft' && (
                            <button
                              onClick={() => handlePublish(article)}
                              disabled={publishMutation.isPending}
                              className="text-green-600 hover:text-green-900"
                              title="Publish"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}

                          {article.status === 'published' && (
                            <button
                              onClick={() => handleArchive(article)}
                              disabled={archiveMutation.isPending}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Archive"
                            >
                              <Calendar className="h-4 w-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(article)}
                            disabled={deleteMutation.isPending}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {articlesData.pagination && articlesData.pagination.totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(articlesData.pagination.totalPages, currentPage + 1))
                    }
                    disabled={currentPage === articlesData.pagination.totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">
                        {(currentPage - 1) * articlesData.pagination.itemsPerPage + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-medium">
                        {Math.min(
                          currentPage * articlesData.pagination.itemsPerPage,
                          articlesData.pagination.totalItems
                        )}
                      </span>{' '}
                      of <span className="font-medium">{articlesData.pagination.totalItems}</span>{' '}
                      results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      {Array.from(
                        { length: Math.min(5, articlesData.pagination.totalPages) },
                        (_, i) => {
                          const page = i + 1;
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                page === currentPage
                                  ? 'z-10 bg-secondary-50 border-secondary-500 text-secondary-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        }
                      )}
                      <button
                        onClick={() =>
                          setCurrentPage(
                            Math.min(articlesData.pagination.totalPages, currentPage + 1)
                          )
                        }
                        disabled={currentPage === articlesData.pagination.totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
