import { apiFetch } from './api';

export interface Coach {
  id: number;
  name: string;
  email?: string | null;
}

type CoachesResponse =
  | Coach[]
  | {
      data?: Coach[] | { data?: Coach[] | null } | null;
      coaches?: Coach[] | null;
      results?: Coach[] | null;
    };

function normalizeCoaches(response: CoachesResponse): Coach[] {
  if (Array.isArray(response)) return response;

  if (response?.data) {
    if (Array.isArray(response.data)) return response.data;
    if (
      typeof response.data === 'object' &&
      Array.isArray((response.data as { data?: unknown }).data)
    ) {
      return (response.data as { data: Coach[] }).data;
    }
  }

  if (Array.isArray(response?.coaches)) return response.coaches;
  if (Array.isArray(response?.results)) return response.results;

  return [];
}

export async function getCoaches(): Promise<Coach[]> {
  const response = await apiFetch<CoachesResponse>('/coaches', {
    method: 'GET',
  });

  return normalizeCoaches(response);
}
