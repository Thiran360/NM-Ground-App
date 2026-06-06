import React from 'react';
import { StyleSheet, View, ImageBackground, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface Props {
  id: string;
  name: string;
  location: string;
  rating: number;
  imageUrl: any;
  onPress: () => void;
  index: number;
}

export const VenueHighlightCard = ({ name, location, rating, imageUrl, onPress, index }: Props) => {
  const tintColor = useThemeColor({}, 'tint');

  return (
    <Animated.View 
      entering={FadeInUp.delay(index * 150).duration(600)}
      style={styles.container}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        <ImageBackground source={imageUrl} style={styles.image} imageStyle={{ borderRadius: 24 }}>
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.gradient}
          />
          <View style={styles.badge}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <ThemedText style={styles.ratingText}>{rating}</ThemedText>
          </View>
          <View style={styles.content}>
            <ThemedText type="subtitle" style={styles.name}>{name}</ThemedText>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={12} color="#ccc" />
              <ThemedText style={styles.location}>{location}</ThemedText>
            </View>
            <View style={[styles.bookButton, { backgroundColor: tintColor }]}>
              <ThemedText style={styles.bookText}>Book Now</ThemedText>
            </View>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 260,
    height: 320,
    marginRight: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  image: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    borderRadius: 24,
  },
  badge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  ratingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
    gap: 4,
  },
  name: {
    color: '#fff',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  location: {
    color: '#ccc',
    fontSize: 12,
  },
  bookButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  bookText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});