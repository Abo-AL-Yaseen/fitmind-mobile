import { useQuery } from '@tanstack/react-query';
import { feedbackKeys } from '../keys';
import { getFeedbackById } from '../../../services/feedback';

export function useFeedbackDetails(id: number | string | null) {
  return useQuery({
    queryKey: feedbackKeys.detail(id ?? 'none'),
    queryFn: () => getFeedbackById(Number(id)),
    enabled: id != null,
    staleTime: 1000 * 60,
  });
}
