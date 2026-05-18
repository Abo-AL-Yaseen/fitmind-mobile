import { apiFetch } from './api';

export type FeedbackType = 'equipment' | 'suggestion' | 'rating';
export type FeedbackPriority = 'low' | 'medium' | 'high';
export type FeedbackStatus = 'pending' | 'reviewed' | 'resolved' | string;

export interface FeedbackDetails {
  equipment_name?: string | null;
  priority?: FeedbackPriority | string | null;
  status?: FeedbackStatus | null;
  trainer_id?: number | string | null;
  trainer_name?: string | null;
  rating?: number | string | null;
  [key: string]: unknown;
}

export interface FeedbackItem {
  id: number;
  user_id?: number | string;
  user_name?: string | null;
  type: FeedbackType;
  content: string;
  created_at?: string | null;
  details?: FeedbackDetails | null;
}

export interface CreateFeedbackPayload {
  type: FeedbackType;
  content: string;
  equipment_name?: string;
  priority?: FeedbackPriority;
  status?: FeedbackStatus;
  trainer_id?: number;
  rating?: number;
}

export interface UpdateFeedbackPayload {
  content: string;
  equipment_name?: string;
  priority?: FeedbackPriority;
  status?: FeedbackStatus;
  trainer_id?: number;
  rating?: number;
}

type FeedbackListResponse =
  | FeedbackItem[]
  | {
      data?: FeedbackItem[] | { data?: FeedbackItem[] | null } | null;
      feedback?: FeedbackItem[] | null;
      results?: FeedbackItem[] | null;
    };

type FeedbackItemResponse =
  | FeedbackItem
  | {
      data?: FeedbackItem | null;
      feedback?: FeedbackItem | null;
    };

function normalizeList(response: FeedbackListResponse): FeedbackItem[] {
  if (Array.isArray(response)) return response;

  if (response?.data) {
    if (Array.isArray(response.data)) return response.data;
    if (
      typeof response.data === 'object' &&
      Array.isArray((response.data as { data?: unknown }).data)
    ) {
      return (response.data as { data: FeedbackItem[] }).data;
    }
  }

  if (Array.isArray(response?.feedback)) return response.feedback;
  if (Array.isArray(response?.results)) return response.results;

  return [];
}

function normalizeItem(response: FeedbackItemResponse): FeedbackItem {
  if ('id' in response) return response;

  const item = response.data ?? response.feedback;

  if (!item) {
    throw new Error('Feedback item was not found in the server response.');
  }

  return item;
}

export async function getMyFeedback(): Promise<FeedbackItem[]> {
  const response = await apiFetch<FeedbackListResponse>('/my-feedback', {
    method: 'GET',
  });

  return normalizeList(response);
}

export async function getFeedbackById(id: number): Promise<FeedbackItem> {
  const response = await apiFetch<FeedbackItemResponse>(`/feedback/${id}`, {
    method: 'GET',
  });

  return normalizeItem(response);
}

export async function createFeedback(
  payload: CreateFeedbackPayload
): Promise<FeedbackItem> {
  const response = await apiFetch<FeedbackItemResponse>('/feedback', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return normalizeItem(response);
}

export async function updateFeedback(
  id: number,
  payload: UpdateFeedbackPayload
): Promise<FeedbackItem> {
  const response = await apiFetch<FeedbackItemResponse>(`/feedback/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  return normalizeItem(response);
}

export async function deleteFeedback(id: number): Promise<void> {
  await apiFetch<unknown>(`/feedback/${id}`, {
    method: 'DELETE',
  });
}
