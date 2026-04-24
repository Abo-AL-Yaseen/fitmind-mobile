import { useQuery } from '@tanstack/react-query';
import { userGoalsKeys } from '../keys';
import { getCurrentUserGoal } from '../../../services/userGoals';

export function useCurrentUserGoalQuery() {
  return useQuery({
    queryKey: userGoalsKeys.current(),
    queryFn: getCurrentUserGoal,
    staleTime: 1000 * 60,
  });
}