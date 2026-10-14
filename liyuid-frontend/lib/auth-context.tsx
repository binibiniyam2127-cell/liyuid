"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "./api";
import { UserRegister, UserSettingsResponse } from "./types";

interface AuthContextType {
  user: UserSettingsResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (emailOrPhone: string, pass: string) => Promise<void>;
  register: (payload: UserRegister) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSettingsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      const profile = await api.getSettings();
      setUser(profile);
    } catch (err) {
      // Token might be invalid or expired
      setToken(null);
      setUser(null);
    }
  };

  useEffect(() => {
    const existingToken = getToken();
    if (existingToken) {
      fetchProfile().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
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

  const logout = () => {
    api.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    if (getToken()) {
      await fetchProfile();
    }
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
