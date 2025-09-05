"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Monitor } from "lucide-react";
import type { Session } from "@/types/settings";

interface SessionsCardProps {
  sessions: Session[];
  loading: boolean;
  onRevoke: (id: number) => void;
  onRevokeAll: () => void;
}

export function SessionsCard({ sessions, loading, onRevoke, onRevokeAll }: SessionsCardProps) {
  return (
    <Card className="fade-up">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2"><Monitor className="h-4 w-4 text-primary" /></div>
          <div>
            <CardTitle className="text-base">Active Sessions</CardTitle>
            <CardDescription className="text-xs">Devices currently signed in to your account</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-2">
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />)}
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active sessions found.</p>
        ) : (
          <>
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="font-medium truncate">{s.device_info || "Unknown device"}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.ip_address && <span className="mr-2">{s.ip_address}</span>}
                    Last active {new Date(s.last_used_at).toLocaleDateString()}
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="shrink-0 text-destructive hover:text-destructive"
                  onClick={() => onRevoke(s.id)}>
                  Revoke
                </Button>
              </div>
            ))}
            {sessions.length > 1 && (
              <Button variant="outline" size="sm" className="w-full mt-2" onClick={onRevokeAll}>
                Revoke all other sessions
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
