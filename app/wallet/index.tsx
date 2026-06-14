import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useAdminStore } from "@/store/admin-store";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Dimensions,
  ImageBackground,
  RefreshControl,
  Linking,
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
  const [apiWalletBalance, setApiWalletBalance] = useState<number | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>(TRANSACTIONS);

  const fetchApiWallet = async () => {
    if (!user?.id) return;
    setWalletLoading(true);
    try {
      const res = await fetch(
        `https://refined-alone-causing.ngrok-free.dev/booking/wallet/?userId=${user.id}`,
        {
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setApiWalletBalance(data.wallet_balance ?? data.wallet_points ?? null);
      }
    } catch (e) {
      console.warn("Wallet API fetch failed:", e);
    } finally {
      setWalletLoading(false);
    }
  };

  const fetchTransactions = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(
        `https://refined-alone-causing.ngrok-free.dev/booking/wallet-transactions/?userId=${user.id}`,
        {
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        // Fallback to TRANSACTIONS if API returns empty or unexpected format
        const fetchedTxs = Array.isArray(data) ? data : data.transactions || [];
        if (fetchedTxs.length > 0) {
          const mappedTxs = fetchedTxs.map((t: any, index: number) => {
            let amount = 0;
            if (t.amount !== undefined) amount = Number(t.amount);
            
            let dateStr = t.date || t.created_at || t.timestamp || new Date().toISOString();
            if (dateStr.includes('T')) dateStr = dateStr.split('T')[0];

            return {
              ...t,
              id: String(t.id || t.transaction_id || index),
              type: t.type || t.transaction_type || t.description || "Transaction",
              amount: amount,
              date: dateStr,
            };
          });
          setTransactions(mappedTxs);
        }
      }
    } catch (e) {
      console.warn("Wallet transactions API fetch failed:", e);
    }
  };

  useEffect(() => {
    fetchWallet();
    fetchApiWallet();
    fetchTransactions();
  }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWallet();
    await fetchApiWallet();
    await fetchTransactions();
    setRefreshing(false);
  };

  const handleTopUp = async () => {
    if (paymentMethod === "gpay") {
      // Mocking GPay intent
      console.log("Processing GPay Top-Up");
    }

    if (user?.id) {
      try {
        await fetch(
          "https://refined-alone-causing.ngrok-free.dev/booking/wallet-recharge/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "true",
            },
            body: JSON.stringify({
              userId: user.id,
              amount: topUpAmount,
            }),
          }
        );
        fetchApiWallet();
      } catch (e) {
        console.warn("Wallet recharge API failed:", e);
      }
    }

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
              <ThemedText style={styles.balanceLabel}>WALLET BALANCE</ThemedText>
              <View style={styles.pointsRow}>
                <ThemedText style={[styles.balanceValue, { fontSize: 48 }]}>
                  ₹
                  {apiWalletBalance !== null
                    ? apiWalletBalance
                    : user?.walletBalance || 0}
                </ThemedText>
              </View>
              {apiWalletBalance !== null && (
                <View style={styles.syncBadge}>
                  <Ionicons name="cloud-done-outline" size={12} color="#34D399" />
                  <ThemedText style={styles.syncText}>Synced with server</ThemedText>
                </View>
              )}
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
              Top up your wallet balance
            </ThemedText>

            <View style={styles.amountGrid}>
              {[500, 1000, 2000, 5001].map((amount) => (
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
                  <ThemedText
                    style={[
                      styles.pointsEarnText,
                      topUpAmount === amount && { color: "rgba(255,255,255,0.85)" },
                    ]}
                  >
                    Add ₹{amount}
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
                Pay ₹{topUpAmount} → Add ₹{topUpAmount}
              </ThemedText>
              <Ionicons name="flash" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Points Benefits - Hidden */}

          {/* History Section */}
          <View style={styles.historyHeader}>
            <ThemedText type="subtitle">Transaction History</ThemedText>
            <TouchableOpacity>
              <ThemedText style={{ color: tintColor }}>View All</ThemedText>
            </TouchableOpacity>
          </View>

          {transactions.map((tx: any, index: number) => (
            <View
              key={tx.id || index.toString()}
              style={[styles.txItem, { backgroundColor: cardBg }]}
            >
              <View
                style={[
                  styles.txIcon,
                  {
                    backgroundColor: tx.amount > 0 ? "#34D39915" : tx.amount < 0 ? "#EF444415" : "#94A3B810",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={
                    tx.amount > 0
                      ? "wallet-plus"
                      : tx.type === "Redemption"
                        ? "gift-outline"
                        : "wallet-outline"
                  }
                  size={20}
                  color={tx.amount > 0 ? "#34D399" : tx.amount < 0 ? "#EF4444" : "#94A3B8"}
                />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText type="defaultSemiBold">{tx.type}</ThemedText>
                <ThemedText style={styles.txDate}>{tx.date}</ThemedText>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <ThemedText
                  style={[
                    styles.txPoints,
                    { fontSize: 15 },
                    tx.amount > 0 && { color: "#34D399" },
                    tx.amount < 0 && { color: "#EF4444" },
                    tx.amount === 0 && { color: "#94A3B8" },
                  ]}
                >
                  {tx.amount > 0 ? "+" : ""}
                  {tx.amount === 0 ? "₹0" : `₹${Math.abs(tx.amount)}`}
                </ThemedText>
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
  syncBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(52,211,153,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10,
  },
  syncText: {
    color: "#34D399",
    fontSize: 11,
    fontWeight: "700",
  },
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
    marginBottom: 12,
  },
  pointsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  balanceValue: {
    color: "#fff",
    fontSize: 64,
    fontWeight: "900",
    lineHeight: 72,
  },
  pointsSubLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 2,
    marginTop: 2,
  },
  pointsEquivLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  pointsEarnText: {
    fontSize: 11,
    color: "#F9A825",
    fontWeight: "700",
    marginTop: 2,
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
