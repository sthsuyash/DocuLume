"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock } from "lucide-react";

interface PasswordForm {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

interface PasswordCardProps {
  form: PasswordForm;
  loading: boolean;
  onChange: (form: PasswordForm) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function PasswordCard({ form, loading, onChange, onSubmit }: PasswordCardProps) {
  return (
    <form onSubmit={onSubmit}>
      <Card className="fade-up">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2"><Lock className="h-4 w-4 text-primary" /></div>
            <div>
              <CardTitle className="text-base">Change Password</CardTitle>
              <CardDescription className="text-xs">Update your account password</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Current Password</label>
            <Input type="password" value={form.current_password}
              onChange={(e) => onChange({ ...form, current_password: e.target.value })}
              placeholder="••••••••" autoComplete="current-password" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">New Password</label>
            <Input type="password" value={form.new_password}
              onChange={(e) => onChange({ ...form, new_password: e.target.value })}
              placeholder="Min. 8 characters" autoComplete="new-password" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Confirm New Password</label>
            <Input type="password" value={form.confirm_password}
              onChange={(e) => onChange({ ...form, confirm_password: e.target.value })}
              placeholder="Repeat new password" autoComplete="new-password" />
          </div>
          <Button type="submit" disabled={loading || !form.current_password || !form.new_password} className="w-full">
            <Lock className="mr-2 h-4 w-4" />
            {loading ? "Changing…" : "Change Password"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
