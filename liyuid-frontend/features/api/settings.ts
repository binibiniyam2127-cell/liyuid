import {
  TelegramLinkResponse,
  UserSettingsResponse,
} from "@/lib/types";
import { request } from "./client";

export const settingsApi = {
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
    return request<{ status: string; telegram_state: string; bot_username: string }>(
      "/settings/telegram/simulate-link",
      {
        method: "POST",
      }
    );
  },
};
