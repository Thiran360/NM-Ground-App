import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { SlotStatus } from '@/hooks/useBookingLock';
import React from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence, 
  withTiming 
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

interface SportsSlotProps {
  id: string;
  label: string;
  status: SlotStatus;
  price: number;
  onPress: (id: string) => void;
  variant?: 'hourly' | 'session';
  duration?: number;
}

export const SportsSlot = ({ id, label, status, price, onPress, variant = 'hourly', duration }: SportsSlotProps) => {
  const isAvailable = status === 'available';
  const isSelected = status === 'selected';
  const isBooked = status === 'booked';
  const isLocked = status === 'locked';

  const availableColor = useThemeColor({}, 'available');
  const bookedColor = useThemeColor({}, 'booked');
  const lockedColor = useThemeColor({}, 'locked');
  const selectedColor = useThemeColor({}, 'selected');
  const backgroundColor = useThemeColor({}, 'cardBackground');

  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value }
    ],
  }));

  let borderColor = availableColor;
  let statusText = 'Available';

  if (isBooked) {
    borderColor = bookedColor;
    statusText = 'Sold Out';
  } else if (isLocked) {
    borderColor = lockedColor;
    statusText = 'Locked';
  } else if (isSelected) {
    borderColor = selectedColor;
    statusText = 'Selected';
  }

  const handlePress = () => {
    if (isAvailable || isSelected) {
      scale.value = withSequence(withSpring(1.05), withSpring(1));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress(id);
    } else {
      // Shake animation for unavailable
      translateX.value = withSequence(
        withTiming(-5, { duration: 50 }),
        withTiming(5, { duration: 50 }),
        withTiming(-5, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  if (variant === 'session') {
    const sessionIcon = label.includes('Morning') ? 'sunny' : label.includes('Afternoon') ? 'partly-sunny' : 'moon';
    const durationText = duration ? `${duration} hrs` : '';
    return (
      <Pressable style={styles.sessionPressable} onPress={handlePress}>
        <Animated.View
          style={[
            styles.sessionContainer,
            animatedStyle,
            {
              borderColor,
              backgroundColor: isSelected ? selectedColor + '22' : backgroundColor,
              opacity: (isBooked || isLocked) ? 0.55 : 1,
              borderWidth: isSelected ? 2.5 : 1.5,
            }
          ]}
        >
          {/* Left: icon + label */}
          <View style={styles.sessionLeft}>
            <View style={[styles.sessionIconBox, { backgroundColor: borderColor + '20' }]}>
              <Ionicons name={sessionIcon as any} size={22} color={borderColor} />
            </View>
            <View>
              <ThemedText type="defaultSemiBold" style={styles.sessionLabel}>{label}</ThemedText>
              {durationText ? (
                <ThemedText style={styles.sessionDuration}>{durationText} block</ThemedText>
              ) : null}
            </View>
          </View>

          {/* Right: price + status */}
          <View style={styles.sessionRight}>
            <ThemedText style={[styles.sessionPrice, { color: borderColor }]}>₹{price}</ThemedText>
            <View style={[styles.sessionStatusBadge, { backgroundColor: borderColor + '20' }]}>
              {(isBooked || isLocked) ? (
                <Ionicons name="lock-closed" size={11} color={borderColor} />
              ) : (
                <View style={[styles.statusDot, { backgroundColor: borderColor }]} />
              )}
              <ThemedText style={[styles.sessionStatusText, { color: borderColor }]}>{statusText}</ThemedText>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable 
      style={{ width: '47%', marginHorizontal: '1.5%', marginBottom: 12 }} 
      onPress={handlePress}
    >
      <Animated.View
        style={[
          styles.container,
          animatedStyle,
          { 
            borderColor, 
            backgroundColor: isSelected ? selectedColor + '33' : backgroundColor,
            opacity: (isBooked || isLocked) ? 0.6 : 1,
            height: 64,
            justifyContent: 'center',
            paddingHorizontal: 16
          },
        ]}
      >
        <View style={styles.header}>
          <ThemedText type="defaultSemiBold" style={{ fontSize: 16, opacity: (isBooked || isLocked) ? 0.5 : 1 }}>{label}</ThemedText>
        </View>

        <View style={styles.footer}>
          <ThemedText style={{ fontSize: 13, fontWeight: '700', color: borderColor, opacity: (isBooked || isLocked) ? 0.6 : 1 }}>₹{price}</ThemedText>
          {isSelected && (
            <Ionicons name="checkmark-circle" size={16} color={selectedColor} />
          )}
          {(isBooked || isLocked) && (
            <Ionicons name="lock-closed" size={14} color={borderColor} />
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 0,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  // Session variant styles
  sessionPressable: {
    width: '100%',
    marginBottom: 12,
  },
  sessionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  sessionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  sessionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  sessionDuration: {
    fontSize: 12,
    color: '#94A3B8',
  },
  sessionRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  sessionPrice: {
    fontSize: 18,
    fontWeight: '900',
  },
  sessionStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  sessionStatusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});