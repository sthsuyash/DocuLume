"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store";
import apiClient from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Trash2, Copy, Key, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { parseApiError } from "@/lib/utils/errors";

interface APIToken {
  id: number;
  name: string;
  token_prefix: string;
  is_active: boolean;
  last_used_at?: string;
  expires_at?: string;
  created_at: string;
}

interface NewTokenResult extends APIToken {
  token: string;
}

export default function APITokensPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { toast } = useToast();

  const [tokens, setTokens] = useState<APIToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newToken, setNewToken] = useState<NewTokenResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/auth/login"); return; }
    load();
  }, [isAuthenticated]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await apiClient.get("/api-tokens");
      setTokens(r.data);
    } catch (error: any) {
      const e = parseApiError(error);
      toast({ title: e.title, description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const create = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const r = await apiClient.post("/api-tokens", { name: newName.trim() });
      setNewToken(r.data);
      setTokens((prev) => [r.data, ...prev]);
      setNewName("");
      setShowCreate(false);
    } catch (error: any) {
      const e = parseApiError(error);
      toast({ title: e.title, description: e.message, variant: "destructive" });
    } finally { setCreating(false); }
  };

  const revoke = async (id: number) => {
    try {
      await apiClient.delete(`/api-tokens/${id}`);
      setTokens((prev) => prev.filter((t) => t.id !== id));
      toast({ title: "Token revoked" });
    } catch (error: any) {
      const e = parseApiError(error);
      toast({ title: e.title, description: e.message, variant: "destructive" });
    }
  };

  const copyToken = async (token: string) => {
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-md px-4 py-3">
        <div className="container mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/settings")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">API Tokens</h1>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl space-y-6 p-4 md:p-8">

        {/* New token revealed */}
        {newToken && (
          <Card className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-700 dark:text-green-400">Token created — copy it now!</CardTitle>
              <CardDescription className="text-xs">This token will not be shown again.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-background border px-3 py-2 text-xs font-mono break-all">
                  {newToken.token}
                </code>
                <Button variant="outline" size="icon" onClick={() => copyToken(newToken.token)} title="Copy token">
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setNewToken(null)}>Dismiss</Button>
            </CardContent>
          </Card>
        )}

        {/* Create new */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2"><Key className="h-4 w-4 text-primary" /></div>
                <div>
                  <CardTitle className="text-base">Your API Tokens</CardTitle>
                  <CardDescription className="text-xs">
                    Pass as <code className="font-mono text-[11px]">Authorization: Bearer &lt;token&gt;</code>
                  </CardDescription>
                </div>
              </div>
              <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
                <Plus className="mr-1 h-4 w-4" /> New Token
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {showCreate && (
              <div className="flex gap-2 border rounded-md p-3 bg-muted/30">
                <Input
                  placeholder="Token name, e.g. My Script"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && create()}
                  className="flex-1"
                />
                <Button size="sm" onClick={create} disabled={creating || !newName.trim()}>
                  {creating ? "Creating…" : "Create"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
              </div>
            )}

            {loading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-md bg-muted" />)}
              </div>
            ) : tokens.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No tokens yet. Create one above.</p>
            ) : (
              <div className="divide-y">
                {tokens.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {t.token_prefix}… &nbsp;·&nbsp; Created {new Date(t.created_at).toLocaleDateString()}
                        {t.last_used_at && ` · Last used ${new Date(t.last_used_at).toLocaleDateString()}`}
                        {t.expires_at && ` · Expires ${new Date(t.expires_at).toLocaleDateString()}`}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive shrink-0"
                      onClick={() => revoke(t.id)} title="Revoke token">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">
              API tokens provide programmatic access to DocuLume. Treat them like passwords —{" "}
              <strong>do not share them</strong> or commit them to version control.
            </p>
          </CardContent>
        </Card>

      </main>
    </div>
  );
}
