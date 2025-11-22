import { apiClient } from './api';

export async function triggerWeeklyDoc(
  userId: string,
  reportContent: string = 'Weekly report content',
  reportTitle: string = 'Weekly Report'
): Promise<void> {
  await apiClient.post(`/api/v2/reports/weekly/${encodeURIComponent(userId)}/docs`, { reportContent, reportTitle });
}

export async function triggerWeeklySheet(
  userId: string,
  reportData: (string|number)[][] = [["Metric","Value"],["Completed Tasks",0],["Active Days",0]],
  reportTitle: string = 'Weekly Metrics'
): Promise<void> {
  await apiClient.post(`/api/v2/reports/weekly/${encodeURIComponent(userId)}/sheets`, { reportData, reportTitle });
}


