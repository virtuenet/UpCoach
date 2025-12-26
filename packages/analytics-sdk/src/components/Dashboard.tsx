import React, { useEffect, useRef, useState } from 'react';
import { UpCoachAnalyticsSDK, EmbedConfig, DashboardData } from '../index';

/**
 * React component for embedded analytics dashboard
 */

export interface AnalyticsDashboardProps {
  apiUrl: string;
  tenantId: string;
  dashboardId: string;
  jwt: string;
  theme?: 'light' | 'dark' | 'custom';
  filters?: Record<string, any>;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  apiUrl,
  tenantId,
  dashboardId,
  jwt,
  theme = 'light',
  filters,
  onLoad,
  onError,
  className,
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sdkRef = useRef<UpCoachAnalyticsSDK | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const config: EmbedConfig = {
      apiUrl,
      tenantId,
      dashboardId,
      jwt,
      theme,
      filters,
      onLoad: () => {
        setIsLoading(false);
        if (onLoad) {
          onLoad();
        }
      },
      onError: (err) => {
        setError(err);
        setIsLoading(false);
        if (onError) {
          onError(err);
        }
      },
    };

    const sdk = new UpCoachAnalyticsSDK(config);
    sdkRef.current = sdk;

    sdk.embed(containerRef.current).catch((err) => {
      setError(err);
      setIsLoading(false);
    });

    return () => {
      if (sdkRef.current) {
        sdkRef.current.destroy();
      }
    };
  }, [apiUrl, tenantId, dashboardId, jwt, theme]);

  // Apply filters when they change
  useEffect(() => {
    if (sdkRef.current && filters && !isLoading) {
      sdkRef.current.applyFilters(filters);
    }
  }, [filters, isLoading]);

  const handleRefresh = () => {
    if (sdkRef.current) {
      sdkRef.current.refresh();
    }
  };

  const handleExportPDF = async () => {
    if (sdkRef.current) {
      try {
        const blob = await sdkRef.current.exportPDF();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-${dashboardId}-${new Date().toISOString()}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Failed to export PDF:', err);
      }
    }
  };

  return (
    <div className={className} style={{ position: 'relative', ...style }}>
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '14px', color: '#666' }}>Loading dashboard...</div>
        </div>
      )}

      {error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          padding: '20px',
          backgroundColor: '#fee',
          borderRadius: '8px',
        }}>
          <div style={{ fontSize: '16px', color: '#c33', marginBottom: '8px' }}>
            Failed to load dashboard
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            {error.message}
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '600px',
        }}
      />

      {/* Toolbar */}
      {!isLoading && !error && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          display: 'flex',
          gap: '8px',
        }}>
          <button
            onClick={handleRefresh}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4F46E5',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Refresh
          </button>
          <button
            onClick={handleExportPDF}
            style={{
              padding: '8px 16px',
              backgroundColor: '#10B981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Export PDF
          </button>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
