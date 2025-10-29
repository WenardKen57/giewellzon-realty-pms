import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  StyleSheet,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons"; // --- ADDED ---
import { LinearGradient } from "expo-linear-gradient"; // --- ADDED ---
import Header from "../components/Header";
import { colors } from "../theme/colors";
import FAB from "../components/FAB";
import { listSales, deleteSale } from "../api/sales";
import { notifySuccess, notifyError } from "../utils/notify";

// --- NEW: Helper to get status badge styles ---
const getStatusStyles = (status) => {
  switch (status) {
    case "closed":
      return {
        backgroundColor: "rgba(40, 167, 69, 0.1)", // Light green
        color: colors.successText, // Dark green
      };
    case "cancelled":
      return {
        backgroundColor: "rgba(220, 53, 69, 0.1)", // Light red
        color: colors.dangerText, // Dark red
      };
    case "pending":
    default:
      return {
        backgroundColor: "rgba(255, 193, 7, 0.1)", // Light orange
        color: colors.warningText, // Dark orange
      };
  }
};

// --- NEW: Filter options ---
const filterOptions = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Closed", value: "closed" },
  { label: "Cancelled", value: "cancelled" },
];

export default function SalesScreen() {
  const navigation = useNavigation();
  const [stats, setStats] = useState({
    total: 0,
    totalRevenue: 0,
    avgSalePrice: 0,
  });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all"); // --- ADDED: Filter state ---

  // --- MODIFIED: Load function now accepts and uses filterStatus ---
  const load = useCallback(async (status) => {
    setLoading(true);
    try {
      // Pass the filter to the API. If 'all', pass an empty string.
      const apiFilter = status === "all" ? "" : status;
      const r = await listSales({ status: apiFilter });

      setRows(r.data || []);
      // Assuming stats returned are relevant to the filter or global stats are acceptable
      setStats({
        total: r.total || 0,
        totalRevenue: r.totalRevenue || 0,
        avgSalePrice: r.avgSalePrice || 0,
      });
    } catch (error) {
      notifyError("Failed to load sales data.");
      console.error("Load Sales Error:", error);
    } finally {
      setLoading(false);
    }
  }, []); // `load` itself doesn't depend on filterStatus

  // --- Reload on Screen Focus (uses current filter) ---
  useFocusEffect(
    useCallback(() => {
      load(filterStatus);
    }, [load, filterStatus]) // --- MODIFIED: Reloads if filter changes
  );

  // --- Refresh Handler (uses current filter) ---
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(filterStatus);
    setRefreshing(false);
  }, [load, filterStatus]); // --- MODIFIED: Refreshes with current filter

  // --- Filter change handler ---
  const handleFilterChange = (newStatus) => {
    setFilterStatus(newStatus);
    // Trigger load manually since useFocusEffect won't re-run just from state change
    load(newStatus);
  };

  // --- Original confirmDelete function (unchanged in logic, just formatting) ---
  const confirmDelete = (id) => {
    const deleteLogic = async () => {
      try {
        console.log(`Attempting to delete sale with ID: ${id}`);
        await deleteSale(id);
        console.log(`Successfully deleted sale ID: ${id}. Reloading list...`);
        notifySuccess("Sale deleted successfully!");
        load(filterStatus); // Reload with current filter
      } catch (error) {
        console.error(
          `Failed to delete sale ID: ${id}`,
          error.response?.data || error
        );
        notifyError(error.response?.data?.message || "Failed to delete sale.");
      }
    };

    const alertTitle = "Delete Sale";
    const alertMessage =
      "Are you sure you want to delete this sale record? This will also mark the associated unit as available again.";

    if (Platform.OS === "web") {
      if (window.confirm(alertMessage)) {
        deleteLogic();
      }
    } else {
      Alert.alert(alertTitle, alertMessage, [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: deleteLogic },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <Header navigation={navigation} title="Sales" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* --- Performance Overview Section --- */}
        <SectionHeader title="Performance Overview" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.kpiScrollView}
        >
          <KpiCard
            title="Total Sales"
            value={stats.total.toLocaleString()}
            icon="cash-outline"
            colors={["#4e54c8", "#8f94fb"]}
          />
          <KpiCard
            title="Total Revenue"
            value={`₱${Number(stats.totalRevenue).toLocaleString()}`}
            icon="bar-chart-outline"
            colors={["#00c6ff", "#0072ff"]}
          />
          <KpiCard
            title="Avg. Sale Price"
            value={`₱${Number(stats.avgSalePrice).toLocaleString("en-US", {
              maximumFractionDigits: 0,
            })}`}
            icon="calculator-outline"
            colors={["#ff512f", "#f09819"]}
          />
        </ScrollView>

        {/* --- All Sales Records Section --- */}
        <SectionHeader title="All Sales Records" />

        {/* --- Filter Bar --- */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {filterOptions.map((opt) => (
            <FilterPill
              key={opt.value}
              label={opt.label}
              isActive={filterStatus === opt.value}
              onPress={() => handleFilterChange(opt.value)}
            />
          ))}
        </ScrollView>

        {/* --- Sales List --- */}
        <View style={styles.listContainer}>
          {loading && !refreshing ? (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={{ marginTop: 50 }}
            />
          ) : rows.length === 0 ? (
            <Text style={styles.emptyText}>
              No sales found for "{filterStatus}" filter.
            </Text>
          ) : (
            rows.map((sale) => (
              <SaleCard // Using the updated SaleCard component
                key={sale._id}
                sale={sale}
                onEdit={() => navigation.navigate("EditSaleModal", { sale })}
                onDelete={() => confirmDelete(sale._id)}
              />
            ))
          )}
        </View>
      </ScrollView>

      <FAB onPress={() => navigation.navigate("AddSaleModal")} />
    </View>
  );
}

// --- SectionHeader Component ---
function SectionHeader({ title }) {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

// --- KpiCard Component ---
function KpiCard({ title, value, icon, colors: gradientColors }) {
  return (
    <LinearGradient colors={gradientColors} style={styles.kpiCard}>
      <Ionicons
        name={icon}
        size={24}
        color={colors.white}
        style={styles.kpiIcon}
      />
      <View>
        <Text style={styles.kpiTitle}>{title}</Text>
        <Text style={styles.kpiValue}>{value}</Text>
      </View>
    </LinearGradient>
  );
}

// --- FilterPill Component ---
function FilterPill({ label, onPress, isActive }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.filterPill, isActive && styles.filterPillActive]}
    >
      <Text
        style={[styles.filterPillText, isActive && styles.filterPillTextActive]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// --- StatusBadge Component ---
function StatusBadge({ status }) {
  const { backgroundColor, color } = getStatusStyles(status);
  return (
    <View style={[styles.badgeContainer, { backgroundColor }]}>
      <Text style={[styles.badgeText, { color }]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    </View>
  );
}

// --- UPDATED: SaleCard Component ---
function SaleCard({ sale, onEdit, onDelete }) {
  return (
    <View style={styles.card}>
      {/* Card Header remains the same */}
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {sale.propertyName}
          </Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {sale.unitNumber ? `Unit ${sale.unitNumber}` : "Property Sale"}
          </Text>
        </View>
        <View style={styles.cardActions}>
          <Pressable onPress={onEdit} style={styles.iconButton}>
            <Ionicons name="pencil-outline" size={20} color={colors.primary} />
          </Pressable>
          <Pressable onPress={onDelete} style={styles.iconButton}>
            <Ionicons name="trash-outline" size={20} color={colors.dangerText} />
          </Pressable>
        </View>
      </View>

      {/* Card Body now includes the Price */}
      <View style={styles.cardBody}>
        {/* Row 1: Buyer & Status */}
        <View style={styles.cardRow}>
          <View style={styles.cardDetail}>
            <Ionicons
              name="person-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.cardDetailText} numberOfLines={1}>
              Buyer: {sale.buyerName || "-"}
            </Text>
          </View>
          <StatusBadge status={sale.status} />
        </View>

        {/* Row 2: Agent & Date */}
        <View style={styles.cardRow}>
          <View style={styles.cardDetail}>
            <Ionicons
              name="briefcase-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.cardDetailText} numberOfLines={1}>
              Agent: {sale.agentName || "-"}
            </Text>
          </View>
          <Text style={styles.cardDetailText}>
            {(sale.saleDate || "").slice(0, 10)}
          </Text>
        </View>

        {/* --- MOVED: Price is now the last item in the body --- */}
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>
            ₱ {Number(sale.salePrice).toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );
}

// --- UPDATED Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light },
  scrollContent: { paddingBottom: 100 },
  sectionContainer: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: colors.text },
  kpiScrollView: { paddingHorizontal: 16, paddingBottom: 10 },
  kpiCard: { width: 170, height: 120, borderRadius: 16, padding: 16, marginRight: 12, justifyContent: "space-between", elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  kpiIcon: { alignSelf: "flex-end", opacity: 0.8 },
  kpiTitle: { fontSize: 14, fontWeight: "600", color: colors.white, opacity: 0.9 },
  kpiValue: { fontSize: 22, fontWeight: "bold", color: colors.white, marginTop: 4 },
  filterContainer: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingBottom: 16 },
  filterPill: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border },
  filterPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterPillText: { color: colors.textSecondary, fontWeight: "600" },
  filterPillTextActive: { color: colors.white },
  listContainer: { gap: 12, paddingHorizontal: 16 },
  emptyText: { color: colors.muted, textAlign: "center", marginTop: 40, fontSize: 16 },
  card: { backgroundColor: colors.white, borderRadius: 12, elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 5 }, // Removed overflow: hidden
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", padding: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  cardTitleContainer: { flex: 1, marginRight: 12 },
  cardTitle: { fontWeight: "bold", fontSize: 17, color: colors.text },
  cardSubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  cardActions: { flexDirection: "row", gap: 8 },
  iconButton: { padding: 8, borderRadius: 20, backgroundColor: colors.light },
  cardBody: { padding: 16, gap: 14 }, // Consolidated padding, adjusted gap
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardDetail: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 },
  cardDetailText: { fontSize: 14, color: colors.textSecondary, flexShrink: 1 },
  badgeContainer: { borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10 },
  badgeText: { fontSize: 12, fontWeight: "bold" },
  priceContainer: { marginTop: 4, alignItems: 'flex-end' }, // New style for price alignment
  priceText: { color: colors.primary, fontWeight: "bold", fontSize: 20 }, // Updated price style
  // cardFooter and priceLabel styles removed
});