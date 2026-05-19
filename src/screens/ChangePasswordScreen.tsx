import React, { useMemo, useState } from 'react';
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
import { useChangePasswordMutation } from '../hooks/auth/mutations/useChangePasswordMutation';
import { clearAuth } from '../services/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'ChangePassword'>;

export function ChangePasswordScreen({ navigation }: Props) {
  const changePasswordMutation = useChangePasswordMutation();

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('error');

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const passwordChecks = useMemo(() => {
    const password = formData.newPassword;

    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
    };
  }, [formData.newPassword]);

  const isPasswordValid =
    passwordChecks.minLength &&
    passwordChecks.hasUppercase &&
    passwordChecks.hasLowercase &&
    passwordChecks.hasNumber;

  const showToast = (message: string, type: 'success' | 'error' = 'error') => {
    setToastMessage(message);
    setToastType(type);

    setTimeout(() => {
      setToastMessage('');
    }, 2500);
  };

  const handleSubmit = async () => {
    if (!formData.currentPassword.trim()) {
      showToast('Please enter your current password.');
      return;
    }

    if (!isPasswordValid) {
      showToast(
        'New password must be at least 8 characters and include uppercase, lowercase, and a number.'
      );
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      showToast('New password and confirm password do not match.');
      return;
    }

    try {
      setIsLoading(true);

      await changePasswordMutation.mutateAsync({
        current_password: formData.currentPassword,
        password: formData.newPassword,
        password_confirmation: formData.confirmPassword,
      });

      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      showToast(
        'Password changed successfully. Please login again.',
        'success'
      );

      await clearAuth();

      setTimeout(() => {
        navigation.replace('Login');
      }, 1200);
    } catch (error: any) {
      showToast(error?.message || 'Failed to change password.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showPasswordValidation = formData.newPassword.length > 0;

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
            <Text style={styles.title}>Change Password</Text>

            <Text style={styles.subtitle}>
              Update your password from here. This screen is ready, but the backend endpoint is not connected yet.
            </Text>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Current Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={Colors.textLight}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, styles.inputWithButton]}
                    placeholder="Enter current password"
                    placeholderTextColor={Colors.textLight}
                    value={formData.currentPassword}
                    onChangeText={(value) =>
                      setFormData((prev) => ({ ...prev, currentPassword: value }))
                    }
                    secureTextEntry={!showCurrentPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowCurrentPassword((prev) => !prev)}
                  >
                    <Ionicons
                      name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={Colors.textLight}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={Colors.textLight}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, styles.inputWithButton]}
                    placeholder="Enter new password"
                    placeholderTextColor={Colors.textLight}
                    value={formData.newPassword}
                    onChangeText={(value) =>
                      setFormData((prev) => ({ ...prev, newPassword: value }))
                    }
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowNewPassword((prev) => !prev)}
                  >
                    <Ionicons
                      name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={Colors.textLight}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm New Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={Colors.textLight}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, styles.inputWithButton]}
                    placeholder="Re-enter new password"
                    placeholderTextColor={Colors.textLight}
                    value={formData.confirmPassword}
                    onChangeText={(value) =>
                      setFormData((prev) => ({ ...prev, confirmPassword: value }))
                    }
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={Colors.textLight}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.requirementsBox}>
                <Text style={styles.requirementsTitle}>Password requirements:</Text>

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
                  • At least 8 characters long
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
                  • Include at least one uppercase letter
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
                  • Include at least one lowercase letter
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
                  • Include at least one number
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
                    <Text style={styles.primaryButtonText}>Update Password</Text>
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                activeOpacity={0.8}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {!!toastMessage && (
          <View
            style={[
              styles.toast,
              toastType === 'success' ? styles.toastSuccess : styles.toastError,
            ]}
          >
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        )}
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
  secondaryButton: {
    marginTop: 12,
    height: 46,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  secondaryButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 18,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    elevation: 8,
  },
  toastSuccess: {
    backgroundColor: '#0D7D6D',
  },
  toastError: {
    backgroundColor: '#DC2626',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
