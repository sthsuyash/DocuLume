"use client";

import { useState } from "react";
import { Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import apiClient from "@/lib/api/client";
import { useToast } from "@/components/ui/use-toast";

interface Props {
  onDismiss?: () => void;
}

export function EmailVerificationBanner({ onDismiss }: Props) {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const resend = async () => {
    setSending(true);
    try {
      await apiClient.post("/auth/resend-verification");
      setSent(true);
      toast({ title: "Verification email sent", description: "Check your inbox." });
    } catch {
      toast({ title: "Failed to send", description: "Please try again later.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex items-center gap-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-3 text-sm">
      <Mail className="h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
      <p className="flex-1 text-yellow-800 dark:text-yellow-200">
        Please verify your email address to unlock all features.
      </p>
      {!sent ? (
        <Button size="sm" variant="outline" className="shrink-0 h-7 text-xs border-yellow-400 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/40"
          onClick={resend} disabled={sending}>
          {sending ? "Sending…" : "Resend email"}
        </Button>
      ) : (
        <span className="text-xs text-yellow-700 dark:text-yellow-300">Sent!</span>
      )}
      {onDismiss && (
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={onDismiss}>
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
