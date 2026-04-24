import { useMutation, useQueryClient } from '@tanstack/react-query';
import { nutritionKeys } from '../keys';
import {
  modifyNutritionPlan,
  type ModifyNutritionPlanPayload,
} from '../../../services/nutrition';

export function useModifyNutritionPlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ModifyNutritionPlanPayload) =>
      modifyNutritionPlan(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: nutritionKeys.latestPlan(),
      });
    },
  });
}