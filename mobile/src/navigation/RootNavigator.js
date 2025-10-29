import AddUnitModal from "../screens/modals/AddUnitModal";
import EditUnitModal from "../screens/modals/EditUnitModal";
import UnitDetailsScreen from "../screens/UnitDetailsScreen";
import PhotoViewerScreen from "../screens/PhotoViewerScreen";
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
import { colors } from "../theme/colors";
import { ActivityIndicator, View, Text, StyleSheet } from "react-native";

import {
  BarChart3,
  Home,
  Briefcase,
  Inbox,
  User,
  LogOut,
} from "lucide-react-native";

// Screens
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
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

function CustomDrawerContent(props) {
  const { user, logout } = useAuth();
  
  const logoutColor = "#E74C3C"; 

  return (
    <View style={styles.container}>
      <DrawerContentScrollView {...props}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarPlaceholder}>
            <User color={colors.primary} size={30} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user?.email.split("@")[0] || "Giewellzon User"}
            </Text>
            <Text style={styles.profileEmail}>
              {user?.email || "Welcome"}
            </Text>
          </View>
        </View>

        <DrawerItemList {...props} />

        <View style={styles.logoutSection}>
          <DrawerItem
            label="Logout"
            onPress={logout}
            labelStyle={[styles.drawerLabel, { color: logoutColor }]}
            icon={() => <LogOut color={logoutColor} size={20} />}
          />
        </View>
      </DrawerContentScrollView>

      <View style={styles.brandedFooter}>
        <Text style={styles.brandedFooterText}>© Giewellzon Realty</Text>
        <Text style={styles.brandedFooterText}>All rights reserved.</Text>
      </View>
    </View>
  );
}

function DrawerNavigator() {
  const renderDrawerLabel = (label, focused, color) => (
    <Text
      style={[
        styles.drawerLabel,
        { color, fontWeight: focused ? "600" : "400" },
      ]}
    >
      {label}
    </Text>
  );

  return (
    <Drawer.Navigator
      initialRouteName="Overview"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: colors.white,
        drawerInactiveTintColor: "rgba(255, 255, 255, 0.7)",
        drawerActiveBackgroundColor: "rgba(255, 255, 255, 0.15)",
        drawerStyle: {
          backgroundColor: colors.primary,
          width: 280, 
          borderTopRightRadius: 20,
          borderBottomRightRadius: 20,
        },
        drawerItemStyle: {
          borderRadius: 12,
          marginHorizontal: 15,
        },
        drawerLabelStyle: {
          marginLeft: -10,
        },
      }}
    >
      <Drawer.Screen
        name="Overview"
        component={OverviewScreen}
        options={{
          drawerLabel: ({ focused, color }) =>
            renderDrawerLabel("Overview", focused, color),
          drawerIcon: ({ color }) => <BarChart3 color={color} size={20} />,
        }}
      />
      <Drawer.Screen
        name="Properties"
        component={PropertiesScreen}
        options={{
          drawerLabel: ({ focused, color }) =>
            renderDrawerLabel("Properties", focused, color),
          drawerIcon: ({ color }) => <Home color={color} size={20} />,
        }}
      />
      <Drawer.Screen
        name="Sales"
        component={SalesScreen}
        options={{
          drawerLabel: ({ focused, color }) =>
            renderDrawerLabel("Sales", focused, color),
          drawerIcon: ({ color }) => <Briefcase color={color} size={20} />,
        }}
      />
      <Drawer.Screen
        name="Inquiries"
        component={InquiriesScreen}
        options={{
          drawerLabel: ({ focused, color }) =>
            renderDrawerLabel("Inquiries", focused, color),
          drawerIcon: ({ color }) => <Inbox color={color} size={20} />,
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          drawerLabel: ({ focused, color }) =>
            renderDrawerLabel("Profile", focused, color),
          drawerIcon: ({ color }) => <User color={color} size={20} />,
        }}
      />
    </Drawer.Navigator>
  );
}

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
          <>
            <Stack.Screen name="MainDrawer" component={DrawerNavigator} />
            <Stack.Screen
              name="PropertyDetails"
              component={PropertyDetailsScreen}
              options={{ animation: "slide_from_right" }}
            />
            <Stack.Screen
              name="UnitDetailsScreen"
              component={UnitDetailsScreen}
              options={{ animation: "slide_from_right" }}
            />
            <Stack.Screen
              name="PhotoViewerScreen"
              component={PhotoViewerScreen}
              options={{
                headerShown: false,
                presentation: "fullScreenModal",
              }}
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
              <Stack.Screen name="AddUnitModal" component={AddUnitModal} />
              <Stack.Screen name="EditUnitModal" component={EditUnitModal} />
            </Stack.Group>
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.light,
  },
  container: {
    flex: 1,
    backgroundColor: colors.primary, 
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 30,
    marginBottom: 10,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  profileEmail: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 13,
  },
  logoutSection: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.15)",
    marginTop: 20,
    marginHorizontal: 15, 
    paddingTop: 10, 
  },
  drawerLabel: {
    fontSize: 15, 
    fontWeight: "500",
  },
  brandedFooter: {
    backgroundColor: "rgba(0, 0, 0, 0.2)", 
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.15)", 
  },
  brandedFooterText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },
});