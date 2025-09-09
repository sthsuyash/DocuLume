import apiClient from './client';
import type { SystemStats, RecentActivity, TopUser } from '@/types/analytics';

export async function getStatsOverview(): Promise<SystemStats> {
  const res = await apiClient.get('/admin/stats/overview');
  return res.data;
}

export async function getRecentActivity(limit = 10): Promise<RecentActivity[]> {
  const res = await apiClient.get('/admin/activity/recent', { params: { limit } });
  return res.data.items ?? [];
}

export async function getTopUsers(page = 1, pageSize = 10): Promise<TopUser[]> {
  const res = await apiClient.get('/admin/users', { params: { page, page_size: pageSize } });
  return res.data.items ?? [];
}

export async function exportFeedbackBlob(format: 'csv' | 'json'): Promise<Blob> {
  const res = await apiClient.get('/admin/analytics/feedback/export', {
    params: { format },
    responseType: 'blob',
  });
  return res.data;
}
