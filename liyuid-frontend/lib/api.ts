import {
  AnswerVerificationResponse,
  ChatMessageResponse,
  FinderRequestResponse,
  FlagResponse,
  HandoverResponse,
  ItemResponse,
  MatchCandidate,
  MatchItemDetail,
  MunicipalIntakePayload,
  MunicipalIntakeResponse,
  MunicipalReleasePayload,
  MunicipalReleaseResponse,
  NotifyMunicipalDropoffPayload,
  NotifyMunicipalDropoffResponse,
  PhotoVerificationResponse,
  ProofVerificationResponse,
  QuestionResponse,
  ReportCreate,
  ResolveFlagPayload,
  ReviewRequestResponse,
  StaffLoginRequest,
  TelegramLinkResponse,
  TokenResponse,
  UserRegister,
  UserResponse,
  UserSettingsResponse,
  VerificationStateResponse,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// Token management
const TOKEN_KEY = "liyuid_user_token";
const STAFF_TOKEN_KEY = "liyuid_staff_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getStaffToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STAFF_TOKEN_KEY);
}

export function setStaffToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(STAFF_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(STAFF_TOKEN_KEY);
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  isStaff: boolean = false
): Promise<T> {
  const token = isStaff ? getStaffToken() : getToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // If not FormData, default to application/json
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const url = `${API_BASE}${endpoint}`;
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err: any) {
    throw new ApiError(0, "Network connection error. Is the backend server running?", err);
  }

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    let errorData = null;
    try {
      errorData = await response.json();
      if (errorData?.detail) {
        if (typeof errorData.detail === "string") {
          errorDetail = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errorDetail = errorData.detail.map((e: any) => e.msg || JSON.stringify(e)).join(", ");
        }
      }
    } catch {
      // response wasn't JSON
    }
    throw new ApiError(response.status, errorDetail, errorData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // --------------------------------------------------------------------------
  // User Auth
  // --------------------------------------------------------------------------
  async register(payload: UserRegister): Promise<UserResponse> {
    return request<UserResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async login(emailOrPhone: string, password: string): Promise<TokenResponse> {
    const formData = new URLSearchParams();
    formData.append("username", emailOrPhone);
    formData.append("password", password);

    const data = await request<TokenResponse>("/auth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    setToken(data.access_token);
    return data;
  },

  logout() {
    setToken(null);
  },

  async verifyOtp(code: string): Promise<{ status: string; message: string; phone_verified?: boolean; email_verified?: boolean }> {
    return request<{ status: string; message: string; phone_verified?: boolean; email_verified?: boolean }>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  },

  async sendOtp(): Promise<{ status: string; message: string; dev_code?: string }> {
    return request<{ status: string; message: string; dev_code?: string }>("/auth/send-otp", {
      method: "POST",
    });
  },

  // --------------------------------------------------------------------------
  // Reports
  // --------------------------------------------------------------------------
  async createReport(payload: ReportCreate): Promise<ItemResponse> {
    return request<ItemResponse>("/reports", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getMyReports(): Promise<ItemResponse[]> {
    return request<ItemResponse[]>("/reports/mine", {
      method: "GET",
    });
  },

  async getMatches(itemId: string): Promise<MatchItemDetail[]> {
    return request<MatchItemDetail[]>(`/reports/${itemId}/matches`, {
      method: "GET",
    });
  },

  async confirmMatchWithCode(matchId: string, code: string): Promise<{ status: string; message: string; is_verified?: boolean }> {
    return request<{ status: string; message: string; is_verified?: boolean }>(`/matches/${matchId}/confirm-code`, {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  },

  async resendMatchCode(matchId: string): Promise<{ status: string; message: string; email?: string }> {
    return request<{ status: string; message: string; email?: string }>(`/matches/${matchId}/resend-code`, {
      method: "POST",
    });
  },

  async escalateUnresponsive(matchId: string, notes?: string): Promise<{ status: string; case_id: string; message: string; assigned_desk?: string }> {
    return request<{ status: string; case_id: string; message: string; assigned_desk?: string }>(`/matches/${matchId}/escalate-unresponsive`, {
      method: "POST",
      body: JSON.stringify({ notes }),
    });
  },

  async findMatches(itemId: string): Promise<MatchCandidate[]> {
    return request<MatchCandidate[]>(`/reports/${itemId}/find-matches`, {
      method: "POST",
    });
  },

  async uploadDocument(itemId: string, file: File): Promise<{ message: string; filename: string }> {
    const formData = new FormData();
    formData.append("file", file);

    return request<{ message: string; filename: string }>(`/reports/${itemId}/upload-document`, {
      method: "POST",
      body: formData,
    });
  },

  // --------------------------------------------------------------------------
  // Verification Pipeline (Asymmetric / Blind Verification)
  // --------------------------------------------------------------------------
  async getVerificationState(matchId: string): Promise<VerificationStateResponse> {
    return request<VerificationStateResponse>(`/matches/${matchId}/verification`, {
      method: "GET",
    });
  },

  async submitVerificationPhoto(matchId: string, file: File): Promise<PhotoVerificationResponse> {
    const formData = new FormData();
    formData.append("file", file);

    return request<PhotoVerificationResponse>(`/matches/${matchId}/verification/photo`, {
      method: "POST",
      body: formData,
    });
  },

  async submitVerificationProof(matchId: string, proofAttempt: string): Promise<ProofVerificationResponse> {
    return request<ProofVerificationResponse>(`/matches/${matchId}/verification/proof`, {
      method: "POST",
      body: JSON.stringify({ proof_attempt: proofAttempt }),
    });
  },

  async getVerificationQuestion(matchId: string): Promise<QuestionResponse> {
    return request<QuestionResponse>(`/matches/${matchId}/verification/question`, {
      method: "GET",
    });
  },

  async submitVerificationAnswer(matchId: string, optionId: string): Promise<AnswerVerificationResponse> {
    return request<AnswerVerificationResponse>(`/matches/${matchId}/verification/answer`, {
      method: "POST",
      body: JSON.stringify({ option_id: optionId }),
    });
  },

  async requestReview(matchId: string, reason: string): Promise<ReviewRequestResponse> {
    return request<ReviewRequestResponse>(`/matches/${matchId}/verification/request-review`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  // --------------------------------------------------------------------------
  // Finder Requests & Anonymous Chat
  // --------------------------------------------------------------------------
  async getFinderRequests(): Promise<FinderRequestResponse[]> {
    return request<FinderRequestResponse[]>("/finder/requests", {
      method: "GET",
    });
  },

  async acceptFinderRequest(reqId: string): Promise<{ status: string }> {
    return request<{ status: string }>(`/finder/requests/${reqId}/accept`, {
      method: "POST",
    });
  },

  async deferFinderRequest(reqId: string): Promise<{ status: string }> {
    return request<{ status: string }>(`/finder/requests/${reqId}/defer`, {
      method: "POST",
    });
  },

  async getChatMessages(matchId: string): Promise<ChatMessageResponse[]> {
    return request<ChatMessageResponse[]>(`/matches/${matchId}/chat`, {
      method: "GET",
    });
  },

  async sendChatMessage(matchId: string, text: string): Promise<ChatMessageResponse> {
    return request<ChatMessageResponse>(`/matches/${matchId}/chat`, {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  },

  // --------------------------------------------------------------------------
  // Dual Handover
  // --------------------------------------------------------------------------
  async getHandoverByMatch(matchId: string): Promise<HandoverResponse> {
    return request<HandoverResponse>(`/matches/${matchId}/handover`, {
      method: "GET",
    });
  },

  async getHandover(handoverId: string): Promise<HandoverResponse> {
    return request<HandoverResponse>(`/handovers/${handoverId}`, {
      method: "GET",
    });
  },

  async confirmHandover(handoverId: string, finderCode?: string): Promise<HandoverResponse> {
    const payload = finderCode ? { finder_code: finderCode } : {};
    return request<HandoverResponse>(`/handovers/${handoverId}/confirm`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async regenerateHandoverCode(handoverId: string): Promise<{ one_time_code: string; expires_at: string }> {
    return request<{ one_time_code: string; expires_at: string }>(
      `/handovers/${handoverId}/regenerate`,
      {
        method: "POST",
      }
    );
  },

  async notifyMunicipalDropoff(
    handoverId: string,
    payload?: NotifyMunicipalDropoffPayload
  ): Promise<NotifyMunicipalDropoffResponse> {
    return request<NotifyMunicipalDropoffResponse>(`/handovers/${handoverId}/notify-municipal`, {
      method: "POST",
      body: JSON.stringify(payload || {}),
    });
  },

  async notifyMunicipalDropoffByMatch(
    matchId: string,
    payload?: NotifyMunicipalDropoffPayload
  ): Promise<NotifyMunicipalDropoffResponse> {
    return request<NotifyMunicipalDropoffResponse>(`/matches/${matchId}/notify-municipal`, {
      method: "POST",
      body: JSON.stringify(payload || {}),
    });
  },

  async municipalIntake(
    handoverId: string,
    payload: MunicipalIntakePayload
  ): Promise<MunicipalIntakeResponse> {
    return request<MunicipalIntakeResponse>(`/handovers/${handoverId}/municipal-intake`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async municipalIntakeByMatch(
    matchId: string,
    payload: MunicipalIntakePayload
  ): Promise<MunicipalIntakeResponse> {
    return request<MunicipalIntakeResponse>(`/matches/${matchId}/municipal-intake`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async municipalRelease(
    handoverId: string,
    payload: MunicipalReleasePayload
  ): Promise<MunicipalReleaseResponse> {
    return request<MunicipalReleaseResponse>(`/handovers/${handoverId}/municipal-release`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async municipalReleaseByMatch(
    matchId: string,
    payload: MunicipalReleasePayload
  ): Promise<MunicipalReleaseResponse> {
    return request<MunicipalReleaseResponse>(`/matches/${matchId}/municipal-release`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // --------------------------------------------------------------------------
  // User Settings & Telegram Integration
  // --------------------------------------------------------------------------
  async getSettings(): Promise<UserSettingsResponse> {
    return request<UserSettingsResponse>("/settings", {
      method: "GET",
    });
  },

  async linkTelegram(): Promise<TelegramLinkResponse> {
    return request<TelegramLinkResponse>("/settings/telegram/link", {
      method: "POST",
    });
  },

  async simulateTelegramLink(): Promise<{ status: string; telegram_state: string; bot_username: string }> {
    return request<{ status: string; telegram_state: string; bot_username: string }>("/settings/telegram/simulate-link", {
      method: "POST",
    });
  },

  // --------------------------------------------------------------------------
  // Staff Portal (Audience: liyuid:staff)
  // --------------------------------------------------------------------------
  async staffLogin(payload: StaffLoginRequest): Promise<TokenResponse> {
    const data = await request<TokenResponse>("/staff/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setStaffToken(data.access_token);
    return data;
  },

  staffLogout() {
    setStaffToken(null);
  },

  async getStaffProfile(): Promise<{
    id: string;
    staff_code: string;
    full_name: string;
    staff_role: string;
    email: string;
    clearance_level: string;
    jurisdiction: string;
    active_desk: string;
  }> {
    return request("/staff/me", { method: "GET" }, true);
  },

  async getStaffFlags(): Promise<FlagResponse[]> {
    return request<FlagResponse[]>("/staff/flags", { method: "GET" }, true);
  },

  async resolveStaffFlag(
    flagId: string,
    payload: ResolveFlagPayload
  ): Promise<{ message: string; status: string }> {
    return request<{ message: string; status: string }>(
      `/staff/flags/${flagId}/resolve`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      true
    );
  },

  async getStaffDashboardOverview(): Promise<{
    stats: {
      total_reports: number;
      reports_this_week: number;
      open_cases: number;
      pending_checks: number;
      match_rate: string;
      resolved_count: number;
    };
    cases: any[];
  }> {
    return request(
      "/staff/dashboard/overview",
      { method: "GET" },
      true
    );
  },

  async resolveStaffCase(
    matchId: string,
    payload: ResolveFlagPayload
  ): Promise<{ status: string; action: string }> {
    return request(
      `/staff/cases/${matchId}/resolve`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      true
    );
  },

  async getStaffCases(): Promise<any[]> {
    return request(
      "/staff/cases",
      { method: "GET" },
      true
    );
  },

  async getStaffDisputes(): Promise<any[]> {
    return request(
      "/staff/disputes",
      { method: "GET" },
      true
    );
  },

  async resolveStaffDispute(
    disputeId: string,
    payload: ResolveFlagPayload
  ): Promise<{ status: string; action: string }> {
    return request(
      `/staff/disputes/${disputeId}/resolve`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      true
    );
  },

  async getStaffReports(): Promise<{
    stats: {
      total_reports: number;
      lost_count: number;
      found_count: number;
      sub_cities_covered: string;
      reunited_rate: string;
      avg_resolution_window: string;
    };
    sub_city_breakdown: any[];
    recent_reports: any[];
    category_distribution: any[];
  }> {
    return request(
      "/staff/reports",
      { method: "GET" },
      true
    );
  },

  async getStaffAnalytics(): Promise<any> {
    return request(
      "/staff/analytics",
      { method: "GET" },
      true
    );
  },
};
