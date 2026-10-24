import { TokenResponse, UserRegister, UserResponse } from "@/lib/types";
import { request, setToken } from "./client";

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
};
