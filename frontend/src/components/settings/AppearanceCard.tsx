"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Palette } from "lucide-react";

interface AppearanceCardProps {
  currentTheme: string;
  loading: boolean;
  onThemeChange: (v: "light" | "dark" | "system") => void;
}

export function AppearanceCard({ currentTheme, loading, onThemeChange }: AppearanceCardProps) {
  return (
    <Card className="fade-up">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2"><Palette className="h-4 w-4 text-primary" /></div>
          <div>
            <CardTitle className="text-base">Appearance</CardTitle>
            <CardDescription className="text-xs">Theme and display settings</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-12 animate-pulse rounded-md bg-muted" />
        ) : (
          <div className="flex items-center justify-between gap-4 py-3">
            <div>
              <p className="text-sm font-medium">Theme</p>
              <p className="mt-1 text-xs text-muted-foreground">Choose light, dark or system mode</p>
            </div>
            <Select value={currentTheme} onValueChange={onThemeChange}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
