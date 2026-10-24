import {
  FlagResponse,
  ResolveFlagPayload,
  StaffLoginRequest,
  TokenResponse,
} from "@/lib/types";
import { request, setStaffToken } from "./client";

export const staffApi = {
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
