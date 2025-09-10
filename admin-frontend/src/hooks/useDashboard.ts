'use client';

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { parseApiError } from '@/lib/utils/errors';
import { getStatsOverview, getRecentActivity } from '@/lib/api/analytics';
import type { SystemStats, RecentActivity } from '@/types/analytics';

export function useDashboard() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, activityData] = await Promise.all([
        getStatsOverview(),
        getRecentActivity(10),
      ]);
      setStats(statsData);
      setRecentActivity(activityData);
    } catch (error: any) {
      const e = parseApiError(error);
      toast({ title: e.title, description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  return { stats, recentActivity, loading, fetchDashboardData };
}
