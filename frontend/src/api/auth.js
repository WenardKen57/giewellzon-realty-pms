import { api } from "./axios";
import { endpoints } from "./endpoints";

const AuthAPI = {
  register: (payload) => api.post(endpoints.auth.register, payload).then((r) => r.data),
  resendOtp: (email) => api.post(endpoints.auth.resendOtp, { email }).then((r) => r.data),
  verifyEmail: (payload) => api.post(endpoints.auth.verifyEmail, payload).then((r) => r.data),
  login: (payload) => api.post(endpoints.auth.login, payload).then((r) => r.data),
  refresh: (refreshToken) => api.post(endpoints.auth.refresh, { refreshToken }).then((r) => r.data),
  logout: (refreshToken) => api.post(endpoints.auth.logout, { refreshToken }).then((r) => r.data),
  forgot: (email) => api.post(endpoints.auth.forgotPassword, { email }).then((r) => r.data),
  reset: (payload) => api.post(endpoints.auth.resetPassword, payload).then((r) => r.data),
};

export default AuthAPI;