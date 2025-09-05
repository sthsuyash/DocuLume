"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";
import { Toggle } from "./Toggle";
import type { Preferences } from "@/types/settings";

interface NotificationsCardProps {
  prefs: Preferences;
  loading: boolean;
  onUpdate: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
}

export function NotificationsCard({ prefs, loading, onUpdate }: NotificationsCardProps) {
  return (
    <Card className="fade-up">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2"><Bell className="h-4 w-4 text-primary" /></div>
          <div>
            <CardTitle className="text-base">Notifications</CardTitle>
            <CardDescription className="text-xs">When and how you get notified</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="divide-y">
        {loading ? (
          <div className="space-y-3 py-2">
            {[1, 2].map((i) => <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />)}
          </div>
        ) : (
          <>
            <Toggle
              checked={prefs.notifications_document_ready}
              onChange={(v) => onUpdate("notifications_document_ready", v)}
              label="Document processing alerts"
              description="Show a notification when a document finishes processing"
            />
            <Toggle
              checked={prefs.notifications_email}
              onChange={(v) => onUpdate("notifications_email", v)}
              label="Email notifications"
              description="Receive email updates about your account and documents"
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
