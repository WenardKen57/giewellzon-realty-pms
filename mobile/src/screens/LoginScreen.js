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
import { useAuth } from "../providers/AuthProvider";

export default function LoginScreen() {
  const { login } = useAuth();
  const [emailOrUsername, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!emailOrUsername || !password) return;
    setLoading(true);
    try {
      await login(emailOrUsername, password);
    } catch (e) {
      console.error("Login failed:", e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.light }}
    >
      <View
        style={{ paddingTop: 80, alignItems: "center", paddingHorizontal: 16 }}
      >
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
          GIEWELLZON REALTY
        </Text>
        <Text style={{ color: colors.muted, marginTop: 4 }}>
          Your dream home starts here.
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
          <Text
            style={{
              textAlign: "center",
              fontWeight: "600",
              fontSize: 16,
              marginBottom: 12,
            }}
          >
            Welcome Back
          </Text>

          <Text style={{ fontSize: 12, color: colors.muted }}>
            Email or Username
          </Text>
          <TextInput
            value={emailOrUsername}
            onChangeText={setEmail}
            placeholder="Enter your email or username"
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

          <Text style={{ fontSize: 12, color: colors.muted }}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
            style={{
              borderWidth: 1,
              borderColor: colors.gray,
              borderRadius: 8,
              padding: 10,
              marginTop: 6,
            }}
          />

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
            <Text
              style={{ color: "#fff", textAlign: "center", fontWeight: "600" }}
            >
              {loading ? "Logging in..." : "Login Now"}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
