import React from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, View, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAdminStore } from '@/store/adminStore';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, showAlert } = useAdminStore();
  const tintColor = useThemeColor({}, 'tint');
  const cardBg = useThemeColor({}, 'cardBackground');
  const pageBg = useThemeColor({}, 'background');

  const handleLogout = () => {
    logout();
    router.replace('/auth/login');
  };

  const menuItems = [
    { id: 'bookings', label: 'My Bookings', icon: 'ticket-outline', color: '#10B981', action: () => router.push('/bookings') },
    { id: 'wallet', label: 'Wallet & Payments', icon: 'wallet-outline', color: tintColor, action: () => router.push('/wallet') },
    { id: 'security', label: 'Security & Privacy', icon: 'shield-checkmark-outline', color: '#6366F1', action: () => showAlert('Security', 'Security settings are managed by NM Greens secure portal.', 'info') },
    { id: 'help', label: 'Help & Support', icon: 'help-circle-outline', color: '#F59E0B', action: () => showAlert('Support', 'Contacting NM Greens Support...', 'info') },
  ];

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={styles.header}>
            <Animated.View entering={ZoomIn.duration(600)} style={styles.avatarContainer}>
                <LinearGradient 
                    colors={[tintColor, '#11181C']}
                    style={styles.avatarGradient}
                />
                <View style={styles.avatarInner}>
                    <MaterialCommunityIcons name="account" size={60} color="#fff" />
                </View>
                <TouchableOpacity style={[styles.editBadge, { backgroundColor: tintColor }]}>
                    <Ionicons name="camera" size={16} color="#fff" />
                </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.userInfo}>
                <ThemedText type="title" style={styles.userName}>{user?.name || 'Player'}</ThemedText>
                <ThemedText style={styles.userEmail}>{user?.role === 'admin' ? 'Manager Portal' : 'Premium Player Member'}</ThemedText>
            </Animated.View>
        </View>

        {/* Stats Grid */}
        <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: cardBg }]}>
                <MaterialCommunityIcons name="wallet-outline" size={24} color={tintColor} />
                <View>
                    <ThemedText style={styles.statValue}>₹{user?.walletBalance || 0}</ThemedText>
                    <ThemedText style={styles.statLabel}>BALANCE</ThemedText>
                </View>
            </View>
            <View style={[styles.statCard, { backgroundColor: cardBg }]}>
                <MaterialCommunityIcons name="star-circle-outline" size={24} color="#F9A825" />
                <View>
                    <ThemedText style={styles.statValue}>{user?.loyaltyPoints || 0}</ThemedText>
                    <ThemedText style={styles.statLabel}>POINTS</ThemedText>
                </View>
            </View>
        </Animated.View>

        {/* Menu Section */}
        <View style={styles.menuContainer}>
            {menuItems.map((item, index) => (
                <Animated.View 
                    key={item.id} 
                    entering={FadeInUp.delay(600 + index * 100).duration(500)}
                >
                    <TouchableOpacity 
                        style={[styles.menuItem, { backgroundColor: cardBg }]}
                        onPress={item.action}
                    >
                        <View style={[styles.menuIconBox, { backgroundColor: item.color + '15' }]}>
                            <Ionicons name={item.icon as any} size={22} color={item.color} />
                        </View>
                        <ThemedText style={styles.menuLabel}>{item.label}</ThemedText>
                        <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                    </TouchableOpacity>
                </Animated.View>
            ))}
        </View>

        {/* Log Out Button */}
        <Animated.View entering={FadeInUp.delay(1100).duration(600)}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                <ThemedText style={styles.logoutText}>Log Out Account</ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.versionText}>NM Greens v2.4.0 (Stable)</ThemedText>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 80,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    position: 'relative',
    marginBottom: 20,
  },
  avatarGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 60,
    opacity: 0.1,
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#020617',
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 28,
    fontWeight: '900',
  },
  userEmail: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 40,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '900',
    letterSpacing: 1,
  },
  menuContainer: {
    gap: 12,
    marginBottom: 40,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  menuIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    gap: 12,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
  },
  versionText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 20,
    fontWeight: '600',
  },
});
