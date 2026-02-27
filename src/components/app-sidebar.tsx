"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { SMKLogo, SMKLogoMark } from "@/components/smk-logo";
import { LanguageToggle } from "@/components/language-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Users,
  Landmark,
  Gavel,
  IndianRupee,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { href: "dashboard", icon: LayoutDashboard, labelEN: "Dashboard", labelTE: "డాష్‌బోర్డ్" },
  { href: "members", icon: Users, labelEN: "Members", labelTE: "సభ్యులు" },
  { href: "chit-groups", icon: Landmark, labelEN: "Chit Groups", labelTE: "చిట్ గ్రూపులు" },
  { href: "auctions", icon: Gavel, labelEN: "Auctions", labelTE: "వేలం" },
  { href: "collections", icon: IndianRupee, labelEN: "Collections", labelTE: "వసూళ్లు" },
  { href: "reports", icon: FileText, labelEN: "Reports", labelTE: "రిపోర్ట్‌లు" },
  { href: "settings", icon: Settings, labelEN: "Settings", labelTE: "సెట్టింగ్‌లు" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const lang = pathname.split("/")[1] || "en";

  const NavContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-smk-gold/10">
        <SMKLogo size={44} />
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.includes(`/${item.href}`);
            const label = lang === "te" ? item.labelTE : item.labelEN;
            return (
              <Link
                key={item.href}
                href={`/${lang}/${item.href}`}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-smk-green text-white shadow-sm"
                    : "text-smk-green-dark hover:bg-smk-gold/10 hover:text-smk-green"
                }`}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-smk-gold/10 p-3 space-y-2">
        <div className="flex items-center justify-between px-2">
          <LanguageToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut()}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-4 w-4 mr-1.5" />
            {lang === "te" ? "నిష్క్రమించు" : "Sign Out"}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center">
          © 2026 SMK Chits — S. Murali Krishna
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-smk-gold/10 shadow-sm z-30">
        <NavContent />
      </aside>

      {/* Mobile Header + Sheet */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-white border-b border-smk-gold/10 shadow-sm">
        <div className="flex items-center gap-2">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-smk-green">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <NavContent />
            </SheetContent>
          </Sheet>
          <SMKLogoMark size={32} />
          <span className="font-bold text-smk-green text-lg">SMK Chits</span>
        </div>
        <LanguageToggle />
      </header>
    </>
  );
}
