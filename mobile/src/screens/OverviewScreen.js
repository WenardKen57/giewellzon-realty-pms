import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  Platform,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { getDashboardAnalytics } from "../api/analytics";
import { getFeaturedProperties } from "../api/properties";
import { toAbsoluteUrl } from "../api/client";
import Header from "../components/Header";
import { colors } from "../theme/colors";
import { notifyError } from "../utils/notify";
import { Ionicons } from "@expo/vector-icons";

// StatCard Component
const StatCard = ({ title, value, icon, color }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIcon, { backgroundColor: color }]}>
      <Ionicons name={icon} size={24} color="#fff" />
    </View>
    <View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  </View>
);

export default function OverviewScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [featured, setFeatured] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    // Keep loading true if not refreshing to avoid flicker on initial load
    if (!refreshing) {
      setLoading(true);
    }
    try {
      const [statsData, featuredData] = await Promise.all([
        getDashboardAnalytics(),
        // Assuming getFeaturedProperties returns an array directly now
        getFeaturedProperties(5),
      ]);
      setStats(statsData);
      setFeatured(featuredData || []); // Use featuredData directly
    } catch (error) {
      notifyError("Failed to load dashboard data.");
      console.error("Load Dashboard Error:", error.response?.data || error);
    } finally {
      setLoading(false);
    }
  }, [refreshing]); // Depend on refreshing state

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  return (
    <View style={styles.container}>
      <Header navigation={navigation} title="Dashboard" />
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
        {loading && !refreshing ? ( // Show loader only on initial load
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={styles.loader}
          />
        ) : (
          <>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              {/* --- FIX: Use correct fields from analyticsController --- */}
              <StatCard
                title="Total Buildings" // Changed label
                value={stats?.buildingCount || 0} // Was totalProperties
                icon="business" // Changed icon
                color={colors.primary}
              />
              <StatCard
                title="Total Revenue" // Changed label slightly
                value={`₱${(stats?.totalClosedRevenue || 0).toLocaleString()}`} // Was totalSalesValue
                icon="cash"
                color={colors.success}
              />
              <StatCard
                title="Units Sold" // Changed label
                value={stats?.soldUnits || 0} // Was propertiesSold
                icon="flag"
                color={colors.warning}
              />
              <StatCard
                title="Pending Inquiries"
                value={stats?.pendingInquiries || 0} // This was correct
                icon="chatbox-ellipses"
                color={colors.danger}
              />
            </View>

            {/* Featured Properties */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Featured Properties</Text>
              {featured.length === 0 ? (
                <Text style={styles.emptyText}>No featured properties.</Text>
              ) : (
                featured.map((item) => (
                  <Pressable
                    key={item._id}
                    style={styles.card}
                    onPress={() =>
                      navigation.navigate("PropertyDetails", {
                        propertyId: item._id,
                      })
                    }
                  >
                    <Image
                      source={{
                        uri: toAbsoluteUrl(
                          // --- FIX: Read image as a direct string ---
                          item.thumbnail || // Was item.thumbnail?.url
                            item.photos?.[0] || // Was item.photos?.[0]?.url
                            "https://placehold.co/600x400?text=No+Image"
                        ),
                      }}
                      style={styles.cardImage}
                      {...(Platform.OS === "web" && {
                        referrerPolicy: "no-referrer",
                      })}
                    />
                    <View style={styles.cardContent}>
                      {/* --- FIX: Field name was already correct --- */}
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {item.propertyName}
                      </Text>
                      <Text style={styles.cardLocation} numberOfLines={1}>
                        {item.city}, {item.province}
                      </Text>
                    </View>
                  </Pressable>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// Styles (No changes needed below this line)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light },
  scrollContent: { padding: 16 },
  loader: { marginTop: 50 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    width: "48.5%", // Slightly less than 50% for margin
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  statTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 12,
  },
  emptyText: {
    textAlign: "center",
    color: colors.gray,
    fontSize: 14,
    marginTop: 10,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
    overflow: "hidden",
    flexDirection: "row",
  },
  cardImage: {
    width: 100,
    height: "100%", // Changed for consistent height
    minHeight: 100, // Ensure minimum height
    backgroundColor: colors.border,
  },
  cardContent: {
    padding: 16,
    flex: 1,
    justifyContent: "center", // Center content vertically
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 4,
  },
  cardLocation: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary,
  },
});
