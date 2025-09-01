"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store";
import { useToast } from "@/components/ui/use-toast";
import { parseApiError } from "@/lib/utils/errors";
import apiClient from "@/lib/api/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationInfo } from "@/components/ui/pagination";
import { FileDropzone } from "@/components/file-dropzone";
import { DocumentSkeleton } from "@/components/loading-skeleton";
import { EmailVerificationBanner } from "@/components/email-verification-banner";
import { ArrowLeft, FileText, Trash2, Search as SearchIcon, X, Tag } from "lucide-react";

import { CollectionsSidebar } from "@/components/documents/CollectionsSidebar";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { BulkTagBar } from "@/components/documents/BulkTagBar";
import { ShareCollectionDialog } from "@/components/documents/ShareCollectionDialog";
import { NewCollectionDialog, AddToCollectionDialog } from "@/components/documents/CollectionDialogs";

import type { Document, Collection, Chunk, ShareEntry } from "@/types/document";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

function DocumentsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = useAuthStore();
  const { toast } = useToast();

  // Documents list
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocs, setSelectedDocs] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fileTypeFilter, setFileTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at_desc");
  const [tagFilter, setTagFilter] = useState("");

  // Collections
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDesc, setNewCollectionDesc] = useState("");
  const [addingToCollection, setAddingToCollection] = useState<Document | null>(null);

  // Collection sharing
  const [sharingCollection, setSharingCollection] = useState<Collection | null>(null);
  const [shares, setShares] = useState<ShareEntry[]>([]);
  const [sharesLoading, setSharesLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePermission, setInvitePermission] = useState<"read" | "write">("read");
  const [inviting, setInviting] = useState(false);

  // Preview panel
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<"preview" | "chunks">("preview");
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [chunksLoading, setChunksLoading] = useState(false);

  // Tags editing
  const [editingTagsDocId, setEditingTagsDocId] = useState<number | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [bulkTagInput, setBulkTagInput] = useState("");
  const [bulkTagMode, setBulkTagMode] = useState<"add" | "remove" | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/auth/login"); return; }
    fetchCollections();
    const previewId = searchParams.get("preview");
    if (previewId) {
      apiClient.get("/documents/", { params: { page: 1, page_size: 100 } }).then((r) => {
        const doc = (r.data.items ?? []).find((d: Document) => d.id === Number(previewId));
        if (doc) openPreview(doc);
      });
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchDocuments(currentPage);
  }, [isAuthenticated, currentPage, searchQuery, statusFilter, fileTypeFilter, sortBy, selectedCollectionId, tagFilter]);

  const fetchDocuments = async (page = 1) => {
    try {
      setLoading(true);
      const params: any = { page, page_size: pageSize };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (statusFilter !== "all") params.status = statusFilter;
      if (fileTypeFilter !== "all") params.file_type = fileTypeFilter;
      if (sortBy) {
        const last = sortBy.lastIndexOf("_");
        params.sort_by = sortBy.substring(0, last);
        params.sort_order = sortBy.substring(last + 1);
      }
      const resp = await apiClient.get("/documents/", { params });
      const { items = [], total: t = 0, page: pg = 1 } = resp.data;
      let filtered = items;
      if (selectedCollectionId !== null) {
        const collResp = await apiClient.get(`/collections/${selectedCollectionId}`);
        const ids: number[] = collResp.data.document_ids ?? [];
        filtered = items.filter((d: Document) => ids.includes(d.id));
      }
      if (tagFilter.trim()) {
        const needle = tagFilter.trim().toLowerCase();
        filtered = filtered.filter((d: Document) => (d.tags ?? []).some((t) => t.includes(needle)));
      }
      setDocuments(filtered);
      setTotal(t);
      setCurrentPage(pg);
      setTotalPages(Math.ceil(t / pageSize));
    } catch (err: any) {
      const e = parseApiError(err);
      toast({ title: e.title, description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const fetchCollections = async () => {
    try {
      const r = await apiClient.get("/collections/");
      setCollections(r.data.items ?? r.data ?? []);
    } catch { /* ignore */ }
  };

  const openPreview = async (doc: Document) => {
    setPreviewDoc(doc);
    setTextContent(null);
    setChunks([]);
    setPreviewTab("preview");
    const ext = doc.file_type.toLowerCase();
    if (ext === ".txt" || ext === ".md") {
      setPreviewLoading(true);
      try {
        const r = await fetch(`${API_BASE}/documents/${doc.id}/preview`, { credentials: "include" });
        setTextContent(await r.text());
      } catch { setTextContent("Could not load file."); }
      finally { setPreviewLoading(false); }
    }
  };

  const loadChunks = async (docId: number) => {
    setChunksLoading(true);
    try {
      const r = await apiClient.get(`/documents/${docId}/chunks`, { params: { page: 1, page_size: 20 } });
      setChunks(r.data.items ?? []);
    } catch { setChunks([]); }
    finally { setChunksLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this document?")) return;
    try {
      await apiClient.delete(`/documents/${id}`);
      toast({ title: "Deleted" });
      const rem = total - 1;
      const np = currentPage > Math.ceil(rem / pageSize) ? Math.max(1, Math.ceil(rem / pageSize)) : currentPage;
      setCurrentPage(np);
      fetchDocuments(np);
      if (previewDoc?.id === id) setPreviewDoc(null);
    } catch (err: any) {
      const e = parseApiError(err);
      toast({ title: e.title, description: e.message, variant: "destructive" });
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedDocs.length} selected?`)) return;
    try {
      await apiClient.post("/documents/bulk-delete", { document_ids: selectedDocs });
      toast({ title: "Deleted", description: `${selectedDocs.length} documents deleted` });
      setSelectedDocs([]);
      fetchDocuments(1);
    } catch (err: any) {
      const e = parseApiError(err);
      toast({ title: e.title, description: e.message, variant: "destructive" });
    }
  };

  const handleBulkTagApply = async () => {
    if (!bulkTagMode || !bulkTagInput.trim()) return;
    const newTags = bulkTagInput.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
    let updated = 0;
    for (const docId of selectedDocs) {
      const doc = documents.find((d) => d.id === docId);
      if (!doc) continue;
      const current = doc.tags ?? [];
      const next = bulkTagMode === "add"
        ? [...new Set([...current, ...newTags])]
        : current.filter((t) => !newTags.includes(t));
      try {
        await apiClient.patch(`/documents/${docId}/tags`, next);
        setDocuments((prev) => prev.map((d) => d.id === docId ? { ...d, tags: next } : d));
        updated++;
      } catch { /* continue */ }
    }
    toast({ title: `Tags ${bulkTagMode === "add" ? "added" : "removed"}`, description: `Updated ${updated} documents` });
    setBulkTagInput("");
    setBulkTagMode(null);
  };

  const handleReprocess = async (doc: Document, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.post(`/documents/${doc.id}/reprocess`);
      toast({ title: "Re-processing started", description: doc.original_filename });
      fetchDocuments(currentPage);
    } catch (err: any) {
      const e2 = parseApiError(err);
      toast({ title: e2.title, description: e2.message, variant: "destructive" });
    }
  };

  const saveTags = async (docId: number, tags: string[]) => {
    try {
      await apiClient.patch(`/documents/${docId}/tags`, tags);
      setDocuments((prev) => prev.map((d) => d.id === docId ? { ...d, tags } : d));
      if (previewDoc?.id === docId) setPreviewDoc((p) => p ? { ...p, tags } : p);
      setEditingTagsDocId(null);
    } catch (err: any) {
      const e = parseApiError(err);
      toast({ title: e.title, description: e.message, variant: "destructive" });
    }
  };

  const createCollection = async () => {
    if (!newCollectionName.trim()) return;
    try {
      await apiClient.post("/collections/", { name: newCollectionName.trim(), description: newCollectionDesc.trim() || undefined });
      setNewCollectionName(""); setNewCollectionDesc(""); setShowNewCollection(false);
      fetchCollections();
    } catch (err: any) {
      const e = parseApiError(err);
      toast({ title: e.title, description: e.message, variant: "destructive" });
    }
  };

  const deleteCollection = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this collection?")) return;
    try {
      await apiClient.delete(`/collections/${id}`);
      if (selectedCollectionId === id) setSelectedCollectionId(null);
      fetchCollections();
    } catch { /* ignore */ }
  };

  const addDocToCollection = async (collectionId: number) => {
    if (!addingToCollection) return;
    try {
      await apiClient.post(`/collections/${collectionId}/documents`, { document_ids: [addingToCollection.id] });
      fetchCollections();
      setAddingToCollection(null);
      toast({ title: "Added to collection" });
    } catch (err: any) {
      const e = parseApiError(err);
      toast({ title: e.title, description: e.message, variant: "destructive" });
    }
  };

  const openShareDialog = async (col: Collection) => {
    setSharingCollection(col);
    setShares([]);
    setInviteEmail("");
    setInvitePermission("read");
    setSharesLoading(true);
    try {
      const r = await apiClient.get(`/collections/${col.id}/shares`);
      setShares(r.data ?? []);
    } catch { setShares([]); }
    finally { setSharesLoading(false); }
  };

  const handleInvite = async () => {
    if (!sharingCollection || !inviteEmail.trim()) return;
    setInviting(true);
    try {
      const r = await apiClient.post(`/collections/${sharingCollection.id}/shares`, { email: inviteEmail.trim(), permission: invitePermission });
      setShares((prev) => [...prev, r.data]);
      setInviteEmail("");
      toast({ title: "Invite sent", description: `${r.data.shared_with_email} has been invited` });
    } catch (err: any) {
      const e = parseApiError(err);
      toast({ title: e.title, description: e.message, variant: "destructive" });
    } finally { setInviting(false); }
  };

  const handleRevokeShare = async (shareId: number) => {
    if (!sharingCollection) return;
    try {
      await apiClient.delete(`/collections/${sharingCollection.id}/shares/${shareId}`);
      setShares((prev) => prev.filter((s) => s.id !== shareId));
      toast({ title: "Access revoked" });
    } catch (err: any) {
      const e = parseApiError(err);
      toast({ title: e.title, description: e.message, variant: "destructive" });
    }
  };

  const toggleDocSelection = (id: number) =>
    setSelectedDocs((prev) => prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]);
  const toggleSelectAll = () =>
    setSelectedDocs(selectedDocs.length === documents.length ? [] : documents.map((d) => d.id));

  if (!isAuthenticated) return null;

  const isPdf = previewDoc?.file_type.toLowerCase() === ".pdf";
  const isText = [".txt", ".md"].includes(previewDoc?.file_type.toLowerCase() ?? "");

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-md px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-bold">My Documents</h1>
          </div>
          <div className="flex items-center gap-2">
            {selectedDocs.length === 2 && (
              <Button variant="outline" size="sm" className="rounded-full"
                onClick={() => router.push(`/documents/compare?a=${selectedDocs[0]}&b=${selectedDocs[1]}`)}>
                Compare 2
              </Button>
            )}
            {selectedDocs.length > 0 && (
              <>
                <Button variant="outline" size="sm" className="rounded-full"
                  onClick={() => setBulkTagMode(bulkTagMode === "add" ? null : "add")}>
                  <Tag className="mr-1.5 h-3.5 w-3.5" /> Tags
                </Button>
                <Button variant="destructive" size="sm" className="rounded-full" onClick={handleBulkDelete}>
                  <Trash2 className="mr-2 h-4 w-4" />Delete {selectedDocs.length}
                </Button>
              </>
            )}
            <span className="hidden text-sm text-muted-foreground sm:block">{total} documents</span>
          </div>
        </div>
      </header>

      {bulkTagMode && selectedDocs.length > 0 && (
        <BulkTagBar
          mode={bulkTagMode}
          selectedCount={selectedDocs.length}
          tagInput={bulkTagInput}
          onTagInputChange={setBulkTagInput}
          onApply={handleBulkTagApply}
          onSwitchMode={() => setBulkTagMode(bulkTagMode === "add" ? "remove" : "add")}
          onCancel={() => setBulkTagMode(null)}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        <CollectionsSidebar
          collections={collections}
          selectedId={selectedCollectionId}
          total={total}
          onSelect={setSelectedCollectionId}
          onDelete={deleteCollection}
          onShare={openShareDialog}
          onNewClick={() => setShowNewCollection(true)}
        />

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {user && !user.is_verified && (
            <div className="mb-4"><EmailVerificationBanner /></div>
          )}

          <div className="fade-up mb-6">
            <FileDropzone onUploadComplete={() => { setCurrentPage(1); fetchDocuments(1); }} />
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by filename..." value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-10 pr-8" />
              {searchQuery && (
                <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
                  onClick={() => { setSearchQuery(""); setCurrentPage(1); }}><X className="h-4 w-4" /></Button>
              )}
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={fileTypeFilter} onValueChange={(v) => { setFileTypeFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-full md:w-36"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value=".pdf">PDF</SelectItem>
                <SelectItem value=".txt">Text</SelectItem>
                <SelectItem value=".docx">Word</SelectItem>
                <SelectItem value=".md">Markdown</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-full md:w-44"><SelectValue placeholder="Sort" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at_desc">Newest first</SelectItem>
                <SelectItem value="created_at_asc">Oldest first</SelectItem>
                <SelectItem value="original_filename_asc">Name A→Z</SelectItem>
                <SelectItem value="original_filename_desc">Name Z→A</SelectItem>
                <SelectItem value="file_size_desc">Largest first</SelectItem>
                <SelectItem value="file_size_asc">Smallest first</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative w-full md:w-36">
              <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Filter by tag…" value={tagFilter}
                onChange={(e) => { setTagFilter(e.target.value); setCurrentPage(1); }}
                className="pl-9 pr-8" />
              {tagFilter && (
                <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
                  onClick={() => { setTagFilter(""); setCurrentPage(1); }}><X className="h-4 w-4" /></Button>
              )}
            </div>
          </div>

          {/* Document list */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">
                {selectedCollectionId !== null ? (collections.find((c) => c.id === selectedCollectionId)?.name ?? "Collection") : "All Documents"}
              </h2>
              {documents.length > 0 && (
                <div className="flex items-center gap-2">
                  <Checkbox id="sel-all" checked={selectedDocs.length === documents.length} onCheckedChange={toggleSelectAll} className="cursor-pointer" />
                  <label htmlFor="sel-all" className="cursor-pointer text-sm text-muted-foreground">Select all</label>
                </div>
              )}
            </div>

            {loading ? <DocumentSkeleton /> : documents.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">No documents yet. Upload one to get started!</p>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {documents.map((doc, idx) => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    index={idx}
                    selected={selectedDocs.includes(doc.id)}
                    active={previewDoc?.id === doc.id}
                    onSelect={toggleDocSelection}
                    onClick={openPreview}
                    onDelete={handleDelete}
                    onReprocess={handleReprocess}
                    onAddToCollection={setAddingToCollection}
                  />
                ))}
              </div>
            )}

            {!loading && documents.length > 0 && (
              <div className="mt-6 space-y-3">
                <PaginationInfo currentPage={currentPage} pageSize={pageSize} total={total} className="text-center" />
                <Pagination currentPage={currentPage} totalPages={totalPages}
                  onPageChange={(pg) => { setCurrentPage(pg); setSelectedDocs([]); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
              </div>
            )}
          </div>
        </main>

        {/* Preview panel */}
        {previewDoc && (
          <aside className="hidden w-96 shrink-0 border-l bg-card overflow-hidden flex-col xl:flex">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate text-sm font-medium">{previewDoc.original_filename}</span>
              </div>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={() => setPreviewDoc(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="border-b px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
              <span>Size: <span className="text-foreground">{previewDoc.file_size < 1024 ? previewDoc.file_size + " B" : previewDoc.file_size < 1048576 ? (previewDoc.file_size / 1024).toFixed(1) + " KB" : (previewDoc.file_size / 1048576).toFixed(1) + " MB"}</span></span>
              <span>Status: <span className={`font-medium ${previewDoc.status === "completed" ? "text-green-600" : previewDoc.status === "failed" ? "text-red-600" : "text-yellow-600"}`}>{previewDoc.status}</span></span>
              <span>Pages: <span className="text-foreground">{previewDoc.page_count}</span></span>
              <span>Chunks: <span className="text-foreground">{previewDoc.chunk_count}</span></span>
            </div>

            {/* Tags */}
            <div className="border-b px-4 py-2">
              {editingTagsDocId === previewDoc.id ? (
                <div className="space-y-1.5">
                  <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                    placeholder="tag1, tag2, ..." className="h-7 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveTags(previewDoc.id, tagInput.split(",").map((t) => t.trim()).filter(Boolean));
                      if (e.key === "Escape") setEditingTagsDocId(null);
                    }} autoFocus />
                  <div className="flex gap-1">
                    <Button size="sm" className="h-6 text-xs px-2" onClick={() => saveTags(previewDoc.id, tagInput.split(",").map((t) => t.trim()).filter(Boolean))}>Save</Button>
                    <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => setEditingTagsDocId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(previewDoc.tags ?? []).map((tag) => (
                    <span key={tag} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">{tag}</span>
                  ))}
                  <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    onClick={() => { setEditingTagsDocId(previewDoc.id); setTagInput((previewDoc.tags ?? []).join(", ")); }}>
                    <Tag className="h-3 w-3" />
                    {(previewDoc.tags ?? []).length === 0 ? "Add tags" : "Edit tags"}
                  </button>
                </div>
              )}
            </div>

            {/* Preview tabs */}
            <div className="flex border-b">
              {(["preview", "chunks"] as const).map((tab) => (
                <button key={tab}
                  onClick={() => { setPreviewTab(tab); if (tab === "chunks" && chunks.length === 0) loadChunks(previewDoc.id); }}
                  className={`flex-1 py-2 text-xs font-medium transition-colors
                    ${previewTab === tab ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  {tab === "preview" ? "Preview" : `Chunks (${previewDoc.chunk_count})`}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-hidden">
              {previewTab === "preview" && (
                <>
                  {isPdf && <iframe src={`${API_BASE}/documents/${previewDoc.id}/preview`} className="h-full w-full border-0" title={previewDoc.original_filename} />}
                  {isText && (
                    <div className="h-full overflow-y-auto p-4">
                      {previewLoading
                        ? <div className="space-y-2 animate-pulse">{[1,2,3,4].map((i) => <div key={i} className="h-4 bg-muted rounded" />)}</div>
                        : <pre className="text-xs whitespace-pre-wrap break-words font-mono leading-relaxed">{textContent}</pre>}
                    </div>
                  )}
                  {!isPdf && !isText && (
                    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
                      <FileText className="h-12 w-12 opacity-30" />
                      <p className="text-sm">Preview not available for {previewDoc.file_type.toUpperCase()} files</p>
                    </div>
                  )}
                </>
              )}
              {previewTab === "chunks" && (
                <div className="h-full overflow-y-auto p-3 space-y-2">
                  {chunksLoading
                    ? <div className="space-y-2 animate-pulse">{[1,2,3].map((i) => <div key={i} className="h-20 bg-muted rounded" />)}</div>
                    : chunks.length === 0
                      ? <p className="text-center text-xs text-muted-foreground py-8">No chunks stored yet</p>
                      : chunks.map((c) => (
                        <div key={c.id} className="rounded-lg border p-2.5 space-y-1">
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span className="font-mono">#{c.chunk_index}</span>
                            {c.page_number != null && <span>p.{c.page_number + 1}</span>}
                          </div>
                          <p className="text-xs leading-relaxed line-clamp-4">{c.content}</p>
                        </div>
                      ))}
                </div>
              )}
            </div>

            <div className="border-t p-3 flex flex-wrap gap-2">
              <Button size="sm" className="flex-1 gap-1.5" onClick={() => router.push(`/chat?document_id=${previewDoc.id}`)}>
                Chat
              </Button>
              {previewDoc.status === "completed" && (
                <Button size="sm" variant="outline" className="gap-1.5 flex-1"
                  onClick={async () => {
                    try {
                      const r = await apiClient.post(`/documents/${previewDoc.id}/summarize`);
                      setPreviewDoc(r.data);
                      toast({ title: "Summary generated" });
                    } catch (err: any) {
                      const e = parseApiError(err);
                      toast({ title: e.title, description: e.message, variant: "destructive" });
                    }
                  }}>
                  Summarize
                </Button>
              )}
            </div>

            {(previewDoc as any).summary && (
              <div className="border-t px-4 py-3">
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">AI Summary</p>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-6">{(previewDoc as any).summary}</p>
              </div>
            )}
          </aside>
        )}
      </div>

      <ShareCollectionDialog
        collection={sharingCollection}
        shares={shares}
        loading={sharesLoading}
        inviteEmail={inviteEmail}
        invitePermission={invitePermission}
        inviting={inviting}
        onClose={() => setSharingCollection(null)}
        onEmailChange={setInviteEmail}
        onPermissionChange={setInvitePermission}
        onInvite={handleInvite}
        onRevoke={handleRevokeShare}
      />

      <NewCollectionDialog
        open={showNewCollection}
        name={newCollectionName}
        description={newCollectionDesc}
        onNameChange={setNewCollectionName}
        onDescriptionChange={setNewCollectionDesc}
        onCreate={createCollection}
        onClose={() => setShowNewCollection(false)}
      />

      <AddToCollectionDialog
        doc={addingToCollection}
        collections={collections}
        onAdd={addDocToCollection}
        onClose={() => setAddingToCollection(null)}
        onNewCollection={() => { setShowNewCollection(true); setAddingToCollection(null); }}
      />
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense>
      <DocumentsPageInner />
    </Suspense>
  );
}
