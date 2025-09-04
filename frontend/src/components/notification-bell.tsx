"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import apiClient from "@/lib/api/client";

interface Notification {
  id: number;
  type: string;
  title: string;
  body?: string;
  is_read: boolean;
  created_at: string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Listen for WebSocket document.ready events to refresh
  useEffect(() => {
    const handler = () => load();
    window.addEventListener("document.ready" as any, handler);
    return () => window.removeEventListener("document.ready" as any, handler);
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await apiClient.get("/notifications?limit=20");
      setNotifications(r.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const markRead = async (id: number) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    } catch { /* ignore */ }
  };

  const markAllRead = async () => {
    try {
      await apiClient.post("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch { /* ignore */ }
  };

  return (
    <div className="relative" ref={panelRef}>
      <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} className="relative">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border bg-card shadow-xl z-50">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="font-semibold text-sm">Notifications</span>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllRead}>
                  <Check className="mr-1 h-3 w-3" /> All read
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="space-y-2 p-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />)}
              </div>
            ) : notifications.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No notifications</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  className={`w-full text-left px-4 py-3 border-b last:border-0 hover:bg-muted/50 transition-colors ${!n.is_read ? "bg-primary/5" : ""}`}
                  onClick={() => !n.is_read && markRead(n.id)}
                >
                  <div className="flex items-start gap-2">
                    {!n.is_read && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    {n.is_read && <div className="mt-1.5 h-2 w-2 shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug">{n.title}</p>
                      {n.body && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.body}</p>}
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
