import React, { useEffect, useState, useCallback } from "react"; // Added useCallback
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  StyleSheet, // Added StyleSheet
  Platform, // Added Platform
  RefreshControl, // Added RefreshControl
  ActivityIndicator, // Added ActivityIndicator
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native"; // Added useNavigation and useFocusEffect
import Header from "../components/Header";
import { colors } from "../theme/colors";
import FAB from "../components/FAB";
import { listSales, deleteSale } from "../api/sales";
// Removed modal imports as they are handled differently now
// import AddSaleModal from "./modals/AddSaleModal";
// import EditSaleModal from "./modals/EditSaleModal";
import { notifySuccess, notifyError } from "../utils/notify"; // Added notifications

export default function SalesScreen() {
  const navigation = useNavigation(); // Use navigation hook
  const [stats, setStats] = useState({
    total: 0,
    totalRevenue: 0,
    avgSalePrice: 0,
  });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false); // Added loading state
  const [refreshing, setRefreshing] = useState(false); // Added refreshing state
  // Removed openAdd and edit state, navigation will handle modals

  // --- Load Function ---
  const load = useCallback(async () => {
    setLoading(true); // Indicate loading start
    try {
      const r = await listSales();
      setRows(r.data || []);
      setStats({
        total: r.total || 0,
        totalRevenue: r.totalRevenue || 0,
        avgSalePrice: r.avgSalePrice || 0,
      });
    } catch (error) {
      notifyError("Failed to load sales data.");
      console.error("Load Sales Error:", error);
    } finally {
      setLoading(false); // Indicate loading end
    }
  }, []); // Empty dependency array means load runs once on mount, but focus effect handles reloads

  // --- Reload on Screen Focus ---
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // --- Refresh Handler ---
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  // --- *** UPDATED confirmDelete function *** ---
  const confirmDelete = (id) => {
    const deleteLogic = async () => {
      try {
        console.log(`Attempting to delete sale with ID: ${id}`); // Log attempt
        await deleteSale(id);
        console.log(`Successfully deleted sale ID: ${id}. Reloading list...`); // Log success
        notifySuccess("Sale deleted successfully!"); // Add success notification
        load(); // Reload the list
      } catch (error) {
        // Log detailed error from backend if available
        console.error(
          `Failed to delete sale ID: ${id}`,
          error.response?.data || error
        );
        notifyError(error.response?.data?.message || "Failed to delete sale."); // Show error notification
      }
    };

    const alertTitle = "Delete Sale";
    const alertMessage =
      "Are you sure you want to delete this sale record? This will also mark the associated unit as available again.";

    // Use window.confirm for web, Alert.alert for native
    if (Platform.OS === "web") {
      if (window.confirm(alertMessage)) {
        deleteLogic(); // Call delete logic if confirmed
      }
    } else {
      Alert.alert(alertTitle, alertMessage, [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: deleteLogic }, // Call delete logic on press
      ]);
    }
  };
  // --- *** END OF UPDATE *** ---

  return (
    <View style={styles.container}>
      {/* Use title prop for Header */}
      <Header navigation={navigation} title="Sales" />
      <View style={styles.statsHeader}>
        <Text style={styles.statsHeaderText}>{stats.total} Total Sales</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          // Added RefreshControl
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.kpiRow}>
          <Kpi title="Total Sales" value={stats.total} />
          <Kpi
            title="Total Revenue"
            value={`₱${Number(stats.totalRevenue).toLocaleString()}`}
          />
        </View>
        <View style={styles.avgPriceCard}>
          <Text style={styles.avgPriceLabel}>Average Sale Price</Text>
          <Text style={styles.avgPriceValue}>
            ₱{Number(stats.avgSalePrice).toLocaleString()}
          </Text>
        </View>

        {/* Sales List */}
        <View style={styles.listContainer}>
          {loading && !refreshing ? ( // Show loader only when loading, not refreshing
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={{ marginTop: 50 }}
            />
          ) : rows.length === 0 ? (
            <Text style={styles.emptyText}>No sales recorded yet.</Text>
          ) : (
            rows.map((s) => (
              <View key={s._id} style={styles.card}>
                <View style={styles.cardHeader}>
                  {/* Display Property Name and Unit Number */}
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {s.propertyName}
                    {s.unitNumber ? ` - Unit ${s.unitNumber}` : ""}
                  </Text>
                  <View style={styles.cardActions}>
                    <Pressable
                      onPress={() =>
                        navigation.navigate("EditSaleModal", { sale: s })
                      } // Navigate to Edit modal
                      style={styles.editButton}
                    >
                      <Text style={styles.editButtonText}>Edit</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => confirmDelete(s._id)}
                      style={styles.deleteButton}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.detailText}>
                    Buyer: {s.buyerName || "-"}
                  </Text>
                  <Text style={styles.detailText}>
                    Agent: {s.agentName || "-"}
                  </Text>
                  <Text style={styles.detailText}>
                    Date: {(s.saleDate || "").slice(0, 10)}
                  </Text>
                  <Text style={styles.priceText}>
                    ₱ {Number(s.salePrice).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Navigate to Add modal */}
      <FAB onPress={() => navigation.navigate("AddSaleModal")} />

      {/* Modals are now handled by navigation, remove direct rendering */}
      {/* <AddSaleModal open={openAdd} onClose={(reload) => { setOpenAdd(false); if (reload) load(); }} /> */}
      {/* <EditSaleModal sale={edit} onClose={(reload) => { setEdit(null); if (reload) load(); }} /> */}
    </View>
  );
}

// Kpi Component (minor style adjustments)
function Kpi({ title, value }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiTitle}>{title}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
    </View>
  );
}

// --- Added Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
  },
  statsHeader: {
    padding: 12,
    backgroundColor: colors.border, // Use border color for subtle contrast
  },
  statsHeaderText: {
    color: colors.textSecondary, // Use secondary text color
    fontSize: 14,
    fontWeight: "500",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80, // Ensure space for FAB
  },
  kpiRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  kpiTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 4,
  },
  kpiValue: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 18,
  },
  avgPriceCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginBottom: 16, // Add margin bottom
  },
  avgPriceLabel: {
    fontWeight: "600",
    marginBottom: 8,
    color: colors.textSecondary,
    fontSize: 13,
  },
  avgPriceValue: {
    fontWeight: "700",
    color: colors.primary,
    fontSize: 18,
  },
  listContainer: {
    gap: 12, // Use gap for spacing between cards
  },
  emptyText: {
    color: colors.muted,
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8, // Add margin below header
    paddingBottom: 8, // Add padding bottom
    borderBottomWidth: 1, // Add separator line
    borderBottomColor: colors.border,
  },
  cardTitle: {
    fontWeight: "700",
    fontSize: 16, // Slightly smaller title
    color: colors.text,
    flexShrink: 1, // Allow title to shrink if actions take space
    marginRight: 10, // Add margin between title and actions
  },
  cardActions: {
    flexDirection: "row",
    gap: 10,
  },
  editButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary, // Use primary color border
    backgroundColor: colors.primaryLight, // Light primary bg
  },
  editButtonText: {
    color: colors.primary, // Primary text color
    fontWeight: "500",
    fontSize: 13,
  },
  deleteButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.danger, // Use danger color
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 13,
  },
  cardBody: {
    marginTop: 8,
    gap: 5, // Use gap for spacing details
  },
  detailText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  priceText: {
    marginTop: 6, // Add margin top
    color: colors.primary,
    fontWeight: "700",
    fontSize: 16, // Slightly smaller price
  },
});
