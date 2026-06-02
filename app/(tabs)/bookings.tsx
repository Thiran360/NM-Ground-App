import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { useAdminStore } from "@/store/admin-store";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";
import { TIME_SLOTS, getDynamicTimeSlots } from "@/utils/pricing";
import Animated, { FadeInUp } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

export default function BookingsScreen() {
  const { bookings, showAlert, cancelBooking, fetchBookings } = useAdminStore();
  const [refreshing, setRefreshing] = useState(false);
  const cardBg = useThemeColor({}, "cardBackground");
  const tintColor = useThemeColor({}, "tint");

  useEffect(() => {
    fetchBookings();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  };

  const formatSlotLabels = (slotIds: any, bookingDate: Date) => {
    if (!slotIds) return "No time slots specified";

    let parsedSlots = slotIds;
    // Handle stringified JSON or comma-separated strings
    if (typeof slotIds === "string") {
      try {
        parsedSlots = JSON.parse(slotIds);
      } catch (e) {
        if (slotIds.includes(",")) {
          parsedSlots = slotIds.split(",").map((s: string) => s.trim());
        } else {
          parsedSlots = [slotIds];
        }
      }
    }

    if (!Array.isArray(parsedSlots)) return String(parsedSlots);
    if (parsedSlots.length === 0) return "No time slots specified";

    const slots = getDynamicTimeSlots(bookingDate);
    return parsedSlots
      .map((id) => {
        const actualId =
          typeof id === "object" && id !== null
            ? String(id.id || id.slotId || id.time || id.time_slot || id)
            : String(id);

        const slot =
          slots.find((s) => String(s.id) === actualId) ||
          TIME_SLOTS.find((s) => String(s.id) === actualId);
        return slot ? slot.label : actualId;
      })
      .join(", ");
  };

  const handleAction = (action: string) => {
    showAlert(
      action,
      `This would open the NM Greens ${action.toLowerCase()} interface for your booking.`,
      "info",
    );
  };

  // Logic to separate and sort bookings
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const sortedBookings = [...bookings].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const upcomingBookings = sortedBookings.filter(
    (b) => new Date(b.date) >= now && b.status !== "Cancelled",
  );
  const pastBookings = sortedBookings
    .filter((b) => new Date(b.date) < now || b.status === "Cancelled")
    .reverse();

  const renderBookingCard = (booking: any, index: number) => {
    const bookingDate = new Date(booking.date);
    const isPartiallyPaid = booking.advancePaid < booking.totalAmount;
    const isPast = bookingDate < now || booking.status === "Cancelled";

    return (
      <Animated.View
        entering={FadeInUp.delay(index * 100)
          .springify()
          .damping(14)}
        key={booking.id}
        style={[
          styles.card,
          { backgroundColor: cardBg, opacity: isPast ? 0.8 : 1 },
        ]}
      >
        <LinearGradient
          colors={
            isPast
              ? ["rgba(255,255,255,0.02)", "transparent"]
              : ["rgba(255,255,255,0.05)", "transparent"]
          }
          style={[StyleSheet.absoluteFillObject, { borderRadius: 24 }]}
        />

        <View style={styles.cardHeader}>
          <View style={styles.headerTitleWrap}>
            <ThemedText style={styles.bookingId}>
              ID: {String(booking.id || "N/A").toUpperCase()}
            </ThemedText>
            <ThemedText style={styles.groundName}>
              {booking.groundId ||
                booking.ground_name ||
                booking.ground ||
                "Unknown Ground"}
            </ThemedText>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  booking.status === "Cancelled"
                    ? "rgba(239, 68, 68, 0.15)"
                    : "rgba(16, 185, 129, 0.15)",
              },
            ]}
          >
            <ThemedText
              style={[
                styles.statusText,
                {
                  color: booking.status === "Cancelled" ? "#F87171" : "#34D399",
                },
              ]}
            >
              {booking.status || "Confirmed"}
            </ThemedText>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Ionicons
              name="calendar"
              size={18}
              color={isPast ? "#9CA3AF" : tintColor}
            />
            <ThemedText
              style={[styles.detailText, isPast && { color: "#9CA3AF" }]}
            >
              {isNaN(bookingDate.getTime())
                ? "Date TBD"
                : bookingDate.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
            </ThemedText>
          </View>

          <View style={styles.detailRow}>
            <Ionicons
              name="time"
              size={18}
              color={isPast ? "#9CA3AF" : tintColor}
            />
            <ThemedText
              style={[styles.detailText, isPast && { color: "#9CA3AF" }]}
              numberOfLines={2}
            >
              {booking.isFullDay
                ? `FULL DAY - ${String(booking.fullDayType || "Standard").toUpperCase()}`
                : formatSlotLabels(
                    booking.slots || booking.time_slots,
                    bookingDate,
                  )}
            </ThemedText>
          </View>

          {!isPast && isPartiallyPaid && (
            <View style={styles.detailRow}>
              <Ionicons name="information-circle" size={18} color="#F9A825" />
              <ThemedText style={[styles.detailText, { color: "#F9A825" }]}>
                Balance of ₹
                {Number(booking.totalAmount) - Number(booking.advancePaid)} due
                at venue.
              </ThemedText>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.footerRow}>
          <View style={styles.priceColumn}>
            <ThemedText style={styles.label}>Total Amount</ThemedText>
            <ThemedText style={[styles.price, isPast && { color: "#D1D5DB" }]}>
              ₹{booking.totalAmount}
            </ThemedText>
          </View>
          <View style={styles.priceColumnRight}>
            <ThemedText style={styles.label}>Advance Paid</ThemedText>
            <ThemedText
              style={[styles.price, { color: isPast ? "#9CA3AF" : tintColor }]}
            >
              ₹{booking.advancePaid}
            </ThemedText>
          </View>
        </View>

        {!isPast && (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: tintColor }]}
              onPress={() => handleAction("Directions")}
            >
              <Ionicons name="navigate-outline" size={16} color={tintColor} />
              <ThemedText
                style={[styles.actionButtonText, { color: tintColor }]}
              >
                Directions
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                { borderColor: "rgba(255,255,255,0.2)" },
              ]}
              onPress={() => handleAction("Support")}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={16}
                color="#FFFFFF"
              />
              <ThemedText
                style={[styles.actionButtonText, { color: "#FFFFFF" }]}
              >
                Support
              </ThemedText>
            </TouchableOpacity>

            {booking.status === "Confirmed" && (
              <TouchableOpacity
                style={[styles.actionButton, { borderColor: "#EF4444" }]}
                onPress={() => {
                  Alert.alert(
                    "Cancel Booking?",
                    `Are you sure you want to cancel? As per policy, you will receive a 50% refund (₹${(booking.advancePaid * 0.5).toFixed(2)}) to your NM Greens Wallet.`,
                    [
                      { text: "Keep Booking", style: "cancel" },
                      {
                        text: "Yes, Cancel",
                        onPress: () => cancelBooking(booking.id),
                        style: "destructive",
                      },
                    ],
                  );
                }}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={16}
                  color="#EF4444"
                />
                <ThemedText
                  style={[styles.actionButtonText, { color: "#EF4444" }]}
                >
                  Cancel
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          My Bookings
        </ThemedText>
      </View>

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
        {bookings.length === 0 ? (
          <Animated.View
            entering={FadeInUp.delay(200)}
            style={styles.emptyContainer}
          >
            <Ionicons
              name="ticket-outline"
              size={64}
              color="rgba(255,255,255,0.4)"
            />
            <ThemedText style={styles.emptyText}>No bookings yet.</ThemedText>
            <ThemedText style={styles.emptySubText}>
              Book a ground to see your history here.
            </ThemedText>
          </Animated.View>
        ) : (
          <View>
            {upcomingBookings.length > 0 && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>UPCOMING</ThemedText>
                {upcomingBookings.map((booking, index) =>
                  renderBookingCard(booking, index),
                )}
              </View>
            )}

            {pastBookings.length > 0 && (
              <View style={[styles.section, { marginTop: 20 }]}>
                <ThemedText style={styles.sectionTitle}>
                  PAST & CANCELLED
                </ThemedText>
                {pastBookings.map((booking, index) =>
                  renderBookingCard(booking, index),
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "900",
    marginTop: 16,
    color: "#FFFFFF",
  },
  emptySubText: {
    fontSize: 15,
    color: "#D1D5DB",
    marginTop: 8,
    textAlign: "center",
  },
  card: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    position: "relative",
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  headerTitleWrap: {
    flex: 1,
    paddingRight: 10,
  },
  bookingId: {
    fontSize: 12,
    color: "#D1D5DB",
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: 1,
  },
  groundName: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    textTransform: "capitalize",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailsContainer: {
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  detailText: {
    fontSize: 16,
    color: "#F3F4F6",
    fontWeight: "600",
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    marginVertical: 18,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceColumn: {
    alignItems: "flex-start",
  },
  priceColumnRight: {
    alignItems: "flex-end",
  },
  label: {
    fontSize: 13,
    color: "#D1D5DB",
    marginBottom: 4,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  price: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 2,
    marginBottom: 16,
    paddingLeft: 4,
  },
});
