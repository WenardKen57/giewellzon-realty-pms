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
  Dimensions, // --- NEW: For screen height calculation ---
} from "react-native";
import { colors } from "../theme/colors";
import { useAuth } from "../providers/AuthProvider";
import { Ionicons } from "@expo/vector-icons";

// --- REMOVED PremiumInput Component ---

// --- NEW: Custom Input Component matching screenshot style ---
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
  showVisibilityToggle = false, // Prop to show eye icon
  onToggleVisibility, // Function to toggle secureTextEntry
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
          underlineColorAndroid="transparent" // Crucial for Android
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


export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState(""); // Pre-filled example
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false); // State for eye icon

  async function onSubmit() {
    // (Submit logic remains the same)
    if (!emailOrUsername || !password) {
      setError("Please enter both email/username and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login(emailOrUsername, password);
    } catch (e) {
      const message = e?.response?.data?.message || e.message;
      if (message === "Network Error") {
        setError("Network error. Please check your connection.");
      } else if (message) {
        setError(message === "Invalid Credentials" ? "Incorrect email/username or password." : message);
      } else {
        setError("An unknown error occurred. Please try again.");
      }
      console.error("Login failed:", message);
    } finally {
      setLoading(false);
    }
  }

  const goToRegister = () => {
    navigation.navigate('Register');
  };

  return (
    // --- MODIFIED: Removed Gradient, simpler background ---
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.screenContainer}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          {/* --- MODIFIED: Logo in a circle --- */}
          <View style={styles.logoCircle}>
            <Image
              source={require("../../assets/complogo.jpg")} // Double-check path
              style={styles.logo}
              resizeMode="cover" // Use cover for circular clipping
            />
          </View>
          {/* --- MODIFIED: App Name and Tagline Styling --- */}
          <Text style={styles.appName}>Giewellzon Realty</Text>
          <Text style={styles.tagline}>YOUR DREAM HOME STARTS HERE</Text>
          <View style={styles.underline} />
        </View>

        {/* --- MODIFIED: Card and Inputs to match screenshot --- */}
        <View style={styles.formCard}>
           {/* Removed "Admin Login" title to match screenshot */}

          <UnderlineInput
            label="EMAIL ADDRESS OR USERNAME"
            value={emailOrUsername}
            onChangeText={setEmailOrUsername}
            placeholder="admin@giewellzon.com" // Example placeholder
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
             // onSubmitEditing={() => passwordInputRef.current?.focus()} // Add ref if needed
          />

          <UnderlineInput
             // ref={passwordInputRef} // Add ref if needed
            label="PASSWORD"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry={!isPasswordVisible} // Use state here
            returnKeyType="go"
            onSubmitEditing={onSubmit}
            showVisibilityToggle={true} // Show the eye icon
            onToggleVisibility={() => setIsPasswordVisible(!isPasswordVisible)} // Toggle state
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* --- MODIFIED: Button styling --- */}
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
              // --- MODIFIED: Removed icon from button text ---
              <Text style={styles.buttonText}>LOGIN</Text>
            )}
          </Pressable>

          {/* --- MODIFIED: Register Link to mimic screenshot style --- */}
          <Pressable onPress={goToRegister} style={styles.registerButton}>
             <Ionicons name="arrow-back-outline" size={16} color={colors.textSecondary} />
             <Text style={styles.registerLink}> Register an Account</Text>
          </Pressable>

        </View>
      </ScrollView>

      {/* --- NEW: Footer --- */}
      <View style={styles.footer}>
         <Text style={styles.footerText}>© 2025 Giewellzon Realty</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

// --- MODIFIED: Styles updated to match screenshot ---
const screenHeight = Dimensions.get('window').height; // Get screen height

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.white, // Match screenshot background
  },
  scrollContentContainer: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 30, // Adjust padding to match screenshot feel
    paddingTop: screenHeight * 0.1, // Start content lower down
    paddingBottom: 60, // Ensure space above footer
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoCircle: { // --- NEW ---
    width: 100,
    height: 100,
    borderRadius: 50, // Make it circular
    backgroundColor: colors.light, // Placeholder bg if image fails
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', // Clip the image
    marginBottom: 20,
     shadowColor: "#000", // Subtle shadow for the logo circle
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.1,
     shadowRadius: 4,
     elevation: 3,
  },
  logo: {
    width: "100%", // Fit image within the circle
    height: "100%",
  },
  appName: {
    color: colors.text, // Darker text like screenshot
    fontWeight: "600", // Less bold than before
    fontSize: 28, // Larger
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', // Example serif font
    letterSpacing: 1,
  },
  tagline: {
    color: colors.textSecondary,
    fontSize: 12, // Smaller
    marginTop: 8,
    textTransform: 'uppercase', // Uppercase like screenshot
    letterSpacing: 1,
  },
  underline: { // --- NEW ---
    height: 2,
    width: 30,
    backgroundColor: colors.danger, // Using accent red from your theme
    marginTop: 12,
  },
  formCard: {
    width: "100%",
    backgroundColor: colors.white, // Keep white
    borderRadius: 25, // Very rounded corners like screenshot
    padding: 30, // Generous padding
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 }, // More prominent shadow
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
    marginTop: 20, // Space below header section
  },
  // --- NEW: Input Group Styles ---
  inputGroup: {
    width: '100%',
    marginBottom: 25, // Space between input groups
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: 11, // Small label
    fontWeight: '600',
    textTransform: 'uppercase', // Uppercase label
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputRow: { // Container for input and icon
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border, // Default border color
  },
  input: {
    flex: 1, // Take available space
    fontSize: 16,
    color: colors.text,
    paddingVertical: 10, // Adjust padding
    paddingHorizontal: 0, // No horizontal padding needed
  },
  inputFocused: {
    borderBottomColor: colors.primary, // Highlight border on focus
  },
  eyeIcon: {
    paddingLeft: 10, // Space before the icon
    paddingVertical: 10, // Match input padding
  },
  errorText: {
    color: colors.danger || "#D9534F",
    textAlign: "center",
    marginTop: 0, // Error appears right below input
    marginBottom: 15, // Space before button
    fontSize: 14,
    fontWeight: "500",
  },
  // --- Button Styles ---
  button: {
    backgroundColor: colors.primary, // Your green color
    paddingVertical: 16, // Taller button
    borderRadius: 30, // Very rounded corners
    marginTop: 10, // Space above button
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: 'row',
    shadowColor: colors.primary, // Add shadow matching button color
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: colors.muted,
    opacity: 0.7,
     shadowOpacity: 0, // No shadow when disabled
     elevation: 0,
  },
  buttonPressed: {
    backgroundColor: '#0A431F', // Darker green on press
    transform: [{ scale: 0.98 }], // Subtle scale down on press
     shadowOpacity: 0.1, // Reduce shadow on press
  },
  buttonText: {
    color: colors.white,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 1, // Match screenshot text spacing
  },
  // --- Register Link Styles ---
  registerButton: { // Changed from registerContainer
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25, // More space above link
  },
  registerLink: { // Changed from registerText + registerLink
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500', // Medium weight
    marginLeft: 5, // Space after icon
  },
   // --- NEW: Footer Styles ---
  footer: {
     position: 'absolute', // Position at the bottom
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