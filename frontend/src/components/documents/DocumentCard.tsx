"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, HardDrive, Calendar, MessageSquare, Tag, Trash2, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Document } from "@/types/document";

interface DocumentCardProps {
  doc: Document;
  index: number;
  selected: boolean;
  active: boolean;
  onSelect: (id: number) => void;
  onClick: (doc: Document) => void;
  onDelete: (id: number) => void;
  onReprocess: (doc: Document, e: React.MouseEvent) => void;
  onAddToCollection: (doc: Document) => void;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function DocumentCard({
  doc, index, selected, active,
  onSelect, onClick, onDelete, onReprocess, onAddToCollection,
}: DocumentCardProps) {
  const router = useRouter();

  return (
    <Card
      className={`fade-up group cursor-pointer hover:shadow-md transition-all
        ${active ? "border-primary ring-1 ring-primary" : ""}`}
      style={{ animationDelay: `${index * 30}ms` }}
      onClick={() => onClick(doc)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start gap-2">
          <Checkbox checked={selected}
            onCheckedChange={() => onSelect(doc.id)}
            onClick={(e) => e.stopPropagation()} className="mt-0.5 cursor-pointer" />
          <div className="rounded-md bg-primary/10 p-2">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="truncate text-sm leading-tight">{doc.original_filename}</CardTitle>
            <CardDescription className="mt-1">
              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                doc.status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : doc.status === "failed" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
              }`}>{doc.status}</span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-2">
          <div className="flex items-center gap-1.5"><HardDrive className="h-3.5 w-3.5 shrink-0" />{formatFileSize(doc.file_size)}</div>
          <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 shrink-0" />{formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}</div>
          <div>{doc.page_count} pages</div>
          <div>{doc.chunk_count} chunks</div>
        </div>
        {doc.tags && doc.tags.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {doc.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">{tag}</span>
            ))}
          </div>
        )}
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1"
            onClick={() => router.push(`/chat?document_id=${doc.id}`)} title="Chat about this document">
            <MessageSquare className="h-3 w-3" />Chat
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1"
            onClick={() => onAddToCollection(doc)} title="Add to collection">
            <Tag className="h-3 w-3" />Folder
          </Button>
          {(doc.status === "failed" || doc.status === "completed") && (
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
              onClick={(e) => onReprocess(doc, e)} title="Re-process">
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
          <Button variant="ghost" size="sm" className="ml-auto h-7 w-7 p-0 text-destructive"
            onClick={() => onDelete(doc.id)} title="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
