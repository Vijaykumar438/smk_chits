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
import { Plus, Gavel } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  collection,
  getDocs,
  doc,
  Timestamp,
  addDoc,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  COLLECTIONS,
  formatCurrency,
  type Auction,
  type ChitGroup,
  type Member,
  type Ticket,
} from "@/lib/firestore";
import { toast } from "sonner";

const auctionSchema = z.object({
  groupId: z.string().min(1, "Select a group"),
  monthNumber: z.coerce.number().min(1),
  winnerTicketId: z.string().min(1, "Select a winner"),
  winnerMemberId: z.string().min(1),
  bidAmount: z.coerce.number().min(0),
  notes: z.string().optional().default(""),
});

type AuctionFormData = {
  groupId: string;
  monthNumber: number;
  winnerTicketId: string;
  winnerMemberId: string;
  bidAmount: number;
  notes: string;
};

export default function AuctionsPage() {
  const pathname = usePathname();
  const lang = pathname.split("/")[1] || "en";
  const isTE = lang === "te";

  const [auctions, setAuctions] = useState<(Auction & { id: string })[]>([]);
  const [groups, setGroups] = useState<(ChitGroup & { id: string })[]>([]);
  const [tickets, setTickets] = useState<(Ticket & { id: string })[]>([]);
  const [members, setMembers] = useState<(Member & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [calculatedValues, setCalculatedValues] = useState({
    discount: 0,
    commission: 0,
    dividend: 0,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AuctionFormData>({
    resolver: zodResolver(auctionSchema) as any,
  });

  const watchGroupId = watch("groupId");
  const watchBidAmount = watch("bidAmount");

  const fetchData = async () => {
    try {
      const [auctionsSnap, groupsSnap, membersSnap, ticketsSnap] = await Promise.all([
        getDocs(query(collection(db, COLLECTIONS.AUCTIONS), orderBy("createdAt", "desc"))),
        getDocs(query(collection(db, COLLECTIONS.CHIT_GROUPS), where("status", "==", "active"))),
        getDocs(collection(db, COLLECTIONS.MEMBERS)),
        getDocs(collection(db, COLLECTIONS.TICKETS)),
      ]);

      setAuctions(auctionsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as (Auction & { id: string })[]);
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

  // Auto-calculate when bid amount or group changes
  useEffect(() => {
    if (watchGroupId && watchBidAmount) {
      const group = groups.find((g) => g.id === watchGroupId);
      if (group) {
        const discount = group.chitValue - watchBidAmount;
        const commission = (discount * group.foremanCommissionPercent) / 100;
        const dividend = group.memberCount > 0 ? (discount - commission) / group.memberCount : 0;
        setCalculatedValues({
          discount: Math.max(0, discount),
          commission: Math.max(0, commission),
          dividend: Math.max(0, dividend),
        });
      }
    }
  }, [watchGroupId, watchBidAmount, groups]);

  const groupTickets = tickets.filter((t) => t.groupId === selectedGroupId && t.status === "active");

  const getMemberName = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    return member ? member.name : "Unknown";
  };

  const getGroupName = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    return group ? group.name : "Unknown";
  };

  const onSubmit = async (data: AuctionFormData) => {
    try {
      const group = groups.find((g) => g.id === data.groupId);
      if (!group) return;

      const discount = group.chitValue - data.bidAmount;
      const foremanCommission = (discount * group.foremanCommissionPercent) / 100;
      const dividendPerMember = (discount - foremanCommission) / group.memberCount;

      await addDoc(collection(db, COLLECTIONS.AUCTIONS), {
        ...data,
        discount,
        foremanCommission,
        dividendPerMember,
        date: Timestamp.now(),
        createdAt: Timestamp.now(),
      });

      toast.success(isTE ? "వేలం నమోదు చేయబడింది" : "Auction recorded successfully");
      reset();
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(isTE ? "ఎర్రర్ వచ్చింది" : "An error occurred");
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-smk-green">
            {isTE ? "వేలం" : "Auctions"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isTE ? `మొత్తం ${auctions.length} వేలాలు` : `${auctions.length} total auctions`}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) reset(); }}>
          <DialogTrigger asChild>
            <Button className="bg-smk-green hover:bg-smk-green-light text-white">
              <Plus className="h-4 w-4 mr-2" />
              {isTE ? "వేలం నమోదు" : "Record Auction"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-smk-green">
                {isTE ? "వేలం నమోదు చేయి" : "Record Auction"}
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
                          <SelectItem key={g.id} value={g.id}>{g.name} — {formatCurrency(g.chitValue)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>{isTE ? "నెల సంఖ్య" : "Month Number"} *</Label>
                <Input {...register("monthNumber")} type="number" min={1} />
              </div>
              <div className="space-y-2">
                <Label>{isTE ? "విజేతను ఎంచుకోండి" : "Select Winner"} *</Label>
                <Controller
                  control={control}
                  name="winnerTicketId"
                  render={({ field }) => (
                    <Select onValueChange={(val) => {
                      field.onChange(val);
                      const ticket = tickets.find((t) => t.id === val);
                      if (ticket) setValue("winnerMemberId", ticket.memberId);
                    }} value={field.value}>
                      <SelectTrigger><SelectValue placeholder={isTE ? "విజేత..." : "Select winner..."} /></SelectTrigger>
                      <SelectContent>
                        {groupTickets.length > 0 ? groupTickets.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            #{t.ticketNumber} — {getMemberName(t.memberId)}
                          </SelectItem>
                        )) : (
                          <SelectItem value="__none" disabled>
                            {isTE ? "టికెట్లు లేవు" : "No tickets in this group"}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
                <input type="hidden" {...register("winnerMemberId")} />
              </div>
              <div className="space-y-2">
                <Label>{isTE ? "బిడ్ మొత్తం (₹)" : "Bid Amount (₹)"} *</Label>
                <Input {...register("bidAmount")} type="number" placeholder="80000" />
              </div>

              {/* Auto-calculated values */}
              {watchBidAmount > 0 && watchGroupId && (
                <div className="bg-smk-cream-dark rounded-lg p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isTE ? "తగ్గింపు" : "Discount"}</span>
                    <span className="font-semibold">{formatCurrency(calculatedValues.discount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isTE ? "కమీషన్" : "Commission"}</span>
                    <span className="font-semibold text-smk-green">{formatCurrency(calculatedValues.commission)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-muted-foreground">{isTE ? "సభ్యుడికి లాభాంశం" : "Dividend/Member"}</span>
                    <span className="font-semibold text-smk-gold-dark">{formatCurrency(calculatedValues.dividend)}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>{isTE ? "గమనికలు" : "Notes"}</Label>
                <Textarea {...register("notes")} rows={2} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={isSubmitting} className="flex-1 bg-smk-green hover:bg-smk-green-light text-white">
                  {isSubmitting ? "..." : isTE ? "నమోదు చేయి" : "Record Auction"}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); reset(); }}>
                  {isTE ? "రద్దు" : "Cancel"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Auctions Table */}
      <Card className="border-smk-gold/10 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">{isTE ? "లోడ్ అవుతోంది..." : "Loading..."}</div>
          ) : auctions.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Gavel className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">{isTE ? "ఇంకా వేలాలు లేవు" : "No auctions yet"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-smk-cream-dark/50">
                    <TableHead>{isTE ? "గ్రూప్" : "Group"}</TableHead>
                    <TableHead>{isTE ? "నెల" : "Month"}</TableHead>
                    <TableHead>{isTE ? "విజేత" : "Winner"}</TableHead>
                    <TableHead className="text-right">{isTE ? "బిడ్" : "Bid"}</TableHead>
                    <TableHead className="text-right">{isTE ? "లాభాంశం" : "Dividend"}</TableHead>
                    <TableHead className="text-right">{isTE ? "కమీషన్" : "Commission"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auctions.map((auction) => (
                    <TableRow key={auction.id} className="hover:bg-smk-gold/5">
                      <TableCell className="font-medium">{getGroupName(auction.groupId)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{auction.monthNumber}</Badge>
                      </TableCell>
                      <TableCell>{getMemberName(auction.winnerMemberId)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(auction.bidAmount)}</TableCell>
                      <TableCell className="text-right text-smk-gold-dark">{formatCurrency(auction.dividendPerMember)}</TableCell>
                      <TableCell className="text-right text-smk-green">{formatCurrency(auction.foremanCommission)}</TableCell>
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
