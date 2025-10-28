import React, { useState, useEffect, useCallback, useRef } from "react"; // --- MODIFIED: Added useRef
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
  TextInput, // --- ADDED ---
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
    search: "", // --- ADDED: Search filter ---
    type: "",
    province: "",
    city: "",
  });

  // --- ADDED: State for the search bar input ---
  const [searchQuery, setSearchQuery] = useState("");

  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [modalVisible, setModalVisible] = useState(null);

  // --- ADDED: Ref to track initial mount for effects ---
  const isInitialMount = useRef(true);

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
      // --- MODIFIED: Log the filters being sent to the API ---
      console.log("Loading properties with filters:", activeFilters);
      const response = await listProperties(activeFilters);
      setProperties(response.data || []);
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

  // --- MODIFIED: EFFECT 2: Load Properties on initial mount AND when filters change ---
  // This is the main fix. This runs on mount and whenever `loadProperties`
  // (which depends on `filters`) changes.
  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  // --- MODIFIED: EFFECT 3: Reload properties on screen focus (but skip initial mount) ---
  // This handles reloading data when you navigate *back* to the screen,
  // but skips the very first load (which EFFECT 2 handled).
  useFocusEffect(
    useCallback(() => {
      if (isInitialMount.current) {
        // On mount, `useEffect` (EFFECT 2) already ran.
        // We just mark the initial mount as complete.
        isInitialMount.current = false;
      } else {
        // On subsequent focuses (e.g., navigating back), we reload.
        loadProperties();
      }
    }, [loadProperties])
  );

  // --- Refresh Control ---
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // --- MODIFIED: Clear search query on refresh ---
    setSearchQuery("");
    setFilters((prev) => ({ ...prev, search: "" }));
    // We must await the *new* loadProperties created by the filter change,
    // so we call listProperties directly with cleared filters.

    // Simpler: Just reload all data.
    // Note: The filter state won't update in time for loadProperties()
    // if we don't handle it carefully.
    // Let's just reload provinces and current-filter-properties.
    await Promise.all([loadProperties(), loadProvinces()]);
    setRefreshing(false);
  }, [loadProperties, loadProvinces]); // Keep original dependencies

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

  // --- ADDED: Handle Search Input ---
  const handleSearchSubmit = () => {
    setFilters((prev) => ({ ...prev, search: searchQuery.trim() }));
  };

  // --- ADDED: Handle Search Clear ---
  const handleSearchClear = () => {
    setSearchQuery("");
    setFilters((prev) => ({ ...prev, search: "" }));
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

      {/* --- ADDED: Search Bar --- */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by property name..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit} // For keyboard "Enter"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={handleSearchClear} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>✕</Text>
            </Pressable>
          )}
        </View>
        <Pressable onPress={handleSearchSubmit} style={styles.searchButton}>
          <Text style={styles.searchButtonText}>Search</Text>
        </Pressable>
      </View>

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
  // --- ADDED: Search Bar Styles ---
  searchContainer: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: "center",
  },
  searchWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.light,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    height: 42,
    paddingHorizontal: 12,
    fontSize: 15,
    color: colors.text,
  },
  clearButton: {
    height: 42,
    justifyContent: "center",
    paddingHorizontal: 10,
    backgroundColor: "transparent",
  },
  clearButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  searchButton: {
    marginLeft: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    height: 44, // Match wrapper height + border
    justifyContent: "center",
    borderRadius: 8,
  },
  searchButtonText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 15,
  },
  // --- End of Added Styles ---
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
