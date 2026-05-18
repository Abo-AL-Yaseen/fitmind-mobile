import { useQuery } from '@tanstack/react-query';
import { coachesKeys } from '../keys';
import { getCoaches } from '../../../services/coaches';

export function useCoaches() {
  return useQuery({
    queryKey: coachesKeys.list(),
    queryFn: getCoaches,
    staleTime: 1000 * 60 * 5,
  });
}
