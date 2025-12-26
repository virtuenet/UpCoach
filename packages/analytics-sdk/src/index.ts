/**
 * UpCoach Embedded Analytics SDK
 *
 * Provides white-label analytics for enterprise customers
 */

export interface EmbedConfig {
  apiUrl: string;
  tenantId: string;
  dashboardId: string;
  jwt: string;
  theme?: 'light' | 'dark' | 'custom';
  filters?: Record<string, any>;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export interface DashboardData {
  dashboardId: string;
  title: string;
  description: string;
  widgets: Widget[];
  filters: Filter[];
  refreshedAt: string;
}

export interface Widget {
  id: string;
  type: 'chart' | 'table' | 'metric' | 'map';
  title: string;
  data: any;
  config: any;
}

export interface Filter {
  id: string;
  name: string;
  type: 'date_range' | 'select' | 'multiselect';
  options?: any[];
  defaultValue?: any;
}

export class UpCoachAnalyticsSDK {
  private config: EmbedConfig;
  private iframe: HTMLIFrameElement | null = null;

  constructor(config: EmbedConfig) {
    this.config = config;
  }

  /**
   * Embed dashboard in container element
   */
  async embed(containerElement: HTMLElement): Promise<void> {
    try {
      // Validate JWT
      await this.validateToken();

      // Create iframe
      this.iframe = document.createElement('iframe');
      this.iframe.src = this.buildEmbedUrl();
      this.iframe.style.width = '100%';
      this.iframe.style.height = '100%';
      this.iframe.style.border = 'none';

      // Append to container
      containerElement.appendChild(this.iframe);

      // Setup message listener
      window.addEventListener('message', this.handleMessage.bind(this));

      if (this.config.onLoad) {
        this.config.onLoad();
      }
    } catch (error) {
      if (this.config.onError) {
        this.config.onError(error as Error);
      }
      throw error;
    }
  }

  /**
   * Fetch dashboard data via API
   */
  async fetchDashboard(): Promise<DashboardData> {
    const url = `${this.config.apiUrl}/api/analytics/embed/dashboards/${this.config.dashboardId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.config.jwt}`,
        'X-Tenant-ID': this.config.tenantId,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch dashboard: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Apply filters to dashboard
   */
  applyFilters(filters: Record<string, any>): void {
    if (!this.iframe || !this.iframe.contentWindow) {
      throw new Error('Dashboard not embedded');
    }

    this.iframe.contentWindow.postMessage({
      type: 'APPLY_FILTERS',
      filters,
    }, '*');
  }

  /**
   * Refresh dashboard data
   */
  refresh(): void {
    if (!this.iframe || !this.iframe.contentWindow) {
      throw new Error('Dashboard not embedded');
    }

    this.iframe.contentWindow.postMessage({
      type: 'REFRESH',
    }, '*');
  }

  /**
   * Export dashboard as PDF
   */
  async exportPDF(): Promise<Blob> {
    const url = `${this.config.apiUrl}/api/analytics/embed/dashboards/${this.config.dashboardId}/export/pdf`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.jwt}`,
        'X-Tenant-ID': this.config.tenantId,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to export PDF: ${response.statusText}`);
    }

    return await response.blob();
  }

  /**
   * Destroy embedded dashboard
   */
  destroy(): void {
    if (this.iframe && this.iframe.parentNode) {
      this.iframe.parentNode.removeChild(this.iframe);
      this.iframe = null;
    }

    window.removeEventListener('message', this.handleMessage.bind(this));
  }

  /**
   * Build embed URL
   */
  private buildEmbedUrl(): string {
    const params = new URLSearchParams({
      tenantId: this.config.tenantId,
      jwt: this.config.jwt,
      theme: this.config.theme || 'light',
    });

    if (this.config.filters) {
      params.append('filters', JSON.stringify(this.config.filters));
    }

    return `${this.config.apiUrl}/embed/dashboards/${this.config.dashboardId}?${params.toString()}`;
  }

  /**
   * Validate JWT token
   */
  private async validateToken(): Promise<void> {
    const url = `${this.config.apiUrl}/api/analytics/embed/validate`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.jwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tenantId: this.config.tenantId,
      }),
    });

    if (!response.ok) {
      throw new Error('Invalid or expired JWT token');
    }
  }

  /**
   * Handle iframe messages
   */
  private handleMessage(event: MessageEvent): void {
    if (event.origin !== new URL(this.config.apiUrl).origin) {
      return;
    }

    const { type, data } = event.data;

    switch (type) {
      case 'DASHBOARD_LOADED':
        if (this.config.onLoad) {
          this.config.onLoad();
        }
        break;

      case 'DASHBOARD_ERROR':
        if (this.config.onError) {
          this.config.onError(new Error(data.message));
        }
        break;
    }
  }
}

// React component wrapper
export { AnalyticsDashboard } from './components/Dashboard';

// Types
export type { EmbedConfig, DashboardData, Widget, Filter };
