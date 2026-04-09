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
} from 'lucide-react-native';
import {
  getMyProfile,
  saveMyProfile,
  type ProfilePayload,
} from '../services/profile';

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
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profileExists, setProfileExists] = useState(false);
  const [showMissingProfileMessage, setShowMissingProfileMessage] =
    useState(false);
  const [formData, setFormData] = useState<FormState>(initialFormData);

  const [toast, setToast] = useState<ToastState>({
    visible: false,
    type: 'success',
    title: '',
    message: '',
  });

  const toastTranslateY = useRef(new Animated.Value(120)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const goBackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadProfile();

    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (goBackTimerRef.current) clearTimeout(goBackTimerRef.current);
    };
  }, []);

  const saveButtonLabel = useMemo(() => {
    if (isSaving) return 'Saving...';
    return profileExists ? 'Update Profile' : 'Create Profile';
  }, [isSaving, profileExists]);

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

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setShowMissingProfileMessage(false);

      const profile = await getMyProfile();

      if (profile) {
        setProfileExists(true);
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
      } else {
        setProfileExists(false);
        setShowMissingProfileMessage(true);
        setFormData(initialFormData);
      }
    } catch (error: any) {
      showToast(
        'error',
        'Error',
        error?.message || 'Failed to load profile information.'
      );
    } finally {
      setIsLoading(false);
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
      showToast('error', 'Missing field', 'Please enter your age.');
      return false;
    }

    if (!formData.height.trim()) {
      showToast('error', 'Missing field', 'Please enter your height.');
      return false;
    }

    if (!formData.weight.trim()) {
      showToast('error', 'Missing field', 'Please enter your weight.');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);

      await saveMyProfile(buildPayload());

      setProfileExists(true);
      setShowMissingProfileMessage(false);

      showToast(
        'success',
        'Saved successfully',
        profileExists
          ? 'Your profile has been updated successfully.'
          : 'Your profile has been created successfully.',
        true
      );
    } catch (error: any) {
      showToast(
        'error',
        'Save failed',
        error?.message || 'Failed to save profile.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0D7D6D" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const toastIsSuccess = toast.type === 'success';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <ArrowLeft color="#FFFFFF" size={24} />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>My Profile</Text>
            <Text style={styles.headerSubtitle}>
              Manage your personal information
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
              <Text style={styles.warningTitle}>Profile not completed</Text>
              <Text style={styles.warningText}>
                Please fill in your profile information to complete your account.
              </Text>
            </View>
          )}

          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <User color="#0D7D6D" size={16} />
              </View>
              <Text style={styles.sectionTitle}>Basic Information</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                value={formData.age}
                onChangeText={(text) => updateField('age', text)}
                keyboardType="numeric"
                placeholder="Enter your age"
                style={styles.input}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.optionsRow}>
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
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.formGroup, styles.halfWidth]}>
                <Text style={styles.label}>Height (cm)</Text>
                <TextInput
                  value={formData.height}
                  onChangeText={(text) => updateField('height', text)}
                  keyboardType="numeric"
                  placeholder="175"
                  style={styles.input}
                />
              </View>

              <View style={[styles.formGroup, styles.halfWidth]}>
                <Text style={styles.label}>Weight (kg)</Text>
                <TextInput
                  value={formData.weight}
                  onChangeText={(text) => updateField('weight', text)}
                  keyboardType="numeric"
                  placeholder="70"
                  style={styles.input}
                />
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Activity color="#0D7D6D" size={16} />
              </View>
              <Text style={styles.sectionTitle}>Lifestyle</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Activity Level</Text>
              <View style={styles.optionsRow}>
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
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Preferences</Text>
              <TextInput
                value={formData.preferences}
                onChangeText={(text) => updateField('preferences', text)}
                placeholder="e.g., Strength training, Running, Yoga"
                multiline
                numberOfLines={3}
                style={[styles.input, styles.textarea]}
              />
              <Text style={styles.hint}>
                Share your fitness interests and goals
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Heart color="#0D7D6D" size={16} />
              </View>
              <Text style={styles.sectionTitle}>Health Information</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Food Allergies</Text>
              <TextInput
                value={formData.foodAllergies}
                onChangeText={(text) => updateField('foodAllergies', text)}
                placeholder="e.g., Peanuts, Shellfish, or None"
                multiline
                numberOfLines={3}
                style={[styles.input, styles.textarea]}
              />
              <Text style={styles.hint}>
                List any food allergies or sensitivities
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Medical Conditions</Text>
              <TextInput
                value={formData.medicalConditions}
                onChangeText={(text) => updateField('medicalConditions', text)}
                placeholder="e.g., Diabetes, Hypertension, or None"
                multiline
                numberOfLines={3}
                style={[styles.input, styles.textarea]}
              />
              <Text style={styles.hint}>
                Share relevant medical conditions for personalized guidance
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
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
});