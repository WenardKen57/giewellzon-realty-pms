import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from "@react-navigation/drawer";
import { useAuth } from "../providers/AuthProvider";
import { colors } from "../theme/colors"; // Import colors
import { ActivityIndicator, View, Text, StyleSheet } from "react-native"; // For loading state and custom content

// Screens
import LoginScreen from "../screens/LoginScreen";
import OverviewScreen from "../screens/OverviewScreen";
import PropertiesScreen from "../screens/PropertiesScreen";
import PropertyDetailsScreen from "../screens/PropertyDetailsScreen";
import SalesScreen from "../screens/SalesScreen";
import InquiriesScreen from "../screens/InquiriesScreen";
import ProfileScreen from "../screens/ProfileScreen";

// Modals
import AddPropertyModal from "../screens/modals/AddPropertyModal";
import EditPropertyModal from "../screens/modals/EditPropertyModal";
import AddSaleModal from "../screens/modals/AddSaleModal";
import EditSaleModal from "../screens/modals/EditSaleModal";

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// --- Custom Drawer Content ---
function CustomDrawerContent(props) {
  const { user, logout } = useAuth(); // Get user and logout from context

  return (
    <DrawerContentScrollView {...props} style={styles.drawerScrollView}>
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerTitle}>GIEWELLZON</Text>
        {user && (
          <Text style={styles.drawerSubtitle}>{user.email || user.username}</Text>
        )}
      </View>
      <DrawerItemList {...props} />
      <View style={styles.drawerFooter}>
        <DrawerItem
          label="Logout"
          onPress={logout} // Directly call logout from AuthContext
          labelStyle={styles.logoutLabel}
          style={styles.logoutItem}
        />
      </View>
    </DrawerContentScrollView>
  );
}

// --- Drawer Screens ---
function DrawerNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="Overview"
      drawerContent={(props) => <CustomDrawerContent {...props} />} // Use custom content component
      screenOptions={{
        headerShown: false, // Screens manage their own header
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.textSecondary,
        drawerLabelStyle: {
          // Keep this minimal, rely on CustomDrawerContent for styling if needed
          fontSize: 14,
          marginLeft: -16, // Adjust to align text properly
        },
        drawerStyle: {
          backgroundColor: colors.white,
          width: 240,
        },
      }}
    >
      <Drawer.Screen name="Overview" component={OverviewScreen} options={{ title: "📊 Overview" }}/>
      <Drawer.Screen name="Properties" component={PropertiesScreen} options={{ title: "🏠 Properties" }}/>
      <Drawer.Screen name="Sales" component={SalesScreen} options={{ title: "💼 Sales" }}/>
      <Drawer.Screen name="Inquiries" component={InquiriesScreen} options={{ title: "📥 Inquiries" }}/>
      <Drawer.Screen name="Profile" component={ProfileScreen} options={{ title: "👤 Profile" }}/>
      {/* Logout is now handled in CustomDrawerContent */}
    </Drawer.Navigator>
  );
}

// --- Main Stack Navigator (Handles Auth State) ---
export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // --- Authenticated Stack ---
          <>
            <Stack.Screen name="MainDrawer" component={DrawerNavigator} />
            <Stack.Screen
              name="PropertyDetails"
              component={PropertyDetailsScreen}
              options={{ animation: "slide_from_right" }}
            />
            <Stack.Group screenOptions={{ presentation: "modal" }}>
              <Stack.Screen
                name="AddPropertyModal"
                component={AddPropertyModal}
              />
              <Stack.Screen
                name="EditPropertyModal"
                component={EditPropertyModal}
              />
              <Stack.Screen name="AddSaleModal" component={AddSaleModal} />
              <Stack.Screen name="EditSaleModal" component={EditSaleModal} />
            </Stack.Group>
          </>
        ) : (
          // --- Unauthenticated Stack ---
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.light,
  },
  drawerScrollView: {
    flex: 1,
  },
  drawerHeader: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 10,
  },
  drawerTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  drawerSubtitle: {
    color: colors.light,
    fontSize: 12,
    marginTop: 4,
  },
  drawerFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 20, // Add some space above the logout
  },
  logoutItem: {
    // Optional: Additional styling for the logout item container
  },
  logoutLabel: {
    color: colors.secondary, // Use secondary color for logout
    fontWeight: "bold",
  },
});