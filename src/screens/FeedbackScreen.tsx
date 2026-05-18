import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Calendar,
  Edit2,
  MessageSquare,
  Star,
  ThumbsUp,
  Trash2,
  TriangleAlert,
  Wrench,
  X,
} from 'lucide-react-native';
import { equipmentOptions } from '../data/feedbackData';
import { type Coach } from '../services/coaches';
import {
  type CreateFeedbackPayload,
  type FeedbackItem,
  type FeedbackPriority,
  type FeedbackType,
  type UpdateFeedbackPayload,
} from '../services/feedback';
import { useMyFeedback } from '../hooks/feedback/queries/useMyFeedback';
import { useCreateFeedback } from '../hooks/feedback/mutations/useCreateFeedback';
import { useUpdateFeedback } from '../hooks/feedback/mutations/useUpdateFeedback';
import { useDeleteFeedback } from '../hooks/feedback/mutations/useDeleteFeedback';
import { useCoaches } from '../hooks/coaches/queries/useCoaches';

type ToastState = {
  visible: boolean;
  message: string;
  type: 'success' | 'error';
};

const FEEDBACK_TYPES: Array<{
  id: FeedbackType;
  label: string;
  icon: typeof Wrench;
}> = [
  { id: 'equipment', label: 'Equipment Issue', icon: Wrench },
  { id: 'suggestion', label: 'Suggestion', icon: MessageSquare },
  { id: 'rating', label: 'Trainer Rating', icon: Star },
];

const PRIORITIES: FeedbackPriority[] = ['low', 'medium', 'high'];

function titleize(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatDate(value?: string | null) {
  if (!value) return 'No date';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getTypeLabel(type: FeedbackType) {
  return FEEDBACK_TYPES.find((item) => item.id === type)?.label ?? titleize(type);
}

function getCoachInitials(name?: string | null) {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return 'C';

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function getTrainerLabel(
  trainerId?: number | string | null,
  trainerName?: string | null,
  coaches: Coach[] = []
) {
  if (trainerId == null || trainerId === '') return 'No trainer selected';

  const coach = coaches.find((item) => Number(item.id) === Number(trainerId));
  const name = trainerName || coach?.name;

  if (!name) return `Coach #${trainerId}`;

  return coach?.email ? `${name} (${coach.email})` : name;
}

function getFeedbackBadge(item: FeedbackItem) {
  const details = item.details ?? {};

  if (item.type === 'rating') {
    return {
      label: `${Number(details.rating ?? 0) || 0}/5`,
      style: styles.ratingBadge,
      textStyle: styles.ratingBadgeText,
    };
  }

  if (item.type === 'equipment') {
    const priority = String(details.priority ?? 'medium');
    return {
      label: titleize(priority),
      style:
        priority === 'high'
          ? styles.highBadge
          : priority === 'low'
          ? styles.lowBadge
          : styles.mediumBadge,
      textStyle:
        priority === 'high'
          ? styles.highBadgeText
          : priority === 'low'
          ? styles.lowBadgeText
          : styles.mediumBadgeText,
    };
  }

  return {
    label: details.status ? titleize(String(details.status)) : 'Submitted',
    style: styles.statusBadge,
    textStyle: styles.statusBadgeText,
  };
}

function getDetailsSummary(item: FeedbackItem, coaches: Coach[]) {
  const details = item.details ?? {};

  if (item.type === 'equipment') {
    return [
      details.equipment_name ? `Equipment: ${details.equipment_name}` : null,
      details.priority ? `Priority: ${titleize(String(details.priority))}` : null,
      details.status ? `Status: ${titleize(String(details.status))}` : null,
    ]
      .filter(Boolean)
      .join(' | ');
  }

  if (item.type === 'rating') {
    return [
      `Trainer: ${getTrainerLabel(
        details.trainer_id,
        details.trainer_name,
        coaches
      )}`,
      details.rating ? `Rating: ${details.rating}/5` : null,
    ]
      .filter(Boolean)
      .join(' | ');
  }

  return details.status ? `Status: ${titleize(String(details.status))}` : '';
}

export default function FeedbackScreen() {
  const feedbackQuery = useMyFeedback();
  const coachesQuery = useCoaches();
  const createFeedbackMutation = useCreateFeedback();
  const updateFeedbackMutation = useUpdateFeedback();
  const deleteFeedbackMutation = useDeleteFeedback();

  const [activeType, setActiveType] = useState<FeedbackType>('equipment');
  const [editingFeedback, setEditingFeedback] = useState<FeedbackItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FeedbackItem | null>(null);

  const [content, setContent] = useState('');
  const [equipmentName, setEquipmentName] = useState('');
  const [priority, setPriority] = useState<FeedbackPriority>('medium');
  const [trainerId, setTrainerId] = useState('');
  const [rating, setRating] = useState(0);

  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'success',
  });

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sortedFeedback = useMemo(() => {
    return [...(feedbackQuery.data ?? [])].sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });
  }, [feedbackQuery.data]);

  const coaches = coachesQuery.data ?? [];

  const saving =
    createFeedbackMutation.isPending || updateFeedbackMutation.isPending;
  const deleting = deleteFeedbackMutation.isPending;
  const refreshing = feedbackQuery.isRefetching && !feedbackQuery.isLoading;

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);

    setToast({ visible: true, message, type });

    toastTimerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2600);
  }, []);

  const resetForm = useCallback((nextType: FeedbackType = activeType) => {
    setEditingFeedback(null);
    setActiveType(nextType);
    setContent('');
    setEquipmentName('');
    setPriority('medium');
    setTrainerId('');
    setRating(0);
  }, [activeType]);

  const handleRefresh = useCallback(async () => {
    await feedbackQuery.refetch();
  }, [feedbackQuery]);

  const startEdit = (item: FeedbackItem) => {
    const details = item.details ?? {};

    setEditingFeedback(item);
    setActiveType(item.type);
    setContent(item.content ?? '');
    setEquipmentName(String(details.equipment_name ?? ''));
    setPriority(String(details.priority ?? 'medium') as FeedbackPriority);
    setTrainerId(String(details.trainer_id ?? ''));
    setRating(Number(details.rating ?? 0));
  };

  const buildCreatePayload = (): CreateFeedbackPayload => {
    const base = {
      type: activeType,
      content: content.trim(),
    };

    if (activeType === 'equipment') {
      return {
        ...base,
        equipment_name: equipmentName.trim(),
        priority,
        status: 'pending',
      };
    }

    if (activeType === 'rating') {
      return {
        ...base,
        trainer_id: Number(trainerId),
        rating,
      };
    }

    return {
      ...base,
      status: 'pending',
    };
  };

  const buildUpdatePayload = (): UpdateFeedbackPayload => {
    const base = {
      content: content.trim(),
    };

    if (activeType === 'equipment') {
      return {
        ...base,
        equipment_name: equipmentName.trim(),
        priority,
      };
    }

    if (activeType === 'rating') {
      return {
        ...base,
        trainer_id: Number(trainerId),
        rating,
      };
    }

    return base;
  };

  const validateForm = () => {
    if (!content.trim()) {
      showToast('Please enter feedback content.', 'error');
      return false;
    }

    if (activeType === 'equipment' && !equipmentName.trim()) {
      showToast('Please enter the equipment name.', 'error');
      return false;
    }

    if (activeType === 'rating') {
      if (!trainerId.trim() || Number.isNaN(Number(trainerId))) {
        showToast('Please select a trainer.', 'error');
        return false;
      }

      if (rating < 1 || rating > 5) {
        showToast('Please choose a rating from 1 to 5.', 'error');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (editingFeedback) {
        await updateFeedbackMutation.mutateAsync({
          id: editingFeedback.id,
          payload: buildUpdatePayload(),
        });
        showToast('Feedback updated successfully.', 'success');
      } else {
        await createFeedbackMutation.mutateAsync(buildCreatePayload());
        showToast('Feedback submitted successfully.', 'success');
      }

      resetForm(activeType);
    } catch (error: any) {
      showToast(error?.message || 'Failed to save feedback.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteFeedbackMutation.mutateAsync(deleteTarget.id);
      showToast('Feedback deleted.', 'success');
      setDeleteTarget(null);

      if (editingFeedback?.id === deleteTarget.id) {
        resetForm(activeType);
      }
    } catch (error: any) {
      showToast(error?.message || 'Failed to delete feedback.', 'error');
    }
  };

  const selectedType = FEEDBACK_TYPES.find((item) => item.id === activeType);
  const SelectedIcon = selectedType?.icon ?? MessageSquare;

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Feedback & Reports</Text>
            <Text style={styles.headerSubtitle}>
              Share equipment issues, suggestions, and trainer ratings
            </Text>
          </View>

          {toast.visible && (
            <View
              style={[
                styles.toast,
                toast.type === 'success' ? styles.toastSuccess : styles.toastError,
              ]}
            >
              <View style={styles.toastIcon}>
                {toast.type === 'success' ? (
                  <ThumbsUp color="#FFFFFF" size={18} />
                ) : (
                  <TriangleAlert color="#FFFFFF" size={18} />
                )}
              </View>
              <Text style={styles.toastText}>{toast.message}</Text>
            </View>
          )}

          <View style={styles.tabs}>
            {FEEDBACK_TYPES.map((tab) => {
              const TabIcon = tab.icon;
              const active = activeType === tab.id;
              const disabled = !!editingFeedback && tab.id !== activeType;

              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tab,
                    active && styles.tabActive,
                    disabled && styles.tabDisabled,
                  ]}
                  onPress={() => {
                    if (!editingFeedback) resetForm(tab.id);
                  }}
                  activeOpacity={disabled ? 1 : 0.75}
                >
                  <TabIcon color={active ? '#FFFFFF' : '#9CA3AF'} size={14} />
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconContainer}>
                <SelectedIcon color="#0D7D6D" size={20} />
              </View>
              <View style={styles.cardTitleContainer}>
                <Text style={styles.cardTitle}>
                  {editingFeedback
                    ? `Edit ${getTypeLabel(activeType)}`
                    : `New ${getTypeLabel(activeType)}`}
                </Text>
                <Text style={styles.cardSubtitle}>
                  {editingFeedback
                    ? 'Feedback type is locked while editing'
                    : 'Your feedback is sent directly to the FitMind team'}
                </Text>
              </View>

              {editingFeedback && (
                <TouchableOpacity
                  style={styles.iconButton}
                  activeOpacity={0.75}
                  onPress={() => resetForm(activeType)}
                >
                  <X color="#6B7280" size={18} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.form}>
              {activeType === 'equipment' && (
                <>
                  <Text style={styles.formLabel}>Equipment</Text>
                  <View style={styles.optionsList}>
                    {equipmentOptions.map((item) => {
                      const active =
                        equipmentName.trim().toLowerCase() === item.toLowerCase();
                      return (
                        <TouchableOpacity
                          key={item}
                          style={[styles.optionChip, active && styles.optionChipActive]}
                          activeOpacity={0.75}
                          onPress={() => setEquipmentName(item)}
                        >
                          <Text
                            style={[
                              styles.optionChipText,
                              active && styles.optionChipTextActive,
                            ]}
                          >
                            {item}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TextInput
                    value={equipmentName}
                    onChangeText={setEquipmentName}
                    placeholder="Equipment name or number"
                    placeholderTextColor="#9CA3AF"
                    style={styles.input}
                  />

                  <Text style={styles.formLabel}>Priority</Text>
                  <View style={styles.segmentedRow}>
                    {PRIORITIES.map((item) => {
                      const active = priority === item;
                      return (
                        <TouchableOpacity
                          key={item}
                          style={[
                            styles.segmentedButton,
                            active && styles.segmentedButtonActive,
                          ]}
                          onPress={() => setPriority(item)}
                          activeOpacity={0.75}
                        >
                          <Text
                            style={[
                              styles.segmentedButtonText,
                              active && styles.segmentedButtonTextActive,
                            ]}
                          >
                            {titleize(item)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              {activeType === 'rating' && (
                <>
                  <Text style={styles.formLabel}>Trainer</Text>
                  {coachesQuery.isLoading ? (
                    <View style={styles.inlineNotice}>
                      <ActivityIndicator size="small" color="#0D7D6D" />
                      <Text style={styles.inlineNoticeText}>Loading coaches...</Text>
                    </View>
                  ) : coachesQuery.isError ? (
                    <View style={styles.inlineNotice}>
                      <TriangleAlert color="#B91C1C" size={18} />
                      <Text style={styles.inlineNoticeText}>
                        Could not load coaches.
                      </Text>
                      <TouchableOpacity
                        style={styles.inlineRetryButton}
                        activeOpacity={0.8}
                        onPress={() => coachesQuery.refetch()}
                      >
                        <Text style={styles.inlineRetryText}>Retry</Text>
                      </TouchableOpacity>
                    </View>
                  ) : coaches.length === 0 ? (
                    <Text style={styles.emptyInlineText}>No coaches available.</Text>
                  ) : (
                    <View style={styles.coachesList}>
                      {coaches.map((coach) => {
                        const active = Number(trainerId) === Number(coach.id);
                        return (
                          <TouchableOpacity
                            key={coach.id}
                            style={[
                              styles.trainerItem,
                              active && styles.trainerItemSelected,
                            ]}
                            onPress={() => setTrainerId(String(coach.id))}
                            activeOpacity={0.75}
                          >
                            <View
                              style={[
                                styles.trainerAvatar,
                                active && styles.trainerAvatarSelected,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.trainerInitials,
                                  active && styles.trainerInitialsSelected,
                                ]}
                              >
                                {getCoachInitials(coach.name)}
                              </Text>
                            </View>
                            <View style={styles.trainerTextWrap}>
                              <Text style={styles.trainerName}>{coach.name}</Text>
                              <Text style={styles.trainerRole}>
                                {coach.email || 'Coach'}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  <Text style={styles.formLabel}>Rating</Text>
                  <View style={styles.ratingContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => setRating(star)}
                        activeOpacity={0.75}
                      >
                        <Star
                          color={star <= rating ? '#FBBF24' : '#E5E7EB'}
                          size={34}
                          fill={star <= rating ? '#FBBF24' : '#E5E7EB'}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <Text style={styles.formLabel}>
                {activeType === 'suggestion'
                  ? 'Your Suggestion'
                  : activeType === 'rating'
                  ? 'Your Feedback'
                  : 'Describe the Issue'}
              </Text>
              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder={
                  activeType === 'suggestion'
                    ? 'What would you like us to improve or add?'
                    : activeType === 'rating'
                    ? 'Share your experience with this trainer...'
                    : "Please describe what's wrong with the equipment..."
                }
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={5}
                style={styles.textarea}
              />

              <TouchableOpacity
                style={[styles.submitButton, saving && styles.buttonDisabled]}
                onPress={handleSubmit}
                activeOpacity={0.85}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {editingFeedback ? 'Update Feedback' : 'Submit Feedback'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>My Feedback</Text>
            <Text style={styles.sectionCount}>{sortedFeedback.length}</Text>
          </View>

          {feedbackQuery.isLoading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator size="large" color="#0D7D6D" />
              <Text style={styles.stateText}>Loading feedback...</Text>
            </View>
          ) : feedbackQuery.isError ? (
            <View style={styles.stateCard}>
              <TriangleAlert color="#B91C1C" size={28} />
              <Text style={styles.stateTitle}>Could not load feedback</Text>
              <Text style={styles.stateText}>
                {feedbackQuery.error instanceof Error
                  ? feedbackQuery.error.message
                  : 'Failed to load feedback.'}
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                activeOpacity={0.8}
                onPress={() => feedbackQuery.refetch()}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : sortedFeedback.length === 0 ? (
            <View style={styles.stateCard}>
              <MessageSquare color="#0D7D6D" size={30} />
              <Text style={styles.stateTitle}>No feedback submitted yet.</Text>
              <Text style={styles.stateText}>
                Use the form above to send your first note to the team.
              </Text>
            </View>
          ) : (
            <View style={styles.feedbackList}>
              {sortedFeedback.map((item) => {
                const badge = getFeedbackBadge(item);
                const detailsSummary = getDetailsSummary(item, coaches);

                return (
                  <View key={item.id} style={styles.feedbackCard}>
                    <View style={styles.feedbackTopRow}>
                      <View style={styles.feedbackTypeWrap}>
                        <Text style={styles.feedbackType}>{getTypeLabel(item.type)}</Text>
                        <View style={styles.dateRow}>
                          <Calendar color="#9CA3AF" size={13} />
                          <Text style={styles.feedbackDate}>
                            {formatDate(item.created_at)}
                          </Text>
                        </View>
                      </View>

                      <View style={[styles.feedbackBadge, badge.style]}>
                        <Text style={[styles.feedbackBadgeText, badge.textStyle]}>
                          {badge.label}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.feedbackContent}>{item.content}</Text>
                    {detailsSummary ? (
                      <Text style={styles.feedbackDetails}>{detailsSummary}</Text>
                    ) : null}

                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={styles.editButton}
                        activeOpacity={0.8}
                        onPress={() => startEdit(item)}
                      >
                        <Edit2 color="#0D7D6D" size={15} />
                        <Text style={styles.editButtonText}>Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteButton}
                        activeOpacity={0.8}
                        onPress={() => setDeleteTarget(item)}
                      >
                        <Trash2 color="#B91C1C" size={15} />
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={!!deleteTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteTarget(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIcon}>
              <Trash2 color="#B91C1C" size={22} />
            </View>
            <Text style={styles.confirmTitle}>Delete feedback?</Text>
            <Text style={styles.confirmText}>
              This removes the selected feedback from your account.
            </Text>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.confirmCancelButton}
                activeOpacity={0.8}
                onPress={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                <Text style={styles.confirmCancelText}>Keep</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmDeleteButton, deleting && styles.buttonDisabled]}
                activeOpacity={0.8}
                onPress={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmDeleteText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#0D7D6D',
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 20,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
  },
  toastSuccess: {
    backgroundColor: '#E6F4F1',
    borderColor: 'rgba(13, 125, 109, 0.25)',
  },
  toastError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  toastIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#0D7D6D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 20,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 6,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginTop: 16,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: '#0D7D6D',
  },
  tabDisabled: {
    opacity: 0.45,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginTop: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 18,
  },
  cardIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  cardSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    gap: 14,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  optionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  optionChipActive: {
    borderColor: '#0D7D6D',
    backgroundColor: '#E6F4F1',
  },
  optionChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  optionChipTextActive: {
    color: '#0D7D6D',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    minHeight: 44,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#111827',
  },
  textarea: {
    minHeight: 118,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentedButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  segmentedButtonActive: {
    borderColor: '#0D7D6D',
    backgroundColor: '#E6F4F1',
  },
  segmentedButtonText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '800',
  },
  segmentedButtonTextActive: {
    color: '#0D7D6D',
  },
  coachesList: {
    gap: 8,
  },
  inlineNotice: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineNoticeText: {
    flex: 1,
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '700',
  },
  inlineRetryButton: {
    minHeight: 34,
    borderRadius: 10,
    backgroundColor: '#E6F4F1',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineRetryText: {
    color: '#0D7D6D',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyInlineText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '700',
  },
  trainerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  trainerItemSelected: {
    borderColor: '#0D7D6D',
    backgroundColor: '#E6F4F1',
  },
  trainerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trainerAvatarSelected: {
    backgroundColor: '#0D7D6D',
  },
  trainerInitials: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6B7280',
  },
  trainerInitialsSelected: {
    color: '#FFFFFF',
  },
  trainerTextWrap: {
    flex: 1,
  },
  trainerName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  trainerRole: {
    marginTop: 2,
    fontSize: 12,
    color: '#6B7280',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  submitButton: {
    backgroundColor: '#0D7D6D',
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D7D6D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  listHeader: {
    marginTop: 22,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  sectionCount: {
    minWidth: 30,
    borderRadius: 999,
    backgroundColor: '#E6F4F1',
    color: '#0D7D6D',
    textAlign: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: '900',
    overflow: 'hidden',
  },
  stateCard: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  stateTitle: {
    marginTop: 10,
    color: '#111827',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  stateText: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 14,
    backgroundColor: '#0D7D6D',
    borderRadius: 12,
    minHeight: 42,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  feedbackList: {
    gap: 12,
  },
  feedbackCard: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  feedbackTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  feedbackTypeWrap: {
    flex: 1,
  },
  feedbackType: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '800',
  },
  dateRow: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  feedbackDate: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  feedbackBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  feedbackBadgeText: {
    fontSize: 11,
    fontWeight: '900',
  },
  statusBadge: {
    backgroundColor: '#E6F4F1',
    borderColor: '#A7F3D0',
  },
  statusBadgeText: {
    color: '#0D7D6D',
  },
  ratingBadge: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  ratingBadgeText: {
    color: '#B45309',
  },
  highBadge: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  highBadgeText: {
    color: '#B91C1C',
  },
  mediumBadge: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  mediumBadgeText: {
    color: '#B45309',
  },
  lowBadge: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  lowBadgeText: {
    color: '#047857',
  },
  feedbackContent: {
    marginTop: 12,
    color: '#1F2937',
    fontSize: 14,
    lineHeight: 21,
  },
  feedbackDetails: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 18,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  editButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  editButtonText: {
    color: '#0D7D6D',
    fontSize: 13,
    fontWeight: '800',
  },
  deleteButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  deleteButtonText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17,24,39,0.35)',
    justifyContent: 'center',
    padding: 24,
  },
  confirmCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
  },
  confirmIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  confirmTitle: {
    color: '#111827',
    fontSize: 19,
    fontWeight: '900',
  },
  confirmText: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  confirmCancelButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '800',
  },
  confirmDeleteButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: '#B91C1C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDeleteText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
