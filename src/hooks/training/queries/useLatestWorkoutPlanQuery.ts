import { useQuery } from '@tanstack/react-query';
import { trainingKeys } from '../keys';
import { getLatestAcceptedWorkoutPlan } from '../../../services/workout';

export function useLatestWorkoutPlanQuery() {
  return useQuery({
    queryKey: trainingKeys.latestPlan(),
    queryFn: getLatestAcceptedWorkoutPlan,
    staleTime: 1000 * 60,
  });
}