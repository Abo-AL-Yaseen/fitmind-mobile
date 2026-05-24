import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trainingKeys } from '../keys';
import { generateTrainingPlan } from '../../../services/workout';

export function useGenerateTrainingPlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateTrainingPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trainingKeys.latestPlan(),
      });
    },
  });
}