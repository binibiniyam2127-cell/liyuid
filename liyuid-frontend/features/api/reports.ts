import {
  ItemResponse,
  MatchCandidate,
  MatchItemDetail,
  ReportCreate,
} from "@/lib/types";
import { request } from "./client";

export const reportsApi = {
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

  async confirmMatchWithCode(
    matchId: string,
    code: string
  ): Promise<{ status: string; message: string; is_verified?: boolean }> {
    return request<{ status: string; message: string; is_verified?: boolean }>(
      `/matches/${matchId}/confirm-code`,
      {
        method: "POST",
        body: JSON.stringify({ code }),
      }
    );
  },

  async resendMatchCode(
    matchId: string
  ): Promise<{ status: string; message: string; email?: string }> {
    return request<{ status: string; message: string; email?: string }>(
      `/matches/${matchId}/resend-code`,
      {
        method: "POST",
      }
    );
  },

  async escalateUnresponsive(
    matchId: string,
    notes?: string
  ): Promise<{ status: string; case_id: string; message: string; assigned_desk?: string }> {
    return request<{ status: string; case_id: string; message: string; assigned_desk?: string }>(
      `/matches/${matchId}/escalate-unresponsive`,
      {
        method: "POST",
        body: JSON.stringify({ notes }),
      }
    );
  },

  async findMatches(itemId: string): Promise<MatchCandidate[]> {
    return request<MatchCandidate[]>(`/reports/${itemId}/find-matches`, {
      method: "POST",
    });
  },

  async uploadDocument(
    itemId: string,
    file: File
  ): Promise<{ message: string; filename: string }> {
    const formData = new FormData();
    formData.append("file", file);

    return request<{ message: string; filename: string }>(
      `/reports/${itemId}/upload-document`,
      {
        method: "POST",
        body: formData,
      }
    );
  },
};
