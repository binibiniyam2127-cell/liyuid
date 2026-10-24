/**
 * Backward-compatible facade re-exporting AuthProvider, useAuth, and AuthContext.
 * Auth domain modules live under `@/features/auth/`.
 */
export {
  AuthProvider,
  useAuth,
  type AuthContextType,
  getToken,
  setToken,
  clearSession,
  hasActiveSession,
} from "@/features/auth";
