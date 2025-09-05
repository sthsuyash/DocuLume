"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Key, Code } from "lucide-react";

interface ApiKeyFields {
  openai_api_key: string;
  anthropic_api_key: string;
  google_api_key: string;
}

interface ApiKeysCardProps {
  fields: ApiKeyFields;
  onChange: (fields: ApiKeyFields) => void;
}

export function ApiKeysCard({ fields, onChange }: ApiKeysCardProps) {
  const router = useRouter();

  return (
    <Card className="fade-up">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2"><Key className="h-4 w-4 text-primary" /></div>
          <div>
            <CardTitle className="text-base">API Keys</CardTitle>
            <CardDescription className="text-xs">Configure your own LLM provider keys (optional)</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">OpenAI API Key</label>
          <Input type="password" placeholder="sk-…" value={fields.openai_api_key}
            onChange={(e) => onChange({ ...fields, openai_api_key: e.target.value })} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Anthropic API Key</label>
          <Input type="password" placeholder="sk-ant-…" value={fields.anthropic_api_key}
            onChange={(e) => onChange({ ...fields, anthropic_api_key: e.target.value })} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Google AI API Key</label>
          <Input type="password" placeholder="AIza…" value={fields.google_api_key}
            onChange={(e) => onChange({ ...fields, google_api_key: e.target.value })} />
        </div>
        <p className="text-xs text-muted-foreground">
          For full LLM provider management, visit{" "}
          <button type="button" onClick={() => router.push("/settings/llm")}
            className="underline underline-offset-2 hover:text-foreground">
            LLM Settings
          </button>.
        </p>
      </CardContent>
    </Card>
  );
}

export function ApiTokensCard() {
  const router = useRouter();
  return (
    <Card className="fade-up">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2"><Code className="h-4 w-4 text-primary" /></div>
          <div>
            <CardTitle className="text-base">API Tokens</CardTitle>
            <CardDescription className="text-xs">Programmatic access to DocuLume</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <p className="text-sm text-muted-foreground mb-3">Create and manage API tokens for programmatic access.</p>
        <Button variant="outline" size="sm" onClick={() => router.push("/api-tokens")}>
          <Code className="mr-2 h-4 w-4" />
          Manage API Tokens
        </Button>
      </CardContent>
    </Card>
  );
}
