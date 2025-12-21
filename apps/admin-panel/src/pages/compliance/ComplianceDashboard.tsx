/**
 * Compliance Dashboard
 *
 * Unified view of GDPR, HIPAA, and CCPA compliance status.
 * Shows pending requests, breach notifications, and compliance metrics.
 */

import React, { useState, useEffect, useCallback } from 'react';

// Types
interface ComplianceStats {
  gdpr: GDPRStats;
  hipaa: HIPAAStats;
  ccpa: CCPAStats;
  overallCompliant: boolean;
  recommendations: string[];
}

interface GDPRStats {
  totalDSARs: number;
  pendingDSARs: number;
  overdueDSARs: number;
  averageCompletionDays: number;
  breachesPending: number;
  breachesReported: number;
  processingRecords: number;
}

interface HIPAAStats {
  totalAccessLogs: number;
  phiAccessToday: number;
  activeBAAs: number;
  pendingIncidents: number;
  overdueIncidents: number;
  expiredTraining: number;
  riskAssessmentsOverdue: number;
}

interface CCPAStats {
  totalRequests: number;
  pendingRequests: number;
  overdueRequests: number;
  averageCompletionDays: number;
  optOutRate: number;
  gpcSignalCompliance: number;
}

interface ComplianceIssue {
  id: string;
  framework: 'gdpr' | 'hipaa' | 'ccpa';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  dueDate?: Date;
  isOverdue: boolean;
}

interface RecentActivity {
  id: string;
  framework: 'gdpr' | 'hipaa' | 'ccpa';
  type: string;
  description: string;
  timestamp: Date;
  status: 'completed' | 'pending' | 'in_progress';
}

// Mock data generators
const generateMockStats = (): ComplianceStats => ({
  gdpr: {
    totalDSARs: Math.floor(Math.random() * 200) + 50,
    pendingDSARs: Math.floor(Math.random() * 10) + 2,
    overdueDSARs: Math.floor(Math.random() * 3),
    averageCompletionDays: Math.floor(Math.random() * 20) + 5,
    breachesPending: Math.floor(Math.random() * 2),
    breachesReported: Math.floor(Math.random() * 5),
    processingRecords: Math.floor(Math.random() * 20) + 10,
  },
  hipaa: {
    totalAccessLogs: Math.floor(Math.random() * 10000) + 5000,
    phiAccessToday: Math.floor(Math.random() * 500) + 100,
    activeBAAs: Math.floor(Math.random() * 20) + 5,
    pendingIncidents: Math.floor(Math.random() * 5),
    overdueIncidents: Math.floor(Math.random() * 2),
    expiredTraining: Math.floor(Math.random() * 10),
    riskAssessmentsOverdue: Math.floor(Math.random() * 3),
  },
  ccpa: {
    totalRequests: Math.floor(Math.random() * 300) + 100,
    pendingRequests: Math.floor(Math.random() * 15) + 3,
    overdueRequests: Math.floor(Math.random() * 4),
    averageCompletionDays: Math.floor(Math.random() * 30) + 10,
    optOutRate: Math.random() * 0.3 + 0.1,
    gpcSignalCompliance: Math.random() > 0.2 ? 1 : 0,
  },
  overallCompliant: Math.random() > 0.3,
  recommendations: [
    'Process 3 overdue GDPR data subject requests',
    'Schedule HIPAA training for 5 employees with expired certifications',
    'Complete pending CCPA consumer requests within 45 days',
    'Review and update privacy notice for CCPA changes',
  ],
});

const generateMockIssues = (): ComplianceIssue[] => [
  {
    id: '1',
    framework: 'gdpr',
    severity: 'high',
    title: 'Overdue DSAR - Access Request',
    description: 'Data subject access request from John D. is 5 days overdue',
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    isOverdue: true,
  },
  {
    id: '2',
    framework: 'hipaa',
    severity: 'critical',
    title: 'Security Incident Pending',
    description: 'Potential PHI exposure incident requires immediate investigation',
    isOverdue: false,
  },
  {
    id: '3',
    framework: 'ccpa',
    severity: 'medium',
    title: 'GPC Signal Not Honored',
    description: 'Global Privacy Control signal handling needs review',
    isOverdue: false,
  },
  {
    id: '4',
    framework: 'hipaa',
    severity: 'high',
    title: 'Risk Assessment Overdue',
    description: 'Annual HIPAA risk assessment is 30 days overdue',
    dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    isOverdue: true,
  },
];

const generateMockActivities = (): RecentActivity[] => [
  {
    id: '1',
    framework: 'gdpr',
    type: 'DSAR Completed',
    description: 'Erasure request completed for user #12345',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'completed',
  },
  {
    id: '2',
    framework: 'ccpa',
    type: 'Opt-Out Processed',
    description: 'Consumer opted out of data sale',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    status: 'completed',
  },
  {
    id: '3',
    framework: 'hipaa',
    type: 'Training Completed',
    description: '15 employees completed HIPAA training',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    status: 'completed',
  },
  {
    id: '4',
    framework: 'gdpr',
    type: 'Breach Notification',
    description: 'Breach notification sent to supervisory authority',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
    status: 'completed',
  },
  {
    id: '5',
    framework: 'ccpa',
    type: 'Right to Know',
    description: 'Processing consumer right-to-know request',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    status: 'in_progress',
  },
];

export const ComplianceDashboard: React.FC = () => {
  const [stats, setStats] = useState<ComplianceStats | null>(null);
  const [issues, setIssues] = useState<ComplianceIssue[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState<'all' | 'gdpr' | 'hipaa' | 'ccpa'>('all');

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setStats(generateMockStats());
    setIssues(generateMockIssues());
    setActivities(generateMockActivities());
    setRefreshing(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getFrameworkColor = (framework: string): string => {
    switch (framework) {
      case 'gdpr':
        return '#3b82f6'; // Blue
      case 'hipaa':
        return '#8b5cf6'; // Purple
      case 'ccpa':
        return '#10b981'; // Green
      default:
        return '#6b7280';
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return '#ef4444';
      case 'high':
        return '#f97316';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const diff = Date.now() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const filteredIssues = issues.filter(
    (issue) => selectedFramework === 'all' || issue.framework === selectedFramework
  );

  const filteredActivities = activities.filter(
    (activity) => selectedFramework === 'all' || activity.framework === selectedFramework
  );

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Compliance Dashboard</h1>
          <p style={{ color: '#6b7280', margin: '4px 0 0 0' }}>GDPR, HIPAA, and CCPA compliance monitoring</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select
            value={selectedFramework}
            onChange={(e) => setSelectedFramework(e.target.value as any)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              backgroundColor: 'white',
            }}
          >
            <option value="all">All Frameworks</option>
            <option value="gdpr">GDPR</option>
            <option value="hipaa">HIPAA</option>
            <option value="ccpa">CCPA</option>
          </select>
          <button
            onClick={refresh}
            disabled={refreshing}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              opacity: refreshing ? 0.7 : 1,
            }}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Overall Compliance Status */}
      {stats && (
        <div
          style={{
            padding: '20px 24px',
            backgroundColor: stats.overallCompliant ? '#10b98120' : '#ef444420',
            borderLeft: `4px solid ${stats.overallCompliant ? '#10b981' : '#ef4444'}`,
            borderRadius: '8px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: stats.overallCompliant ? '#10b981' : '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px',
              }}
            >
              {stats.overallCompliant ? '✓' : '!'}
            </div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '18px' }}>
                {stats.overallCompliant ? 'Compliant' : 'Action Required'}
              </div>
              <div style={{ color: '#6b7280' }}>
                {stats.overallCompliant
                  ? 'All compliance requirements are being met'
                  : `${stats.recommendations.length} issues require attention`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Framework Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
        {/* GDPR Card */}
        {stats && (
          <FrameworkCard
            title="GDPR"
            subtitle="EU Data Protection"
            color={getFrameworkColor('gdpr')}
            stats={[
              { label: 'Pending DSARs', value: stats.gdpr.pendingDSARs, warning: stats.gdpr.overdueDSARs > 0 },
              { label: 'Avg Completion', value: `${stats.gdpr.averageCompletionDays}d` },
              { label: 'Pending Breaches', value: stats.gdpr.breachesPending, critical: stats.gdpr.breachesPending > 0 },
              { label: 'Processing Records', value: stats.gdpr.processingRecords },
            ]}
          />
        )}

        {/* HIPAA Card */}
        {stats && (
          <FrameworkCard
            title="HIPAA"
            subtitle="Healthcare Privacy"
            color={getFrameworkColor('hipaa')}
            stats={[
              { label: 'PHI Access Today', value: stats.hipaa.phiAccessToday },
              { label: 'Active BAAs', value: stats.hipaa.activeBAAs },
              { label: 'Pending Incidents', value: stats.hipaa.pendingIncidents, warning: stats.hipaa.pendingIncidents > 0 },
              { label: 'Expired Training', value: stats.hipaa.expiredTraining, warning: stats.hipaa.expiredTraining > 0 },
            ]}
          />
        )}

        {/* CCPA Card */}
        {stats && (
          <FrameworkCard
            title="CCPA"
            subtitle="California Privacy"
            color={getFrameworkColor('ccpa')}
            stats={[
              { label: 'Pending Requests', value: stats.ccpa.pendingRequests, warning: stats.ccpa.overdueRequests > 0 },
              { label: 'Avg Completion', value: `${stats.ccpa.averageCompletionDays}d` },
              { label: 'Opt-Out Rate', value: `${(stats.ccpa.optOutRate * 100).toFixed(1)}%` },
              { label: 'GPC Compliance', value: stats.ccpa.gpcSignalCompliance === 1 ? 'Yes' : 'No', critical: stats.ccpa.gpcSignalCompliance < 1 },
            ]}
          />
        )}
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Compliance Issues */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
            Compliance Issues ({filteredIssues.length})
          </h2>
          {filteredIssues.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>No outstanding issues</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredIssues.map((issue) => (
                <div
                  key={issue.id}
                  style={{
                    padding: '12px',
                    backgroundColor: getSeverityColor(issue.severity) + '10',
                    borderLeft: `4px solid ${getSeverityColor(issue.severity)}`,
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor: getFrameworkColor(issue.framework),
                            color: 'white',
                            textTransform: 'uppercase',
                          }}
                        >
                          {issue.framework}
                        </span>
                        {issue.isOverdue && (
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              backgroundColor: '#ef4444',
                              color: 'white',
                            }}
                          >
                            OVERDUE
                          </span>
                        )}
                      </div>
                      <div style={{ fontWeight: '500', marginTop: '8px' }}>{issue.title}</div>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>{issue.description}</div>
                    </div>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        backgroundColor: getSeverityColor(issue.severity),
                        color: 'white',
                        textTransform: 'capitalize',
                      }}
                    >
                      {issue.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Recent Activity</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredActivities.map((activity) => (
              <div
                key={activity.id}
                style={{
                  display: 'flex',
                  alignItems: 'start',
                  gap: '12px',
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: getFrameworkColor(activity.framework),
                    marginTop: '6px',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <div style={{ fontWeight: '500', fontSize: '14px' }}>{activity.type}</div>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>{activity.description}</div>
                    </div>
                    <span style={{ fontSize: '12px', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        backgroundColor: getFrameworkColor(activity.framework) + '20',
                        color: getFrameworkColor(activity.framework),
                        textTransform: 'uppercase',
                      }}
                    >
                      {activity.framework}
                    </span>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        backgroundColor:
                          activity.status === 'completed'
                            ? '#10b98120'
                            : activity.status === 'in_progress'
                              ? '#f59e0b20'
                              : '#6b728020',
                        color:
                          activity.status === 'completed'
                            ? '#10b981'
                            : activity.status === 'in_progress'
                              ? '#f59e0b'
                              : '#6b7280',
                        textTransform: 'capitalize',
                      }}
                    >
                      {activity.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {stats && stats.recommendations.length > 0 && (
        <div style={{ marginTop: '24px', backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Recommendations</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {stats.recommendations.map((rec, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  backgroundColor: '#fef3c720',
                  borderLeft: '4px solid #f59e0b',
                  borderRadius: '8px',
                }}
              >
                <span style={{ color: '#f59e0b', fontSize: '18px' }}>!</span>
                <span style={{ fontSize: '14px' }}>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Framework Card Component
const FrameworkCard: React.FC<{
  title: string;
  subtitle: string;
  color: string;
  stats: Array<{ label: string; value: string | number; warning?: boolean; critical?: boolean }>;
}> = ({ title, subtitle, color, stats }) => (
  <div
    style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      borderTop: `4px solid ${color}`,
    }}
  >
    <div style={{ marginBottom: '16px' }}>
      <div style={{ fontWeight: '600', fontSize: '18px' }}>{title}</div>
      <div style={{ fontSize: '13px', color: '#6b7280' }}>{subtitle}</div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
      {stats.map((stat, index) => (
        <div key={index}>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: stat.critical ? '#ef4444' : stat.warning ? '#f59e0b' : '#111827',
            }}
          >
            {stat.value}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>{stat.label}</div>
        </div>
      ))}
    </div>
  </div>
);

export default ComplianceDashboard;
