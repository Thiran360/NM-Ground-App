import React, { useMemo, useState, useEffect } from "react";
import { StyleSheet, ScrollView, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useAdminStore } from "@/store/admin-store";
import { formatBookingId } from "@/utils/booking-utils";

export default function AdminBookingsPage() {
  const router = useRouter();
  const { grounds, user } = useAdminStore();
  const [apiBookings, setApiBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const tintColor = useThemeColor({}, "tint");
  const cardBg = useThemeColor({}, "cardBackground");
  const pageBg = useThemeColor({}, "background");

  // Fetch bookings from backend
  useEffect(() => {
    const fetchAdminBookings = async () => {
      try {
        const response = await fetch("https://api.codingboss.in/booking/admin/bookings/", {
          headers: {
            "ngrok-skip-browser-warning": "true",
            "Content-Type": "application/json",
            ...(user?.accessToken ? { Authorization: `Token ${user.accessToken}` } : {}),
          }
        });

        console.log("Admin Bookings Fetch Status:", response.status);

        if (response.ok) {
          const data = await response.json();
          console.log("Admin Bookings Data:", JSON.stringify(data).substring(0, 100));
          // The API returns { count: number, bookings: [...] }
          const bookingsArray = Array.isArray(data.bookings) ? data.bookings : (Array.isArray(data) ? data : []);

          const mappedBookings = bookingsArray.map((b: any) => {
            let status = "Confirmed";
            if (b.bookingStatus) {
              const s = b.bookingStatus.toLowerCase();
              if (s === "pending") status = "Pending";
              else if (s === "completed") status = "Completed";
              else if (s === "cancelled") status = "Cancelled";
              else status = b.bookingStatus;
            }

            return {
              ...b,
              id: String(b.bookingId || b.id || "0"),
              groundId: String(b.groundId || b.ground_id || "1"),
              date: b.bookingDate || b.date || new Date().toISOString(),
              status: status,
              isFullDay: b.slotType === "full_day" || b.is_full_day === "true" || b.isFullDay === true,
              totalAmount: b.totalAmount || b.total_amount || 0,
              advancePaid: b.onlinePaid || b.advancePaid || b.advance_paid || 0,
              cashPending: b.cashPending || 0,
              slots: Array.isArray(b.slots) ? b.slots : (typeof b.slots === 'string' ? b.slots.split(',') : []),
              customerName: b.customerName || b.userName,
              customerId: b.customerId,
            };
          });
          setApiBookings(mappedBookings);
        } else {
          console.log("Failed to fetch. Body:", await response.text());
        }
      } catch (e) {
        console.warn("Failed to fetch admin bookings", e);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminBookings();
  }, [user?.accessToken]);

  // Group bookings by status
  const groupedBookings = useMemo(() => {
    const groups: Record<string, typeof apiBookings> = {
      Pending: [],
      Confirmed: [],
      Completed: [],
      Cancelled: [],
    };

    apiBookings?.forEach((b) => {
      if (groups[b.status]) {
        groups[b.status].push(b);
      } else {
        groups[b.status] = [b];
      }
    });

    return groups;
  }, [apiBookings]);

  const renderBookingList = (status: string, title: string, color: string, bgColor: string) => {
    const list = groupedBookings[status] || [];

    if (list.length === 0) return null;

    return (
      <View style={styles.sectionContainer} key={status}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>{title} ({list.length})</ThemedText>
        {list.map((booking) => {
          const groundName = booking.groundName || grounds?.find((g) => g.id === booking.groundId)?.name || booking.groundId;
          const userName = booking.customerName || (booking as any).userName || (booking as any).user_name || (booking as any).user?.name || (booking as any).user?.full_name || (booking as any).customer_name || `User ID: ${booking.customerId || booking.user || booking.player || "Guest"}`;
          const userPhone = (booking as any).userPhone || (booking as any).user_phone || (booking as any).phone_number || (booking as any).user?.phone_number || (booking as any).customer_phone || "No phone provided";

          return (
            <View key={booking.id} style={[styles.bookingCard, { backgroundColor: cardBg }]}>
              <View style={styles.cardHeader}>
                <ThemedText type="defaultSemiBold">Booking {formatBookingId(booking.id)}</ThemedText>
                <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
                  <ThemedText style={[styles.statusText, { color }]}>{booking.status}</ThemedText>
                </View>
              </View>
              <View style={styles.detailsContainer}>
                <ThemedText style={styles.metaText}>User: {userName} • {userPhone}</ThemedText>
                <ThemedText style={styles.metaText}>Ground: {groundName}</ThemedText>
                <ThemedText style={styles.metaText}>Date: {new Date(booking.date).toLocaleDateString()}</ThemedText>
                <ThemedText style={styles.metaText}>
                  Slots: {booking.isFullDay ? `Full Day (${booking.fullDayType})` : booking.slots?.length ? booking.slots.join(', ') : 'None'}
                </ThemedText>
              </View>
              <View style={styles.footerContainer}>
                <ThemedText style={styles.totalText}>Total: ₹{booking.totalAmount}</ThemedText>
                {booking.cashPending > 0 ? (
                  <View style={{ alignItems: 'flex-end' }}>
                    <ThemedText style={[styles.paidText, { color: tintColor }]}>Paid: ₹{booking.advancePaid}</ThemedText>
                    <ThemedText style={[styles.paidText, { color: "#EF4444", fontSize: 12, marginTop: 2 }]}>Due: ₹{booking.cashPending}</ThemedText>
                  </View>
                ) : (
                  <ThemedText style={[styles.paidText, { color: tintColor }]}>Paid: ₹{booking.advancePaid}</ThemedText>
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: "All Bookings",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16 }}>
              <Ionicons name="arrow-back" size={24} color={tintColor} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>All Bookings</ThemedText>
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 100 }}>
            <ActivityIndicator size="large" color={tintColor} />
            <ThemedText style={{ marginTop: 12, color: "#94A3B8" }}>Loading bookings...</ThemedText>
          </View>
        ) : apiBookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={60} color="rgba(255,255,255,0.2)" />
            <ThemedText style={styles.emptyTitle}>No Bookings Found</ThemedText>
            <ThemedText style={styles.emptySub}>No bookings are available from the server.</ThemedText>
          </View>
        ) : (
          <View style={styles.content}>
            {renderBookingList("Pending", "Pending / Upcoming", "#F59E0B", "rgba(245, 158, 11, 0.1)")}
            {renderBookingList("Confirmed", "Confirmed Bookings", "#10B981", "rgba(16, 185, 129, 0.1)")}
            {renderBookingList("Completed", "Completed Bookings", "#3B82F6", "rgba(59, 130, 246, 0.1)")}
            {renderBookingList("Cancelled", "Cancelled Bookings", "#EF4444", "rgba(239, 68, 68, 0.1)")}
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
    paddingTop: 10,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
  },
  content: {
    paddingBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
    color: "#fff",
  },
  emptySub: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 8,
    textAlign: "center",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  bookingCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(128, 128, 128, 0.1)",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  detailsContainer: {
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: "#94A3B8",
  },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(128,128,128,0.1)",
  },
  totalText: {
    fontSize: 14,
    fontWeight: "600",
  },
  paidText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 12,
    color: "#94A3B8",
    fontSize: 16,
  },
});
