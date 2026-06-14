import { CalendarModal } from "@/components/sports/calendar-modal";
import { GroundCard } from "@/components/sports/ground-card";
import { MatchCard } from "@/components/sports/match-card";
import { PolicyPopup } from "@/components/sports/policy-popup";
import { SportsSlot } from "@/components/sports/sports-slot";
import { TournamentCard } from "@/components/sports/tournament-card";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useBookingLock } from "@/hooks/use-booking-lock";
import { useAdminStore } from "@/store/admin-store";
import {
  getWeekendPolicyMessage,
  isDateWithinBookingWindow,
} from "@/utils/booking-utils";
import { getDynamicTimeSlots, getSlotPrice } from "@/utils/pricing";
import { MOCK_MATCHES, MOCK_TOURNAMENTS } from "@/utils/sports-data";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Stack, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FlatList,
  ImageBackground,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const GROUNDS = [
  {
    id: "ground-a",
    name: "NM Greens - Ground A",
    type: "Cricket ball Ground",
    rating: 4.9,
    location: "Towers1 Block 2, Mambakkam",
    imageUrl: require("@/assets/images/new_ground_a.png"),
  },
  {
    id: "ground-b",
    name: "NM Greens - Ground B",
    type: "Tennisball Ground",
    rating: 4.8,
    location: "Towers1 Block 2, Mambakkam",
    imageUrl: require("@/assets/images/new_ground_b.png"),
  },
];



export default function SportsDashboard() {
  const router = useRouter();
  const {
    user,
    basePrice,
    price12h,
    price24h,
    weekendBasePrice,
    weekendPrice12h,
    weekendPrice24h,
    showAlert,
    grounds: storeGrounds,
    fetchGrounds,
    bookings,
    heldSlots,
  } = useAdminStore();
  const GROUNDS_DATA = storeGrounds.length > 0 ? storeGrounds : GROUNDS;
  const [selectedGround, setSelectedGround] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<
    "Grounds" | "Matches" | "Tournaments"
  >("Grounds");

  const tintColor = useThemeColor({}, "tint");
  const cardBg = useThemeColor({}, "cardBackground");
  const pageBg = useThemeColor({}, "background");

  useEffect(() => {
    fetchGrounds();
  }, []);


  const isAdmin = user?.role === "admin";
  const mutedColor = useThemeColor({}, "muted");
  const [bookingMode, setBookingMode] = useState<"hourly" | "full">("hourly");
  const [fullDayType, setFullDayType] = useState<"12h" | "24h">("12h");
  const [availableModes, setAvailableModes] = useState<("hourly" | "full")[]>(["hourly", "full"]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [policyMsg, setPolicyMsg] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [apiTimeSlots, setApiTimeSlots] = useState<any[]>([]);
  const flatListRef = useRef<FlatList>(null);

  const bookedDates = useMemo(() => {
    if (!selectedGround) return [];

    // Find any full-day bookings for this ground in the global state
    const globalFullDayBookings = bookings
      .filter(
        (b) =>
          (b.groundId === selectedGround.id ||
            b.ground_id === selectedGround.id) &&
          b.isFullDay &&
          b.status === "Confirmed",
      )
      .map((b) => b.date);

    return [...globalFullDayBookings];
  }, [selectedGround?.id, bookings]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, [selectedDate]);

  const isDateBooked = (d: Date) =>
    bookedDates.includes(d.toISOString().split("T")[0]);
  const isSelectedDateBooked = isDateBooked(selectedDate);

  const dateKey = selectedDate.toISOString().split("T")[0];
  const { locks, selectSlot } = useBookingLock(selectedGround?.id || "", dateKey);
  const pricing = useMemo(
    () =>
      getSlotPrice(selectedDate, bookingMode === "full", fullDayType, {
        hourly: basePrice,
        price12h,
        price24h,
        weekendHourly: weekendBasePrice,
        weekendPrice12h,
        weekendPrice24h,
      }),
    [selectedDate, bookingMode, fullDayType, basePrice, price12h, price24h, weekendBasePrice, weekendPrice12h, weekendPrice24h],
  );

  const renderDateItem = ({ item }: { item: Date }) => {
    const isSelected = item.toDateString() === selectedDate.toDateString();
    const isToday = item.toDateString() === new Date().toDateString();
    const isSoldOut = isDateBooked(item);
    const dayName = item.toLocaleDateString("en-US", { weekday: "short" });
    const dayNum = item.getDate();
    const isAllowed = isDateWithinBookingWindow(item, isAdmin);

    return (
      <TouchableOpacity
        style={[
          styles.dateItem,
          { backgroundColor: cardBg },
          isSelected && { backgroundColor: tintColor, borderColor: tintColor },
          !isAllowed && { borderColor: "rgba(255, 153, 51, 0.4)" },
        ]}
        onPress={() => {
          if (!isAllowed) {
            const msg = getWeekendPolicyMessage(item, isAdmin);
            if (msg) setPolicyMsg(msg);
            return;
          }
          setSelectedDate(item);
        }}
      >
        <ThemedText
          style={[
            styles.dayName,
            isSelected && { color: "#fff" },
            isToday && !isSelected && { color: tintColor, fontWeight: "900" },
          ]}
        >
          {isToday ? "Today" : dayName}
        </ThemedText>
        <ThemedText style={[styles.dayNum, isSelected && { color: "#fff" }]}>
          {dayNum}
        </ThemedText>
        {isSoldOut ? (
          <View
            style={[
              styles.soldOutBadge,
              { backgroundColor: "#EF4444", borderColor: "#EF4444" },
            ]}
          >
            <ThemedText style={[styles.soldOutText, { color: "#fff" }]}>
              SOLD
            </ThemedText>
          </View>
        ) : !isAllowed ? (
          <View style={styles.lockBadge}>
            <Ionicons name="lock-closed" size={12} color="#F9A825" />
          </View>
        ) : (
          isToday &&
          !isSelected && (
            <View
              style={[styles.todayIndicator, { backgroundColor: tintColor }]}
            />
          )
        )}
      </TouchableOpacity>
    );
  };

  const dates = useMemo(() => {
    const list = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Show 30 days starting from today. We no longer filter out restricted weekends
    // so they will appear in the scroll list with a lock icon.
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      list.push(d);
    }
    return list;
  }, []);

  // Fetch slots to determine booking modes dynamically
  useEffect(() => {
    if (!selectedGround) return;
    const fetchModes = async () => {
      try {
        const apiId = selectedGround.id === "ground-a" ? 1 : (selectedGround.id === "ground-b" ? 2 : parseInt(selectedGround.id.replace(/\D/g, '')) || 1);
        const res = await fetch(`https://refined-alone-causing.ngrok-free.dev/booking/grounds-slots/${apiId}/`, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "ngrok-skip-browser-warning": "true",
          }
        });
        if (!res.ok) throw new Error("Failed to fetch slots");
        const data = await res.json();

        const hasHourly = data.some((s: any) => s.slot_type === "hourly");
        const hasFull = data.some((s: any) => s.slot_type === "12hr" || s.slot_type === "24hr" || s.slot_type === "full_day");

        let modes: ("hourly" | "full")[] = [];
        const isGroundA = selectedGround.id === "ground-a" || String(selectedGround.id) === "1";

        if (isGroundA) {
          modes = ["full"];
        } else {
          modes = ["hourly", "full"];
        }

        setAvailableModes(modes);
        setBookingMode((prev) => (modes.includes(prev) ? prev : modes[0]));
      } catch (err) {
        // Silently fallback to mock data
        const isGroundA = selectedGround.id === "ground-a" || String(selectedGround.id) === "1";
        const fallbackModes: ("hourly" | "full")[] = isGroundA ? ["full"] : ["hourly", "full"];
        setAvailableModes(fallbackModes);
        setBookingMode((prev) => (fallbackModes.includes(prev) ? prev : fallbackModes[0]));
      }
    };
    fetchModes();
  }, [selectedGround?.id]);

  useEffect(() => {
    if (!selectedGround) return;
    const isGround2 = String(selectedGround.id) === "ground-b" || String(selectedGround.id) === "2";
    if (!isGround2) {
      setApiTimeSlots([]);
      return;
    }
    const fetchTimeSlots = async () => {
      try {
        const res = await fetch("https://refined-alone-causing.ngrok-free.dev/booking/timeslots/", {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "ngrok-skip-browser-warning": "true",
          }
        });
        if (res.ok) {
          const data = await res.json();
          setApiTimeSlots(data);
        }
      } catch (err) {
        // Silently ignore timeslots failure
      }
    };
    fetchTimeSlots();
  }, [selectedGround?.id]);

  const [apiSlotsData, setApiSlotsData] = useState<any[]>([]);

  useEffect(() => {
    if (!selectedGround) return;
    const fetchDateSlots = async () => {
      try {
        const apiId = selectedGround.id === "ground-a" ? 1 : (selectedGround.id === "ground-b" ? 2 : parseInt(selectedGround.id.replace(/\D/g, '')) || 1);
        const dateStr = selectedDate.toISOString().split("T")[0];
        const res = await fetch(`https://refined-alone-causing.ngrok-free.dev/booking/grounds/${apiId}/available-slots/?date=${dateStr}`, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "ngrok-skip-browser-warning": "true",
          }
        });
        if (res.ok) {
          const data = await res.json();
          setApiSlotsData(data);
        }
      } catch (err) {
        // Silently ignore date-wise slots failure
      }
    };
    fetchDateSlots();
  }, [selectedGround?.id, selectedDate]);

  useEffect(() => {
    const index = dates.findIndex(
      (d) => d.toDateString() === selectedDate.toDateString(),
    );
    if (index !== -1 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.5,
        });
      }, 300);
    }
  }, [selectedDate, dates]);

  const handleBooking = async () => {
    const selectedSlotIds =
      bookingMode === "full"
        ? []
        : Object.keys(locks)
          .filter(
            (key) =>
              key.startsWith(selectedGround.id) &&
              locks[key].status === "selected",
          )
          .map((key) => key.split("-").pop());

    if (bookingMode === "hourly" && selectedSlotIds.length === 0) {
      showAlert(
        "Selection Required",
        "Please select at least one hourly slot to proceed with booking.",
        "warning",
      );
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      let finalSlotType = "hourly";
      let finalSlots = selectedSlotIds.join(",");
      let finalIsFullDay = "false";
      let finalFullDayType = undefined;

      if (bookingMode === "full") {
        if (fullDayType === "12h") {
          finalSlotType = "12hr";
          finalSlots = "";
          finalIsFullDay = "false";
        } else if (fullDayType === "24h") {
          finalSlotType = "24hr";
          finalSlots = "";
          finalIsFullDay = "false";
        } else {
          finalSlotType = "full_day";
          finalSlots = "";
          finalIsFullDay = "true";
          finalFullDayType = "full_day";
        }
      }

      const parsedUserId = user?.id ? parseInt(String(user.id).replace(/\D/g, ''), 10) : 1;

      const payload: any = {
        userId: isNaN(parsedUserId) ? 1 : parsedUserId,
        groundId: String(selectedGround.id).includes("b") ? 2 : 1,
        date: dateKey,
        slotType: finalSlotType,
        slots: finalSlots,
        isFullDay: finalIsFullDay === "true",
      };
      if (finalFullDayType) payload.fullDayType = finalFullDayType;

      const response = await fetch("https://refined-alone-causing.ngrok-free.dev/booking/booking-create/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
          ...(user?.accessToken ? { Authorization: `Token ${user.accessToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.warn("Booking Create Failed Status:", response.status);
      }
    } catch (err) {
      console.warn("Booking create fetch error:", err);
    }

    router.push({
      pathname: "/sports/booking",
      params: {
        groundId: selectedGround.id,
        date: dateKey,
        slots: selectedSlotIds.join(","),
        isFullDay: bookingMode === "full" ? "true" : "false",
        fullDayType: bookingMode === "full" ? fullDayType : "",
      },
    });
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: "Book Sports Ground",
          headerRight: () => (
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity onPress={() => router.push("/auth/login")}>
                <Ionicons
                  name={user ? "person" : "person-outline"}
                  size={24}
                  color={tintColor}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  router.push(
                    (user?.role === "admin" ? "/admin" : "/auth/login") as any,
                  )
                }
              >
                <MaterialCommunityIcons
                  name={
                    user?.role === "admin" ? "shield-check" : "shield-outline"
                  }
                  size={24}
                  color={tintColor}
                />
              </TouchableOpacity>
            </View>
          ),
        }}
      />



      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tintColor}
            colors={[tintColor]}
            progressBackgroundColor={cardBg}
          />
        }
      >


        {/* Category Tabs */}
        <View style={styles.tabsContainer}>
          {["Grounds", "Matches", "Tournaments"].map((tab) => {
            const isLocked = tab === "Matches" || tab === "Tournaments";
            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tab,
                  { backgroundColor: cardBg },
                  activeTab === tab && {
                    backgroundColor: tintColor,
                    borderColor: tintColor,
                  },
                  isLocked && { opacity: 0.6 },
                ]}
                onPress={() => {
                  if (isLocked) {
                    showAlert(
                      "Coming Soon",
                      `${tab} section is currently locked for a future update.`,
                      "info",
                    );
                    return;
                  }
                  setActiveTab(tab as any);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <ThemedText
                    style={[
                      styles.tabText,
                      activeTab === tab && { color: "#fff" },
                    ]}
                  >
                    {tab}
                  </ThemedText>
                  {isLocked && (
                    <Ionicons
                      name="lock-closed"
                      size={12}
                      color={activeTab === tab ? "#fff" : mutedColor}
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {activeTab === "Grounds" ? (
          <>
            {/* Ground Selector */}
            <View style={styles.sectionHeader}>
              <View style={styles.headerWithIcon}>
                <Ionicons name="location" size={18} color={tintColor} />
                <ThemedText type="subtitle">Select Ground</ThemedText>
              </View>
            </View>
            <View style={styles.groundVerticalList}>
              {GROUNDS_DATA.map((ground: any) => (
                <GroundCard
                  key={ground.id}
                  {...ground}
                  isSelected={selectedGround?.id === ground.id}
                  onPress={() => {
                    if (selectedGround?.id === ground.id) {
                      setSelectedGround(null);
                    } else {
                      setSelectedGround(ground);
                    }
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                />
              ))}
            </View>

            {selectedGround && (
              <>
                {/* Date Selector */}
                <View style={styles.sectionHeader}>
                  <View style={styles.headerWithIcon}>
                    <Ionicons name="calendar" size={18} color={tintColor} />
                    <ThemedText type="subtitle">Select Date</ThemedText>
                    <TouchableOpacity
                      style={[
                        styles.calendarTrigger,
                        { backgroundColor: tintColor + "15" },
                      ]}
                      onPress={() => setShowCalendar(true)}
                    >
                      <Ionicons name="open-outline" size={14} color={tintColor} />
                    </TouchableOpacity>
                  </View>
                  {pricing.isWeekend ? (
                    <View
                      style={[
                        styles.weekendTag,
                        {
                          backgroundColor: tintColor + "20",
                          borderColor: tintColor,
                          borderWidth: 1,
                        },
                      ]}
                    >
                      <ThemedText
                        style={[styles.weekendText, { color: tintColor }]}
                      >
                        NEXT WEEKEND ONLY ⚡
                      </ThemedText>
                    </View>
                  ) : (
                    <View style={styles.weekdayTag}>
                      <ThemedText style={styles.weekdayText}>
                        ADVANCE BOOKING OPEN
                      </ThemedText>
                    </View>
                  )}
                </View>

                {/* Weekend Policy Banner */}
                <View style={styles.policyContainer}>
                  <View
                    style={[
                      styles.policyBanner,
                      {
                        backgroundColor: tintColor + "10",
                        borderColor: tintColor + "30",
                      },
                    ]}
                  >
                    <Ionicons
                      name="information-circle"
                      size={16}
                      color={tintColor}
                    />
                    <ThemedText style={styles.policyText}>
                      {getWeekendPolicyMessage(selectedDate, isAdmin) ||
                        (isAdmin
                          ? "Manager Oversight: All slots accessible for holding."
                          : "Weekday bookings are open. Weekends only open for next-week pre-booking during current weekend.")}
                    </ThemedText>
                  </View>
                </View>
                <FlatList
                  ref={flatListRef}
                  data={dates}
                  renderItem={renderDateItem}
                  keyExtractor={(item) => item.toISOString()}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.dateList}
                  getItemLayout={(data, index) => ({
                    length: 70, // item width (60) + marginRight (10)
                    offset: 70 * index,
                    index,
                  })}
                />

                {/* Selection Sections */}
                {!isSelectedDateBooked ? (
                  <>
                    {/* Booking Mode Selector */}
                    {availableModes.length > 1 && (
                      <>
                        <View style={styles.sectionHeader}>
                          <View style={styles.headerWithIcon}>
                            <Ionicons name="options" size={18} color={tintColor} />
                            <ThemedText type="subtitle">
                              Select Booking Mode
                            </ThemedText>
                          </View>
                        </View>

                        <View style={styles.modeContainer}>
                          <TouchableOpacity
                            style={[
                              styles.modeCard,
                              { backgroundColor: cardBg },
                              bookingMode === "full" && {
                                borderColor: tintColor,
                                borderWidth: 2,
                                backgroundColor: tintColor + "10",
                              },
                            ]}
                            onPress={() => {
                              setBookingMode("full");
                              Haptics.impactAsync(
                                Haptics.ImpactFeedbackStyle.Medium,
                              );
                            }}
                          >
                            <MaterialCommunityIcons
                              name="shield-star"
                              size={24}
                              color={bookingMode === "full" ? tintColor : "#94A3B8"}
                            />
                            <ThemedText
                              style={[
                                styles.modeLabel,
                                bookingMode === "full" && { color: tintColor },
                              ]}
                            >
                              Full Day
                            </ThemedText>
                            <ThemedText style={styles.modeSubLabel}>
                              Total Ground Access
                            </ThemedText>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.modeCard,
                              { backgroundColor: cardBg },
                              bookingMode === "hourly" && {
                                borderColor: tintColor,
                                borderWidth: 2,
                                backgroundColor: tintColor + "10",
                              },
                            ]}
                            onPress={() => {
                              setBookingMode("hourly");
                              Haptics.impactAsync(
                                Haptics.ImpactFeedbackStyle.Medium,
                              );
                            }}
                          >
                            <Ionicons
                              name="time"
                              size={24}
                              color={
                                bookingMode === "hourly" ? tintColor : "#94A3B8"
                              }
                            />
                            <ThemedText
                              style={[
                                styles.modeLabel,
                                bookingMode === "hourly" && { color: tintColor },
                              ]}
                            >
                              Hourly
                            </ThemedText>
                            <ThemedText style={styles.modeSubLabel}>
                              Pay Per Hour
                            </ThemedText>
                          </TouchableOpacity>
                        </View>
                      </>
                    )}

                    {/* Mode Specific Views */}
                    {bookingMode === "full" ? (
                      <View
                        style={[
                          styles.fullDayPassContent,
                          { backgroundColor: cardBg },
                        ]}
                      >
                        <View style={styles.fullDayHeader}>
                          <View>
                            <ThemedText type="defaultSemiBold">
                              Select Duration
                            </ThemedText>
                            <ThemedText style={styles.mutedSmall}>
                              Choose your exclusive session tier
                            </ThemedText>
                          </View>
                          <View style={{ alignItems: "flex-end" }}>
                            <ThemedText
                              style={[styles.fullDayPrice, { color: tintColor }]}
                            >
                              ₹{pricing.finalPrice}
                            </ThemedText>
                            <ThemedText style={styles.mutedMicro}>
                              {fullDayType === "12h"
                                ? "12-HOUR DEAL"
                                : "24-HOUR DEAL"}
                            </ThemedText>
                          </View>
                        </View>

                        <View style={styles.tierSelector}>
                          {[
                            {
                              id: "12h",
                              label: "12 Hours",
                              sub: "6 AM – 6 PM",
                              icon: "sunny",
                              range: Array.from({ length: 12 }, (_, i) => String(i + 7)),
                            },
                            {
                              id: "24h",
                              label: "24 Hours",
                              sub: "Full Cycle",
                              icon: "moon",
                              range: Array.from({ length: 24 }, (_, i) => String(i + 1)),
                            },
                          ].map((tier) => {
                            const isLocked = tier.range.some(slotId => {
                              const isHeldLocally = heldSlots.some(
                                (h: any) =>
                                  h.groundId === selectedGround.id &&
                                  h.slotId === slotId &&
                                  h.date === dateKey
                              );
                              const apiSlot = apiSlotsData.find(s => String(s.slot_id) === slotId);
                              const isBookedOrHeldApi = apiSlot && (apiSlot.is_booked || apiSlot.is_held);
                              return isHeldLocally || isBookedOrHeldApi;
                            });

                            return (
                              <TouchableOpacity
                                key={tier.id}
                                style={[
                                  styles.tierButton,
                                  fullDayType === tier.id && !isLocked && {
                                    backgroundColor: tintColor,
                                    borderColor: tintColor,
                                  },
                                  isLocked && {
                                    opacity: 0.6,
                                    backgroundColor: "rgba(128, 128, 128, 0.1)",
                                    borderColor: "transparent",
                                  }
                                ]}
                                disabled={isLocked}
                                onPress={() => {
                                  if (isLocked) return;
                                  setFullDayType(tier.id as any);
                                  Haptics.impactAsync(
                                    Haptics.ImpactFeedbackStyle.Medium,
                                  );
                                }}
                              >
                                <Ionicons
                                  name={isLocked ? "lock-closed" : tier.icon as any}
                                  size={14}
                                  color={isLocked ? "#EF4444" : fullDayType === tier.id ? "#fff" : tintColor}
                                />
                                <View>
                                  <ThemedText
                                    style={[
                                      styles.tierLabel,
                                      fullDayType === tier.id && !isLocked && { color: "#fff" },
                                      isLocked && { color: "#EF4444", textDecorationLine: "line-through" }
                                    ]}
                                  >
                                    {tier.label}
                                  </ThemedText>
                                  <ThemedText
                                    style={[
                                      styles.tierSub,
                                      fullDayType === tier.id && !isLocked && {
                                        color: "rgba(255,255,255,0.7)",
                                      },
                                      isLocked && { color: "#EF4444" }
                                    ]}
                                  >
                                    {isLocked ? "LOCKED BY ADMIN" : tier.sub}
                                  </ThemedText>
                                </View>
                              </TouchableOpacity>
                            )
                          })}
                        </View>
                      </View>
                    ) : (
                      <View style={{ marginTop: 20 }}>
                        <View style={styles.sectionHeader}>
                          <View style={styles.headerWithIcon}>
                            <Ionicons name="time" size={18} color={tintColor} />
                            <ThemedText type="subtitle">Hourly Slots</ThemedText>
                          </View>
                        </View>

                        {["Morning", "Afternoon", "Evening", "Night"].map(
                          (category) => {
                            const day = selectedDate.getDay();
                            const isWeekend = day === 0 || day === 6;

                            const filteredApiSlots = apiTimeSlots.filter((s: any) => {
                              const isWeekendSlot = String(s.slot_id || s.id).includes("weekend") || s.duration > 1;
                              return isWeekend ? isWeekendSlot : !isWeekendSlot;
                            });

                            const slotsInCategory = (
                              apiTimeSlots.length > 0
                                ? filteredApiSlots
                                : getDynamicTimeSlots(selectedDate)
                            ).filter(
                              (s: any) => s.category === category
                            );
                            if (slotsInCategory.length === 0) return null;
                            return (
                              <View key={category} style={styles.categoryContainer}>
                                <View style={styles.categoryHeader}>
                                  <Ionicons
                                    name={
                                      category === "Morning"
                                        ? "sunny"
                                        : category === "Afternoon"
                                          ? "partly-sunny"
                                          : category === "Evening"
                                            ? "moon"
                                            : "sparkles"
                                    }
                                    size={14}
                                    color={tintColor}
                                  />
                                  <ThemedText style={styles.categoryTitle}>
                                    {category}
                                  </ThemedText>
                                </View>
                                <View style={styles.slotsGrid}>
                                  {slotsInCategory.map((slot) => {
                                    const slotId = String(slot.slot_id || slot.id);
                                    let status =
                                      locks[`${selectedGround.id}-${slotId}`]
                                        ?.status || "available";

                                    const apiSlot = apiSlotsData.find(s => String(s.slot_id) === slotId);
                                    if (apiSlot && apiSlot.is_booked) {
                                      status = "booked";
                                    } else if (
                                      (apiSlot && apiSlot.is_held) ||
                                      heldSlots.some(
                                        (h: any) =>
                                          h.groundId === selectedGround.id &&
                                          h.slotId === slotId &&
                                          h.date === dateKey
                                      )
                                    ) {
                                      status = "locked";
                                    }

                                    return (
                                      <SportsSlot
                                        key={slotId}
                                        id={slotId}
                                        label={slot.label}
                                        status={status}
                                        price={pricing.finalPrice}
                                        onPress={selectSlot}
                                        variant={slot.duration > 1 ? "session" : "hourly"}
                                        duration={slot.duration}
                                      />
                                    );
                                  })}
                                </View>
                              </View>
                            );
                          })}
                      </View>
                    )}
                  </>
                ) : (
                  /* Fully Booked Empty State */
                  <View style={styles.bookedEmptyState}>
                    <View
                      style={[
                        styles.bookedIconContainer,
                        { backgroundColor: tintColor + "10" },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="calendar-lock"
                        size={60}
                        color={tintColor}
                      />
                    </View>
                    <ThemedText type="subtitle" style={styles.bookedTitle}>
                      Fully Reserved
                    </ThemedText>
                    <ThemedText style={styles.bookedSubtitle}>
                      {`This arena is completely booked for a full-day event on this date. Please check alternate dates or grounds.`}
                    </ThemedText>
                    <TouchableOpacity
                      style={[styles.alternateButton, { borderColor: tintColor }]}
                      onPress={() => setShowCalendar(true)}
                    >
                      <ThemedText style={{ color: tintColor, fontWeight: "bold" }}>
                        Check Other Dates
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </>
        ) : activeTab === "Matches" ? (
          <View style={styles.tabContent}>
            <View style={styles.tabHeader}>
              <ThemedText type="subtitle">Open Matches</ThemedText>
              <TouchableOpacity style={styles.createButton}>
                <Ionicons name="add-circle" size={20} color={tintColor} />
                <ThemedText style={{ color: tintColor, fontWeight: "bold" }}>
                  Create
                </ThemedText>
              </TouchableOpacity>
            </View>
            {MOCK_MATCHES.map((match) => (
              <MatchCard
                key={match.id}
                {...match}
                onJoin={(id) =>
                  alert(`Request sent to join ${match.groundName} match!`)
                }
              />
            ))}
          </View>
        ) : (
          <View style={styles.tabContent}>
            <ThemedText
              type="subtitle"
              style={{ paddingHorizontal: 16, marginBottom: 16 }}
            >
              Upcoming Tournaments
            </ThemedText>
            {MOCK_TOURNAMENTS.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                {...tournament}
                onPress={(id) =>
                  router.push({
                    pathname: "/sports/tournament/[id]",
                    params: { id },
                  })
                }
              />
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Booking Button */}
      {activeTab === "Grounds" && selectedGround && !isSelectedDateBooked && (
        <View style={[styles.bookingBar, { backgroundColor: cardBg }]}>
          <View>
            <ThemedText style={styles.totalLabel}>Total Price</ThemedText>
            <ThemedText type="title">
              ₹
              {bookingMode === "full"
                ? pricing.finalPrice
                : pricing.finalPrice *
                Object.keys(locks).filter(
                  (k) =>
                    k.startsWith(selectedGround.id) &&
                    locks[k].status === "selected",
                ).length}
            </ThemedText>
          </View>
          <TouchableOpacity
            style={[styles.bookButton, { backgroundColor: tintColor }]}
            onPress={handleBooking}
          >
            <ThemedText style={styles.bookButtonText}>Book Now</ThemedText>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Policy Popup */}
      <PolicyPopup
        visible={!!policyMsg}
        message={policyMsg || ""}
        onClose={() => setPolicyMsg(null)}
      />

      {/* Calendar Modal */}
      <CalendarModal
        isVisible={showCalendar}
        onClose={() => setShowCalendar(false)}
        initialDate={selectedDate}
        bookedDates={bookedDates}
        onSelectDate={(date) => {
          setSelectedDate(date);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e1e1e133",
  },
  activeTab: {
    backgroundColor: "#11181C",
    borderColor: "#11181C",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#94A3B8",
    letterSpacing: 0.5,
  },
  headerWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  calendarTrigger: {
    padding: 6,
    borderRadius: 8,
    marginLeft: 4,
  },
  tabContent: {
    paddingTop: 8,
  },
  tabHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(128, 128, 128, 0.05)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tournamentCardMock: {
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: "rgba(128, 128, 128, 0.05)",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(128, 128, 128, 0.1)",
  },
  tournamentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  prizeBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  prizeText: {
    color: "#1B5E20",
    fontSize: 12,
    fontWeight: "bold",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  dateList: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  dateItem: {
    width: 60,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e1e1e133",
    marginRight: 10,
  },
  dayName: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 4,
  },
  dayNum: {
    fontSize: 18,
    fontWeight: "bold",
  },
  groundVerticalList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    marginBottom: 8,
  },
  priceInfo: {
    fontSize: 13,
    color: "#10B981",
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  todayIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  lockBadge: {
    marginTop: 4,
  },
  slotsGrid: {
    paddingHorizontal: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  sessionsList: {
    paddingHorizontal: 8,
    flexDirection: "column",
  },
  bookingBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  totalLabel: {
    fontSize: 12,
    color: "#94A3B8",
  },
  bookButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  bookButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  fullDayCard: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(128, 128, 128, 0.15)",
    position: "relative",
    overflow: "hidden",
  },
  fullDayContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  fullDayIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  fullDayPrice: {
    fontSize: 20,
    fontWeight: "900",
  },
  modeContainer: {
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  modeCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.1)",
  },
  modeLabel: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 8,
  },
  modeSubLabel: {
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 2,
  },
  fullDayPassContent: {
    margin: 16,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.1)",
  },
  fullDayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  mutedSmall: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  mutedMicro: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 1,
  },
  checkBadge: {
    position: "absolute",
    top: -1,
    right: -1,
    padding: 6,
    borderBottomLeftRadius: 12,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#94A3B8",
  },
  tierSelector: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.1)",
  },
  tierButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(128, 128, 128, 0.15)",
  },
  tierLabel: {
    fontSize: 14,
    fontWeight: "bold",
  },
  tierSub: {
    fontSize: 10,
    color: "#94A3B8",
  },
  adminBanner: {
    margin: 16,
    padding: 16,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  adminBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  adminBannerTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  adminBannerSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
  },
  soldOutBadge: {
    position: "absolute",
    top: -6,
    right: -4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    transform: [{ rotate: "12deg" }],
  },
  soldOutText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "900",
  },
  bookedEmptyState: {
    margin: 20,
    padding: 30,
    alignItems: "center",
    backgroundColor: "rgba(128,128,128,0.05)",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.1)",
  },
  bookedIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  bookedTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  bookedSubtitle: {
    textAlign: "center",
    color: "#94A3B8",
    lineHeight: 20,
    marginBottom: 24,
  },
  alternateButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 2,
  },
  weekendTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  weekendText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  weekdayTag: {
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  weekdayText: {
    color: "#10B981",
    fontSize: 10,
    fontWeight: "bold",
  },
  policyContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  policyBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  policyText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    opacity: 0.8,
  },
});
