import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Lock,
  Bell,
  Target,
  LogOut,
  ChevronRight,
  Edit2,
  Globe2,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

import { useMyProfileQuery } from '../hooks/profile/queries/useMyProfileQuery';
import { useSaveMyProfileMutation } from '../hooks/profile/mutations/useSaveMyProfileMutation';
import { useCurrentUserGoalQuery } from '../hooks/userGoals/queries/useCurrentUserGoalQuery';
import { useUpsertCurrentUserGoalMutation } from '../hooks/userGoals/mutations/useUpsertCurrentUserGoalMutation';
import { useStoredAuthQuery } from '../hooks/auth/queries/useStoredAuthQuery';
import { useLogoutMutation } from '../hooks/auth/mutations/useLogoutMutation';
import { useTranslation, type Language } from '../i18n';

type ToastState = {
  visible: boolean;
  message: string;
  type: 'success' | 'error';
};

const GOAL_OPTIONS = [
  { label: 'Weight Loss', value: 'weight_loss' },
  { label: 'Muscle Gain', value: 'muscle_gain' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'General Fitness', value: 'general_fitness' },
];

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { language, setLanguage, t, isRtl } = useTranslation();

  const authQuery = useStoredAuthQuery();
  const profileQuery = useMyProfileQuery();
  const currentGoalQuery = useCurrentUserGoalQuery();

  const saveProfileMutation = useSaveMyProfileMutation();
  const saveGoalMutation = useUpsertCurrentUserGoalMutation();
  const logoutMutation = useLogoutMutation();

  const [editMode, setEditMode] = useState(false);

  const [profileFormInitialized, setProfileFormInitialized] = useState(false);
  const [goalFormInitialized, setGoalFormInitialized] = useState(false);

  const [profileFields, setProfileFields] = useState({
    height: '',
    weight: '',
    age: '',
    gender: 'male',
    preferences: '',
    food_allergies: '',
    medical_conditions: '',
  });

  const [goalType, setGoalType] = useState('weight_loss');
  const [targetWeight, setTargetWeight] = useState('');

  const [notifications, setNotifications] = useState({
    workoutReminders: true,
    mealReminders: true,
    progressUpdates: true,
    newsOffers: false,
  });

  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'success',
  });

  const userName = authQuery.data?.userName ?? '';
  const userEmail = authQuery.data?.email ?? '';
  const profileData = profileQuery.data ?? null;
  const currentGoalRecord = currentGoalQuery.data ?? null;

  const loading =
    authQuery.isLoading || profileQuery.isLoading || currentGoalQuery.isLoading;

  const savingProfile = saveProfileMutation.isPending;
  const savingGoal = saveGoalMutation.isPending;
  const loggingOut = logoutMutation.isPending;

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' = 'success') => {
      setToast({ visible: true, message, type });

      setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 2500);
    },
    []
  );

  useEffect(() => {
    if (profileQuery.isError) {
      showToast(t('settings.failedProfile'), 'error');
    }
  }, [profileQuery.isError, showToast, t]);

  useEffect(() => {
    if (currentGoalQuery.isError) {
      showToast(t('settings.failedGoal'), 'error');
    }
  }, [currentGoalQuery.isError, showToast, t]);

  useEffect(() => {
    if (!profileData || profileFormInitialized) return;

    setProfileFields({
      height: profileData.height != null ? String(profileData.height) : '',
      weight: profileData.weight != null ? String(profileData.weight) : '',
      age: profileData.age != null ? String(profileData.age) : '',
      gender: profileData.gender ?? 'male',
      preferences: profileData.preferences ?? '',
      food_allergies: profileData.food_allergies ?? '',
      medical_conditions: profileData.medical_conditions ?? '',
    });

    setProfileFormInitialized(true);
  }, [profileData, profileFormInitialized]);

  useEffect(() => {
    if (!currentGoalRecord || goalFormInitialized) return;

    setGoalType(String(currentGoalRecord.goal_type ?? 'weight_loss'));
    setTargetWeight(String(currentGoalRecord.target_weight ?? ''));

    setGoalFormInitialized(true);
  }, [currentGoalRecord, goalFormInitialized]);

  const initials = useMemo(() => {
    const name = userName?.trim();
    if (!name) return 'FM';

    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }, [userName]);

  const goalTypeIndex = useMemo(() => {
    const index = GOAL_OPTIONS.findIndex((item) => item.value === goalType);
    return index >= 0 ? index : 0;
  }, [goalType]);

  const cycleGoalType = () => {
    const nextIndex = (goalTypeIndex + 1) % GOAL_OPTIONS.length;
    setGoalType(GOAL_OPTIONS[nextIndex].value);
  };

  const getGoalLabel = (value: string) => t(`settings.goal.${value}`);

  const handleLanguageSelect = async (nextLanguage: Language) => {
    await setLanguage(nextLanguage);
    showToast(t('language.updated'));
  };

  const handleSaveGoal = async () => {
    const parsedWeight = Number(targetWeight);

    if (!targetWeight.trim() || Number.isNaN(parsedWeight)) {
      showToast(t('settings.validTargetWeight'), 'error');
      return;
    }

    try {
      const savedGoal = await saveGoalMutation.mutateAsync({
        goal_type: goalType,
        target_weight: parsedWeight,
      });

      setGoalType(String(savedGoal.goal_type ?? goalType));
      setTargetWeight(String(savedGoal.target_weight ?? parsedWeight));
      setGoalFormInitialized(true);

      showToast(t('settings.goalUpdated'));
    } catch (error: any) {
      showToast(error?.message || t('settings.goalUpdateFailed'), 'error');
    }
  };

  const handleSaveProfile = async () => {
    try {
      const savedProfile = await saveProfileMutation.mutateAsync({
        age: profileFields.age ? Number(profileFields.age) : null,
        height: profileFields.height ? Number(profileFields.height) : null,
        weight: profileFields.weight ? Number(profileFields.weight) : null,
        gender: profileFields.gender,
        activity_level: '',
        preferences: profileFields.preferences,
        food_allergies: profileFields.food_allergies,
        medical_conditions: profileFields.medical_conditions,
      });

      if (savedProfile) {
        setProfileFields({
          height: savedProfile.height != null ? String(savedProfile.height) : '',
          weight: savedProfile.weight != null ? String(savedProfile.weight) : '',
          age: savedProfile.age != null ? String(savedProfile.age) : '',
          gender: savedProfile.gender ?? 'male',
          preferences: savedProfile.preferences ?? '',
          food_allergies: savedProfile.food_allergies ?? '',
          medical_conditions: savedProfile.medical_conditions ?? '',
        });
      }

      setProfileFormInitialized(true);
      setEditMode(false);
      showToast(t('settings.profileUpdated'));
    } catch (error: any) {
      showToast(error?.message || t('settings.profileUpdateFailed'), 'error');
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutMutation.mutateAsync();

      showToast(t('settings.signedOut'));

      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }, 700);
    } catch (error: any) {
      showToast(error?.message || t('settings.logoutFailed'), 'error');
    }
  };

  const goToChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0D7D6D" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={[styles.header, isRtl && styles.rowReverse]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>

            <View style={styles.headerInfo}>
              <Text style={[styles.headerName, isRtl && styles.textRight]}>
                {userName || t('common.fitmindUser')}
              </Text>
              <Text style={[styles.headerEmail, isRtl && styles.textRight]}>
                {userEmail || t('common.noEmail')}
              </Text>

              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>
                  {t('settings.premiumMember')}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <View style={[styles.cardHeader, isRtl && styles.rowReverse]}>
              <View style={[styles.cardLeft, isRtl && styles.rowReverse]}>
                <View style={styles.iconContainer}>
                  <User color="#0D7D6D" size={18} />
                </View>
                <Text style={[styles.cardTitle, isRtl && styles.textRight]}>
                  {t('settings.personalInfo')}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.editButton,
                  isRtl && styles.rowReverse,
                  editMode && styles.editButtonActive,
                ]}
                onPress={() => setEditMode(!editMode)}
                activeOpacity={0.7}
              >
                <Edit2 color={editMode ? '#6B7280' : '#0D7D6D'} size={12} />
                <Text style={[styles.editButtonText, editMode && styles.editButtonTextActive]}>
                  {editMode ? t('common.cancel') : t('common.edit')}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputsGrid}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, isRtl && styles.textRight]}>
                  {t('common.fullName')}
                </Text>
                <TextInput
                  value={userName}
                  editable={false}
                  style={[styles.input, styles.inputDisabled, isRtl && styles.textRight]}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, isRtl && styles.textRight]}>
                  {t('common.email')}
                </Text>
                <TextInput
                  value={userEmail}
                  editable={false}
                  keyboardType="email-address"
                  style={[styles.input, styles.inputDisabled]}
                />
              </View>

              <View style={styles.halfInputGroup}>
                <View style={[styles.inputGroup, styles.flexOne]}>
                  <Text style={[styles.inputLabel, isRtl && styles.textRight]}>
                    {t('settings.height')}
                  </Text>
                  <TextInput
                    value={profileFields.height}
                    editable={editMode}
                    onChangeText={(value) =>
                      setProfileFields((prev) => ({ ...prev, height: value }))
                    }
                    keyboardType="numeric"
                    placeholder={t('settings.enterHeight')}
                    placeholderTextColor="#9CA3AF"
                    style={[
                      styles.input,
                      isRtl && styles.textRight,
                      !editMode && styles.inputDisabled,
                    ]}
                  />
                </View>

                <View style={[styles.inputGroup, styles.flexOne]}>
                  <Text style={[styles.inputLabel, isRtl && styles.textRight]}>
                    {t('settings.weight')}
                  </Text>
                  <TextInput
                    value={profileFields.weight}
                    editable={editMode}
                    onChangeText={(value) =>
                      setProfileFields((prev) => ({ ...prev, weight: value }))
                    }
                    keyboardType="numeric"
                    placeholder={t('settings.enterWeight')}
                    placeholderTextColor="#9CA3AF"
                    style={[
                      styles.input,
                      isRtl && styles.textRight,
                      !editMode && styles.inputDisabled,
                    ]}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, isRtl && styles.textRight]}>
                  {t('settings.age')}
                </Text>
                <TextInput
                  value={profileFields.age}
                  editable={editMode}
                  onChangeText={(value) =>
                    setProfileFields((prev) => ({ ...prev, age: value }))
                  }
                  keyboardType="numeric"
                  placeholder={t('settings.enterAge')}
                  placeholderTextColor="#9CA3AF"
                  style={[
                    styles.input,
                    isRtl && styles.textRight,
                    !editMode && styles.inputDisabled,
                  ]}
                />
              </View>
            </View>

            {editMode && (
              <TouchableOpacity
                style={[styles.saveButton, savingProfile && styles.saveButtonDisabled]}
                activeOpacity={0.8}
                onPress={handleSaveProfile}
                disabled={savingProfile}
              >
                <Text style={styles.saveButtonText}>
                  {savingProfile ? t('common.saving') : t('settings.saveProfile')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.card}>
            <View style={[styles.cardHeaderSimple, isRtl && styles.rowReverse]}>
              <View style={[styles.iconContainer, { backgroundColor: '#E0F2FE' }]}>
                <Globe2 color="#0284C7" size={18} />
              </View>
              <View style={styles.cardTitleWrap}>
                <Text style={[styles.cardTitle, isRtl && styles.textRight]}>
                  {t('language.title')}
                </Text>
                <Text style={[styles.cardSubtitle, isRtl && styles.textRight]}>
                  {t('language.subtitle')}
                </Text>
              </View>
            </View>

            <View style={[styles.languageRow, isRtl && styles.rowReverse]}>
              {(['en', 'ar'] as Language[]).map((option) => {
                const active = language === option;

                return (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.languageButton,
                      active && styles.languageButtonActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => handleLanguageSelect(option)}
                  >
                    <Text
                      style={[
                        styles.languageButtonText,
                        active && styles.languageButtonTextActive,
                      ]}
                    >
                      {option === 'en'
                        ? t('language.english')
                        : t('language.arabic')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <View style={[styles.cardHeaderSimple, isRtl && styles.rowReverse]}>
              <View style={[styles.iconContainer, { backgroundColor: '#FEF3C7' }]}>
                <Target color="#F59E0B" size={18} />
              </View>
              <Text style={[styles.cardTitle, isRtl && styles.textRight]}>
                {t('settings.fitnessGoals')}
              </Text>
            </View>

            <View style={styles.inputsGrid}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, isRtl && styles.textRight]}>
                  {t('settings.primaryGoal')}
                </Text>
                <TouchableOpacity
                  style={[styles.selectInput, isRtl && styles.rowReverse]}
                  activeOpacity={0.7}
                  onPress={cycleGoalType}
                >
                  <Text style={styles.selectText}>
                    {getGoalLabel(GOAL_OPTIONS[goalTypeIndex]?.value ?? 'weight_loss')}
                  </Text>
                  <ChevronRight color="#9CA3AF" size={16} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, isRtl && styles.textRight]}>
                  {t('settings.targetWeight')}
                </Text>
                <TextInput
                  value={targetWeight}
                  onChangeText={setTargetWeight}
                  keyboardType="numeric"
                  style={[styles.input, isRtl && styles.textRight]}
                  placeholder={t('settings.enterTargetWeight')}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, savingGoal && styles.saveButtonDisabled]}
              activeOpacity={0.8}
              onPress={handleSaveGoal}
              disabled={savingGoal}
            >
              <Text style={styles.saveButtonText}>
                {savingGoal
                  ? t('common.saving')
                  : currentGoalRecord?.id
                  ? t('settings.updateGoal')
                  : t('settings.createGoal')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <View style={[styles.cardHeaderSimple, isRtl && styles.rowReverse]}>
              <View style={[styles.iconContainer, { backgroundColor: '#F3E8FF' }]}>
                <Bell color="#A855F7" size={18} />
              </View>
              <Text style={[styles.cardTitle, isRtl && styles.textRight]}>
                {t('settings.notifications')}
              </Text>
            </View>

            <View style={styles.notificationsList}>
              {[
                {
                  key: 'workoutReminders' as const,
                  title: t('settings.workoutReminders'),
                  desc: t('settings.workoutRemindersDesc'),
                },
                {
                  key: 'mealReminders' as const,
                  title: t('settings.mealReminders'),
                  desc: t('settings.mealRemindersDesc'),
                },
                {
                  key: 'progressUpdates' as const,
                  title: t('settings.progressUpdates'),
                  desc: t('settings.progressUpdatesDesc'),
                },
                {
                  key: 'newsOffers' as const,
                  title: t('settings.newsOffers'),
                  desc: t('settings.newsOffersDesc'),
                },
              ].map((item, i) => (
                <View key={item.key}>
                  {i > 0 && <View style={styles.separator} />}
                  <View style={[styles.notificationItem, isRtl && styles.rowReverse]}>
                    <View style={styles.notificationContent}>
                      <Text style={[styles.notificationTitle, isRtl && styles.textRight]}>
                        {item.title}
                      </Text>
                      <Text style={[styles.notificationDesc, isRtl && styles.textRight]}>
                        {item.desc}
                      </Text>
                    </View>

                    <Switch
                      value={notifications[item.key]}
                      onValueChange={(checked) =>
                        setNotifications((prev) => ({
                          ...prev,
                          [item.key]: checked,
                        }))
                      }
                      trackColor={{ false: '#E5E7EB', true: '#7FD4C9' }}
                      thumbColor={notifications[item.key] ? '#0D7D6D' : '#F3F4F6'}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <View style={[styles.cardHeaderSimple, isRtl && styles.rowReverse]}>
              <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
                <Lock color="#EF4444" size={18} />
              </View>
              <Text style={[styles.cardTitle, isRtl && styles.textRight]}>
                {t('settings.accountSecurity')}
              </Text>
            </View>

            <View style={styles.securityList}>
              <TouchableOpacity
                style={[styles.securityItem, isRtl && styles.rowReverse]}
                activeOpacity={0.7}
                onPress={goToChangePassword}
              >
                <Text style={styles.securityItemText}>
                  {t('settings.changePassword')}
                </Text>
                <ChevronRight color="#D1D5DB" size={16} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.logoutButton,
              isRtl && styles.rowReverse,
              loggingOut && styles.logoutButtonDisabled,
            ]}
            activeOpacity={0.7}
            onPress={handleSignOut}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <ActivityIndicator color="#EF4444" />
            ) : (
              <LogOut color="#EF4444" size={18} />
            )}
            <Text style={styles.logoutButtonText}>
              {loggingOut ? t('settings.signingOut') : t('settings.signOut')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {toast.visible && (
        <View
          style={[
            styles.toast,
            toast.type === 'success' ? styles.toastSuccess : styles.toastError,
          ]}
        >
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    backgroundColor: '#0D7D6D',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    overflow: 'hidden',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  headerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  premiumBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FBBF24',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 6,
  },
  premiumBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#78350F',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginTop: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cardHeaderSimple: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardSubtitle: {
    marginTop: 2,
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 17,
  },
  languageRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
  },
  languageButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  languageButtonActive: {
    backgroundColor: '#E6F4F1',
    borderColor: '#0D7D6D',
  },
  languageButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '700',
  },
  languageButtonTextActive: {
    color: '#0D7D6D',
    fontWeight: '900',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E6F4F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButtonActive: {
    backgroundColor: '#F3F4F6',
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0D7D6D',
  },
  editButtonTextActive: {
    color: '#6B7280',
  },
  inputsGrid: {
    gap: 12,
    marginTop: 16,
  },
  inputGroup: {
    gap: 6,
  },
  halfInputGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  flexOne: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 12,
    minHeight: 44,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#111827',
  },
  inputDisabled: {
    backgroundColor: '#F9FAFB',
    color: '#6B7280',
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 12,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  selectText: {
    fontSize: 14,
    color: '#111827',
  },
  saveButton: {
    backgroundColor: '#0D7D6D',
    borderRadius: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  notificationsList: {
    marginTop: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationContent: {
    flex: 1,
    paddingRight: 12,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  notificationDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
  },
  securityList: {
    marginTop: 16,
    gap: 8,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  securityItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FEE2E2',
    borderRadius: 12,
    minHeight: 48,
    marginTop: 16,
    marginBottom: 12,
  },
  logoutButtonDisabled: {
    opacity: 0.7,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
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
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  textRight: {
    textAlign: 'right',
  },
});
