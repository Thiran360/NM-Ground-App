import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  View,
  Image,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useAdminStore } from "@/store/admin-store";
import { LinearGradient } from "expo-linear-gradient";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, showAlert, fetchProfile } = useAdminStore();
  const tintColor = useThemeColor({}, "tint");
  const cardBg = useThemeColor({}, "cardBackground");
  const pageBg = useThemeColor({}, "background");
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showHelpSupport, setShowHelpSupport] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = () => {
    logout();
    router.replace("/auth/login");
  };

  const menuItems = [
    {
      id: "bookings",
      label: "My Bookings",
      icon: "ticket-outline",
      color: "#10B981",
      action: () => router.push("/bookings"),
    },
    {
      id: "wallet",
      label: "Wallet & Payments",
      icon: "wallet-outline",
      color: tintColor,
      action: () => router.push("/wallet"),
    },
    {
      id: "help",
      label: "Help & Support",
      icon: "help-circle-outline",
      color: "#F59E0B",
      action: () => setShowHelpSupport(true),
    },
    {
      id: "privacy",
      label: "Privacy Policy",
      icon: "document-text-outline",
      color: "#8B5CF6",
      action: () => setShowPrivacyPolicy(true),
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: pageBg }}>
      <ThemedView style={[styles.container, { backgroundColor: "transparent" }]}>
        <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={[tintColor, "#11181C"]}
              style={styles.avatarGradient}
            />
            <View style={[styles.avatarInner, { borderColor: tintColor + "40" }]}>
              <ThemedText style={[styles.avatarInitial, { color: tintColor }]}>
                {(user?.name || "P")[0].toUpperCase()}
              </ThemedText>
            </View>
            <TouchableOpacity
              style={[styles.editBadge, { backgroundColor: tintColor }]}
            >
              <Ionicons name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.userInfo}>
            <ThemedText type="title" style={styles.userName}>
              {user?.name || "Player"}
            </ThemedText>
            <ThemedText style={styles.userEmail}>
              {user?.role === "admin"
                ? "Manager Portal"
                : "Premium Player Member"}
            </ThemedText>
          </View>
        </View>



        {/* Menu Section */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <View
              key={item.id}
            >
              <TouchableOpacity
                style={[styles.menuItem, { backgroundColor: cardBg }]}
                onPress={item.action}
              >
                <View
                  style={[
                    styles.menuIconBox,
                    { backgroundColor: item.color + "15" },
                  ]}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={22}
                    color={item.color}
                  />
                </View>
                <ThemedText style={styles.menuLabel}>{item.label}</ThemedText>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Log Out Button */}
        <View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            <ThemedText style={styles.logoutText}>Log Out Account</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.versionText}>
            NM Greens v2.4.0 (Stable)
          </ThemedText>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Help & Support Modal */}
      <Modal
        visible={showHelpSupport}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHelpSupport(false)}
      >
        <ThemedView style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "rgba(128,128,128,0.1)" }}>
            <ThemedText type="subtitle">Help & Support</ThemedText>
            <TouchableOpacity onPress={() => setShowHelpSupport(false)}>
              <Ionicons name="close-circle" size={28} color={tintColor} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <ThemedText style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>Frequently Asked Questions</ThemedText>
            
            <ThemedText style={{ fontWeight: "bold", marginTop: 10, color: tintColor }}>Q: How do I book a ground?</ThemedText>
            <ThemedText style={{ marginBottom: 15, lineHeight: 22, color: "#94A3B8" }}>
              A: Navigate to the home screen, select your preferred ground and date, choose available slots, and proceed to payment.
            </ThemedText>

            <ThemedText style={{ fontWeight: "bold", marginTop: 10, color: tintColor }}>Q: Can I cancel my booking?</ThemedText>
            <ThemedText style={{ marginBottom: 15, lineHeight: 22, color: "#94A3B8" }}>
              A: Yes, you can cancel your booking up to 24 hours in advance. Go to 'My Bookings', select the booking, and choose 'Cancel'.
            </ThemedText>

            <ThemedText style={{ fontWeight: "bold", marginTop: 10, color: tintColor }}>Q: How do I add money to my wallet?</ThemedText>
            <ThemedText style={{ marginBottom: 25, lineHeight: 22, color: "#94A3B8" }}>
              A: Go to 'Wallet & Payments' and tap on 'Add Money'. You can add funds using various payment methods.
            </ThemedText>

            <ThemedText style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>Contact Us</ThemedText>
            <ThemedText style={{ marginBottom: 10, lineHeight: 22, color: "#94A3B8" }}>
              If you need further assistance, please reach out to our support team:
            </ThemedText>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <Ionicons name="mail-outline" size={20} color={tintColor} style={{ marginRight: 10 }} />
              <ThemedText style={{ color: "#94A3B8" }}>support@nmgreens.com</ThemedText>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 40 }}>
              <Ionicons name="call-outline" size={20} color={tintColor} style={{ marginRight: 10 }} />
              <ThemedText style={{ color: "#94A3B8" }}>+91 98765 43210</ThemedText>
            </View>
          </ScrollView>
          </SafeAreaView>
        </ThemedView>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        visible={showPrivacyPolicy}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPrivacyPolicy(false)}
      >
        <ThemedView style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "rgba(128,128,128,0.1)" }}>
            <ThemedText type="subtitle">Privacy Policy</ThemedText>
            <TouchableOpacity onPress={() => setShowPrivacyPolicy(false)}>
              <Ionicons name="close-circle" size={28} color={tintColor} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <ThemedText style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>1. About NM Greens</ThemedText>
            <ThemedText style={{ marginBottom: 20, lineHeight: 22, color: "#94A3B8" }}>
              NM Greens is a dedicated cricket ground booking platform that enables users to discover, view, and reserve our premier cricket facilities. We currently offer two distinct grounds: a professional Cricket Ball Ground and a dedicated Tennis Ball Ground.
              The application is designed to provide a convenient booking experience, facility management tools, and communication services between users and venue owners.
            </ThemedText>

            <ThemedText style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>2. Information We Collect</ThemedText>
            <ThemedText style={{ marginBottom: 20, lineHeight: 22, color: "#94A3B8" }}>
              A. Personal Information: Full Name, Mobile Number, Email Address, Profile Information, Username and Password, Booking Preferences.
              {"\n\n"}
              B. Location Information: With your permission, we may collect location information to display nearby sports grounds, improve search results, and provide navigation. Location access is optional.
              {"\n\n"}
              C. Device Information: Device Model, Identifier, OS Version, IP Address, App Version, Network Info.
              {"\n\n"}
              D. Usage Information: Login Activity, Booking History, Search Activity, App Interactions.
            </ThemedText>

            <ThemedText style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>3. How We Use Your Information</ThemedText>
            <ThemedText style={{ marginBottom: 20, lineHeight: 22, color: "#94A3B8" }}>
              We use collected information to create/manage accounts, process bookings, enable payments, improve functionality, send notifications, and prevent fraud.
            </ThemedText>

            <ThemedText style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>4. Data Sharing and Disclosure</ThemedText>
            <ThemedText style={{ marginBottom: 20, lineHeight: 22, color: "#94A3B8" }}>
              We do not sell your personal information. We may share information with Service Providers, Venue Owners, or when required by legal requirements.
            </ThemedText>

            <ThemedText style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>5. Data Security & Retention</ThemedText>
            <ThemedText style={{ marginBottom: 20, lineHeight: 22, color: "#94A3B8" }}>
              We implement reasonable safeguards to protect user information using SSL/HTTPS. We retain information only as long as necessary to provide services, process transactions, or comply with legal requirements.
            </ThemedText>

            <ThemedText style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>6. Your Rights & Account Deletion</ThemedText>
            <ThemedText style={{ marginBottom: 20, lineHeight: 22, color: "#94A3B8" }}>
              You may access, update, or request deletion of your account. To delete your account, open the application and navigate to Profile → Delete Account or contact our support email.
            </ThemedText>

            <ThemedText style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>7. Contact Us</ThemedText>
            <ThemedText style={{ marginBottom: 40, lineHeight: 22, color: "#94A3B8" }}>
              NM Greens{"\n"}
              Medavakkam, Chennai, Tamil Nadu{"\n"}
              Email: nmgreensdk@gmail.com{"\n"}
              Phone: +91 99828 99287, +91 8610051003
            </ThemedText>
          </ScrollView>
          </SafeAreaView>
        </ThemedView>
      </Modal>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 80,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    position: "relative",
    marginBottom: 20,
  },
  avatarGradient: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 60,
    opacity: 0.1,
  },
  avatarInner: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
  },
  avatarInitial: {
    fontSize: 52,
    fontWeight: "900",
    letterSpacing: -1,
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#020617",
  },
  userInfo: {
    alignItems: "center",
  },
  userName: {
    fontSize: 28,
    fontWeight: "900",
  },
  userEmail: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 4,
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  menuContainer: {
    gap: 12,
    marginBottom: 40,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  menuIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    borderRadius: 20,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    gap: 12,
  },
  logoutText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "700",
  },
  versionText: {
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 11,
    marginTop: 20,
    fontWeight: "600",
  },
});
