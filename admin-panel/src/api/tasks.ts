import { apiClient } from "./client";

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface GetTasksParams {
  search?: string;
  status?: string;
  priority?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

export const tasksApi = {
  getAllTasks: async (params: GetTasksParams = {}): Promise<Task[]> => {
    const response = await apiClient.get("/admin/tasks", { params });
    return response.data;
  },

  getTaskStats: async (): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  }> => {
    const response = await apiClient.get("/admin/tasks/stats");
    return response.data;
  },
};
