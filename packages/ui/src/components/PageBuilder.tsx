import React, { useState, useCallback, useRef, useEffect } from 'react';
import { clsx } from 'clsx';

// Component Types
interface ComponentDefinition {
  id: string;
  type: string;
  category: string;
  label: string;
  icon: React.FC;
  defaultProps?: Record<string, any>;
  customizable?: boolean;
}

interface DroppedComponent {
  id: string;
  type: string;
  props: Record<string, any>;
  children?: DroppedComponent[];
}

// Component Categories
const ComponentCategories = {
  LAYOUT: 'Layout',
  CONTENT: 'Content',
  MEDIA: 'Media',
  FORMS: 'Forms',
  NAVIGATION: 'Navigation',
  ECOMMERCE: 'E-commerce',
  SOCIAL: 'Social',
  DATA: 'Data Display',
  FEEDBACK: 'Feedback',
  ADVANCED: 'Advanced',
};

// Component Icons
const ComponentIcons = {
  Section: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  Grid: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  Text: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
};

// Component Palette - 50+ Components
const componentPalette: ComponentDefinition[] = [
  // Layout Components
  { id: 'section', type: 'section', category: ComponentCategories.LAYOUT, label: 'Section', icon: ComponentIcons.Section },
  { id: 'container', type: 'container', category: ComponentCategories.LAYOUT, label: 'Container', icon: ComponentIcons.Section },
  { id: 'grid', type: 'grid', category: ComponentCategories.LAYOUT, label: 'Grid', icon: ComponentIcons.Grid },
  { id: 'flexbox', type: 'flexbox', category: ComponentCategories.LAYOUT, label: 'Flexbox', icon: ComponentIcons.Grid },
  { id: 'columns', type: 'columns', category: ComponentCategories.LAYOUT, label: 'Columns', icon: ComponentIcons.Grid },
  { id: 'spacer', type: 'spacer', category: ComponentCategories.LAYOUT, label: 'Spacer', icon: ComponentIcons.Section },
  { id: 'divider', type: 'divider', category: ComponentCategories.LAYOUT, label: 'Divider', icon: ComponentIcons.Section },

  // Content Components
  { id: 'heading', type: 'heading', category: ComponentCategories.CONTENT, label: 'Heading', icon: ComponentIcons.Text },
  { id: 'paragraph', type: 'paragraph', category: ComponentCategories.CONTENT, label: 'Paragraph', icon: ComponentIcons.Text },
  { id: 'richtext', type: 'richtext', category: ComponentCategories.CONTENT, label: 'Rich Text', icon: ComponentIcons.Text },
  { id: 'quote', type: 'quote', category: ComponentCategories.CONTENT, label: 'Quote', icon: ComponentIcons.Text },
  { id: 'list', type: 'list', category: ComponentCategories.CONTENT, label: 'List', icon: ComponentIcons.Text },
  { id: 'code', type: 'code', category: ComponentCategories.CONTENT, label: 'Code Block', icon: ComponentIcons.Text },

  // Media Components
  { id: 'image', type: 'image', category: ComponentCategories.MEDIA, label: 'Image', icon: ComponentIcons.Section },
  { id: 'video', type: 'video', category: ComponentCategories.MEDIA, label: 'Video', icon: ComponentIcons.Section },
  { id: 'audio', type: 'audio', category: ComponentCategories.MEDIA, label: 'Audio', icon: ComponentIcons.Section },
  { id: 'gallery', type: 'gallery', category: ComponentCategories.MEDIA, label: 'Gallery', icon: ComponentIcons.Grid },
  { id: 'carousel', type: 'carousel', category: ComponentCategories.MEDIA, label: 'Carousel', icon: ComponentIcons.Grid },
  { id: 'lightbox', type: 'lightbox', category: ComponentCategories.MEDIA, label: 'Lightbox', icon: ComponentIcons.Section },

  // Form Components
  { id: 'form', type: 'form', category: ComponentCategories.FORMS, label: 'Form', icon: ComponentIcons.Section },
  { id: 'input', type: 'input', category: ComponentCategories.FORMS, label: 'Input', icon: ComponentIcons.Section },
  { id: 'textarea', type: 'textarea', category: ComponentCategories.FORMS, label: 'Textarea', icon: ComponentIcons.Section },
  { id: 'select', type: 'select', category: ComponentCategories.FORMS, label: 'Select', icon: ComponentIcons.Section },
  { id: 'checkbox', type: 'checkbox', category: ComponentCategories.FORMS, label: 'Checkbox', icon: ComponentIcons.Section },
  { id: 'radio', type: 'radio', category: ComponentCategories.FORMS, label: 'Radio', icon: ComponentIcons.Section },
  { id: 'switch', type: 'switch', category: ComponentCategories.FORMS, label: 'Switch', icon: ComponentIcons.Section },
  { id: 'datepicker', type: 'datepicker', category: ComponentCategories.FORMS, label: 'Date Picker', icon: ComponentIcons.Section },

  // Navigation Components
  { id: 'navbar', type: 'navbar', category: ComponentCategories.NAVIGATION, label: 'Navbar', icon: ComponentIcons.Section },
  { id: 'menu', type: 'menu', category: ComponentCategories.NAVIGATION, label: 'Menu', icon: ComponentIcons.Section },
  { id: 'breadcrumb', type: 'breadcrumb', category: ComponentCategories.NAVIGATION, label: 'Breadcrumb', icon: ComponentIcons.Section },
  { id: 'pagination', type: 'pagination', category: ComponentCategories.NAVIGATION, label: 'Pagination', icon: ComponentIcons.Section },
  { id: 'tabs', type: 'tabs', category: ComponentCategories.NAVIGATION, label: 'Tabs', icon: ComponentIcons.Section },

  // E-commerce Components
  { id: 'productcard', type: 'productcard', category: ComponentCategories.ECOMMERCE, label: 'Product Card', icon: ComponentIcons.Section },
  { id: 'pricetable', type: 'pricetable', category: ComponentCategories.ECOMMERCE, label: 'Price Table', icon: ComponentIcons.Grid },
  { id: 'cart', type: 'cart', category: ComponentCategories.ECOMMERCE, label: 'Cart', icon: ComponentIcons.Section },
  { id: 'checkout', type: 'checkout', category: ComponentCategories.ECOMMERCE, label: 'Checkout', icon: ComponentIcons.Section },

  // Social Components
  { id: 'socialshare', type: 'socialshare', category: ComponentCategories.SOCIAL, label: 'Social Share', icon: ComponentIcons.Section },
  { id: 'comments', type: 'comments', category: ComponentCategories.SOCIAL, label: 'Comments', icon: ComponentIcons.Section },
  { id: 'rating', type: 'rating', category: ComponentCategories.SOCIAL, label: 'Rating', icon: ComponentIcons.Section },
  { id: 'testimonial', type: 'testimonial', category: ComponentCategories.SOCIAL, label: 'Testimonial', icon: ComponentIcons.Section },

  // Data Display Components
  { id: 'table', type: 'table', category: ComponentCategories.DATA, label: 'Table', icon: ComponentIcons.Grid },
  { id: 'chart', type: 'chart', category: ComponentCategories.DATA, label: 'Chart', icon: ComponentIcons.Grid },
  { id: 'timeline', type: 'timeline', category: ComponentCategories.DATA, label: 'Timeline', icon: ComponentIcons.Section },
  { id: 'stats', type: 'stats', category: ComponentCategories.DATA, label: 'Stats', icon: ComponentIcons.Grid },

  // Feedback Components
  { id: 'alert', type: 'alert', category: ComponentCategories.FEEDBACK, label: 'Alert', icon: ComponentIcons.Section },
  { id: 'modal', type: 'modal', category: ComponentCategories.FEEDBACK, label: 'Modal', icon: ComponentIcons.Section },
  { id: 'toast', type: 'toast', category: ComponentCategories.FEEDBACK, label: 'Toast', icon: ComponentIcons.Section },
  { id: 'progress', type: 'progress', category: ComponentCategories.FEEDBACK, label: 'Progress', icon: ComponentIcons.Section },

  // Advanced Components
  { id: 'accordion', type: 'accordion', category: ComponentCategories.ADVANCED, label: 'Accordion', icon: ComponentIcons.Section },
  { id: 'map', type: 'map', category: ComponentCategories.ADVANCED, label: 'Map', icon: ComponentIcons.Section },
  { id: 'calendar', type: 'calendar', category: ComponentCategories.ADVANCED, label: 'Calendar', icon: ComponentIcons.Grid },
  { id: 'countdown', type: 'countdown', category: ComponentCategories.ADVANCED, label: 'Countdown', icon: ComponentIcons.Section },
  { id: 'qrcode', type: 'qrcode', category: ComponentCategories.ADVANCED, label: 'QR Code', icon: ComponentIcons.Section },
];

export interface PageBuilderProps {
  initialContent?: DroppedComponent[];
  onSave?: (content: DroppedComponent[]) => void;
  onPublish?: (content: DroppedComponent[]) => void;
  mode?: 'edit' | 'preview';
}

export const PageBuilder: React.FC<PageBuilderProps> = ({
  initialContent = [],
  onSave,
  onPublish,
  mode = 'edit',
}) => {
  const [components, setComponents] = useState<DroppedComponent[]>(initialContent);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [draggedComponent, setDraggedComponent] = useState<ComponentDefinition | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(100);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Handle drag start from palette
  const handleDragStart = (component: ComponentDefinition) => {
    setDraggedComponent(component);
  };

  // Handle drag over canvas
  const handleDragOver = (e: React.DragEvent, index?: number) => {
    e.preventDefault();
    setDragOverIndex(index ?? components.length);
  };

  // Handle drop on canvas
  const handleDrop = (e: React.DragEvent, index?: number) => {
    e.preventDefault();
    if (draggedComponent) {
      const newComponent: DroppedComponent = {
        id: `${draggedComponent.type}_${Date.now()}`,
        type: draggedComponent.type,
        props: draggedComponent.defaultProps || {},
      };

      const targetIndex = index ?? components.length;
      const newComponents = [...components];
      newComponents.splice(targetIndex, 0, newComponent);
      setComponents(newComponents);
      setDraggedComponent(null);
      setDragOverIndex(null);
    }
  };

  // Delete component
  const deleteComponent = (id: string) => {
    setComponents(components.filter(c => c.id !== id));
    setSelectedComponent(null);
  };

  // Duplicate component
  const duplicateComponent = (id: string) => {
    const componentToDuplicate = components.find(c => c.id === id);
    if (componentToDuplicate) {
      const newComponent = {
        ...componentToDuplicate,
        id: `${componentToDuplicate.type}_${Date.now()}`,
      };
      const index = components.findIndex(c => c.id === id);
      const newComponents = [...components];
      newComponents.splice(index + 1, 0, newComponent);
      setComponents(newComponents);
    }
  };

  // Move component up/down
  const moveComponent = (id: string, direction: 'up' | 'down') => {
    const index = components.findIndex(c => c.id === id);
    if (
      (direction === 'up' && index > 0) ||
      (direction === 'down' && index < components.length - 1)
    ) {
      const newComponents = [...components];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [newComponents[index], newComponents[targetIndex]] = [
        newComponents[targetIndex],
        newComponents[index],
      ];
      setComponents(newComponents);
    }
  };

  // Get viewport classes
  const getViewportClasses = () => {
    switch (viewMode) {
      case 'tablet':
        return 'max-w-3xl';
      case 'mobile':
        return 'max-w-sm';
      default:
        return 'w-full';
    }
  };

  // Filter components by category
  const filteredComponents = selectedCategory === 'all'
    ? componentPalette
    : componentPalette.filter(c => c.category === selectedCategory);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Component Palette Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
        {/* Palette Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 z-10">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Component Library
          </h3>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Categories</option>
            {Object.values(ComponentCategories).map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Component Grid */}
        <div className="p-4 grid grid-cols-2 gap-3">
          {filteredComponents.map(component => (
            <div
              key={component.id}
              draggable
              onDragStart={() => handleDragStart(component)}
              className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg cursor-move hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-600 transition-all group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-2 text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  <component.icon />
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                  {component.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left Actions */}
            <div className="flex items-center space-x-4">
              {/* Viewport Switcher */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('desktop')}
                  className={clsx(
                    'px-3 py-1 rounded transition-colors',
                    viewMode === 'desktop'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-300'
                  )}
                  title="Desktop View"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('tablet')}
                  className={clsx(
                    'px-3 py-1 rounded transition-colors',
                    viewMode === 'tablet'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-300'
                  )}
                  title="Tablet View"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('mobile')}
                  className={clsx(
                    'px-3 py-1 rounded transition-colors',
                    viewMode === 'mobile'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-300'
                  )}
                  title="Mobile View"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>

              {/* Zoom Control */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setZoom(Math.max(50, zoom - 10))}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-300 min-w-[50px] text-center">
                  {zoom}%
                </span>
                <button
                  onClick={() => setZoom(Math.min(150, zoom + 10))}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              {/* Grid Toggle */}
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={clsx(
                  'p-2 rounded-lg transition-colors',
                  showGrid
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                )}
                title="Toggle Grid"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setComponents([])}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => onSave?.(components)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Save Draft
              </button>
              <button
                onClick={() => onPublish?.(components)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Publish
              </button>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 p-8">
          <div className="flex justify-center">
            <div
              ref={canvasRef}
              className={clsx(
                'bg-white dark:bg-gray-800 shadow-xl rounded-lg transition-all duration-300',
                getViewportClasses(),
                showGrid && 'bg-grid-pattern'
              )}
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
              onDragOver={(e) => handleDragOver(e)}
              onDrop={(e) => handleDrop(e)}
            >
              {/* Canvas Content */}
              <div className="min-h-[600px] p-8">
                {components.length === 0 ? (
                  <div className="h-96 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Drag components here to start building
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {components.map((component, index) => (
                      <div
                        key={component.id}
                        className={clsx(
                          'relative group border-2 rounded-lg p-4 transition-all',
                          selectedComponent === component.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600',
                          dragOverIndex === index && 'border-t-4 border-t-blue-500'
                        )}
                        onClick={() => setSelectedComponent(component.id)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                      >
                        {/* Component Actions */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                          <button
                            onClick={() => moveComponent(component.id, 'up')}
                            className="p-1 bg-white dark:bg-gray-700 rounded shadow hover:bg-gray-100 dark:hover:bg-gray-600"
                            title="Move Up"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => moveComponent(component.id, 'down')}
                            className="p-1 bg-white dark:bg-gray-700 rounded shadow hover:bg-gray-100 dark:hover:bg-gray-600"
                            title="Move Down"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => duplicateComponent(component.id)}
                            className="p-1 bg-white dark:bg-gray-700 rounded shadow hover:bg-gray-100 dark:hover:bg-gray-600"
                            title="Duplicate"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteComponent(component.id)}
                            className="p-1 bg-red-500 text-white rounded shadow hover:bg-red-600"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                        {/* Component Preview */}
                        <div className="min-h-[60px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                          <div className="text-center">
                            <div className="text-sm font-medium">{component.type}</div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              Component #{index + 1}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Properties Panel */}
      {selectedComponent && (
        <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Properties
              </h3>
              <button
                onClick={() => setSelectedComponent(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Component Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Component Type
              </label>
              <input
                type="text"
                value={components.find(c => c.id === selectedComponent)?.type || ''}
                disabled
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
            </div>

            {/* Placeholder for more properties */}
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Additional properties and customization options will appear here based on the selected component type.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PageBuilder;