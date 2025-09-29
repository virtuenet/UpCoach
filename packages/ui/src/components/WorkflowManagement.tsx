import React, { useState, useMemo } from 'react';
import { clsx } from 'clsx';

// Types
export interface WorkflowItem {
  id: string;
  title: string;
  type: 'page' | 'post' | 'component' | 'media';
  status: 'draft' | 'in_review' | 'approved' | 'published' | 'rejected';
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  comments: number;
  attachments: number;
  tags: string[];
}

interface WorkflowColumn {
  id: string;
  title: string;
  status: WorkflowItem['status'];
  color: string;
  items: WorkflowItem[];
}

interface Comment {
  id: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  timestamp: Date;
  attachments?: string[];
}

// Icons
const Icons = {
  Document: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Image: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Component: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  ),
  Clock: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Comment: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  Attachment: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
    </svg>
  ),
  Flag: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
    </svg>
  ),
  User: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Plus: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  Filter: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  ),
  Search: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
};

// Sample data
const sampleWorkflowItems: WorkflowItem[] = [
  {
    id: '1',
    title: 'Homepage Redesign',
    type: 'page',
    status: 'draft',
    author: { id: '1', name: 'John Doe' },
    assignee: { id: '2', name: 'Jane Smith' },
    priority: 'high',
    dueDate: new Date('2024-12-15'),
    createdAt: new Date('2024-12-01'),
    updatedAt: new Date('2024-12-05'),
    comments: 5,
    attachments: 3,
    tags: ['homepage', 'redesign', 'q4-priority'],
  },
  {
    id: '2',
    title: 'Blog Post: Year in Review',
    type: 'post',
    status: 'in_review',
    author: { id: '3', name: 'Alice Johnson' },
    assignee: { id: '1', name: 'John Doe' },
    priority: 'medium',
    dueDate: new Date('2024-12-20'),
    createdAt: new Date('2024-12-03'),
    updatedAt: new Date('2024-12-06'),
    comments: 3,
    attachments: 1,
    tags: ['blog', 'annual-report'],
  },
  {
    id: '3',
    title: 'Product Gallery Component',
    type: 'component',
    status: 'approved',
    author: { id: '2', name: 'Jane Smith' },
    priority: 'low',
    createdAt: new Date('2024-11-28'),
    updatedAt: new Date('2024-12-04'),
    comments: 2,
    attachments: 0,
    tags: ['component', 'gallery'],
  },
  {
    id: '4',
    title: 'Marketing Banner Images',
    type: 'media',
    status: 'published',
    author: { id: '4', name: 'Bob Wilson' },
    priority: 'urgent',
    createdAt: new Date('2024-11-25'),
    updatedAt: new Date('2024-12-01'),
    comments: 0,
    attachments: 12,
    tags: ['marketing', 'banners'],
  },
];

export interface WorkflowManagementProps {
  onItemClick?: (item: WorkflowItem) => void;
  onStatusChange?: (itemId: string, newStatus: WorkflowItem['status']) => void;
}

export const WorkflowManagement: React.FC<WorkflowManagementProps> = ({
  onItemClick,
  onStatusChange,
}) => {
  const [items, setItems] = useState<WorkflowItem[]>(sampleWorkflowItems);
  const [selectedItem, setSelectedItem] = useState<WorkflowItem | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'calendar'>('kanban');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedItem, setDraggedItem] = useState<WorkflowItem | null>(null);

  // Define workflow columns
  const workflowColumns: Omit<WorkflowColumn, 'items'>[] = [
    { id: 'draft', title: 'Draft', status: 'draft', color: 'gray' },
    { id: 'in_review', title: 'In Review', status: 'in_review', color: 'yellow' },
    { id: 'approved', title: 'Approved', status: 'approved', color: 'blue' },
    { id: 'published', title: 'Published', status: 'published', color: 'green' },
    { id: 'rejected', title: 'Rejected', status: 'rejected', color: 'red' },
  ];

  // Group items by status
  const groupedItems = useMemo(() => {
    const filtered = items.filter(item => {
      const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesSearch;
    });

    return workflowColumns.map(column => ({
      ...column,
      items: filtered.filter(item => item.status === column.status),
    }));
  }, [items, filterStatus, searchQuery]);

  // Get type icon
  const getTypeIcon = (type: WorkflowItem['type']) => {
    switch (type) {
      case 'page': return Icons.Document;
      case 'post': return Icons.Document;
      case 'component': return Icons.Component;
      case 'media': return Icons.Image;
      default: return Icons.Document;
    }
  };

  // Get priority color
  const getPriorityColor = (priority: WorkflowItem['priority']) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900';
      case 'high': return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900';
      case 'low': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700';
    }
  };

  // Handle drag and drop
  const handleDragStart = (item: WorkflowItem) => {
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: WorkflowItem['status']) => {
    e.preventDefault();
    if (draggedItem) {
      const updatedItems = items.map(item =>
        item.id === draggedItem.id
          ? { ...item, status: newStatus, updatedAt: new Date() }
          : item
      );
      setItems(updatedItems);
      onStatusChange?.(draggedItem.id, newStatus);
      setDraggedItem(null);
    }
  };

  // Render workflow card
  const renderWorkflowCard = (item: WorkflowItem) => {
    const TypeIcon = getTypeIcon(item.type);
    const isOverdue = item.dueDate && new Date(item.dueDate) < new Date();

    return (
      <div
        key={item.id}
        draggable
        onDragStart={() => handleDragStart(item)}
        onClick={() => {
          setSelectedItem(item);
          onItemClick?.(item);
        }}
        className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <TypeIcon />
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 capitalize">
              {item.type}
            </span>
          </div>
          <span className={clsx(
            'px-2 py-1 text-xs font-medium rounded-full',
            getPriorityColor(item.priority)
          )}>
            {item.priority}
          </span>
        </div>

        {/* Title */}
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          {item.title}
        </h4>

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {item.tags.slice(0, 2).map(tag => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
              >
                {tag}
              </span>
            ))}
            {item.tags.length > 2 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                +{item.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-3">
            {item.comments > 0 && (
              <span className="flex items-center">
                <Icons.Comment />
                <span className="ml-1">{item.comments}</span>
              </span>
            )}
            {item.attachments > 0 && (
              <span className="flex items-center">
                <Icons.Attachment />
                <span className="ml-1">{item.attachments}</span>
              </span>
            )}
          </div>

          {item.dueDate && (
            <span className={clsx(
              'flex items-center',
              isOverdue && 'text-red-500 dark:text-red-400'
            )}>
              <Icons.Clock />
              <span className="ml-1">
                {new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </span>
          )}
        </div>

        {/* Assignee */}
        {item.assignee && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center">
            {item.assignee.avatar ? (
              <img
                src={item.assignee.avatar}
                alt={item.assignee.name}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <Icons.User />
              </div>
            )}
            <span className="ml-2 text-xs text-gray-600 dark:text-gray-300">
              {item.assignee.name}
            </span>
          </div>
        )}
      </div>
    );
  };

  // Render Kanban view
  const renderKanbanView = () => (
    <div className="flex space-x-4 overflow-x-auto pb-4">
      {groupedItems.map(column => (
        <div
          key={column.id}
          className="flex-shrink-0 w-80"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column.status)}
        >
          {/* Column Header */}
          <div className="bg-gray-100 dark:bg-gray-700 rounded-t-lg px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <div className={clsx(
                'w-3 h-3 rounded-full mr-2',
                column.color === 'gray' && 'bg-gray-500',
                column.color === 'yellow' && 'bg-yellow-500',
                column.color === 'blue' && 'bg-blue-500',
                column.color === 'green' && 'bg-green-500',
                column.color === 'red' && 'bg-red-500'
              )} />
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                {column.title}
              </h3>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {column.items.length}
            </span>
          </div>

          {/* Column Content */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-b-lg p-3 min-h-[400px] space-y-3">
            {column.items.map(item => renderWorkflowCard(item))}

            {/* Add New Button */}
            <button className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center justify-center">
              <Icons.Plus />
              <span className="ml-2 text-sm">Add Item</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  // Render List view
  const renderListView = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <th className="px-6 py-3">Title</th>
            <th className="px-6 py-3">Type</th>
            <th className="px-6 py-3">Status</th>
            <th className="px-6 py-3">Priority</th>
            <th className="px-6 py-3">Assignee</th>
            <th className="px-6 py-3">Due Date</th>
            <th className="px-6 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {items.map(item => {
            const TypeIcon = getTypeIcon(item.type);
            const isOverdue = item.dueDate && new Date(item.dueDate) < new Date();

            return (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <TypeIcon />
                    <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                      {item.title}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                    {item.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={clsx(
                    'px-2 py-1 text-xs font-medium rounded-full',
                    item.status === 'draft' && 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
                    item.status === 'in_review' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
                    item.status === 'approved' && 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
                    item.status === 'published' && 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
                    item.status === 'rejected' && 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                  )}>
                    {item.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={clsx(
                    'px-2 py-1 text-xs font-medium rounded-full',
                    getPriorityColor(item.priority)
                  )}>
                    {item.priority}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {item.assignee ? (
                    <div className="flex items-center">
                      {item.assignee.avatar ? (
                        <img
                          src={item.assignee.avatar}
                          alt={item.assignee.name}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <Icons.User />
                        </div>
                      )}
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                        {item.assignee.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Unassigned</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {item.dueDate ? (
                    <span className={clsx(
                      'text-sm',
                      isOverdue ? 'text-red-500 dark:text-red-400' : 'text-gray-600 dark:text-gray-300'
                    )}>
                      {new Date(item.dueDate).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">No due date</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => {
                      setSelectedItem(item);
                      onItemClick?.(item);
                    }}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                  >
                    View
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Workflow Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage content lifecycle from draft to publication
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <Icons.Plus />
          <span className="ml-2">New Content</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {/* Left side - Search and Filter */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Icons.Search className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="in_review">In Review</option>
              <option value="approved">Approved</option>
              <option value="published">Published</option>
              <option value="rejected">Rejected</option>
            </select>

            <button className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              <Icons.Filter />
            </button>
          </div>

          {/* Right side - View Mode */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={clsx(
                'px-3 py-1 rounded text-sm font-medium transition-colors',
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-300'
              )}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                'px-3 py-1 rounded text-sm font-medium transition-colors',
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-300'
              )}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={clsx(
                'px-3 py-1 rounded text-sm font-medium transition-colors',
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-300'
              )}
            >
              Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {viewMode === 'kanban' && renderKanbanView()}
      {viewMode === 'list' && renderListView()}
      {viewMode === 'calendar' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
          Calendar view coming soon...
        </div>
      )}
    </div>
  );
};

export default WorkflowManagement;