import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  withDelay,
  Easing,
  runOnJS
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface CelebrationOverlayProps {
  onFinish: () => void;
}

export const CelebrationOverlay = ({ onFinish }: CelebrationOverlayProps) => {
  const ballScale = useSharedValue(0);
  const ballY = useSharedValue(500);
  const textScale = useSharedValue(0);
  const opacity = useSharedValue(1);
  const bgScale = useSharedValue(1);

  useEffect(() => {
    // 0. Animate background image slowly
    bgScale.value = withTiming(1.2, { duration: 3000, easing: Easing.out(Easing.ease) });

    // 1. Ball hits the screen
    ballScale.value = withSpring(1.5, { damping: 10 });
    ballY.value = withTiming(-1000, { duration: 1500, easing: Easing.out(Easing.quad) });

    // 2. Sixer text appears
    textScale.value = withDelay(400, withSpring(1, { damping: 5 }));

    // 3. Haptics
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // 4. Fade out and finish
    opacity.value = withDelay(2500, withTiming(0, { duration: 500 }, () => {
      runOnJS(onFinish)();
    }));
  }, []);

  const bgStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bgScale.value }]
  }));

  const ballStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: ballScale.value },
      { translateY: ballY.value }
    ],
  }));

  const textStyle = useAnimatedStyle(() => ({
    transform: [{ scale: textScale.value }],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Animated.Image 
        source={require('../../assets/images/player_hitting_six.png')} 
        style={[styles.backgroundImage, bgStyle]}
        resizeMode="cover"
      />
      <View style={styles.overlay} />

      <Animated.View style={[styles.ball, ballStyle]}>
        <MaterialCommunityIcons name="cricket" size={80} color="#FFFFFF" />
      </Animated.View>
      
      <Animated.View style={[styles.textContainer, textStyle]}>
        <Text style={styles.sixerText}>SIXER!</Text>
        <Text style={styles.bookingText}>BOOKING SUCCESSFUL</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000', // Base black before image loads
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 35, 81, 0.7)', // Indian Blue translucent overlay
  },
  ball: {
    position: 'absolute',
    bottom: -100,
  },
  textContainer: {
    alignItems: 'center',
    zIndex: 2,
  },
  sixerText: {
    fontSize: 100,
    fontWeight: '900',
    color: '#FFD700', // Gold color for premium look
    fontStyle: 'normal',
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 6 },
    textShadowRadius: 15,
  },
  bookingText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 15,
    letterSpacing: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});