"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, IndianRupee, Receipt, Download } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  collection,
  getDocs,
  Timestamp,
  addDoc,
  query,
  orderBy,
  where,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  COLLECTIONS,
  formatCurrency,
  generateReceiptNumber,
  type Payment,
  type ChitGroup,
  type Member,
  type Ticket,
} from "@/lib/firestore";
import { toast } from "sonner";

const paymentSchema = z.object({
  groupId: z.string().min(1, "Select a group"),
  memberId: z.string().min(1, "Select a member"),
  ticketId: z.string().optional().default(""),
  auctionMonth: z.coerce.number().min(1).optional().default(1),
  amount: z.coerce.number().min(1, "Amount must be at least ₹1"),
  collectionType: z.enum(["daily", "weekly", "monthly"]),
  notes: z.string().optional().default(""),
});

type PaymentFormData = {
  groupId: string;
  memberId: string;
  ticketId: string;
  auctionMonth: number;
  amount: number;
  collectionType: "daily" | "weekly" | "monthly";
  notes: string;
};

export default function CollectionsPage() {
  const pathname = usePathname();
  const lang = pathname.split("/")[1] || "en";
  const isTE = lang === "te";

  const [payments, setPayments] = useState<(Payment & { id: string })[]>([]);
  const [groups, setGroups] = useState<(ChitGroup & { id: string })[]>([]);
  const [members, setMembers] = useState<(Member & { id: string })[]>([]);
  const [tickets, setTickets] = useState<(Ticket & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema) as any,
    defaultValues: { collectionType: "monthly", auctionMonth: 1 },
  });

  const fetchData = async () => {
    try {
      const [paymentsSnap, groupsSnap, membersSnap, ticketsSnap] = await Promise.all([
        getDocs(query(collection(db, COLLECTIONS.PAYMENTS), orderBy("createdAt", "desc"), limit(50))),
        getDocs(query(collection(db, COLLECTIONS.CHIT_GROUPS), where("status", "==", "active"))),
        getDocs(collection(db, COLLECTIONS.MEMBERS)),
        getDocs(collection(db, COLLECTIONS.TICKETS)),
      ]);

      setPayments(paymentsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as (Payment & { id: string })[]);
      setGroups(groupsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as (ChitGroup & { id: string })[]);
      setMembers(membersSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as (Member & { id: string })[]);
      setTickets(ticketsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as (Ticket & { id: string })[]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const groupMembers = selectedGroupId
    ? tickets
        .filter((t) => t.groupId === selectedGroupId)
        .map((t) => {
          const member = members.find((m) => m.id === t.memberId);
          return { ticket: t, member };
        })
        .filter((item) => item.member)
    : members.map((m) => ({ ticket: null, member: m }));

  const getMemberName = (memberId: string) => members.find((m) => m.id === memberId)?.name || "Unknown";
  const getGroupName = (groupId: string) => groups.find((g) => g.id === groupId)?.name || "Unknown";

  const onSubmit = async (data: PaymentFormData) => {
    try {
      const receiptNumber = generateReceiptNumber();

      await addDoc(collection(db, COLLECTIONS.PAYMENTS), {
        ...data,
        receiptNumber,
        paymentDate: Timestamp.now(),
        createdAt: Timestamp.now(),
      });

      toast.success(
        isTE
          ? `చెల్లింపు నమోదు! రసీదు: ${receiptNumber}`
          : `Payment recorded! Receipt: ${receiptNumber}`
      );
      reset();
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(isTE ? "ఎర్రర్ వచ్చింది" : "An error occurred");
      console.error(error);
    }
  };

  const collectionTypeLabel = (type: string) => {
    if (isTE) {
      switch (type) {
        case "daily": return "రోజువారీ";
        case "weekly": return "వారం వారీ";
        case "monthly": return "నెలవారీ";
      }
    }
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-smk-green">
            {isTE ? "వసూళ్లు" : "Collections"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isTE ? "చెల్లింపులు నమోదు చేయండి" : "Record and track payments"}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) reset(); }}>
          <DialogTrigger asChild>
            <Button className="bg-smk-green hover:bg-smk-green-light text-white">
              <Plus className="h-4 w-4 mr-2" />
              {isTE ? "చెల్లింపు నమోదు" : "Record Payment"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-smk-green">
                {isTE ? "చెల్లింపు నమోదు చేయి" : "Record Payment"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>{isTE ? "గ్రూప్ ఎంచుకోండి" : "Select Group"} *</Label>
                <Controller
                  control={control}
                  name="groupId"
                  render={({ field }) => (
                    <Select onValueChange={(val) => { field.onChange(val); setSelectedGroupId(val); }} value={field.value}>
                      <SelectTrigger><SelectValue placeholder={isTE ? "గ్రూప్..." : "Select group..."} /></SelectTrigger>
                      <SelectContent>
                        {groups.map((g) => (
                          <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>{isTE ? "సభ్యుడిని ఎంచుకోండి" : "Select Member"} *</Label>
                <Controller
                  control={control}
                  name="memberId"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger><SelectValue placeholder={isTE ? "సభ్యుడు..." : "Select member..."} /></SelectTrigger>
                      <SelectContent>
                        {groupMembers.map((item, idx) => (
                          <SelectItem key={item.member!.id || idx} value={item.member!.id!}>
                            {item.member!.name}
                            {item.ticket ? ` (#${item.ticket.ticketNumber})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{isTE ? "మొత్తం (₹)" : "Amount (₹)"} *</Label>
                  <Input {...register("amount")} type="number" placeholder="5000" />
                  {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>{isTE ? "నెల" : "Month"}</Label>
                  <Input {...register("auctionMonth")} type="number" min={1} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{isTE ? "వసూలు రకం" : "Collection Type"}</Label>
                <Controller
                  control={control}
                  name="collectionType"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">{isTE ? "రోజువారీ" : "Daily"}</SelectItem>
                        <SelectItem value="weekly">{isTE ? "వారం వారీ" : "Weekly"}</SelectItem>
                        <SelectItem value="monthly">{isTE ? "నెలవారీ" : "Monthly"}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>{isTE ? "గమనికలు" : "Notes"}</Label>
                <Textarea {...register("notes")} rows={2} />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full bg-smk-green hover:bg-smk-green-light text-white">
                {isSubmitting ? "..." : isTE ? "చెల్లింపు నమోదు చేయి" : "Record Payment"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Payments Table */}
      <Card className="border-smk-gold/10 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-smk-green">
            {isTE ? "ఇటీవలి చెల్లింపులు" : "Recent Payments"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">{isTE ? "లోడ్ అవుతోంది..." : "Loading..."}</div>
          ) : payments.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <IndianRupee className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">{isTE ? "ఇంకా చెల్లింపులు లేవు" : "No payments yet"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-smk-cream-dark/50">
                    <TableHead>{isTE ? "రసీదు" : "Receipt"}</TableHead>
                    <TableHead>{isTE ? "సభ్యుడు" : "Member"}</TableHead>
                    <TableHead>{isTE ? "గ్రూప్" : "Group"}</TableHead>
                    <TableHead>{isTE ? "రకం" : "Type"}</TableHead>
                    <TableHead className="text-right">{isTE ? "మొత్తం" : "Amount"}</TableHead>
                    <TableHead>{isTE ? "తేదీ" : "Date"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id} className="hover:bg-smk-gold/5">
                      <TableCell>
                        <span className="font-mono text-xs">{payment.receiptNumber}</span>
                      </TableCell>
                      <TableCell className="font-medium">{getMemberName(payment.memberId)}</TableCell>
                      <TableCell className="text-muted-foreground">{getGroupName(payment.groupId)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {collectionTypeLabel(payment.collectionType)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-700">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {payment.paymentDate?.toDate?.()
                          ? new Date(payment.paymentDate.toDate()).toLocaleDateString("en-IN")
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
