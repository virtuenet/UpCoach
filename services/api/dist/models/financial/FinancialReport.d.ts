import { Model } from 'sequelize';
export declare enum ReportType {
    DAILY_SUMMARY = "daily_summary",
    WEEKLY_BUSINESS_REVIEW = "weekly_business_review",
    MONTHLY_P_AND_L = "monthly_p_and_l",
    QUARTERLY_INVESTOR = "quarterly_investor",
    CUSTOM = "custom"
}
export declare enum ReportStatus {
    PENDING = "pending",
    GENERATING = "generating",
    COMPLETED = "completed",
    FAILED = "failed"
}
export declare enum ReportFormat {
    JSON = "json",
    PDF = "pdf",
    EXCEL = "excel",
    CSV = "csv"
}
interface FinancialReportAttributes {
    id: string;
    type: ReportType;
    title: string;
    description?: string;
    status: ReportStatus;
    format: ReportFormat;
    scheduledFor?: Date;
    generatedAt?: Date;
    parameters?: any;
    data?: any;
    error?: string;
    recipients?: string[];
    fileUrl?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
interface FinancialReportCreationAttributes extends Omit<FinancialReportAttributes, 'id' | 'createdAt' | 'updatedAt'> {
}
export declare class FinancialReport extends Model<FinancialReportAttributes, FinancialReportCreationAttributes> implements FinancialReportAttributes {
    id: string;
    type: ReportType;
    title: string;
    description?: string;
    status: ReportStatus;
    format: ReportFormat;
    scheduledFor?: Date;
    generatedAt?: Date;
    parameters?: any;
    data?: any;
    error?: string;
    recipients?: string[];
    fileUrl?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    /**
     * Helper method to check if report is ready
     */
    isReady(): boolean;
    /**
     * Helper method to check if report failed
     */
    hasFailed(): boolean;
    /**
     * Get formatted report data
     */
    getFormattedData(): any;
}
export default FinancialReport;
//# sourceMappingURL=FinancialReport.d.ts.map