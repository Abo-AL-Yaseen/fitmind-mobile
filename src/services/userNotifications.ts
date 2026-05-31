import { apiFetch } from './api';

export type NotificationData = Record<string, unknown>;

export interface UserNotification {
  id: string;
  title: string;
  body: string;
  type?: string;
  screen?: string;
  entity_id?: string;
  news_id?: string;
  read_at: string | null;
  created_at: string | null;
  data: NotificationData;
}

export interface ApiMessageResponse {
  message?: string;
  success?: boolean;
}

function toRecord(value: unknown): Record<string, any> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, any>;
  }

  return {};
}

function toStringOrUndefined(value: unknown): string | undefined {
  if (typeof value === 'string' || typeof value === 'number') {
    const normalized = String(value).trim();
    return normalized || undefined;
  }

  return undefined;
}

function extractNotifications(response: any): any[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data?.notifications)) return response.data.notifications;
  if (Array.isArray(response?.notifications?.data)) return response.notifications.data;
  if (Array.isArray(response?.notifications)) return response.notifications;
  if (Array.isArray(response?.data)) return response.data;

  return [];
}

function normalizeNotification(raw: any): UserNotification {
  const data = toRecord(raw?.data);
  const id = String(raw?.id ?? data.id ?? '');

  return {
    id,
    title:
      toStringOrUndefined(raw?.title) ??
      toStringOrUndefined(data.title) ??
      'Notification',
    body:
      toStringOrUndefined(raw?.body) ??
      toStringOrUndefined(raw?.message) ??
      toStringOrUndefined(data.body) ??
      toStringOrUndefined(data.message) ??
      '',
    type: toStringOrUndefined(raw?.type) ?? toStringOrUndefined(data.type),
    screen: toStringOrUndefined(raw?.screen) ?? toStringOrUndefined(data.screen),
    entity_id:
      toStringOrUndefined(raw?.entity_id) ?? toStringOrUndefined(data.entity_id),
    news_id: toStringOrUndefined(raw?.news_id) ?? toStringOrUndefined(data.news_id),
    read_at: raw?.read_at ?? raw?.readAt ?? null,
    created_at: raw?.created_at ?? raw?.createdAt ?? data.created_at ?? null,
    data,
  };
}

export async function getNotifications(): Promise<UserNotification[]> {
  const response = await apiFetch<any>('/notifications', {
    method: 'GET',
  });

  return extractNotifications(response)
    .map(normalizeNotification)
    .filter((notification) => notification.id);
}

export async function getUnreadNotificationCount(): Promise<number> {
  const response = await apiFetch<any>('/notifications/unread-count', {
    method: 'GET',
  });

  const count =
    response?.unread_count ??
    response?.unreadCount ??
    response?.count ??
    response?.data?.unread_count ??
    response?.data?.unreadCount ??
    response?.data?.count ??
    response?.data;

  const parsed = Number(count);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function markNotificationAsRead(
  id: string | number
): Promise<ApiMessageResponse> {
  return apiFetch<ApiMessageResponse>(`/notifications/${id}/read`, {
    method: 'POST',
  });
}

export async function markAllNotificationsAsRead(): Promise<ApiMessageResponse> {
  return apiFetch<ApiMessageResponse>('/notifications/read-all', {
    method: 'POST',
  });
}
