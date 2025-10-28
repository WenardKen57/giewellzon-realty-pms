import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native"; // Import useNavigation
import { getMe, changePassword, updateMe } from "../api/users";
import Header from "../components/Header";
import { colors } from "../theme/colors";
import { notifySuccess, notifyError } from "../utils/notify";
import { useAuth } from "../providers/AuthProvider"; // Import useAuth

export default function ProfileScreen() {
  const navigation = useNavigation(); // Get navigation hook
  const { user: authUser, logout, refreshUserProfile } = useAuth(); // Get auth user and logout
  const [user, setUser] = useState(authUser); // Initialize with auth user
  const [loading, setLoading] = useState(false);

  // --- UPDATED STATE: Added username ---
  const [form, setForm] = useState({
    username: authUser?.username || "",
    fullName: authUser?.fullName || "",
    contactNumber: authUser?.contactNumber || "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });

  const loadUser = useCallback(async () => {
    setLoading(true);
    try {
      const userData = await getMe();
      setUser(userData);
      // --- UPDATED: Load username into form ---
      setForm({
        username: userData.username || "",
        fullName: userData.fullName || "",
        contactNumber: userData.contactNumber || "",
      });
    } catch (error) {
      notifyError("Failed to load profile.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  // *** CORRECTED useFocusEffect ***
  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [loadUser])
  );

  const handleUpdateProfile = async () => {
    // --- VALIDATION: Check for username ---
    if (!form.username || form.username.trim().length < 3) {
      notifyError("Username is required and must be at least 3 characters.");
      return;
    }
    // ------------------------------------

    setLoading(true);
    try {
      // 'form' state now includes username, matching the backend
      await updateMe(form);
      notifySuccess("Profile updated successfully!");
      await refreshUserProfile(); // Refresh auth context user
      loadUser(); // Refresh local screen user
    } catch (error) {
      notifyError(error.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      notifyError("Please fill in both password fields.");
      return;
    }
    setLoading(true);
    try {
      await changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      notifySuccess("Password changed successfully!");
      setPasswordForm({ currentPassword: "", newPassword: "" });
    } catch (error) {
      notifyError(
        error.response?.data?.message || "Failed to change password."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordFormChange = (name, value) => {
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  if (loading && !user) {
    return (
      <View style={styles.container}>
        <Header navigation={navigation} title="Profile" />
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.loader}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header navigation={navigation} title="Profile" />
      <ScrollView contentContainerStyle={styles.content}>
        {user && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>My Profile</Text>
            <Text style={styles.emailText}>{user.email}</Text>

            {/* --- ADDED: Username Input --- */}
            <Text style={styles.label}>Username*</Text>
            <TextInput
              style={styles.input}
              value={form.username}
              onChangeText={(val) => handleFormChange("username", val)}
              placeholder="Your Username"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={form.fullName}
              onChangeText={(val) => handleFormChange("fullName", val)}
              placeholder="Your Full Name"
            />

            <Text style={styles.label}>Contact Number</Text>
            <TextInput
              style={styles.input}
              value={form.contactNumber}
              onChangeText={(val) => handleFormChange("contactNumber", val)}
              placeholder="Your Contact Number"
              keyboardType="phone-pad"
            />
            <Pressable
              style={styles.button}
              onPress={handleUpdateProfile}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Saving..." : "Save Profile"}
              </Text>
            </Pressable>
          </View>
        )}

        <View style={[styles.card, { marginTop: 20 }]}>
          <Text style={styles.cardTitle}>Change Password</Text>

          <Text style={styles.label}>Current Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={passwordForm.currentPassword}
            onChangeText={(val) =>
              handlePasswordFormChange("currentPassword", val)
            }
            placeholder="Current Password"
          />

          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={passwordForm.newPassword}
            onChangeText={(val) => handlePasswordFormChange("newPassword", val)}
            placeholder="New Password"
          />

          <Pressable
            style={styles.button}
            onPress={handleChangePassword}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Updating..." : "Update Password"}
            </Text>
          </Pressable>
        </View>

        {/* Logout Button added here for clarity */}
        <Pressable
          style={[styles.button, styles.logoutButton]}
          onPress={logout}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Logout</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 5,
  },
  emailText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: colors.light,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  logoutButton: {
    backgroundColor: colors.secondary, // Use danger color
    marginTop: 30,
    marginBottom: 20,
  },
});
