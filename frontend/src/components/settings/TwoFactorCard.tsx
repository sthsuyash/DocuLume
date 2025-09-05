"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck } from "lucide-react";

interface TotpSetup {
  secret: string;
  qr_code_base64: string;
}

interface TwoFactorCardProps {
  enabled: boolean;
  setup: TotpSetup | null;
  code: string;
  loading: boolean;
  onCodeChange: (v: string) => void;
  onSetup: () => void;
  onEnable: () => void;
  onDisable: () => void;
}

export function TwoFactorCard({ enabled, setup, code, loading, onCodeChange, onSetup, onEnable, onDisable }: TwoFactorCardProps) {
  return (
    <Card className="fade-up">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2"><ShieldCheck className="h-4 w-4 text-primary" /></div>
          <div>
            <CardTitle className="text-base">Two-Factor Authentication</CardTitle>
            <CardDescription className="text-xs">Add an extra layer of security with TOTP</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
        {enabled ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <ShieldCheck className="h-4 w-4" />
              2FA is enabled
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">TOTP Code to disable</label>
              <Input value={code} onChange={(e) => onCodeChange(e.target.value)}
                placeholder="6-digit code" maxLength={6} className="w-40" />
            </div>
            <Button variant="destructive" size="sm" disabled={loading || code.length !== 6} onClick={onDisable}>
              {loading ? "Disabling…" : "Disable 2FA"}
            </Button>
          </div>
        ) : setup ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Scan this QR code with your authenticator app, then enter the 6-digit code to confirm.</p>
            <img src={`data:image/png;base64,${setup.qr_code_base64}`} alt="TOTP QR code" className="rounded border w-40 h-40" />
            <p className="text-xs text-muted-foreground font-mono break-all">{setup.secret}</p>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Verification Code</label>
              <Input value={code} onChange={(e) => onCodeChange(e.target.value)}
                placeholder="6-digit code" maxLength={6} className="w-40" />
            </div>
            <Button size="sm" disabled={loading || code.length !== 6} onClick={onEnable}>
              {loading ? "Enabling…" : "Enable 2FA"}
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={onSetup} disabled={loading}>
            {loading ? "Loading…" : "Set up 2FA"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
