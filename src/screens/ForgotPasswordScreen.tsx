import React, { useState } from 'react';
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
import type { RootStackParamList } from '../navigation/Navigation';
import { Colors } from '../constants/theme';
import { useForgotPasswordMutation } from '../hooks/auth/mutations/useForgotPasswordMutation';
import { useVerifyOtpMutation } from '../hooks/auth/mutations/useVerifyOtpMutation';
import { useTranslation } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const { t, isRtl } = useTranslation();
  const forgotPasswordMutation = useForgotPasswordMutation();
  const verifyOtpMutation = useVerifyOtpMutation();

  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const isLoading =
    forgotPasswordMutation.isPending || verifyOtpMutation.isPending;

  const handleSendOtp = async () => {
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError(t('forgot.emailRequired'));
      return;
    }

    setError('');

    try {
      await forgotPasswordMutation.mutateAsync(cleanEmail);
      setStep('otp');
    } catch (err: any) {
      setError(err?.message || t('forgot.sendFailed'));
    }
  };

  const handleVerifyOtp = async () => {
    const cleanEmail = email.trim();
    const cleanOtp = otp.trim();

    if (!cleanOtp) {
      setError(t('forgot.otpRequired'));
      return;
    }

    setError('');

    try {
      await verifyOtpMutation.mutateAsync({
        email: cleanEmail,
        otp: cleanOtp,
      });

      navigation.navigate('ResetPassword');
    } catch (err: any) {
      setError(err?.message || t('forgot.verifyFailed'));
    }
  };

  const handleChangeEmail = () => {
    setStep('email');
    setOtp('');
    setError('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>← {t('forgot.backToLogin')}</Text>
            </TouchableOpacity>

            {step === 'email' ? (
              <>
                <Text style={[styles.title, isRtl && styles.textRight]}>
                  {t('forgot.title')}
                </Text>
                <Text style={[styles.subtitle, isRtl && styles.textRight]}>
                  {t('forgot.subtitle')}
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, isRtl && styles.textRight]}>
                    {t('forgot.emailLabel')}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t('forgot.emailPlaceholder')}
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={(value) => {
                      setEmail(value);
                      if (error) setError('');
                    }}
                  />
                </View>

                {error ? (
                  <View style={styles.errorBox}>
                    <Text style={[styles.errorText, isRtl && styles.textRight]}>
                      {error}
                    </Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[styles.primaryButton, isLoading && styles.disabledButton]}
                  onPress={handleSendOtp}
                  disabled={isLoading}
                  activeOpacity={0.85}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>{t('forgot.sendOtp')}</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>{t('forgot.remember')} </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.footerLink}>{t('forgot.signIn')}</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.successIconWrapper}>
                  <Text style={styles.successIcon}>✓</Text>
                </View>

                <Text style={[styles.title, styles.center]}>{t('forgot.otpSent')}</Text>
                <Text style={[styles.subtitle, styles.center]}>
                  {t('forgot.sentTo')}
                </Text>
                <Text style={styles.emailText}>{email}</Text>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, isRtl && styles.textRight]}>
                    {t('forgot.otpCode')}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t('forgot.otpPlaceholder')}
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    value={otp}
                    onChangeText={(value) => {
                      setOtp(value);
                      if (error) setError('');
                    }}
                  />
                </View>

                {error ? (
                  <View style={styles.errorBox}>
                    <Text style={[styles.errorText, isRtl && styles.textRight]}>
                      {error}
                    </Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[styles.primaryButton, isLoading && styles.disabledButton]}
                  onPress={handleVerifyOtp}
                  disabled={isLoading}
                  activeOpacity={0.85}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>{t('forgot.verifyOtp')}</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleChangeEmail}
                  style={styles.changeEmailButton}
                  activeOpacity={0.8}
                >
                  <Text style={styles.changeEmailText}>{t('forgot.changeEmail')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  backButtonText: {
    color: Colors.textLight,
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textLight,
    marginBottom: 24,
  },
  center: {
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: '#FFFFFF',
  },
  errorBox: {
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },
  primaryButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.7,
  },
  footer: {
    marginTop: 24,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  footerText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  footerLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '700',
  },
  successIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E8F1FF',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 18,
  },
  successIcon: {
    fontSize: 34,
    fontWeight: '700',
    color: Colors.primary,
  },
  emailText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 24,
  },
  changeEmailButton: {
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeEmailText: {
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: '600',
  },
  textRight: {
    textAlign: 'right',
  },
});
