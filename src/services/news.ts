import { apiFetch } from './api';

export interface PublicNewsItem {
  id: number;
  title: string;
  content: string;
  status: string;
  author_name: string | null;
  formatted_date: string | null;
  published_at: string | null;
  expires_at: string | null;
  is_expired: boolean;
  remaining_days: number | null;
}

export interface PublicNewsPagination {
  current_page: number;
  data: PublicNewsItem[];
  first_page_url: string;
  from: number | null;
  last_page: number;
  last_page_url: string;
  links: Array<{
    url: string | null;
    label: string;
    page: number | null;
    active: boolean;
  }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

export interface PublicNewsResponse {
  status: string;
  data: PublicNewsPagination;
}

export async function getPublicNews(
  page = 1,
  perPage = 10
): Promise<PublicNewsResponse> {
  return apiFetch<PublicNewsResponse>(
    `/news/public?page=${page}&per_page=${perPage}`,
    {
      method: 'GET',
    }
  );
}