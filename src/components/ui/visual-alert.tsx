import React, { useEffect } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View, Dimensions } from 'react-native';
import Animated, { 
  FadeIn, 
  FadeOut, 
  ZoomIn, 
  ZoomOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import * as Haptics from 'expo-haptics';
import { useAdminStore } from '@/store/adminStore';

const { width } = Dimensions.get('window');

export const VisualAlert = () => {
  const { alertConfig, hideAlert } = useAdminStore();
  const brandGold = useThemeColor({}, 'brandGold');
  const cardBg = useThemeColor({}, 'cardBackground');
  
  const { visible, title, message, type } = alertConfig;

  useEffect(() => {
    if (visible) {
      if (type === 'error' ) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else if (type === 'success') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
  }, [visible, type]);

  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return { name: 'checkmark-circle' as const, color: '#10B981', lib: 'Ionicons' as const };
      case 'warning': return { name: 'alert-circle' as const, color: brandGold, lib: 'Ionicons' as const };
      case 'error': return { name: 'alert-circle' as const, color: '#F87171', lib: 'Ionicons' as const };
      default: return { name: 'information-circle' as const, color: brandGold, lib: 'Ionicons' as const };
    }
  };

  const iconInfo = getIcon();

  return (
    <Modal transparent visible={visible} onRequestClose={hideAlert} animationType="none">
      <Animated.View 
        style={styles.overlay}
      >
        <Animated.View 
          style={[styles.modalContent, { backgroundColor: '#000000', borderColor: brandGold + '80' }]}
        >
          {/* Decorative Gold Glow */}
          <View style={[styles.glow, { backgroundColor: brandGold }]} />

          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: iconInfo.color + '15' }]}>
              {iconInfo.lib === 'Ionicons' ? (
                <Ionicons name={iconInfo.name} size={40} color={iconInfo.color} />
              ) : (
                <MaterialCommunityIcons name={iconInfo.name as any} size={40} color={iconInfo.color} />
              )}
            </View>
          </View>

          <ThemedText style={[styles.title, { color: brandGold }]}>{title}</ThemedText>
          <ThemedText style={styles.message}>{message}</ThemedText>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: brandGold }]}
            onPress={hideAlert}
            activeOpacity={0.8}
          >
            <ThemedText style={[styles.buttonText, { color: '#000000' }]}>CONTINUE</ThemedText>
          </TouchableOpacity>

        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -50,
    width: 200,
    height: 100,
    borderRadius: 50,
    opacity: 0.1,
    transform: [{ scale: 2 }],
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#94A3B8',
    lineHeight: 24,
    marginBottom: 32,
    fontWeight: '500',
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
});
