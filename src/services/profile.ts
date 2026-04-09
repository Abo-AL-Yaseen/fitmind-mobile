import * as SecureStore from 'expo-secure-store';
import { apiFetch } from './api';

export interface ProfileApiData {
  id: number;
  user_id: number;
  age: number | null;
  height: number | null;
  weight: number | null;
  gender: string | null;
  activity_level: string | null;
  preferences: string | null;
  food_allergies: string | null;
  medical_conditions: string | null;
}

export interface ProfileResponse {
  success: boolean;
  message?: string;
  data: ProfileApiData;
}

export interface ProfilePayload {
  user_id?: number;
  age: number | null;
  height: number | null;
  weight: number | null;
  gender: string;
  activity_level: string;
  preferences: string;
  food_allergies: string;
  medical_conditions: string;
}

async function getStoredUserId(): Promise<number> {
  const rawUserId = await SecureStore.getItemAsync('fitmind_user_id');

  if (!rawUserId) {
    throw new Error('User ID not found in storage.');
  }

  const userId = Number(rawUserId);

  if (Number.isNaN(userId)) {
    throw new Error('Stored user ID is invalid.');
  }

  return userId;
}

export async function getMyProfile(): Promise<ProfileApiData | null> {
  const userId = await getStoredUserId();

  try {
    const response = await apiFetch<ProfileResponse>(`/profile/user/${userId}`, {
      method: 'GET',
    });

    return response.data;
  } catch (error: any) {
    const message = String(error?.message || '').toLowerCase();

    if (
      message.includes('404') ||
      message.includes('profile not found') ||
      message.includes('not found')
    ) {
      return null;
    }

    throw error;
  }
}

export async function createMyProfile(
  payload: ProfilePayload
): Promise<ProfileApiData> {
  const userId = await getStoredUserId();

  const response = await apiFetch<ProfileResponse>('/profile', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      user_id: userId,
    }),
  });

  return response.data;
}

export async function updateMyProfile(
  payload: ProfilePayload
): Promise<ProfileApiData> {
  const userId = await getStoredUserId();

  const response = await apiFetch<ProfileResponse>(`/profile/user/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  return response.data;
}

export async function saveMyProfile(
  payload: ProfilePayload
): Promise<ProfileApiData> {
  const existingProfile = await getMyProfile();

  if (existingProfile) {
    return updateMyProfile(payload);
  }

  return createMyProfile(payload);
}