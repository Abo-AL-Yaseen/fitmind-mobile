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
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { RootStackParamList } from '../navigation/Navigation';
import { Colors, Spacing, BorderRadius, FontSizes } from '../constants/theme';
import { useLoginMutation } from '../hooks/auth/mutations/useLoginMutation';
import { registerForPushNotificationsAsync } from '../services/notifications';
import { savePushToken } from '../services/pushTokens';
import { clearAuth } from '../services/auth';
import { ApiError } from '../services/api';
import { useTranslation } from '../i18n';

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

type ToastState = {
  visible: boolean;
  type: 'success' | 'error';
  title: string;
  message: string;
};

type SubscriptionRequiredDetails = {
  title: string;
  message: string;
};

type SubscriptionModalState = SubscriptionRequiredDetails & {
  visible: boolean;
};

function getErrorData(error: unknown): Record<string, any> {
  if (
    error instanceof ApiError &&
    error.data &&
    typeof error.data === 'object' &&
    !Array.isArray(error.data)
  ) {
    return error.data as Record<string, any>;
  }

  return {};
}

function getString(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value).trim()
    : '';
}

function getSubscriptionRequiredDetails(
  error: unknown,
  t: (key: string) => string
): SubscriptionRequiredDetails | null {
  const data = getErrorData(error);
  const code = getString(data.code).toLowerCase();
  const title = getString(data.title) || t('common.subscriptionRequired');
  const message =
    getString(data.message) ||
    (error instanceof Error ? error.message : '') ||
    t('common.subscriptionMessage');
  const normalizedMessage = message.toLowerCase();

  const isSubscriptionRequired =
    code === 'subscription_required' ||
    data.renew_required === true ||
    normalizedMessage.includes('subscription') ||
    normalizedMessage.includes('renew') ||
    normalizedMessage.includes('expired') ||
    normalizedMessage.includes('not active');

  if (!isSubscriptionRequired) return null;

  return {
    title,
    message,
  };
}

export function LoginScreen({ navigation }: LoginScreenProps) {
  const loginMutation = useLoginMutation();
  const queryClient = useQueryClient();
  const { t, isRtl } = useTranslation();

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
  const [subscriptionModal, setSubscriptionModal] =
    useState<SubscriptionModalState>({
      visible: false,
      title: t('common.subscriptionRequired'),
      message: t('common.subscriptionMessage'),
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
      setEmailError(t('login.emailRequired'));
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      setEmailError(t('login.emailInvalid'));
      isValid = false;
    }

    if (!password.trim()) {
      setPasswordError(t('login.passwordRequired'));
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
        console.warn(t('login.pushTokenFailed'), error);
      }

      showToast(
        'success',
        t('login.successTitle'),
        t('login.successMessage'),
        true
      );
    } catch (error: any) {
      const subscriptionRequired = getSubscriptionRequiredDetails(error, t);

      if (subscriptionRequired) {
        await clearAuth();
        queryClient.clear();
        setGeneralError('');

        setSubscriptionModal({
          visible: true,
          title: subscriptionRequired.title,
          message: subscriptionRequired.message,
        });
        return;
      }

      const message =
        error?.message || t('login.failedMessage');

      setGeneralError(message);

      showToast('error', t('login.failedTitle'), message);
    }
  }

  function handleForgotPassword() {
    navigation.navigate('ForgotPassword');
  }

  async function handleSubscriptionModalClose() {
    await clearAuth();
    queryClient.clear();

    setSubscriptionModal((prev) => ({
      ...prev,
      visible: false,
    }));
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
                {t('login.logoSubtitle')}
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.headerContainer}>
                <Text style={[styles.headerTitle, isRtl && styles.textRight]}>
                  {t('login.title')}
                </Text>
                <Text style={[styles.headerSubtitle, isRtl && styles.textRight]}>
                  {t('login.subtitle')}
                </Text>
              </View>

              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, isRtl && styles.textRight]}>
                    {t('common.email')}
                  </Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="mail-outline"
                      size={18}
                      color={Colors.textLight}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder={t('login.emailPlaceholder')}
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
                  {!!emailError && (
                    <Text style={[styles.errorText, isRtl && styles.textRight]}>
                      {emailError}
                    </Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, isRtl && styles.textRight]}>
                    {t('common.password')}
                  </Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={18}
                      color={Colors.textLight}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, styles.inputWithButton]}
                      placeholder={t('login.passwordPlaceholder')}
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
                    <Text style={[styles.errorText, isRtl && styles.textRight]}>
                      {passwordError}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.forgotButton}
                  onPress={handleForgotPassword}
                >
                  <Text style={styles.forgotText}>{t('login.forgotPassword')}</Text>
                </TouchableOpacity>

                {!!generalError && (
                  <View style={styles.generalErrorBox}>
                    <Text style={[styles.generalErrorText, isRtl && styles.textRight]}>
                      {generalError}
                    </Text>
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
                      <Text style={styles.primaryButtonText}>{t('login.signIn')}</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.helperText}>
                  {t('common.memberOnly')}
                </Text>
              </View>
            </View>

            <Text style={styles.footer}>{t('login.footer')}</Text>
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

          <Modal
            visible={subscriptionModal.visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={handleSubscriptionModalClose}
          >
            <View style={styles.subscriptionModalOverlay}>
              <View style={styles.subscriptionModalCard}>
                <View style={styles.subscriptionIconWrap}>
                  <Ionicons name="card-outline" size={28} color={Colors.primary} />
                </View>

                <Text style={styles.subscriptionModalTitle}>
                  {subscriptionModal.title}
                </Text>
                <Text style={styles.subscriptionModalMessage}>
                  {subscriptionModal.message}
                </Text>

                <TouchableOpacity
                  style={styles.subscriptionModalButton}
                  activeOpacity={0.86}
                  onPress={handleSubscriptionModalClose}
                >
                  <LinearGradient
                    colors={[Colors.primary, Colors.primaryLight]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.subscriptionModalButtonGradient}
                  >
                    <Text style={styles.subscriptionModalButtonText}>
                      {t('common.backToLogin')}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
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
  textRight: {
    textAlign: 'right',
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
  subscriptionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  subscriptionModalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.24,
    shadowRadius: 24,
    elevation: 16,
  },
  subscriptionIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  subscriptionModalTitle: {
    color: Colors.textPrimary,
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'center',
  },
  subscriptionModalMessage: {
    marginTop: 10,
    color: Colors.textLight,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  subscriptionModalButton: {
    alignSelf: 'stretch',
    marginTop: 22,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  subscriptionModalButtonGradient: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  subscriptionModalButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
});
