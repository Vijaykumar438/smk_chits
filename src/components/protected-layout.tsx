"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { SMKLogo } from "@/components/smk-logo";
import { Loader2 } from "lucide-react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      const lang = pathname.split("/")[1] || "en";
      router.push(`/${lang}/login`);
    }
  }, [user, loading, pathname, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-smk-cream">
        <div className="flex flex-col items-center gap-4">
          <SMKLogo size={64} showText={false} />
          <Loader2 className="h-6 w-6 animate-spin text-smk-green" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
