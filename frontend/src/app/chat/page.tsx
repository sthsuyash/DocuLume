"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import apiClient from "@/lib/api/client";
import { parseApiError } from "@/lib/utils/errors";
import { ConversationSidebar } from "@/components/conversation-sidebar";
import { EmailVerificationBanner } from "@/components/email-verification-banner";
import { useContextWebSocket } from "@/hooks/useContextWebSocket";
import { KeyboardShortcutsModal } from "@/components/keyboard-shortcuts-modal";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInput } from "@/components/chat/ChatInput";
import { MessageBubble } from "@/components/chat/MessageBubble";
import type { Message, SourceDetail } from "@/types/chat";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = useAuthStore();
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<number | undefined>();

  // Chat settings
  const [useStreaming, setUseStreaming] = useState(true);
  const [useDocuments, setUseDocuments] = useState(false);
  const [useHybrid, setUseHybrid] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);
  const [availableDocs, setAvailableDocs] = useState<{ id: number; original_filename: string }[]>([]);
  const [showDocSelector, setShowDocSelector] = useState(false);

  // System prompt
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [systemPromptSaved, setSystemPromptSaved] = useState(false);

  // Message editing
  const [editingMsgIdx, setEditingMsgIdx] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getAccessToken = () => {
    if (typeof window === "undefined") return "";
    const c = document.cookie.split(";").find((c) => c.trim().startsWith("access_token="));
    return c ? c.split("=")[1] : "";
  };

  const { context, summarization, isConnected } = useContextWebSocket({
    conversationId: currentConversationId || 0,
    token: getAccessToken(),
    apiUrl: API_BASE,
  });

  useEffect(() => {
    if (!isAuthenticated) router.push("/auth/login");
  }, [isAuthenticated, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const docId = searchParams.get("document_id");
    if (docId) { setUseDocuments(true); setSelectedDocIds([parseInt(docId)]); }

    const templateId = searchParams.get("template_id");
    if (templateId && isAuthenticated) {
      apiClient.get("/chat/templates").then((r) => {
        const tmpl = r.data.find((t: any) => String(t.id) === templateId);
        if (tmpl) { setSystemPrompt(tmpl.system_prompt || ""); setShowSystemPrompt(true); }
      }).catch(() => {});
    }
  }, [searchParams, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    apiClient.get("/documents/", { params: { page: 1, page_size: 100 } })
      .then((r) => setAvailableDocs(r.data.items || []))
      .catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    const handler = (event: CustomEvent) => {
      toast({ title: "Document ready", description: `"${event.detail.filename}" has been processed.` });
    };
    window.addEventListener("document.ready" as any, handler);
    return () => window.removeEventListener("document.ready" as any, handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        (document.getElementById("chat-form") as HTMLFormElement | null)?.requestSubmit();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const loadConversationMessages = async (conversationId: number) => {
    try {
      const r = await apiClient.get(`/chat/conversations/${conversationId}/messages`);
      setMessages(r.data.map((msg: any) => ({
        id: msg.id, role: msg.role, content: msg.content,
        sources: msg.sources, source_details: msg.source_details,
        prompt_tokens: msg.prompt_tokens, completion_tokens: msg.completion_tokens,
        estimated_cost_usd: msg.estimated_cost_usd, is_edited: msg.is_edited,
      })));
    } catch (err: any) {
      const e = parseApiError(err);
      toast({ title: e.title, description: e.message, variant: "destructive" });
    }
  };

  const saveSystemPrompt = async () => {
    if (!currentConversationId) return;
    try {
      await apiClient.patch(`/chat/conversations/${currentConversationId}`, { system_prompt: systemPrompt || null });
      setSystemPromptSaved(true);
      setTimeout(() => setSystemPromptSaved(false), 2000);
    } catch (err: any) {
      const e = parseApiError(err);
      toast({ title: e.title, description: e.message, variant: "destructive" });
    }
  };

  const submitFeedback = async (messageId: number, value: "up" | "down", idx: number) => {
    try {
      const current = messages[idx].feedback;
      if (current === value) {
        await apiClient.delete(`/chat/messages/${messageId}/feedback`);
        setMessages((prev) => prev.map((m, i) => i === idx ? { ...m, feedback: null } : m));
      } else {
        await apiClient.post(`/chat/messages/${messageId}/feedback`, { value });
        setMessages((prev) => prev.map((m, i) => i === idx ? { ...m, feedback: value } : m));
      }
    } catch { /* silent */ }
  };

  const handleRegenerate = async () => {
    if (!currentConversationId || isLoading) return;
    setIsLoading(true);
    try {
      const { data: d } = await apiClient.post(`/chat/conversations/${currentConversationId}/regenerate`);
      setMessages((prev) => {
        const next = [...prev];
        const lastIdx = next.map((m, i) => [m, i] as [Message, number]).reverse().find(([m]) => m.role === "assistant")?.[1];
        if (lastIdx != null) {
          next[lastIdx] = {
            id: d.message_id, role: "assistant", content: d.answer,
            sources: d.sources, source_details: d.source_details,
            prompt_tokens: d.prompt_tokens, completion_tokens: d.completion_tokens,
            estimated_cost_usd: d.estimated_cost_usd,
          };
        }
        return next;
      });
    } catch (err: any) {
      const e = parseApiError(err);
      toast({ title: e.title, description: e.message, variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  const handleShare = async () => {
    if (!currentConversationId) return;
    try {
      const { data } = await apiClient.post(`/chat/conversations/${currentConversationId}/share`);
      const url = `${window.location.origin}/share/${data.token}`;
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied!", description: "Anyone with the link can view this conversation." });
    } catch (err: any) {
      const e = parseApiError(err);
      toast({ title: e.title, description: e.message, variant: "destructive" });
    }
  };

  const handleArchive = async () => {
    if (!currentConversationId) return;
    try {
      await apiClient.post(`/chat/conversations/${currentConversationId}/archive`);
      toast({ title: "Archived", description: "Conversation hidden from list." });
      setMessages([]); setCurrentConversationId(undefined);
    } catch (err: any) {
      const e = parseApiError(err);
      toast({ title: e.title, description: e.message, variant: "destructive" });
    }
  };

  const commitEdit = async (idx: number) => {
    const msg = messages[idx];
    if (!msg.id || !editContent.trim()) { setEditingMsgIdx(null); return; }
    try {
      await apiClient.patch(`/chat/messages/${msg.id}`, { content: editContent.trim(), delete_subsequent: msg.role === "user" });
      setMessages((prev) => {
        const next = [...prev];
        if (msg.role === "user") {
          return next.slice(0, idx + 1).map((m, i) => i === idx ? { ...m, content: editContent.trim(), is_edited: true } : m);
        }
        next[idx] = { ...next[idx], content: editContent.trim(), is_edited: true };
        return next;
      });
      setEditingMsgIdx(null);
    } catch (err: any) {
      const e = parseApiError(err);
      toast({ title: e.title, description: e.message, variant: "destructive" });
    }
  };

  const getCsrfToken = () => {
    const m = document.cookie.match(/csrf_token=([^;]+)/);
    return m ? m[1] : "";
  };

  const handleStreamingSubmit = async (question: string) => {
    const response = await fetch(`${API_BASE}/chat/ask/stream`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
      body: JSON.stringify({
        question, conversation_id: currentConversationId,
        use_rag: useDocuments, use_hybrid: useHybrid, top_k: useDocuments ? 5 : 0,
        temperature,
        ...(useDocuments && selectedDocIds.length > 0 ? { document_ids: selectedDocIds } : {}),
      }),
    });
    if (!response.ok) throw new Error("Stream failed");

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let accumulated = "";
    let sources: string[] = [];
    let sourceDetails: SourceDetail[] = [];
    let conversationId: number | undefined;
    let messageId: number | undefined;

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;
      for (const line of decoder.decode(value).split("\n").filter((l) => l.startsWith("data:"))) {
        const data = line.replace("data: ", "").trim();
        if (data === "[DONE]") break;
        try {
          const p = JSON.parse(data);
          if (p.chunk) {
            accumulated += p.chunk;
            setMessages((prev) => {
              const next = [...prev];
              if (next[next.length - 1]?.role === "assistant") next[next.length - 1].content = accumulated;
              return next;
            });
          }
          if (p.sources) sources = p.sources;
          if (p.source_details) sourceDetails = p.source_details;
          if (p.conversation_id) conversationId = p.conversation_id;
          if (p.message_id) messageId = p.message_id;
        } catch { /* ignore parse errors */ }
      }
    }

    setMessages((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last?.role === "assistant") { last.id = messageId; last.sources = sources; last.source_details = sourceDetails; }
      return next;
    });
    if (conversationId) setCurrentConversationId(conversationId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const question = input;
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setIsLoading(true);
    try {
      if (useStreaming) {
        await handleStreamingSubmit(question);
      } else {
        const { data: d } = await apiClient.post("/chat/ask", {
          question, conversation_id: currentConversationId,
          use_rag: useDocuments, use_hybrid: useHybrid, top_k: useDocuments ? 5 : 0,
          temperature,
          ...(useDocuments && selectedDocIds.length > 0 ? { document_ids: selectedDocIds } : {}),
        });
        setMessages((prev) => [...prev, {
          id: d.message_id, role: "assistant", content: d.answer,
          sources: d.sources, source_details: d.source_details,
          prompt_tokens: d.prompt_tokens, completion_tokens: d.completion_tokens,
          estimated_cost_usd: d.estimated_cost_usd,
        }]);
        setCurrentConversationId(d.conversation_id);
      }
    } catch (err: any) {
      const e = parseApiError(err);
      toast({ title: e.title, description: e.message, variant: "destructive" });
      setMessages((prev) => [...prev, { role: "assistant", content: `**Error**: ${e.message}` }]);
    } finally { setIsLoading(false); }
  };

  const lastAssistantIdx = [...messages].map((m, i) => [m, i] as [Message, number]).reverse().find(([m]) => m.role === "assistant")?.[1];

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen bg-background text-foreground">
      <div className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-card transition-transform lg:relative lg:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <ConversationSidebar
          currentConversationId={currentConversationId}
          onSelectConversation={(id) => { setCurrentConversationId(id); setSidebarOpen(false); loadConversationMessages(id); }}
          onNewConversation={() => { setMessages([]); setCurrentConversationId(undefined); setSystemPrompt(""); setSidebarOpen(false); }}
        />
      </div>
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex flex-1 flex-col overflow-hidden">
        {user && !user.is_verified && (
          <div className="px-4 pt-3"><EmailVerificationBanner /></div>
        )}

        <ChatHeader
          conversationId={currentConversationId}
          showSystemPrompt={showSystemPrompt}
          systemPrompt={systemPrompt}
          systemPromptSaved={systemPromptSaved}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onToggleSystemPrompt={() => setShowSystemPrompt(!showSystemPrompt)}
          onSystemPromptChange={setSystemPrompt}
          onSystemPromptClear={() => setSystemPrompt("")}
          onSystemPromptSave={saveSystemPrompt}
          onShare={handleShare}
          onArchive={handleArchive}
        />

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-4xl space-y-6">
            {messages.length === 0 && (
              <Card className="fade-in mt-12 border-dashed p-12 text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-lg font-medium">Start a conversation</p>
                <p className="mt-2 text-sm text-muted-foreground">Ask questions about your documents · Cmd+Enter to send</p>
              </Card>
            )}
            {messages.map((message, index) => (
              <MessageBubble
                key={index}
                message={message}
                index={index}
                isLastAssistant={index === lastAssistantIdx}
                isRegenerating={isLoading}
                editingIdx={editingMsgIdx}
                editContent={editContent}
                onEditStart={(idx, content) => { setEditingMsgIdx(idx); setEditContent(content); }}
                onEditChange={setEditContent}
                onEditCommit={commitEdit}
                onEditCancel={() => setEditingMsgIdx(null)}
                onFeedback={submitFeedback}
                onRegenerate={handleRegenerate}
              />
            ))}
            {isLoading && (
              <div className="fade-in flex justify-start">
                <Card className="p-4">
                  <div className="flex items-center gap-2">
                    {[0, 150, 300].map((d) => (
                      <div key={d} className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </Card>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <ChatInput
          input={input}
          isLoading={isLoading}
          useStreaming={useStreaming}
          useDocuments={useDocuments}
          useHybrid={useHybrid}
          temperature={temperature}
          selectedDocIds={selectedDocIds}
          availableDocs={availableDocs}
          showDocSelector={showDocSelector}
          conversationId={currentConversationId}
          context={context}
          summarization={summarization}
          isConnected={isConnected}
          onInputChange={setInput}
          onSubmit={handleSubmit}
          onStreamingToggle={setUseStreaming}
          onDocumentsToggle={setUseDocuments}
          onHybridToggle={setUseHybrid}
          onTemperatureChange={setTemperature}
          onDocSelectorToggle={() => setShowDocSelector(!showDocSelector)}
          onDocSelection={setSelectedDocIds}
        />
      </div>
      <KeyboardShortcutsModal />
    </div>
  );
}
