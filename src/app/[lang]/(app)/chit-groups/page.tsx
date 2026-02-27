"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Landmark, Calendar, Users, IndianRupee, Edit, Trash2 } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  Timestamp,
  addDoc,
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS, formatCurrency, type ChitGroup } from "@/lib/firestore";
import { toast } from "sonner";

const groupSchema = z.object({
  name: z.string().min(2, "Group name is required"),
  chitValue: z.coerce.number().min(1000, "Minimum ₹1,000"),
  monthlyInstallment: z.coerce.number().min(100, "Minimum ₹100"),
  memberCount: z.coerce.number().min(2, "Minimum 2 members"),
  duration: z.coerce.number().min(2, "Minimum 2 months"),
  startDate: z.string().min(1, "Start date is required"),
  auctionDay: z.coerce.number().min(1).max(31, "1-31"),
  foremanCommissionPercent: z.coerce.number().min(0).max(5, "Max 5%"),
  status: z.enum(["active", "completed", "upcoming"]),
});

type GroupFormData = {
  name: string;
  chitValue: number;
  monthlyInstallment: number;
  memberCount: number;
  duration: number;
  startDate: string;
  auctionDay: number;
  foremanCommissionPercent: number;
  status: "active" | "completed" | "upcoming";
};

export default function ChitGroupsPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lang = pathname.split("/")[1] || "en";
  const isTE = lang === "te";

  const [groups, setGroups] = useState<(ChitGroup & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(searchParams.get("action") === "add");
  const [editingGroup, setEditingGroup] = useState<(ChitGroup & { id: string }) | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema) as any,
    defaultValues: {
      foremanCommissionPercent: 5,
      status: "active",
      auctionDay: 1,
    },
  });

  // Auto-calculate monthly installment = chitValue / memberCount
  const watchChitValue = watch("chitValue");
  const watchMemberCount = watch("memberCount");

  useEffect(() => {
    if (watchChitValue && watchMemberCount && watchMemberCount > 0) {
      const calculated = Math.round(watchChitValue / watchMemberCount);
      setValue("monthlyInstallment", calculated);
    }
  }, [watchChitValue, watchMemberCount, setValue]);

  const fetchGroups = async () => {
    try {
      const snap = await getDocs(
        query(collection(db, COLLECTIONS.CHIT_GROUPS), orderBy("createdAt", "desc"))
      );
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as (ChitGroup & {
        id: string;
      })[];
      setGroups(data);
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const onSubmit = async (data: GroupFormData) => {
    try {
      const payload = {
        ...data,
        startDate: Timestamp.fromDate(new Date(data.startDate)),
      };

      if (editingGroup) {
        await updateDoc(doc(db, COLLECTIONS.CHIT_GROUPS, editingGroup.id), {
          ...payload,
          updatedAt: Timestamp.now(),
        });
        toast.success(isTE ? "గ్రూప్ అప్‌డేట్ చేయబడింది" : "Group updated successfully");
      } else {
        await addDoc(collection(db, COLLECTIONS.CHIT_GROUPS), {
          ...payload,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        toast.success(isTE ? "గ్రూప్ సృష్టించబడింది" : "Group created successfully");
      }
      reset();
      setEditingGroup(null);
      setDialogOpen(false);
      fetchGroups();
    } catch (error) {
      toast.error(isTE ? "ఎర్రర్ వచ్చింది" : "An error occurred");
      console.error(error);
    }
  };

  const handleEdit = (group: ChitGroup & { id: string }) => {
    setEditingGroup(group);
    setValue("name", group.name);
    setValue("chitValue", group.chitValue);
    setValue("monthlyInstallment", group.monthlyInstallment);
    setValue("memberCount", group.memberCount);
    setValue("duration", group.duration);
    setValue("auctionDay", group.auctionDay);
    setValue("foremanCommissionPercent", group.foremanCommissionPercent);
    setValue("status", group.status);
    if (group.startDate?.toDate) {
      setValue("startDate", group.startDate.toDate().toISOString().split("T")[0]);
    }
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isTE ? "ఈ గ్రూప్ ను తొలగించాలా?" : "Delete this group?")) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.CHIT_GROUPS, id));
      toast.success(isTE ? "గ్రూప్ తొలగించబడింది" : "Group deleted");
      fetchGroups();
    } catch (error) {
      toast.error(isTE ? "ఎర్రర్ వచ్చింది" : "An error occurred");
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-50 text-green-700 border-green-200";
      case "completed":
        return "bg-gray-50 text-gray-700 border-gray-200";
      case "upcoming":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-smk-green">
            {isTE ? "చిట్ గ్రూపులు" : "Chit Groups"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isTE
              ? `మొత్తం ${groups.length} గ్రూపులు`
              : `${groups.length} total groups`}
          </p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingGroup(null);
              reset();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-smk-green hover:bg-smk-green-light text-white">
              <Plus className="h-4 w-4 mr-2" />
              {isTE ? "గ్రూప్ సృష్టించు" : "Create Group"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-smk-green">
                {editingGroup
                  ? isTE ? "గ్రూప్ మార్చు" : "Edit Group"
                  : isTE ? "కొత్త చిట్ గ్రూప్" : "New Chit Group"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>{isTE ? "గ్రూప్ పేరు" : "Group Name"} *</Label>
                <Input {...register("name")} placeholder="e.g., Gold Chit 2026" />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{isTE ? "చిట్ విలువ (₹)" : "Chit Value (₹)"} *</Label>
                  <Input {...register("chitValue")} type="number" placeholder="100000" />
                  {errors.chitValue && (
                    <p className="text-xs text-red-500">{errors.chitValue.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{isTE ? "నెలవారీ వాయిదా (₹)" : "Monthly (₹)"} *</Label>
                  <Input {...register("monthlyInstallment")} type="number" placeholder="5000" />
                  {errors.monthlyInstallment && (
                    <p className="text-xs text-red-500">{errors.monthlyInstallment.message}</p>
                  )}
                  {watchChitValue > 0 && watchMemberCount > 0 && (
                    <p className="text-xs text-smk-green">
                      {isTE ? "ఆటో:" : "Auto:"} {formatCurrency(Math.round(watchChitValue / watchMemberCount))}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{isTE ? "సభ్యుల సంఖ్య" : "Members"} *</Label>
                  <Input {...register("memberCount")} type="number" placeholder="20" />
                  {errors.memberCount && (
                    <p className="text-xs text-red-500">{errors.memberCount.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{isTE ? "కాలవ్యవధి (నెలలు)" : "Duration (Months)"} *</Label>
                  <Input {...register("duration")} type="number" placeholder="20" />
                  {errors.duration && (
                    <p className="text-xs text-red-500">{errors.duration.message}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{isTE ? "ప్రారంభ తేదీ" : "Start Date"} *</Label>
                  <Input {...register("startDate")} type="date" />
                  {errors.startDate && (
                    <p className="text-xs text-red-500">{errors.startDate.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{isTE ? "వేలం తేదీ" : "Auction Day"}</Label>
                  <Input {...register("auctionDay")} type="number" min={1} max={31} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{isTE ? "కమీషన్ (%)" : "Commission (%)"}</Label>
                  <Input
                    {...register("foremanCommissionPercent")}
                    type="number"
                    step="0.5"
                    max={5}
                  />
                  {errors.foremanCommissionPercent && (
                    <p className="text-xs text-red-500">
                      {isTE ? "గరిష్టం 5%" : "Max 5%"}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{isTE ? "స్థితి" : "Status"}</Label>
                  <Controller
                    control={control}
                    name="status"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">
                            {isTE ? "యాక్టివ్" : "Active"}
                          </SelectItem>
                          <SelectItem value="upcoming">
                            {isTE ? "రాబోతోంది" : "Upcoming"}
                          </SelectItem>
                          <SelectItem value="completed">
                            {isTE ? "పూర్తయింది" : "Completed"}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-smk-green hover:bg-smk-green-light text-white"
                >
                  {isSubmitting
                    ? "..."
                    : editingGroup
                    ? isTE ? "అప్‌డేట్" : "Update"
                    : isTE ? "సృష్టించు" : "Create Group"}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); setEditingGroup(null); reset(); }}>
                  {isTE ? "రద్దు" : "Cancel"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="border-smk-gold/10">
              <CardContent className="p-6">
                <div className="h-32 animate-pulse bg-muted/50 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <Card className="border-smk-gold/10">
          <CardContent className="p-12 text-center text-muted-foreground">
            <Landmark className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">{isTE ? "ఇంకా గ్రూపులు లేవు" : "No chit groups yet"}</p>
            <p className="text-sm mt-1">{isTE ? "మొదటి గ్రూప్ సృష్టించండి" : "Create your first chit group to get started"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <Card key={group.id} className="border-smk-gold/10 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg text-smk-green">{group.name}</CardTitle>
                    <Badge variant="outline" className={`mt-1 ${statusColor(group.status)}`}>
                      {group.status === "active"
                        ? isTE ? "యాక్టివ్" : "Active"
                        : group.status === "completed"
                        ? isTE ? "పూర్తయింది" : "Completed"
                        : isTE ? "రాబోతోంది" : "Upcoming"}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(group)}>
                      <Edit className="h-4 w-4 text-smk-green" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(group.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <IndianRupee className="h-4 w-4" />
                    <span>{isTE ? "చిట్ విలువ" : "Value"}</span>
                  </div>
                  <p className="font-semibold text-right">{formatCurrency(group.chitValue)}</p>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <IndianRupee className="h-4 w-4" />
                    <span>{isTE ? "నెలవారీ" : "Monthly"}</span>
                  </div>
                  <p className="font-semibold text-right">{formatCurrency(group.monthlyInstallment)}</p>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{isTE ? "సభ్యులు" : "Members"}</span>
                  </div>
                  <p className="font-semibold text-right">{group.memberCount}</p>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{isTE ? "కాలం" : "Duration"}</span>
                  </div>
                  <p className="font-semibold text-right">{group.duration} {isTE ? "నెలలు" : "months"}</p>
                </div>
                <div className="pt-2 border-t border-smk-gold/10 text-xs text-muted-foreground">
                  {isTE ? "కమీషన్" : "Commission"}: {group.foremanCommissionPercent}% •{" "}
                  {isTE ? "వేలం రోజు" : "Auction Day"}: {group.auctionDay}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
