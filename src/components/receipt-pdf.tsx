"use client";

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import { formatCurrency } from "@/lib/firestore";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 11,
    fontFamily: "Helvetica",
    backgroundColor: "#FFFDF5",
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#D4A843",
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#1B5E20",
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 10,
    color: "#666",
    marginTop: 4,
  },
  receiptLabel: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginTop: 10,
    color: "#D4A843",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E8C96A",
  },
  label: {
    fontSize: 11,
    color: "#555",
    width: "40%",
  },
  value: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#1B5E20",
    width: "60%",
    textAlign: "right",
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: "#1B5E20",
    borderBottomWidth: 2,
    borderBottomColor: "#1B5E20",
  },
  amountLabel: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#1B5E20",
  },
  amountValue: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#1B5E20",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#D4A843",
    paddingTop: 10,
  },
  footerText: {
    fontSize: 9,
    color: "#999",
  },
  thankYou: {
    fontSize: 12,
    color: "#1B5E20",
    fontFamily: "Helvetica-Bold",
    marginTop: 20,
    textAlign: "center",
  },
});

interface ReceiptData {
  receiptNumber: string;
  memberName: string;
  memberPhone: string;
  groupName: string;
  amount: number;
  date: string;
  collectionType: string;
  notes?: string;
  businessName?: string;
  businessPhone?: string;
  businessAddress?: string;
}

function ReceiptDocument({ data }: { data: ReceiptData }) {
  return (
    <Document>
      <Page size="A5" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{data.businessName || "SMK CHITS"}</Text>
          <Text style={styles.subtitle}>Chit Fund Management</Text>
          {data.businessPhone && (
            <Text style={styles.subtitle}>Phone: {data.businessPhone}</Text>
          )}
          {data.businessAddress && (
            <Text style={styles.subtitle}>{data.businessAddress}</Text>
          )}
          <Text style={styles.receiptLabel}>PAYMENT RECEIPT</Text>
        </View>

        {/* Receipt Details */}
        <View>
          <View style={styles.row}>
            <Text style={styles.label}>Receipt No.</Text>
            <Text style={styles.value}>{data.receiptNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{data.date}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Member Name</Text>
            <Text style={styles.value}>{data.memberName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{data.memberPhone}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Chit Group</Text>
            <Text style={styles.value}>{data.groupName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Collection Type</Text>
            <Text style={styles.value}>
              {data.collectionType.charAt(0).toUpperCase() + data.collectionType.slice(1)}
            </Text>
          </View>
          {data.notes && (
            <View style={styles.row}>
              <Text style={styles.label}>Notes</Text>
              <Text style={styles.value}>{data.notes}</Text>
            </View>
          )}
        </View>

        {/* Amount */}
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>AMOUNT PAID</Text>
          <Text style={styles.amountValue}>{formatCurrency(data.amount)}</Text>
        </View>

        <Text style={styles.thankYou}>Thank you for your payment!</Text>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This is a computer-generated receipt. No signature required.
          </Text>
          <Text style={styles.footerText}>
            {data.businessName || "SMK Chits"} — S. Murali Krishna
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generateReceiptPDF(data: ReceiptData): Promise<Blob> {
  const blob = await pdf(<ReceiptDocument data={data} />).toBlob();
  return blob;
}

export function downloadReceiptPDF(data: ReceiptData) {
  generateReceiptPDF(data).then((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Receipt-${data.receiptNumber}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

export function shareReceiptWhatsApp(data: ReceiptData, phone: string) {
  const msg = `SMK Chits Payment Receipt\n\n` +
    `Receipt: ${data.receiptNumber}\n` +
    `Member: ${data.memberName}\n` +
    `Group: ${data.groupName}\n` +
    `Amount: ${formatCurrency(data.amount)}\n` +
    `Date: ${data.date}\n` +
    `Type: ${data.collectionType}\n\n` +
    `Thank you! — SMK Chits`;

  const cleanPhone = phone.replace(/\D/g, "");
  const fullPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
  window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, "_blank");
}
