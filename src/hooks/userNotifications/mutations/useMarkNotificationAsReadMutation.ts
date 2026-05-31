import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markNotificationAsRead } from '../../../services/userNotifications';
import { userNotificationsKeys } from '../keys';

export function useMarkNotificationAsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: userNotificationsKeys.all,
      });
    },
  });
}
