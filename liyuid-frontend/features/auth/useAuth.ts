import { createContext, useContext } from "react";
import { UserRegister, UserSettingsResponse } from "@/lib/types";

export interface AuthContextType {
  user: UserSettingsResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (emailOrPhone: string, pass: string) => Promise<void>;
  register: (payload: UserRegister) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
