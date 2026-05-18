import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CalendarCheck,
  CalendarDays,
  CircleAlert,
  Clock,
  RefreshCw,
  Users,
} from 'lucide-react-native';

import { useCancelMySession } from '../hooks/coachSessions/mutations/useCancelMySession';
import { useMySessions } from '../hooks/coachSessions/queries/useMySessions';
import {
  type CoachSession,
  type MemberSessionRecord,
} from '../services/coachSessions';
import {
  formatSessionDateLong,
  formatSessionTimeRange,
  getBookedSessionId,
  getBookingRecord,
  getCoachInitials,
  getMySessionCoach,
  getMySessionStatusLabel,
  getSessionBookedCount,
  getSessionCapacity,
  getSessionCoachName,
  getSessionFromMySession,
  isActiveBooking,
  isBookingCancelled,
  isBookingCompleted,
  isPastSession,
  isTodaySession,
  sortSessionsByDateTime,
} from '../utils/coachSessionUtils';

type ToastState = {
  visible: boolean;
  message: string;
  type: 'success' | 'error';
};

type ScheduleItem = {
  key: string;
  record: MemberSessionRecord;
  session: CoachSession | null;
};

function getScheduleKey(record: MemberSessionRecord, index: number) {
  const booking = getBookingRecord(record);
  const sessionId = getBookedSessionId(record);

  return String(sessionId ?? booking?.id ?? record.id ?? index);
}

function sortScheduleItems(items: ScheduleItem[]) {
  const sessions = items
    .map((item) => item.session)
    .filter(Boolean) as CoachSession[];

  const orderedIds = sortSessionsByDateTime(sessions).map((session) => session.id);

  return [...items].sort((a, b) => {
    const aIndex = orderedIds.findIndex((id) => id === a.session?.id);
    const bIndex = orderedIds.findIndex((id) => id === b.session?.id);

    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;

    return a.key.localeCompare(b.key);
  });
}

function getStatusBadgeStyle(record: MemberSessionRecord, session: CoachSession | null) {
  if (isBookingCancelled(record)) return styles.statusCancelled;
  if (isBookingCompleted(record) || isPastSession(session)) return styles.statusPast;

  return styles.statusBooked;
}

export default function MyScheduleScreen() {
  const mySessionsQuery = useMySessions();
  const cancelMutation = useCancelMySession();

  const [cancellingSessionId, setCancellingSessionId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'success',
  });

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleItems = useMemo(() => {
    const items = (mySessionsQuery.data ?? []).map((record, index) => ({
      key: getScheduleKey(record, index),
      record,
      session: getSessionFromMySession(record),
    }));

    return sortScheduleItems(items);
  }, [mySessionsQuery.data]);

  const grouped = useMemo(() => {
    const today: ScheduleItem[] = [];
    const upcoming: ScheduleItem[] = [];
    const past: ScheduleItem[] = [];

    scheduleItems.forEach((item) => {
      const archived =
        isBookingCancelled(item.record) ||
        isBookingCompleted(item.record) ||
        isPastSession(item.session);

      if (archived) {
        past.push(item);
        return;
      }

      if (isTodaySession(item.session)) {
        today.push(item);
        return;
      }

      upcoming.push(item);
    });

    return { today, upcoming, past };
  }, [scheduleItems]);

  const stats = useMemo(
    () => ({
      upcoming: grouped.today.length + grouped.upcoming.length,
      today: grouped.today.length,
      past: grouped.past.length,
    }),
    [grouped]
  );

  const refreshing = mySessionsQuery.isRefetching && !mySessionsQuery.isLoading;

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);

    setToast({ visible: true, message, type });

    toastTimerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2600);
  }, []);

  const handleRefresh = useCallback(async () => {
    await mySessionsQuery.refetch();
  }, [mySessionsQuery]);

  const handleCancel = async (record: MemberSessionRecord) => {
    const sessionId = getBookedSessionId(record);

    if (sessionId == null) {
      showToast('This booking is missing a session ID.', 'error');
      return;
    }

    try {
      setCancellingSessionId(String(sessionId));
      const response = await cancelMutation.mutateAsync(sessionId);
      showToast(response?.message || 'Session cancelled.', 'success');
    } catch (error: any) {
      showToast(error?.message || 'Failed to cancel session.', 'error');
    } finally {
      setCancellingSessionId(null);
    }
  };

  if (mySessionsQuery.isLoading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color="#14B8A6" />
        <Text style={styles.centerText}>Loading your schedule...</Text>
      </View>
    );
  }

  if (mySessionsQuery.isError) {
    return (
      <View style={styles.centerState}>
        <CircleAlert color="#F87171" size={32} />
        <Text style={styles.centerTitle}>Could not load schedule</Text>
        <Text style={styles.centerText}>
          {mySessionsQuery.error instanceof Error
            ? mySessionsQuery.error.message
            : 'Failed to load booked sessions.'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => mySessionsQuery.refetch()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasAnySessions = scheduleItems.length > 0;
  const sections = [
    {
      key: 'today',
      title: 'Today',
      accent: '#14B8A6',
      empty: 'No sessions booked for today.',
      items: grouped.today,
    },
    {
      key: 'upcoming',
      title: 'Upcoming',
      accent: '#3B82F6',
      empty: 'No upcoming sessions yet.',
      items: grouped.upcoming,
    },
    {
      key: 'past',
      title: 'Past',
      accent: '#8EA3A0',
      empty: 'No past sessions yet.',
      items: grouped.past,
    },
  ];

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#14B8A6"
            colors={['#14B8A6']}
          />
        }
      >
        <LinearGradient
          colors={['#0D7D6D', '#14B8A6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroTopRow}>
            <View style={styles.heroTextWrap}>
              <Text style={styles.heroTitle}>My Schedule</Text>
              <Text style={styles.heroSubtitle}>Your booked training sessions</Text>
            </View>

            <TouchableOpacity
              style={styles.heroIconButton}
              activeOpacity={0.85}
              onPress={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <RefreshCw color="#FFFFFF" size={20} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.upcoming}</Text>
              <Text style={styles.statLabel}>Upcoming</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.today}</Text>
              <Text style={styles.statLabel}>Today</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.past}</Text>
              <Text style={styles.statLabel}>Past</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {!hasAnySessions ? (
            <View style={styles.emptyCard}>
              <CalendarCheck color="#14B8A6" size={34} />
              <Text style={styles.emptyTitle}>No booked sessions</Text>
              <Text style={styles.emptyText}>
                Book an available coach session and it will appear here.
              </Text>
            </View>
          ) : (
            sections.map((section) => (
              <View key={section.key} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View
                    style={[styles.sectionAccent, { backgroundColor: section.accent }]}
                  />
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                </View>

                {section.items.length === 0 ? (
                  <View style={styles.emptySectionRow}>
                    <Text style={styles.emptySectionText}>{section.empty}</Text>
                  </View>
                ) : (
                  <View style={styles.cardsList}>
                    {section.items.map((item) => {
                      const { record, session } = item;
                      const sessionId = getBookedSessionId(record);
                      const sessionIdKey = sessionId != null ? String(sessionId) : '';
                      const coach = getMySessionCoach(record);
                      const coachName = getSessionCoachName(session, coach);
                      const capacity = getSessionCapacity(session);
                      const booked = getSessionBookedCount(session);
                      const canCancel =
                        sessionId != null &&
                        isActiveBooking(record) &&
                        !isPastSession(session);
                      const cancellingThisSession = cancellingSessionId === sessionIdKey;

                      return (
                        <View
                          key={`${section.key}-${item.key}`}
                          style={[
                            styles.sessionCard,
                            section.key === 'today' && styles.sessionCardToday,
                          ]}
                        >
                          <View style={styles.cardTopRow}>
                            <View style={styles.coachAvatar}>
                              <Text style={styles.coachAvatarText}>
                                {getCoachInitials(coachName)}
                              </Text>
                            </View>

                            <View style={styles.sessionInfo}>
                              <View style={styles.sessionTitleRow}>
                                <Text style={styles.coachName} numberOfLines={1}>
                                  {coachName}
                                </Text>
                                <View
                                  style={[
                                    styles.statusBadge,
                                    getStatusBadgeStyle(record, session),
                                  ]}
                                >
                                  <Text style={styles.statusText}>
                                    {section.key === 'past' &&
                                    !isBookingCancelled(record) &&
                                    !isBookingCompleted(record)
                                      ? 'Past'
                                      : getMySessionStatusLabel(record)}
                                  </Text>
                                </View>
                              </View>

                              <Text style={styles.sessionDate}>
                                {formatSessionDateLong(session)}
                              </Text>

                              <View style={styles.metaRow}>
                                <View style={styles.metaPill}>
                                  <Clock color="#93A3B8" size={14} />
                                  <Text style={styles.metaText}>
                                    {formatSessionTimeRange(session)}
                                  </Text>
                                </View>

                                <View style={styles.metaPill}>
                                  <Users color="#93A3B8" size={14} />
                                  <Text style={styles.metaText}>
                                    {capacity > 0 ? `${booked}/${capacity}` : `${booked}`}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          </View>

                          <View style={styles.cardBottomRow}>
                            <View style={styles.datePill}>
                              <CalendarDays color="#14B8A6" size={14} />
                              <Text style={styles.datePillText}>
                                {section.key === 'today'
                                  ? 'Today'
                                  : section.key === 'past'
                                  ? 'Completed/Past'
                                  : 'Booked'}
                              </Text>
                            </View>

                            {canCancel && (
                              <TouchableOpacity
                                style={[
                                  styles.cancelButton,
                                  cancelMutation.isPending && styles.cancelButtonDisabled,
                                ]}
                                activeOpacity={0.85}
                                onPress={() => handleCancel(record)}
                                disabled={cancelMutation.isPending}
                              >
                                {cancellingThisSession ? (
                                  <ActivityIndicator size="small" color="#FCA5A5" />
                                ) : null}
                                <Text style={styles.cancelButtonText}>
                                  {cancellingThisSession ? 'Cancelling...' : 'Cancel'}
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            ))
          )}
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerState: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  centerTitle: {
    marginTop: 12,
    color: '#111827',
    fontSize: 19,
    fontWeight: '800',
  },
  centerText: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 18,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: '#14B8A6',
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 26,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  heroTextWrap: {
    flex: 1,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  heroSubtitle: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.78)',
    fontSize: 14,
  },
  heroIconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    minHeight: 72,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    marginTop: 3,
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 16,
    paddingBottom: 34,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionAccent: {
    width: 4,
    height: 20,
    borderRadius: 4,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '800',
  },
  cardsList: {
    gap: 12,
  },
  emptySectionRow: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
    padding: 14,
  },
  emptySectionText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '700',
  },
  sessionCard: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sessionCardToday: {
    borderColor: '#14B8A6',
    backgroundColor: '#ECFDF5',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  coachAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#0D7D6D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coachAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  sessionInfo: {
    flex: 1,
    minWidth: 0,
  },
  sessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coachName: {
    flex: 1,
    color: '#111827',
    fontSize: 15,
    fontWeight: '800',
  },
  sessionDate: {
    marginTop: 3,
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBooked: {
    backgroundColor: 'rgba(20,184,166,0.13)',
    borderColor: 'rgba(20,184,166,0.45)',
  },
  statusPast: {
    backgroundColor: 'rgba(148,163,184,0.12)',
    borderColor: 'rgba(148,163,184,0.34)',
  },
  statusCancelled: {
    backgroundColor: 'rgba(239,68,68,0.13)',
    borderColor: 'rgba(239,68,68,0.45)',
  },
  statusText: {
    color: '#0D7D6D',
    fontSize: 11,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  metaPill: {
    minHeight: 30,
    borderRadius: 999,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '700',
  },
  cardBottomRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  datePill: {
    minHeight: 32,
    borderRadius: 999,
    backgroundColor: '#E6F4F1',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  datePillText: {
    color: '#0D7D6D',
    fontSize: 12,
    fontWeight: '800',
  },
  cancelButton: {
    minHeight: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.45)',
    backgroundColor: 'rgba(239,68,68,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 14,
  },
  cancelButtonDisabled: {
    opacity: 0.65,
  },
  cancelButtonText: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '900',
  },
  emptyCard: {
    marginTop: 20,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    alignItems: 'center',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyTitle: {
    marginTop: 12,
    color: '#111827',
    fontSize: 18,
    fontWeight: '900',
  },
  emptyText: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
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
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
  },
});
