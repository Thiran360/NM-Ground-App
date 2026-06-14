import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { Platform, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAdminStore } from "@/store/admin-store";
import { BrandAtmosphere } from "@/components/brand-atmosphere";
import { VisualAlert } from "@/components/ui/visual-alert";
import { LogBox } from "react-native";

LogBox.ignoreLogs(["Unable to activate keep awake"]);

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { user, isInitialized } = useAdminStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Silence 'keep-awake' error on Web
    if (Platform.OS === "web") {
      const originalHandler = window.onunhandledrejection;
      window.onunhandledrejection = (event) => {
        if (event.reason?.message?.includes("Unable to activate keep awake")) {
          event.preventDefault();
          return;
        }
        if (originalHandler) originalHandler.call(window, event);
      };
    }
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    // Check route groups
    const inAuthGroup = segments[0] === "auth";
    const isAdminGroup = segments[0] === "admin";

    const timer = setTimeout(() => {
      if (!user && !inAuthGroup) {
        router.replace("/auth/login");
      } else if (user) {
        if (user.role === "admin" && !isAdminGroup) {
          router.replace("/admin");
        } else if (user.role === "user" && (inAuthGroup || isAdminGroup)) {
          router.replace("/(tabs)");
        }
      }
    }, 1);

    return () => clearTimeout(timer);
  }, [user, segments, isInitialized]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <SafeAreaProvider>
        <BrandAtmosphere />
        <View style={{ flex: 1 }}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="auth/login" options={{ headerShown: false }} />
            <Stack.Screen name="auth/register" options={{ headerShown: false }} />
            <Stack.Screen
              name="auth/admin-login"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="modal"
              options={{ presentation: "modal", title: "Modal" }}
            />
          </Stack>
          <VisualAlert />
          <StatusBar style="light" />
        </View>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
