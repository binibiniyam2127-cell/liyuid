# LIYUID Frontend — AI Developer Architecture & Context

> **Document Type:** Production Frontend Source of Truth / AI Coding-Agent Handoff
>
> **Project:** LIYUID (Lost · Found · Reunited)
>
> **Target:** Next.js frontend, AI coding assistants, frontend developers, and full-stack developers
>
> **Primary Market:** Addis Ababa, Ethiopia
>
> **Language:** English + Amharic (`en` / `am`)

---

## 1. Purpose of This Document

This document is the authoritative frontend context for LIYUID.

Any AI coding assistant or developer modifying the frontend must read and follow this document before changing:

- routes
- authentication
- privacy behavior
- UI architecture
- API integration
- staff access
- notification behavior
- matching
- anonymous messaging
- handover
- localization
- visual design

### Non-Negotiable Rule

**Do not invent backend behavior.**

If an API endpoint, request field, response field, permission, business rule, or workflow is not documented or discoverable from the existing implementation/backend contract:

1. Do not guess.
2. Do not create fake API behavior.
3. Preserve the existing implementation when possible.
4. Clearly identify the missing contract before making architectural changes.

---

# 2. Product Vision

LIYUID is an intelligent, privacy-first lost-and-found platform designed specifically for Addis Ababa.

Traditional lost-and-found workflows often depend on public Telegram groups, Facebook posts, or other public channels. These approaches can expose:

- phone numbers
- identity information
- item photos
- serial numbers
- private item characteristics
- verification information

This can increase the risk of:

- fraudulent claims
- impersonation
- extortion
- privacy violations
- unsafe handovers

LIYUID is designed around controlled discovery and private reunification.

### Core Product Principles

1. **Privacy-first reporting**
2. **Blind two-sided matching**
3. **Private verification**
4. **Anonymous finder-owner communication**
5. **Secure physical handover**
6. **Addis Ababa localization**
7. **Bilingual English / Amharic support**
8. **Notification through multiple channels**
9. **Clear separation between normal users and staff**
10. **Minimal public exposure of sensitive information**

---

# 3. Core Product Model

LIYUID separates the system into three experiences.

## 3.1 Public Experience

Public users can access:

- Welcome
- About
- How It Works
- Help / FAQ
- Sign In
- Create Account

Public pages must never expose private user-submitted item information.

### Public pages MUST NOT display

- user-uploaded item photos
- private item descriptions
- serial numbers
- secret marks
- verification answers
- phone numbers
- private email addresses
- private identity information
- private matching information

---

## 3.2 Authenticated User Experience

Authenticated users can access:

- Home
- My Reports
- Matches
- Anonymous Messages
- Notifications
- Profile
- Settings
- Handover workflows

Authenticated users can only access information authorized for their account and role.

---

## 3.3 Staff Experience

Staff have a completely separate internal portal.

The staff portal must not appear in normal user navigation.

Staff functionality includes:

- Staff Login
- Dashboard
- Case Management
- Reports
- Disputes
- Flags
- Analytics
- Staff Settings

**Important:** Hiding `/staff` from navigation is not a security mechanism.

Every staff route must enforce authentication and authorization.

---

# 4. Technology Stack

| Layer | Technology | Requirement |
|---|---|---|
| Framework | Next.js 14 App Router | Existing project baseline |
| React | React 18 | Existing project baseline |
| Language | TypeScript | Strict mode |
| Styling | Tailwind CSS | Custom design tokens |
| Icons | Lucide React | Consistent monochrome icon system |
| Animation | Framer Motion | Purposeful, accessible motion |
| Design | Frosted glass + SaaS blue/cyan | Existing visual direction |
| Primary Navy | `#0c2340` | Brand/navigation |
| Cyan | `#0088ff` / `#00B9F2` | Accent |
| Light Background | `#f4f8fc` | Authenticated workspace |
| Dark Background | `#09090b` | Dark theme |
| Typography | Geist / Inter | Do not fall back to Arial/system styling |
| API | Native Fetch wrapper | Centralized in `lib/api.ts` |
| Auth | Existing JWT architecture | Must follow backend contract |
| Localization | Custom LocaleContext | English / Amharic |
| Backend | FastAPI | Existing backend |
| Database | PostgreSQL 16 | PostGIS + pgvector |
| Cache | Redis 7 | Existing backend infrastructure |
| Worker | Celery AI worker | Existing AI processing |

Do not upgrade major framework versions as part of a visual/UI task unless explicitly requested.

---

# 5. Design System

## 5.1 Visual Direction

LIYUID should feel:

- premium
- trustworthy
- calm
- local
- modern
- privacy-focused
- minimal
- professional

Avoid:

- generic startup illustrations
- excessive gradients
- excessive text
- cartoonish lost-and-found graphics
- cluttered dashboards
- unnecessary decorative cards
- fake item photographs on public pages

---

## 5.2 Public Visual Identity

The public entry point uses a real Addis Ababa photograph as the primary visual anchor.

The photograph should communicate local identity without making the interface feel like a tourism website.

The image must be properly licensed or owned for production use.

Do not depend on an external wallpaper URL in production when a properly licensed local asset is available.

Preferred production asset:

```text
/public/images/addis-wallpaper.jpg
```

---

## 5.3 Typography

Preferred:

- Geist
- Inter

Suggested scale:

| Use | Size |
|---|---:|
| Caption | 12px |
| Body | 14px |
| Subheader | 16px |
| Card title | 20px |
| Page title | 28–32px |
| Display | 40px+ only when justified |

Use:

- strict tracking where appropriate
- tabular numbers for numeric data
- readable line height
- consistent hierarchy

---

## 5.4 Spacing

Use a 4px / 8px spacing system.

Examples:

```text
gap-2
gap-4
p-3
p-6
```

Avoid arbitrary spacing unless necessary for visual alignment.

---

## 5.5 Component States

Reusable components must account for:

- default
- hover
- focus
- active
- disabled
- loading
- skeleton
- empty
- error
- success
- unauthorized
- forbidden

Never design only the happy path.

---

# 6. Directory Structure

```text
liyuid-frontend/
│
├── app/
│   │
│   ├── (app)/
│   │   ├── layout.tsx
│   │   ├── home/
│   │   ├── dashboard/
│   │   ├── reports/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   └── [id]/
│   │   ├── matches/
│   │   ├── messages/
│   │   ├── notifications/
│   │   ├── profile/
│   │   ├── settings/
│   │   └── handover/
│   │
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   ├── signup/
│   │   └── verify/
│   │
│   ├── staff/
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── cases/
│   │   ├── reports/
│   │   ├── disputes/
│   │   ├── flags/
│   │   ├── analytics/
│   │   └── settings/
│   │
│   ├── layout.tsx
│   ├── page.tsx
│   ├── about/
│   ├── how-it-works/
│   └── help/
│
├── components/
│   ├── ui/
│   ├── auth/
│   ├── reports/
│   ├── matches/
│   ├── messages/
│   ├── notifications/
│   ├── handover/
│   └── staff/
│
├── lib/
│   ├── api.ts
│   ├── auth-context.tsx
│   ├── locale-context.tsx
│   ├── types.ts
│   └── ...
│
└── public/
    └── images/
        ├── addis-wallpaper.jpg
        └── logo-pin.png
```

---

# 7. Route Architecture

## Public Routes

```text
/
/about
/how-it-works
/help
```

## Authentication Routes

```text
/login
/register
/signup
/verify
```

`/signup` may remain as a compatibility alias for `/register`, but `/register` should be the canonical implementation.

## Authenticated Routes

```text
/home
/dashboard
/reports
/reports/new
/reports/[id]
/matches
/messages
/notifications
/profile
/settings
/handover
```

## Staff Routes

```text
/staff/login
/staff/dashboard
/staff/cases
/staff/reports
/staff/disputes
/staff/flags
/staff/analytics
/staff/settings
```

---

# 8. Access-Control Matrix

| Feature | Public | Authenticated User | Staff |
|---|:---:|:---:|:---:|
| Welcome | ✓ | ✓ | ✓ |
| About | ✓ | ✓ | ✓ |
| How It Works | ✓ | ✓ | ✓ |
| Help | ✓ | ✓ | ✓ |
| Create report | — | ✓ | Authorized |
| View own reports | — | ✓ | Authorized |
| Private item photo | — | Owner / authorized | Authorized |
| Matches | — | ✓ | Authorized |
| Anonymous chat | — | ✓ | Authorized |
| Notifications | — | ✓ | Authorized |
| Handover | — | ✓ | Authorized |
| Disputes | — | — | ✓ |
| Flags | — | — | ✓ |
| Analytics | — | — | ✓ |
| Staff settings | — | — | ✓ |

Authorization must be enforced by the backend/server. Client-side hiding is not sufficient.

---

# 9. Welcome Page

## Visual Anchor

The welcome page uses the real Addis Ababa photograph as the primary background.

The photograph should remain visually dominant and should not be covered by unnecessary floating cards.

## Hero Content

```text
LIYUID

Lost • Found • Reunited

AI-powered private lost-and-found

[ Get Started ]

Explore ↓
```

Use the 3D location-pin logo:

```tsx
<Logo size={80} showText={false} />
```

---

## Feature Bar

A subtle frosted-glass feature bar can communicate:

1. Privacy Protected
2. AI-Powered Matching
3. Private Verification
4. Secure Handover

Keep copy short.

The welcome page should not become text-heavy.

---

# 10. Welcome Page Exploration

Clicking:

```text
Scroll to explore ↓
```

should smoothly reveal additional content.

Suggested sections:

### Addis Ababa Recovery Infrastructure

Explain the local recovery network without exposing private cases.

### Three-Step Lifecycle

```text
01
Report With Privacy

02
Blind Two-Sided Matching

03
Secure OTP Handover
```

### Privacy-First Engineering

```text
No Public Photos
Anonymous Chat
Anti-Scam Guard
City Network
```

### Footer

For public visitors:

```text
Sign In
Create Account
```

For authenticated users:

```text
Go to Dashboard
```

---

# 11. Authentication

Authentication screens use the Addis Ababa visual background with centered frosted-glass cards.

## Login

The login page must be a dedicated page, separate from the welcome page.

Do not merge the welcome hero and login form into one confusing interface.

## Registration

Existing registration fields:

```text
email
display_name
phone_number
password
```

Registration behavior must follow the actual backend contract.

Do not assume automatic authentication unless that behavior exists in the backend.

## Verification

Account activation uses a 6-digit OTP.

The interface should support:

- digit input
- paste
- keyboard navigation
- resend
- countdown
- invalid code
- expired code
- success
- loading

---

# 12. Authentication Security

The frontend must minimize exposure of authentication credentials.

### Requirements

- Never put access tokens in URLs.
- Never put authentication secrets into query parameters.
- Never log authentication tokens.
- Never display tokens in UI.
- Never expose private authentication state to public components unnecessarily.
- Prefer secure HttpOnly cookie-based sessions when supported by the backend.
- If the existing backend requires browser-accessible JWT storage, document that constraint and minimize token lifetime/exposure.

Do not change authentication architecture without checking the backend contract.

---

# 13. Route Guards

Authenticated routes must reject unauthenticated users.

Existing protected application behavior:

```text
Unauthenticated
      ↓
/home or protected route
      ↓
/login?redirect=...
```

However, route guards are only one layer.

The system must also enforce authorization server-side.

---

# 14. Staff Security

The staff portal is intentionally not discoverable from normal user navigation.

However:

**Security must never depend on route secrecy.**

Every `/staff/*` route must verify:

1. authentication
2. staff role
3. required permission

Recommended future role model:

```text
SUPER_ADMIN
STAFF
REVIEWER
DISPUTE_HANDLER
ANALYST
```

Only implement roles that exist in the backend.

---

# 15. Privacy Rules — MUST PRESERVE

These rules are mandatory.

## Rule 1 — No Public Item Photos

User-uploaded item photos must NEVER appear on:

- unauthenticated feeds
- public cards
- public search
- public landing pages
- public previews

Do not use real user item photos as decorative public UI.

---

## Rule 2 — No Unmasked Secrets

The following must remain private:

- serial numbers
- secret engravings
- hidden marks
- internal contents
- verification answers
- private identifying attributes

Use lock indicators and masked presentation where appropriate.

---

## Rule 3 — Blind Verification

Verification must allow legitimate ownership to be established without prematurely revealing private secrets to the other party.

---

## Rule 4 — Anonymous Chat

Finder-owner communication inside `/messages` must not reveal:

- phone number
- private email
- full identity
- private contact details

The chat identity should use a safe anonymous representation.

---

## Rule 5 — Single-Use Handover OTP

Handover completion requires:

```text
6-digit OTP
10-minute validity
single use
```

Never display or persist the OTP in unnecessary client storage.

---

## Rule 6 — No Sensitive Data in URLs

Do not place:

- serial numbers
- phone numbers
- private descriptions
- verification answers
- sensitive identifiers

in URL paths or query strings.

Use opaque resource IDs.

---

## Rule 7 — No Sensitive Data in Browser Storage

Do not store private item information in:

```text
localStorage
sessionStorage
```

unless explicitly required by a documented architecture and approved for that data class.

---

## Rule 8 — Public API Responses Must Be Minimal

Do not fetch private data and hide it using CSS.

If a user is unauthorized to receive data, the API should not return it.

---

# 16. Reports

Users can create and manage lost/found reports.

The report UI should distinguish between:

### Public-safe information

Information that may be used for matching or controlled discovery.

### Private verification information

Information that must remain hidden until authorized verification.

Never present the two categories as if they have the same visibility.

---

# 17. AI Matching

The Matches interface represents AI-generated potential matches.

Possible states:

```text
Analyzing
Potential Match
Verification Required
Verified
No Match Yet
Error
```

Do not claim that an AI match is proof of ownership.

The UI should use language such as:

```text
Potential match
Possible match
Verification required
```

rather than:

```text
This is your item
```

unless the backend has completed the required verification process.

---

# 18. Anonymous Messaging

Messages are strictly for controlled finder-owner communication.

### Rules

- Do not expose phone numbers.
- Do not expose private email.
- Do not expose full identity.
- Do not turn Telegram into a chat channel.
- Do not expose private item secrets.
- Provide report/block/flag mechanisms where supported by the backend.

The chat should clearly communicate that users should not exchange sensitive personal information.

---

# 19. Notifications

LIYUID supports three notification channels:

```text
In-App
Email
Telegram
```

### Important

Telegram and Email are **notification channels only**.

They are not replacements for LIYUID anonymous chat.

Correct model:

```text
                       ┌── In-App
System Event ──────────┼── Email
                       └── Telegram

Finder ←──── LIYUID Anonymous Chat ────→ Owner
```

Notification settings should allow users to manage supported channels according to the backend capabilities.

---

# 20. Handover Workflow

The frontend should represent the handover lifecycle clearly.

Recommended conceptual state model:

```text
MATCHED
   ↓
VERIFICATION_PENDING
   ↓
VERIFIED
   ↓
HANDOVER_SCHEDULED
   ↓
HANDOVER_READY
   ↓
OTP_GENERATED
   ↓
OTP_CONFIRMED
   ↓
REUNITED
```

Possible exception states:

```text
EXPIRED
CANCELLED
DISPUTED
FLAGGED
```

The frontend must use the backend's actual state values if they already exist.

Do not invent alternative business states.

---

# 21. Handover UI

The handover experience should include:

- item/case summary
- verification status
- handover checkpoint
- scheduled time where supported
- OTP status
- safety guidance
- completion confirmation

Never display private item secrets unnecessarily.

---

# 22. Error, Loading & Empty States

Every major page must have intentional states.

## Loading

Use skeletons rather than blank screens where appropriate.

## Empty

Example:

```text
No reports yet.

Create your first lost or found report.
```

## Error

Example:

```text
We couldn't load your matches.

Try again.
```

## Unauthorized

```text
Please sign in to continue.
```

## Forbidden

```text
You don't have permission to access this area.
```

## Offline / Network Failure

Provide a useful retry path without exposing technical errors to normal users.

---

# 23. Responsive Design

The application must work across:

- desktop
- laptop
- tablet
- mobile

## Desktop

Use the deep navy sidebar for authenticated navigation.

## Mobile

Use a compact top bar and/or bottom navigation.

Suggested mobile navigation:

```text
Home | Reports | Matches | Messages | More
```

Do not simply shrink the desktop sidebar into a narrow column.

Mobile must be intentionally designed.

---

# 24. Accessibility

Target:

**WCAG 2.2 AA**

Requirements:

- semantic HTML
- keyboard navigation
- visible focus states
- accessible labels
- accessible form errors
- sufficient color contrast
- screen-reader-friendly dialogs
- accessible buttons
- accessible navigation
- reduced-motion support
- do not communicate meaning through color alone
- logical heading hierarchy

Framer Motion animations must respect:

```text
prefers-reduced-motion
```

---

# 25. Animation

Animations should communicate:

- navigation
- state change
- loading
- confirmation
- hierarchy

Avoid animation that is:

- distracting
- continuous without purpose
- blocking
- difficult to disable
- inaccessible

The welcome page may use subtle motion involving environmental visuals and UI transitions, but the real Addis photograph remains the visual anchor.

---

# 26. Localization

Supported locales:

```text
en
am
```

All user-facing text should be localization-ready.

Do not hard-code important UI strings directly into components when they belong in the translation system.

Pay attention to:

- longer Amharic strings
- buttons
- tables
- validation messages
- navigation labels
- empty states
- notifications

Do not assume English text length when designing fixed-width components.

---

# 27. API Integration

Central API client:

```text
lib/api.ts
```

Shared types:

```text
lib/types.ts
```

Default local API:

```text
http://127.0.0.1:8000
```

Configured using:

```text
NEXT_PUBLIC_API_URL
```

The frontend must use the centralized API client instead of scattering raw fetch configuration throughout components.

---

# 28. API Contract Rule

Before adding frontend behavior, verify:

- endpoint
- HTTP method
- request body
- query parameters
- response schema
- authentication requirements
- authorization requirements
- error format
- pagination
- status values

If any of these are unknown:

**Do not guess.**

Use existing backend code or API documentation as the source of truth.

---

# 29. Data Handling

Frontend types should accurately represent backend data.

Do not:

- silently rename backend fields
- invent response fields
- fabricate mock data in production flows
- assume optional fields are always present
- expose private backend fields in UI

Mock data may be used only for isolated visual development and must be clearly separated from production API logic.

---

# 30. Performance

Priorities:

1. Fast public landing page
2. Optimized Addis background image
3. Lazy-load below-the-fold content where appropriate
4. Avoid unnecessary client components
5. Avoid unnecessary API requests
6. Avoid loading private data before authorization
7. Optimize animations
8. Use image optimization where supported

Do not sacrifice privacy for perceived performance.

---

# 31. Public Image Handling

The current design references a real Addis Ababa image.

For production:

- use a licensed asset
- preferably self-host the image
- optimize image size
- provide responsive variants
- provide fallback behavior
- do not expose user-uploaded item images publicly

Preferred asset:

```text
/public/images/addis-wallpaper.jpg
```

---

# 32. Staff Dashboard

The staff dashboard should prioritize operational clarity over marketing aesthetics.

Suggested information:

```text
Active Cases
Pending Reviews
Potential Fraud
Disputes
Pending Handovers
Recent Activity
```

Staff tables should support:

- filtering
- sorting
- pagination
- status indicators
- safe case identifiers
- controlled access

Do not expose unnecessary private data in list views.

---

# 33. Staff Case Management

Staff may need to inspect:

- reports
- matching cases
- verification status
- disputes
- flags
- handover status

Private information should only be displayed when the staff member has the required permission.

Audit-sensitive actions should be clearly represented.

---

# 34. Disputes & Flags

Disputes and suspicious activity should have dedicated workflows.

Possible conceptual statuses:

```text
OPEN
UNDER_REVIEW
RESOLVED
DISMISSED
ESCALATED
```

Only use these if they match the backend contract.

The UI must not silently resolve a dispute.

---

# 35. Analytics

Analytics should focus on system-level operational metrics such as:

- reports created
- reports resolved
- matching success
- average resolution time
- pending cases
- dispute volume
- notification delivery

Avoid displaying personally identifiable information in analytics unless explicitly authorized.

---

# 36. Design Components

Reusable components should be preferred over duplicated UI.

Recommended groups:

```text
components/ui/
    Button
    Card
    Modal
    Dialog
    Input
    Select
    Badge
    Tooltip
    Skeleton
    EmptyState

components/reports/
components/matches/
components/messages/
components/notifications/
components/handover/
components/staff/
```

Components should have predictable APIs and accessible defaults.

---

# 37. Theme Support

Support:

- light mode
- dark mode

Use CSS variables/design tokens for:

- background
- foreground
- surface
- elevated surface
- border
- muted text
- primary
- accent
- destructive
- focus ring

Theme transitions should be smooth but should not create excessive animation.

---

# 38. Security Checklist for AI Agents

Before completing a frontend change, verify:

```text
[ ] No private item photo exposed publicly
[ ] No serial number exposed
[ ] No verification answer exposed
[ ] No phone/email exposed in anonymous chat
[ ] No sensitive data in URLs
[ ] No sensitive data unnecessarily stored in browser storage
[ ] Staff authorization remains protected
[ ] Public routes cannot access private API data
[ ] Authenticated routes remain guarded
[ ] No authentication token logged
[ ] No fake backend behavior introduced
[ ] Error states do not expose sensitive backend details
```

---

# 39. UX Quality Checklist

Before considering a page complete:

```text
[ ] Desktop responsive
[ ] Mobile responsive
[ ] Loading state
[ ] Empty state
[ ] Error state
[ ] Disabled state
[ ] Focus state
[ ] Keyboard navigation
[ ] Accessible labels
[ ] Localization-ready
[ ] Dark mode considered
[ ] Reduced-motion behavior
[ ] Consistent spacing
[ ] Consistent typography
[ ] No unnecessary text
[ ] Clear primary action
```

---

# 40. Development Commands

From the frontend directory:

```bash
cd liyuid-frontend

npm install

npm run dev

npm run build

npm run start
```

Development server:

```text
http://localhost:3000
```

Backend default:

```text
http://127.0.0.1:8000
```

---

# 41. Backend Integration

Backend stack:

```text
FastAPI
PostgreSQL 16
PostGIS
pgvector
Redis 7
Celery AI worker
```

The current project documentation indicates the backend can be started from the repository root using:

```bash
docker compose up -d
```

Do not change backend startup assumptions as part of a frontend-only task.

---

# 42. Environment Variables

Expected frontend API configuration:

```text
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Never commit:

- passwords
- private tokens
- API secrets
- production credentials

to the repository.

Public Next.js environment variables must contain only values safe to expose to the browser.

---

# 43. Logging

Never log:

- JWTs
- refresh tokens
- passwords
- OTPs
- private item secrets
- verification answers
- private phone numbers
- private emails

Development logs should use safe identifiers.

---

# 44. Final AI Coding-Agent Rules

Any AI coding agent working on LIYUID must follow these rules:

### Rule A

Preserve the existing product concept.

### Rule B

Do not expose private item photos publicly.

### Rule C

Do not weaken anonymous communication.

### Rule D

Do not convert Telegram into a chat system.

### Rule E

Do not expose private verification information.

### Rule F

Do not treat AI matching as proof of ownership.

### Rule G

Do not treat hiding `/staff` as security.

### Rule H

Do not invent backend APIs or business rules.

### Rule I

Do not replace real Addis identity with generic startup imagery unless explicitly requested.

### Rule J

Do not redesign an existing approved screen unnecessarily when asked only to fix functionality.

### Rule K

Preserve bilingual support.

### Rule L

Preserve responsive behavior.

### Rule M

Preserve accessibility.

### Rule N

When uncertain, inspect the existing implementation/backend contract before changing behavior.

---

# 45. Source-of-Truth Hierarchy

When multiple sources disagree, use this order:

```text
1. Actual backend API contract
2. Existing working implementation
3. This AI_FRONTEND_CONTEXT.md
4. Approved product/SRS requirements
5. Design references/screenshots
6. AI assumptions
```

**AI assumptions are always the lowest priority.**

Never invent functionality simply because it appears visually convenient.

---

# 46. Definition of Done

A frontend feature is complete only when:

```text
Functionality
    ✓ Works with the real API
    ✓ Handles loading
    ✓ Handles errors
    ✓ Handles empty state

Security
    ✓ Correct authorization
    ✓ No sensitive data leakage
    ✓ No unsafe browser storage
    ✓ No private data in URLs

UX
    ✓ Clear primary action
    ✓ Responsive
    ✓ Accessible
    ✓ Localized
    ✓ Consistent with LIYUID design system

Quality
    ✓ TypeScript passes
    ✓ No unnecessary duplication
    ✓ No fake production data
    ✓ No invented API behavior
    ✓ Existing functionality remains intact
```

---

# 47. Project Identity Summary

LIYUID is not a public bulletin board.

It is a **privacy-first lost-and-found recovery platform**.

The experience should communicate:

```text
Find safely.
Verify privately.
Communicate anonymously.
Reunite securely.
```

The Addis Ababa identity should make the product feel local and authentic.

The privacy architecture should make users feel protected.

The AI matching should reduce the effort of finding the right case.

The handover workflow should make physical reunification controlled and trustworthy.

Every frontend decision should reinforce these principles.
