import { apiFetch } from './api';

export type SessionId = number | string;

export interface CoachSessionCoach {
  id?: SessionId;
  name?: string | null;
  email?: string | null;
  [key: string]: unknown;
}

export interface CoachSessionBooking {
  id?: SessionId;
  user_id?: SessionId;
  session_id?: SessionId;
  coach_session_id?: SessionId;
  status?: string | null;
  [key: string]: unknown;
}

export interface CoachSession {
  id?: SessionId;
  coach_id?: SessionId;
  day_of_week?: number | string | null;
  session_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  capacity?: number | string | null;
  booked_count?: number | string | null;
  status?: string | null;
  is_recurring?: boolean | number | string | null;
  coach?: CoachSessionCoach | null;
  bookings?: CoachSessionBooking[] | null;
  [key: string]: unknown;
}

export interface MemberSessionRecord extends CoachSessionBooking {
  booking?: CoachSessionBooking & {
    session?: CoachSession | null;
    coach_session?: CoachSession | null;
    coach?: CoachSessionCoach | null;
  };
  session?: CoachSession | null;
  coach_session?: CoachSession | null;
  coach?: CoachSessionCoach | null;
}

export interface CoachSessionMutationResponse {
  message?: string;
  success?: boolean;
  data?: unknown;
}

type ListApiResponse<T> =
  | T[]
  | T
  | {
      data?: T[] | T | { data?: T[] | T | null } | null;
      sessions?: T[] | T | null;
      bookings?: T[] | T | null;
      my_sessions?: T[] | T | null;
      results?: T[] | T | null;
    };

function normalizeMaybeList<T>(value: unknown): T[] | null {
  if (!value) return null;
  if (Array.isArray(value)) return value as T[];

  if (typeof value === 'object' && value !== null && 'data' in value) {
    return normalizeMaybeList<T>((value as { data?: unknown }).data);
  }

  return [value as T];
}

function normalizeListResponse<T>(
  response: ListApiResponse<T>,
  keys: Array<'sessions' | 'bookings' | 'my_sessions' | 'results'> = []
): T[] {
  if (Array.isArray(response)) return response;

  if (response && typeof response === 'object') {
    const objectResponse = response as {
      data?: unknown;
      sessions?: unknown;
      bookings?: unknown;
      my_sessions?: unknown;
      results?: unknown;
    };

    if (objectResponse.data) {
      if (
        typeof objectResponse.data === 'object' &&
        !Array.isArray(objectResponse.data)
      ) {
        const dataObject = objectResponse.data as Record<string, unknown>;
        const nestedKeys = ['data', ...keys] as const;

        for (const key of nestedKeys) {
          const list = normalizeMaybeList<T>(dataObject[key]);
          if (list) return list;
        }
      }

      const data = normalizeMaybeList<T>(objectResponse.data);
      if (data) return data;
    }

    for (const key of keys) {
      const list = normalizeMaybeList<T>(objectResponse[key]);
      if (list) return list;
    }

    const wrapperKeys = ['data', ...keys] as const;
    if (wrapperKeys.some((key) => key in objectResponse)) {
      return [];
    }

    return [response as T];
  }

  return [];
}

export async function getAvailableSessions(): Promise<CoachSession[]> {
  const response = await apiFetch<ListApiResponse<CoachSession>>('/sessions', {
    method: 'GET',
  });

  return normalizeListResponse(response, ['sessions', 'results']);
}

export async function getMySessions(): Promise<MemberSessionRecord[]> {
  const response = await apiFetch<ListApiResponse<MemberSessionRecord>>(
    '/my-sessions',
    {
      method: 'GET',
    }
  );

  return normalizeListResponse(response, [
    'bookings',
    'my_sessions',
    'sessions',
    'results',
  ]);
}

export async function bookSession(
  sessionId: SessionId
): Promise<CoachSessionMutationResponse> {
  return apiFetch<CoachSessionMutationResponse>(`/sessions/${sessionId}/book`, {
    method: 'POST',
  });
}

export async function cancelMySession(
  sessionId: SessionId
): Promise<CoachSessionMutationResponse> {
  return apiFetch<CoachSessionMutationResponse>(`/sessions/${sessionId}/cancel`, {
    method: 'DELETE',
  });
}
