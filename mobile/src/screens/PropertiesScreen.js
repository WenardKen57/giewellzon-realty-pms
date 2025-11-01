import React, { useState, useEffect, useCallback, useRef } from "react";
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
  TextInput,
  LayoutAnimation,
  UIManager,
  Alert,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { listProperties, delProperty } from "../api/properties";
import { getProvinces, getCities } from "../api/locations";
import Header from "../components/Header";
import FAB from "../components/FAB";
import PickerModal from "../components/PickerModal";
import EditPropertyModal from "../screens/modals/EditPropertyModal"; // Import the modal
import { colors } from "../theme/colors";
import { notifyError, notifySuccess } from "../utils/notify";
import { toAbsoluteUrl } from "../api/client";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- LOGIC UNCHANGED ---
const PROPERTY_TYPES_LIST = [
  "house",
  "condo",
  "apartment",
  "lot",
  "townhouse",
  "villa",
  "compound",
];

const PROPERTY_TYPES = [
  { label: "All Types", value: "" },
  ...PROPERTY_TYPES_LIST.map((type) => ({
    label: type.charAt(0).toUpperCase() + type.slice(1),
    value: type,
  })),
];
// --- END LOGIC UNCHANGED ---

export default function PropertiesScreen() {
  const navigation = useNavigation();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    propertyType: "",
    province: "",
    city: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [modalVisible, setModalVisible] = useState(null);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const isInitialMount = useRef(true);

  // --- NEW STATE for Edit Modal ---
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);

  // --- All backend/fetching logic below is UNCHANGED ---

  const loadProperties = useCallback(async () => {
    setLoading(true);
    setProperties([]);
    try {
      const activeFilters = Object.entries(filters).reduce(
        (acc, [key, value]) => {
          if (value) acc[key] = value;
          return acc;
        },
        {}
      );
      const response = await listProperties(activeFilters);
      setProperties(response.data || []);
    } catch (error) {
      notifyError("Failed to load properties.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadProvinces = useCallback(async () => {
    try {
      const provData = await getProvinces();
      setProvinces([
        { label: "All Provinces", value: "" },
        ...provData.map((p) => ({ label: p, value: p })),
      ]);
    } catch (error) {
      notifyError("Failed to load provinces.");
    }
  }, []);

  useEffect(() => {
    loadProvinces();
  }, [loadProvinces]);

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
        setCities([]);
      } finally {
        setLoadingCities(false);
      }
    } else {
      setCities([]);
      setFilters((prev) => ({ ...prev, city: "" }));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setModalVisible(null);
      return () => {};
    }, [])
  );

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  useFocusEffect(
    useCallback(() => {
      if (isInitialMount.current) {
        isInitialMount.current = false;
      } else {
        loadProperties();
      }
    }, [loadProperties])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setSearchQuery("");
    setFilters({ search: "", propertyType: "", province: "", city: "" });
    setCities([]);
    try {
      const response = await listProperties({});
      setProperties(response.data || []);
      await loadProvinces();
    } catch (error) {
      notifyError("Failed to refresh properties.");
    } finally {
      setRefreshing(false);
    }
  }, [loadProvinces]);

  const handleFilterChange = (name, value) => {
    setModalVisible(null);
    setFilters((prev) => {
      const newFilters = { ...prev, [name]: value };
      if (name === "province") {
        newFilters.city = "";
        fetchCities(value);
      }
      return newFilters;
    });
  };

  const handleSearchSubmit = () => {
    setFilters((prev) => ({ ...prev, search: searchQuery.trim() }));
  };

  // --- THIS IS YOUR ANIMATION LOGIC (UNCHANGED) ---
  const toggleFilterPanel = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    setFiltersVisible((prev) => !prev);
  };

  const handleClearFilters = () => {
    setFilters({ search: "", propertyType: "", province: "", city: "" });
    setSearchQuery("");
    setCities([]);
  };

  const openModal = (modalName) => {
    if (modalName === "city") {
      if (filters.province && !loadingCities) {
        setModalVisible(modalName);
      }
    } else {
      setModalVisible(modalName);
    }
  };

  const getTypeLabel = (value) => {
    return PROPERTY_TYPES.find((p) => p.value === value)?.label || "";
  };
  // --- END OF UNCHANGED LOGIC ---

  // --- MODIFIED: Opens the Edit Modal ---
  const handleEditProperty = (property) => {
    setSelectedProperty(property); // Set the full property object
    setEditModalVisible(true); // Open the modal
  };

  // --- NEW: Handles successful save from modal ---
  const handleEditSave = () => {
    setEditModalVisible(false);
    setSelectedProperty(null);
    loadProperties(); // Refresh the list to show changes
  };

  const handleDeleteProperty = (propertyId) => {
    console.log("DELETE property:", propertyId);
    Alert.alert(
      "Delete Property",
      "Are you sure you want to delete this property? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Call backend to delete
              await delProperty(propertyId);

              // Optimistically remove from UI
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setProperties((prev) => prev.filter((p) => p._id !== propertyId));

              notifySuccess("Property deleted successfully.");
            } catch (error) {
              console.error("Failed to delete property:", error);
              notifyError(
                error?.response?.data?.message || "Failed to delete property."
              );
            }
          },
        },
      ]
    );
  };

  // --- renderItem ---
  const renderItem = ({ item }) => {
    const isSold = item.status === "sold";
    const successLight = "rgba(40, 167, 69, 0.1)";
    const dangerLight = "rgba(220, 53, 69, 0.1)";

    return (
      <View style={styles.card}>
        <Pressable
          onPress={() =>
            navigation.navigate("PropertyDetails", { propertyId: item._id })
          }
        >
          <Image
            source={{
              uri: toAbsoluteUrl(
                item.thumbnail ||
                  item.photos?.[0] ||
                  "https://placehold.co/600x400?text=No+Image"
              ),
            }}
            style={styles.cardImage}
            {...(Platform.OS === "web" && { referrerPolicy: "no-referrer" })}
          />
        </Pressable>

        <View style={styles.cardContent}>
          <View>
            <View style={styles.cardTopRow}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.propertyName}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: isSold ? dangerLight : successLight,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color: isSold ? colors.dangerText : colors.successText,
                    },
                  ]}
                >
                  {isSold ? "Sold" : "Available"}
                </Text>
              </View>
            </View>

            {item.price ? (
              <Text style={styles.cardPrice}>
                {`₱${item.price.toLocaleString()}`}
              </Text>
            ) : null}

            <Text style={styles.cardLocation} numberOfLines={1}>
              {item.city}, {item.province}
            </Text>
          </View>

          <View style={styles.cardActions}>
            <Pressable
              style={[styles.actionButton, styles.editButton]}
              // --- MODIFIED: Pass the entire 'item' object ---
              onPress={() => handleEditProperty(item)}
            >
              <Ionicons
                name="create-outline"
                size={16}
                color={colors.primary}
              />
              <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                Edit
              </Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteProperty(item._id)}
            >
              <Ionicons name="trash-outline" size={16} color={colors.danger} />
              <Text style={[styles.actionButtonText, { color: colors.danger }]}>
                Delete
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  // --- Main Component Return (Layout Unchanged) ---
  return (
    <View style={styles.container}>
      <Header navigation={navigation} title="Properties" />

      {/* Search & Filter Bar (Unchanged) */}
      <View style={styles.searchSection}>
        <View style={styles.searchAndFilterRow}>
          <View style={styles.searchInputWrapper}>
            <Pressable
              onPress={handleSearchSubmit}
              style={styles.searchIconLeft}
            >
              <Ionicons name="search" size={22} color={colors.textSecondary} />
            </Pressable>
            <TextInput
              style={styles.searchInput}
              placeholder="Search properties..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
            />
          </View>
          <Pressable
            style={styles.filterToggleButton}
            onPress={toggleFilterPanel}
          >
            <Ionicons
              name={filtersVisible ? "close" : "filter-outline"}
              size={24}
              color={colors.primary}
            />
          </Pressable>
        </View>

        <View style={styles.badgeContainer}>
          {filters.propertyType ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{getTypeLabel(filters.propertyType)}</Text>
            </View>
          ) : null}
          {filters.province ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{filters.province}</Text>
            </View>
          ) : null}
          {filters.city ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{filters.city}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Collapsible Filter Panel (Unchanged) */}
      {filtersVisible && (
        <View style={styles.filterPanel}>
          <Pressable
            style={styles.filterButton}
            onPress={() => openModal("type")}
          >
            <Text style={styles.filterButtonText} numberOfLines={1}>
              {PROPERTY_TYPES.find((pt) => pt.value === filters.propertyType)?.label ||
                "Select Type"}
            </Text>
            <Ionicons
              name="chevron-down-outline"
              size={18}
              color={colors.textSecondary}
            />
          </Pressable>
          <Pressable
            style={styles.filterButton}
            onPress={() => openModal("province")}
          >
            <Text style={styles.filterButtonText} numberOfLines={1}>
              {filters.province || "Select Province"}
            </Text>
            <Ionicons
              name="chevron-down-outline"
              size={18}
              color={colors.textSecondary}
            />
          </Pressable>
          <Pressable
            style={[
              styles.filterButton,
              !filters.province && styles.filterButtonDisabled,
            ]}
            onPress={() => openModal("city")}
            disabled={!filters.province || loadingCities}
          >
            {/* --- FIX: Changed SmallText to Text --- */}
            <Text style={styles.filterButtonText} numberOfLines={1}>
              {loadingCities ? "Loading..." : filters.city || "Select City"}
            </Text>
            <Ionicons
              name="chevron-down-outline"
              size={18}
              color={
                !filters.province || loadingCities
                  ? colors.gray
                  : colors.textSecondary
              }
            />
          </Pressable>
          <Pressable
            style={styles.clearFilterButton}
            onPress={handleClearFilters}
          >
            <Text style={styles.clearFilterButtonText}>Clear All Filters</Text>
          </Pressable>
        </View>
      )}

      {/* Property List */}
      {loading && !refreshing ? (
        <View style={styles.list}>
          {[1, 2, 3, 4].map((n) => (
            <View key={n} style={[styles.card, styles.placeholderCard]}>
              <View
                style={[
                  styles.cardImage,
                  styles.placeholderBox,
                  { width: 90, height: 90 },
                ]}
              />
              <View style={styles.placeholderContent}>
                <View
                  style={[
                    styles.placeholderBox,
                    { height: 18, width: "70%", marginBottom: 8 },
                  ]}
                />
                <View
                  style={[
                    styles.placeholderBox,
                    { height: 16, width: "40%", marginBottom: 8 },
                  ]}
                />
                <View
                  style={[styles.placeholderBox, { height: 14, width: "50%" }]}
                />
              </View>
            </View>
          ))}
        </View>
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

      {/* FAB (Unchanged) */}
      <FAB onPress={() => navigation.navigate("AddPropertyModal")} />

      {/* Filter Modals (Unchanged logic) */}
      <PickerModal
        visible={modalVisible === "type"}
        options={PROPERTY_TYPES}
        onClose={() => setModalVisible(null)}
        onSelect={(val) => handleFilterChange("propertyType", val)}
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

      {/* --- NEW: Add the EditPropertyModal here --- */}
      <EditPropertyModal
        visible={editModalVisible}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedProperty(null); // Clear selected property on close
        }}
        propertyData={selectedProperty}
        onSave={handleEditSave}
      />
    </View>
  );
}

// --- Stylesheet (Unchanged) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  searchSection: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  searchAndFilterRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.light,
    borderRadius: 12,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIconLeft: {
    paddingLeft: 14,
    paddingRight: 8,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 15,
    color: colors.text,
    paddingRight: 16,
  },
  filterToggleButton: {
    height: 48,
    width: 48,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
    backgroundColor: colors.light,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingTop: 12,
    paddingBottom: 4,
  },
  badge: {
    backgroundColor: colors.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  filterPanel: {
    backgroundColor: colors.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.light,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    height: 48,
  },
  filterButtonText: {
    color: colors.text,
    fontWeight: "500",
    fontSize: 15,
  },
  filterButtonDisabled: {
    backgroundColor: colors.gray,
    borderColor: colors.gray,
  },
  clearFilterButton: {
    marginTop: 8,
    padding: 12,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: colors.light,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearFilterButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },

  // --- Property List & Card Styles ---
  list: {
    padding: 16,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: colors.gray,
  },
  card: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
    padding: 12,
  },
  cardImage: {
    width: 90,
    height: 90,
    borderRadius: 10,
    backgroundColor: colors.light,
  },
  cardContent: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: "space-between",
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  cardTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    color: colors.text,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  cardLocation: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  cardActions: {
    flexDirection: "row",
    marginTop: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  actionButtonText: {
    marginLeft: 5,
    fontSize: 13,
    fontWeight: "500",
  },
  editButton: {
    borderColor: colors.border,
  },
  deleteButton: {
    borderColor: colors.border,
  },
  // --- Placeholder Styles (UNCHANGED) ---
  placeholderCard: {
    flexDirection: "row",
    padding: 12,
  },
  placeholderContent: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: "center",
  },
  placeholderBox: {
    backgroundColor: colors.light,
    borderRadius: 6,
  },
});