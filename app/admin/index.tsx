import React, { useState, useMemo, useEffect } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  View,
  Image,
  ImageBackground,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useAdminStore } from "@/store/admin-store";
import { formatBookingId } from "@/utils/booking-utils";

/** Safely converts any 3- or 6-digit hex color to an rgba() string. */
function hexToRgba(hex: string, alpha: number): string {
  let clean = hex.replace("#", "");
  if (clean.length === 3) {
    clean = clean
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

const GROUNDS = [
  {
    id: "ground-a",
    name: "Cricket Ball Ground",
    location: "Gate 4",
    sport: "Cricket",
  },
  {
    id: "ground-b",
    name: "Tennis Ball Ground",
    location: "B-Block",
    sport: "Cricket",
  },
];

export default function AdminDashboard() {
  const router = useRouter();
  const {
    logout,
    user,
    bookings,
    grounds,
    basePrice,
    setBasePrice,
    price12h,
    setPrice12h,
    price24h,
    setPrice24h,
    weekendBasePrice,
    setWeekendBasePrice,
    weekendPrice12h,
    setWeekendPrice12h,
    weekendPrice24h,
    setWeekendPrice24h,
    couponPercentage,
    setCouponPercentage,
    couponCode,
    setCouponCode,
    adminCredentials,
    updateAdminCredentials,
    showAlert,
  } = useAdminStore();
  const [tempAdminId, setTempAdminId] = useState(adminCredentials.id);
  const [tempAdminPass, setTempAdminPass] = useState(adminCredentials.password);
  const [showSecurityPassword, setShowSecurityPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const TABS = ["Grounds", "Bookings", "Pricing", "Promotions", "Security"];
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [pricingSubTab, setPricingSubTab] = useState<"weekday" | "weekend">("weekday");
  const [bookingsSubTab, setBookingsSubTab] = useState<"All" | "Pending" | "Confirmed" | "Completed" | "Cancelled">("All");
  const [apiGrounds, setApiGrounds] = useState<any[]>([]);
  const [apiAdminBookings, setApiAdminBookings] = useState<any[]>([]);

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await fetch(
          "https://refined-alone-causing.ngrok-free.dev/booking/admin/ground-slot/pricing-update/",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "true",
              ...(user?.accessToken ? { Authorization: `Token ${user.accessToken}` } : {}),
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          // Adjust state based on payload structure we assumed earlier
          if (data.weekday_base_price !== undefined) setBasePrice(data.weekday_base_price);
          if (data.weekday_price_12h !== undefined) setPrice12h(data.weekday_price_12h);
          if (data.weekday_price_24h !== undefined) setPrice24h(data.weekday_price_24h);
          if (data.weekend_base_price !== undefined) setWeekendBasePrice(data.weekend_base_price);
          if (data.weekend_price_12h !== undefined) setWeekendPrice12h(data.weekend_price_12h);
          if (data.weekend_price_24h !== undefined) setWeekendPrice24h(data.weekend_price_24h);
        }
      } catch (err) {
        console.error("Failed to fetch admin pricing:", err);
      }
    };

    const fetchGrounds = async () => {
      try {
        const response = await fetch("https://refined-alone-causing.ngrok-free.dev/booking/grounds/", {
          headers: { "ngrok-skip-browser-warning": "true" }
        });
        if (response.ok) {
          const data = await response.json();
          const groundsArray = Array.isArray(data) ? data : (data.results || data.grounds || []);
          // Make sure the API matches what the UI expects or map it
          const mapped = groundsArray.map((g: any) => ({
            ...g,
            id: String(g.id || g.ground_id),
            name: g.name || g.groundName || `Ground ${g.id}`,
            location: g.location || g.address || "Main Arena",
            sport: g.sport || g.sport_type || "Cricket"
          }));
          setApiGrounds(mapped.length > 0 ? mapped : GROUNDS);
        } else {
          setApiGrounds(GROUNDS);
        }
      } catch (e) {
        console.error("Failed to fetch grounds:", e);
        setApiGrounds(GROUNDS);
      }
    };

    const fetchAdminBookings = async () => {
      try {
        const response = await fetch("https://refined-alone-causing.ngrok-free.dev/booking/admin/bookings/", {
          headers: {
            "ngrok-skip-browser-warning": "true",
            "Content-Type": "application/json",
            ...(user?.accessToken ? { Authorization: `Token ${user.accessToken}` } : {}),
          }
        });
        if (response.ok) {
          const data = await response.json();
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
          setApiAdminBookings(mappedBookings);
        }
      } catch (e) {
        console.warn("Failed to fetch admin bookings", e);
      }
    };

    fetchPricing();
    fetchGrounds();
    fetchAdminBookings();
  }, [user?.accessToken]);

  const groupedBookings = useMemo(() => {
    const groups: Record<string, typeof apiAdminBookings> = {
      Confirmed: [],
      Completed: [],
      Cancelled: [],
      Pending: [],
    };

    apiAdminBookings?.forEach((b) => {
      if (groups[b.status]) {
        groups[b.status].push(b);
      } else {
        groups[b.status] = [b];
      }
    });

    return groups;
  }, [apiAdminBookings]);

  const renderBookingList = (status: string, title: string, color: string, bgColor: string) => {
    const list = groupedBookings[status] || [];

    if (list.length === 0) return null;

    return (
      <View style={{ marginBottom: 24 }} key={status}>
        <ThemedText type="subtitle" style={{ marginBottom: 12 }}>{title} ({list.length})</ThemedText>
        {list.map((booking) => {
          const groundName = grounds?.find((g) => g.id === booking.groundId)?.name || booking.groundId;
          return (
            <View key={booking.id} style={[{ padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: "rgba(128, 128, 128, 0.1)", elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }, { backgroundColor: cardBg }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <ThemedText type="defaultSemiBold">Booking {formatBookingId(booking.id)}</ThemedText>
                <View style={[{ paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8 }, { backgroundColor: bgColor }]}>
                  <ThemedText style={[{ fontSize: 12, fontWeight: "bold" }, { color }]}>{booking.status}</ThemedText>
                </View>
              </View>
              <View style={{ gap: 4 }}>
                <ThemedText style={{ fontSize: 13, color: "#94A3B8" }}>Ground: {groundName}</ThemedText>
                <ThemedText style={{ fontSize: 13, color: "#94A3B8" }}>Date: {new Date(booking.date).toLocaleDateString()}</ThemedText>
                <ThemedText style={{ fontSize: 13, color: "#94A3B8" }}>
                  Slots: {booking.isFullDay ? `Full Day (${booking.fullDayType})` : booking.slots?.length ? booking.slots.join(', ') : 'None'}
                </ThemedText>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(128,128,128,0.1)" }}>
                <ThemedText style={{ fontSize: 14, fontWeight: "600" }}>Total: ₹{booking.totalAmount}</ThemedText>
                <ThemedText style={[{ fontSize: 14, fontWeight: "bold" }, { color: tintColor }]}>Paid: ₹{booking.advancePaid}</ThemedText>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const handleUpdatePricing = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(
        `https://refined-alone-causing.ngrok-free.dev/booking/admin/ground-slot/pricing-update/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "ngrok-skip-browser-warning": "true",
            ...(user?.accessToken ? { Authorization: `Token ${user.accessToken}` } : {}),
          },
          body: JSON.stringify({
            weekday_base_price: basePrice,
            weekday_price_12h: price12h,
            weekday_price_24h: price24h,
            weekend_base_price: weekendBasePrice,
            weekend_price_12h: weekendPrice12h,
            weekend_price_24h: weekendPrice24h,
          }),
        },
      );

      if (response.ok) {
        showAlert(
          "Success",
          "Pricing updated successfully on the server.",
          "success",
        );
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Pricing update error:", errorData);
        showAlert(
          "Update Failed",
          errorData.message || JSON.stringify(errorData) || "Could not update prices.",
          "error",
        );
      }
    } catch (error) {
      console.error(error);
      showAlert(
        "Error",
        "Network error. Could not connect to the server.",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePortalAccess = async () => {
    if (tempAdminId.length < 3 || tempAdminPass.length < 6) {
      showAlert(
        "Invalid Settings",
        "ID must be 3+ chars and Password 6+ chars.",
        "error",
      );
      return;
    }

    setIsSaving(true);
    try {
      const adminIdValue = user?.id || "6"; // Fallback to 6 if undefined
      const response = await fetch(
        `https://refined-alone-causing.ngrok-free.dev/booking/admin-update/${adminIdValue}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({
            email: tempAdminId,
            password: tempAdminPass,
          }),
        },
      );

      if (response.ok) {
        updateAdminCredentials(tempAdminId, tempAdminPass);
        showAlert(
          "Portal Access Updated",
          "Admin credentials have been updated on the server successfully.",
          "success",
        );
      } else {
        const data = await response.json().catch(() => ({}));
        const msg =
          data?.detail ??
          data?.message ??
          "Server update failed. Credentials saved locally only.";
        // Still update locally so admin isn't locked out
        updateAdminCredentials(tempAdminId, tempAdminPass);
        showAlert("Partial Update", msg, "warning");
      }
    } catch (error) {
      // Network error — fall back to local update
      updateAdminCredentials(tempAdminId, tempAdminPass);
      showAlert(
        "Offline Update",
        "Could not reach server. Credentials updated locally.",
        "warning",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePromotions = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("https://refined-alone-causing.ngrok-free.dev/booking/coupon/create-update/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          code: couponCode,
          discount_percentage: couponPercentage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update coupon on server");
      }

      showAlert(
        "Promotions Updated",
        `Coupon ${couponCode} with ${couponPercentage}% discount has been saved.`,
        "success",
      );
    } catch (error) {
      console.error("Coupon update error:", error);
      showAlert(
        "Update Failed",
        "Could not reach server. Settings applied locally.",
        "warning",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const tintColor = useThemeColor({}, "tint");
  const cardBg = useThemeColor({}, "cardBackground");

  if (user?.role !== "admin") {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Access Denied. Admins Only.</ThemedText>
        <TouchableOpacity onPress={() => router.replace("/auth/login")}>
          <ThemedText style={{ color: tintColor }}>Go to Login</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: "Manager Portal",
          headerRight: () => (
            <TouchableOpacity
              onPress={() => {
                logout();
                router.replace("/auth/login");
              }}
            >
              <Ionicons name="log-out-outline" size={24} color={tintColor} />
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ImageBackground
            source={require("@/assets/images/cricket_ball_ground_image.jpg")}
            style={[styles.welcomeCard, { overflow: 'hidden' }]}
            imageStyle={{ borderRadius: 24 }}
          >
            <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' }} />
            <View>
              <ThemedText style={styles.welcomeTitle}>
                Hello, Manager!
              </ThemedText>
              <ThemedText style={styles.welcomeSubtitle}>
                Manage your ground slots efficiently.
              </ThemedText>
            </View>
            <MaterialCommunityIcons
              name="shield-account"
              size={50}
              color="#fff"
            />
          </ImageBackground>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContainer}
          >
            {TABS.map(tab => {
              let iconName: any = "ellipse";
              if (tab === "Grounds") iconName = "map";
              else if (tab === "Bookings") iconName = "calendar";
              else if (tab === "Pricing") iconName = "cash";
              else if (tab === "Promotions") iconName = "pricetag";
              else if (tab === "Security") iconName = "shield";

              return (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tabButton,
                    activeTab === tab && { backgroundColor: tintColor, borderColor: tintColor },
                    { flexDirection: "row", alignItems: "center", gap: 6 }
                  ]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Ionicons name={activeTab === tab ? iconName : `${iconName}-outline`} size={16} color={activeTab === tab ? "#fff" : tintColor} />
                  <ThemedText
                    style={[
                      styles.tabText,
                      activeTab === tab && { color: "#fff", fontWeight: 'bold' }
                    ]}
                  >
                    {tab}
                  </ThemedText>
                </TouchableOpacity>
              )
            })}
          </ScrollView>

          {activeTab === "Grounds" && (
            <>
              <View style={styles.sectionHeader}>
                <ThemedText type="subtitle">Select Ground to Manage</ThemedText>
              </View>

              {apiGrounds.length > 0 ? (
                apiGrounds.map((ground) => (
                  <TouchableOpacity
                    key={ground.id}
                    style={[styles.groundCard, { backgroundColor: cardBg }]}
                    onPress={() => router.push(`/admin/ground/${ground.id}`)}
                  >
                    <View
                      style={[
                        styles.iconBox,
                        { backgroundColor: hexToRgba(tintColor, 0.08) },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="cricket"
                        size={24}
                        color={tintColor}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText type="defaultSemiBold">{ground.name}</ThemedText>
                      <ThemedText style={styles.groundMeta}>
                        {ground.sport} • {ground.location}
                      </ThemedText>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                  </TouchableOpacity>
                ))
              ) : (
                <View style={{ padding: 40, alignItems: "center" }}>
                  <ActivityIndicator size="small" color={tintColor} />
                </View>
              )}

              <View style={styles.statsGrid}>
                <View style={[styles.statItem, { backgroundColor: cardBg }]}>
                  <ThemedText type="subtitle">12</ThemedText>
                  <ThemedText style={styles.statLabel}>Active Holds</ThemedText>
                </View>
                <View style={[styles.statItem, { backgroundColor: cardBg }]}>
                  <ThemedText type="subtitle">{apiAdminBookings?.length || 0}</ThemedText>
                  <ThemedText style={styles.statLabel}>Total Bookings</ThemedText>
                </View>
              </View>
            </>
          )}

          {activeTab === "Bookings" && (
            <>
              <View style={styles.sectionHeader}>
                <ThemedText type="subtitle">Booking Management</ThemedText>
              </View>

              <View style={[styles.modernToggleContainer, { backgroundColor: cardBg }]}>
                {(["All", "Pending", "Confirmed", "Completed", "Cancelled"] as const).map(tab => (
                  <TouchableOpacity
                    key={tab}
                    style={[
                      styles.modernToggleTab,
                      bookingsSubTab === tab && { backgroundColor: tintColor },
                    ]}
                    onPress={() => setBookingsSubTab(tab)}
                  >
                    <ThemedText style={[styles.modernToggleText, bookingsSubTab === tab && { color: "#fff", fontWeight: "bold" }, { fontSize: 12 }]}>
                      {tab}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>

              {(!apiAdminBookings || apiAdminBookings.length === 0) ? (
                <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 60, paddingBottom: 60 }}>
                  <Ionicons name="calendar-outline" size={48} color="#94A3B8" />
                  <ThemedText style={{ marginTop: 12, color: "#94A3B8", fontSize: 16 }}>No bookings found.</ThemedText>
                </View>
              ) : (
                <>
                  {(bookingsSubTab === "All" || bookingsSubTab === "Pending") && renderBookingList("Pending", "Pending Bookings", "#F59E0B", "#F59E0B20")}
                  {(bookingsSubTab === "All" || bookingsSubTab === "Confirmed") && renderBookingList("Confirmed", "Confirmed Bookings", "#34D399", "#34D39920")}
                  {(bookingsSubTab === "All" || bookingsSubTab === "Completed") && renderBookingList("Completed", "Completed Bookings", "#3B82F6", "#3B82F620")}
                  {(bookingsSubTab === "All" || bookingsSubTab === "Cancelled") && renderBookingList("Cancelled", "Cancelled Bookings", "#EF4444", "#EF444420")}
                </>
              )}
            </>
          )}

          {activeTab === "Pricing" && (
            <>
              {/* Rate Management Section */}
              <View style={styles.sectionHeader}>
                <ThemedText type="subtitle">
                  Revenue & Pricing Management
                </ThemedText>
              </View>

              <View style={[styles.modernToggleContainer, { backgroundColor: cardBg }]}>
                <TouchableOpacity
                  style={[
                    styles.modernToggleTab,
                    pricingSubTab === "weekday" && { backgroundColor: tintColor },
                  ]}
                  onPress={() => setPricingSubTab("weekday")}
                >
                  <Ionicons name="calendar-outline" size={16} color={pricingSubTab === "weekday" ? "#fff" : "#94A3B8"} />
                  <ThemedText style={[styles.modernToggleText, pricingSubTab === "weekday" && { color: "#fff", fontWeight: "bold" }]}>
                    Weekday
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modernToggleTab,
                    pricingSubTab === "weekend" && { backgroundColor: tintColor },
                  ]}
                  onPress={() => setPricingSubTab("weekend")}
                >
                  <Ionicons name="flash" size={16} color={pricingSubTab === "weekend" ? "#fff" : "#94A3B8"} />
                  <ThemedText style={[styles.modernToggleText, pricingSubTab === "weekend" && { color: "#fff", fontWeight: "bold" }]}>
                    Weekend
                  </ThemedText>
                </TouchableOpacity>
              </View>

              <View style={[styles.pricingCard, { backgroundColor: cardBg }]}>
                <View style={styles.priceHeader}>
                  <View>
                    <ThemedText type="defaultSemiBold">
                      1. Hourly Rate (Single Slot)
                    </ThemedText>
                    <ThemedText style={styles.groundMeta}>
                      Standard price per hour per ground
                    </ThemedText>
                  </View>
                  <View
                    style={[
                      styles.priceBadge,
                      { backgroundColor: tintColor + "15" },
                    ]}
                  >
                    <ThemedText style={{ color: tintColor, fontWeight: "bold" }}>
                      ₹{pricingSubTab === "weekday" ? basePrice : weekendBasePrice}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.couponInputSection}>
                  <ThemedText style={styles.inputLabel}>
                    SET HOURLY RATE (₹)
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.couponInput,
                      { borderColor: tintColor + "30", color: tintColor },
                    ]}
                    value={pricingSubTab === "weekday" ? basePrice.toString() : weekendBasePrice.toString()}
                    onChangeText={(val) => {
                      const num = parseInt(val);
                      const newPrice = isNaN(num) ? 0 : Math.max(0, num);
                      if (pricingSubTab === "weekday") setBasePrice(newPrice);
                      else setWeekendBasePrice(newPrice);
                    }}
                    placeholder="Enter amount"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.divider, { width: '100%', height: 1, marginVertical: 20 }]} />

                <View style={styles.priceHeader}>
                  <View>
                    <ThemedText type="defaultSemiBold">
                      2. 12-Hour Day Pass
                    </ThemedText>
                    <ThemedText style={styles.groundMeta}>
                      Discounted rate for 12h block (6AM-6PM)
                    </ThemedText>
                  </View>
                  <View
                    style={[styles.priceBadge, { backgroundColor: "#FACC1515" }]}
                  >
                    <ThemedText style={{ color: "#FACC15", fontWeight: "bold" }}>
                      ₹{pricingSubTab === "weekday" ? price12h : weekendPrice12h}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.couponInputSection}>
                  <ThemedText style={styles.inputLabel}>
                    SET 12-HOUR RATE (₹)
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.couponInput,
                      { borderColor: "#FACC1530", color: "#FACC15" },
                    ]}
                    value={pricingSubTab === "weekday" ? price12h.toString() : weekendPrice12h.toString()}
                    onChangeText={(val) => {
                      const num = parseInt(val);
                      const newPrice = isNaN(num) ? 0 : Math.max(0, num);
                      if (pricingSubTab === "weekday") setPrice12h(newPrice);
                      else setWeekendPrice12h(newPrice);
                    }}
                    placeholder="Enter amount"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.divider, { width: '100%', height: 1, marginVertical: 20 }]} />

                <View style={styles.priceHeader}>
                  <View>
                    <ThemedText type="defaultSemiBold">
                      3. 24-Hour Day Pass
                    </ThemedText>
                    <ThemedText style={styles.groundMeta}>
                      Fixed rate for 24h full ground access
                    </ThemedText>
                  </View>
                  <View
                    style={[styles.priceBadge, { backgroundColor: "#F59E0B15" }]}
                  >
                    <ThemedText style={{ color: "#F59E0B", fontWeight: "bold" }}>
                      ₹{pricingSubTab === "weekday" ? price24h : weekendPrice24h}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.couponInputSection}>
                  <ThemedText style={styles.inputLabel}>
                    SET 24-HOUR RATE (₹)
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.couponInput,
                      { borderColor: "#F59E0B30", color: "#F59E0B" },
                    ]}
                    value={pricingSubTab === "weekday" ? price24h.toString() : weekendPrice24h.toString()}
                    onChangeText={(val) => {
                      const num = parseInt(val);
                      const newPrice = isNaN(num) ? 0 : Math.max(0, num);
                      if (pricingSubTab === "weekday") setPrice24h(newPrice);
                      else setWeekendPrice24h(newPrice);
                    }}
                    placeholder="Enter amount"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.updateButton,
                    { backgroundColor: tintColor, marginTop: 10 },
                  ]}
                  onPress={handleUpdatePricing}
                  disabled={isSaving}
                >
                  <Ionicons
                    name="save-outline"
                    size={16}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <ThemedText style={styles.updateButtonText}>
                    SAVE PRICES
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </>
          )}

          {activeTab === "Promotions" && (
            <>
              {/* Coupon Discount Settings */}
              <View style={styles.sectionHeader}>
                <ThemedText type="subtitle">Promotions & Vouchers</ThemedText>
              </View>

              <View style={[styles.pricingCard, { backgroundColor: cardBg }]}>
                <View style={styles.priceHeader}>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="defaultSemiBold">
                      Global Coupon Discount
                    </ThemedText>
                    <ThemedText style={styles.groundMeta}>
                      Apply discount (%) for valid promo codes
                    </ThemedText>
                  </View>
                  <View
                    style={[
                      styles.priceBadge,
                      {
                        backgroundColor: tintColor + "15",
                        borderColor: tintColor,
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <ThemedText style={{ color: tintColor, fontWeight: "bold" }}>
                      {couponCode} - {couponPercentage}% OFF
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.couponInputSection}>
                  <ThemedText style={styles.inputLabel}>
                    ACTIVE COUPON CODE
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.couponInput,
                      { borderColor: tintColor + "30", color: tintColor },
                    ]}
                    value={couponCode}
                    onChangeText={setCouponCode}
                    placeholder="Enter Code (e.g., SAVE20)"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="characters"
                  />
                </View>

                <View style={styles.couponInputSection}>
                  <ThemedText style={styles.inputLabel}>
                    DISCOUNT PERCENTAGE (%)
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.couponInput,
                      { borderColor: tintColor + "30", color: tintColor },
                    ]}
                    value={couponPercentage.toString()}
                    onChangeText={(val) => {
                      const num = parseInt(val);
                      if (!isNaN(num)) {
                        setCouponPercentage(Math.min(100, Math.max(0, num)));
                      } else if (val === "") {
                        setCouponPercentage(0);
                      }
                    }}
                    placeholder="Enter % (0-100)"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.updateButton,
                    { backgroundColor: tintColor, marginTop: 10 },
                  ]}
                  onPress={handleUpdatePromotions}
                  disabled={isSaving}
                >
                  <Ionicons
                    name="save-outline"
                    size={16}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <ThemedText style={styles.updateButtonText}>
                    SAVE PROMOTIONS
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </>
          )}

          {activeTab === "Security" && (
            <>
              {/* Security Settings Section */}
              <View style={styles.sectionHeader}>
                <ThemedText type="subtitle">Portal Security Settings</ThemedText>
              </View>

              <View
                style={[
                  styles.pricingCard,
                  { backgroundColor: cardBg, borderColor: "#EF444433" },
                ]}
              >
                <View style={styles.priceHeader}>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="defaultSemiBold" style={{ color: "#EF4444" }}>
                      Admin Access Credentials
                    </ThemedText>
                    <ThemedText style={styles.groundMeta}>
                      Update your manager login details
                    </ThemedText>
                  </View>
                  <Ionicons name="shield-half" size={24} color="#EF4444" />
                </View>

                <View style={styles.couponInputSection}>
                  <ThemedText style={styles.inputLabel}>
                    NEW ADMINISTRATOR ID
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.couponInput,
                      { borderColor: "rgba(239, 68, 68, 0.2)", color: "#fff" },
                    ]}
                    value={tempAdminId}
                    onChangeText={setTempAdminId}
                    placeholder="New Admin ID"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                  />
                </View>

                <View
                  style={[
                    styles.couponInputSection,
                    { position: "relative", justifyContent: "center" },
                  ]}
                >
                  <ThemedText style={styles.inputLabel}>
                    NEW PORTAL PASSWORD
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.couponInput,
                      {
                        borderColor: "rgba(239, 68, 68, 0.2)",
                        color: "#fff",
                        paddingRight: 48,
                      },
                    ]}
                    value={tempAdminPass}
                    onChangeText={setTempAdminPass}
                    placeholder="New Password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showSecurityPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowSecurityPassword(!showSecurityPassword)}
                    style={{ position: "absolute", right: 16, bottom: 12 }}
                  >
                    <Ionicons
                      name={
                        showSecurityPassword ? "eye-off-outline" : "eye-outline"
                      }
                      size={20}
                      color="#EF4444"
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[
                    styles.updateButton,
                    { backgroundColor: isSaving ? "#B91C1C" : "#EF4444", opacity: isSaving ? 0.7 : 1 },
                  ]}
                  onPress={handleUpdatePortalAccess}
                  disabled={isSaving}
                >
                  <Ionicons
                    name={isSaving ? "cloud-upload-outline" : "shield-checkmark-outline"}
                    size={16}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <ThemedText style={styles.updateButtonText}>
                    {isSaving ? "SAVING TO SERVER..." : "UPDATE PORTAL ACCESS"}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  tabsContainer: {
    paddingBottom: 24,
    gap: 12,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(128, 128, 128, 0.2)",
    marginRight: 8,
  },
  tabText: {
    fontSize: 14,
    color: "#94A3B8",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  welcomeCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    borderRadius: 24,
    marginBottom: 30,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  welcomeTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  welcomeSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    marginTop: 4,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  groundCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(128, 128, 128, 0.1)",
    gap: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  groundMeta: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  statItem: {
    flex: 1,
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(128, 128, 128, 0.1)",
  },
  statLabel: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 4,
  },
  pricingCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(128, 128, 128, 0.1)",
    marginBottom: 40,
  },
  priceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  priceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  priceAdjustment: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  adjButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  priceProgress: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(128,128,128,0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 3,
  },
  pricePreviewGrid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(128,128,128,0.05)",
  },
  previewItem: {
    alignItems: "center",
    flex: 1,
  },
  previewLabel: {
    fontSize: 10,
    color: "#94A3B8",
    marginBottom: 4,
  },
  previewValue: {
    fontSize: 13,
    fontWeight: "bold",
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(128,128,128,0.1)",
  },
  couponGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 10,
  },
  couponOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.2)",
  },
  couponOptionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  couponInputSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#94A3B8",
    marginBottom: 8,
    letterSpacing: 1,
  },
  couponInput: {
    height: 50,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: "bold",
  },
  updateButton: {
    height: 50,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  updateButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
  modernToggleContainer: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modernToggleTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  modernToggleText: {
    fontSize: 14,
    color: "#94A3B8",
    fontWeight: "600",
  },
});
