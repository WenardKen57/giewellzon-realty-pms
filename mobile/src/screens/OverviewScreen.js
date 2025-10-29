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
import { getRecentSales } from "../api/sales";
import { getRecentInquiries } from "../api/inquiries";
import { toAbsoluteUrl } from "../api/client";
import Header from "../components/Header";
import { colors } from "../theme/colors";
import { notifyError } from "../utils/notify";
import { Ionicons } from "@expo/vector-icons";

const { width: screenWidth } = Dimensions.get("window");
const cardWidth = screenWidth * 0.75;

const StatCard = ({ title, value, icon, color, style }) => (
  <Animated.View style={[styles.statCard, { borderLeftColor: color }, style]}>
    <View style={[styles.statIconContainer, { backgroundColor: color }]}>
      <Ionicons name={icon} size={24} color="#fff" />
    </View>
    <View style={styles.statInfo}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
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

const SaleCard = ({ item }) => (
  <Pressable style={styles.saleCard}>
    <Image
      source={{
        uri: toAbsoluteUrl(
          item.property?.thumbnail || "https://placehold.co/100x100?text=Img"
        ),
      }}
      style={styles.saleCardImage}
    />
    <View style={styles.saleCardInfo}>
      <Text style={styles.saleCardProperty} numberOfLines={1}>
        {item.property?.propertyName || "Property Name"}
      </Text>
      <Text style={styles.saleCardBuyer} numberOfLines={1}>
        Sold to {item.buyerName || "Buyer"}
      </Text>
      <Text style={styles.saleCardAmount}>
        ₱{(item.amount || 0).toLocaleString()}
      </Text>
    </View>
    <Text style={styles.saleCardDate}>
      {item.date ? new Date(item.date).toLocaleDateString() : "No date"}
    </Text>
  </Pressable>
);

const InquiryCard = ({ item, navigation }) => {
  const statusColor =
    item.status === "Pending"
      ? colors.danger
      : item.status === "Handled"
      ? colors.success
      : colors.gray;

  return (
    <Pressable
      style={styles.inquiryCard}
      onPress={() => navigation.navigate("Inquiries")}
    >
      <View style={styles.inquiryAvatar}>
        <Ionicons name="person-circle-outline" size={44} color={colors.gray} />
      </View>
      <View style={styles.inquiryInfo}>
        <View style={styles.inquiryHeader}>
          <Text style={styles.inquiryName} numberOfLines={1}>
            {item.inquirerName || "Inquirer Name"}
          </Text>
          <Text style={[styles.inquiryStatus, { color: statusColor }]}>
            {item.status || "No Status"}
          </Text>
        </View>
        <Text style={styles.inquiryMessage} numberOfLines={2}>
          {item.message || "No message preview"}
        </Text>
        <Text style={styles.inquiryProperty} numberOfLines={1}>
          Re: {item.property?.propertyName || "Property"}
        </Text>
      </View>
      <Text style={styles.inquiryTimestamp}>
        {item.createdAt
          ? new Date(item.createdAt).toLocaleDateString()
          : "No date"}
      </Text>
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

  const fadeAnim1 = useRef(new Animated.Value(0)).current;
  const fadeAnim2 = useRef(new Animated.Value(0)).current;
  const fadeAnim3 = useRef(new Animated.Value(0)).current;
  const fadeAnim4 = useRef(new Animated.Value(0)).current;
  const fadeAnim5 = useRef(new Animated.Value(0)).current;

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
      Animated.timing(fadeAnim5, {
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
      const [statsData, featuredData, salesData, inquiriesData] =
        await Promise.all([
          getDashboardAnalytics(),
          getFeaturedProperties(5),
          getRecentSales(5), // This fetches your sales data
          getRecentInquiries(5), // This fetches your inquiries data
        ]);
      setStats(statsData);
      setFeatured(featuredData || []);
      setRecentSales(salesData || []); // This sets your sales state
      setRecentInquiries(inquiriesData || []); // This sets your inquiries state
      fadeIn();
    } catch (error) {
      notifyError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [refreshing, fadeAnim1, fadeAnim2, fadeAnim3, fadeAnim4, fadeAnim5]);

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
            <Animated.View style={[styles.section, { opacity: fadeAnim1 }]}>
              <Text style={styles.sectionTitle}>Overview</Text>
              <View style={styles.statsGrid}>
                <StatCard
                  title="Total Properties"
                  value={stats?.buildingCount || 0}
                  icon="business-outline"
                  color={colors.primary}
                />
                <StatCard
                  title="Pending Inquiries"
                  value={stats?.pendingInquiries || 0}
                  icon="chatbubbles-outline"
                  color={colors.danger}
                />
                <StatCard
                  title="Total Revenue"
                  value={`₱${(stats?.totalClosedRevenue || 0).toLocaleString()}`}
                  icon="cash-outline"
                  color={colors.success}
                />
                <StatCard
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

            <Animated.View style={[styles.section, { opacity: fadeAnim2 }]}>
              <Text style={styles.sectionTitle}>Quick Links</Text>
              <View style={styles.quickLinksGrid}>
                {/* --- 🎨 QuickLinkCards Updated --- */}
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

            {/* --- 🎨 Featured Properties Spacing Fixed --- */}
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

            {/* --- 🚀 RECENT SALES SECTION MODIFIED --- */}
            <Animated.View style={[styles.section, { opacity: fadeAnim4 }]}>
              <View style={styles.sectionHeaderRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.sectionTitle}>Recent Sales</Text>
                  <Text style={styles.sectionSubtitle}>
                    A glimpse of your latest closed deals.
                  </Text>
                </View>
                <Pressable
                  onPress={() => navigation.navigate("Sales")}
                  style={styles.viewAllButton}
                >
                  <Text style={styles.viewAllText}>View All</Text>
                  <Ionicons
                    name="chevron-forward-outline"
                    size={16}
                    color={colors.primary}
                  />
                </Pressable>
              </View>

              {recentSales.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons
                    name="cash-outline"
                    size={60}
                    color={colors.gray}
                  />
                  <Text style={styles.emptyTitle}>No recent sales yet.</Text>
                  <Text style={styles.emptyText}>
                    Start recording your transactions!
                  </Text>
                </View>
              ) : (
                recentSales.map((item) => (
                  <SaleCard key={item._id} item={item} />
                ))
              )}
            </Animated.View>

            {/* --- 🚀 RECENT INQUIRIES SECTION MODIFIED --- */}
            <Animated.View style={[styles.section, { opacity: fadeAnim5 }]}>
              <View style={styles.sectionHeaderRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.sectionTitle}>Recent Inquiries</Text>
                  <Text style={styles.sectionSubtitle}>
                    Stay updated with the latest customer interests.
                  </Text>
                </View>
                <Pressable
                  onPress={() => navigation.navigate("Inquiries")}
                  style={styles.viewAllButton}
                >
                  <Text style={styles.viewAllText}>View All</Text>
                  <Ionicons
                    name="chevron-forward-outline"
                    size={16}
                    color={colors.primary}
                  />
                </Pressable>
              </View>

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
                recentInquiries.map((item) => (
                  <InquiryCard
                    key={item._id}
                    item={item}
                    navigation={navigation}
                  />
                ))
              )}
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light },
  // 🎨 Added more vertical padding
  scrollContent: { paddingVertical: 24, paddingBottom: 100 },
  loader: { marginTop: 50 },
  section: { marginBottom: 24, paddingHorizontal: 20 },
  // 🎨 This View provides padding for titles *outside* the carousel
  sectionHeader: { paddingHorizontal: 20 },

  // --- 🚀 NEW/MODIFIED STYLES ---
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16, // Replaces subtitle margin
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
  },
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
    marginBottom: 4, // Adjusted from 8
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 0, // Adjusted from 16
    marginTop: 0, // Adjusted from -4
  },
  // --- END OF NEW/MODIFIED STYLES ---

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
  statCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    width: "48.5%",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 5,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statInfo: { flexShrink: 1 },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    flexShrink: 1,
  },
  statTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    flexShrink: 1,
  },
  quickLinksGrid: { flexDirection: "row", justifyContent: "space-between" },
  // 🎨 QuickLinkCard styles updated
  quickLinkCard: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 20, // More padding
    alignItems: "center",
    marginHorizontal: 6, // More spacing
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
    marginTop: 10, // More spacing
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
  // 🎨 Carousel container now starts from the edge
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

  // Sales Card Styles
  saleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  saleCardImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: colors.border,
  },
  saleCardInfo: { flex: 1, marginRight: 8 },
  saleCardProperty: { fontSize: 15, fontWeight: "bold", color: colors.text },
  saleCardBuyer: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  saleCardAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.success,
    marginTop: 2,
  },
  saleCardDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: "auto",
    alignSelf: "flex-start",
  },

  // Inquiry Card Styles
  inquiryCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  inquiryAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: colors.light,
  },
  inquiryInfo: { flex: 1, marginRight: 8 },
  inquiryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  inquiryName: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.text,
    flexShrink: 1,
  },
  inquiryStatus: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  inquiryMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  inquiryProperty: {
    fontSize: 12,
    color: colors.primary,
    fontStyle: "italic",
    marginTop: 4,
  },
  inquiryTimestamp: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: "auto",
    alignSelf: "flex-start",
  },
});