"use client";

import React from "react";
import ProtectedLayout from "@/components/protected-layout";
import { AppSidebar } from "@/components/app-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-smk-cream">
        <AppSidebar />
        <main className="lg:pl-64">
          <div className="pt-16 lg:pt-0">
            <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
    </ProtectedLayout>
  );
}
