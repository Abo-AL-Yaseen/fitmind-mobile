import { useMutation, useQueryClient } from '@tanstack/react-query';
import { coachSessionKeys } from '../keys';
import { bookSession, type SessionId } from '../../../services/coachSessions';

export function useBookSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: SessionId) => bookSession(sessionId),
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
