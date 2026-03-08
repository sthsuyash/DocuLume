"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store";
import { useToast } from "@/components/ui/use-toast";
import { consumeAndValidateOAuthState, getOAuthRedirectUri } from "@/lib/auth/oauth";

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oauthLogin = useAuthStore((state) => state.oauthLogin);
  const { toast } = useToast();

  useEffect(() => {
    const runCallback = async () => {
      const code = searchParams.get("code");
      const returnedState = searchParams.get("state");
      const provider = consumeAndValidateOAuthState(returnedState);

      if (!code || !provider) {
        toast({
          title: "OAuth failed",
          description: "Missing or invalid OAuth state. Please try again.",
          variant: "destructive",
        });
        router.replace("/auth/login");
        return;
      }

      try {
        await oauthLogin(provider, code, getOAuthRedirectUri());
        toast({
          title: "Welcome to DocuLume",
          description: "OAuth login successful.",
        });
        router.replace("/dashboard");
      } catch (error: any) {
        toast({
          title: "OAuth failed",
          description: error.response?.data?.detail || "Unable to complete OAuth login.",
          variant: "destructive",
        });
        router.replace("/auth/login");
      }
    };

    runCallback();
  }, [oauthLogin, router, searchParams, toast]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}
