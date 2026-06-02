import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useAdminStore } from "@/store/admin-store";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Dimensions,
  ImageBackground,
  RefreshControl,
} from "react-native";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

const TRANSACTIONS = [
  { id: "1", type: "Booking", amount: -601, date: "2026-04-15", points: +60 },
  { id: "2", type: "Top-up", amount: +1000, date: "2026-04-14", points: 0 },
  { id: "3", type: "Booking", amount: -1201, date: "2026-04-12", points: +120 },
  { id: "4", type: "Redemption", amount: 0, date: "2026-04-10", points: -500 },
];

export default function WalletScreen() {
  const router = useRouter();
  const { user, topUpWallet, fetchWallet, showAlert } = useAdminStore();
  const tintColor = useThemeColor({}, "tint");
  const cardBg = useThemeColor({}, "cardBackground");
  const [topUpAmount, setTopUpAmount] = useState(500);
  const [paymentMethod, setPaymentMethod] = useState<"gpay">("gpay");
  const [refreshing, setRefreshing] = useState(false);

  React.useEffect(() => {
    fetchWallet();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWallet();
    setRefreshing(false);
  };

  const handleTopUp = () => {
    topUpWallet(topUpAmount);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showAlert(
      "Top-up Initiated",
      `Processing ₹${topUpAmount} addition to your wallet via ${paymentMethod.toUpperCase()}...`,
      "success",
    );
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: "NM Greens Wallet",
          headerTransparent: true,
          headerTintColor: "#fff",
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tintColor}
          />
        }
      >
        <ImageBackground
          source={require("@/assets/images/stadium_header.png")}
          style={styles.headerImage}
          imageStyle={{
            borderBottomLeftRadius: 30,
            borderBottomRightRadius: 30,
          }}
        >
          <View style={styles.headerOverlay}>
            <View style={styles.balanceContainer}>
              <ThemedText style={styles.balanceLabel}>TOTAL BALANCE</ThemedText>
              <ThemedText style={styles.balanceValue}>
                ₹{user?.walletBalance || 0}
              </ThemedText>
              <View style={styles.pointsBadge}>
                <MaterialCommunityIcons
                  name="star-circle"
                  size={16}
                  color="#F9A825"
                />
                <ThemedText style={styles.pointsText}>
                  {user?.loyaltyPoints || 0} Points
                </ThemedText>
              </View>
            </View>
          </View>
        </ImageBackground>

        <View style={styles.mainContent}>
          {/* Top-up Section */}
          <View style={[styles.sectionCard, { backgroundColor: cardBg }]}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Add Funds
            </ThemedText>
            <ThemedText style={styles.sectionSubtitle}>
              Quick recharge for seamless bookings
            </ThemedText>

            <View style={styles.amountGrid}>
              {[500, 1000, 2000, 5000].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[
                    styles.amountButton,
                    { borderColor: tintColor + "20" },
                    topUpAmount === amount && {
                      backgroundColor: tintColor,
                      borderColor: tintColor,
                    },
                  ]}
                  onPress={() => {
                    setTopUpAmount(amount);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <ThemedText
                    style={[
                      styles.amountText,
                      topUpAmount === amount && { color: "#fff" },
                    ]}
                  >
                    ₹{amount}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            <ThemedText style={styles.paymentSub}>
              Choose payment method
            </ThemedText>
            <View style={styles.paymentSelector}>
              {[{ id: "gpay", label: "GPay", icon: "logo-google" }].map(
                (method) => (
                  <TouchableOpacity
                    key={method.id}
                    style={[
                      styles.methodBubble,
                      {
                        backgroundColor: cardBg,
                        borderColor: tintColor + "20",
                      },
                      paymentMethod === method.id && {
                        borderColor: tintColor,
                        backgroundColor: tintColor + "08",
                      },
                    ]}
                    onPress={() => {
                      setPaymentMethod(method.id as any);
                      Haptics.selectionAsync();
                    }}
                  >
                    <Ionicons
                      name={method.icon as any}
                      size={16}
                      color={
                        paymentMethod === method.id ? tintColor : "#94A3B8"
                      }
                    />
                    <ThemedText
                      style={[
                        styles.methodText,
                        paymentMethod === method.id && {
                          color: tintColor,
                          fontWeight: "bold",
                        },
                      ]}
                    >
                      {method.label}
                    </ThemedText>
                  </TouchableOpacity>
                ),
              )}
            </View>

            <TouchableOpacity
              style={[styles.payButton, { backgroundColor: tintColor }]}
              onPress={handleTopUp}
            >
              <ThemedText style={styles.payButtonText}>
                Add ₹{topUpAmount} Now
              </ThemedText>
              <Ionicons name="flash" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Points Benefits */}
          <View style={[styles.infoCard, { borderColor: tintColor + "30" }]}>
            <View
              style={[styles.infoIcon, { backgroundColor: tintColor + "15" }]}
            >
              <Ionicons name="gift-outline" size={24} color={tintColor} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText type="defaultSemiBold">Earn as you play</ThemedText>
              <ThemedText style={styles.infoDesc}>
                Get 10 points for every ₹100 spent. Redeem 100 points for ₹10
                off!
              </ThemedText>
            </View>
          </View>

          {/* History Section */}
          <View style={styles.historyHeader}>
            <ThemedText type="subtitle">Transaction History</ThemedText>
            <TouchableOpacity>
              <ThemedText style={{ color: tintColor }}>View All</ThemedText>
            </TouchableOpacity>
          </View>

          {TRANSACTIONS.map((tx) => (
            <View
              key={tx.id}
              style={[styles.txItem, { backgroundColor: cardBg }]}
            >
              <View
                style={[
                  styles.txIcon,
                  {
                    backgroundColor: tx.amount > 0 ? "#10B98115" : "#388E3C10",
                  },
                ]}
              >
                <Ionicons
                  name={
                    tx.amount > 0
                      ? "arrow-down"
                      : tx.type === "Redemption"
                        ? "gift"
                        : "card"
                  }
                  size={20}
                  color={tx.amount > 0 ? "#10B981" : "#388E3C"}
                />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText type="defaultSemiBold">{tx.type}</ThemedText>
                <ThemedText style={styles.txDate}>{tx.date}</ThemedText>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <ThemedText
                  style={[
                    styles.txAmount,
                    tx.amount > 0 && { color: "#10B981" },
                  ]}
                >
                  {tx.amount > 0 ? "+" : ""}
                  {tx.amount === 0 ? "--" : `₹${Math.abs(tx.amount)}`}
                </ThemedText>
                {tx.points !== 0 && (
                  <ThemedText style={styles.txPoints}>
                    {tx.points > 0 ? "+" : ""}
                    {tx.points} pts
                  </ThemedText>
                )}
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerImage: {
    height: 300,
    width: "100%",
  },
  headerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },
  balanceContainer: {
    alignItems: "center",
    width: "100%",
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 8,
  },
  balanceValue: {
    color: "#fff",
    fontSize: 56,
    fontWeight: "900",
    lineHeight: 64,
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 16,
    gap: 6,
    backdropFilter: "blur(10px)",
  },
  pointsText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
  mainContent: {
    padding: 20,
    marginTop: -40,
  },
  sectionCard: {
    borderRadius: 24,
    padding: 24,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.1)",
  },
  sectionTitle: {
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: "#94A3B8",
    fontSize: 13,
    marginBottom: 20,
  },
  amountGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  amountButton: {
    flex: 1,
    minWidth: "45%",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
  },
  amountText: {
    fontWeight: "900",
    fontSize: 16,
  },
  payButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
  },
  payButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  paymentSub: {
    fontSize: 10,
    fontWeight: "900",
    color: "#CBD5E1",
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  paymentSelector: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  methodBubble: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  methodText: {
    fontSize: 13,
    color: "#CBD5E1",
  },
  infoCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: "dashed",
    marginBottom: 30,
    gap: 16,
    alignItems: "center",
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  infoDesc: {
    fontSize: 12,
    color: "#CBD5E1",
    marginTop: 2,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  txItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    gap: 16,
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.05)",
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  txDate: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: "bold",
  },
  txPoints: {
    fontSize: 11,
    color: "#FFD700",
    fontWeight: "bold",
    marginTop: 2,
  },
});
