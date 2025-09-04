"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { ContextPanel } from "@/components/context";
import type { ContextData, SummarizationState } from "@/components/context";

interface AvailableDoc {
  id: number;
  original_filename: string;
}

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  useStreaming: boolean;
  useDocuments: boolean;
  useHybrid: boolean;
  temperature: number;
  selectedDocIds: number[];
  availableDocs: AvailableDoc[];
  showDocSelector: boolean;
  conversationId?: number;
  context: ContextData | null;
  summarization: SummarizationState | null;
  isConnected: boolean;
  onInputChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onStreamingToggle: (v: boolean) => void;
  onDocumentsToggle: (v: boolean) => void;
  onHybridToggle: (v: boolean) => void;
  onTemperatureChange: (v: number) => void;
  onDocSelectorToggle: () => void;
  onDocSelection: (ids: number[]) => void;
}

export function ChatInput({
  input, isLoading, useStreaming, useDocuments, useHybrid,
  temperature, selectedDocIds, availableDocs, showDocSelector,
  conversationId, context, summarization, isConnected,
  onInputChange, onSubmit, onStreamingToggle, onDocumentsToggle,
  onHybridToggle, onTemperatureChange, onDocSelectorToggle, onDocSelection,
}: ChatInputProps) {
  return (
    <div className="border-t bg-card/80 p-4 backdrop-blur-md">
      <div className="container mx-auto max-w-4xl space-y-3">
        {conversationId && context && (
          <ContextPanel context={context} summarization={summarization} compact />
        )}
        {conversationId && !isConnected && (
          <div className="rounded-lg bg-orange-500/10 px-3 py-2 text-xs text-orange-600 dark:text-orange-400">
            ⚠ Context tracking disconnected
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground">
            <input type="checkbox" checked={useStreaming} onChange={(e) => onStreamingToggle(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300" /> Stream
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground">
            <input type="checkbox" checked={useDocuments} onChange={(e) => onDocumentsToggle(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300" /> Search docs
          </label>
          {useDocuments && (
            <>
              <label className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground">
                <input type="checkbox" checked={useHybrid} onChange={(e) => onHybridToggle(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300" /> Hybrid
              </label>
              <button type="button"
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                onClick={onDocSelectorToggle}>
                <FileText className="h-3.5 w-3.5" />
                <span>{selectedDocIds.length > 0 ? `${selectedDocIds.length} doc${selectedDocIds.length > 1 ? "s" : ""}` : "All docs"}</span>
                {showDocSelector ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            </>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-xs">Temp</span>
            <input type="range" min={0} max={2} step={0.1} value={temperature}
              onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
              className="h-1.5 w-20 cursor-pointer accent-primary" />
            <span className="text-xs tabular-nums w-6">{temperature.toFixed(1)}</span>
          </div>
        </div>

        {useDocuments && showDocSelector && availableDocs.length > 0 && (
          <div className="rounded-md border bg-card p-2 max-h-36 overflow-y-auto">
            <p className="text-xs text-muted-foreground mb-1.5">Filter to specific documents (leave empty for all):</p>
            <div className="space-y-1">
              {availableDocs.map((doc) => (
                <label key={doc.id} className="flex items-center gap-2 cursor-pointer text-sm hover:bg-muted/50 rounded px-1.5 py-1">
                  <input type="checkbox" checked={selectedDocIds.includes(doc.id)}
                    onChange={(e) => onDocSelection(
                      e.target.checked ? [...selectedDocIds, doc.id] : selectedDocIds.filter((id) => id !== doc.id)
                    )}
                    className="h-3.5 w-3.5 rounded border-gray-300"
                  />
                  <span className="truncate">{doc.original_filename}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <form id="chat-form" onSubmit={onSubmit}>
          <div className="flex gap-2">
            <Input value={input} onChange={(e) => onInputChange(e.target.value)}
              placeholder="Ask a question… (Cmd+Enter to send)" className="flex-1 rounded-full"
              disabled={isLoading} />
            <Button type="submit" disabled={isLoading || !input.trim()} size="icon" className="rounded-full">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
