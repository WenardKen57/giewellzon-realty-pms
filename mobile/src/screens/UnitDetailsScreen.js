import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  Pressable,
  Platform,
  useWindowDimensions, // For gallery image width
  FlatList, // For photo gallery
} from "react-native";
// --- 1. Import useFocusEffect ---
import {
  useRoute,
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";
import { getUnit } from "../api/properties"; // Import the new API function
import { toAbsoluteUrl } from "../api/client";
import { colors } from "../theme/colors";
import { notifyError } from "../utils/notify";
import { Ionicons } from "@expo/vector-icons";

// Helper function (same as in PropertyDetailsScreen)
const getStatusColor = (status) => {
  switch (status) {
    case "available":
      return colors.success;
    case "sold":
      return colors.danger;
    case "rented":
      return colors.info;
    default:
      return colors.muted;
  }
};

export default function UnitDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { unitId } = route.params; // Get unitId passed from navigation
  const { width } = useWindowDimensions();

  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUnit = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUnit(unitId);
      setUnit(data);
    } catch (error) {
      notifyError("Failed to load unit details.");
      console.error("Load Unit Error:", error);
    } finally {
      setLoading(false);
    }
  }, [unitId]);

  // --- 2. Replace useEffect with useFocusEffect ---
  // This ensures loadUnit() runs every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadUnit();
    }, [loadUnit])
  );
  // --- End of Fix ---

  // Determine the main image (first photo or placeholder)
  const mainImageUrl = toAbsoluteUrl(
    unit?.photos?.[0] || "https://placehold.co/600x400?text=No+Unit+Image"
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!unit) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.emptyText}>Unit not found.</Text>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.inlineBackButton}
        >
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={styles.inlineBackButtonText}> Back</Text>
        </Pressable>
      </View>
    );
  }

  // Safely access potentially populated property info
  const propertyInfo = unit.property || {};

  return (
    <ScrollView style={styles.container}>
      {/* --- Header Image (Unit's first photo) --- */}
      <Image
        source={{ uri: mainImageUrl }}
        style={styles.image}
        {...(Platform.OS === "web" && { referrerPolicy: "no-referrer" })}
      />
      {/* Simple Back Button */}
      <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons
          name="arrow-back"
          size={24}
          color={colors.white}
          style={styles.backButtonIcon}
        />
      </Pressable>
      {/* Optional: Edit button for the Unit */}
      <Pressable
        onPress={() => navigation.navigate("EditUnitModal", { unit })}
        style={styles.editButton}
      >
        <Ionicons
          name="pencil"
          size={20}
          color={colors.white}
          style={styles.backButtonIcon}
        />
      </Pressable>

      <View style={styles.content}>
        <Text style={styles.title}>Unit {unit.unitNumber}</Text>
        {/* Link back to parent property if needed */}
        {propertyInfo.propertyName && (
          <Pressable
            onPress={() =>
              navigation.navigate("PropertyDetails", {
                propertyId: propertyInfo._id,
              })
            }
          >
            <Text style={styles.parentPropertyLink}>
              Part of: {propertyInfo.propertyName}
            </Text>
          </Pressable>
        )}
        <Text style={styles.location}>
          <Ionicons name="location-sharp" size={16} color={colors.primary} />{" "}
          {propertyInfo.city}, {propertyInfo.province}
          {propertyInfo.street && `, ${propertyInfo.street}`}
        </Text>

        <Text style={styles.price}>
          ₱ {Number(unit.price).toLocaleString()}
        </Text>

        <Text
          style={[
            styles.status,
            {
              color: getStatusColor(unit.status),
              backgroundColor: getStatusColor(unit.status) + "20",
            },
          ]}
        >
          {unit.status.charAt(0).toUpperCase() + unit.status.slice(1)}
        </Text>
        {unit.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{unit.description}</Text>
          </View>
        )}

        {/* --- Unit Specifications --- */}
        {unit.specifications && Object.keys(unit.specifications).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specifications</Text>
            <View style={styles.specGrid}>
              {Boolean(unit.specifications.floorArea) && (
                <SpecItem
                  icon="home-outline"
                  label="Floor Area"
                  value={`${unit.specifications.floorArea} sqm`}
                />
              )}
              {Boolean(unit.specifications.bedrooms) && (
                <SpecItem
                  icon="bed-outline"
                  label="Bedrooms"
                  value={unit.specifications.bedrooms}
                />
              )}
              {Boolean(unit.specifications.bathrooms) && (
                <SpecItem
                  icon="water-outline"
                  label="Bathrooms"
                  value={unit.specifications.bathrooms}
                />
              )}
              {/* Add other specs if they exist */}
              {Boolean(unit.specifications.lotArea) && (
                <SpecItem
                  icon="map-outline"
                  label="Lot Area"
                  value={`${unit.specifications.lotArea} sqm`}
                />
              )}
              {Boolean(unit.specifications.parking) && (
                <SpecItem
                  icon="car-outline"
                  label="Parking"
                  value={unit.specifications.parking}
                />
              )}
            </View>
          </View>
        )}

        {unit.amenities && unit.amenities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Unit Amenities</Text>
            <View style={styles.amenitiesContainer}>
              {unit.amenities.map((amenity, index) => (
                <Text key={index} style={styles.amenityItem}>
                  • {amenity}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* --- Unit Photo Gallery --- */}
        {unit.photos && unit.photos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Unit Photo Gallery</Text>
            <FlatList
              data={unit.photos}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: toAbsoluteUrl(item) }}
                  style={[styles.galleryImage, { width: width / 2.5 }]}
                  {...(Platform.OS === "web" && {
                    referrerPolicy: "no-referrer",
                  })}
                />
              )}
              contentContainerStyle={{ paddingVertical: 8 }}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// Simple Spec Item Component (similar to PropertyDetailsScreen)
const SpecItem = ({ icon, label, value }) => (
  <View style={styles.specItem}>
    <Ionicons name={icon} size={28} color={colors.primary} />
    <Text style={styles.specLabel}>{label}</Text>
    <Text style={styles.specValue}>{value}</Text>
  </View>
);

// Styles
const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.light,
  },
  inlineBackButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    padding: 10,
  },
  inlineBackButtonText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 16,
  },
  container: { flex: 1, backgroundColor: colors.white },
  image: {
    width: "100%",
    height: 280,
    backgroundColor: colors.light,
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 40,
    left: 16,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 20,
    padding: 6,
    zIndex: 10,
  },
  editButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 40,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 20,
    padding: 6,
    zIndex: 10,
  },
  backButtonIcon: {
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  content: { padding: 20 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 8,
  },
  parentPropertyLink: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: 8,
    textDecorationLine: "underline",
  },
  location: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  price: {
    fontSize: 26,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 12,
  },
  status: {
    fontSize: 15,
    fontWeight: "600",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: "flex-start",
    overflow: "hidden",
    marginBottom: 16,
    textTransform: "capitalize",
  },
  section: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 8,
  },
  // Added descriptionText style
  descriptionText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  specGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginTop: 8,
  },
  specItem: {
    alignItems: "center",
    padding: 10,
    minWidth: 100,
    marginBottom: 10,
    marginRight: 10,
  },
  specLabel: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  specValue: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    marginTop: 2,
  },
  // Added amenity styles
  amenitiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  amenityItem: {
    backgroundColor: colors.light,
    color: colors.textSecondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
    fontSize: 13,
  },
  galleryImage: {
    height: 120,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: colors.light,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
    color: colors.muted,
  },
});
