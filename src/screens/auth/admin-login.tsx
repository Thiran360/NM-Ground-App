import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, TextInput, View, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAdminStore } from '@/store/adminStore';

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

export default function AdminLoginScreen() {
  const router = useRouter();
  const { login, adminCredentials, showAlert } = useAdminStore();
  
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const tintColor = useThemeColor({}, 'tint');
  const cardBg = useThemeColor({}, 'cardBackground');
  const pageBg = useThemeColor({}, 'background');

  const handleAdminLogin = () => {
    setIsLoading(true);
    
    // Verify against configured credentials
    setTimeout(() => {
      if (adminId === adminCredentials.id && password === adminCredentials.password) {
        login('admin', 'Arena Manager', undefined, 'admin-1');
        setIsLoading(false);
        router.replace('/admin');
      } else {
        setIsLoading(false);
        showAlert('Authentication Failed', 'Invalid Administrator ID or Portal Password.', 'error');
      }
    }, 1200);
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: pageBg }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={tintColor} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: 'rgba(0,0,0,0.5)', shadowColor: tintColor }]}>
            <Image 
              source={require('@/assets/images/nm-greens-logo.jpg')} 
              style={{ width: 90, height: 90, borderRadius: 20 }} 
              resizeMode="contain"
            />
          </View>
          <ThemedText type="title" style={styles.title}>Manager Portal</ThemedText>
          <ThemedText style={styles.subtitle}>Secure access for ground administrators</ThemedText>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="account-key-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: useThemeColor({}, 'text'), backgroundColor: cardBg }]}
              placeholder="Administrator ID"
              placeholderTextColor="#94A3B8"
              value={adminId}
              onChangeText={setAdminId}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: useThemeColor({}, 'text'), backgroundColor: cardBg, paddingRight: 48 }]}
              placeholder="Portal Password"
              placeholderTextColor="#94A3B8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.loginButton, { backgroundColor: tintColor }]}
            onPress={handleAdminLogin}
            disabled={isLoading}
          >
            <ThemedText style={styles.buttonText}>
              {isLoading ? 'Authenticating...' : 'Secure Login'}
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Ionicons name="information-circle-outline" size={16} color="#94A3B8" />
          <ThemedText style={styles.footerText}>Authorized access only. All actions are logged.</ThemedText>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  input: {
    height: 60,
    borderRadius: 16,
    paddingLeft: 48,
    paddingRight: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.1)',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    zIndex: 1,
  },
  loginButton: {
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    gap: 8,
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 12,
  },
});