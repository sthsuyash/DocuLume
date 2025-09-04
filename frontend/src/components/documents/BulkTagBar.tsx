"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BulkTagBarProps {
  mode: "add" | "remove";
  selectedCount: number;
  tagInput: string;
  onTagInputChange: (v: string) => void;
  onApply: () => void;
  onSwitchMode: () => void;
  onCancel: () => void;
}

export function BulkTagBar({ mode, selectedCount, tagInput, onTagInputChange, onApply, onSwitchMode, onCancel }: BulkTagBarProps) {
  return (
    <div className="border-b bg-primary/5 px-4 py-2 flex items-center gap-3 text-sm">
      <span className="text-muted-foreground">
        {mode === "add" ? "Add tags to" : "Remove tags from"} {selectedCount} docs:
      </span>
      <Input
        className="h-7 w-48 text-xs"
        placeholder="tag1, tag2, …"
        value={tagInput}
        onChange={(e) => onTagInputChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onApply()}
      />
      <Button size="sm" className="h-7 text-xs" onClick={onApply}>Apply</Button>
      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onSwitchMode}>
        Switch to {mode === "add" ? "remove" : "add"}
      </Button>
      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onCancel}>Cancel</Button>
    </div>
  );
}
