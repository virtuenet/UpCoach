import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import axios from 'axios';
import { format, addDays } from 'date-fns';

/**
 * Predictive Analytics Dashboard
 *
 * Interactive dashboard for viewing forecasts, trends, and predictive insights.
 *
 * Features:
 * - Forecast visualizations with confidence intervals
 * - Trend analysis
 * - Anomaly timeline
 * - What-if scenario builder
 * - Export predictions
 * - Historical vs. Predicted comparison
 */

interface Forecast {
  metric: string;
  predictions: ForecastPoint[];
  confidence: number;
  algorithm: string;
  metadata: {
    mape: number;
    rmse: number;
    mae: number;
    r2: number;
    trainedAt: string;
  };
}

interface ForecastPoint {
  timestamp: string;
  value: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
}

interface Anomaly {
  id: string;
  timestamp: string;
  metric: string;
  value: number;
  expected: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
}

interface Scenario {
  id: string;
  name: string;
  parameters: {
    growthRate: number;
    seasonalityFactor: number;
  };
}

const METRICS = [
  { value: 'revenue', label: 'Revenue' },
  { value: 'users', label: 'Active Users' },
  { value: 'goals_completed', label: 'Goals Completed' },
  { value: 'engagement_score', label: 'Engagement Score' },
  { value: 'churn_rate', label: 'Churn Rate' },
];

const FORECAST_HORIZONS = [
  { value: 7, label: '7 Days' },
  { value: 30, label: '30 Days' },
  { value: 90, label: '90 Days' },
  { value: 365, label: '1 Year' },
];

const ALGORITHMS = [
  { value: 'auto', label: 'Auto-Select' },
  { value: 'exponential_smoothing', label: 'Exponential Smoothing' },
  { value: 'arima', label: 'ARIMA' },
  { value: 'linear_regression', label: 'Linear Regression' },
];

export const PredictiveDashboard: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [horizon, setHorizon] = useState(30);
  const [algorithm, setAlgorithm] = useState('auto');
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showScenarioBuilder, setShowScenarioBuilder] = useState(false);

  useEffect(() => {
    loadForecast();
    loadAnomalies();
  }, [selectedMetric, horizon, algorithm]);

  const loadForecast = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/v1/analytics/forecast', {
        params: {
          metric: selectedMetric,
          horizon,
          algorithm: algorithm === 'auto' ? undefined : algorithm,
        },
      });

      setForecast(response.data.forecast);
      setHistoricalData(response.data.historical);
    } catch (error) {
      console.error('Failed to load forecast:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnomalies = async () => {
    try {
      const response = await axios.get('/api/v1/analytics/anomalies', {
        params: {
          metric: selectedMetric,
          days: 90,
        },
      });

      setAnomalies(response.data.anomalies);
    } catch (error) {
      console.error('Failed to load anomalies:', error);
    }
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      const response = await axios.post(
        '/api/v1/analytics/forecast/export',
        {
          metric: selectedMetric,
          horizon,
          format,
        },
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `forecast-${selectedMetric}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleCreateScenario = async (scenario: Scenario) => {
    try {
      const response = await axios.post('/api/v1/analytics/scenarios', {
        metric: selectedMetric,
        horizon,
        scenario,
      });

      setScenarios([...scenarios, response.data.scenario]);
      setShowScenarioBuilder(false);
    } catch (error) {
      console.error('Failed to create scenario:', error);
    }
  };

  const prepareChartData = () => {
    if (!forecast || !historicalData) return [];

    const historical = historicalData.map(point => ({
      date: format(new Date(point.timestamp), 'MMM dd'),
      actual: point.value,
      type: 'historical',
    }));

    const predicted = forecast.predictions.map(point => ({
      date: format(new Date(point.timestamp), 'MMM dd'),
      predicted: point.value,
      lower: point.confidenceInterval.lower,
      upper: point.confidenceInterval.upper,
      type: 'forecast',
    }));

    return [...historical, ...predicted];
  };

  const getAnomalySeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#DC2626';
      case 'high':
        return '#F59E0B';
      case 'medium':
        return '#3B82F6';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  return (
    <div className="predictive-dashboard p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Predictive Analytics</h1>
        <p className="text-gray-600 mt-2">
          AI-powered forecasting and trend analysis
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Metric
            </label>
            <select
              value={selectedMetric}
              onChange={e => setSelectedMetric(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {METRICS.map(metric => (
                <option key={metric.value} value={metric.value}>
                  {metric.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Forecast Horizon
            </label>
            <select
              value={horizon}
              onChange={e => setHorizon(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {FORECAST_HORIZONS.map(h => (
                <option key={h.value} value={h.value}>
                  {h.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Algorithm
            </label>
            <select
              value={algorithm}
              onChange={e => setAlgorithm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {ALGORITHMS.map(algo => (
                <option key={algo.value} value={algo.value}>
                  {algo.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={loadForecast}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Generate Forecast'}
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Overview */}
      {forecast && (
        <div className="grid grid-cols-5 gap-4 mb-6">
          <MetricCard
            title="Confidence"
            value={`${forecast.confidence.toFixed(1)}%`}
            icon="🎯"
            trend={forecast.confidence > 80 ? 'up' : 'down'}
          />
          <MetricCard
            title="Algorithm"
            value={forecast.algorithm.replace(/_/g, ' ')}
            icon="🤖"
          />
          <MetricCard
            title="MAPE"
            value={`${forecast.metadata.mape.toFixed(2)}%`}
            icon="📊"
            subtitle="Accuracy"
          />
          <MetricCard
            title="R²"
            value={forecast.metadata.r2.toFixed(3)}
            icon="📈"
            subtitle="Goodness of Fit"
          />
          <MetricCard
            title="Data Points"
            value={historicalData.length.toString()}
            icon="📋"
            subtitle="Training Size"
          />
        </div>
      )}

      {/* Main Forecast Chart */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Forecast with Confidence Intervals
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowScenarioBuilder(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              What-If Analysis
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Export PDF
            </button>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={prepareChartData()}>
            <defs>
              <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />

            {/* Confidence Interval */}
            <Area
              type="monotone"
              dataKey="upper"
              stroke="none"
              fill="url(#confidenceGradient)"
              fillOpacity={0.3}
              name="Upper Bound"
            />
            <Area
              type="monotone"
              dataKey="lower"
              stroke="none"
              fill="url(#confidenceGradient)"
              fillOpacity={0.3}
              name="Lower Bound"
            />

            {/* Actual Data */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Actual"
            />

            {/* Forecast */}
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#3B82F6"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3 }}
              name="Forecast"
            />

            {/* Mark transition point */}
            {historicalData.length > 0 && (
              <ReferenceLine
                x={format(
                  new Date(historicalData[historicalData.length - 1].timestamp),
                  'MMM dd'
                )}
                stroke="#9CA3AF"
                strokeDasharray="3 3"
                label="Today"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Anomaly Timeline */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Anomaly Detection Timeline
        </h2>

        <div className="space-y-4">
          {anomalies.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No anomalies detected in the selected time range
            </p>
          ) : (
            anomalies.map(anomaly => (
              <div
                key={anomaly.id}
                className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
              >
                <div
                  className="w-3 h-3 rounded-full mr-4"
                  style={{ backgroundColor: getAnomalySeverityColor(anomaly.severity) }}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-900">
                        {anomaly.type.replace(/_/g, ' ')}
                      </span>
                      <span className="mx-2 text-gray-400">•</span>
                      <span className="text-sm text-gray-600">
                        {format(new Date(anomaly.timestamp), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        anomaly.severity === 'critical'
                          ? 'bg-red-100 text-red-800'
                          : anomaly.severity === 'high'
                          ? 'bg-orange-100 text-orange-800'
                          : anomaly.severity === 'medium'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {anomaly.severity}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    Actual: <span className="font-medium">{anomaly.value.toFixed(2)}</span>
                    {' • '}
                    Expected: <span className="font-medium">{anomaly.expected.toFixed(2)}</span>
                    {' • '}
                    Deviation:{' '}
                    <span className="font-medium">
                      {((anomaly.value - anomaly.expected) / anomaly.expected * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Trend Decomposition */}
      {forecast?.decomposition && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Seasonal Decomposition
          </h2>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Trend</h3>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart
                  data={forecast.decomposition.trend.map((v, i) => ({ x: i, y: v }))}
                >
                  <Line type="monotone" dataKey="y" stroke="#3B82F6" dot={false} />
                  <YAxis />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Seasonal</h3>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart
                  data={forecast.decomposition.seasonal.map((v, i) => ({ x: i, y: v }))}
                >
                  <Line type="monotone" dataKey="y" stroke="#10B981" dot={false} />
                  <YAxis />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Residual</h3>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart
                  data={forecast.decomposition.residual.map((v, i) => ({ x: i, y: v }))}
                >
                  <Line type="monotone" dataKey="y" stroke="#F59E0B" dot={false} />
                  <YAxis />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Seasonal Period:</strong> {forecast.decomposition.period} days
            </p>
          </div>
        </div>
      )}

      {/* Scenario Builder Modal */}
      {showScenarioBuilder && (
        <ScenarioBuilderModal
          metric={selectedMetric}
          onClose={() => setShowScenarioBuilder(false)}
          onCreate={handleCreateScenario}
        />
      )}
    </div>
  );
};

const MetricCard: React.FC<{
  title: string;
  value: string;
  icon: string;
  trend?: 'up' | 'down';
  subtitle?: string;
}> = ({ title, value, icon, trend, subtitle }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
      {trend && (
        <div
          className={`text-xs mt-2 ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {trend === 'up' ? '↑' : '↓'} {trend === 'up' ? 'High' : 'Low'} confidence
        </div>
      )}
    </div>
  );
};

const ScenarioBuilderModal: React.FC<{
  metric: string;
  onClose: () => void;
  onCreate: (scenario: Scenario) => void;
}> = ({ metric, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [growthRate, setGrowthRate] = useState(0);
  const [seasonalityFactor, setSeasonalityFactor] = useState(1);

  const handleCreate = () => {
    onCreate({
      id: `scenario-${Date.now()}`,
      name,
      parameters: {
        growthRate: growthRate / 100,
        seasonalityFactor,
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Create What-If Scenario</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scenario Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g., Optimistic Growth"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Growth Rate (%)
            </label>
            <input
              type="number"
              value={growthRate}
              onChange={e => setGrowthRate(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              step="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seasonality Factor
            </label>
            <input
              type="number"
              value={seasonalityFactor}
              onChange={e => setSeasonalityFactor(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              step="0.1"
              min="0.1"
              max="2"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Create Scenario
          </button>
        </div>
      </div>
    </div>
  );
};

export default PredictiveDashboard;
