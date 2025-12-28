import React, { useState, useEffect } from 'react';

// AI Coaching Dashboard - Admin dashboard for AI coaching management (~500 LOC)

interface ConversationMetrics {
  totalConversations: number;
  totalMessages: number;
  activeUsers: number;
  avgMessagesPerConversation: number;
  avgSatisfactionScore: number;
  totalCost: number;
  avgCostPerConversation: number;
}

interface ModelPerformance {
  model: string;
  usage: number;
  avgResponseTime: number;
  avgTokens: number;
  totalCost: number;
  satisfactionScore: number;
}

interface IntentDistribution {
  intent: string;
  count: number;
  percentage: number;
}

const AICoachingDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<ConversationMetrics>({
    totalConversations: 1248,
    totalMessages: 5892,
    activeUsers: 487,
    avgMessagesPerConversation: 4.7,
    avgSatisfactionScore: 4.6,
    totalCost: 324.56,
    avgCostPerConversation: 0.26,
  });

  const [modelPerformance, setModelPerformance] = useState<ModelPerformance[]>([
    {
      model: 'GPT-4',
      usage: 45,
      avgResponseTime: 2.3,
      avgTokens: 856,
      totalCost: 245.32,
      satisfactionScore: 4.8,
    },
    {
      model: 'GPT-3.5 Turbo',
      usage: 35,
      avgResponseTime: 1.1,
      avgTokens: 432,
      totalCost: 42.18,
      satisfactionScore: 4.4,
    },
    {
      model: 'Claude Sonnet',
      usage: 20,
      avgResponseTime: 1.8,
      avgTokens: 678,
      totalCost: 37.06,
      satisfactionScore: 4.7,
    },
  ]);

  const [intentDistribution, setIntentDistribution] = useState<
    IntentDistribution[]
  >([
    { intent: 'Goal Setting', count: 342, percentage: 27 },
    { intent: 'Progress Tracking', count: 298, percentage: 24 },
    { intent: 'Motivation', count: 245, percentage: 20 },
    { intent: 'Problem Solving', count: 187, percentage: 15 },
    { intent: 'Reflection', count: 176, percentage: 14 },
  ]);

  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    // In production, fetch real metrics from API
    fetchMetrics();
  }, [timeRange]);

  const fetchMetrics = async () => {
    // Simulate API call
    console.log(`Fetching metrics for ${timeRange}`);
  };

  return (
    <div className="ai-coaching-dashboard">
      <header className="dashboard-header">
        <h1>AI Coaching Analytics</h1>
        <div className="time-range-selector">
          <button
            className={timeRange === '7d' ? 'active' : ''}
            onClick={() => setTimeRange('7d')}
          >
            Last 7 Days
          </button>
          <button
            className={timeRange === '30d' ? 'active' : ''}
            onClick={() => setTimeRange('30d')}
          >
            Last 30 Days
          </button>
          <button
            className={timeRange === '90d' ? 'active' : ''}
            onClick={() => setTimeRange('90d')}
          >
            Last 90 Days
          </button>
        </div>
      </header>

      {/* Key Metrics */}
      <section className="metrics-grid">
        <div className="metric-card">
          <h3>Total Conversations</h3>
          <div className="metric-value">{metrics.totalConversations.toLocaleString()}</div>
          <div className="metric-change positive">+12.5% vs last period</div>
        </div>

        <div className="metric-card">
          <h3>Active Users</h3>
          <div className="metric-value">{metrics.activeUsers}</div>
          <div className="metric-change positive">+8.3% vs last period</div>
        </div>

        <div className="metric-card">
          <h3>Satisfaction Score</h3>
          <div className="metric-value">{metrics.avgSatisfactionScore.toFixed(1)}/5.0</div>
          <div className="metric-change positive">+0.2 vs last period</div>
        </div>

        <div className="metric-card">
          <h3>Total Cost</h3>
          <div className="metric-value">${metrics.totalCost.toFixed(2)}</div>
          <div className="metric-change">${metrics.avgCostPerConversation.toFixed(3)}/conv</div>
        </div>
      </section>

      {/* Model Performance */}
      <section className="model-performance">
        <h2>Model Performance Comparison</h2>
        <table>
          <thead>
            <tr>
              <th>Model</th>
              <th>Usage %</th>
              <th>Avg Response Time</th>
              <th>Avg Tokens</th>
              <th>Total Cost</th>
              <th>Satisfaction</th>
            </tr>
          </thead>
          <tbody>
            {modelPerformance.map((model) => (
              <tr key={model.model}>
                <td>{model.model}</td>
                <td>{model.usage}%</td>
                <td>{model.avgResponseTime}s</td>
                <td>{model.avgTokens.toLocaleString()}</td>
                <td>${model.totalCost.toFixed(2)}</td>
                <td>
                  <span className="satisfaction-badge">
                    {model.satisfactionScore.toFixed(1)}/5.0
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Intent Distribution */}
      <section className="intent-distribution">
        <h2>Intent Classification Distribution</h2>
        <div className="intent-chart">
          {intentDistribution.map((intent) => (
            <div key={intent.intent} className="intent-bar">
              <div className="intent-label">
                <span>{intent.intent}</span>
                <span>{intent.count} ({intent.percentage}%)</span>
              </div>
              <div className="intent-progress">
                <div
                  className="intent-fill"
                  style={{ width: `${intent.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cost Analysis */}
      <section className="cost-analysis">
        <h2>Cost Per Conversation Trend</h2>
        <div className="cost-chart">
          <svg width="100%" height="200" viewBox="0 0 800 200">
            {/* Simplified line chart */}
            <polyline
              points="0,150 100,140 200,145 300,135 400,130 500,125 600,120 700,115 800,110"
              fill="none"
              stroke="#4CAF50"
              strokeWidth="2"
            />
            <text x="10" y="20" fontSize="12" fill="#666">
              Cost decreasing over time (optimization working!)
            </text>
          </svg>
        </div>
      </section>

      {/* User Satisfaction Heatmap */}
      <section className="satisfaction-heatmap">
        <h2>User Satisfaction by Time of Day</h2>
        <div className="heatmap-grid">
          {Array.from({ length: 24 }, (_, hour) => {
            const satisfaction = 3.5 + Math.random() * 1.5;
            const color = satisfaction > 4.5 ? '#4CAF50' : satisfaction > 4 ? '#FFC107' : '#FF5722';
            return (
              <div
                key={hour}
                className="heatmap-cell"
                style={{ backgroundColor: color }}
                title={`${hour}:00 - ${satisfaction.toFixed(1)}/5.0`}
              >
                {hour}
              </div>
            );
          })}
        </div>
      </section>

      {/* Real-time Activity */}
      <section className="realtime-activity">
        <h2>Real-time Conversations</h2>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-user">User #487</div>
            <div className="activity-intent">Goal Setting</div>
            <div className="activity-model">GPT-4</div>
            <div className="activity-time">2 min ago</div>
            <div className="activity-status active">Active</div>
          </div>
          <div className="activity-item">
            <div className="activity-user">User #322</div>
            <div className="activity-intent">Motivation</div>
            <div className="activity-model">GPT-3.5</div>
            <div className="activity-time">5 min ago</div>
            <div className="activity-status active">Active</div>
          </div>
          <div className="activity-item">
            <div className="activity-user">User #156</div>
            <div className="activity-intent">Progress Tracking</div>
            <div className="activity-model">Claude</div>
            <div className="activity-time">8 min ago</div>
            <div className="activity-status completed">Completed</div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .ai-coaching-dashboard {
          padding: 24px;
          background: #f5f5f5;
          min-height: 100vh;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .dashboard-header h1 {
          font-size: 28px;
          font-weight: 600;
          color: #333;
        }

        .time-range-selector button {
          margin-left: 8px;
          padding: 8px 16px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 4px;
          cursor: pointer;
        }

        .time-range-selector button.active {
          background: #2196F3;
          color: white;
          border-color: #2196F3;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }

        .metric-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .metric-card h3 {
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
        }

        .metric-value {
          font-size: 32px;
          font-weight: 700;
          color: #333;
          margin-bottom: 4px;
        }

        .metric-change {
          font-size: 12px;
          color: #666;
        }

        .metric-change.positive {
          color: #4CAF50;
        }

        section {
          background: white;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          margin-bottom: 24px;
        }

        section h2 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #333;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th,
        td {
          text-align: left;
          padding: 12px;
          border-bottom: 1px solid #eee;
        }

        th {
          font-weight: 600;
          color: #666;
          font-size: 14px;
        }

        .satisfaction-badge {
          background: #4CAF50;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }

        .intent-bar {
          margin-bottom: 16px;
        }

        .intent-label {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          font-size: 14px;
        }

        .intent-progress {
          height: 24px;
          background: #eee;
          border-radius: 4px;
          overflow: hidden;
        }

        .intent-fill {
          height: 100%;
          background: #2196F3;
          transition: width 0.3s ease;
        }

        .heatmap-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 8px;
        }

        .heatmap-cell {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          color: white;
          font-size: 12px;
          font-weight: 600;
        }

        .activity-item {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr auto;
          gap: 16px;
          padding: 12px;
          border-bottom: 1px solid #eee;
          align-items: center;
        }

        .activity-status {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .activity-status.active {
          background: #4CAF50;
          color: white;
        }

        .activity-status.completed {
          background: #ddd;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default AICoachingDashboard;
