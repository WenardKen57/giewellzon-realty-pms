import "react-native-gesture-handler";
import React from "react";
import { AuthProvider } from "./src/providers/AuthProvider";
import RootNavigator from "./src/navigation/RootNavigator";
import { LogBox } from "react-native";
import Toast from "react-native-toast-message";
import { colors } from "./src/theme/colors"; // Import colors
import { StatusBar } from "expo-status-bar"; // Import StatusBar

// Ignore specific warnings if needed
LogBox.ignoreLogs([
  "Sending `onAnimatedValueUpdate` with no listeners registered.",
]);

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" backgroundColor={colors.primary} />
      <RootNavigator />
      <Toast />
    </AuthProvider>
  );
}