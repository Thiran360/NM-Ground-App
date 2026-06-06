import React from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface PolicyPopupProps {
  visible: boolean;
  message: string;
  onClose: () => void;
}

export function PolicyPopup({ visible, message, onClose }: PolicyPopupProps) {
  const brandGold = useThemeColor({}, 'brandGold');

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="none">
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.overlay}>
        <Animated.View entering={ZoomIn.duration(300).springify()} exiting={ZoomOut.duration(200)} style={[styles.modalContent, { backgroundColor: '#000000', borderColor: brandGold + '80' }]}>
          
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: brandGold + '15' }]}>
              <Ionicons name="lock-closed" size={32} color={brandGold} />
            </View>
          </View>

          <ThemedText style={[styles.title, { color: brandGold }]}>Timing Restricted</ThemedText>
          <ThemedText style={styles.message}>{message}</ThemedText>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: brandGold }]}
            onPress={onClose}
          >
            <ThemedText style={[styles.buttonText, { color: '#000000' }]}>Got It</ThemedText>
          </TouchableOpacity>

        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 10,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    color: '#D1D5DB',
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});