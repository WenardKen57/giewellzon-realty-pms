import { createContext, useContext, useMemo, useState, useEffect } from "react";
import AuthAPI from "../api/auth";
import { UsersAPI } from "../api/users";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  setUser,
  getUser,
  clearUser,
} from "../utils/storage";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(getUser());
  const isAuthenticated = !!user;

  async function login({ emailOrUsername, password }) {
    const r = await AuthAPI.login({ emailOrUsername, password });
    setTokens(r.accessToken, r.refreshToken);
    setUser(r.user);
    setUserState(r.user);
    return r.user;
  }

  async function logout() {
    const rt = getRefreshToken();
    try {
      await AuthAPI.logout(rt);
    } catch {}
    clearTokens();
    clearUser();
    setUserState(null);
  }

  async function register(data) {
    return AuthAPI.register(data);
  }
  async function verifyEmail(data) {
    return AuthAPI.verifyEmail(data);
  }
  async function resendOtp(email) {
    return AuthAPI.resendOtp(email);
  }

  async function refreshProfile() {
    try {
      const me = await UsersAPI.me();
      setUser(me);
      setUserState(me);
      return me;
    } catch {
      return null;
    }
  }

  useEffect(() => {
    const token = getAccessToken();
    if (token) refreshProfile(); // ✅ only call if token exists
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      login,
      logout,
      register,
      verifyEmail,
      resendOtp,
      refreshProfile,
    }),
    [user]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}
