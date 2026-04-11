"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "./auth-provider";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { accessToken, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !accessToken) {
      router.replace("/auth/sign-in");
    }
  }, [accessToken, loading, router]);

  if (loading || !accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-soft">
          Loading workspace...
        </div>
      </div>
    );
  }

  return children;
}
