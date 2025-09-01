"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store";
import { useThemeStore } from "@/lib/store/theme-store";
import { useToast } from "@/components/ui/use-toast";
import { parseApiError } from "@/lib/utils/errors";
import apiClient from "@/lib/api/client";
import { Check } from "lucide-react";

import type { Preferences, Session, AuditEntry } from "@/types/settings";
import { PREF_DEFAULTS } from "@/types/settings";
import { AppearanceCard } from "@/components/settings/AppearanceCard";
import { ChatDefaultsCard } from "@/components/settings/ChatDefaultsCard";
import { NotificationsCard } from "@/components/settings/NotificationsCard";
import { ProfileCard } from "@/components/settings/ProfileCard";
import { PasswordCard } from "@/components/settings/PasswordCard";
import { WebhookCard } from "@/components/settings/WebhookCard";
import { TwoFactorCard } from "@/components/settings/TwoFactorCard";
import { SessionsCard } from "@/components/settings/SessionsCard";
import { AuditLogCard } from "@/components/settings/AuditLogCard";
import { ApiKeysCard, ApiTokensCard } from "@/components/settings/ApiKeysCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Globe, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { setTheme, theme: currentTheme } = useThemeStore();
  const { toast } = useToast();

  const [profileLoading, setProfileLoading] = useState(false);
  const [formData, setFormData] = useState({ full_name: "", openai_api_key: "", anthropic_api_key: "", google_api_key: "" });

  const [prefs, setPrefs] = useState<Preferences>(PREF_DEFAULTS);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [webhookSaving, setWebhookSaving] = useState(false);

  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [pwLoading, setPwLoading] = useState(false);

  const [totpEnabled, setTotpEnabled] = useState(false);
  const [totpSetup, setTotpSetup] = useState<{ secret: string; qr_code_base64: string } | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [totpLoading, setTotpLoading] = useState(false);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/auth/login"); return; }
    if (user) setFormData({ full_name: user.full_name || "", openai_api_key: "", anthropic_api_key: "", google_api_key: "" });
    loadPrefs();
    loadWebhook();
    load2FAStatus();
    loadSessions();
  }, [isAuthenticated, user, router]);

  const loadPrefs = async () => {
    try {
      const r = await apiClient.get("/settings/preferences");
      setPrefs({ ...PREF_DEFAULTS, ...r.data });
    } catch (err: any) {
      const e = parseApiError(err);
      toast({ title: e.title, description: e.message, variant: "destructive" });
    } finally { setPrefsLoading(false); }
  };

  const persistPrefs = useCallback((updated: Preferences) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setPrefsSaving(true);
      try {
        await apiClient.patch("/settings/preferences", updated);
        setPrefsSaved(true);
        setTimeout(() => setPrefsSaved(false), 2000);
      } catch (err: any) {
        const e = parseApiError(err);
        toast({ title: e.title, description: e.message, variant: "destructive" });
      } finally { setPrefsSaving(false); }
    }, 600);
  }, []);

  const updatePref = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    persistPrefs(next);
  };

  const loadWebhook = async () => {
    setWebhookLoading(true);
    try {
      const r = await apiClient.get("/settings/webhook");
      setWebhookUrl(r.data.webhook_url ?? "");
    } catch { /* ignore */ }
    finally { setWebhookLoading(false); }
  };

  const saveWebhook = async () => {
    setWebhookSaving(true);
    try {
      await apiClient.patch("/settings/webhook", { webhook_url: webhookUrl || null });
      toast({ title: "Webhook URL saved" });
    } catch (err: any) {
      const e = parseApiError(err);
      toast({ title: e.title, description: e.message, variant: "destructive" });
    } finally { setWebhookSaving(false); }
  };

  const load2FAStatus = async () => {
    try {
      const r = await apiClient.get("/auth/2fa/status");
      setTotpEnabled(r.data.totp_enabled);
    } catch { /* ignore */ }
  };

  const handle2FASetup = async () => {
    setTotpLoading(true);
    try {
      const r = await apiClient.post("/auth/2fa/setup");
      setTotpSetup(r.data);
    } catch (err: any) {
      const e = parseApiError(err);
      toast({ title: e.title, description: e.message, variant: "destructive" });
    } finally { setTotpLoading(false); }
  };

  const handle2FAEnable = async () => {
    setTotpLoading(true);
    try {
      await apiClient.post("/auth/2fa/enable", { code: totpCode });
      setTotpEnabled(true); setTotpSetup(null); setTotpCode("");
      toast({ title: "2FA enabled" });
    } catch (err: any) {
      const e = parseApiError(err);
      toast({ title: e.title, description: e.message, variant: "destructive" });
    } finally { setTotpLoading(false); }
  };

  const handle2FADisable = async () => {
    if (!totpCode) return;
    setTotpLoading(true);
    try {
      await apiClient.post("/auth/2fa/disable", { code: totpCode });
      setTotpEnabled(false); setTotpCode("");
      toast({ title: "2FA disabled" });
    } catch (err: any) {
      const e = parseApiError(err);
      toast({ title: e.title, description: e.message, variant: "destructive" });
    } finally { setTotpLoading(false); }
  };

  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const r = await apiClient.get("/users/me/sessions");
      setSessions(r.data);
    } catch { /* ignore */ }
    finally { setSessionsLoading(false); }
  };

  const revokeSession = async (id: number) => {
    try {
      await apiClient.delete(`/users/me/sessions/${id}`);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      toast({ title: "Session revoked" });
    } catch (err: any) {
      const e = parseApiError(err);
      toast({ title: e.title, description: e.message, variant: "destructive" });
    }
  };

  const revokeAllSessions = async () => {
    try {
      await apiClient.delete("/users/me/sessions");
      loadSessions();
      toast({ title: "All other sessions revoked" });
    } catch (err: any) {
      const e = parseApiError(err);
      toast({ title: e.title, description: e.message, variant: "destructive" });
    }
  };

  const loadAuditLog = async () => {
    setAuditLoading(true);
    try {
      const r = await apiClient.get("/users/me/audit-log?limit=50");
      setAuditLog(r.data);
    } catch { /* ignore */ }
    finally { setAuditLoading(false); }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await apiClient.patch("/users/me", formData);
      toast({ title: "Profile updated" });
    } catch (err: any) {
      const e = parseApiError(err);
      toast({ title: e.title, description: e.message, variant: "destructive" });
    } finally { setProfileLoading(false); }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_password) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setPwLoading(true);
    try {
      await apiClient.post("/auth/change-password", { current_password: pwForm.current_password, new_password: pwForm.new_password });
      toast({ title: "Password changed" });
      setPwForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err: any) {
      const e = parseApiError(err);
      toast({ title: e.title, description: e.message, variant: "destructive" });
    } finally { setPwLoading(false); }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-md px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-bold">Settings</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {prefsSaving && <span className="animate-pulse">Saving…</span>}
            {prefsSaved && !prefsSaving && (
              <span className="flex items-center gap-1.5 text-green-600">
                <Check className="h-3.5 w-3.5" /> Saved
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl space-y-6 p-4 md:p-8">
        <AppearanceCard currentTheme={currentTheme} loading={prefsLoading} onThemeChange={setTheme} />

        {/* Language — small enough to stay inline */}
        <Card className="fade-up">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2"><Globe className="h-4 w-4 text-primary" /></div>
              <div>
                <CardTitle className="text-base">Language</CardTitle>
                <CardDescription className="text-xs">Interface language preference</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {prefsLoading ? <div className="h-12 animate-pulse rounded-md bg-muted" /> : (
              <div className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-medium">Language</p>
                  <p className="mt-1 text-xs text-muted-foreground">Display language for the UI</p>
                </div>
                <Select value={prefs.language} onValueChange={(v) => updatePref("language", v)}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="ja">日本語</SelectItem>
                    <SelectItem value="zh">中文</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents per page — small enough to stay inline */}
        <Card className="fade-up">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2"><FileText className="h-4 w-4 text-primary" /></div>
              <div>
                <CardTitle className="text-base">Documents</CardTitle>
                <CardDescription className="text-xs">Document list display settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {prefsLoading ? <div className="h-12 animate-pulse rounded-md bg-muted" /> : (
              <div className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-medium">Documents per page</p>
                  <p className="mt-1 text-xs text-muted-foreground">How many documents to show per page</p>
                </div>
                <Select value={String(prefs.results_per_page)} onValueChange={(v) => updatePref("results_per_page", Number(v))}>
                  <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        <ChatDefaultsCard prefs={prefs} loading={prefsLoading} onUpdate={updatePref} />
        <NotificationsCard prefs={prefs} loading={prefsLoading} onUpdate={updatePref} />

        <ProfileCard
          email={user?.email ?? ""}
          username={user?.username ?? ""}
          fullName={formData.full_name}
          loading={profileLoading}
          onFullNameChange={(v) => setFormData({ ...formData, full_name: v })}
          onSubmit={handleProfileSubmit}
        />

        {user && !user.oauth_provider && (
          <PasswordCard form={pwForm} loading={pwLoading} onChange={setPwForm} onSubmit={handlePasswordChange} />
        )}

        <WebhookCard url={webhookUrl} loading={webhookLoading} saving={webhookSaving} onChange={setWebhookUrl} onSave={saveWebhook} />

        {user && !user.oauth_provider && (
          <TwoFactorCard
            enabled={totpEnabled}
            setup={totpSetup}
            code={totpCode}
            loading={totpLoading}
            onCodeChange={setTotpCode}
            onSetup={handle2FASetup}
            onEnable={handle2FAEnable}
            onDisable={handle2FADisable}
          />
        )}

        <SessionsCard sessions={sessions} loading={sessionsLoading} onRevoke={revokeSession} onRevokeAll={revokeAllSessions} />
        <AuditLogCard entries={auditLog} loading={auditLoading} onExpand={loadAuditLog} />
        <ApiTokensCard />
        <ApiKeysCard
          fields={{ openai_api_key: formData.openai_api_key, anthropic_api_key: formData.anthropic_api_key, google_api_key: formData.google_api_key }}
          onChange={(f) => setFormData({ ...formData, ...f })}
        />
      </main>
    </div>
  );
}
