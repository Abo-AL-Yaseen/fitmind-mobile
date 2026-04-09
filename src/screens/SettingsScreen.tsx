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
import * as SecureStore from 'expo-secure-store';
import {
  User,
  Lock,
  Bell,
  Target,
  LogOut,
  ChevronRight,
  Edit2,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

import { logout } from '../services/auth';
import {
  getCurrentUserGoal,
  upsertCurrentUserGoal,
  type UserGoal,
} from '../services/userGoals';
import {
  getMyProfile,
  saveMyProfile,
  type ProfileApiData,
} from '../services/profile';

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

  const [loading, setLoading] = useState(true);
  const [savingGoal, setSavingGoal] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const [profileData, setProfileData] = useState<ProfileApiData | null>(null);

  const [profileFields, setProfileFields] = useState({
    height: '',
    weight: '',
    age: '',
    gender: 'male',
    preferences: '',
    food_allergies: '',
    medical_conditions: '',
  });

  const [currentGoalRecord, setCurrentGoalRecord] = useState<UserGoal | null>(null);
  const [goalType, setGoalType] = useState('weight_loss');
  const [goalTypeIndex, setGoalTypeIndex] = useState(0);
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

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, type });

    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2500);
  }, []);

  const initials = useMemo(() => {
    const name = userName?.trim();
    if (!name) return 'FM';

    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }, [userName]);

  const loadScreenData = useCallback(async () => {
    try {
      setLoading(true);

      const [storedName, storedEmail] = await Promise.all([
        SecureStore.getItemAsync('fitmind_user_name'),
        SecureStore.getItemAsync('fitmind_email'),
      ]);

      setUserName(storedName ?? '');
      setUserEmail(storedEmail ?? '');

      try {
        const profile = await getMyProfile();

        if (profile) {
          setProfileData(profile);
          setProfileFields({
            height: profile.height != null ? String(profile.height) : '',
            weight: profile.weight != null ? String(profile.weight) : '',
            age: profile.age != null ? String(profile.age) : '',
            gender: profile.gender ?? 'male',
            preferences: profile.preferences ?? '',
            food_allergies: profile.food_allergies ?? '',
            medical_conditions: profile.medical_conditions ?? '',
          });
        }
      } catch (error) {
        showToast('Failed to load profile.', 'error');
      }

      try {
        const userGoal = await getCurrentUserGoal();

        if (userGoal) {
          setCurrentGoalRecord(userGoal);
          setGoalType(String(userGoal.goal_type ?? 'weight_loss'));
          setTargetWeight(String(userGoal.target_weight ?? ''));
        }
      } catch (error) {
        showToast('Failed to load fitness goal.', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadScreenData();
  }, [loadScreenData]);

  useEffect(() => {
    const index = GOAL_OPTIONS.findIndex((item) => item.value === goalType);
    if (index >= 0) setGoalTypeIndex(index);
  }, [goalType]);

  const cycleGoalType = () => {
    const nextIndex = (goalTypeIndex + 1) % GOAL_OPTIONS.length;
    setGoalTypeIndex(nextIndex);
    setGoalType(GOAL_OPTIONS[nextIndex].value);
  };

  const handleSaveGoal = async () => {
    const parsedWeight = Number(targetWeight);

    if (!targetWeight.trim() || Number.isNaN(parsedWeight)) {
      showToast('Please enter a valid target weight.', 'error');
      return;
    }

    try {
      setSavingGoal(true);

      const savedGoal = await upsertCurrentUserGoal({
        goal_type: goalType,
        target_weight: parsedWeight,
      });

      setCurrentGoalRecord(savedGoal);
      showToast('Fitness goal updated successfully.');
    } catch (error: any) {
      showToast(error?.message || 'Failed to update fitness goal.', 'error');
    } finally {
      setSavingGoal(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);

      const savedProfile = await saveMyProfile({
        age: profileFields.age ? Number(profileFields.age) : null,
        height: profileFields.height ? Number(profileFields.height) : null,
        weight: profileFields.weight ? Number(profileFields.weight) : null,
        gender: profileFields.gender,
        activity_level: '',
        preferences: profileFields.preferences,
        food_allergies: profileFields.food_allergies,
        medical_conditions: profileFields.medical_conditions,
      });

      setProfileData(savedProfile);
      setEditMode(false);
      showToast('Profile updated successfully.');
    } catch (error: any) {
      showToast(error?.message || 'Failed to update profile.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoggingOut(true);
      await logout();

      showToast('Signed out successfully.');

      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }, 700);
    } catch (error: any) {
      showToast(error?.message || 'Logout failed.', 'error');
    } finally {
      setLoggingOut(false);
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
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>

            <View style={styles.headerInfo}>
              <Text style={styles.headerName}>{userName || 'FitMind User'}</Text>
              <Text style={styles.headerEmail}>{userEmail || 'No email found'}</Text>

              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>⭐ Premium Member</Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardLeft}>
                <View style={styles.iconContainer}>
                  <User color="#0D7D6D" size={18} />
                </View>
                <Text style={styles.cardTitle}>Personal Information</Text>
              </View>

              <TouchableOpacity
                style={[styles.editButton, editMode && styles.editButtonActive]}
                onPress={() => setEditMode(!editMode)}
                activeOpacity={0.7}
              >
                <Edit2 color={editMode ? '#6B7280' : '#0D7D6D'} size={12} />
                <Text style={[styles.editButtonText, editMode && styles.editButtonTextActive]}>
                  {editMode ? 'Cancel' : 'Edit'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputsGrid}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  value={userName}
                  editable={false}
                  style={[styles.input, styles.inputDisabled]}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  value={userEmail}
                  editable={false}
                  keyboardType="email-address"
                  style={[styles.input, styles.inputDisabled]}
                />
              </View>

              <View style={styles.halfInputGroup}>
                <View style={[styles.inputGroup, styles.flexOne]}>
                  <Text style={styles.inputLabel}>Height</Text>
                  <TextInput
                    value={profileFields.height}
                    editable={editMode}
                    onChangeText={(value) =>
                      setProfileFields((prev) => ({ ...prev, height: value }))
                    }
                    keyboardType="numeric"
                    placeholder="Enter height"
                    placeholderTextColor="#9CA3AF"
                    style={[styles.input, !editMode && styles.inputDisabled]}
                  />
                </View>

                <View style={[styles.inputGroup, styles.flexOne]}>
                  <Text style={styles.inputLabel}>Weight</Text>
                  <TextInput
                    value={profileFields.weight}
                    editable={editMode}
                    onChangeText={(value) =>
                      setProfileFields((prev) => ({ ...prev, weight: value }))
                    }
                    keyboardType="numeric"
                    placeholder="Enter weight"
                    placeholderTextColor="#9CA3AF"
                    style={[styles.input, !editMode && styles.inputDisabled]}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Age</Text>
                <TextInput
                  value={profileFields.age}
                  editable={editMode}
                  onChangeText={(value) =>
                    setProfileFields((prev) => ({ ...prev, age: value }))
                  }
                  keyboardType="numeric"
                  placeholder="Enter age"
                  placeholderTextColor="#9CA3AF"
                  style={[styles.input, !editMode && styles.inputDisabled]}
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
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeaderSimple}>
              <View style={[styles.iconContainer, { backgroundColor: '#FEF3C7' }]}>
                <Target color="#F59E0B" size={18} />
              </View>
              <Text style={styles.cardTitle}>Fitness Goals</Text>
            </View>

            <View style={styles.inputsGrid}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Primary Goal</Text>
                <TouchableOpacity style={styles.selectInput} activeOpacity={0.7} onPress={cycleGoalType}>
                  <Text style={styles.selectText}>
                    {GOAL_OPTIONS[goalTypeIndex]?.label ?? 'Weight Loss'}
                  </Text>
                  <ChevronRight color="#9CA3AF" size={16} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Target Weight</Text>
                <TextInput
                  value={targetWeight}
                  onChangeText={setTargetWeight}
                  keyboardType="numeric"
                  style={styles.input}
                  placeholder="Enter target weight"
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
                  ? 'Saving...'
                  : currentGoalRecord?.id
                  ? 'Update Goal'
                  : 'Create Goal'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeaderSimple}>
              <View style={[styles.iconContainer, { backgroundColor: '#F3E8FF' }]}>
                <Bell color="#A855F7" size={18} />
              </View>
              <Text style={styles.cardTitle}>Notifications</Text>
            </View>

            <View style={styles.notificationsList}>
              {[
                {
                  key: 'workoutReminders' as const,
                  title: 'Workout Reminders',
                  desc: 'Get notified about scheduled workouts',
                },
                {
                  key: 'mealReminders' as const,
                  title: 'Meal Reminders',
                  desc: 'Reminders for meal times',
                },
                {
                  key: 'progressUpdates' as const,
                  title: 'Progress Updates',
                  desc: 'Weekly progress summaries',
                },
                {
                  key: 'newsOffers' as const,
                  title: 'News & Offers',
                  desc: 'Special deals and announcements',
                },
              ].map((item, i) => (
                <View key={item.key}>
                  {i > 0 && <View style={styles.separator} />}
                  <View style={styles.notificationItem}>
                    <View style={styles.notificationContent}>
                      <Text style={styles.notificationTitle}>{item.title}</Text>
                      <Text style={styles.notificationDesc}>{item.desc}</Text>
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
            <View style={styles.cardHeaderSimple}>
              <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
                <Lock color="#EF4444" size={18} />
              </View>
              <Text style={styles.cardTitle}>Account Security</Text>
            </View>

            <View style={styles.securityList}>
              <TouchableOpacity style={styles.securityItem} activeOpacity={0.7} onPress={goToChangePassword}>
                <Text style={styles.securityItemText}>Change Password</Text>
                <ChevronRight color="#D1D5DB" size={16} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.logoutButton, loggingOut && styles.logoutButtonDisabled]}
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
              {loggingOut ? 'Signing Out...' : 'Sign Out'}
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
});