# Plan: SMK Chits — Chit Fund Management Suite (Final)

A bilingual (English + Telugu) PWA for **Seethala Murali Krishna** to manage his chit fund business solo. **Next.js + Firebase + Tailwind CSS**, deployed free on Vercel, with WhatsApp reminders, Excel import/export, offline support, and custom SMK branding. Single admin login, works on phone and laptop.

## Steps

### 1. Scaffold the project

`create-next-app` in `MSKChits/` with TypeScript, Tailwind CSS v4, shadcn/ui, `firebase`, `react-firebase-hooks`, React Hook Form + Zod, `@react-pdf/renderer`, `xlsx`, and Serwist (PWA). Configure `app/manifest.ts` with SMK Chits name, theme color (gold + dark green — traditional, trustworthy), and app icons.

### 2. Create SMK Chits branding

Design an SVG logo: stylized **"SMK"** initials in a gold circle/shield motif with **"ఎస్ఎంకె చిట్స్"** (Telugu) underneath and "CHITS" in English below. Define a brand palette in Tailwind config:

- **Primary (Gold):** `#D4A843`
- **Accent (Dark Green):** `#1B5E20`
- **Background:** Cream white

Evoking trust and tradition. Logo used on: login page, dashboard header, sidebar, PDF receipts, PWA splash screen, and favicon.

### 3. Set up Firebase & Auth

Firebase project ("smk-chits") with **Firestore** (free Spark tier, offline persistence enabled from day 1) and **Firebase Auth** (email/password, single admin). Firestore Security Rules locked to admin UID. `lib/firebase.ts` for config, `contexts/AuthContext.tsx` for auth state, protected route wrapper.

### 4. Design Firestore collections

Root-level collections:

- **`members`** — name, nameTE, phone, address, idProof, guarantorName, guarantorPhone, createdAt
- **`chitGroups`** — name, chitValue, monthlyInstallment, memberCount, duration, startDate, auctionDay, foremanCommissionPercent (≤5%), status
- **`tickets`** — memberId, groupId, ticketNumber, status
- **`auctions`** — groupId, monthNumber, winnerTicketId, bidAmount, discount, dividendPerMember, date
- **`payments`** — ticketId, memberId, groupId, auctionMonth, amount, paymentDate, collectionType, receiptNumber
- **`settings`** — WhatsApp message templates (EN + TE), foreman defaults, branding overrides

Composite indexes on `payments`:

- `groupId` + `paymentDate`
- `memberId` + `groupId`

### 5. Set up bilingual support

`app/[lang]/` dynamic segment with `dictionaries/en.json` and `dictionaries/te.json`. Language toggle (🇬🇧 / తె) in header. All UI, receipts, reports, and WhatsApp templates translatable. Default: English.

### 6. Build the 5 core screens

- **Dashboard** — Branded header with SMK logo, today's collection total, active groups, upcoming auctions, outstanding amount, defaulter alerts (shadcn cards, mobile-first)
- **Members** — Add/edit/search, per-member ledger, WhatsApp reminder button
- **Chit Groups** — Create/manage, visual month timeline, enroll members as tickets
- **Auctions** — Record auction: bids → auto-calculate prize, dividend, commission
- **Collections** — Group → Member → Amount flow, partial payments, auto-generate branded PDF receipt (SMK logo + bilingual text)

### 7. Reports module

On-screen + branded PDF download (SMK logo in header, gold accent line):

- Daily / Weekly / Monthly Collection Report
- Member Ledger
- Defaulter List
- Auction Register
- Chit Group Summary
- Profit & Loss

### 8. WhatsApp reminders

"Send Reminder" button opens `wa.me/91<phone>?text=<message>`. Bilingual templates customizable from Settings page. Bulk remind option on defaulter list.

### 9. Import / Export module

Settings → Data page:

- **Export**: Download Members, Payments, Groups, Auctions, or "Export All" as `.xlsx`. Also offer full JSON backup.
- **Import**: Upload `.xlsx` to bulk-add members or bulk-record payments. Preview table with validation before commit. Downloadable sample template.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router, TypeScript) |
| UI | Tailwind CSS v4 + shadcn/ui |
| Database | Firebase Firestore (Spark free tier) |
| Auth | Firebase Auth (email/password, single admin) |
| PWA | Serwist service worker + `app/manifest.ts` |
| PDF | `@react-pdf/renderer` |
| Excel | `xlsx` library |
| Forms | React Hook Form + Zod |
| Hosting | Vercel (free tier) |
| i18n | Next.js `[lang]` segment + JSON dictionaries (EN + TE) |

## Firestore Free Tier Limits (Spark Plan)

| Resource | Limit |
|---|---|
| Storage | 1 GiB |
| Reads | 50K / day |
| Writes | 20K / day |
| Deletes | 20K / day |

More than sufficient for a single-user chit fund business.

## Brand Palette

| Token | Hex | Usage |
|---|---|---|
| Primary Gold | `#D4A843` | Buttons, headers, logo, accents |
| Dark Green | `#1B5E20` | Sidebar, text emphasis, icons |
| Cream White | `#FFFDF5` | Page backgrounds |
| Dark Text | `#1A1A1A` | Body text |
| Muted | `#6B7280` | Secondary text, borders |

## Future Enhancements

- **Custom domain**: `smkchits.in` (~₹500/yr), connects to Vercel for free
- **SMS fallback**: Twilio SMS (~₹0.15/msg) for members without WhatsApp
- **Member portal**: Read-only view for members to check their own payment history (Phase 2)
