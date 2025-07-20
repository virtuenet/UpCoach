import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../index';

/**
 * FinancialReport Model
 * Manages automated financial reports generation and distribution
 */

export interface FinancialReportAttributes {
  id: string;
  
  // Report Configuration
  reportType: 'daily_summary' | 'weekly_review' | 'monthly_report' | 'quarterly_earnings' |
             'annual_report' | 'investor_update' | 'board_report' | 'custom';
  reportName: string;
  description: string;
  
  // Report Period
  periodType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  periodStart: Date;
  periodEnd: Date;
  
  // Report Sections
  sections: {
    executiveSummary: {
      enabled: boolean;
      highlights: string[];
      keyMetrics: Record<string, any>;
    };
    
    revenue: {
      enabled: boolean;
      totalRevenue: number;
      recurringRevenue: number;
      nonRecurringRevenue: number;
      revenueGrowth: number;
      revenueForecast?: number;
    };
    
    subscriptions: {
      enabled: boolean;
      newSubscriptions: number;
      activeSubscriptions: number;
      churnedSubscriptions: number;
      netNewSubscriptions: number;
      churnRate: number;
      retentionRate: number;
    };
    
    financialMetrics: {
      enabled: boolean;
      mrr: number;
      arr: number;
      arpu: number;
      ltv: number;
      cac: number;
      ltvCacRatio: number;
      burnRate: number;
      runway: number;
    };
    
    profitLoss: {
      enabled: boolean;
      revenue: number;
      cogs: number;
      grossProfit: number;
      operatingExpenses: number;
      ebitda: number;
      netIncome: number;
      margins: {
        gross: number;
        operating: number;
        net: number;
      };
    };
    
    costs: {
      enabled: boolean;
      totalCosts: number;
      costsByCategory: Record<string, number>;
      costPerUser: number;
      topVendors: Array<{ vendor: string; amount: number }>;
      costOptimizationOpportunities: string[];
    };
    
    cashFlow: {
      enabled: boolean;
      operatingCashFlow: number;
      investingCashFlow: number;
      financingCashFlow: number;
      netCashFlow: number;
      cashBalance: number;
    };
    
    cohortAnalysis: {
      enabled: boolean;
      cohorts: Array<{
        month: string;
        size: number;
        retentionRates: number[];
        revenue: number[];
      }>;
    };
    
    forecasts: {
      enabled: boolean;
      revenueForecast: Array<{ month: string; predicted: number; actual?: number }>;
      cashFlowForecast: Array<{ month: string; predicted: number }>;
      userGrowthForecast: Array<{ month: string; predicted: number }>;
    };
    
    kpis: {
      enabled: boolean;
      kpiMetrics: Array<{
        name: string;
        target: number;
        actual: number;
        variance: number;
        status: 'on_track' | 'at_risk' | 'off_track';
      }>;
    };
  };
  
  // Report Format
  format: {
    template: string;
    branding: {
      logo?: string;
      colors?: Record<string, string>;
      fonts?: Record<string, string>;
    };
    charts: {
      revenueChart: boolean;
      mrrChart: boolean;
      cohortChart: boolean;
      cashFlowChart: boolean;
      customCharts?: Array<{ name: string; type: string; data: any }>;
    };
  };
  
  // Distribution
  distribution: {
    recipients: Array<{
      email: string;
      name: string;
      role: string;
    }>;
    schedule: {
      frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
      dayOfWeek?: number; // 0-6
      dayOfMonth?: number; // 1-31
      time?: string; // HH:MM
      timezone: string;
    };
    channels: {
      email: boolean;
      slack?: { webhook: string; channel: string };
      teams?: { webhook: string };
      dashboard: boolean;
    };
  };
  
  // Report Status
  status: 'draft' | 'generating' | 'generated' | 'sent' | 'failed' | 'scheduled';
  generationStartedAt?: Date;
  generationCompletedAt?: Date;
  generationDuration?: number; // in seconds
  
  // Files
  files: {
    pdf?: string;
    excel?: string;
    powerpoint?: string;
    csv?: string;
    json?: string;
  };
  
  // Delivery Status
  deliveryStatus: {
    emailsSent: number;
    emailsDelivered: number;
    emailsOpened: number;
    linkClicks: number;
    errors: string[];
  };
  
  // Access Control
  accessibility: {
    isPublic: boolean;
    shareableLink?: string;
    password?: string;
    expiresAt?: Date;
    allowedDomains?: string[];
  };
  
  // Metadata
  createdBy: string;
  approvedBy?: string;
  approvedAt?: Date;
  tags: string[];
  notes?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface FinancialReportCreationAttributes extends Optional<FinancialReportAttributes, 
  'id' | 'generationStartedAt' | 'generationCompletedAt' | 'generationDuration' | 
  'approvedBy' | 'approvedAt' | 'notes' | 'createdAt' | 'updatedAt'> {}

export class FinancialReport extends Model<FinancialReportAttributes, FinancialReportCreationAttributes> 
  implements FinancialReportAttributes {
  
  public id!: string;
  
  public reportType!: 'daily_summary' | 'weekly_review' | 'monthly_report' | 'quarterly_earnings' |
                     'annual_report' | 'investor_update' | 'board_report' | 'custom';
  public reportName!: string;
  public description!: string;
  
  public periodType!: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  public periodStart!: Date;
  public periodEnd!: Date;
  
  public sections!: {
    executiveSummary: {
      enabled: boolean;
      highlights: string[];
      keyMetrics: Record<string, any>;
    };
    revenue: {
      enabled: boolean;
      totalRevenue: number;
      recurringRevenue: number;
      nonRecurringRevenue: number;
      revenueGrowth: number;
      revenueForecast?: number;
    };
    subscriptions: {
      enabled: boolean;
      newSubscriptions: number;
      activeSubscriptions: number;
      churnedSubscriptions: number;
      netNewSubscriptions: number;
      churnRate: number;
      retentionRate: number;
    };
    financialMetrics: {
      enabled: boolean;
      mrr: number;
      arr: number;
      arpu: number;
      ltv: number;
      cac: number;
      ltvCacRatio: number;
      burnRate: number;
      runway: number;
    };
    profitLoss: {
      enabled: boolean;
      revenue: number;
      cogs: number;
      grossProfit: number;
      operatingExpenses: number;
      ebitda: number;
      netIncome: number;
      margins: {
        gross: number;
        operating: number;
        net: number;
      };
    };
    costs: {
      enabled: boolean;
      totalCosts: number;
      costsByCategory: Record<string, number>;
      costPerUser: number;
      topVendors: Array<{ vendor: string; amount: number }>;
      costOptimizationOpportunities: string[];
    };
    cashFlow: {
      enabled: boolean;
      operatingCashFlow: number;
      investingCashFlow: number;
      financingCashFlow: number;
      netCashFlow: number;
      cashBalance: number;
    };
    cohortAnalysis: {
      enabled: boolean;
      cohorts: Array<{
        month: string;
        size: number;
        retentionRates: number[];
        revenue: number[];
      }>;
    };
    forecasts: {
      enabled: boolean;
      revenueForecast: Array<{ month: string; predicted: number; actual?: number }>;
      cashFlowForecast: Array<{ month: string; predicted: number }>;
      userGrowthForecast: Array<{ month: string; predicted: number }>;
    };
    kpis: {
      enabled: boolean;
      kpiMetrics: Array<{
        name: string;
        target: number;
        actual: number;
        variance: number;
        status: 'on_track' | 'at_risk' | 'off_track';
      }>;
    };
  };
  
  public format!: {
    template: string;
    branding: {
      logo?: string;
      colors?: Record<string, string>;
      fonts?: Record<string, string>;
    };
    charts: {
      revenueChart: boolean;
      mrrChart: boolean;
      cohortChart: boolean;
      cashFlowChart: boolean;
      customCharts?: Array<{ name: string; type: string; data: any }>;
    };
  };
  
  public distribution!: {
    recipients: Array<{
      email: string;
      name: string;
      role: string;
    }>;
    schedule: {
      frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
      dayOfWeek?: number;
      dayOfMonth?: number;
      time?: string;
      timezone: string;
    };
    channels: {
      email: boolean;
      slack?: { webhook: string; channel: string };
      teams?: { webhook: string };
      dashboard: boolean;
    };
  };
  
  public status!: 'draft' | 'generating' | 'generated' | 'sent' | 'failed' | 'scheduled';
  public generationStartedAt?: Date;
  public generationCompletedAt?: Date;
  public generationDuration?: number;
  
  public files!: {
    pdf?: string;
    excel?: string;
    powerpoint?: string;
    csv?: string;
    json?: string;
  };
  
  public deliveryStatus!: {
    emailsSent: number;
    emailsDelivered: number;
    emailsOpened: number;
    linkClicks: number;
    errors: string[];
  };
  
  public accessibility!: {
    isPublic: boolean;
    shareableLink?: string;
    password?: string;
    expiresAt?: Date;
    allowedDomains?: string[];
  };
  
  public createdBy!: string;
  public approvedBy?: string;
  public approvedAt?: Date;
  public tags!: string[];
  public notes?: string;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * Check if report is due for generation
   */
  public isDue(): boolean {
    if (this.status !== 'scheduled') return false;
    
    const now = new Date();
    const schedule = this.distribution.schedule;
    
    switch (schedule.frequency) {
      case 'daily':
        return true;
      case 'weekly':
        return now.getDay() === schedule.dayOfWeek;
      case 'monthly':
        return now.getDate() === schedule.dayOfMonth;
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        const quarterStart = new Date(now.getFullYear(), quarter * 3, 1);
        return now.getDate() === schedule.dayOfMonth && 
               now.getMonth() === quarterStart.getMonth();
      default:
        return false;
    }
  }

  /**
   * Get report completeness percentage
   */
  public getCompleteness(): number {
    const sections = Object.values(this.sections);
    const enabledSections = sections.filter(s => s.enabled);
    const completedSections = enabledSections.filter(s => {
      // Check if section has required data
      return Object.values(s).some(v => v !== null && v !== undefined);
    });
    
    return enabledSections.length > 0 
      ? (completedSections.length / enabledSections.length) * 100 
      : 0;
  }

  /**
   * Get delivery success rate
   */
  public getDeliveryRate(): number {
    const sent = this.deliveryStatus.emailsSent;
    const delivered = this.deliveryStatus.emailsDelivered;
    
    return sent > 0 ? (delivered / sent) * 100 : 0;
  }

  /**
   * Static method to get scheduled reports
   */
  static async getScheduledReports(): Promise<FinancialReport[]> {
    return this.findAll({
      where: {
        status: 'scheduled',
      },
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Static method to get reports by type and period
   */
  static async getReports(
    reportType: string,
    startDate: Date,
    endDate: Date
  ): Promise<FinancialReport[]> {
    return this.findAll({
      where: {
        reportType,
        periodStart: {
          [sequelize.Op.gte]: startDate,
        },
        periodEnd: {
          [sequelize.Op.lte]: endDate,
        },
        status: ['generated', 'sent'],
      },
      order: [['periodStart', 'DESC']],
    });
  }

  /**
   * Static method to get latest report of a type
   */
  static async getLatestReport(reportType: string): Promise<FinancialReport | null> {
    return this.findOne({
      where: {
        reportType,
        status: ['generated', 'sent'],
      },
      order: [['createdAt', 'DESC']],
    });
  }
}

FinancialReport.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    reportType: {
      type: DataTypes.ENUM('daily_summary', 'weekly_review', 'monthly_report', 
                          'quarterly_earnings', 'annual_report', 'investor_update', 
                          'board_report', 'custom'),
      allowNull: false,
    },
    reportName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    periodType: {
      type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'),
      allowNull: false,
    },
    periodStart: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    periodEnd: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    sections: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    format: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    distribution: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('draft', 'generating', 'generated', 'sent', 'failed', 'scheduled'),
      allowNull: false,
      defaultValue: 'draft',
    },
    generationStartedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    generationCompletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    generationDuration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Generation time in seconds',
    },
    files: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    deliveryStatus: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        emailsSent: 0,
        emailsDelivered: 0,
        emailsOpened: 0,
        linkClicks: 0,
        errors: [],
      },
    },
    accessibility: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        isPublic: false,
      },
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    approvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'financial_reports',
    modelName: 'FinancialReport',
    timestamps: true,
    indexes: [
      {
        fields: ['reportType'],
        name: 'idx_financial_reports_type',
      },
      {
        fields: ['status'],
        name: 'idx_financial_reports_status',
      },
      {
        fields: ['periodStart', 'periodEnd'],
        name: 'idx_financial_reports_period',
      },
      {
        fields: ['createdBy'],
        name: 'idx_financial_reports_creator',
      },
      {
        fields: ['tags'],
        using: 'GIN',
        name: 'idx_financial_reports_tags',
      },
      {
        fields: [sequelize.literal("(distribution->'schedule'->>'frequency')")],
        name: 'idx_financial_reports_frequency',
      },
    ],
  }
);

export default FinancialReport; 