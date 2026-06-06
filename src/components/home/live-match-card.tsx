import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Match } from '@/utils/sports-data';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  match: Match;
  index: number;
}

export const LiveMatchCard = ({ match, index }: Props) => {
  const { width: screenWidth } = useWindowDimensions();
  const tintColor = useThemeColor({}, 'tint');
  const cardBg = useThemeColor({}, 'cardBackground');
  
  // Calculate dynamic width based on 20px margins on both sides
  const cardWidth = screenWidth - 40;

  if (!match.score) return null;

  return (
    <Animated.View 
      entering={FadeInRight.delay(index * 100).duration(500)}
      style={[styles.container, { backgroundColor: cardBg, width: cardWidth }]}
    >
      <LinearGradient
        colors={[tintColor + '25', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />
      <View style={styles.header}>
        <View style={styles.liveBadge}>
          <View style={[styles.liveDot, { backgroundColor: '#EF4444' }]} />
          <ThemedText style={styles.liveText}>LIVE</ThemedText>
        </View>
        <ThemedText style={styles.venueText}>{match.groundName}</ThemedText>
      </View>

      <View style={styles.scoreRow}>
        <View style={styles.teamInfo}>
          <ThemedText type="defaultSemiBold" style={styles.teamName} numberOfLines={1}>{match.score.teamA}</ThemedText>
          <View style={styles.scoreBox}>
            <ThemedText type="title" style={styles.runs}>{match.score.runsA}</ThemedText>
            <ThemedText style={styles.wickets}>/{match.score.wicketsA}</ThemedText>
          </View>
        </View>

        <View style={styles.vsContainer}>
          <View style={styles.vsLine} />
          <View style={styles.vsCircle}>
            <ThemedText style={styles.vsText}>VS</ThemedText>
          </View>
          <View style={styles.vsLine} />
        </View>

        <View style={[styles.teamInfo, { alignItems: 'flex-end' }]}>
          <ThemedText type="defaultSemiBold" style={[styles.teamName, { textAlign: 'right' }]} numberOfLines={1}>{match.score.teamB}</ThemedText>
          <View style={styles.scoreBox}>
            <ThemedText type="title" style={styles.runs}>{match.score.runsB}</ThemedText>
            <ThemedText style={styles.wickets}>/{match.score.wicketsB}</ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <MaterialCommunityIcons name="timeline-clock-outline" size={16} color={tintColor} />
          <ThemedText style={styles.footerText}>{match.score.overs} Overs Played</ThemedText>
        </View>
        <View style={styles.statusBadge}>
          <ThemedText style={[styles.statusText, { color: tintColor }]}>In Progress</ThemedText>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 28,
    padding: 24,
    marginRight: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  venueText: {
    fontSize: 12,
    opacity: 0.5,
    fontWeight: '500',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  teamInfo: {
    flex: 2,
  },
  teamName: {
    fontSize: 16,
    marginBottom: 8,
    color: '#fff',
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  runs: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '900',
  },
  wickets: {
    fontSize: 16,
    opacity: 0.5,
    marginBottom: 4,
    marginLeft: 2,
    fontWeight: '600',
  },
  vsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  vsLine: {
    width: 1,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  vsCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  vsText: {
    fontSize: 9,
    fontWeight: '900',
    opacity: 0.4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 16,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 13,
    opacity: 0.7,
    fontWeight: '500',
  },
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});