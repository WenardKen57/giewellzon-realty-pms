import axios from "axios";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { endpoints } from "./endpoints";

const extra = Constants?.expoConfig?.extra || {};
// Use environment variable directly, fallback to app.config, then localhost
const RAW_API_BASE =
  process.env.EXPO_PUBLIC_API_BASE || extra.apiBase || "http://localhost:5000";

// Ensure API base does NOT end with /api if it's already included in endpoints
// Ensure it DOES end with / if it's just the domain.
let cleanApiBase = RAW_API_BASE;
if (cleanApiBase.endsWith("/api")) {
  cleanApiBase = cleanApiBase.slice(0, -4); // Remove /api if present
}
if (!cleanApiBase.endsWith("/")) {
  cleanApiBase += "/"; // Ensure it ends with /
}

export const API_BASE_URL = cleanApiBase; // e.g., "https://pmas-ws.onrender.com/"

// Convert paths like "properties" or "/properties" to absolute URLs
// Cloudinary secure_url values are already absolute and will pass through.
export function toAbsoluteUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  try {
    // Trim leading slash if present, as API_BASE_URL ends with /
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    const url = new URL(cleanPath, API_BASE_URL);
    return url.href;
  } catch (e) {
    console.error("Error creating absolute URL:", e);
    return path; // Fallback
  }
}

const ACCESS_KEY = "gw_at";
const REFRESH_KEY = "gw_rt";

// --- Storage Functions (Platform specific) ---

export const getAccessToken = async () => {
  try {
    if (Platform.OS === "web") {
      return localStorage.getItem(ACCESS_KEY);
    }
    return await SecureStore.getItemAsync(ACCESS_KEY);
  } catch (e) {
    console.error("Failed to get access token", e);
    return null;
  }
};

export const getRefreshToken = async () => {
  try {
    if (Platform.OS === "web") {
      return localStorage.getItem(REFRESH_KEY);
    }
    return await SecureStore.getItemAsync(REFRESH_KEY);
  } catch (e) {
    console.error("Failed to get refresh token", e);
    return null;
  }
};

export async function setTokens(at, rt) {
  try {
    if (Platform.OS === "web") {
      if (at != null) localStorage.setItem(ACCESS_KEY, at);
      if (rt != null) localStorage.setItem(REFRESH_KEY, rt);
      return;
    }
    if (at != null) await SecureStore.setItemAsync(ACCESS_KEY, at);
    if (rt != null) await SecureStore.setItemAsync(REFRESH_KEY, rt);
  } catch (e) {
    console.error("Failed to set tokens", e);
  }
}

export async function clearTokens() {
  try {
    if (Platform.OS === "web") {
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  } catch (e) {
    console.error("Failed to clear tokens", e);
  }
}

// --- Axios Instance ---

// Base URL should be the domain + /api/ path prefix
export const api = axios.create({
  baseURL: `${API_BASE_URL}api`,
  timeout: 60000,
});

api.interceptors.request.use(async (config) => {
  const at = await getAccessToken();
  if (at) {
    config.headers = config.headers || {}; // Ensure headers object exists
    config.headers.Authorization = `Bearer ${at}`;
  }
  return config;
});

let refreshingPromise = null;

async function refreshTokens() {
  const rt = await getRefreshToken();
  if (!rt) throw new Error("No refresh token");
  // Use a temporary axios instance or fetch to avoid interceptor loop
  const res = await axios.post(`${API_BASE_URL}api/${endpoints.auth.refresh}`, {
    refreshToken: rt,
  });
  await setTokens(res.data.accessToken, res.data.refreshToken);
  return res.data.accessToken;
}

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const originalRequest = err.config || {};
    // Check for 401, ensure it's not the refresh endpoint itself, and not already retried
    if (
      err.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== endpoints.auth.refresh
    ) {
      originalRequest._retry = true; // Mark as retried

      // Avoid multiple refresh attempts simultaneously
      if (!refreshingPromise) {
        refreshingPromise = refreshTokens().finally(() => {
          refreshingPromise = null; // Reset promise after completion/failure
        });
      }

      try {
        const newAccessToken = await refreshingPromise;
        if (newAccessToken) {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          // Important: return the api call with the updated config
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        await clearTokens();
        // Optional: Redirect to login or notify user
        // Consider how to handle this globally (e.g., in AuthProvider)
      }
    }
    // For other errors or if refresh fails, reject the promise
    return Promise.reject(err);
  }
);
