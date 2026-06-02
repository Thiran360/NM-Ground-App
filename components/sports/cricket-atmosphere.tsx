import React, { useEffect } from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeColor } from "@/hooks/use-theme-color";

const { width, height } = Dimensions.get("window");

const Particle = ({ delay }: { delay: number }) => {
  const brandGold = useThemeColor({}, "brandGold");
  const translateY = useSharedValue(height);
  const translateX = useSharedValue(Math.random() * width);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(withTiming(0.4, { duration: 2000 }), -1, true),
    );
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(-100, {
          duration: 8000 + Math.random() * 4000,
          easing: Easing.linear,
        }),
        -1,
        false,
      ),
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[styles.particle, { backgroundColor: brandGold }, animatedStyle]}
    />
  );
};

const FloatingBall = ({
  delay,
  startX,
  startY,
  icon,
}: {
  delay: number;
  startX: number;
  startY: number;
  icon: string;
}) => {
  const brandGold = useThemeColor({}, "brandGold");
  const float = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    float.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );
    rotation.value = withRepeat(
      withTiming(360, { duration: 15000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(float.value, [0, 1], [0, -30]) },
      { translateX: interpolate(float.value, [0, 1], [0, 15]) },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: interpolate(float.value, [0, 1], [0.1, 0.25]),
  }));

  return (
    <Animated.View
      style={[
        styles.floatingIcon,
        { left: startX, top: startY },
        animatedStyle,
      ]}
    >
      <MaterialCommunityIcons name={icon as any} size={40} color={brandGold} />
    </Animated.View>
  );
};

export const CricketAtmosphere = () => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Drifting Dust Particles */}
      {[...Array(15)].map((_, i) => (
        <Particle key={`p-${i}`} delay={i * 600} />
      ))}

      {/* Floating Gear Silhouettes */}
      <FloatingBall
        icon="cricket"
        delay={0}
        startX={width * 0.1}
        startY={height * 0.2}
      />
      <FloatingBall
        icon="soccer"
        delay={1500}
        startX={width * 0.7}
        startY={height * 0.15}
      />
      <FloatingBall
        icon="trophy-outline"
        delay={3000}
        startX={width * 0.8}
        startY={height * 0.7}
      />
      <FloatingBall
        icon="cricket"
        delay={5000}
        startX={width * 0.2}
        startY={height * 0.8}
      />

      {/* Atmospheric Vignette */}
      <View style={styles.vignette} />
    </View>
  );
};

const styles = StyleSheet.create({
  particle: {
    position: "absolute",
    width: 3,
    height: 3,
    borderRadius: 1.5,
    shadowColor: "#FEBA02",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  floatingIcon: {
    position: "absolute",
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    // In a real app we might use a radial gradient here,
    // but for now we rely on the existing background overlay in LoginScreen.
  },
});
