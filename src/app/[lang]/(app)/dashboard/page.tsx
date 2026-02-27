"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  IndianRupee,
  Landmark,
  Gavel,
  AlertTriangle,
  Users,
  Plus,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { collection, query, where, getDocs, Timestamp, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS, formatCurrency, type Payment, type ChitGroup } from "@/lib/firestore";

export default function DashboardPage() {
  const pathname = usePathname();
  const lang = pathname.split("/")[1] || "en";
  const isTE = lang === "te";

  const [todayCollection, setTodayCollection] = useState(0);
  const [activeGroups, setActiveGroups] = useState(0);
  const [totalMembers, setTotalMembers] = useState(0);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [recentPayments, setRecentPayments] = useState<(Payment & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch active groups count
        const groupsSnap = await getDocs(
          query(collection(db, COLLECTIONS.CHIT_GROUPS), where("status", "==", "active"))
        );
        setActiveGroups(groupsSnap.size);

        // Calculate total outstanding from active groups
        let outstanding = 0;
        groupsSnap.forEach((doc) => {
          const group = doc.data() as ChitGroup;
          outstanding += group.chitValue * group.duration;
        });

        // Fetch total members
        const membersSnap = await getDocs(collection(db, COLLECTIONS.MEMBERS));
        setTotalMembers(membersSnap.size);

        // Fetch today's collections
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = Timestamp.fromDate(today);

        const paymentsSnap = await getDocs(
          query(
            collection(db, COLLECTIONS.PAYMENTS),
            where("paymentDate", ">=", todayTimestamp),
            orderBy("paymentDate", "desc"),
            limit(20)
          )
        );

        let todayTotal = 0;
        paymentsSnap.forEach((doc) => {
          todayTotal += (doc.data() as Payment).amount;
        });
        setTodayCollection(todayTotal);

        // Get total payments for outstanding calculation
        const allPaymentsSnap = await getDocs(collection(db, COLLECTIONS.PAYMENTS));
        let totalPaid = 0;
        allPaymentsSnap.forEach((doc) => {
          totalPaid += (doc.data() as Payment).amount;
        });
        setTotalOutstanding(Math.max(0, outstanding - totalPaid));

        // Recent payments
        const recentSnap = await getDocs(
          query(
            collection(db, COLLECTIONS.PAYMENTS),
            orderBy("createdAt", "desc"),
            limit(5)
          )
        );
        const recent = recentSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as (Payment & { id: string })[];
        setRecentPayments(recent);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const summaryCards = [
    {
      title: isTE ? "ఈ రోజు వసూలు" : "Today's Collection",
      value: formatCurrency(todayCollection),
      icon: IndianRupee,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: isTE ? "యాక్టివ్ గ్రూపులు" : "Active Groups",
      value: activeGroups.toString(),
      icon: Landmark,
      color: "text-smk-green",
      bg: "bg-smk-gold/10",
    },
    {
      title: isTE ? "మొత్తం సభ్యులు" : "Total Members",
      value: totalMembers.toString(),
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: isTE ? "మొత్తం బకాయి" : "Total Outstanding",
      value: formatCurrency(totalOutstanding),
      icon: AlertTriangle,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-smk-green">
            {isTE ? "డాష్‌బోర్డ్" : "Dashboard"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isTE ? "మీ చిట్ వ్యాపారం యొక్క అవలోకనం" : "Overview of your chit fund business"}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.title} className="border-smk-gold/10 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <p className="text-xl font-bold mt-1">{loading ? "..." : card.value}</p>
                </div>
                <div className={`p-2.5 rounded-full ${card.bg}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="border-smk-gold/10 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-smk-green">
            {isTE ? "త్వరిత చర్యలు" : "Quick Actions"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href={`/${lang}/collections`}>
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex-col gap-2 border-smk-gold/20 hover:bg-smk-gold/5"
              >
                <IndianRupee className="h-6 w-6 text-smk-green" />
                <span className="text-xs font-medium">
                  {isTE ? "చెల్లింపు నమోదు" : "Record Payment"}
                </span>
              </Button>
            </Link>
            <Link href={`/${lang}/members?action=add`}>
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex-col gap-2 border-smk-gold/20 hover:bg-smk-gold/5"
              >
                <Users className="h-6 w-6 text-smk-green" />
                <span className="text-xs font-medium">
                  {isTE ? "సభ్యుడిని చేర్చు" : "Add Member"}
                </span>
              </Button>
            </Link>
            <Link href={`/${lang}/chit-groups?action=add`}>
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex-col gap-2 border-smk-gold/20 hover:bg-smk-gold/5"
              >
                <Landmark className="h-6 w-6 text-smk-green" />
                <span className="text-xs font-medium">
                  {isTE ? "గ్రూప్ సృష్టించు" : "Create Group"}
                </span>
              </Button>
            </Link>
            <Link href={`/${lang}/reports`}>
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex-col gap-2 border-smk-gold/20 hover:bg-smk-gold/5"
              >
                <TrendingUp className="h-6 w-6 text-smk-green" />
                <span className="text-xs font-medium">
                  {isTE ? "రిపోర్ట్‌లు" : "View Reports"}
                </span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="border-smk-gold/10 shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-smk-green">
            {isTE ? "ఇటీవలి కార్యకలాపాలు" : "Recent Activity"}
          </CardTitle>
          <Link href={`/${lang}/collections`}>
            <Button variant="ghost" size="sm" className="text-smk-gold-dark">
              {isTE ? "అన్నీ చూడండి" : "View All"} <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-muted/50 rounded animate-pulse" />
              ))}
            </div>
          ) : recentPayments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <IndianRupee className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">
                {isTE ? "ఇంకా చెల్లింపులు నమోదు కాలేదు" : "No payments recorded yet"}
              </p>
              <Link href={`/${lang}/collections`}>
                <Button variant="link" className="text-smk-green mt-2">
                  <Plus className="h-4 w-4 mr-1" />
                  {isTE ? "మొదటి చెల్లింపు నమోదు చేయండి" : "Record your first payment"}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-green-50">
                      <IndianRupee className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {isTE ? "చెల్లింపు" : "Payment"} #{payment.receiptNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {payment.paymentDate?.toDate?.()
                          ? new Date(payment.paymentDate.toDate()).toLocaleDateString()
                          : ""}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-green-50 text-green-700 font-semibold"
                  >
                    {formatCurrency(payment.amount)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
