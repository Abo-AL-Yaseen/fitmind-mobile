import { useMutation, useQueryClient } from '@tanstack/react-query';
import { profileKeys } from '../keys';
import { dashboardKeys } from '../../dashboard/keys';
import { saveMyProfile, type ProfilePayload } from '../../../services/profile';

export function useSaveMyProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProfilePayload) => saveMyProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: profileKeys.me(),
      });

      queryClient.invalidateQueries({
        queryKey: dashboardKeys.summary(),
      });
    },
  });
}