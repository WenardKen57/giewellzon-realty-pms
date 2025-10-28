import { api } from "./client";
import { endpoints } from "./endpoints";

export async function getMe() {
  const { data } = await api.get(endpoints.users.me);
  return data;
}

export async function changePassword(currentPassword, newPassword) {
  const { data } = await api.patch(endpoints.users.changePassword, {
    currentPassword,
    newPassword,
  });
  return data;
}

// Added function
export async function updateMe(profileData) {
  // profileData should be like { fullName: '...', contactNumber: '...' }
  const { data } = await api.patch(endpoints.users.me, profileData);
  return data;
}