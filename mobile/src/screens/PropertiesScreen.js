import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Image,
  RefreshControl,
  Platform,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { listProperties } from "../api/properties";
import { getProvinces, getCities } from "../api/locations";
import Header from "../components/Header";
import FAB from "../components/FAB";
import PickerModal from "../components/PickerModal";
import { colors } from "../theme/colors";
import { notifyError } from "../utils/notify";
import { toAbsoluteUrl } from "../api/client";

// --- FIX: Aligned with backend model ---
const PROPERTY_TYPES_LIST = [
  "house",
  "condo",
  "apartment",
  "lot",
  "townhouse",
  "villa",
  "compound",
];

// Formatted for the PickerModal
const PROPERTY_TYPES = [
  { label: "All Types", value: "" },
  ...PROPERTY_TYPES_LIST.map((type) => ({
    label: type.charAt(0).toUpperCase() + type.slice(1), // Capitalize label
    value: type,
  })),
];

export default function PropertiesScreen() {
  const navigation = useNavigation();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    type: "",
    province: "",
    city: "",
  });
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [modalVisible, setModalVisible] = useState(null);

  // --- Load Properties based on current filters ---
  const loadProperties = useCallback(async () => {
    setLoading(true);
    setProperties([]); // Clear previous results
    try {
      const activeFilters = Object.entries(filters).reduce(
        (acc, [key, value]) => {
          if (value) acc[key] = value;
          return acc;
        },
        {}
      );
      const data = await listProperties(activeFilters);
      setProperties(data);
    } catch (error) {
      notifyError("Failed to load properties.");
      console.error("Load Properties Error:", error.response?.data || error);
    } finally {
      setLoading(false);
    }
  }, [filters]); // Dependency: filters

  // --- Load Provinces (runs once) ---
  const loadProvinces = useCallback(async () => {
    try {
      const provData = await getProvinces();
      setProvinces([
        { label: "All Provinces", value: "" },
        ...provData.map((p) => ({ label: p, value: p })),
      ]);
    } catch (error) {
      notifyError("Failed to load provinces.");
      console.error("Load Provinces Error:", error.response?.data || error);
    }
  }, []);

  useEffect(() => {
    loadProvinces();
  }, [loadProvinces]); // Runs only on mount

  // --- Fetch Cities when Province changes ---
  const fetchCities = useCallback(async (selectedProvince) => {
    if (selectedProvince) {
      setLoadingCities(true);
      setCities([]);
      try {
        const cityData = await getCities(selectedProvince);
        setCities([
          { label: "All Cities", value: "" },
          ...cityData.map((c) => ({ label: c, value: c })),
        ]);
      } catch (error) {
        notifyError("Failed to load cities for selected province.");
        console.error(
          `Load Cities Error (${selectedProvince}):`,
          error.response?.data || error
        );
        setCities([]);
      } finally {
        setLoadingCities(false);
      }
    } else {
      setCities([]); // Clear cities if province is deselected
      setFilters((prev) => ({ ...prev, city: "" }));
    }
  }, []);

  // --- EFFECT 1: Close Modals whenever the screen gains focus ---
  useFocusEffect(
    useCallback(() => {
      setModalVisible(null); // Force close modals
      return () => {};
    }, [])
  );

  // --- EFFECT 2: Load Properties whenever the screen gains focus OR filters change ---
  useFocusEffect(
    useCallback(() => {
      loadProperties();
    }, [loadProperties]) // Dependency: loadProperties (which depends on filters)
  );

  // --- Refresh Control ---
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadProperties(), loadProvinces()]);
    setRefreshing(false);
  }, [loadProperties, loadProvinces]);

  // --- Handle Filter Selection (when an item is chosen in the modal) ---
  const handleFilterChange = (name, value) => {
    setModalVisible(null);
    setFilters((prev) => {
      const newFilters = { ...prev, [name]: value };
      if (name === "province") {
        newFilters.city = ""; // Reset city filter if province changes
        fetchCities(value); // Fetch new cities based on the selected province
      }
      return newFilters;
    });
  };

  // --- Open a Specific Modal ---
  const openModal = (modalName) => {
    if (modalName === "city") {
      if (filters.province && !loadingCities) {
        setModalVisible(modalName);
      }
    } else {
      setModalVisible(modalName);
    }
  };

  // --- Render Property Card ---
  const renderItem = ({ item }) => (
    <Pressable
      style={styles.card}
      onPress={() =>
        navigation.navigate("PropertyDetails", { propertyId: item._id })
      }
    >
      <Image
        source={{
          uri: toAbsoluteUrl(
            // --- FIX: Read image as a direct string ---
            item.thumbnail ||
              item.photos?.[0] ||
              "https://placehold.co/600x400?text=No+Image"
          ),
        }}
        style={styles.cardImage}
        {...(Platform.OS === "web" && { referrerPolicy: "no-referrer" })}
      />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.propertyName}
        </Text>
        <Text style={styles.cardLocation} numberOfLines={1}>
          {item.city}, {item.province}
        </Text>
        <Text style={styles.cardPrice}>
          ₱ {Number(item.price).toLocaleString()}
        </Text>
        {/* --- FIX: UPDATED PER YOUR REQUEST --- */}
        <Text
          style={[
            styles.cardStatus,
            {
              color:
                item.status === "sold" ? colors.dangerText : colors.successText,
            },
          ]}
        >
          {item.status === "sold" ? "Sold Out" : "Available"}
        </Text>
        {/* --- END OF FIX --- */}
      </View>
      {item.featured && (
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredBadgeText}>⭐ Featured</Text>
        </View>
      )}
    </Pressable>
  );

  // --- Main Component Return ---
  return (
    <View style={styles.container}>
      <Header navigation={navigation} title="Properties" />

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <Pressable
          style={styles.filterButton}
          onPress={() => openModal("type")}
        >
          <Text style={styles.filterButtonText} numberOfLines={1}>
            {PROPERTY_TYPES.find((pt) => pt.value === filters.type)?.label ||
              "Type"}
          </Text>
          <Text style={styles.filterIcon}>▼</Text>
        </Pressable>
        <Pressable
          style={styles.filterButton}
          onPress={() => openModal("province")}
        >
          <Text style={styles.filterButtonText} numberOfLines={1}>
            {filters.province || "Province"}
          </Text>
          <Text style={styles.filterIcon}>▼</Text>
        </Pressable>
        <Pressable
          style={[
            styles.filterButton,
            !filters.province && styles.filterButtonDisabled,
          ]}
          onPress={() => openModal("city")}
          disabled={!filters.province || loadingCities}
        >
          <Text style={styles.filterButtonText} numberOfLines={1}>
            {loadingCities ? "Loading..." : filters.city || "City"}
          </Text>
          <Text
            style={[
              styles.filterIcon,
              (!filters.province || loadingCities) && { color: colors.gray },
            ]}
          >
            ▼
          </Text>
        </Pressable>
      </View>

      {/* Property List */}
      {loading && !refreshing ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.loader}
        />
      ) : (
        <FlatList
          data={properties}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No properties found matching filters.
            </Text>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
        />
      )}

      {/* Add Property Button */}
      <FAB onPress={() => navigation.navigate("AddPropertyModal")} />

      {/* Filter Modals */}
      <PickerModal
        visible={modalVisible === "type"}
        options={PROPERTY_TYPES}
        onClose={() => setModalVisible(null)}
        onSelect={(val) => handleFilterChange("type", val)}
        title="Select Property Type"
      />
      <PickerModal
        visible={modalVisible === "province"}
        options={provinces}
        onClose={() => setModalVisible(null)}
        onSelect={(val) => handleFilterChange("province", val)}
        title="Select Province"
      />
      <PickerModal
        visible={modalVisible === "city"}
        options={cities}
        onClose={() => setModalVisible(null)}
        onSelect={(val) => handleFilterChange("city", val)}
        title="Select City"
      />
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.light,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonText: {
    color: colors.text,
    fontWeight: "600",
    fontSize: 14,
    flexShrink: 1,
    marginRight: 4,
  },
  filterIcon: { fontSize: 10, color: colors.textSecondary },
  filterButtonDisabled: {
    backgroundColor: colors.gray,
    borderColor: colors.gray,
  },
  list: { padding: 16 },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: colors.gray,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
    overflow: "hidden",
  },
  cardImage: { width: "100%", height: 180, backgroundColor: colors.light },
  cardContent: { padding: 16 },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 4,
  },
  cardLocation: { fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  cardPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 4,
  },
  cardStatus: { fontSize: 14, fontWeight: "600" },
  featuredBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(255, 215, 0, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  featuredBadgeText: { color: colors.text, fontSize: 11, fontWeight: "bold" },
});
