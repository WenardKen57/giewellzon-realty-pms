import { api } from "./axios";
import { endpoints } from "./endpoints";

export const UsersAPI = {
  me: () => api.get(endpoints.users.me).then((r) => r.data),
  updateMe: (data) =>
    api.patch(endpoints.users.updateMe, data).then((r) => r.data),
  changePassword: (data) =>
    api.patch(endpoints.users.changePassword, data).then((r) => r.data),
};

// Export functions directly
export const getProfile = UsersAPI.me;
export const updateProfile = UsersAPI.updateMe;
// Add this line to export changePassword individually
export const changePassword = UsersAPI.changePassword;
