import { apiFetch } from './api';

export async function savePushToken(token: string) {
  return apiFetch('/save-token', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}
