import { authApi } from "./auth";
import {
  ApiError,
  getStaffToken,
  getToken,
  request,
  setStaffToken,
  setToken,
} from "./client";
import { handoverApi } from "./handover";
import { matchesApi } from "./matches";
import { reportsApi } from "./reports";
import { settingsApi } from "./settings";
import { staffApi } from "./staff";

export {
  ApiError,
  getToken,
  setToken,
  getStaffToken,
  setStaffToken,
  request,
  authApi,
  reportsApi,
  matchesApi,
  handoverApi,
  settingsApi,
  staffApi,
};

export const api = {
  ...authApi,
  ...reportsApi,
  ...matchesApi,
  ...handoverApi,
  ...settingsApi,
  ...staffApi,
};
