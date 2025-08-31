import React, { useState, useEffect, useCallback, useMemo, useRef, useContext } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ExpandMore } from '@mui/icons-material';
import {
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Calendar,
  User,
  FolderOpen,
  CheckCircle,
  Archive,
} from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  slug: string;
  type: 'article' | 'guide' | 'exercise' | 'lesson' | 'tip';
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  excerpt: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  category: {
    id: string;
    name: string;
    color: string;
  };
  tags: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  featuredImageUrl?: string;
  viewCount: number;
  readingTime: number;
  publishedAt?: string;
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface ContentListProps {
  contentType: string;
  searchQuery: string;
  statusFilter: string;
  selectedCategory: string | null;
  selectedTags: string[];
}

const ContentList: React.FC<ContentListProps> = ({
  contentType,
  searchQuery,
  statusFilter,
  selectedCategory,
  selectedTags,
}) => {
  const navigate = useNavigate();
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showActions, setShowActions] = useState<string | null>(null);

  // Mock data for demonstration
  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setContents([
        {
          id: '1',
          title: '10 Habits of Highly Successful People',
          slug: '10-habits-highly-successful-people',
          type: 'article',
          status: 'published',
          excerpt:
            'Discover the daily habits that set successful people apart and learn how to implement them in your own life.',
          author: { id: '1', name: 'Sarah Johnson' },
          category: { id: '1', name: 'Productivity', color: 'blue' },
          tags: [
            { id: '1', name: 'habits', color: 'green' },
            { id: '2', name: 'success', color: 'purple' },
          ],
          viewCount: 12543,
          readingTime: 8,
          publishedAt: '2024-01-15T10:00:00Z',
          createdAt: '2024-01-10T09:00:00Z',
          updatedAt: '2024-01-15T09:30:00Z',
        },
        {
          id: '2',
          title: 'Morning Meditation Guide',
          slug: 'morning-meditation-guide',
          type: 'guide',
          status: 'draft',
          excerpt:
            'A comprehensive guide to starting your day with mindfulness and meditation practices.',
          author: { id: '2', name: 'Michael Chen' },
          category: { id: '2', name: 'Wellness', color: 'green' },
          tags: [
            { id: '3', name: 'meditation', color: 'blue' },
            { id: '4', name: 'mindfulness', color: 'indigo' },
          ],
          viewCount: 0,
          readingTime: 12,
          createdAt: '2024-01-20T14:00:00Z',
          updatedAt: '2024-01-22T16:30:00Z',
        },
        {
          id: '3',
          title: 'Goal Setting Exercise',
          slug: 'goal-setting-exercise',
          type: 'exercise',
          status: 'scheduled',
          excerpt: 'Step-by-step exercise to help you set and achieve meaningful goals.',
          author: { id: '1', name: 'Sarah Johnson' },
          category: { id: '3', name: 'Goal Setting', color: 'purple' },
          tags: [
            { id: '5', name: 'goals', color: 'yellow' },
            { id: '6', name: 'planning', color: 'red' },
          ],
          viewCount: 0,
          readingTime: 15,
          scheduledAt: '2024-02-01T09:00:00Z',
          createdAt: '2024-01-18T11:00:00Z',
          updatedAt: '2024-01-19T10:00:00Z',
        },
      ]);
      setLoading(false);
    }, 500);
  }, [contentType, searchQuery, statusFilter, selectedCategory, selectedTags]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'draft':
        return <Edit className="w-4 h-4 text-gray-600" />;
      case 'scheduled':
        return <Calendar className="w-4 h-4 text-purple-600" />;
      case 'archived':
        return <Archive className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'scheduled':
        return 'bg-purple-100 text-purple-800';
      case 'archived':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/cms/content/${id}/edit`);
  };

  const handleView = (id: string) => {
    navigate(`/cms/content/${id}`);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this content?')) {
      // Implement delete functionality
      console.log('Delete content:', id);
    }
  };

  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    setSelectedItems(prev => (prev.length === contents.length ? [] : contents.map(c => c.id)));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Bulk Actions Bar */}
      {selectedItems.length > 0 && (
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
          <span className="text-sm text-blue-800">
            {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50">
              Publish
            </button>
            <button className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50">
              Archive
            </button>
            <button className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Content Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedItems.length === contents.length && contents.length > 0}
                  onChange={toggleAllSelection}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Author
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Views
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {contents.map(content => (
              <tr key={content.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(content.id)}
                    onChange={() => toggleItemSelection(content.id)}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="px-6 py-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{content.title}</h3>
                    <p className="text-sm text-gray-500 truncate max-w-xs">{content.excerpt}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-900 capitalize">{content.type}</span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(content.status)}`}
                  >
                    {getStatusIcon(content.status)}
                    {content.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                    <span className="text-sm text-gray-900">{content.author.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-${content.category.color}-100 text-${content.category.color}-800`}
                  >
                    <FolderOpen className="w-3 h-3" />
                    {content.category.name}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1 text-sm text-gray-900">
                    <Eye className="w-4 h-4 text-gray-400" />
                    {content.viewCount.toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {content.publishedAt
                      ? format(new Date(content.publishedAt), 'MMM d, yyyy')
                      : content.scheduledAt
                        ? format(new Date(content.scheduledAt), 'MMM d, yyyy')
                        : formatDistanceToNow(new Date(content.updatedAt), {
                            addSuffix: true,
                          })}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="relative">
                    <button
                      onClick={() => setShowActions(showActions === content.id ? null : content.id)}
                      className="p-1 rounded hover:bg-gray-100"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>
                    {showActions === content.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                        <div className="py-1">
                          <button
                            onClick={() => handleView(content.id)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                          <button
                            onClick={() => handleEdit(content.id)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(content.id)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">1</span> to <span className="font-medium">3</span>{' '}
          of <span className="font-medium">248</span> results
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
            Previous
          </button>
          <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">1</button>
          <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
            2
          </button>
          <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
            3
          </button>
          <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContentList;
