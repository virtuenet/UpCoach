import { Model, Optional } from 'sequelize';
export interface ExperimentEventAttributes {
    id: string;
    experimentId: string;
    userId: string;
    variantId: string;
    eventType: string;
    eventValue?: number;
    properties?: Record<string, any>;
    timestamp: Date;
    sessionId?: string;
    metadata?: Record<string, any>;
}
interface ExperimentEventCreationAttributes extends Optional<ExperimentEventAttributes, 'id' | 'timestamp'> {
}
declare class ExperimentEvent extends Model<ExperimentEventAttributes, ExperimentEventCreationAttributes> implements ExperimentEventAttributes {
    id: string;
    experimentId: string;
    userId: string;
    variantId: string;
    eventType: string;
    eventValue?: number;
    properties?: Record<string, any>;
    timestamp: Date;
    sessionId?: string;
    metadata?: Record<string, any>;
    static trackEvent(experimentId: string, userId: string, variantId: string, eventType: string, eventValue?: number, properties?: Record<string, any>): Promise<ExperimentEvent>;
    static getConversionRate(experimentId: string, variantId: string, conversionEvent: string, startDate?: Date, endDate?: Date): Promise<{
        totalUsers: number;
        conversions: number;
        conversionRate: number;
    }>;
    static getEventMetrics(experimentId: string, variantId: string, eventType: string, startDate?: Date, endDate?: Date): Promise<{
        count: number;
        uniqueUsers: number;
        averageValue?: number;
        totalValue?: number;
    }>;
    static getEventFunnel(experimentId: string, variantId: string, events: string[], startDate?: Date, endDate?: Date): Promise<{
        event: string;
        users: number;
        conversionRate: number;
    }[]>;
}
export { ExperimentEvent };
//# sourceMappingURL=ExperimentEvent.d.ts.map