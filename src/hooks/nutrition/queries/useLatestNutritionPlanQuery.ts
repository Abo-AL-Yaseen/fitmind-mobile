import { useQuery } from '@tanstack/react-query';
import { nutritionKeys } from '../keys';
import { getLatestAcceptedNutritionPlan } from '../../../services/nutrition';

export function useLatestNutritionPlanQuery() {
  return useQuery({
    queryKey: nutritionKeys.latestPlan(),
    queryFn: getLatestAcceptedNutritionPlan,
    staleTime: 1000 * 60,
  });
}