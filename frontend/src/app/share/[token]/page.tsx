"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { MessageSquare, User, Bot, Lock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SharedMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  estimated_cost_usd?: number;
}

interface SharedConversation {
  id: number;
  title: string;
  created_at: string;
  messages: SharedMessage[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export default function SharePage() {
  const params = useParams();
  const token = params.token as string;

  const [conversation, setConversation] = useState<SharedConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/share/${token}`, { credentials: "omit" })
      .then(async (r) => {
        if (!r.ok) {
          const data = await r.json().catch(() => ({}));
          throw new Error(data.detail ?? "This link is invalid or has expired.");
        }
        return r.json();
      })
      .then((data) => setConversation(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-md px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <BrandLogo textClassName="text-xl" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Lock className="h-3 w-3" />Read-only shared conversation
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-8">
        {loading && (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
            <div className="rounded-full bg-destructive/10 p-4">
              <Lock className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold">Link unavailable</h2>
            <p className="text-sm text-muted-foreground max-w-sm">{error}</p>
          </div>
        )}

        {conversation && (
          <>
            <div className="mb-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-3">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{conversation.title}</h1>
                  <p className="text-sm text-muted-foreground">
                    {conversation.messages.length} messages · shared {formatDistanceToNow(new Date(conversation.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {conversation.messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-full
                    ${msg.role === "user" ? "bg-primary/10" : "bg-secondary"}`}>
                    {msg.role === "user" ? <User className="h-4 w-4 text-primary" /> : <Bot className="h-4 w-4 text-secondary-foreground" />}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed
                    ${msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-muted rounded-tl-none"
                    }`}>
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    {msg.role === "assistant" && (msg.prompt_tokens || msg.estimated_cost_usd) && (
                      <p className="mt-1.5 text-[10px] opacity-50">
                        {msg.prompt_tokens != null && `${msg.prompt_tokens + (msg.completion_tokens ?? 0)} tokens`}
                        {msg.estimated_cost_usd != null && ` · $${msg.estimated_cost_usd.toFixed(5)}`}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
