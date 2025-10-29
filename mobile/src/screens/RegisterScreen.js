import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Dimensions, // --- Import Dimensions ---
} from "react-native";
import { colors } from "../theme/colors";
import { api } from "../api/client";
import { endpoints } from "../api/endpoints";
import { notifySuccess, notifyError } from "../utils/notify";
import { Ionicons } from "@expo/vector-icons"; // --- Import Ionicons ---

// --- NEW: Reused Custom Input Component from LoginScreen ---
function UnderlineInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  returnKeyType,
  onSubmitEditing,
  showVisibilityToggle = false,
  onToggleVisibility,
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, isFocused && styles.inputFocused]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize || "none"}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          underlineColorAndroid="transparent"
        />
        {showVisibilityToggle && (
          <Pressable onPress={onToggleVisibility} hitSlop={5} style={styles.eyeIcon}>
            <Ionicons
              name={secureTextEntry ? "eye-off-outline" : "eye-outline"}
              size={22}
              color={colors.muted}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}


export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // --- NEW: State for password visibility ---
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);

  function validate() {
    if (!username || !email || !password) {
      setError("Username, email and password are required.");
      return false;
    }
    if (password.length < 6) { // Example: Add minimum password length check
       setError("Password must be at least 6 characters long.");
       return false;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return false;
    }
    // Simple email format check (basic)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
       setError("Please enter a valid email address.");
       return false;
    }
    return true;
  }

  async function onSubmit() {
    if (!validate()) return; // Use the validation function first
    setLoading(true);
    setError("");
    try {
      const payload = { username, email, password, fullName };
      const res = await api.post(endpoints.auth.register, payload);
      const msg = res?.data?.message || "Registered successfully. Please check your email for verification/approval.";
      notifySuccess(msg);
      navigation.navigate("Login"); // Navigate back to Login
    } catch (e) {
      console.error("Register failed:", e);
      const message = e?.response?.data?.message || e.message || "Registration failed.";
      setError(message);
      notifyError(message);
    } finally {
      setLoading(false);
    }
  }

  const goToLogin = () => {
    navigation.navigate("Login");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.screenContainer}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Image
              source={require("../../assets/complogo.jpg")} // Double-check path
              style={styles.logo}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.appName}>Giewellzon Realty</Text>
          {/* --- NEW: Added Tagline --- */}
          <Text style={styles.tagline}>ADMIN REGISTRATION PORTAL</Text>
          <View style={styles.underline} />
        </View>

        <View style={styles.formCard}>
          {/* --- MODIFIED: Using UnderlineInput for all fields --- */}
          <UnderlineInput
            label="USERNAME"
            value={username}
            onChangeText={setUsername}
            placeholder="Choose a username"
            autoCapitalize="none"
            returnKeyType="next"
          />
          <UnderlineInput
            label="FULL NAME"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your full name"
            autoCapitalize="words" // Capitalize words for names
            returnKeyType="next"
          />
          <UnderlineInput
            label="EMAIL ADDRESS"
            value={email}
            onChangeText={setEmail}
            placeholder="name@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
          />
          <UnderlineInput
            label="PASSWORD"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter a password (min. 6 chars)"
            secureTextEntry={!isPasswordVisible}
            returnKeyType="next"
            showVisibilityToggle={true}
            onToggleVisibility={() => setIsPasswordVisible(!isPasswordVisible)}
          />
          <UnderlineInput
            label="CONFIRM PASSWORD"
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Confirm your password"
            secureTextEntry={!isConfirmVisible}
            returnKeyType="go" // Last field before submit
            onSubmitEditing={onSubmit} // Submit on keyboard 'go'
            showVisibilityToggle={true}
            onToggleVisibility={() => setIsConfirmVisible(!isConfirmVisible)}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            onPress={onSubmit}
            disabled={loading}
            style={({ pressed }) => [
              styles.button,
              loading && styles.buttonDisabled,
              pressed && !loading && styles.buttonPressed,
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>REGISTER</Text>
            )}
          </Pressable>

          {/* --- MODIFIED: Login Link --- */}
          <Pressable onPress={goToLogin} style={styles.loginButton}>
             <Ionicons name="arrow-back-outline" size={16} color={colors.textSecondary} />
             <Text style={styles.loginLink}> Back to Login</Text>
          </Pressable>

        </View>
      </ScrollView>

      {/* --- Footer --- */}
      <View style={styles.footer}>
         <Text style={styles.footerText}>© 2025 Giewellzon Realty</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

// --- MODIFIED: Adapted Styles from LoginScreen ---
const screenHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContentContainer: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 30,
    paddingTop: screenHeight * 0.08, // Start slightly lower than login maybe
    paddingBottom: 60,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30, // Slightly less margin than login
  },
  logoCircle: {
    width: 90, // Slightly smaller logo maybe
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.light,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 20,
     shadowColor: "#000",
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.1,
     shadowRadius: 4,
     elevation: 3,
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  appName: {
    color: colors.text,
    fontWeight: "600",
    fontSize: 26, // Slightly smaller than login maybe
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 1,
  },
  tagline: { // Used for "ADMIN REGISTRATION PORTAL"
    color: colors.textSecondary,
    fontSize: 11, // Smaller
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  underline: {
    height: 2,
    width: 30,
    backgroundColor: colors.danger,
    marginTop: 12,
  },
  formCard: {
    width: "100%",
    backgroundColor: colors.white,
    borderRadius: 25,
    padding: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
    marginTop: 20,
  },
  // --- Input Group Styles ---
  inputGroup: {
    width: '100%',
    marginBottom: 20, // Slightly less margin between inputs
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 10,
    paddingHorizontal: 0,
  },
  inputFocused: {
    borderBottomColor: colors.primary,
  },
  eyeIcon: {
    paddingLeft: 10,
    paddingVertical: 10,
  },
  errorText: {
    color: colors.danger || "#D9534F",
    textAlign: "center",
    marginTop: 5, // Space above error
    marginBottom: 15,
    fontSize: 14,
    fontWeight: "500",
  },
  // --- Button Styles ---
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 10,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: 'row',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: colors.muted,
    opacity: 0.7,
     shadowOpacity: 0,
     elevation: 0,
  },
  buttonPressed: {
    backgroundColor: '#0A431F',
    transform: [{ scale: 0.98 }],
     shadowOpacity: 0.1,
  },
  buttonText: {
    color: colors.white,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 1,
  },
  // --- Login Link Styles ---
  loginButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
  },
  loginLink: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
   // --- Footer Styles ---
  footer: {
     position: 'absolute',
     bottom: 0,
     left: 0,
     right: 0,
     paddingVertical: 15,
     alignItems: 'center',
  },
  footerText: {
     color: colors.muted,
     fontSize: 12,
  },
});