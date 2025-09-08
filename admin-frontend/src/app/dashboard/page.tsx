'use client';

import { useRouter } from 'next/navigation';
import { useDashboard } from '@/hooks/useDashboard';
import { AdminLayout } from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatBytes } from '@/lib/utils';
import type { RecentActivity } from '@/types/analytics';
import {
  Users,
  FileText,
  MessageSquare,
  HardDrive,
  Activity,
  BarChart3,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ACTIVITY_COLORS: Record<RecentActivity['type'], { dot: string; bg: string }> = {
  user_registered:      { dot: 'bg-blue-500',   bg: 'bg-blue-50 dark:bg-blue-950' },
  document_uploaded:    { dot: 'bg-green-500',  bg: 'bg-green-50 dark:bg-green-950' },
  conversation_started: { dot: 'bg-purple-500', bg: 'bg-purple-50 dark:bg-purple-950' },
};

const ACTIVITY_ICONS: Record<RecentActivity['type'], React.ReactNode> = {
  user_registered:      <Users className="h-3.5 w-3.5" />,
  document_uploaded:    <FileText className="h-3.5 w-3.5" />,
  conversation_started: <MessageSquare className="h-3.5 w-3.5" />,
};

export default function DashboardPage() {
  const router = useRouter();
  const { stats, recentActivity, loading, fetchDashboardData } = useDashboard();

  const activePct = stats?.total_users
    ? Math.round(((stats.active_users ?? 0) / stats.total_users) * 100)
    : 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-0.5">System overview and recent activity</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchDashboardData} className="gap-2 shrink-0">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>

        {/* Stat Cards */}
        {loading ? (
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Users</p>
                    <p className="text-3xl font-bold mt-1 tabular-nums">{stats?.total_users ?? 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="text-green-600 font-medium">{activePct}%</span> active
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center shrink-0">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Documents</p>
                    <p className="text-3xl font-bold mt-1 tabular-nums">{stats?.total_documents ?? 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="font-medium">{stats?.avg_documents_per_user?.toFixed(1) ?? 0}</span> per user
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-green-50 dark:bg-green-950 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Conversations</p>
                    <p className="text-3xl font-bold mt-1 tabular-nums">{stats?.total_conversations ?? 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="font-medium">{stats?.total_messages ?? 0}</span> messages
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-purple-50 dark:bg-purple-950 flex items-center justify-center shrink-0">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Storage</p>
                    <p className="text-3xl font-bold mt-1">{formatBytes(stats?.total_storage_bytes ?? 0)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Across all documents</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-orange-50 dark:bg-orange-950 flex items-center justify-center shrink-0">
                    <HardDrive className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bottom section */}
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          {/* Recent Activity */}
          <Card className="border-0 shadow-sm hover:translate-y-0 hover:shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                Recent Activity
              </CardTitle>
              <CardDescription className="text-xs">Latest system events</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-8 w-8 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800 shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                        <div className="h-2.5 w-1/3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Activity className="h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {recentActivity.map((item) => {
                    const meta = ACTIVITY_COLORS[item.type];
                    return (
                      <div key={item.id} className="flex items-start gap-3 py-2.5 border-b last:border-0 border-slate-100 dark:border-slate-800">
                        <div className={`h-7 w-7 rounded-full ${meta.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                          <span className={`${meta.dot.replace('bg-', 'text-')}`}>
                            {ACTIVITY_ICONS[item.type]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-snug">{item.description}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.user_email} · {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Quick Access</h2>
            {[
              { label: 'User Management', desc: 'Manage accounts and roles', icon: Users, href: '/dashboard/users', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950' },
              { label: 'Documents', desc: 'Oversee uploaded files', icon: FileText, href: '/dashboard/documents', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950' },
              { label: 'Analytics', desc: 'Usage trends and insights', icon: BarChart3, href: '/dashboard/analytics', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950' },
            ].map((item) => (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-sm transition-all group text-left"
              >
                <div className={`h-9 w-9 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>
                  <item.icon className={`h-4.5 w-4.5 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
