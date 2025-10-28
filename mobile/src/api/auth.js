import { api, setTokens, clearTokens, getRefreshToken } from "./client";
import { endpoints } from "./endpoints";

export async function login(emailOrUsername, password) {
  const { data } = await api.post(endpoints.auth.login, {
    emailOrUsername,
    password,
  });
  // Assuming backend returns { accessToken, refreshToken, user }
  await setTokens(data.accessToken, data.refreshToken);
  return data.user; // Return user object to AuthProvider
}

export async function logout() {
  try {
    const rt = await getRefreshToken();
    if (rt) {
      // Send refresh token for server-side revocation
      await api.post(endpoints.auth.logout, { refreshToken: rt });
    }
  } catch (error) {
    // Log error but proceed with client-side cleanup
    console.error("Logout API call failed:", error);
  } finally {
    // Always clear tokens locally regardless of API call success
    await clearTokens();
  }
}