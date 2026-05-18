import { useQuery } from '@tanstack/react-query';
import { feedbackKeys } from '../keys';
import { getMyFeedback } from '../../../services/feedback';

export function useMyFeedback() {
  return useQuery({
    queryKey: feedbackKeys.my(),
    queryFn: getMyFeedback,
    staleTime: 1000 * 60,
  });
}
