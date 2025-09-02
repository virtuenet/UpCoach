import { Model, Optional } from 'sequelize';
export interface SystemMetricsAttributes {
    id: string;
    metricDate: Date;
    systemName: string;
    uptime: number;
    downtime: number;
    incidents: number;
    responseTime: number;
    throughput: number;
    errorRate: number;
    availability: number;
    performanceMetrics: any;
    securityMetrics: any;
    createdAt: Date;
    updatedAt: Date;
}
interface SystemMetricsCreationAttributes extends Optional<SystemMetricsAttributes, 'id' | 'createdAt' | 'updatedAt'> {
}
export declare class SystemMetrics extends Model<SystemMetricsAttributes, SystemMetricsCreationAttributes> implements SystemMetricsAttributes {
    id: string;
    metricDate: Date;
    systemName: string;
    uptime: number;
    downtime: number;
    incidents: number;
    responseTime: number;
    throughput: number;
    errorRate: number;
    availability: number;
    performanceMetrics: any;
    securityMetrics: any;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export {};
//# sourceMappingURL=SystemMetrics.d.ts.map