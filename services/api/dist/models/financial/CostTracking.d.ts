import { Model } from 'sequelize-typescript';
export declare enum CostCategory {
    INFRASTRUCTURE = "infrastructure",
    API_SERVICES = "api_services",
    PERSONNEL = "personnel",
    MARKETING = "marketing",
    OPERATIONS = "operations",
    DEVELOPMENT = "development",
    LEGAL = "legal",
    OTHER = "other"
}
export declare enum CostType {
    FIXED = "fixed",
    VARIABLE = "variable",
    ONE_TIME = "one_time"
}
export declare enum CostProvider {
    AWS = "aws",
    GOOGLE_CLOUD = "google_cloud",
    AZURE = "azure",
    OPENAI = "openai",
    STRIPE = "stripe",
    TWILIO = "twilio",
    SENDGRID = "sendgrid",
    OTHER = "other"
}
export declare class CostTracking extends Model {
    id: string;
    category: CostCategory;
    type: CostType;
    provider?: CostProvider;
    name: string;
    description?: string;
    amount: number;
    currency: string;
    periodStart: Date;
    periodEnd: Date;
    quantity?: number;
    unit?: string;
    unitCost?: number;
    invoiceNumber?: string;
    vendorId?: string;
    department?: string;
    project?: string;
    tags?: string[];
    isRecurring: boolean;
    recurringInterval?: string;
    nextBillingDate?: Date;
    isApproved: boolean;
    approvedBy?: string;
    approvedAt?: Date;
    metadata?: any;
    createdAt: Date;
    updatedAt: Date;
    static calculateUnitCost(instance: CostTracking): Promise<void>;
    get dailyCost(): number;
    get monthlyCost(): number;
    get isOverBudget(): boolean;
}
//# sourceMappingURL=CostTracking.d.ts.map