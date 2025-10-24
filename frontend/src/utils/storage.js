const AT_KEY = "gw_at";
const RT_KEY = "gw_rt";
const USER_KEY = "gw_user";

export function setTokens(at, rt) { if (at) localStorage.setItem(AT_KEY, at); if (rt) localStorage.setItem(RT_KEY, rt); }
export function getAccessToken() { return localStorage.getItem(AT_KEY); }
export function getRefreshToken() { return localStorage.getItem(RT_KEY); }
export function clearTokens() { localStorage.removeItem(AT_KEY); localStorage.removeItem(RT_KEY); }
export function setUser(u) { localStorage.setItem(USER_KEY, JSON.stringify(u || null)); }
export function getUser() { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } }
export function clearUser() { localStorage.removeItem(USER_KEY); }