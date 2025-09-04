"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Folder, Plus, ChevronRight } from "lucide-react";
import type { Collection, Document } from "@/types/document";

interface NewCollectionDialogProps {
  open: boolean;
  name: string;
  description: string;
  onNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onCreate: () => void;
  onClose: () => void;
}

export function NewCollectionDialog({ open, name, description, onNameChange, onDescriptionChange, onCreate, onClose }: NewCollectionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>New Collection</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <Input value={name} onChange={(e) => onNameChange(e.target.value)}
            placeholder="Collection name" onKeyDown={(e) => e.key === "Enter" && onCreate()} autoFocus />
          <Input value={description} onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Description (optional)" />
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={onCreate} disabled={!name.trim()}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface AddToCollectionDialogProps {
  doc: Document | null;
  collections: Collection[];
  onAdd: (collectionId: number) => void;
  onClose: () => void;
  onNewCollection: () => void;
}

export function AddToCollectionDialog({ doc, collections, onAdd, onClose, onNewCollection }: AddToCollectionDialogProps) {
  return (
    <Dialog open={doc !== null} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add to Collection</DialogTitle></DialogHeader>
        <div className="py-2 space-y-1">
          {collections.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No collections. Create one first.</p>
          ) : collections.map((col) => (
            <button key={col.id} onClick={() => onAdd(col.id)}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted text-left transition-colors">
              <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="flex-1 text-sm font-medium">{col.name}</span>
              <span className="text-xs text-muted-foreground">{col.document_count} docs</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button variant="outline" onClick={onNewCollection}>
            <Plus className="mr-2 h-4 w-4" />New Collection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
