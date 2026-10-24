const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// Token management (kept as fallback for environments without cookies)
const TOKEN_KEY = "liyuid_user_token";
const STAFF_TOKEN_KEY = "liyuid_staff_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getStaffToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STAFF_TOKEN_KEY);
}

export function setStaffToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(STAFF_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(STAFF_TOKEN_KEY);
  }
}

let isRefreshing = false;

export async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  isStaff: boolean = false
): Promise<T> {
  const token = isStaff ? getStaffToken() : getToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // If not FormData, default to application/json
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const url = `${API_BASE}${endpoint}`;
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      credentials: "include",
      headers,
    });
  } catch (err: any) {
    throw new ApiError(0, "Network connection error. Is the backend server running?", err);
  }

  // Automatic refresh on 401 if not already refreshing or attempting auth routes
  if (
    response.status === 401 &&
    !isRefreshing &&
    !endpoint.startsWith("/auth/token") &&
    !endpoint.startsWith("/auth/refresh") &&
    !endpoint.startsWith("/auth/logout")
  ) {
    isRefreshing = true;
    try {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        if (refreshData?.access_token) {
          setToken(refreshData.access_token);
          headers.set("Authorization", `Bearer ${refreshData.access_token}`);
        }
        // Retry the original request
        response = await fetch(url, {
          ...options,
          credentials: "include",
          headers,
        });
      } else {
        setToken(null);
      }
    } catch {
      setToken(null);
    } finally {
      isRefreshing = false;
    }
  }

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    let errorData = null;
    try {
      errorData = await response.json();
      if (errorData?.detail) {
        if (typeof errorData.detail === "string") {
          errorDetail = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errorDetail = errorData.detail.map((e: any) => e.msg || JSON.stringify(e)).join(", ");
        }
      }
    } catch {
      // response wasn't JSON
    }
    throw new ApiError(response.status, errorDetail, errorData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
