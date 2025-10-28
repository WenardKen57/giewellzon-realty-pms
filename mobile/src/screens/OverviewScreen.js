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
  Platform, // <-- Import Platform
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
    setLoading(true);
    try {
      const [statsData, featuredData] = await Promise.all([
        getDashboardAnalytics(),
        getFeaturedProperties(5),
      ]);
      setStats(statsData);
      setFeatured(featuredData.data || []);
    } catch (error) {
      notifyError("Failed to load dashboard data.");
      console.error("Load Dashboard Error:", error.response?.data || error);
    } finally {
      setLoading(false);
    }
  }, []);

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
        {loading && !refreshing ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={styles.loader}
          />
        ) : (
          <>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <StatCard
                title="Total Properties"
                value={stats?.totalProperties || 0}
                icon="home"
                color={colors.primary}
              />
              <StatCard
                title="Total Sales"
                value={`₱${(stats?.totalSalesValue || 0).toLocaleString()}`}
                icon="cash"
                color={colors.success}
              />
              <StatCard
                title="Properties Sold"
                value={stats?.propertiesSold || 0}
                icon="flag"
                color={colors.warning}
              />
              <StatCard
                title="Pending Inquiries"
                value={stats?.pendingInquiries || 0}
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
                          item.thumbnail?.url ||
                            item.photos?.[0]?.url ||
                            "https://placehold.co/600x400?text=No+Image"
                        ),
                      }}
                      style={styles.cardImage}
                      // --- FIX: Add this prop for web ---
                      {...(Platform.OS === "web" && {
                        referrerPolicy: "no-referrer",
                      })}
                    />
                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {item.propertyName}
                      </Text>
                      <Text style={styles.cardLocation} numberOfLines={1}>
                        {item.city}, {item.province}
                      </Text>
                      <Text style={styles.cardPrice}>
                        ₱ {Number(item.price).toLocaleString()}
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

// Styles
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
    height: "100%",
    backgroundColor: colors.border,
  },
  cardContent: {
    padding: 16,
    flex: 1,
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
