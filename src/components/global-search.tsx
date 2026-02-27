"use client";

import React, { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, User, Landmark, IndianRupee, FileText, X } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS, formatCurrency, type Member, type ChitGroup, type Payment } from "@/lib/firestore";

interface SearchResult {
  type: "member" | "group" | "payment";
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

export default function GlobalSearch() {
  const pathname = usePathname();
  const router = useRouter();
  const lang = pathname.split("/")[1] || "en";
  const isTE = lang === "te";

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [allData, setAllData] = useState<{
    members: (Member & { id: string })[];
    groups: (ChitGroup & { id: string })[];
    payments: (Payment & { id: string })[];
  }>({ members: [], groups: [], payments: [] });
  const [loaded, setLoaded] = useState(false);

  // Keyboard shortcut: Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Load data on first open
  useEffect(() => {
    if (!open || loaded) return;

    async function loadData() {
      try {
        const [membersSnap, groupsSnap, paymentsSnap] = await Promise.all([
          getDocs(collection(db, COLLECTIONS.MEMBERS)),
          getDocs(collection(db, COLLECTIONS.CHIT_GROUPS)),
          getDocs(collection(db, COLLECTIONS.PAYMENTS)),
        ]);

        setAllData({
          members: membersSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as (Member & { id: string })[],
          groups: groupsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as (ChitGroup & { id: string })[],
          payments: paymentsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as (Payment & { id: string })[],
        });
        setLoaded(true);
      } catch (error) {
        console.error("Search data load error:", error);
      }
    }
    loadData();
  }, [open, loaded]);

  // Search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const q = query.toLowerCase();
    const hits: SearchResult[] = [];

    // Members
    allData.members
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.nameTE?.toLowerCase().includes(q) ||
          m.phone.includes(q)
      )
      .slice(0, 5)
      .forEach((m) =>
        hits.push({
          type: "member",
          id: m.id,
          title: m.name,
          subtitle: m.phone,
          href: `/${lang}/member-ledger?id=${m.id}`,
        })
      );

    // Groups
    allData.groups
      .filter((g) => g.name.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((g) =>
        hits.push({
          type: "group",
          id: g.id,
          title: g.name,
          subtitle: `${formatCurrency(g.chitValue)} · ${g.memberCount} members`,
          href: `/${lang}/chit-groups`,
        })
      );

    // Receipt numbers
    allData.payments
      .filter((p) => p.receiptNumber?.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((p) => {
        const memberName = allData.members.find((m) => m.id === p.memberId)?.name || "";
        hits.push({
          type: "payment",
          id: p.id,
          title: `Receipt ${p.receiptNumber}`,
          subtitle: `${memberName} — ${formatCurrency(p.amount)}`,
          href: `/${lang}/collections`,
        });
      });

    setResults(hits);
  }, [query, allData, lang]);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery("");
    router.push(result.href);
  };

  const iconMap = {
    member: User,
    group: Landmark,
    payment: IndianRupee,
  };

  const colorMap = {
    member: "text-blue-600 bg-blue-50",
    group: "text-smk-green bg-smk-gold/10",
    payment: "text-green-600 bg-green-50",
  };

  const labelMap = {
    member: isTE ? "సభ్యుడు" : "Member",
    group: isTE ? "గ్రూప్" : "Group",
    payment: isTE ? "రసీదు" : "Receipt",
  };

  return (
    <>
      {/* Search Trigger Button */}
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full justify-start gap-2 text-muted-foreground border-smk-gold/20 bg-white hover:bg-smk-gold/5"
      >
        <Search className="h-4 w-4" />
        <span>{isTE ? "వెతకండి..." : "Search..."}</span>
        <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded hidden md:inline">
          Ctrl+K
        </kbd>
      </Button>

      {/* Search Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
          <div className="flex items-center border-b px-4">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isTE ? "సభ్యుడు, గ్రూప్ లేదా రసీదు వెతకండి..." : "Search members, groups, receipts..."}
              className="border-0 focus-visible:ring-0 text-lg h-14"
              autoFocus
            />
            {query && (
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setQuery("")}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {query && results.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>{isTE ? "ఫలితాలు లేవు" : "No results found"}</p>
              </div>
            )}

            {results.map((result) => {
              const Icon = iconMap[result.type];
              return (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-smk-gold/5 transition-colors text-left"
                >
                  <div className={`p-2 rounded-full shrink-0 ${colorMap[result.type]}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{result.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{result.subtitle}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {labelMap[result.type]}
                  </Badge>
                </button>
              );
            })}

            {!query && (
              <div className="p-6 text-center text-muted-foreground">
                <p className="text-sm">
                  {isTE
                    ? "సభ్యుడి పేరు, ఫోన్ నంబర్, గ్రూప్ పేరు లేదా రసీదు నంబర్ టైప్ చేయండి"
                    : "Type a member name, phone number, group name, or receipt number"}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
