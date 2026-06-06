import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, TextInput, View, KeyboardAvoidingView, Platform, Image, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAdminStore } from '@/store/adminStore';
import { ENDPOINTS, API_HEADERS } from '@/constants/api';
import Animated, { 
    FadeInDown, 
    FadeInUp,
    FadeIn,
    useSharedValue, 
    useAnimatedStyle, 
    withRepeat, 
    withTiming, 
    withSpring,
    withDelay,
    Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { StadiumLights } from '@/components/sports/stadium-lights';
import { CricketAtmosphere } from '@/components/sports/cricket-atmosphere';

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



export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { login, showAlert } = useAdminStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const tintColor = useThemeColor({}, 'tint');
  const cardBg = useThemeColor({}, 'cardBackground');
  const pageBg = useThemeColor({}, 'background');
  const mutedColor = useThemeColor({}, 'muted');
  const borderColor = useThemeColor({}, 'border');

  const floatValue = useSharedValue(0);
  const logoGlow = useSharedValue(1);

  useEffect(() => {
    floatValue.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    logoGlow.value = withRepeat(
      withTiming(1.2, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const brandGold = useThemeColor({}, 'brandGold');
  const brandSilver = useThemeColor({}, 'brandSilver');

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatValue.value * 20 }],
    shadowOpacity: logoGlow.value * 0.5,
    shadowRadius: logoGlow.value * 15,
    shadowColor: brandGold,
  }));

  const loginBtnScale = useSharedValue(1);

  const handlePressIn = (s: typeof loginBtnScale) => {
    s.value = withSpring(0.95);
  };
  const handlePressOut = (s: typeof loginBtnScale) => {
    s.value = withSpring(1);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert('Required Fields', 'Please enter both your email and password.', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Attempting login to:', ENDPOINTS.auth.login);
      const response = await fetch(ENDPOINTS.auth.login, {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify({
          email: email, // If backend expects username, we can try adding both
          username: email,
          password: password,
        }),
      });

      console.log('Login status:', response.status);

      // Check if response is actually JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON Response:', text);
        showAlert('Server Error', `Unexpected response format (${response.status}). Please check server logs.`, 'error');
        return;
      }

      const data = await response.json();
      console.log('Login response data:', data);

      if (response.ok) {
        // Success: Log the user in and navigate
        const token = data.access || data.token || data.access_token;
        const role = data.role === 'admin' ? 'admin' : (data.user?.role === 'admin' ? 'admin' : 'user');
        
        const first = data.first_name || data.user?.first_name || '';
        const last = data.last_name || data.user?.last_name || '';
        const combined = `${first} ${last}`.trim();
        
        const userName = combined || data.full_name || data.name || data.user?.name || data.user?.full_name || data.username || data.user?.username || 'Player';
        const userId = data.user_id || data.id || data.user?.id || data.user?.pk;
        
        login(role, userName, token, userId);
        
        if (role === 'admin') {
          navigation.replace('Admin' as any);
        } else {
          navigation.replace('Main' as any);
        }
      } else {
        const errorMsg = data.message || data.error || data.detail || 'Invalid credentials. Please try again.';
        showAlert('Login Failed', errorMsg, 'error');
      }
    } catch (error: any) {
      console.error('Login Error:', error);
      showAlert('Connection Error', `Failed to connect: ${error.message || 'Unknown error'}. Check your internet and server URL.`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: pageBg }]}>

      
      {/* Background Atmosphere */}
      <StadiumLights />
      <CricketAtmosphere />
      <View style={styles.backgroundOverlay} pointerEvents="none" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <Animated.View entering={FadeInDown.duration(800).springify().damping(12)} style={styles.header}>
          <Pressable onLongPress={() => navigation.navigate('/auth/admin-login')}>
            <Animated.View style={[
              styles.logoContainer, 
              { backgroundColor: 'rgba(0,0,0,0.3)', shadowColor: brandGold }, 
              animatedLogoStyle
            ]}>
              <Image 
                source={require('@/assets/images/nm-greens-logo.jpg')} 
                style={{ width: 90, height: 90, borderRadius: 20 }} 
                resizeMode="contain"
              />
            </Animated.View>
          </Pressable>
          <Animated.View entering={FadeIn.delay(300).duration(800)}>
            <ThemedText type="title" style={styles.title}>NM Greens</ThemedText>
            <ThemedText style={[styles.subtitle, { color: mutedColor }]}>Elevate your game today.</ThemedText>
          </Animated.View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500).duration(800).springify().damping(15)} style={styles.form}>
          <View style={[
            styles.inputWrapper, 
            { 
              backgroundColor: hexToRgba(cardBg, 0.6),
              borderColor: focusedInput === 'email' ? tintColor : 'rgba(128, 128, 128, 0.1)'
            }
          ]}>
            <Ionicons name="mail-outline" size={20} color={focusedInput === 'email' ? tintColor : mutedColor} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: useThemeColor({}, 'text') }]}
              placeholder="Email Address"
              placeholderTextColor={mutedColor}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocusedInput('email')}
              onBlur={() => setFocusedInput(null)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={[
            styles.inputWrapper, 
            { 
              backgroundColor: hexToRgba(cardBg, 0.6),
              borderColor: focusedInput === 'password' ? tintColor : 'rgba(128, 128, 128, 0.1)'
            }
          ]}>
            <Ionicons name="lock-closed-outline" size={20} color={focusedInput === 'password' ? tintColor : mutedColor} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: useThemeColor({}, 'text') }]}
              placeholder="Password"
              placeholderTextColor={mutedColor}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput(null)}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={mutedColor} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotPassword}>
            <ThemedText style={{ color: tintColor, fontSize: 13, fontWeight: '600' }}>Forgot Password?</ThemedText>
          </TouchableOpacity>

          <Pressable 
            onPressIn={() => handlePressIn(loginBtnScale)}
            onPressOut={() => handlePressOut(loginBtnScale)}
            onPress={() => handleLogin()}
            disabled={isLoading}
          >
            <Animated.View style={[
              styles.loginButton, 
              { backgroundColor: tintColor }, 
              useAnimatedStyle(() => ({ transform: [{ scale: loginBtnScale.value }] }))
            ]}>
                <ThemedText style={styles.buttonText}>
                    {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
                </ThemedText>
                {!isLoading && <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />}
            </Animated.View>
          </Pressable>


        </Animated.View>

        <Animated.View entering={FadeIn.delay(1000).duration(800)} style={styles.footer}>
          <ThemedText style={[styles.footerText, { color: mutedColor }]}>New to NM Greens? </ThemedText>
          <TouchableOpacity onPress={() => navigation.navigate('/auth/register' as any)}>
            <ThemedText style={{ color: tintColor, fontWeight: '800' }}>Create account</ThemedText>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  flex: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },

  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 20,
  },
  title: {
    fontSize: 38,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -1,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
  form: {
    gap: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    gap: 12,
  },
  inputIcon: {
    width: 20,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    fontWeight: '600',
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 8,
    paddingRight: 4,
  },
  loginButton: {
    height: 60,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
  },
  footerText: {
  },
});