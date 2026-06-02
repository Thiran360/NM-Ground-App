import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
  RefreshControl,
  ScrollView,
} from "react-native";

import { HelloWave } from "@/components/hello-wave";
import { StatsLeaderboard } from "@/components/home/stats-leaderboard";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useAdminStore } from "@/store/admin-store";
import { MOCK_MATCHES } from "@/utils/sports-data";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInUp, ZoomIn } from "react-native-reanimated";

export default function HomeScreen() {
  const { user, logout, showAlert, fetchProfile, fetchWallet, fetchBookings } =
    useAdminStore();
  const tintColor = useThemeColor({}, "tint");
  const cardBg = useThemeColor({}, "cardBackground");
  const router = useRouter();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProfile(), fetchWallet(), fetchBookings()]);
    setRefreshing(false);
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: "",
          headerRight: () => (
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.headerButton}>
                <Ionicons name="notifications-outline" size={22} color="#fff" />
              </TouchableOpacity>
              {user && (
                <TouchableOpacity
                  onPress={() => logout()}
                  style={styles.headerButton}
                >
                  <Ionicons name="log-out-outline" size={22} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          ),
        }}
      />
      <ParallaxScrollView
        headerBackgroundColor={{ light: "#052a12", dark: "#000000" }}
        contentStyle={{ padding: 0, gap: 0 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tintColor}
          />
        }
        headerImage={
          <View style={styles.headerContainer}>
            <Image
              source={require("@/assets/images/stadium_header.png")}
              style={styles.headerImage}
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.8)"]}
              style={styles.headerGradient}
            />
            <View style={styles.heroContent}>
              <Animated.View entering={FadeInUp.delay(200).duration(800)}>
                <View style={styles.welcomeRow}>
                  <ThemedText type="title" style={styles.heroTitle}>
                    Hello, {user?.name || "Player"}!
                  </ThemedText>
                  <HelloWave />
                </View>
                <ThemedText style={styles.heroSubtitle}>
                  Ready for your next big match?
                </ThemedText>
              </Animated.View>
            </View>
          </View>
        }
      >
        {/* Quick Actions Grid */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Championship Hub
          </ThemedText>
          <View style={styles.actionGrid}>
            <Animated.View
              entering={ZoomIn.delay(200).springify()}
              style={{ flex: 1 }}
            >
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: cardBg }]}
                onPress={() => router.push("/sports" as any)}
              >
                <LinearGradient
                  colors={["#10B981", "#059669"]}
                  style={styles.actionIcon}
                >
                  <MaterialCommunityIcons
                    name="cricket"
                    size={28}
                    color="#fff"
                  />
                </LinearGradient>
                <View style={styles.actionInfo}>
                  <ThemedText style={styles.actionTitle}>
                    Book Ground
                  </ThemedText>
                  <ThemedText style={styles.actionSub}>
                    Save 15% Today
                  </ThemedText>
                </View>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View
              entering={ZoomIn.delay(350).springify()}
              style={{ flex: 1 }}
            >
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: cardBg }]}
                onPress={() =>
                  showAlert(
                    "Tournaments",
                    "The Arena Championship series is launching soon! Keep practicing.",
                    "info",
                  )
                }
              >
                <LinearGradient
                  colors={["#FF9800", "#F57C00"]}
                  style={styles.actionIcon}
                >
                  <Ionicons name="trophy" size={24} color="#fff" />
                </LinearGradient>
                <View style={styles.actionInfo}>
                  <ThemedText style={styles.actionTitle}>Play Cup</ThemedText>
                  <ThemedText style={styles.actionSub}>24 Ongoing</ThemedText>
                </View>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View
              entering={ZoomIn.delay(500).springify()}
              style={{ flex: 1 }}
            >
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: cardBg }]}
                onPress={() =>
                  showAlert(
                    "Community Hub",
                    "The Player community and team finder is becoming available in the next season update.",
                    "info",
                  )
                }
              >
                <LinearGradient
                  colors={["#2196F3", "#1976D2"]}
                  style={styles.actionIcon}
                >
                  <Ionicons name="people" size={24} color="#fff" />
                </LinearGradient>
                <View style={styles.actionInfo}>
                  <ThemedText style={styles.actionTitle}>Find Teams</ThemedText>
                  <ThemedText style={styles.actionSub}>Pro Matchup</ThemedText>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        {/* Stats Leaderboard */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle">Explore Our Arenas</ThemedText>
            <TouchableOpacity onPress={() => router.push("/sports" as any)}>
              <ThemedText style={[styles.seeAll, { color: tintColor }]}>
                View Grounds
              </ThemedText>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            snapToInterval={SCREEN_WIDTH - 40}
            decelerationRate="fast"
            contentContainerStyle={styles.carouselContainer}
          >
            {[
              {
                id: "1",
                image: require("@/assets/images/ground_a_premium.png"),
                title: "Cricket Ball Ground",
              },
              {
                id: "2",
                image: require("@/assets/images/ground_b_premium.png"),
                title: "Tennis Ball Ground",
              },
            ].map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.9}
                onPress={() => router.push("/sports" as any)}
                style={styles.carouselItem}
              >
                <Image source={item.image} style={styles.carouselImage} />
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.7)"]}
                  style={styles.carouselGradient}
                />
                <View style={styles.carouselContent}>
                  <ThemedText style={styles.carouselTitle}>
                    {item.title}
                  </ThemedText>
                  <View style={styles.carouselBadge}>
                    <Ionicons name="sparkles" size={12} color="#F9A825" />
                    <ThemedText style={styles.carouselBadgeText}>
                      PREMIUM
                    </ThemedText>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <StatsLeaderboard />
        </View>

        {/* Financial & Rewards Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Banking & Rewards
          </ThemedText>
          <Animated.View entering={FadeInUp.delay(600).duration(800)}>
            <TouchableOpacity
              style={styles.premiumWalletCard}
              onPress={() => router.push("/wallet" as any)}
            >
              <LinearGradient
                colors={[tintColor, "#11181C"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.premiumWalletGradient}
              />
              <View style={styles.walletMain}>
                <View style={styles.walletIdentity}>
                  <View style={styles.walletIconCircle}>
                    <Ionicons name="wallet" size={24} color="#fff" />
                  </View>
                  <View>
                    <ThemedText style={styles.premiumWalletLabel}>
                      TOTAL NM GREENS BALANCE
                    </ThemedText>
                    <ThemedText style={styles.premiumWalletValue}>
                      ₹{user?.walletBalance || 0}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.pointsStatus}>
                  <View style={styles.pointsPill}>
                    <MaterialCommunityIcons
                      name="star-circle"
                      size={18}
                      color="#F9A825"
                    />
                    <View>
                      <ThemedText style={styles.pointsTitle}>
                        {user?.loyaltyPoints || 0}
                      </ThemedText>
                      <ThemedText style={styles.pointsSubtitle}>
                        REWARD PTS
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </View>
              {/* Shimmer Effect Overlay - Removed for performance */}
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Modern Footer */}
        <View style={styles.footerInfo}>
          <LinearGradient
            colors={[tintColor + "15", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.footerGradient}
          />
          <MaterialCommunityIcons
            name="check-decagram"
            size={22}
            color={tintColor}
          />
          <ThemedText style={styles.footerText}>
            Certified Premium Sports Ecosystem
          </ThemedText>
          <View style={[styles.glow, { shadowColor: tintColor }]} />
        </View>
      </ParallaxScrollView>
    </ThemedView>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MATCH_CARD_SNAP_INTERVAL = SCREEN_WIDTH - 24; // Card width + gap

const styles = StyleSheet.create({
  headerContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  headerImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  headerGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "100%",
  },
  heroContent: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
  },
  welcomeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 32,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    marginTop: 4,
  },
  headerRight: {
    flexDirection: "row",
    gap: 12,
    marginRight: 16,
    marginTop: 10,
  },
  headerButton: {
    backgroundColor: "rgba(0,0,0,0.3)",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveCount: {
    color: "#EF4444",
    fontSize: 11,
    fontWeight: "bold",
  },
  horizontalList: {
    paddingHorizontal: 20,
  },
  actionGrid: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
  },
  actionCard: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionInfo: {
    alignItems: "center",
    gap: 2,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  actionSub: {
    fontSize: 10,
    opacity: 0.6,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "600",
  },
  footerInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 20,
    marginBottom: 40,
    marginHorizontal: 20,
    paddingVertical: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    position: "relative",
  },
  footerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  footerText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
    opacity: 0.8,
  },
  glow: {
    position: "absolute",
    width: "100%",
    height: "100%",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    zIndex: -1,
  },
  premiumWalletCard: {
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 28,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  premiumWalletGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.95,
  },
  walletMain: {
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  walletIdentity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  walletIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  premiumWalletLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  premiumWalletValue: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 2,
  },
  pointsStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  pointsPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,153,51,0.2)", // #F9A825 Saffron
  },
  pointsTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  pointsSubtitle: {
    color: "#F9A825", // #F9A825 Saffron
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginTop: -2,
  },
  shimmerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  carouselContainer: {
    paddingHorizontal: 20,
    gap: 15,
  },
  carouselItem: {
    width: SCREEN_WIDTH - 40,
    height: 200,
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
  },
  carouselImage: {
    width: "100%",
    height: "100%",
  },
  carouselGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
  },
  carouselContent: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  carouselTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  carouselBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(249, 168, 37, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(249, 168, 37, 0.4)",
  },
  carouselBadgeText: {
    color: "#F9A825",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
});
