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
  Platform, // <-- Platform is already imported
  Alert,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import {
  getProperty,
  toggleFeatured,
  incrementUnits,
  decrementUnits,
  delProperty,
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
      const data = await getProperty(propertyId);
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
    if (!property) return;
    try {
      const updated = await toggleFeatured(property._id, property.featured);
      setProperty(updated);
      notifySuccess(
        `Property ${updated.featured ? "featured" : "unfeatured"}.`
      );
    } catch (error) {
      notifyError("Failed to update featured status.");
    }
  };

  const handleIncrement = async () => {
    try {
      const updated = await incrementUnits(property._id);
      setProperty((prev) => ({
        ...prev,
        numberOfUnit: updated.numberOfUnit,
        status: updated.status,
      }));
      notifySuccess("Unit added.");
    } catch (e) {
      notifyError("Failed to increment units.");
    }
  };

  const handleDecrement = async () => {
    if (property.numberOfUnit <= 0) return;
    try {
      const updated = await decrementUnits(property._id);
      setProperty((prev) => ({
        ...prev,
        numberOfUnit: updated.numberOfUnit,
        status: updated.status,
      }));
      notifySuccess("Unit removed.");
    } catch (e) {
      notifyError("Failed to decrement units.");
    }
  };

  // --- *** FIX: MODIFIED DELETE HANDLER FOR WEB *** ---
  const handleDelete = async () => {
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
      "Are you sure you want to permanently delete this property? This action cannot be undone.";

    if (Platform.OS === "web") {
      // Use window.confirm for web
      const confirmed = window.confirm(alertMessage);
      if (confirmed) {
        await deleteLogic();
      }
    } else {
      // Use Alert.alert for native
      Alert.alert(alertTitle, alertMessage, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: deleteLogic, // Call the shared logic
        },
      ]);
    }
  };
  // --- *** END OF FIX *** ---

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
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </Pressable>
      </View>
    );
  }

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
            style={styles.backButtonIcon}
          />
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate("EditPropertyModal", { property })}
          style={styles.editButton}
        >
          <Ionicons
            name="pencil"
            size={20}
            color={colors.white}
            style={styles.backButtonIcon}
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
        {/* --- Title & Price --- */}
        <Text style={styles.title}>{property.propertyName}</Text>
        <Text style={styles.location}>
          <Ionicons name="location-sharp" size={16} color={colors.primary} />{" "}
          {property.city}, {property.province}
          {property.street && `, ${property.street}`}
        </Text>
        <Text style={styles.price}>
          ₱ {Number(property.price).toLocaleString()}
        </Text>

        {/* --- Status --- */}
        <Text
          style={[
            styles.status,
            {
              color:
                property.status === "sold"
                  ? colors.dangerText
                  : colors.successText,
              backgroundColor:
                property.status === "sold" ? colors.dangerBg : colors.successBg,
            },
          ]}
        >
          {property.status === "sold"
            ? "Sold Out"
            : `${property.numberOfUnit || 0} Unit(s) Available`}
        </Text>

        {/* --- Admin Unit Controls --- */}
        <View style={styles.adminSection}>
          <Text style={styles.sectionTitle}>Admin Controls</Text>
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
            <Pressable
              style={styles.controlButton}
              onPress={handleDecrement}
              disabled={property.numberOfUnit <= 0}
            >
              <Ionicons
                name="remove-circle"
                size={20}
                color={
                  property.numberOfUnit <= 0 ? colors.gray : colors.dangerText
                }
              />
              <Text
                style={[
                  styles.controlButtonText,
                  property.numberOfUnit <= 0 && { color: colors.gray },
                ]}
              >
                Dec Unit
              </Text>
            </Pressable>
            <Pressable style={styles.controlButton} onPress={handleIncrement}>
              <Ionicons
                name="add-circle"
                size={20}
                color={colors.successText}
              />
              <Text style={styles.controlButtonText}>Inc Unit</Text>
            </Pressable>

            <Pressable style={styles.controlButton} onPress={handleDelete}>
              <Ionicons name="trash" size={20} color={colors.dangerText} />
              <Text
                style={[styles.controlButtonText, { color: colors.dangerText }]}
              >
                Delete
              </Text>
            </Pressable>
          </View>
        </View>

        {/* --- Description --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{property.description}</Text>
        </View>

        {/* --- Specifications --- */}
        {property.specifications && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specifications</Text>
            <View style={styles.specGrid}>
              {Boolean(property.specifications.floorArea) && (
                <SpecItem
                  icon="home-outline"
                  label="Floor Area"
                  value={`${property.specifications.floorArea} sqm`}
                />
              )}
              {Boolean(property.specifications.bedrooms) && (
                <SpecItem
                  icon="bed-outline"
                  label="Bedrooms"
                  value={property.specifications.bedrooms}
                />
              )}
              {Boolean(property.specifications.bathrooms) && (
                <SpecItem
                  icon="water-outline"
                  label="Bathrooms"
                  value={property.specifications.bathrooms}
                />
              )}
            </View>
          </View>
        )}

        {/* --- Photo Gallery --- */}
        {property.photos && property.photos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photo Gallery</Text>
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
      </View>
    </ScrollView>
  );
}

const SpecItem = ({ icon, label, value }) => (
  <View style={styles.specItem}>
    <Ionicons name={icon} size={28} color={colors.primary} />
    <Text style={styles.specLabel}>{label}</Text>
    <Text style={styles.specValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 16, color: colors.gray },
  container: { flex: 1, backgroundColor: colors.white },
  image: {
    width: "100%",
    height: 280,
    backgroundColor: colors.light,
    justifyContent: "space-between",
    flexDirection: "row",
    paddingTop: 40,
    paddingHorizontal: 16,
  },
  backButton: {
    position: "absolute",
    top: 45,
    left: 16,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 20,
    padding: 6,
  },
  editButton: {
    position: "absolute",
    top: 45,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 20,
    padding: 6,
  },
  backButtonIcon: {
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
  description: { fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
  specGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 8,
  },
  specItem: { alignItems: "center", padding: 10, minWidth: 100 },
  specLabel: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  specValue: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    marginTop: 2,
  },
  galleryImage: {
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
  },
  adminControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 8,
  },
  controlButton: { alignItems: "center", padding: 8, flex: 1 },
  controlButtonText: {
    color: colors.text,
    fontWeight: "600",
    marginTop: 4,
    fontSize: 13,
  },
});
