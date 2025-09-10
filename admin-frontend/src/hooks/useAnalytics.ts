'use client';

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { parseApiError } from '@/lib/utils/errors';
import { getStatsOverview, getRecentActivity, getTopUsers, exportFeedbackBlob } from '@/lib/api/analytics';
import { downloadBlob } from '@/lib/utils/download';
import type { SystemStats, RecentActivity, TopUser } from '@/types/analytics';

export function useAnalytics() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, activityData, topUsersData] = await Promise.all([
        getStatsOverview(),
        getRecentActivity(50),
        getTopUsers(1, 10),
      ]);
      setStats(statsData);
      setActivity(activityData);
      setTopUsers(topUsersData);
    } catch (error: any) {
      const e = parseApiError(error);
      toast({ title: e.title, description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const exportFeedback = async (format: 'csv' | 'json') => {
    try {
      const blob = await exportFeedbackBlob(format);
      downloadBlob(blob, `feedback_export.${format}`);
      toast({ title: 'Export complete', description: `Feedback exported as ${format.toUpperCase()}` });
    } catch (error: any) {
      const e = parseApiError(error);
      toast({ title: e.title, description: e.message, variant: 'destructive' });
    }
  };

  return { stats, activity, topUsers, loading, fetchAnalytics, exportFeedback };
}
