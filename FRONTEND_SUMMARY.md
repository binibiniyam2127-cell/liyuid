# LIYUID Frontend — AI Developer Architecture & Context Summary

> **Document Type:** AI-to-AI Context & Handoff Reference  
> **Project:** LIYUID (Lost · Found · Reunited) — Frontend Application  
> **Workspace Path:** `c:\Users\HP\Downloads\LIYUID\liyuid-frontend`  
> **Target Audience:** Incoming AI Coding Assistants & Full-Stack Developers  

---

## 1. Executive Summary & Product Vision

**LIYUID** is an intelligent, privacy-first lost-and-found platform engineered specifically for **Addis Ababa, Ethiopia**. 

Traditional lost-and-found mechanisms in Addis Ababa rely on public Telegram groups and Facebook posts, exposing personal phone numbers, raw identity documents, and sensitive item photos to the open internet. This leads to fraud, false claims, and extortion.

LIYUID solves this with:
1. **Blind Two-Sided Matching:** Finding items without public exposure; private attributes (serial numbers, secret marks, verification questions) are never exposed publicly.
2. **Local Addis Ababa Identity:** Built around real Addis Ababa geography (11 sub-cities: Bole, Kirkos, Arada, Yeka, etc.) with bilingual Amharic (`am`) and English (`en`) support.
3. **Real Photography Visual Foundation:** The public entry point uses a high-resolution photograph of the real Addis Ababa cityscape rather than generic startup graphics or synthetic skylines.
4. **Secure Handover:** Verification with single-use 6-digit OTPs and designated physical handover checkpoints.

---

## 2. Technology Stack & Key Libraries

| Layer | Technology | Details / Version |
| :--- | :--- | :--- |
| **Framework** | **Next.js 14 (App Router)** | `v14.2.35`, React 18, TypeScript strict mode |
| **Styling** | **Tailwind CSS** | Custom design tokens, glassmorphism, responsive breakpoints |
| **Icons** | **Lucide React** | Consistent, monochrome stroke-based icon library |
| **Design Language** | **Frosted Glassmorphism + SaaS Blue/Cyan** | `#0c2340` (Navy), `#0088ff` / `#00B9F2` (Cyan/Blue), `#f4f8fc` (Background) |
| **Branding Assets** | **3D Location Pin Logo** | Component: `components/ui/Logo.tsx`, Asset: `/images/logo-pin.png` |
| **Authentication** | **JWT Bearer Auth** | Stored in `localStorage` via `lib/auth-context.tsx` |
| **Localization** | **Bilingual Context** | Custom `LocaleContext` (`en` English / `am` Amharic) in `lib/locale-context.tsx` |
| **API Client** | **Native Fetch Wrapper** | Centralized in `lib/api.ts`, typed via `lib/types.ts` |

---

## 3. Directory Structure

```text
liyuid-frontend/
├── app/
│   ├── (app)/                 # Protected user application routes
│   │   ├── layout.tsx         # Deep navy sidebar navigation + Auth Route Guard
│   │   ├── home/              # Main user landing dashboard
│   │   ├── dashboard/         # Alias route for home
│   │   ├── reports/           # My Reports list & Report Wizard (/new, /[id])
│   │   ├── matches/           # AI matching radar & challenge interface
│   │   ├── messages/          # Anonymous finder-owner chat
│   │   ├── notifications/     # In-app, Email, Telegram notifications
│   │   ├── profile/           # User profile & contact preferences
│   │   ├── settings/          # Account security & Telegram bot link
│   │   └── handover/          # Single-use 6-digit OTP handover workflow
│   ├── (auth)/                # Authentication screens (Centered glass cards)
│   │   ├── login/             # Sign In page (Real Addis photo background)
│   │   ├── register/          # Sign Up page (Real Addis photo background)
│   │   ├── signup/            # Alias for register
│   │   └── verify/            # 6-digit OTP account activation card
│   ├── staff/                 # Internal Staff Portal (Completely separated)
│   │   ├── login/             # Dedicated staff credential login
│   │   ├── dashboard/         # Active cases, reviews, disputes, flags
│   │   ├── cases/             # Case management table
│   │   ├── reports/           # All reported items
│   │   ├── disputes/          # Conflict & claim arbitration
│   │   ├── flags/             # Suspicious item & scam reports
│   │   ├── analytics/         # System throughput metrics
│   │   └── settings/          # Staff configuration
│   ├── layout.tsx             # Root layout (AuthProvider + LocaleProvider)
│   ├── page.tsx               # Welcome Page (Hero + Real Addis Photo + Exploration)
│   ├── about/                 # Public About page
│   ├── how-it-works/          # Public How It Works page
│   └── help/                  # Public Help & FAQ
├── components/
│   ├── ui/                    # Reusable primitives (Logo, Button, Modal, Card)
│   └── ...
├── lib/
│   ├── api.ts                 # Central HTTP client (talks to NEXT_PUBLIC_API_URL)
│   ├── auth-context.tsx       # Auth state, login, register, token persistence
│   ├── locale-context.tsx     # Bilingual translations (EN / AM)
│   └── types.ts               # Core TypeScript data schemas
└── public/
    └── images/                # Static assets (addis-wallpaper.jpg, logo-pin.png)
```

---

## 4. Key Pages & Architectural Patterns

### 4.1 Welcome Page (`app/page.tsx`)
- **Visual Anchor:** Fullscreen real Addis Ababa photograph (`https://wallpapercat.com/w/middle-retina/c/d/2/1571251-2048x1366-desktop-hd-addis-ababa-background-image.jpg` with fallback to `/images/addis-wallpaper.jpg`).
- **Hero Design Rule:** The Addis Ababa photograph is kept **completely unobstructed**. All floating demonstration item cards were removed by user design requirement.
- **Center Typography:**
  - 3D Location-Pin Logo (`<Logo size={80} showText={false} />`)
  - Platform Title: `LIYUID`
  - Subtitle: `Lost • Found • Reunited`
  - Tagline: *"An AI-powered lost-and-found platform with blind two-sided private matching."*
- **Neutral Bottom Feature Bar:** Translucent frosted glass panel with 4 neutral monochrome icons:
  1. *Privacy Protected* (Private information stays private)
  2. *AI-Powered Matching* (Find meaningful matches faster)
  3. *Private Verification* (Ownership is verified without exposing secrets)
  4. *Secure Handover* (Controlled confirmation for safer reunions)
- **Interactive Exploration Section (`#explore-section`):** Clicking `"Scroll to explore ↓"` smoothly scrolls below the fold to:
  - Addis Ababa recovery infrastructure overview.
  - 3-Step Lifecycle (01 Report With Privacy, 02 Blind Two-Sided Matching, 03 Secure OTP Handover).
  - Privacy-First Engineering Grid (No Public Photos, Anonymous Chat, Anti-Scam Guard, City Network).
  - Dynamic Footer: Displays `Sign In` / `Create Account →` for public visitors, or `Go to Dashboard →` for logged-in users.

### 4.2 Authentication Flow (`app/(auth)/`)
- **Glassmorphism Aesthetic:** All auth cards use frosted white glass (`bg-white/90 backdrop-blur-xl border border-white/70 shadow-2xl`) over the Addis Ababa city background.
- **Registration (`/register`):** Sends `POST /auth/register` with `email`, `display_name`, `phone_number`, and `password`. Auto-authenticates via `POST /auth/token`, saves the JWT token into `localStorage`, and transitions to `/verify`.
- **Route Guard Protection (`app/(app)/layout.tsx`):**
  - Uses `useAuth()`.
  - If `!isLoading && !isAuthenticated`, attempts to visit `/home`, `/dashboard`, or any application route trigger an immediate redirect: `router.push('/login?redirect=...')`.

### 4.3 Authenticated App Layout (`app/(app)/layout.tsx`)
- **Clean Workspace:** Once authenticated, the full-screen photo is replaced by a clean, light dashboard workspace (`bg-[#f4f8fc]`) so users can focus on their items.
- **Deep Navy Sidebar (`#0c2340`):** Persistent left-hand navigation linking to Home, My Reports, Matches, Messages, Notifications, Profile, Settings, and Sign Out.
- **Addis Identity Banner:** A compact, elegant city image banner at the top of `/home` reinforces local identity without visual clutter.

### 4.4 Staff Operations Portal (`app/staff/`)
- **Strict Separation:** The staff portal is completely hidden from normal user navigation.
- **Authentication:** Uses a distinct `STAFF_TOKEN_KEY` in `localStorage` and connects to `/staff/...` endpoints.

---

## 5. Strict Privacy & Security Rules (MUST PRESERVE)

When making future edits to the frontend, any AI agent **must adhere to these core rules**:

1. **NO Public Item Photos:** User-uploaded item photos must NEVER be displayed on unauthenticated feeds or public cards.
2. **NO Unmasked Secrets:** Serial numbers, secret engravings, internal contents, and security question answers must have privacy lock badges and be masked.
3. **Two-Sided Blind Verification:** Verification questions must allow the owner to confirm details without the finder learning private secrets prematurely.
4. **Anonymous Chat:** Real phone numbers, emails, and full identities must never be exposed inside the chat channel (`/messages`).
5. **Single-Use Handover Codes:** Handover completion requires a 6-digit OTP valid for 10 minutes.

---

## 6. Development & Operational Commands

```bash
# Working directory
cd liyuid-frontend

# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev
# (Runs on http://localhost:3000)

# 3. Create production build
npm run build

# 4. Start production server
npm run start
```

### Backend Integration
- **Default API URL:** `http://127.0.0.1:8000` (configurable via `NEXT_PUBLIC_API_URL` in `.env.local`).
- **Backend Stack:** FastAPI + PostgreSQL 16 (PostGIS + pgvector) + Redis 7 + Celery AI worker.
- **Starting the Backend:** Run `docker compose up -d` in the root repository directory `C:\Users\HP\Downloads\LIYUID`.
