export type SubCity =
  | "Addis Ketema"
  | "Akaky Kaliti"
  | "Arada"
  | "Bole"
  | "Gullele"
  | "Kirkos"
  | "Kolfe Keranio"
  | "Lideta"
  | "Nifas Silk-Lafto"
  | "Yeka"
  | "Lemi Kura";

export const SUB_CITIES: SubCity[] = [
  "Addis Ketema",
  "Akaky Kaliti",
  "Arada",
  "Bole",
  "Gullele",
  "Kirkos",
  "Kolfe Keranio",
  "Lideta",
  "Nifas Silk-Lafto",
  "Yeka",
  "Lemi Kura",
];

export type ItemCategory =
  | "electronics"
  | "documents_ids"
  | "wallets_cards"
  | "keys"
  | "jewelry_accessories"
  | "bags_luggage"
  | "clothing"
  | "other";

export const ITEM_CATEGORIES: { id: ItemCategory; label: string; iconName?: string }[] = [
  { id: "electronics", label: "Electronics & Phones" },
  { id: "documents_ids", label: "National ID & Documents" },
  { id: "wallets_cards", label: "Wallets & Bank Cards" },
  { id: "keys", label: "Keys & Keychains" },
  { id: "jewelry_accessories", label: "Jewelry & Watches" },
  { id: "bags_luggage", label: "Bags & Backpacks" },
  { id: "clothing", label: "Clothing & Apparel" },
  { id: "other", label: "Other Belongings" },
];

export type ProofKind = "imei" | "id_last4" | "contents" | "keychain" | "other";

export const PROOF_KINDS: { id: ProofKind; label: string; placeholder: string; hint: string }[] = [
  {
    id: "imei",
    label: "IMEI / Serial Number (Exact)",
    placeholder: "e.g. 35689109...",
    hint: "Exact serial or IMEI number on the back/box",
  },
  {
    id: "id_last4",
    label: "ID / Card Last 4 Digits",
    placeholder: "e.g. 4819",
    hint: "Last 4 digits of student ID, Kebele ID, or bank card",
  },
  {
    id: "contents",
    label: "Hidden Internal Detail / Secret Compartment",
    placeholder: "e.g. Blue USB drive inside front pocket",
    hint: "Detail inside the item not visible from the outside",
  },
  {
    id: "keychain",
    label: "Distinctive Keychain or Charm",
    placeholder: "e.g. Silver guitar keychain with green strap",
    hint: "Specific distinctive tag, ribbon, or ornament attached",
  },
  {
    id: "other",
    label: "Other Distinctive Feature",
    placeholder: "e.g. Scratch on top left corner",
    hint: "Specific unique mark known only to the real owner",
  },
];

// ============================================================================
// Auth Types
// ============================================================================
export interface UserRegister {
  email: string;
  password: string;
  display_name: string;
  full_name?: string;
  phone_number: string;
  telegram_chat_id?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  display_name: string;
  role: "user" | "staff" | "admin";
  phone_number?: string;
  created_at?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface StaffLoginRequest {
  staff_code: string;
  password: string;
  totp_code: string;
}

// ============================================================================
// Reports / Items
// ============================================================================
export interface ReportCreate {
  type: "lost" | "found";
  category: ItemCategory;
  sub_city: SubCity;
  brand?: string;
  model?: string;
  primary_color: string;
  public_description: string;
  date_from: string; // ISO string
  date_to: string; // ISO string
  proof_kind?: ProofKind;
  proof_primary?: string;
  private_detail?: string;
}

export interface ItemResponse {
  id: string;
  user_id: string;
  type: "lost" | "found";
  category: string;
  sub_city?: string;
  brand?: string;
  model?: string;
  primary_color: string;
  public_description: string;
  status: "active" | "matched" | "verified" | "handover_pending" | "returned" | "archived";
  date_from?: string;
  date_to?: string;
  created_at: string;
}

// ============================================================================
// Matches & Verification
// ============================================================================
export interface MatchCandidate {
  match_id?: string;
  candidate_item_id: string;
  composite_score: number;
  score_breakdown: Record<string, any>;
  explainable_tags: string[];
  is_verified: boolean;
  is_locked: boolean;
}

export interface MatchItemDetail {
  match_id: string;
  candidate_item_id: string;
  finder_display_name: string;
  composite_score: number;
  is_verified: boolean;
  is_locked: boolean;
  score_breakdown: Record<string, any>;
  explainable_tags: string[];
  category: string;
  sub_city?: string;
  brand?: string;
  model?: string;
  primary_color: string;
  public_description: string;
  status: string;
  date_from?: string;
  date_to?: string;
  created_at: string;
}

export interface VerificationStateResponse {
  match_id: string;
  step: "photo" | "proof" | "question" | "passed" | "locked" | "review_requested";
  photo_result: string;
  proof_kind?: string;
  proof_attempts_remaining: number;
  question_attempts_remaining: number;
  cooldown_seconds_remaining: number;
  handover_id?: string;
}

export interface PhotoVerificationResponse {
  photo_result: "passed" | "rejected" | "skipped";
  message: string;
}

export interface ProofVerificationResponse {
  proof_passed: boolean;
  proof_attempts_remaining: number;
  next_step: string;
  message: string;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface QuestionResponse {
  match_id: string;
  options: QuestionOption[];
}

export interface AnswerVerificationResponse {
  question_passed: boolean;
  question_attempts_remaining: number;
  cooldown_seconds_remaining: number;
  status: string;
  message: string;
  handover_id?: string;
  one_time_code?: string;
}

export interface ReviewRequestResponse {
  status: string;
  message: string;
}

// ============================================================================
// Handovers, Requests, Chat & Settings
// ============================================================================
export interface HandoverResponse {
  id: string;
  match_id: string;
  owner_confirmed: boolean;
  finder_confirmed: boolean;
  status: "pending" | "closed" | "expired" | "open" | "municipal_secured";
  venue?: "direct" | "municipal";
  station_location?: string;
  vault_locker?: string;
  deposit_voucher?: string;
  municipal_notes?: string;
  expires_at: string;
  completed_at?: string;
}

export interface NotifyMunicipalDropoffPayload {
  station_location?: string;
  deposit_voucher?: string;
  notes?: string;
}

export interface NotifyMunicipalDropoffResponse {
  status: string;
  message: string;
  handover_id: string;
  deposit_voucher: string;
  station_location: string;
}

export interface MunicipalIntakePayload {
  vault_locker: string;
  station_location?: string;
  notes?: string;
}

export interface MunicipalIntakeResponse {
  status: string;
  message: string;
  handover_id: string;
  vault_locker: string;
  station_location: string;
  finder_confirmed: boolean;
}

export interface MunicipalReleasePayload {
  otp_code: string;
  government_id_verified?: boolean;
  owner_notes?: string;
}

export interface MunicipalReleaseResponse {
  status: string;
  message: string;
  handover_id: string;
  completed_at: string;
  vault_locker?: string;
}

export interface FinderRequestResponse {
  id: string;
  match_id: string;
  status: "pending" | "accepted" | "deferred";
  next_reminder_at?: string;
  created_at: string;
}

export interface ChatMessageResponse {
  sender_display_name: string;
  text: string;
  created_at: string;
}

export interface UserSettingsResponse {
  display_name: string;
  email?: string;
  phone_number?: string;
  phone_verified: boolean;
  email_verified: boolean;
  telegram_state: string;
}

export interface TelegramLinkResponse {
  bot_username: string;
  deep_link: string;
  expires_in_seconds: number;
}

// ============================================================================
// Staff Portal
// ============================================================================
export interface FlagResponse {
  id: string;
  target_entity: string;
  entity_id: string;
  flagged_by_id?: string;
  reason: string;
  status: "pending" | "resolved" | "dismissed";
  resolution_notes?: string;
  resolved_by_id?: string;
  resolved_at?: string;
  created_at: string;
}

export interface ResolveFlagPayload {
  action: "allow_retry" | "block" | "dismiss" | "notify_finder" | "municipal_deposit" | "police_cert";
  resolution_notes?: string;
}
