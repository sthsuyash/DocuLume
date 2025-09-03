"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store";
import apiClient from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { parseApiError } from "@/lib/utils/errors";

interface Template {
  id: number;
  name: string;
  description?: string;
  system_prompt?: string;
  llm_provider: string;
  llm_model: string;
  created_at: string;
}

const EMPTY: Omit<Template, "id" | "created_at"> = {
  name: "",
  description: "",
  system_prompt: "",
  llm_provider: "openai",
  llm_model: "gpt-3.5-turbo",
};

export default function TemplatesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { toast } = useToast();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/auth/login"); return; }
    load();
  }, [isAuthenticated]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await apiClient.get("/chat/templates");
      setTemplates(r.data);
    } catch (error: any) {
      const e = parseApiError(error);
      toast({ title: e.title, description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const startNew = () => { setForm(EMPTY); setEditingId("new"); };
  const startEdit = (t: Template) => {
    setForm({ name: t.name, description: t.description || "", system_prompt: t.system_prompt || "", llm_provider: t.llm_provider, llm_model: t.llm_model });
    setEditingId(t.id);
  };
  const cancel = () => { setEditingId(null); setForm(EMPTY); };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editingId === "new") {
        const r = await apiClient.post("/chat/templates", form);
        setTemplates((prev) => [r.data, ...prev]);
        toast({ title: "Template created" });
      } else {
        const r = await apiClient.patch(`/chat/templates/${editingId}`, form);
        setTemplates((prev) => prev.map((t) => t.id === editingId ? r.data : t));
        toast({ title: "Template updated" });
      }
      cancel();
    } catch (error: any) {
      const e = parseApiError(error);
      toast({ title: e.title, description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    try {
      await apiClient.delete(`/chat/templates/${id}`);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      toast({ title: "Template deleted" });
    } catch (error: any) {
      const e = parseApiError(error);
      toast({ title: e.title, description: e.message, variant: "destructive" });
    }
  };

  const applyTemplate = (t: Template) => {
    router.push(`/chat?template_id=${t.id}`);
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-md px-4 py-3">
        <div className="container mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/chat")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Conversation Templates</h1>
          <Button size="sm" className="ml-auto" onClick={startNew}>
            <Plus className="mr-1 h-4 w-4" /> New Template
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl space-y-4 p-4 md:p-8">

        {/* Editor */}
        {editingId !== null && (
          <Card className="border-primary/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{editingId === "new" ? "New Template" : "Edit Template"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Name *</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Research Assistant" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Description</label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What this template is for" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">System Prompt</label>
                <textarea
                  value={form.system_prompt}
                  onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
                  placeholder="You are a helpful assistant specialized in…"
                  className="w-full resize-none rounded-md border bg-background p-2 text-sm h-28 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Provider</label>
                  <select value={form.llm_provider} onChange={(e) => setForm({ ...form, llm_provider: e.target.value })}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="google">Google</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Model</label>
                  <Input value={form.llm_model} onChange={(e) => setForm({ ...form, llm_model: e.target.value })} placeholder="gpt-3.5-turbo" />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={save} disabled={saving || !form.name.trim()}>
                  <Check className="mr-1 h-4 w-4" /> {saving ? "Saving…" : "Save"}
                </Button>
                <Button size="sm" variant="ghost" onClick={cancel}>
                  <X className="mr-1 h-4 w-4" /> Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}
          </div>
        ) : templates.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground text-sm">No templates yet. Create one to get started.</p>
          </Card>
        ) : (
          templates.map((t) => (
            <Card key={t.id} className="hover:shadow-sm transition-shadow">
              <CardHeader className="pb-1 flex flex-row items-start justify-between gap-2">
                <div className="min-w-0">
                  <CardTitle className="text-base">{t.name}</CardTitle>
                  {t.description && <CardDescription className="text-xs mt-0.5">{t.description}</CardDescription>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => applyTemplate(t)}>Use</Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => remove(t.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono">{t.llm_provider}/{t.llm_model}</span>
                  {t.system_prompt && (
                    <span className="truncate max-w-xs opacity-70 italic">"{t.system_prompt.slice(0, 60)}…"</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>
    </div>
  );
}
