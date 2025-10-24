import axios from "axios";
import { endpoints } from "./endpoints";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from "../utils/storage";

export const api = axios.create({
  // Endpoints already include "/api", so keep baseURL empty to avoid "/api/api"
  baseURL: import.meta.env.VITE_API_BASE,
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let queue = [];
function flushQueue(error, token = null) {
  queue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  );
  queue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config || {};
    if (err.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) =>
          queue.push({ resolve, reject })
        ).then((token) => {
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const rt = getRefreshToken();
        if (!rt) throw new Error("No refresh token");
        const r = await axios.post(endpoints.auth.refresh, {
          refreshToken: rt,
        });
        setTokens(r.data.accessToken, r.data.refreshToken);
        api.defaults.headers.Authorization = `Bearer ${r.data.accessToken}`;
        flushQueue(null, r.data.accessToken);
        return api(original);
      } catch (e) {
        flushQueue(e, null);
        clearTokens();
        if (window.location.pathname.startsWith("/admin"))
          window.location.href = "/admin/login";
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(err);
  }
);
