import React, { useState } from 'react';
import { 
  FileText, 
  FolderOpen, 
  Tag, 
  Image, 
  Plus,
  Search,
  Filter,
  Calendar,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ContentList from '../components/cms/ContentList';
import ContentStats from '../components/cms/ContentStats';

type ContentTab = 'all' | 'articles' | 'guides' | 'exercises' | 'lessons' | 'tips';

const CMSPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ContentTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const tabs: { id: ContentTab; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All Content', icon: <FileText className="w-4 h-4" /> },
    { id: 'articles', label: 'Articles', icon: <FileText className="w-4 h-4" /> },
    { id: 'guides', label: 'Guides', icon: <FolderOpen className="w-4 h-4" /> },
    { id: 'exercises', label: 'Exercises', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'lessons', label: 'Lessons', icon: <Calendar className="w-4 h-4" /> },
    { id: 'tips', label: 'Tips', icon: <Tag className="w-4 h-4" /> }
  ];

  const handleCreateContent = () => {
    navigate('/cms/content/new');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
            <p className="text-gray-600 mt-1">Create and manage coaching content</p>
          </div>
          <button
            onClick={handleCreateContent}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Content
          </button>
        </div>

        {/* Content Stats */}
        <ContentStats />
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Filters Bar */}
        <div className="p-4 flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="scheduled">Scheduled</option>
            <option value="archived">Archived</option>
          </select>

          {/* Category Filter */}
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <FolderOpen className="w-4 h-4" />
            Category
          </button>

          {/* Tags Filter */}
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Tag className="w-4 h-4" />
            Tags
          </button>

          {/* More Filters */}
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="w-4 h-4" />
            More Filters
          </button>
        </div>
      </div>

      {/* Content List */}
      <ContentList
        contentType={activeTab}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        selectedCategory={selectedCategory}
        selectedTags={selectedTags}
      />
    </div>
  );
};

export default CMSPage;