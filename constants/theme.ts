/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#1E293B",
    background: "#FFFBED", // Champagne/Cream
    cardBackground: "#FFFFFF",
    tint: "#C5A059", // Elegant Gold
    icon: "#64748B",
    tabIconDefault: "#94A3B8",
    tabIconSelected: "#C5A059",
    muted: "#64748B",
    accent: "#FEBA02", // Brand Gold
    brandGold: "#FEBA02",
    brandSilver: "#E0E0E0",
    border: "rgba(128, 128, 128, 0.15)",
    // Sports Specific
    turf: "#138808",
    court: "#C5A059",
    available: "#94A3B8", // Silver/Slate for neutral availability
    booked: "#EF4444",
    locked: "#FEBA02",
    selected: "#C5A059",
    tabBarBackground: "#FFFFFF",
  },
  dark: {
    text: "#F8FAFC",
    background: "#050505", // Near Black for better depth
    cardBackground: "#141414", // Slightly lighter black for cards
    tint: "#D4AF37", // Luxurious Metallic Gold
    icon: "#A0AEC0",
    tabIconDefault: "#4A5568",
    tabIconSelected: "#D4AF37", // Metallic Gold
    muted: "#718096",
    accent: "#D4AF37", // Metallic Gold
    brandGold: "#D4AF37", // Metallic Gold
    brandSilver: "#E2E8F0",
    border: "rgba(212, 175, 55, 0.15)", // Gold tinted borders
    // Sports Specific
    turf: "#138808",
    court: "#D4AF37",
    available: "#D4AF37", // Gold for availability
    booked: "#333333", // Dark gray for booked
    locked: "#D4AF37",
    selected: "#D4AF37",
    tabBarBackground: "#000000", // Pure Black
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
