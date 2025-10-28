import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { getAccessToken, clearTokens } from "../api/client"; // Use client functions
import { login as apiLogin, logout as apiLogout } from "../api/auth";
import { getMe } from "../api/users";
import { notifyError } from "../utils/notify"; // For showing login errors

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Start loading

  const loadUserFromToken = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      if (token) {
        const userData = await getMe(); // Fetch user data if token exists
        setUser(userData);
      } else {
        setUser(null); // Ensure user is null if no token
      }
    } catch (error) {
      console.error("Failed to load user from token:", error);
      // If getMe fails (e.g., token expired), clear tokens and user state
      await clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserFromToken();
  }, [loadUserFromToken]);

  const login = useCallback(
    async (emailOrUsername, password) => {
      try {
        const loggedInUser = await apiLogin(emailOrUsername, password);
        setUser(loggedInUser);
        return loggedInUser; // Return user on success
      } catch (error) {
        // Show error notification and re-throw
        notifyError(
          error?.response?.data?.message || "Login failed. Please try again."
        );
        throw error;
      }
    },
    [] // No dependencies needed
  );

  const logout = useCallback(async () => {
    try {
      await apiLogout(); // Call API logout (clears tokens on server/client)
    } catch (error) {
      console.error("Logout failed:", error);
      // Still proceed to clear client-side state
    } finally {
      setUser(null); // Clear user state
    }
  }, []);

  // Refresh user profile data manually if needed elsewhere
  const refreshUserProfile = useCallback(async () => {
     try {
       const freshUserData = await getMe();
       setUser(freshUserData);
     } catch (error) {
       console.error("Failed to refresh user profile:", error);
       // Potentially logout if token is invalid
       if (error?.response?.status === 401) {
         await logout();
       }
     }
  }, [logout])

  const value = useMemo(
    () => ({ user, login, logout, loading, refreshUserProfile }),
    [user, login, logout, loading, refreshUserProfile]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const context = useContext(AuthCtx);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}