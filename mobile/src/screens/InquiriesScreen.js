import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  Linking,
  ScrollView, // --- NEW: Added ScrollView ---
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { listInquiries, updateStatus } from "../api/inquiries";
import Header from "../components/Header"; // Header is back to being simple
import PickerModal from "../components/PickerModal";
import { colors } from "../theme/colors";
import { notifySuccess, notifyError } from "../utils/notify";
import { Ionicons } from "@expo/vector-icons";

// --- Constants (Unchanged) ---
const STATUS_OPTIONS = [
  { label: "New", value: "new" },
  { label: "Pending", value: "pending" },
  { label: "Viewed", value: "viewed" },
  { label: "Contacted", value: "contacted" },
  { label: "Interested", value: "interested" },
  { label: "Not Interested", value: "not_interested" },
  { label: "Closed", value: "closed" },
  { label: "Archived", value: "archived" },
];
const DATE_FILTER_OPTIONS = [
  { label: "All Time", value: "all" },
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "This Year", value: "year" },
];
const VISIBLE_TABS = [
  { label: "All", value: "all" },
  { label: "New", value: "new" },
  { label: "Pending", value: "pending" },
  { label: "Closed", value: "closed" },
];
const MORE_TAB_OPTIONS = [
  { label: "Viewed", value: "viewed" },
  { label: "Contacted", value: "contacted" },
  { label: "Interested", value: "interested" },
  { label: "Not Interested", value: "not_interested" },
  { label: "Archived", value: "archived" },
];
const PAGE_LIMIT = 20;

// --- Helper Functions (Unchanged) ---
const getStatusColor = (status) => {
  switch (status) {
    case "new":
    case "pending":
      return colors.warning;
    case "viewed":
    case "contacted":
      return colors.info;
    case "interested":
      return colors.primary;
    case "closed":
      return colors.success;
    case "not_interested":
    case "archived":
      return colors.danger;
    default:
      return colors.grey;
  }
};
const getDatesFromFilter = (filter) => {
  const now = new Date();
  let dateFrom = "";
  let dateTo = now.toISOString();
  if (filter === "all") return { dateFrom: "", dateTo: "" };
  if (filter === "today") {
    dateFrom = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).toISOString();
  } else if (filter === "week") {
    const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    dateFrom = new Date(
      firstDayOfWeek.getFullYear(),
      firstDayOfWeek.getMonth(),
      firstDayOfWeek.getDate()
    ).toISOString();
  } else if (filter === "month") {
    dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  } else if (filter === "year") {
    dateFrom = new Date(now.getFullYear(), 0, 1).toISOString();
  }
  return { dateFrom, dateTo };
};

// --- Polished InquiryCard component (Unchanged) ---
const InquiryCard = React.memo(({ item, onStatusPress }) => {
  const onEmail = () => {
    if (item.customerEmail) {
      Linking.openURL(`mailto:${item.customerEmail}`);
    }
  };
  const onPhone = () => {
    if (item.customerPhone) {
      Linking.openURL(`tel:${item.customerPhone}`);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>
          {item.firstName || ""} {item.lastName || ""}
        </Text>
        <Text style={styles.cardDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      {item.propertyName && (
        <View style={styles.cardPropertyRow}>
          <Ionicons
            name="business-outline"
            size={16}
            style={styles.cardPropertyIcon}
          />
          <Text style={styles.cardPropertyText} numberOfLines={1}>
            {item.propertyName}
          </Text>
        </View>
      )}
      <View style={styles.infoSection}>
        <Pressable style={styles.infoRow} onPress={onEmail}>
          <Ionicons
            name="mail-outline"
            size={16}
            style={styles.infoIconActionable}
          />
          <Text style={styles.infoValue}>{item.customerEmail}</Text>
        </Pressable>
        {item.customerPhone && (
          <Pressable style={styles.infoRow} onPress={onPhone}>
            <Ionicons
              name="call-outline"
              size={16}
              style={styles.infoIconActionable}
            />
            <Text style={styles.infoValue}>{item.customerPhone}</Text>
          </Pressable>
        )}
      </View>
      <View style={styles.messageContainer}>
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={16}
          style={styles.infoIconMuted}
        />
        <Text style={styles.message}>{item.message}</Text>
      </View>
      <View style={styles.cardFooter}>
        <Pressable
          style={[
            styles.statusButton,
            { backgroundColor: getStatusColor(item.status) },
          ]}
          onPress={() => onStatusPress(item)}
        >
          <Text style={styles.statusButtonText}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
          <Ionicons
            name="chevron-down-outline"
            size={14}
            color={colors.white}
          />
        </Pressable>
      </View>
    </View>
  );
});

// --- MODIFIED: InquiryFilters now includes the Date Filter button ---
const InquiryFilters = ({
  activeTab,
  onTabChange,
  onMorePress,
  onDateFilterPress,
  isDateFilterActive,
}) => {
  const isMoreTabActive = useMemo(
    () => MORE_TAB_OPTIONS.some((tab) => tab.value === activeTab),
    [activeTab]
  );
  const moreTabLabel = useMemo(() => {
    if (isMoreTabActive) {
      return (
        MORE_TAB_OPTIONS.find((tab) => tab.value === activeTab)?.label || "More"
      );
    }
    return "More";
  }, [activeTab, isMoreTabActive]);

  return (
    <View style={styles.tabsContainer}>
      {/* Left side: ScrollView for tabs */}
      <View style={styles.tabScroller}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {VISIBLE_TABS.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <Pressable
                key={tab.value}
                style={styles.tab}
                onPress={() => onTabChange(tab.value)}
              >
                <Text
                  style={[styles.tabText, isActive && styles.activeTabText]}
                >
                  {tab.label}
                </Text>
                {isActive && <View style={styles.activeTabIndicator} />}
              </Pressable>
            );
          })}
          {/* "More" Button */}
          <Pressable style={styles.tab} onPress={onMorePress}>
            <Text
              style={[
                styles.tabText,
                isMoreTabActive && styles.activeTabText,
              ]}
            >
              {moreTabLabel}
            </Text>
            {isMoreTabActive && <View style={styles.activeTabIndicator} />}
          </Pressable>
        </ScrollView>
      </View>

      {/* Right side: Date Filter Button */}
      <Pressable style={styles.dateFilterButton} onPress={onDateFilterPress}>
        <Ionicons name="calendar-outline" size={22} color={colors.primary} />
        {isDateFilterActive && <View style={styles.dateFilterBadge} />}
      </Pressable>
    </View>
  );
};

// --- Main Screen Component ---
export default function InquiriesScreen({ navigation }) {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [isDateModalVisible, setDateModalVisible] = useState(false);
  const [isStatusUpdateModalVisible, setStatusUpdateModalVisible] =
    useState(false);
  const [isMoreFiltersVisible, setMoreFiltersVisible] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  // Pagination state (Unchanged)
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const isInitialMount = useRef(true);

  // Data Fetching (Unchanged)
  const load = useCallback(
    async (isRefreshing = false) => {
      if (!isRefreshing) setLoading(true);
      setPage(1);
      setInquiries([]);
      try {
        const { dateFrom, dateTo } = getDatesFromFilter(dateFilter);
        const params = {
          page: 1,
          limit: PAGE_LIMIT,
          dateFrom,
          dateTo,
        };
        if (activeTab !== "all") {
          params.status = activeTab;
        }
        const response = await listInquiries(params);
        setInquiries(response.data || []);
        setTotal(response.total || 0);
        setPage(response.page || 1);
      } catch (error) {
        notifyError("Failed to load inquiries.");
        console.error(error);
      } finally {
        if (!isRefreshing) setLoading(false);
      }
    },
    [activeTab, dateFilter]
  );

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      if (isInitialMount.current) {
        isInitialMount.current = false;
      } else {
        load();
      }
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  }, [load]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || inquiries.length >= total) return;
    setLoadingMore(true);
    try {
      const { dateFrom, dateTo } = getDatesFromFilter(dateFilter);
      const nextPage = page + 1;
      const params = {
        page: nextPage,
        limit: PAGE_LIMIT,
        dateFrom,
        dateTo,
      };
      if (activeTab !== "all") {
        params.status = activeTab;
      }
      const response = await listInquiries(params);
      setInquiries((prev) => [...prev, ...(response.data || [])]);
      setTotal(response.total || 0);
      setPage(response.page || nextPage);
    } catch (error) {
      notifyError("Failed to load more inquiries.");
      console.error(error);
    } finally {
      setLoadingMore(false);
    }
  }, [
    activeTab,
    dateFilter,
    loading,
    loadingMore,
    page,
    total,
    inquiries.length,
  ]);

  // --- Event Handlers (Unchanged) ---
  const handleTabPress = (tab) => {
    setActiveTab(tab);
  };
  const handleDateFilterChange = (value) => {
    setDateFilter(value);
    setDateModalVisible(false);
  };
  const handleMoreTabChange = (value) => {
    setActiveTab(value);
    setMoreFiltersVisible(false);
  };
  const openStatusUpdateModal = (inquiry) => {
    setSelectedInquiry(inquiry);
    setStatusUpdateModalVisible(true);
  };
  const handleStatusUpdate = async (newStatus) => {
    if (!selectedInquiry || !newStatus) return;
    try {
      await updateStatus(selectedInquiry._id, newStatus);
      notifySuccess("Inquiry status updated successfully!");
      setStatusUpdateModalVisible(false);
      setSelectedInquiry(null);
      load();
    } catch (error) {
      notifyError("Failed to update status.");
      console.error(error);
    }
  };

  const renderItem = useCallback(
    ({ item }) => (
      <InquiryCard item={item} onStatusPress={openStatusUpdateModal} />
    ),
    []
  );

  return (
    <View style={styles.container}>
      {/* --- MODIFIED: Header is simple --- */}
      <Header navigation={navigation} title="Inquiries" />

      {/* --- MODIFIED: Filter bar now includes date filter logic --- */}
      <InquiryFilters
        activeTab={activeTab}
        onTabChange={handleTabPress}
        onMorePress={() => setMoreFiltersVisible(true)}
        onDateFilterPress={() => setDateModalVisible(true)}
        isDateFilterActive={dateFilter !== "all"}
      />

      {loading && !refreshing && !loadingMore ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.loader}
        />
      ) : (
        <FlatList
          data={inquiries}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No inquiries found.</Text>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                style={{ margin: 20 }}
                color={colors.primary}
              />
            ) : null
          }
        />
      )}

      {/* Date Filter Modal (Triggered from filter bar) */}
      <PickerModal
        visible={isDateModalVisible}
        options={DATE_FILTER_OPTIONS}
        onClose={() => setDateModalVisible(false)}
        onSelect={handleDateFilterChange}
        title="Select Date Range"
      />

      {/* "More" Filters Modal */}
      <PickerModal
        visible={isMoreFiltersVisible}
        options={MORE_TAB_OPTIONS}
        onClose={() => setMoreFiltersVisible(false)}
        onSelect={handleMoreTabChange}
        title="More Statuses"
        value={activeTab}
      />

      {/* Status Update Modal (For changing an inquiry's status) */}
      <PickerModal
        visible={isStatusUpdateModalVisible}
        options={STATUS_OPTIONS}
        onClose={() => setStatusUpdateModalVisible(false)}
        onSelect={handleStatusUpdate}
        title="Update Inquiry Status"
      />
    </View>
  );
}

// --- MODIFIED: Styles for new filter bar layout ---
const styles = StyleSheet.create({
  // --- Main Screen Styles ---
  container: {
    flex: 1,
    backgroundColor: colors.light,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: colors.grey,
  },

  // --- InquiryFilters Styles ---
  tabsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingLeft: 10, // Add padding for the start of the scroller
  },
  tabScroller: {
    flex: 1, // Allow scroller to take up available space
  },
  tab: {
    paddingVertical: 14,
    paddingHorizontal: 16, // A bit more padding for each tab
    alignItems: "center",
  },
  tabText: {
    color: colors.textSecondary,
    fontWeight: "500",
    fontSize: 14,
  },
  activeTabText: {
    color: colors.primary,
  },
  activeTabIndicator: {
    height: 2,
    backgroundColor: colors.primary,
    position: "absolute",
    bottom: 0,
    left: 16,
    right: 16,
  },
  // --- NEW: Date Filter Button styles ---
  dateFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateFilterBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },

  // --- Polished InquiryCard Styles ---
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    flex: 1,
  },
  cardDate: {
    fontSize: 13,
    color: colors.grey,
  },
  cardPropertyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardPropertyIcon: {
    color: colors.textSecondary,
    width: 20,
    textAlign: "center",
  },
  cardPropertyText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
    flex: 1,
  },
  infoSection: {
    padding: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoIconActionable: {
    color: colors.primary,
    width: 20,
    textAlign: "center",
  },
  infoIconMuted: {
    color: colors.muted,
    width: 20,
    textAlign: "center",
  },
  infoValue: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  messageContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: "flex-start",
    gap: 8,
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: "italic",
    lineHeight: 20,
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: "#F9FAFB",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  statusButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "bold",
  },
});