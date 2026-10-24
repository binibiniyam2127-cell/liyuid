import {
  HandoverResponse,
  MunicipalIntakePayload,
  MunicipalIntakeResponse,
  MunicipalReleasePayload,
  MunicipalReleaseResponse,
  NotifyMunicipalDropoffPayload,
  NotifyMunicipalDropoffResponse,
} from "@/lib/types";
import { request } from "./client";

export const handoverApi = {
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

  async regenerateHandoverCode(
    handoverId: string
  ): Promise<{ one_time_code: string; expires_at: string }> {
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
};
