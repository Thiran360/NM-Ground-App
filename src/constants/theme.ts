/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#1E293B',
    background: '#FFFBED', // Champagne/Cream
    cardBackground: '#FFFFFF',
    tint: '#C5A059', // Elegant Gold
    icon: '#64748B',
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#C5A059',
    muted: '#64748B',
    accent: '#FEBA02', // Brand Gold
    brandGold: '#FEBA02',
    brandSilver: '#E0E0E0',
    border: 'rgba(128, 128, 128, 0.15)',
    // Sports Specific
    turf: '#138808', 
    court: '#C5A059',
    available: '#94A3B8', // Silver/Slate for neutral availability
    booked: '#EF4444',
    locked: '#FEBA02',
    selected: '#C5A059',
    tabBarBackground: '#FFFFFF',
  },
  dark: {
    text: '#F8FAFC',
    background: '#000000', // Pure Black
    cardBackground: '#111111', // Matte Black
    tint: '#FEBA02', // Brand Gold
    icon: '#94A3B8',
    tabIconDefault: '#64748B',
    tabIconSelected: '#FEBA02',
    muted: '#94A3B8',
    accent: '#FEBA02', // Brand Gold
    brandGold: '#FEBA02',
    brandSilver: '#E0E0E0',
    border: 'rgba(255, 255, 255, 0.1)',
    // Sports Specific
    turf: '#138808',
    court: '#FEBA02',
    available: '#E0E0E0', // Bright Silver for availability in dark mode
    booked: '#F87171',
    locked: '#FEBA02',
    selected: '#FEBA02',
    tabBarBackground: '#050505', // Near Black
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
