import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  TextInput,
  Linking,
} from 'react-native';
import {
  Play,
  CheckCircle,
  Info,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  RefreshCw,
  Wand2,
  Settings2,
  X,
  ShieldAlert,
  HeartPulse,
  MessageSquareText,
  CircleSlash,
  CheckCircle2,
  TriangleAlert,
} from 'lucide-react-native';
import { AITipCard } from '../components/AITipCard';
import {
  generateTrainingPlan,
  getLatestAcceptedWorkoutPlan,
  modifyTrainingPlan,
  type WorkoutExerciseItem,
  type WorkoutPlanVersion,
} from '../services/workout';

type DayGroup = {
  dayNumber: number;
  dayLabel: string;
  title: string;
  exercises: WorkoutExerciseItem[];
};

type AppAlertState = {
  visible: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info';
};

const difficultyOptions: Array<{
  value: 'too_easy' | 'good' | 'too_hard';
  label: string;
  description: string;
}> = [
  {
    value: 'too_easy',
    label: 'Too Easy',
    description: 'Increase challenge and exercise difficulty',
  },
  {
    value: 'good',
    label: 'Good',
    description: 'Keep overall difficulty balanced',
  },
  {
    value: 'too_hard',
    label: 'Too Hard',
    description: 'Make the plan easier and safer',
  },
];

const painAreaOptions = ['elbow', 'shoulder', 'knee', 'lower back', 'wrist', 'ankle'];

const levelColors: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  beginner: { bg: '#ECFDF3', border: '#A7F3D0', text: '#047857' },
  intermediate: { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8' },
  advanced: { bg: '#FEF2F2', border: '#FECACA', text: '#B91C1C' },
};

function normalizeLevel(level?: string) {
  return String(level ?? 'beginner').toLowerCase();
}

function buildDayTitle(dayNumber: number, exercises: WorkoutExerciseItem[]) {
  const names = exercises
    .map((item) => item.exercise?.name ?? '')
    .filter(Boolean)
    .slice(0, 2);

  if (!names.length) return `Training Day ${dayNumber}`;
  return `Day ${dayNumber} Plan`;
}

function groupExercisesByDay(exercises: WorkoutExerciseItem[]): DayGroup[] {
  const map = new Map<number, WorkoutExerciseItem[]>();

  exercises.forEach((item) => {
    const day = Number(item.day_number || 1);
    if (!map.has(day)) map.set(day, []);
    map.get(day)?.push(item);
  });

  return Array.from(map.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([dayNumber, dayExercises]) => ({
      dayNumber,
      dayLabel: `Day ${dayNumber}`,
      title: buildDayTitle(dayNumber, dayExercises),
      exercises: dayExercises,
    }));
}

function prettifyApiError(message?: string) {
  const raw = String(message || '').trim();

  if (!raw) {
    return 'Something went wrong. Please try again.';
  }

  const lower = raw.toLowerCase();

  if (
    lower.includes('maximum execution time') ||
    lower.includes('timed out') ||
    lower.includes('timeout')
  ) {
    return 'The AI request took too long on the server. The front-end is fine, but the backend timeout needs to be increased.';
  }

  if (lower.includes('failed to fetch') || lower.includes('network request failed')) {
    return 'Could not reach the server. Make sure the backend is running and the phone can access it.';
  }

  return raw;
}

export default function WorkoutScreen() {
  const [selectedExercise, setSelectedExercise] = useState<WorkoutExerciseItem | null>(null);
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set());
  const [expandedDay, setExpandedDay] = useState<number | null>(1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [modifyLoading, setModifyLoading] = useState(false);

  const [activePlan, setActivePlan] = useState<WorkoutPlanVersion | null>(null);

  const [modifyModalVisible, setModifyModalVisible] = useState(false);
  const [selectedPainAreas, setSelectedPainAreas] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<'too_easy' | 'good' | 'too_hard'>('good');
  const [dislikedExercises, setDislikedExercises] = useState<string[]>([]);
  const [modificationRequest, setModificationRequest] = useState('');

  const [appAlert, setAppAlert] = useState<AppAlertState>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showAppAlert = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'info' = 'info'
  ) => {
    setAppAlert({
      visible: true,
      title,
      message,
      type,
    });
  };

  const closeAppAlert = () => {
    setAppAlert((prev) => ({ ...prev, visible: false }));
  };

  const loadActivePlan = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setRefreshing(!showLoader);

      const plan = await getLatestAcceptedWorkoutPlan();
      setActivePlan(plan);

      const grouped = groupExercisesByDay(plan?.exercises ?? []);
      if (grouped.length) {
        setExpandedDay(grouped[0].dayNumber);
      }
    } catch (error: any) {
      showAppAlert('Load Failed', prettifyApiError(error?.message), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadActivePlan(true);
  }, []);

  const dayGroups = useMemo(
    () => groupExercisesByDay(activePlan?.exercises ?? []),
    [activePlan]
  );

  const currentExerciseNames = useMemo(() => {
    const names = (activePlan?.exercises ?? [])
      .map((item) => item.exercise?.name?.trim())
      .filter(Boolean) as string[];

    return Array.from(new Set(names));
  }, [activePlan]);

  const likedExercises = useMemo(() => {
    return currentExerciseNames.filter((name) => !dislikedExercises.includes(name));
  }, [currentExerciseNames, dislikedExercises]);

  const handleMarkComplete = (exerciseRowId: number) => {
    setCompletedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseRowId)) next.delete(exerciseRowId);
      else next.add(exerciseRowId);
      return next;
    });
  };

  const isCompleted = (exerciseRowId: number) => completedExercises.has(exerciseRowId);

  const handleGeneratePlan = async () => {
    try {
      setGenerateLoading(true);
      const response = await generateTrainingPlan();

      showAppAlert(
        'Plan Request Sent',
        response?.message ||
          'Your training plan was sent for generation and is waiting for coach approval.',
        'success'
      );
    } catch (error: any) {
      showAppAlert('Generate Failed', prettifyApiError(error?.message), 'error');
    } finally {
      setGenerateLoading(false);
    }
  };

  const handleOpenVideo = async (exerciseItem: WorkoutExerciseItem) => {
    const url = String(exerciseItem.exercise?.video_url ?? '').trim();

    if (!url) {
      showAppAlert('No Video', 'This exercise does not have a video link yet.', 'info');
      return;
    }

    try {
      await Linking.openURL(url);
    } catch {
      showAppAlert(
        'Cannot Open Video',
        'Could not open the video link. Check the URL or test it directly in the browser.',
        'error'
      );
    }
  };

  const togglePainArea = (area: string) => {
    setSelectedPainAreas((prev) =>
      prev.includes(area) ? prev.filter((item) => item !== area) : [...prev, area]
    );
  };

  const toggleDislikedExercise = (exerciseName: string) => {
    setDislikedExercises((prev) =>
      prev.includes(exerciseName)
        ? prev.filter((item) => item !== exerciseName)
        : [...prev, exerciseName]
    );
  };

  const resetModifyForm = () => {
    setSelectedPainAreas([]);
    setDifficulty('good');
    setDislikedExercises([]);
    setModificationRequest('');
  };

  const handleSubmitModification = async () => {
    if (!activePlan?.id) {
      showAppAlert('No Plan', 'There is no accepted plan to modify right now.', 'info');
      return;
    }

    if (!modificationRequest.trim()) {
      showAppAlert('Missing Request', 'Please write what you want changed in the plan.', 'info');
      return;
    }

    try {
      setModifyLoading(true);

      await modifyTrainingPlan({
        current_plan_id: String(activePlan.id),
        user_feedback: {
          pain_areas: selectedPainAreas,
          difficulty,
          disliked_exercises: dislikedExercises,
          liked_exercises: likedExercises,
          modification_request: modificationRequest.trim(),
        },
      });

      setModifyModalVisible(false);
      resetModifyForm();

      showAppAlert(
        'Modification Sent',
        'Your modification request was sent successfully and is waiting for coach approval.',
        'success'
      );
    } catch (error: any) {
      showAppAlert('Modify Failed', prettifyApiError(error?.message), 'error');
    } finally {
      setModifyLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D7D6D" />
        <Text style={styles.loadingText}>Loading your workout plan...</Text>
      </View>
    );
  }

  const alertTheme =
    appAlert.type === 'success'
      ? {
          icon: <CheckCircle2 color="#0D7D6D" size={22} />,
          box: styles.customAlertSuccess,
          button: styles.customAlertButtonSuccess,
        }
      : appAlert.type === 'error'
      ? {
          icon: <TriangleAlert color="#B91C1C" size={22} />,
          box: styles.customAlertError,
          button: styles.customAlertButtonError,
        }
      : {
          icon: <Info color="#0D7D6D" size={22} />,
          box: styles.customAlertInfo,
          button: styles.customAlertButtonInfo,
        };

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>Smart Workout Plan</Text>
                <Text style={styles.headerSubtitle}>
                  {activePlan
                    ? `${activePlan.name} • ${activePlan.level}`
                    : 'No approved workout plan yet'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.refreshButton}
                activeOpacity={0.8}
                onPress={() => loadActivePlan(false)}
                disabled={refreshing}
              >
                {refreshing ? (
                  <ActivityIndicator size="small" color="#0D7D6D" />
                ) : (
                  <RefreshCw color="#0D7D6D" size={18} />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.headerMetaRow}>
              <View style={styles.headerMetaBadge}>
                <Text style={styles.headerMetaText}>
                  Status: {activePlan?.is_active ?? 'No active plan'}
                </Text>
              </View>
              <View style={styles.headerMetaBadge}>
                <Text style={styles.headerMetaText}>Days: {dayGroups.length}</Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.primaryActionButton, generateLoading && styles.buttonDisabled]}
                activeOpacity={0.85}
                onPress={handleGeneratePlan}
                disabled={generateLoading}
              >
                {generateLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Wand2 color="#FFFFFF" size={16} />
                    <Text style={styles.primaryActionText}>Generate Plan</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.secondaryActionButton,
                  (!activePlan || modifyLoading) && styles.buttonDisabled,
                ]}
                activeOpacity={0.85}
                onPress={() => setModifyModalVisible(true)}
                disabled={!activePlan || modifyLoading}
              >
                {modifyLoading ? (
                  <ActivityIndicator size="small" color="#0D7D6D" />
                ) : (
                  <>
                    <Settings2 color="#0D7D6D" size={16} />
                    <Text style={styles.secondaryActionText}>Modify Plan</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <AITipCard
            title="AI Tip"
            text={
              activePlan
                ? 'Tap the play button to open the exercise video. Tap the exercise card itself to view instructions and common mistakes.'
                : 'You do not have an accepted plan yet. Start by generating a new training plan.'
            }
          />

          {!activePlan || dayGroups.length === 0 ? (
            <View style={styles.emptyCard}>
              <Zap color="#0D7D6D" size={28} />
              <Text style={styles.emptyTitle}>No approved plan yet</Text>
              <Text style={styles.emptyText}>
                Generate a training plan first. After coach approval, your latest accepted plan
                will appear here automatically.
              </Text>
            </View>
          ) : (
            dayGroups.map((day) => {
              const completedCount = day.exercises.filter((item) =>
                completedExercises.has(item.id)
              ).length;

              return (
                <View key={day.dayNumber} style={styles.dayCard}>
                  <TouchableOpacity
                    style={styles.dayHeader}
                    onPress={() =>
                      setExpandedDay(expandedDay === day.dayNumber ? null : day.dayNumber)
                    }
                    activeOpacity={0.7}
                  >
                    <View style={styles.dayLeft}>
                      <View>
                        <View style={styles.dayTitleRow}>
                          <Text style={styles.dayTitle}>{day.dayLabel}</Text>
                        </View>
                        <Text style={styles.daySubtitle}>{day.title}</Text>
                      </View>
                    </View>

                    <View style={styles.dayRight}>
                      <View style={styles.progressBadge}>
                        <Text style={styles.progressBadgeText}>
                          {completedCount}/{day.exercises.length}
                        </Text>
                      </View>
                      {expandedDay === day.dayNumber ? (
                        <ChevronUp color="#9CA3AF" size={18} />
                      ) : (
                        <ChevronDown color="#9CA3AF" size={18} />
                      )}
                    </View>
                  </TouchableOpacity>

                  {expandedDay === day.dayNumber && (
                    <View style={styles.dayContent}>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width:
                                day.exercises.length > 0
                                  ? `${(completedCount / day.exercises.length) * 100}%`
                                  : '0%',
                            },
                          ]}
                        />
                      </View>

                      <View style={styles.exercisesList}>
                        {day.exercises.map((exerciseItem) => {
                          const completed = isCompleted(exerciseItem.id);
                          const levelKey = normalizeLevel(
                            exerciseItem.difficulty || exerciseItem.exercise?.difficulty_level
                          );
                          const levelStyle = levelColors[levelKey] || levelColors.beginner;

                          return (
                            <TouchableOpacity
                              key={exerciseItem.id}
                              style={[
                                styles.exerciseItem,
                                completed && styles.exerciseItemCompleted,
                              ]}
                              activeOpacity={0.85}
                              onPress={() => setSelectedExercise(exerciseItem)}
                            >
                              <Text style={styles.exerciseEmoji}>🏋️</Text>

                              <View style={styles.exerciseContent}>
                                <View style={styles.exerciseHeader}>
                                  <Text style={styles.exerciseName} numberOfLines={2}>
                                    {exerciseItem.exercise?.name ?? 'Exercise'}
                                  </Text>
                                  <View
                                    style={[
                                      styles.levelBadge,
                                      {
                                        backgroundColor: levelStyle.bg,
                                        borderColor: levelStyle.border,
                                      },
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.levelBadgeText,
                                        { color: levelStyle.text },
                                      ]}
                                    >
                                      {levelKey.charAt(0).toUpperCase() + levelKey.slice(1)}
                                    </Text>
                                  </View>
                                </View>

                                <Text style={styles.exerciseSets}>
                                  {exerciseItem.sets} sets • {exerciseItem.reps} reps • Rest{' '}
                                  {exerciseItem.rest_seconds}s
                                </Text>
                              </View>

                              <View style={styles.exerciseActions}>
                                <TouchableOpacity
                                  style={styles.playButton}
                                  onPress={() => handleOpenVideo(exerciseItem)}
                                  activeOpacity={0.7}
                                >
                                  <Play color="#0D7D6D" size={14} />
                                </TouchableOpacity>

                                <TouchableOpacity
                                  style={[
                                    styles.checkButton,
                                    completed && styles.checkButtonCompleted,
                                  ]}
                                  onPress={() => handleMarkComplete(exerciseItem.id)}
                                  activeOpacity={0.7}
                                >
                                  <CheckCircle
                                    color={completed ? '#FFFFFF' : '#D1D5DB'}
                                    size={14}
                                  />
                                </TouchableOpacity>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <Modal
        visible={selectedExercise !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedExercise(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedExercise(null)}
        >
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {selectedExercise && (
              <>
                <Text style={styles.modalEmoji}>🏋️</Text>
                <Text style={styles.modalTitle}>
                  {selectedExercise.exercise?.name ?? 'Exercise'}
                </Text>
                <Text style={styles.modalSets}>
                  {selectedExercise.sets} sets • {selectedExercise.reps} reps • Rest{' '}
                  {selectedExercise.rest_seconds}s
                </Text>

                <TouchableOpacity
                  style={styles.watchVideoButton}
                  activeOpacity={0.85}
                  onPress={() => handleOpenVideo(selectedExercise)}
                >
                  <Play color="#FFFFFF" size={16} />
                  <Text style={styles.watchVideoButtonText}>Watch Exercise Video</Text>
                </TouchableOpacity>

                <View style={styles.modalInfo}>
                  <View style={styles.infoSection}>
                    <View style={styles.infoHeader}>
                      <Info color="#0D7D6D" size={16} />
                      <Text style={styles.infoTitle}>Correct Form</Text>
                    </View>
                    <Text style={styles.infoText}>
                      {selectedExercise.exercise?.instructions || 'No instructions available.'}
                    </Text>
                  </View>

                  <View style={styles.warningSection}>
                    <View style={styles.warningHeader}>
                      <AlertCircle color="#F97316" size={16} />
                      <Text style={styles.warningTitle}>Common Mistakes</Text>
                    </View>
                    <Text style={styles.warningText}>
                      {selectedExercise.exercise?.common_mistakes ||
                        'No common mistakes available.'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.gotItButton}
                    onPress={() => setSelectedExercise(null)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.gotItButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={modifyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModifyModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModifyModalVisible(false)}
        >
          <TouchableOpacity
            style={[styles.modalContent, { maxHeight: '90%' }]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modifyHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modifyTitle}>Modify Workout Plan</Text>
                <Text style={styles.modifySubtitle}>
                  Tell the AI what should change in your current approved plan
                </Text>
              </View>

              <TouchableOpacity onPress={() => setModifyModalVisible(false)}>
                <X color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modifyIntroCard}>
                <Text style={styles.modifyIntroTitle}>Request Payload Preview</Text>
                <Text style={styles.modifyIntroText}>
                  current_plan_id: {activePlan?.id ?? 'N/A'}
                </Text>
                <Text style={styles.modifyIntroText}>
                  This request will send your selected pain areas, difficulty,
                  disliked exercises, liked exercises, and your written modification request.
                </Text>
              </View>

              <Text style={styles.fieldLabel}>1. Pain Areas</Text>
              <Text style={styles.fieldHelper}>
                Select any pain or injury areas the AI should avoid aggravating.
              </Text>
              <View style={styles.chipsWrap}>
                {painAreaOptions.map((area) => {
                  const active = selectedPainAreas.includes(area);
                  return (
                    <TouchableOpacity
                      key={area}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => togglePainArea(area)}
                      activeOpacity={0.8}
                    >
                      <HeartPulse size={14} color={active ? '#0D7D6D' : '#6B7280'} />
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {area}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>2. Difficulty</Text>
              <Text style={styles.fieldHelper}>
                Choose how the current plan feels to you.
              </Text>
              <View style={styles.difficultyList}>
                {difficultyOptions.map((option) => {
                  const active = difficulty === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.difficultyCard,
                        active && styles.difficultyCardActive,
                      ]}
                      onPress={() => setDifficulty(option.value)}
                      activeOpacity={0.85}
                    >
                      <ShieldAlert size={16} color={active ? '#0D7D6D' : '#6B7280'} />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.difficultyCardTitle,
                            active && styles.difficultyCardTitleActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                        <Text style={styles.difficultyCardText}>
                          {option.description}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>3. Exercises You Want Changed</Text>
              <Text style={styles.fieldHelper}>
                Tap the exercises you want the AI to replace or avoid.
              </Text>
              <View style={styles.chipsWrap}>
                {currentExerciseNames.length ? (
                  currentExerciseNames.map((name) => {
                    const active = dislikedExercises.includes(name);
                    return (
                      <TouchableOpacity
                        key={name}
                        style={[styles.chip, active && styles.chipDangerActive]}
                        onPress={() => toggleDislikedExercise(name)}
                        activeOpacity={0.8}
                      >
                        <CircleSlash size={14} color={active ? '#B91C1C' : '#6B7280'} />
                        <Text
                          style={[
                            styles.chipText,
                            active && styles.chipDangerTextActive,
                          ]}
                        >
                          {name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <Text style={styles.helperText}>No current exercises found.</Text>
                )}
              </View>

              <Text style={styles.fieldLabel}>4. Modification Request</Text>
              <Text style={styles.fieldHelper}>
                Write exactly what you want, like split changes, easier plan, or safer alternatives.
              </Text>
              <View style={styles.requestBox}>
                <View style={styles.requestHeader}>
                  <MessageSquareText color="#0D7D6D" size={16} />
                  <Text style={styles.requestHeaderText}>Your Request</Text>
                </View>

                <TextInput
                  value={modificationRequest}
                  onChangeText={setModificationRequest}
                  placeholder="Example: Please change my current plan to a 5-day split: Day 1 chest and triceps, Day 2 back and biceps, Day 3 shoulders, Day 4 biceps and triceps, Day 5 legs. Avoid exercises that aggravate the elbow and keep the plan easier than before."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  textAlignVertical="top"
                  style={styles.textArea}
                />
              </View>

              <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>Final Payload Summary</Text>
                <Text style={styles.summaryText}>
                  • current_plan_id: {activePlan?.id ?? 'N/A'}
                </Text>
                <Text style={styles.summaryText}>
                  • pain_areas: {selectedPainAreas.length ? selectedPainAreas.join(', ') : '[]'}
                </Text>
                <Text style={styles.summaryText}>• difficulty: {difficulty}</Text>
                <Text style={styles.summaryText}>
                  • disliked_exercises: {dislikedExercises.length}
                </Text>
                <Text style={styles.summaryText}>
                  • liked_exercises: {likedExercises.length}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, modifyLoading && styles.buttonDisabled]}
                onPress={handleSubmitModification}
                activeOpacity={0.85}
                disabled={modifyLoading}
              >
                {modifyLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Modification</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={appAlert.visible}
        transparent
        animationType="fade"
        onRequestClose={closeAppAlert}
      >
        <View style={styles.customAlertOverlay}>
          <View style={[styles.customAlertCard, alertTheme.box]}>
            <View style={styles.customAlertHeader}>
              <View style={styles.customAlertIconWrap}>{alertTheme.icon}</View>
              <Text style={styles.customAlertTitle}>{appAlert.title}</Text>
            </View>

            <Text style={styles.customAlertMessage}>{appAlert.message}</Text>

            <TouchableOpacity
              style={[styles.customAlertButton, alertTheme.button]}
              activeOpacity={0.85}
              onPress={closeAppAlert}
            >
              <Text style={styles.customAlertButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#0D7D6D',
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  headerMetaBadge: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  headerMetaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  primaryActionButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
  },
  secondaryActionButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
  },
  primaryActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D7D6D',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  emptyCard: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    backgroundColor: '#F0FDF4',
    padding: 20,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    color: '#6B7280',
    textAlign: 'center',
  },
  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
    marginTop: 16,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  dayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  dayTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  daySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  dayRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  progressBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  dayContent: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
  },
  progressBar: {
    height: 4,
    width: '100%',
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0D7D6D',
    borderRadius: 2,
  },
  exercisesList: {
    gap: 8,
    paddingTop: 8,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#F9FAFB',
  },
  exerciseItemCompleted: {
    backgroundColor: '#E6F4F1',
    borderColor: 'rgba(13, 125, 109, 0.3)',
  },
  exerciseEmoji: {
    fontSize: 28,
    width: 36,
    textAlign: 'center',
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 2,
  },
  exerciseName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  levelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  exerciseSets: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  exerciseActions: {
    flexDirection: 'row',
    gap: 8,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: 'rgba(13, 125, 109, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButton: {
    width: 32,
    height: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonCompleted: {
    backgroundColor: '#0D7D6D',
    borderColor: '#0D7D6D',
    shadowColor: '#0D7D6D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  modalEmoji: {
    fontSize: 60,
    textAlign: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  modalSets: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
  },
  watchVideoButton: {
    marginTop: 16,
    backgroundColor: '#0D7D6D',
    borderRadius: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  watchVideoButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalInfo: {
    marginTop: 16,
    gap: 16,
  },
  infoSection: {
    backgroundColor: '#E6F4F1',
    borderRadius: 16,
    padding: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D7D6D',
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  warningSection: {
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    padding: 16,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EA580C',
  },
  warningText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  gotItButton: {
    backgroundColor: '#111827',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gotItButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modifyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  modifyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modifySubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 20,
    color: '#6B7280',
  },
  modifyIntroCard: {
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    padding: 14,
    marginBottom: 6,
  },
  modifyIntroTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  modifyIntroText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#6B7280',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    marginTop: 14,
  },
  fieldHelper: {
    fontSize: 12,
    lineHeight: 18,
    color: '#6B7280',
    marginBottom: 10,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipActive: {
    backgroundColor: '#E6F4F1',
    borderColor: '#0D7D6D',
  },
  chipDangerActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  chipTextActive: {
    color: '#0D7D6D',
  },
  chipDangerTextActive: {
    color: '#B91C1C',
  },
  difficultyList: {
    gap: 10,
  },
  difficultyCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  difficultyCardActive: {
    borderColor: '#0D7D6D',
    backgroundColor: '#F0FDFA',
  },
  difficultyCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  difficultyCardTitleActive: {
    color: '#0D7D6D',
  },
  difficultyCardText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: '#6B7280',
  },
  requestBox: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  requestHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  textArea: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  summaryBox: {
    marginTop: 16,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  helperText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  submitButton: {
    marginTop: 18,
    backgroundColor: '#0D7D6D',
    borderRadius: 14,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  customAlertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  customAlertCard: {
    width: '100%',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  customAlertSuccess: {
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  customAlertError: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  customAlertInfo: {
    borderColor: '#D1FAE5',
    backgroundColor: '#F0FDFA',
  },
  customAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  customAlertIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customAlertTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  customAlertMessage: {
    fontSize: 15,
    lineHeight: 24,
    color: '#4B5563',
    marginTop: 4,
  },
  customAlertButton: {
    marginTop: 18,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customAlertButtonSuccess: {
    backgroundColor: '#0D7D6D',
  },
  customAlertButtonError: {
    backgroundColor: '#B91C1C',
  },
  customAlertButtonInfo: {
    backgroundColor: '#0D7D6D',
  },
  customAlertButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});