"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Plus, Trash2, Download, MoreVertical, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import apiClient from "@/lib/api/client";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

export function ConversationSidebar({
  currentConversationId,
  onSelectConversation,
  onNewConversation,
}: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [pageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    setCurrentPage(1);
    fetchConversations(1, false);
  }, [searchQuery]);

  const fetchConversations = async (page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const params: any = {
        page,
        page_size: pageSize,
      };

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await apiClient.get("/chat/conversations", { params });

      // Backend now returns paginated response: { items, total, page, page_size }
      const { items = [], total = 0, page: currentPageNum = 1 } = response.data;
      const totalPages = Math.ceil(total / pageSize);

      if (append) {
        setConversations((prev) => [...prev, ...items]);
      } else {
        setConversations(items);
      }

      setCurrentPage(currentPageNum);
      setHasMore(currentPageNum < totalPages);
    } catch (error: any) {
      const parsedError = parseApiError(error);
      toast({
        title: parsedError.title,
        description: parsedError.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loadingMore) {
      fetchConversations(currentPage + 1, true);
    }
  };

  const handleExport = async (
    conversationId: number,
    format: 'json' | 'markdown' | 'pdf' | 'txt',
    e: React.MouseEvent
  ) => {
    e.stopPropagation(); // Prevent conversation selection

    try {
      const response = await apiClient.get(
        `/chat/conversations/${conversationId}/export?format=${format}`,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `conversation_${conversationId}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `Conversation exported as ${format.toUpperCase()}`,
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

        {/* Search Input */}
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
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {conversations.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground">
            No conversations yet
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <Card
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`
                  cursor-pointer p-3 transition-all hover:bg-muted/40
                  ${currentConversationId === conv.id ? "border-primary bg-primary/5" : ""}
                `}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <h3 className="truncate text-sm font-medium">
                        {conv.title || "New Conversation"}
                      </h3>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(conv.updated_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => handleExport(conv.id, 'json', e)}>
                        <Download className="mr-2 h-4 w-4" />
                        Export as JSON
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handleExport(conv.id, 'markdown', e)}>
                        <Download className="mr-2 h-4 w-4" />
                        Export as Markdown
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handleExport(conv.id, 'pdf', e)}>
                        <Download className="mr-2 h-4 w-4" />
                        Export as PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handleExport(conv.id, 'txt', e)}>
                        <Download className="mr-2 h-4 w-4" />
                        Export as TXT
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="mt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={loadMore}
              disabled={loadingMore}
            >
              {loadingMore ? "Loading..." : "Load More"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
