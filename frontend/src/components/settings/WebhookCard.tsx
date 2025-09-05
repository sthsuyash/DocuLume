"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Webhook } from "lucide-react";

interface WebhookCardProps {
  url: string;
  loading: boolean;
  saving: boolean;
  onChange: (v: string) => void;
  onSave: () => void;
}

export function WebhookCard({ url, loading, saving, onChange, onSave }: WebhookCardProps) {
  return (
    <Card className="fade-up">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2"><Webhook className="h-4 w-4 text-primary" /></div>
          <div>
            <CardTitle className="text-base">Webhook</CardTitle>
            <CardDescription className="text-xs">Receive HTTP notifications when documents finish processing</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
        {loading ? (
          <div className="h-10 animate-pulse rounded-md bg-muted" />
        ) : (
          <>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Webhook URL</label>
              <Input type="url" placeholder="https://your-server.com/webhook" value={url} onChange={(e) => onChange(e.target.value)} />
              <p className="mt-1 text-xs text-muted-foreground">
                We will POST{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                  {"{ event, document_id, filename, chunk_count, page_count }"}
                </code>{" "}
                when a document is ready.
              </p>
            </div>
            <Button onClick={onSave} disabled={saving} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving…" : "Save Webhook"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
