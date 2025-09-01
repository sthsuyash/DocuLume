"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store";
import apiClient from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Upload, MessageSquare, FileText, LogOut, Settings, BarChart2, Zap, DollarSign } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { FileDropzone } from "@/components/file-dropzone";
import { DashboardSkeleton } from "@/components/loading-skeleton";
import { BrandLogo } from "@/components/brand-logo";
import { EmailVerificationBanner } from "@/components/email-verification-banner";
import { NotificationBell } from "@/components/notification-bell";
import { KeyboardShortcutsModal } from "@/components/keyboard-shortcuts-modal";

interface UsageStats {
  document_count: number;
  conversation_count: number;
  message_count: number;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  total_cost_usd: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, checkAuth } = useAuthStore();
  const [documents, setDocuments] = useState([]);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      await checkAuth();
      const { isAuthenticated: authStatus } = useAuthStore.getState();
      if (!authStatus) {
        router.push("/auth/login");
        return;
      }
      fetchDocuments();
      fetchStats();
    };
    init();
  }, [router, checkAuth]);

  const fetchStats = async () => {
    try {
      const r = await apiClient.get("/users/me/stats");
      setStats(r.data);
    } catch { /* non-critical */ }
  };

  const fetchDocuments = async () => {
    try {
      const response = await apiClient.get("/documents/", {
        params: {
          page: 1,
          page_size: 5, // Only need 5 for dashboard preview
        },
      });
      // Backend now returns paginated response: { items, total, page, page_size }
      setDocuments(response.data.items || []);
      setTotalDocuments(response.data.total || 0);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-md supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <BrandLogo textClassName="text-2xl" />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium text-muted-foreground sm:inline-block">
              Welcome, {user?.username}
            </span>
            <NotificationBell />
            <ThemeToggle />
            <Button
              onClick={() => router.push("/settings")}
              variant="ghost"
              size="icon"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button onClick={handleLogout} variant="outline" size="sm" className="rounded-full">
              <LogOut className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl px-4 py-8 md:py-12">
        {user && !user.is_verified && !bannerDismissed && (
          <div className="mb-6">
            <EmailVerificationBanner onDismiss={() => setBannerDismissed(true)} />
          </div>
        )}

        <div className="mb-12 fade-up">
          <FileDropzone onUploadComplete={fetchDocuments} />
        </div>

        {stats && (
          <div className="mb-8 grid gap-4 grid-cols-2 md:grid-cols-4 fade-up">
            {[
              { label: "Documents", value: stats.document_count, icon: FileText },
              { label: "Conversations", value: stats.conversation_count, icon: MessageSquare },
              { label: "Total Tokens", value: (stats.total_prompt_tokens + stats.total_completion_tokens).toLocaleString(), icon: Zap },
              { label: "Est. Cost", value: `$${stats.total_cost_usd.toFixed(4)}`, icon: DollarSign },
            ].map(({ label, value, icon: Icon }) => (
              <Card key={label} className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{label}</p>
                    <p className="text-lg font-bold truncate">{value}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="mb-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="group fade-up hover:shadow-lg">
            <CardHeader className="space-y-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl">Start Chatting</CardTitle>
                <CardDescription>Ask questions about your documents</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full rounded-full" onClick={() => router.push("/chat")}>
                Go to Chat
              </Button>
            </CardContent>
          </Card>

          <Card className="group fade-up hover:shadow-lg" style={{ animationDelay: "100ms" }}>
            <CardHeader className="space-y-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl">My Documents</CardTitle>
                <CardDescription>{totalDocuments} documents uploaded</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full rounded-full"
                variant="outline"
                onClick={() => router.push("/documents")}
              >
                View All
              </Button>
            </CardContent>
          </Card>

          <Card className="group fade-up hover:shadow-lg" style={{ animationDelay: "200ms" }}>
            <CardHeader className="space-y-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <Settings className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl">Settings</CardTitle>
                <CardDescription>Configure your preferences</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full rounded-full"
                variant="outline"
                onClick={() => router.push("/settings")}
              >
                Manage Settings
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="fade-up" style={{ animationDelay: "300ms" }}>
          <h2 className="mb-6 text-2xl font-bold tracking-tight">Recent Documents</h2>
          {isLoading ? (
            <DashboardSkeleton />
          ) : documents.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {documents.map((doc: any, index: number) => (
                <Card key={doc.id} className="hover:shadow-md" style={{ animationDelay: `${400 + index * 50}ms` }}>
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-primary/10 p-2.5">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="truncate text-base">{doc.original_filename}</CardTitle>
                        <CardDescription className="text-xs">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                No documents yet. Upload one to get started!
              </p>
            </Card>
          )}
        </div>
      </main>
      <KeyboardShortcutsModal />
    </div>
  );
}
