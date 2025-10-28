import React from "react";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

export default function FAB({ onPress }) {
  return (
    <Pressable onPress={onPress} style={{ position: "absolute", right: 20, bottom: 24 }}>
      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", elevation: 5 }}>
        <Ionicons name="add" size={28} color="#fff" />
      </View>
    </Pressable>
  );
}