
export interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  targetValue: number;
  currentValue: number;
  deadline: string;
  status: "active" | "completed" | "paused" | "cancelled";
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface GetGoalsParams {
  search?: string;
  category?: string;
  status?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

export const goalsApi = {
  getAllGoals: async (params: GetGoalsParams = {}): Promise<Goal[]> => {
    const response = await apiClient.get("/admin/goals", { params });
    return response.data;
  },

  getGoalStats: async (): Promise<{
    total: number;
    active: number;
    completed: number;
    paused: number;
    cancelled: number;
  }> => {
    const response = await apiClient.get("/admin/goals/stats");
    return response.data;
  },
};
