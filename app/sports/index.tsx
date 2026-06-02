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
    name: "Cricket Ball Ground",
    type: "International Cricket Ground",
    rating: 4.9,
    location: "Main Arena, Gate 4",
    imageUrl: require("@/assets/images/ground_a_premium.png"),
  },
  {
    id: "ground-b",
    name: "Tennis Ball Ground",
    type: "Premium Match Ground",
    rating: 4.8,
    location: "A-Block Championship Area",
    imageUrl: require("@/assets/images/ground_b_premium.png"),
  },
];

// Mock data for fully booked dates
const getBookedDates = (groundId: string) => {
  const today = new Date();
  const format = (d: Date) => d.toISOString().split("T")[0];

  if (groundId === "ground-a") {
    const d1 = new Date(today);
    d1.setDate(today.getDate() + 2);
    const d2 = new Date(today);
    d2.setDate(today.getDate() + 5);
    return [format(d1), format(d2)];
  }
  const d1 = new Date(today);
  d1.setDate(today.getDate() + 1);
  const d3 = new Date(today);
  d3.setDate(today.getDate() + 4);
  return [format(d1), format(d3)];
};

export default function SportsDashboard() {
  const router = useRouter();
  const {
    user,
    basePrice,
    price12h,
    price24h,
    showAlert,
    grounds: storeGrounds,
    fetchGrounds,
    bookings,
  } = useAdminStore();
  const GROUNDS_DATA = storeGrounds.length > 0 ? storeGrounds : GROUNDS;
  const [selectedGround, setSelectedGround] = useState(GROUNDS_DATA[0]);
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

  useEffect(() => {
    if (storeGrounds.length > 0 && !selectedGround) {
      setSelectedGround(storeGrounds[0]);
    }
  }, [storeGrounds]);
  const isAdmin = user?.role === "admin";
  const mutedColor = useThemeColor({}, "muted");
  const [bookingMode, setBookingMode] = useState<"hourly" | "full">("hourly");
  const [fullDayType, setFullDayType] = useState<"12h" | "24h">("12h");
  const [showCalendar, setShowCalendar] = useState(false);
  const [policyMsg, setPolicyMsg] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dynamicBookedDates, setDynamicBookedDates] = useState<string[]>([]);
  const flatListRef = useRef<FlatList>(null);

  const bookedDates = useMemo(() => {
    const staticBooked = getBookedDates(selectedGround.id);

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

    return [...staticBooked, ...dynamicBookedDates, ...globalFullDayBookings];
  }, [selectedGround.id, dynamicBookedDates, bookings]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Simulate discovery of a new full-day booking
    setTimeout(() => {
      const currentKey = selectedDate.toISOString().split("T")[0];
      setDynamicBookedDates((prev) => {
        if (prev.includes(currentKey)) return prev;
        return [...prev, currentKey];
      });
      setRefreshing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1500);
  }, [selectedDate]);

  const isDateBooked = (d: Date) =>
    bookedDates.includes(d.toISOString().split("T")[0]);
  const isSelectedDateBooked = isDateBooked(selectedDate);

  const dateKey = selectedDate.toISOString().split("T")[0];
  const { locks, selectSlot } = useBookingLock(selectedGround.id, dateKey);
  const pricing = useMemo(
    () =>
      getSlotPrice(selectedDate, bookingMode === "full", fullDayType, {
        hourly: basePrice,
        price12h,
        price24h,
      }),
    [selectedDate, bookingMode, fullDayType, basePrice, price12h, price24h],
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

  // Force Full Day mode for Cricket Ground Big
  useEffect(() => {
    if (selectedGround.id === "ground-a" && bookingMode !== "full") {
      setBookingMode("full");
    }
  }, [selectedGround.id, bookingMode]);

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

  const handleBooking = () => {
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

      <ImageBackground
        source={require("@/assets/images/stadium_header.png")}
        style={{ height: 260, overflow: "hidden" }}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingBottom: 40,
            }}
          >
            <MaterialCommunityIcons
              name="cricket"
              size={80}
              color="#fff"
              style={{ opacity: 0.9 }}
            />
            <ThemedText
              style={{
                color: "#fff",
                fontSize: 24,
                fontWeight: "900",
                letterSpacing: 2,
              }}
            >
              NM GREENS
            </ThemedText>
            <ThemedText
              style={{
                color: "rgba(255,255,255,0.8)",
                fontSize: 13,
                fontWeight: "bold",
              }}
            >
              PREMIUM SPORTS BOOKING
            </ThemedText>
          </View>
        </View>
      </ImageBackground>

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
        {/* Admin Management Banner */}
        {user?.role === "admin" && (
          <TouchableOpacity
            style={[styles.adminBanner, { backgroundColor: tintColor }]}
            onPress={() => router.push("/admin" as any)}
          >
            <View style={styles.adminBannerContent}>
              <MaterialCommunityIcons
                name="shield-check"
                size={24}
                color="#fff"
              />
              <View>
                <ThemedText style={styles.adminBannerTitle}>
                  Management Mode Active
                </ThemedText>
                <ThemedText style={styles.adminBannerSubtitle}>
                  Tap to open Manager Dashboard
                </ThemedText>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        )}

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
                    setSelectedGround(ground);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                />
              ))}
            </View>

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
                {selectedGround.id !== "ground-a" && (
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
                        },
                        {
                          id: "24h",
                          label: "24 Hours",
                          sub: "Full Cycle",
                          icon: "moon",
                        },
                      ].map((tier) => (
                        <TouchableOpacity
                          key={tier.id}
                          style={[
                            styles.tierButton,
                            fullDayType === tier.id && {
                              backgroundColor: tintColor,
                              borderColor: tintColor,
                            },
                          ]}
                          onPress={() => {
                            setFullDayType(tier.id as any);
                            Haptics.impactAsync(
                              Haptics.ImpactFeedbackStyle.Medium,
                            );
                          }}
                        >
                          <Ionicons
                            name={tier.icon as any}
                            size={14}
                            color={fullDayType === tier.id ? "#fff" : tintColor}
                          />
                          <View>
                            <ThemedText
                              style={[
                                styles.tierLabel,
                                fullDayType === tier.id && { color: "#fff" },
                              ]}
                            >
                              {tier.label}
                            </ThemedText>
                            <ThemedText
                              style={[
                                styles.tierSub,
                                fullDayType === tier.id && {
                                  color: "rgba(255,255,255,0.7)",
                                },
                              ]}
                            >
                              {tier.sub}
                            </ThemedText>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ) : (
                  <View style={{ marginTop: 20 }}>
                    <View style={styles.sectionHeader}>
                      <View style={styles.headerWithIcon}>
                        <Ionicons name="time" size={18} color={tintColor} />
                        <ThemedText type="subtitle">
                          {pricing.isWeekend
                            ? "Weekend Session Slots"
                            : "Hourly Slots"}
                        </ThemedText>
                      </View>
                      {pricing.isWeekend && (
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
                            style={{
                              color: tintColor,
                              fontSize: 10,
                              fontWeight: "900",
                            }}
                          >
                            3 SESSIONS
                          </ThemedText>
                        </View>
                      )}
                    </View>

                    {(pricing.isWeekend
                      ? ["Morning", "Afternoon", "Evening"]
                      : ["Morning", "Afternoon", "Evening", "Night"]
                    ).map((category) => {
                      const slotsInCategory = getDynamicTimeSlots(
                        selectedDate,
                      ).filter((s) => s.category === category);
                      if (slotsInCategory.length === 0) return null;
                      return (
                        <View key={category} style={styles.categoryContainer}>
                          {!pricing.isWeekend && (
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
                          )}
                          <View
                            style={
                              pricing.isWeekend
                                ? styles.sessionsList
                                : styles.slotsGrid
                            }
                          >
                            {slotsInCategory.map((slot) => {
                              const status =
                                locks[`${selectedGround.id}-${slot.id}`]
                                  ?.status || "available";
                              return (
                                <SportsSlot
                                  key={slot.id}
                                  id={slot.id}
                                  label={slot.label}
                                  status={status}
                                  price={pricing.finalPrice}
                                  onPress={selectSlot}
                                  variant={
                                    pricing.isWeekend ? "session" : "hourly"
                                  }
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
      {activeTab === "Grounds" && !isSelectedDateBooked && (
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
