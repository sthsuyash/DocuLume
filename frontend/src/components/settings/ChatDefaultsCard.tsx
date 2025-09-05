"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { Toggle } from "./Toggle";
import type { Preferences } from "@/types/settings";

interface ChatDefaultsCardProps {
  prefs: Preferences;
  loading: boolean;
  onUpdate: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
}

export function ChatDefaultsCard({ prefs, loading, onUpdate }: ChatDefaultsCardProps) {
  return (
    <Card className="fade-up">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2"><MessageSquare className="h-4 w-4 text-primary" /></div>
          <div>
            <CardTitle className="text-base">Chat</CardTitle>
            <CardDescription className="text-xs">Default behavior for new conversations</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="divide-y">
        {loading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />)}
          </div>
        ) : (
          <>
            <Toggle
              checked={prefs.use_streaming}
              onChange={(v) => onUpdate("use_streaming", v)}
              label="Stream responses"
              description="Show AI responses word-by-word as they arrive"
            />
            <Toggle
              checked={prefs.use_rag_by_default}
              onChange={(v) => onUpdate("use_rag_by_default", v)}
              label="Search documents by default"
              description="Automatically search your documents when asking questions"
            />
            <Toggle
              checked={prefs.use_hybrid_search}
              onChange={(v) => onUpdate("use_hybrid_search", v)}
              label="Hybrid search by default"
              description="Combine keyword and semantic search (requires document search enabled)"
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
