// Workflow Management Service
import { apiClient } from '../api/client';
class WorkflowManagementService {
    constructor() {
        this.workflows = new Map();
        this.items = new Map();
        this.subscribers = new Set();
        this.initializeDefaultWorkflows();
    }
    initializeDefaultWorkflows() {
        // Basic content approval workflow
        const basicWorkflow = {
            id: 'basic-approval',
            name: 'Basic Content Approval',
            description: 'Simple draft -> review -> publish workflow',
            isDefault: true,
            stages: [
                {
                    id: 'draft',
                    name: 'Draft',
                    order: 1,
                    description: 'Content is being created',
                    assignedRoles: ['author', 'editor'],
                },
                {
                    id: 'review',
                    name: 'Review',
                    order: 2,
                    description: 'Content is under review',
                    requiredApprovals: 1,
                    assignedRoles: ['editor', 'admin'],
                    sla: {
                        duration: 24,
                        escalationEmail: 'admin@upcoach.ai',
                    },
                },
                {
                    id: 'approved',
                    name: 'Approved',
                    order: 3,
                    description: 'Content approved for publishing',
                    automatedActions: [
                        {
                            type: 'email',
                            config: {
                                template: 'content-approved',
                                recipients: ['author'],
                            },
                        },
                    ],
                },
                {
                    id: 'published',
                    name: 'Published',
                    order: 4,
                    description: 'Content is live',
                    automatedActions: [
                        {
                            type: 'webhook',
                            config: {
                                url: '/api/webhooks/content-published',
                                method: 'POST',
                            },
                        },
                    ],
                },
            ],
        };
        // Advanced workflow with multiple approval levels
        const advancedWorkflow = {
            id: 'advanced-approval',
            name: 'Advanced Content Workflow',
            description: 'Multi-stage approval with legal and compliance review',
            stages: [
                {
                    id: 'draft',
                    name: 'Draft',
                    order: 1,
                    assignedRoles: ['author'],
                },
                {
                    id: 'editorial-review',
                    name: 'Editorial Review',
                    order: 2,
                    requiredApprovals: 1,
                    assignedRoles: ['editor'],
                    sla: { duration: 12 },
                },
                {
                    id: 'legal-review',
                    name: 'Legal Review',
                    order: 3,
                    requiredApprovals: 1,
                    assignedRoles: ['legal'],
                    sla: { duration: 48 },
                },
                {
                    id: 'final-approval',
                    name: 'Final Approval',
                    order: 4,
                    requiredApprovals: 2,
                    assignedRoles: ['manager', 'admin'],
                    sla: { duration: 24 },
                },
                {
                    id: 'scheduled',
                    name: 'Scheduled',
                    order: 5,
                    automatedActions: [
                        {
                            type: 'schedule',
                            config: {
                                publishAt: 'metadata.publishDate',
                            },
                        },
                    ],
                },
                {
                    id: 'published',
                    name: 'Published',
                    order: 6,
                },
            ],
        };
        this.workflows.set(basicWorkflow.id, basicWorkflow);
        this.workflows.set(advancedWorkflow.id, advancedWorkflow);
    }
    // Create a new workflow item
    async createWorkflowItem(contentId, workflowId, metadata) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow ${workflowId} not found`);
        }
        const firstStage = workflow.stages[0];
        const item = {
            id: `wf_${contentId}_${Date.now()}`,
            contentId,
            workflowId,
            currentStage: firstStage.id,
            status: 'pending',
            history: [
                {
                    id: `h_${Date.now()}`,
                    stage: firstStage.id,
                    action: 'submitted',
                    user: this.getCurrentUser(),
                    timestamp: new Date(),
                },
            ],
            metadata: metadata || {},
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.items.set(item.id, item);
        await this.saveWorkflowItem(item);
        this.notifySubscribers(item);
        // Trigger automated actions for the first stage
        await this.executeStageActions(firstStage, item);
        return item;
    }
    // Move item to next stage
    async moveToNextStage(itemId, comment, skipValidation = false) {
        const item = this.items.get(itemId);
        if (!item) {
            throw new Error(`Workflow item ${itemId} not found`);
        }
        const workflow = this.workflows.get(item.workflowId);
        if (!workflow) {
            throw new Error(`Workflow ${item.workflowId} not found`);
        }
        const currentStageIndex = workflow.stages.findIndex(s => s.id === item.currentStage);
        if (currentStageIndex === -1 || currentStageIndex === workflow.stages.length - 1) {
            throw new Error('Cannot move to next stage');
        }
        // Validate approvals if required
        if (!skipValidation) {
            const currentStage = workflow.stages[currentStageIndex];
            if (currentStage.requiredApprovals) {
                const approvals = item.history.filter(h => h.stage === currentStage.id && h.action === 'approved').length;
                if (approvals < currentStage.requiredApprovals) {
                    throw new Error(`Requires ${currentStage.requiredApprovals} approvals, has ${approvals}`);
                }
            }
        }
        const nextStage = workflow.stages[currentStageIndex + 1];
        // Update item
        item.currentStage = nextStage.id;
        item.status = this.determineStatus(nextStage);
        item.updatedAt = new Date();
        // Add history entry
        item.history.push({
            id: `h_${Date.now()}`,
            stage: nextStage.id,
            action: 'moved',
            user: this.getCurrentUser(),
            comment,
            timestamp: new Date(),
            duration: this.calculateStageDuration(item, workflow.stages[currentStageIndex].id),
        });
        // Save and notify
        await this.saveWorkflowItem(item);
        this.notifySubscribers(item);
        // Execute automated actions
        await this.executeStageActions(nextStage, item);
        return item;
    }
    // Approve current stage
    async approveStage(itemId, comment) {
        const item = this.items.get(itemId);
        if (!item) {
            throw new Error(`Workflow item ${itemId} not found`);
        }
        item.history.push({
            id: `h_${Date.now()}`,
            stage: item.currentStage,
            action: 'approved',
            user: this.getCurrentUser(),
            comment,
            timestamp: new Date(),
        });
        item.updatedAt = new Date();
        await this.saveWorkflowItem(item);
        this.notifySubscribers(item);
        // Check if we should auto-advance
        const workflow = this.workflows.get(item.workflowId);
        if (workflow) {
            const currentStage = workflow.stages.find(s => s.id === item.currentStage);
            if (currentStage?.requiredApprovals) {
                const approvals = item.history.filter(h => h.stage === currentStage.id && h.action === 'approved').length;
                if (approvals >= currentStage.requiredApprovals) {
                    // Auto-advance to next stage
                    await this.moveToNextStage(itemId, 'Auto-advanced after required approvals');
                }
            }
        }
        return item;
    }
    // Reject current stage
    async rejectStage(itemId, comment, moveToStage) {
        const item = this.items.get(itemId);
        if (!item) {
            throw new Error(`Workflow item ${itemId} not found`);
        }
        item.history.push({
            id: `h_${Date.now()}`,
            stage: item.currentStage,
            action: 'rejected',
            user: this.getCurrentUser(),
            comment,
            timestamp: new Date(),
        });
        item.status = 'rejected';
        // Move to specified stage or back to draft
        if (moveToStage) {
            item.currentStage = moveToStage;
        }
        else {
            const workflow = this.workflows.get(item.workflowId);
            if (workflow) {
                item.currentStage = workflow.stages[0].id; // Back to first stage
            }
        }
        item.updatedAt = new Date();
        await this.saveWorkflowItem(item);
        this.notifySubscribers(item);
        return item;
    }
    // Assign item to user
    async assignItem(itemId, userId, userName, userEmail) {
        const item = this.items.get(itemId);
        if (!item) {
            throw new Error(`Workflow item ${itemId} not found`);
        }
        item.assignedTo = { id: userId, name: userName, email: userEmail };
        item.history.push({
            id: `h_${Date.now()}`,
            stage: item.currentStage,
            action: 'assigned',
            user: this.getCurrentUser(),
            comment: `Assigned to ${userName}`,
            timestamp: new Date(),
        });
        item.updatedAt = new Date();
        await this.saveWorkflowItem(item);
        this.notifySubscribers(item);
        return item;
    }
    // Add comment to workflow item
    async addComment(itemId, comment) {
        const item = this.items.get(itemId);
        if (!item) {
            throw new Error(`Workflow item ${itemId} not found`);
        }
        item.history.push({
            id: `h_${Date.now()}`,
            stage: item.currentStage,
            action: 'commented',
            user: this.getCurrentUser(),
            comment,
            timestamp: new Date(),
        });
        item.updatedAt = new Date();
        await this.saveWorkflowItem(item);
        this.notifySubscribers(item);
        return item;
    }
    // Get workflow items by status
    async getItemsByStatus(status) {
        const items = [];
        this.items.forEach(item => {
            if (item.status === status) {
                items.push(item);
            }
        });
        return items;
    }
    // Get workflow items assigned to user
    async getAssignedItems(userId) {
        const items = [];
        this.items.forEach(item => {
            if (item.assignedTo?.id === userId) {
                items.push(item);
            }
        });
        return items;
    }
    // Get overdue items
    async getOverdueItems() {
        const now = new Date();
        const overdueItems = [];
        this.items.forEach(item => {
            // Check due date
            if (item.metadata.dueDate && new Date(item.metadata.dueDate) < now) {
                overdueItems.push(item);
            }
            // Check SLA
            const workflow = this.workflows.get(item.workflowId);
            if (workflow) {
                const currentStage = workflow.stages.find(s => s.id === item.currentStage);
                if (currentStage?.sla) {
                    const stageStartTime = this.getStageStartTime(item, currentStage.id);
                    const hoursInStage = (now.getTime() - stageStartTime.getTime()) / (1000 * 60 * 60);
                    if (hoursInStage > currentStage.sla.duration) {
                        overdueItems.push(item);
                    }
                }
            }
        });
        return overdueItems;
    }
    // Subscribe to workflow updates
    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }
    // Private helper methods
    getCurrentUser() {
        // This would typically get the current user from auth context
        return {
            id: 'current-user',
            name: 'Current User',
            email: 'user@upcoach.ai',
        };
    }
    determineStatus(stage) {
        const statusMap = {
            draft: 'pending',
            review: 'in_review',
            approved: 'approved',
            published: 'published',
            rejected: 'rejected',
        };
        return statusMap[stage.id] || 'pending';
    }
    calculateStageDuration(item, stageId) {
        const stageEntries = item.history.filter(h => h.stage === stageId);
        if (stageEntries.length === 0)
            return 0;
        const firstEntry = stageEntries[0];
        const lastEntry = stageEntries[stageEntries.length - 1];
        return lastEntry.timestamp.getTime() - firstEntry.timestamp.getTime();
    }
    getStageStartTime(item, stageId) {
        const stageEntry = item.history.find(h => h.stage === stageId);
        return stageEntry?.timestamp || item.createdAt;
    }
    async executeStageActions(stage, item) {
        if (!stage.automatedActions)
            return;
        for (const action of stage.automatedActions) {
            try {
                switch (action.type) {
                    case 'email':
                        await this.sendEmail(action.config, item);
                        break;
                    case 'webhook':
                        await this.callWebhook(action.config, item);
                        break;
                    case 'assign':
                        await this.autoAssign(action.config, item);
                        break;
                    case 'tag':
                        await this.addTags(action.config, item);
                        break;
                    case 'schedule':
                        await this.schedulePublish(action.config, item);
                        break;
                }
            }
            catch (error) {
                console.error(`Failed to execute action ${action.type}:`, error);
            }
        }
    }
    async sendEmail(config, item) {
        // Implementation for sending emails
        console.log('Sending email:', config, item);
    }
    async callWebhook(config, item) {
        try {
            await apiClient.post(config.url, {
                item,
                event: 'workflow_stage_changed',
            });
        }
        catch (error) {
            console.error('Webhook call failed:', error);
        }
    }
    async autoAssign(config, item) {
        // Implementation for auto-assignment logic
        console.log('Auto-assigning:', config, item);
    }
    async addTags(config, item) {
        if (!item.metadata.tags) {
            item.metadata.tags = [];
        }
        item.metadata.tags.push(...(config.tags || []));
    }
    async schedulePublish(config, item) {
        // Implementation for scheduled publishing
        console.log('Scheduling publish:', config, item);
    }
    async saveWorkflowItem(item) {
        try {
            await apiClient.put(`/workflow/items/${item.id}`, item);
        }
        catch (error) {
            console.error('Failed to save workflow item:', error);
        }
    }
    notifySubscribers(item) {
        this.subscribers.forEach(callback => callback(item));
    }
}
// Export singleton instance
export const workflowManagement = new WorkflowManagementService();
// Export React hooks
import { useState, useEffect } from 'react';
export function useWorkflowItem(itemId) {
    const [item, setItem] = useState(null);
    useEffect(() => {
        const unsubscribe = workflowManagement.subscribe(updatedItem => {
            if (updatedItem.id === itemId) {
                setItem(updatedItem);
            }
        });
        return unsubscribe;
    }, [itemId]);
    return item;
}
export function useWorkflowItems(filter) {
    const [items, setItems] = useState([]);
    useEffect(() => {
        // Load initial items based on filter
        // This would typically fetch from the API
        const loadItems = async () => {
            if (filter?.status) {
                const filtered = await workflowManagement.getItemsByStatus(filter.status);
                setItems(filtered);
            }
        };
        loadItems();
    }, [filter]);
    return items;
}
//# sourceMappingURL=workflowManagement.js.map