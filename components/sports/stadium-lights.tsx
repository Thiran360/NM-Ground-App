import React, { useEffect } from "react";
import { StyleSheet, View, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { useThemeColor } from "@/hooks/use-theme-color";

export const StadiumLights = () => {
  const brandGold = useThemeColor({}, "brandGold");

  const opacity1 = useSharedValue(0.1);
  const opacity2 = useSharedValue(0.1);
  const opacity3 = useSharedValue(0.1);

  const rotate1 = useSharedValue(45);
  const rotate2 = useSharedValue(0);
  const rotate3 = useSharedValue(-45);

  useEffect(() => {
    opacity1.value = withRepeat(
      withTiming(0.4, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    opacity2.value = withDelay(
      500,
      withRepeat(
        withTiming(0.4, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );
    opacity3.value = withDelay(
      1000,
      withRepeat(
        withTiming(0.4, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );

    rotate1.value = withRepeat(
      withTiming(55, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    rotate2.value = withRepeat(
      withTiming(10, { duration: 7000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    rotate3.value = withRepeat(
      withTiming(-55, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const style1 = useAnimatedStyle(() => ({
    opacity: opacity1.value,
    transform: [{ rotate: `${rotate1.value}deg` }],
  }));
  const style2 = useAnimatedStyle(() => ({
    opacity: opacity2.value,
    transform: [{ rotate: `${rotate2.value}deg` }, { translateX: -150 }],
  }));
  const style3 = useAnimatedStyle(() => ({
    opacity: opacity3.value,
    transform: [{ rotate: `${rotate3.value}deg` }],
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View
        style={[
          styles.light,
          styles.lightLeft,
          style1,
          { backgroundColor: brandGold },
        ]}
      />
      <Animated.View
        style={[
          styles.light,
          styles.lightCenter,
          style2,
          { backgroundColor: brandGold },
        ]}
      />
      <Animated.View
        style={[
          styles.light,
          styles.lightRight,
          style3,
          { backgroundColor: brandGold },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  light: {
    position: "absolute",
    top: -100,
    width: 300,
    height: 400,
    borderRadius: 150,
    shadowColor: "#FEBA02",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 100,
    elevation: 20,
  },
  lightLeft: {
    left: -150,
  },
  lightCenter: {
    left: "50%",
    top: -150,
  },
  lightRight: {
    right: -150,
  },
});
