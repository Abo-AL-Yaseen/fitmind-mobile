import { useQuery } from '@tanstack/react-query';
import { coachSessionKeys } from '../keys';
import { getMySessions } from '../../../services/coachSessions';

export function useMySessions() {
  return useQuery({
    queryKey: coachSessionKeys.my(),
    queryFn: getMySessions,
    staleTime: 1000 * 60,
  });
}
