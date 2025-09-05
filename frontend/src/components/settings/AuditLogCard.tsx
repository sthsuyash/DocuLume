"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollText } from "lucide-react";
import type { AuditEntry } from "@/types/settings";

interface AuditLogCardProps {
  entries: AuditEntry[];
  loading: boolean;
  onExpand: () => void;
}

export function AuditLogCard({ entries, loading, onExpand }: AuditLogCardProps) {
  const [open, setOpen] = useState(false);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next && entries.length === 0) onExpand();
  };

  return (
    <Card className="fade-up">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2"><ScrollText className="h-4 w-4 text-primary" /></div>
            <div>
              <CardTitle className="text-base">Audit Log</CardTitle>
              <CardDescription className="text-xs">Recent security events on your account</CardDescription>
            </div>
          </div>
          <button className="text-xs text-muted-foreground hover:text-foreground" onClick={handleToggle}>
            {open ? "Hide" : "Show"}
          </button>
        </div>
      </CardHeader>
      {open && (
        <CardContent className="pt-0">
          {loading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-8 animate-pulse rounded-md bg-muted" />)}</div>
          ) : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No audit events found.</p>
          ) : (
            <div className="divide-y max-h-64 overflow-y-auto">
              {entries.map((entry) => (
                <div key={entry.id} className="py-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-primary">{entry.event}</span>
                    <span className="text-muted-foreground shrink-0">{new Date(entry.created_at).toLocaleString()}</span>
                  </div>
                  {(entry.target || entry.ip_address) && (
                    <div className="mt-0.5 text-muted-foreground">
                      {entry.target && <span className="mr-3 truncate">{entry.target}</span>}
                      {entry.ip_address && <span>{entry.ip_address}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
