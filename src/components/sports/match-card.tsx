import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Match } from '@/utils/sports-data';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

/** Safely converts any 3- or 6-digit hex color to an rgba() string. */
function hexToRgba(hex: string, alpha: number): string {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

interface MatchCardProps extends Match {
  onJoin: (id: string) => void;
}

export function MatchCard({
  id,
  groundName,
  sport,
  timeSlot,
  playersNeeded,
  playersJoined,
  organizer,
  type,
  onJoin,
}: MatchCardProps) {
  const tintColor = useThemeColor({}, 'tint');
  const cardBg = useThemeColor({}, 'cardBackground');
  const mutedColor = useThemeColor({}, 'muted');
  const borderColor = useThemeColor({}, 'border');

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
      <View style={styles.header}>
        <View style={[styles.sportBadge, { backgroundColor: hexToRgba(tintColor, 0.08) }]}>
          <MaterialCommunityIcons
            name={sport === 'Cricket' ? 'cricket' : 'soccer'}
            size={20}
            color={tintColor}
          />
          <ThemedText style={[styles.sportText, { color: tintColor }]}>{sport}</ThemedText>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: borderColor }]}>
          <ThemedText style={[styles.typeText, { color: mutedColor }]}>{type}</ThemedText>
        </View>
      </View>

      <ThemedText type="defaultSemiBold" style={styles.groundName}>{groundName}</ThemedText>

      <View style={styles.infoRow}>
        <Ionicons name="time-outline" size={16} color={mutedColor} />
        <ThemedText style={[styles.infoText, { color: mutedColor }]}>{timeSlot}</ThemedText>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="person-outline" size={16} color={mutedColor} />
        <ThemedText style={[styles.infoText, { color: mutedColor }]}>Organizer: {organizer}</ThemedText>
      </View>

      <View style={[styles.divider, { backgroundColor: borderColor }]} />

      <View style={styles.footer}>
        <View>
          <View style={styles.urgencyBadge}>
            <Ionicons name="flash" size={12} color="#fff" />
            <ThemedText style={styles.neededText}>
              {playersNeeded} {playersNeeded === 1 ? 'PLAYER' : 'PLAYERS'} NEEDED
            </ThemedText>
          </View>
          <ThemedText style={[styles.joinedText, { color: mutedColor }]}>{playersJoined} athletes already joined</ThemedText>
        </View>
        <TouchableOpacity
          style={[styles.joinButton, { backgroundColor: tintColor }]}
          onPress={() => onJoin(id)}
        >
          <ThemedText style={styles.joinButtonText}>JOIN MATCH</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 6,
  },
  sportText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  groundName: {
    fontSize: 18,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    marginBottom: 4,
  },
  neededText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  joinedText: {
    fontSize: 12,
    fontWeight: '500',
  },
  joinButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1,
  },
});