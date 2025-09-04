"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Menu, Settings2, ChevronDown, ChevronUp, Share2, Archive, Check } from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";

interface ChatHeaderProps {
  conversationId?: number;
  showSystemPrompt: boolean;
  systemPrompt: string;
  systemPromptSaved: boolean;
  onToggleSidebar: () => void;
  onToggleSystemPrompt: () => void;
  onSystemPromptChange: (v: string) => void;
  onSystemPromptClear: () => void;
  onSystemPromptSave: () => void;
  onShare: () => void;
  onArchive: () => void;
}

export function ChatHeader({
  conversationId, showSystemPrompt, systemPrompt, systemPromptSaved,
  onToggleSidebar, onToggleSystemPrompt, onSystemPromptChange,
  onSystemPromptClear, onSystemPromptSave, onShare, onArchive,
}: ChatHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-md px-4 py-3">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="lg:hidden">
          <Menu className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold">Chat</h1>
        <div className="ml-auto flex items-center gap-1">
          {conversationId && (
            <>
              <Button variant="ghost" size="sm" onClick={onShare} title="Share conversation" className="gap-1.5 text-muted-foreground">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onArchive} title="Archive conversation" className="gap-1.5 text-muted-foreground">
                <Archive className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm" onClick={onToggleSystemPrompt} className="gap-1.5 text-muted-foreground">
            <Settings2 className="h-4 w-4" />
            {showSystemPrompt ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
          <NotificationBell />
        </div>
      </div>

      {showSystemPrompt && (
        <div className="mt-3 border-t pt-3 space-y-2">
          <textarea
            value={systemPrompt}
            onChange={(e) => onSystemPromptChange(e.target.value)}
            placeholder="Optional system instructions for the AI…"
            className="w-full resize-none rounded-md border bg-background p-2 text-sm h-20 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onSystemPromptClear}>Clear</Button>
            <Button size="sm" onClick={onSystemPromptSave} disabled={!conversationId}>
              {systemPromptSaved ? <><Check className="h-3 w-3 mr-1" />Saved</> : "Save"}
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
