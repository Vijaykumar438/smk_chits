// Firestore collection helpers and type definitions for SMK Chits

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "./firebase";

// ─── Collection Names ────────────────────────────────────────
export const COLLECTIONS = {
  MEMBERS: "members",
  CHIT_GROUPS: "chitGroups",
  TICKETS: "tickets",
  AUCTIONS: "auctions",
  PAYMENTS: "payments",
  SETTINGS: "settings",
} as const;

// ─── TypeScript Interfaces ───────────────────────────────────

export interface Member {
  id?: string;
  name: string;
  nameTE: string; // Telugu name
  phone: string;
  address: string;
  idProof: string;
  guarantorName: string;
  guarantorPhone: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ChitGroup {
  id?: string;
  name: string;
  chitValue: number; // Total chit value (e.g., ₹1,00,000)
  monthlyInstallment: number; // Per member per month
  memberCount: number; // Total members/tickets
  duration: number; // In months (= memberCount)
  startDate: Timestamp;
  auctionDay: number; // Day of month (1-31)
  foremanCommissionPercent: number; // Max 5%
  status: "active" | "completed" | "upcoming";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Ticket {
  id?: string;
  memberId: string;
  groupId: string;
  ticketNumber: number;
  status: "active" | "won" | "defaulted";
  createdAt: Timestamp;
}

export interface Auction {
  id?: string;
  groupId: string;
  monthNumber: number;
  winnerTicketId: string;
  winnerMemberId: string;
  bidAmount: number; // Amount the winner accepts
  discount: number; // chitValue - bidAmount
  foremanCommission: number; // discount * commissionPercent
  dividendPerMember: number; // (discount - commission) / memberCount
  date: Timestamp;
  notes: string;
  createdAt: Timestamp;
}

export interface Payment {
  id?: string;
  ticketId: string;
  memberId: string;
  groupId: string;
  auctionMonth: number;
  amount: number;
  paymentDate: Timestamp;
  collectionType: "daily" | "weekly" | "monthly";
  receiptNumber: string;
  notes: string;
  createdAt: Timestamp;
}

export interface AppSettings {
  id?: string;
  whatsappTemplateEN: string;
  whatsappTemplateTE: string;
  defaultForemanCommission: number;
  businessName: string;
  businessPhone: string;
  businessAddress: string;
}

// ─── Generic CRUD Helpers ────────────────────────────────────

export async function addDocument<T extends DocumentData>(
  collectionName: string,
  data: T
): Promise<string> {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateDocument(
  collectionName: string,
  docId: string,
  data: Partial<DocumentData>
): Promise<void> {
  const docRef = doc(db, collectionName, docId);
  await updateDoc(docRef, { ...data, updatedAt: Timestamp.now() });
}

export async function deleteDocument(
  collectionName: string,
  docId: string
): Promise<void> {
  await deleteDoc(doc(db, collectionName, docId));
}

export async function getDocument<T>(
  collectionName: string,
  docId: string
): Promise<(T & { id: string }) | null> {
  const docSnap = await getDoc(doc(db, collectionName, docId));
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as T & { id: string };
  }
  return null;
}

export async function queryDocuments<T>(
  collectionName: string,
  ...constraints: QueryConstraint[]
): Promise<(T & { id: string })[]> {
  const q = query(collection(db, collectionName), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as (T & { id: string })[];
}

// ─── Convenience Helpers ─────────────────────────────────────

export function generateReceiptNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = (now.getMonth() + 1).toString().padStart(2, "0");
  const d = now.getDate().toString().padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SMK-${y}${m}${d}-${rand}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getWhatsAppUrl(phone: string, message: string): string {
  // Remove non-digit characters and ensure 91 prefix
  const cleanPhone = phone.replace(/\D/g, "");
  const fullPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
}
