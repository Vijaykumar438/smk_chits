"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText,
  Download,
  IndianRupee,
  Users,
  AlertTriangle,
  Gavel,
  Landmark,
  TrendingUp,
  MessageCircle,
} from "lucide-react";
import { collection, getDocs, query, where, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  COLLECTIONS,
  formatCurrency,
  getWhatsAppUrl,
  type Payment,
  type ChitGroup,
  type Member,
  type Auction,
  type Ticket,
} from "@/lib/firestore";
import * as XLSX from "xlsx";

export default function ReportsPage() {
  const pathname = usePathname();
  const lang = pathname.split("/")[1] || "en";
  const isTE = lang === "te";

  const [payments, setPayments] = useState<(Payment & { id: string })[]>([]);
  const [groups, setGroups] = useState<(ChitGroup & { id: string })[]>([]);
  const [members, setMembers] = useState<(Member & { id: string })[]>([]);
  const [auctions, setAuctions] = useState<(Auction & { id: string })[]>([]);
  const [tickets, setTickets] = useState<(Ticket & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState("all");

  useEffect(() => {
    async function fetchAll() {
      try {
        const [paymentsSnap, groupsSnap, membersSnap, auctionsSnap, ticketsSnap] =
          await Promise.all([
            getDocs(query(collection(db, COLLECTIONS.PAYMENTS), orderBy("paymentDate", "desc"))),
            getDocs(collection(db, COLLECTIONS.CHIT_GROUPS)),
            getDocs(collection(db, COLLECTIONS.MEMBERS)),
            getDocs(query(collection(db, COLLECTIONS.AUCTIONS), orderBy("date", "desc"))),
            getDocs(collection(db, COLLECTIONS.TICKETS)),
          ]);

        setPayments(paymentsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as (Payment & { id: string })[]);
        setGroups(groupsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as (ChitGroup & { id: string })[]);
        setMembers(membersSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as (Member & { id: string })[]);
        setAuctions(auctionsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as (Auction & { id: string })[]);
        setTickets(ticketsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as (Ticket & { id: string })[]);
      } catch (error) {
        console.error("Error fetching report data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  const getMemberName = (id: string) => members.find((m) => m.id === id)?.name || "Unknown";
  const getGroupName = (id: string) => groups.find((g) => g.id === id)?.name || "Unknown";

  const filteredPayments = payments.filter((p) => {
    if (selectedGroupFilter !== "all" && p.groupId !== selectedGroupFilter) return false;
    if (dateFrom && p.paymentDate?.toDate && p.paymentDate.toDate() < new Date(dateFrom)) return false;
    if (dateTo && p.paymentDate?.toDate && p.paymentDate.toDate() > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  const totalFiltered = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  // Calculate defaulters (members with tickets in active groups who haven't paid current month)
  const activeGroupIds = groups.filter((g) => g.status === "active").map((g) => g.id);
  const activeTickets = tickets.filter((t) => activeGroupIds.includes(t.groupId) && t.status === "active");

  const defaulterList = activeTickets
    .map((ticket) => {
      const member = members.find((m) => m.id === ticket.memberId);
      const group = groups.find((g) => g.id === ticket.groupId);
      const memberPayments = payments.filter(
        (p) => p.memberId === ticket.memberId && p.groupId === ticket.groupId
      );
      const totalPaid = memberPayments.reduce((sum, p) => sum + p.amount, 0);
      const expectedMonths = group
        ? Math.min(
            group.duration,
            Math.ceil(
              (Date.now() - (group.startDate?.toDate?.()?.getTime() || Date.now())) /
                (30 * 24 * 60 * 60 * 1000)
            )
          )
        : 0;
      const expectedTotal = group ? expectedMonths * group.monthlyInstallment : 0;
      const outstanding = Math.max(0, expectedTotal - totalPaid);

      return {
        member,
        group,
        ticket,
        totalPaid,
        expectedTotal,
        outstanding,
      };
    })
    .filter((d) => d.outstanding > 0 && d.member && d.group);

  // Profit & Loss
  const totalCommission = auctions.reduce((sum, a) => sum + (a.foremanCommission || 0), 0);

  const downloadExcel = (data: Record<string, unknown>[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const downloadCollectionReport = () => {
    const data = filteredPayments.map((p) => ({
      Receipt: p.receiptNumber,
      Member: getMemberName(p.memberId),
      Group: getGroupName(p.groupId),
      Amount: p.amount,
      Type: p.collectionType,
      Date: p.paymentDate?.toDate?.()?.toLocaleDateString("en-IN") || "",
    }));
    downloadExcel(data, `SMK-Collection-Report-${new Date().toISOString().split("T")[0]}`);
  };

  const downloadDefaulterReport = () => {
    const data = defaulterList.map((d) => ({
      Member: d.member?.name || "",
      Phone: d.member?.phone || "",
      Group: d.group?.name || "",
      "Total Paid": d.totalPaid,
      "Expected Total": d.expectedTotal,
      Outstanding: d.outstanding,
    }));
    downloadExcel(data, `SMK-Defaulter-Report-${new Date().toISOString().split("T")[0]}`);
  };

  const handleBulkWhatsApp = () => {
    defaulterList.forEach((d, i) => {
      if (d.member?.phone) {
        const msg = isTE
          ? `నమస్కారం ${d.member.name} గారు, మీ ${d.group?.name} చిట్ చెల్లింపు ₹${d.outstanding} పెండింగ్ లో ఉంది. దయచేసి త్వరగా చెల్లించండి. — ఎస్ఎంకె చిట్స్`
          : `Dear ${d.member.name}, your chit payment of ₹${d.outstanding} for ${d.group?.name} is pending. Please pay at the earliest. — SMK Chits`;
        setTimeout(() => {
          window.open(getWhatsAppUrl(d.member!.phone, msg), "_blank");
        }, i * 2000);
      }
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-smk-green">{isTE ? "రిపోర్ట్‌లు" : "Reports"}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="p-8"><div className="h-20 animate-pulse bg-muted/50 rounded" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-smk-green">{isTE ? "రిపోర్ట్‌లు" : "Reports"}</h1>

      <Tabs defaultValue="collections" className="space-y-4">
        <TabsList className="bg-smk-cream-dark">
          <TabsTrigger value="collections">{isTE ? "వసూళ్లు" : "Collections"}</TabsTrigger>
          <TabsTrigger value="defaulters">{isTE ? "డిఫాల్టర్లు" : "Defaulters"}</TabsTrigger>
          <TabsTrigger value="auctions">{isTE ? "వేలాలు" : "Auctions"}</TabsTrigger>
          <TabsTrigger value="pnl">{isTE ? "లాభ/నష్టం" : "P&L"}</TabsTrigger>
        </TabsList>

        {/* Collection Report */}
        <TabsContent value="collections">
          <Card className="border-smk-gold/10">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-lg text-smk-green">
                  {isTE ? "వసూలు రిపోర్ట్" : "Collection Report"}
                </CardTitle>
                <Button variant="outline" size="sm" onClick={downloadCollectionReport} className="border-smk-gold/30">
                  <Download className="h-4 w-4 mr-1" /> Excel
                </Button>
              </div>
              <div className="flex flex-wrap gap-3 mt-3">
                <div className="flex items-center gap-2">
                  <Label className="text-xs">{isTE ? "నుండి" : "From"}</Label>
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-auto h-8 text-xs" />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">{isTE ? "వరకు" : "To"}</Label>
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-auto h-8 text-xs" />
                </div>
                <Select value={selectedGroupFilter} onValueChange={setSelectedGroupFilter}>
                  <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isTE ? "అన్ని గ్రూపులు" : "All Groups"}</SelectItem>
                    {groups.map((g) => (<SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-4 py-2 bg-smk-cream-dark flex justify-between text-sm font-semibold">
                <span>{isTE ? "మొత్తం" : "Total"}: {filteredPayments.length} {isTE ? "చెల్లింపులు" : "payments"}</span>
                <span className="text-smk-green">{formatCurrency(totalFiltered)}</span>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isTE ? "రసీదు" : "Receipt"}</TableHead>
                      <TableHead>{isTE ? "సభ్యుడు" : "Member"}</TableHead>
                      <TableHead>{isTE ? "గ్రూప్" : "Group"}</TableHead>
                      <TableHead className="text-right">{isTE ? "మొత్తం" : "Amount"}</TableHead>
                      <TableHead>{isTE ? "తేదీ" : "Date"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.slice(0, 50).map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs">{p.receiptNumber}</TableCell>
                        <TableCell>{getMemberName(p.memberId)}</TableCell>
                        <TableCell className="text-muted-foreground">{getGroupName(p.groupId)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(p.amount)}</TableCell>
                        <TableCell className="text-xs">{p.paymentDate?.toDate?.()?.toLocaleDateString("en-IN") || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Defaulter Report */}
        <TabsContent value="defaulters">
          <Card className="border-smk-gold/10">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-lg text-smk-green flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  {isTE ? "డిఫాల్టర్ జాబితా" : "Defaulter List"}
                  <Badge variant="destructive" className="ml-2">{defaulterList.length}</Badge>
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={downloadDefaulterReport} className="border-smk-gold/30">
                    <Download className="h-4 w-4 mr-1" /> Excel
                  </Button>
                  {defaulterList.length > 0 && (
                    <Button variant="outline" size="sm" onClick={handleBulkWhatsApp} className="border-green-300 text-green-700 hover:bg-green-50">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      {isTE ? "అందరికి రిమైండర్" : "Remind All"}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {defaulterList.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p>🎉 {isTE ? "డిఫాల్టర్లు లేరు!" : "No defaulters!"}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{isTE ? "సభ్యుడు" : "Member"}</TableHead>
                        <TableHead>{isTE ? "గ్రూప్" : "Group"}</TableHead>
                        <TableHead className="text-right">{isTE ? "చెల్లించింది" : "Paid"}</TableHead>
                        <TableHead className="text-right">{isTE ? "బకాయి" : "Outstanding"}</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {defaulterList.map((d, i) => (
                        <TableRow key={i} className="hover:bg-orange-50/50">
                          <TableCell>
                            <div>
                              <p className="font-medium">{d.member?.name}</p>
                              <p className="text-xs text-muted-foreground">{d.member?.phone}</p>
                            </div>
                          </TableCell>
                          <TableCell>{d.group?.name}</TableCell>
                          <TableCell className="text-right">{formatCurrency(d.totalPaid)}</TableCell>
                          <TableCell className="text-right font-semibold text-red-600">{formatCurrency(d.outstanding)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-600"
                              onClick={() => {
                                const msg = isTE
                                  ? `నమస్కారం ${d.member?.name} గారు, మీ ${d.group?.name} చిట్ చెల్లింపు ₹${d.outstanding} పెండింగ్ లో ఉంది. — ఎస్ఎంకె చిట్స్`
                                  : `Dear ${d.member?.name}, your payment of ₹${d.outstanding} for ${d.group?.name} is pending. — SMK Chits`;
                                window.open(getWhatsAppUrl(d.member!.phone, msg), "_blank");
                              }}
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auction Register */}
        <TabsContent value="auctions">
          <Card className="border-smk-gold/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-smk-green">{isTE ? "వేలం రిజిస్టర్" : "Auction Register"}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {auctions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">{isTE ? "వేలాలు లేవు" : "No auctions"}</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{isTE ? "గ్రూప్" : "Group"}</TableHead>
                        <TableHead>{isTE ? "నెల" : "Month"}</TableHead>
                        <TableHead>{isTE ? "విజేత" : "Winner"}</TableHead>
                        <TableHead className="text-right">{isTE ? "బిడ్" : "Bid"}</TableHead>
                        <TableHead className="text-right">{isTE ? "లాభాంశం" : "Dividend"}</TableHead>
                        <TableHead className="text-right">{isTE ? "కమీషన్" : "Commission"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auctions.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell>{getGroupName(a.groupId)}</TableCell>
                          <TableCell><Badge variant="outline">{a.monthNumber}</Badge></TableCell>
                          <TableCell>{getMemberName(a.winnerMemberId)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(a.bidAmount)}</TableCell>
                          <TableCell className="text-right text-smk-gold-dark">{formatCurrency(a.dividendPerMember)}</TableCell>
                          <TableCell className="text-right text-smk-green">{formatCurrency(a.foremanCommission)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* P&L */}
        <TabsContent value="pnl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-smk-gold/10">
              <CardHeader>
                <CardTitle className="text-lg text-smk-green flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {isTE ? "లాభ & నష్టాలు" : "Profit & Loss"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium">{isTE ? "మొత్తం కమీషన్" : "Total Commission Earned"}</span>
                  <span className="font-bold text-green-700">{formatCurrency(totalCommission)}</span>
                </div>
                <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium">{isTE ? "మొత్తం వసూళ్లు" : "Total Collections"}</span>
                  <span className="font-bold text-blue-700">{formatCurrency(payments.reduce((s, p) => s + p.amount, 0))}</span>
                </div>
                <div className="flex justify-between p-3 bg-smk-cream-dark rounded-lg">
                  <span className="text-sm font-medium">{isTE ? "వేలాలు" : "Total Auctions"}</span>
                  <span className="font-bold">{auctions.length}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="border-smk-gold/10">
              <CardHeader>
                <CardTitle className="text-lg text-smk-green">{isTE ? "గ్రూప్ సారాంశం" : "Group Summary"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {groups.map((group) => {
                  const groupAuctions = auctions.filter((a) => a.groupId === group.id);
                  const groupCommission = groupAuctions.reduce((s, a) => s + (a.foremanCommission || 0), 0);
                  return (
                    <div key={group.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{group.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {groupAuctions.length}/{group.duration} {isTE ? "నెలలు" : "months"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-smk-green text-sm">{formatCurrency(groupCommission)}</p>
                        <Badge variant="outline" className="text-xs">
                          {group.status === "active" ? (isTE ? "యాక్టివ్" : "Active") : group.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
