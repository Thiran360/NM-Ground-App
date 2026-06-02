import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { MOCK_TOURNAMENTS } from "@/utils/sports-data";
import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useAdminStore } from "@/store/admin-store";

export default function TournamentDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { showAlert } = useAdminStore();
  const tintColor = useThemeColor({}, "tint");
  const cardBg = useThemeColor({}, "cardBackground");

  const tournament = MOCK_TOURNAMENTS.find((t) => t.id === id);

  if (!tournament) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Tournament not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: "Tournament Details",
          headerTransparent: true,
          headerTintColor: "#fff",
        }}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <Image source={{ uri: tournament.bannerImage }} style={styles.banner} />

        <View style={[styles.content, { backgroundColor: cardBg }]}>
          <View style={styles.header}>
            <ThemedText type="title">{tournament.name}</ThemedText>
            <View style={styles.sportBadge}>
              <MaterialCommunityIcons
                name="cricket"
                size={16}
                color={tintColor}
              />
              <ThemedText
                style={{ color: tintColor, fontSize: 12, fontWeight: "bold" }}
              >
                {tournament.sport}
              </ThemedText>
            </View>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location" size={18} color="#687076" />
            <ThemedText style={styles.locationText}>
              {tournament.groundName}
            </ThemedText>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <FontAwesome5 name="trophy" size={24} color="#F57F17" />
              <ThemedText type="subtitle" style={styles.statValue}>
                ₹{tournament.prizePool.toLocaleString()}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Prize Pool</ThemedText>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="people" size={24} color={tintColor} />
              <ThemedText type="subtitle" style={styles.statValue}>
                {tournament.registeredTeams}/{tournament.maxTeams}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Teams Joined</ThemedText>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Registration Details
            </ThemedText>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Entry Fee</ThemedText>
                <ThemedText type="defaultSemiBold">
                  ₹{tournament.entryFee}
                </ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Start Date</ThemedText>
                <ThemedText type="defaultSemiBold">
                  {tournament.startDate}
                </ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>End Date</ThemedText>
                <ThemedText type="defaultSemiBold">
                  {tournament.endDate}
                </ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Rules & Regulations
            </ThemedText>
            <ThemedText style={styles.rulesText}>
              • 15-over matches (T20 Format).{"\n"}• ICC standard rules apply.
              {"\n"}• Teams must report 30 minutes before the match.{"\n"}•
              White ball tournament.{"\n"}• Professional umpires will be
              provided.
            </ThemedText>
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: cardBg }]}>
        <TouchableOpacity
          style={[styles.registerButton, { backgroundColor: tintColor }]}
          onPress={() =>
            showAlert(
              "Payment Portal",
              "Redirecting you to the secure payment gateway to complete your registration.",
              "info",
            )
          }
        >
          <ThemedText style={styles.registerButtonText}>
            Register Team • ₹{tournament.entryFee}
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
  banner: {
    width: "100%",
    height: 250,
  },
  content: {
    padding: 20,
    marginTop: -20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sportBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(128, 128, 128, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(128, 128, 128, 0.1)",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  locationText: {
    color: "#687076",
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: "rgba(128, 128, 128, 0.08)",
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(128, 128, 128, 0.15)",
  },
  statValue: {
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#687076",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: "rgba(128, 128, 128, 0.08)",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(128, 128, 128, 0.1)",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoLabel: {
    color: "#687076",
  },
  rulesText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#687076",
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
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  registerButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
