import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  Platform,
  Dimensions,
  ImageBackground,
  Animated,
  Image,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { getDashboardAnalytics } from "../api/analytics";
import { getFeaturedProperties } from "../api/properties";
import { listSales } from "../api/sales"; // Correct
import { listInquiries } from "../api/inquiries"; // Correct
import { toAbsoluteUrl } from "../api/client";
import Header from "../components/Header";
import { colors } from "../theme/colors";
import { notifyError } from "../utils/notify";
import { Ionicons } from "@expo/vector-icons";

const { width: screenWidth } = Dimensions.get("window");
const cardWidth = screenWidth * 0.75; // This line is required

// --- 🎨 NEW KpiCard Component ---
const KpiCard = ({ title, value, icon, color, style }) => (
  <Animated.View style={[styles.kpiCard, style]}>
    <View
      style={[styles.kpiIconContainer, { backgroundColor: `${color}20` }]} // Light tint
    >
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text
      style={styles.kpiValue}
      numberOfLines={1}
      adjustsFontSizeToFit={true} // This shrinks text to fit, solving the cut-off
    >
      {value}
    </Text>
    <Text style={styles.kpiTitle}>{title}</Text>
  </Animated.View>
);

// --- 🎨 QuickLinkCard Redesigned ---
const QuickLinkCard = ({ title, icon, onPress, color, bgColor }) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.quickLinkCard,
        {
          backgroundColor: bgColor,
          borderColor: color,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
      ]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={30} color={color} />
      <Text style={[styles.quickLinkTitle, { color: color }]}>{title}</Text>
    </Pressable>
  );
};

const PropertyCard = ({ item, navigation }) => (
  <Pressable
    style={styles.propertyCard}
    onPress={() =>
      navigation.navigate("PropertyDetails", { propertyId: item._id })
    }
  >
    <ImageBackground
      source={{
        uri: toAbsoluteUrl(
          item.thumbnail ||
            item.photos?.[0] ||
            "https://placehold.co/600x400?text=No+Image"
        ),
      }}
      style={styles.propertyCardImage}
      imageStyle={{ borderRadius: 16 }}
      {...(Platform.OS === "web" && { referrerPolicy: "no-referrer" })}
    >
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.8)"]}
        style={styles.propertyCardOverlay}
      >
        <Text style={styles.propertyCardTitle} numberOfLines={1}>
          {item.propertyName}
        </Text>
        <Text style={styles.propertyCardLocation} numberOfLines={1}>
          {item.city}, {item.province}
        </Text>
      </LinearGradient>
    </ImageBackground>
  </Pressable>
);

// --- 🚀 FINAL CompactInquiryRow ---
// Updated to use firstName, lastName, and propertyName
const CompactInquiryRow = ({ item, navigation }) => {
  const statusColor =
    item.status === "Pending"
      ? colors.danger
      : item.status === "Handled"
      ? colors.success
      : colors.gray;

  // Construct the full name
  const inquirerName = `${item.firstName || ""} ${item.lastName || ""}`.trim() || "Inquirer";

  return (
    <Pressable
      style={styles.compactRow}
      onPress={() => navigation.navigate("Inquiries")}
    >
      <View style={[styles.compactStatusDot, { backgroundColor: statusColor }]} />
      <View style={styles.compactInfo}>
        <Text style={styles.compactText} numberOfLines={1}>
          <Text style={styles.compactTextBold}>
            {inquirerName}
          </Text>{" "}
          re: {item.propertyName || "Property"}
        </Text>
        <Text style={styles.compactTimestamp}>
          {item.createdAt
            ? new Date(item.createdAt).toLocaleDateString()
            : "No date"}
        </Text>
      </View>
      <Ionicons name="chevron-forward-outline" size={18} color={colors.gray} />
    </Pressable>
  );
};

// --- 🚀 FINAL CompactSaleRow ---
// Updated to use salePrice and propertyName
const CompactSaleRow = ({ item, navigation }) => {
  // Use `salePrice` as seen in your SalesScreen.js
  const price = item.salePrice || item.amount || 0; 
  
  return (
    <Pressable
      style={styles.compactRow}
      onPress={() => navigation.navigate("Sales")}
    >
      <View
        style={[styles.compactStatusDot, { backgroundColor: colors.success }]}
      />
      <View style={styles.compactInfo}>
        <Text style={styles.compactText} numberOfLines={1}>
          <Text style={styles.compactTextBold}>
            ₱{price.toLocaleString()}
          </Text>{" "}
          - {item.propertyName || "Property"}
        </Text>
        <Text style={styles.compactTimestamp}>
          Sold to {item.buyerName || "Buyer"}
        </Text>
      </View>
      <Ionicons name="chevron-forward-outline" size={18} color={colors.gray} />
    </Pressable>
  );
};


export default function OverviewScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [featured, setFeatured] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [recentInquiries, setRecentInquiries] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("inquiries");

  const fadeAnim1 = useRef(new Animated.Value(0)).current;
  const fadeAnim2 = useRef(new Animated.Value(0)).current;
  const fadeAnim3 = useRef(new Animated.Value(0)).current;
  const fadeAnim4 = useRef(new Animated.Value(0)).current;

  const fadeIn = () => {
    Animated.stagger(150, [
      Animated.timing(fadeAnim1, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim2, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim3, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim4, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadData = useCallback(async () => {
    if (!refreshing) {
      setLoading(true);
    }
    try {
      const salesParams = { limit: 5, sortBy: "date", sortOrder: "desc" };
      // Sort inquiries by createdAt to get the newest first
      const inquiriesParams = { limit: 5, sortBy: "createdAt", sortOrder: "desc" };

      const [statsData, featuredData, salesResponse, inquiriesResponse] =
        await Promise.all([
          getDashboardAnalytics(),
          getFeaturedProperties(5),
          listSales(salesParams), 
          listInquiries(inquiriesParams), 
        ]);
        
      setStats(statsData);
      setFeatured(featuredData || []);
      
      // The list functions return { data: [...] }, so we grab .data
      setRecentSales(salesResponse.data || []); 
      setRecentInquiries(inquiriesResponse.data || []);

      fadeIn();
    } catch (error) {
      notifyError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [refreshing, fadeAnim1, fadeAnim2, fadeAnim3, fadeAnim4]);

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
            {/* --- Overview Section (KPI Cards) --- */}
            <Animated.View style={[styles.section, { opacity: fadeAnim1 }]}>
              <Text style={styles.sectionTitle}>Overview</Text>
              <View style={styles.statsGrid}>
                <KpiCard
                  title="Total Properties"
                  value={stats?.buildingCount || 0}
                  icon="business-outline"
                  color={colors.primary}
                />
                <KpiCard
                  title="Pending Inquiries"
                  value={stats?.pendingInquiries || 0}
                  icon="chatbubbles-outline"
                  color={colors.danger}
                />
                <KpiCard
                  title="Total Revenue"
                  value={`₱${(stats?.totalClosedRevenue || 0).toLocaleString()}`}
                  icon="cash-outline"
                  color={colors.success}
                />
                <KpiCard
                  title="Units Sold"
                  value={stats?.soldUnits || 0}
                  icon="flag-outline"
                  color={colors.warning}
                />
              </View>
              <Text style={styles.sectionCaption}>
                Overview of your latest activity.
              </Text>
            </Animated.View>

            {/* --- Quick Links Section --- */}
            <Animated.View style={[styles.section, { opacity: fadeAnim2 }]}>
              <Text style={styles.sectionTitle}>Quick Links</Text>
              <View style={styles.quickLinksGrid}>
                <QuickLinkCard
                  title="Properties"
                  icon="home-outline"
                  onPress={() => navigation.navigate("Properties")}
                  color={colors.primary}
                  bgColor={"rgba(0, 105, 92, 0.08)"}
                />
                <QuickLinkCard
                  title="Inquiries"
                  icon="mail-open-outline"
                  onPress={() => navigation.navigate("Inquiries")}
                  color={colors.danger}
                  bgColor={"rgba(220, 53, 69, 0.08)"}
                />
                <QuickLinkCard
                  title="Sales"
                  icon="trending-up-outline"
                  onPress={() => navigation.navigate("Sales")}
                  color={colors.success}
                  bgColor={"rgba(25, 135, 84, 0.08)"}
                />
              </View>
            </Animated.View>

            {/* --- Featured Properties Section --- */}
            <Animated.View style={[{ opacity: fadeAnim3, marginBottom: 24 }]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Featured Properties</Text>
                <Text style={styles.sectionSubtitle}>
                  Your highlighted listings this week.
                </Text>
              </View>
              {featured.length === 0 ? (
                <View style={{ paddingHorizontal: 20 }}>
                  <View style={styles.emptyContainer}>
                    <Ionicons
                      name="image-outline"
                      size={60}
                      color={colors.gray}
                    />
                    <Text style={styles.emptyTitle}>
                      No featured properties yet.
                    </Text>
                    <Text style={styles.emptyText}>
                      Upload one to attract more buyers!
                    </Text>
                  </View>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.carouselContainer}
                  decelerationRate="fast"
                  snapToInterval={cardWidth + 12}
                  snapToAlignment="start"
                >
                  {featured.map((item) => (
                    <PropertyCard
                      key={item._id}
                      item={item}
                      navigation={navigation}
                    />
                  ))}
                </ScrollView>
              )}
            </Animated.View>

            {/* --- Tabbed Recent Activity Section --- */}
            <Animated.View style={[styles.section, { opacity: fadeAnim4 }]}>
              <View style={styles.tabContainer}>
                <Pressable
                  style={[
                    styles.tabButton,
                    activeTab === "inquiries" && styles.tabButtonActive,
                  ]}
                  onPress={() => setActiveTab("inquiries")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === "inquiries" && styles.tabTextActive,
                    ]}
                  >
                    Recent Inquiries
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.tabButton,
                    activeTab === "sales" && styles.tabButtonActive,
                  ]}
                  onPress={() => setActiveTab("sales")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === "sales" && styles.tabTextActive,
                    ]}
                  >
                    Recent Sales
                  </Text>
                </Pressable>
              </View>

              <View style={styles.tabContent}>
                {activeTab === "inquiries" && (
                  <>
                    {recentInquiries.length === 0 ? (
                      <View style={styles.emptyContainer}>
                        <Ionicons
                          name="chatbubbles-outline"
                          size={60}
                          color={colors.gray}
                        />
                        <Text style={styles.emptyTitle}>
                          No new inquiries at the moment.
                        </Text>
                      </View>
                    ) : (
                      <>
                        {recentInquiries.map((item) => (
                          <CompactInquiryRow
                            key={item._id}
                            item={item}
                            navigation={navigation}
                          />
                        ))}
                        <Pressable
                          onPress={() => navigation.navigate("Inquiries")}
                          style={styles.viewAllCompactButton}
                        >
                          <Text style={styles.viewAllText}>View All Inquiries</Text>
                          <Ionicons
                            name="chevron-forward-outline"
                            size={16}
                            color={colors.primary}
                          />
                        </Pressable>
                      </>
                    )}
                  </>
                )}

                {activeTab === "sales" && (
                  <>
                    {recentSales.length === 0 ? (
                      <View style={styles.emptyContainer}>
                        <Ionicons
                          name="cash-outline"
                          size={60}
                          color={colors.gray}
                        />
                        <Text style={styles.emptyTitle}>
                          No recent sales yet.
                        </Text>
                        <Text style={styles.emptyText}>
                          Start recording your transactions!
                        </Text>
                      </View>
                    ) : (
                      <>
                        {recentSales.map((item) => (
                          <CompactSaleRow
                            key={item._id}
                            item={item}
                            navigation={navigation}
                          />
                        ))}
                        <Pressable
                          onPress={() => navigation.navigate("Sales")}
                          style={styles.viewAllCompactButton}
                        >
                          <Text style={styles.viewAllText}>View All Sales</Text>
                          <Ionicons
                            name="chevron-forward-outline"
                            size={16}
                            color={colors.primary}
                          />
                        </Pressable>
                      </>
                    )}
                  </>
                )}
              </View>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// --- ALL STYLES (Unchanged) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light },
  scrollContent: { paddingVertical: 24, paddingBottom: 100 },
  loader: { marginTop: 50 },
  section: { marginBottom: 24, paddingHorizontal: 20 },
  sectionHeader: { paddingHorizontal: 20 },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
    marginRight: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 4, 
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 0, 
    marginTop: 0, 
  },
  sectionCaption: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  kpiCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    width: "48.5%", 
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  kpiIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12, 
  },
  kpiValue: {
    fontSize: 22, 
    fontWeight: "bold",
    color: colors.text,
    lineHeight: 28, 
  },
  kpiTitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  quickLinksGrid: { flexDirection: "row", justifyContent: "space-between" },
  quickLinkCard: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 20, 
    alignItems: "center",
    marginHorizontal: 6, 
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  quickLinkTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 10, 
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: colors.white,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  carouselContainer: { paddingVertical: 8, paddingHorizontal: 20 },
  propertyCard: {
    width: cardWidth,
    height: 220,
    borderRadius: 16,
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    backgroundColor: colors.border,
  },
  propertyCardImage: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
  },
  propertyCardOverlay: {
    padding: 12,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  propertyCardTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 2,
  },
  propertyCardLocation: { fontSize: 12, color: "rgba(255, 255, 255, 0.8)" },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: colors.border,
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonActive: {
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
  },
  tabContent: {
    // No specific styles needed, just a container
  },
  viewAllCompactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    backgroundColor: colors.white,
    borderRadius: 10,
    marginTop: 8,
  },
  compactRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  compactStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  compactInfo: {
    flex: 1,
    marginRight: 8,
  },
  compactText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  compactTextBold: {
    fontWeight: "600",
    color: colors.text,
  },
  compactTimestamp: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 2,
  },
});