import { Model, Optional } from 'sequelize';
export interface ContentScheduleAttributes {
    id: number;
    contentId: number;
    scheduleType: 'publish' | 'unpublish' | 'update';
    scheduledFor: Date;
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    metadata?: any;
    createdBy: number;
    processedAt?: Date;
    error?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface ContentScheduleCreationAttributes extends Optional<ContentScheduleAttributes, 'id' | 'status' | 'metadata' | 'processedAt' | 'error' | 'createdAt' | 'updatedAt'> {
}
declare class ContentSchedule extends Model<ContentScheduleAttributes, ContentScheduleCreationAttributes> implements ContentScheduleAttributes {
    id: number;
    contentId: number;
    scheduleType: 'publish' | 'unpublish' | 'update';
    scheduledFor: Date;
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    metadata?: any;
    createdBy: number;
    processedAt?: Date;
    error?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default ContentSchedule;
//# sourceMappingURL=ContentSchedule.d.ts.map