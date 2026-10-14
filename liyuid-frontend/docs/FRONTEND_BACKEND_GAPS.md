# LIYUID: Frontend-Backend Contract Gap Analysis

This document identifies the interface alignment between the current **FastAPI backend (Milestones B1-B8)** and the **Next.js frontend application**, documenting gaps, workarounds implemented, and recommended backend enhancements.

---

### 1. Private Verification Details (3 Independent Aspects)

* **Revised SRS Vision:** The revised SRS specifies at least 3 independent private verification details categorised by aspect:
  * `Marking`
  * `Damage`
  * `Accessory`
  * `Screen content`
  * `Contents`
  * `Identifier`
  * `Other`
* **Current Backend Contract:** [`app/schemas.py`](file:///c:/Users/HP/Downloads/LIYUID/liyuid-backend/app/schemas.py) accepts:
  * `proof_kind: Optional[ProofKindEnum]` (`imei`, `id_last4`, `contents`, `keychain`, `other`)
  * `proof_primary: Optional[str]` (max 128 chars)
  * `private_detail: Optional[str]` (max 256 chars)
* **Frontend Workaround:** The frontend UI collects up to 3 aspect details from the user with clear privacy warnings. It maps the first detail to `proof_primary` and serializes the 2nd and 3rd details into `private_detail` (e.g., `"[Marking]: ... | [Accessory]: ..."`).
* **Recommended Backend Change:** Add a dedicated relational table `item_private_details (id, item_id, aspect_category, ciphertext, salt_hash)` or a PostgreSQL JSONB array with separate salted hashes to facilitate granular multi-aspect verification.

---

### 2. Finder Recovery Request Expiry & Deadlines

* **Revised SRS Vision:** If a finder does not accept a recovery request within a strict time window, the request expires (`Waiting for Finder` $\rightarrow$ `Reminder` $\rightarrow$ `Final Reminder` $\rightarrow$ `Expired`).
* **Current Backend Contract:** `FinderRequest` model includes `next_reminder_at` and `status` (`pending`, `accepted`, `deferred`), but does not expose a concrete `expires_at` timestamp.
* **Frontend Workaround:** The frontend displays high-level neutral waiting states:
  > *"Waiting for finder: We've notified the finder about the possible match. You don't need to do anything right now. We'll notify you when there is an update."*
* **Recommended Backend Change:** Add an `expires_at: datetime` field to `FinderRequest` and expose it in `FinderRequestResponse`. Implement a background Celery task to mark unaccepted requests as `expired` after 72 hours.

---

### 3. In-App Notification Center Endpoint

* **Revised SRS Vision:** Users should have an in-app notification inbox showing alerts when matches are found or when a claim requires review.
* **Current Backend Contract:** Notifications are dispatched via Celery tasks directly to external channels (Telegram Bot deep link `/settings/telegram/link` and SMTP email). There is no database-backed `GET /notifications` endpoint.
* **Frontend Workaround:** The frontend's `/notifications` page dynamically synthesizes alerts by aggregating data from `GET /finder/requests` and `GET /reports/mine`.
* **Recommended Backend Change:** Add a `Notification` database model with fields `(id, user_id, title, message, category, is_read, created_at)` and corresponding endpoints:
  * `GET /notifications`
  * `PATCH /notifications/{id}/read`

---

### 4. Separate Staff Portal Endpoints

* **Revised SRS Vision:** Staff portal with dedicated modules for `/staff/cases`, `/staff/disputes`, `/staff/flags`, `/staff/reports`, and `/staff/analytics`.
* **Current Backend Contract:** Backend provides:
  * `POST /staff/auth/login` (with 2FA TOTP authentication)
  * `GET /staff/flags`
  * `POST /staff/flags/{id}/resolve`
* **Frontend Workaround:** The staff dashboard hosts all moderation tools in a clean tabbed view (`Flags`, `Cases`, `Disputes`, `Reports`, `Analytics`) while actively enforcing the visible privacy boundary:
  > *"Private evidence — Staff cannot access private ownership details."*
* **Recommended Backend Change:** Add `GET /staff/analytics` returning real-time recovery rates, average time to handover, and verification attempt lockout metrics.
