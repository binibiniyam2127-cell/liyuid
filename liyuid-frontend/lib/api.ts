/**
 * Backward-compatible facade re-exporting API client and domain APIs.
 * Domain modules live under `@/features/api/`.
 */
export {
  ApiError,
  api,
  authApi,
  getStaffToken,
  getToken,
  handoverApi,
  matchesApi,
  reportsApi,
  request,
  setStaffToken,
  setToken,
  settingsApi,
  staffApi,
} from "@/features/api";
