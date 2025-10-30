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
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { getMe, changePassword, updateMe } from "../api/users";
import Header from "../components/Header";
import { colors } from "../theme/colors";
import { notifySuccess, notifyError } from "../utils/notify";
import { useAuth } from "../providers/AuthProvider";
import { Ionicons } from "@expo/vector-icons";

// --- NEW: Helper to get initials ---
const getInitials = (name) => {
  if (!name) return "A"; // Admin fallback
  const parts = name.split(" ");
  if (parts.length === 1) return name.charAt(0).toUpperCase();
  return (
    parts[0].charAt(0).toUpperCase() + parts[parts.length - 1].charAt(0).toUpperCase()
  );
};

// --- NEW: Profile Hero Component ---
// Features a small, professional initials circle
function ProfileHero({ name, email }) {
  return (
    <View style={styles.heroContainer}>
      <View style={styles.initialsCircle}>
        <Text style={styles.initialsText}>{getInitials(name)}</Text>
      </View>
      <View style={styles.heroTextContainer}>
        <Text style={styles.heroName}>{name || "Admin User"}</Text>
        <Text style={styles.heroEmail}>{email}</Text>
      </View>
    </View>
  );
}

// --- NEW: Premium Input Row Component ---
// This mimics a native settings list item (label on left, input on right)
function ProfileInputRow({
  icon,
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  editable = true,
  lastItem = false,
}) {
  return (
    <View>
      <View style={styles.rowContainer}>
        <View style={styles.rowLeft}>
          <Ionicons
            name={icon}
            size={22}
            style={[
              styles.rowIcon,
              !editable && styles.rowIconDisabled, // Mute icon if non-editable
            ]}
          />
          <Text style={styles.rowLabel}>{label}</Text>
        </View>
        <TextInput
          style={[
            styles.rowInput,
            !editable && styles.rowInputDisabled,
            editable && styles.rowInputActive,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          editable={editable}
          autoCapitalize="none"
        />
      </View>
      {/* --- NEW: Inset separator --- */}
      {!lastItem && <View style={styles.separator} />}
    </View>
  );
}

// --- NEW: Form Group Component (Title only) ---
function FormGroup({ title }) {
  return <Text style={styles.groupTitle}>{title}</Text>;
}

// --- NEW: Standalone Primary Button ---
function PrimaryButton({ title, onPress, loading, disabled }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        (loading || disabled) && styles.buttonDisabled,
        pressed && styles.buttonPressed,
      ]}
      onPress={onPress}
      disabled={loading || disabled}
    >
      <Text style={styles.buttonText}>
        {loading ? "Saving..." : title}
      </Text>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user: authUser, refreshUserProfile } = useAuth(); // Removed logout
  const [user, setUser] =useState(authUser);
  const [loading, setLoading] = useState(false);
  // Separate loading states for each button
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  const [form, setForm] = useState({
    username: authUser?.username || "",
    fullName: authUser?.fullName || "",
    contactNumber: authUser?.contactNumber || "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });

  // --- Start Unchanged Logic (except loading states) ---
  const loadUser = useCallback(async () => {
    setLoading(true);
    try {
      const userData = await getMe();
      setUser(userData);
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

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [loadUser])
  );

  const handleUpdateProfile = async () => {
    if (!form.username || form.username.trim().length < 3) {
      notifyError("Username is required and must be at least 3 characters.");
      return;
    }
    setIsProfileSaving(true);
    try {
      await updateMe(form);
      notifySuccess("Profile updated successfully!");
      await refreshUserProfile();
      loadUser();
    } catch (error) {
      notifyError(error.response?.data?.message || "Failed to update profile.");
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      notifyError("Please fill in both password fields.");
      return;
    }
    setIsPasswordSaving(true);
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
      setIsPasswordSaving(false);
    }
  };

  const handleFormChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordFormChange = (name, value) => {
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };
  // --- End Unchanged Logic ---

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
      {/* --- MODIFIED: Header is simple --- */}
      <Header navigation={navigation} title="Profile" />
      <ScrollView contentContainerStyle={styles.content}>
        {user && (
          <>
            {/* --- NEW: Hero section --- */}
            <ProfileHero name={form.fullName || user.username} email={user.email} />

            {/* --- MODIFIED: Using new FormGroup and Card/Row layout --- */}
            <FormGroup title="Account Details" />
            <View style={styles.card}>
              <ProfileInputRow
                icon="mail-outline"
                label="Email"
                value={user.email}
                editable={false}
              />
              <ProfileInputRow
                icon="at-outline"
                label="Username"
                value={form.username}
                onChangeText={(val) => handleFormChange("username", val)}
                placeholder="e.g. admin_user"
              />
              <ProfileInputRow
                icon="person-outline"
                label="Full Name"
                value={form.fullName}
                onChangeText={(val) => handleFormChange("fullName", val)}
                placeholder="Your Full Name"
              />
              <ProfileInputRow
                icon="call-outline"
                label="Contact"
                value={form.contactNumber}
                onChangeText={(val) => handleFormChange("contactNumber", val)}
                placeholder="Your Contact Number"
                keyboardType="phone-pad"
                lastItem={true} // No divider
              />
            </View>
            <PrimaryButton
              title="Save Profile"
              onPress={handleUpdateProfile}
              loading={isProfileSaving}
            />

            {/* --- MODIFIED: Security Section --- */}
            <FormGroup title="Security" />
            <View style={styles.card}>
              <ProfileInputRow
                icon="lock-closed-outline"
                label="Current Password"
                secureTextEntry
                value={passwordForm.currentPassword}
                onChangeText={(val) =>
                  handlePasswordFormChange("currentPassword", val)
                }
                placeholder="Required"
              />
              <ProfileInputRow
                icon="key-outline"
                label="New Password"
                secureTextEntry
                value={passwordForm.newPassword}
                onChangeText={(val) =>
                  handlePasswordFormChange("newPassword", val)
                }
                placeholder="Set new password"
                lastItem={true} // No divider
              />
            </View>
            <PrimaryButton
              title="Update Password"
              onPress={handleChangePassword}
              loading={isPasswordSaving}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

// --- MODIFIED: Styles completely overhauled for a premium look ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7", // A very light grey, common in settings
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    paddingBottom: 50,
  },
  // --- NEW: Hero Styles ---
  heroContainer: {
    padding: 20,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  initialsCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  initialsText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "600",
  },
  heroTextContainer: {
    flex: 1,
  },
  heroName: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
  },
  heroEmail: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // --- NEW: FormGroup styles ---
  groupTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
    textTransform: "uppercase",
    paddingHorizontal: 16,
    paddingTop: 32,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 10,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden", // To clip children
  },
  // --- NEW: ProfileInputRow styles ---
  rowContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "transparent",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowIcon: {
    color: colors.primary,
    marginRight: 16,
    width: 24,
  },
  rowIconDisabled: {
    color: colors.muted,
  },
  rowLabel: {
    fontSize: 16,
    color: colors.text,
  },
  rowInput: {
    flex: 1,
    fontSize: 16,
    textAlign: "right",
    padding: 0, // Remove default padding
    marginLeft: 16,
  },
  rowInputActive: {
    color: colors.primary,
  },
  rowInputDisabled: {
    color: colors.textSecondary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 56, // Inset = 16 (padding) + 24 (icon) + 16 (margin)
  },
  // --- NEW: Standalone Button Styles ---
  button: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    margin: 16, // Standalone margin
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonDisabled: {
    backgroundColor: colors.muted,
  },
  buttonPressed: {
    opacity: 0.8,
  },
});