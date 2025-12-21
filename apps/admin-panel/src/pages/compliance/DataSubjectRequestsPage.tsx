/**
 * Data Subject Requests Page
 *
 * Manage GDPR DSARs, CCPA consumer requests, and HIPAA access requests.
 * Unified view for processing privacy requests across all frameworks.
 */

import React, { useState, useEffect, useCallback } from 'react';

// Types
type RequestFramework = 'gdpr' | 'ccpa' | 'hipaa';
type RequestType =
  | 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection'  // GDPR
  | 'right_to_know' | 'right_to_delete' | 'right_to_opt_out' | 'right_to_correct'  // CCPA
  | 'phi_access' | 'phi_amendment' | 'accounting_of_disclosures';  // HIPAA

type RequestStatus = 'received' | 'verified' | 'in_progress' | 'completed' | 'denied' | 'extended';

interface DataSubjectRequest {
  id: string;
  framework: RequestFramework;
  type: RequestType;
  status: RequestStatus;
  subjectName: string;
  subjectEmail: string;
  submittedAt: Date;
  dueDate: Date;
  extendedDueDate?: Date;
  completedAt?: Date;
  assignedTo?: string;
  notes: string;
  isOverdue: boolean;
}

interface RequestStats {
  total: number;
  byFramework: Record<RequestFramework, number>;
  byStatus: Record<RequestStatus, number>;
  overdue: number;
  completedThisMonth: number;
  averageCompletionDays: number;
}

// Mock data
const generateMockRequests = (): DataSubjectRequest[] => {
  const frameworks: RequestFramework[] = ['gdpr', 'ccpa', 'hipaa'];
  const gdprTypes: RequestType[] = ['access', 'rectification', 'erasure', 'portability'];
  const ccpaTypes: RequestType[] = ['right_to_know', 'right_to_delete', 'right_to_opt_out'];
  const hipaaTypes: RequestType[] = ['phi_access', 'phi_amendment', 'accounting_of_disclosures'];
  const statuses: RequestStatus[] = ['received', 'verified', 'in_progress', 'completed', 'denied'];
  const names = ['John Smith', 'Sarah Johnson', 'Michael Chen', 'Emily Davis', 'Robert Wilson', 'Lisa Anderson'];

  return Array.from({ length: 15 }, (_, i) => {
    const framework = frameworks[i % 3];
    const types = framework === 'gdpr' ? gdprTypes : framework === 'ccpa' ? ccpaTypes : hipaaTypes;
    const submittedAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    const dueDate = new Date(submittedAt.getTime() + (framework === 'hipaa' ? 30 : 30) * 24 * 60 * 60 * 1000);
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    return {
      id: `REQ-${1000 + i}`,
      framework,
      type: types[Math.floor(Math.random() * types.length)],
      status,
      subjectName: names[i % names.length],
      subjectEmail: `${names[i % names.length].toLowerCase().replace(' ', '.')}@example.com`,
      submittedAt,
      dueDate,
      completedAt: status === 'completed' ? new Date(submittedAt.getTime() + Math.random() * 20 * 24 * 60 * 60 * 1000) : undefined,
      assignedTo: Math.random() > 0.3 ? ['Admin User', 'Privacy Officer', 'Compliance Team'][Math.floor(Math.random() * 3)] : undefined,
      notes: '',
      isOverdue: status !== 'completed' && status !== 'denied' && dueDate < new Date(),
    };
  });
};

const generateMockStats = (requests: DataSubjectRequest[]): RequestStats => {
  const byFramework = requests.reduce((acc, r) => {
    acc[r.framework] = (acc[r.framework] || 0) + 1;
    return acc;
  }, {} as Record<RequestFramework, number>);

  const byStatus = requests.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<RequestStatus, number>);

  const completed = requests.filter(r => r.status === 'completed' && r.completedAt);
  const completionDays = completed.map(r =>
    (r.completedAt!.getTime() - r.submittedAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    total: requests.length,
    byFramework,
    byStatus,
    overdue: requests.filter(r => r.isOverdue).length,
    completedThisMonth: completed.filter(r => {
      const now = new Date();
      return r.completedAt!.getMonth() === now.getMonth() && r.completedAt!.getFullYear() === now.getFullYear();
    }).length,
    averageCompletionDays: completionDays.length > 0
      ? Math.round(completionDays.reduce((a, b) => a + b, 0) / completionDays.length)
      : 0,
  };
};

export const DataSubjectRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<DataSubjectRequest[]>([]);
  const [stats, setStats] = useState<RequestStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<DataSubjectRequest | null>(null);
  const [filterFramework, setFilterFramework] = useState<'all' | RequestFramework>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | RequestStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    const newRequests = generateMockRequests();
    setRequests(newRequests);
    setStats(generateMockStats(newRequests));
    setRefreshing(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getFrameworkColor = (framework: RequestFramework): string => {
    switch (framework) {
      case 'gdpr': return '#3b82f6';
      case 'ccpa': return '#10b981';
      case 'hipaa': return '#8b5cf6';
    }
  };

  const getStatusColor = (status: RequestStatus): string => {
    switch (status) {
      case 'received': return '#6b7280';
      case 'verified': return '#3b82f6';
      case 'in_progress': return '#f59e0b';
      case 'completed': return '#10b981';
      case 'denied': return '#ef4444';
      case 'extended': return '#8b5cf6';
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatRequestType = (type: RequestType): string => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getDaysRemaining = (dueDate: Date, extendedDueDate?: Date): number => {
    const targetDate = extendedDueDate || dueDate;
    return Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const filteredRequests = requests.filter(r => {
    if (filterFramework !== 'all' && r.framework !== filterFramework) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (searchTerm && !r.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !r.subjectEmail.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !r.id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const updateRequestStatus = async (id: string, newStatus: RequestStatus) => {
    setRequests(prev => prev.map(r =>
      r.id === id
        ? { ...r, status: newStatus, completedAt: newStatus === 'completed' ? new Date() : r.completedAt }
        : r
    ));
    if (selectedRequest?.id === id) {
      setSelectedRequest(prev => prev ? { ...prev, status: newStatus, completedAt: newStatus === 'completed' ? new Date() : prev.completedAt } : null);
    }
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Data Subject Requests</h1>
          <p style={{ color: '#6b7280', margin: '4px 0 0 0' }}>Manage privacy requests across GDPR, CCPA, and HIPAA</p>
        </div>
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

      {/* Stats Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <StatCard title="Total Requests" value={stats.total.toString()} />
          <StatCard title="GDPR" value={(stats.byFramework.gdpr || 0).toString()} color="#3b82f6" />
          <StatCard title="CCPA" value={(stats.byFramework.ccpa || 0).toString()} color="#10b981" />
          <StatCard title="HIPAA" value={(stats.byFramework.hipaa || 0).toString()} color="#8b5cf6" />
          <StatCard title="Overdue" value={stats.overdue.toString()} color={stats.overdue > 0 ? '#ef4444' : '#10b981'} />
          <StatCard title="Avg. Days" value={stats.averageCompletionDays.toString()} subtitle="to complete" />
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by name, email, or ID..."
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
          value={filterFramework}
          onChange={(e) => setFilterFramework(e.target.value as any)}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            backgroundColor: 'white',
          }}
        >
          <option value="all">All Frameworks</option>
          <option value="gdpr">GDPR</option>
          <option value="ccpa">CCPA</option>
          <option value="hipaa">HIPAA</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            backgroundColor: 'white',
          }}
        >
          <option value="all">All Statuses</option>
          <option value="received">Received</option>
          <option value="verified">Verified</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="denied">Denied</option>
          <option value="extended">Extended</option>
        </select>
      </div>

      {/* Request List */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>ID</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Subject</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Framework</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Type</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Due Date</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Assigned</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((request, index) => (
              <tr
                key={request.id}
                style={{
                  borderBottom: index < filteredRequests.length - 1 ? '1px solid #e5e7eb' : 'none',
                  backgroundColor: request.isOverdue ? '#fef2f210' : 'transparent',
                }}
              >
                <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '500' }}>{request.id}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>{request.subjectName}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>{request.subjectEmail}</div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: getFrameworkColor(request.framework) + '20',
                      color: getFrameworkColor(request.framework),
                      textTransform: 'uppercase',
                    }}
                  >
                    {request.framework}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px' }}>{formatRequestType(request.type)}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        backgroundColor: getStatusColor(request.status) + '20',
                        color: getStatusColor(request.status),
                        textTransform: 'capitalize',
                      }}
                    >
                      {request.status.replace('_', ' ')}
                    </span>
                    {request.isOverdue && (
                      <span style={{ color: '#ef4444', fontSize: '12px', fontWeight: '600' }}>OVERDUE</span>
                    )}
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontSize: '14px' }}>{formatDate(request.dueDate)}</div>
                  {request.status !== 'completed' && request.status !== 'denied' && (
                    <div
                      style={{
                        fontSize: '12px',
                        color: getDaysRemaining(request.dueDate, request.extendedDueDate) < 0 ? '#ef4444'
                          : getDaysRemaining(request.dueDate, request.extendedDueDate) < 7 ? '#f59e0b'
                          : '#6b7280',
                      }}
                    >
                      {getDaysRemaining(request.dueDate, request.extendedDueDate) < 0
                        ? `${Math.abs(getDaysRemaining(request.dueDate, request.extendedDueDate))} days overdue`
                        : `${getDaysRemaining(request.dueDate, request.extendedDueDate)} days left`}
                    </div>
                  )}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: request.assignedTo ? '#111827' : '#9ca3af' }}>
                  {request.assignedTo || 'Unassigned'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setSelectedRequest(request)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        fontSize: '13px',
                      }}
                    >
                      View
                    </button>
                    {request.status !== 'completed' && request.status !== 'denied' && (
                      <button
                        onClick={() => updateRequestStatus(request.id, 'completed')}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: '#10b981',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '13px',
                        }}
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredRequests.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            No requests found matching your criteria
          </div>
        )}
      </div>

      {/* Request Detail Modal */}
      {selectedRequest && (
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
          onClick={() => setSelectedRequest(null)}
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
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Request {selectedRequest.id}</h2>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: getFrameworkColor(selectedRequest.framework) + '20',
                      color: getFrameworkColor(selectedRequest.framework),
                      textTransform: 'uppercase',
                    }}
                  >
                    {selectedRequest.framework}
                  </span>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      backgroundColor: getStatusColor(selectedRequest.status) + '20',
                      color: getStatusColor(selectedRequest.status),
                      textTransform: 'capitalize',
                    }}
                  >
                    {selectedRequest.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
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
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Subject Name</div>
                <div style={{ fontWeight: '500' }}>{selectedRequest.subjectName}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Email</div>
                <div style={{ fontWeight: '500' }}>{selectedRequest.subjectEmail}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Request Type</div>
                <div style={{ fontWeight: '500' }}>{formatRequestType(selectedRequest.type)}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Assigned To</div>
                <div style={{ fontWeight: '500' }}>{selectedRequest.assignedTo || 'Unassigned'}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Submitted</div>
                <div style={{ fontWeight: '500' }}>{formatDate(selectedRequest.submittedAt)}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Due Date</div>
                <div style={{ fontWeight: '500', color: selectedRequest.isOverdue ? '#ef4444' : 'inherit' }}>
                  {formatDate(selectedRequest.dueDate)}
                  {selectedRequest.isOverdue && ' (Overdue)'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
              {selectedRequest.status !== 'completed' && selectedRequest.status !== 'denied' && (
                <>
                  <button
                    onClick={() => {
                      updateRequestStatus(selectedRequest.id, 'in_progress');
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                    }}
                  >
                    Start Processing
                  </button>
                  <button
                    onClick={() => {
                      updateRequestStatus(selectedRequest.id, 'completed');
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#10b981',
                      color: 'white',
                      cursor: 'pointer',
                    }}
                  >
                    Mark Complete
                  </button>
                  <button
                    onClick={() => {
                      updateRequestStatus(selectedRequest.id, 'denied');
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      cursor: 'pointer',
                    }}
                  >
                    Deny Request
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedRequest(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  marginLeft: 'auto',
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
  subtitle?: string;
  color?: string;
}> = ({ title, value, subtitle, color = '#111827' }) => (
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
    {subtitle && <div style={{ fontSize: '12px', color: '#9ca3af' }}>{subtitle}</div>}
  </div>
);

export default DataSubjectRequestsPage;
