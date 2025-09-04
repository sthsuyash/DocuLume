"use client";

import { Button } from "@/components/ui/button";
import { FolderOpen, Folder, Plus, X, UserPlus } from "lucide-react";
import type { Collection } from "@/types/document";

interface CollectionsSidebarProps {
  collections: Collection[];
  selectedId: number | null;
  total: number;
  onSelect: (id: number | null) => void;
  onDelete: (id: number, e: React.MouseEvent) => void;
  onShare: (col: Collection) => void;
  onNewClick: () => void;
}

export function CollectionsSidebar({
  collections, selectedId, total, onSelect, onDelete, onShare, onNewClick,
}: CollectionsSidebarProps) {
  return (
    <aside className="hidden w-56 shrink-0 border-r bg-card overflow-y-auto md:flex md:flex-col">
      <div className="p-3 border-b">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Collections</span>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onNewClick}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <button
          onClick={() => onSelect(null)}
          className={`w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors
            ${selectedId === null ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"}`}
        >
          <FolderOpen className="h-4 w-4 shrink-0" />
          <span className="truncate flex-1">All Documents</span>
          <span className="ml-auto text-xs text-muted-foreground">{total}</span>
        </button>
      </div>
      <div className="flex-1 space-y-0.5 p-2">
        {collections.map((col) => (
          <div key={col.id} className="group flex items-center gap-1">
            <button
              onClick={() => onSelect(col.id === selectedId ? null : col.id)}
              className={`flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm overflow-hidden transition-colors
                ${selectedId === col.id ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"}`}
            >
              <Folder className="h-4 w-4 shrink-0" />
              <span className="truncate flex-1 text-left">{col.name}</span>
              <span className="ml-auto text-xs text-muted-foreground shrink-0">{col.document_count}</span>
            </button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 shrink-0"
              onClick={(e) => { e.stopPropagation(); onShare(col); }} title="Share collection">
              <UserPlus className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 shrink-0"
              onClick={(e) => onDelete(col.id, e)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        {collections.length === 0 && (
          <p className="px-2 py-3 text-xs text-muted-foreground">No collections yet</p>
        )}
      </div>
    </aside>
  );
}
