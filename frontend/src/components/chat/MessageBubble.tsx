"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, ThumbsUp, ThumbsDown, RefreshCw, Zap, Pencil, Check, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Message } from "@/types/chat";

interface MessageBubbleProps {
  message: Message;
  index: number;
  isLastAssistant: boolean;
  isRegenerating: boolean;
  editingIdx: number | null;
  editContent: string;
  onEditStart: (idx: number, content: string) => void;
  onEditChange: (v: string) => void;
  onEditCommit: (idx: number) => void;
  onEditCancel: () => void;
  onFeedback: (messageId: number, value: "up" | "down", idx: number) => void;
  onRegenerate: () => void;
}

export function MessageBubble({
  message, index, isLastAssistant, isRegenerating,
  editingIdx, editContent,
  onEditStart, onEditChange, onEditCommit, onEditCancel,
  onFeedback, onRegenerate,
}: MessageBubbleProps) {
  const router = useRouter();
  const isEditing = editingIdx === index;

  return (
    <div className={`fade-up flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
      style={{ animationDelay: `${index * 50}ms` }}>
      <div className="max-w-[85%] space-y-1">
        <Card className={`p-4 md:p-5 ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-card"}`}>
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => onEditChange(e.target.value)}
                className="w-full resize-none rounded-md border bg-background p-2 text-sm min-h-[80px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={onEditCancel}><X className="h-3 w-3" /></Button>
                <Button size="sm" onClick={() => onEditCommit(index)}><Check className="h-3 w-3 mr-1" />Save</Button>
              </div>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{message.content}</ReactMarkdown>
              {message.is_edited && <span className="text-[10px] opacity-50 ml-1">(edited)</span>}
            </div>
          )}

          {message.source_details && message.source_details.length > 0 && !isEditing && (
            <div className="mt-3 border-t border-current/20 pt-3">
              <p className="text-xs font-semibold opacity-80 mb-1.5">Sources</p>
              <div className="space-y-1">
                {message.source_details.slice(0, 4).map((src, i) => (
                  <button
                    key={i}
                    className="w-full flex items-center gap-2 text-xs opacity-70 hover:opacity-100 transition-opacity text-left"
                    onClick={() => src.document_id && router.push(`/documents?preview=${src.document_id}`)}
                    title={src.document_id ? "Click to preview document" : undefined}
                  >
                    <FileText className="h-3 w-3 shrink-0" />
                    <span className="truncate flex-1">{src.filename || src.chunk_id}</span>
                    {src.page_number != null && <span className="shrink-0">p.{src.page_number + 1}</span>}
                    <span className="shrink-0 tabular-nums text-[10px] bg-current/10 px-1 rounded">
                      {(src.score * 100).toFixed(0)}%
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>

        <div className="flex items-center gap-1 px-1">
          {message.id && !isEditing && (
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground"
              onClick={() => onEditStart(index, message.content)} title="Edit message">
              <Pencil className="h-3 w-3" />
            </Button>
          )}
          {message.role === "assistant" && message.id && (
            <>
              <Button variant="ghost" size="sm"
                className={`h-6 w-6 p-0 ${message.feedback === "up" ? "text-green-500" : "text-muted-foreground"}`}
                onClick={() => onFeedback(message.id!, "up", index)} title="Good response">
                <ThumbsUp className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm"
                className={`h-6 w-6 p-0 ${message.feedback === "down" ? "text-red-500" : "text-muted-foreground"}`}
                onClick={() => onFeedback(message.id!, "down", index)} title="Bad response">
                <ThumbsDown className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
          {isLastAssistant && message.role === "assistant" && (
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
              onClick={onRegenerate} disabled={isRegenerating} title="Regenerate response">
              <RefreshCw className={`h-3.5 w-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
            </Button>
          )}
          {message.role === "assistant" && message.estimated_cost_usd != null && (
            <span className="ml-auto text-[10px] text-muted-foreground flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {message.prompt_tokens}+{message.completion_tokens} · ${message.estimated_cost_usd.toFixed(5)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
