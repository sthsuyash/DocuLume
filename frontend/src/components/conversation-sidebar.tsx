"use client";

import { useEffect, useRef, useState } from "react";
import {
  MessageSquare, Plus, Trash2, Download, MoreVertical, Search, X,
  Pencil, Check, Archive, ArchiveRestore,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import apiClient from "@/lib/api/client";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { parseApiError } from "@/lib/utils/errors";

interface Conversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

interface ConversationSidebarProps {
  currentConversationId?: number;
  onSelectConversation: (id: number) => void;
  onNewConversation: () => void;
}

type Tab = "active" | "archived";

export function ConversationSidebar({
  currentConversationId,
  onSelectConversation,
  onNewConversation,
}: ConversationSidebarProps) {
  const [tab, setTab] = useState<Tab>("active");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [pageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setCurrentPage(1);
    fetchConversations(1, false);
  }, [searchQuery, tab]);

  useEffect(() => {
    if (editingId !== null) editInputRef.current?.focus();
  }, [editingId]);

  const fetchConversations = async (page: number = 1, append: boolean = false) => {
    try {
      append ? setLoadingMore(true) : setLoading(true);

      let endpoint: string;
      const params: Record<string, any> = { page, page_size: pageSize };

      if (tab === "archived") {
        endpoint = "/chat/conversations/archived";
      } else if (searchQuery.trim().length > 0) {
        endpoint = "/chat/conversations/search";
        params.q = searchQuery.trim();
      } else {
        endpoint = "/chat/conversations";
      }

      const response = await apiClient.get(endpoint, { params });
      const { items = [], total = 0, page: currentPageNum = 1 } = response.data;
      const totalPages = Math.ceil(total / pageSize);

      append
        ? setConversations((prev) => [...prev, ...items])
        : setConversations(items);

      setCurrentPage(currentPageNum);
      setHasMore(currentPageNum < totalPages);
    } catch (error: any) {
      const parsedError = parseApiError(error);
      toast({ title: parsedError.title, description: parsedError.message, variant: "destructive" });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loadingMore) fetchConversations(currentPage + 1, true);
  };

  const startEditing = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title || "");
  };

  const commitRename = async (convId: number) => {
    const newTitle = editTitle.trim();
    setEditingId(null);
    if (!newTitle) return;
    try {
      await apiClient.patch(`/chat/conversations/${convId}`, { title: newTitle });
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, title: newTitle } : c))
      );
    } catch (error: any) {
      const parsedError = parseApiError(error);
      toast({ title: parsedError.title, description: parsedError.message, variant: "destructive" });
    }
  };

  const handleArchive = async (convId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.post(`/chat/conversations/${convId}/archive`);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      toast({ title: "Archived", description: "Conversation moved to archive." });
    } catch (error: any) {
      const parsedError = parseApiError(error);
      toast({ title: parsedError.title, description: parsedError.message, variant: "destructive" });
    }
  };

  const handleUnarchive = async (convId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.post(`/chat/conversations/${convId}/unarchive`);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      toast({ title: "Restored", description: "Conversation moved back to active." });
    } catch (error: any) {
      const parsedError = parseApiError(error);
      toast({ title: parsedError.title, description: parsedError.message, variant: "destructive" });
    }
  };

  const handleExport = async (
    conversationId: number,
    format: "json" | "markdown" | "pdf" | "txt",
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    try {
      const response = await apiClient.get(
        `/chat/conversations/${conversationId}/export?format=${format}`,
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `conversation_${conversationId}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({ title: "Exported", description: `Saved as ${format.toUpperCase()}` });
    } catch (error: any) {
      const parsedError = parseApiError(error);
      toast({ title: parsedError.title, description: parsedError.message, variant: "destructive" });
    }
  };

  const handleDelete = async (convId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.delete(`/chat/conversations/${convId}`);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      toast({ title: "Deleted", description: "Conversation removed" });
    } catch (error: any) {
      const parsedError = parseApiError(error);
      toast({ title: parsedError.title, description: parsedError.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4 space-y-3">
        <Button onClick={onNewConversation} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>

        {/* Active / Archived tabs */}
        <div className="flex rounded-lg border overflow-hidden">
          {(["active", "archived"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 text-xs font-medium transition-colors
                ${tab === t ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}
            >
              {t === "active" ? "Active" : "Archived"}
            </button>
          ))}
        </div>

        {/* Search (only for active tab) */}
        {tab === "active" && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 h-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0.5 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
            {tab === "archived"
              ? <><Archive className="h-8 w-8 opacity-30" /><span>No archived conversations</span></>
              : <span>{searchQuery ? "No results found" : "No conversations yet"}</span>
            }
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <Card
                key={conv.id}
                onClick={() => editingId !== conv.id && onSelectConversation(conv.id)}
                className={`cursor-pointer p-3 transition-all hover:bg-muted/40 group
                  ${currentConversationId === conv.id ? "border-primary bg-primary/5" : ""}
                `}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 overflow-hidden min-w-0">
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                      {editingId === conv.id ? (
                        <div className="flex flex-1 items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Input
                            ref={editInputRef}
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitRename(conv.id);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            className="h-6 text-xs px-1 py-0"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 shrink-0"
                            onClick={() => commitRename(conv.id)}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <h3 className="truncate text-sm font-medium">
                          {conv.title || "New Conversation"}
                        </h3>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                    </p>
                  </div>

                  <div className="flex items-center shrink-0">
                    {tab === "archived" ? (
                      /* Archived tab: prominent unarchive button */
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100"
                        title="Restore conversation"
                        onClick={(e) => handleUnarchive(conv.id, e)}
                      >
                        <ArchiveRestore className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100"
                        onClick={(e) => startEditing(conv, e)}
                        title="Rename"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {tab === "active" ? (
                          <>
                            <DropdownMenuItem onClick={(e) => startEditing(conv, e)}>
                              <Pencil className="mr-2 h-4 w-4" />Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => handleArchive(conv.id, e)}>
                              <Archive className="mr-2 h-4 w-4" />Archive
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => handleExport(conv.id, "json", e)}>
                              <Download className="mr-2 h-4 w-4" />Export as JSON
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => handleExport(conv.id, "markdown", e)}>
                              <Download className="mr-2 h-4 w-4" />Export as Markdown
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => handleExport(conv.id, "pdf", e)}>
                              <Download className="mr-2 h-4 w-4" />Export as PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => handleExport(conv.id, "txt", e)}>
                              <Download className="mr-2 h-4 w-4" />Export as TXT
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => handleDelete(conv.id, e)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />Delete
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <>
                            <DropdownMenuItem onClick={(e) => handleUnarchive(conv.id, e)}>
                              <ArchiveRestore className="mr-2 h-4 w-4" />Restore
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => handleDelete(conv.id, e)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />Delete permanently
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="mt-4">
            <Button variant="outline" className="w-full" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? "Loading..." : "Load More"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
