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
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock,
  Dumbbell,
  RefreshCw,
  Users,
} from 'lucide-react-native';

import { useBookSession } from '../hooks/coachSessions/mutations/useBookSession';
import { useAvailableSessions } from '../hooks/coachSessions/queries/useAvailableSessions';
import { useMySessions } from '../hooks/coachSessions/queries/useMySessions';
import { type CoachSession } from '../services/coachSessions';
import {
  formatSessionTimeRange,
  getBookedSessionId,
  getCoachInitials,
  getDayLabel,
  formatTimeValue,
  getSessionBookedCount,
  getSessionCapacity,
  getSessionCalendarKey as getCalendarKeyFromSessionValue,
  getSessionCoachName,
  getSessionIdValue,
  getSessionStartTime,
  getSessionStatusLabel,
  getSpotsLeft,
  isActiveBooking,
  isSessionCancelled,
  isSessionFull,
} from '../utils/coachSessionUtils';
import { useTranslation } from '../i18n';

type ToastState = {
  visible: boolean;
  message: string;
  type: 'success' | 'error';
};

type SessionGroup = {
  key: string;
  title: string;
  sessions: CoachSession[];
};

type CalendarParts = {
  year: number;
  month: number;
  day: number;
};

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function getMobileSessionCalendarKey(session: CoachSession) {
  const sessionDateKey = getCalendarKeyFromSessionValue(session.session_date);
  if (sessionDateKey) return sessionDateKey;

  const dateKey = getCalendarKeyFromSessionValue(
    (session as { date?: unknown }).date
  );
  if (dateKey) return dateKey;

  const scheduledDateKey = getCalendarKeyFromSessionValue(
    (session as { scheduled_date?: unknown }).scheduled_date
  );
  if (scheduledDateKey) return scheduledDateKey;

  if (session.day_of_week != null && session.day_of_week !== '') {
    return `weekday-${String(session.day_of_week)}`;
  }

  return 'date-tbd';
}

function getCalendarParts(key: string): CalendarParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function getWeekdayIndex(parts: CalendarParts) {
  let year = parts.year;
  const offsets = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];

  if (parts.month < 3) year -= 1;

  return (
    year +
    Math.floor(year / 4) -
    Math.floor(year / 100) +
    Math.floor(year / 400) +
    offsets[parts.month - 1] +
    parts.day
  ) % 7;
}

function formatCalendarHeader(key: string, fallbackSession?: CoachSession) {
  const parts = getCalendarParts(key);

  if (!parts) {
    return fallbackSession ? getDayLabel(fallbackSession.day_of_week) : 'Date TBD';
  }

  return `${WEEKDAYS[getWeekdayIndex(parts)]}, ${MONTHS[parts.month - 1]} ${
    parts.day
  }`;
}

function formatCalendarWeekday(key: string) {
  const parts = getCalendarParts(key);
  return parts ? WEEKDAYS_SHORT[getWeekdayIndex(parts)] : '';
}

function getCalendarDay(key: string) {
  return getCalendarParts(key)?.day ?? 0;
}

function getTodayCalendarKey() {
  const today = new Date();

  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(today.getDate()).padStart(2, '0')}`;
}

function isLeapYear(year: number) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function getDaysInMonth(year: number, month: number) {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function addDaysToCalendarKey(key: string, days: number) {
  const parts = getCalendarParts(key);
  if (!parts) return key;

  let year = parts.year;
  let month = parts.month;
  let day = parts.day + days;

  while (day < 1) {
    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
    day += getDaysInMonth(year, month);
  }

  while (day > getDaysInMonth(year, month)) {
    day -= getDaysInMonth(year, month);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return `${year}-${String(month).padStart(
    2,
    '0'
  )}-${String(day).padStart(2, '0')}`;
}

function getStartOfWeekCalendarKey(todayKey: string) {
  const parts = getCalendarParts(todayKey);
  if (!parts) return todayKey;

  return addDaysToCalendarKey(todayKey, -getWeekdayIndex(parts));
}

function sortSessionsForMobile(sessions: CoachSession[]) {
  return [...sessions].sort((a, b) => {
    const dateCompare = getMobileSessionCalendarKey(a).localeCompare(
      getMobileSessionCalendarKey(b)
    );
    if (dateCompare !== 0) return dateCompare;

    const timeCompare = formatTimeValue(getSessionStartTime(a)).localeCompare(
      formatTimeValue(getSessionStartTime(b))
    );
    if (timeCompare !== 0) return timeCompare;

    return String(a.id ?? '').localeCompare(String(b.id ?? ''));
  });
}

function groupSessions(sessions: CoachSession[]) {
  const map = new Map<string, SessionGroup>();

  sortSessionsForMobile(sessions).forEach((session) => {
    const key = getMobileSessionCalendarKey(session);

    if (!map.has(key)) {
      map.set(key, {
        key,
        title: formatCalendarHeader(key, session),
        sessions: [],
      });
    }

    map.get(key)?.sessions.push(session);
  });

  return Array.from(map.values());
}

function getStatusStyle(session: CoachSession) {
  if (isSessionCancelled(session)) return styles.statusCancelled;
  if (isSessionFull(session)) return styles.statusFull;

  return styles.statusAvailable;
}

export default function SessionsScreen() {
  const { t, isRtl } = useTranslation();
  const availableQuery = useAvailableSessions();
  const mySessionsQuery = useMySessions();
  const bookMutation = useBookSession();

  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [bookingSessionId, setBookingSessionId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'success',
  });

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const availableSessions = useMemo(
    () => sortSessionsForMobile(availableQuery.data ?? []),
    [availableQuery.data]
  );

  const activeBookedSessionIds = useMemo(() => {
    const ids = new Set<string>();

    (mySessionsQuery.data ?? []).forEach((record) => {
      const id = getBookedSessionId(record);
      if (id != null && isActiveBooking(record)) ids.add(String(id));
    });

    return ids;
  }, [mySessionsQuery.data]);

  const stats = useMemo(() => {
    const coaches = new Set<string>();

    availableSessions.forEach((session) => {
      const coachKey =
        session.coach?.id ?? session.coach_id ?? getSessionCoachName(session);
      coaches.add(String(coachKey));
    });

    return {
      booked: activeBookedSessionIds.size,
      available: availableSessions.filter(
        (session) => !isSessionCancelled(session) && !isSessionFull(session)
      ).length,
      coaches: coaches.size,
    };
  }, [activeBookedSessionIds, availableSessions]);

  const weekDays = useMemo(() => {
    const todayKey = getTodayCalendarKey();
    const startKey = getStartOfWeekCalendarKey(todayKey);

    return Array.from({ length: 7 }, (_, index) => {
      const key = addDaysToCalendarKey(startKey, index);

      return {
        key,
        weekday: formatCalendarWeekday(key),
        day: getCalendarDay(key),
        isToday: key === todayKey,
        count: availableSessions.filter(
          (session) => getMobileSessionCalendarKey(session) === key
        ).length,
      };
    });
  }, [availableSessions]);

  const visibleSessions = useMemo(() => {
    if (!selectedDateKey) return availableSessions;

    return availableSessions.filter(
      (session) => getMobileSessionCalendarKey(session) === selectedDateKey
    );
  }, [availableSessions, selectedDateKey]);

  const sessionGroups = useMemo(
    () => groupSessions(visibleSessions),
    [visibleSessions]
  );

  const refreshing =
    (availableQuery.isRefetching || mySessionsQuery.isRefetching) &&
    !availableQuery.isLoading &&
    !mySessionsQuery.isLoading;

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);

    setToast({ visible: true, message, type });

    toastTimerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2600);
  }, []);

  const handleRefresh = useCallback(async () => {
    await Promise.all([availableQuery.refetch(), mySessionsQuery.refetch()]);
  }, [availableQuery, mySessionsQuery]);

  const handleBook = async (session: CoachSession) => {
    const sessionId = getSessionIdValue(session);

    if (sessionId == null) {
      showToast(t('sessions.missingId'), 'error');
      return;
    }

    try {
      setBookingSessionId(String(sessionId));
      const response = await bookMutation.mutateAsync(sessionId);
      showToast(response?.message || t('sessions.bookedSuccess'), 'success');
    } catch (error: any) {
      showToast(error?.message || t('sessions.bookFailed'), 'error');
    } finally {
      setBookingSessionId(null);
    }
  };

  if (availableQuery.isLoading || mySessionsQuery.isLoading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color="#14B8A6" />
        <Text style={styles.centerText}>{t('sessions.loading')}</Text>
      </View>
    );
  }

  if (availableQuery.isError) {
    return (
      <View style={styles.centerState}>
        <CircleAlert color="#F87171" size={32} />
        <Text style={styles.centerTitle}>{t('sessions.loadFailedTitle')}</Text>
        <Text style={styles.centerText}>
          {availableQuery.error instanceof Error
            ? availableQuery.error.message
            : t('sessions.loadFailed')}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => availableQuery.refetch()}>
          <Text style={styles.retryButtonText}>{t('common.tryAgain')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
          <View style={[styles.heroTopRow, isRtl && styles.rowReverse]}>
            <View style={styles.heroTextWrap}>
              <Text style={[styles.heroTitle, isRtl && styles.textRight]}>
                {t('sessions.title')}
              </Text>
              <Text style={[styles.heroSubtitle, isRtl && styles.textRight]}>
                {t('sessions.subtitle')}
              </Text>
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
              <Text style={styles.statValue}>{stats.booked}</Text>
              <Text style={styles.statLabel}>{t('sessions.booked')}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.available}</Text>
              <Text style={styles.statLabel}>{t('sessions.available')}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.coaches}</Text>
              <Text style={styles.statLabel}>{t('sessions.coaches')}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.weekCard}>
            <View style={[styles.weekHeader, isRtl && styles.rowReverse]}>
              <View style={[styles.weekTitleRow, isRtl && styles.rowReverse]}>
                <CalendarDays color="#14B8A6" size={18} />
                <Text style={styles.weekTitle}>{t('sessions.thisWeek')}</Text>
              </View>

              <TouchableOpacity
                style={[styles.allDatesButton, !selectedDateKey && styles.allDatesButtonActive]}
                activeOpacity={0.8}
                onPress={() => setSelectedDateKey(null)}
              >
                <Text
                  style={[
                    styles.allDatesButtonText,
                    !selectedDateKey && styles.allDatesButtonTextActive,
                  ]}
                >
                  {t('sessions.all')}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.weekDaysRow}>
              {weekDays.map((day) => {
                const active = selectedDateKey === day.key;

                return (
                  <TouchableOpacity
                    key={day.key}
                    style={[
                      styles.dayButton,
                      day.isToday && styles.dayButtonToday,
                      active && styles.dayButtonActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedDateKey(active ? null : day.key)}
                  >
                    <Text
                      style={[
                        styles.dayWeekday,
                        (day.isToday || active) && styles.dayTextActive,
                      ]}
                    >
                      {day.weekday}
                    </Text>
                    <Text
                      style={[
                        styles.dayNumber,
                        (day.isToday || active) && styles.dayTextActive,
                      ]}
                    >
                      {day.day}
                    </Text>
                    <Text
                      style={[
                        styles.dayCount,
                        (day.isToday || active) && styles.dayTextActive,
                      ]}
                    >
                      {day.count}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {sessionGroups.length === 0 ? (
            <View style={styles.emptyCard}>
              <Dumbbell color="#14B8A6" size={32} />
              <Text style={styles.emptyTitle}>{t('sessions.emptyTitle')}</Text>
              <Text style={styles.emptyText}>
                {t('sessions.emptyText')}
              </Text>
            </View>
          ) : (
            sessionGroups.map((group) => (
              <View key={group.key} style={styles.section}>
                <View style={[styles.sectionHeader, isRtl && styles.rowReverse]}>
                  <View style={styles.sectionAccent} />
                  <Text style={styles.sectionTitle}>{group.title}</Text>
                </View>

                <View style={styles.cardsList}>
                  {group.sessions.map((session) => {
                    const sessionId = getSessionIdValue(session);
                    const sessionIdKey = sessionId != null ? String(sessionId) : '';
                    const coachName = getSessionCoachName(session);
                    const capacity = getSessionCapacity(session);
                    const booked = getSessionBookedCount(session);
                    const spotsLeft = getSpotsLeft(session);
                    const alreadyBooked =
                      sessionId != null && activeBookedSessionIds.has(String(sessionId));
                    const full = isSessionFull(session);
                    const cancelled = isSessionCancelled(session);
                    const disabled =
                      alreadyBooked ||
                      full ||
                      cancelled ||
                      bookMutation.isPending ||
                      sessionId == null;
                    const bookingThisSession = bookingSessionId === sessionIdKey;

                    const buttonLabel = bookingThisSession
                      ? t('sessions.booking')
                      : alreadyBooked
                      ? t('sessions.booked')
                      : cancelled
                      ? t('sessions.cancelled')
                      : full
                      ? t('sessions.full')
                      : t('sessions.book');

                    return (
                      <View
                        key={sessionIdKey || `${group.key}-${coachName}-${booked}`}
                        style={[
                          styles.sessionCard,
                          alreadyBooked && styles.sessionCardBooked,
                        ]}
                      >
                          <View style={[styles.sessionTopRow, isRtl && styles.rowReverse]}>
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
                              <View style={[styles.statusBadge, getStatusStyle(session)]}>
                                <Text style={styles.statusText}>
                                  {alreadyBooked
                                    ? 'Booked'
                                    : getSessionStatusLabel(session)}
                                </Text>
                              </View>
                            </View>

                            <Text style={[styles.coachRole, isRtl && styles.textRight]}>
                              {t('sessions.fitnessCoach')}
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

                        <View style={[styles.sessionBottomRow, isRtl && styles.rowReverse]}>
                          <Text
                            style={[
                              styles.spotsText,
                              full && styles.spotsTextWarning,
                              cancelled && styles.spotsTextMuted,
                            ]}
                          >
                            {capacity > 0
                              ? t('sessions.spotsLeft', { count: spotsLeft })
                              : t('sessions.capacityTba')}
                          </Text>

                          <TouchableOpacity
                            style={[
                              styles.bookButton,
                              disabled && styles.bookButtonDisabled,
                              alreadyBooked && styles.bookButtonBooked,
                            ]}
                            activeOpacity={0.85}
                            onPress={() => handleBook(session)}
                            disabled={disabled}
                          >
                            {bookingThisSession ? (
                              <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : alreadyBooked ? (
                              <CheckCircle2 color="#FFFFFF" size={16} />
                            ) : null}
                            <Text style={styles.bookButtonText}>{buttonLabel}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
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
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
  },
  centerText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: '#6B7280',
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
  weekCard: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  weekTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weekTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
  },
  allDatesButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  allDatesButtonActive: {
    backgroundColor: '#14B8A6',
    borderColor: '#14B8A6',
  },
  allDatesButtonText: {
    color: '#0D7D6D',
    fontSize: 12,
    fontWeight: '800',
  },
  allDatesButtonTextActive: {
    color: '#FFFFFF',
  },
  weekDaysRow: {
    flexDirection: 'row',
    gap: 7,
  },
  dayButton: {
    flex: 1,
    minHeight: 74,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
  },
  dayButtonToday: {
    backgroundColor: '#E6F4F1',
    borderColor: '#A7F3D0',
  },
  dayButtonActive: {
    backgroundColor: '#14B8A6',
    borderColor: '#14B8A6',
  },
  dayWeekday: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '700',
  },
  dayNumber: {
    marginTop: 3,
    color: '#111827',
    fontSize: 15,
    fontWeight: '900',
  },
  dayCount: {
    marginTop: 3,
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '800',
  },
  dayTextActive: {
    color: '#FFFFFF',
  },
  section: {
    marginTop: 20,
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
    backgroundColor: '#14B8A6',
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '800',
  },
  cardsList: {
    gap: 12,
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
  sessionCardBooked: {
    borderColor: '#14B8A6',
    backgroundColor: '#ECFDF5',
  },
  sessionTopRow: {
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
  coachRole: {
    marginTop: 3,
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusAvailable: {
    backgroundColor: 'rgba(20,184,166,0.13)',
    borderColor: 'rgba(20,184,166,0.45)',
  },
  statusFull: {
    backgroundColor: 'rgba(245,158,11,0.13)',
    borderColor: 'rgba(245,158,11,0.45)',
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
  sessionBottomRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  spotsText: {
    flex: 1,
    color: '#0D7D6D',
    fontSize: 13,
    fontWeight: '800',
  },
  spotsTextWarning: {
    color: '#FBBF24',
  },
  spotsTextMuted: {
    color: '#6B7280',
  },
  bookButton: {
    minWidth: 94,
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: '#14B8A6',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 14,
  },
  bookButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.75,
  },
  bookButtonBooked: {
    backgroundColor: '#0D7D6D',
    opacity: 1,
  },
  bookButtonText: {
    color: '#FFFFFF',
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
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  textRight: {
    textAlign: 'right',
  },
});
