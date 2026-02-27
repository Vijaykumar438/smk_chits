"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

export function LanguageToggle() {
  const pathname = usePathname();
  const router = useRouter();

  const currentLang = pathname.split("/")[1] || "en";
  const targetLang = currentLang === "en" ? "te" : "en";
  const label = currentLang === "en" ? "తె" : "EN";

  const handleToggle = () => {
    const newPath = pathname.replace(`/${currentLang}`, `/${targetLang}`);
    router.push(newPath);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      className="gap-1.5 border-smk-gold/30 text-smk-green hover:bg-smk-gold/10"
    >
      <Globe className="h-4 w-4" />
      <span className="font-semibold">{label}</span>
    </Button>
  );
}
