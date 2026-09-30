# 💧 VVS Flow — Autonomous Dispatch & Priority Waitlist Platform

[![Built for Lovable Challenge](https://img.shields.io/badge/Lovable%20Challenge-2026-0891B2?style=for-the-badge&logo=rocket)](https://lovable.dev)
[![TanStack Start](https://img.shields.io/badge/TanStack_Start-React_19-22D3EE?style=for-the-badge)](https://tanstack.com/start)
[![Supabase](https://img.shields.io/badge/Supabase-Database_%26_RLS-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict_Mode-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Email Engine](https://img.shields.io/badge/Email_Engine-EmailJS_%26_Resend-EA4335?style=for-the-badge)](https://www.emailjs.com)

> **"Every inquiry gets an outcome. No valuable plumbing job gets silently lost."**  
> An autonomous booking, dispatch, and cancellation-recovery engine built for trade service businesses — demonstrated on **Ekström VVS AB** in Västerås, Sweden.

---

## 🏆 Jury & Quick Evaluation Guide

We designed the evaluation experience to be **100% friction-free** for judges and evaluators:

### 1. Instant 1-Click Access (No Credentials Required)
1. Open the app at `/login`.
2. Click the prominent **`✦ Accès Jury & Démo — Sans mot de passe`** button.
3. You are instantly logged into **Mats Ekström's** operational owner dashboard (`/dashboard`) with full administrative privileges.

### 2. Key Interactive Flows to Test

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Customer Booking Flow (/)                                                │
│    Pick a service (e.g., Water heater repair) ➔ Choose date ➔ Enter email   │
│    👉 Real-time official booking confirmation email received in inbox.      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. Owner Operations Dashboard (/dashboard)                                  │
│    • Interactive Dispatch Calendar with drive-time buffers & OSRM routing.  │
│    • Real-time Swedish ROT tax deduction (30% labor credit) calculator.     │
│    • Job assessment pipeline for high-value renovations.                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. Intelligent Waitlist Cascade (The Hero Feature)                          │
│    • Cancel any existing appointment in the calendar.                       │
│    • The system automatically cascades the freed slot to the highest-       │
│      scoring waitlisted customer.                                           │
│    • Anti double-booking lock engages with an exact 30-minute countdown.    │
│    👉 Real offer email dispatched: "⚡ Earlier Slot Available: [Time]".     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. Automated Customer Reminders                                             │
│    • T-24h reminder: Property access checklist & arrival confirmation.      │
│    • T-1h reminder: Real-time technician dispatch arrival alert.            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Core Technical Innovations

### 1. Real Email Automation (Zero Domain Blocker)
* **Dual-Engine Architecture:** Serverless edge dispatch supporting both **EmailJS REST API** (100% free via personal Gmail, zero custom domain DNS verification required) and direct **Resend API**.
* **4 Full Responsive HTML Templates (in English):**
  * `bookingConfirmationEmail`: Official receipt with personal tracking portal link (`/access/:token`).
  * `offerEmail`: 30-minute priority claim countdown window with one-click acceptance (`/offer/:token`).
  * `reminder24hEmail`: 24-hour property access reminder.
  * `reminder1hEmail`: 1-hour technician arrival notice with direct dispatch contact.

### 2. Pure & Explainable Waitlist Scoring (`src/lib/scheduling.ts`)
When a slot opens up due to cancellation, candidate waitlist entries are ranked deterministically:
$$\text{Score} = w_{\text{urgency}} + w_{\text{route}} + w_{\text{value}} + w_{\text{wait}}$$
* **Urgency Weight:** Emergency > Urgent > Normal.
* **Route Density:** Geospatial proximity to adjacent jobs in the same postal zone, minimizing unpaid travel time.
* **Value & Wait:** Job revenue potential balanced with queue wait duration.
* **Zero AI Hallucination:** Final scheduling decisions remain transparent, explainable, and reproducible.

### 3. Atomic Anti Double-Booking Protection
* Slots offered to waitlist candidates are protected by database-level concurrency locks.
* Every offer includes a strict 30-minute expiration timestamp (`expires_at`).
* If expired or declined, the engine automatically rolls over and notifies the next best-suited customer in the queue.

---

## 🛠️ Architecture & Tech Stack

```
vvs-flow/
├── src/
│   ├── figma/pages/          # Dual-experience UI (Customer Shell & Owner Dashboard)
│   │   ├── dashboard/        # Calendar, Jobs, Waitlist, Projects, Settings
│   │   └── booking/          # Conversational & visual appointment booking
│   ├── lib/
│   │   ├── email.server.ts   # Dual EmailJS/Resend serverless engine & HTML templates
│   │   ├── owner.functions.ts# Server functions gated with owner role check
│   │   ├── public.functions.ts# Unguessable token-authorized customer endpoints
│   │   ├── scheduling.ts     # Pure deterministic waitlist scoring & slot calculation
│   │   ├── services.ts       # Backend-agnostic service layer
│   │   └── vvs-data.ts       # Database-derived domain entities
│   └── routes/               # Type-safe routing via TanStack Router
├── vercel.json               # Nitro serverless preset & Vercel v3 build configuration
└── .env                      # Environment configuration
```

* **Fullstack Framework:** [TanStack Start](https://tanstack.com/start) with React 19.
* **Backend Runtime:** Nitro Server Engine (Vercel Serverless / Cloudflare / Node).
* **Database & Auth:** [Supabase](https://supabase.com) (PostgreSQL with Row Level Security & RPC).
* **Styling & Motion:** Tailwind CSS v4, Marine `#0B1A28` surfaces, Cyan `#0891B2` accents, Fraunces serif headings, JetBrains Mono technical labels, and browser View Transitions API.

---

## 🚀 Getting Started Locally

### Prerequisites
* Node.js 20+
* npm

### Installation
```bash
# 1. Clone repository
git clone https://github.com/mohalr2007/vvs-flow.git
cd vvs-flow

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Configure environment variables (.env)
cp .env.example .env # or verify .env exists

# 4. Start local development server
npm run dev
```

App will run locally at `http://localhost:3000`.

---

## 📬 Environment Configuration (.env)

```env
# Supabase
SUPABASE_URL="https://mssxhxciexlusccbjecy.supabase.co"
SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
VITE_SUPABASE_URL="https://mssxhxciexlusccbjecy.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."

# Email Automation (EmailJS - Free 200 emails/mo)
EMAILJS_SERVICE_ID="VVS"
EMAILJS_TEMPLATE_ID="template_889qfif"
EMAILJS_PUBLIC_KEY="WMKnGylJlm0kUN8g2"
EMAILJS_PRIVATE_KEY="BopuvPQv944TyBz9oCkdl"
```

---

## 📄 License & Attribution
Created for the **Lovable Challenge 2026** by Larabi Mohamed.  
Designed with authentic Scandinavian craftsmanship for trade businesses.
