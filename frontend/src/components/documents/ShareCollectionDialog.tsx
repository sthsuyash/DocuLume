"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import type { Collection, ShareEntry } from "@/types/document";

interface ShareCollectionDialogProps {
  collection: Collection | null;
  shares: ShareEntry[];
  loading: boolean;
  inviteEmail: string;
  invitePermission: "read" | "write";
  inviting: boolean;
  onClose: () => void;
  onEmailChange: (v: string) => void;
  onPermissionChange: (v: "read" | "write") => void;
  onInvite: () => void;
  onRevoke: (shareId: number) => void;
}

export function ShareCollectionDialog({
  collection, shares, loading, inviteEmail, invitePermission, inviting,
  onClose, onEmailChange, onPermissionChange, onInvite, onRevoke,
}: ShareCollectionDialogProps) {
  return (
    <Dialog open={collection !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share &ldquo;{collection?.name}&rdquo;</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {loading ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2].map((i) => <div key={i} className="h-10 bg-muted rounded" />)}
            </div>
          ) : shares.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-3">Not shared with anyone yet.</p>
          ) : shares.map((s) => (
            <div key={s.id} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
              <span className="flex-1 truncate">{s.shared_with_email}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                s.permission === "write"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  : "bg-muted text-muted-foreground"
              }`}>{s.permission}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                s.accepted
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
              }`}>{s.accepted ? "accepted" : "pending"}</span>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive shrink-0"
                onClick={() => onRevoke(s.id)} title="Revoke access">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
        <div className="border-t pt-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Invite by email</p>
          <div className="flex gap-2">
            <Input type="email" placeholder="colleague@example.com" value={inviteEmail}
              onChange={(e) => onEmailChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onInvite()}
              className="flex-1" />
            <Select value={invitePermission} onValueChange={(v) => onPermissionChange(v as "read" | "write")}>
              <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="write">Write</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
          <Button onClick={onInvite} disabled={!inviteEmail.trim() || inviting}>
            {inviting ? "Sending…" : "Send invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
