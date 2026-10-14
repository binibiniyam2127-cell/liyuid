<div align="center">

# 🇪🇹 LIYUID — National Lost & Found Recovery Platform
### ልዩ መታወቂያ • AI-Assisted Property Recovery & Municipal Restitution System

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-black?style=for-the-badge&logo=next.js)](https://liyuid-tau.vercel.app)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)](https://liyuid-backend.onrender.com/docs)
[![PostgreSQL](https://img.shields.io/badge/Database-Neon%20pgvector-336791?style=for-the-badge&logo=postgresql)](https://neon.tech)
[![Vercel](https://img.shields.io/badge/Deployment-Vercel-000000?style=for-the-badge&logo=vercel)](https://liyuid-tau.vercel.app)
[![Render](https://img.shields.io/badge/API-Render-46E3B7?style=for-the-badge&logo=render)](https://liyuid-backend.onrender.com)
[![License](https://img.shields.io/badge/License-Proprietary-blue?style=for-the-badge)](#)

<br/>

[**🌐 Live Citizen Portal**](https://liyuid-tau.vercel.app) • [**🏛️ Municipal Staff Portal**](https://liyuid-tau.vercel.app/staff/login) • [**📖 Interactive API Docs**](https://liyuid-backend.onrender.com/docs)

</div>

---

## 📌 Executive Overview

**LIYUID (ልዩ-ID)** is Ethiopia's national intelligent property recovery registry designed for metropolitan administrations (Addis Ababa Sub-Cities), university campuses, and civic transportation hubs. 

By combining **384-dimensional semantic vector embeddings (`pgvector`)**, **spatial geospatial boundaries (`PostGIS`)**, and a **Zero-PII 4-layer challenge-response protocol**, LIYUID eliminates fraudulent claims, guarantees citizen privacy, and automates physical municipal vault custody.

---

## 🌟 Key Platform Features

### 1. 🤖 AI-Powered Zero-PII Semantic Matching
* **HNSW Vector Clustering:** Item descriptions are transformed into 384-dimensional vector embeddings (`all-MiniLM-L6-v2`) inside PostgreSQL using `pgvector`.
* **Cosine Decision Boundaries:** Auto-triages high-confidence matches ($\ge 0.85$), routes borderline matches ($0.65 - 0.84$) for human review, and auto-prunes low-confidence noise ($< 0.65$).
* **Zero PII Exposure:** Citizen phone numbers, full names, and sensitive identifiers are cryptographically masked and never exposed to finders or public search logs.

### 2. 🛡️ 4-Layer Cryptographic Ownership Verification
Before physical contact is authorized, claimants must pass a multi-factor challenge:
1. **Photo Similarity Inspection:** Blind structural verification of item visual markers.
2. **Deterministic Primary Proof:** Exact match against hashed IMEI, serial numbers, or national ID last-4 digits.
3. **Decoy Trait Challenges:** Machine-generated multi-choice questions with random distractors (color, brand, case style).
4. **Dynamic One-Time Password (OTP):** A cryptographic 6-digit release code generated exclusively for the verified owner.

### 3. 🏛️ Municipal Vault Custody & Automated Restitution
* **Automated Shelf Tagging:** Drop-offs are assigned instant physical vault slots (e.g. `Locker B-14`, `Shelf C-03`) at sub-city desks.
* **Instant Citizen Notification:** Owners are immediately dispatched SMS and Telegram alerts upon municipal custody intake.
* **Dual QR Counter Verification:** Desk officers scan citizen QR dockets in under 0.2s and burn the 6-digit release OTP at the counter.

### 4. 👥 Multi-Desk Municipal Governance (Separation of Powers)
* **Cases Desk:** Routine intake, secure vault storage, counter handovers.
* **Disputes Desk:** Independent arbitration tribunal for contested claims and appeal reviews.
* **Flags Desk:** Cybersecurity threat triage (anti-Sybil bot defense, brute-force OTP blocks).
* **Reports Desk:** Immutable citywide audit ledger and tamper-evident CSV/JSON exports.

### 5. 🔐 Zero-Trust Staff Security
* **Argon2 Password Hashing:** State-of-the-art password security across all administrative accounts.
* **Mandatory 2FA (Google Authenticator):** Time-based One-Time Password (TOTP) enforcement on all municipal operations.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Citizens["Citizens (Mobile & Desktop)"]
        A1["Citizen Reporting"]
        A2["Ownership Challenge"]
        A3["Counter Restitution"]
    end

    subgraph Frontend["Frontend Layer (Vercel)"]
        F1["Next.js 14 App Router"]
        F2["TailwindCSS & Amharic Fonts"]
        F3["Client Session & QR Generator"]
    end

    subgraph Backend["API & Logic Layer (Render)"]
        B1["FastAPI Core Engine"]
        B2["PyTorch CPU Embedding Inference"]
        B3["Verification & OTP Service"]
        B4["TOTP 2FA Authentication"]
    end

    subgraph Data["Cloud Data Layer (Neon Cloud)"]
        D1[("PostgreSQL 16 Engine")]
        D2["pgvector (HNSW Index)"]
        D3["PostGIS (Spatial Sub-Cities)"]
        D4["AES-256 Encrypted Vault"]
    end

    Citizens <-->|HTTPS / REST| Frontend
    Frontend <-->|JWT Bearer / CORS| Backend
    Backend <-->|SSL Pooler Connection| Data
```

---

## 📁 Repository Structure

```text
LIYUID/
├── liyuid-frontend/             # Next.js 14 Production Frontend (App Router, Tailwind)
│   ├── app/                     # Citizen portal & /staff municipal workbench
│   ├── components/              # Modular UI cards, modals, QR scanners
│   ├── lib/                     # API client, bilingual dictionaries (Amharic/English)
│   └── vercel.json              # Vercel deployment configuration
│
├── liyuid-backend/              # FastAPI Production Backend Service
│   ├── app/
│   │   ├── main.py              # Core API endpoints & lifecycle logic
│   │   ├── models.py            # SQLAlchemy models (pgvector, PostGIS, JSONB)
│   │   ├── schemas.py           # Pydantic v2 validation contracts
│   │   ├── verification_service.py # Decoy generation & AES-256 GCM encryption
│   │   ├── database.py          # PostgreSQL session management with pool pre-ping
│   │   └── cli.py               # Administrative staff creation CLI
│   └── requirements.txt         # Optimized CPU wheels & lightweight dependencies
│
├── invite_staff.py              # Interactive Municipal Staff Onboarding Tool (with QR)
├── Dockerfile                   # Fail-safe root Dockerfile supporting Render & CI/CD
├── docker-compose.yml           # Local multi-service orchestration (FastAPI + Redis + Postgres)
└── README.md                    # Project documentation
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
* **Python 3.11+**
* **Node.js 18+ & npm**
* **PostgreSQL with `pgvector` & `postgis`** (or Docker)

### 1. Backend Setup
```bash
# Clone the repository
git clone https://github.com/binibiniyam2127-cell/liyuid.git
cd liyuid

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt

# Start backend server
uvicorn app.main:app --reload --port 8000
```
Backend Swagger Documentation will be live at: `http://localhost:8000/docs`

### 2. Frontend Setup
```bash
cd liyuid-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
Frontend will be live at: `http://localhost:3000`

---

## 👮 Municipal Staff Onboarding

To onboard a new municipal desk officer or supervisor, run the interactive onboarding tool:

```powershell
python invite_staff.py
```

The script will guide you through:
1. Entering the **Staff ID Code** (e.g. `MUN-BOLE-03`)
2. Entering the **Officer Full Name** & **Official Email**
3. Selecting their **Desk Role** (`Cases Officer`, `Disputes Arbitrator`, `Security Officer`, etc.)
4. Assigning or auto-generating a secure initial password

### Instant Google Authenticator 2FA Setup
The tool generates an instant **QR Code Link**:
* The officer opens the link in their browser.
* Scans the QR code with **Google Authenticator** or **Microsoft Authenticator** on their phone.
* Logs in at `https://liyuid-tau.vercel.app/staff/login` with their 6-digit TOTP code.

To view all active staff members in the registry:
```powershell
python invite_staff.py --list
```

---

## 🔒 Security & Privacy Commitments

* **Zero-Credential Git Policy:** All production database secrets, API tokens, and private keys remain strictly outside version control.
* **AES-256 GCM Secret Encryption:** Private proof markers and 2FA secrets are encrypted at rest.
* **Non-Reversible TOTP Security:** Staff authentication enforces RFC 6238 time-synchronized 6-digit tokens.
* **Role-Based Least Privilege:** Officers can only access desks aligned with their assigned jurisdiction and responsibilities.

---

## 📄 License & Attribution

Designed and engineered for national property recovery and civic governance in Ethiopia.  
**City Administration of Addis Ababa • Sub-City Restitution Stations • LIYUID Core Team**
