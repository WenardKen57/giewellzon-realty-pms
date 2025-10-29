import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { colors } from "../theme/colors";
import { api } from "../api/client";
import { endpoints } from "../api/endpoints";
import { notifySuccess, notifyError } from "../utils/notify";

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function validate() {
    if (!username || !email || !password) {
      setError("Username, email and password are required.");
      return false;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return false;
    }
    return true;
  }

  async function onSubmit() {
    if (!validate()) return;
    setLoading(true);
    setError("");
    try {
      const payload = { username, email, password, fullName };
      const res = await api.post(endpoints.auth.register, payload);
      // Server returns 201 with message and email
      const msg = res?.data?.message || "Registered successfully.";
      // Show a toast so user knows to check email for OTP/approval
      notifySuccess(msg);
      // Navigate back to Login so they can sign in after verification
      navigation.navigate("Login");
    } catch (e) {
      console.error("Register failed:", e);
      const message = e?.response?.data?.message || e.message || "Registration failed.";
      setError(message);
      notifyError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.light }}
    >
      <View style={{ paddingTop: 60, alignItems: "center", paddingHorizontal: 16 }}>
        <View
          style={{
            width: 88,
            height: 88,
            backgroundColor: colors.white,
            borderRadius: 44,
            alignItems: "center",
            justifyContent: "center",
            elevation: 2,
          }}
        >
          <Text style={{ color: colors.primary, fontWeight: "800" }}>GR</Text>
        </View>

        <Text
          style={{
            marginTop: 16,
            color: colors.primary,
            fontWeight: "800",
            fontSize: 18,
          }}
        >
          Admin Registration
        </Text>

        <View
          style={{
            width: "100%",
            marginTop: 24,
            backgroundColor: colors.white,
            borderRadius: 12,
            padding: 16,
            elevation: 2,
          }}
        >
          <Text style={{ fontSize: 12, color: colors.muted }}>Username</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Choose a username"
            autoCapitalize="none"
            style={{
              borderWidth: 1,
              borderColor: colors.gray,
              borderRadius: 8,
              padding: 10,
              marginTop: 6,
              marginBottom: 12,
            }}
          />

          <Text style={{ fontSize: 12, color: colors.muted }}>Full Name</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Full name"
            style={{
              borderWidth: 1,
              borderColor: colors.gray,
              borderRadius: 8,
              padding: 10,
              marginTop: 6,
              marginBottom: 12,
            }}
          />

          <Text style={{ fontSize: 12, color: colors.muted }}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="name@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            style={{
              borderWidth: 1,
              borderColor: colors.gray,
              borderRadius: 8,
              padding: 10,
              marginTop: 6,
              marginBottom: 12,
            }}
          />

          <Text style={{ fontSize: 12, color: colors.muted }}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Enter a password"
            secureTextEntry
            style={{
              borderWidth: 1,
              borderColor: colors.gray,
              borderRadius: 8,
              padding: 10,
              marginTop: 6,
              marginBottom: 12,
            }}
          />

          <Text style={{ fontSize: 12, color: colors.muted }}>Confirm Password</Text>
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Confirm password"
            secureTextEntry
            style={{
              borderWidth: 1,
              borderColor: colors.gray,
              borderRadius: 8,
              padding: 10,
              marginTop: 6,
            }}
          />

          {error ? (
            <Text
              style={{
                color: colors.danger || "#D9534F",
                textAlign: "center",
                marginTop: 12,
                fontSize: 14,
                fontWeight: "600",
              }}
            >
              {error}
            </Text>
          ) : null}

          <Pressable
            onPress={onSubmit}
            disabled={loading}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 12,
              borderRadius: 8,
              marginTop: 16,
              opacity: loading ? 0.7 : 1,
            }}
          >
            <Text style={{ color: "#fff", textAlign: "center", fontWeight: "600" }}>
              {loading ? "Registering..." : "Register"}
            </Text>
          </Pressable>

          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 12 }}>
            <Text style={{ color: colors.muted, marginRight: 6 }}>Already have an account?</Text>
            <Pressable onPress={() => navigation.navigate("Login") }>
              <Text style={{ color: colors.primary, fontWeight: "600" }}>Login</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
