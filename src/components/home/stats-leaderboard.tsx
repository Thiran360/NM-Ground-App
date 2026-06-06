import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { MOCK_LEADERBOARD } from '@/utils/sports-data';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';

export const StatsLeaderboard = () => {
  const tintColor = useThemeColor({}, 'tint');
  const cardBg = useThemeColor({}, 'cardBackground');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="subtitle">Top Performers</ThemedText>
        <ThemedText style={[styles.viewAll, { color: tintColor }]}>View All</ThemedText>
      </View>

      {MOCK_LEADERBOARD.map((player, index) => (
        <View 
          key={player.id}
          style={[styles.playerCard, { backgroundColor: cardBg }]}
        >
          <View style={styles.rankBox}>
            <ThemedText style={styles.rankText}>#{index + 1}</ThemedText>
          </View>
          
          <Image source={player.avatar} style={styles.avatar} />
          
          <View style={styles.info}>
            <ThemedText style={styles.playerName}>{player.name}</ThemedText>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <ThemedText style={styles.statVal}>{player.runs}</ThemedText>
                <ThemedText style={styles.statLabel}>Runs</ThemedText>
              </View>

              <View style={styles.stat}>
                <ThemedText style={styles.statVal}>{player.wickets}</ThemedText>
                <ThemedText style={styles.statLabel}>Wickets</ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.ratingBox}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <ThemedText style={styles.ratingText}>{player.rating}</ThemedText>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '600',
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  rankBox: {
    width: 32,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '900',
    opacity: 0.3,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 6,
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    opacity: 0.5,
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '800',
  },
});