"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store";
import apiClient from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, RefreshCw, AlertCircle } from "lucide-react";

interface Document {
  id: number;
  original_filename: string;
  file_type: string;
  summary?: string;
  chunk_count: number;
  page_count?: number;
  tags?: string[];
  status: string;
  created_at: string;
}

interface Chunk {
  id: number;
  content: string;
  page_number?: number;
  chunk_index: number;
}

function CompareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();

  const aId = searchParams.get("a");
  const bId = searchParams.get("b");

  const [docA, setDocA] = useState<Document | null>(null);
  const [docB, setDocB] = useState<Document | null>(null);
  const [chunksA, setChunksA] = useState<Chunk[]>([]);
  const [chunksB, setChunksB] = useState<Chunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "chunks">("overview");

  useEffect(() => {
    if (!isAuthenticated) { router.push("/auth/login"); return; }
    if (!aId || !bId) { setError("Two document IDs required (?a=ID&b=ID)"); setLoading(false); return; }
    load();
  }, [isAuthenticated, aId, bId]);

  const load = async () => {
    setLoading(true);
    try {
      const [rA, rB, cA, cB] = await Promise.all([
        apiClient.get(`/documents/${aId}`).catch(() => null),
        apiClient.get(`/documents/${bId}`).catch(() => null),
        apiClient.get(`/documents/${aId}/chunks?page=1&page_size=30`).catch(() => ({ data: { items: [] } })),
        apiClient.get(`/documents/${bId}/chunks?page=1&page_size=30`).catch(() => ({ data: { items: [] } })),
      ]);
      if (!rA || !rB) { setError("One or both documents not found."); return; }
      setDocA(rA.data);
      setDocB(rB.data);
      setChunksA(cA.data.items || []);
      setChunksB(cB.data.items || []);
    } catch {
      setError("Failed to load documents.");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-md px-4 py-3">
        <div className="container mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/documents")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Document Comparison</h1>
          <Button variant="ghost" size="icon" onClick={load} title="Refresh" className="ml-auto">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-6">
            {[1, 2].map((i) => <div key={i} className="h-64 animate-pulse rounded-xl bg-muted" />)}
          </div>
        ) : docA && docB && (
          <>
            {/* Tab bar */}
            <div className="mb-4 flex gap-2">
              {(["overview", "chunks"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors
                    ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {tab === "overview" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[{ doc: docA, label: "Document A" }, { doc: docB, label: "Document B" }].map(({ doc, label }) => (
                  <Card key={doc.id}>
                    <CardHeader className="pb-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">{label}</p>
                      <CardTitle className="text-base flex items-start gap-2">
                        <FileText className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                        <span className="break-all">{doc.original_filename}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                        <span className="text-muted-foreground">Type</span>
                        <span className="font-mono">{doc.file_type}</span>
                        <span className="text-muted-foreground">Pages</span>
                        <span>{doc.page_count ?? "—"}</span>
                        <span className="text-muted-foreground">Chunks</span>
                        <span>{doc.chunk_count}</span>
                        <span className="text-muted-foreground">Status</span>
                        <span className={doc.status === "completed" ? "text-green-600" : "text-yellow-600"}>{doc.status}</span>
                        <span className="text-muted-foreground">Created</span>
                        <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                      </div>
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {doc.tags.map((t) => (
                            <span key={t} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{t}</span>
                          ))}
                        </div>
                      )}
                      {doc.summary && (
                        <div className="mt-2 border-t pt-2">
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Summary</p>
                          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-6">{doc.summary}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {tab === "chunks" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: "Document A", chunks: chunksA, doc: docA },
                  { label: "Document B", chunks: chunksB, doc: docB },
                ].map(({ label, chunks, doc }) => (
                  <div key={doc.id}>
                    <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{label} — {doc.original_filename}</p>
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                      {chunks.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">No chunks available.</p>
                      ) : chunks.map((c) => (
                        <Card key={c.id} className="p-3">
                          <p className="text-[10px] font-mono text-muted-foreground mb-1">
                            Chunk {c.chunk_index}{c.page_number != null ? ` · p.${c.page_number + 1}` : ""}
                          </p>
                          <p className="text-sm leading-relaxed line-clamp-5">{c.content}</p>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function DocumentComparePage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
      <CompareContent />
    </Suspense>
  );
}
