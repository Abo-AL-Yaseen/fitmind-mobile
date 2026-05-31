import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markAllNotificationsAsRead } from '../../../services/userNotifications';
import { userNotificationsKeys } from '../keys';

export function useMarkAllNotificationsAsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: userNotificationsKeys.all,
      });
    },
  });
}
