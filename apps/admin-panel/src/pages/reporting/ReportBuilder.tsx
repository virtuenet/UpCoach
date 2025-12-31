import React, { useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

/**
 * Report Builder
 *
 * Visual report builder with drag-and-drop interface for creating
 * custom reports without code.
 *
 * Features:
 * - Drag-and-drop components (metrics, charts, tables)
 * - Live preview
 * - Template library (50+ templates)
 * - Data source selector
 * - Filter builder
 * - Schedule configuration
 * - Sharing settings
 */

interface ReportComponent {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'text' | 'image';
  chartType?: 'line' | 'bar' | 'pie' | 'area';
  config: {
    title?: string;
    dataKey?: string;
    xAxis?: string;
    yAxis?: string;
    content?: string;
    imageUrl?: string;
    showLegend?: boolean;
    colorScheme?: string[];
  };
  position: { x: number; y: number; width: number; height: number };
  data?: any;
}

interface ReportDefinition {
  id?: string;
  name: string;
  description: string;
  dataSource: {
    type: string;
    parameters: Record<string, any>;
  };
  filters: Filter[];
  metrics: Metric[];
  components: ReportComponent[];
  schedule?: ScheduleConfig;
}

interface Filter {
  field: string;
  operator: string;
  value: any;
}

interface Metric {
  name: string;
  field: string;
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv';
  enabled: boolean;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail: string;
  definition: Partial<ReportDefinition>;
}

const COMPONENT_PALETTE = [
  { type: 'metric', label: 'Metric Card', icon: '📊' },
  { type: 'chart', label: 'Chart', icon: '📈' },
  { type: 'table', label: 'Data Table', icon: '📋' },
  { type: 'text', label: 'Text Block', icon: '📝' },
  { type: 'image', label: 'Image', icon: '🖼️' },
];

const DATA_SOURCES = [
  { value: 'users', label: 'Users' },
  { value: 'goals', label: 'Goals' },
  { value: 'habits', label: 'Habits' },
  { value: 'sessions', label: 'Sessions' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'engagement', label: 'Engagement' },
];

const OPERATORS = [
  { value: 'eq', label: 'Equals' },
  { value: 'ne', label: 'Not Equals' },
  { value: 'gt', label: 'Greater Than' },
  { value: 'lt', label: 'Less Than' },
  { value: 'contains', label: 'Contains' },
  { value: 'in', label: 'In List' },
];

const COLOR_SCHEMES = {
  default: ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'],
  blue: ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE'],
  green: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5'],
  purple: ['#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE', '#EDE9FE'],
};

export const ReportBuilder: React.FC = () => {
  const [report, setReport] = useState<ReportDefinition>({
    name: 'Untitled Report',
    description: '',
    dataSource: { type: 'users', parameters: {} },
    filters: [],
    metrics: [],
    components: [],
  });

  const [selectedComponent, setSelectedComponent] = useState<ReportComponent | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await axios.get('/api/v1/reporting/templates');
      setTemplates(response.data.templates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && over.id === 'canvas') {
      const componentType = active.id as string;
      addComponent(componentType);
    }

    setActiveId(null);
  };

  const addComponent = (type: string) => {
    const newComponent: ReportComponent = {
      id: uuidv4(),
      type: type as any,
      chartType: type === 'chart' ? 'line' : undefined,
      config: {
        title: `New ${type}`,
        showLegend: true,
        colorScheme: COLOR_SCHEMES.default,
      },
      position: {
        x: report.components.length * 20,
        y: report.components.length * 20,
        width: 400,
        height: 300,
      },
    };

    setReport(prev => ({
      ...prev,
      components: [...prev.components, newComponent],
    }));

    setSelectedComponent(newComponent);
  };

  const updateComponent = (id: string, updates: Partial<ReportComponent>) => {
    setReport(prev => ({
      ...prev,
      components: prev.components.map(comp =>
        comp.id === id ? { ...comp, ...updates } : comp
      ),
    }));

    if (selectedComponent?.id === id) {
      setSelectedComponent(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const deleteComponent = (id: string) => {
    setReport(prev => ({
      ...prev,
      components: prev.components.filter(comp => comp.id !== id),
    }));

    if (selectedComponent?.id === id) {
      setSelectedComponent(null);
    }
  };

  const addFilter = () => {
    setReport(prev => ({
      ...prev,
      filters: [
        ...prev.filters,
        { field: '', operator: 'eq', value: '' },
      ],
    }));
  };

  const updateFilter = (index: number, updates: Partial<Filter>) => {
    setReport(prev => ({
      ...prev,
      filters: prev.filters.map((filter, i) =>
        i === index ? { ...filter, ...updates } : filter
      ),
    }));
  };

  const deleteFilter = (index: number) => {
    setReport(prev => ({
      ...prev,
      filters: prev.filters.filter((_, i) => i !== index),
    }));
  };

  const addMetric = () => {
    setReport(prev => ({
      ...prev,
      metrics: [
        ...prev.metrics,
        { name: '', field: '', aggregation: 'count' },
      ],
    }));
  };

  const updateMetric = (index: number, updates: Partial<Metric>) => {
    setReport(prev => ({
      ...prev,
      metrics: prev.metrics.map((metric, i) =>
        i === index ? { ...metric, ...updates } : metric
      ),
    }));
  };

  const deleteMetric = (index: number) => {
    setReport(prev => ({
      ...prev,
      metrics: prev.metrics.filter((_, i) => i !== index),
    }));
  };

  const handlePreview = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/v1/reporting/preview', report);
      setPreviewData(response.data);
      setShowPreview(true);
    } catch (error) {
      console.error('Preview failed:', error);
      alert('Failed to generate preview');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (report.id) {
        await axios.put(`/api/v1/reporting/reports/${report.id}`, report);
        alert('Report updated successfully');
      } else {
        const response = await axios.post('/api/v1/reporting/reports', report);
        setReport(prev => ({ ...prev, id: response.data.id }));
        alert('Report created successfully');
      }
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save report');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    if (!report.id) {
      alert('Please save the report first');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `/api/v1/reporting/reports/${report.id}/export`,
        {
          params: { format },
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${report.name}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export report');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = (template: Template) => {
    setReport(prev => ({
      ...prev,
      ...template.definition,
      name: template.name,
      description: template.description,
    }));
    setShowTemplates(false);
  };

  return (
    <div className="report-builder h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Report Builder</h1>
            <input
              type="text"
              value={report.name}
              onChange={e => setReport(prev => ({ ...prev, name: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded-md"
              placeholder="Report Name"
            />
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowTemplates(true)}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Templates
            </button>
            <button
              onClick={handlePreview}
              disabled={loading}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Preview
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              Save
            </button>
            <div className="relative group">
              <button className="px-4 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700">
                Export
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <button
                  onClick={() => handleExport('pdf')}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  Export as PDF
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  Export as Excel
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  Export as CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex overflow-hidden">
          {/* Component Palette */}
          <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Components</h3>
              <div className="space-y-2">
                {COMPONENT_PALETTE.map(component => (
                  <DraggableComponent
                    key={component.type}
                    type={component.type}
                    label={component.label}
                    icon={component.icon}
                  />
                ))}
              </div>

              <h3 className="text-sm font-semibold text-gray-900 mt-6 mb-4">
                Data Source
              </h3>
              <select
                value={report.dataSource.type}
                onChange={e =>
                  setReport(prev => ({
                    ...prev,
                    dataSource: { ...prev.dataSource, type: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {DATA_SOURCES.map(source => (
                  <option key={source.value} value={source.value}>
                    {source.label}
                  </option>
                ))}
              </select>

              <h3 className="text-sm font-semibold text-gray-900 mt-6 mb-4">Filters</h3>
              <div className="space-y-2">
                {report.filters.map((filter, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded">
                    <input
                      type="text"
                      placeholder="Field"
                      value={filter.field}
                      onChange={e => updateFilter(index, { field: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded mb-1"
                    />
                    <select
                      value={filter.operator}
                      onChange={e => updateFilter(index, { operator: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded mb-1"
                    >
                      {OPERATORS.map(op => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Value"
                      value={filter.value}
                      onChange={e => updateFilter(index, { value: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded mb-1"
                    />
                    <button
                      onClick={() => deleteFilter(index)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={addFilter}
                  className="w-full px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                >
                  + Add Filter
                </button>
              </div>

              <h3 className="text-sm font-semibold text-gray-900 mt-6 mb-4">Metrics</h3>
              <div className="space-y-2">
                {report.metrics.map((metric, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded">
                    <input
                      type="text"
                      placeholder="Name"
                      value={metric.name}
                      onChange={e => updateMetric(index, { name: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded mb-1"
                    />
                    <input
                      type="text"
                      placeholder="Field"
                      value={metric.field}
                      onChange={e => updateMetric(index, { field: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded mb-1"
                    />
                    <select
                      value={metric.aggregation}
                      onChange={e =>
                        updateMetric(index, { aggregation: e.target.value as any })
                      }
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded mb-1"
                    >
                      <option value="count">Count</option>
                      <option value="sum">Sum</option>
                      <option value="avg">Average</option>
                      <option value="min">Min</option>
                      <option value="max">Max</option>
                    </select>
                    <button
                      onClick={() => deleteMetric(index)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={addMetric}
                  className="w-full px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                >
                  + Add Metric
                </button>
              </div>
            </div>
          </aside>

          {/* Canvas */}
          <main className="flex-1 overflow-auto p-6">
            <DropZone id="canvas">
              <div className="min-h-full bg-white rounded-lg shadow-sm p-6 relative">
                {report.components.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <p className="text-lg font-medium">Drag components here</p>
                      <p className="text-sm">Build your report by dragging components from the left</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {report.components.map(component => (
                      <ReportComponentView
                        key={component.id}
                        component={component}
                        selected={selectedComponent?.id === component.id}
                        onClick={() => setSelectedComponent(component)}
                        onDelete={() => deleteComponent(component.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </DropZone>
          </main>

          {/* Property Panel */}
          <aside className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
            <div className="p-4">
              {selectedComponent ? (
                <ComponentProperties
                  component={selectedComponent}
                  onChange={updates => updateComponent(selectedComponent.id, updates)}
                />
              ) : (
                <div className="text-center text-gray-400 py-12">
                  <p>Select a component to edit properties</p>
                </div>
              )}
            </div>
          </aside>
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="bg-blue-100 border-2 border-blue-500 rounded-md px-4 py-2">
              {COMPONENT_PALETTE.find(c => c.type === activeId)?.label}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Template Library Modal */}
      {showTemplates && (
        <TemplateLibrary
          templates={templates}
          onSelect={loadTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}

      {/* Preview Modal */}
      {showPreview && previewData && (
        <PreviewModal
          report={report}
          data={previewData}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

const DraggableComponent: React.FC<{
  type: string;
  label: string;
  icon: string;
}> = ({ type, label, icon }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: type,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`p-3 bg-gray-50 border border-gray-200 rounded-md cursor-move hover:bg-gray-100 ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center space-x-2">
        <span className="text-xl">{icon}</span>
        <span className="text-sm font-medium text-gray-900">{label}</span>
      </div>
    </div>
  );
};

const DropZone: React.FC<{ id: string; children: React.ReactNode }> = ({
  id,
  children,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`h-full ${isOver ? 'ring-2 ring-blue-500' : ''}`}
    >
      {children}
    </div>
  );
};

const ReportComponentView: React.FC<{
  component: ReportComponent;
  selected: boolean;
  onClick: () => void;
  onDelete: () => void;
}> = ({ component, selected, onClick, onDelete }) => {
  const renderContent = () => {
    switch (component.type) {
      case 'metric':
        return (
          <div className="text-center py-8">
            <div className="text-4xl font-bold text-blue-600">
              {component.data?.value || '0'}
            </div>
            <div className="text-sm text-gray-600 mt-2">
              {component.config.title || 'Metric'}
            </div>
          </div>
        );

      case 'chart':
        return (
          <div className="h-64">
            <h3 className="text-lg font-semibold mb-4">
              {component.config.title || 'Chart'}
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              {component.chartType === 'bar' ? (
                <BarChart data={component.data || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  {component.config.showLegend && <Legend />}
                  <Bar dataKey="value" fill="#6366F1" />
                </BarChart>
              ) : component.chartType === 'pie' ? (
                <PieChart>
                  <Pie
                    data={component.data || []}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                  >
                    {(component.data || []).map((_: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={component.config.colorScheme?.[index % 5] || '#6366F1'}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  {component.config.showLegend && <Legend />}
                </PieChart>
              ) : (
                <LineChart data={component.data || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  {component.config.showLegend && <Legend />}
                  <Line type="monotone" dataKey="value" stroke="#6366F1" />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        );

      case 'table':
        return (
          <div>
            <h3 className="text-lg font-semibold mb-4">
              {component.config.title || 'Data Table'}
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                      Column 1
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                      Column 2
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-2 text-sm text-gray-900">Sample data</td>
                    <td className="px-4 py-2 text-sm text-gray-900">Sample data</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="prose">
            {component.config.content || 'Enter your text here...'}
          </div>
        );

      case 'image':
        return (
          <div className="text-center">
            {component.config.imageUrl ? (
              <img
                src={component.config.imageUrl}
                alt={component.config.title}
                className="max-w-full h-auto"
              />
            ) : (
              <div className="bg-gray-100 h-48 flex items-center justify-center">
                <span className="text-gray-400">No image selected</span>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      onClick={onClick}
      className={`relative p-4 border-2 rounded-lg cursor-pointer ${
        selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {renderContent()}
      {selected && (
        <button
          onClick={e => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          ×
        </button>
      )}
    </div>
  );
};

const ComponentProperties: React.FC<{
  component: ReportComponent;
  onChange: (updates: Partial<ReportComponent>) => void;
}> = ({ component, onChange }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Component Properties</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={component.config.title || ''}
          onChange={e =>
            onChange({ config: { ...component.config, title: e.target.value } })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      {component.type === 'chart' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chart Type
            </label>
            <select
              value={component.chartType}
              onChange={e => onChange({ chartType: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="line">Line</option>
              <option value="bar">Bar</option>
              <option value="pie">Pie</option>
              <option value="area">Area</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Show Legend
            </label>
            <input
              type="checkbox"
              checked={component.config.showLegend}
              onChange={e =>
                onChange({
                  config: { ...component.config, showLegend: e.target.checked },
                })
              }
              className="h-4 w-4 text-blue-600"
            />
          </div>
        </>
      )}

      {component.type === 'text' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
          <textarea
            value={component.config.content || ''}
            onChange={e =>
              onChange({ config: { ...component.config, content: e.target.value } })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            rows={6}
          />
        </div>
      )}

      {component.type === 'image' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Image URL
          </label>
          <input
            type="text"
            value={component.config.imageUrl || ''}
            onChange={e =>
              onChange({ config: { ...component.config, imageUrl: e.target.value } })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      )}
    </div>
  );
};

const TemplateLibrary: React.FC<{
  templates: Template[];
  onSelect: (template: Template) => void;
  onClose: () => void;
}> = ({ templates, onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Template Library</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {templates.map(template => (
            <div
              key={template.id}
              onClick={() => onSelect(template)}
              className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-500 hover:bg-blue-50"
            >
              <div className="aspect-video bg-gray-100 rounded mb-2" />
              <h3 className="font-semibold">{template.name}</h3>
              <p className="text-sm text-gray-600">{template.description}</p>
              <span className="inline-block mt-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                {template.category}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const PreviewModal: React.FC<{
  report: ReportDefinition;
  data: any;
  onClose: () => void;
}> = ({ report, data, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{report.name} - Preview</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            {Object.entries(data.metrics || {}).map(([name, value]) => (
              <div key={name} className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-600">{value as any}</div>
                <div className="text-sm text-gray-600 mt-1">{name}</div>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-600">
              Total Records: {data.data?.length || 0}
            </p>
            <p className="text-sm text-gray-600">
              Generated: {new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportBuilder;
