import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { listInquiries, updateStatus } from "../api/inquiries";
import Header from "../components/Header";
import PickerModal from "../components/PickerModal";
import { colors } from "../theme/colors";
import { notifySuccess, notifyError } from "../utils/notify";

// Statuses from backend model
const STATUS_OPTIONS = [
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

const TABS = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Viewed", value: "viewed" },
  { label: "Contacted", value: "contacted" },
  { label: "Closed", value: "closed" },
];

const getStatusColor = (status) => {
  switch (status) {
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

  if (filter === "all") {
    return { dateFrom: "", dateTo: "" };
  }

  if (filter === "today") {
    dateFrom = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).toISOString();
  } else if (filter === "week") {
    const firstDayOfWeek = new Date(
      now.setDate(now.getDate() - now.getDay())
    );
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

export default function InquiriesScreen({ navigation }) {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [isDateModalVisible, setDateModalVisible] = useState(false);
  const [isStatusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { dateFrom, dateTo } = getDatesFromFilter(dateFilter);
      const data = await listInquiries(activeTab, dateFrom, dateTo);
      setInquiries(data);
    } catch (error) {
      notifyError("Failed to load inquiries.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, dateFilter]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleTabPress = (tab) => {
    setActiveTab(tab);
  };

  const handleDateFilterChange = (value) => {
    setDateFilter(value);
    setDateModalVisible(false);
  };

  const openStatusModal = (inquiry) => {
    setSelectedInquiry(inquiry);
    setStatusModalVisible(true);
  };

  const handleChangeStatus = async (newStatus) => {
    if (!selectedInquiry || !newStatus) return;

    try {
      await updateStatus(selectedInquiry._id, newStatus);
      notifySuccess("Inquiry status updated successfully!");
      setStatusModalVisible(false);
      setSelectedInquiry(null);
      load(); // Refresh the list
    } catch (error) {
      notifyError("Failed to update status.");
      console.error(error);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.fullName}</Text>
        <Text style={styles.cardDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Email: </Text>
        <Text style={styles.infoValue}>{item.email}</Text>
      </View>
      {item.contactNumber && (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone: </Text>
          <Text style={styles.infoValue}>{item.contactNumber}</Text>
        </View>
      )}
      {item.property && (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Property: </Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {item.property.name}
          </Text>
        </View>
      )}
      <Text style={styles.message}>{item.message}</Text>
      <Pressable
        style={styles.statusPickerButton}
        onPress={() => openStatusModal(item)}
      >
        <Text style={styles.statusPickerButtonText}>Status: </Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusBadgeText}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
        <Text style={styles.statusPickerButtonText}> (Change)</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header navigation={navigation} title="Inquiries" />

      {/* Status Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {TABS.map((tab) => (
            <Pressable
              key={tab.value}
              style={[
                styles.tab,
                activeTab === tab.value && styles.activeTab,
              ]}
              onPress={() => handleTabPress(tab.value)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.value && styles.activeTabText,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Date Filter */}
      <Pressable
        style={styles.dateFilterButton}
        onPress={() => setDateModalVisible(true)}
      >
        <Text style={styles.dateFilterText}>
          Filter:{" "}
          {
            DATE_FILTER_OPTIONS.find((opt) => opt.value === dateFilter)
              ?.label
          }
        </Text>
        <Text style={styles.dateFilterIcon}>▼</Text>
      </Pressable>

      {loading && !refreshing ? (
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
        />
      )}

      {/* Date Filter Modal */}
      <PickerModal
        visible={isDateModalVisible}
        options={DATE_FILTER_OPTIONS}
        onClose={() => setDateModalVisible(false)}
        onSelect={handleDateFilterChange}
        title="Select Date Range"
      />

      {/* Status Update Modal */}
      <PickerModal
        visible={isStatusModalVisible}
        options={STATUS_OPTIONS}
        onClose={() => setStatusModalVisible(false)}
        onSelect={handleChangeStatus}
        title="Update Inquiry Status"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.text,
    fontWeight: "600",
  },
  activeTabText: {
    color: colors.white,
  },
  dateFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateFilterText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  dateFilterIcon: {
    marginLeft: 8,
    color: colors.text,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: colors.grey,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 10,
    marginBottom: 10,
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
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  infoValue: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 10,
    fontStyle: "italic",
    lineHeight: 20,
  },
  statusPickerButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.light,
    alignSelf: "flex-start",
  },
  statusPickerButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 4,
    marginRight: 4,
  },
  statusBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
});