import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Activity,
  Heart,
  ArrowLeft,
  Check,
  CircleAlert,
  ChevronRight,
  HeartPulse,
} from 'lucide-react-native';
import type { ProfilePayload } from '../services/profile';
import { useMyProfileQuery } from '../hooks/profile/queries/useMyProfileQuery';
import { useSaveMyProfileMutation } from '../hooks/profile/mutations/useSaveMyProfileMutation';
import { useTranslation } from '../i18n';

type FormState = {
  age: string;
  height: string;
  weight: string;
  gender: string;
  activityLevel: string;
  preferences: string;
  foodAllergies: string;
  medicalConditions: string;
};

type ToastState = {
  visible: boolean;
  type: 'success' | 'error';
  title: string;
  message: string;
};

const initialFormData: FormState = {
  age: '',
  height: '',
  weight: '',
  gender: 'male',
  activityLevel: 'moderate',
  preferences: '',
  foodAllergies: '',
  medicalConditions: '',
};

const genderOptions = ['male', 'female'];
const activityOptions = ['low', 'moderate', 'high'];

export default function ProfileScreen({ navigation }: any) {
  const { t, isRtl } = useTranslation();
  const [formData, setFormData] = useState<FormState>(initialFormData);

  const [toast, setToast] = useState<ToastState>({
    visible: false,
    type: 'success',
    title: '',
    message: '',
  });

  const {
    data: profile,
    isLoading,
    error,
  } = useMyProfileQuery();

  const saveProfileMutation = useSaveMyProfileMutation();

  const toastTranslateY = useRef(new Animated.Value(120)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const goBackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const profileExists = !!profile;
  const showMissingProfileMessage = !isLoading && !profile;
  const isSaving = saveProfileMutation.isPending;

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (goBackTimerRef.current) clearTimeout(goBackTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (profile) {
      setFormData({
        age: profile.age != null ? String(profile.age) : '',
        height: profile.height != null ? String(profile.height) : '',
        weight: profile.weight != null ? String(profile.weight) : '',
        gender: profile.gender || 'male',
        activityLevel: profile.activity_level || 'moderate',
        preferences: profile.preferences || '',
        foodAllergies: profile.food_allergies || '',
        medicalConditions: profile.medical_conditions || '',
      });
    } else if (!isLoading) {
      setFormData(initialFormData);
    }
  }, [profile, isLoading]);

  useEffect(() => {
    if (error) {
      showToast(
        'error',
        'Error',
        error instanceof Error
          ? error.message
          : t('profile.loadFailed')
      );
    }
  }, [error, t]);

  const saveButtonLabel = useMemo(() => {
    if (isSaving) return t('common.saving');
    return profileExists ? t('profile.updateProfile') : t('profile.createProfile');
  }, [isSaving, profileExists, t]);

  const showToast = (
    type: 'success' | 'error',
    title: string,
    message: string,
    shouldGoBack = false
  ) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    if (goBackTimerRef.current) clearTimeout(goBackTimerRef.current);

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

    if (shouldGoBack) {
      goBackTimerRef.current = setTimeout(() => {
        navigation.goBack();
      }, visibleDuration - 150);
    }
  };

  const updateField = (key: keyof FormState, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const toNullableNumber = (value: string): number | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const parsed = Number(trimmed);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const buildPayload = (): ProfilePayload => ({
    age: toNullableNumber(formData.age),
    height: toNullableNumber(formData.height),
    weight: toNullableNumber(formData.weight),
    gender: formData.gender.trim().toLowerCase(),
    activity_level: formData.activityLevel.trim().toLowerCase(),
    preferences: formData.preferences.trim(),
    food_allergies: formData.foodAllergies.trim(),
    medical_conditions: formData.medicalConditions.trim(),
  });

  const validateForm = () => {
    if (!formData.age.trim()) {
      showToast('error', t('common.missingField'), t('profile.enterAge'));
      return false;
    }

    if (!formData.height.trim()) {
      showToast('error', t('common.missingField'), t('profile.enterHeight'));
      return false;
    }

    if (!formData.weight.trim()) {
      showToast('error', t('common.missingField'), t('profile.enterWeight'));
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      await saveProfileMutation.mutateAsync(buildPayload());

      showToast(
        'success',
        t('common.savedSuccessfully'),
        profileExists ? t('profile.updated') : t('profile.created'),
        true
      );
    } catch (error: any) {
      showToast(
        'error',
        t('common.saveFailed'),
        error?.message || t('profile.saveFailed')
      );
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0D7D6D" />
          <Text style={styles.loadingText}>{t('profile.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const toastIsSuccess = toast.type === 'success';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <View style={[styles.header, isRtl && styles.rowReverse]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <ArrowLeft color="#FFFFFF" size={24} />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, isRtl && styles.textRight]}>
              {t('profile.title')}
            </Text>
            <Text style={[styles.headerSubtitle, isRtl && styles.textRight]}>
              {t('profile.subtitle')}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {showMissingProfileMessage && (
            <View style={styles.warningBox}>
              <Text style={[styles.warningTitle, isRtl && styles.textRight]}>
                {t('profile.notCompleted')}
              </Text>
              <Text style={[styles.warningText, isRtl && styles.textRight]}>
                {t('profile.notCompletedText')}
              </Text>
            </View>
          )}

          <View style={styles.card}>
            <View style={[styles.sectionHeader, isRtl && styles.rowReverse]}>
              <View style={styles.sectionIcon}>
                <User color="#0D7D6D" size={16} />
              </View>
              <Text style={[styles.sectionTitle, isRtl && styles.textRight]}>
                {t('profile.basicInfo')}
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, isRtl && styles.textRight]}>
                {t('profile.age')}
              </Text>
              <TextInput
                value={formData.age}
                onChangeText={(text) => updateField('age', text)}
                keyboardType="numeric"
                placeholder={t('profile.enterAge')}
                style={[styles.input, isRtl && styles.textRight]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, isRtl && styles.textRight]}>
                {t('profile.gender')}
              </Text>
              <View style={[styles.optionsRow, isRtl && styles.rowReverse]}>
                {genderOptions.map((option) => {
                  const isActive = formData.gender === option;

                  return (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.optionChip,
                        isActive && styles.optionChipActive,
                      ]}
                      onPress={() => updateField('gender', option)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          isActive && styles.optionChipTextActive,
                        ]}
                      >
                        {t(`profile.${option}`)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={[styles.row, isRtl && styles.rowReverse]}>
              <View style={[styles.formGroup, styles.halfWidth]}>
                <Text style={[styles.label, isRtl && styles.textRight]}>
                  {t('profile.heightCm')}
                </Text>
                <TextInput
                  value={formData.height}
                  onChangeText={(text) => updateField('height', text)}
                  keyboardType="numeric"
                  placeholder="175"
                  style={[styles.input, isRtl && styles.textRight]}
                />
              </View>

              <View style={[styles.formGroup, styles.halfWidth]}>
                <Text style={[styles.label, isRtl && styles.textRight]}>
                  {t('profile.weightKg')}
                </Text>
                <TextInput
                  value={formData.weight}
                  onChangeText={(text) => updateField('weight', text)}
                  keyboardType="numeric"
                  placeholder="70"
                  style={[styles.input, isRtl && styles.textRight]}
                />
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <View style={[styles.sectionHeader, isRtl && styles.rowReverse]}>
              <View style={styles.sectionIcon}>
                <Activity color="#0D7D6D" size={16} />
              </View>
              <Text style={[styles.sectionTitle, isRtl && styles.textRight]}>
                {t('profile.lifestyle')}
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, isRtl && styles.textRight]}>
                {t('profile.activityLevel')}
              </Text>
              <View style={[styles.optionsRow, isRtl && styles.rowReverse]}>
                {activityOptions.map((option) => {
                  const isActive = formData.activityLevel === option;

                  return (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.optionChip,
                        isActive && styles.optionChipActive,
                      ]}
                      onPress={() => updateField('activityLevel', option)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          isActive && styles.optionChipTextActive,
                        ]}
                      >
                        {t(`profile.activity.${option}`)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, isRtl && styles.textRight]}>
                {t('profile.preferences')}
              </Text>
              <TextInput
                value={formData.preferences}
                onChangeText={(text) => updateField('preferences', text)}
                placeholder={t('profile.preferencesPlaceholder')}
                multiline
                numberOfLines={3}
                style={[styles.input, styles.textarea, isRtl && styles.textRight]}
              />
              <Text style={[styles.hint, isRtl && styles.textRight]}>
                {t('profile.preferencesHint')}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={[styles.sectionHeader, isRtl && styles.rowReverse]}>
              <View style={styles.sectionIcon}>
                <Heart color="#0D7D6D" size={16} />
              </View>
              <Text style={[styles.sectionTitle, isRtl && styles.textRight]}>
                {t('profile.healthInfo')}
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, isRtl && styles.textRight]}>
                {t('profile.foodAllergies')}
              </Text>
              <TextInput
                value={formData.foodAllergies}
                onChangeText={(text) => updateField('foodAllergies', text)}
                placeholder={t('profile.foodAllergiesPlaceholder')}
                multiline
                numberOfLines={3}
                style={[styles.input, styles.textarea, isRtl && styles.textRight]}
              />
              <Text style={[styles.hint, isRtl && styles.textRight]}>
                {t('profile.foodAllergiesHint')}
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, isRtl && styles.textRight]}>
                {t('profile.medicalConditions')}
              </Text>
              <TextInput
                value={formData.medicalConditions}
                onChangeText={(text) => updateField('medicalConditions', text)}
                placeholder={t('profile.medicalConditionsPlaceholder')}
                multiline
                numberOfLines={3}
                style={[styles.input, styles.textarea, isRtl && styles.textRight]}
              />
              <Text style={[styles.hint, isRtl && styles.textRight]}>
                {t('profile.medicalConditionsHint')}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.manageInjuriesButton, isRtl && styles.rowReverse]}
              onPress={() => navigation.navigate('ManageInjuries')}
              activeOpacity={0.8}
            >
              <View style={styles.manageInjuriesIcon}>
                <HeartPulse color="#0D7D6D" size={16} />
              </View>

              <View style={styles.manageInjuriesTextWrap}>
                <Text style={[styles.manageInjuriesTitle, isRtl && styles.textRight]}>
                  {t('profile.manageInjuries')}
                </Text>
                <Text style={[styles.manageInjuriesSubtitle, isRtl && styles.textRight]}>
                  {t('profile.manageInjuriesSubtitle')}
                </Text>
              </View>

              <ChevronRight color="#9CA3AF" size={18} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.saveButton,
              isRtl && styles.rowReverse,
              isSaving && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            <Check color="#FFFFFF" size={20} />
            <Text style={styles.saveButtonText}>{saveButtonLabel}</Text>
          </TouchableOpacity>
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
                  <Check color="#FFFFFF" size={16} />
                ) : (
                  <CircleAlert color="#FFFFFF" size={16} />
                )}
              </View>

              <View style={styles.toastTextWrap}>
                <Text style={styles.toastTitle}>{toast.title}</Text>
                <Text style={styles.toastMessage}>{toast.message}</Text>
              </View>
            </View>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0D7D6D',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#0D7D6D',
    paddingTop: 10,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 110,
  },
  warningBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  warningTitle: {
    color: '#B91C1C',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  warningText: {
    color: '#DC2626',
    fontSize: 13,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    minHeight: 48,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#111827',
  },
  textarea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    lineHeight: 18,
  },
  manageInjuriesButton: {
    minHeight: 58,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  manageInjuriesIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageInjuriesTextWrap: {
    flex: 1,
  },
  manageInjuriesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  manageInjuriesSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  optionChipActive: {
    backgroundColor: '#E6F4F1',
    borderColor: '#0D7D6D',
  },
  optionChipText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  optionChipTextActive: {
    color: '#0D7D6D',
    fontWeight: '600',
  },
  saveButton: {
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0D7D6D',
    minHeight: 56,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 16,
    shadowColor: '#0D7D6D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  textRight: {
    textAlign: 'right',
  },
});
