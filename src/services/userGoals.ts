import * as SecureStore from 'expo-secure-store';
import { apiFetch } from './api';

export type GoalType =
  | 'weight_loss'
  | 'muscle_gain'
  | 'maintenance'
  | 'general_fitness';

export interface UserGoal {
  id: number;
  user_id: number | string;
  goal_type: GoalType | string;
  target_weight: number | string;
  user?: {
    id: number;
    name: string;
    email: string;
    status?: string;
    number_day?: number;
  };
}

export interface CreateUserGoalPayload {
  user_id: number | string;
  goal_type: string;
  target_weight: number;
}

export interface UpdateUserGoalPayload {
  goal_type: string;
  target_weight: number;
}

interface UserGoalsListResponse {
  data: UserGoal[];
}

async function getStoredUserId(): Promise<number | null> {
  const raw = await SecureStore.getItemAsync('fitmind_user_id');
  if (!raw) return null;

  const parsed = Number(raw);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function getUserGoals(): Promise<UserGoal[]> {
  const response = await apiFetch<UserGoal[] | UserGoalsListResponse>('/user-goals', {
    method: 'GET',
  });

  if (Array.isArray(response)) return response;
  if ('data' in response && Array.isArray(response.data)) return response.data;

  return [];
}

export async function getUserGoalById(userGoalId: number | string): Promise<UserGoal> {
  return apiFetch<UserGoal>(`/user-goals/${userGoalId}`, {
    method: 'GET',
  });
}

export async function createUserGoal(payload: CreateUserGoalPayload): Promise<UserGoal> {
  return apiFetch<UserGoal>('/user-goals', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateUserGoal(
  userGoalId: number | string,
  payload: UpdateUserGoalPayload
): Promise<UserGoal> {
  return apiFetch<UserGoal>(`/user-goals/${userGoalId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteUserGoal(userGoalId: number | string) {
  return apiFetch(`/user-goals/${userGoalId}`, {
    method: 'DELETE',
  });
}

export async function getCurrentUserGoal(): Promise<UserGoal | null> {
  const currentUserId = await getStoredUserId();
  if (!currentUserId) return null;

  const goals = await getUserGoals();

  const matchedGoal = goals.find(
    (goal) => Number(goal.user_id) === Number(currentUserId)
  );

  return matchedGoal ?? null;
}

export async function upsertCurrentUserGoal(
  payload: UpdateUserGoalPayload
): Promise<UserGoal> {
  const currentUserId = await getStoredUserId();

  if (!currentUserId) {
    throw new Error('User ID not found in SecureStore.');
  }

  const currentGoal = await getCurrentUserGoal();

  if (currentGoal?.id) {
    return updateUserGoal(currentGoal.id, payload);
  }

  return createUserGoal({
    user_id: currentUserId,
    goal_type: payload.goal_type,
    target_weight: payload.target_weight,
  });
}