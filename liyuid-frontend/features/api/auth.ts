import { TokenResponse, UserRegister, UserResponse } from "@/lib/types";
import { request, setStaffToken, setToken } from "./client";

export const authApi = {
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

    if (data?.access_token) {
      setToken(data.access_token);
    }
    return data;
  },

  async logout(): Promise<void> {
    try {
      await request("/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors on logout
    } finally {
      setToken(null);
      setStaffToken(null);
    }
  },

  async refreshToken(refreshToken?: string): Promise<TokenResponse> {
    const data = await request<TokenResponse>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify(refreshToken ? { refresh_token: refreshToken } : {}),
    });
    if (data?.access_token) {
      setToken(data.access_token);
    }
    return data;
  },

  async getMe(): Promise<UserResponse> {
    return request<UserResponse>("/auth/me", { method: "GET" });
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
};
