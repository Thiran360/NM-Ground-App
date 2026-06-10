import React, { useMemo, useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  View,
  FlatList,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useAdminStore } from "@/store/admin-store";
import { TIME_SLOTS } from "@/utils/pricing";

export default function AdminGroundManagement() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { toggleHold, toggleHoldApi, heldSlots, user, bookings } = useAdminStore();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const tintColor = useThemeColor({}, "tint");
  const cardBg = useThemeColor({}, "cardBackground");
  const pageBg = useThemeColor({}, "background");

  const dateKey = selectedDate.toISOString().split("T")[0];
  const mutedColor = useThemeColor({}, "muted");

  const groupedSlots = useMemo(() => {
    const groups: Record<string, typeof TIME_SLOTS> = {
      Morning: [],
      Afternoon: [],
      Evening: [],
      Night: [],
    };
    TIME_SLOTS.forEach((slot) => {
      const category = slot.category as keyof typeof groups;
      if (groups[category]) {
        groups[category].push(slot);
      }
    });
    return groups;
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Morning":
        return "sunny-outline";
      case "Afternoon":
        return "partly-sunny-outline";
      case "Evening":
        return "moon-outline";
      case "Night":
        return "star-outline";
      default:
        return "time-outline";
    }
  };

  const isGroundA = id === "ground-a";
  const isGroundB = id === "ground-b";

  const handleToggleBlock = (range: number[]) => {
    // Check if fully held
    const heldCount = range.filter((slotId) =>
      heldSlots.some(
        (h) =>
          h.groundId === id &&
          h.slotId === String(slotId) &&
          h.date === dateKey,
      ),
    ).length;

    const shouldHold = heldCount < range.length; // If not fully held, hold all. If fully held, unhold all.

    range.forEach((slotId) => {
      const isCurrentlyHeld = heldSlots.some(
        (h) =>
          h.groundId === id &&
          h.slotId === String(slotId) &&
          h.date === dateKey,
      );
      if (shouldHold !== isCurrentlyHeld) {
        toggleHold(id!, String(slotId), dateKey);
        const mappedId = typeof slotId === 'number' ? slotId + 24 : parseInt(slotId as any) + 24;
        const parsedGroundId = id === "ground-b" ? 2 : 1;
        toggleHoldApi("timeslot", mappedId, shouldHold ? "hold" : "release", dateKey, parsedGroundId);
      }
    });
  };

  const getBlockHeldStatus = (range: number[]) => {
    const heldCount = range.filter((slotId) =>
      heldSlots.some(
        (h) =>
          h.groundId === id &&
          h.slotId === String(slotId) &&
          h.date === dateKey,
      ),
    ).length;

    const bookedCount = range.filter((slotId) =>
      bookings.some(
        (b) =>
          (b.groundId === id || b.ground_id === id) &&
          b.date === dateKey &&
          b.status === "Confirmed" &&
          b.slots.includes(String(slotId)),
      ),
    ).length;

    if (bookedCount === range.length) return "booked";
    if (heldCount === range.length) return "held";
    if (heldCount + bookedCount === 0) return "available";
    return "partial";
  };

  const dates = useMemo(() => {
    const list = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      list.push(d);
    }
    return list;
  }, []);

  const renderDateItem = ({ item }: { item: Date }) => {
    const isSelected = item.toDateString() === selectedDate.toDateString();
    return (
      <TouchableOpacity
        style={[
          styles.dateItem,
          { backgroundColor: cardBg },
          isSelected && { backgroundColor: tintColor, borderColor: tintColor },
        ]}
        onPress={() => setSelectedDate(item)}
      >
        <ThemedText style={[styles.dayName, isSelected && { color: "#fff" }]}>
          {item.toLocaleDateString("en-US", { weekday: "short" })}
        </ThemedText>
        <ThemedText style={[styles.dayNum, isSelected && { color: "#fff" }]}>
          {item.getDate()}
        </ThemedText>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerTitle: "Manage Slots" }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ThemedText type="subtitle">Select Date</ThemedText>
        </View>
        <FlatList
          data={dates}
          renderItem={renderDateItem}
          keyExtractor={(item) => item.toISOString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateList}
        />

        <View style={styles.sectionHeader}>
          <View>
            <ThemedText type="subtitle">Slot Availability</ThemedText>
            <ThemedText style={styles.meta}>
              Tap a slot to Toggle Admin Hold.
            </ThemedText>
          </View>
          <View style={styles.legend}>
            <View style={[styles.dot, { backgroundColor: "#FF9800" }]} />
            <ThemedText style={styles.legendText}>Holding</ThemedText>
          </View>
        </View>

        {(isGroundA || isGroundB) && (
          <View style={styles.blockContainer}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle">Full-Day Block Holds</ThemedText>
            </View>
            {[
              {
                label: "12 Hours Day Pass",
                sub: "6 AM – 6 PM (12 Slots)",
                range: Array.from({ length: 12 }, (_, i) => i + 7),
                icon: "sunny",
              },
              {
                label: "24 Hours Full Day",
                sub: "Full Cycle (All 24 Slots)",
                range: Array.from({ length: 24 }, (_, i) => i + 1),
                icon: "moon",
              },
            ].map((block) => {
              const status = getBlockHeldStatus(block.range);
              const isHeld = status === "held";
              const isPartial = status === "partial";

              return (
                <TouchableOpacity
                  key={block.label}
                  style={[
                    styles.blockCard,
                    {
                      backgroundColor: cardBg,
                      borderColor:
                        status === "booked"
                          ? "#EF4444"
                          : status === "held"
                            ? "#FF9800"
                            : status === "partial"
                              ? "#FB8C00"
                              : "rgba(128, 128, 128, 0.1)",
                    },
                  ]}
                  onPress={() => {
                    if (status === "booked") return;
                    handleToggleBlock(block.range);
                  }}
                  disabled={status === "booked"}
                >
                  <View style={styles.blockLeft}>
                    <View
                      style={[
                        styles.blockIcon,
                        {
                          backgroundColor:
                            status === "booked"
                              ? "#EF444420"
                              : status === "held"
                                ? "#FF980020"
                                : "rgba(128,128,128,0.1)",
                        },
                      ]}
                    >
                      <Ionicons
                        name={block.icon as any}
                        size={24}
                        color={
                          status === "booked"
                            ? "#EF4444"
                            : status === "held"
                              ? "#FF9800"
                              : tintColor
                        }
                      />
                    </View>
                    <View>
                      <ThemedText type="defaultSemiBold">
                        {block.label}
                      </ThemedText>
                      <ThemedText style={styles.meta}>{block.sub}</ThemedText>
                    </View>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <ThemedText
                      style={[
                        styles.slotStatus,
                        {
                          color:
                            status === "booked"
                              ? "#EF4444"
                              : status === "held"
                                ? "#FF9800"
                                : status === "partial"
                                  ? "#FB8C00"
                                  : "#10B981",
                        },
                      ]}
                    >
                      {status === "booked"
                        ? "FULLY BOOKED"
                        : status === "held"
                          ? "FULLY HELD"
                          : status === "partial"
                            ? "PARTIALLY HELD"
                            : "AVAILABLE"}
                    </ThemedText>
                    {(status === "held" || status === "booked") && (
                      <Ionicons
                        name={
                          status === "booked"
                            ? "shield-checkmark"
                            : "lock-closed"
                        }
                        size={16}
                        color={status === "booked" ? "#EF4444" : "#FF9800"}
                        style={{ marginTop: 4 }}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
            {isGroundB && (
              <View style={[styles.divider, { marginVertical: 20 }]} />
            )}
          </View>
        )}

        {!isGroundA && (
          <View style={{ marginTop: isGroundB ? 0 : 0 }}>
            {isGroundB && (
              <ThemedText type="subtitle" style={{ marginBottom: 16 }}>
                Individual Hourly Slots
              </ThemedText>
            )}
            {Object.entries(groupedSlots).map(([category, slots]) => (
              <View key={category} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <Ionicons
                    name={getCategoryIcon(category) as any}
                    size={20}
                    color={tintColor}
                  />
                  <ThemedText type="defaultSemiBold" style={{ marginLeft: 8 }}>
                    {category} Slots
                  </ThemedText>
                </View>
                <View style={styles.slotsGrid}>
                  {slots.map((slot) => {
                    const playerBooking = bookings.find(
                      (b) =>
                        (b.groundId === id || b.ground_id === id) &&
                        b.date === dateKey &&
                        b.status === "Confirmed" &&
                        b.slots.includes(slot.id),
                    );
                    const isBooked = !!playerBooking;
                    const isHeld = heldSlots.some(
                      (h) =>
                        h.groundId === id &&
                        h.slotId === slot.id &&
                        h.date === dateKey,
                    );

                    return (
                      <TouchableOpacity
                        key={slot.id}
                        style={[
                          styles.slotCard,
                          {
                            backgroundColor: cardBg,
                            borderColor: isBooked
                              ? "#EF4444"
                              : isHeld
                                ? "#FF9800"
                                : "rgba(128, 128, 128, 0.1)",
                          },
                        ]}
                        onPress={() => {
                          if (isBooked) return;
                          toggleHold(id!, slot.id, dateKey);
                          let mappedId = parseInt(slot.id);
                          // For standard numerical slots (1-24), map to 25-48.
                          // For weekend slots (weekend-m, a, e), handle separately if needed, 
                          // but the UI currently passes string numerical IDs for hourly slots.
                          if (!isNaN(mappedId)) {
                             mappedId += 24;
                          } else if (slot.id === 'weekend-m') mappedId = 49;
                          else if (slot.id === 'weekend-a') mappedId = 50;
                          else if (slot.id === 'weekend-e') mappedId = 51;
                          
                          const parsedGroundId = id === "ground-b" ? 2 : 1;
                          toggleHoldApi("timeslot", mappedId, !isHeld ? "hold" : "release", dateKey, parsedGroundId);
                        }}
                        disabled={isBooked}
                      >
                        <View style={styles.slotHeader}>
                          <ThemedText
                            type="default"
                            style={{ fontSize: 13, fontWeight: "600" }}
                          >
                            {slot.label}
                          </ThemedText>
                          {(isHeld || isBooked) && (
                            <Ionicons
                              name={isBooked ? "person" : "lock-closed"}
                              size={14}
                              color={isBooked ? "#EF4444" : "#FF9800"}
                            />
                          )}
                        </View>
                        <ThemedText
                          style={[
                            styles.slotStatus,
                            {
                              color: isBooked
                                ? "#EF4444"
                                : isHeld
                                  ? "#FF9800"
                                  : "#10B981",
                            },
                          ]}
                        >
                          {isBooked
                            ? `BOOKED BY ${playerBooking?.player || playerBooking?.user || "PLAYER"}`
                            : isHeld
                              ? "ADMIN HOLD"
                              : "AVAILABLE"}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
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
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 12,
  },
  dateList: {
    paddingBottom: 20,
  },
  dateItem: {
    width: 60,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(128, 128, 128, 0.1)",
    marginRight: 10,
  },
  dayName: { fontSize: 12, color: "#687076" },
  dayNum: { fontSize: 18, fontWeight: "bold" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 20,
    marginBottom: 16,
  },
  meta: { fontSize: 12, color: "#687076", marginTop: 4 },
  legend: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: "#687076" },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingLeft: 4,
  },
  slotCard: {
    width: "48.5%",
    padding: 12,
    borderRadius: 14,
    borderWidth: 2,
    marginBottom: 8,
  },
  slotHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  slotStatus: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  blockContainer: {
    gap: 16,
    marginTop: 8,
  },
  blockCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderRadius: 20,
    borderWidth: 2,
  },
  blockLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  blockIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(128, 128, 128, 0.15)",
  },
});
