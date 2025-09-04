"use client";

import { useState, useEffect } from "react";
import { X, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Shortcut {
  keys: string[];
  description: string;
  category?: string;
}

const SHORTCUTS: Shortcut[] = [
  { category: "Navigation", keys: ["?"], description: "Open keyboard shortcuts" },
  { category: "Navigation", keys: ["Ctrl", "K"], description: "Go to chat" },
  { category: "Navigation", keys: ["Ctrl", "D"], description: "Go to documents" },
  { category: "Navigation", keys: ["Ctrl", "\\"], description: "Toggle sidebar" },
  { category: "Chat", keys: ["Ctrl", "Enter"], description: "Send message" },
  { category: "Chat", keys: ["Ctrl", "N"], description: "New conversation" },
  { category: "Chat", keys: ["Escape"], description: "Cancel edit / close panel" },
  { category: "Documents", keys: ["Ctrl", "U"], description: "Upload document" },
  { category: "Global", keys: ["Ctrl", "/"], description: "Focus search" },
  { category: "Global", keys: ["Ctrl", "Shift", "T"], description: "Toggle theme" },
];

export function KeyboardShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "?" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!open) return null;

  const categories = [...new Set(SHORTCUTS.map((s) => s.category))];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border bg-card shadow-2xl p-6 mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-5">
          {categories.map((cat) => (
            <div key={cat}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{cat}</h3>
              <div className="space-y-2">
                {SHORTCUTS.filter((s) => s.category === cat).map((s, i) => (
                  <div key={i} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-foreground">{s.description}</span>
                    <div className="flex items-center gap-1">
                      {s.keys.map((k, ki) => (
                        <span key={ki}>
                          <kbd className="rounded border bg-muted px-2 py-0.5 text-xs font-mono shadow-sm">{k}</kbd>
                          {ki < s.keys.length - 1 && <span className="text-xs text-muted-foreground mx-0.5">+</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-5 text-center text-xs text-muted-foreground">Press <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px]">?</kbd> or <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px]">Esc</kbd> to close</p>
      </div>
    </div>
  );
}
