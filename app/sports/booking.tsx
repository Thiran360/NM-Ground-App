import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { TIME_SLOTS, getSlotPrice, getDynamicTimeSlots } from "@/utils/pricing";
import { useAdminStore } from "@/store/admin-store";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
  TextInput,
  Linking,
  Alert,
} from "react-native";
import * as Haptics from "expo-haptics";

export default function BookingConfirmation() {
  const {
    groundId,
    date,
    slots,
    isFullDay: isFullDayParam,
    fullDayType: fullDayTypeParam,
  } = useLocalSearchParams<{
    groundId: string;
    date: string;
    slots: string;
    isFullDay: string;
    fullDayType: string;
  }>();
  const isFullDay = isFullDayParam === "true";
  const fullDayType = (fullDayTypeParam as "12h" | "24h") || "12h";
  const router = useRouter();
  const tintColor = useThemeColor({}, "tint");
  const cardBg = useThemeColor({}, "cardBackground");
  const pageBg = useThemeColor({}, "background");
  const {
    user,
    basePrice,
    price12h,
    price24h,
    weekendBasePrice,
    weekendPrice12h,
    weekendPrice24h,
    topUpWallet,
    payFromWallet,
    awardPoints,
    redeemPoints,
    addBooking,
    couponPercentage,
    couponCode: activeCouponCode,
    showAlert,
    bookings,
  } = useAdminStore();
  const [selectedMethod, setSelectedMethod] = useState<"wallet">(
    "wallet",
  );
  const [shouldRedeem, setShouldRedeem] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiWalletBalance, setApiWalletBalance] = useState<number | null>(null);
  const [paymentType, setPaymentType] = useState<"advance" | "full">("advance");

  useEffect(() => {
    const fetchApiWallet = async () => {
      if (!user?.id) return;
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
      }
    };
    fetchApiWallet();
  }, [user?.id]);

  const selectedSlotIds = slots?.split(",") || [];
  const bookingDate = new Date(date);
  const pricing = useMemo(
    () =>
      getSlotPrice(bookingDate, isFullDay, fullDayType, {
        hourly: basePrice,
        price12h,
        price24h,
        weekendHourly: weekendBasePrice,
        weekendPrice12h,
        weekendPrice24h,
      }),
    [bookingDate, isFullDay, fullDayType, basePrice, price12h, price24h, weekendBasePrice, weekendPrice12h, weekendPrice24h],
  );

  const baseTotal = isFullDay
    ? pricing.basePrice
    : pricing.basePrice * selectedSlotIds.length;
  const surchargeTotal = 0;

  const platformFee = 1;
  const gstAmount = Math.floor((baseTotal + platformFee) * 0.18);
  const gstDiscount = gstAmount;

  const totalAmount = baseTotal + platformFee + gstAmount - gstDiscount;

  // Points logic: 100 points = ₹10
  const maxRedeemablePoints = Math.min(
    user?.loyaltyPoints || 0,
    Math.floor(totalAmount / 4) * 10,
  ); // Limit redemption to 25% of total
  const redemptionValue = shouldRedeem ? maxRedeemablePoints / 10 : 0;
  const couponDiscount = isCouponApplied
    ? Math.floor(totalAmount * (couponPercentage / 100))
    : 0;

  const advanceAmount = Math.max(
    0,
    Math.floor(totalAmount / 2) + 1 - redemptionValue - couponDiscount,
  );
  const fullAmount = Math.max(
    0,
    totalAmount - redemptionValue - couponDiscount,
  );
  const amountToPay = paymentType === "full" ? fullAmount : advanceAmount;
  const balanceAmount = paymentType === "full" ? 0 : totalAmount - Math.floor(totalAmount / 2) + 1;

  const processFinalBooking = async () => {
    try {
      try {
        await fetch("https://refined-alone-causing.ngrok-free.dev/booking/payment-success/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user?.id ? parseInt(user.id.toString(), 10) : 5,
            groundId: parseInt(groundId?.replace(/\D/g, '') || "1", 10),
            date: date || new Date().toISOString().split("T")[0],
            amount: amountToPay,
          }),
        });
      } catch (err) {
        console.error("Payment success fetch error:", err);
      }

      if (selectedMethod !== "wallet") {
        try {
          await fetch("https://refined-alone-causing.ngrok-free.dev/booking/wallet-recharge/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: user?.id ? parseInt(user.id.toString(), 10) : 5,
              amount: amountToPay,
            }),
          });
          topUpWallet(amountToPay);
        } catch (err) {
          console.error("Wallet recharge fetch error:", err);
        }
      }

      payFromWallet(amountToPay);

      if (shouldRedeem) {
        redeemPoints(maxRedeemablePoints);
      }

      // Award points: 10 points for every ₹10 spent (on total amount)
      awardPoints(Math.floor(totalAmount / 10));

      // Save Booking to API
      const success = await addBooking({
        id: String((bookings?.length || 0) + 1),
        groundId: groundId || "1",
        ground: groundId || "1",
        ground_id: groundId || "1",
        user: user?.id,
        player: user?.id,
        date: date || new Date().toISOString(),
        slots: selectedSlotIds,
        isFullDay,
        fullDayType: isFullDay ? fullDayType : undefined,
        totalAmount,
        advancePaid: amountToPay,
        status: "Confirmed",
      });

      if (success) {
        showAlert(
          "Booking Confirmed",
          "Your payment was successful and your slot is now reserved!",
          "success",
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(tabs)/bookings");
      } else {
        showAlert(
          "Booking Failed",
          "The payment was processed but we could not save your booking. Please contact support.",
          "error",
        );
        setIsProcessing(false);
      }
    } catch (error: any) {
      console.error("Booking Error:", error);
      showAlert(
        "Error",
        `An unexpected error occurred: ${error.message}`,
        "error",
      );
      setIsProcessing(false);
    }
  };

  const handleConfirm = async () => {
    if (selectedMethod === "wallet" && user) {
      const currentBalance = apiWalletBalance !== null ? apiWalletBalance : (user.walletBalance || 0);
      if (currentBalance < amountToPay) {
        showAlert(
          "Insufficient Balance",
          `You need ₹${amountToPay} in your wallet to complete this booking. You have ₹${currentBalance}.`,
          "warning",
        );
        return;
      }
    }

    setIsProcessing(true);
    try {
      showAlert(
        "Processing Payment",
        `Securely processing ₹${amountToPay} via NM Greens Wallet...`,
        "info",
      );

      // Simulate payment processing time
      await new Promise((resolve) => setTimeout(resolve, 1500));



      await processFinalBooking();
    } catch (error: any) {
      console.warn("Processing Error:", error);
      showAlert("Error", `An unexpected error occurred.`, "error");
      setIsProcessing(false);
    }
  };
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerTitle: "Confirm Booking" }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText type="subtitle" style={styles.cardTitle}>
            Booking Summary
          </ThemedText>

          <View style={styles.detailRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="calendar" size={20} color={tintColor} />
            </View>
            <View>
              <ThemedText style={styles.label}>Date</ThemedText>
              <ThemedText type="defaultSemiBold">
                {bookingDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </ThemedText>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="time" size={20} color={tintColor} />
            </View>
            <View>
              <ThemedText style={styles.label}>Time Slots</ThemedText>
              {isFullDay ? (
                <View
                  style={[
                    styles.fullDayTag,
                    {
                      backgroundColor:
                        fullDayType === "24h" ? tintColor : "#34D399",
                    },
                  ]}
                >
                  <ThemedText type="defaultSemiBold" style={{ color: "#fff" }}>
                    {fullDayType === "12h"
                      ? "FULL DAY - 12 HOURS"
                      : "FULL DAY - 24 HOURS"}
                  </ThemedText>
                </View>
              ) : (
                selectedSlotIds.map((id) => {
                  const slot =
                    getDynamicTimeSlots(bookingDate).find((s) => s.id === id) ||
                    TIME_SLOTS.find((s) => s.id === id);
                  return (
                    <ThemedText key={id} type="defaultSemiBold">
                      {slot?.label}
                    </ThemedText>
                  );
                })
              )}
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText type="subtitle" style={styles.cardTitle}>
            Price Details
          </ThemedText>

          <View style={styles.priceRow}>
            <ThemedText>
              {isFullDay
                ? `Full Day Pass (${fullDayType === "12h" ? "12h" : "24h"})`
                : `Hourly Booking (${selectedSlotIds.length} slots)`}
            </ThemedText>
            <ThemedText>
              ₹
              {isFullDay
                ? pricing.basePrice
                : pricing.basePrice * selectedSlotIds.length}
            </ThemedText>
          </View>



          <View style={styles.priceRow}>
            <ThemedText>Platform Fee</ThemedText>
            <ThemedText>+₹{platformFee}</ThemedText>
          </View>

          <View style={styles.priceRow}>
            <ThemedText>GST (18%)</ThemedText>
            <ThemedText>+₹{gstAmount}</ThemedText>
          </View>

          <View style={styles.priceRow}>
            <ThemedText style={{ color: "#10B981" }}>NM Greens Discount</ThemedText>
            <ThemedText style={{ color: "#10B981" }}>-₹{gstDiscount}</ThemedText>
          </View>

          <View style={[styles.priceRow, styles.totalRow]}>
            <ThemedText type="subtitle">Total Amount</ThemedText>
            <ThemedText type="subtitle">₹{totalAmount}</ThemedText>
          </View>

          {isCouponApplied && (
            <View style={styles.priceRow}>
              <ThemedText style={{ color: "#10B981", fontWeight: "bold" }}>
                Coupon Discount ({couponPercentage}%)
              </ThemedText>
              <ThemedText style={{ color: "#10B981", fontWeight: "bold" }}>
                -₹{couponDiscount}
              </ThemedText>
            </View>
          )}

          {redemptionValue > 0 && (
            <View style={styles.priceRow}>
              <ThemedText style={{ color: "#10B981", fontWeight: "bold" }}>
                Points Discount Applied
              </ThemedText>
              <ThemedText style={{ color: "#10B981", fontWeight: "bold" }}>
                -₹{redemptionValue}
              </ThemedText>
            </View>
          )}

          <View style={styles.priceRow}>
            <ThemedText type="defaultSemiBold" style={{ color: tintColor }}>
              Pay Now ({paymentType === "full" ? "Full" : "Advance"})
            </ThemedText>
            <ThemedText type="defaultSemiBold" style={{ color: tintColor }}>
              ₹{amountToPay}
            </ThemedText>
          </View>

          {paymentType === "advance" && (
            <View style={styles.priceRow}>
              <ThemedText style={styles.label}>
                Balance to pay at ground
              </ThemedText>
              <ThemedText style={styles.label}>₹{balanceAmount}</ThemedText>
            </View>
          )}
        </View>

        {/* Coupon Code Section */}
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText type="subtitle" style={styles.cardTitle}>
            Promos & Vouchers
          </ThemedText>

          {isCouponApplied ? (
            <View style={styles.couponAppliedContainer}>
              <View style={styles.pointsInfo}>
                <MaterialCommunityIcons
                  name="ticket-percent"
                  size={24}
                  color="#10B981"
                />
                <View>
                  <ThemedText
                    type="defaultSemiBold"
                    style={{ color: "#10B981" }}
                  >
                    {couponCode.toUpperCase()} Applied
                  </ThemedText>
                  <ThemedText style={styles.label}>
                    You saved ₹{couponDiscount}
                  </ThemedText>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setIsCouponApplied(false);
                  setCouponCode("");
                  Haptics.selectionAsync();
                }}
              >
                <Ionicons name="close-circle" size={24} color="#D32F2F" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.couponInputContainer}>
              <TextInput
                style={[
                  styles.couponInput,
                  { color: tintColor, borderColor: "rgba(128, 128, 128, 0.2)" },
                ]}
                placeholder="Enter Coupon Code"
                placeholderTextColor="#94A3B8"
                value={couponCode}
                onChangeText={setCouponCode}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={[
                  styles.applyButton,
                  {
                    backgroundColor:
                      couponCode.length > 0
                        ? tintColor
                        : "rgba(128, 128, 128, 0.2)",
                  },
                ]}
                disabled={couponCode.length === 0}
                onPress={() => {
                  if (couponCode.toUpperCase() === activeCouponCode) {
                    setIsCouponApplied(true);
                    Haptics.notificationAsync(
                      Haptics.NotificationFeedbackType.Success,
                    );
                  } else {
                    showAlert(
                      "Invalid Coupon",
                      "The entered code does not exist or has expired.",
                      "error",
                    );
                    Haptics.notificationAsync(
                      Haptics.NotificationFeedbackType.Error,
                    );
                  }
                }}
              >
                <ThemedText style={styles.applyButtonText}>Apply</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>



        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText type="subtitle" style={styles.cardTitle}>
            Payment Option
          </ThemedText>
          <View style={styles.paymentGrid}>
            {[
              { id: "full", label: "Full Payment", amount: fullAmount },
              { id: "advance", label: "Advance Payment", amount: advanceAmount }
            ].map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.paymentOption,
                  paymentType === option.id && {
                    borderColor: tintColor,
                    backgroundColor: tintColor + "10",
                  },
                ]}
                onPress={() => setPaymentType(option.id as "full" | "advance")}
              >
                <View style={{ flex: 1 }}>
                  <ThemedText
                    style={[
                      styles.paymentLabel,
                      paymentType === option.id && {
                        color: tintColor,
                        fontWeight: "900",
                      },
                    ]}
                  >
                    {option.label}
                  </ThemedText>
                  <ThemedText style={styles.paymentSubtitle}>
                    Pay ₹{option.amount} now
                  </ThemedText>
                </View>
                {paymentType === option.id && (
                  <View
                    style={[
                      styles.checkCircle,
                      { backgroundColor: tintColor },
                    ]}
                  >
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText type="subtitle" style={styles.cardTitle}>
            Choose Payment Method
          </ThemedText>

          <View style={styles.paymentGrid}>
            {[
              {
                id: "wallet",
                label: `NM Greens Wallet (₹${apiWalletBalance !== null ? apiWalletBalance : user?.walletBalance || 0})`,
                icon: "wallet",
                color: tintColor,
              },
            ].map((method: { id: string; label: string; icon: string; color: string; subtitle?: string }) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentOption,
                  selectedMethod === method.id && {
                    borderColor: method.color,
                    backgroundColor: method.color + "10",
                  },
                ]}
                onPress={() => setSelectedMethod(method.id as any)}
              >
                <View
                  style={[
                    styles.methodIcon,
                    { backgroundColor: method.color + "15" },
                  ]}
                >
                  <Ionicons
                    name={method.icon as any}
                    size={22}
                    color={method.color}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText
                    style={[
                      styles.paymentLabel,
                      selectedMethod === method.id && {
                        color: method.color,
                        fontWeight: "900",
                      },
                    ]}
                  >
                    {method.label}
                  </ThemedText>
                  {method.subtitle && (
                    <ThemedText style={styles.paymentSubtitle}>
                      {method.subtitle}
                    </ThemedText>
                  )}
                </View>
                {selectedMethod === method.id && (
                  <View
                    style={[
                      styles.checkCircle,
                      { backgroundColor: method.color },
                    ]}
                  >
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={tintColor} />
          <ThemedText style={styles.infoText}>
            Cancellation is free up to 24 hours before the match. After that, a
            50% fee applies.
          </ThemedText>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: cardBg }]}>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            {
              backgroundColor: isProcessing
                ? "rgba(128, 128, 128, 0.5)"
                : tintColor,
            },
          ]}
          onPress={handleConfirm}
          disabled={isProcessing}
        >
          <ThemedText style={styles.confirmButtonText}>
            {isProcessing ? "Processing..." : `Pay ₹${amountToPay}`}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(128, 128, 128, 0.15)",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardTitle: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    gap: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(128, 128, 128, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 2,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.1)",
  },
  fullDayTag: {
    backgroundColor: "#34D399",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "rgba(10, 126, 164, 0.05)",
    padding: 16,
    borderRadius: 16,
    gap: 12,
    alignItems: "center",
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: "#CBD5E1",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.1)",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  confirmButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  paymentGrid: {
    gap: 12,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "rgba(128, 128, 128, 0.08)",
    gap: 12,
    position: "relative",
    marginBottom: 4,
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  paymentLabel: {
    fontSize: 15,
    color: "#CBD5E1",
    fontWeight: "600",
  },
  paymentSubtitle: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  checkCircle: {
    position: "absolute",
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  redemptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pointsInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  redemptionDetail: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 215, 0, 0.2)",
  },
  redemptionText: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "700",
  },
  couponInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  couponInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  applyButton: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  applyButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  couponAppliedContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
});
