import { apiClient } from './client';

export interface MoodEntry {
  id: string;
  moodLevel: 'very_bad' | 'bad' | 'neutral' | 'good' | 'very_good';
  notes?: string;
  activities: string[];
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface GetMoodEntriesParams {
  days?: number;
  mood?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

export interface MoodStats {
  totalEntries: number;
  averageMood: number;
  distribution: {
    very_bad: number;
    bad: number;
    neutral: number;
    good: number;
    very_good: number;
  };
  trends: {
    date: string;
    averageMood: number;
  }[];
}

export const moodApi = {
  getMoodEntries: async (
    params: GetMoodEntriesParams = {}
  ): Promise<{
    entries: MoodEntry[];
    total: number;
  }> => {
    const response = await apiClient.get('/admin/mood', { params });
    return response.data;
  },

  getMoodStats: async (params: { days?: number } = {}): Promise<MoodStats> => {
    const response = await apiClient.get('/admin/mood/stats', { params });
    return response.data;
  },
};
