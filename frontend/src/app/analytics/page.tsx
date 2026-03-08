"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store";
import apiClient from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { parseApiError } from "@/lib/utils/errors";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  MessageSquare,
  Calendar,
  ArrowLeft,
  Download,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AnalyticsData {
  overview: {
    total_users: number;
    total_documents: number;
    total_conversations: number;
    total_messages: number;
    growth_rate_users: number;
    growth_rate_documents: number;
  };
  time_series: {
    date: string;
    users: number;
    documents: number;
    conversations: number;
  }[];
  top_users: {
    username: string;
    email: string;
    document_count: number;
    conversation_count: number;
    message_count: number;
  }[];
  document_types: {
    file_type: string;
    count: number;
    percentage: number;
  }[];
  conversation_stats: {
    avg_messages_per_conversation: number;
    avg_conversation_length_minutes: number;
    most_active_hour: number;
    total_rag_queries: number;
  };
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7d");
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    if (user && !user.is_admin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page",
        variant: "destructive",
      });
      router.push("/dashboard");
      return;
    }

    fetchAnalytics();
  }, [isAuthenticated, user, router, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/admin/analytics", {
        params: { time_range: timeRange },
      });
      setAnalytics(response.data);
    } catch (error: any) {
      const parsedError = parseApiError(error);
      toast({
        title: parsedError.title,
        description: parsedError.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportAnalytics = async (format: "csv" | "json") => {
    try {
      const response = await apiClient.get(`/admin/analytics/export?format=${format}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `analytics_${timeRange}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `Analytics exported as ${format.toUpperCase()}`,
      });
    } catch (error: any) {
      const parsedError = parseApiError(error);
      toast({
        title: parsedError.title,
        description: parsedError.message,
        variant: "destructive",
      });
    }
  };

  const getBarWidth = (value: number, max: number) => {
    return `${(value / max) * 100}%`;
  };

  if (!isAuthenticated || (user && !user.is_admin)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/admin")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold">Analytics Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => exportAnalytics("csv")}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportAnalytics("json")}>
              <Download className="mr-2 h-4 w-4" />
              Export JSON
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-8">
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.overview.total_users || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className={analytics?.overview.growth_rate_users && analytics.overview.growth_rate_users > 0 ? "text-green-600" : "text-red-600"}>
                      {analytics?.overview.growth_rate_users?.toFixed(1) || 0}%
                    </span>{" "}
                    vs previous period
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Documents</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.overview.total_documents || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className={analytics?.overview.growth_rate_documents && analytics.overview.growth_rate_documents > 0 ? "text-green-600" : "text-red-600"}>
                      {analytics?.overview.growth_rate_documents?.toFixed(1) || 0}%
                    </span>{" "}
                    vs previous period
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversations</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.overview.total_conversations || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {analytics?.overview.total_messages || 0} total messages
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Messages</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics?.conversation_stats.avg_messages_per_conversation?.toFixed(1) || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Per conversation</p>
                </CardContent>
              </Card>
            </div>

            {/* Time Series Chart */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Usage Trends</CardTitle>
                <CardDescription>Activity over time</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics?.time_series && analytics.time_series.length > 0 ? (
                  <div className="space-y-6">
                    <div className="h-64 flex items-end justify-between gap-2">
                      {analytics.time_series.map((data, index) => {
                        const maxValue = Math.max(
                          ...analytics.time_series.map((d) => Math.max(d.users, d.documents, d.conversations))
                        );
                        const height = ((data.documents / maxValue) * 100) || 0;

                        return (
                          <div key={index} className="flex-1 flex flex-col items-center gap-2">
                            <div className="w-full flex flex-col items-center gap-1">
                              <div
                                className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                                style={{ height: `${height}%`, minHeight: height > 0 ? "4px" : "0" }}
                                title={`${data.documents} documents`}
                              />
                              <div
                                className="w-full bg-green-500 rounded-t transition-all hover:bg-green-600"
                                style={{ height: `${((data.users / maxValue) * 100) || 0}%`, minHeight: ((data.users / maxValue) * 100) > 0 ? "4px" : "0" }}
                                title={`${data.users} users`}
                              />
                              <div
                                className="w-full bg-purple-500 rounded-t transition-all hover:bg-purple-600"
                                style={{ height: `${((data.conversations / maxValue) * 100) || 0}%`, minHeight: ((data.conversations / maxValue) * 100) > 0 ? "4px" : "0" }}
                                title={`${data.conversations} conversations`}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(data.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded bg-blue-500" />
                        <span>Documents</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded bg-green-500" />
                        <span>Users</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded bg-purple-500" />
                        <span>Conversations</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No time series data available</p>
                )}
              </CardContent>
            </Card>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {/* Top Users */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Users</CardTitle>
                  <CardDescription>Most active users by document count</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics?.top_users && analytics.top_users.length > 0 ? (
                    <div className="space-y-4">
                      {analytics.top_users.slice(0, 5).map((user, index) => {
                        const maxDocs = Math.max(...analytics.top_users.map((u) => u.document_count));
                        return (
                          <div key={index} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium truncate">{user.username}</span>
                              <span className="text-muted-foreground">{user.document_count} docs</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: getBarWidth(user.document_count, maxDocs) }}
                              />
                            </div>
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              <span>{user.conversation_count} conversations</span>
                              <span>{user.message_count} messages</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No user data available</p>
                  )}
                </CardContent>
              </Card>

              {/* Document Types */}
              <Card>
                <CardHeader>
                  <CardTitle>Document Types</CardTitle>
                  <CardDescription>Distribution by file type</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics?.document_types && analytics.document_types.length > 0 ? (
                    <div className="space-y-4">
                      {analytics.document_types.map((type, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{type.file_type || "Unknown"}</span>
                            <span className="text-muted-foreground">
                              {type.count} ({type.percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${type.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No document type data available</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Conversation Insights */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Conversation Insights</CardTitle>
                <CardDescription>Chat activity and patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Avg Conversation Length</p>
                    <p className="text-2xl font-bold">
                      {analytics?.conversation_stats.avg_conversation_length_minutes?.toFixed(0) || 0} min
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Most Active Hour</p>
                    <p className="text-2xl font-bold">
                      {analytics?.conversation_stats.most_active_hour || 0}:00
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">RAG Queries</p>
                    <p className="text-2xl font-bold">
                      {analytics?.conversation_stats.total_rag_queries || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
