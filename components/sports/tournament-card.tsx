import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Tournament } from "@/utils/sports-data";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

interface TournamentCardProps extends Tournament {
  onPress: (id: string) => void;
}

export function TournamentCard({
  id,
  name,
  groundName,
  sport,
  startDate,
  endDate,
  prizePool,
  entryFee,
  bannerImage,
  registeredTeams,
  maxTeams,
  onPress,
}: TournamentCardProps) {
  const tintColor = useThemeColor({}, "tint");
  const cardBg = useThemeColor({}, "cardBackground");
  const accentColor = useThemeColor({}, "accent");
  const mutedColor = useThemeColor({}, "muted");
  const borderColor = useThemeColor({}, "border");

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: cardBg, borderColor }]}
      onPress={() => onPress(id)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: bannerImage }} style={styles.banner} />
      <View style={styles.overlay}>
        <View style={[styles.prizeBadge, { backgroundColor: accentColor }]}>
          <FontAwesome5 name="medal" size={14} color="#000" />
          <ThemedText style={styles.prizeText}>
            PRIZE: ₹{prizePool.toLocaleString()}
          </ThemedText>
        </View>
      </View>

      <View style={styles.content}>
        <ThemedText type="defaultSemiBold" style={styles.title}>
          {name}
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: mutedColor }]}>
          {sport} • {groundName}
        </ThemedText>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-sharp" size={14} color={tintColor} />
            <ThemedText
              style={[
                styles.detailText,
                { color: tintColor, fontWeight: "bold" },
              ]}
            >
              {startDate} - {endDate.split("-").pop()}
            </ThemedText>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="people-sharp" size={14} color={mutedColor} />
            <ThemedText style={[styles.detailText, { color: mutedColor }]}>
              {registeredTeams}/{maxTeams} TEAMS JOINED
            </ThemedText>
          </View>
        </View>

        <View style={[styles.footer, { borderTopColor: borderColor }]}>
          <View style={styles.feeContainer}>
            <ThemedText style={[styles.feeLabel, { color: mutedColor }]}>
              Entry Fee
            </ThemedText>
            <ThemedText type="defaultSemiBold" style={{ color: tintColor }}>
              ₹{entryFee}
            </ThemedText>
          </View>
          <View style={[styles.registerButton, { backgroundColor: tintColor }]}>
            <ThemedText style={styles.registerText}>Register</ThemedText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    marginBottom: 20,
    marginHorizontal: 16,
    overflow: "hidden",
    borderWidth: 1,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  banner: {
    width: "100%",
    height: 120,
  },
  overlay: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  prizeBadge: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  prizeText: {
    color: "#000",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 11,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
  },
  feeContainer: {
    flexDirection: "column",
  },
  feeLabel: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  registerButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  registerText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
