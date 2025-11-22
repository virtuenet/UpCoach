import { Model, DataTypes } from 'sequelize';

import { sequelize } from '../../config/sequelize';

export enum ReportType {
  DAILY_SUMMARY = 'daily_summary',
  WEEKLY_BUSINESS_REVIEW = 'weekly_business_review',
  MONTHLY_P_AND_L = 'monthly_p_and_l',
  QUARTERLY_INVESTOR = 'quarterly_investor',
  CUSTOM = 'custom',
}

export enum ReportStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum ReportFormat {
  JSON = 'json',
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
}

interface FinancialReportAttributes {
  id: string;
  type: ReportType;
  title: string;
  name?: string;
  description?: string;
  status: ReportStatus;
  format: ReportFormat;
  scheduledFor?: Date;
  generatedAt?: Date;
  parameters?: unknown;
  data?: unknown;
  metadata?: unknown;
  error?: string;
  recipients?: string[];
  fileUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface FinancialReportCreationAttributes
  extends Omit<FinancialReportAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class FinancialReport
  extends Model<FinancialReportAttributes, FinancialReportCreationAttributes>
  implements FinancialReportAttributes
{
  public id!: string;
  public type!: ReportType;
  public title!: string;
  public name?: string;
  public description?: string;
  public status!: ReportStatus;
  public format!: ReportFormat;
  public scheduledFor?: Date;
  public generatedAt?: Date;
  public parameters?: unknown;
  public data?: unknown;
  public metadata?: unknown;
  public error?: string;
  public recipients?: string[];
  public fileUrl?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  /**
   * Helper method to check if report is ready
   */
  public isReady(): boolean {
    return this.status === ReportStatus.COMPLETED;
  }

  /**
   * Helper method to check if report failed
   */
  public hasFailed(): boolean {
    return this.status === ReportStatus.FAILED;
  }

  /**
   * Get formatted report data
   */
  public getFormattedData(): unknown {
    if (!this.data) return null;

    switch (this.format) {
      case ReportFormat.JSON:
        return this.data;
      case ReportFormat.PDF:
      case ReportFormat.EXCEL:
      case ReportFormat.CSV:
        // These would be generated from the data
        return {
          fileUrl: this.fileUrl,
          data: this.data,
        };
      default:
        return this.data;
    }
  }
}

FinancialReport.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM(...Object.values(ReportType)),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ReportStatus)),
      allowNull: false,
      defaultValue: ReportStatus.PENDING,
    },
    format: {
      type: DataTypes.ENUM(...Object.values(ReportFormat)),
      allowNull: false,
      defaultValue: ReportFormat.JSON,
    },
    scheduledFor: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    generatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    parameters: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    error: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    recipients: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
    },
    fileUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  } as unknown,
  {
    sequelize,
    modelName: 'FinancialReport',
    tableName: 'financial_reports',
    timestamps: true,
    indexes: [
      {
        fields: ['type'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['scheduledFor'],
      },
      {
        fields: ['createdAt'],
      },
    ],
  }
);

export default FinancialReport;
