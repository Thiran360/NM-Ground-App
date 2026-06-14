import React, { useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
  Image,
  Pressable,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useAdminStore } from "@/store/admin-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useEffect } from "react";
import { StadiumLights } from "@/components/sports/stadium-lights";
import { CricketAtmosphere } from "@/components/sports/cricket-atmosphere";

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

export default function LoginScreen() {
  const router = useRouter();
  const { user, login, showAlert } = useAdminStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<"email" | "code" | "password">("email");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotCode, setForgotCode] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  const tintColor = useThemeColor({}, "tint");
  const cardBg = useThemeColor({}, "cardBackground");
  const pageBg = useThemeColor({}, "background");
  const mutedColor = useThemeColor({}, "muted");
  const borderColor = useThemeColor({}, "border");


  const handleLogin = async () => {
    if (!email || !password) {
      showAlert(
        "Required Fields",
        "Please enter both your email and password.",
        "warning",
      );
      return;
    }

    if (!termsAccepted) {
      showAlert(
        "Terms Required",
        "Please accept the Terms and Conditions to login.",
        "warning",
      );
      return;
    }

    setIsLoading(true);
    try {
      const userEmail = email.trim().toLowerCase();

      // Admin check
      if (
        userEmail === "admin@nm.com" &&
        password === "admin123"
      ) {
        login("admin", "Admin", "local-token", "admin-1");
        router.replace("/admin" as any);
        return;
      }

      const payload: any = {
        login: userEmail,
        password: password
      };

      const response = await fetch("https://refined-alone-causing.ngrok-free.dev/booking/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorData: any = {};
        let errorText = "";
        try {
          const text = await response.text();
          errorText = text;
          errorData = JSON.parse(text);
        } catch (e) {
          errorData = { rawText: errorText };
        }

        console.error("Backend Error Data:", errorData);

        let errorMessage = "Invalid credentials. Please try again.";
        if (errorData.message) errorMessage = errorData.message;
        else if (errorData.error) errorMessage = errorData.error;
        else if (errorData.detail) errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        else if (Object.keys(errorData).length > 0) errorMessage = JSON.stringify(errorData);

        showAlert("Login Failed", errorMessage, "error");
        return;
      }

      const responseData = await response.json();

      // Successful login
      const role = responseData.role || responseData.user?.role || "customer";
      const userId = responseData.user_id || responseData.id || responseData.user?.id || Math.floor(Math.random() * 10000);
      const userName = responseData.full_name || responseData.user?.full_name || userEmail.split("@")[0];
      const token = responseData.token || responseData.access || "local-token";

      await AsyncStorage.setItem("auth_token", token);
      await AsyncStorage.setItem(
        "nm_user",
        JSON.stringify({
          id: userId,
          email: userEmail,
          role,
          full_name: userName,
        }),
      );

      login(role, userName, token, userId);
      router.replace("/(tabs)");

    } catch (error: any) {
      console.error("Login Error:", error);
      showAlert(
        "Error",
        "Could not login locally. Please try again.",
        "error",
      );
    } finally {
      setIsLoading(false);
    }

  };

  const handleForgotPasswordSendCode = async () => {
    if (!forgotEmail) {
      showAlert("Required", "Please enter your registered email address.", "warning");
      return;
    }

    setIsForgotLoading(true);
    try {
      const response = await fetch("https://refined-alone-causing.ngrok-free.dev/booking/forgot-password/send-code/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() }),
      });

      if (response.ok) {
        setForgotStep("code");
      } else {
        const errorData = await response.json().catch(() => ({}));
        showAlert("Failed", errorData.message || errorData.error || "Could not send verification code.", "error");
      }
    } catch (e) {
      showAlert("Error", "Network error. Please try again later.", "error");
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleForgotPasswordVerifyCode = async () => {
    if (!forgotCode) {
      showAlert("Required", "Please enter the verification code.", "warning");
      return;
    }

    setIsForgotLoading(true);
    try {
      const response = await fetch("https://refined-alone-causing.ngrok-free.dev/booking/forgot-password/verify-code/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase(), code: forgotCode }),
      });

      if (response.ok) {
        setForgotStep("password");
      } else {
        const errorData = await response.json().catch(() => ({}));
        showAlert("Failed", errorData.message || errorData.error || "Invalid code.", "error");
      }
    } catch (e) {
      showAlert("Error", "Network error. Please try again later.", "error");
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleForgotPasswordReset = async () => {
    if (!forgotNewPassword) {
      showAlert("Required", "Please enter a new password.", "warning");
      return;
    }

    setIsForgotLoading(true);
    try {
      const response = await fetch("https://refined-alone-causing.ngrok-free.dev/booking/forgot-password/reset/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail.trim().toLowerCase(),
          code: forgotCode,
          new_password: forgotNewPassword
        }),
      });

      if (response.ok) {
        showAlert("Success", "Your password has been successfully reset. Please log in.", "success");
        setShowForgotPassword(false);
        setForgotStep("email");
        setForgotEmail("");
        setForgotCode("");
        setForgotNewPassword("");
      } else {
        const errorData = await response.json().catch(() => ({}));
        showAlert("Failed", errorData.message || errorData.error || "Failed to reset password.", "error");
      }
    } catch (e) {
      showAlert("Error", "Network error. Please try again later.", "error");
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: pageBg }}>
      <ThemedView style={[styles.container, { backgroundColor: "transparent" }]}>
        <Stack.Screen options={{ headerShown: false }} />

        {/* Background Atmosphere */}
        <StadiumLights />
        <CricketAtmosphere />
        <View style={styles.backgroundOverlay} pointerEvents="none" />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.flex}
        >
          <View
            style={styles.header}
          >
            <Pressable onLongPress={() => router.push("/auth/admin-login")}>
              <View
                style={[
                  styles.logoContainer,
                  { backgroundColor: "rgba(0,0,0,0.3)" },
                ]}
              >
                <Image
                  source={require("../../assets/images/nm_greens_new_logo.png")}
                  style={{ width: 110, height: 110 }}
                  resizeMode="contain"
                />
              </View>
            </Pressable>
            <View>
              <ThemedText type="title" style={styles.title}>
                NM Greens
              </ThemedText>
              <ThemedText style={[styles.subtitle, { color: mutedColor }]}>
                Elevate your game today.
              </ThemedText>
            </View>
          </View>

          <View
            style={styles.form}
          >
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: hexToRgba(cardBg, 0.6),
                  borderColor:
                    focusedInput === "email"
                      ? tintColor
                      : "rgba(128, 128, 128, 0.1)",
                },
              ]}
            >
              <Ionicons
                name="person-outline"
                size={20}
                color={focusedInput === "email" ? tintColor : mutedColor}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: useThemeColor({}, "text") }]}
                placeholder="Email or Phone Number"
                placeholderTextColor={mutedColor}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedInput("email")}
                onBlur={() => setFocusedInput(null)}
                keyboardType="default"
                autoCapitalize="none"
              />
            </View>

            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: hexToRgba(cardBg, 0.6),
                  borderColor:
                    focusedInput === "password"
                      ? tintColor
                      : "rgba(128, 128, 128, 0.1)",
                },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={focusedInput === "password" ? tintColor : mutedColor}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: useThemeColor({}, "text") }]}
                placeholder="Password"
                placeholderTextColor={mutedColor}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedInput("password")}
                onBlur={() => setFocusedInput(null)}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={mutedColor}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotPassword} onPress={() => setShowForgotPassword(true)}>
              <ThemedText
                style={{ color: tintColor, fontSize: 13, fontWeight: "600" }}
              >
                Forgot Password?
              </ThemedText>
            </TouchableOpacity>

            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24, paddingHorizontal: 4 }}>
              <TouchableOpacity onPress={() => setTermsAccepted(!termsAccepted)} style={{ marginRight: 10 }}>
                <Ionicons name={termsAccepted ? "checkbox" : "square-outline"} size={22} color={tintColor} />
              </TouchableOpacity>
              <View style={{ flexDirection: "row", flexWrap: "wrap", flex: 1, alignItems: "center", marginTop: 2 }}>
                <ThemedText style={{ fontSize: 13, color: mutedColor }}>I agree to the </ThemedText>
                <TouchableOpacity onPress={() => setShowTerms(true)}>
                  <ThemedText style={{ fontSize: 13, color: tintColor, fontWeight: "700", textDecorationLine: "underline" }}>Terms and Conditions</ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            <Pressable
              onPress={() => handleLogin()}
              disabled={isLoading || !termsAccepted}
            >
              <View
                style={[
                  styles.loginButton,
                  { backgroundColor: (!isLoading && termsAccepted) ? tintColor : hexToRgba(tintColor, 0.5) },
                ]}
              >
                <ThemedText style={styles.buttonText}>
                  {isLoading ? "SIGNING IN..." : "SIGN IN"}
                </ThemedText>
                {!isLoading && (
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color="#fff"
                    style={{ marginLeft: 8 }}
                  />
                )}
              </View>
            </Pressable>
          </View>

          <View
            style={styles.footer}
          >
            <ThemedText style={[styles.footerText, { color: mutedColor }]}>
              New to NM Greens?{" "}
            </ThemedText>
            <TouchableOpacity
              onPress={() => router.push("/auth/register" as any)}
            >
              <ThemedText style={{ color: tintColor, fontWeight: "800" }}>
                Create account
              </ThemedText>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        <Modal
          visible={showTerms}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowTerms(false)}
        >
          <ThemedView style={{ flex: 1, backgroundColor: pageBg }}>
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "rgba(128,128,128,0.1)" }}>
                <ThemedText type="subtitle">Terms and Conditions</ThemedText>
                <TouchableOpacity onPress={() => setShowTerms(false)}>
                  <Ionicons name="close-circle" size={28} color={tintColor} />
                </TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={{ padding: 20 }}>
                <ThemedText style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>1. Acceptance of Terms</ThemedText>
                <ThemedText style={{ marginBottom: 20, lineHeight: 22, color: mutedColor }}>
                  By accessing and using NM Greens App, you accept and agree to be bound by the terms and provision of this agreement.
                </ThemedText>

                <ThemedText style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>2. Bookings & Payments</ThemedText>
                <ThemedText style={{ marginBottom: 20, lineHeight: 22, color: mutedColor }}>
                  All bookings made through the app are subject to availability. Payments are processed securely. NM Greens reserves the right to cancel bookings in case of unforeseen circumstances.
                </ThemedText>

                <ThemedText style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>3. Cancellation Policy</ThemedText>
                <ThemedText style={{ marginBottom: 20, lineHeight: 22, color: mutedColor }}>
                  Users may cancel bookings up to 24 hours in advance for a full refund to their wallet. Cancellations within 24 hours may incur a penalty fee.
                </ThemedText>

                <ThemedText style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>4. Ground Rules</ThemedText>
                <ThemedText style={{ marginBottom: 40, lineHeight: 22, color: mutedColor }}>
                  Players must adhere to all ground rules posted at the facility. We reserve the right to ban users who violate code of conduct.
                </ThemedText>
              </ScrollView>
            </SafeAreaView>
          </ThemedView>
        </Modal>

        {/* Forgot Password Modal */}
        <Modal
          visible={showForgotPassword}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowForgotPassword(false)}
        >
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.6)" }}>
            <ThemedView style={{ width: "85%", backgroundColor: pageBg, borderRadius: 24, padding: 24, elevation: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <ThemedText type="subtitle">Reset Password</ThemedText>
                <TouchableOpacity onPress={() => { setShowForgotPassword(false); setForgotStep("email"); }}>
                  <Ionicons name="close-circle" size={28} color={mutedColor} />
                </TouchableOpacity>
              </View>

              {forgotStep === "email" && (
                <>
                  <ThemedText style={{ color: mutedColor, marginBottom: 20 }}>
                    Enter the email or phone number associated with your account and we'll send you a verification code to reset your password.
                  </ThemedText>

                  <View
                    style={[
                      styles.inputWrapper,
                      { backgroundColor: hexToRgba(cardBg, 0.6), borderColor: "rgba(128, 128, 128, 0.1)", marginBottom: 24 }
                    ]}
                  >
                    <Ionicons name="person-outline" size={20} color={mutedColor} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: useThemeColor({}, "text") }]}
                      placeholder="Email or Phone Number"
                      placeholderTextColor={mutedColor}
                      value={forgotEmail}
                      onChangeText={setForgotEmail}
                      keyboardType="default"
                      autoCapitalize="none"
                    />
                  </View>

                  <TouchableOpacity
                    onPress={handleForgotPasswordSendCode}
                    disabled={isForgotLoading}
                    style={{
                      backgroundColor: tintColor,
                      height: 56,
                      borderRadius: 16,
                      justifyContent: "center",
                      alignItems: "center"
                    }}
                  >
                    <ThemedText style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
                      {isForgotLoading ? "SENDING..." : "SEND VERIFICATION CODE"}
                    </ThemedText>
                  </TouchableOpacity>
                </>
              )}

              {forgotStep === "code" && (
                <>
                  <ThemedText style={{ color: mutedColor, marginBottom: 20 }}>
                    Enter the verification code sent to {forgotEmail}.
                  </ThemedText>

                  <View
                    style={[
                      styles.inputWrapper,
                      { backgroundColor: hexToRgba(cardBg, 0.6), borderColor: "rgba(128, 128, 128, 0.1)", marginBottom: 24 }
                    ]}
                  >
                    <Ionicons name="keypad-outline" size={20} color={mutedColor} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: useThemeColor({}, "text") }]}
                      placeholder="Verification Code"
                      placeholderTextColor={mutedColor}
                      value={forgotCode}
                      onChangeText={setForgotCode}
                      keyboardType="number-pad"
                    />
                  </View>

                  <TouchableOpacity
                    onPress={handleForgotPasswordVerifyCode}
                    disabled={isForgotLoading}
                    style={{
                      backgroundColor: tintColor,
                      height: 56,
                      borderRadius: 16,
                      justifyContent: "center",
                      alignItems: "center"
                    }}
                  >
                    <ThemedText style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
                      {isForgotLoading ? "VERIFYING..." : "VERIFY CODE"}
                    </ThemedText>
                  </TouchableOpacity>
                </>
              )}

              {forgotStep === "password" && (
                <>
                  <ThemedText style={{ color: mutedColor, marginBottom: 20 }}>
                    Enter your new password.
                  </ThemedText>

                  <View
                    style={[
                      styles.inputWrapper,
                      { backgroundColor: hexToRgba(cardBg, 0.6), borderColor: "rgba(128, 128, 128, 0.1)", marginBottom: 24 }
                    ]}
                  >
                    <Ionicons name="lock-closed-outline" size={20} color={mutedColor} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: useThemeColor({}, "text") }]}
                      placeholder="New Password"
                      placeholderTextColor={mutedColor}
                      value={forgotNewPassword}
                      onChangeText={setForgotNewPassword}
                      secureTextEntry={true}
                    />
                  </View>

                  <TouchableOpacity
                    onPress={handleForgotPasswordReset}
                    disabled={isForgotLoading}
                    style={{
                      backgroundColor: tintColor,
                      height: 56,
                      borderRadius: 16,
                      justifyContent: "center",
                      alignItems: "center"
                    }}
                  >
                    <ThemedText style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
                      {isForgotLoading ? "UPDATING..." : "UPDATE PASSWORD"}
                    </ThemedText>
                  </TouchableOpacity>
                </>
              )}
            </ThemedView>
          </KeyboardAvoidingView>
        </Modal>

      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  flex: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: "center",
  },

  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoContainer: {
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 20,
  },
  title: {
    fontSize: 38,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -1,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 4,
    fontWeight: "500",
  },
  form: {
    gap: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 60,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    gap: 12,
  },
  inputIcon: {
    width: 20,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    fontWeight: "600",
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 8,
    paddingRight: 4,
  },
  loginButton: {
    height: 60,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 2,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 40,
  },
  footerText: {},
});
