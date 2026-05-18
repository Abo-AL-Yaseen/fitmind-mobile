import { useQuery } from '@tanstack/react-query';
import { coachSessionKeys } from '../keys';
import { getAvailableSessions } from '../../../services/coachSessions';

export function useAvailableSessions() {
  return useQuery({
    queryKey: coachSessionKeys.available(),
    queryFn: getAvailableSessions,
    staleTime: 1000 * 60,
  });
}
