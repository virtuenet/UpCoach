import React, { useState, useEffect, useCallback, useMemo, useRef, useContext } from 'react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { Download, Mail, Play, Pause, RefreshCw, FileText, Calendar, Settings } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { financialApi } from '../services/financialApi';

interface Report {
  id: string;
  type: string;
  title: string;
  status: string;
  createdAt: string;
  generatedAt?: string;
  format: string;
}

interface ScheduledJob {
  name: string;
  running: boolean;
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [scheduledJobs, setScheduledJobs] = useState<ScheduledJob[]>([]);
  const [_automationStatus, setAutomationStatus] = useState<any>(null);
  const [testEmail, setTestEmail] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reportsData, jobsData, statusData] = await Promise.all([
        financialApi.getReports(),
        fetch('/api/financial/scheduler/jobs').then(r => r.json()),
        fetch('/api/financial/automation/status').then(r => r.json()),
      ]);

      setReports(reportsData.reports || []);
      setScheduledJobs(jobsData);
      setAutomationStatus(statusData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerAutomation = async (type: string) => {
    try {
      await fetch(`/api/financial/automation/trigger/${type}`, {
        method: 'POST',
      });
      alert(`${type} automation triggered successfully`);
      await loadData();
    } catch (error) {
      console.error('Failed to trigger automation:', error);
      alert('Failed to trigger automation');
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      alert('Please enter an email address');
      return;
    }

    try {
      await fetch('/api/financial/automation/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      });
      alert(`Test email sent to ${testEmail}`);
      setTestEmail('');
    } catch (error) {
      console.error('Failed to send test email:', error);
      alert('Failed to send test email');
    }
  };

  const downloadReport = async (reportId: string) => {
    try {
      const blob = await financialApi.downloadReport(reportId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financial-report-${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download report:', error);
      alert('Failed to download report');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Reports & Automation</h1>
          <p className="text-muted-foreground">
            Automated reports, alerts, and financial monitoring
          </p>
        </div>
        <button onClick={loadData} className="btn btn-secondary">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Automation Status Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Scheduled Jobs</p>
              <p className="text-2xl font-bold text-gray-900">
                {scheduledJobs.filter(job => job.running).length}/{scheduledJobs.length}
              </p>
            </div>
            <Settings className="h-8 w-8 text-blue-600" />
          </div>
          <p className="text-xs text-gray-500 mt-1">Active automated jobs</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Reports Generated</p>
              <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
            </div>
            <FileText className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-xs text-gray-500 mt-1">Total reports available</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Email Alerts</p>
              <p className="text-2xl font-bold text-gray-900">Active</p>
            </div>
            <Mail className="h-8 w-8 text-purple-600" />
          </div>
          <p className="text-xs text-gray-500 mt-1">Notification system status</p>
        </div>
      </div>

      {/* Manual Triggers */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Manual Triggers</h3>
          <p className="text-sm text-gray-500">Manually trigger automated processes</p>
        </div>
        <div className="p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <button
              onClick={() => triggerAutomation('daily-snapshot')}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Daily Snapshot
            </button>
            <button
              onClick={() => triggerAutomation('weekly-report')}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FileText className="h-4 w-4 mr-2" />
              Weekly Report
            </button>
            <button
              onClick={() => triggerAutomation('cost-analysis')}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Cost Analysis
            </button>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <button
                onClick={sendTestEmail}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                <Mail className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scheduled Jobs */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Scheduled Jobs</h3>
          <p className="text-sm text-gray-500">Automated financial processes</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {scheduledJobs.map(job => (
              <div
                key={job.name}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center">
                  <div
                    className={`w-3 h-3 rounded-full mr-3 ${job.running ? 'bg-green-500' : 'bg-red-500'}`}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {job.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <p className="text-xs text-gray-500">
                      Status: {job.running ? 'Running' : 'Stopped'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    {job.running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Generated Reports</h3>
          <p className="text-sm text-gray-500">Recent automated and manual reports</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Report
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map(report => (
                <tr key={report.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{report.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {report.type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        report.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : report.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(report.createdAt), 'MMM d, yyyy h:mm a')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {report.status === 'completed' && (
                      <button
                        onClick={() => downloadReport(report.id)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
