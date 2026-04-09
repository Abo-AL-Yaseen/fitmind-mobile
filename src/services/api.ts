import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = await SecureStore.getItemAsync('fitmind_token');

  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get('content-type') || '';

  let data: any = null;

  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = { message: text || 'Unexpected server response' };
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      data?.errors?.email?.[0] ||
      data?.errors?.password?.[0] ||
      data?.errors?.goal_type?.[0] ||
      data?.errors?.target_weight?.[0] ||
      'Request failed';

    throw new Error(message);
  }

  return data as T;
}

export { API_BASE_URL };