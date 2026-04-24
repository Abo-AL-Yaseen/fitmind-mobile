import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userGoalsKeys } from '../keys';
import {
  upsertCurrentUserGoal,
  type UpdateUserGoalPayload,
} from '../../../services/userGoals';
import { profileKeys } from '../../profile/keys';
import { dashboardKeys } from '../../dashboard/keys';

export function useUpsertCurrentUserGoalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateUserGoalPayload) => upsertCurrentUserGoal(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: userGoalsKeys.current(),
      });

      queryClient.invalidateQueries({
        queryKey: userGoalsKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: profileKeys.me(),
      });

      queryClient.invalidateQueries({
        queryKey: dashboardKeys.summary(),
      });
    },
  });
}