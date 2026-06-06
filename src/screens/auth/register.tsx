import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, TextInput, View, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAdminStore } from '@/store/adminStore';
import { ENDPOINTS, API_HEADERS } from '@/constants/api';

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

export default function RegisterScreen() {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const tintColor = useThemeColor({}, 'tint');
  const cardBg = useThemeColor({}, 'cardBackground');
  const pageBg = useThemeColor({}, 'background');
  const mutedColor = useThemeColor({}, 'muted');

  const { showAlert } = useAdminStore();

  const handleRegister = async () => {
    if (!name || !email || !phone || !password || !confirmPassword) {
      showAlert('Required Fields', 'Please fill in all the details to continue.', 'warning');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('Password Mismatch', 'Passwords do not match. Please try again.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Attempting registration to:', ENDPOINTS.auth.register);
      const response = await fetch(ENDPOINTS.auth.register, {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify({
          full_name: name,
          email: email,
          username: email, // Added for backend compatibility
          phone_number: phone,
          password: password,
        }),
      });

      console.log('Registration status:', response.status);

      // Check if response is actually JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON Response:', text);
        showAlert('Server Error', `Unexpected format from server (${response.status}).`, 'error');
        return;
      }

      const data = await response.json();
      console.log('Registration response data:', data);

      if (response.ok) {
        showAlert('Welcome Aboard!', 'Your account has been created successfully. You can now login to start booking.', 'success');
        router.replace('/auth/login');
      } else {
        const errorMsg = data.message || data.error || data.detail || 'Something went wrong. Please try again.';
        showAlert('Registration Failed', errorMsg, 'error');
      }
    } catch (error: any) {
      console.error('Registration Error:', error);
      showAlert('Connection Error', `Failed to connect: ${error.message || 'Unknown error'}. Check your internet.`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: pageBg }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={tintColor} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={[styles.logoContainer, { backgroundColor: 'rgba(0,0,0,0.5)', shadowColor: tintColor }]}>
              <Image 
                source={require('@/assets/images/nm-greens-logo.jpg')} 
                style={{ width: 70, height: 70, borderRadius: 15 }} 
                resizeMode="contain"
              />
            </View>
            <ThemedText type="title" style={styles.title}>Join NM Greens</ThemedText>
            <ThemedText style={[styles.subtitle, { color: mutedColor }]}>Create your player account to start booking</ThemedText>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={mutedColor} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: useThemeColor({}, 'text'), backgroundColor: cardBg }]}
                placeholder="Full Name"
                placeholderTextColor={mutedColor}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={mutedColor} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: useThemeColor({}, 'text'), backgroundColor: cardBg }]}
                placeholder="Email Address"
                placeholderTextColor={mutedColor}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color={mutedColor} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: useThemeColor({}, 'text'), backgroundColor: cardBg }]}
                placeholder="Phone Number"
                placeholderTextColor={mutedColor}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={mutedColor} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: useThemeColor({}, 'text'), backgroundColor: cardBg }]}
                placeholder="Password"
                placeholderTextColor={mutedColor}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={mutedColor} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="shield-checkmark-outline" size={20} color={mutedColor} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: useThemeColor({}, 'text'), backgroundColor: cardBg }]}
                placeholder="Confirm Password"
                placeholderTextColor={mutedColor}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
              />
            </View>

            <TouchableOpacity 
              style={[styles.registerButton, { backgroundColor: tintColor }]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <ThemedText style={styles.buttonText}>
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </ThemedText>
            </TouchableOpacity>

            <View style={styles.footer}>
              <ThemedText style={[styles.footerText, { color: mutedColor }]}>Already have an account? </ThemedText>
              <TouchableOpacity onPress={() => router.replace('/auth/login')}>
                <ThemedText style={{ color: tintColor, fontWeight: 'bold' }}>Login</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
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
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
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
    height: 56,
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
  },
  registerButton: {
    height: 56,
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
    marginTop: 24,
  },
  footerText: {
  },
});