import { notFound } from "next/navigation";
import { hasLocale, getDictionary, type Locale } from "@/dictionaries";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";

interface LangLayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "te" }];
}

export default async function LangLayout({ children, params }: LangLayoutProps) {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    notFound();
  }

  const dict = await getDictionary(lang as Locale);

  return (
    <AuthProvider>
      <div className="min-h-screen" data-lang={lang}>
        {children}
      </div>
      <Toaster position="top-right" />
    </AuthProvider>
  );
}
