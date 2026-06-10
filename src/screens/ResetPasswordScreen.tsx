import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../navigation/Navigation';
import { Colors, Spacing, BorderRadius, FontSizes } from '../constants/theme';
import { useResetDataQuery } from '../hooks/auth/queries/useResetDataQuery';
import { useResetPasswordMutation } from '../hooks/auth/mutations/useResetPasswordMutation';
import { useTranslation } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen({ navigation }: Props) {
  const { t, isRtl } = useTranslation();
  const resetDataQuery = useResetDataQuery();
  const resetPasswordMutation = useResetPasswordMutation();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const isLoading = resetPasswordMutation.isPending;

  useEffect(() => {
    if (resetDataQuery.isFetched && !resetDataQuery.data?.resetToken) {
      navigation.replace('ForgotPassword');
    }
  }, [navigation, resetDataQuery.isFetched, resetDataQuery.data?.resetToken]);

  const passwordChecks = useMemo(() => {
    const password = formData.password;

    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
    };
  }, [formData.password]);

  const isPasswordValid =
    passwordChecks.minLength &&
    passwordChecks.hasUppercase &&
    passwordChecks.hasLowercase &&
    passwordChecks.hasNumber;

  const handleSubmit = async () => {
    if (!isPasswordValid) {
      setError(
        t('reset.invalidPassword')
      );
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('reset.passwordMismatch'));
      return;
    }

    const resetToken = resetDataQuery.data?.resetToken;

    if (!resetToken) {
      navigation.replace('ForgotPassword');
      return;
    }

    setError('');

    try {
      await resetPasswordMutation.mutateAsync({
        resetToken,
        password: formData.password,
        passwordConfirmation: formData.confirmPassword,
      });

      setIsSuccess(true);

      setTimeout(() => {
        navigation.replace('Login');
      }, 2000);
    } catch (err: any) {
      setError(err?.message || t('reset.failed'));
    }
  };

  const showPasswordValidation = formData.password.length > 0;

  if (resetDataQuery.isLoading) {
    return (
      <SafeAreaView style={styles.successSafeArea}>
        <View style={styles.successContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.successSubtitle}>{t('reset.checking')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isSuccess) {
    return (
      <SafeAreaView style={styles.successSafeArea}>
        <View style={styles.successContainer}>
          <View style={styles.successCard}>
            <View style={styles.successIconWrapper}>
              <Ionicons
                name="checkmark-circle"
                size={64}
                color={Colors.primary}
              />
            </View>

            <Text style={styles.successTitle}>{t('reset.successTitle')}</Text>

            <Text style={styles.successSubtitle}>
              {t('reset.successSubtitle')}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={[styles.title, isRtl && styles.textRight]}>
              {t('reset.title')}
            </Text>

            <Text style={[styles.subtitle, isRtl && styles.textRight]}>
              {t('reset.subtitle')}
            </Text>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, isRtl && styles.textRight]}>
                  {t('reset.newPassword')}
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
                    placeholder={t('reset.newPasswordPlaceholder')}
                    placeholderTextColor={Colors.textLight}
                    value={formData.password}
                    onChangeText={(value) => {
                      setFormData({ ...formData, password: value });
                      if (error) setError('');
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
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, isRtl && styles.textRight]}>
                  {t('reset.confirmPassword')}
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
                    placeholder={t('reset.confirmPasswordPlaceholder')}
                    placeholderTextColor={Colors.textLight}
                    value={formData.confirmPassword}
                    onChangeText={(value) => {
                      setFormData({ ...formData, confirmPassword: value });
                      if (error) setError('');
                    }}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() =>
                      setShowConfirmPassword((prev) => !prev)
                    }
                  >
                    <Ionicons
                      name={
                        showConfirmPassword
                          ? 'eye-off-outline'
                          : 'eye-outline'
                      }
                      size={18}
                      color={Colors.textLight}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={[styles.errorText, isRtl && styles.textRight]}>
                    {error}
                  </Text>
                </View>
              ) : null}

              <View style={styles.requirementsBox}>
                <Text style={styles.requirementsTitle}>
                  {t('reset.requirementsTitle')}
                </Text>

                <Text
                  style={[
                    styles.requirementItem,
                    showPasswordValidation
                      ? passwordChecks.minLength
                        ? styles.validRequirement
                        : styles.invalidRequirement
                      : styles.defaultRequirement,
                  ]}
                >
                  {t('reset.reqMinLength')}
                </Text>

                <Text
                  style={[
                    styles.requirementItem,
                    showPasswordValidation
                      ? passwordChecks.hasUppercase
                        ? styles.validRequirement
                        : styles.invalidRequirement
                      : styles.defaultRequirement,
                  ]}
                >
                  {t('reset.reqUppercase')}
                </Text>

                <Text
                  style={[
                    styles.requirementItem,
                    showPasswordValidation
                      ? passwordChecks.hasLowercase
                        ? styles.validRequirement
                        : styles.invalidRequirement
                      : styles.defaultRequirement,
                  ]}
                >
                  {t('reset.reqLowercase')}
                </Text>

                <Text
                  style={[
                    styles.requirementItem,
                    showPasswordValidation
                      ? passwordChecks.hasNumber
                        ? styles.validRequirement
                        : styles.invalidRequirement
                      : styles.defaultRequirement,
                  ]}
                >
                  {t('reset.reqNumber')}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleSubmit}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.primaryButtonInner,
                    isLoading && styles.disabledButton,
                  ]}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {t('reset.button')}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>{t('forgot.remember')} </Text>
                <TouchableOpacity onPress={() => navigation.replace('Login')}>
                  <Text style={styles.footerLink}>{t('reset.backToLogin')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xxxl,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  formContainer: {},
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
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '500',
  },
  requirementsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  requirementsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  requirementItem: {
    fontSize: 12,
    marginBottom: 4,
  },
  defaultRequirement: {
    color: Colors.textLight,
  },
  validRequirement: {
    color: '#16A34A',
  },
  invalidRequirement: {
    color: '#DC2626',
  },
  primaryButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  primaryButtonInner: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
  footer: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  footerText: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
  },
  footerLink: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '700',
  },
  successSafeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  successCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  successIconWrapper: {
    marginBottom: Spacing.lg,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: Spacing.md,
  },
  textRight: {
    textAlign: 'right',
  },
});
