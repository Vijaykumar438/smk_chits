"use client";

import React, { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Check,
  X,
  IndianRupee,
  MessageCircle,
  Clock,
  CheckCircle2,
  CircleDashed,
  Send,
} from "lucide-react";
import {
  collection,
  getDocs,
  Timestamp,
  addDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  COLLECTIONS,
  formatCurrency,
  generateReceiptNumber,
  getWhatsAppUrl,
  type Payment,
  type ChitGroup,
  type Member,
  type Ticket,
} from "@/lib/firestore";
import { toast } from "sonner";

interface MemberStatus {
  member: Member & { id: string };
  ticket: (Ticket & { id: string }) | null;
  paidToday: boolean;
  todayPayment: (Payment & { id: string }) | null;
  totalPaid: number;
  expectedTotal: number;
  outstanding: number;
}

export default function TodaysListPage() {
  const pathname = usePathname();
  const lang = pathname.split("/")[1] || "en";
  const isTE = lang === "te";

  const [groups, setGroups] = useState<(ChitGroup & { id: string })[]>([]);
  const [members, setMembers] = useState<(Member & { id: string })[]>([]);
  const [tickets, setTickets] = useState<(Ticket & { id: string })[]>([]);
  const [todayPayments, setTodayPayments] = useState<(Payment & { id: string })[]>([]);
  const [allPayments, setAllPayments] = useState<(Payment & { id: string })[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberStatus | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTs = Timestamp.fromDate(today);

      const [groupsSnap, membersSnap, ticketsSnap, todayPaySnap, allPaySnap] =
        await Promise.all([
          getDocs(query(collection(db, COLLECTIONS.CHIT_GROUPS), where("status", "==", "active"))),
          getDocs(collection(db, COLLECTIONS.MEMBERS)),
          getDocs(collection(db, COLLECTIONS.TICKETS)),
          getDocs(query(collection(db, COLLECTIONS.PAYMENTS), where("paymentDate", ">=", todayTs))),
          getDocs(collection(db, COLLECTIONS.PAYMENTS)),
        ]);

      setGroups(groupsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as (ChitGroup & { id: string })[]);
      setMembers(membersSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as (Member & { id: string })[]);
      setTickets(ticketsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as (Ticket & { id: string })[]);
      setTodayPayments(todayPaySnap.docs.map((d) => ({ id: d.id, ...d.data() })) as (Payment & { id: string })[]);
      setAllPayments(allPaySnap.docs.map((d) => ({ id: d.id, ...d.data() })) as (Payment & { id: string })[]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Build member status list
  const getMemberStatuses = (): MemberStatus[] => {
    const activeGroupIds = selectedGroup === "all"
      ? groups.map((g) => g.id)
      : [selectedGroup];

    const relevantTickets = tickets.filter(
      (t) => activeGroupIds.includes(t.groupId) && t.status === "active"
    );

    // If no tickets, show all members for selected groups
    if (relevantTickets.length === 0 && members.length > 0) {
      return members.map((member) => {
        const memberTodayPay = todayPayments.find(
          (p) => p.memberId === member.id && (selectedGroup === "all" || p.groupId === selectedGroup)
        );
        const memberAllPay = allPayments.filter(
          (p) => p.memberId === member.id && (selectedGroup === "all" || p.groupId === selectedGroup)
        );
        const totalPaid = memberAllPay.reduce((s, p) => s + p.amount, 0);

        return {
          member,
          ticket: null,
          paidToday: !!memberTodayPay,
          todayPayment: memberTodayPay || null,
          totalPaid,
          expectedTotal: 0,
          outstanding: 0,
        };
      });
    }

    return relevantTickets.map((ticket) => {
      const member = members.find((m) => m.id === ticket.memberId);
      if (!member) return null;

      const group = groups.find((g) => g.id === ticket.groupId);
      const memberTodayPay = todayPayments.find(
        (p) => p.memberId === member.id && p.groupId === ticket.groupId
      );
      const memberAllPay = allPayments.filter(
        (p) => p.memberId === member.id && p.groupId === ticket.groupId
      );
      const totalPaid = memberAllPay.reduce((s, p) => s + p.amount, 0);

      const monthsElapsed = group
        ? Math.max(1, Math.ceil((Date.now() - (group.startDate?.toDate?.()?.getTime() || Date.now())) / (30 * 24 * 60 * 60 * 1000)))
        : 1;
      const expectedTotal = group ? Math.min(monthsElapsed, group.duration) * group.monthlyInstallment : 0;
      const outstanding = Math.max(0, expectedTotal - totalPaid);

      return {
        member,
        ticket,
        paidToday: !!memberTodayPay,
        todayPayment: memberTodayPay || null,
        totalPaid,
        expectedTotal,
        outstanding,
      };
    }).filter(Boolean) as MemberStatus[];
  };

  const memberStatuses = getMemberStatuses();
  const paidCount = memberStatuses.filter((m) => m.paidToday).length;
  const pendingCount = memberStatuses.filter((m) => !m.paidToday).length;
  const todayTotal = todayPayments.reduce((s, p) => s + p.amount, 0);

  const handleQuickPay = (status: MemberStatus) => {
    setSelectedMember(status);
    const group = groups.find((g) => g.id === status.ticket?.groupId);
    setPayAmount(group ? group.monthlyInstallment.toString() : "");
    setPayNotes("");
    setPayDialogOpen(true);
  };

  const submitPayment = async () => {
    if (!selectedMember || !payAmount) return;
    setSubmitting(true);

    try {
      const receiptNumber = generateReceiptNumber();
      const groupId = selectedMember.ticket?.groupId || (selectedGroup !== "all" ? selectedGroup : groups[0]?.id || "");

      await addDoc(collection(db, COLLECTIONS.PAYMENTS), {
        memberId: selectedMember.member.id,
        groupId,
        ticketId: selectedMember.ticket?.id || "",
        auctionMonth: 1,
        amount: Number(payAmount),
        collectionType: "monthly",
        receiptNumber,
        notes: payNotes,
        paymentDate: Timestamp.now(),
        createdAt: Timestamp.now(),
      });

      toast.success(
        isTE
          ? `✅ ${selectedMember.member.name} — ${formatCurrency(Number(payAmount))} నమోదు!`
          : `✅ ${selectedMember.member.name} — ${formatCurrency(Number(payAmount))} recorded!`
      );
      setPayDialogOpen(false);
      setSelectedMember(null);
      fetchData();
    } catch (error) {
      toast.error(isTE ? "ఎర్రర్ వచ్చింది" : "Error recording payment");
    } finally {
      setSubmitting(false);
    }
  };

  const sendReminder = (status: MemberStatus) => {
    const group = groups.find((g) => g.id === status.ticket?.groupId);
    const msg = isTE
      ? `నమస్కారం ${status.member.name} గారు, ఈ రోజు మీ ${group?.name || "చిట్"} చెల్లింపు పెండింగ్ లో ఉంది. దయచేసి చెల్లించండి. — ఎస్ఎంకె చిట్స్`
      : `Dear ${status.member.name}, your chit payment for ${group?.name || "the group"} is due today. Please pay at the earliest. — SMK Chits`;
    window.open(getWhatsAppUrl(status.member.phone, msg), "_blank");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-smk-green">
          {isTE ? "ఈ రోజు జాబితా" : "Today's List"}
        </h1>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-smk-green">
          {isTE ? "ఈ రోజు జాబితా" : "Today's List"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {new Date().toLocaleDateString(isTE ? "te-IN" : "en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-3 text-center">
            <CheckCircle2 className="h-5 w-5 mx-auto text-green-600 mb-1" />
            <p className="text-2xl font-bold text-green-700">{paidCount}</p>
            <p className="text-xs text-green-600">{isTE ? "చెల్లించారు" : "Paid"}</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-3 text-center">
            <CircleDashed className="h-5 w-5 mx-auto text-orange-600 mb-1" />
            <p className="text-2xl font-bold text-orange-700">{pendingCount}</p>
            <p className="text-xs text-orange-600">{isTE ? "పెండింగ్" : "Pending"}</p>
          </CardContent>
        </Card>
        <Card className="border-smk-gold/20 bg-smk-gold/5">
          <CardContent className="p-3 text-center">
            <IndianRupee className="h-5 w-5 mx-auto text-smk-gold-dark mb-1" />
            <p className="text-2xl font-bold text-smk-green">{formatCurrency(todayTotal)}</p>
            <p className="text-xs text-smk-gold-dark">{isTE ? "మొత్తం" : "Collected"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Group Filter */}
      <Select value={selectedGroup} onValueChange={setSelectedGroup}>
        <SelectTrigger className="w-full md:w-72 bg-white">
          <SelectValue placeholder={isTE ? "గ్రూప్ ఎంచుకోండి" : "Filter by group"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{isTE ? "అన్ని గ్రూపులు" : "All Groups"}</SelectItem>
          {groups.map((g) => (
            <SelectItem key={g.id} value={g.id}>
              {g.name} — {formatCurrency(g.monthlyInstallment)}/mo
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Member Checklist */}
      <div className="space-y-2">
        {memberStatuses.length === 0 ? (
          <Card className="border-smk-gold/10">
            <CardContent className="p-12 text-center text-muted-foreground">
              <CircleDashed className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">{isTE ? "సభ్యులు లేరు" : "No members found"}</p>
              <p className="text-sm mt-1">{isTE ? "సభ్యులను చేర్చండి మరియు గ్రూపులో టిక్కెట్లు కేటాయించండి" : "Add members and assign tickets in a group"}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Pending members first, then paid */}
            {memberStatuses
              .sort((a, b) => (a.paidToday === b.paidToday ? 0 : a.paidToday ? 1 : -1))
              .map((status) => {
                const group = groups.find((g) => g.id === status.ticket?.groupId);
                return (
                  <Card
                    key={`${status.member.id}-${status.ticket?.id || "noticket"}`}
                    className={`border transition-all ${
                      status.paidToday
                        ? "border-green-200 bg-green-50/30"
                        : "border-orange-200/50 bg-white hover:border-orange-300"
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        {/* Left: Status + Info */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Check circle */}
                          <div
                            className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                              status.paidToday
                                ? "bg-green-500 text-white"
                                : "bg-orange-100 text-orange-400 border-2 border-dashed border-orange-300"
                            }`}
                          >
                            {status.paidToday ? (
                              <Check className="h-5 w-5" />
                            ) : (
                              <Clock className="h-4 w-4" />
                            )}
                          </div>

                          {/* Member Info */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`font-semibold truncate ${status.paidToday ? "text-green-800" : ""}`}>
                                {status.member.name}
                              </p>
                              {status.ticket && (
                                <Badge variant="outline" className="shrink-0 text-xs">
                                  #{status.ticket.ticketNumber}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {group && (
                                <span className="text-xs text-muted-foreground">{group.name}</span>
                              )}
                              {status.paidToday && status.todayPayment && (
                                <Badge className="bg-green-100 text-green-700 text-xs">
                                  {formatCurrency(status.todayPayment.amount)}
                                </Badge>
                              )}
                              {!status.paidToday && status.outstanding > 0 && (
                                <span className="text-xs text-orange-600 font-medium">
                                  {isTE ? "బకాయి" : "Due"}: {formatCurrency(status.outstanding)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {!status.paidToday && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleQuickPay(status)}
                                className="bg-smk-green hover:bg-smk-green-light text-white"
                              >
                                <IndianRupee className="h-4 w-4 mr-1" />
                                {isTE ? "వసూలు" : "Pay"}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-green-600"
                                onClick={() => sendReminder(status)}
                              >
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {status.paidToday && (
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </>
        )}
      </div>

      {/* Quick Pay Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-smk-green">
              {isTE ? "చెల్లింపు నమోదు" : "Record Payment"}
            </DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4 mt-2">
              <div className="p-3 bg-smk-cream-dark rounded-lg">
                <p className="font-semibold text-lg">{selectedMember.member.name}</p>
                <p className="text-sm text-muted-foreground">{selectedMember.member.phone}</p>
                {selectedMember.ticket && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {isTE ? "టిక్కెట్" : "Ticket"} #{selectedMember.ticket.ticketNumber} —{" "}
                    {groups.find((g) => g.id === selectedMember.ticket?.groupId)?.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="font-semibold">{isTE ? "మొత్తం (₹)" : "Amount (₹)"}</Label>
                <Input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="text-xl font-bold text-center h-14"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label>{isTE ? "గమనికలు" : "Notes"}</Label>
                <Textarea
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  rows={2}
                  placeholder={isTE ? "ఐచ్ఛికం..." : "Optional..."}
                />
              </div>

              <Button
                onClick={submitPayment}
                disabled={submitting || !payAmount}
                className="w-full h-12 bg-smk-green hover:bg-smk-green-light text-white text-lg"
              >
                {submitting ? "..." : (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    {isTE ? "నమోదు చేయి" : "Confirm Payment"}
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
