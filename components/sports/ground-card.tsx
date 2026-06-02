import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { Image } from "expo-image";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

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

interface GroundCardProps {
  name: string;
  type: string;
  rating: number;
  imageUrl: string | number | { uri: string };
  location: string;
  onPress?: () => void;
  isSelected?: boolean;
}

export const GroundCard = ({
  name,
  type,
  rating,
  imageUrl,
  location,
  onPress,
  isSelected,
}: GroundCardProps) => {
  const tintColor = useThemeColor({}, "tint");
  const accentColor = useThemeColor({}, "accent");
  const mutedColor = useThemeColor({}, "muted");
  const borderColor = useThemeColor({}, "border");
  const cardBg = useThemeColor({}, "cardBackground");
  // Resolve image source: string → uri object, number (local require) → pass as-is, object → pass as-is
  const imageSource =
    typeof imageUrl === "string"
      ? { uri: imageUrl }
      : typeof imageUrl === "number"
        ? imageUrl
        : imageUrl;

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => (scale.value = withSpring(0.96))}
      onPressOut={() => (scale.value = withSpring(1))}
      style={{ marginBottom: 16 }}
    >
      <Animated.View
        style={[
          styles.container,
          animatedStyle,
          {
            backgroundColor: cardBg,
            borderColor: isSelected ? tintColor : borderColor,
            borderWidth: isSelected ? 2 : 1,
            elevation: isSelected ? 8 : 2,
            shadowColor: isSelected ? tintColor : "#000",
            shadowOpacity: isSelected ? 0.3 : 0.05,
            shadowRadius: isSelected ? 12 : 6,
          },
        ]}
      >
        {imageUrl ? (
          <Image
            source={imageSource}
            style={styles.image}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View
            style={[
              styles.imagePlaceholder,
              { backgroundColor: hexToRgba(tintColor, 0.13) },
            ]}
          >
            <MaterialCommunityIcons
              name="cricket"
              size={40}
              color={tintColor}
            />
          </View>
        )}

        {/* Overlay Info */}
        <View style={styles.overlayContainer}>
          <View
            style={[
              styles.glassInfo,
              { backgroundColor: hexToRgba(cardBg, 0.85) },
            ]}
          >
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.cardName}>{name}</ThemedText>
                <ThemedText style={[styles.type, { color: mutedColor }]}>
                  {type}
                </ThemedText>
              </View>
              <View
                style={[
                  styles.ratingContainer,
                  { backgroundColor: hexToRgba(accentColor, 0.15) },
                ]}
              >
                <Ionicons name="star" size={12} color={accentColor} />
                <ThemedText style={[styles.ratingText, { color: accentColor }]}>
                  {rating}
                </ThemedText>
              </View>
            </View>

            <View style={styles.footerRow}>
              <View style={styles.locationContainer}>
                <Ionicons
                  name="location-outline"
                  size={12}
                  color={mutedColor}
                />
                <ThemedText
                  style={[styles.locationText, { color: mutedColor }]}
                >
                  {location}
                </ThemedText>
              </View>
              {isSelected && (
                <View
                  style={[styles.selectedBadge, { backgroundColor: tintColor }]}
                >
                  <Ionicons name="checkmark-circle" size={14} color="#fff" />
                  <ThemedText style={styles.selectedLabel}>SELECTED</ThemedText>
                </View>
              )}
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    height: 180,
  },
  image: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
  },
  overlayContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  glassInfo: {
    margin: 12,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  cardName: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  type: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: -2,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "900",
    marginLeft: 3,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  locationText: {
    fontSize: 11,
    marginLeft: 4,
    fontWeight: "500",
  },
  selectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  selectedLabel: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
