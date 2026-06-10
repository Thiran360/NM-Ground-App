import React, { useEffect } from "react";
import { StyleSheet, View, Dimensions, Platform } from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { useThemeColor } from "@/hooks/use-theme-color";

const { width, height } = Dimensions.get("window");

const Glitter = ({ index }: { index: number }) => {
  const x = Math.random() * width;
  const y = Math.random() * height;
  return <View style={[styles.glitter, { opacity: 0.8, left: x, top: y }]} />;
};

const Orb = ({ color, size, duration, delay, startX, startY }: any) => {
  return (
    <View
      style={[
        styles.orb,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          left: startX,
          top: startY,
          opacity: 0.15,
        }
      ]}
    />
  );
};

export const BrandAtmosphere = () => {
  const brandGold = useThemeColor({}, "brandGold");
  const brandSilver = useThemeColor({}, "brandSilver");
  const background = useThemeColor({}, "background");

  return (
    <View
      style={[styles.container, { backgroundColor: "#000000" }]}
      pointerEvents="none"
    >
      {/* Golden Orbs */}
      <Orb
        color={brandGold}
        size={width * 1.2}
        duration={12000}
        startX={-width * 0.4}
        startY={-height * 0.2}
      />
      <Orb
        color={brandGold}
        size={width * 0.8}
        duration={15000}
        startX={width * 0.5}
        startY={height * 0.4}
      />

      {/* Silver Sub-tones */}
      <Orb
        color={brandSilver}
        size={width * 0.6}
        duration={18000}
        startX={-width * 0.1}
        startY={height * 0.2}
      />

      {/* Glittering Gold Dust */}
      {[...Array(15)].map((_, i) => (
        <Glitter key={i} index={i} />
      ))}

      {/* Overlay to deepen the black */}
      <LinearGradient
        colors={["rgba(0,0,0,0.8)", "transparent", "rgba(0,0,0,0.9)"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    zIndex: -1,
  },
  orb: {
    position: "absolute",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 150,
    elevation: 20,
    ...Platform.select({
      web: {
        filter: "blur(120px)",
      },
    }),
  },
  glitter: {
    position: "absolute",
    width: 3,
    height: 3,
    backgroundColor: "#FEBA02",
    borderRadius: 1.5,
    shadowColor: "#FEBA02",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 5,
  },
});
