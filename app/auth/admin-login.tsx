import React, { useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useAdminStore } from "@/store/admin-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

export default function AdminLoginScreen() {
  const router = useRouter();
  const { login, adminCredentials, showAlert } = useAdminStore();

  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const tintColor = useThemeColor({}, "tint");
  const cardBg = useThemeColor({}, "cardBackground");
  const pageBg = useThemeColor({}, "background");

  const handleAdminLogin = async () => {
    if (!adminId || !password) {
      showAlert("Required Fields", "Please enter both Administrator ID and Portal Password.", "warning");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        "https://refined-alone-causing.ngrok-free.dev/booking/admin-login/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({
            email: adminId.trim().toLowerCase(),
            password: password,
          }),
        },
      );

      let data: any = {};
      const rawText = await response.text();
      try {
        data = JSON.parse(rawText);
      } catch {
        console.warn("Response is not JSON:", rawText);
      }

      if (response.ok) {
        const token = data.token ?? data.access ?? data.key ?? "admin-token";
        const role = "admin";
        const userId = data.admin_id?.toString() ?? data.user_id?.toString() ?? "admin-1";
        const userName = data.full_name ?? data.name ?? "Arena Manager";

        // Persist session
        await AsyncStorage.setItem("auth_token", token);
        await AsyncStorage.setItem(
          "nm_user",
          JSON.stringify({
            id: userId,
            email: data.email ?? adminId,
            role,
            full_name: userName,
          }),
        );

        login("admin", userName, token, userId);
        router.replace("/admin");
      } else {
        // Fallback local admin check if server rejects but local matches
        if (adminId === adminCredentials.id && password === adminCredentials.password) {
          login("admin", "Arena Manager", undefined, "admin-1");
          router.replace("/admin");
          return;
        }

        const message =
          data?.detail ??
          data?.message ??
          data?.error ??
          data?.admin_id?.[0] ??
          data?.password?.[0] ??
          "Invalid Administrator ID or Portal Password.";
        showAlert("Authentication Failed", message, "error");
      }
    } catch (error: any) {
      console.error("Admin Login Error:", error);

      // Fallback local admin check on network failure
      if (adminId === adminCredentials.id && password === adminCredentials.password) {
        login("admin", "Arena Manager", undefined, "admin-1");
        router.replace("/admin");
        return;
      }

      showAlert(
        "Network Error",
        "Could not connect to the server. Please check your connection.",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: pageBg }}>
      <ThemedView style={[styles.container, { backgroundColor: "transparent" }]}>
        <Stack.Screen options={{ headerShown: false }} />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.flex}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={tintColor} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View
              style={[
                styles.logoContainer,
                { backgroundColor: "rgba(0,0,0,0.5)", shadowColor: tintColor },
              ]}
            >
              <Image
                source={require("@/assets/images/nm-greens-logo.jpg")}
                style={{ width: 90, height: 90, borderRadius: 20 }}
                resizeMode="contain"
              />
            </View>
            <ThemedText type="title" style={styles.title}>
              Manager Portal
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Secure access for ground administrators
            </ThemedText>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name="account-key-outline"
                size={20}
                color="#94A3B8"
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  { color: useThemeColor({}, "text"), backgroundColor: cardBg },
                ]}
                placeholder="Administrator Email"
                placeholderTextColor="#94A3B8"
                value={adminId}
                onChangeText={setAdminId}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#94A3B8"
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  {
                    color: useThemeColor({}, "text"),
                    backgroundColor: cardBg,
                    paddingRight: 48,
                  },
                ]}
                placeholder="Portal Password"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: tintColor }]}
              onPress={handleAdminLogin}
              disabled={isLoading}
            >
              <ThemedText style={styles.buttonText}>
                {isLoading ? "Authenticating..." : "Secure Login"}
              </ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color="#94A3B8"
            />
            <ThemedText style={styles.footerText}>
              Authorized access only. All actions are logged.
            </ThemedText>
          </View>
        </KeyboardAvoidingView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    top: 60,
    left: 24,
    zIndex: 10,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    position: "relative",
    justifyContent: "center",
  },
  inputIcon: {
    position: "absolute",
    left: 16,
    zIndex: 1,
  },
  input: {
    height: 60,
    borderRadius: 16,
    paddingLeft: 48,
    paddingRight: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(128, 128, 128, 0.1)",
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    zIndex: 1,
  },
  loginButton: {
    height: 60,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
    gap: 8,
  },
  footerText: {
    color: "#94A3B8",
    fontSize: 12,
  },
});
