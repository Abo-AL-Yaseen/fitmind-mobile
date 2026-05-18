import { useMutation, useQueryClient } from '@tanstack/react-query';
import { feedbackKeys } from '../keys';
import {
  updateFeedback,
  type UpdateFeedbackPayload,
} from '../../../services/feedback';

interface UpdateFeedbackVariables {
  id: number;
  payload: UpdateFeedbackPayload;
}

export function useUpdateFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateFeedbackVariables) =>
      updateFeedback(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: feedbackKeys.my(),
      });
      queryClient.invalidateQueries({
        queryKey: feedbackKeys.detail(variables.id),
      });
    },
  });
}
