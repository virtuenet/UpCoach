/**
 * Audit Log Page
 *
 * Comprehensive audit trail for compliance purposes.
 * Tracks data access, modifications, and security events.
 */

import React, { useState, useEffect, useCallback } from 'react';

// Types
type AuditCategory = 'data_access' | 'data_modification' | 'security' | 'consent' | 'phi_access' | 'export' | 'deletion';
type AuditSeverity = 'info' | 'warning' | 'critical';

interface AuditEntry {
  id: string;
  timestamp: Date;
  category: AuditCategory;
  severity: AuditSeverity;
  action: string;
  userId: string;
  userName: string;
  resourceType: string;
  resourceId: string;
  ipAddress: string;
  userAgent: string;
  details: Record<string, any>;
  framework?: 'gdpr' | 'hipaa' | 'ccpa';
}

interface AuditStats {
  totalEntries: number;
  byCategory: Record<AuditCategory, number>;
  bySeverity: Record<AuditSeverity, number>;
  uniqueUsers: number;
  criticalEvents: number;
  phiAccessCount: number;
}

// Mock data generators
const generateMockAuditEntries = (): AuditEntry[] => {
  const categories: AuditCategory[] = ['data_access', 'data_modification', 'security', 'consent', 'phi_access', 'export', 'deletion'];
  const severities: AuditSeverity[] = ['info', 'info', 'info', 'warning', 'critical']; // Weighted towards info
  const users = [
    { id: 'U001', name: 'John Admin' },
    { id: 'U002', name: 'Sarah Coach' },
    { id: 'U003', name: 'Mike Support' },
    { id: 'U004', name: 'Lisa Privacy' },
    { id: 'U005', name: 'Tom Security' },
  ];
  const actions = {
    data_access: ['Viewed user profile', 'Downloaded user data', 'Accessed analytics', 'Read coaching notes'],
    data_modification: ['Updated user settings', 'Modified profile', 'Changed preferences', 'Updated consent'],
    security: ['Failed login attempt', 'Password changed', 'MFA enabled', 'Session invalidated'],
    consent: ['Consent granted', 'Consent withdrawn', 'Privacy settings updated', 'Cookie preferences changed'],
    phi_access: ['Viewed health data', 'Accessed wellness metrics', 'Read mental health notes', 'Exported health report'],
    export: ['Exported user data', 'Generated report', 'Downloaded backup', 'Created data archive'],
    deletion: ['User account deleted', 'Data erased', 'Records purged', 'Consent records removed'],
  };

  return Array.from({ length: 50 }, (_, i) => {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const user = users[Math.floor(Math.random() * users.length)];
    const severity = category === 'security' || category === 'deletion'
      ? severities[Math.floor(Math.random() * severities.length)]
      : 'info';

    return {
      id: `AUD-${10000 + i}`,
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      category,
      severity,
      action: actions[category][Math.floor(Math.random() * actions[category].length)],
      userId: user.id,
      userName: user.name,
      resourceType: ['User', 'Session', 'Profile', 'Report', 'Consent'][Math.floor(Math.random() * 5)],
      resourceId: `RES-${Math.floor(Math.random() * 10000)}`,
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      details: {
        success: Math.random() > 0.1,
        duration: Math.floor(Math.random() * 500) + 50,
      },
      framework: category === 'phi_access' ? 'hipaa' : category === 'consent' ? 'gdpr' : Math.random() > 0.5 ? 'ccpa' : undefined,
    };
  }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

const generateMockStats = (entries: AuditEntry[]): AuditStats => {
  const byCategory = entries.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + 1;
    return acc;
  }, {} as Record<AuditCategory, number>);

  const bySeverity = entries.reduce((acc, e) => {
    acc[e.severity] = (acc[e.severity] || 0) + 1;
    return acc;
  }, {} as Record<AuditSeverity, number>);

  const uniqueUsers = new Set(entries.map(e => e.userId)).size;

  return {
    totalEntries: entries.length,
    byCategory,
    bySeverity,
    uniqueUsers,
    criticalEvents: entries.filter(e => e.severity === 'critical').length,
    phiAccessCount: entries.filter(e => e.category === 'phi_access').length,
  };
};

export const AuditLogPage: React.FC = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [filterCategory, setFilterCategory] = useState<'all' | AuditCategory>('all');
  const [filterSeverity, setFilterSeverity] = useState<'all' | AuditSeverity>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    const newEntries = generateMockAuditEntries();
    setEntries(newEntries);
    setStats(generateMockStats(newEntries));
    setRefreshing(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getCategoryColor = (category: AuditCategory): string => {
    switch (category) {
      case 'data_access': return '#3b82f6';
      case 'data_modification': return '#f59e0b';
      case 'security': return '#ef4444';
      case 'consent': return '#10b981';
      case 'phi_access': return '#8b5cf6';
      case 'export': return '#6366f1';
      case 'deletion': return '#ec4899';
    }
  };

  const getSeverityColor = (severity: AuditSeverity): string => {
    switch (severity) {
      case 'info': return '#6b7280';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
    }
  };

  const formatTimestamp = (date: Date): string => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCategory = (category: AuditCategory): string => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getDateRangeFilter = (range: string): Date => {
    const now = new Date();
    switch (range) {
      case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default: return new Date(0);
    }
  };

  const filteredEntries = entries.filter(e => {
    if (filterCategory !== 'all' && e.category !== filterCategory) return false;
    if (filterSeverity !== 'all' && e.severity !== filterSeverity) return false;
    if (e.timestamp < getDateRangeFilter(dateRange)) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!e.action.toLowerCase().includes(term) &&
          !e.userName.toLowerCase().includes(term) &&
          !e.resourceId.toLowerCase().includes(term) &&
          !e.ipAddress.includes(term)) return false;
    }
    return true;
  });

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Audit Log</h1>
          <p style={{ color: '#6b7280', margin: '4px 0 0 0' }}>Comprehensive compliance audit trail</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            style={{
              padding: '8px 16px',
              backgroundColor: 'white',
              color: '#374151',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Export CSV
          </button>
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

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <StatCard title="Total Events" value={stats.totalEntries.toString()} />
          <StatCard title="Unique Users" value={stats.uniqueUsers.toString()} />
          <StatCard title="Critical Events" value={stats.criticalEvents.toString()} color={stats.criticalEvents > 0 ? '#ef4444' : '#10b981'} />
          <StatCard title="PHI Access" value={stats.phiAccessCount.toString()} color="#8b5cf6" />
          <StatCard title="Data Access" value={(stats.byCategory.data_access || 0).toString()} color="#3b82f6" />
          <StatCard title="Security Events" value={(stats.byCategory.security || 0).toString()} color="#ef4444" />
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search actions, users, IPs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            width: '280px',
          }}
        />
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as any)}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            backgroundColor: 'white',
          }}
        >
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="all">All time</option>
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as any)}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            backgroundColor: 'white',
          }}
        >
          <option value="all">All Categories</option>
          <option value="data_access">Data Access</option>
          <option value="data_modification">Data Modification</option>
          <option value="security">Security</option>
          <option value="consent">Consent</option>
          <option value="phi_access">PHI Access</option>
          <option value="export">Export</option>
          <option value="deletion">Deletion</option>
        </select>
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value as any)}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            backgroundColor: 'white',
          }}
        >
          <option value="all">All Severities</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Timestamp</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Category</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Action</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>User</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Resource</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>IP Address</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Severity</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.slice(0, 100).map((entry, index) => (
              <tr
                key={entry.id}
                onClick={() => setSelectedEntry(entry)}
                style={{
                  borderBottom: index < filteredEntries.length - 1 ? '1px solid #e5e7eb' : 'none',
                  cursor: 'pointer',
                  backgroundColor: entry.severity === 'critical' ? '#fef2f210' : 'transparent',
                }}
              >
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>
                  {formatTimestamp(entry.timestamp)}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      backgroundColor: getCategoryColor(entry.category) + '20',
                      color: getCategoryColor(entry.category),
                    }}
                  >
                    {formatCategory(entry.category)}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px' }}>{entry.action}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>{entry.userName}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>{entry.userId}</div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontSize: '14px' }}>{entry.resourceType}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>{entry.resourceId}</div>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', fontFamily: 'monospace' }}>
                  {entry.ipAddress}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      backgroundColor: getSeverityColor(entry.severity) + '20',
                      color: getSeverityColor(entry.severity),
                      textTransform: 'capitalize',
                    }}
                  >
                    {entry.severity}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredEntries.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            No audit entries found matching your criteria
          </div>
        )}
        {filteredEntries.length > 100 && (
          <div style={{ padding: '16px', textAlign: 'center', color: '#6b7280', borderTop: '1px solid #e5e7eb' }}>
            Showing 100 of {filteredEntries.length} entries. Export to view all.
          </div>
        )}
      </div>

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setSelectedEntry(null)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              width: '600px',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Audit Entry Details</h2>
                <div style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>{selectedEntry.id}</div>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                style={{
                  padding: '8px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  fontSize: '20px',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <DetailItem label="Timestamp" value={selectedEntry.timestamp.toLocaleString()} />
              <DetailItem label="Category" value={formatCategory(selectedEntry.category)} />
              <DetailItem label="Action" value={selectedEntry.action} />
              <DetailItem label="Severity" value={selectedEntry.severity} />
              <DetailItem label="User" value={`${selectedEntry.userName} (${selectedEntry.userId})`} />
              <DetailItem label="IP Address" value={selectedEntry.ipAddress} />
              <DetailItem label="Resource" value={`${selectedEntry.resourceType}: ${selectedEntry.resourceId}`} />
              {selectedEntry.framework && (
                <DetailItem label="Framework" value={selectedEntry.framework.toUpperCase()} />
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>User Agent</div>
              <div style={{ fontSize: '13px', fontFamily: 'monospace', backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px', wordBreak: 'break-all' }}>
                {selectedEntry.userAgent}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Additional Details</div>
              <pre style={{ fontSize: '13px', fontFamily: 'monospace', backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px', overflow: 'auto', margin: 0 }}>
                {JSON.stringify(selectedEntry.details, null, 2)}
              </pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
              <button
                onClick={() => setSelectedEntry(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Stat Card Component
const StatCard: React.FC<{
  title: string;
  value: string;
  color?: string;
}> = ({ title, value, color = '#111827' }) => (
  <div
    style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    }}
  >
    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>{title}</div>
    <div style={{ fontSize: '24px', fontWeight: 'bold', color }}>{value}</div>
  </div>
);

// Detail Item Component
const DetailItem: React.FC<{
  label: string;
  value: string;
}> = ({ label, value }) => (
  <div>
    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{label}</div>
    <div style={{ fontSize: '14px', fontWeight: '500' }}>{value}</div>
  </div>
);

export default AuditLogPage;
