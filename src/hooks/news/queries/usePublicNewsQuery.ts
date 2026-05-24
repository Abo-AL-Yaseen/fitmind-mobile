import { useQuery } from '@tanstack/react-query';
import { getPublicNews } from '../../../services/news';
import { newsKeys } from '../keys';

interface UsePublicNewsQueryParams {
  page: number;
  perPage?: number;
}

export function usePublicNewsQuery({
  page,
  perPage = 10,
}: UsePublicNewsQueryParams) {
  return useQuery({
    queryKey: newsKeys.publicList(page, perPage),
    queryFn: () => getPublicNews(page, perPage),
    staleTime: 1000 * 60,
  });
}