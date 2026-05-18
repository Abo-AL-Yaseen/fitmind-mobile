import { useMutation, useQueryClient } from '@tanstack/react-query';
import { feedbackKeys } from '../keys';
import {
  createFeedback,
  type CreateFeedbackPayload,
} from '../../../services/feedback';

export function useCreateFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateFeedbackPayload) => createFeedback(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: feedbackKeys.my(),
      });
    },
  });
}
