import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  ImageBackground,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Pressable,
  useWindowDimensions,
  Platform,
  Alert,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import {
  getProperty, // Fetches Property and populates its 'units' array
  toggleFeatured,
  delProperty,
  deleteUnit,
} from "../api/properties";
import { toAbsoluteUrl } from "../api/client";
import { colors } from "../theme/colors";
import { notifyError, notifySuccess } from "../utils/notify";
import { Ionicons } from "@expo/vector-icons";

export default function PropertyDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { propertyId } = route.params;
  const { width } = useWindowDimensions();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  const mainImageUrl = useMemo(() => {
    return toAbsoluteUrl(
      property?.thumbnail ||
        property?.photos?.[0] ||
        "https://placehold.co/600x400?text=No+Image"
    );
  }, [property]);

  const loadProperty = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProperty(propertyId); // API populates property.units
      setProperty(data);
    } catch (error) {
      notifyError("Failed to load property details.");
      console.error("Load Property Error:", error.response?.data || error);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useFocusEffect(
    useCallback(() => {
      loadProperty();
    }, [loadProperty])
  );

  // --- Actions ---

  const handleToggleFeatured = async () => {
    // --- Add try block ---
    try {
      if (!property) return; // Keep the guard clause inside try

      // Call the API to toggle the status
      const updated = await toggleFeatured(property._id, property.featured);

      // Reload the full property data AFTER the toggle succeeds
      await loadProperty();

      notifySuccess(
        `Property ${updated.featured ? "featured" : "unfeatured"}.`
      );
      // --- Add catch block ---
    } catch (error) {
      notifyError("Failed to update featured status.");
      console.error("Toggle Feature Error:", error);
    }
  };

  const handleDelete = async () => {
    // ... (Keep existing handleDelete function - no changes needed)
    if (!property) return;

    const deleteLogic = async () => {
      try {
        await delProperty(property._id);
        notifySuccess("Property deleted successfully.");
        navigation.goBack(); // Go back to the list
      } catch (error) {
        notifyError("Failed to delete property.");
        console.error("Delete Property Error:", error);
      }
    };

    const alertTitle = "Delete Property";
    const alertMessage =
      "Are you sure you want to permanently delete this property and all its units? This action cannot be undone."; // Updated message

    if (Platform.OS === "web") {
      const confirmed = window.confirm(alertMessage);
      if (confirmed) await deleteLogic();
    } else {
      Alert.alert(alertTitle, alertMessage, [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: deleteLogic },
      ]);
    }
  };

  const handleDeleteUnit = async (unitId) => {
    // ... (Keep existing handleDeleteUnit function - no changes needed)
    if (!unitId) return;

    const deleteLogic = async () => {
      try {
        await deleteUnit(unitId);
        notifySuccess("Unit deleted successfully.");
        loadProperty(); // Refresh property data
      } catch (error) {
        notifyError("Failed to delete unit.");
        console.error("Delete Unit Error:", error);
      }
    };

    const alertTitle = "Delete Unit";
    const alertMessage =
      "Are you sure you want to permanently delete this unit?";

    if (Platform.OS === "web") {
      const confirmed = window.confirm(alertMessage);
      if (confirmed) await deleteLogic();
    } else {
      Alert.alert(alertTitle, alertMessage, [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: deleteLogic },
      ]);
    }
  };

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color={colors.primary}
        style={styles.loader}
      />
    );
  }

  if (!property) {
    return (
      <View style={styles.loader}>
        <Text style={styles.emptyText}>Property not found.</Text>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton} // Ensure this style exists and is positioned correctly
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </Pressable>
      </View>
    );
  }

  // Calculate available units count
  const availableUnitsCount =
    property.units?.filter((u) => u.status === "available").length || 0;

  return (
    <ScrollView style={styles.container}>
      {/* --- Header Image --- */}
      <ImageBackground
        source={{ uri: mainImageUrl }}
        style={styles.image}
        {...(Platform.OS === "web" && { referrerPolicy: "no-referrer" })}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={colors.white}
            style={styles.backButtonIcon} // Added style for potential text shadow
          />
        </Pressable>
        {/* --- FIX: Pass the loaded property object to EditPropertyModal --- */}
        <Pressable
          onPress={() => navigation.navigate("EditPropertyModal", { property })}
          style={styles.editButton}
        >
          <Ionicons
            name="pencil"
            size={20}
            color={colors.white}
            style={styles.backButtonIcon} // Added style for potential text shadow
          />
        </Pressable>
        {property.featured && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>⭐ Featured</Text>
          </View>
        )}
      </ImageBackground>

      {/* --- Content --- */}
      <View style={styles.content}>
        {/* --- Building Title & Location --- */}
        <Text style={styles.title}>{property.propertyName}</Text>
        <Text style={styles.location}>
          <Ionicons name="location-sharp" size={16} color={colors.primary} />{" "}
          {property.city}, {property.province}
          {property.street && `, ${property.street}`}
        </Text>

        {/* --- REMOVED Price (Now per unit) --- */}
        {/* <Text style={styles.price}>...</Text> */}

        {/* --- UPDATED Status (Show available count) --- */}
        <Text
          style={[
            styles.status,
            {
              color:
                availableUnitsCount > 0
                  ? colors.successText
                  : colors.dangerText,
              backgroundColor:
                availableUnitsCount > 0 ? colors.successBg : colors.dangerBg,
            },
          ]}
        >
          {availableUnitsCount > 0
            ? `${availableUnitsCount} Unit(s) Available`
            : "No Units Available"}
        </Text>

        {/* --- Admin Controls (Property Level) --- */}
        <View style={styles.adminSection}>
          <Text style={styles.sectionTitle}>Admin Controls (Building)</Text>
          <View style={styles.adminControls}>
            <Pressable
              style={styles.controlButton}
              onPress={handleToggleFeatured}
            >
              <Ionicons
                name={property.featured ? "star" : "star-outline"}
                size={20}
                color={colors.primary}
              />
              <Text style={styles.controlButtonText}>
                {property.featured ? "Unfeature" : "Feature"}
              </Text>
            </Pressable>
            {/* REMOVED Unit Increment/Decrement Buttons */}
            <Pressable style={styles.controlButton} onPress={handleDelete}>
              <Ionicons name="trash" size={20} color={colors.danger} />
              <Text
                style={[styles.controlButtonText, { color: colors.danger }]}
              >
                Delete Bldg
              </Text>
            </Pressable>
          </View>
        </View>

        {/* --- Building Description --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About {property.propertyName}</Text>
          <Text style={styles.description}>{property.description}</Text>
        </View>

        {/* --- REMOVED Building Specifications (Now per unit) --- */}
        {/* {property.specifications && (...)} */}

        {/* --- Building Amenities --- */}
        {property.amenities && property.amenities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Building Amenities</Text>
            <View style={styles.amenitiesContainer}>
              {property.amenities.map((amenity, index) => (
                <Text key={index} style={styles.amenityItem}>
                  • {amenity}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* --- Building Photo Gallery --- */}
        {property.photos && property.photos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Building Photo Gallery</Text>
            <FlatList
              data={property.photos}
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

        {/* --- Units Section --- */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Units</Text>
            <Pressable
              style={styles.addButton}
              onPress={() =>
                navigation.navigate("AddUnitModal", {
                  propertyId: property._id,
                })
              }
            >
              <Ionicons name="add-circle" size={24} color={colors.primary} />
              <Text style={styles.addButtonText}>Add Unit</Text>
            </Pressable>
          </View>
        </View>

        {/* --- FIX: Moved the .map() call inside the condition --- */}
        {property.units && property.units.length > 0 ? (
          // If units exist, map over them HERE
          property.units.map((unit) => (
            <Pressable // <-- Add Pressable wrapper if not already there
              key={unit._id}
              style={styles.unitCard}
              onPress={() =>
                navigation.navigate("UnitDetailsScreen", { unitId: unit._id })
              }
            >
              <View style={styles.unitInfo}>
                <Text style={styles.unitNumber}>{unit.unitNumber}</Text>
                <Text style={styles.unitPrice}>
                  ₱ {Number(unit.price).toLocaleString()}
                </Text>
                <Text
                  style={[
                    styles.unitStatus,
                    { color: getStatusColor(unit.status) },
                  ]}
                >
                  {unit.status.charAt(0).toUpperCase() + unit.status.slice(1)}
                </Text>
                <Text style={styles.unitSpecs}>
                  {unit.specifications?.bedrooms
                    ? `${unit.specifications.bedrooms} Bed`
                    : ""}
                  {unit.specifications?.bathrooms
                    ? ` • ${unit.specifications.bathrooms} Bath`
                    : ""}
                  {unit.specifications?.floorArea
                    ? ` • ${unit.specifications.floorArea} sqm`
                    : ""}
                </Text>
              </View>
              <View style={styles.unitActions}>
                <Pressable
                  style={styles.unitActionButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    navigation.navigate("EditUnitModal", { unit });
                  }}
                >
                  <Ionicons name="pencil" size={20} color={colors.primary} />
                </Pressable>
                <Pressable
                  style={styles.unitActionButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteUnit(unit._id);
                  }}
                >
                  <Ionicons name="trash" size={20} color={colors.danger} />
                </Pressable>
              </View>
            </Pressable> // <-- Close Pressable wrapper
          )) // <-- End of .map() call
        ) : (
          // If no units, display the empty text HERE
          <Text style={styles.emptyText}>
            No units added for this property yet.
          </Text>
        )}
        {/* --- END OF FIX --- */}
      </View>
    </ScrollView>
  );
}

// REMOVED SpecItem Component (no longer used at property level)
// const SpecItem = ({ icon, label, value }) => (...);

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

const styles = StyleSheet.create({
  // ... Keep existing styles ...
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1, backgroundColor: colors.white },
  image: {
    width: "100%",
    height: 280,
    backgroundColor: colors.light,
    // Removed justifyContent/flexDirection for absolute positioning of buttons
  },
  backButton: {
    // Keep for back navigation
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 40, // Adjust for status bar
    left: 16,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 20,
    padding: 6,
    zIndex: 10, // Ensure it's above image
  },
  editButton: {
    // Keep for edit navigation
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 40, // Adjust for status bar
    right: 16,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 20,
    padding: 6,
    zIndex: 10, // Ensure it's above image
  },
  backButtonIcon: {
    // Style for icons inside buttons
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  featuredBadge: {
    position: "absolute",
    bottom: 12,
    left: 16,
    backgroundColor: "rgba(255, 215, 0, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  featuredBadgeText: { color: colors.text, fontSize: 12, fontWeight: "bold" },
  content: { padding: 20 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 8,
  },
  location: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 12,
    flexDirection: "row", // Align icon and text
    alignItems: "center",
  },
  price: {
    // Keep style even if element is removed, for consistency
    fontSize: 26,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 12,
  },
  status: {
    // Style for the new status text
    fontSize: 15,
    fontWeight: "600",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: "flex-start",
    overflow: "hidden", // Ensures background respects border radius
    marginBottom: 16,
  },
  section: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
    marginTop: 16,
  },
  sectionHeader: {
    // For Unit section header
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  addButton: {
    // For "Add Unit" button
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  addButtonText: {
    color: colors.primary,
    fontWeight: "600",
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 8, // Reduced margin for sectionHeader case
  },
  description: { fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
  amenitiesContainer: {
    // Style for amenities list
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
  // specGrid removed (was for property specs)
  // specItem removed
  // specLabel removed
  // specValue removed
  galleryImage: {
    // Keep for property gallery
    height: 120,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: colors.light,
  },
  adminSection: {
    backgroundColor: colors.light,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16, // Added margin bottom
  },
  adminControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 8,
  },
  controlButton: { alignItems: "center", padding: 8, flex: 1 }, // Keep for feature/delete
  controlButtonText: {
    color: colors.text,
    fontWeight: "600",
    marginTop: 4,
    fontSize: 13,
  },
  // --- Unit Styles ---
  unitCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  unitInfo: {
    flex: 1,
    marginRight: 10,
  },
  unitNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
  },
  unitPrice: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
    marginTop: 4,
  },
  unitStatus: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 4,
    textTransform: "capitalize",
  },
  unitSpecs: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 6,
  },
  unitActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  unitActionButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyText: {
    // Reusable style
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
    color: colors.muted,
  },
});
