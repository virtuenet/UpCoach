/**
 * Translation Dashboard
 *
 * Main translation management interface for admins.
 * Shows translation coverage, quality metrics, and quick access to translation tasks.
 */

import React, { useState, useEffect } from 'react';

// Types
interface TranslationStats {
  totalKeys: number;
  translatedKeys: Record<string, number>;
  reviewedKeys: Record<string, number>;
  approvedKeys: Record<string, number>;
  completionRate: Record<string, number>;
  qualityScore: Record<string, number>;
  recentChanges: number;
  deprecatedKeys: number;
}

interface LocaleInfo {
  code: string;
  displayName: string;
  nativeName: string;
  isRTL: boolean;
}

interface TranslationActivity {
  id: string;
  type: 'added' | 'updated' | 'reviewed' | 'approved';
  key: string;
  locale: string;
  user: string;
  timestamp: Date;
}

interface TranslationIssue {
  id: string;
  type: 'missing' | 'outdated' | 'low_quality' | 'untranslated';
  key: string;
  locale: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

// Mock data generator
const generateMockStats = (): TranslationStats => ({
  totalKeys: 247,
  translatedKeys: {
    en: 247,
    es: 235,
    fr: 228,
    de: 220,
    ja: 195,
    zh: 190,
    ko: 185,
    ar: 175,
    pt: 200,
    hi: 160,
  },
  reviewedKeys: {
    en: 247,
    es: 220,
    fr: 210,
    de: 200,
    ja: 180,
    zh: 170,
    ko: 160,
    ar: 150,
    pt: 180,
    hi: 140,
  },
  approvedKeys: {
    en: 247,
    es: 210,
    fr: 200,
    de: 190,
    ja: 170,
    zh: 160,
    ko: 150,
    ar: 140,
    pt: 170,
    hi: 130,
  },
  completionRate: {
    en: 100,
    es: 95.1,
    fr: 92.3,
    de: 89.1,
    ja: 78.9,
    zh: 76.9,
    ko: 74.9,
    ar: 70.9,
    pt: 81.0,
    hi: 64.8,
  },
  qualityScore: {
    en: 100,
    es: 94.5,
    fr: 92.1,
    de: 91.3,
    ja: 88.7,
    zh: 87.2,
    ko: 85.4,
    ar: 83.1,
    pt: 89.5,
    hi: 80.2,
  },
  recentChanges: 45,
  deprecatedKeys: 8,
});

const generateMockLocales = (): LocaleInfo[] => [
  { code: 'en', displayName: 'English', nativeName: 'English', isRTL: false },
  { code: 'es', displayName: 'Spanish', nativeName: 'Español', isRTL: false },
  { code: 'fr', displayName: 'French', nativeName: 'Français', isRTL: false },
  { code: 'de', displayName: 'German', nativeName: 'Deutsch', isRTL: false },
  { code: 'pt', displayName: 'Portuguese', nativeName: 'Português', isRTL: false },
  { code: 'ja', displayName: 'Japanese', nativeName: '日本語', isRTL: false },
  { code: 'zh', displayName: 'Chinese', nativeName: '简体中文', isRTL: false },
  { code: 'ko', displayName: 'Korean', nativeName: '한국어', isRTL: false },
  { code: 'ar', displayName: 'Arabic', nativeName: 'العربية', isRTL: true },
  { code: 'hi', displayName: 'Hindi', nativeName: 'हिन्दी', isRTL: false },
];

const generateMockActivities = (): TranslationActivity[] => [
  { id: '1', type: 'approved', key: 'habits.streak', locale: 'es', user: 'Maria G.', timestamp: new Date(Date.now() - 1800000) },
  { id: '2', type: 'updated', key: 'coaching.aiCoach', locale: 'fr', user: 'Jean P.', timestamp: new Date(Date.now() - 3600000) },
  { id: '3', type: 'reviewed', key: 'goals.progress', locale: 'de', user: 'Hans M.', timestamp: new Date(Date.now() - 7200000) },
  { id: '4', type: 'added', key: 'gamification.newBadge', locale: 'ja', user: 'Yuki T.', timestamp: new Date(Date.now() - 14400000) },
  { id: '5', type: 'updated', key: 'settings.language', locale: 'zh', user: 'Wei L.', timestamp: new Date(Date.now() - 28800000) },
  { id: '6', type: 'approved', key: 'auth.welcomeBack', locale: 'ko', user: 'Min J.', timestamp: new Date(Date.now() - 43200000) },
  { id: '7', type: 'reviewed', key: 'errors.network', locale: 'ar', user: 'Ahmed K.', timestamp: new Date(Date.now() - 86400000) },
  { id: '8', type: 'added', key: 'onboarding.step1', locale: 'pt', user: 'Carlos S.', timestamp: new Date(Date.now() - 172800000) },
];

const generateMockIssues = (): TranslationIssue[] => [
  { id: '1', type: 'missing', key: 'billing.taxInfo', locale: 'ar', description: 'Key not translated', severity: 'high' },
  { id: '2', type: 'missing', key: 'coaching.groupSession', locale: 'hi', description: 'Key not translated', severity: 'high' },
  { id: '3', type: 'outdated', key: 'habits.reminder', locale: 'ko', description: 'Source text updated', severity: 'medium' },
  { id: '4', type: 'low_quality', key: 'gamification.achievement', locale: 'zh', description: 'Quality score below 70%', severity: 'medium' },
  { id: '5', type: 'untranslated', key: 'settings.privacy', locale: 'ja', description: 'Pending review', severity: 'low' },
  { id: '6', type: 'missing', key: 'errors.validation', locale: 'ar', description: 'Key not translated', severity: 'high' },
];

export const TranslationDashboard: React.FC = () => {
  const [stats, setStats] = useState<TranslationStats | null>(null);
  const [locales, setLocales] = useState<LocaleInfo[]>([]);
  const [activities, setActivities] = useState<TranslationActivity[]>([]);
  const [issues, setIssues] = useState<TranslationIssue[]>([]);
  const [selectedLocale, setSelectedLocale] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    setStats(generateMockStats());
    setLocales(generateMockLocales());
    setActivities(generateMockActivities());
    setIssues(generateMockIssues());
    setLoading(false);
  };

  const getCompletionColor = (rate: number): string => {
    if (rate >= 90) return '#22c55e';
    if (rate >= 70) return '#eab308';
    return '#ef4444';
  };

  const getQualityColor = (score: number): string => {
    if (score >= 90) return '#22c55e';
    if (score >= 75) return '#eab308';
    return '#ef4444';
  };

  const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getActivityIcon = (type: string): string => {
    switch (type) {
      case 'added': return '+';
      case 'updated': return '✎';
      case 'reviewed': return '✓';
      case 'approved': return '✓✓';
      default: return '•';
    }
  };

  const getActivityColor = (type: string): string => {
    switch (type) {
      case 'added': return '#22c55e';
      case 'updated': return '#3b82f6';
      case 'reviewed': return '#eab308';
      case 'approved': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'high': return '#ef4444';
      case 'medium': return '#eab308';
      case 'low': return '#6b7280';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p>Loading translation dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Translation Dashboard</h1>
          <p style={styles.subtitle}>Manage translations across all supported languages</p>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.secondaryButton}>
            Import Translations
          </button>
          <button style={styles.primaryButton}>
            Export All
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryIcon}>📝</div>
          <div style={styles.summaryContent}>
            <div style={styles.summaryValue}>{stats?.totalKeys}</div>
            <div style={styles.summaryLabel}>Total Keys</div>
          </div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryIcon}>🌍</div>
          <div style={styles.summaryContent}>
            <div style={styles.summaryValue}>{locales.length}</div>
            <div style={styles.summaryLabel}>Languages</div>
          </div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryIcon}>📊</div>
          <div style={styles.summaryContent}>
            <div style={styles.summaryValue}>{stats?.recentChanges}</div>
            <div style={styles.summaryLabel}>Recent Changes</div>
          </div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryIcon}>⚠️</div>
          <div style={styles.summaryContent}>
            <div style={styles.summaryValue}>{issues.length}</div>
            <div style={styles.summaryLabel}>Issues</div>
          </div>
        </div>
      </div>

      {/* Locale Coverage Grid */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Language Coverage</h2>
        <div style={styles.localeGrid}>
          {locales.map(locale => (
            <div
              key={locale.code}
              style={{
                ...styles.localeCard,
                borderColor: selectedLocale === locale.code ? '#3b82f6' : '#e5e7eb',
              }}
              onClick={() => setSelectedLocale(locale.code === selectedLocale ? null : locale.code)}
            >
              <div style={styles.localeHeader}>
                <span style={styles.localeCode}>{locale.code.toUpperCase()}</span>
                {locale.isRTL && <span style={styles.rtlBadge}>RTL</span>}
              </div>
              <div style={styles.localeName}>{locale.displayName}</div>
              <div style={styles.localeNative}>{locale.nativeName}</div>

              <div style={styles.progressContainer}>
                <div style={styles.progressLabel}>
                  <span>Completion</span>
                  <span style={{ color: getCompletionColor(stats?.completionRate[locale.code] || 0) }}>
                    {(stats?.completionRate[locale.code] || 0).toFixed(1)}%
                  </span>
                </div>
                <div style={styles.progressBar}>
                  <div
                    style={{
                      ...styles.progressFill,
                      width: `${stats?.completionRate[locale.code] || 0}%`,
                      backgroundColor: getCompletionColor(stats?.completionRate[locale.code] || 0),
                    }}
                  />
                </div>
              </div>

              <div style={styles.progressContainer}>
                <div style={styles.progressLabel}>
                  <span>Quality</span>
                  <span style={{ color: getQualityColor(stats?.qualityScore[locale.code] || 0) }}>
                    {(stats?.qualityScore[locale.code] || 0).toFixed(1)}%
                  </span>
                </div>
                <div style={styles.progressBar}>
                  <div
                    style={{
                      ...styles.progressFill,
                      width: `${stats?.qualityScore[locale.code] || 0}%`,
                      backgroundColor: getQualityColor(stats?.qualityScore[locale.code] || 0),
                    }}
                  />
                </div>
              </div>

              <div style={styles.localeStats}>
                <span>{stats?.translatedKeys[locale.code] || 0} translated</span>
                <span>{stats?.approvedKeys[locale.code] || 0} approved</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div style={styles.twoColumnGrid}>
        {/* Recent Activity */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Recent Activity</h2>
          <div style={styles.activityList}>
            {activities.map(activity => (
              <div key={activity.id} style={styles.activityItem}>
                <div
                  style={{
                    ...styles.activityIcon,
                    backgroundColor: getActivityColor(activity.type),
                  }}
                >
                  {getActivityIcon(activity.type)}
                </div>
                <div style={styles.activityContent}>
                  <div style={styles.activityText}>
                    <strong>{activity.user}</strong> {activity.type} <code style={styles.code}>{activity.key}</code>
                  </div>
                  <div style={styles.activityMeta}>
                    {activity.locale.toUpperCase()} • {formatTimeAgo(activity.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button style={styles.viewAllButton}>View All Activity</button>
        </div>

        {/* Issues */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Translation Issues</h2>
          <div style={styles.issuesList}>
            {issues.map(issue => (
              <div key={issue.id} style={styles.issueItem}>
                <div
                  style={{
                    ...styles.severityBadge,
                    backgroundColor: getSeverityColor(issue.severity),
                  }}
                >
                  {issue.severity.charAt(0).toUpperCase()}
                </div>
                <div style={styles.issueContent}>
                  <div style={styles.issueKey}>
                    <code style={styles.code}>{issue.key}</code>
                    <span style={styles.issueLocale}>{issue.locale.toUpperCase()}</span>
                  </div>
                  <div style={styles.issueDescription}>{issue.description}</div>
                </div>
                <button style={styles.resolveButton}>Fix</button>
              </div>
            ))}
          </div>
          <button style={styles.viewAllButton}>View All Issues</button>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Quick Actions</h2>
        <div style={styles.actionsGrid}>
          <button style={styles.actionCard}>
            <span style={styles.actionIcon}>➕</span>
            <span style={styles.actionText}>Add New Key</span>
          </button>
          <button style={styles.actionCard}>
            <span style={styles.actionIcon}>📋</span>
            <span style={styles.actionText}>Bulk Import</span>
          </button>
          <button style={styles.actionCard}>
            <span style={styles.actionIcon}>🔍</span>
            <span style={styles.actionText}>Find Missing</span>
          </button>
          <button style={styles.actionCard}>
            <span style={styles.actionIcon}>✅</span>
            <span style={styles.actionText}>Review Queue</span>
          </button>
          <button style={styles.actionCard}>
            <span style={styles.actionIcon}>📚</span>
            <span style={styles.actionText}>Glossary</span>
          </button>
          <button style={styles.actionCard}>
            <span style={styles.actionIcon}>📤</span>
            <span style={styles.actionText}>Export</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '400px',
    gap: '16px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e5e7eb',
    borderTop: '3px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#111827',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '4px 0 0 0',
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
  },
  primaryButton: {
    padding: '10px 20px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  secondaryButton: {
    padding: '10px 20px',
    backgroundColor: 'white',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  summaryCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  summaryIcon: {
    fontSize: '32px',
  },
  summaryContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  summaryValue: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#111827',
  },
  summaryLabel: {
    fontSize: '13px',
    color: '#6b7280',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '20px',
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#111827',
    margin: '0 0 16px 0',
  },
  localeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '16px',
  },
  localeCard: {
    padding: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  localeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  localeCode: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  rtlBadge: {
    fontSize: '10px',
    fontWeight: 600,
    color: '#7c3aed',
    backgroundColor: '#ede9fe',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  localeName: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#111827',
  },
  localeNative: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '12px',
  },
  progressContainer: {
    marginBottom: '8px',
  },
  progressLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  progressBar: {
    height: '6px',
    backgroundColor: '#e5e7eb',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.3s',
  },
  localeStats: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: '#9ca3af',
    marginTop: '8px',
  },
  twoColumnGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    marginBottom: '24px',
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  activityItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  activityIcon: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '12px',
    fontWeight: 600,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: '14px',
    color: '#374151',
  },
  activityMeta: {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '2px',
  },
  code: {
    backgroundColor: '#f3f4f6',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'monospace',
  },
  issuesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  issueItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  severityBadge: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '11px',
    fontWeight: 600,
  },
  issueContent: {
    flex: 1,
  },
  issueKey: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  issueLocale: {
    fontSize: '10px',
    fontWeight: 600,
    color: '#6b7280',
    backgroundColor: '#e5e7eb',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  issueDescription: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px',
  },
  resolveButton: {
    padding: '6px 12px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  viewAllButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: 'transparent',
    color: '#3b82f6',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    marginTop: '16px',
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: '12px',
  },
  actionCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '20px',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  actionIcon: {
    fontSize: '24px',
  },
  actionText: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#374151',
    textAlign: 'center',
  },
};

export default TranslationDashboard;
