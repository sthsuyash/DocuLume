'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api/client';
import { AdminLayout } from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { parseApiError } from '@/lib/utils/errors';
import { formatBytes } from '@/lib/utils';
import {
  Users,
  FileText,
  MessageSquare,
  HardDrive,
  Activity,
  BarChart3,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SystemStats {
  total_users: number;
  active_users: number;
  total_documents: number;
  total_conversations: number;
  total_messages: number;
  total_storage_bytes: number;
  avg_documents_per_user: number;
  avg_conversations_per_user: number;
}

interface RecentActivity {
  id: number;
  type: 'user_registered' | 'document_uploaded' | 'conversation_started';
  user_email: string;
  description: string;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, activityResponse] = await Promise.all([
        apiClient.get('/admin/stats'),
        apiClient.get('/admin/activity/recent?limit=10'),
      ]);

      setStats(statsResponse.data);
      setRecentActivity(activityResponse.data.items || activityResponse.data);
    } catch (error: any) {
      const parsedError = parseApiError(error);
      toast({
        title: parsedError.title,
        description: parsedError.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registered':
        return <Users className="h-4 w-4" />;
      case 'document_uploaded':
        return <FileText className="h-4 w-4" />;
      case 'conversation_started':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              System overview and recent activity
            </p>
          </div>
          <Button variant="outline" onClick={fetchDashboardData}>
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg bg-slate-200" />
            ))}
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 fade-up">
              <Card className="border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.total_users || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.active_users || 0} active users
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                  <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.total_documents || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.avg_documents_per_user?.toFixed(1) || 0} per user
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversations</CardTitle>
                  <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.total_conversations || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.total_messages || 0} messages total
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                  <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
                    <HardDrive className="h-5 w-5 text-orange-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {formatBytes(stats?.total_storage_bytes || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Across all documents</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest system events and user actions</CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No recent activity
                  </p>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-4 pb-4 border-b last:border-0"
                      >
                        <div className="rounded-full bg-primary/10 p-2">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {activity.user_email} •{' '}
                            {formatDistanceToNow(new Date(activity.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card
                className="border-0 shadow-sm cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]"
                onClick={() => router.push('/dashboard/users')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    User Management
                  </CardTitle>
                  <CardDescription>
                    View and manage user accounts, roles, and permissions
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card
                className="border-0 shadow-sm cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]"
                onClick={() => router.push('/dashboard/analytics')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Analytics Dashboard
                  </CardTitle>
                  <CardDescription>
                    View detailed analytics and usage trends
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
