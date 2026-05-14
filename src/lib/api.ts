import axios from "axios";

/**
 * Normalises the API base URL so that it always ends with `/api`, regardless
 * of how the deployment env var was configured. This avoids the classic
 * "Route POST /auth/login not found" 404s when someone sets
 * NEXT_PUBLIC_API_URL=https://example.com instead of
 * NEXT_PUBLIC_API_URL=https://example.com/api.
 */
function resolveApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
  const trimmed = raw.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  withCredentials: true
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

let refreshInFlight: Promise<string> | null = null;
const LOGOUT_IN_PROGRESS_KEY = "auth_logout_in_progress";
type RetriableRequestConfig = {
  url?: string;
  headers?: Record<string, string | boolean>;
  _retry?: boolean;
};

async function refreshAccessToken(): Promise<string> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = api
    .post("/auth/refresh", {}, { headers: { "x-skip-refresh-interceptor": "1" } })
    .then(({ data }) => data.token as string)
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error?.config as RetriableRequestConfig | undefined;
    const requestUrl = String(originalRequest?.url ?? "");
    const isAuthEndpoint =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/logout") ||
      requestUrl.includes("/auth/refresh") ||
      requestUrl.includes("/auth/register");
    const isLogoutInProgress =
      typeof window !== "undefined" && localStorage.getItem(LOGOUT_IN_PROGRESS_KEY) === "1";

    if (
      typeof window !== "undefined" &&
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint &&
      !isLogoutInProgress &&
      !(originalRequest.headers?.["x-skip-refresh-interceptor"] ?? false)
    ) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();
        localStorage.setItem("token", newToken);

        // Keep Zustand auth store in sync without creating static import cycles.
        const store = await import("@/store/useAuthStore");
        store.useAuthStore.getState().syncToken(newToken);

        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return api.request(originalRequest);
      } catch {
        localStorage.removeItem("token");
        const store = await import("@/store/useAuthStore");
        store.useAuthStore.getState().syncToken(null);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
