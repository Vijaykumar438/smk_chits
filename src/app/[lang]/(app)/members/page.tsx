"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Search, Edit, Trash2, MessageCircle, Phone, User } from "lucide-react";
import { useForm } from "react-hook-form";
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
import { COLLECTIONS, getWhatsAppUrl, type Member } from "@/lib/firestore";
import { toast } from "sonner";

const memberSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  nameTE: z.string().optional().default(""),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  address: z.string().optional().default(""),
  idProof: z.string().optional().default(""),
  guarantorName: z.string().optional().default(""),
  guarantorPhone: z.string().optional().default(""),
});

type MemberFormData = z.infer<typeof memberSchema>;

export default function MembersPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lang = pathname.split("/")[1] || "en";
  const isTE = lang === "te";

  const [members, setMembers] = useState<(Member & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(searchParams.get("action") === "add");
  const [editingMember, setEditingMember] = useState<(Member & { id: string }) | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema) as any,
  });

  const fetchMembers = async () => {
    try {
      const snap = await getDocs(
        query(collection(db, COLLECTIONS.MEMBERS), orderBy("createdAt", "desc"))
      );
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as (Member & {
        id: string;
      })[];
      setMembers(data);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const onSubmit = async (data: MemberFormData) => {
    try {
      if (editingMember) {
        await updateDoc(doc(db, COLLECTIONS.MEMBERS, editingMember.id), {
          ...data,
          updatedAt: Timestamp.now(),
        });
        toast.success(isTE ? "సభ్యుడు అప్‌డేట్ చేయబడ్డారు" : "Member updated successfully");
      } else {
        await addDoc(collection(db, COLLECTIONS.MEMBERS), {
          ...data,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        toast.success(isTE ? "సభ్యుడు చేర్చబడ్డారు" : "Member added successfully");
      }
      reset();
      setEditingMember(null);
      setDialogOpen(false);
      fetchMembers();
    } catch (error) {
      toast.error(isTE ? "ఎర్రర్ వచ్చింది" : "An error occurred");
      console.error(error);
    }
  };

  const handleEdit = (member: Member & { id: string }) => {
    setEditingMember(member);
    setValue("name", member.name);
    setValue("nameTE", member.nameTE || "");
    setValue("phone", member.phone);
    setValue("address", member.address || "");
    setValue("idProof", member.idProof || "");
    setValue("guarantorName", member.guarantorName || "");
    setValue("guarantorPhone", member.guarantorPhone || "");
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isTE ? "ఈ సభ్యుడిని తొలగించాలా?" : "Delete this member?")) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.MEMBERS, id));
      toast.success(isTE ? "సభ్యుడు తొలగించబడ్డారు" : "Member deleted");
      fetchMembers();
    } catch (error) {
      toast.error(isTE ? "ఎర్రర్ వచ్చింది" : "An error occurred");
    }
  };

  const handleWhatsApp = (member: Member & { id: string }) => {
    const message = isTE
      ? `నమస్కారం ${member.name} గారు, మీ చిట్ చెల్లింపు పెండింగ్ లో ఉంది. దయచేసి త్వరగా చెల్లించండి. — ఎస్ఎంకె చిట్స్`
      : `Dear ${member.name}, your chit payment is pending. Please pay at the earliest. — SMK Chits`;
    window.open(getWhatsAppUrl(member.phone, message), "_blank");
  };

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.nameTE?.includes(searchTerm) ||
      m.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-smk-green">
            {isTE ? "సభ్యులు" : "Members"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isTE
              ? `మొత్తం ${members.length} సభ్యులు`
              : `${members.length} total members`}
          </p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingMember(null);
              reset();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-smk-green hover:bg-smk-green-light text-white">
              <Plus className="h-4 w-4 mr-2" />
              {isTE ? "సభ్యుడిని చేర్చు" : "Add Member"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-smk-green">
                {editingMember
                  ? isTE
                    ? "సభ్యుడిని మార్చు"
                    : "Edit Member"
                  : isTE
                  ? "సభ్యుడిని చేర్చు"
                  : "Add Member"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>{isTE ? "సభ్యుడి పేరు" : "Member Name"} *</Label>
                <Input {...register("name")} placeholder="e.g., Ramesh Kumar" />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>{isTE ? "పేరు (తెలుగు)" : "Name (Telugu)"}</Label>
                <Input {...register("nameTE")} placeholder="ఉదా: రమేష్ కుమార్" />
              </div>
              <div className="space-y-2">
                <Label>{isTE ? "ఫోన్ నంబర్" : "Phone Number"} *</Label>
                <Input {...register("phone")} placeholder="9876543210" type="tel" />
                {errors.phone && (
                  <p className="text-xs text-red-500">{errors.phone.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>{isTE ? "చిరునామా" : "Address"}</Label>
                <Textarea {...register("address")} placeholder="Full address" rows={2} />
              </div>
              <div className="space-y-2">
                <Label>{isTE ? "ఐడి ప్రూఫ్ నంబర్" : "ID Proof Number"}</Label>
                <Input {...register("idProof")} placeholder="Aadhaar / PAN" />
              </div>
              <div className="space-y-2">
                <Label>{isTE ? "గ్యారంటర్ పేరు" : "Guarantor Name"}</Label>
                <Input {...register("guarantorName")} placeholder="Guarantor name" />
              </div>
              <div className="space-y-2">
                <Label>{isTE ? "గ్యారంటర్ ఫోన్" : "Guarantor Phone"}</Label>
                <Input {...register("guarantorPhone")} placeholder="9876543210" type="tel" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-smk-green hover:bg-smk-green-light text-white"
                >
                  {isSubmitting
                    ? "..."
                    : editingMember
                    ? isTE
                      ? "అప్‌డేట్"
                      : "Update"
                    : isTE
                    ? "చేర్చు"
                    : "Add Member"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    setEditingMember(null);
                    reset();
                  }}
                >
                  {isTE ? "రద్దు" : "Cancel"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={isTE ? "పేరు లేదా ఫోన్ నంబర్ వెతకండి..." : "Search by name or phone..."}
          className="pl-10 border-smk-gold/20"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Members List */}
      <Card className="border-smk-gold/10 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              {isTE ? "లోడ్ అవుతోంది..." : "Loading..."}
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{isTE ? "సభ్యులు కనుగొనబడలేదు" : "No members found"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-smk-cream-dark/50">
                    <TableHead>{isTE ? "పేరు" : "Name"}</TableHead>
                    <TableHead>{isTE ? "ఫోన్" : "Phone"}</TableHead>
                    <TableHead className="hidden md:table-cell">
                      {isTE ? "గ్యారంటర్" : "Guarantor"}
                    </TableHead>
                    <TableHead className="text-right">{isTE ? "చర్యలు" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id} className="hover:bg-smk-gold/5">
                      <TableCell>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          {member.nameTE && (
                            <p className="text-xs text-muted-foreground">{member.nameTE}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <a
                          href={`tel:${member.phone}`}
                          className="flex items-center gap-1 text-sm text-smk-green hover:underline"
                        >
                          <Phone className="h-3 w-3" />
                          {member.phone}
                        </a>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {member.guarantorName || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600 hover:bg-green-50"
                            onClick={() => handleWhatsApp(member)}
                            title="WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-smk-green hover:bg-smk-gold/10"
                            onClick={() => handleEdit(member)}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:bg-red-50"
                            onClick={() => handleDelete(member.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
