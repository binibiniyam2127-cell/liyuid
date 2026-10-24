"use client";

import React, { useEffect, useState } from "react";
import { api, setToken } from "@/lib/api";
import { UserRegister, UserSettingsResponse } from "@/lib/types";
import { AuthContext, AuthContextType, useAuth } from "./useAuth";

export { useAuth, type AuthContextType };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSettingsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      const profile = await api.getSettings();
      setUser(profile);
    } catch {
      // Session might be invalid or expired
      setToken(null);
      setUser(null);
    }
  };

  useEffect(() => {
    // Attempt profile fetch using secure httpOnly cookies or token fallback
    fetchProfile().finally(() => setIsLoading(false));
  }, []);

  const login = async (emailOrPhone: string, pass: string) => {
    await api.login(emailOrPhone, pass);
    await fetchProfile();
  };

  const register = async (payload: UserRegister) => {
    await api.register(payload);
    // After register, log in with user credentials
    await api.login(payload.email, payload.password);
    await fetchProfile();
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  };

  const refreshUser = async () => {
    await fetchProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
