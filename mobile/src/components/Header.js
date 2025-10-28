import React from "react";
import { View, Text, Pressable } from "react-native";
import { colors } from "../theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, DrawerActions } from "@react-navigation/native";

export default function Header({ title = "", subtitle = "GIEWELLZON REALTY", showBack = false }) {
  const nav = useNavigation();
  return (
    <View style={{ backgroundColor: colors.primary, paddingTop: 48, paddingBottom: 12, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          {showBack ? (
            <Pressable onPress={() => nav.goBack()} hitSlop={12}>
              <Ionicons name="chevron-back" size={22} color={colors.white} />
            </Pressable>
          ) : (
            <Ionicons name="home" size={20} color={colors.white} />
          )}
          <View>
            <Text style={{ color: colors.white, fontWeight: "700", fontSize: 18 }}>{title}</Text>
            <Text style={{ color: "#E4E4E4", fontSize: 12 }}>{subtitle}</Text>
          </View>
        </View>
        {!showBack && (
          <Pressable onPress={() => nav.dispatch(DrawerActions.openDrawer())} hitSlop={12}>
            <Ionicons name="menu" size={22} color={colors.white} />
          </Pressable>
        )}
      </View>
    </View>
  );
}