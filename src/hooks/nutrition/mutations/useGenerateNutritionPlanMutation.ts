import { useMutation, useQueryClient } from '@tanstack/react-query';
import { nutritionKeys } from '../keys';
import { generateNutritionPlan } from '../../../services/nutrition';

export function useGenerateNutritionPlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateNutritionPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: nutritionKeys.latestPlan(),
      });
    },
  });
}