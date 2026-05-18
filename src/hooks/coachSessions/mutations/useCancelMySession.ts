import { useMutation, useQueryClient } from '@tanstack/react-query';
import { coachSessionKeys } from '../keys';
import {
  cancelMySession,
  type SessionId,
} from '../../../services/coachSessions';

export function useCancelMySession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: SessionId) => cancelMySession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: coachSessionKeys.available(),
      });
      queryClient.invalidateQueries({
        queryKey: coachSessionKeys.my(),
      });
    },
  });
}
