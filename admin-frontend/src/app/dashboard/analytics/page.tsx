'use client';

import { useAnalytics } from '@/hooks/useAnalytics';
import { AdminLayout } from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatBytes } from '@/lib/utils';
import type { RecentActivity } from '@/types/analytics';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Users, FileText, MessageSquare, HardDrive, Download } from 'lucide-react';

const ACTIVITY_META: Record<RecentActivity['type'], { label: string; fill: string }> = {
  user_registered:      { label: 'Registrations', fill: '#3b82f6' },
  document_uploaded:    { label: 'Uploads',        fill: '#22c55e' },
  conversation_started: { label: 'Conversations',  fill: '#a855f7' },
};

export default function AnalyticsPage() {
  const { stats, activity, topUsers, loading, fetchAnalytics, exportFeedback } = useAnalytics();

  const activityChartData = (Object.keys(ACTIVITY_META) as RecentActivity['type'][]).map((type) => ({
    name: ACTIVITY_META[type].label,
    count: activity.filter((a) => a.type === type).length,
    fill: ACTIVITY_META[type].fill,
  }));

  const topUserChartData = [...topUsers]
    .sort((a, b) => b.document_count - a.document_count)
    .slice(0, 7)
    .map((u) => ({ name: u.username, docs: u.document_count }));

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground mt-1">Usage trends and system insights</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => exportFeedback('csv')}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportFeedback('json')}>
              <Download className="mr-2 h-4 w-4" />
              Export JSON
            </Button>
            <Button variant="outline" size="sm" onClick={fetchAnalytics}>Refresh</Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
              ))}
            </div>
            <div className="h-64 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.total_users ?? 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stats?.active_users ?? 0} active</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Documents</CardTitle>
                  <div className="h-10 w-10 rounded-lg bg-green-50 dark:bg-green-950 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.total_documents ?? 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.avg_documents_per_user?.toFixed(1) ?? 0} per user
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversations</CardTitle>
                  <div className="h-10 w-10 rounded-lg bg-purple-50 dark:bg-purple-950 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.total_conversations ?? 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stats?.total_messages ?? 0} messages total</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                  <div className="h-10 w-10 rounded-lg bg-orange-50 dark:bg-orange-950 flex items-center justify-center">
                    <HardDrive className="h-5 w-5 text-orange-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatBytes(stats?.total_storage_bytes ?? 0)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Across all documents</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Recent Activity Breakdown</CardTitle>
                  <CardDescription>Last 50 events by type</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={activityChartData} barCategoryGap="30%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {activityChartData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Top Users by Documents</CardTitle>
                  <CardDescription>Most active document uploaders</CardDescription>
                </CardHeader>
                <CardContent>
                  {topUserChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={topUserChartData} layout="vertical" barCategoryGap="25%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                        <Tooltip />
                        <Bar dataKey="docs" name="Documents" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-16">No user data available</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
                <CardDescription>User behavior at a glance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Avg Docs per User</p>
                    <p className="text-2xl font-bold">{stats?.avg_documents_per_user?.toFixed(1) ?? '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Avg Conversations per User</p>
                    <p className="text-2xl font-bold">{stats?.avg_conversations_per_user?.toFixed(1) ?? '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">User Activation Rate</p>
                    <p className="text-2xl font-bold">
                      {stats?.total_users
                        ? `${(((stats.active_users ?? 0) / stats.total_users) * 100).toFixed(0)}%`
                        : '—'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
