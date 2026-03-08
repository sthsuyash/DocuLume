"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store";
import apiClient from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Send, ArrowLeft, Menu, MessageSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ConversationSidebar } from "@/components/conversation-sidebar";
import { ChatSkeleton } from "@/components/loading-skeleton";
import { parseApiError } from "@/lib/utils/errors";
import { useContextWebSocket } from "@/hooks/useContextWebSocket";
import { ContextPanel } from "@/components/context";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}

export default function ChatPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<number | undefined>();
  const [useStreaming, setUseStreaming] = useState(true);
  const [useDocuments, setUseDocuments] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get access token from cookie for WebSocket
  const getAccessToken = () => {
    if (typeof window === 'undefined') return ''; // Check if we're on client side
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find((c) => c.trim().startsWith('access_token='));
    if (tokenCookie) {
      return tokenCookie.split('=')[1];
    }
    return '';
  };

  // Connect to context WebSocket
  const { context, summarization, isConnected, error: wsError } = useContextWebSocket({
    conversationId: currentConversationId || 0,
    token: getAccessToken(),
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversationMessages = async (conversationId: number) => {
    try {
      const response = await apiClient.get(`/chat/conversations/${conversationId}/messages`);
      const loadedMessages: Message[] = response.data.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
        sources: msg.sources || undefined,
      }));
      setMessages(loadedMessages);
    } catch (error: any) {
      const parsedError = parseApiError(error);
      toast({
        title: parsedError.title,
        description: parsedError.message,
        variant: "destructive",
      });
    }
  };

  const handleStreamingSubmit = async (question: string) => {
    // Get CSRF token from cookie
    const getCsrfToken = () => {
      const match = document.cookie.match(/csrf_token=([^;]+)/);
      return match ? match[1] : '';
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/ask/stream`, {
      method: 'POST',
      credentials: 'include',  // Send cookies
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': getCsrfToken()  // CSRF protection
      },
      body: JSON.stringify({
        question,
        conversation_id: currentConversationId,
        use_rag: useDocuments,
        top_k: useDocuments ? 5 : 0
      })
    });

    if (!response.ok) throw new Error('Stream failed');

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    let accumulatedContent = '';
    let sources: string[] = [];
    let conversationId: number | undefined;

    // Add empty assistant message that we'll update
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;

      const text = decoder.decode(value);
      const lines = text.split('\n').filter(line => line.startsWith('data:'));

      for (const line of lines) {
        const data = line.replace('data: ', '').trim();
        if (data === '[DONE]') break;

        try {
          const parsed = JSON.parse(data);
          if (parsed.chunk) {
            accumulatedContent += parsed.chunk;
            setMessages((prev) => {
              const newMessages = [...prev];
              if (newMessages[newMessages.length - 1]?.role === 'assistant') {
                newMessages[newMessages.length - 1].content = accumulatedContent;
              }
              return newMessages;
            });
          }
          if (parsed.sources) sources = parsed.sources;
          if (parsed.conversation_id) conversationId = parsed.conversation_id;
        } catch (e) {
          console.error('Parse error:', e);
        }
      }
    }

    // Update final message with sources
    setMessages((prev) => {
      const newMessages = [...prev];
      if (newMessages[newMessages.length - 1]?.role === 'assistant') {
        newMessages[newMessages.length - 1].sources = sources;
      }
      return newMessages;
    });
    setCurrentConversationId(conversationId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    const question = input;
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      if (useStreaming) {
        await handleStreamingSubmit(question);
      } else {
        const response = await apiClient.post("/chat/ask", {
          question,
          conversation_id: currentConversationId,
          use_rag: useDocuments,
          top_k: useDocuments ? 5 : 0,
        });

        const assistantMessage: Message = {
          role: "assistant",
          content: response.data.answer,
          sources: response.data.sources,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setCurrentConversationId(response.data.conversation_id);
      }
    } catch (error: any) {
      const parsedError = parseApiError(error);

      // Show error toast
      toast({
        title: parsedError.title,
        description: parsedError.message,
        variant: "destructive",
      });

      // Add error message to chat for visibility
      const errorMessage: Message = {
        role: "assistant",
        content: `❌ **Error**: ${parsedError.message}\n\nPlease make sure:\n- Backend is running\n- You have uploaded documents\n- You are authenticated`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-card transition-transform lg:relative lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <ConversationSidebar
          currentConversationId={currentConversationId}
          onSelectConversation={(id) => {
            setCurrentConversationId(id);
            setSidebarOpen(false);
            loadConversationMessages(id);
          }}
          onNewConversation={() => {
            setMessages([]);
            setCurrentConversationId(undefined);
            setSidebarOpen(false);
          }}
        />
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-md px-4 py-3 supports-[backdrop-filter]:bg-card/60">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-semibold">Chat with your Documents</h1>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-4xl space-y-6">
            {messages.length === 0 && (
              <Card className="fade-in mt-12 border-dashed p-12 text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-lg font-medium">Start a conversation</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Ask questions about your uploaded documents
                </p>
              </Card>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`fade-up flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Card
                  className={`max-w-[85%] p-4 md:p-5 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card"
                  }`}
                >
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 border-t border-current/20 pt-3">
                      <p className="text-xs font-semibold opacity-80">Sources:</p>
                      <div className="mt-1 space-y-1">
                        {message.sources.slice(0, 3).map((source, i) => (
                          <p key={i} className="text-xs opacity-70 truncate">{source}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            ))}

            {isLoading && (
              <div className="fade-in flex justify-start">
                <Card className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "0ms" }} />
                    <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "150ms" }} />
                    <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "300ms" }} />
                  </div>
                </Card>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="border-t bg-card/80 p-4 backdrop-blur-md supports-[backdrop-filter]:bg-card/60">
          <div className="container mx-auto max-w-4xl space-y-3">
            {/* Context usage indicator */}
            {currentConversationId && context && (
              <div className="fade-in">
                <ContextPanel context={context} summarization={summarization} compact />
              </div>
            )}

            {/* WebSocket connection warning */}
            {currentConversationId && !isConnected && (
              <div className="fade-in rounded-lg bg-orange-500/10 px-3 py-2 text-xs text-orange-600 dark:text-orange-400">
                ⚠ Context tracking disconnected
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="streaming"
                  checked={useStreaming}
                  onChange={(e) => setUseStreaming(e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
                />
                <label htmlFor="streaming" className="cursor-pointer select-none text-muted-foreground">
                  Stream responses
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="useDocuments"
                  checked={useDocuments}
                  onChange={(e) => setUseDocuments(e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
                />
                <label htmlFor="useDocuments" className="cursor-pointer select-none text-muted-foreground">
                  Search documents
                </label>
              </div>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 rounded-full"
                  disabled={isLoading}
                />
                <Button type="submit" disabled={isLoading || !input.trim()} size="icon" className="rounded-full">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
