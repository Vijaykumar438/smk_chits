"use client";

import React, { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Settings as SettingsIcon,
  Download,
  Upload,
  FileJson,
  FileSpreadsheet,
  Check,
  AlertCircle,
} from "lucide-react";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
  Timestamp,
  addDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS, type AppSettings, type Member } from "@/lib/firestore";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const DEFAULT_SETTINGS: AppSettings = {
  whatsappTemplateEN:
    "Dear {name}, your chit payment of ₹{amount} for {group} is pending. Please pay at the earliest. — SMK Chits",
  whatsappTemplateTE:
    "నమస్కారం {name} గారు, మీ {group} చిట్ చెల్లింపు ₹{amount} పెండింగ్ లో ఉంది. దయచేసి త్వరగా చెల్లించండి. — ఎస్ఎంకె చిట్స్",
  defaultForemanCommission: 5,
  businessName: "SMK Chits",
  businessPhone: "",
  businessAddress: "",
};

export default function SettingsPage() {
  const pathname = usePathname();
  const lang = pathname.split("/")[1] || "en";
  const isTE = lang === "te";

  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [importPreview, setImportPreview] = useState<Record<string, string>[] | null>(null);
  const [importType, setImportType] = useState<"members" | "payments">("members");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const docSnap = await getDoc(doc(db, COLLECTIONS.SETTINGS, "app"));
        if (docSnap.exists()) {
          setSettings({ ...DEFAULT_SETTINGS, ...docSnap.data() } as AppSettings);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    }
    loadSettings();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, COLLECTIONS.SETTINGS, "app"), {
        ...settings,
        updatedAt: Timestamp.now(),
      });
      toast.success(isTE ? "సెట్టింగ్‌లు సేవ్ చేయబడ్డాయి" : "Settings saved");
    } catch (error) {
      toast.error(isTE ? "ఎర్రర్ వచ్చింది" : "Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  // ─── Export Functions ──────────────────────────────────────
  const exportCollection = async (collectionName: string, filename: string) => {
    try {
      const snap = await getDocs(collection(db, collectionName));
      const data = snap.docs.map((d) => {
        const docData = d.data();
        const processed: Record<string, unknown> = { id: d.id };
        for (const [key, value] of Object.entries(docData)) {
          if (value instanceof Timestamp) {
            processed[key] = value.toDate().toISOString();
          } else {
            processed[key] = value;
          }
        }
        return processed;
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, collectionName);
      XLSX.writeFile(wb, `${filename}.xlsx`);
      toast.success(isTE ? "ఎక్స్‌పోర్ట్ విజయవంతం" : "Export successful");
    } catch (error) {
      toast.error(isTE ? "ఎక్స్‌పోర్ట్ విఫలం" : "Export failed");
    }
  };

  const exportAllJSON = async () => {
    try {
      const allData: Record<string, unknown[]> = {};
      for (const col of Object.values(COLLECTIONS)) {
        const snap = await getDocs(collection(db, col));
        allData[col] = snap.docs.map((d) => {
          const data = d.data();
          const processed: Record<string, unknown> = { id: d.id };
          for (const [key, value] of Object.entries(data)) {
            processed[key] = value instanceof Timestamp ? value.toDate().toISOString() : value;
          }
          return processed;
        });
      }

      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SMK-Chits-Backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(isTE ? "JSON బ్యాకప్ డౌన్‌లోడ్" : "JSON backup downloaded");
    } catch (error) {
      toast.error(isTE ? "బ్యాకప్ విఫలం" : "Backup failed");
    }
  };

  // ─── Import Functions ──────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);
        setImportPreview(jsonData);
        toast.success(
          isTE
            ? `${jsonData.length} రికార్డులు కనుగొనబడ్డాయి`
            : `${jsonData.length} records found`
        );
      } catch (error) {
        toast.error(isTE ? "ఫైల్ చదవడంలో ఎర్రర్" : "Error reading file");
      }
    };
    reader.readAsBinaryString(file);
  };

  const confirmImport = async () => {
    if (!importPreview) return;

    try {
      const collectionName =
        importType === "members" ? COLLECTIONS.MEMBERS : COLLECTIONS.PAYMENTS;
      let count = 0;

      for (const row of importPreview) {
        const docData: Record<string, unknown> = { ...row, createdAt: Timestamp.now(), updatedAt: Timestamp.now() };
        // Convert numeric fields
        if (importType === "payments" && docData.amount) {
          docData.amount = Number(docData.amount);
        }
        await addDoc(collection(db, collectionName), docData);
        count++;
      }

      toast.success(
        isTE
          ? `${count} రికార్డులు ఇంపోర్ట్ చేయబడ్డాయి`
          : `${count} records imported successfully`
      );
      setImportPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      toast.error(isTE ? "ఇంపోర్ట్ విఫలం" : "Import failed");
    }
  };

  const downloadSampleTemplate = (type: "members" | "payments") => {
    const sampleData =
      type === "members"
        ? [{ name: "Ramesh Kumar", nameTE: "రమేష్ కుమార్", phone: "9876543210", address: "Hyderabad", idProof: "ABCDE1234F", guarantorName: "Suresh", guarantorPhone: "9876543211" }]
        : [{ groupId: "group_id_here", memberId: "member_id_here", amount: "5000", collectionType: "monthly", auctionMonth: "1", notes: "" }];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, type);
    XLSX.writeFile(wb, `SMK-Sample-${type}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-smk-green">
        {isTE ? "సెట్టింగ్‌లు" : "Settings"}
      </h1>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="bg-smk-cream-dark">
          <TabsTrigger value="general">{isTE ? "సాధారణ" : "General"}</TabsTrigger>
          <TabsTrigger value="whatsapp">{isTE ? "WhatsApp" : "WhatsApp"}</TabsTrigger>
          <TabsTrigger value="data">{isTE ? "డేటా" : "Data"}</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card className="border-smk-gold/10">
            <CardHeader>
              <CardTitle className="text-lg text-smk-green">{isTE ? "వ్యాపార వివరాలు" : "Business Details"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isTE ? "వ్యాపార పేరు" : "Business Name"}</Label>
                  <Input value={settings.businessName} onChange={(e) => setSettings({ ...settings, businessName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{isTE ? "ఫోన్" : "Phone"}</Label>
                  <Input value={settings.businessPhone} onChange={(e) => setSettings({ ...settings, businessPhone: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{isTE ? "చిరునామా" : "Address"}</Label>
                <Textarea value={settings.businessAddress} onChange={(e) => setSettings({ ...settings, businessAddress: e.target.value })} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>{isTE ? "డిఫాల్ట్ కమీషన్ (%)" : "Default Commission (%)"}</Label>
                <Input type="number" max={5} step={0.5} value={settings.defaultForemanCommission} onChange={(e) => setSettings({ ...settings, defaultForemanCommission: Number(e.target.value) })} />
                <p className="text-xs text-muted-foreground">{isTE ? "గరిష్టం 5%" : "Maximum 5%"}</p>
              </div>
              <Button onClick={saveSettings} disabled={saving} className="bg-smk-green hover:bg-smk-green-light text-white">
                {saving ? "..." : isTE ? "సేవ్ చేయి" : "Save Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WhatsApp Templates */}
        <TabsContent value="whatsapp">
          <Card className="border-smk-gold/10">
            <CardHeader>
              <CardTitle className="text-lg text-smk-green">{isTE ? "WhatsApp టెంప్లేట్‌లు" : "WhatsApp Templates"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground bg-smk-cream-dark p-3 rounded">
                {isTE
                  ? "వాడగల వేరియబుల్స్: {name}, {amount}, {group}, {date}"
                  : "Available variables: {name}, {amount}, {group}, {date}"}
              </p>
              <div className="space-y-2">
                <Label>{isTE ? "ఆంగ్ల టెంప్లేట్" : "English Template"}</Label>
                <Textarea value={settings.whatsappTemplateEN} onChange={(e) => setSettings({ ...settings, whatsappTemplateEN: e.target.value })} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>{isTE ? "తెలుగు టెంప్లేట్" : "Telugu Template"}</Label>
                <Textarea value={settings.whatsappTemplateTE} onChange={(e) => setSettings({ ...settings, whatsappTemplateTE: e.target.value })} rows={3} />
              </div>
              <Button onClick={saveSettings} disabled={saving} className="bg-smk-green hover:bg-smk-green-light text-white">
                {saving ? "..." : isTE ? "సేవ్ చేయి" : "Save Templates"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Management */}
        <TabsContent value="data">
          <div className="space-y-4">
            {/* Export */}
            <Card className="border-smk-gold/10">
              <CardHeader>
                <CardTitle className="text-lg text-smk-green">{isTE ? "డేటా ఎక్స్‌పోర్ట్" : "Export Data"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button variant="outline" className="flex-col h-auto py-4 gap-2 border-smk-gold/20" onClick={() => exportCollection(COLLECTIONS.MEMBERS, "SMK-Members")}>
                    <FileSpreadsheet className="h-5 w-5 text-smk-green" />
                    <span className="text-xs">{isTE ? "సభ్యులు" : "Members"}</span>
                  </Button>
                  <Button variant="outline" className="flex-col h-auto py-4 gap-2 border-smk-gold/20" onClick={() => exportCollection(COLLECTIONS.PAYMENTS, "SMK-Payments")}>
                    <FileSpreadsheet className="h-5 w-5 text-smk-green" />
                    <span className="text-xs">{isTE ? "చెల్లింపులు" : "Payments"}</span>
                  </Button>
                  <Button variant="outline" className="flex-col h-auto py-4 gap-2 border-smk-gold/20" onClick={() => exportCollection(COLLECTIONS.CHIT_GROUPS, "SMK-Groups")}>
                    <FileSpreadsheet className="h-5 w-5 text-smk-green" />
                    <span className="text-xs">{isTE ? "గ్రూపులు" : "Groups"}</span>
                  </Button>
                  <Button variant="outline" className="flex-col h-auto py-4 gap-2 border-smk-gold/20" onClick={exportAllJSON}>
                    <FileJson className="h-5 w-5 text-smk-gold-dark" />
                    <span className="text-xs">{isTE ? "JSON బ్యాకప్" : "JSON Backup"}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Import */}
            <Card className="border-smk-gold/10">
              <CardHeader>
                <CardTitle className="text-lg text-smk-green">{isTE ? "డేటా ఇంపోర్ట్" : "Import Data"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => downloadSampleTemplate("members")} className="border-smk-gold/30">
                    <Download className="h-4 w-4 mr-1" />
                    {isTE ? "సభ్యుల టెంప్లేట్" : "Members Template"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => downloadSampleTemplate("payments")} className="border-smk-gold/30">
                    <Download className="h-4 w-4 mr-1" />
                    {isTE ? "చెల్లింపుల టెంప్లేట్" : "Payments Template"}
                  </Button>
                </div>

                <Separator />

                <div className="flex gap-3 items-end">
                  <div className="space-y-2 flex-1">
                    <Label>{isTE ? "ఇంపోర్ట్ రకం" : "Import Type"}</Label>
                    <select
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      value={importType}
                      onChange={(e) => setImportType(e.target.value as "members" | "payments")}
                    >
                      <option value="members">{isTE ? "సభ్యులు" : "Members"}</option>
                      <option value="payments">{isTE ? "చెల్లింపులు" : "Payments"}</option>
                    </select>
                  </div>
                  <div className="space-y-2 flex-1">
                    <Label>{isTE ? "Excel ఫైల్" : "Excel File"}</Label>
                    <Input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
                  </div>
                </div>

                {importPreview && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="bg-smk-gold/10">
                        {importPreview.length} {isTE ? "రికార్డులు" : "records ready"}
                      </Badge>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setImportPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                          {isTE ? "రద్దు" : "Cancel"}
                        </Button>
                        <Button size="sm" onClick={confirmImport} className="bg-smk-green hover:bg-smk-green-light text-white">
                          <Check className="h-4 w-4 mr-1" />
                          {isTE ? "ఇంపోర్ట్ నిర్ధారించు" : "Confirm Import"}
                        </Button>
                      </div>
                    </div>
                    <div className="overflow-x-auto max-h-60 border rounded">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {Object.keys(importPreview[0] || {}).map((key) => (
                              <TableHead key={key} className="text-xs">{key}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {importPreview.slice(0, 10).map((row, i) => (
                            <TableRow key={i}>
                              {Object.values(row).map((val, j) => (
                                <TableCell key={j} className="text-xs">{String(val)}</TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
