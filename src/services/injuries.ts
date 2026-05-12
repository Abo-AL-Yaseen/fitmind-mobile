import { apiFetch } from './api';
import { getUserId } from './auth';

export type InjurySeverity = 'mild' | 'moderate' | 'severe';
export type InjuryStatus = 'active' | 'recovered';

export interface UserInjury {
  id: number;
  user_id: number | string;
  injury_type: string;
  severity: InjurySeverity | string;
  status: InjuryStatus | string;
  notes?: string | null;
  created_at?: string;
}

export interface UserInjuryPayload {
  injury_type: string;
  severity: InjurySeverity;
  status: InjuryStatus;
  notes: string | null;
}

export interface InjuryAiModification {
  created: boolean;
  modification_request_id: number | null;
  warning: string | null;
}

interface InjuriesListResponse {
  success: boolean;
  data: UserInjury[];
}

interface InjuryResponse {
  success: boolean;
  message?: string;
  data: UserInjury;
}

export interface CreateInjuryResponse extends InjuryResponse {
  ai_modification?: InjuryAiModification;
}

interface DeleteInjuryResponse {
  success: boolean;
  message?: string;
}

async function getStoredUserId(): Promise<number> {
  const rawUserId = await getUserId();

  if (!rawUserId) {
    throw new Error('User ID not found in storage.');
  }

  const userId = Number(rawUserId);

  if (Number.isNaN(userId)) {
    throw new Error('Stored user ID is invalid.');
  }

  return userId;
}

export async function getMyInjuries(): Promise<UserInjury[]> {
  const userId = await getStoredUserId();

  const response = await apiFetch<InjuriesListResponse>('/userInjuries', {
    method: 'GET',
  });

  return response.data.filter(
    (injury) => Number(injury.user_id) === Number(userId)
  );
}

export async function createMyInjury(
  payload: UserInjuryPayload
): Promise<CreateInjuryResponse> {
  const userId = await getStoredUserId();

  return apiFetch<CreateInjuryResponse>('/userInjuries', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      injury_type: payload.injury_type,
      severity: payload.severity,
      notes: payload.notes,
      status: 'active',
    }),
  });
}

export async function updateMyInjury(
  injuryId: number | string,
  payload: UserInjuryPayload
): Promise<UserInjury> {
  const userId = await getStoredUserId();

  const response = await apiFetch<InjuryResponse>(`/userInjuries/${injuryId}`, {
    method: 'PUT',
    body: JSON.stringify({
      user_id: userId,
      injury_type: payload.injury_type,
      severity: payload.severity,
      notes: payload.notes,
      status: payload.status,
    }),
  });

  return response.data;
}

export async function deleteMyInjury(injuryId: number | string): Promise<void> {
  await apiFetch<DeleteInjuryResponse>(`/userInjuries/${injuryId}`, {
    method: 'DELETE',
  });
}
