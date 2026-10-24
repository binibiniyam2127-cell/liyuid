import { getToken, setToken } from "@/features/api";

export { getToken, setToken };

export function clearSession(): void {
  setToken(null);
}

export function hasActiveSession(): boolean {
  return !!getToken();
}
