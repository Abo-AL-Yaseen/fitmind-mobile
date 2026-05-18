import { useMutation, useQueryClient } from '@tanstack/react-query';
import { feedbackKeys } from '../keys';
import { deleteFeedback } from '../../../services/feedback';

export function useDeleteFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteFeedback(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: feedbackKeys.my(),
      });
      queryClient.invalidateQueries({
        queryKey: feedbackKeys.detail(id),
      });
    },
  });
}
