import {
  type CoachSession,
  type CoachSessionCoach,
  type MemberSessionRecord,
  type SessionId,
} from '../services/coachSessions';

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const CANCELLED_STATUSES = new Set(['cancelled', 'canceled']);
const COMPLETED_STATUSES = new Set(['completed', 'complete', 'past']);

export function toNumber(value: unknown, fallback = 0) {
  const numberValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
      ? Number(value)
      : Number.NaN;

  return Number.isFinite(numberValue) ? numberValue : fallback;
}

export function normalizeStatus(status: unknown) {
  return String(status ?? '').trim().toLowerCase();
}

function titleize(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getSessionRawDate(session?: CoachSession | null) {
  if (!session) return '';

  const raw =
    session.session_date ??
    (session as { date?: unknown }).date ??
    (session as { scheduled_date?: unknown }).scheduled_date;

  return String(raw ?? '').trim();
}

export function parseSessionDate(session?: CoachSession | null) {
  const raw = getSessionRawDate(session);
  if (!raw) return null;

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatTimeValue(value: unknown) {
  const raw = String(value ?? '').trim();
  if (!raw) return '--:--';

  const [hours = '00', minutes = '00'] = raw.split(':');

  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
}

export function getSessionStartTime(session?: CoachSession | null) {
  if (!session) return '';

  return String(
    session.start_time ?? (session as { startTime?: unknown }).startTime ?? ''
  );
}

export function getSessionEndTime(session?: CoachSession | null) {
  if (!session) return '';

  return String(session.end_time ?? (session as { endTime?: unknown }).endTime ?? '');
}

export function formatSessionTimeRange(session?: CoachSession | null) {
  return `${formatTimeValue(getSessionStartTime(session))} - ${formatTimeValue(
    getSessionEndTime(session)
  )}`;
}

export function getDayLabel(value: unknown) {
  if (value == null || value === '') return 'Date TBD';

  const raw = String(value).trim();
  const numeric = Number(raw);

  if (Number.isFinite(numeric)) {
    if (numeric >= 0 && numeric <= 6) return WEEKDAYS[numeric];
    if (numeric >= 1 && numeric <= 7) return WEEKDAYS[numeric % 7];
  }

  return titleize(raw);
}

export function formatSessionDate(session?: CoachSession | null) {
  const date = parseSessionDate(session);

  if (date) {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  return getDayLabel(session?.day_of_week);
}

export function formatSessionDateLong(session?: CoachSession | null) {
  const date = parseSessionDate(session);

  if (date) {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }

  return getDayLabel(session?.day_of_week);
}

export function getSessionDateKey(session?: CoachSession | null) {
  const raw = getSessionRawDate(session);
  if (raw) return raw.slice(0, 10);

  if (session?.day_of_week != null) {
    return `weekday-${String(session.day_of_week)}`;
  }

  return 'date-tbd';
}

export function getSessionCapacity(session?: CoachSession | null) {
  if (!session) return 0;

  return toNumber(
    session.capacity ??
      (session as { max_capacity?: unknown }).max_capacity ??
      (session as { seats?: unknown }).seats,
    0
  );
}

export function getSessionBookedCount(session?: CoachSession | null) {
  if (!session) return 0;

  return toNumber(
    session.booked_count ??
      (session as { booked?: unknown }).booked ??
      (Array.isArray(session.bookings) ? session.bookings.length : undefined),
    0
  );
}

export function getSpotsLeft(session?: CoachSession | null) {
  const capacity = getSessionCapacity(session);
  const booked = getSessionBookedCount(session);

  if (capacity <= 0) return 0;

  return Math.max(capacity - booked, 0);
}

export function isSessionCancelled(session?: CoachSession | null) {
  return CANCELLED_STATUSES.has(normalizeStatus(session?.status));
}

export function isSessionFull(session?: CoachSession | null) {
  const status = normalizeStatus(session?.status);
  const capacity = getSessionCapacity(session);
  const booked = getSessionBookedCount(session);

  return status === 'full' || (capacity > 0 && booked >= capacity);
}

export function getSessionStatusLabel(session?: CoachSession | null) {
  const status = normalizeStatus(session?.status);

  if (isSessionCancelled(session)) return 'Cancelled';
  if (isSessionFull(session)) return 'Full';
  if (status) return titleize(status);

  return 'Available';
}

export function getSessionCoach(session?: CoachSession | null) {
  return session?.coach ?? null;
}

export function getSessionCoachName(
  session?: CoachSession | null,
  fallbackCoach?: CoachSessionCoach | null
) {
  if (!session && !fallbackCoach) return 'Coach';

  const rawName =
    session?.coach?.name ??
    fallbackCoach?.name ??
    (session as { coach_name?: unknown } | undefined)?.coach_name ??
    (session as { coachName?: unknown } | undefined)?.coachName;

  const name = String(rawName ?? '').trim();
  return name || 'Coach';
}

export function getCoachInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'FM';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

export function getBookingRecord(record?: MemberSessionRecord | null) {
  if (!record) return null;

  const nestedBooking = (record as { booking?: unknown }).booking;

  if (nestedBooking && typeof nestedBooking === 'object') {
    return nestedBooking as MemberSessionRecord;
  }

  return record;
}

export function getSessionFromMySession(record?: MemberSessionRecord | null) {
  if (!record) return null;

  const booking = getBookingRecord(record);

  const nested =
    record.session ??
    record.coach_session ??
    booking?.session ??
    booking?.coach_session ??
    (record as { coachSession?: CoachSession | null }).coachSession ??
    (booking as { coachSession?: CoachSession | null } | null)?.coachSession;

  if (nested) return nested;

  if (record.session_date || record.start_time || record.end_time || record.coach) {
    return record as CoachSession;
  }

  return null;
}

export function getMySessionCoach(record?: MemberSessionRecord | null) {
  if (!record) return null;

  const booking = getBookingRecord(record);
  const session = getSessionFromMySession(record);

  return (
    session?.coach ??
    record.coach ??
    booking?.coach ??
    (booking as { session?: CoachSession | null } | null)?.session?.coach ??
    null
  );
}

export function getBookedSessionId(record?: MemberSessionRecord | null) {
  if (!record) return null;

  const booking = getBookingRecord(record);
  const session = getSessionFromMySession(record);

  return (
    session?.id ??
    booking?.session_id ??
    booking?.coach_session_id ??
    record.session_id ??
    record.coach_session_id ??
    null
  );
}

export function getMySessionStatus(record?: MemberSessionRecord | null) {
  if (!record) return '';

  const booking = getBookingRecord(record);
  const session = getSessionFromMySession(record);

  return String(booking?.status ?? record.status ?? session?.status ?? '').trim();
}

export function getMySessionStatusLabel(record?: MemberSessionRecord | null) {
  const status = normalizeStatus(getMySessionStatus(record));

  if (CANCELLED_STATUSES.has(status)) return 'Cancelled';
  if (COMPLETED_STATUSES.has(status)) return 'Completed';
  if (status) return titleize(status);

  return 'Booked';
}

export function isBookingCancelled(record?: MemberSessionRecord | null) {
  return CANCELLED_STATUSES.has(normalizeStatus(getMySessionStatus(record)));
}

export function isBookingCompleted(record?: MemberSessionRecord | null) {
  return COMPLETED_STATUSES.has(normalizeStatus(getMySessionStatus(record)));
}

export function isActiveBooking(record?: MemberSessionRecord | null) {
  return !isBookingCancelled(record) && !isBookingCompleted(record);
}

function applyTime(date: Date, rawTime: string) {
  const [hours = '0', minutes = '0', seconds = '0'] = rawTime.split(':');
  const copy = new Date(date);
  copy.setHours(Number(hours) || 0, Number(minutes) || 0, Number(seconds) || 0, 0);
  return copy;
}

export function getSessionDateTime(
  session?: CoachSession | null,
  boundary: 'start' | 'end' = 'start'
) {
  const date = parseSessionDate(session);
  if (!date) return null;

  const time =
    boundary === 'end'
      ? getSessionEndTime(session) || getSessionStartTime(session)
      : getSessionStartTime(session);

  return applyTime(date, time || '00:00:00');
}

export function isTodaySession(session?: CoachSession | null) {
  const date = parseSessionDate(session);
  if (!date) return false;

  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export function isPastSession(session?: CoachSession | null) {
  const sessionTime = getSessionDateTime(session, 'end');
  if (!sessionTime) return false;

  return sessionTime.getTime() < Date.now();
}

export function sortSessionsByDateTime<T extends CoachSession>(sessions: T[]) {
  return [...sessions].sort((a, b) => {
    const aDate = getSessionDateTime(a, 'start')?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const bDate = getSessionDateTime(b, 'start')?.getTime() ?? Number.MAX_SAFE_INTEGER;

    if (aDate !== bDate) return aDate - bDate;

    const aTime = formatTimeValue(getSessionStartTime(a));
    const bTime = formatTimeValue(getSessionStartTime(b));

    return aTime.localeCompare(bTime);
  });
}

export function getSessionIdValue(session?: CoachSession | null): SessionId | null {
  return session?.id ?? null;
}
