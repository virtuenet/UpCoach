export interface WorkflowStage {
    id: string;
    name: string;
    order: number;
    description?: string;
    requiredApprovals?: number;
    assignedRoles?: string[];
    automatedActions?: WorkflowAction[];
    sla?: {
        duration: number;
        escalationEmail?: string;
    };
}
export interface WorkflowAction {
    type: 'email' | 'webhook' | 'assign' | 'tag' | 'schedule';
    config: Record<string, any>;
}
export interface WorkflowItem {
    id: string;
    contentId: string;
    workflowId: string;
    currentStage: string;
    status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'published';
    assignedTo?: {
        id: string;
        name: string;
        email: string;
    };
    history: WorkflowHistory[];
    metadata: {
        priority?: 'low' | 'medium' | 'high' | 'urgent';
        dueDate?: Date;
        tags?: string[];
        notes?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}
export interface WorkflowHistory {
    id: string;
    stage: string;
    action: 'submitted' | 'approved' | 'rejected' | 'moved' | 'commented' | 'assigned';
    user: {
        id: string;
        name: string;
        email: string;
    };
    comment?: string;
    timestamp: Date;
    duration?: number;
}
export interface WorkflowTemplate {
    id: string;
    name: string;
    description?: string;
    stages: WorkflowStage[];
    triggers?: WorkflowTrigger[];
    isDefault?: boolean;
}
export interface WorkflowTrigger {
    event: 'content_created' | 'content_updated' | 'schedule' | 'manual';
    conditions?: Record<string, any>;
    actions: WorkflowAction[];
}
declare class WorkflowManagementService {
    private workflows;
    private items;
    private subscribers;
    constructor();
    private initializeDefaultWorkflows;
    createWorkflowItem(contentId: string, workflowId: string, metadata?: WorkflowItem['metadata']): Promise<WorkflowItem>;
    moveToNextStage(itemId: string, comment?: string, skipValidation?: boolean): Promise<WorkflowItem>;
    approveStage(itemId: string, comment?: string): Promise<WorkflowItem>;
    rejectStage(itemId: string, comment: string, moveToStage?: string): Promise<WorkflowItem>;
    assignItem(itemId: string, userId: string, userName: string, userEmail: string): Promise<WorkflowItem>;
    addComment(itemId: string, comment: string): Promise<WorkflowItem>;
    getItemsByStatus(status: WorkflowItem['status']): Promise<WorkflowItem[]>;
    getAssignedItems(userId: string): Promise<WorkflowItem[]>;
    getOverdueItems(): Promise<WorkflowItem[]>;
    subscribe(callback: (item: WorkflowItem) => void): () => void;
    private getCurrentUser;
    private determineStatus;
    private calculateStageDuration;
    private getStageStartTime;
    private executeStageActions;
    private sendEmail;
    private callWebhook;
    private autoAssign;
    private addTags;
    private schedulePublish;
    private saveWorkflowItem;
    private notifySubscribers;
}
export declare const workflowManagement: WorkflowManagementService;
export declare function useWorkflowItem(itemId: string): WorkflowItem | null;
export declare function useWorkflowItems(filter?: Partial<WorkflowItem>): WorkflowItem[];
export {};
//# sourceMappingURL=workflowManagement.d.ts.map