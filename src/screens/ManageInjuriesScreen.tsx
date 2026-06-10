import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Check,
  CircleAlert,
  Edit2,
  HeartPulse,
  Plus,
  Trash2,
  X,
} from 'lucide-react-native';
import {
  createMyInjury,
  deleteMyInjury,
  getMyInjuries,
  updateMyInjury,
  type InjurySeverity,
  type InjuryStatus,
  type UserInjury,
} from '../services/injuries';
import { useTranslation } from '../i18n';

type ToastState = {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
};

type FormState = {
  injury_type: string;
  severity: InjurySeverity;
  status: InjuryStatus;
  notes: string;
};

const initialFormState: FormState = {
  injury_type: '',
  severity: 'mild',
  status: 'active',
  notes: '',
};

const severityOptions: Array<{ label: string; value: InjurySeverity }> = [
  { label: 'Mild', value: 'mild' },
  { label: 'Moderate', value: 'moderate' },
  { label: 'Severe', value: 'severe' },
];

const statusOptions: Array<{ label: string; value: InjuryStatus }> = [
  { label: 'Active', value: 'active' },
  { label: 'Recovered', value: 'recovered' },
];

function formatValue(value?: string | null) {
  const normalized = String(value || '').replace(/_/g, ' ').trim();
  if (!normalized) return 'Unknown';

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export default function ManageInjuriesScreen({ navigation }: any) {
  const { t, isRtl } = useTranslation();
  const [injuries, setInjuries] = useState<UserInjury[]>([]);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [editingInjury, setEditingInjury] = useState<UserInjury | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | string | null>(
    null
  );
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'success',
  });

  const sortedInjuries = useMemo(
    () =>
      [...injuries].sort((a, b) => {
        if (a.status === 'recovered' && b.status !== 'recovered') return 1;
        if (a.status !== 'recovered' && b.status === 'recovered') return -1;
        return String(a.injury_type).localeCompare(String(b.injury_type));
      }),
    [injuries]
  );

  const showToast = useCallback((message: string, type: ToastState['type']) => {
    setToast({ visible: true, message, type });

    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, message.length > 80 ? 4600 : 2600);
  }, []);

  const loadInjuries = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMyInjuries();
      setInjuries(data);
    } catch (error: any) {
      showToast(error?.message || t('injuries.loadFailed'), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    loadInjuries();
  }, [loadInjuries]);

  const resetForm = () => {
    setEditingInjury(null);
    setForm(initialFormState);
  };

  const beginEdit = (injury: UserInjury) => {
    setEditingInjury(injury);
    setForm({
      injury_type: injury.injury_type || '',
      severity:
        severityOptions.find((option) => option.value === injury.severity)?.value ||
        'mild',
      status:
        statusOptions.find((option) => option.value === injury.status)?.value ||
        'active',
      notes: injury.notes || '',
    });
  };

  const saveInjury = async () => {
    const injury_type = form.injury_type.trim();

    if (!injury_type) {
      showToast(t('injuries.typeRequired'), 'error');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        injury_type,
        severity: form.severity,
        status: form.status,
        notes: form.notes.trim() || null,
      };

      if (editingInjury?.id) {
        await updateMyInjury(editingInjury.id, payload);
        showToast(t('injuries.updated'), 'success');
      } else {
        const response = await createMyInjury(payload);
        const aiModification = response.ai_modification;

        if (aiModification?.warning) {
          console.warn(t('injuries.aiWarning'), aiModification.warning);
        }

        if (aiModification?.created === true) {
          showToast(
            t('injuries.savedWithRequest'),
            'success'
          );
        } else if (aiModification?.created === false) {
          showToast(
            t('injuries.savedNoPlan'),
            'info'
          );
        } else {
          showToast(t('injuries.saved'), 'success');
        }
      }

      resetForm();
      await loadInjuries();
    } catch (error: any) {
      showToast(error?.message || t('injuries.saveFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const removeInjury = async (injury: UserInjury) => {
    try {
      setDeletingId(injury.id);
      await deleteMyInjury(injury.id);
      setPendingDeleteId(null);
      showToast(t('injuries.deleted'), 'success');
      await loadInjuries();
    } catch (error: any) {
      showToast(error?.message || t('injuries.deleteFailed'), 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const markRecovered = async (injury: UserInjury) => {
    try {
      setSaving(true);
      await updateMyInjury(injury.id, {
        injury_type: injury.injury_type,
        severity:
          severityOptions.find((option) => option.value === injury.severity)
            ?.value || 'mild',
        status: 'recovered',
        notes: injury.notes || null,
      });
      showToast(t('injuries.recovered'), 'success');
      await loadInjuries();
    } catch (error: any) {
      showToast(error?.message || t('injuries.updateFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

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
            <Text style={[styles.headerTitle, isRtl && styles.textRight]}>
              {t('injuries.title')}
            </Text>
            <Text style={[styles.headerSubtitle, isRtl && styles.textRight]}>
              {t('injuries.subtitle')}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={[styles.sectionHeader, isRtl && styles.rowReverse]}>
              <View style={styles.sectionIcon}>
                {editingInjury ? (
                  <Edit2 color="#0D7D6D" size={16} />
                ) : (
                  <Plus color="#0D7D6D" size={16} />
                )}
              </View>
              <Text style={styles.sectionTitle}>
                {editingInjury ? t('injuries.editTitle') : t('injuries.addTitle')}
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, isRtl && styles.textRight]}>
                {t('injuries.type')}
              </Text>
              <TextInput
                value={form.injury_type}
                onChangeText={(value) =>
                  setForm((prev) => ({ ...prev, injury_type: value }))
                }
                placeholder={t('injuries.typePlaceholder')}
                placeholderTextColor="#9CA3AF"
                style={[styles.input, isRtl && styles.textRight]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, isRtl && styles.textRight]}>
                {t('injuries.severity')}
              </Text>
              <View style={styles.optionsRow}>
                {severityOptions.map((option) => {
                  const active = form.severity === option.value;

                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[styles.optionChip, active && styles.optionChipActive]}
                      activeOpacity={0.8}
                      onPress={() =>
                        setForm((prev) => ({
                          ...prev,
                          severity: option.value,
                        }))
                      }
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          active && styles.optionChipTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {editingInjury && (
              <View style={styles.formGroup}>
                <Text style={[styles.label, isRtl && styles.textRight]}>
                  {t('injuries.status')}
                </Text>
                <View style={styles.optionsRow}>
                  {statusOptions.map((option) => {
                    const active = form.status === option.value;

                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[styles.optionChip, active && styles.optionChipActive]}
                        activeOpacity={0.8}
                        onPress={() =>
                          setForm((prev) => ({
                            ...prev,
                            status: option.value,
                          }))
                        }
                      >
                        <Text
                          style={[
                            styles.optionChipText,
                            active && styles.optionChipTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={[styles.label, isRtl && styles.textRight]}>
                {t('injuries.notes')}
              </Text>
              <TextInput
                value={form.notes}
                onChangeText={(value) =>
                  setForm((prev) => ({ ...prev, notes: value }))
                }
                placeholder={t('injuries.notesPlaceholder')}
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                style={[styles.input, styles.textarea, isRtl && styles.textRight]}
              />
            </View>

            <View style={styles.actionsRow}>
              {editingInjury && (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  activeOpacity={0.8}
                  onPress={resetForm}
                  disabled={saving}
                >
                  <X color="#6B7280" size={18} />
                  <Text style={styles.secondaryButtonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.saveButton, saving && styles.buttonDisabled]}
                activeOpacity={0.8}
                onPress={saveInjury}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Check color="#FFFFFF" size={18} />
                    <Text style={styles.saveButtonText}>
                      {editingInjury ? t('injuries.update') : t('injuries.add')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.card}>
            <View style={[styles.sectionHeader, isRtl && styles.rowReverse]}>
              <View style={styles.sectionIcon}>
                <HeartPulse color="#0D7D6D" size={16} />
              </View>
              <Text style={styles.sectionTitle}>{t('injuries.savedList')}</Text>
            </View>

            {loading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator color="#0D7D6D" />
                <Text style={styles.emptyText}>{t('injuries.loading')}</Text>
              </View>
            ) : sortedInjuries.length === 0 ? (
              <View style={styles.emptyState}>
                <CircleAlert color="#9CA3AF" size={22} />
                <Text style={styles.emptyTitle}>{t('injuries.emptyTitle')}</Text>
                <Text style={styles.emptyText}>
                  {t('injuries.emptyText')}
                </Text>
              </View>
            ) : (
              <View style={styles.injuryList}>
                {sortedInjuries.map((injury) => (
                  <View key={injury.id} style={styles.injuryItem}>
                    <View style={styles.injuryItemHeader}>
                      <Text style={styles.injuryType}>{injury.injury_type}</Text>
                      <View
                        style={[
                          styles.statusPill,
                          injury.status === 'recovered' && styles.statusPillRecovered,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusPillText,
                            injury.status === 'recovered' &&
                              styles.statusPillTextRecovered,
                          ]}
                        >
                          {formatValue(injury.status)}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.injuryMeta}>
                      Severity: {formatValue(injury.severity)}
                    </Text>

                    {!!injury.notes && (
                      <Text style={styles.injuryNotes}>{injury.notes}</Text>
                    )}

                    <View style={styles.itemActions}>
                      <TouchableOpacity
                        style={styles.itemActionButton}
                        activeOpacity={0.8}
                        onPress={() => beginEdit(injury)}
                      >
                        <Edit2 color="#0D7D6D" size={14} />
                        <Text style={styles.itemActionText}>{t('common.edit')}</Text>
                      </TouchableOpacity>

                      {injury.status !== 'recovered' && (
                        <TouchableOpacity
                          style={styles.itemActionButton}
                          activeOpacity={0.8}
                          onPress={() => markRecovered(injury)}
                          disabled={saving}
                        >
                          <Check color="#0D7D6D" size={14} />
                          <Text style={styles.itemActionText}>{t('injuries.recover')}</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={[styles.itemActionButton, styles.deleteActionButton]}
                        activeOpacity={0.8}
                        onPress={() => setPendingDeleteId(injury.id)}
                        disabled={deletingId === injury.id}
                      >
                        <Trash2 color="#DC2626" size={14} />
                        <Text style={styles.deleteActionText}>{t('injuries.delete')}</Text>
                      </TouchableOpacity>
                    </View>

                    {pendingDeleteId === injury.id && (
                      <View style={styles.deleteConfirmBox}>
                        <Text style={styles.deleteConfirmText}>
                          {t('injuries.deleteConfirm')}
                        </Text>

                        <View style={styles.deleteConfirmActions}>
                          <TouchableOpacity
                            style={styles.deleteCancelButton}
                            activeOpacity={0.8}
                            onPress={() => setPendingDeleteId(null)}
                            disabled={deletingId === injury.id}
                          >
                            <Text style={styles.deleteCancelText}>{t('common.cancel')}</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.deleteConfirmButton}
                            activeOpacity={0.8}
                            onPress={() => removeInjury(injury)}
                            disabled={deletingId === injury.id}
                          >
                            {deletingId === injury.id ? (
                              <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                              <Text style={styles.deleteConfirmTextButton}>
                                {t('injuries.confirmDelete')}
                              </Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {toast.visible && (
          <View
            style={[
            styles.toast,
            toast.type === 'error'
              ? styles.toastError
              : toast.type === 'info'
              ? styles.toastInfo
              : styles.toastSuccess,
          ]}
        >
            <Text style={styles.toastText}>{toast.message}</Text>
          </View>
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
    paddingBottom: 96,
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
    height: 94,
    paddingTop: 12,
    textAlignVertical: 'top',
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
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  saveButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#0D7D6D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 22,
    gap: 8,
  },
  emptyTitle: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  injuryList: {
    gap: 12,
  },
  injuryItem: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  injuryItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  injuryType: {
    flex: 1,
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
  },
  statusPill: {
    borderRadius: 999,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  statusPillRecovered: {
    backgroundColor: '#E6F4F1',
  },
  statusPillText: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: '700',
  },
  statusPillTextRecovered: {
    color: '#0D7D6D',
  },
  injuryMeta: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 13,
  },
  injuryNotes: {
    marginTop: 8,
    color: '#374151',
    fontSize: 13,
    lineHeight: 19,
  },
  itemActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  itemActionButton: {
    minHeight: 34,
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: '#E6F4F1',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deleteActionButton: {
    backgroundColor: '#FEF2F2',
  },
  itemActionText: {
    color: '#0D7D6D',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteActionText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteConfirmBox: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    padding: 12,
  },
  deleteConfirmText: {
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  deleteConfirmActions: {
    flexDirection: 'row',
    gap: 8,
  },
  deleteCancelButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteConfirmButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteCancelText: {
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteConfirmTextButton: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
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
  toastInfo: {
    backgroundColor: '#B45309',
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
