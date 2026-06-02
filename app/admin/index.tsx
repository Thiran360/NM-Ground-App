import React, { useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  View,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useAdminStore } from "@/store/admin-store";

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
    basePrice,
    setBasePrice,
    price12h,
    setPrice12h,
    price24h,
    setPrice24h,
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
      const response = await fetch(
        "https://refined-alone-causing.ngrok-free.dev/booking/admin-update/",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            admin_id: tempAdminId,
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
          <View style={[styles.welcomeCard, { backgroundColor: tintColor }]}>
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
          </View>

          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle">Select Ground to Manage</ThemedText>
          </View>

          {GROUNDS.map((ground) => (
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
          ))}

          <View style={styles.statsGrid}>
            <View style={[styles.statItem, { backgroundColor: cardBg }]}>
              <ThemedText type="subtitle">12</ThemedText>
              <ThemedText style={styles.statLabel}>Active Holds</ThemedText>
            </View>
            <View style={[styles.statItem, { backgroundColor: cardBg }]}>
              <ThemedText type="subtitle">45</ThemedText>
              <ThemedText style={styles.statLabel}>Total Bookings</ThemedText>
            </View>
          </View>

          {/* Rate Management Section */}
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle">
              Revenue & Pricing Management
            </ThemedText>
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
                  ₹{basePrice}
                </ThemedText>
              </View>
            </View>

            <View style={styles.priceAdjustment}>
              <TouchableOpacity
                style={[
                  styles.adjButton,
                  { backgroundColor: tintColor + "10" },
                ]}
                onPress={() => setBasePrice(Math.max(500, basePrice - 100))}
              >
                <Ionicons name="remove" size={24} color={tintColor} />
              </TouchableOpacity>
              <View style={styles.priceProgress}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      backgroundColor: tintColor,
                      width: `${(basePrice / 5000) * 100}%`,
                    },
                  ]}
                />
              </View>
              <TouchableOpacity
                style={[
                  styles.adjButton,
                  { backgroundColor: tintColor + "10" },
                ]}
                onPress={() => setBasePrice(Math.min(5000, basePrice + 100))}
              >
                <Ionicons name="add" size={24} color={tintColor} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.pricingCard, { backgroundColor: cardBg }]}>
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
                  ₹{price12h}
                </ThemedText>
              </View>
            </View>

            <View style={styles.priceAdjustment}>
              <TouchableOpacity
                style={[styles.adjButton, { backgroundColor: "#FACC1510" }]}
                onPress={() => setPrice12h(Math.max(2000, price12h - 500))}
              >
                <Ionicons name="remove" size={24} color="#FACC15" />
              </TouchableOpacity>
              <View style={styles.priceProgress}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      backgroundColor: "#FACC15",
                      width: `${(price12h / 15000) * 100}%`,
                    },
                  ]}
                />
              </View>
              <TouchableOpacity
                style={[styles.adjButton, { backgroundColor: "#FACC1510" }]}
                onPress={() => setPrice12h(Math.min(15000, price12h + 500))}
              >
                <Ionicons name="add" size={24} color="#FACC15" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.pricingCard, { backgroundColor: cardBg }]}>
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
                  ₹{price24h}
                </ThemedText>
              </View>
            </View>

            <View style={styles.priceAdjustment}>
              <TouchableOpacity
                style={[styles.adjButton, { backgroundColor: "#F59E0B10" }]}
                onPress={() => setPrice24h(Math.max(5000, price24h - 500))}
              >
                <Ionicons name="remove" size={24} color="#F59E0B" />
              </TouchableOpacity>
              <View style={styles.priceProgress}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      backgroundColor: "#F59E0B",
                      width: `${(price24h / 25000) * 100}%`,
                    },
                  ]}
                />
              </View>
              <TouchableOpacity
                style={[styles.adjButton, { backgroundColor: "#F59E0B10" }]}
                onPress={() => setPrice24h(Math.min(25000, price24h + 500))}
              >
                <Ionicons name="add" size={24} color="#F59E0B" />
              </TouchableOpacity>
            </View>
          </View>

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
          </View>

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
        </ScrollView>
      </KeyboardAvoidingView>
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
});
