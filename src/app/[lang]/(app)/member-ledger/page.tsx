"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  IndianRupee,
  Calendar,
  User,
  Landmark,
  FileText,
} from "lucide-react";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  COLLECTIONS,
  formatCurrency,
  getWhatsAppUrl,
  type Member,
  type Payment,
  type ChitGroup,
  type Ticket,
} from "@/lib/firestore";

export default function MemberLedgerPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lang = pathname.split("/")[1] || "en";
  const isTE = lang === "te";
  const memberId = searchParams.get("id");

  const [member, setMember] = useState<(Member & { id: string }) | null>(null);
  const [payments, setPayments] = useState<(Payment & { id: string })[]>([]);
  const [groups, setGroups] = useState<(ChitGroup & { id: string })[]>([]);
  const [tickets, setTickets] = useState<(Ticket & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!memberId) return;

    async function fetchLedger() {
      try {
        // Fetch member
        const memberDoc = await getDoc(doc(db, COLLECTIONS.MEMBERS, memberId!));
        if (memberDoc.exists()) {
          setMember({ id: memberDoc.id, ...memberDoc.data() } as Member & { id: string });
        }

        // Fetch payments for this member
        const paymentsSnap = await getDocs(
          query(
            collection(db, COLLECTIONS.PAYMENTS),
            where("memberId", "==", memberId),
            orderBy("paymentDate", "desc")
          )
        );
        setPayments(paymentsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as (Payment & { id: string })[]);

        // Fetch groups
        const groupsSnap = await getDocs(collection(db, COLLECTIONS.CHIT_GROUPS));
        setGroups(groupsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as (ChitGroup & { id: string })[]);

        // Fetch tickets for this member
        const ticketsSnap = await getDocs(
          query(collection(db, COLLECTIONS.TICKETS), where("memberId", "==", memberId))
        );
        setTickets(ticketsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as (Ticket & { id: string })[]);
      } catch (error) {
        console.error("Error fetching ledger:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLedger();
  }, [memberId]);

  if (!memberId) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <User className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>{isTE ? "సభ్యుడిని ఎంచుకోండి" : "Select a member to view their ledger"}</p>
        <Link href={`/${lang}/members`}>
          <Button variant="link" className="text-smk-green mt-2">
            {isTE ? "సభ్యుల జాబితా" : "Go to Members"}
          </Button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted/50 rounded animate-pulse" />
        <div className="h-40 bg-muted/50 rounded-xl animate-pulse" />
        <div className="h-80 bg-muted/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>{isTE ? "సభ్యుడు కనుగొనబడలేదు" : "Member not found"}</p>
      </div>
    );
  }

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const getGroupName = (id: string) => groups.find((g) => g.id === id)?.name || "—";

  // Group-wise summary
  const groupSummary = tickets.map((ticket) => {
    const group = groups.find((g) => g.id === ticket.groupId);
    const groupPayments = payments.filter((p) => p.groupId === ticket.groupId);
    const groupPaid = groupPayments.reduce((s, p) => s + p.amount, 0);
    const expectedTotal = group ? group.monthlyInstallment * group.duration : 0;
    return {
      group,
      ticket,
      paid: groupPaid,
      expected: expectedTotal,
      outstanding: Math.max(0, expectedTotal - groupPaid),
      paymentCount: groupPayments.length,
    };
  });

  const lastPaymentDate = payments[0]?.paymentDate?.toDate?.()
    ? new Date(payments[0].paymentDate.toDate()).toLocaleDateString(isTE ? "te-IN" : "en-IN")
    : "—";

  return (
    <div className="space-y-5">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Link href={`/${lang}/members`}>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-smk-green">{member.name}</h1>
          {member.nameTE && <p className="text-muted-foreground">{member.nameTE}</p>}
        </div>
      </div>

      {/* Member Profile Card */}
      <Card className="border-smk-gold/10">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{member.phone}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-green-600"
                  onClick={() =>
                    window.open(
                      getWhatsAppUrl(member.phone, `Hi ${member.name}`),
                      "_blank"
                    )
                  }
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
              {member.address && (
                <p className="text-sm text-muted-foreground">{member.address}</p>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {isTE ? "చివరి చెల్లింపు" : "Last Payment"}: {lastPaymentDate}
                </span>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-smk-green">{formatCurrency(totalPaid)}</p>
                <p className="text-xs text-muted-foreground">{isTE ? "మొత్తం చెల్లించింది" : "Total Paid"}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{payments.length}</p>
                <p className="text-xs text-muted-foreground">{isTE ? "చెల్లింపులు" : "Payments"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Group-wise Summary */}
      {groupSummary.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {groupSummary.map((gs) => (
            <Card key={gs.ticket.id} className="border-smk-gold/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-smk-green" />
                    <span className="font-semibold">{gs.group?.name || "—"}</span>
                  </div>
                  <Badge variant="outline">#{gs.ticket.ticketNumber}</Badge>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-muted rounded-full h-3 mt-2">
                  <div
                    className="bg-smk-green h-3 rounded-full transition-all"
                    style={{ width: `${gs.expected > 0 ? Math.min(100, (gs.paid / gs.expected) * 100) : 0}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-green-700">{formatCurrency(gs.paid)}</span>
                  <span className="text-muted-foreground">/ {formatCurrency(gs.expected)}</span>
                </div>
                {gs.outstanding > 0 && (
                  <p className="text-sm text-orange-600 font-medium mt-1">
                    {isTE ? "బకాయి" : "Outstanding"}: {formatCurrency(gs.outstanding)}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Payment History Table */}
      <Card className="border-smk-gold/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-smk-green flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {isTE ? "చెల్లింపు చరిత్ర" : "Payment History"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {payments.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {isTE ? "చెల్లింపులు లేవు" : "No payments recorded"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isTE ? "తేదీ" : "Date"}</TableHead>
                    <TableHead>{isTE ? "గ్రూప్" : "Group"}</TableHead>
                    <TableHead>{isTE ? "రసీదు" : "Receipt"}</TableHead>
                    <TableHead className="text-right">{isTE ? "మొత్తం" : "Amount"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        {p.paymentDate?.toDate?.()
                          ? new Date(p.paymentDate.toDate()).toLocaleDateString(isTE ? "te-IN" : "en-IN")
                          : "—"}
                      </TableCell>
                      <TableCell>{getGroupName(p.groupId)}</TableCell>
                      <TableCell className="font-mono text-xs">{p.receiptNumber}</TableCell>
                      <TableCell className="text-right font-semibold text-green-700">
                        {formatCurrency(p.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Running Balance */}
      {payments.length > 0 && (
        <Card className="border-smk-gold/10 bg-smk-cream-dark/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-smk-green">
                {isTE ? "మొత్తం చెల్లించింది" : "Grand Total Paid"}
              </span>
              <span className="text-2xl font-bold text-smk-green">{formatCurrency(totalPaid)}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
