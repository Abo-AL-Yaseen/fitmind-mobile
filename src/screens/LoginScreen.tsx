import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/Navigation';
import { Colors, Spacing, BorderRadius, FontSizes } from '../constants/theme';
import { useLoginMutation } from '../hooks/auth/mutations/useLoginMutation';
import { registerForPushNotificationsAsync } from '../services/notifications';
import { savePushToken } from '../services/pushTokens';

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

type ToastState = {
  visible: boolean;
  type: 'success' | 'error';
  title: string;
  message: string;
};

export function LoginScreen({ navigation }: LoginScreenProps) {
  const loginMutation = useLoginMutation();

  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const [toast, setToast] = useState<ToastState>({
    visible: false,
    type: 'success',
    title: '',
    message: '',
  });

  const toastTranslateY = useRef(new Animated.Value(120)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isLoading = loginMutation.isPending;

  function showToast(
    type: 'success' | 'error',
    title: string,
    message: string,
    shouldNavigate = false
  ) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    if (navigateTimerRef.current) clearTimeout(navigateTimerRef.current);

    setToast({
      visible: true,
      type,
      title,
      message,
    });

    Animated.parallel([
      Animated.timing(toastTranslateY, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();

    const visibleDuration = 2600;

    toastTimerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastTranslateY, {
          toValue: 120,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      });
    }, visibleDuration);

    if (shouldNavigate) {
      navigateTimerRef.current = setTimeout(() => {
        navigation.replace('MainTabs');
      }, visibleDuration - 150);
    }
  }

  function validateForm(): boolean {
    let isValid = true;

    setEmailError('');
    setPasswordError('');
    setGeneralError('');

    if (!email.trim()) {
      setEmailError('Email is required.');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      setEmailError('Please enter a valid email address.');
      isValid = false;
    }

    if (!password.trim()) {
      setPasswordError('Password is required.');
      isValid = false;
    }

    return isValid;
  }

  async function handleLogin() {
    if (!validateForm()) return;

    try {
      setGeneralError('');

      await loginMutation.mutateAsync({
        email: email.trim(),
        password,
      });

      try {
        const pushToken = await registerForPushNotificationsAsync();

        if (pushToken) {
          await savePushToken(pushToken);
        }
      } catch (error) {
        console.warn('Push token registration failed:', error);
      }

      showToast(
        'success',
        'Login successful',
        'Welcome back! Redirecting to your dashboard...',
        true
      );
    } catch (error: any) {
      const message =
        error?.message || 'Login failed. Please check your credentials.';

      setGeneralError(message);

      showToast('error', 'Login failed', message);
    }
  }

  function handleForgotPassword() {
    navigation.navigate('ForgotPassword');
  }

  const toastIsSuccess = toast.type === 'success';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={['#0D7D6D', '#0a6259', '#085249']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.logoContainer}>
              <View style={styles.logoBox}>
                <Ionicons name="barbell" size={38} color="#fff" />
              </View>
              <Text style={styles.logoText}>FitMind</Text>
              <Text style={styles.logoSubtext}>
                Sign in to access your fitness journey
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>Welcome Back</Text>
                <Text style={styles.headerSubtitle}>
                  Sign in using the email and password created for you by the gym.
                </Text>
              </View>

              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="mail-outline"
                      size={18}
                      color={Colors.textLight}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="your@email.com"
                      placeholderTextColor={Colors.textLight}
                      value={email}
                      onChangeText={(value) => {
                        setEmail(value);
                        if (emailError) setEmailError('');
                        if (generalError) setGeneralError('');
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                  {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={18}
                      color={Colors.textLight}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, styles.inputWithButton]}
                      placeholder="••••••••"
                      placeholderTextColor={Colors.textLight}
                      value={password}
                      onChangeText={(value) => {
                        setPassword(value);
                        if (passwordError) setPasswordError('');
                        if (generalError) setGeneralError('');
                      }}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPassword((prev) => !prev)}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={Colors.textLight}
                      />
                    </TouchableOpacity>
                  </View>
                  {!!passwordError && (
                    <Text style={styles.errorText}>{passwordError}</Text>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.forgotButton}
                  onPress={handleForgotPassword}
                >
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>

                {!!generalError && (
                  <View style={styles.generalErrorBox}>
                    <Text style={styles.generalErrorText}>{generalError}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleLogin}
                  disabled={isLoading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[Colors.primary, Colors.primaryLight]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.buttonGradient, isLoading && styles.disabledButton]}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Sign In</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.helperText}>
                  This mobile app is available for member accounts only.
                </Text>
              </View>
            </View>

            <Text style={styles.footer}>© 2026 FitMind. All rights reserved.</Text>
          </ScrollView>

          {toast.visible && (
            <Animated.View
              style={[
                styles.toastContainer,
                {
                  opacity: toastOpacity,
                  transform: [{ translateY: toastTranslateY }],
                },
              ]}
            >
              <View
                style={[
                  styles.toastCard,
                  toastIsSuccess ? styles.toastSuccess : styles.toastError,
                ]}
              >
                <View style={styles.toastIconWrap}>
                  {toastIsSuccess ? (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  ) : (
                    <Ionicons name="alert" size={16} color="#FFFFFF" />
                  )}
                </View>

                <View style={styles.toastTextWrap}>
                  <Text style={styles.toastTitle}>{toast.title}</Text>
                  <Text style={styles.toastMessage}>{toast.message}</Text>
                </View>
              </View>
            </Animated.View>
          )}
        </SafeAreaView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D7D6D',
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
    paddingTop: Spacing.xxxl,
    paddingBottom: 120,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  logoBox: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  logoSubtext: {
    fontSize: FontSizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContainer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
    lineHeight: 20,
  },
  formContainer: {
    padding: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 48,
  },
  inputIcon: {
    marginLeft: Spacing.md,
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: Spacing.sm,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  inputWithButton: {
    paddingRight: 0,
  },
  eyeButton: {
    padding: Spacing.md,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.lg,
  },
  forgotText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  primaryButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  buttonGradient: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  helperText: {
    marginTop: Spacing.lg,
    textAlign: 'center',
    color: Colors.textLight,
    fontSize: 12,
    lineHeight: 18,
  },
  errorText: {
    marginTop: 6,
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '500',
  },
  generalErrorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  generalErrorText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '500',
  },
  footer: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 12,
    marginTop: Spacing.xl,
  },
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 18,
  },
  toastCard: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 10,
  },
  toastSuccess: {
    backgroundColor: '#0F766E',
  },
  toastError: {
    backgroundColor: '#B91C1C',
  },
  toastIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  toastTextWrap: {
    flex: 1,
  },
  toastTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  toastMessage: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 13,
    lineHeight: 18,
  },
});
