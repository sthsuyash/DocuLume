"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, User } from "lucide-react";

interface ProfileCardProps {
  email: string;
  username: string;
  fullName: string;
  loading: boolean;
  onFullNameChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ProfileCard({ email, username, fullName, loading, onFullNameChange, onSubmit }: ProfileCardProps) {
  return (
    <form onSubmit={onSubmit}>
      <Card className="fade-up">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2"><User className="h-4 w-4 text-primary" /></div>
            <div>
              <CardTitle className="text-base">Profile</CardTitle>
              <CardDescription className="text-xs">Your personal information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <Input value={email} disabled />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Username</label>
            <Input value={username} disabled />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Full Name</label>
            <Input value={fullName} onChange={(e) => onFullNameChange(e.target.value)} />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Saving…" : "Save Profile"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
