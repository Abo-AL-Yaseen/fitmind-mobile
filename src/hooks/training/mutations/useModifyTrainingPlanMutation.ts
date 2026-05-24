import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trainingKeys } from '../keys';
import {
  modifyTrainingPlan,
  type ModifyTrainingPlanPayload,
} from '../../../services/workout';

type ModifyTrainingPlanMutationPayload = Omit<ModifyTrainingPlanPayload, 'id'>;

export function useModifyTrainingPlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ModifyTrainingPlanMutationPayload) =>
      modifyTrainingPlan(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trainingKeys.latestPlan(),
      });
    },
  });
}