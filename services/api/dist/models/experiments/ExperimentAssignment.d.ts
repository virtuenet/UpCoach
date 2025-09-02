import { Model, Optional } from 'sequelize';
export interface ExperimentAssignmentAttributes {
    id: string;
    experimentId: string;
    userId: string;
    variantId: string;
    assignedAt: Date;
    context?: Record<string, any>;
    isExcluded: boolean;
    exclusionReason?: string;
    userAgent?: string;
    ipAddress?: string;
    sessionId?: string;
}
interface ExperimentAssignmentCreationAttributes extends Optional<ExperimentAssignmentAttributes, 'id' | 'assignedAt' | 'isExcluded'> {
}
declare class ExperimentAssignment extends Model<ExperimentAssignmentAttributes, ExperimentAssignmentCreationAttributes> implements ExperimentAssignmentAttributes {
    id: string;
    experimentId: string;
    userId: string;
    variantId: string;
    assignedAt: Date;
    context?: Record<string, any>;
    isExcluded: boolean;
    exclusionReason?: string;
    userAgent?: string;
    ipAddress?: string;
    sessionId?: string;
    static getAssignment(experimentId: string, userId: string): Promise<ExperimentAssignment | null>;
    static createAssignment(experimentId: string, userId: string, variantId: string, context?: Record<string, any>): Promise<ExperimentAssignment>;
    static excludeUser(experimentId: string, userId: string, reason: string): Promise<ExperimentAssignment>;
    static getExperimentAssignments(experimentId: string): Promise<ExperimentAssignment[]>;
    static getUserExperiments(userId: string): Promise<ExperimentAssignment[]>;
}
export { ExperimentAssignment };
//# sourceMappingURL=ExperimentAssignment.d.ts.map