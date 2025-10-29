import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient"; // 💚 Import Gradient

// 💚 A darker shade of the primary color for the gradient
const darkerGreen = "#004d40"; // You can adjust this or pull from your colors theme

export default function Header({
  title = "",
  subtitle = "GIEWELLZON REALTY",
  showBack = false,
}) {
  const nav = useNavigation();

  const rippleColor = "rgba(255, 255, 255, 0.2)";

  return (
    // 💚 Use LinearGradient for the background
    <LinearGradient
      colors={[colors.primary, darkerGreen]}
      style={styles.headerContainer}
    >
      <View style={styles.headerRow}>
        {/* 🧩 Left Icon (Menu or Back) */}
        <View style={styles.iconContainer}>
          {showBack ? (
            <Pressable
              onPress={() => nav.goBack()}
              hitSlop={12}
              android_ripple={{ color: rippleColor, borderless: true }}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              {/* 🧩 Outline icon */}
              <Ionicons
                name="chevron-back-outline"
                size={26} // Slightly larger for outlines
                color={colors.white}
              />
            </Pressable>
          ) : (
            <Pressable
              onPress={() => nav.dispatch(DrawerActions.openDrawer())}
              hitSlop={12}
              android_ripple={{ color: rippleColor, borderless: true }}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              {/* 🧩 Outline icon */}
              <Ionicons
                name="menu-outline"
                size={26}
                color={colors.white}
              />
            </Pressable>
          )}
        </View>

        {/* 🎨 Centered Title Block */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {/* 🪶 Subtitle with Icon */}
          <View style={styles.subtitleWrapper}>
            <Ionicons
              name="home-outline"
              size={12} // Small icon
              color={styles.subtitle.color}
            />
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
        </View>

        {/* 🧩 Right Spacer (to balance the left icon) */}
        <View style={styles.iconContainer} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    // 🎨 Compact vertical height
    paddingTop: 48, // Keep for status bar
    paddingBottom: 14, // Reduced from 16
    // 💚 Subtler rounded corners
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    // 💚 Softer shadow
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // 🎨 Horizontal padding
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 36, // Smaller, balanced touch target
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
  },
  // ✍️ Typography
  title: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 22, // Larger
    letterSpacing: 0.5, // Airy look
    marginBottom: 2, // Breathing room
  },
  subtitleWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.7)", // Lighter contrast
    fontSize: 12,
    letterSpacing: 0.5, // Airy look
    marginLeft: 4, // Space from icon
  },
});